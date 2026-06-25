import type { Peca } from "@/types/peca";

export type ReferenciaPecaSequencia = {
  desenho: string;
  ordemMes: string;
};

export type CongelamentoSequencia = {
  ultimaPeca: ReferenciaPecaSequencia;
};

type ResultadoSequenciamentoCongelado = {
  sequencia: Peca[];
  limiteCongelado: number;
  referenciaEncontrada: boolean;
};

function normalizarParteChave(valor?: string): string {
  return (valor ?? "").trim().toLocaleUpperCase("pt-BR");
}

export function criarReferenciaPeca(
  peca: Pick<Peca, "desenho" | "ordemMes">
): ReferenciaPecaSequencia {
  return {
    desenho: peca.desenho.trim(),
    ordemMes: (peca.ordemMes ?? "").trim(),
  };
}

export function referenciaPecaValida(
  referencia: ReferenciaPecaSequencia
): boolean {
  return Boolean(
    normalizarParteChave(referencia.desenho) &&
      normalizarParteChave(referencia.ordemMes)
  );
}

export function serializarReferenciaPeca(
  referencia: ReferenciaPecaSequencia
): string {
  return JSON.stringify([
    normalizarParteChave(referencia.desenho),
    normalizarParteChave(referencia.ordemMes),
  ]);
}

export function obterChavePeca(
  peca: Pick<Peca, "desenho" | "ordemMes">
): string {
  return serializarReferenciaPeca(criarReferenciaPeca(peca));
}

export function mesmaReferenciaPeca(
  peca: Pick<Peca, "desenho" | "ordemMes">,
  referencia: ReferenciaPecaSequencia
): boolean {
  return obterChavePeca(peca) === serializarReferenciaPeca(referencia);
}

export function localizarLimiteCongelado(
  sequencia: Peca[],
  congelamento: CongelamentoSequencia | null
): number {
  if (!congelamento) return -1;

  return sequencia.findIndex((peca) =>
    mesmaReferenciaPeca(peca, congelamento.ultimaPeca)
  );
}

export function sequenciarRespeitandoCongelamento(
  sequenciaAtual: Peca[],
  congelamento: CongelamentoSequencia | null,
  sequenciarParteLivre: (pecas: Peca[]) => Peca[]
): ResultadoSequenciamentoCongelado {
  if (!congelamento) {
    return {
      sequencia: sequenciarParteLivre(sequenciaAtual),
      limiteCongelado: -1,
      referenciaEncontrada: true,
    };
  }

  const limiteCongelado = localizarLimiteCongelado(
    sequenciaAtual,
    congelamento
  );

  if (limiteCongelado < 0) {
    return {
      sequencia: sequenciaAtual,
      limiteCongelado,
      referenciaEncontrada: false,
    };
  }

  const parteCongelada = sequenciaAtual.slice(0, limiteCongelado + 1);
  const parteLivre = sequenciaAtual.slice(limiteCongelado + 1);

  return {
    sequencia: [...parteCongelada, ...sequenciarParteLivre(parteLivre)],
    limiteCongelado,
    referenciaEncontrada: true,
  };
}
