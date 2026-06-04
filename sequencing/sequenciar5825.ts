import type { Peca } from "@/types/peca";

type Setup = "morsa" | "vacuo";

export function sequenciar5825(
  sequencia: Peca[],
  setupAtual: Setup
) {
  return [...sequencia];
}