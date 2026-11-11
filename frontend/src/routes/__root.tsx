import { useState } from 'react'
import { createRootRoute, Link, Outlet, useRouterState } from '@tanstack/react-router'
import { Menu, X } from 'lucide-react'
import { Logo } from '@/components/marca/logo'
import { FaixaOndas } from '@/components/marca/ondas'
import { cn } from '@/lib/utils'

export const Route = createRootRoute({
  component: RootComponent,
})

const LINKS = [
  { para: '/', rotulo: 'Início' },
  { para: '/noticias', rotulo: 'Notícias' },
  { para: '/metodologia', rotulo: 'Metodologia' },
] as const

const CLASSE_LINK = 'text-ecoa-marinho hover:bg-ecoa-creme-escuro rounded-full px-4 py-2 text-sm font-medium transition-colors'
const CLASSE_LINK_ATIVO = 'bg-ecoa-coral-escuro hover:bg-ecoa-coral-escuro text-white shadow-sm'

function RootComponent() {
  const [menuAberto, setMenuAberto] = useState(false)
  const rota = useRouterState({ select: (estado) => estado.location.pathname })
  const [rotaAnterior, setRotaAnterior] = useState(rota)
  if (rota !== rotaAnterior) {
    setRotaAnterior(rota)
    setMenuAberto(false)
  }

  const links = (
    <>
      {LINKS.map((link) => (
        <Link
          key={link.para}
          to={link.para}
          className={CLASSE_LINK}
          activeOptions={{ exact: true, includeHash: false }}
          activeProps={{ className: CLASSE_LINK_ATIVO, 'aria-current': 'page' }}
        >
          {link.rotulo}
        </Link>
      ))}
      <Link to="/metodologia" hash="sobre" className={CLASSE_LINK}>
        Sobre
      </Link>
    </>
  )

  return (
    <div className="flex min-h-svh flex-col">
      <a
        href="#conteudo"
        className="bg-ecoa-marinho sr-only z-50 rounded-full px-4 py-2 text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Pular para o conteúdo
      </a>

      <header className="bg-background/85 border-ecoa-marinho/10 sticky top-0 z-30 border-b backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-4 py-3">
          <Link to="/" aria-label="ECOA, página inicial" className="rounded-lg">
            <Logo comSubtitulo />
          </Link>

          <nav aria-label="Navegação principal" className="hidden items-center gap-1 md:flex">
            {links}
          </nav>

          <button
            type="button"
            className="text-ecoa-marinho hover:bg-ecoa-creme-escuro focus-visible:ring-ring/50 inline-flex size-10 items-center justify-center rounded-full outline-none focus-visible:ring-3 md:hidden"
            aria-expanded={menuAberto}
            aria-controls="menu-movel"
            aria-label={menuAberto ? 'Fechar o menu' : 'Abrir o menu'}
            onClick={() => setMenuAberto((aberto) => !aberto)}
          >
            {menuAberto ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
          </button>
        </div>

        <nav
          id="menu-movel"
          aria-label="Navegação principal"
          className={cn('border-ecoa-marinho/10 flex-col gap-1 border-t px-4 py-3 md:hidden', menuAberto ? 'flex' : 'hidden')}
        >
          {links}
        </nav>
      </header>

      <div id="conteudo" className="flex-1">
        <Outlet />
      </div>

      <footer className="mt-16">
        <FaixaOndas />
        <div className="bg-ecoa-marinho text-white/80">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 pt-6 pb-10 md:grid-cols-[1.4fr_1fr_1fr]">
            <div className="flex flex-col gap-4">
              <Logo invertido />
              <p className="max-w-sm text-sm leading-relaxed">
                Observatório de memórias e vulnerabilidades urbanas. Projeto de pesquisa científica da CESAR School, em
                desenvolvimento.
              </p>
            </div>

            <div className="flex flex-col gap-3 text-sm">
              <p className="font-heading font-semibold text-white">Navegação</p>
              <ul className="flex flex-col gap-2">
                {LINKS.map((link) => (
                  <li key={link.para}>
                    <Link to={link.para} className="hover:text-white hover:underline">
                      {link.rotulo}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link to="/metodologia" hash="sobre" className="hover:text-white hover:underline">
                    Sobre
                  </Link>
                </li>
              </ul>
            </div>

            <div className="flex flex-col gap-3 text-sm">
              <p className="font-heading font-semibold text-white">Fontes dos dados</p>
              <p className="leading-relaxed">
                Atendimentos: Prefeitura do Recife, portal de dados abertos, licença ODbL. As notícias pertencem aos
                veículos citados.
              </p>
            </div>
          </div>
          <div className="border-t border-white/10">
            <p className="mx-auto max-w-6xl px-4 py-4 text-xs text-white/60">
              Em situação de risco ou emergência, procure diretamente a Defesa Civil do seu município.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
