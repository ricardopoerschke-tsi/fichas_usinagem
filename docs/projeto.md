# PROJETO: SEQUENCIADOR DE PRODUÇÃO

## Visão Geral

Sistema web desenvolvido para auxiliar o sequenciamento de produção de máquinas CNC.

O objetivo principal é reduzir trocas de setup, organizar a fila de produção, tratar urgências de forma controlada e fornecer rastreabilidade da produção realizada.

O projeto foi iniciado utilizando a máquina 6064 (Deckel) como piloto.

O desenvolvimento está sendo realizado por Ricardo Poerschke utilizando Next.js, React, TypeScript, Google Sheets e Google Apps Script.

---

# Objetivos do Projeto

## Objetivos Operacionais

* Reduzir trocas de setup.
* Organizar a fila de produção.
* Melhorar o cumprimento de prazos.
* Permitir ajustes rápidos para urgências.
* Registrar histórico de produção.
* Facilitar o trabalho do operador e do planejador.

## Objetivos Futuros

* Controle de capacidade.
* Controle de demanda.
* APS simplificado.
* Indicadores de produção.
* Expansão para outras máquinas.

---

# Status Atual

## Fase 1 - Máquina 6064

### Concluído

* Sequenciamento automático.
* Edição manual da sequência.
* Drag and drop.
* Auto-scroll durante drag.
* Integração com Google Sheets.
* Salvamento da sequência.
* Persistência da fila.
* Histórico de produção.
* Contador real de produzidas.
* Sincronização via GitHub.

### Em validação

* Uso operacional contínuo.
* Ajustes de ergonomia.
* Ajustes visuais.
* Refinamento das regras.

### Não iniciado

* Hospedagem.
* Segunda máquina.
* Controle de capacidade.

---

# Arquitetura

## Frontend

Tecnologias:

* Next.js
* React
* TypeScript
* Tailwind CSS

Arquivos principais:

```text
app/page.tsx
```

Responsável por:

* Navegação.
* Sequenciamento.
* Edição.
* Histórico.
* Integração com APIs.

---

## APIs

### Leitura da fila

```text
/api/fichas/6064
```

Função:

Ler a aba:

```text
6064
```

da planilha.

---

### Salvar sequência

```text
/api/fichas/salvar
```

Função:

Atualizar a ordem da planilha.

---

### Produzidas

```text
/api/fichas/produzidas
```

Função:

Mover peças produzidas para histórico.

---

### Histórico

```text
/api/fichas/historico/6064
```

Função:

Ler a aba:

```text
Historico_6064
```

---

# Estrutura da Planilha

## Planilha Principal

Nome:

```text
fichas_usinagem
```

---

## Aba 6064

Campos:

* Sequência
* Desenho
* Ordem mes
* Descrição
* Quantidade
* Material
* Dimensões
* Ordem
* Prazo
* Observações

Função:

Fila ativa da máquina.

---

## Aba Historico_6064

Função:

Armazenar peças produzidas.

Contém:

* Todos os dados da peça.
* Data de produção.

---

# Regras da Máquina 6064

## Classificação de Setup

### Morsa

```text
largura <= 400
```

### Mesa de Vácuo

```text
largura > 400
```

---

## Critérios de Priorização

Ordem atual:

1. Urgência
2. Setup atual
3. Prazo
4. Largura

---

## Conceito de Setup Atual

O setup atual representa a condição real da máquina.

Exemplo:

```text
Morsa
```

ou

```text
Mesa de vácuo
```

O sistema prioriza peças compatíveis com o setup atual.

---

# Fluxo Operacional

## Criar Sequência

1. Alimentar a planilha.
2. Entrar na máquina.
3. Definir setup atual.
4. Criar sequência.

Resultado:

Fila otimizada automaticamente.

---

## Editar Sequência

Permite:

* Reordenar peças.
* Tratar urgências.
* Ajustar fila manualmente.

---

## Ver Sequência

Permite:

* Consultar fila ativa.
* Selecionar produzidas.

Não permite:

* Alterar setup.
* Alterar sequência.

---

## Marcar Produzidas

Ao marcar produzidas:

1. Remove da aba 6064.
2. Move para Historico_6064.
3. Atualiza contador de histórico.

---

# Tratamento de Urgências

## Estratégia Atual

Urgências são tratadas manualmente.

Fluxo:

1. Inserir peça na planilha.
2. Editar sequência.
3. Arrastar para posição desejada.
4. Salvar.

---

## Motivo

Urgências são exceções.

Recalcular toda a fila pode gerar novos atrasos.

A decisão operacional humana mostrou-se mais eficiente.

---

# Decisões Tomadas

## Funcionalidade Removida

### Forçar prioridade de setup

Status:

REMOVIDA

Descrição:

Permitia forçar:

* Morsa
* Mesa de vácuo

Motivo da remoção:

Durante uso real verificou-se que:

* Urgências são raras.
* O ajuste manual resolve melhor.
* A funcionalidade aumentava a complexidade.
* Poderia gerar replanejamentos desnecessários.

Conclusão:

A edição manual é suficiente.

---

# Lições Aprendidas

Durante os primeiros dias de uso:

* Operadores conseguem seguir a sequência.
* A lógica de setup está funcionando.
* A edição manual resolve exceções.
* Histórico deve ficar persistido na planilha.
* Menos automação é melhor quando a exceção é rara.
* O sistema deve auxiliar a decisão, não substituir o planejador.

---

# Estratégia de Hospedagem

Situação atual:

Não hospedado.

Motivo:

Contém informações internas da empresa.

Antes de publicar avaliar:

* Aprovação da empresa.
* Aprovação do TI.
* Estratégia de segurança.

---

# Expansão Futura

## Segunda Máquina

Possível candidato:

```text
Torno
```

Importante:

Cada máquina possui regras próprias.

A interface pode ser reaproveitada.

As regras de sequenciamento deverão ser específicas por máquina.

---

# Ideias Futuras

## Capacidade x Demanda

Possibilidade futura:

Utilizar:

* Tempo padrão.
* Tempo de setup.
* Capacidade diária.

Para calcular:

* Ocupação.
* Gargalos.
* Atrasos.
* Capacidade disponível.

---

## APS Simplificado

Futuro possível:

Planejamento automático entre múltiplas máquinas.

---

# GitHub

Repositório:

```text
fichas_usinagem
```

Estratégia:

Toda alteração relevante deve ser:

```bash
git add .
git commit -m "descricao"
git push
```

---

# Responsável

Ricardo Poerschke

Projeto em evolução contínua baseado em uso real no chão de fábrica.



Ajuste Feito no dia 31/05/26
# Regra de Sequenciamento da Máquina 6064

## Conceito Geral

O sequenciamento da máquina 6064 não é baseado apenas em setup ou prazo.

A lógica foi construída a partir da forma como o planejamento é realizado na prática, buscando equilibrar:

* Cumprimento de prazos.
* Redução de setups.
* Agrupamento de peças relacionadas.
* Aproveitamento da preparação da máquina.
* Continuidade operacional.

---

## Hierarquia de Decisão

### 1. Prazo (Regra Principal)

O prazo é o principal critério de decisão.

As peças devem ser agrupadas e organizadas respeitando primeiramente a data de entrega.

Objetivo:

* Evitar atrasos.
* Priorizar necessidades reais da produção.
* Garantir cumprimento dos compromissos de entrega.

---

### 2. Conjunto / Família de Peças

Após considerar o prazo, devem ser identificadas peças pertencentes ao mesmo conjunto.

Exemplos de identificação:

* Mesma OF.
* Mesmo projeto.
* Mesma ferramenta.
* Mesma referência.
* Mesmo conjunto mecânico.

Sempre que possível, peças do mesmo conjunto devem ser produzidas em sequência.

Objetivo:

* Aproveitar preparação.
* Reduzir movimentação.
* Facilitar conferência.
* Reduzir retrabalho.

---

### 3. Largura da Peça

Dentro de um conjunto, a ordem das peças deve considerar a largura.

A lógica não é simplesmente ordenar por maior ou menor dimensão.

A sequência deve buscar continuidade em relação à peça anterior produzida.

Exemplo:

Peça atual:

```text
200 mm
```

Próximo conjunto:

```text
300 mm
150 mm
50 mm
```

Sequência recomendada:

```text
300 mm
150 mm
50 mm
```

Objetivo:

* Reduzir ajustes.
* Facilitar preparação.
* Melhorar fluidez da produção.

---

### 4. Setup

O setup é importante, mas não possui prioridade absoluta.

O sistema deve buscar agrupar peças compatíveis com o setup atual da máquina.

Exemplos:

* Morsa
* Mesa de vácuo

Objetivo:

* Reduzir trocas de setup.
* Aumentar produtividade.
* Melhorar aproveitamento da máquina.

---

## Regra de Tolerância de Prazo para Priorização de Setup

O setup pode ser priorizado somente quando não gerar atraso significativo.

### Exemplo 1

Peças:

```text
Peça A
Prazo: 08/10
Setup: Morsa

Peça B
Prazo: 08/10
Setup: Morsa

Peça C
Prazo: 07/10
Setup: Mesa de vácuo
```

Decisão:

```text
A
B
C
```

Motivo:

A diferença de prazo é pequena e não justifica uma troca imediata de setup.

---

### Exemplo 2

Peças:

```text
Peça A
Prazo: 08/10
Setup: Morsa

Peça B
Prazo: 08/10
Setup: Morsa

Peça C
Prazo: 05/10
Setup: Mesa de vácuo
```

Decisão:

```text
C
A
B
```

Motivo:

A diferença de prazo é superior ao limite aceitável.

Neste caso o prazo deve prevalecer sobre o setup.

---

## Regra dos Dois Dias

Como regra operacional:

```text
Priorizar setup é permitido
desde que isso não gere atraso superior a dois dias
em relação ao prazo de outra peça.
```

Quando a diferença de prazo ultrapassar dois dias:

```text
Prazo tem prioridade sobre setup.
```

---

## Resumo da Lógica Atual

Hierarquia utilizada pelo planejador:

1. Prazo.
2. Conjunto/Família.
3. Largura.
4. Setup.

Regra especial:

* Setup pode ser priorizado.
* Prazo sempre prevalece quando a diferença for superior a dois dias.

---

## Observação Importante

Esta regra representa a lógica real utilizada na operação da máquina 6064 e deve servir como referência para futuras melhorias do algoritmo de sequenciamento.
