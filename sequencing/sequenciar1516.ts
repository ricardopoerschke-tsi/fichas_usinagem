import type { Peca } from "@/types/peca";
import {
  dataInicioHoje,
  normalizarTexto,
  prazoInternoTimestamp,
  temProcessoAdicional,
  temUrgenciaProdutiva,
} from "./regrasFluxoProdutivo";

type Ferramenta1516 = 63 | 100 | 125;

type GrupoOrdem1516 = {
  chave: string;
  ordem: string;
  pecas: Peca[];
  indiceOriginal: number;
  possuiUrgenciaManual: boolean;
  possuiUrgenciaProdutiva: boolean;
  possuiPrazoInternoVencido: boolean;
  menorPrazoInterno: number;
};

const DIAS_ANTECIPACAO_1516 = 15;

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
  ferramenta: Ferramenta1516
): boolean {
  /*
   * A peça pode ser fixada pela largura ou pela espessura.
   * Basta uma das duas medidas caber na ferramenta.
   */
  return largura <= ferramenta || espessura <= ferramenta;
}

function ferramentaMinima1516(peca: Peca): Ferramenta1516 {
  const { largura, espessura } = extrairMedidas(peca.dimensoes);

  if (cabeNaFerramenta(largura, espessura, 63)) {
    return 63;
  }

  if (cabeNaFerramenta(largura, espessura, 100)) {
    return 100;
  }

  return 125;
}

function grupoPrazo(peca: Peca): number {
  return prazoInternoTimestamp(
    peca.prazo,
    DIAS_ANTECIPACAO_1516
  );
}

function temUrgenciaManual(peca: Peca): boolean {
  return normalizarTexto(
    peca.observacoes
  ).includes("urgente");
}

function prazoInternoVencido1516(peca: Peca): boolean {
  return grupoPrazo(peca) < dataInicioHoje();
}

function prioridadeUrgenciaManual1516(peca: Peca): number {
  return temUrgenciaManual(peca) ? 0 : 1;
}

function prioridadeUrgenciaProdutiva1516(peca: Peca): number {
  return temUrgenciaProdutiva(
    peca,
    DIAS_ANTECIPACAO_1516
  )
    ? 0
    : 1;
}

function prioridadePrazoVencido1516(peca: Peca): number {
  return prazoInternoVencido1516(peca) ? 0 : 1;
}

function prioridadeProcessoAdicional1516(peca: Peca): number {
  return temProcessoAdicional(peca) ? 0 : 1;
}

function getChaveOrdem1516(peca: Peca): string | null {
  const ordem = normalizarTexto(peca.ordem);

  if (
    !ordem ||
    ordem === "-" ||
    ordem === "SEM OF"
  ) {
    return null;
  }

  return ordem;
}

function criarGruposOrdem1516(
  pecas: Peca[]
): GrupoOrdem1516[] {
  const grupos = new Map<string, GrupoOrdem1516>();

  pecas.forEach((peca, indiceOriginal) => {
    const ordem = getChaveOrdem1516(peca);

    /*
     * Cada peça sem Ordem recebe uma chave individual.
     * Isso impede que todas as peças sem OF formem um único grupo.
     */
    const chave =
      ordem === null
        ? `sem-ordem-${indiceOriginal}`
        : `ordem-${ordem}`;

    const prazoInterno = grupoPrazo(peca);
    const urgenciaManual = temUrgenciaManual(peca);
    const urgenciaProdutiva = temUrgenciaProdutiva(
      peca,
      DIAS_ANTECIPACAO_1516
    );
    const prazoVencido = prazoInternoVencido1516(peca);

    const grupoExistente = grupos.get(chave);

    if (!grupoExistente) {
      grupos.set(chave, {
        chave,
        ordem: ordem ?? chave,
        pecas: [peca],
        indiceOriginal,
        possuiUrgenciaManual: urgenciaManual,
        possuiUrgenciaProdutiva: urgenciaProdutiva,
        possuiPrazoInternoVencido: prazoVencido,
        menorPrazoInterno: prazoInterno,
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

    grupoExistente.possuiPrazoInternoVencido =
      grupoExistente.possuiPrazoInternoVencido ||
      prazoVencido;

    grupoExistente.menorPrazoInterno = Math.min(
      grupoExistente.menorPrazoInterno,
      prazoInterno
    );
  });

  return Array.from(grupos.values());
}

function compararGrupos1516(
  grupoA: GrupoOrdem1516,
  grupoB: GrupoOrdem1516
): number {
  /*
   * 1. Ordens com urgência manual.
   */
  if (
    grupoA.possuiUrgenciaManual !==
    grupoB.possuiUrgenciaManual
  ) {
    return grupoA.possuiUrgenciaManual ? -1 : 1;
  }

  /*
   * 2. Ordens com urgência produtiva.
   */
  if (
    grupoA.possuiUrgenciaProdutiva !==
    grupoB.possuiUrgenciaProdutiva
  ) {
    return grupoA.possuiUrgenciaProdutiva ? -1 : 1;
  }

  /*
   * 3. Ordens com prazo interno vencido.
   */
  if (
    grupoA.possuiPrazoInternoVencido !==
    grupoB.possuiPrazoInternoVencido
  ) {
    return grupoA.possuiPrazoInternoVencido ? -1 : 1;
  }

  /*
   * 4. Menor prazo interno da Ordem.
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
   * 5. Ordem como desempate.
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

  /*
   * 6. Estabilidade pela posição original.
   */
  return grupoA.indiceOriginal - grupoB.indiceOriginal;
}

function ordenarPecasDentroDaOrdem1516(
  a: Peca,
  b: Peca
): number {
  /*
   * 1. Urgência manual individual.
   */
  const urgenciaManualA =
    prioridadeUrgenciaManual1516(a);

  const urgenciaManualB =
    prioridadeUrgenciaManual1516(b);

  if (urgenciaManualA !== urgenciaManualB) {
    return urgenciaManualA - urgenciaManualB;
  }

  /*
   * 2. Urgência produtiva individual.
   */
  const urgenciaProdutivaA =
    prioridadeUrgenciaProdutiva1516(a);

  const urgenciaProdutivaB =
    prioridadeUrgenciaProdutiva1516(b);

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
   * 3. Prazo interno vencido.
   */
  const prazoVencidoA =
    prioridadePrazoVencido1516(a);

  const prazoVencidoB =
    prioridadePrazoVencido1516(b);

  if (prazoVencidoA !== prazoVencidoB) {
    return prazoVencidoA - prazoVencidoB;
  }

  /*
   * 4. Prazo interno individual.
   */
  const prazoA = grupoPrazo(a);
  const prazoB = grupoPrazo(b);

  if (prazoA !== prazoB) {
    return prazoA - prazoB;
  }

  /*
   * 5. Ferramenta.
   *
   * A ferramenta fica acima do processo adicional.
   * Portanto, a máquina não troca de ferramenta apenas
   * para antecipar uma peça com tratamento ou operação posterior.
   */
  const ferramentaA = ferramentaMinima1516(a);
  const ferramentaB = ferramentaMinima1516(b);

  if (ferramentaA !== ferramentaB) {
    return ferramentaA - ferramentaB;
  }

  /*
   * 6. Dentro da mesma ferramenta, prioriza as peças
   * que seguem para processos adicionais.
   */
  const processoAdicionalA =
    prioridadeProcessoAdicional1516(a);

  const processoAdicionalB =
    prioridadeProcessoAdicional1516(b);

  if (
    processoAdicionalA !==
    processoAdicionalB
  ) {
    return (
      processoAdicionalA -
      processoAdicionalB
    );
  }

  /*
   * 7. Comprimento.
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
   * 8. Material.
   */
  const materialA = normalizarTexto(a.material);
  const materialB = normalizarTexto(b.material);

  const comparacaoMaterial =
    materialA.localeCompare(materialB);

  if (comparacaoMaterial !== 0) {
    return comparacaoMaterial;
  }

  /*
   * 9. Desenho como desempate final.
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

export function sequenciar1516(
  pecas: Peca[]
): Peca[] {
  const grupos =
    criarGruposOrdem1516(pecas);

  const gruposOrdenados = [...grupos].sort(
    compararGrupos1516
  );

  const sequenciaFinal =
    gruposOrdenados.flatMap((grupo) =>
      [...grupo.pecas].sort(
        ordenarPecasDentroDaOrdem1516
      )
    );

  return sequenciaFinal.map(
    (peca, index) => ({
      ...peca,
      sequencia: index + 1,
    })
  );
}