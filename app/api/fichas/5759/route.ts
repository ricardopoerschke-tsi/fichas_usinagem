import { NextResponse } from "next/server";
import Papa from "papaparse";

const SHEET_ID = "11T23VDaDuo001eioqpcYVdQhTVUBMAoqKLXTx0j1rv0";
const SHEET_NAME = "5759";

export async function GET() {
  // A exportacao CSV preserva valores alfanumericos em colunas que tambem
  // contem numeros. O endpoint gviz infere o tipo da coluna e descartava M2.
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

  const parsed = Papa.parse(csv, {
    header: true,
    skipEmptyLines: true,
  });

  return NextResponse.json(parsed.data);
}
