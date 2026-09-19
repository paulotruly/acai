# Backend — Pesquisa Científica

API responsável por coletar e estruturar fatos extraídos de notícias/posts sobre
eventos de desastre (enchente, alagamento, deslizamento, falta d'água etc.). A
etapa de pesquisa/extração usa a **API do Gemini (Google)**: o endpoint de
busca envia o termo pesquisado para o Gemini, que usa a busca do Google para
encontrar notícias/posts reais e retornar os fatos já estruturados, que são
então salvos no banco. A API do Gemini tem uma camada gratuita (limitada por
taxa de requisições) nos modelos da família Flash, sem necessidade de cartão
de crédito — ver [ai.google.dev/gemini-api/docs/pricing](https://ai.google.dev/gemini-api/docs/pricing).

## Stack

- **Node.js + TypeScript** (ESM)
- **Express 5** — HTTP/rotas
- **Prisma 7** com adapter `@prisma/adapter-mariadb` — ORM sobre **MySQL/MariaDB**
- **Zod** — validação de entrada
- **`@google/genai`** — chamadas à API do Gemini (pesquisa + extração)
- `tsx` para dev com hot reload

## Estrutura de pastas

```
backend/
├── prisma/
│   ├── schema.prisma      # modelos do banco (em português)
│   ├── seed.ts            # dados iniciais (usuário admin + tipos de evento)
│   └── migrations/        # geradas por `prisma migrate dev`
├── src/
│   ├── server.ts          # ponto de entrada (sobe o servidor HTTP)
│   ├── app.ts             # instância do Express, middlewares, rota /health
│   ├── config/
│   │   ├── env.ts         # validação das variáveis de ambiente
│   │   └── database.ts    # instância do PrismaClient
│   ├── routes/index.ts    # mapeamento de rotas -> controllers
│   ├── controller/index.ts# validação (zod) + resposta HTTP
│   ├── service/
│   │   ├── index.ts               # regras de negócio + acesso ao Prisma
│   │   └── extracaoNoticias.ts    # chamada ao Gemini (busca no Google + extração)
│   ├── type/index.ts      # tipos compartilhados (DTOs)
│   └── generated/prisma/  # client do Prisma gerado (não versionado)
└── .env.example
```

Cada camada segue o mesmo padrão: um objeto exportado por recurso (ex.
`usuarioController`, `noticiaController`), sem classes.

## Modelo de dados

### `TipoEvento`
Tabela de tipos de evento (a única normalizada em tabela própria, por ser a
categorização mais importante). Campos: `id`, `nome` (único, ex: `enchente`,
`alagamento`, `deslizamento`, `falta_de_agua`, `incendio`, `outro`).

### `Noticia`
Um registro por notícia/post, já com os fatos extraídos pelo Gemini (ou `null`
quando a extração não conseguiu identificar aquele campo):

| Campo                     | Tipo             | Observação                                  |
|---------------------------|------------------|----------------------------------------------|
| `titulo`                  | string?          | título da notícia, se identificado           |
| `data`                    | datetime?        |                                                |
| `fonte`                   | string           | portal de notícia ou rede social              |
| `url`                     | string (único)   | link original — evita reprocessar/duplicar    |
| `textoCompleto`           | text             | texto completo da notícia                     |
| `tipoEvento`              | relação opcional | FK para `TipoEvento`                          |
| `localizacaoTexto`        | string?          | local mencionado, como aparece no texto       |
| `bairro`                  | string?          | bairro, se tiver                              |
| `ruaOuPontoDeReferencia`  | string?          | rua/ponto de referência, se tiver             |
| `pessoasAfetadas`         | text?            | quem foi afetado, se tiver                    |
| `danoMaterial`            | text?            | danos materiais, se tiver                     |
| `problemaInfraestrutura`  | text?            | problema de infraestrutura, se explícito      |
| `depoimentoMorador`       | text?            | relato direto de morador, se tiver            |
| `depoimentoInstituicao`   | text?            | fala de prefeitura/defesa civil/Compesa etc.  |
| `sentimento`              | enum?            | `POSITIVO \| NEGATIVO \| NEUTRO \| MISTO`     |
| `temas`                   | json?            | array de temas, ex: `["enchente", "infraestrutura"]` |
| `latitude`/`longitude`    | float?           |                                                |

## Como rodar

### Pré-requisitos
- Node.js 20+
- Um servidor MySQL/MariaDB acessível
- Uma chave de API do Gemini, gratuita, gerada em [aistudio.google.com/apikey](https://aistudio.google.com/apikey)

### Passo a passo

```bash
cd backend
npm install

# copie o exemplo e ajuste com suas credenciais reais
cp .env.example .env
```

Edite `.env`:

```
URL_BANCO_DE_DADOS="mysql://usuario:senha@localhost:3306/pesquisa_cientifica"
PORTA=3000
CHAVE_API_GEMINI="AIza..."
MODELO_GEMINI="gemini-flash-latest"
```

Depois:

```bash
npm run prisma:generate   # gera o Prisma Client
npm run prisma:migrate    # cria o banco/tabelas (prisma migrate dev)
npm run db:seed           # popula o usuário admin e os TipoEvento iniciais
npm run dev                # sobe a API em http://localhost:3000 (hot reload)
```

Outros scripts úteis:

```bash
npm run build          # compila TypeScript -> dist/
npm run start           # roda o build compilado (dist/server.js)
npm run lint             # type-check sem gerar build (tsc --noEmit)
npm run prisma:studio   # abre o Prisma Studio (UI do banco)
```

## Endpoints

Prefixo base: `/api` (fora do prefixo só existe `GET /health`).

| Método | Rota                     | Descrição                                                                 |
|--------|--------------------------|----------------------------------------------------------------------------|
| GET    | `/health`                | healthcheck (fora do prefixo `/api`)                                       |
| GET    | `/api/usuarios`          | lista usuários                                                              |
| POST   | `/api/usuarios`          | cria usuário (`email`, `nome?`, `senha`)                                   |
| GET    | `/api/tipos-evento`      | lista os tipos de evento cadastrados                                       |
| GET    | `/api/noticias`          | lista as notícias/eventos salvos                                           |
| GET    | `/api/noticias/:id`      | busca uma notícia/evento por id                                            |
| POST   | `/api/noticias`          | cria uma notícia/evento manualmente (mesmos campos da tabela)              |
| POST   | `/api/noticias/pesquisar`| **pesquisa via Gemini**: recebe `{ consulta, quantidade? }`, o Gemini busca notícias reais no Google, extrai os fatos e salva as que ainda não existem (por `url`), pulando duplicatas |

### Exemplo — pesquisa via Gemini

```bash
curl -X POST http://localhost:3000/api/noticias/pesquisar \
  -H "Content-Type: application/json" \
  -d '{"consulta": "enchente recife", "quantidade": 3}'
```

Rodar o mesmo comando de novo tende a retornar `ignoradas` maior que zero, já
que notícias com a mesma `url` encontradas novamente não são duplicadas.

Todas as respostas seguem o formato:

```json
{ "success": true, "message": "...", "data": { } }
```
