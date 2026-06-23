# Projeto: Sequenciador de Usinagem

## Objetivo do projeto

O Sequenciador de Usinagem é um sistema web para organizar filas de produção de máquinas de usinagem a partir da planilha `fichas_usinagem`.

O sistema lê as fichas pendentes de cada máquina, aplica uma regra de sequenciamento específica, permite ajustes manuais na interface e persiste a nova ordem na planilha por meio de um Google Apps Script.

O objetivo operacional é apoiar o planejamento e o chão de fábrica, reduzindo trocas desnecessárias, agrupando peças compatíveis e mantendo rastreabilidade por histórico.

## Tecnologias utilizadas

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Framer Motion
- Lucide React
- PapaParse
- Google Sheets
- Google Apps Script

## Estrutura geral das pastas

```text
fichas_usinagem/
├─ app/
│  ├─ page.tsx
│  ├─ layout.tsx
│  ├─ globals.css
│  └─ api/
│     └─ fichas/
├─ components/
│  ├─ MachineCard.tsx
│  └─ ui/
├─ lib/
│  └─ machines/
├─ sequencing/
├─ types/
├─ docs/
├─ public/
├─ package.json
├─ tsconfig.json
└─ next.config.ts
```

### `app/`

Contém a aplicação Next.js.

O arquivo principal é `app/page.tsx`, responsável pela tela inicial, seleção de máquina, carregamento de dados, criação/edição da sequência, salvamento e marcação de peças produzidas.

As rotas em `app/api/fichas/` fazem a ponte entre o frontend, o Google Sheets e o Apps Script.

### `components/`

Contém componentes de interface reutilizados pela página principal:

- cartões das máquinas;
- botões;
- cards de ações;
- estrutura visual dos cards.

### `lib/machines/`

Contém o cadastro das máquinas disponíveis no sistema.

Cada máquina possui um arquivo próprio com dados como:

- `id`;
- número;
- nome;
- tipo;
- material;
- nome da aba da fila;
- nome da aba de histórico;
- rotas de API.

### `sequencing/`

Contém as regras de sequenciamento.

Cada máquina possui uma função própria de ordenação, registrada em `sequencing/index.ts`.

### `types/`

Contém os tipos TypeScript compartilhados, principalmente:

- `Peca`;
- `Machine`.

### `docs/`

Contém a documentação técnica do projeto.

## Máquinas atualmente implementadas

| Máquina | Nome | Tipo | Material predominante | Aba da fila | Aba de histórico |
| --- | --- | --- | --- | --- | --- |
| 6064 | Deckel | Fresadora CNC | Alumínio | `6064` | `Historico_6064` |
| 5825 | Torno CNC | Torno CNC | Aço | `5825` | `Historico_5825` |
| 1572 | Fresadora | Fresadora Convencional | Aço | `1572` | `Historico_1572` |
| 1516 | Mandriladora | Mandriladora Convencional | Aço | `1516` | `Historico_1516` |
| 725 | Induma CNC | Fresa CNC | Aço | `725` | `Historico_725` |

## Funcionalidades principais

- Painel inicial com as máquinas cadastradas.
- Leitura da fila ativa de cada máquina no Google Sheets.
- Leitura do histórico de cada máquina.
- Criação de sequência automática com regra específica por máquina.
- Edição manual da sequência por arrastar e soltar.
- Salvamento da sequência na planilha.
- Marcação de peças produzidas.
- Movimentação de peças produzidas para a aba de histórico.
- Impressão da sequência.
- Exibição de contadores de fila e histórico.

Observação: a interface possui um card visual de "Adicionar fichas", mas não há fluxo implementado no código atual para importar ou cadastrar novas fichas pela aplicação.

## Fluxo geral do sistema

```text
Usuário
↓
Interface em app/page.tsx
↓
Cadastro da máquina em lib/machines
↓
Regra de sequenciamento em sequencing
↓
Rotas API em app/api/fichas
↓
Apps Script
↓
Google Sheets
```

O sistema utiliza o `machineId` da máquina selecionada para decidir:

- qual rota de fila deve ser chamada;
- qual rota de histórico deve ser chamada;
- qual regra de sequenciamento deve ser aplicada;
- qual aba da planilha deve ser atualizada pelo Apps Script.

## Dependências externas

### Google Sheets

O Google Sheets é a base de dados operacional do sistema.

Cada máquina possui:

- uma aba de fila ativa;
- uma aba de histórico.

As rotas de leitura usam exportação CSV do Google Sheets e transformam os dados com PapaParse.

### Google Apps Script

O Apps Script é responsável pelas alterações na planilha.

As ações atuais enviadas pelo sistema são:

- `salvarSequencia`;
- `produzidas`.

O código-fonte do Apps Script não está versionado neste repositório. As rotas do Next.js chamam o Web App publicado do Apps Script.

## Observações de manutenção

- A regra de cada máquina deve permanecer isolada em `sequencing/sequenciarXXXX.ts`.
- O cadastro da máquina deve permanecer centralizado em `lib/machines`.
- As rotas de leitura devem seguir o padrão já existente por máquina.
- O fluxo de salvamento deve continuar usando `/api/fichas/salvar`.
- Alterações no Apps Script devem ser acompanhadas de nova implantação do Web App.
