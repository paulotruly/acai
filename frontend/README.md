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
