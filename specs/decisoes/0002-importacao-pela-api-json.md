# 0002: importação da Defesa Civil pela API em JSON

**Estado:** aceita.

**Contexto:** a exportação CSV do portal foi interrompida sem erro após cerca de um minuto, entregando 22 mil de 83 mil linhas em 2023. A interrupção só foi percebida ao comparar os totais.

**Decisão:** importar pela API `datastore_search`, de 500 em 500 linhas, gravando o progresso a cada página e conferindo o total ao final.

**Consequências:** a importação leva mais requisições, porém é retomável e tem o total verificado.
