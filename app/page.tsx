"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { Peca } from "@/types/peca";
import { machine6064 } from "@/lib/machines/6064";
import { machines } from "@/lib/machines";
import { sequenciar6064 } from "@/sequencing/sequenciar6064";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { ActionCard } from "@/components/ui/ActionCard";
import {
  ArrowLeft,
  Factory,
  ListChecks,
  Edit3,
  Eye,
  PlusCircle,
  GripVertical,
  AlertTriangle,
  History,
  CheckCircle2,
  Printer,
} from "lucide-react";

type Pagina = "home" | "maquina" | "verSequencia" | "editarSequencia" | "historico";
type Setup = "morsa" | "vacuo";
type SetupForcado = "nenhum" | Setup;

type ButtonProps = {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "outline";
  disabled?: boolean;
  onClick?: () => void;
};

export default function Sequenciador6064() {
  const [pagina, setPagina] = useState<Pagina>("home");
  const [setupAtual, setSetupAtual] = useState<Setup>("morsa");
  const [sequencia, setSequencia] = useState<Peca[]>([]);
  const [maquinaSelecionada, setMaquinaSelecionada] = useState(machine6064);
  const [historico, setHistorico] = useState<Peca[]>([]);
  const [selecionadas, setSelecionadas] = useState<string[]>([]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  useEffect(() => {
    async function carregarDados() {
      try {
        const response = await fetch(maquinaSelecionada.apiFila);
        const data = await response.json();

        const convertido: Peca[] = data.map((item: any) => ({
          desenho: item["Desenho"] || "",
          descricao: item["Descrição"] || "",
          dimensoes: item["Dimensões"] || "",
          largura: extrairLargura(item["Dimensões"] || ""),
          prazo: item["Prazo"] || "",
          quantidade: item["Quantidade"] || "",
          ordem: item["Ordem"] || "",
          observacoes: item["Observações"] || "",
          urgente: (item["Observações"] || "").toLowerCase().includes("urgente"),
        }));

        setSequencia(convertido);
      } catch (error) {
        console.error("Erro ao carregar planilha:", error);
      }
    }

    async function carregarHistorico() {
      try {
        const response = await fetch(maquinaSelecionada.apiHistorico);
        const data = await response.json();
        const convertido: Peca[] = data.map((item: any) => ({
          desenho: item["Desenho"] || "",
          descricao: item["Descrição"] || "",
          dimensoes: item["Dimensões"] || "",
          largura: extrairLargura(item["Dimensões"] || ""),
          prazo: item["Prazo"] || "",
          urgente: false,
          dataProduzido: item["Data Produção"] || "",
        }));

        setHistorico(convertido);
      } catch (error) {
        console.error("Erro ao carregar histórico:", error);
      }
    }

    carregarDados();
    carregarHistorico();
  }, [maquinaSelecionada]);

  const maquina = {
    ...maquinaSelecionada,
    fila: sequencia.length,
  };

 const sequenciaSugerida = useMemo(() => {
  return sequenciar6064(sequencia, setupAtual);
}, [setupAtual, sequencia]);

  function criarSequencia() {
    const hoje = formatarDataHoje();
    const novaSequencia = sequenciaSugerida.map((peca) => ({
      ...peca,
      dataSequenciamento: peca.dataSequenciamento || hoje,
    }));

    setSequencia(novaSequencia);
    setPagina("editarSequencia");
  }

  function moverItem(origem: number | null, destino: number) {
    if (origem === destino || origem === null) return;

    const nova = [...sequencia];
    const [item] = nova.splice(origem, 1);
    nova.splice(destino, 0, item);
    setSequencia(nova);
  }

  function alternarSelecao(desenho: string) {
    setSelecionadas((atuais) =>
      atuais.includes(desenho)
        ? atuais.filter((item) => item !== desenho)
        : [...atuais, desenho]
    );
  }

  function imprimirSequencia() {
    window.print();
  }

 async function salvarSequencia() {
  try {
    const payload = sequencia.map((peca, index) => ({
      sequencia: index + 1,
      desenho: peca.desenho,
    }));

    const response = await fetch("/api/fichas/salvar", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        maquinaId: maquinaSelecionada.id,
        sequencia: payload,
      }),
    });

    const result = await response.json();

    console.log(result);

    alert("Sequência salva com sucesso!");
  } catch (error) {
    console.error(error);

    alert("Erro ao salvar sequência");
  }
}

async function marcarProduzidas() {
  if (selecionadas.length === 0) return;

  try {
    const response = await fetch("/api/fichas/produzidas", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        maquinaId: maquinaSelecionada.id,
        desenhos: selecionadas,
      }),
    });

    const result = await response.json();

    if (!result.success) {
      alert("Erro ao marcar produzidas");
      return;
    }

    setSequencia((atual) =>
      atual.filter((peca) => !selecionadas.includes(peca.desenho))
    );

    setSelecionadas([]);

    alert(`Peças produzidas movidas para o histórico: ${result.movidas}`);
  } catch (error) {
    console.error(error);
    alert("Erro ao marcar peças como produzidas");
  }
}
  function getSetupLabel(peca: Peca) {
    return peca.largura <= 400 ? "Morsa" : "Vácuo";
  }

  if (pagina === "historico") {
    return (
      <div className="min-h-screen bg-slate-100 p-6">
        <div className="mx-auto max-w-6xl space-y-6">
          <Button variant="outline" onClick={() => setPagina("maquina")} className="gap-2">
            <ArrowLeft size={18} /> Voltar
          </Button>

          <Card className="rounded-2xl shadow-md">
            <CardContent className="p-6">
              <h1 className="text-3xl font-bold">Histórico - {maquina.numero} {maquina.nome}</h1>
              <p className="mt-2 text-slate-600">Consulta das peças já produzidas, com data de sequenciamento e data de conclusão.</p>
            </CardContent>
          </Card>

          {historico.length === 0 ? (
            <div className="rounded-2xl bg-white p-6 text-center text-slate-500 shadow-sm">
              Nenhuma peça produzida registrada no histórico.
            </div>
          ) : (
            <div className="space-y-3">
              {historico.map((peca, index) => (
                <div key={`${peca.desenho}-hist-${index}`} className="rounded-2xl bg-white p-4 shadow-sm">
                  <div className="grid gap-3 md:grid-cols-[1fr_150px_150px_120px] md:items-center">
                    <div>
                      <p className="text-lg font-bold">{peca.desenho} - {peca.descricao}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Sequenciado em</p>
                      <p className="font-semibold">{peca.dataSequenciamento || "—"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Produzido em</p>
                      <p className="font-semibold">{peca.dataProduzido}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Setup</p>

                      <p
                        className={`font-semibold ${getSetupLabel(peca) === "Morsa"
                          ? "text-blue-600"
                          : "text-green-600"
                          }`}
                      >
                        {getSetupLabel(peca) === "Morsa"
                          ? "🔵 Morsa"
                          : "🟢 Vácuo"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (pagina === "verSequencia" || pagina === "editarSequencia") {
    const modoEdicao = pagina === "editarSequencia";
    const contagemOF = sequencia.reduce<Record<string, number>>((acc, peca) => {
      const of = peca.ordem;

      if (of && of !== "-" && of !== "Sem OF") {
        acc[of] = (acc[of] || 0) + 1;
      }

      return acc;
    }, {});
    return (
      <div className="min-h-screen bg-slate-100 p-6">
        <div className="mx-auto max-w-6xl space-y-6">
          <Button variant="outline" onClick={() => setPagina("maquina")} className="gap-2">
            <ArrowLeft size={18} /> Voltar
          </Button>

          <Card className="sticky top-4 z-50 rounded-2xl shadow-md">
            <CardContent className="p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h1 className="text-3xl font-bold">
                    {modoEdicao
                      ? `Editar sequência - ${maquina.numero} ${maquina.nome}`
                      : `Ver sequência - ${maquina.numero} ${maquina.nome}`}
                  </h1>
                  <p className="mt-2 text-slate-600">
                    {modoEdicao
                      ? "Arraste uma peça para cima ou para baixo para ajustar a ordem manualmente."
                      : "Modo de produção. Selecione os itens finalizados para enviar ao histórico."}
                  </p>
                </div>
                <div className="rounded-2xl bg-white px-5 py-4 shadow-sm border">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

                    <div>
                      <p className="text-sm text-slate-500">
                        Setup considerado na sequência
                      </p>

                      <p className="text-2xl font-bold mt-1">
                        {setupAtual === "morsa" ? "Morsa" : "Mesa de vácuo"}
                      </p>
                    </div>


                  </div>

                  {modoEdicao && (
                    <Button
                      onClick={salvarSequencia}
                      className="gap-2"
                      variant="outline"
                    >
                      Salvar sequência
                    </Button>
                  )}

                  {!modoEdicao && (
                    <div className="flex flex-wrap gap-2">
                      <Button
                        onClick={imprimirSequencia}
                        className="gap-2"
                        variant="outline"
                      >
                        <Printer size={18} /> Imprimir sequência
                      </Button>

                      <Button
                        onClick={marcarProduzidas}
                        disabled={selecionadas.length === 0}
                        className="gap-2"
                      >
                        <CheckCircle2 size={18} /> Marcar produzidas ({selecionadas.length})
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="print-header hidden">
            <h1>Sequência {maquina.numero} - {maquina.nome}</h1>
            <p>Setup considerado: {setupAtual === "morsa" ? "Morsa" : "Mesa de vácuo"}</p>
            <p>Peças pendentes: {sequencia.length}</p>
            <p>Data de impressão: {formatarDataHoje()}</p>
          </div>

          <div className="print-list hidden">
            <div className="print-row print-row-header">
              <span>☐</span>
              <span>Nº</span>
              <span>Desenho</span>
              <span>Descrição</span>
              <span>Dimensões</span>
              <span>Qtd</span>
            </div>

            {sequencia.map((peca, index) => (
              <div key={`print-${peca.desenho}-${index}`} className="print-row">
                <span>☐</span>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <span>{peca.desenho}</span>
                <span>{peca.descricao}</span>
                <span>{peca.dimensoes}</span>
                <span>{peca.quantidade}</span>
              </div>
            ))}
          </div>

          <div className="print-area space-y-3">
            {sequencia.map((peca, index) => {
              const trocaSetup = index > 0 && getSetupLabel(sequencia[index - 1]) !== getSetupLabel(peca);
              const selecionada = selecionadas.includes(peca.desenho);

              return (
                <React.Fragment key={`${peca.desenho}-${index}`}>
                  {trocaSetup && (
                    <div className="rounded-2xl border border-dashed border-slate-400 bg-slate-200 p-3 text-center font-semibold text-slate-700">
                      Trocar setup para {getSetupLabel(peca)}
                    </div>
                  )}

                  <div
                    draggable={modoEdicao}
                    onDragStart={modoEdicao ? () => setDragIndex(index) : undefined}
                    onDragOver={
                      modoEdicao
                        ? (event) => {
                          event.preventDefault();

                          const limiteInferior = window.innerHeight - 120;
                          const limiteSuperior = 120;

                          if (event.clientY > limiteInferior) {
                            window.scrollBy(0, 12);
                          }

                          if (event.clientY < limiteSuperior) {
                            window.scrollBy(0, -12);
                          }
                        }
                        : undefined
                    }
                    onDrop={modoEdicao ? () => moverItem(dragIndex, index) : undefined}
                    onDragEnd={modoEdicao ? () => setDragIndex(null) : undefined}
                    className={`rounded-2xl p-4 shadow-sm transition ${selecionada ? "bg-green-50 ring-2 ring-green-400" : "bg-white"} ${modoEdicao ? "cursor-move hover:shadow-md" : "cursor-default"}`}
                  >
                    <div className="grid gap-3 md:grid-cols-[60px_40px_1fr_160px_120px_130px] md:items-center">
                      <div className="text-2xl font-bold text-slate-700">{index + 1}</div>
                      <GripVertical className={modoEdicao ? "text-slate-400" : "text-slate-200"} />
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-lg font-bold">{peca.desenho} - {peca.descricao}</p>
                          {peca.urgente && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-sm font-semibold text-red-700">
                              <AlertTriangle size={15} /> Urgente
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-600">Dimensões: {peca.dimensoes}</p>
                        {peca.ordem &&
                          contagemOF[peca.ordem] > 1 &&
                          peca.ordem !== "-" &&
                          peca.ordem !== "Sem OF" && (
                            <span className="mt-2 inline-flex w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                              OF {peca.ordem}
                            </span>
                          )}
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Prazo</p>
                        <p className="font-semibold">{peca.prazo}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Setup</p>

                        <p
                          className={`font-semibold ${getSetupLabel(peca) === "Morsa"
                            ? "text-blue-600"
                            : "text-green-600"
                            }`}
                        >
                          {getSetupLabel(peca) === "Morsa" ? "Morsa" : "Vácuo"}
                        </p>
                      </div>
                      <div>
                        {!modoEdicao ? (
                          <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold">
                            <input
                              type="checkbox"
                              checked={selecionada}
                              onChange={() => alternarSelecao(peca.desenho)}
                            />
                            Produzida
                          </label>
                        ) : (
                          <span className="text-sm text-slate-400">Edição ativa</span>
                        )}
                      </div>
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (pagina === "maquina") {
    return (
      <div className="min-h-screen bg-slate-100 p-6">
        <div className="mx-auto max-w-5xl space-y-6">
          <Button variant="outline" onClick={() => setPagina("home")} className="gap-2">
            <ArrowLeft size={18} /> Voltar
          </Button>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="rounded-2xl shadow-md">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h1 className="text-3xl font-bold">Maq: {maquina.numero} {maquina.nome}</h1>
                    <p className="mt-2 text-slate-600">{maquina.tipo} • Material padrão: {maquina.material}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-200 px-4 py-3 text-right">
                    <p className="text-sm text-slate-500">Setup atual</p>
                    <select
                      value={setupAtual}
                      onChange={(event) => setSetupAtual(event.target.value as Setup)}
                      className="mt-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-lg font-semibold"
                    >
                      <option value="morsa">Morsa</option>
                      <option value="vacuo">Mesa de vácuo</option>
                    </select>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl bg-white p-4 shadow-sm">
                    <p className="text-sm text-slate-500">Peças na fila</p>
                    <p className="text-3xl font-bold">{maquina.fila}</p>
                  </div>
                  <div className="rounded-2xl bg-white p-4 shadow-sm">
                    <p className="text-sm text-slate-500">Produzidas no histórico</p>
                    <p className="text-3xl font-bold">{historico.length}</p>
                  </div>
                </div>

              </CardContent>
            </Card>
          </motion.div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <ActionCard icon={<PlusCircle />} title="Adicionar fichas" description="Enviar fotos ou importar da planilha." />
            <ActionCard icon={<ListChecks />} title="Criar sequência" description="Gerar sugestão usando setup, urgência e prazo." onClick={criarSequencia} />
            <ActionCard icon={<Edit3 />} title="Editar sequência" description="Arrastar peças para ajustar posição." onClick={() => setPagina("editarSequencia")} />
            <ActionCard icon={<Eye />} title="Ver sequência" description="Selecionar produzidas e consultar fila." onClick={() => setPagina("verSequencia")} />
            <ActionCard icon={<History />} title="Histórico" description="Consultar peças produzidas." onClick={() => setPagina("historico")} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Sequenciador de Usinagem</h1>
          <p className="mt-2 text-slate-600">Painel inicial das máquinas.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {machines.map((machine) => (
            <motion.div key={machine.id} whileHover={{ scale: 1.02 }}>
              <Card
                className="cursor-pointer rounded-2xl shadow-md"
                onClick={() => {
                  setMaquinaSelecionada(machine);
                  setPagina("maquina");
                }}
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-slate-200 p-3">
                      <Factory size={28} />
                    </div>

                    <div>
                      <h2 className="text-xl font-bold">
                        Maq: {machine.numero} {machine.nome}
                      </h2>
                      <p className="text-sm text-slate-600">
                        {machine.tipo} • {machine.material}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-xl bg-white p-3">
                      <p className="text-slate-500">Fila</p>
                      <p className="text-lg font-semibold">
                        {machine.id === "6064" ? sequencia.length : 0} peças
                      </p>
                    </div>

                    <div className="rounded-xl bg-white p-3">
                      <p className="text-slate-500">Status</p>
                      <p className="text-lg font-semibold">
                        {machine.id === "6064" ? "Ativa" : "Em preparação"}
                      </p>
                    </div>
                  </div>

                  <Button className="mt-6 w-full">
                    Entrar na máquina
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

function extrairLargura(dimensoes: string): number {
  const partes = dimensoes
    .replace(",", ".")
    .split("x")
    .map((p) => parseFloat(p.trim()));

  if (partes.length < 2) return 0;

  return partes[1] || 0;
}

function formatarDataHoje() {
  const hoje = new Date();
  return hoje.toLocaleDateString("pt-BR");
}
