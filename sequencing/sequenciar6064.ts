import type { Peca } from "@/types/peca";

type Setup = "morsa" | "vacuo";

type ItemSequenciamento = {
  peca: Peca;
  indiceOriginal: number;
};

type GrupoOrdem = {
  chave: string;
  itens: ItemSequenciamento[];
  indiceOriginal: number;
};

const DOIS_DIAS_EM_MS = 2 * 24 * 60 * 60 * 1000;

export function sequenciar6064(
  sequencia: Peca[],
  setupAtual: Setup
): Peca[] {
  const getSetup = (peca: Peca): Setup =>
    peca.largura <= 400 ? "morsa" : "vacuo";

  const getOrdemValida = (peca: Peca): string | null => {
    const ordem = String(peca.ordem ?? "").trim();

    if (
      ordem === "" ||
      ordem === "-" ||
      ordem.toLowerCase() === "sem of"
    ) {
      return null;
    }

    return ordem;
  };

  const temOperacaoPosterior = (peca: Peca): boolean => {
    const observacoes = normalizarTexto(peca.observacoes ?? "");

    const processosPosteriores = [
      "solda",
      "tempera",
      "oxidacao",
      "revestimento",
      "tratamento",
      "nitretacao",
      "zincagem",
    ];

    return processosPosteriores.some((processo) =>
      observacoes.includes(processo)
    );
  };

  const grupos = new Map<string, GrupoOrdem>();

  sequencia.forEach((peca, indiceOriginal) => {
    const ordem = getOrdemValida(peca);

    /*
     * Peças sem Ordem válida recebem uma chave individual.
     * Isso evita que todas as peças sem OF sejam agrupadas juntas.
     */
    const chave = ordem
      ? `ordem:${ordem}`
      : `sem-ordem:${indiceOriginal}`;

    const grupoExistente = grupos.get(chave);

    if (grupoExistente) {
      grupoExistente.itens.push({
        peca,
        indiceOriginal,
      });

      return;
    }

    grupos.set(chave, {
      chave,
      itens: [
        {
          peca,
          indiceOriginal,
        },
      ],
      indiceOriginal,
    });
  });

  const gruposOrdenados = [...grupos.values()].sort((grupoA, grupoB) => {
    const grupoAUrgente = grupoA.itens.some(({ peca }) => peca.urgente);
    const grupoBUrgente = grupoB.itens.some(({ peca }) => peca.urgente);

    if (grupoAUrgente && !grupoBUrgente) return -1;
    if (!grupoAUrgente && grupoBUrgente) return 1;

    const prazoA = getMenorPrazo(grupoA.itens);
    const prazoB = getMenorPrazo(grupoB.itens);

    const diferencaPrazos = Math.abs(prazoA - prazoB);

    /*
     * Quando a diferença for maior que dois dias,
     * o menor prazo possui prioridade.
     */
    if (prazoA !== prazoB && diferencaPrazos > DOIS_DIAS_EM_MS) {
      return prazoA - prazoB;
    }

    /*
     * Dentro da janela de dois dias, prioriza uma Ordem que
     * tenha peças compatíveis com o setup atual.
     */
    const grupoATemSetupAtual = grupoA.itens.some(
      ({ peca }) => getSetup(peca) === setupAtual
    );

    const grupoBTemSetupAtual = grupoB.itens.some(
      ({ peca }) => getSetup(peca) === setupAtual
    );

    if (grupoATemSetupAtual && !grupoBTemSetupAtual) return -1;
    if (!grupoATemSetupAtual && grupoBTemSetupAtual) return 1;

    /*
     * Se os grupos continuarem equivalentes, utiliza o menor prazo.
     */
    if (prazoA !== prazoB) {
      return prazoA - prazoB;
    }

    /*
     * Mantém estabilidade quando todos os critérios forem iguais.
     */
    return grupoA.indiceOriginal - grupoB.indiceOriginal;
  });

  return gruposOrdenados.flatMap((grupo) => {
    return [...grupo.itens]
      .sort((itemA, itemB) => {
        const pecaA = itemA.peca;
        const pecaB = itemB.peca;

        /*
         * Dentro da Ordem, peças urgentes continuam na frente.
         */
        if (pecaA.urgente && !pecaB.urgente) return -1;
        if (!pecaA.urgente && pecaB.urgente) return 1;

        const setupA = getSetup(pecaA);
        const setupB = getSetup(pecaB);

        /*
         * Dentro da Ordem, o setup possui prioridade sobre
         * tratamentos ou operações posteriores.
         */
        if (setupA === setupAtual && setupB !== setupAtual) return -1;
        if (setupA !== setupAtual && setupB === setupAtual) return 1;

        /*
         * Quando as peças pertencem ao mesmo bloco de setup,
         * prioriza as que seguem para outra operação.
         */
        const operacaoPosteriorA = temOperacaoPosterior(pecaA);
        const operacaoPosteriorB = temOperacaoPosterior(pecaB);

        if (operacaoPosteriorA && !operacaoPosteriorB) return -1;
        if (!operacaoPosteriorA && operacaoPosteriorB) return 1;

        const prazoA = converterData(pecaA.prazo);
        const prazoB = converterData(pecaB.prazo);

        if (prazoA !== prazoB) {
          return prazoA - prazoB;
        }

        /*
         * Mantém o critério atual de largura:
         * - morsa: largura crescente;
         * - vácuo: largura decrescente.
         */
        if (setupA === "morsa" && setupB === "morsa") {
          const diferencaLargura = pecaA.largura - pecaB.largura;

          if (diferencaLargura !== 0) {
            return diferencaLargura;
          }
        }

        if (setupA === "vacuo" && setupB === "vacuo") {
          const diferencaLargura = pecaB.largura - pecaA.largura;

          if (diferencaLargura !== 0) {
            return diferencaLargura;
          }
        }

        return itemA.indiceOriginal - itemB.indiceOriginal;
      })
      .map(({ peca }) => peca);
  });
}

function getMenorPrazo(itens: ItemSequenciamento[]): number {
  return Math.min(
    ...itens.map(({ peca }) => converterData(peca.prazo))
  );
}

function normalizarTexto(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function converterData(data: string) {
  if (data === "Hoje") return 0;
  if (data === "Amanhã") return 1;

  const [dia, mes, ano] = data.split("/").map(Number);
  const anoFinal = ano < 100 ? 2000 + ano : ano;

  return new Date(anoFinal, mes - 1, dia).getTime();
}