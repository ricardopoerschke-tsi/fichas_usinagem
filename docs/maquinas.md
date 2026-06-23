# Máquinas

Este documento descreve as máquinas atualmente cadastradas no projeto e suas regras de sequenciamento conforme o código existente.

As informações de nome, tipo, material, abas e rotas foram extraídas de `lib/machines`. Os critérios de prioridade e agrupamento foram extraídos dos arquivos em `sequencing`.

## 6064

### Cadastro

- Nome: Deckel
- Tipo: Fresadora CNC
- Finalidade documentada no projeto: máquina piloto do sequenciador de produção
- Material predominante: Alumínio
- Aba da fila: `6064`
- Aba de histórico: `Historico_6064`
- Arquivo da regra: `sequencing/sequenciar6064.ts`

### Características importantes

- Usa conceito de setup atual.
- Setups considerados:
  - `morsa`;
  - `vacuo`.
- A definição do setup da peça é baseada na largura:
  - largura até 400: `morsa`;
  - largura acima de 400: `vacuo`.

### Critérios de prioridade

A regra compara as peças nesta ordem:

1. Urgência.
2. Prazo, quando a diferença entre prazos é maior que 2 dias.
3. Compatibilidade com o setup atual.
4. Conjunto.
5. Prazo.
6. Largura.

### Critérios de agrupamento

O agrupamento por conjunto usa:

- `ordem`, quando preenchida e diferente de `-` ou `Sem OF`;
- caso contrário, `observacoes`.

### Regras especiais

- Se o setup atual for `morsa`, a ordenação final por largura é crescente.
- Se o setup atual for `vacuo`, a ordenação final por largura é decrescente.
- A regra aceita prazos como datas e também trata textos como `Hoje` e `Amanhã`.

## 5825

### Cadastro

- Nome: Torno CNC
- Tipo: Torno CNC
- Finalidade extraída da regra: sequenciar peças considerando bitola, material e modelo de castanha
- Material predominante: Aço
- Aba da fila: `5825`
- Aba de histórico: `Historico_5825`
- Arquivo da regra: `sequencing/sequenciar5825.ts`

### Características importantes

- Trabalha com diâmetro/bitola extraído de `dimensoes`.
- Calcula bitola bruta a partir do material e da bitola final.
- Usa tabela interna de modelos de castanha.
- Possui lista de castanhas dedicadas.

### Critérios de prioridade

A regra compara as peças nesta ordem:

1. Urgência.
2. Janela de prazo de 2 dias.
3. Prioridade de castanha dedicada.
4. Modelo de castanha.
5. Prazo.
6. Material.
7. Bitola bruta.
8. Diâmetro final.

### Critérios de agrupamento

O agrupamento ocorre indiretamente pela ordenação de:

- janela de prazo;
- castanha dedicada;
- modelo de castanha;
- material;
- bitola bruta;
- diâmetro final.

### Regras especiais

- Castanhas dedicadas têm prioridade quando a quantidade é maior que 30 e a bitola está na lista dedicada.
- A bitola `8` é tratada como transição entre os modelos de castanha 2 e 3.
- Quando o material não está na tabela de bitolas brutas, a regra usa a própria bitola final.

## 1572

### Cadastro

- Nome: Fresadora
- Tipo: Fresadora Convencional
- Finalidade extraída da regra: sequenciar considerando prazo interno, processos adicionais, ferramenta e dimensões
- Material predominante: Aço
- Aba da fila: `1572`
- Aba de histórico: `Historico_1572`
- Arquivo da regra: `sequencing/sequenciar1572.ts`

### Características importantes

- Usa regras compartilhadas de fluxo produtivo em `sequencing/regrasFluxoProdutivo.ts`.
- Considera prazo interno com antecipação de 20 dias.
- Calcula ferramenta mínima pela maior medida entre largura e espessura.
- Trabalha com ferramentas de referência:
  - 63;
  - 100;
  - 125;
  - 999 para casos acima da faixa prevista.

### Critérios de prioridade

A regra compara as peças nesta ordem:

1. Urgência produtiva.
2. Processo adicional.
3. Prazo interno.
4. Ferramenta de sequenciamento.
5. Grupo de comprimento.
6. Faixa de largura.
7. Faixa de espessura.
8. Comprimento.
9. Inox 304.
10. Material.
11. Desenho.

### Critérios de agrupamento

O agrupamento considera:

- urgência produtiva;
- existência de processo adicional;
- prazo interno;
- grupo de comprimento.

### Regras especiais

- Peças com processo adicional recebem prioridade segundo as regras compartilhadas.
- O prazo interno é calculado subtraindo 20 dias do prazo final.
- Peças com comprimento acima de 225 entram em outro grupo de comprimento.
- A ferramenta de sequenciamento pode ser ajustada por quantidade para evitar trocas pouco vantajosas.
- Inox 304 recebe tratamento específico na ordenação.

## 1516

### Cadastro

- Nome: Mandriladora
- Tipo: Mandriladora Convencional
- Finalidade extraída da regra: sequenciar por prazo interno, processo adicional e ferramenta compatível
- Material predominante: Aço
- Aba da fila: `1516`
- Aba de histórico: `Historico_1516`
- Arquivo da regra: `sequencing/sequenciar1516.ts`

### Características importantes

- Usa regras compartilhadas de fluxo produtivo em `sequencing/regrasFluxoProdutivo.ts`.
- Considera prazo interno com antecipação de 15 dias.
- Classifica peças por ferramenta:
  - 63;
  - 100;
  - 125.
- A ferramenta mínima é calculada verificando se largura ou espessura cabe na ferramenta.

### Critérios de prioridade

A regra compara as peças nesta ordem:

1. Urgência produtiva.
2. Processo adicional.
3. Prazo interno.

Depois disso, cada grupo é sequenciado internamente por ferramenta e dimensões.

### Critérios de agrupamento

As peças são agrupadas por:

- urgência produtiva;
- prioridade de processo adicional;
- prazo interno.

Dentro do grupo, a regra separa:

- pequenas para ferramenta 63;
- médias para ferramenta 100;
- grandes para ferramenta 125.

### Regras especiais

- Se houver peças grandes para ferramenta 125, o grupo prioriza grandes, depois médias e depois parte das pequenas.
- Se houver peças médias para ferramenta 100, o grupo prioriza médias e depois parte das pequenas.
- A regra pode puxar peças pequenas da ferramenta 63 até o limite de quantidade 10.
- Dentro de cada faixa de ferramenta, a ordenação considera comprimento e material.
- A função retorna as peças com a propriedade `sequencia` preenchida.

## 725

### Cadastro

- Nome: Induma CNC
- Tipo: Fresa CNC
- Finalidade cadastrada: Fresa para espessura CNC
- Material predominante: Aço
- Aba da fila: `725`
- Aba de histórico: `Historico_725`
- Arquivo da regra: `sequencing/sequenciar725.ts`

### Características importantes

- Considera uma mesa com:
  - largura: 700;
  - comprimento: 400;
  - área útil: 280000.
- Extrai largura, comprimento e espessura do campo `dimensoes`.
- Verifica se a peça cabe na mesa na posição original ou rotacionada.
- Forma lotes de mesa dentro do limite de área útil.

### Critérios de prioridade

A regra compara as peças nesta ordem:

1. Tarja vermelha ou urgência.
2. Prazo final.
3. Espessura.
4. Material.

### Critérios de agrupamento

As peças são agrupadas por:

- urgência/tarja vermelha;
- prazo final;
- espessura;
- material.

Dentro de cada grupo, a montagem da mesa ordena por:

- maior área primeiro;
- ordem;
- desenho.

### Regras especiais

- A peça é considerada urgente quando `urgente` é verdadeiro ou quando descrição/observações contêm indicação de tarja vermelha.
- Peças que não cabem na mesa ou excedem a área útil entram em lote individual.
- Peças compatíveis são agrupadas em lotes enquanto a soma das áreas couber na área útil da mesa.
