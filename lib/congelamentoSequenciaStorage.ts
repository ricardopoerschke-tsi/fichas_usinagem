import {
  referenciaPecaValida,
  type CongelamentoSequencia,
} from "@/sequencing/congelamento";

const CHAVE_STORAGE = "fichas-usinagem:congelamento:v1";

function chaveMaquina(maquinaId: string): string {
  return `${CHAVE_STORAGE}:${maquinaId}`;
}

export function carregarCongelamentoSequencia(
  maquinaId: string
): CongelamentoSequencia | null {
  try {
    const salvo = window.localStorage.getItem(chaveMaquina(maquinaId));
    if (!salvo) return null;

    const congelamento = JSON.parse(salvo) as CongelamentoSequencia;

    if (
      !congelamento?.ultimaPeca ||
      !referenciaPecaValida(congelamento.ultimaPeca)
    ) {
      return null;
    }

    return congelamento;
  } catch {
    return null;
  }
}

export function salvarCongelamentoSequencia(
  maquinaId: string,
  congelamento: CongelamentoSequencia | null
): void {
  try {
    const chave = chaveMaquina(maquinaId);

    if (!congelamento) {
      window.localStorage.removeItem(chave);
      return;
    }

    window.localStorage.setItem(chave, JSON.stringify(congelamento));
  } catch {
    // O congelamento continua válido durante a sessão se o storage falhar.
  }
}
