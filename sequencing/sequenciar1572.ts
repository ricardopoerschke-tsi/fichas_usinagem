import type { Peca } from "@/types/peca";
import {
  normalizarTexto,
  prazoInternoTimestamp,
  prioridadeProcessoAdicional,
  prioridadeUrgenciaProdutiva,
  temProcessoAdicional,
} from "./regrasFluxoProdutivo";

type Peca1572 = Peca & {
  ferramentaSequenciamento: number;
};

const LIMITE_PECAS_PARA_SUBIR_FERRAMENTA = 2;
const DIAS_ANTECIPACAO_1572 = 20;

function extrairNumeros(dimensoes?: string) {
  return (
    dimensoes
      ?.replace(/,/g, ".")
      .match(/\d+(\.\d+)?/g)
      ?.map(Number) ?? []
  );
}

function getMedidas(peca: Peca) {
  const numeros = extrairNumeros(peca.dimensoes);

  const comprimento = numeros[0] ?? 0;
  const largura = numeros[1] ?? 0;
  const espessura = numeros[2] ?? 0;

  return {
    comprimento,
    largura,
    espessura,
    maiorLarguraEspessura: Math.max(largura, espessura),
  };
}

function getPrazoInternoTimestamp(peca: Peca) {
  return prazoInternoTimestamp(peca.prazo, DIAS_ANTECIPACAO_1572);
}

function isInox304(peca: Peca) {
  const material = normalizarTexto(peca.material);
  return material.includes("inox") && material.includes("304");
}

function getGrupoComprimento(peca: Peca) {
  const { comprimento } = getMedidas(peca);
  return comprimento > 225 ? 1 : 0;
}

function getFerramentaMinima(peca: Peca) {
  const { maiorLarguraEspessura } = getMedidas(peca);

  if (maiorLarguraEspessura <= 58) return 63;
  if (maiorLarguraEspessura <= 95) return 100;
  if (maiorLarguraEspessura <= 120) return 125;

  return 999; // Ø125 + deslocamento no eixo Y
}

function getQuantidade(peca: Peca) {
  const quantidade = Number(String(peca.quantidade ?? "").replace(",", "."));
  return Number.isFinite(quantidade) ? quantidade : 0;
}

function getChaveGrupo(peca: Peca) {
  return [
    prioridadeUrgenciaProdutiva(peca, DIAS_ANTECIPACAO_1572),
    temProcessoAdicional(peca) ? "processo-adicional" : "normal",
    getPrazoInternoTimestamp(peca),
    getGrupoComprimento(peca),
  ].join("|");
}

function ajustarFerramentaPorQuantidade(pecas: Peca[]): Peca1572[] {
  const totaisPorGrupo = new Map<string, Map<number, number>>();

  for (const peca of pecas) {
    const chaveGrupo = getChaveGrupo(peca);
    const ferramenta = getFerramentaMinima(peca);
    const quantidade = getQuantidade(peca);

    if (!totaisPorGrupo.has(chaveGrupo)) {
      totaisPorGrupo.set(chaveGrupo, new Map());
    }

    const totaisFerramenta = totaisPorGrupo.get(chaveGrupo)!;

    totaisFerramenta.set(
      ferramenta,
      (totaisFerramenta.get(ferramenta) ?? 0) + quantidade
    );
  }

  return pecas.map((peca) => {
    const chaveGrupo = getChaveGrupo(peca);
    const ferramentaMinima = getFerramentaMinima(peca);
    const quantidadeTotalFerramenta =
      totaisPorGrupo.get(chaveGrupo)?.get(ferramentaMinima) ?? 0;

    let ferramentaSequenciamento = ferramentaMinima;

    if (
      ferramentaMinima === 63 &&
      quantidadeTotalFerramenta <= LIMITE_PECAS_PARA_SUBIR_FERRAMENTA
    ) {
      const qtd100 = totaisPorGrupo.get(chaveGrupo)?.get(100) ?? 0;
      const qtd125 = totaisPorGrupo.get(chaveGrupo)?.get(125) ?? 0;

      if (qtd100 > LIMITE_PECAS_PARA_SUBIR_FERRAMENTA) {
        ferramentaSequenciamento = 100;
      } else if (qtd125 > LIMITE_PECAS_PARA_SUBIR_FERRAMENTA) {
        ferramentaSequenciamento = 125;
      }
    }

    if (
      ferramentaMinima === 100 &&
      quantidadeTotalFerramenta <= LIMITE_PECAS_PARA_SUBIR_FERRAMENTA
    ) {
      const qtd125 = totaisPorGrupo.get(chaveGrupo)?.get(125) ?? 0;

      if (qtd125 > LIMITE_PECAS_PARA_SUBIR_FERRAMENTA) {
        ferramentaSequenciamento = 125;
      }
    }

    return {
      ...peca,
      ferramentaSequenciamento,
    };
  });
}

function getFaixaMedida(valor: number, intervalo = 10) {
  if (!valor) return 9999;
  return Math.floor(valor / intervalo) * intervalo;
}

function compararTexto(a?: string, b?: string) {
  return (a ?? "").localeCompare(b ?? "");
}

export function sequenciar1572(pecas: Peca[]) {
  const pecasComFerramenta = ajustarFerramentaPorQuantidade(pecas);

  return [...pecasComFerramenta].sort((a, b) => {
    const urgenciaA = prioridadeUrgenciaProdutiva(a, DIAS_ANTECIPACAO_1572);
    const urgenciaB = prioridadeUrgenciaProdutiva(b, DIAS_ANTECIPACAO_1572);

    if (urgenciaA !== urgenciaB) return urgenciaA - urgenciaB;

    const processoA = prioridadeProcessoAdicional(a);
    const processoB = prioridadeProcessoAdicional(b);

    if (processoA !== processoB) return processoA - processoB;

    const prazoA = getPrazoInternoTimestamp(a);
    const prazoB = getPrazoInternoTimestamp(b);

    if (prazoA !== prazoB) return prazoA - prazoB;

    if (a.ferramentaSequenciamento !== b.ferramentaSequenciamento) {
      return a.ferramentaSequenciamento - b.ferramentaSequenciamento;
    }

    const grupoComprimentoA = getGrupoComprimento(a);
    const grupoComprimentoB = getGrupoComprimento(b);

    if (grupoComprimentoA !== grupoComprimentoB) {
      return grupoComprimentoA - grupoComprimentoB;
    }

    const medidasA = getMedidas(a);
    const medidasB = getMedidas(b);

    const faixaLarguraA = getFaixaMedida(medidasA.largura, 10);
    const faixaLarguraB = getFaixaMedida(medidasB.largura, 10);

    if (faixaLarguraA !== faixaLarguraB) {
      return faixaLarguraA - faixaLarguraB;
    }

    const faixaEspessuraA = getFaixaMedida(medidasA.espessura, 10);
    const faixaEspessuraB = getFaixaMedida(medidasB.espessura, 10);

    if (faixaEspessuraA !== faixaEspessuraB) {
      return faixaEspessuraA - faixaEspessuraB;
    }

    if (medidasA.comprimento !== medidasB.comprimento) {
      return medidasA.comprimento - medidasB.comprimento;
    }

    const inoxA = isInox304(a) ? 0 : 1;
    const inoxB = isInox304(b) ? 0 : 1;

    if (inoxA !== inoxB) return inoxA - inoxB;

    const comparacaoMaterial = compararTexto(a.material, b.material);
    if (comparacaoMaterial !== 0) return comparacaoMaterial;

    return compararTexto(a.desenho, b.desenho);
  });
}
