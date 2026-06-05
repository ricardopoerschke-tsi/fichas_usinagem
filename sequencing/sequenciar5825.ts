import type { Peca } from "@/types/peca";

const TOLERANCIA_CASTANHA_5825 = 0.5;

function extrairBitola(dimensoes: string): number | null {
  if (!dimensoes) return null;

  const texto = dimensoes.replace(",", ".");

  const match = texto.match(/(?:Ø|ø|diametro|diâmetro)?\s*(\d+(?:\.\d+)?)/i);

  if (!match) return null;

  return Number(match[1]);
}

function calcularFamiliaBitola(bitola: number | null): number {
  if (bitola === null || Number.isNaN(bitola)) return 999;

  return Math.round(bitola);
}

function normalizarTexto(texto?: string): string {
  return texto
    ?.normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .trim() ?? "";
}

function prioridadeUrgencia(peca: Peca): number {
  return peca.urgente === true || String(peca.urgente).toLowerCase() === "true"
    ? 0
    : 1;
}

export function sequenciar5825(pecas: Peca[]): Peca[] {
  return [...pecas].sort((a, b) => {
    const bitolaA = extrairBitola(a.dimensoes);
    const bitolaB = extrairBitola(b.dimensoes);

    const familiaA = calcularFamiliaBitola(bitolaA);
    const familiaB = calcularFamiliaBitola(bitolaB);

    const materialA = normalizarTexto(a.material);
    const materialB = normalizarTexto(b.material);

    const urgenciaA = prioridadeUrgencia(a);
    const urgenciaB = prioridadeUrgencia(b);

    if (urgenciaA !== urgenciaB) return urgenciaA - urgenciaB;
    if (familiaA !== familiaB) return familiaA - familiaB;

    const comparacaoMaterial = materialA.localeCompare(materialB);
    if (comparacaoMaterial !== 0) return comparacaoMaterial;

    return (bitolaA ?? 999) - (bitolaB ?? 999);
  });
}