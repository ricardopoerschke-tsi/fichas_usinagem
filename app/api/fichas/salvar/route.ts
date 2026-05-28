import { NextResponse } from "next/server";

const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbyvwSxdmyuIbsNgJAObKvCl6pvrzG-LCct6XE-UkDMLvLI2TqEBJs45RhBkciejGOJJkw/exec";

const TOKEN = "6064_teste_123";

export async function POST(request: Request) {
  try {
    const sequencia = await request.json();

    const response = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify({
        token: TOKEN,
        sequencia,
      }),
    });

    const result = await response.json();

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Erro ao salvar sequência",
      },
      { status: 500 }
    );
  }
}