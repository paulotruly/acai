# Extração por LLM

## Princípios

- Os campos `url`, `fonte`, `textoCompleto` e `dataPublicacao` vêm da página, nunca do modelo.
- O modelo usa somente o texto fornecido, com temperatura zero, e a instrução manda ignorar comandos contidos na página.
- Cada resposta é validada por esquema Zod e guardada em `ExtracaoLlm`.
- Uma extração relevante precisa de evidência presente no título ou no texto.

## Versão atual

O prompt e o esquema têm a versão `v1`, definida em `backend/src/pipeline/tratamento/extracao.ts`.

**Regra de versionamento:** qualquer alteração no modelo, no prompt ou no esquema exige nova versão, registrada em `specs/decisoes/`. A troca de instrumento durante a coleta mistura medidas, e por isso a análise deve considerar o campo `versaoPrompt`.

## Campos extraídos

| Campo | Observação |
|---|---|
| `relevante`, `evidencia` | Decidem a inclusão |
| `dataEvento` | Somente se determinável pelo texto |
| `nomeTipoEvento` | Enum fechado |
| `bairros`, `localizacaoTexto`, `ruaOuPontoDeReferencia` | Os bairros são validados pelo dicionário |
| `pessoasAfetadas`, `danoMaterial`, `problemaInfraestrutura` | Texto livre |
| `depoimentoMorador`, `depoimentoInstituicao` | Citações literais |
| `sentimento`, `temas` | Exploratórios, sem validação até o momento |

## Pendência

A qualidade da extração ainda não foi medida. Ver [validação](08-validacao.md).
