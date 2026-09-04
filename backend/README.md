# Backend — Pesquisa Científica

API responsável por coletar e estruturar fatos extraídos de notícias/posts sobre
eventos de desastre (enchente, alagamento, deslizamento, falta d'água etc.). Por
enquanto a etapa de "pesquisa"/extração via IA é **mockada**: existe um endpoint
que gera notícias fake plausíveis e as salva no banco, para validar o pipeline e
o schema antes de plugar uma fonte real (scraping/IA).

## Stack

- **Node.js + TypeScript** (ESM)
- **Express 5** — HTTP/rotas
- **Prisma 7** com adapter `@prisma/adapter-mariadb` — ORM sobre **MySQL/MariaDB**
- **Zod** — validação de entrada
- `tsx` para dev com hot reload

## Estrutura de pastas

```
backend/
├── prisma/
│   ├── schema.prisma      # modelos do banco
│   ├── seed.ts            # dados iniciais (admin + tipos de evento)
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
│   │   └── mockNewsExtraction.ts  # gerador mockado de notícias fake
│   ├── type/index.ts      # tipos compartilhados (DTOs)
│   └── generated/prisma/  # client do Prisma gerado (não versionado)
└── .env.example
```

Cada camada segue o mesmo padrão: um objeto exportado por recurso (ex.
`userController`, `newsEventController`), sem classes.

## Modelo de dados

### `EventType`
Tabela de tipos de evento (a única normalizada em tabela própria, por ser a
categorização mais importante). Campos: `id`, `name` (único, ex: `enchente`,
`alagamento`, `deslizamento`, `falta_de_agua`, `incendio`, `outro`).

### `NewsEvent`
Um registro por notícia/post, já com os fatos extraídos (ou `null` quando a
extração não conseguiu identificar aquele campo):

| Campo                 | Tipo             | Observação                                  |
|-----------------------|------------------|----------------------------------------------|
| `title`               | string?          | título da notícia, se identificado           |
| `date`                | datetime?        |                                                |
| `source`              | string           | portal de notícia ou rede social              |
| `url`                 | string (único)   | link original — evita reprocessar/duplicar    |
| `fullText`            | text             | texto completo da notícia                     |
| `eventType`           | relação opcional | FK para `EventType` (mockado por ora)         |
| `locationText`        | string?          | local mencionado, como aparece no texto       |
| `neighborhood`        | string?          | bairro, se tiver                              |
| `streetOrLandmark`    | string?          | rua/ponto de referência, se tiver             |
| `peopleAffected`      | text?            | quem foi afetado, se tiver                    |
| `materialDamage`      | text?            | danos materiais, se tiver                     |
| `infrastructureIssue` | text?            | problema de infraestrutura, se explícito      |
| `residentQuote`       | text?            | relato direto de morador, se tiver            |
| `institutionQuote`    | text?            | fala de prefeitura/defesa civil/Compesa etc.  |
| `sentiment`           | enum?            | `POSITIVE \| NEGATIVE \| NEUTRAL \| MIXED`    |
| `themes`              | json?            | array de temas, ex: `["enchente", "infraestrutura"]` |
| `latitude`/`longitude`| float?           |                                                |

## Como rodar

### Pré-requisitos
- Node.js 20+
- Um servidor MySQL/MariaDB acessível

### Passo a passo

```bash
cd backend
npm install

# copie o exemplo e ajuste com suas credenciais reais de banco
cp .env.example .env
```

Edite `.env`:

```
DATABASE_URL="mysql://usuario:senha@localhost:3306/pesquisa_cientifica"
PORT=3000
```

Depois:

```bash
npm run prisma:generate   # gera o Prisma Client
npm run prisma:migrate    # cria o banco/tabelas (prisma migrate dev)
npm run db:seed           # popula o usuário admin e os EventType iniciais
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
| GET    | `/api/users`             | lista usuários                                                              |
| POST   | `/api/users`             | cria usuário (`email`, `name?`, `password`)                                |
| GET    | `/api/event-types`       | lista os tipos de evento cadastrados                                       |
| GET    | `/api/news-events`       | lista as notícias/eventos salvos                                           |
| GET    | `/api/news-events/:id`   | busca uma notícia/evento por id                                            |
| POST   | `/api/news-events`       | cria uma notícia/evento manualmente (mesmos campos da tabela)              |
| POST   | `/api/news-events/search`| **mock de pesquisa**: recebe `{ query, count? }`, gera notícias fake plausíveis e salva as que ainda não existem (por `url`), pulando duplicatas |

### Exemplo — pesquisa mockada

```bash
curl -X POST http://localhost:3000/api/news-events/search \
  -H "Content-Type: application/json" \
  -d '{"query": "enchente recife", "count": 3}'
```

Rodar o mesmo comando de novo deve retornar `skipped` maior que zero, já que as
mesmas urls (determinísticas por `query`) já terão sido salvas na primeira
chamada.

Todas as respostas seguem o formato:

```json
{ "success": true, "message": "...", "data": { } }
```
