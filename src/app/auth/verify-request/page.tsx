import { Sun } from 'lucide-react'

export default function VerifyRequestPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] px-4">
      <div className="w-full max-w-sm text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-950/30 mb-4 mx-auto">
          <Sun className="h-7 w-7 text-solar" />
        </div>
        <h1 className="text-xl font-bold text-[var(--txt)] mb-2">Check your email</h1>
        <p className="text-sm text-[var(--muted)]">
          A sign-in link has been sent to your email address. Click the link to sign in.
        </p>
      </div>
    </div>
  )
}
