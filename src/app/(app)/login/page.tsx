'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Sun } from 'lucide-react'
import Link from 'next/link'
import { Suspense } from 'react'

function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const defaultMode = params.get('mode') === 'register' ? 'register' : 'login'
  const [mode, setMode] = useState<'login' | 'register'>(defaultMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    router.push('/explore')
  }

  const inputClass = 'w-full rounded-xl border border-[var(--border)] bg-[var(--inp-bg)] px-4 py-3 text-sm text-[var(--txt)] placeholder:text-[var(--muted)] outline-none focus:border-solar transition-colors'

  return (
    <div className="flex min-h-full items-center justify-center px-5 py-16">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-solar/10 text-solar mb-4">
            <Sun className="h-7 w-7 fill-solar" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--txt)]">SolarGPT</h1>
          <p className="text-[var(--muted)] text-sm mt-1">
            {mode === 'login' ? 'Sign in to your account' : 'Create your account'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <input
              className={inputClass}
              type="text"
              placeholder="Full name"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          )}
          <input
            className={inputClass}
            type="email"
            placeholder="Email address"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <input
            className={inputClass}
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />

          <button
            type="submit"
            className="w-full rounded-xl bg-solar py-3 text-sm font-semibold text-white hover:bg-solar-dark transition-colors"
          >
            {mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-[var(--muted)]">
          {mode === 'login' ? (
            <>Don&apos;t have an account?{' '}
              <button onClick={() => setMode('register')} className="text-solar hover:underline font-medium">Sign up</button>
            </>
          ) : (
            <>Already have an account?{' '}
              <button onClick={() => setMode('login')} className="text-solar hover:underline font-medium">Sign in</button>
            </>
          )}
        </div>

        <div className="mt-4 text-center">
          <Link href="/explore" className="text-xs text-[var(--muted)] hover:text-[var(--txt)] transition-colors">
            Continue without account →
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="flex-1 overflow-y-auto">
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  )
}
