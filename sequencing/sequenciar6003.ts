import type { Peca } from "@/types/peca";
import {
  normalizarTexto,
  prazoFinalTimestamp,
} from "./regrasFluxoProdutivo";

const PROCESSOS_EXTERNOS_6003 = [
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

type Item6003 = {
  peca: Peca;
  indiceOriginal: number;
};

type GrupoOrdem6003 = {
  itens: Item6003[];
  possuiUrgencia: boolean;
  menorPrazo: number;
  indiceOriginal: number;
};

type Dimensoes6003 = {
  comprimento: number;
  largura: number;
  espessura: number;
  volume: number;
  validas: boolean;
};

const DIMENSOES_INVALIDAS_6003: Dimensoes6003 = {
  comprimento: 0,
  largura: 0,
  espessura: 0,
  volume: 0,
  validas: false,
};

function extrairDimensoes6003(valor?: string): Dimensoes6003 {
  const correspondencia = valor
    ?.replace(/,/g, ".")
    .match(
      /(-?\d+(?:\.\d+)?)\s*x\s*(-?\d+(?:\.\d+)?)\s*x\s*(-?\d+(?:\.\d+)?)/i
    );

  if (!correspondencia) {
    return DIMENSOES_INVALIDAS_6003;
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
    return DIMENSOES_INVALIDAS_6003;
  }

  return {
    comprimento,
    largura,
    espessura,
    volume: comprimento * largura * espessura,
    validas: true,
  };
}

function temUrgenciaManual6003(peca: Peca): boolean {
  return (
    peca.urgente === true ||
    normalizarTexto(peca.observacoes).includes("urgente")
  );
}

function temProcessoExterno6003(peca: Peca): boolean {
  const observacoes = normalizarTexto(peca.observacoes);

  return PROCESSOS_EXTERNOS_6003.some((processo) =>
    observacoes.includes(processo)
  );
}

function chaveOrdem6003(peca: Peca, indiceOriginal: number): string {
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

function compararTexto6003(a?: string, b?: string): number {
  return normalizarTexto(a).localeCompare(normalizarTexto(b), undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

function compararItens6003(a: Item6003, b: Item6003): number {
  const processoA = temProcessoExterno6003(a.peca) ? 0 : 1;
  const processoB = temProcessoExterno6003(b.peca) ? 0 : 1;

  if (processoA !== processoB) {
    return processoA - processoB;
  }

  const dimensoesA = extrairDimensoes6003(a.peca.dimensoes);
  const dimensoesB = extrairDimensoes6003(b.peca.dimensoes);

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

  const comparacaoDesenho = compararTexto6003(a.peca.desenho, b.peca.desenho);

  if (comparacaoDesenho !== 0) {
    return comparacaoDesenho;
  }

  const comparacaoOrdemMes = compararTexto6003(
    a.peca.ordemMes,
    b.peca.ordemMes
  );

  if (comparacaoOrdemMes !== 0) {
    return comparacaoOrdemMes;
  }

  return a.indiceOriginal - b.indiceOriginal;
}

export function sequenciar6003(pecas: Peca[]): Peca[] {
  const grupos = new Map<string, GrupoOrdem6003>();

  pecas.forEach((peca, indiceOriginal) => {
    const chave = chaveOrdem6003(peca, indiceOriginal);
    const item = { peca, indiceOriginal };
    const grupo = grupos.get(chave);

    if (grupo) {
      grupo.itens.push(item);
      grupo.possuiUrgencia ||= temUrgenciaManual6003(peca);
      grupo.menorPrazo = Math.min(
        grupo.menorPrazo,
        prazoFinalTimestamp(peca.prazo)
      );
      return;
    }

    grupos.set(chave, {
      itens: [item],
      possuiUrgencia: temUrgenciaManual6003(peca),
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
    .flatMap((grupo) =>
      [...grupo.itens].sort(compararItens6003).map(({ peca }) => peca)
    );
}
