import type { Peca } from "@/types/peca";

const PROCESSOS_ADICIONAIS = [
  "solda",
  "tempera",
  "tratamento termico",
  "revestimento",
  "oxidacao",
  "cementacao",
];

const UM_DIA_MS = 1000 * 60 * 60 * 24;

export function normalizarTexto(valor?: string): string {
  return (valor ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export function dataInicioHoje(): number {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  return hoje.getTime();
}

export function prazoFinalTimestamp(prazo?: string): number {
  const prazoNormalizado = normalizarTexto(prazo);

  if (!prazoNormalizado) return Number.MAX_SAFE_INTEGER;
  if (prazoNormalizado === "hoje") return dataInicioHoje();
  if (prazoNormalizado === "amanha") return dataInicioHoje() + UM_DIA_MS;

  const partes = prazoNormalizado.split("/");

  if (partes.length !== 3) return Number.MAX_SAFE_INTEGER;

  const dia = Number(partes[0]);
  const mes = Number(partes[1]) - 1;
  const anoInformado = Number(partes[2]);
  const ano = anoInformado < 100 ? 2000 + anoInformado : anoInformado;

  const data = new Date(ano, mes, dia);
  data.setHours(0, 0, 0, 0);

  if (Number.isNaN(data.getTime())) return Number.MAX_SAFE_INTEGER;

  return data.getTime();
}

export function prazoInternoTimestamp(
  prazoFinal?: string,
  diasAntecipacao = 0
): number {
  const prazoFinalCalculado = prazoFinalTimestamp(prazoFinal);

  if (prazoFinalCalculado === Number.MAX_SAFE_INTEGER) {
    return prazoFinalCalculado;
  }

  return prazoFinalCalculado - diasAntecipacao * UM_DIA_MS;
}

export function temProcessoAdicional(peca: Peca): boolean {
  const texto = normalizarTexto(
    [
      peca.descricao,
      peca.observacoes,
      peca.material,
      peca.ordem,
      peca.ordemMes,
    ].join(" ")
  );

  return PROCESSOS_ADICIONAIS.some((processo) => texto.includes(processo));
}

export function temUrgenciaProdutiva(
  peca: Peca,
  diasAntecipacao: number
): boolean {
  const texto = normalizarTexto(`${peca.observacoes ?? ""} ${peca.descricao ?? ""}`);
  const prazoInterno = prazoInternoTimestamp(peca.prazo, diasAntecipacao);

  return (
    peca.urgente === true ||
    texto.includes("urgente") ||
    texto.includes("vermelha") ||
    texto.includes("prioridade") ||
    prazoInterno < dataInicioHoje()
  );
}

export function prioridadeUrgenciaProdutiva(
  peca: Peca,
  diasAntecipacao: number
): number {
  return temUrgenciaProdutiva(peca, diasAntecipacao) ? 0 : 1;
}

export function prioridadeProcessoAdicional(peca: Peca): number {
  return temProcessoAdicional(peca) ? 0 : 1;
}
