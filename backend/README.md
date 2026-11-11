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

## Implantação no Render

O arquivo `render.yaml`, na raiz do repositório, descreve o serviço da API. No Render, escolha **New › Blueprint** e selecione o repositório. O serviço compila com `npm run build:producao`, aplica as migrações pendentes a cada inicialização (`npm run start:producao`) e usa `/health` como verificação de saúde. A porta é lida da variável `PORT`, que o próprio Render define.

Variáveis a preencher no painel:

| Variável | Valor |
|---|---|
| `URL_BANCO_DE_DADOS` | URL do MySQL hospedado, no formato `mysql://usuario:senha@host:porta/banco` |
| `ORIGENS_PERMITIDAS` | Domínio do site no Vercel, como `https://ecoa.vercel.app` (vários separados por vírgula) |
| `CHAVE_API_GEMINI` | Opcional; só é usada pela coleta, que roda localmente |

### Banco de dados

O Render não oferece MySQL gerenciado, então o banco precisa ficar em outro provedor com acesso externo, como o Aiven (plano gratuito) ou o Railway. Se o provedor exigir conexão criptografada, acrescente `?ssl=true` ao final da URL.

As migrações criam as tabelas, mas não os dados. Para levar a base local para o banco hospedado:

```bash
mysqldump -u usuario -p --no-create-info --skip-triggers \
  --ignore-table=pesquisa_cientifica._prisma_migrations pesquisa_cientifica > dados/base.sql
mysql -h host -P porta -u usuario -p banco < dados/base.sql
```

A coleta e a importação continuam rodando localmente; para gravar direto no banco hospedado, aponte `URL_BANCO_DE_DADOS` do `.env` local para ele.

No plano gratuito, o serviço hiberna após um período sem acesso e leva cerca de um minuto para responder à primeira requisição.
