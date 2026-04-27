'use client'

import { useEffect, useState, useCallback } from 'react'
import { Shield, Save, RotateCcw } from 'lucide-react'

const ADMIN_EMAIL = 'brendan@nysgpt.com'
const DEFAULT_BG = '#fff3c1'

interface Session { user?: { name?: string; email?: string } }

export default function AdminPage() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [bgColor, setBgColor] = useState(DEFAULT_BG)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/auth/session').then(r => r.json()),
      fetch('/api/admin/settings').then(r => r.json()),
    ]).then(([sess, settings]) => {
      setSession(sess)
      if (settings.bg_color) setBgColor(settings.bg_color)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const previewColor = useCallback((hex: string) => {
    document.documentElement.style.setProperty('--bg', hex)
  }, [])

  async function save() {
    setSaving(true)
    try {
      await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bg_color: bgColor }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch { /* silent */ }
    setSaving(false)
  }

  function reset() {
    setBgColor(DEFAULT_BG)
    previewColor(DEFAULT_BG)
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-solar border-t-transparent animate-spin" />
      </div>
    )
  }

  if (session?.user?.email !== ADMIN_EMAIL) {
    return (
      <div className="flex flex-1 items-center justify-center flex-col gap-3 text-center px-4">
        <Shield className="h-10 w-10 text-[var(--muted)]" />
        <p className="text-lg font-semibold text-[var(--txt)]">Admin access only</p>
        <p className="text-sm text-[var(--muted)]">This page is restricted to site administrators.</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="flex items-center gap-3 mb-8">
          <Shield className="h-6 w-6 text-solar" />
          <h1 className="text-2xl font-bold text-[var(--txt)]">Admin Panel</h1>
          <span className="rounded-full bg-solar/10 px-3 py-0.5 text-xs font-semibold text-solar">
            {session.user?.email}
          </span>
        </div>

        {/* Background color */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 mb-4">
          <h2 className="text-base font-semibold text-[var(--txt)] mb-1">App Background Color</h2>
          <p className="text-sm text-[var(--muted)] mb-6">
            Changes the background color for all users. Preview updates live as you type.
          </p>

          <div className="flex items-center gap-4 mb-6">
            {/* Native color picker */}
            <div className="relative shrink-0">
              <div
                className="h-14 w-14 rounded-xl border-2 border-[var(--border)] cursor-pointer overflow-hidden"
                style={{ backgroundColor: bgColor }}
              >
                <input
                  type="color"
                  value={bgColor}
                  onChange={e => { setBgColor(e.target.value); previewColor(e.target.value) }}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
              </div>
            </div>

            {/* Hex input */}
            <div className="flex-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-1.5 block">
                Hex code
              </label>
              <input
                type="text"
                value={bgColor}
                onChange={e => {
                  const v = e.target.value.startsWith('#') ? e.target.value : `#${e.target.value}`
                  setBgColor(v)
                  if (/^#[0-9a-fA-F]{6}$/.test(v)) previewColor(v)
                }}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--inp-bg)] px-4 py-3 text-base font-mono text-[var(--txt)] outline-none focus:border-solar transition-colors"
                placeholder="#fff3c1"
                maxLength={7}
              />
            </div>

            {/* Preview swatch */}
            <div className="shrink-0 text-center">
              <div className="h-14 w-20 rounded-xl border border-[var(--border)] shadow-inner"
                style={{ backgroundColor: bgColor }} />
              <p className="text-xs text-[var(--muted)] mt-1">Preview</p>
            </div>
          </div>

          {/* Presets */}
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-2">Presets</p>
            <div className="flex gap-2 flex-wrap">
              {[
                { hex: '#fff3c1', label: 'Warm yellow' },
                { hex: '#f7f6f2', label: 'Warm beige' },
                { hex: '#f0f4ff', label: 'Soft blue' },
                { hex: '#f0fff4', label: 'Soft green' },
                { hex: '#fdf2f8', label: 'Soft pink' },
                { hex: '#ffffff', label: 'White' },
              ].map(({ hex, label }) => (
                <button
                  key={hex}
                  onClick={() => { setBgColor(hex); previewColor(hex) }}
                  title={label}
                  className={`h-8 w-8 rounded-lg border-2 transition-all ${bgColor === hex ? 'border-solar scale-110' : 'border-[var(--border)] hover:border-solar'}`}
                  style={{ backgroundColor: hex }}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={save}
              disabled={saving}
              className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-50"
              style={{ backgroundColor: '#e8751c' }}
            >
              <Save className="h-4 w-4" />
              {saved ? 'Saved!' : saving ? 'Saving…' : 'Save for all users'}
            </button>
            <button
              onClick={reset}
              className="flex items-center gap-2 rounded-xl border border-[var(--border)] px-5 py-2.5 text-sm font-medium text-[var(--txt)] hover:bg-[var(--inp-bg)] transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              Reset to default
            </button>
          </div>
        </div>

        {/* Placeholder for future admin tools */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 opacity-50">
          <h2 className="text-base font-semibold text-[var(--txt)] mb-1">More admin tools</h2>
          <p className="text-sm text-[var(--muted)]">User management, lead exports, and analytics coming soon.</p>
        </div>
      </div>
    </div>
  )
}
