import { Peca } from "@/types/peca";
import {
  normalizarTexto,
  prazoInternoTimestamp,
  prioridadeProcessoAdicional,
  prioridadeUrgenciaProdutiva,
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

function quantidadePecas(peca: Peca): number {
  const quantidade = Number(String(peca.quantidade ?? "").replace(",", "."));
  return Number.isNaN(quantidade) ? 1 : quantidade;
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

function ordenarPorBase(a: Peca, b: Peca): number {
  const urgenteA = prioridadeUrgenciaProdutiva(a, DIAS_ANTECIPACAO_1516);
  const urgenteB = prioridadeUrgenciaProdutiva(b, DIAS_ANTECIPACAO_1516);

  if (urgenteA !== urgenteB) return urgenteA - urgenteB;

  const processoA = prioridadeProcessoAdicional(a);
  const processoB = prioridadeProcessoAdicional(b);

  if (processoA !== processoB) return processoA - processoB;

  const prazoA = grupoPrazo(a);
  const prazoB = grupoPrazo(b);

  if (prazoA !== prazoB) return prazoA - prazoB;

  return 0;
}

function ordenarDentroFerramenta(a: Peca, b: Peca): number {
  const medidasA = extrairMedidas(a.dimensoes);
  const medidasB = extrairMedidas(b.dimensoes);

  if (medidasA.comprimento !== medidasB.comprimento) {
    return medidasA.comprimento - medidasB.comprimento;
  }

  const materialA = normalizarTexto(a.material);
  const materialB = normalizarTexto(b.material);

  if (materialA !== materialB) {
    return materialA.localeCompare(materialB);
  }

  return 0;
}

function sequenciarGrupoMesmoPrazo(pecas: Peca[]): Peca[] {
  const pequenas63: Peca[] = [];
  const medias100: Peca[] = [];
  const grandes125: Peca[] = [];

  for (const peca of pecas) {
    const ferramenta = ferramentaMinima1516(peca);

    if (ferramenta === 63) pequenas63.push(peca);
    else if (ferramenta === 100) medias100.push(peca);
    else grandes125.push(peca);
  }

  pequenas63.sort(ordenarDentroFerramenta);
  medias100.sort(ordenarDentroFerramenta);
  grandes125.sort(ordenarDentroFerramenta);

  const resultado: Peca[] = [];

  if (grandes125.length > 0) {
    resultado.push(...grandes125);
    resultado.push(...medias100);

    let quantidade63Puxada = 0;
    const pequenasRestantes: Peca[] = [];

    for (const peca of pequenas63) {
      const qtd = quantidadePecas(peca);

      if (quantidade63Puxada + qtd <= 10) {
        resultado.push(peca);
        quantidade63Puxada += qtd;
      } else {
        pequenasRestantes.push(peca);
      }
    }

    resultado.push(...pequenasRestantes);
    return resultado;
  }

  if (medias100.length > 0) {
    resultado.push(...medias100);

    let quantidade63Puxada = 0;
    const pequenasRestantes: Peca[] = [];

    for (const peca of pequenas63) {
      const qtd = quantidadePecas(peca);

      if (quantidade63Puxada + qtd <= 10) {
        resultado.push(peca);
        quantidade63Puxada += qtd;
      } else {
        pequenasRestantes.push(peca);
      }
    }

    resultado.push(...pequenasRestantes);
    return resultado;
  }

  resultado.push(...pequenas63);
  return resultado;
}

export function sequenciar1516(pecas: Peca[]): Peca[] {
  const pecasOrdenadas = [...pecas].sort(ordenarPorBase);

  const grupos = new Map<string, Peca[]>();

  for (const peca of pecasOrdenadas) {
    const chave = [
      prioridadeUrgenciaProdutiva(peca, DIAS_ANTECIPACAO_1516),
      prioridadeProcessoAdicional(peca),
      grupoPrazo(peca),
    ].join("-");

    if (!grupos.has(chave)) {
      grupos.set(chave, []);
    }

    grupos.get(chave)!.push(peca);
  }

  const resultado: Peca[] = [];

  for (const grupo of grupos.values()) {
    resultado.push(...sequenciarGrupoMesmoPrazo(grupo));
  }

  return resultado.map((peca, index) => ({
    ...peca,
    sequencia: index + 1,
  }));
}
