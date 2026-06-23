import { NextResponse } from "next/server";
import { machinesById } from "@/lib/machines";

const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbyvwSxdmyuIbsNgJAObKvCl6pvrzG-LCct6XE-UkDMLvLI2TqEBJs45RhBkciejGOJJkw/exec";

const TOKEN = "6064_teste_123";

type ItemSequencia = {
  sequencia: number;
  desenho: string;
};

function isItemSequencia(item: unknown): item is ItemSequencia {
  if (!item || typeof item !== "object") return false;

  const candidato = item as Partial<ItemSequencia>;

  return (
    Number.isInteger(candidato.sequencia) &&
    Number(candidato.sequencia) > 0 &&
    typeof candidato.desenho === "string" &&
    candidato.desenho.trim().length > 0
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const maquinaId = String(body?.maquinaId ?? "");
    const sequencia = body?.sequencia;

    if (!(maquinaId in machinesById)) {
      return NextResponse.json(
        {
          success: false,
          error: `Maquina nao cadastrada: ${maquinaId || "nao informada"}`,
        },
        { status: 400 }
      );
    }

    if (!Array.isArray(sequencia) || !sequencia.every(isItemSequencia)) {
      return NextResponse.json(
        {
          success: false,
          error: "Payload de sequencia invalido",
          details: "Esperado: { maquinaId, sequencia: [{ sequencia, desenho }] }",
        },
        { status: 400 }
      );
    }

    const payload = {
      token: TOKEN,
      acao: "salvarSequencia",
      maquinaId,
      sequencia: sequencia.map(({ sequencia, desenho }: ItemSequencia) => ({
        sequencia,
        desenho,
      })),
    };

    const response = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    let result: unknown;

    try {
      result = JSON.parse(responseText);
    } catch {
      console.error("Resposta invalida do Apps Script ao persistir sequencia", {
        status: response.status,
        statusText: response.statusText,
        resposta: responseText,
        maquinaId,
      });

      return NextResponse.json(
        {
          success: false,
          error: "Resposta invalida do Apps Script",
          details: responseText,
        },
        { status: 502 }
      );
    }

    if (!result || typeof result !== "object" || Array.isArray(result)) {
      console.error("Resposta inesperada do Apps Script", {
        status: response.status,
        statusText: response.statusText,
        resposta: result,
        maquinaId,
      });

      return NextResponse.json(
        {
          success: false,
          error: "Resposta inesperada do Apps Script",
          details: result,
        },
        { status: 502 }
      );
    }

    const appsScriptResult = result as {
      success?: boolean;
      error?: string;
      [key: string]: unknown;
    };

    if (!response.ok || !appsScriptResult.success) {
      console.error("Apps Script falhou ao persistir sequencia", {
        status: response.status,
        statusText: response.statusText,
        resposta: appsScriptResult,
        maquinaId,
      });

      return NextResponse.json(
        {
          ...appsScriptResult,
          success: false,
          error: appsScriptResult.error || "Apps Script nao persistiu a sequencia",
        },
        { status: response.ok ? 502 : response.status }
      );
    }

    return NextResponse.json(appsScriptResult);
  } catch (error) {
    console.error("Erro ao salvar sequencia", error);

    return NextResponse.json(
      {
        success: false,
        error: "Erro ao salvar sequência",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
