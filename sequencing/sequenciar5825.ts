import type { Peca } from "@/types/peca";

const MODELO_CASTANHA_5825: Record<number, number> = {
  1: 1,
  2: 1,
  3: 1,
  4: 1,

  5: 2,
  6: 2,
  7: 2,

  // Ø8 é transição entre modelo 2 e 3
  8: 2.5,

  9: 3,
  10: 3,

  11: 4,
  12: 4,
  13: 4,

  14: 5,
  15: 5,
  16: 5,
  17: 5,

  18: 6,
  19: 6,
  20: 6,

  21: 7,
  22: 7,
  23: 7,

  24: 8,
  25: 8,
  26: 8,
  27: 8,
  28: 8,
  29: 8,
  30: 8,
  31: 8,
  32: 8,

  33: 9,
  34: 9,
  35: 9,
  36: 9,
  37: 9,
  38: 9,
  39: 9,
  40: 9,
};

const CASTANHAS_DEDICADAS_5825 = [6, 10, 12, 16, 19, 22, 25, 32];

const BITOLAS_BRUTAS_5825: Record<string, number[]> = {
  ALUMINIO: [9.5, 12.7, 19.5, 25, 32, 38, 50, 63, 76, 88, 101],

  NYLON: [20, 30, 40, 50, 60, 80, 101],

  D6: [12, 15.8, 18, 25, 31, 38, 50, 76],

  "1020": [
    8, 10, 12.7, 15.8, 19, 20, 22, 25.4, 31.7, 38, 44, 50.8, 57, 63, 76,
    88, 101, 114, 127, 139, 152,
  ],

  "4140": [
    8, 10, 12.7, 15.8, 19, 20, 22, 25.4, 31.7, 38, 44, 50.8, 57, 63, 76,
    88, 101, 114, 127, 139, 152,
  ],

  COLUNA: [8, 10, 12, 16, 20, 22, 25, 25.4, 30, 32, 40, 44.45, 45],

  "ACO PRATA": [2.5, 4, 4.3, 4.4, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
};

function normalizarTexto(texto?: string): string {
  return (
    texto
      ?.normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toUpperCase()
      .trim() ?? ""
  );
}

function extrairBitola(dimensoes: string): number | null {
  if (!dimensoes) return null;

  const texto = dimensoes.replace(",", ".");

  const match = texto.match(/(?:Ø|ø)?\s*(\d+(?:\.\d+)?)/i);

  if (!match) return null;

  return Number(match[1]);
}

function converterDataPrazo(prazo?: string): number {
  if (!prazo) return Number.MAX_SAFE_INTEGER;

  const partes = prazo.split("/");

  if (partes.length !== 3) return Number.MAX_SAFE_INTEGER;

  const dia = Number(partes[0]);
  const mes = Number(partes[1]) - 1;
  const ano = Number(partes[2]);

  const data = new Date(ano, mes, dia);

  if (Number.isNaN(data.getTime())) return Number.MAX_SAFE_INTEGER;

  return data.getTime();
}

const JANELA_PRAZO_DIAS_5825 = 2;

function calcularJanelaPrazo(prazo?: string): number {
  const dataPrazo = converterDataPrazo(prazo);

  if (dataPrazo === Number.MAX_SAFE_INTEGER) return 999999;

  const dias = Math.floor(dataPrazo / (1000 * 60 * 60 * 24));

  return Math.floor(dias / JANELA_PRAZO_DIAS_5825);
}

function calcularFaixaPrazo(prazo?: string): number {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const dataPrazo = converterDataPrazo(prazo);

  if (dataPrazo === Number.MAX_SAFE_INTEGER) return 999;

  const diferencaDias = Math.ceil(
    (dataPrazo - hoje.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diferencaDias < 0) return 0; // vencido
  if (diferencaDias <= 7) return 1;
  if (diferencaDias <= 15) return 2;
  if (diferencaDias <= 30) return 3;

  return 4;
}

function quantidadeNumero(quantidade?: string): number {
  if (!quantidade) return 0;

  const numero = Number(String(quantidade).replace(",", "."));

  return Number.isNaN(numero) ? 0 : numero;
}

function calcularBitolaBruta(
  material: string | undefined,
  diametroFinal: number | null
): number | null {
  if (diametroFinal === null) return null;

  const materialNormalizado = normalizarTexto(material);
  const bitolas = BITOLAS_BRUTAS_5825[materialNormalizado];

  if (!bitolas) return diametroFinal;

  return bitolas.find((bitola) => bitola >= diametroFinal) ?? diametroFinal;
}

function calcularBitolaBase(bitola: number | null): number {
  if (bitola === null || Number.isNaN(bitola)) return 999;

  return Math.round(bitola);
}

function calcularModeloCastanha(bitolaBruta: number | null): number {
  const bitolaBase = calcularBitolaBase(bitolaBruta);

  return MODELO_CASTANHA_5825[bitolaBase] ?? 999;
}

function prioridadeCastanhaDedicada(
  bitolaBruta: number | null,
  quantidade?: string
): number {
  const bitolaBase = calcularBitolaBase(bitolaBruta);
  const qtd = quantidadeNumero(quantidade);

  if (qtd > 30 && CASTANHAS_DEDICADAS_5825.includes(bitolaBase)) {
    return 0;
  }

  return 1;
}

function prioridadeUrgencia(peca: Peca): number {
  return peca.urgente ? 0 : 1;
}

function compararPecas5825(a: Peca, b: Peca): number {
  const diametroFinalA = extrairBitola(a.dimensoes);
  const diametroFinalB = extrairBitola(b.dimensoes);

  const bitolaBrutaA = calcularBitolaBruta(a.material, diametroFinalA);
  const bitolaBrutaB = calcularBitolaBruta(b.material, diametroFinalB);

  const urgenciaA = prioridadeUrgencia(a);
  const urgenciaB = prioridadeUrgencia(b);

  const janelaPrazoA = calcularJanelaPrazo(a.prazo);
  const janelaPrazoB = calcularJanelaPrazo(b.prazo);

  const prazoA = converterDataPrazo(a.prazo);
  const prazoB = converterDataPrazo(b.prazo);

  const dedicadaA = prioridadeCastanhaDedicada(bitolaBrutaA, a.quantidade);
  const dedicadaB = prioridadeCastanhaDedicada(bitolaBrutaB, b.quantidade);

  const modeloA = calcularModeloCastanha(bitolaBrutaA);
  const modeloB = calcularModeloCastanha(bitolaBrutaB);

  const materialA = normalizarTexto(a.material);
  const materialB = normalizarTexto(b.material);

  if (urgenciaA !== urgenciaB) return urgenciaA - urgenciaB;

  if (janelaPrazoA !== janelaPrazoB)
    return janelaPrazoA - janelaPrazoB;

  if (dedicadaA !== dedicadaB)
    return dedicadaA - dedicadaB;

  if (modeloA !== modeloB)
    return modeloA - modeloB;

  if (prazoA !== prazoB)
    return prazoA - prazoB;

  const comparacaoMaterial = materialA.localeCompare(materialB);
  if (comparacaoMaterial !== 0) return comparacaoMaterial;

  if ((bitolaBrutaA ?? 999) !== (bitolaBrutaB ?? 999)) {
    return (bitolaBrutaA ?? 999) - (bitolaBrutaB ?? 999);
  }

  return (diametroFinalA ?? 999) - (diametroFinalB ?? 999);
}

function menorPrazoDoGrupo(grupo: Peca[]): number {
  return grupo.reduce(
    (menorPrazo, peca) => Math.min(menorPrazo, converterDataPrazo(peca.prazo)),
    Number.MAX_SAFE_INTEGER
  );
}

function ordemValida(ordem?: string): string | null {
  const ordemNormalizada = normalizarTexto(ordem);

  if (
    !ordemNormalizada ||
    ordemNormalizada === "-" ||
    ordemNormalizada === "SEM OF"
  ) {
    return null;
  }

  return ordem?.trim() ?? null;
}

export function sequenciar5825(pecas: Peca[]): Peca[] {
  const grupos = new Map<string, Peca[]>();

  pecas.forEach((peca, index) => {
    const ordem = ordemValida(peca.ordem);
    const chave =
      ordem === null ? "SEM-ORDEM-" + index : "ORDEM-" + ordem;
    const grupo = grupos.get(chave);

    if (grupo) {
      grupo.push(peca);
    } else {
      grupos.set(chave, [peca]);
    }
  });

  const gruposOrdenados = Array.from(grupos.values()).map((grupo, index) => ({
    pecas: [...grupo].sort(compararPecas5825),
    indiceOriginal: index,
  }));

  gruposOrdenados.sort((a, b) => {
    const urgenciaA = a.pecas.some((peca) => peca.urgente) ? 0 : 1;
    const urgenciaB = b.pecas.some((peca) => peca.urgente) ? 0 : 1;

    if (urgenciaA !== urgenciaB) return urgenciaA - urgenciaB;

    const menorPrazoA = menorPrazoDoGrupo(a.pecas);
    const menorPrazoB = menorPrazoDoGrupo(b.pecas);

    if (menorPrazoA !== menorPrazoB) return menorPrazoA - menorPrazoB;

    const comparacaoPrimeirasPecas = compararPecas5825(
      a.pecas[0],
      b.pecas[0]
    );
    if (comparacaoPrimeirasPecas !== 0) return comparacaoPrimeirasPecas;

    return a.indiceOriginal - b.indiceOriginal;
  });

  return gruposOrdenados.flatMap((grupo) => grupo.pecas);
}
