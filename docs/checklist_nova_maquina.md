# Checklist para nova máquina

## Objetivo

Este checklist orienta a inclusão de uma nova máquina no Sequenciador de Usinagem, mantendo o mesmo padrão usado pelas máquinas já existentes.

Regra principal:

```text
Projeto + Planilha + Apps Script + Testes + Documentação
```

Uma máquina só deve ser considerada concluída depois de validada em todos esses pontos.

## 1. Planilha `fichas_usinagem`

- [ ] Criar aba da máquina.
- [ ] Criar aba de histórico.
- [ ] Confirmar que a aba da máquina usa o número/id correto.
- [ ] Confirmar que a aba de histórico segue o padrão `Historico_XXXX`.
- [ ] Conferir cabeçalhos da fila.
- [ ] Conferir cabeçalhos do histórico.
- [ ] Inserir dados de teste.

Exemplo:

```text
XXXX
Historico_XXXX
```

## 2. Cadastro em `lib/machines`

- [ ] Criar arquivo em `lib/machines`.
- [ ] Definir `id`.
- [ ] Definir `numero`.
- [ ] Definir `nome`.
- [ ] Definir `descricao`, se houver informação real.
- [ ] Definir `tipo`.
- [ ] Definir `material`.
- [ ] Definir `sheetName`.
- [ ] Definir `historySheetName`.
- [ ] Definir `apiFila`.
- [ ] Definir `apiHistorico`.
- [ ] Registrar a máquina em `lib/machines/index.ts`.
- [ ] Adicionar a máquina em `machines`.
- [ ] Adicionar a máquina em `machinesById`.

Modelo:

```ts
export const machineXXXX = {
  id: "XXXX",
  numero: "XXXX",
  nome: "Nome da máquina",
  tipo: "Tipo da máquina",
  material: "Material predominante",
  sheetName: "XXXX",
  historySheetName: "Historico_XXXX",
  apiFila: "/api/fichas/XXXX",
  apiHistorico: "/api/fichas/historico/XXXX",
};
```

## 3. Regra de sequenciamento

- [ ] Criar regra de sequenciamento em `sequencing/sequenciarXXXX.ts`.
- [ ] Extrair critérios reais da operação.
- [ ] Definir critérios de prioridade.
- [ ] Definir critérios de agrupamento.
- [ ] Definir regras especiais, se existirem.
- [ ] Evitar alterar regras de outras máquinas.
- [ ] Registrar a nova regra em `sequencing/index.ts`.

Verificar se a regra considera, quando aplicável:

- [ ] urgência;
- [ ] prazo;
- [ ] material;
- [ ] dimensões;
- [ ] setup;
- [ ] ferramentas;
- [ ] agrupamentos produtivos;
- [ ] restrições físicas da máquina.

## 4. Rotas API

- [ ] Criar rota de fila em `app/api/fichas/XXXX/route.ts`.
- [ ] Criar rota de histórico em `app/api/fichas/historico/XXXX/route.ts`.
- [ ] Confirmar `SHEET_NAME` da fila.
- [ ] Confirmar `SHEET_NAME` do histórico.
- [ ] Confirmar leitura via Google Sheets.
- [ ] Confirmar retorno JSON.

Rotas esperadas:

```text
/api/fichas/XXXX
/api/fichas/historico/XXXX
```

## 5. Apps Script

- [ ] Adicionar a máquina no objeto `MAQUINAS`.
- [ ] Confirmar aba da fila.
- [ ] Confirmar aba de histórico.
- [ ] Conferir ação `salvarSequencia`.
- [ ] Conferir ação `produzidas`.
- [ ] Conferir movimentação para histórico.
- [ ] Conferir criação/garantia de cabeçalho, se o script fizer isso.
- [ ] Implantar nova versão do Apps Script.
- [ ] Atualizar a implantação do Web App.

Modelo:

```js
"XXXX": {
  fila: "XXXX",
  historico: "Historico_XXXX",
}
```

Se a máquina enviar peças para uma próxima operação:

```js
"XXXX": {
  fila: "XXXX",
  historico: "Historico_XXXX",
  proximaFila: "YYYY",
}
```

## 6. Interface

- [ ] Confirmar que a máquina aparece na tela inicial.
- [ ] Confirmar nome, número, tipo e material exibidos.
- [ ] Confirmar contador da fila.
- [ ] Confirmar contador do histórico.
- [ ] Confirmar abertura da tela da máquina.
- [ ] Confirmar botão "Criar sequência".
- [ ] Confirmar botão "Editar sequência".
- [ ] Confirmar botão "Ver sequência".
- [ ] Confirmar botão "Histórico".
- [ ] Confirmar impressão, se aplicável.

## 7. Testes obrigatórios

### Fila

- [ ] Testar fila.
- [ ] Confirmar que `/api/fichas/XXXX` retorna peças.
- [ ] Confirmar que a tela carrega as peças.
- [ ] Confirmar que campos principais aparecem corretamente.

### Sequenciamento

- [ ] Criar sequência.
- [ ] Validar ordem na tela.
- [ ] Validar critérios principais da regra.
- [ ] Ajustar manualmente por drag and drop.
- [ ] Congelar até uma peça com Desenho e Ordem MES.
- [ ] Confirmar que "Criar sequência" preserva o prefixo congelado.
- [ ] Confirmar que o drag and drop não atravessa o limite congelado.
- [ ] Descongelar e confirmar que toda a fila volta a ser editável.

### Salvamento

- [ ] Testar salvar sequência.
- [ ] Confirmar que `/api/fichas/salvar` recebe `maquinaId`.
- [ ] Confirmar payload com `{ sequencia, desenho, ordemMes }`.
- [ ] Confirmar resposta de sucesso do Apps Script.
- [ ] Confirmar nova ordem na aba da máquina.
- [ ] Recarregar o site.
- [ ] Confirmar que a ordem salva permanece.

### Histórico

- [ ] Testar histórico.
- [ ] Confirmar que `/api/fichas/historico/XXXX` retorna dados.
- [ ] Confirmar tela de histórico.

### Produzidas

- [ ] Testar produzidas.
- [ ] Selecionar peças na tela "Ver sequência".
- [ ] Enviar para produzidas.
- [ ] Confirmar remoção da aba da fila.
- [ ] Confirmar inclusão na aba de histórico.
- [ ] Confirmar atualização da tela.

## 8. Documentação

- [ ] Atualizar `docs/projeto.md`.
- [ ] Atualizar `docs/arquitetura.md`, se houver mudança estrutural.
- [ ] Atualizar `docs/fluxo-dados.md`, se houver mudança de fluxo.
- [ ] Atualizar `docs/maquinas.md`.
- [ ] Atualizar `docs/integracoes.md`, se houver nova integração.
- [ ] Atualizar este checklist, se o processo mudar.

## 9. Build e qualidade

- [ ] Executar `npm run build`.
- [ ] Executar lint, se aplicável.
- [ ] Confirmar que não houve regressão nas máquinas existentes.
- [ ] Confirmar que nenhuma regra de outra máquina foi alterada sem necessidade.

## 10. Problemas comuns

### Máquina inválida ou não informada

Verificar:

- [ ] cadastro em `lib/machines`;
- [ ] registro em `machinesById`;
- [ ] `maquinaId` enviado pelo frontend;
- [ ] objeto `MAQUINAS` no Apps Script;
- [ ] implantação atualizada do Apps Script.

### Fila não carrega

Verificar:

- [ ] existência da aba da máquina;
- [ ] nome da aba em `SHEET_NAME`;
- [ ] compartilhamento/permissão da planilha;
- [ ] cabeçalhos e dados;
- [ ] rota `/api/fichas/XXXX`.

### Histórico não carrega

Verificar:

- [ ] existência da aba `Historico_XXXX`;
- [ ] rota `/api/fichas/historico/XXXX`;
- [ ] cadastro no Apps Script.

### Sequência não persiste

Verificar:

- [ ] endpoint `/api/fichas/salvar`;
- [ ] payload enviado;
- [ ] resposta real da API;
- [ ] resposta real do Apps Script;
- [ ] cadastro da máquina no Apps Script;
- [ ] aba correta da máquina.

### Produzidas não vão para histórico

Verificar:

- [ ] endpoint `/api/fichas/produzidas`;
- [ ] payload com `maquinaId` e `desenhos`;
- [ ] ação `produzidas` no Apps Script;
- [ ] aba de histórico;
- [ ] cabeçalho do histórico.
