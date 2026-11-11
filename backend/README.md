# API e pipeline de dados

API somente de leitura e pipeline de coleta sobre desastres no Recife e na região metropolitana. A especificação completa está em [`specs/`](../specs/README.md).

## Requisitos

- Node.js 20 ou superior
- MySQL ou MariaDB
- Chave gratuita da API do Gemini, somente para a etapa de extração

## Instalação

```bash
npm install
cp .env.example .env   # preencha o arquivo .env
npm run prisma:generate
npx prisma migrate deploy
npm run db:seed
npm run referencias
```

## Execução

```bash
npm run dev            # API em http://localhost:3001
npm test               # testes das regras de tratamento
npm run spec:verificar # confere regras e testes
```

## Coleta de dados

```bash
npm run defesa-civil:importar        # atendimentos oficiais; pode ser retomada
npm run pipeline -- planejar         # cria as consultas de notícias
npm run pipeline -- diario           # coleta e extrai dentro da cota diária
npm run pipeline -- relatorio        # mostra o funil e os bloqueios
```

As etapas estão descritas em [`specs/04-pipeline.md`](../specs/04-pipeline.md). Os dados brutos e as cópias de segurança ficam em `dados/`, fora do controle de versão.

## Rotas

| Rota | Função |
|---|---|
| `GET /health` | Estado da API |
| `GET /api/noticias` | Lista paginada, com filtros |
| `GET /api/noticias/:id` | Uma notícia |
| `GET /api/tipos-evento` | Tipos de evento |
| `GET /api/municipios` | Municípios do recorte |
| `GET /api/indicadores` | Agregações de notícias e de atendimentos |
