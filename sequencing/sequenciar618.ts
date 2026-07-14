import { Peca } from "@/types/peca";
import {
  normalizarTexto,
  prazoInternoTimestamp,
  prioridadeProcessoAdicional,
  prioridadeUrgenciaProdutiva,
} from "./regrasFluxoProdutivo";

type Ferramenta618 = 63 | 100 | 125;
const DIAS_ANTECIPACAO_618 = 15;

function normalizarNumero(valor: string): number | null {
  const numero = Number(valor.replace(",", ".").replace(/[^\d.]/g, ""));
  return Number.isNaN(numero) ? null : numero;
}

function extrairMedidas(dimensoes?: string) {
  if (!dimensoes) {
    return {
      espessura: 999999,
      largura: 999999,
      comprimento: 999999,
    };
  }

  const medidas = dimensoes
    .toLowerCase()
    .replace(/ø/g, "")
    .replace(/diam/g, "")
    .split("x")
    .map((parte) => normalizarNumero(parte))
    .filter((n): n is number => n !== null);

  return {
    espessura: medidas[0] ?? 999999,
    largura: medidas[1] ?? 999999,
    comprimento: medidas[2] ?? medidas[medidas.length - 1] ?? 999999,
  };
}

function cabeNaFerramenta(
  largura: number,
  espessura: number,
  ferramenta: Ferramenta618
): boolean {
  return largura <= ferramenta || espessura <= ferramenta;
}

function ferramentaMinima618(peca: Peca): Ferramenta618 {
  const { largura, espessura } = extrairMedidas(peca.dimensoes);

  if (cabeNaFerramenta(largura, espessura, 63)) return 63;
  if (cabeNaFerramenta(largura, espessura, 100)) return 100;
  return 125;
}

function grupoPrazo(peca: Peca): number {
  return prazoInternoTimestamp(peca.prazo, DIAS_ANTECIPACAO_618);
}

function ordenar618(a: Peca, b: Peca): number {
  const urgenteA = prioridadeUrgenciaProdutiva(a, DIAS_ANTECIPACAO_618);
  const urgenteB = prioridadeUrgenciaProdutiva(b, DIAS_ANTECIPACAO_618);

  if (urgenteA !== urgenteB) return urgenteA - urgenteB;

  const processoA = prioridadeProcessoAdicional(a);
  const processoB = prioridadeProcessoAdicional(b);

  if (processoA !== processoB) return processoA - processoB;

  const prazoA = grupoPrazo(a);
  const prazoB = grupoPrazo(b);

  if (prazoA !== prazoB) return prazoA - prazoB;

  const ferramentaA = ferramentaMinima618(a);
  const ferramentaB = ferramentaMinima618(b);

  if (ferramentaA !== ferramentaB) return ferramentaA - ferramentaB;

  const medidasA = extrairMedidas(a.dimensoes);
  const medidasB = extrairMedidas(b.dimensoes);

  if (medidasA.comprimento !== medidasB.comprimento) {
    return medidasA.comprimento - medidasB.comprimento;
  }

  const materialA = normalizarTexto(a.material);
  const materialB = normalizarTexto(b.material);

  return materialA.localeCompare(materialB);
}

export function sequenciar618(pecas: Peca[]): Peca[] {
  return [...pecas].sort(ordenar618).map((peca, index) => ({
    ...peca,
    sequencia: index + 1,
  }));
}
