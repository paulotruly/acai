# Fontes

Dados verificados em 2 de novembro de 2026.

## Registro de atendimentos da Defesa Civil

- **Origem:** portal de dados abertos da Prefeitura do Recife, conjunto `registro-de-atendimentos-da-defesa-civil`.
- **Licença:** ODbL, conforme declarado no conjunto.
- **Volume declarado:** 2020: 70.122; 2021: 64.855; 2022: 90.425; 2023: 83.164; 2024: 80.173; 2025: 1. Total: 388.740 linhas.
- **Acesso:** API paginada `datastore_search`, limitada a 500 linhas por requisição.

Defeitos conhecidos da publicação:

| Defeito | Tratamento |
|---|---|
| A exportação CSV é interrompida sem erro após cerca de um minuto (22 mil de 83 mil linhas em 2023) | Importação pela API em JSON, com conferência do total |
| Colunas deslocadas uma posição à esquerda em 2020 e 2022 | Realinhamento por linha (RT-DC-02) |
| O logradouro aparece em `Solicitacao` nas linhas deslocadas | Remoção antes da gravação (RT-DC-03) |
| Cabeçalho corrompido, como `MÃªs` | Normalização (RT-DC-01) |
| Caracteres perdidos, como `Colocao de Lonas Plsticas` | Classificação tolerante (RT-DC-04) |
| Grafias variadas de bairro e de grau de risco | Dicionário e normalização (RT-BAI-02 e RT-DC-05) |
| Datas impossíveis, como o ano 0202: 19 datas de solicitação e 8 de ação | Descarte com alerta (RT-DC-06) |
| Linhas idênticas: 388.740 linhas para 365.804 combinações distintas | Mantidas e medidas por `hashLinha`, pois podem ser ações distintas |
| Cada ano está publicado em até três lotes | Importa-se o primeiro lote de cada ano; a igualdade foi conferida somente nos totais |
| O recurso de 2025 tem uma só linha, com data de 2024 | Mantida; não representa cobertura de 2025 |

## Google Notícias

- **Acesso:** feed RSS de busca, com filtros `after:` e `before:`, retornando dezenas de itens por consulta.
- **Limites:** o feed pode omitir resultados acima do teto por consulta; janelas no teto ficam em estado `SATURADA`.
- **Links:** codificados. A URL real é obtida por um método não oficial, que pode deixar de funcionar ([decisão 0001](decisoes/0001-decodificador-google.md)).
- **Frequência:** o Google respondeu HTTP 429 com uma pausa de 1,5 segundo por item. O intervalo atual é de 6 segundos, e a etapa para ao receber esse código.
- **Viés:** os critérios de ordenação não são públicos, e os resultados não são reprodutíveis.

## Páginas dos veículos

As páginas são baixadas com identificação honesta do projeto e respeito ao `robots.txt`. Bloqueios e proibições são registrados e relatados por domínio, sem tentativa de contorno.

## Gemini

- **Modelo:** `gemini-2.5-flash`, configurável por `MODELO_GEMINI`.
- **Cota:** a resposta da API informa o limite de 20 chamadas por dia para `gemini-2.5-flash` no plano gratuito, verificado em 2 de novembro de 2026. O valor é configurável por `GEMINI_LIMITE_DIARIO`.
- **Alternativa:** `gemini-flash-lite-latest` respondeu ao teste, mas sua cota não foi medida. A troca de modelo segue a regra de versionamento de [extração por LLM](06-extracao-llm.md).

## IBGE

A API de localidades fornece os códigos oficiais dos municípios.

## Fontes avaliadas e não utilizadas

| Fonte | Situação |
|---|---|
| GDELT | Todas as tentativas de teste retornaram o aviso de limite de frequência; volume não verificado |
| API WordPress do Marco Zero | Disponível, com 56 resultados para "alagamento"; conector não implementado nesta versão |
| Busca do Gemini | Substituída pelo RSS, por retornar poucas URLs a cada chamada |
