import { cn } from '@/lib/utils'

interface Props {
  className?: string
  /** Exibe o subtítulo "Observatório de memórias e vulnerabilidades urbanas" ao lado do nome. */
  comSubtitulo?: boolean
  /** Versão para fundos escuros: o emblema ganha um selo creme e o texto fica claro. */
  invertido?: boolean
}

export function Logo({ className, comSubtitulo = false, invertido = false }: Props) {
  return (
    <span className={cn('flex items-center gap-3', className)}>
      <span
        className={cn(
          'flex shrink-0 items-center justify-center rounded-full',
          invertido ? 'bg-ecoa-creme size-12 p-1' : 'size-11',
        )}
      >
        <img src="/marca/ecoa-emblema.png" alt="" width={256} height={245} className="h-auto w-full" />
      </span>
      <span
        className={cn(
          'font-heading text-[1.65rem] leading-none font-extrabold tracking-tight',
          invertido ? 'text-white' : 'text-ecoa-marinho',
        )}
      >
        ECOA
      </span>
      {comSubtitulo && (
        <span
          className={cn(
            'hidden border-l pl-3 text-[0.72rem] leading-tight font-medium md:block',
            invertido ? 'border-white/30 text-white/80' : 'border-ecoa-marinho/25 text-ecoa-marinho/80',
          )}
        >
          Observatório de memórias e<br />
          vulnerabilidades urbanas
        </span>
      )}
    </span>
  )
}
