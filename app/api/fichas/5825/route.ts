import { NextResponse } from "next/server";
import Papa from "papaparse";
import type { Peca } from "@/types/peca";

const SHEET_ID = "11T23VDaDuo001eioqpcYVdQhTVUBMAoqKLXTx0j1rv0";
const SHEET_NAME = "5825";

type LinhaPlanilha5825 = {
  Sequência?: string;
  Desenho?: string;
  "Ordem mes"?: string;
  Descrição?: string;
  Quantidade?: string;
  Material?: string;
  Dimensões?: string;
  Ordem?: string;
  Prazo?: string;
  Observações?: string;
};

export async function GET() {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(SHEET_NAME)}`;

  const response = await fetch(url, {
    cache: "no-store",
  });

  if (!response.ok) {
    return NextResponse.json(
      { error: "Erro ao buscar planilha" },
      { status: 500 }
    );
  }

  const csv = await response.text();

  const parsed = Papa.parse<LinhaPlanilha5825>(csv, {
    header: true,
    skipEmptyLines: true,
  });

  const fichas: Peca[] = parsed.data.map((linha) => ({
    desenho: linha.Desenho ?? "",
    descricao: linha.Descrição ?? "",
    dimensoes: linha.Dimensões ?? "",
    largura: 0,
    prazo: linha.Prazo ?? "",
    quantidade: linha.Quantidade ?? "",
    urgente: (linha.Observações ?? "").toLowerCase().includes("urgente"),
    ordem: linha.Ordem ?? "",
    ordemMes: linha["Ordem mes"] ?? "",
    observacoes: linha.Observações ?? "",
    material: linha.Material ?? "",
  }));

  return NextResponse.json(fichas);
}
