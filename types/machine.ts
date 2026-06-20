export type Machine = {
  id: string;
  numero: string;
  nome: string;
  descricao?: string;
  tipo: string;
  material: string;

  sheetName: string;
  historySheetName: string;

  apiFila: string;
  apiHistorico: string;
};