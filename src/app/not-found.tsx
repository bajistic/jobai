import Link from 'next/link'

export default async function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center px-6 py-24 sm:py-32 lg:px-8">
      <div className="text-center">
        <p className="text-base font-semibold text-primary">404</p>
        <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-5xl">Page not found</h1>
        <p className="mt-6 text-base leading-7 text-muted-foreground">
          Sorry, we couldn't find the page you're looking for.
        </p>
        <div className="mt-10">
          <Link
            href="/"
            className="text-sm font-semibold text-primary hover:text-primary/80"
          >
            <span aria-hidden="true">&larr;</span> Back to home
          </Link>
        </div>
      </div>
    </main>
  )
} 