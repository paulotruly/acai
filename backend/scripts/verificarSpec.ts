import { readFileSync } from 'node:fs'

const IDENTIFICADOR = /RT-[A-Z]+-\d{2}/g

const especificacao = readFileSync('../specs/05-regras-de-tratamento.md', 'utf-8')
const testes = readFileSync('src/pipeline/tratamento/tratamento.test.ts', 'utf-8')

const regras = new Set(especificacao.match(IDENTIFICADOR))
const testadas = new Set(testes.match(IDENTIFICADOR))

const semTeste = [...regras].filter((regra) => !testadas.has(regra))
const semRegra = [...testadas].filter((regra) => !regras.has(regra))

if (semTeste.length > 0) console.error(`Regras sem teste: ${semTeste.join(', ')}`)
if (semRegra.length > 0) console.error(`Testes sem regra: ${semRegra.join(', ')}`)
if (semTeste.length > 0 || semRegra.length > 0) process.exit(1)

console.log(`${regras.size} regras com teste correspondente`)
