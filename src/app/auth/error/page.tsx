import Link from 'next/link'
import { Sun } from 'lucide-react'

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] px-4">
      <div className="w-full max-w-sm text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50 dark:bg-red-950/30 mb-4 mx-auto">
          <Sun className="h-7 w-7 text-red-500" />
        </div>
        <h1 className="text-xl font-bold text-[var(--txt)] mb-2">Authentication error</h1>
        <p className="text-sm text-[var(--muted)] mb-6">
          Something went wrong. The link may have expired or already been used.
        </p>
        <Link
          href="/sign-in"
          className="inline-block rounded-xl bg-solar px-6 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 transition-colors"
        >
          Try again
        </Link>
      </div>
    </div>
  )
}
