import { Peca } from "@/types/peca";
import {
  dataInicioHoje,
  normalizarTexto,
  prazoInternoTimestamp,
  temProcessoAdicional,
  temUrgenciaProdutiva,
} from "./regrasFluxoProdutivo";

type Ferramenta1516 = 63 | 100 | 125;
const DIAS_ANTECIPACAO_1516 = 15;

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
  ferramenta: Ferramenta1516
): boolean {
  return largura <= ferramenta || espessura <= ferramenta;
}

function ferramentaMinima1516(peca: Peca): Ferramenta1516 {
  const { largura, espessura } = extrairMedidas(peca.dimensoes);

  if (cabeNaFerramenta(largura, espessura, 63)) return 63;
  if (cabeNaFerramenta(largura, espessura, 100)) return 100;
  return 125;
}

function grupoPrazo(peca: Peca): number {
  return prazoInternoTimestamp(peca.prazo, DIAS_ANTECIPACAO_1516);
}

function temUrgenciaManual(peca: Peca): boolean {
  return normalizarTexto(peca.observacoes).includes("urgente");
}

function prioridade1516(peca: Peca): number {
  if (temUrgenciaManual(peca)) return 0;

  const processoAdicional = temProcessoAdicional(peca);
  const urgenciaProdutiva = temUrgenciaProdutiva(
    peca,
    DIAS_ANTECIPACAO_1516
  );
  const prazoInternoVencido = grupoPrazo(peca) < dataInicioHoje();

  if (processoAdicional && urgenciaProdutiva) return 1;
  if (prazoInternoVencido) return 2;
  if (processoAdicional) return 3;

  return 4;
}

function ordenar1516(a: Peca, b: Peca): number {
  const prioridadeA = prioridade1516(a);
  const prioridadeB = prioridade1516(b);

  if (prioridadeA !== prioridadeB) return prioridadeA - prioridadeB;

  const prazoA = grupoPrazo(a);
  const prazoB = grupoPrazo(b);

  if (prazoA !== prazoB) return prazoA - prazoB;

  const ferramentaA = ferramentaMinima1516(a);
  const ferramentaB = ferramentaMinima1516(b);

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

export function sequenciar1516(pecas: Peca[]): Peca[] {
  return [...pecas].sort(ordenar1516).map((peca, index) => ({
    ...peca,
    sequencia: index + 1,
  }));
}
