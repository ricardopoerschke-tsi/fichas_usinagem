import type { Peca } from "@/types/peca";
import {
  normalizarTexto,
  prazoInternoTimestamp,
  prioridadeProcessoAdicional,
  prioridadeUrgenciaProdutiva,
} from "./regrasFluxoProdutivo";

type Ferramenta618 = 63 | 100 | 125;

type GrupoOrdem618 = {
  chave: string;
  ordem: string;
  pecas: Peca[];
  possuiUrgenciaManual: boolean;
  possuiUrgenciaProdutiva: boolean;
  menorPrazoInterno: number;
  indiceOriginal: number;
};

const DIAS_ANTECIPACAO_618 = 15;

function normalizarNumero(valor: string): number | null {
  const numero = Number(
    valor
      .replace(",", ".")
      .replace(/[^\d.]/g, "")
  );

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
    .filter((numero): numero is number => numero !== null);

  return {
    espessura: medidas[0] ?? 999999,
    largura: medidas[1] ?? 999999,
    comprimento:
      medidas[2] ??
      medidas[medidas.length - 1] ??
      999999,
  };
}

function cabeNaFerramenta(
  largura: number,
  espessura: number,
  ferramenta: Ferramenta618
): boolean {
  /*
   * A peça pode ser fixada pela largura ou pela espessura.
   * Basta uma das medidas caber na ferramenta.
   */
  return largura <= ferramenta || espessura <= ferramenta;
}

function ferramentaMinima618(peca: Peca): Ferramenta618 {
  const { largura, espessura } = extrairMedidas(
    peca.dimensoes
  );

  if (cabeNaFerramenta(largura, espessura, 63)) {
    return 63;
  }

  if (cabeNaFerramenta(largura, espessura, 100)) {
    return 100;
  }

  return 125;
}

function grupoPrazo618(peca: Peca): number {
  return prazoInternoTimestamp(
    peca.prazo,
    DIAS_ANTECIPACAO_618
  );
}

function temUrgenciaManual618(peca: Peca): boolean {
  return normalizarTexto(
    peca.observacoes
  ).includes("urgente");
}

function prioridadeUrgenciaManual618(
  peca: Peca
): number {
  return temUrgenciaManual618(peca) ? 0 : 1;
}

function getChaveOrdem618(
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

function criarGruposOrdem618(
  pecas: Peca[]
): GrupoOrdem618[] {
  const grupos = new Map<string, GrupoOrdem618>();

  pecas.forEach((peca, indiceOriginal) => {
    const ordem = getChaveOrdem618(peca);

    /*
     * Peças sem Ordem recebem uma chave individual.
     */
    const chave =
      ordem === null
        ? `sem-ordem-${indiceOriginal}`
        : `ordem-${ordem}`;

    const urgenciaManual =
      temUrgenciaManual618(peca);

    const urgenciaProdutiva =
      prioridadeUrgenciaProdutiva(
        peca,
        DIAS_ANTECIPACAO_618
      ) === 0;

    const prazoInterno = grupoPrazo618(peca);
    const grupoExistente = grupos.get(chave);

    if (!grupoExistente) {
      grupos.set(chave, {
        chave,
        ordem: ordem ?? chave,
        pecas: [peca],
        possuiUrgenciaManual: urgenciaManual,
        possuiUrgenciaProdutiva:
          urgenciaProdutiva,
        menorPrazoInterno: prazoInterno,
        indiceOriginal,
      });

      return;
    }

    grupoExistente.pecas.push(peca);

    grupoExistente.possuiUrgenciaManual =
      grupoExistente.possuiUrgenciaManual ||
      urgenciaManual;

    grupoExistente.possuiUrgenciaProdutiva =
      grupoExistente.possuiUrgenciaProdutiva ||
      urgenciaProdutiva;

    grupoExistente.menorPrazoInterno = Math.min(
      grupoExistente.menorPrazoInterno,
      prazoInterno
    );
  });

  return Array.from(grupos.values());
}

function compararGrupos618(
  grupoA: GrupoOrdem618,
  grupoB: GrupoOrdem618
): number {
  /*
   * 1. Ordem com urgência manual.
   */
  if (
    grupoA.possuiUrgenciaManual !==
    grupoB.possuiUrgenciaManual
  ) {
    return grupoA.possuiUrgenciaManual ? -1 : 1;
  }

  /*
   * 2. Ordem com urgência produtiva.
   */
  if (
    grupoA.possuiUrgenciaProdutiva !==
    grupoB.possuiUrgenciaProdutiva
  ) {
    return grupoA.possuiUrgenciaProdutiva ? -1 : 1;
  }

  /*
   * 3. Menor prazo interno da Ordem.
   */
  if (
    grupoA.menorPrazoInterno !==
    grupoB.menorPrazoInterno
  ) {
    return (
      grupoA.menorPrazoInterno -
      grupoB.menorPrazoInterno
    );
  }

  /*
   * 4. Número da Ordem como desempate.
   */
  const comparacaoOrdem =
    grupoA.ordem.localeCompare(
      grupoB.ordem,
      undefined,
      {
        numeric: true,
        sensitivity: "base",
      }
    );

  if (comparacaoOrdem !== 0) {
    return comparacaoOrdem;
  }

  return (
    grupoA.indiceOriginal -
    grupoB.indiceOriginal
  );
}

function ordenarPecasDentroDaOrdem618(
  a: Peca,
  b: Peca
): number {
  /*
   * 1. Urgência manual da peça.
   */
  const urgenciaManualA =
    prioridadeUrgenciaManual618(a);

  const urgenciaManualB =
    prioridadeUrgenciaManual618(b);

  if (urgenciaManualA !== urgenciaManualB) {
    return urgenciaManualA - urgenciaManualB;
  }

  /*
   * 2. Urgência produtiva da peça.
   */
  const urgenciaProdutivaA =
    prioridadeUrgenciaProdutiva(
      a,
      DIAS_ANTECIPACAO_618
    );

  const urgenciaProdutivaB =
    prioridadeUrgenciaProdutiva(
      b,
      DIAS_ANTECIPACAO_618
    );

  if (
    urgenciaProdutivaA !==
    urgenciaProdutivaB
  ) {
    return (
      urgenciaProdutivaA -
      urgenciaProdutivaB
    );
  }

  /*
   * 3. Prazo interno individual.
   */
  const prazoA = grupoPrazo618(a);
  const prazoB = grupoPrazo618(b);

  if (prazoA !== prazoB) {
    return prazoA - prazoB;
  }

  /*
   * 4. Ferramenta.
   *
   * A ferramenta fica acima do processo adicional.
   * Assim, a máquina não troca ferramenta apenas
   * para antecipar uma peça com operação posterior.
   */
  const ferramentaA = ferramentaMinima618(a);
  const ferramentaB = ferramentaMinima618(b);

  if (ferramentaA !== ferramentaB) {
    return ferramentaA - ferramentaB;
  }

  /*
   * 5. Dentro da mesma ferramenta,
   * prioriza processo adicional.
   */
  const processoA =
    prioridadeProcessoAdicional(a);

  const processoB =
    prioridadeProcessoAdicional(b);

  if (processoA !== processoB) {
    return processoA - processoB;
  }

  /*
   * 6. Comprimento.
   */
  const medidasA = extrairMedidas(a.dimensoes);
  const medidasB = extrairMedidas(b.dimensoes);

  if (
    medidasA.comprimento !==
    medidasB.comprimento
  ) {
    return (
      medidasA.comprimento -
      medidasB.comprimento
    );
  }

  /*
   * 7. Material.
   */
  const materialA = normalizarTexto(a.material);
  const materialB = normalizarTexto(b.material);

  const comparacaoMaterial =
    materialA.localeCompare(
      materialB,
      undefined,
      {
        numeric: true,
        sensitivity: "base",
      }
    );

  if (comparacaoMaterial !== 0) {
    return comparacaoMaterial;
  }

  /*
   * 8. Desenho como desempate final.
   */
  const desenhoA = normalizarTexto(a.desenho);
  const desenhoB = normalizarTexto(b.desenho);

  return desenhoA.localeCompare(
    desenhoB,
    undefined,
    {
      numeric: true,
      sensitivity: "base",
    }
  );
}

export function sequenciar618(
  pecas: Peca[]
): Peca[] {
  const grupos =
    criarGruposOrdem618(pecas);

  const gruposOrdenados = [...grupos].sort(
    compararGrupos618
  );

  const sequenciaFinal =
    gruposOrdenados.flatMap((grupo) =>
      [...grupo.pecas].sort(
        ordenarPecasDentroDaOrdem618
      )
    );

  return sequenciaFinal.map(
    (peca, index) => ({
      ...peca,
      sequencia: index + 1,
    })
  );
}