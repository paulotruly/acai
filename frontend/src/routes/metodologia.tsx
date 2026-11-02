import type { ReactNode } from 'react'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/metodologia')({
  component: PaginaMetodologia,
})

function PaginaMetodologia() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Metodologia</h1>
        <p className="text-muted-foreground">
          Esta página explica de onde vêm os dados, como eles são tratados e quais são os limites de sua interpretação.
        </p>
      </header>

      <Secao titulo="Atendimentos da Defesa Civil">
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
      </Secao>

      <Secao titulo="Notícias">
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
      </Secao>

      <Secao titulo="Privacidade">
        <p>
          Endereços dos atendimentos, depoimentos de moradores e o texto integral das matérias não são exibidos neste site.
          Categorias e bairros com menos de cinco registros de atendimento também não são publicados nos gráficos.
        </p>
      </Secao>

      <Secao titulo="Limites de uso">
        <p>
          Notícias e atendimentos medem fenômenos diferentes e não devem ser somados. A comparação só é possível para o
          Recife, no período coberto por ambas as fontes. Este site não oferece dados em tempo real e não substitui os
          canais oficiais de alerta.
        </p>
      </Secao>
    </main>
  )
}

function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-xl font-semibold">{titulo}</h2>
      <div className="flex flex-col gap-3 leading-relaxed">{children}</div>
    </section>
  )
}
