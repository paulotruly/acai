# Especificação do projeto

Esta pasta é a fonte de verdade do comportamento esperado do sistema. O projeto segue o desenvolvimento orientado por especificação: primeiro se altera a regra aqui, depois se escreve o teste que a verifica e, por último, o código.

## Documentos

| Documento | Conteúdo |
|---|---|
| [Pergunta e escopo](00-pergunta-e-escopo.md) | Pergunta de pesquisa, recorte e critérios de inclusão |
| [Glossário](01-glossario.md) | Definições dos termos do domínio |
| [Fontes](02-fontes.md) | Origem dos dados, licenças, limites e defeitos conhecidos |
| [Modelo de dados](03-modelo-de-dados.md) | Tabelas e procedência |
| [Pipeline](04-pipeline.md) | Etapas, estados, idempotência e cota |
| [Regras de tratamento](05-regras-de-tratamento.md) | Regras identificadas como `RT-*` |
| [Extração por LLM](06-extracao-llm.md) | Esquema, prompt e controle de versão |
| [API e interface](07-api-e-interface.md) | Contratos públicos e requisitos das páginas |
| [Validação](08-validacao.md) | Métricas, limiares e eventos de controle |
| [Ética, LGPD e licenças](09-etica-lgpd-licencas.md) | Salvaguardas e pendências institucionais |
| [Decisões](decisoes/) | Registros curtos das decisões tomadas |

## Processo

1. Altere ou crie a regra no documento correspondente, atribuindo um identificador.
2. Escreva o teste citando o identificador no nome, como `RT-DAT-01: ...`.
3. Implemente o código até o teste ser aprovado.
4. Execute `npm test` e `npm run spec:verificar` na pasta `backend`.

O comando `spec:verificar` falha se uma regra marcada como implementada não tiver teste, ou se um teste citar uma regra inexistente.

## Estados das regras

- **Rascunho:** em discussão, sem compromisso de implementação.
- **Aprovada:** deve ser implementada.
- **Implementada:** tem código e teste aprovados.

## Regra de redação

Títulos e textos usam português formal e capitalização de frase, isto é, somente a primeira palavra e os nomes próprios recebem inicial maiúscula. Não se usa Camel Case nem Title Case em títulos ou em textos visíveis ao usuário.

Identificadores de código, como `tipoEventoId`, seguem a convenção técnica do projeto e não estão sujeitos a essa regra.
