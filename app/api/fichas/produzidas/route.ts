import { NextResponse } from "next/server";

const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbyvwSxdmyuIbsNgJAObKvCl6pvrzG-LCct6XE-UkDMLvLI2TqEBJs45RhBkciejGOJJkw/exec";

const TOKEN = "6064_teste_123";

export async function POST(request: Request) {
  try {
    const desenhos = await request.json();

    const response = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify({
        token: TOKEN,
        acao: "produzidas",
        desenhos,
      }),
    });

    const result = await response.json();

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "Erro ao mover peças produzidas",
      },
      { status: 500 }
    );
  }
}