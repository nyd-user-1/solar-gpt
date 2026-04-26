'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { Sun } from 'lucide-react'

export default function SignInPage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setStatus('loading')
    await signIn('resend', { email, redirect: false, callbackUrl: '/' })
    setStatus('sent')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-950/30 mb-4">
            <Sun className="h-7 w-7 text-solar" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--txt)]">SolarGPT</h1>
          <p className="text-sm text-[var(--muted)] mt-1">Sign in to your account</p>
        </div>

        {status === 'sent' ? (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 text-center">
            <p className="font-semibold text-[var(--txt)] mb-1">Check your email</p>
            <p className="text-sm text-[var(--muted)]">We sent a magic link to <strong>{email}</strong></p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 flex flex-col gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--muted)] mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoFocus
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--inp-bg)] px-3.5 py-2.5 text-sm text-[var(--txt)] outline-none focus:border-solar placeholder:text-[var(--muted)]"
              />
            </div>
            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full rounded-xl bg-solar px-6 py-3 text-sm font-semibold text-white hover:bg-orange-600 transition-colors disabled:opacity-60"
            >
              {status === 'loading' ? 'Sending…' : 'Send magic link'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
