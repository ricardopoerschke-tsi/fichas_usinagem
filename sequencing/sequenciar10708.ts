import type { Peca } from "@/types/peca";
import {
  normalizarTexto,
  prazoFinalTimestamp,
} from "./regrasFluxoProdutivo";

const PROCESSOS_EXTERNOS_10708 = [
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

type Item10708 = {
  peca: Peca;
  indiceOriginal: number;
};

type GrupoOrdem10708 = {
  itens: Item10708[];
  possuiUrgencia: boolean;
  menorPrazo: number;
  indiceOriginal: number;
};

type Dimensoes10708 = {
  comprimento: number;
  largura: number;
  espessura: number;
  volume: number;
  validas: boolean;
};

type MedidasCantoneira10708 = [number, number, number, number];

const DIMENSOES_INVALIDAS_10708: Dimensoes10708 = {
  comprimento: 0,
  largura: 0,
  espessura: 0,
  volume: 0,
  validas: false,
};

function extrairDimensoes10708(valor?: string): Dimensoes10708 {
  const correspondencia = valor
    ?.replace(/,/g, ".")
    .match(
      /(-?\d+(?:\.\d+)?)\s*x\s*(-?\d+(?:\.\d+)?)\s*x\s*(-?\d+(?:\.\d+)?)/i
    );

  if (!correspondencia) {
    return DIMENSOES_INVALIDAS_10708;
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
    return DIMENSOES_INVALIDAS_10708;
  }

  return {
    comprimento,
    largura,
    espessura,
    volume: comprimento * largura * espessura,
    validas: true,
  };
}

function temUrgenciaManual10708(peca: Peca): boolean {
  return (
    peca.urgente === true ||
    normalizarTexto(peca.observacoes).includes("urgente")
  );
}

function temProcessoExterno10708(peca: Peca): boolean {
  const observacoes = normalizarTexto(peca.observacoes);

  return PROCESSOS_EXTERNOS_10708.some((processo) =>
    observacoes.includes(processo)
  );
}

function extrairMedidasCantoneira10708(
  dimensoes?: string
): MedidasCantoneira10708 | null {
  const correspondencia = dimensoes
    ?.replace(/,/g, ".")
    .match(
      /(?:^|[^x\s\d.,-]\s*)(-?\d+(?:\.\d+)?)\s*x\s*(-?\d+(?:\.\d+)?)\s*x\s*(-?\d+(?:\.\d+)?)\s*x\s*(-?\d+(?:\.\d+)?)(?!\s*x\s*-?\d)/i
    );

  if (!correspondencia) {
    return null;
  }

  const medidas: MedidasCantoneira10708 = [
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
  return extrairMedidasCantoneira10708(dimensoes) !== null;
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

function chaveOrdem10708(peca: Peca, indiceOriginal: number): string {
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

function compararTexto10708(a?: string, b?: string): number {
  return normalizarTexto(a).localeCompare(normalizarTexto(b), undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

function compararItens10708(
  a: Item10708,
  b: Item10708,
  cantoneirasComProcessoExterno: boolean
): number {
  const conjuntoSoldadoA = ehConjuntoSoldado(a.peca.dimensoes);
  const conjuntoSoldadoB = ehConjuntoSoldado(b.peca.dimensoes);
  const medidasCantoneiraA = extrairMedidasCantoneira10708(a.peca.dimensoes);
  const medidasCantoneiraB = extrairMedidasCantoneira10708(b.peca.dimensoes);
  const processoExternoA = temProcessoExterno10708(a.peca);
  const processoExternoB = temProcessoExterno10708(b.peca);

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

  const dimensoesA = extrairDimensoes10708(a.peca.dimensoes);
  const dimensoesB = extrairDimensoes10708(b.peca.dimensoes);

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

  const comparacaoDesenho = compararTexto10708(a.peca.desenho, b.peca.desenho);

  if (comparacaoDesenho !== 0) {
    return comparacaoDesenho;
  }

  const comparacaoOrdemMes = compararTexto10708(
    a.peca.ordemMes,
    b.peca.ordemMes
  );

  if (comparacaoOrdemMes !== 0) {
    return comparacaoOrdemMes;
  }

  return a.indiceOriginal - b.indiceOriginal;
}

export function sequenciar10708(pecas: Peca[]): Peca[] {
  const grupos = new Map<string, GrupoOrdem10708>();

  pecas.forEach((peca, indiceOriginal) => {
    const chave = chaveOrdem10708(peca, indiceOriginal);
    const item = { peca, indiceOriginal };
    const grupo = grupos.get(chave);

    if (grupo) {
      grupo.itens.push(item);
      grupo.possuiUrgencia ||= temUrgenciaManual10708(peca);
      grupo.menorPrazo = Math.min(
        grupo.menorPrazo,
        prazoFinalTimestamp(peca.prazo)
      );
      return;
    }

    grupos.set(chave, {
      itens: [item],
      possuiUrgencia: temUrgenciaManual10708(peca),
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
          ehCantoneira(peca.dimensoes) && temProcessoExterno10708(peca)
      );

      return [...grupo.itens]
        .sort((a, b) =>
          compararItens10708(a, b, cantoneirasComProcessoExterno)
        )
        .map(({ peca }) => peca);
    });
}
