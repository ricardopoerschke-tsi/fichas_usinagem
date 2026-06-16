import type { Peca } from "@/types/peca";

type Peca1572 = Peca & {
  ferramentaSequenciamento: number;
};

const LIMITE_PECAS_PARA_SUBIR_FERRAMENTA = 2;

function normalizarTexto(valor?: string) {
  return (valor ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

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

function getPrazoTimestamp(peca: Peca) {
  if (!peca.prazo) return new Date("2999-12-31").getTime();

  const [dia, mes, ano] = peca.prazo.split("/");
  if (!dia || !mes || !ano) return new Date("2999-12-31").getTime();

  return new Date(`${ano}-${mes}-${dia}`).getTime();
}

function temProcessoExterno(peca: Peca) {
  const obs = normalizarTexto(peca.observacoes);

  return (
    obs.includes("tempera") ||
    obs.includes("solda") ||
    obs.includes("oxidacao") ||
    obs.includes("revestimento") ||
    obs.includes("tratamento")
  );
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
    temProcessoExterno(peca) ? "externo" : "normal",
    getPrazoTimestamp(peca),
    isInox304(peca) ? "inox304" : "outros",
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
    const processoA = temProcessoExterno(a) ? 0 : 1;
    const processoB = temProcessoExterno(b) ? 0 : 1;

    if (processoA !== processoB) return processoA - processoB;

    const prazoA = getPrazoTimestamp(a);
    const prazoB = getPrazoTimestamp(b);

    if (prazoA !== prazoB) return prazoA - prazoB;

    const inoxA = isInox304(a) ? 0 : 1;
    const inoxB = isInox304(b) ? 0 : 1;

    if (inoxA !== inoxB) return inoxA - inoxB;

    const grupoComprimentoA = getGrupoComprimento(a);
    const grupoComprimentoB = getGrupoComprimento(b);

    if (grupoComprimentoA !== grupoComprimentoB) {
      return grupoComprimentoA - grupoComprimentoB;
    }

    if (a.ferramentaSequenciamento !== b.ferramentaSequenciamento) {
      return a.ferramentaSequenciamento - b.ferramentaSequenciamento;
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

    return compararTexto(a.desenho, b.desenho);
  });
}