import type { ReactNode } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { CabecalhoPagina } from '@/components/cabecalho-pagina'

export const Route = createFileRoute('/metodologia')({
  component: PaginaMetodologia,
})

const SECOES: { id: string; titulo: string; conteudo: ReactNode }[] = [
  {
    id: 'defesa-civil',
    titulo: 'Atendimentos da Defesa Civil',
    conteudo: (
      <>
        <p>
          Os registros provêm do conjunto “Registro de atendimentos da Defesa Civil”, publicado pela Prefeitura do Recife
          em seu portal de dados abertos, sob a licença ODbL. Foram utilizados os arquivos de 2020 em diante.
        </p>
        <p>
          Parte dos arquivos oficiais apresenta colunas deslocadas e nomes com caracteres corrompidos. Esses defeitos são
          corrigidos automaticamente, e a publicação original permanece preservada para conferência.
        </p>
        <p>
          Um registro não equivale a um desastre nem necessariamente a um chamado: boa parte corresponde a monitoramento,
          vistoria ou colocação de lonas, e uma mesma ocorrência pode gerar mais de um registro.
        </p>
      </>
    ),
  },
  {
    id: 'noticias',
    titulo: 'Notícias',
    conteudo: (
      <>
        <p>
          As matérias são localizadas por meio do Google Notícias, com consultas por município e por mês. Em seguida, o
          texto público de cada página é lido e o modelo Gemini extrai os fatos relatados, sendo instruído a usar somente
          o conteúdo da própria matéria.
        </p>
        <p>
          A coleta respeita as regras de acesso de cada site. Páginas bloqueadas ficam de fora, o que pode reduzir a
          presença de alguns veículos. O conjunto também não constitui uma amostra representativa de toda a imprensa.
        </p>
        <p>
          A contagem de notícias mede a atenção da imprensa: bairros com mais cobertura não são, necessariamente, os mais
          afetados. Extrações automáticas podem conter erros, por isso cada notícia remete à fonte original.
        </p>
      </>
    ),
  },
  {
    id: 'privacidade',
    titulo: 'Privacidade',
    conteudo: (
      <p>
        Endereços dos atendimentos, depoimentos de moradores e o texto integral das matérias não são exibidos neste site.
        Categorias e bairros com menos de cinco registros de atendimento também não são publicados nos gráficos.
      </p>
    ),
  },
  {
    id: 'limites',
    titulo: 'Limites de uso',
    conteudo: (
      <p>
        Notícias e atendimentos medem fenômenos diferentes e não devem ser somados. A comparação só é possível para o
        Recife, no período coberto por ambas as fontes. Este site não oferece dados em tempo real e não substitui os
        canais oficiais de alerta.
      </p>
    ),
  },
  {
    id: 'sobre',
    titulo: 'Sobre o ECOA',
    conteudo: (
      <>
        <p>
          O ECOA, Observatório de memórias e vulnerabilidades urbanas, é um projeto de pesquisa científica da CESAR School.
          O nome remete à ideia de fazer ecoar a memória dos eventos que atingem a cidade, para que não se percam entre uma
          temporada de chuvas e outra.
        </p>
        <p>
          O observatório reúne, numa mesma base aberta, os registros oficiais da Defesa Civil e a cobertura da imprensa
          sobre o Recife e a região metropolitana, a fim de apoiar moradores, jornalistas, pesquisadores e gestores
          públicos na compreensão das vulnerabilidades urbanas.
        </p>
      </>
    ),
  },
]

const numero = (indice: number) => String(indice + 1).padStart(2, '0')

function PaginaMetodologia() {
  return (
    <main>
      <CabecalhoPagina titulo="Metodologia">
        <p>Esta página explica de onde vêm os dados, como eles são tratados e quais são os limites de sua interpretação.</p>
      </CabecalhoPagina>

      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-[13rem_1fr] md:gap-16 md:py-16">
        <nav aria-label="Sumário" className="md:sticky md:top-24 md:self-start">
          <p className="text-muted-foreground font-heading mb-3 text-sm font-semibold">Sumário</p>
          <ol className="border-ecoa-marinho/15 flex flex-col border-l text-sm">
            {SECOES.map((secao, indice) => (
              <li key={secao.id}>
                <a
                  href={`#${secao.id}`}
                  className="text-ecoa-marinho/75 hover:border-ecoa-petroleo hover:text-ecoa-marinho -ml-px flex gap-3 border-l-2 border-transparent py-1.5 pl-4 transition-colors"
                >
                  <span className="text-muted-foreground tabular-nums">{numero(indice)}</span>
                  {secao.titulo}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="flex max-w-3xl flex-col">
          {SECOES.map((secao, indice) => (
            <section
              key={secao.id}
              id={secao.id}
              aria-labelledby={`titulo-${secao.id}`}
              className="border-ecoa-marinho/15 grid scroll-mt-24 gap-2 border-t py-10 first:border-t-0 first:pt-0 md:grid-cols-[3.5rem_1fr]"
            >
              <span className="font-heading text-ecoa-petroleo text-sm font-semibold tabular-nums md:pt-1.5">
                {numero(indice)}
              </span>
              <div className="flex flex-col gap-4">
                <h2 id={`titulo-${secao.id}`} className="text-2xl font-bold tracking-tight">
                  {secao.titulo}
                </h2>
                <div className="text-foreground/85 flex flex-col gap-4 text-[1.0625rem] leading-[1.75]">
                  {secao.conteudo}
                </div>
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  )
}
