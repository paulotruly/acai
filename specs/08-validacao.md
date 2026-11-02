# Validação

Os limiares abaixo são propostas, a confirmar com a orientação. **Nenhum deles foi medido até o momento.**

## Importação da Defesa Civil

- O total gravado por recurso deve ser igual ao declarado; a importação falha caso contrário.
- A taxa de linhas sem data, com colunas deslocadas e com bairro fora do dicionário deve ser relatada por ano.
- A semântica de "uma linha" deve ser confirmada com a Prefeitura.

## Conjunto de referência das notícias

Anotar manualmente 150 itens em amostra aleatória, preferencialmente com dois anotadores e concordância medida.

| Métrica | Limiar proposto |
|---|---|
| Precisão da relevância | Ao menos 0,90 |
| Revocação da relevância | Ao menos 0,85 |
| Precisão do município principal | Ao menos 0,90 |

## Filtro de título

Auditar 100 itens em `DESCARTADO_TITULO`, para estimar quantas notícias relevantes são descartadas.

## Cobertura

Relatar o funil por fonte, mês e município, por meio da etapa `relatorio`, e os bloqueios por domínio.

## Eventos de controle

Definir uma lista prévia de eventos conhecidos e conferir se a base os recupera. O primeiro é o das chuvas de maio de 2022, na região metropolitana.

## Comparação entre fontes

A comparação só é válida no Recife, de 2020 a 2024, considerando que notícias medem atenção da imprensa e atendimentos medem demanda e capacidade operacional.
