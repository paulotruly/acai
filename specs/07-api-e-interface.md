# API e interface

## API pública

A API é somente de leitura, com base em `/api`. As respostas seguem o formato `{ success, message, data }`.

| Rota | Função |
|---|---|
| `GET /noticias` | Lista paginada. Filtros: `pagina`, `porPagina` (até 100), `busca`, `tipoEventoId`, `municipioId`, `de`, `ate` |
| `GET /noticias/:id` | Uma notícia; identificador inválido retorna 400 |
| `GET /tipos-evento` e `GET /municipios` | Dicionários para filtros |
| `GET /indicadores` | Agregações calculadas no servidor, com cache de cinco minutos |

Requisitos:

- **API-01:** não expor senha, endereço, localidade, `textoCompleto`, `depoimentoMorador` nem `ruaOuPontoDeReferencia`.
- **API-02:** não existem rotas públicas de escrita nem de usuários.
- **API-03:** notícias e atendimentos ficam em blocos separados, sem soma.
- **API-04:** categorias e bairros de atendimentos com menos de cinco registros não são publicados.
- **API-05:** duplicatas não entram em listas nem em contagens.

## Interface pública

| Página | Conteúdo |
|---|---|
| `/` | Apresentação, números principais, gráficos por ano, categoria, bairro e município, notícias recentes e aviso de emergência |
| `/noticias` | Busca, filtros por tipo e município mantidos na URL e paginação |
| `/metodologia` | Fontes, tratamento, privacidade e limites de uso |

Requisitos:

- **INT-01:** títulos e textos seguem a regra de redação de `specs/README.md`.
- **INT-02:** a interface não apresenta registros ou notícias como número de desastres.
- **INT-03:** a página informa que a extração é automática e remete à fonte original.
- **INT-04:** há aviso de que o site não é um serviço de alerta.
- **INT-05:** identificadores técnicos, como `falta_de_agua`, nunca aparecem crus.
- **INT-06:** o layout funciona em largura de celular, com rótulos acessíveis e estados de carregamento, vazio e erro.

O nome "Observatório de desastres do Recife" é provisório e aguarda confirmação.
