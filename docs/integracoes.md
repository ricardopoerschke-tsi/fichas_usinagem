# Integrações

## Visão geral

O projeto atualmente possui integrações com Google Sheets e Google Apps Script.

O Google Sheets atua como armazenamento operacional das filas e históricos. O Apps Script atua como camada de escrita e movimentação de dados, já que a aplicação Next.js não grava diretamente na planilha.

## Integrações atuais

### Google Sheets

#### Função

O Google Sheets armazena os dados operacionais do sistema.

Cada máquina possui:

- uma aba de fila;
- uma aba de histórico.

Exemplos:

```text
6064
Historico_6064

725
Historico_725
```

#### Como é usado

As rotas de leitura em `app/api/fichas` acessam a planilha por URL CSV:

```text
https://docs.google.com/spreadsheets/d/{SHEET_ID}/gviz/tq?tqx=out:csv&sheet={SHEET_NAME}
```

Depois disso:

1. a rota recebe o CSV;
2. PapaParse converte o CSV para objetos;
3. o frontend converte os objetos para o tipo `Peca`.

#### Dados esperados

As abas de fila seguem o padrão de colunas usado pelo sistema, incluindo campos como:

- Sequência;
- Desenho;
- Ordem mes;
- Descrição;
- Quantidade;
- Material;
- Dimensões;
- Ordem;
- Prazo;
- Observações.

### Apps Script

#### Função

O Apps Script é responsável pelas ações que alteram a planilha.

As rotas do Next.js enviam requisições para o Web App do Apps Script. O Apps Script recebe a ação, identifica a máquina e altera as abas correspondentes.

#### Ações atuais

```text
salvarSequencia
produzidas
```

#### `salvarSequencia`

Atualiza a ordem da fila ativa da máquina.

Entrada esperada:

```json
{
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

#### `produzidas`

Move peças concluídas da fila ativa para a aba de histórico.

Entrada esperada:

```json
{
  "acao": "produzidas",
  "maquinaId": "6064",
  "desenhos": ["DESENHO-1", "DESENHO-2"]
}
```

#### Observação importante

O código-fonte do Apps Script não está versionado neste repositório. Para manutenção completa, é importante manter uma cópia documentada ou versionada do script usado na implantação.

## Integrações futuras

As integrações abaixo estão documentadas apenas como possibilidades futuras. Não existe implementação atual no projeto.

### Databricks

Propósito previsto:

- consolidar dados históricos de produção;
- cruzar filas, prazos e produção realizada;
- apoiar análises de capacidade, atrasos e gargalos;
- gerar indicadores para planejamento.

### SCADA

Propósito previsto:

- receber sinais de máquinas;
- acompanhar status operacional;
- obter tempos reais de produção ou parada;
- aproximar o sequenciamento da condição real do chão de fábrica.

### MES

Propósito previsto:

- integrar ordens de produção;
- acompanhar execução em tempo real;
- registrar apontamentos produtivos;
- conectar planejamento, produção e histórico em um fluxo mais estruturado.
