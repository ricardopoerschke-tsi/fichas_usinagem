import type { Peca } from "@/types/peca";
import {
  normalizarTexto,
  prazoFinalTimestamp,
} from "./regrasFluxoProdutivo";

const PROCESSOS_EXTERNOS_904 = [
  "solda",
  "tratamento termico",
  "trat. termico",
  "trat termico",
  "tempera",
  "oxidacao",
  "oxidar",
  "revestimento",
  "tratamento",
];

type Item904 = {
  peca: Peca;
  indiceOriginal: number;
};

type GrupoOrdem904 = {
  itens: Item904[];
  possuiUrgencia: boolean;
  menorPrazo: number;
  indiceOriginal: number;
};

type Dimensoes904 = {
  comprimento: number;
  largura: number;
  espessura: number;
  volume: number;
  validas: boolean;
};

type MedidasCantoneira904 = [number, number, number, number];

const DIMENSOES_INVALIDAS_904: Dimensoes904 = {
  comprimento: 0,
  largura: 0,
  espessura: 0,
  volume: 0,
  validas: false,
};

function extrairDimensoes904(valor?: string): Dimensoes904 {
  const correspondencia = valor
    ?.replace(/,/g, ".")
    .match(
      /(-?\d+(?:\.\d+)?)\s*x\s*(-?\d+(?:\.\d+)?)\s*x\s*(-?\d+(?:\.\d+)?)/i
    );

  if (!correspondencia) {
    return DIMENSOES_INVALIDAS_904;
  }

  const comprimento = Number(correspondencia[1]);
  const largura = Number(correspondencia[2]);
  const espessura = Number(correspondencia[3]);

  if (
    !Number.isFinite(comprimento) ||
    !Number.isFinite(largura) ||
    !Number.isFinite(espessura) ||
    comprimento <= 0 ||
    largura <= 0 ||
    espessura <= 0
  ) {
    return DIMENSOES_INVALIDAS_904;
  }

  return {
    comprimento,
    largura,
    espessura,
    volume: comprimento * largura * espessura,
    validas: true,
  };
}

function temUrgenciaManual904(peca: Peca): boolean {
  return (
    peca.urgente === true ||
    normalizarTexto(peca.observacoes).includes("urgente")
  );
}

function temProcessoExterno904(peca: Peca): boolean {
  const observacoes = normalizarTexto(peca.observacoes);

  return PROCESSOS_EXTERNOS_904.some((processo) =>
    observacoes.includes(processo)
  );
}

function extrairMedidasCantoneira904(
  dimensoes?: string
): MedidasCantoneira904 | null {
  const correspondencia = dimensoes
    ?.replace(/,/g, ".")
    .match(
      /(?:^|[^x\s\d.,-]\s*)(-?\d+(?:\.\d+)?)\s*x\s*(-?\d+(?:\.\d+)?)\s*x\s*(-?\d+(?:\.\d+)?)\s*x\s*(-?\d+(?:\.\d+)?)(?!\s*x\s*-?\d)/i
    );

  if (!correspondencia) {
    return null;
  }

  const medidas: MedidasCantoneira904 = [
    Number(correspondencia[1]),
    Number(correspondencia[2]),
    Number(correspondencia[3]),
    Number(correspondencia[4]),
  ];

  return medidas.every((medida) => Number.isFinite(medida) && medida > 0)
    ? medidas
    : null;
}

function ehCantoneira(dimensoes?: string): boolean {
  return extrairMedidasCantoneira904(dimensoes) !== null;
}

function ehConjuntoSoldado(dimensoes?: string): boolean {
  const dimensoesNormalizadas = normalizarTexto(dimensoes)
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return (
    dimensoesNormalizadas === "soldado" ||
    /(?:^|\s)(?:conjunto|conj|c)\s+soldado(?:\s|$)/.test(
      dimensoesNormalizadas
    )
  );
}

function chaveOrdem904(peca: Peca, indiceOriginal: number): string {
  const ordem = String(peca.ordem ?? "").trim();
  const ordemNormalizada = normalizarTexto(ordem);

  if (
    !ordemNormalizada ||
    ordemNormalizada === "-" ||
    ordemNormalizada === "sem ordem" ||
    ordemNormalizada === "sem of"
  ) {
    return `sem-ordem:${indiceOriginal}`;
  }

  return `ordem:${ordem}`;
}

function compararTexto904(a?: string, b?: string): number {
  return normalizarTexto(a).localeCompare(normalizarTexto(b), undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

function compararItens904(
  a: Item904,
  b: Item904,
  cantoneirasComProcessoExterno: boolean
): number {
  const conjuntoSoldadoA = ehConjuntoSoldado(a.peca.dimensoes);
  const conjuntoSoldadoB = ehConjuntoSoldado(b.peca.dimensoes);
  const medidasCantoneiraA = extrairMedidasCantoneira904(a.peca.dimensoes);
  const medidasCantoneiraB = extrairMedidasCantoneira904(b.peca.dimensoes);
  const processoExternoA = temProcessoExterno904(a.peca);
  const processoExternoB = temProcessoExterno904(b.peca);

  const prioridadeA = conjuntoSoldadoA
    ? 3
    : medidasCantoneiraA
      ? cantoneirasComProcessoExterno
        ? 1
        : 2
      : processoExternoA
        ? 0
        : cantoneirasComProcessoExterno
          ? 2
          : 1;
  const prioridadeB = conjuntoSoldadoB
    ? 3
    : medidasCantoneiraB
      ? cantoneirasComProcessoExterno
        ? 1
        : 2
      : processoExternoB
        ? 0
        : cantoneirasComProcessoExterno
          ? 2
          : 1;

  if (prioridadeA !== prioridadeB) {
    return prioridadeA - prioridadeB;
  }

  if (medidasCantoneiraA && medidasCantoneiraB) {
    for (let indice = 0; indice < medidasCantoneiraA.length; indice += 1) {
      if (medidasCantoneiraA[indice] !== medidasCantoneiraB[indice]) {
        return medidasCantoneiraB[indice] - medidasCantoneiraA[indice];
      }
    }
  }

  const dimensoesA = extrairDimensoes904(a.peca.dimensoes);
  const dimensoesB = extrairDimensoes904(b.peca.dimensoes);

  if (dimensoesA.validas !== dimensoesB.validas) {
    return dimensoesA.validas ? -1 : 1;
  }

  if (dimensoesA.validas && dimensoesB.validas) {
    const criteriosDimensionais: Array<[number, number]> = [
      [dimensoesA.volume, dimensoesB.volume],
      [dimensoesA.comprimento, dimensoesB.comprimento],
      [dimensoesA.largura, dimensoesB.largura],
      [dimensoesA.espessura, dimensoesB.espessura],
    ];

    for (const [valorA, valorB] of criteriosDimensionais) {
      if (valorA !== valorB) {
        return valorB - valorA;
      }
    }
  }

  const comparacaoDesenho = compararTexto904(a.peca.desenho, b.peca.desenho);

  if (comparacaoDesenho !== 0) {
    return comparacaoDesenho;
  }

  const comparacaoOrdemMes = compararTexto904(
    a.peca.ordemMes,
    b.peca.ordemMes
  );

  if (comparacaoOrdemMes !== 0) {
    return comparacaoOrdemMes;
  }

  return a.indiceOriginal - b.indiceOriginal;
}

export function sequenciar904(pecas: Peca[]): Peca[] {
  const grupos = new Map<string, GrupoOrdem904>();

  pecas.forEach((peca, indiceOriginal) => {
    const chave = chaveOrdem904(peca, indiceOriginal);
    const item = { peca, indiceOriginal };
    const grupo = grupos.get(chave);

    if (grupo) {
      grupo.itens.push(item);
      grupo.possuiUrgencia ||= temUrgenciaManual904(peca);
      grupo.menorPrazo = Math.min(
        grupo.menorPrazo,
        prazoFinalTimestamp(peca.prazo)
      );
      return;
    }

    grupos.set(chave, {
      itens: [item],
      possuiUrgencia: temUrgenciaManual904(peca),
      menorPrazo: prazoFinalTimestamp(peca.prazo),
      indiceOriginal,
    });
  });

  return [...grupos.values()]
    .sort((a, b) => {
      if (a.possuiUrgencia !== b.possuiUrgencia) {
        return a.possuiUrgencia ? -1 : 1;
      }

      if (a.menorPrazo !== b.menorPrazo) {
        return a.menorPrazo - b.menorPrazo;
      }

      return a.indiceOriginal - b.indiceOriginal;
    })
    .flatMap((grupo) => {
      const cantoneirasComProcessoExterno = grupo.itens.some(
        ({ peca }) =>
          ehCantoneira(peca.dimensoes) && temProcessoExterno904(peca)
      );

      return [...grupo.itens]
        .sort((a, b) =>
          compararItens904(a, b, cantoneirasComProcessoExterno)
        )
        .map(({ peca }) => peca);
    });
}
