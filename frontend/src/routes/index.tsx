import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4">
      <h1 className="text-3xl font-bold">Frontend pronto</h1>
      <p className="text-muted-foreground">
        React + Tailwind + ShadCN + TanStack Router
      </p>
    </main>
  )
}
