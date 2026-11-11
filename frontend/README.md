# Interface pública

Site em React, Vite e TanStack Router que apresenta os dados do projeto. Os requisitos estão em [`specs/07-api-e-interface.md`](../specs/07-api-e-interface.md).

## Execução local

Com a API em execução na porta 3001:

```bash
npm install
npm run dev
```

O site fica disponível em `http://localhost:5173`.

Para apontar para outra API, copie `.env.example` para `.env` e altere `VITE_URL_API`. A compilação para publicação usa `npm run build`.

## Implantação no Vercel

O arquivo `vercel.json` já configura a compilação do Vite e o redirecionamento das rotas para `index.html`, de modo que endereços como `/noticias` funcionem ao recarregar a página.

1. No Vercel, importe o repositório e defina **Root Directory** como `frontend`.
2. Em **Environment Variables**, cadastre `VITE_URL_API` com o endereço da API no Render seguido de `/api` (por exemplo, `https://ecoa-api.onrender.com/api`).
3. Publique. Como a variável é lida durante a compilação, qualquer alteração nela exige uma nova publicação.

Depois, informe o domínio gerado pelo Vercel na variável `ORIGENS_PERMITIDAS` da API.
