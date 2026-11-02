import { createRootRoute, Link, Outlet } from '@tanstack/react-router'
import { Waves } from 'lucide-react'

export const Route = createRootRoute({
  component: RootComponent,
})

const LINKS = [
  { para: '/', rotulo: 'Início' },
  { para: '/noticias', rotulo: 'Notícias' },
  { para: '/metodologia', rotulo: 'Metodologia' },
] as const

function RootComponent() {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="bg-background/90 sticky top-0 z-10 border-b backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-1 px-4 py-3">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <Waves className="text-(--marca) size-5" aria-hidden />
            Observatório de desastres do Recife
          </Link>
          <nav aria-label="Navegação principal" className="flex gap-1 text-sm">
            {LINKS.map((link) => (
              <Link
                key={link.para}
                to={link.para}
                className="hover:bg-muted rounded-md px-2.5 py-1.5"
                activeOptions={{ exact: true }}
                activeProps={{ className: 'bg-muted font-medium' }}
              >
                {link.rotulo}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <div className="flex-1">
        <Outlet />
      </div>

      <footer className="border-t">
        <div className="text-muted-foreground mx-auto flex max-w-6xl flex-col gap-1 px-4 py-6 text-sm">
          <p>Projeto de pesquisa científica da CESAR School, em desenvolvimento.</p>
          <p>
            Dados de atendimentos: Prefeitura do Recife, portal de dados abertos, licença ODbL. As notícias pertencem aos
            veículos citados.
          </p>
        </div>
      </footer>
    </div>
  )
}
