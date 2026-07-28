"use client";

import React, { useEffect, useState } from "react";
import { flushSync } from "react-dom";
import Image from "next/image";
import type { Peca } from "@/types/peca";
import { machine6064 } from "@/lib/machines/6064";
import { machines } from "@/lib/machines";
import { sequencingStrategies } from "@/sequencing";
import {
  criarReferenciaPeca,
  localizarLimiteCongelado,
  obterChavePeca,
  referenciaPecaValida,
  sequenciarRespeitandoCongelamento,
  serializarReferenciaPeca,
  type CongelamentoSequencia,
} from "@/sequencing/congelamento";
import {
  carregarCongelamentoSequencia,
  salvarCongelamentoSequencia,
} from "@/lib/congelamentoSequenciaStorage";
import { ActionCard } from "@/components/ui/ActionCard";
import { MachineCard } from "@/components/MachineCard";
import {
  Activity,
  ArrowLeft,
  ArrowUpRight,
  Boxes,
  CircleCheck,
  Home,
  LayoutGrid,
  Moon,
  Palette,
  Settings,
  Sun,
  ListChecks,
  Edit3,
  Eye,
  PlusCircle,
  GripVertical,
  AlertTriangle,
  History,
  CheckCircle2,
  Printer,
  LockKeyhole,
  UnlockKeyhole,
} from "lucide-react";

type Pagina =
  | "home"
  | "configuracoes"
  | "maquina"
  | "verSequencia"
  | "editarSequencia"
  | "historico";
type Setup = "morsa" | "vacuo";
type Tema = "dark" | "light";
type ModoImpressao = "completa" | "congeladas";
type LinhaApi = Partial<Peca> &
  Record<string, string | number | boolean | null | undefined>;

export default function Sequenciador6064() {
  const [pagina, setPagina] = useState<Pagina>("home");
  const [setupAtual, setSetupAtual] = useState<Setup>("morsa");
  const [sequencia, setSequencia] = useState<Peca[]>([]);
  const [maquinaSelecionada, setMaquinaSelecionada] = useState(machine6064);
  const [historico, setHistorico] = useState<Peca[]>([]);
  const [selecionadas, setSelecionadas] = useState<string[]>([]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [filasPorMaquina, setFilasPorMaquina] = useState<Record<string, number>>({});
  const [pecasPorMaquina, setPecasPorMaquina] = useState<Record<string, Peca[]>>({});
  const [tema, setTema] = useState<Tema>("dark");
  const [modoImpressao, setModoImpressao] =
    useState<ModoImpressao>("completa");
  const [congelamento, setCongelamento] =
    useState<CongelamentoSequencia | null>(null);
  const [referenciaParaCongelar, setReferenciaParaCongelar] = useState("");

  useEffect(() => {
    try {
      const temaSalvo = window.localStorage.getItem("fichas-usinagem-tema");
      const temaInicial: Tema = temaSalvo === "light" ? "light" : "dark";

      // A leitura ocorre uma única vez para refletir a preferência persistida.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTema(temaInicial);
      document.documentElement.dataset.theme = temaInicial;
    } catch {
      document.documentElement.dataset.theme = "dark";
    }
  }, []);

  useEffect(() => {
    async function carregarFilasHome() {
      try {
        const resultados = await Promise.all(
          machines.map(async (machine) => {
            const response = await fetch(machine.apiFila);
            const data = await response.json();
            const pecas = Array.isArray(data)
              ? data.map(normalizarPecaFila)
              : [];

            return [machine.id, pecas] as const;
          })
        );

        setPecasPorMaquina(Object.fromEntries(resultados));
        setFilasPorMaquina(
          Object.fromEntries(
            resultados.map(([machineId, pecas]) => [machineId, pecas.length])
          )
        );
      } catch (error) {
        console.error("Erro ao carregar filas das máquinas:", error);
      }
    }

    carregarFilasHome();
  }, []);

  useEffect(() => {
    async function carregarDados() {
      try {
        const response = await fetch(maquinaSelecionada.apiFila);
        const data = await response.json();

        const convertido: Peca[] = Array.isArray(data)
          ? data.map(normalizarPecaFila)
          : [];

        setSequencia(convertido);
        atualizarFilaHome(maquinaSelecionada.id, convertido);
      } catch (error) {
        console.error("Erro ao carregar planilha:", error);
      }
    }

    async function carregarHistorico() {
      try {
        const response = await fetch(maquinaSelecionada.apiHistorico);
        const data = await response.json();
        const convertido: Peca[] = data.map((item: LinhaApi) => {
          const dimensoes = obterTexto(item, "dimensoes", "Dimensões");

          return {
            desenho: obterTexto(item, "desenho", "Desenho"),
            descricao: obterTexto(item, "descricao", "Descrição"),
            dimensoes,
            largura: extrairLargura(dimensoes),
            prazo: obterTexto(item, "prazo", "Prazo"),
            quantidade: obterTexto(item, "quantidade", "Quantidade"),
            ordem: obterTexto(item, "ordem", "Ordem"),
            observacoes: obterTexto(
              item,
              "observacoes",
              "Observações"
            ),
            material: obterTexto(item, "material", "Material"),
            urgente: false,
            dataProduzido: obterTexto(
              item,
              "dataProduzido",
              "Data Produção"
            ),
          };
        });

        setHistorico(convertido);
      } catch (error) {
        console.error("Erro ao carregar histórico:", error);
      }
    }

    carregarDados();
    carregarHistorico();
  }, [maquinaSelecionada]);

  useEffect(() => {
    const congelamentoSalvo = carregarCongelamentoSequencia(
      maquinaSelecionada.id
    );

    // O congelamento pertence à máquina selecionada e é restaurado ao acessá-la.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCongelamento(congelamentoSalvo);
    setReferenciaParaCongelar("");
    setSelecionadas([]);
    setDragIndex(null);
  }, [maquinaSelecionada.id]);

  function atualizarFilaHome(machineId: string, pecas: Peca[]) {
    setPecasPorMaquina((atual) => ({
      ...atual,
      [machineId]: pecas,
    }));
    setFilasPorMaquina((atual) => ({
      ...atual,
      [machineId]: pecas.length,
    }));
  }

  const maquina = {
    ...maquinaSelecionada,
    fila: sequencia.length,
  };

  const maquinasHome = machines;
  const totalFila = machines.reduce(
    (total, machine) => total + (filasPorMaquina[machine.id] ?? 0),
    0
  );
  const pecasTodasFilas = machines.flatMap(
    (machine) => pecasPorMaquina[machine.id] ?? []
  );
  const pecasUrgentes = pecasTodasFilas.filter((peca) => peca.urgente).length;
  const ordensEmAndamento = new Set(
    pecasTodasFilas
      .map((peca) => peca.ordem?.trim())
      .filter(
        (ordem): ordem is string =>
          Boolean(ordem) && ordem !== "-" && ordem !== "Sem OF"
      )
  ).size;
  const maiorQuantidade = Math.max(
    ...machines.map((machine) => filasPorMaquina[machine.id] ?? 0),
    0
  );

  function aplicarTema(novoTema: Tema) {
    setTema(novoTema);
    document.documentElement.dataset.theme = novoTema;

    try {
      window.localStorage.setItem("fichas-usinagem-tema", novoTema);
    } catch {
      // O tema continua aplicado durante a sessão quando o armazenamento está indisponível.
    }
  }

  function renderSidebar(ativo: "home" | "configuracoes") {
    return (
      <aside className="dashboard-sidebar">
        <div className="dashboard-brand">
          <Image
            src="/tramontina-logo.png"
            alt="Tramontina"
            width={1831}
            height={281}
            priority
            className="dashboard-brand__logo"
          />
        </div>

        <nav className="dashboard-nav" aria-label="Navegação principal">
          <button
            type="button"
            className={`dashboard-nav__item ${ativo === "home" ? "is-active" : ""}`}
            onClick={() => setPagina("home")}
          >
            <Home size={20} strokeWidth={1.9} />
            <span>Início</span>
          </button>
          <button
            type="button"
            className="dashboard-nav__item"
            onClick={() => setPagina("home")}
          >
            <LayoutGrid size={20} strokeWidth={1.9} />
            <span>Máquinas</span>
          </button>
          <button
            type="button"
            className={`dashboard-nav__item ${ativo === "configuracoes" ? "is-active" : ""}`}
            onClick={() => setPagina("configuracoes")}
          >
            <Settings size={20} strokeWidth={1.9} />
            <span>Configurações</span>
          </button>
        </nav>

        <div className="dashboard-sidebar__flow">
          <span>Fluxo disponível</span>
          <p>
            Selecione uma máquina para criar ou consultar sequências, histórico
            e produzidas.
          </p>
        </div>

        <div className="dashboard-system">
          <div>
            <strong>Sistema</strong>
            <span>Fichas de usinagem</span>
          </div>
          <span className="dashboard-system__online" title="Sistema online" />
        </div>
      </aside>
    );
  }

  function criarSequencia() {
    const sequenciador =
      sequencingStrategies[
      maquinaSelecionada.id as keyof typeof sequencingStrategies
      ];

    const hoje = formatarDataHoje();
    const resultado = sequenciarRespeitandoCongelamento(
      sequencia,
      congelamento,
      (parteLivre) =>
        sequenciador ? sequenciador(parteLivre, setupAtual) : parteLivre
    );

    if (!resultado.referenciaEncontrada) {
      alert(
        "A peça usada como limite do congelamento não foi localizada. A sequência não foi alterada. Descongele a sequência ou verifique os dados da peça."
      );
      setPagina("editarSequencia");
      return;
    }

    const novaSequencia = resultado.sequencia.map((peca) => ({
      ...peca,
      dataSequenciamento: peca.dataSequenciamento || hoje,
    }));

    setSequencia(novaSequencia);
    setPagina("editarSequencia");
  }

  function moverItem(origem: number | null, destino: number) {
    if (origem === destino || origem === null) return;

    const limiteCongelado = localizarLimiteCongelado(sequencia, congelamento);

    if (
      congelamento &&
      (limiteCongelado < 0 ||
        origem <= limiteCongelado ||
        destino <= limiteCongelado)
    ) {
      alert(
        "A sequência está congelada. Não é permitido mover peças para dentro ou para fora da área congelada."
      );
      setDragIndex(null);
      return;
    }

    const nova = [...sequencia];
    const [item] = nova.splice(origem, 1);
    nova.splice(destino, 0, item);
    setSequencia(nova);
  }

  function alternarSelecao(peca: Peca) {
    const chave = obterChavePeca(peca);

    setSelecionadas((atuais) =>
      atuais.includes(chave)
        ? atuais.filter((item) => item !== chave)
        : [...atuais, chave]
    );
  }

  function confirmarCongelamento() {
    const peca = sequencia.find(
      (item) => obterChavePeca(item) === referenciaParaCongelar
    );

    if (!peca) {
      alert("Selecione a última peça que já foi liberada ao operador.");
      return;
    }

    const ultimaPeca = criarReferenciaPeca(peca);

    if (!referenciaPecaValida(ultimaPeca)) {
      alert(
        "Não é possível congelar esta peça porque Desenho e Ordem MES são obrigatórios para formar a chave única."
      );
      return;
    }

    const novoCongelamento: CongelamentoSequencia = { ultimaPeca };

    setCongelamento(novoCongelamento);
    salvarCongelamentoSequencia(
      maquinaSelecionada.id,
      novoCongelamento
    );
    setReferenciaParaCongelar("");
  }

  function descongelarSequencia() {
    setCongelamento(null);
    salvarCongelamentoSequencia(maquinaSelecionada.id, null);
    setDragIndex(null);
  }

  function imprimirSequencia(modo: ModoImpressao = "completa") {
    flushSync(() => {
      setModoImpressao(modo);
    });

    window.addEventListener(
      "afterprint",
      () => setModoImpressao("completa"),
      { once: true }
    );
    window.print();
  }

  async function salvarSequencia() {
    const payload = sequencia.map((peca, index) => ({
      sequencia: index + 1,
      desenho: peca.desenho,
      ordemMes: peca.ordemMes ?? "",
    }));

    try {
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

      const result = await response.json().catch(() => null);

      if (!response.ok || !result?.success) {
        console.error("Falha ao persistir a sequencia", {
          status: response.status,
          statusText: response.statusText,
          resposta: result,
          maquinaId: maquinaSelecionada.id,
        });

        const mensagem =
          result?.error || result?.details || "Resposta invalida da API";

        alert(`Erro ao salvar sequência: ${mensagem}`);
        return;
      }

      alert("Sequência salva com sucesso!");
    } catch (error) {
      console.error("Falha ao persistir a sequencia", {
        error,
        maquinaId: maquinaSelecionada.id,
        sequencia: payload,
      });

      alert("Erro ao salvar sequência");
    }
  }

  async function marcarProduzidas() {
    if (selecionadas.length === 0) return;

    const pecasSelecionadas = sequencia.filter((peca) =>
      selecionadas.includes(obterChavePeca(peca))
    );
    const referenciasSelecionadas = pecasSelecionadas.map(criarReferenciaPeca);

    try {
      const response = await fetch("/api/fichas/produzidas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          maquinaId: maquinaSelecionada.id,
          desenhos: pecasSelecionadas.map((peca) => peca.desenho),
          pecas: referenciasSelecionadas,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        alert("Erro ao marcar produzidas");
        return;
      }

      const novaSequencia = sequencia.filter(
        (peca) => !selecionadas.includes(obterChavePeca(peca))
      );
      setSequencia(novaSequencia);
      atualizarFilaHome(maquinaSelecionada.id, novaSequencia);

      const chaveLimite = congelamento
        ? serializarReferenciaPeca(congelamento.ultimaPeca)
        : null;

      if (chaveLimite && selecionadas.includes(chaveLimite)) {
        descongelarSequencia();
      }

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

  function usaSetupMorsaVacuo(maquinaId: string) {
    return maquinaId === "6064";
  }

  if (pagina === "configuracoes") {
    return (
      <div className="dashboard-shell">
        {renderSidebar("configuracoes")}

        <main className="dashboard-main settings-main">
          <header className="dashboard-header">
            <div>
              <span className="dashboard-eyebrow">Preferências visuais</span>
              <h1>Configurações</h1>
              <p>Personalize somente a aparência do sistema.</p>
            </div>

            <div className="dashboard-header__status">
              <span className="dashboard-header__status-icon">
                <Palette size={19} />
              </span>
              <div>
                <span>Tema atual</span>
                <strong>{tema === "dark" ? "Escuro" : "Claro"}</strong>
              </div>
            </div>
          </header>

          <section className="appearance-panel">
            <div className="appearance-panel__heading">
              <span className="appearance-panel__icon">
                <Palette size={25} />
              </span>
              <div>
                <h2>Aparência da interface</h2>
                <p>Escolha o tema que será usado neste navegador.</p>
              </div>
            </div>

            <div className="theme-options" role="radiogroup" aria-label="Tema">
              <button
                type="button"
                role="radio"
                aria-checked={tema === "dark"}
                className={`theme-option ${tema === "dark" ? "is-selected" : ""}`}
                onClick={() => aplicarTema("dark")}
              >
                <span className="theme-option__preview is-dark">
                  <span />
                  <span />
                  <span />
                </span>
                <span className="theme-option__description">
                  <span className="theme-option__title">
                    <Moon size={20} />
                    Tema escuro
                  </span>
                  <small>Visual atual aprovado, com fundo azul-escuro.</small>
                </span>
                <span className="theme-option__check" aria-hidden="true">
                  ✓
                </span>
              </button>

              <button
                type="button"
                role="radio"
                aria-checked={tema === "light"}
                className={`theme-option ${tema === "light" ? "is-selected" : ""}`}
                onClick={() => aplicarTema("light")}
              >
                <span className="theme-option__preview is-light">
                  <span />
                  <span />
                  <span />
                </span>
                <span className="theme-option__description">
                  <span className="theme-option__title">
                    <Sun size={20} />
                    Tema claro
                  </span>
                  <small>Fundo claro, cards brancos e azul Tramontina.</small>
                </span>
                <span className="theme-option__check" aria-hidden="true">
                  ✓
                </span>
              </button>
            </div>

            <div className="appearance-panel__note">
              A preferência é salva automaticamente neste navegador.
            </div>
          </section>

          <footer className="dashboard-footer">
            © 2026 Tramontina · Fichas de Usinagem
          </footer>
        </main>
      </div>
    );
  }

  if (pagina === "historico") {
    return (
      <div
        className="machine-workspace flow-workspace"
        data-machine={maquinaSelecionada.id}
      >
        <div className="machine-workspace__topbar">
          <button
            type="button"
            onClick={() => setPagina("maquina")}
            className="machine-back-button"
          >
            <ArrowLeft size={19} />
            Voltar
          </button>

          <Image
            src="/tramontina-logo.png"
            alt="Tramontina"
            width={1831}
            height={281}
            className="machine-workspace__logo"
          />
        </div>

        <main className="machine-workspace__content flow-workspace__content">
          <header className="flow-header">
            <div>
              <span className="flow-header__eyebrow">Registros concluídos</span>
              <h1>Histórico - {maquina.numero} {maquina.nome}</h1>
              <p>Consulta das peças já produzidas, com data de sequenciamento e data de conclusão.</p>
            </div>

            <div className="flow-header__summary">
              <span>Produzidas no histórico</span>
              <strong>{historico.length}</strong>
            </div>
          </header>

          {historico.length === 0 ? (
            <div className="flow-empty-state">
              <span className="flow-empty-state__icon">
                <History size={29} />
              </span>
              Nenhuma peça produzida registrada no histórico.
            </div>
          ) : (
            <div className="history-list">
              {historico.map((peca, index) => (
                <div
                  key={`${peca.desenho}-hist-${index}`}
                  className="history-card"
                >
                  <span className="history-card__index">
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  <div className="history-card__identity">
                    <span>Peça produzida</span>
                    <h2>{peca.desenho} - {peca.descricao}</h2>
                  </div>

                  <div className="history-card__metadata">
                    <div>
                      <span>Sequenciado em</span>
                      <strong>{peca.dataSequenciamento || "—"}</strong>
                    </div>
                    <div>
                      <span>Produzido em</span>
                      <strong>{peca.dataProduzido}</strong>
                    </div>
                    {usaSetupMorsaVacuo(maquinaSelecionada.id) && (
                      <div>
                        <span>Setup</span>
                        <strong
                          className={`history-card__setup ${
                            getSetupLabel(peca) === "Morsa"
                              ? "is-morsa"
                              : "is-vacuo"
                          }`}
                        >
                          {getSetupLabel(peca) === "Morsa"
                            ? "🔵 Morsa"
                            : "🟢 Vácuo"}
                        </strong>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <footer className="dashboard-footer">
            © 2026 Tramontina · Fichas de Usinagem
          </footer>
        </main>
      </div>
    );
  }

  if (pagina === "verSequencia" || pagina === "editarSequencia") {
    const modoEdicao = pagina === "editarSequencia";
    const limiteCongelado = localizarLimiteCongelado(
      sequencia,
      congelamento
    );
    const referenciaCongeladaEncontrada =
      !congelamento || limiteCongelado >= 0;
    const podeImprimirCongeladas =
      Boolean(congelamento) && referenciaCongeladaEncontrada;
    const itensImpressao = sequencia
      .map((peca, index) => ({ peca, index }))
      .filter(({ index }) =>
        modoImpressao === "congeladas"
          ? podeImprimirCongeladas && index <= limiteCongelado
          : true
      );
    const contagemReferencias = sequencia.reduce<Record<string, number>>(
      (acc, peca) => {
        const chave = obterChavePeca(peca);
        acc[chave] = (acc[chave] ?? 0) + 1;
        return acc;
      },
      {}
    );
    const contagemOF = sequencia.reduce<Record<string, number>>((acc, peca) => {
      const of = peca.ordem;

      if (of && of !== "-" && of !== "Sem OF") {
        acc[of] = (acc[of] || 0) + 1;
      }

      return acc;
    }, {});
    return (
      <div
        className="machine-workspace flow-workspace"
        data-machine={maquinaSelecionada.id}
      >
        <div className="machine-workspace__topbar">
          <button
            type="button"
            onClick={() => setPagina("maquina")}
            className="machine-back-button"
          >
            <ArrowLeft size={19} />
            Voltar
          </button>

          <Image
            src="/tramontina-logo.png"
            alt="Tramontina"
            width={1831}
            height={281}
            className="machine-workspace__logo"
          />
        </div>

        <main className="machine-workspace__content flow-workspace__content">
          <header className="sequence-header">
            <div className="sequence-header__identity">
              <span className="flow-header__eyebrow">
                {modoEdicao ? "Organização da produção" : "Modo de produção"}
              </span>
              <h1>
                {modoEdicao
                  ? `Editar sequência - ${maquina.numero} ${maquina.nome}`
                  : `Ver sequência - ${maquina.numero} ${maquina.nome}`}
              </h1>
              <p>
                {modoEdicao
                  ? "Arraste uma peça para cima ou para baixo para ajustar a ordem manualmente."
                  : "Modo de produção. Selecione os itens finalizados para enviar ao histórico."}
              </p>
            </div>

            <div className="sequence-header__controls">
              <div className="sequence-header__status">
                <span>Peças pendentes</span>
                <strong>{sequencia.length}</strong>
              </div>

              {usaSetupMorsaVacuo(maquinaSelecionada.id) && (
                <div className="sequence-header__setup">
                  <span>Setup considerado na sequência</span>
                  <strong>
                    {setupAtual === "morsa" ? "Morsa" : "Mesa de vácuo"}
                  </strong>
                </div>
              )}

              {modoEdicao && (
                <button
                  type="button"
                  onClick={salvarSequencia}
                  className="flow-button is-primary"
                >
                  <ListChecks size={18} />
                  Salvar sequência
                </button>
              )}

              {!modoEdicao && (
                <div className="sequence-header__actions">
                  <button
                    type="button"
                    onClick={() => imprimirSequencia("completa")}
                    className="flow-button is-secondary"
                  >
                    <Printer size={18} />
                    Imprimir sequência completa
                  </button>

                  <button
                    type="button"
                    onClick={() => imprimirSequencia("congeladas")}
                    disabled={!podeImprimirCongeladas}
                    className="flow-button is-secondary"
                  >
                    <Printer size={18} />
                    Imprimir somente peças congeladas
                  </button>

                  <button
                    type="button"
                    onClick={marcarProduzidas}
                    disabled={selecionadas.length === 0}
                    className="flow-button is-primary"
                  >
                    <CheckCircle2 size={18} />
                    Marcar produzidas ({selecionadas.length})
                  </button>
                </div>
              )}
            </div>
          </header>

          <section
            className={`sequence-freeze-panel ${
              congelamento ? "is-frozen" : ""
            } ${!referenciaCongeladaEncontrada ? "has-error" : ""}`}
            aria-live="polite"
          >
            <div className="sequence-freeze-panel__icon">
              {congelamento ? (
                <LockKeyhole size={23} />
              ) : (
                <UnlockKeyhole size={23} />
              )}
            </div>

            {congelamento ? (
              <>
                <div className="sequence-freeze-panel__content">
                  <strong>🔒 Sequência congelada</strong>
                  <span>Até a peça liberada ao operador</span>
                </div>

                <dl className="sequence-freeze-panel__details">
                  <div>
                    <dt>Desenho</dt>
                    <dd>{congelamento.ultimaPeca.desenho}</dd>
                  </div>
                  <div>
                    <dt>Ordem MES</dt>
                    <dd>{congelamento.ultimaPeca.ordemMes}</dd>
                  </div>
                  <div>
                    <dt>Posição atual</dt>
                    <dd>
                      {referenciaCongeladaEncontrada
                        ? limiteCongelado + 1
                        : "Não localizada"}
                    </dd>
                  </div>
                </dl>

                <button
                  type="button"
                  onClick={descongelarSequencia}
                  className="flow-button is-secondary"
                >
                  <UnlockKeyhole size={18} />
                  Descongelar sequência
                </button>
              </>
            ) : (
              <>
                <div className="sequence-freeze-panel__content">
                  <strong>Congelar programação liberada</strong>
                  <span>
                    Selecione a última peça entregue ao operador. O limite será
                    salvo por Desenho + Ordem MES.
                  </span>
                </div>

                <label className="sequence-freeze-panel__selector">
                  <span>Última peça liberada</span>
                  <select
                    value={referenciaParaCongelar}
                    onChange={(event) =>
                      setReferenciaParaCongelar(event.target.value)
                    }
                  >
                    <option value="">Selecione uma peça</option>
                    {sequencia.map((peca, index) => {
                      const referencia = criarReferenciaPeca(peca);
                      const chave = obterChavePeca(peca);
                      const referenciaDuplicada =
                        contagemReferencias[chave] > 1;
                      const podeCongelar =
                        referenciaPecaValida(referencia) &&
                        !referenciaDuplicada;

                      return (
                        <option
                          key={`freeze-${chave}-${index}`}
                          value={chave}
                          disabled={!podeCongelar}
                        >
                          {index + 1} — {peca.desenho || "Sem desenho"} — MES{" "}
                          {peca.ordemMes?.trim() || "não informada"}
                          {referenciaDuplicada
                            ? " (chave duplicada)"
                            : !podeCongelar
                              ? " (dados incompletos)"
                              : ""}
                        </option>
                      );
                    })}
                  </select>
                </label>

                <button
                  type="button"
                  onClick={confirmarCongelamento}
                  disabled={!referenciaParaCongelar}
                  className="flow-button is-primary"
                >
                  <LockKeyhole size={18} />
                  Congelar sequência
                </button>
              </>
            )}

            {!referenciaCongeladaEncontrada && (
              <p className="sequence-freeze-panel__error">
                A peça de referência não está na fila atual. Por segurança, o
                sequenciamento e a movimentação manual permanecem bloqueados.
              </p>
            )}
          </section>

          <div className="print-header hidden">
            <h1>Sequência {maquina.numero} - {maquina.nome}</h1>
            <p>Setup considerado: {setupAtual === "morsa" ? "Morsa" : "Mesa de vácuo"}</p>
            <p>Peças pendentes: {itensImpressao.length}</p>
            <p>Data de impressão: {formatarDataHoje()}</p>
          </div>

          <div className="print-list hidden">
            <div className="print-row print-row-header">
              <span>☐</span>
              <span>Nº</span>
              <span>Desenho</span>
              <span>Ordem MES</span>
              <span>Descrição</span>
              <span>Ordem</span>
              <span>Material</span>
              <span>Dimensões</span>
              <span>Qtd</span>
            </div>

            {itensImpressao.map(({ peca, index }) => (
              <div key={`print-${peca.desenho}-${index}`} className="print-row">
                <span>☐</span>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <span>{peca.desenho}</span>
                <span>{peca.ordemMes?.trim() || "-"}</span>
                <span>{peca.descricao}</span>
                <span>{peca.ordem?.trim() || "-"}</span>
                <span>{peca.material}</span>
                <span>{peca.dimensoes}</span>
                <span>{peca.quantidade}</span>
              </div>
            ))}
          </div>

          <div className="print-area sequence-list">
            {sequencia.map((peca, index) => {
              const trocaSetup =
                usaSetupMorsaVacuo(maquinaSelecionada.id) &&
                index > 0 &&
                getSetupLabel(sequencia[index - 1]) !== getSetupLabel(peca);
              const selecionada = selecionadas.includes(obterChavePeca(peca));
              const pecaCongelada =
                Boolean(congelamento) &&
                referenciaCongeladaEncontrada &&
                index <= limiteCongelado;
              const podeArrastar =
                modoEdicao &&
                (!congelamento ||
                  (referenciaCongeladaEncontrada &&
                    index > limiteCongelado));

              return (
                <React.Fragment key={`${obterChavePeca(peca)}-${index}`}>
                  {trocaSetup && (
                    <div className="sequence-setup-divider">
                      Trocar setup para {getSetupLabel(peca)}
                    </div>
                  )}

                  <div
                    draggable={podeArrastar}
                    onDragStart={
                      podeArrastar ? () => setDragIndex(index) : undefined
                    }
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
                    className={`sequence-item ${
                      selecionada ? "is-selected" : ""
                    } ${podeArrastar ? "is-draggable" : ""} ${
                      pecaCongelada ? "is-frozen" : ""
                    }`}
                  >
                    <div className="sequence-item__layout">
                      <div className="sequence-item__order">
                        {String(index + 1).padStart(2, "0")}
                      </div>

                      <div className="sequence-item__drag">
                        <GripVertical />
                      </div>

                      <div className="sequence-item__identity">
                        <div className="sequence-item__title">
                          <h2>{peca.desenho} - {peca.descricao}</h2>
                          {peca.urgente && (
                            <span className="sequence-item__urgent">
                              <AlertTriangle size={14} />
                              Urgente
                            </span>
                          )}
                        </div>
                        <p>Dimensões: {peca.dimensoes}</p>
                        {peca.ordem &&
                          contagemOF[peca.ordem] > 1 &&
                          peca.ordem !== "-" &&
                          peca.ordem !== "Sem OF" && (
                            <span className="sequence-item__of">
                              OF {peca.ordem}
                            </span>
                          )}
                      </div>

                      <div className="sequence-item__meta">
                        <span>Prazo</span>
                        <strong>{peca.prazo}</strong>
                      </div>

                      {usaSetupMorsaVacuo(maquinaSelecionada.id) && (
                        <div className="sequence-item__meta">
                          <span>Setup</span>
                          <strong
                            className={`sequence-item__setup ${
                              getSetupLabel(peca) === "Morsa"
                                ? "is-morsa"
                                : "is-vacuo"
                            }`}
                          >
                            {getSetupLabel(peca) === "Morsa"
                              ? "🔵 Morsa"
                              : "🟢 Vácuo"}
                          </strong>
                        </div>
                      )}

                      <div className="sequence-item__control">
                        {!modoEdicao ? (
                          <label className="sequence-produced-check">
                            <input
                              type="checkbox"
                              checked={selecionada}
                              onChange={() => alternarSelecao(peca)}
                            />
                            Produzida
                          </label>
                        ) : pecaCongelada ? (
                          <span className="sequence-frozen-badge">
                            <LockKeyhole size={13} />
                            Congelada
                          </span>
                        ) : (
                          <span className="sequence-editing-badge">
                            Edição ativa
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
          </div>

          <footer className="dashboard-footer">
            © 2026 Tramontina · Fichas de Usinagem
          </footer>
        </main>
      </div>
    );
  }

  if (pagina === "maquina") {
    return (
      <div
        className="machine-workspace"
        data-machine={maquinaSelecionada.id}
      >
        <div className="machine-workspace__topbar">
          <button
            type="button"
            onClick={() => setPagina("home")}
            className="machine-back-button"
          >
            <ArrowLeft size={19} />
            Voltar
          </button>

          <Image
            src="/tramontina-logo.png"
            alt="Tramontina"
            width={1831}
            height={281}
            className="machine-workspace__logo"
          />
        </div>

        <main className="machine-workspace__content">
          <section
            className={`machine-hero ${
              usaSetupMorsaVacuo(maquinaSelecionada.id)
                ? ""
                : "without-setup"
            }`}
          >
            <span className="machine-hero__glow" aria-hidden="true" />

            <div className="machine-hero__identity">
              <span className="machine-hero__eyebrow">
                Máquina selecionada
              </span>
              <div className="machine-hero__title-line">
                <span className="machine-hero__number">{maquina.numero}</span>
                <div>
                  <h1>{maquina.nome}</h1>
                  <p>{maquina.tipo}</p>
                </div>
              </div>

              <div className="machine-hero__details">
                <span>
                  Material padrão
                  <strong>{maquina.material}</strong>
                </span>
                <span>
                  Status
                  <strong className="machine-hero__active">
                    <i />
                    Ativa
                  </strong>
                </span>
              </div>
            </div>

            {usaSetupMorsaVacuo(maquinaSelecionada.id) && (
              <div className="machine-setup-card">
                <label htmlFor="setup-atual">Setup atual</label>
                <p>Defina o setup usado no sequenciamento.</p>
                <select
                  id="setup-atual"
                  value={setupAtual}
                  onChange={(event) =>
                    setSetupAtual(event.target.value as Setup)
                  }
                >
                  <option value="morsa">Morsa</option>
                  <option value="vacuo">Mesa de vácuo</option>
                </select>
              </div>
            )}
          </section>

          <section className="machine-summary" aria-label="Resumo da máquina">
            <div className="machine-summary__card">
              <span className="machine-summary__icon is-blue">
                <ListChecks size={27} />
              </span>
              <div>
                <span>Peças na fila</span>
                <strong>{maquina.fila}</strong>
                <small>Aguardando produção</small>
              </div>
            </div>

            <div className="machine-summary__card">
              <span className="machine-summary__icon is-green">
                <CheckCircle2 size={27} />
              </span>
              <div>
                <span>Produzidas no histórico</span>
                <strong>{historico.length}</strong>
                <small>Registros concluídos</small>
              </div>
            </div>
          </section>

          <section className="machine-actions-section">
            <div className="machine-actions-section__heading">
              <div>
                <span className="dashboard-eyebrow">Operações</span>
                <h2>Ações da máquina</h2>
              </div>
              <p>Escolha uma opção para continuar.</p>
            </div>

            <div className="machine-actions-grid">
              <ActionCard icon={<PlusCircle />} title="Adicionar fichas" description="Enviar fotos ou importar da planilha." />
              <ActionCard icon={<ListChecks />} title="Criar sequência" description="Gerar sugestão usando setup, urgência e prazo." onClick={criarSequencia} />
              <ActionCard icon={<Edit3 />} title="Editar sequência" description="Arrastar peças para ajustar posição." onClick={() => setPagina("editarSequencia")} />
              <ActionCard icon={<Eye />} title="Ver sequência" description="Selecionar produzidas e consultar fila." onClick={() => setPagina("verSequencia")} />
              <ActionCard icon={<History />} title="Histórico" description="Consultar peças produzidas." onClick={() => setPagina("historico")} />
            </div>
          </section>

          <footer className="dashboard-footer">
            © 2026 Tramontina · Fichas de Usinagem
          </footer>
        </main>
      </div>
    );
  }

  return (
    <div className="dashboard-shell">
      {renderSidebar("home")}

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <span className="dashboard-eyebrow">Fichas de usinagem</span>
            <h1>Máquinas</h1>
            <p>Selecione uma máquina para visualizar e organizar as fichas.</p>
          </div>

          <div className="dashboard-header__status">
            <span className="dashboard-header__status-icon">
              <Activity size={19} />
            </span>
            <div>
              <span>Status do painel</span>
              <strong>Operação conectada</strong>
            </div>
          </div>
        </header>

        <section id="maquinas" className="machines-section">
          <div className="machines-grid">
            {maquinasHome.map((machine) => {
              const fila = filasPorMaquina[machine.id] ?? 0;
              const progresso =
                maiorQuantidade > 0
                  ? Math.max(8, Math.round((fila / maiorQuantidade) * 100))
                  : 0;

              return (
                <MachineCard
                  key={machine.id}
                  machine={machine}
                  fila={fila}
                  status="Ativa"
                  progresso={progresso}
                  onClick={() => {
                    setMaquinaSelecionada(machine);
                    setPagina("maquina");
                  }}
                />
              );
            })}
          </div>
        </section>

        <section className="dashboard-stats" aria-label="Resumo das máquinas">
          <div className="dashboard-stat">
            <span className="dashboard-stat__icon is-blue">
              <Boxes size={26} />
            </span>
            <div>
              <span>Peças aguardando</span>
              <strong>{totalFila}</strong>
              <small>nas filas das máquinas</small>
            </div>
          </div>

          <div className="dashboard-stat">
            <span className="dashboard-stat__icon is-green">
              <AlertTriangle size={26} />
            </span>
            <div>
              <span>Peças urgentes</span>
              <strong>{pecasUrgentes}</strong>
              <small>classificadas como urgentes</small>
            </div>
          </div>

          <div className="dashboard-stat">
            <span className="dashboard-stat__icon is-orange">
              <CircleCheck size={26} />
            </span>
            <div>
              <span>Máquinas cadastradas</span>
              <strong>{machines.length}</strong>
              <small>em lib/machines</small>
            </div>
          </div>

          <div className="dashboard-stat">
            <span className="dashboard-stat__icon is-purple">
              <ListChecks size={26} />
            </span>
            <div>
              <span>Ordens em andamento</span>
              <strong>{ordensEmAndamento}</strong>
              <small>OFs distintas nas filas</small>
            </div>
          </div>
        </section>

        <section className="dashboard-updates">
          <div className="dashboard-updates__icon">
            <Activity size={28} />
          </div>

          <div className="dashboard-updates__content">
            <div>
              <span className="dashboard-eyebrow">Visão geral</span>
              <h2>Atualizações do sistema</h2>
            </div>

            <ul>
              <li>
                <span />
                Filas das {machines.length} máquinas carregadas no painel
              </li>
              <li>
                <span />
                {totalFila} peças aguardando sequenciamento ou produção
              </li>
              <li>
                <span />
                Histórico e produzidas disponíveis após selecionar a máquina
              </li>
            </ul>
          </div>

          <div className="dashboard-updates__hint">
            <ArrowUpRight size={22} />
            <span>Selecione um card para continuar o fluxo</span>
          </div>
        </section>

        <footer className="dashboard-footer">
          © 2026 Tramontina · Fichas de Usinagem
        </footer>
      </main>
    </div>
  );
}

function obterTexto(item: LinhaApi, ...campos: string[]): string {
  for (const campo of campos) {
    const valor = item[campo];

    if (valor !== undefined && valor !== null && String(valor).trim() !== "") {
      return String(valor);
    }
  }

  return "";
}

function normalizarPecaFila(item: LinhaApi): Peca {
  const dimensoes = obterTexto(item, "dimensoes", "Dimensões");
  const observacoes = obterTexto(item, "observacoes", "Observações");
  const ordemMes = obterTexto(
    item,
    "ordemMes",
    "Ordem mes",
    "Ordem MES",
    "Ordem Mes"
  );

  return {
    desenho: obterTexto(item, "desenho", "Desenho"),
    descricao: obterTexto(item, "descricao", "Descrição"),
    dimensoes,
    largura:
      typeof item.largura === "number" ? item.largura : extrairLargura(dimensoes),
    prazo: obterTexto(item, "prazo", "Prazo"),
    quantidade: obterTexto(item, "quantidade", "Quantidade"),
    ordem: obterTexto(item, "ordem", "Ordem"),
    ordemMes,
    observacoes,
    material: obterTexto(item, "material", "Material"),
    urgente:
      item.urgente === true ||
      String(item.urgente).toLowerCase() === "true" ||
      observacoes.toLowerCase().includes("urgente"),
  };
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
