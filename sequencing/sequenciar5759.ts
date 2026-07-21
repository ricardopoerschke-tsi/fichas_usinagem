import type { Peca } from "@/types/peca";
import {
  normalizarTexto,
  prazoInternoTimestamp,
} from "./regrasFluxoProdutivo";

type Peca5759 = Peca & {
  ferramentaSequenciamento: number;
};

type GrupoOrdem5759 = {
  totalPecas: number;
  pecasUrgentes: number;
  prazo: number;
  ordem: string;
};

const LIMITE_PECAS_PARA_SUBIR_FERRAMENTA = 2;
const DIAS_ANTECIPACAO_5759 = 20;

const PROCESSOS_EXTERNOS_5759 = [
  "tempera",
  "solda",
  "oxidacao",
  "revestimento",
  "tratamento",
];

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
  return prazoInternoTimestamp(
    peca.prazo,
    DIAS_ANTECIPACAO_5759
  );
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

  return 999;
}

function getQuantidade(peca: Peca) {
  const quantidade = Number(
    String(peca.quantidade ?? "").replace(",", ".")
  );

  return Number.isFinite(quantidade) ? quantidade : 0;
}

function temProcessoExterno5759(peca: Peca) {
  const texto = normalizarTexto(
    [
      peca.descricao,
      peca.observacoes,
      peca.material,
      peca.ordem,
      peca.ordemMes,
    ].join(" ")
  );

  return PROCESSOS_EXTERNOS_5759.some((processo) =>
    texto.includes(processo)
  );
}

function prioridadeProcessoExterno5759(peca: Peca) {
  return temProcessoExterno5759(peca) ? 0 : 1;
}

function temObservacaoUrgente5759(peca: Peca) {
  return normalizarTexto(
    peca.observacoes
  ).includes("urgente");
}

function prioridadeUrgenciaPeca5759(peca: Peca) {
  return temObservacaoUrgente5759(peca) ? 0 : 1;
}

function getChaveGrupo(peca: Peca) {
  return [
    getPrazoInternoTimestamp(peca),
    normalizarTexto(peca.ordem),
    getGrupoComprimento(peca),
  ].join("|");
}

function ajustarFerramentaPorQuantidade(
  pecas: Peca[]
): Peca5759[] {
  const totaisPorGrupo = new Map<
    string,
    Map<number, number>
  >();

  for (const peca of pecas) {
    const chaveGrupo = getChaveGrupo(peca);
    const ferramenta = getFerramentaMinima(peca);
    const quantidade = getQuantidade(peca);

    if (!totaisPorGrupo.has(chaveGrupo)) {
      totaisPorGrupo.set(chaveGrupo, new Map());
    }

    const totaisFerramenta =
      totaisPorGrupo.get(chaveGrupo)!;

    totaisFerramenta.set(
      ferramenta,
      (totaisFerramenta.get(ferramenta) ?? 0) +
        quantidade
    );
  }

  return pecas.map((peca) => {
    const chaveGrupo = getChaveGrupo(peca);
    const ferramentaMinima = getFerramentaMinima(peca);

    const quantidadeTotalFerramenta =
      totaisPorGrupo
        .get(chaveGrupo)
        ?.get(ferramentaMinima) ?? 0;

    let ferramentaSequenciamento = ferramentaMinima;

    if (
      ferramentaMinima === 63 &&
      quantidadeTotalFerramenta <=
        LIMITE_PECAS_PARA_SUBIR_FERRAMENTA
    ) {
      const qtd100 =
        totaisPorGrupo
          .get(chaveGrupo)
          ?.get(100) ?? 0;

      const qtd125 =
        totaisPorGrupo
          .get(chaveGrupo)
          ?.get(125) ?? 0;

      if (
        qtd100 >
        LIMITE_PECAS_PARA_SUBIR_FERRAMENTA
      ) {
        ferramentaSequenciamento = 100;
      } else if (
        qtd125 >
        LIMITE_PECAS_PARA_SUBIR_FERRAMENTA
      ) {
        ferramentaSequenciamento = 125;
      }
    }

    if (
      ferramentaMinima === 100 &&
      quantidadeTotalFerramenta <=
        LIMITE_PECAS_PARA_SUBIR_FERRAMENTA
    ) {
      const qtd125 =
        totaisPorGrupo
          .get(chaveGrupo)
          ?.get(125) ?? 0;

      if (
        qtd125 >
        LIMITE_PECAS_PARA_SUBIR_FERRAMENTA
      ) {
        ferramentaSequenciamento = 125;
      }
    }

    return {
      ...peca,
      ferramentaSequenciamento,
    };
  });
}

function getFaixaMedida(
  valor: number,
  intervalo = 10
) {
  if (!valor) return 9999;

  return Math.floor(valor / intervalo) * intervalo;
}

function compararTexto(a?: string, b?: string) {
  return (a ?? "").localeCompare(b ?? "");
}

function getNivelUrgenciaGrupo5759(
  grupo: GrupoOrdem5759
) {
  if (
    grupo.pecasUrgentes === grupo.totalPecas
  ) {
    return 2;
  }

  if (grupo.pecasUrgentes > 0) {
    return 1;
  }

  return 0;
}

function getChaveOrdem(peca: Peca) {
  return normalizarTexto(peca.ordem);
}

function criarGruposOrdem(
  pecas: Peca5759[]
) {
  const grupos = new Map<
    string,
    GrupoOrdem5759
  >();

  const chaves = new WeakMap<
    Peca5759,
    string
  >();

  pecas.forEach((peca, index) => {
    const ordem = getChaveOrdem(peca);

    const chave =
      ordem || `sem-ordem-${index}`;

    const urgente =
      temObservacaoUrgente5759(peca);

    const prazo =
      getPrazoInternoTimestamp(peca);

    const grupoExistente =
      grupos.get(chave);

    chaves.set(peca, chave);

    if (!grupoExistente) {
      grupos.set(chave, {
        totalPecas: 1,
        pecasUrgentes: urgente ? 1 : 0,
        prazo,
        ordem: ordem || chave,
      });

      return;
    }

    grupoExistente.totalPecas += 1;

    if (urgente) {
      grupoExistente.pecasUrgentes += 1;
    }

    grupoExistente.prazo = Math.min(
      grupoExistente.prazo,
      prazo
    );
  });

  return {
    grupos,
    chaves,
  };
}

export function sequenciar5759(
  pecas: Peca[]
): Peca[] {
  const pecasComFerramenta =
    ajustarFerramentaPorQuantidade(pecas);

  const gruposOrdem =
    criarGruposOrdem(pecasComFerramenta);

  return [...pecasComFerramenta].sort(
    (a, b) => {
      const chaveGrupoA =
        gruposOrdem.chaves.get(a);

      const chaveGrupoB =
        gruposOrdem.chaves.get(b);

      if (!chaveGrupoA || !chaveGrupoB) {
        return 0;
      }

      const grupoOrdemA =
        gruposOrdem.grupos.get(chaveGrupoA);

      const grupoOrdemB =
        gruposOrdem.grupos.get(chaveGrupoB);

      if (!grupoOrdemA || !grupoOrdemB) {
        return 0;
      }

      const nivelUrgenciaA =
        getNivelUrgenciaGrupo5759(
          grupoOrdemA
        );

      const nivelUrgenciaB =
        getNivelUrgenciaGrupo5759(
          grupoOrdemB
        );

      if (
        nivelUrgenciaA !== nivelUrgenciaB
      ) {
        return (
          nivelUrgenciaB -
          nivelUrgenciaA
        );
      }

      if (
        grupoOrdemA.prazo !==
        grupoOrdemB.prazo
      ) {
        return (
          grupoOrdemA.prazo -
          grupoOrdemB.prazo
        );
      }

      if (
        grupoOrdemA.ordem !==
        grupoOrdemB.ordem
      ) {
        return grupoOrdemA.ordem.localeCompare(
          grupoOrdemB.ordem
        );
      }

      /*
       * A partir daqui, as peças pertencem
       * à mesma Ordem.
       */

      const urgenciaPecaA =
        prioridadeUrgenciaPeca5759(a);

      const urgenciaPecaB =
        prioridadeUrgenciaPeca5759(b);

      if (
        urgenciaPecaA !== urgenciaPecaB
      ) {
        return (
          urgenciaPecaA -
          urgenciaPecaB
        );
      }

      /*
       * Primeiro mantém o mesmo tipo de
       * fixação pelo comprimento.
       */
      const grupoComprimentoA =
        getGrupoComprimento(a);

      const grupoComprimentoB =
        getGrupoComprimento(b);

      if (
        grupoComprimentoA !==
        grupoComprimentoB
      ) {
        return (
          grupoComprimentoA -
          grupoComprimentoB
        );
      }

      /*
       * Depois agrupa pela ferramenta.
       * Processo externo não deve provocar
       * troca de ferramenta.
       */
      if (
        a.ferramentaSequenciamento !==
        b.ferramentaSequenciamento
      ) {
        return (
          a.ferramentaSequenciamento -
          b.ferramentaSequenciamento
        );
      }

      /*
       * Dentro do mesmo grupo produtivo,
       * antecipa as peças que seguem para
       * processos externos.
       */
      const processoA =
        prioridadeProcessoExterno5759(a);

      const processoB =
        prioridadeProcessoExterno5759(b);

      if (processoA !== processoB) {
        return processoA - processoB;
      }

      const medidasA = getMedidas(a);
      const medidasB = getMedidas(b);

      const faixaLarguraA =
        getFaixaMedida(
          medidasA.largura,
          10
        );

      const faixaLarguraB =
        getFaixaMedida(
          medidasB.largura,
          10
        );

      if (
        faixaLarguraA !== faixaLarguraB
      ) {
        return (
          faixaLarguraA -
          faixaLarguraB
        );
      }

      const faixaEspessuraA =
        getFaixaMedida(
          medidasA.espessura,
          10
        );

      const faixaEspessuraB =
        getFaixaMedida(
          medidasB.espessura,
          10
        );

      if (
        faixaEspessuraA !==
        faixaEspessuraB
      ) {
        return (
          faixaEspessuraA -
          faixaEspessuraB
        );
      }

      if (
        medidasA.comprimento !==
        medidasB.comprimento
      ) {
        return (
          medidasA.comprimento -
          medidasB.comprimento
        );
      }

      const comparacaoMaterial =
        compararTexto(
          a.material,
          b.material
        );

      if (comparacaoMaterial !== 0) {
        return comparacaoMaterial;
      }

      return compararTexto(
        a.desenho,
        b.desenho
      );
    }
  );
}