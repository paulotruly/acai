# Pipeline

Todas as etapas ficam em `backend/src/pipeline` e são executadas com `npm run pipeline -- <etapa> [--limite N]`.

## Defesa Civil

`npm run referencias` registra municípios e bairros. `npm run defesa-civil:importar` lê a API paginada, guarda o bruto, trata cada linha e grava o progresso a cada página. Um recurso só é concluído se o total gravado for igual ao declarado.

## Notícias

| Etapa | Função | Usa cota do Gemini |
|---|---|---|
| `piloto` ou `planejar` | Cria as consultas do piloto ou do período completo | Não |
| `descobrir` | Executa consultas pendentes e cria candidatos | Não |
| `resolver` | Obtém a URL real dos candidatos | Não |
| `baixar` | Baixa a página, extrai o texto e aplica os filtros de território e período | Não |
| `extrair` | Chama o Gemini, dentro da cota | Sim |
| `normalizar` | Reconstrói notícias, locais e duplicatas | Não |
| `relatorio` | Mostra o funil e os bloqueios por domínio | Não |
| `diario` | Encadeia da descoberta ao relatório | Sim |

## Estados de um candidato

```
DESCOBERTO ──> DESCARTADO_TITULO
     │
     ├──> FALHA_DECODIFICACAO (nova tentativa, até 3 vezes)
     ├──> DUPLICADO_URL
     v
URL_RESOLVIDA ──> BLOQUEADO | SEM_TEXTO | FORA_TERRITORIO
     │
     v
AGUARDANDO_LLM ──> IRRELEVANTE | FALHA_LLM
     │
     v
  EXTRAIDO
```

## Garantias

- **Idempotência:** chaves únicas impedem linhas repetidas, e repetir uma etapa só processa o que está pendente.
- **Retomada:** uma interrupção não perde progresso.
- **Ordem da fila:** pseudoaleatória, com semente fixa, para que uma parada não enviese o período ou o município cobertos.
- **Cota:** contam-se as chamadas das últimas 24 horas. O fim da cota encerra a etapa sem penalizar o item.
- **Limite do Google:** um HTTP 429 encerra a etapa de resolução sem penalizar o item. Falhas acima de 20%, após 20 itens, também a interrompem.
- **Reprocessamento:** corrigir uma regra de tratamento exige apenas executar `normalizar`, sem novas chamadas ao modelo.

## Execução recorrente

O comando `npm run pipeline -- diario` pode ser agendado no Agendador de Tarefas do Windows. Não se devem executar duas instâncias ao mesmo tempo.
