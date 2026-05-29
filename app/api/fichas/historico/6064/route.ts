import { NextResponse } from "next/server";
import Papa from "papaparse";

const SHEET_ID = "11T23VDaDuo001eioqpcYVdQhTVUBMAoqKLXTx0j1rv0";
const SHEET_NAME = "Historico_6064";

export async function GET() {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(SHEET_NAME)}`;

  const response = await fetch(url, {
    cache: "no-store",
  });

  if (!response.ok) {
    return NextResponse.json(
      { error: "Erro ao buscar histórico" },
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