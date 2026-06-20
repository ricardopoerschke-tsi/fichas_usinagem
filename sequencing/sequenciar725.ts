import type { Peca } from "@/types/peca";
import { normalizarTexto, prazoFinalTimestamp } from "./regrasFluxoProdutivo";

const LARGURA_MESA = 700;
const COMPRIMENTO_MESA = 400;
const AREA_UTIL_MESA = LARGURA_MESA * COMPRIMENTO_MESA;
const MEDIDA_INVALIDA = Number.MAX_SAFE_INTEGER;

type Medidas725 = {
  largura: number;
  comprimento: number;
  espessura: number;
};

type LoteMesa = {
  pecas: Peca[];
  areaOcupada: number;
  aceitaAgrupamento: boolean;
};

function extrairMedidas(dimensoes?: string): Medidas725 {
  const medidas =
    dimensoes
      ?.replace(/,/g, ".")
      .match(/\d+(?:\.\d+)?/g)
      ?.map(Number) ?? [];

  return {
    largura: medidas[0] ?? MEDIDA_INVALIDA,
    comprimento: medidas[1] ?? MEDIDA_INVALIDA,
    espessura: medidas[2] ?? MEDIDA_INVALIDA,
  };
}

export function calcularAreaPeca(peca: Peca): number {
  const { largura, comprimento } = extrairMedidas(peca.dimensoes);

  if (largura === MEDIDA_INVALIDA || comprimento === MEDIDA_INVALIDA) {
    return MEDIDA_INVALIDA;
  }

  return largura * comprimento;
}

function pecaCabeNaMesa(peca: Peca): boolean {
  const { largura, comprimento } = extrairMedidas(peca.dimensoes);

  const cabeNaPosicaoOriginal =
    largura <= LARGURA_MESA && comprimento <= COMPRIMENTO_MESA;
  const cabeRotacionada =
    comprimento <= LARGURA_MESA && largura <= COMPRIMENTO_MESA;

  return cabeNaPosicaoOriginal || cabeRotacionada;
}

function temTarjaVermelha(peca: Peca): boolean {
  const texto = normalizarTexto(
    `${peca.observacoes ?? ""} ${peca.descricao ?? ""}`
  );

  return peca.urgente === true || texto.includes("vermelha");
}

function compararTexto(a?: string, b?: string): number {
  return normalizarTexto(a).localeCompare(normalizarTexto(b));
}

function compararPrioridades(a: Peca, b: Peca): number {
  const urgenciaA = temTarjaVermelha(a) ? 0 : 1;
  const urgenciaB = temTarjaVermelha(b) ? 0 : 1;

  if (urgenciaA !== urgenciaB) return urgenciaA - urgenciaB;

  const prazoA = prazoFinalTimestamp(a.prazo);
  const prazoB = prazoFinalTimestamp(b.prazo);

  if (prazoA !== prazoB) return prazoA - prazoB;

  const espessuraA = extrairMedidas(a.dimensoes).espessura;
  const espessuraB = extrairMedidas(b.dimensoes).espessura;

  if (espessuraA !== espessuraB) return espessuraA - espessuraB;

  return compararTexto(a.material, b.material);
}

function chaveGrupo(peca: Peca): string {
  return [
    temTarjaVermelha(peca) ? "urgente" : "normal",
    prazoFinalTimestamp(peca.prazo),
    extrairMedidas(peca.dimensoes).espessura,
    normalizarTexto(peca.material),
  ].join("|");
}

function compararParaMontagem(a: Peca, b: Peca): number {
  const diferencaArea = calcularAreaPeca(b) - calcularAreaPeca(a);
  if (diferencaArea !== 0) return diferencaArea;

  const comparacaoOrdem = compararTexto(a.ordem, b.ordem);
  if (comparacaoOrdem !== 0) return comparacaoOrdem;

  return compararTexto(a.desenho, b.desenho);
}

function formarLotesMesa(pecas: Peca[]): LoteMesa[] {
  const lotes: LoteMesa[] = [];
  const pecasPorArea = [...pecas].sort(compararParaMontagem);

  for (const peca of pecasPorArea) {
    const areaPeca = calcularAreaPeca(peca);

    if (!pecaCabeNaMesa(peca) || areaPeca > AREA_UTIL_MESA) {
      lotes.push({
        pecas: [peca],
        areaOcupada: areaPeca,
        aceitaAgrupamento: false,
      });
      continue;
    }

    const loteCompativel = lotes.find(
      (lote) =>
        lote.aceitaAgrupamento &&
        lote.areaOcupada + areaPeca <= AREA_UTIL_MESA
    );

    if (loteCompativel) {
      loteCompativel.pecas.push(peca);
      loteCompativel.areaOcupada += areaPeca;
    } else {
      lotes.push({
        pecas: [peca],
        areaOcupada: areaPeca,
        aceitaAgrupamento: true,
      });
    }
  }

  return lotes;
}

function otimizarMontagensDoGrupo(pecas: Peca[]): Peca[] {
  return formarLotesMesa(pecas).flatMap((lote) => lote.pecas);
}

export function sequenciar725(pecas: Peca[]): Peca[] {
  const pecasOrdenadas = [...pecas].sort(compararPrioridades);
  const grupos = new Map<string, Peca[]>();

  for (const peca of pecasOrdenadas) {
    const chave = chaveGrupo(peca);
    const grupo = grupos.get(chave) ?? [];

    grupo.push(peca);
    grupos.set(chave, grupo);
  }

  return Array.from(grupos.values()).flatMap(otimizarMontagensDoGrupo);
}