"use client";

import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
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
} from "lucide-react";

type Pagina = "home" | "maquina" | "verSequencia" | "editarSequencia" | "historico";
type Setup = "morsa" | "vacuo";
type SetupForcado = "nenhum" | Setup;

type Peca = {
  desenho: string;
  descricao: string;
  dimensoes: string;
  largura: number;
  prazo: string;
  urgente: boolean;
  dataSequenciamento?: string;
  dataProduzido?: string;
  status?: string;
};

type CardProps = {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
};

type ButtonProps = {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "outline";
  disabled?: boolean;
  onClick?: () => void;
};

type ActionCardProps = {
  icon: React.ReactElement<{ size?: number }>;
  title: string;
  description: string;
  onClick?: () => void;
};

const pecasBase: Peca[] = [
  { desenho: "M0848659", descricao: "Chapa", dimensoes: "47,5 x 30 x 15", largura: 30, prazo: "26/05/26", urgente: false, dataSequenciamento: "25/05/26" },
  { desenho: "M0602650", descricao: "Suporte", dimensoes: "92 x 84 x 65", largura: 84, prazo: "26/05/26", urgente: false, dataSequenciamento: "25/05/26" },
  { desenho: "M0760043", descricao: "Mancal", dimensoes: "115 x 45 x 18", largura: 45, prazo: "05/06/26", urgente: false, dataSequenciamento: "25/05/26" },
  { desenho: "M0760418", descricao: "Mancal", dimensoes: "115 x 45 x 18", largura: 45, prazo: "05/06/26", urgente: false, dataSequenciamento: "25/05/26" },
  { desenho: "M0802642", descricao: "Suporte motor", dimensoes: "125 x 60,2 x 18", largura: 60.2, prazo: "05/06/26", urgente: false, dataSequenciamento: "25/05/26" },
  { desenho: "M0802681", descricao: "Suporte motor", dimensoes: "125 x 60,2 x 18", largura: 60.2, prazo: "05/06/26", urgente: false, dataSequenciamento: "25/05/26" },
  { desenho: "M0769423", descricao: "Base", dimensoes: "160 x 128 x 36", largura: 128, prazo: "05/06/26", urgente: false, dataSequenciamento: "25/05/26" },
  { desenho: "M0774723", descricao: "Base", dimensoes: "160 x 128 x 36", largura: 128, prazo: "05/06/26", urgente: false, dataSequenciamento: "25/05/26" },
  { desenho: "M0754852", descricao: "Suporte", dimensoes: "247 x 137,5 x 25", largura: 137.5, prazo: "05/06/26", urgente: false, dataSequenciamento: "25/05/26" },
  { desenho: "M0999999", descricao: "Placa urgente", dimensoes: "620 x 420 x 30", largura: 420, prazo: "Hoje", urgente: true, dataSequenciamento: "25/05/26" },
  { desenho: "M0888888", descricao: "Base grande", dimensoes: "500 x 430 x 25", largura: 430, prazo: "Amanhã", urgente: false, dataSequenciamento: "25/05/26" },
];

export default function Sequenciador6064() {
  const [pagina, setPagina] = useState<Pagina>("home");
  const [setupAtual, setSetupAtual] = useState<Setup>("morsa");
  const [setupForcado, setSetupForcado] = useState<SetupForcado>("nenhum");
  const [sequencia, setSequencia] = useState<Peca[]>(pecasBase);
  const [historico, setHistorico] = useState<Peca[]>([]);
  const [selecionadas, setSelecionadas] = useState<string[]>([]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const maquina = {
    numero: "6064",
    nome: "Deckel",
    tipo: "Fresadora CNC",
    material: "Alumínio",
    fila: sequencia.length,
  };

  const sequenciaSugerida = useMemo(() => {
    const getSetup = (peca: Peca): Setup => (peca.largura <= 400 ? "morsa" : "vacuo");
    const setupPrioritario: Setup = setupForcado === "nenhum" ? setupAtual : setupForcado;

    return [...pecasBase].sort((a, b) => {
      const setupA = getSetup(a);
      const setupB = getSetup(b);

      if (a.urgente && !b.urgente) return -1;
      if (!a.urgente && b.urgente) return 1;

      if (setupA === setupPrioritario && setupB !== setupPrioritario) return -1;
      if (setupA !== setupPrioritario && setupB === setupPrioritario) return 1;

      const prazoA = converterData(a.prazo);
      const prazoB = converterData(b.prazo);
      if (prazoA !== prazoB) return prazoA - prazoB;

      return a.largura - b.largura;
    });
  }, [setupAtual, setupForcado]);

  function criarSequencia() {
    const hoje = formatarDataHoje();
    const novaSequencia = sequenciaSugerida.map((peca) => ({
      ...peca,
      dataSequenciamento: peca.dataSequenciamento || hoje,
    }));

    setSequencia(novaSequencia);
    setPagina("verSequencia");
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

  function marcarProduzidas() {
    if (selecionadas.length === 0) return;

    const hoje = formatarDataHoje();
    const produzidas: Peca[] = sequencia
      .filter((peca) => selecionadas.includes(peca.desenho))
      .map((peca) => ({
        ...peca,
        dataProduzido: hoje,
        status: "Produzido",
      }));

    setHistorico((atual) => [...produzidas, ...atual]);
    setSequencia((atual) => atual.filter((peca) => !selecionadas.includes(peca.desenho)));
    setSelecionadas([]);
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
              <h1 className="text-3xl font-bold">Histórico - 6064 Deckel</h1>
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
                      <p className="text-sm text-slate-600">Dimensões: {peca.dimensoes}</p>
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
                      <p className="font-semibold">{getSetupLabel(peca)}</p>
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

    return (
      <div className="min-h-screen bg-slate-100 p-6">
        <div className="mx-auto max-w-6xl space-y-6">
          <Button variant="outline" onClick={() => setPagina("maquina")} className="gap-2">
            <ArrowLeft size={18} /> Voltar
          </Button>

          <Card className="rounded-2xl shadow-md">
            <CardContent className="p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h1 className="text-3xl font-bold">
                    {modoEdicao ? "Editar sequência - 6064 Deckel" : "Ver sequência - 6064 Deckel"}
                  </h1>
                  <p className="mt-2 text-slate-600">
                    {modoEdicao
                      ? "Arraste uma peça para cima ou para baixo para ajustar a ordem manualmente."
                      : "Modo de produção. Selecione os itens finalizados para enviar ao histórico."}
                  </p>
                </div>
                <div className="flex flex-col gap-3 md:items-end">
                  <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                    <p className="text-sm text-slate-500">Setup inicial</p>
                    <p className="text-xl font-semibold">{setupAtual === "morsa" ? "Morsa" : "Mesa de vácuo"}</p>
                  </div>
                  {!modoEdicao && (
                    <Button onClick={marcarProduzidas} disabled={selecionadas.length === 0} className="gap-2">
                      <CheckCircle2 size={18} /> Marcar produzidas ({selecionadas.length})
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
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
                    onDragOver={modoEdicao ? (event) => event.preventDefault() : undefined}
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
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Prazo</p>
                        <p className="font-semibold">{peca.prazo}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Setup</p>
                        <p className="font-semibold">{getSetupLabel(peca)}</p>
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

                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  <div className="rounded-2xl bg-white p-4 shadow-sm">
                    <p className="text-sm text-slate-500">Peças na fila</p>
                    <p className="text-3xl font-bold">{maquina.fila}</p>
                  </div>
                  <div className="rounded-2xl bg-white p-4 shadow-sm">
                    <p className="text-sm text-slate-500">Produzidas no histórico</p>
                    <p className="text-3xl font-bold">{historico.length}</p>
                  </div>
                  <div className="rounded-2xl bg-white p-4 shadow-sm">
                    <p className="text-sm text-slate-500">Status</p>
                    <p className="text-lg font-semibold">Piloto em validação</p>
                  </div>
                </div>

                <div className="mt-6 rounded-2xl bg-white p-4 shadow-sm">
                  <p className="text-sm font-semibold text-slate-700">Forçar prioridade de setup</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Use quando uma peça urgente exige trocar o setup antes da sequência normal.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-3">
                    <Button variant={setupForcado === "nenhum" ? "default" : "outline"} onClick={() => setSetupForcado("nenhum")}>
                      Não forçar
                    </Button>
                    <Button variant={setupForcado === "morsa" ? "default" : "outline"} onClick={() => setSetupForcado("morsa")}>
                      Forçar Morsa
                    </Button>
                    <Button variant={setupForcado === "vacuo" ? "default" : "outline"} onClick={() => setSetupForcado("vacuo")}>
                      Forçar Mesa de vácuo
                    </Button>
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
          <motion.div whileHover={{ scale: 1.02 }}>
            <Card className="cursor-pointer rounded-2xl shadow-md" onClick={() => setPagina("maquina")}>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-slate-200 p-3">
                    <Factory size={28} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Maq: 6064 Deckel</h2>
                    <p className="text-sm text-slate-600">Fresadora CNC • Alumínio</p>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl bg-white p-3">
                    <p className="text-slate-500">Fila</p>
                    <p className="text-lg font-semibold">{sequencia.length} peças</p>
                  </div>
                  <div className="rounded-xl bg-white p-3">
                    <p className="text-slate-500">Setup</p>
                    <p className="text-lg font-semibold">{setupAtual === "morsa" ? "Morsa" : "Vácuo"}</p>
                  </div>
                </div>

                <Button className="mt-6 w-full">Entrar na máquina</Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function Card({ children, className = "", onClick }: CardProps) {
  return (
    <div onClick={onClick} className={`bg-white ${className}`}>
      {children}
    </div>
  );
}

function CardContent({ children, className = "" }: CardProps) {
  return <div className={className}>{children}</div>;
}

function Button({ children, className = "", variant = "default", disabled = false, onClick }: ButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded-xl px-4 py-2 font-semibold shadow-sm ${
        variant === "outline"
          ? "border border-slate-300 bg-white text-slate-700"
          : "bg-slate-900 text-white"
      } ${disabled ? "opacity-50" : ""} ${className}`}
    >
      {children}
    </button>
  );
}

function ActionCard({ icon, title, description, onClick }: ActionCardProps) {
  return (
    <motion.div whileHover={{ y: -4 }} onClick={onClick}>
      <Card className="h-full cursor-pointer rounded-2xl shadow-md">
        <CardContent className="flex h-full flex-col gap-3 p-5">
          <div className="w-fit rounded-2xl bg-slate-200 p-3">{React.cloneElement(icon, { size: 26 })}</div>
          <h3 className="text-lg font-bold">{title}</h3>
          <p className="text-sm text-slate-600">{description}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function converterData(data: string) {
  if (data === "Hoje") return 0;
  if (data === "Amanhã") return 1;

  const [dia, mes, ano] = data.split("/").map(Number);
  return new Date(2000 + ano, mes - 1, dia).getTime();
}

function formatarDataHoje() {
  const hoje = new Date();
  return hoje.toLocaleDateString("pt-BR");
}
