# Sequenciador de Produção

## Objetivo

Sistema web para sequenciamento de produção de máquinas CNC, desenvolvido em Next.js.

O sistema foi criado inicialmente para a máquina 6064 (Deckel), com foco em:

* Redução de trocas de setup
* Priorização por prazo
* Tratamento de peças urgentes
* Controle visual da fila
* Histórico de produção
* Persistência da sequência

---

## Máquina Atual

### 6064 - Deckel

Critérios de sequenciamento:

* Setup atual da máquina
* Morsa ou Mesa de Vácuo
* Prazo
* Urgência
* Agrupamento por setup
* Largura da peça

Regra atual:

* Peças urgentes têm prioridade.
* O setup atual da máquina influencia a sequência.
* Exceções urgentes são tratadas manualmente através da edição da sequência.
* Não existe mais a funcionalidade "Forçar prioridade de setup".

---

## Fluxo Operacional

1. Alimentar a planilha `fichas_usinagem`.
2. Entrar na máquina.
3. Criar sequência.
4. Ajustar manualmente se necessário.
5. Salvar sequência.
6. Operador executa a fila.
7. Marcar peças produzidas.
8. Peças são movidas para `Historico_6064`.

---

## Estrutura da Planilha

### Aba: 6064

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

### Aba: Historico_6064

Armazena:

* Dados completos da peça
* Data de produção

---

## Funcionalidades Implementadas

* Sequenciamento automático
* Edição por drag and drop
* Auto-scroll durante arraste
* Integração com Google Sheets
* Salvamento da sequência
* Histórico de produção
* Persistência entre sessões
* Sincronização via GitHub

---

## Funcionalidades Removidas

### Forçar prioridade de setup

Motivo:

Urgências reais são melhor tratadas manualmente através da edição da sequência.

A funcionalidade adicionava complexidade sem ganho operacional.

---

## Próximas Etapas

### Fase 1 - Consolidação da 6064

* Continuar validação operacional
* Ajustes de usabilidade
* Ajustes de layout
* Definir estratégia de hospedagem

### Fase 2 - Novas Máquinas

Possíveis expansões:

* Torno
* Outras máquinas CNC

Cada máquina possuirá regras próprias de decisão e sequenciamento.

---

## Tecnologias

* Next.js
* React
* TypeScript
* Google Sheets
* Google Apps Script
* GitHub

---

## Repositório

Responsável pelo projeto: Ricardo Poerschke

Projeto em desenvolvimento contínuo.



Após ajuste de regra do dia 31/05/2026

# Sequenciador de Produção

Sistema web para sequenciamento de produção de máquinas CNC desenvolvido em Next.js.

O projeto foi criado inicialmente para a máquina 6064 (Deckel) com foco em:

* Redução de trocas de setup
* Priorização por prazo
* Agrupamento de peças por conjunto
* Controle visual da fila
* Histórico de produção
* Persistência da sequência
* Integração com Google Sheets

---

## Funcionalidades

### Sequenciamento

* Geração automática da sequência
* Consideração de prazo
* Agrupamento por conjunto/família
* Consideração de setup
* Tratamento de urgências

### Edição

* Drag and drop
* Auto-scroll durante movimentação
* Ajuste manual da sequência

### Produção

* Marcação de peças produzidas
* Histórico persistente
* Controle de fila ativa

---

## Estrutura

### Máquina atual

* 6064 - Deckel

### Próximas expansões

* Torno CNC
* Outras máquinas de usinagem

---

## Tecnologias

* Next.js
* React
* TypeScript
* Tailwind CSS
* Google Sheets
* Google Apps Script
* GitHub

---

## Fluxo Operacional

1. Alimentar a planilha de fichas.
2. Criar sequência.
3. Ajustar sequência se necessário.
4. Salvar sequência.
5. Executar produção.
6. Marcar produzidas.
7. Consultar histórico.

---

## Documentação Completa

Consultar:

```text
docs/projeto.md
```

---

Projeto em desenvolvimento contínuo com validação operacional em ambiente real de produção.
