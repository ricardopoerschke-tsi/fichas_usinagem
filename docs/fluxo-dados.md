# Fluxo de dados

## Visão geral

O sistema trabalha com peças carregadas da planilha `fichas_usinagem`. No frontend, essas peças são convertidas para o tipo `Peca`, sequenciadas, exibidas ao usuário e enviadas de volta para persistência quando necessário.

O fluxo tem duas naturezas:

- leitura: feita diretamente a partir do Google Sheets em formato CSV;
- escrita: feita por meio do Google Apps Script.

## Carregamento da fila

```text
Usuário
↓
page.tsx
↓
API da máquina
↓
Google Sheets
↓
Retorno das peças
```

Passo a passo:

1. O usuário seleciona uma máquina na tela inicial.
2. `app/page.tsx` usa `maquinaSelecionada.apiFila`.
3. A rota da máquina busca a aba correspondente no Google Sheets.
4. O Google Sheets retorna os dados em CSV.
5. A rota usa PapaParse para converter o CSV em JSON.
6. `app/page.tsx` converte cada item para o formato `Peca`.
7. A fila é armazenada no estado `sequencia`.

Exemplo de rotas:

```text
/api/fichas/6064
/api/fichas/725
```

## Carregamento do histórico

```text
Usuário
↓
page.tsx
↓
API de histórico da máquina
↓
Google Sheets
↓
Retorno das peças produzidas
```

Passo a passo:

1. Ao selecionar uma máquina, `app/page.tsx` também chama `maquinaSelecionada.apiHistorico`.
2. A rota lê a aba `Historico_XXXX`.
3. Os dados são convertidos de CSV para JSON.
4. O histórico é exibido na tela de histórico da máquina.

## Criação da sequência

```text
Usuário
↓
page.tsx
↓
sequencing/index.ts
↓
sequenciarXXXX.ts
↓
Sequência sugerida na tela
```

Passo a passo:

1. O usuário clica em "Criar sequência".
2. `app/page.tsx` identifica a máquina selecionada.
3. O sistema busca a função correspondente em `sequencing/index.ts`.
4. A função específica da máquina ordena a lista de peças.
5. A nova sequência é exibida em modo de edição.
6. O usuário pode ajustar manualmente a ordem por drag and drop.

Importante: criar a sequência não grava automaticamente a planilha. A persistência ocorre no salvamento.

## Salvamento da sequência

```text
Usuário
↓
page.tsx
↓
POST /api/fichas/salvar
↓
Apps Script
↓
Google Sheets
```

Passo a passo:

1. O usuário clica em "Salvar sequência".
2. `app/page.tsx` monta o payload com `maquinaId` e a ordem atual.
3. A rota `/api/fichas/salvar` valida o formato recebido.
4. A rota adiciona token e ação `salvarSequencia`.
5. A rota envia o payload ao Apps Script.
6. O Apps Script atualiza a aba da máquina na planilha.
7. A resposta retorna ao frontend.

Formato enviado pelo frontend para a API local:

```json
{
  "maquinaId": "725",
  "sequencia": [
    {
      "sequencia": 1,
      "desenho": "DESENHO-EXEMPLO"
    }
  ]
}
```

Formato encaminhado pela API local ao Apps Script:

```json
{
  "token": "...",
  "acao": "salvarSequencia",
  "maquinaId": "725",
  "sequencia": [
    {
      "sequencia": 1,
      "desenho": "DESENHO-EXEMPLO"
    }
  ]
}
```

## Produzidas

```text
Usuário
↓
POST /api/fichas/produzidas
↓
Apps Script
↓
Mover para histórico
```

Passo a passo:

1. O usuário abre "Ver sequência".
2. O usuário seleciona as peças concluídas.
3. O usuário clica em "Marcar produzidas".
4. `app/page.tsx` envia `maquinaId` e `desenhos` para `/api/fichas/produzidas`.
5. A API encaminha a ação `produzidas` para o Apps Script.
6. O Apps Script remove as peças da aba da fila.
7. O Apps Script adiciona as peças na aba de histórico da máquina.
8. O frontend remove localmente as peças da fila exibida.

Formato enviado:

```json
{
  "maquinaId": "6064",
  "desenhos": ["DESENHO-1", "DESENHO-2"]
}
```

## Fluxo operacional

```text
Fila
↓
Sequenciamento
↓
Salvar
↓
Produção
↓
Produzidas
↓
Histórico
```

Descrição:

1. A fila é alimentada na planilha.
2. O usuário abre a máquina no sistema.
3. O sistema lê a fila.
4. O usuário cria uma sequência automática.
5. O usuário ajusta a sequência se necessário.
6. O usuário salva a sequência.
7. A produção executa a fila.
8. As peças concluídas são marcadas como produzidas.
9. O Apps Script move as peças para o histórico.

## Persistência após recarregar a página

Ao recarregar o site, a fila é carregada novamente a partir do Google Sheets.

Portanto, a ordem exibida após recarregamento depende da ordem persistida na aba da máquina. Se a sequência foi salva corretamente, a planilha passa a ser a fonte da nova ordem.
