import type { Peca } from "@/types/peca";
import {
  normalizarTexto,
  prazoFinalTimestamp,
} from "./regrasFluxoProdutivo";

const LARGURA_MESA = 700;
const COMPRIMENTO_MESA = 400;
const AREA_UTIL_MESA = LARGURA_MESA * COMPRIMENTO_MESA;
const MEDIDA_INVALIDA = Number.MAX_SAFE_INTEGER;

const PROCESSOS_EXTERNOS_725 = [
  "solda",
  "retifica",
  "tratamento termico",
  "trat termico",
  "tempera",
  "oxidacao",
  "revestimento",
  "nitretacao",
  "cementacao",
];

type Medidas725 = {
  largura: number;
  comprimento: number;
  espessura: number;
};

type LoteMesa725 = {
  pecas: Peca[];
  areaOcupada: number;
  aceitaAgrupamento: boolean;
};

type GrupoOrdem725 = {
  chave: string;
  ordem: string;
  pecas: Peca[];
  possuiUrgencia: boolean;
  menorPrazo: number;
  indiceOriginal: number;
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

export function calcularAreaPeca725(peca: Peca): number {
  const { largura, comprimento } = extrairMedidas(
    peca.dimensoes
  );

  if (
    largura === MEDIDA_INVALIDA ||
    comprimento === MEDIDA_INVALIDA
  ) {
    return MEDIDA_INVALIDA;
  }

  return largura * comprimento;
}

function pecaCabeNaMesa725(peca: Peca): boolean {
  const { largura, comprimento } = extrairMedidas(
    peca.dimensoes
  );

  if (
    largura === MEDIDA_INVALIDA ||
    comprimento === MEDIDA_INVALIDA
  ) {
    return false;
  }

  const cabeNaPosicaoOriginal =
    largura <= LARGURA_MESA &&
    comprimento <= COMPRIMENTO_MESA;

  const cabeRotacionada =
    comprimento <= LARGURA_MESA &&
    largura <= COMPRIMENTO_MESA;

  return cabeNaPosicaoOriginal || cabeRotacionada;
}

function temTarjaVermelha725(peca: Peca): boolean {
  const texto = normalizarTexto(
    [
      peca.observacoes,
      peca.descricao,
    ].join(" ")
  );

  return (
    peca.urgente === true ||
    texto.includes("urgente") ||
    texto.includes("vermelha")
  );
}

function temProcessoExterno725(peca: Peca): boolean {
  const texto = normalizarTexto(
    [
      peca.descricao,
      peca.observacoes,
      peca.material,
      peca.ordem,
      peca.ordemMes,
    ].join(" ")
  );

  return PROCESSOS_EXTERNOS_725.some((processo) =>
    texto.includes(normalizarTexto(processo))
  );
}

function prioridadeProcessoExterno725(
  peca: Peca
): number {
  return temProcessoExterno725(peca) ? 0 : 1;
}

function compararTexto725(
  a?: string,
  b?: string
): number {
  return normalizarTexto(a).localeCompare(
    normalizarTexto(b),
    undefined,
    {
      numeric: true,
      sensitivity: "base",
    }
  );
}

function getChaveOrdem725(
  peca: Peca
): string | null {
  const ordem = normalizarTexto(peca.ordem);

  if (
    !ordem ||
    ordem === "-" ||
    ordem === "sem ordem" ||
    ordem === "sem of"
  ) {
    return null;
  }

  return ordem;
}

function criarGruposOrdem725(
  pecas: Peca[]
): GrupoOrdem725[] {
  const grupos = new Map<string, GrupoOrdem725>();

  pecas.forEach((peca, indiceOriginal) => {
    const ordem = getChaveOrdem725(peca);

    /*
     * Peças sem Ordem recebem uma chave individual.
     * Isso impede que todas as peças sem Ordem sejam
     * tratadas como um único conjunto.
     */
    const chave =
      ordem === null
        ? `sem-ordem-${indiceOriginal}`
        : `ordem-${ordem}`;

    const prazo = prazoFinalTimestamp(peca.prazo);
    const urgente = temTarjaVermelha725(peca);

    const grupoExistente = grupos.get(chave);

    if (!grupoExistente) {
      grupos.set(chave, {
        chave,
        ordem: ordem ?? chave,
        pecas: [peca],
        possuiUrgencia: urgente,
        menorPrazo: prazo,
        indiceOriginal,
      });

      return;
    }

    grupoExistente.pecas.push(peca);

    grupoExistente.possuiUrgencia =
      grupoExistente.possuiUrgencia || urgente;

    grupoExistente.menorPrazo = Math.min(
      grupoExistente.menorPrazo,
      prazo
    );
  });

  return Array.from(grupos.values());
}

function compararGruposOrdem725(
  grupoA: GrupoOrdem725,
  grupoB: GrupoOrdem725
): number {
  /*
   * 1. Ordens com pelo menos uma peça urgente.
   */
  if (
    grupoA.possuiUrgencia !==
    grupoB.possuiUrgencia
  ) {
    return grupoA.possuiUrgencia ? -1 : 1;
  }

  /*
   * 2. Menor prazo da Ordem.
   */
  if (
    grupoA.menorPrazo !==
    grupoB.menorPrazo
  ) {
    return grupoA.menorPrazo - grupoB.menorPrazo;
  }

  /*
   * 3. Número da Ordem como desempate.
   */
  const comparacaoOrdem = compararTexto725(
    grupoA.ordem,
    grupoB.ordem
  );

  if (comparacaoOrdem !== 0) {
    return comparacaoOrdem;
  }

  /*
   * 4. Mantém estabilidade pela posição original.
   */
  return (
    grupoA.indiceOriginal -
    grupoB.indiceOriginal
  );
}

function getChaveSetup725(peca: Peca): string {
  const medidas = extrairMedidas(peca.dimensoes);

  return [
    medidas.espessura,
    normalizarTexto(peca.material),
  ].join("|");
}

function compararParaMontagem725(
  a: Peca,
  b: Peca
): number {
  /*
   * Peças com processo externo entram primeiro
   * dentro do mesmo setup.
   */
  const processoA =
    prioridadeProcessoExterno725(a);

  const processoB =
    prioridadeProcessoExterno725(b);

  if (processoA !== processoB) {
    return processoA - processoB;
  }

  /*
   * Para montagem da mesa, começa pelas peças maiores.
   */
  const areaA = calcularAreaPeca725(a);
  const areaB = calcularAreaPeca725(b);

  if (areaA !== areaB) {
    return areaB - areaA;
  }

  const comparacaoDesenho = compararTexto725(
    a.desenho,
    b.desenho
  );

  if (comparacaoDesenho !== 0) {
    return comparacaoDesenho;
  }

  return compararTexto725(
    a.ordemMes,
    b.ordemMes
  );
}

function formarLotesMesa725(
  pecas: Peca[]
): LoteMesa725[] {
  const lotes: LoteMesa725[] = [];

  const pecasOrdenadas = [...pecas].sort(
    compararParaMontagem725
  );

  for (const peca of pecasOrdenadas) {
    const areaPeca = calcularAreaPeca725(peca);

    /*
     * Peças inválidas ou maiores que a mesa ficam
     * em um lote individual para revisão.
     */
    if (
      !pecaCabeNaMesa725(peca) ||
      areaPeca === MEDIDA_INVALIDA ||
      areaPeca > AREA_UTIL_MESA
    ) {
      lotes.push({
        pecas: [peca],
        areaOcupada: areaPeca,
        aceitaAgrupamento: false,
      });

      continue;
    }

    /*
     * Primeiro tenta preencher um lote já aberto.
     *
     * O cálculo ainda é baseado em área. Portanto,
     * representa uma estimativa de ocupação da mesa,
     * não uma validação geométrica completa.
     */
    const loteCompativel = lotes.find(
      (lote) =>
        lote.aceitaAgrupamento &&
        lote.areaOcupada + areaPeca <=
          AREA_UTIL_MESA
    );

    if (loteCompativel) {
      loteCompativel.pecas.push(peca);
      loteCompativel.areaOcupada += areaPeca;

      continue;
    }

    lotes.push({
      pecas: [peca],
      areaOcupada: areaPeca,
      aceitaAgrupamento: true,
    });
  }

  return lotes;
}

function otimizarOrdem725(
  pecas: Peca[]
): Peca[] {
  /*
   * Dentro da Ordem, agrupamos primeiro por setup:
   *
   * - espessura;
   * - material.
   *
   * Isso evita alternâncias desnecessárias, mas não
   * interfere na escolha da Ordem.
   */
  const gruposSetup = new Map<string, Peca[]>();

  for (const peca of pecas) {
    const chave = getChaveSetup725(peca);
    const grupo = gruposSetup.get(chave) ?? [];

    grupo.push(peca);
    gruposSetup.set(chave, grupo);
  }

  /*
   * Define a ordem dos grupos de setup.
   *
   * Primeiro entra o grupo que contém operação externa.
   * Depois, menor espessura e material.
   */
  const gruposOrdenados = Array.from(
    gruposSetup.values()
  ).sort((grupoA, grupoB) => {
    const possuiProcessoA = grupoA.some(
      temProcessoExterno725
    );

    const possuiProcessoB = grupoB.some(
      temProcessoExterno725
    );

    if (possuiProcessoA !== possuiProcessoB) {
      return possuiProcessoA ? -1 : 1;
    }

    const medidasA = extrairMedidas(
      grupoA[0]?.dimensoes
    );

    const medidasB = extrairMedidas(
      grupoB[0]?.dimensoes
    );

    if (
      medidasA.espessura !==
      medidasB.espessura
    ) {
      return (
        medidasA.espessura -
        medidasB.espessura
      );
    }

    return compararTexto725(
      grupoA[0]?.material,
      grupoB[0]?.material
    );
  });

  return gruposOrdenados.flatMap((grupo) =>
    formarLotesMesa725(grupo).flatMap(
      (lote) => lote.pecas
    )
  );
}

export function sequenciar725(
  pecas: Peca[]
): Peca[] {
  /*
   * 1. Cria os grupos por Ordem.
   */
  const gruposOrdem =
    criarGruposOrdem725(pecas);

  /*
   * 2. Escolhe a sequência das Ordens por:
   *
   * - urgência;
   * - menor prazo;
   * - número da Ordem.
   */
  const gruposOrdenados = [
    ...gruposOrdem,
  ].sort(compararGruposOrdem725);

  /*
   * 3. Mantém cada Ordem junta e otimiza
   * internamente os setups e montagens.
   */
  const sequenciaFinal =
    gruposOrdenados.flatMap((grupo) =>
      otimizarOrdem725(grupo.pecas)
    );

  /*
   * 4. Atualiza a sequência visual.
   */
  return sequenciaFinal.map(
    (peca, index) => ({
      ...peca,
      sequencia: index + 1,
    })
  );
}