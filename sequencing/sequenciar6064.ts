import type { Peca } from "@/types/peca";

type Setup = "morsa" | "vacuo";

export function sequenciar6064(sequencia: Peca[], setupAtual: Setup) {
  const getSetup = (peca: Peca): Setup =>
    peca.largura <= 400 ? "morsa" : "vacuo";

  const getConjunto = (peca: Peca): string => {
    const obs = peca.observacoes || "";
    const ordem = peca.ordem || "";
    return ordem !== "-" && ordem !== "Sem OF" ? ordem : obs;
  };

  return [...sequencia].sort((a, b) => {
    const prazoA = converterData(a.prazo);
    const prazoB = converterData(b.prazo);

    const setupA = getSetup(a);
    const setupB = getSetup(b);

    const diferencaDias = Math.abs(prazoA - prazoB) / (1000 * 60 * 60 * 24);

    if (a.urgente && !b.urgente) return -1;
    if (!a.urgente && b.urgente) return 1;

    if (prazoA !== prazoB && diferencaDias > 2) {
      return prazoA - prazoB;
    }

    if (setupA === setupAtual && setupB !== setupAtual) return -1;
    if (setupA !== setupAtual && setupB === setupAtual) return 1;

    const conjuntoA = getConjunto(a);
    const conjuntoB = getConjunto(b);

    if (conjuntoA !== conjuntoB) {
      return conjuntoA.localeCompare(conjuntoB);
    }

    if (prazoA !== prazoB) {
      return prazoA - prazoB;
    }

    if (setupAtual === "morsa") {
      return a.largura - b.largura;
    }

    return b.largura - a.largura;
  });
}

function converterData(data: string) {
  if (data === "Hoje") return 0;
  if (data === "Amanhã") return 1;

  const [dia, mes, ano] = data.split("/").map(Number);
  const anoFinal = ano < 100 ? 2000 + ano : ano;

  return new Date(anoFinal, mes - 1, dia).getTime();
}