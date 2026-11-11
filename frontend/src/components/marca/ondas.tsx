import { useId } from 'react'
import { cn } from '@/lib/utils'

/** Faixa de ondas sobrepostas, usada na transição entre seções (por exemplo, no topo do rodapé). */
export function FaixaOndas({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1440 120"
      preserveAspectRatio="none"
      aria-hidden
      className={cn('block h-16 w-full md:h-24', className)}
    >
      <path d="M0 64c180-40 360-40 540 0s360 40 540 0 270-50 360-30v116H0z" fill="var(--ecoa-agua)" opacity=".55" />
      <path d="M0 84c200-36 380-30 560 6s380 30 560-4 240-34 320-20v54H0z" fill="var(--ecoa-petroleo)" />
      <path d="M0 104c220-30 420-24 620 4s400 22 580-6 180-20 240-12v30H0z" fill="var(--ecoa-marinho)" />
    </svg>
  )
}

/** Linhas onduladas finas, inspiradas nos elementos visuais da marca, para fundos decorativos. */
export function LinhasOndas({ className }: { className?: string }) {
  const linhas = Array.from({ length: 9 }, (_, i) => i * 22)
  return (
    <svg viewBox="0 0 600 260" fill="none" aria-hidden className={cn('pointer-events-none', className)}>
      {linhas.map((y) => (
        <path
          key={y}
          d={`M-20 ${40 + y}c80-34 140 34 220 0s140-34 220 0 140 34 200 0`}
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      ))}
    </svg>
  )
}

/** Mancha orgânica em aquarela (gradiente suave), usada atrás de ilustrações e cabeçalhos. */
export function ManchaAquarela({ className, cor = 'var(--ecoa-areia)' }: { className?: string; cor?: string }) {
  const id = `mancha${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
  return (
    <svg viewBox="0 0 400 300" aria-hidden className={cn('pointer-events-none', className)}>
      <defs>
        <radialGradient id={id} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor={cor} stopOpacity=".45" />
          <stop offset="1" stopColor={cor} stopOpacity="0" />
        </radialGradient>
      </defs>
      <path
        d="M62 152c-18-62 40-118 116-124s162 26 180 92-36 140-120 150S80 214 62 152z"
        fill={`url(#${id})`}
      />
    </svg>
  )
}
