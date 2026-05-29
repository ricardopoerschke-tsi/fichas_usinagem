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
