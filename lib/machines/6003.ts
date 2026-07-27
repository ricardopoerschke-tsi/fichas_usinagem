import type { Machine } from "@/types/machine";

export const machine6003: Machine = {
  id: "6003",
  numero: "6003",
  nome: "Womat 2",
  tipo: "Fresadora CNC",
  material: "Aço",

  ordem: 11,

  sheetName: "6003",
  historySheetName: "Historico_6003",

  apiFila: "/api/fichas/6003",
  apiHistorico: "/api/fichas/historico/6003",
};
