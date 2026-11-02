# Regras de tratamento

Todas as regras abaixo estão no estado **implementada**, salvo indicação. Os testes ficam em `backend/src/pipeline/tratamento/tratamento.test.ts`.

## URL

| Identificador | Regra |
|---|---|
| RT-URL-01 | A canonização remove parâmetros de rastreio, fragmento, barra final e prefixos `www`, `m` e `amp`, e mantém os parâmetros de conteúdo |
| RT-URL-02 | A URL canônica declarada pela página tem prioridade |

## Texto

| Identificador | Regra |
|---|---|
| RT-TXT-01 | A leitura de metatags aceita apóstrofos e qualquer ordem de atributos |
| RT-TXT-02 | Entidades HTML nominais, decimais e hexadecimais são decodificadas uma única vez |
| RT-TXT-03 | A decodificação respeita o conjunto de caracteres declarado |
| RT-TXT-04 | O `articleBody` do JSON-LD tem prioridade sobre os parágrafos |
| RT-TXT-05 | O texto ignora navegação, rodapé e parágrafos curtos |

## Título

| Identificador | Regra |
|---|---|
| RT-TIT-01 | Remove-se o sufixo igual ao nome da fonte |
| RT-TIT-02 | Títulos sem esse sufixo permanecem inalterados |

## Data

| Identificador | Regra |
|---|---|
| RT-DAT-01 | A data de publicação é o dia civil no fuso `America/Recife` |
| RT-DAT-02 | Sem menção no texto, a data do evento permanece nula e nunca herda a publicação |
| RT-DAT-03 | Uma data de evento posterior à publicação é rejeitada |

## Território

| Identificador | Regra |
|---|---|
| RT-TER-01 | Um bairro homônimo em outro estado não indica município do recorte |
| RT-TER-02 | Logradouros e sobrenomes não indicam os municípios de Paulista, Moreno ou Goiana |
| RT-TER-03 | Formas usuais, como Jaboatão, são reconhecidas |

## Bairro

| Identificador | Regra |
|---|---|
| RT-BAI-01 | Trechos sem nome próprio, como "134 bairros no total", não viram bairro |
| RT-BAI-02 | Variantes de grafia são normalizadas pelo dicionário de bairros e sinônimos |
| RT-BAI-03 | Um nome desconhecido não recebe vínculo, e o texto original é preservado |

## Extração

| Identificador | Regra |
|---|---|
| RT-LLM-01 | A evidência precisa constar do título ou do texto, após normalização |
| RT-LLM-02 | Um tema fora do vocabulário vira `outro` |
| RT-FIL-01 | Títulos sem relação com o tema são descartados antes do LLM |

## Duplicatas

| Identificador | Regra |
|---|---|
| RT-DUP-01 | Textos iguais, salvo formatação, têm o mesmo hash e não contam como notícias distintas |

## Coleta

| Identificador | Regra |
|---|---|
| RT-COL-01 | A leitura do RSS decodifica título, fonte e data |
| RT-COL-02 | Cada consulta restringe município e período |
| RT-COL-03 | Valem somente as regras do `robots.txt` aplicáveis a qualquer robô |
| RT-COL-04 | Curingas do `robots.txt` são interpretados e não bloqueiam o site inteiro |
| RT-COL-05 | Vale a regra mais específica do `robots.txt` |

## Defesa Civil

| Identificador | Regra |
|---|---|
| RT-DC-01 | Cabeçalhos corrompidos são corrigidos, e uma coluna desconhecida interrompe a importação |
| RT-DC-02 | Linhas com colunas deslocadas são realinhadas |
| RT-DC-03 | Endereços e logradouros nunca são gravados em campos analíticos |
| RT-DC-04 | Categorias com caracteres perdidos são reconhecidas |
| RT-DC-05 | O grau de risco é normalizado, e valores inválidos são descartados |
| RT-DC-06 | Datas anteriores a 2020 ou futuras, como o ano 0202, são descartadas com alerta |

## Limitações conhecidas

- O vínculo a um bairro presume o Recife quando o município é citado. Bairros que também existem em municípios vizinhos, como Peixinhos, podem ser atribuídos incorretamente.
- A citação de um município não indica que o evento ocorreu nele; matérias de balanço citam muitos municípios.
- A deduplicação só identifica textos idênticos, e não matérias diferentes sobre o mesmo fato.
