# Arquitetura do sistema

## Visão geral

O sistema é uma aplicação Next.js que usa uma interface única para operar várias máquinas. A diferença entre as máquinas fica concentrada em dois pontos principais:

- cadastro da máquina em `lib/machines`;
- regra de sequenciamento em `sequencing`.

A persistência dos dados não é feita em banco de dados próprio. O sistema lê e grava em uma planilha Google Sheets, usando rotas API do Next.js e um Google Apps Script publicado como Web App.

## Diagrama principal

```text
Interface
app/page.tsx
↓
Sequenciamento
sequencing/index.ts + sequenciarXXXX.ts
↓
API
app/api/fichas/*
↓
Apps Script
Web App externo
↓
Google Sheets
planilha fichas_usinagem
```

## Diagrama de seleção da regra por máquina

```text
machineId
↓
lib/machines
↓
sequencing/index.ts
↓
sequenciarXXXX.ts
```

Exemplo:

```text
machineId = "725"
↓
lib/machines/725.ts
↓
sequencing/index.ts
↓
sequencing/sequenciar725.ts
```

## Interface em `app/page.tsx`

O arquivo `app/page.tsx` concentra a interface principal do sistema.

Responsabilidades:

- exibir a tela inicial com as máquinas;
- selecionar a máquina atual;
- carregar a fila da máquina selecionada;
- carregar o histórico da máquina selecionada;
- converter os dados recebidos da planilha para o tipo `Peca`;
- acionar a regra de sequenciamento adequada;
- permitir criação de sequência;
- permitir edição manual por drag and drop;
- salvar a sequência;
- marcar peças como produzidas;
- exibir histórico;
- imprimir sequência.

O componente usa o cadastro da máquina selecionada para buscar:

- `apiFila`;
- `apiHistorico`;
- `id`;
- `numero`;
- `nome`;
- dados visuais da máquina.

## Cadastro das máquinas em `lib/machines`

Cada máquina possui um arquivo em `lib/machines`.

Exemplo de responsabilidade de um cadastro:

```ts
{
  id: "725",
  numero: "725",
  nome: "Induma CNC",
  tipo: "Fresa CNC",
  material: "Aço",
  sheetName: "725",
  historySheetName: "Historico_725",
  apiFila: "/api/fichas/725",
  apiHistorico: "/api/fichas/historico/725"
}
```

O arquivo `lib/machines/index.ts` exporta:

- `machines`: lista usada para montar a tela inicial;
- `machinesById`: mapa usado para validações e buscas por `machineId`.

## Regras de sequenciamento em `sequencing`

Cada máquina possui uma função própria de sequenciamento.

Arquivos atuais:

- `sequencing/sequenciar6064.ts`;
- `sequencing/sequenciar5825.ts`;
- `sequencing/sequenciar1572.ts`;
- `sequencing/sequenciar1516.ts`;
- `sequencing/sequenciar725.ts`.

O arquivo `sequencing/index.ts` associa cada `machineId` à sua função:

```text
"6064" → sequenciar6064
"5825" → sequenciar5825
"1572" → sequenciar1572
"1516" → sequenciar1516
"725"  → sequenciar725
```

Responsabilidades dessa camada:

- receber uma lista de peças;
- aplicar critérios de prioridade e agrupamento;
- devolver uma nova lista ordenada;
- manter as regras específicas isoladas por máquina.

## APIs do Next.js

As APIs ficam em `app/api/fichas`.

### Rotas de leitura da fila

Cada máquina possui uma rota de fila:

```text
/api/fichas/6064
/api/fichas/5825
/api/fichas/1572
/api/fichas/1516
/api/fichas/725
```

Essas rotas:

- montam uma URL CSV do Google Sheets;
- leem a aba da máquina;
- usam PapaParse para converter CSV em objetos;
- retornam JSON para o frontend.

### Rotas de leitura do histórico

Cada máquina possui uma rota de histórico:

```text
/api/fichas/historico/6064
/api/fichas/historico/5825
/api/fichas/historico/1572
/api/fichas/historico/1516
/api/fichas/historico/725
```

Essas rotas seguem o mesmo padrão das rotas de fila, mas leem as abas `Historico_XXXX`.

### Rota de salvar sequência

```text
POST /api/fichas/salvar
```

Responsabilidades:

- receber `maquinaId`;
- receber a lista de sequência no formato `{ sequencia, desenho }`;
- validar máquina cadastrada;
- encaminhar a ação `salvarSequencia` para o Apps Script;
- devolver ao frontend a resposta real da integração.

### Rota de produzidas

```text
POST /api/fichas/produzidas
```

Responsabilidades:

- receber `maquinaId`;
- receber a lista de desenhos marcados como produzidos;
- encaminhar a ação `produzidas` para o Apps Script;
- retornar o resultado da movimentação.

## Comunicação com Apps Script

As rotas de escrita não alteram diretamente a planilha. Elas enviam um `POST` para o Web App do Apps Script.

Fluxo:

```text
Frontend
↓
API Next.js
↓
POST para Apps Script
↓
Apps Script valida token e ação
↓
Apps Script altera Google Sheets
↓
Resposta retorna para API
↓
Resposta retorna para o frontend
```

Ações usadas atualmente:

- `salvarSequencia`;
- `produzidas`.

## Persistência no Google Sheets

O Google Sheets funciona como armazenamento principal.

Para cada máquina existe:

- aba da fila ativa;
- aba de histórico.

O salvamento da sequência atualiza a ordem da aba da fila. A marcação de produzidas remove as peças da fila e move os dados para a respectiva aba de histórico.

## Responsabilidades por camada

| Camada | Responsabilidade |
| --- | --- |
| `app/page.tsx` | Interface, estado da tela, ações do usuário e chamadas às APIs |
| `components/` | Elementos visuais reutilizáveis |
| `lib/machines` | Cadastro declarativo das máquinas |
| `sequencing` | Regras de ordenação e agrupamento |
| `app/api/fichas/*` | Leitura da planilha e ponte com Apps Script |
| Apps Script | Escrita e movimentação de linhas na planilha |
| Google Sheets | Armazenamento operacional das filas e históricos |
