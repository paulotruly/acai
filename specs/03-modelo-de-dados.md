# Modelo de dados

O esquema executável está em `backend/prisma/schema.prisma`. Este documento registra a intenção de cada grupo de tabelas.

## Procedência e fila

| Tabela | Função |
|---|---|
| `ExecucaoColeta` | Uma consulta por município e janela, com estado e quantidade de itens |
| `Candidato` | Cada URL descoberta, com estado, motivo de descarte, ordem na fila e texto tratado |
| `ArtefatoBruto` | Aponta para o HTML original em `backend/dados/brutos/`, fora do controle de versão |
| `ExtracaoLlm` | Cada chamada ao modelo, inclusive falhas, com modelo, versão do prompt e resposta bruta |

## Notícias

| Tabela | Função |
|---|---|
| `Noticia` | Projeção derivada das extrações, reconstruível pela etapa `normalizar` |
| `Municipio` e `Bairro` | Dicionários de referência; somente os bairros do Recife estão cadastrados |
| `NoticiaLocal` | Vínculo entre notícia, município citado e bairro validado |

O campo `origem` distingue as notícias coletadas (`COLETA`) daquelas anteriores a este pipeline (`LEGADO`), que não têm bruto. O campo `duplicadaDeId` aponta para a primeira notícia com texto idêntico.

## Defesa Civil

| Tabela | Função |
|---|---|
| `RecursoDefesaCivil` | Um arquivo oficial, com licença, totais e progresso da importação |
| `AtendimentoDefesaCivil` | Uma linha tratada, sem endereço nem localidade |

O campo `hashLinha` permite medir as linhas idênticas sem decidir, por ora, se representam duplicatas ou ações distintas.

## Dados brutos

A pasta `backend/dados/` guarda brutos e cópias de segurança e não entra no controle de versão, pois contém endereços e textos protegidos por direitos autorais.

## Pendência

A tabela `Usuario` não é mais utilizada nem exposta pela API. Sua exclusão aguarda confirmação da equipe.
