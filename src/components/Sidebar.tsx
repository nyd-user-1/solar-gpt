'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
  Sun, Moon, MapPin, Map, Zap,
  Users, X, ChevronRight, LogOut, Bell, Shield, Settings,
  Mail, Phone, Wallet, Building2, Compass, MessageCircle, LayoutDashboard, Sparkles, User, ArrowLeftToLine,
} from 'lucide-react'
import { useTheme } from '@/hooks/useTheme'
import { cn } from '@/lib/utils'
import { SidebarSearch } from '@/components/SidebarSearch'

interface SidebarProps {
  onClose?: () => void
}

const NAV_ITEMS = [
  { to: '/',             icon: MessageCircle,    label: 'New Chat' },
  { to: '/free-quote',   icon: Sparkles,         label: 'Free Quote' },
  { to: '/dashboard',    icon: LayoutDashboard,  label: 'Dashboard' },
  { to: '/explore',      icon: Compass,          label: 'Explore' },
  { to: '/states',       icon: Map,              label: 'States' },
  { to: '/counties',     icon: MapPin,           label: 'Counties' },
  { to: '/cities',       icon: Building2,        label: 'Cities' },
  { to: '/leads',        icon: Users,            label: 'Leads' },
  { to: '/gea-regions',  icon: Zap,              label: 'Regions' },
]

type MeData = { name?: string; email?: string; isAdmin?: boolean } | null

function ProfileDrawer({ open, onClose, me }: { open: boolean; onClose: () => void; me: MeData }) {
  const { theme, toggle } = useTheme()

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full sm:w-[420px] max-h-[85vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-[var(--surface)] shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-center bg-[var(--surface)] px-5 py-4 border-b border-[var(--border)]">
          <span className="text-lg font-semibold text-[var(--txt)]">Settings</span>
          <button onClick={onClose} className="absolute right-4 rounded-full p-1.5 text-[var(--muted)] hover:bg-[var(--inp-bg)] hover:text-[var(--txt)] transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex flex-col items-center py-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-solar text-white text-2xl font-bold">
            {me?.name ? me.name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase() : 'SG'}
          </div>
          <div className="mt-3 text-xl font-semibold text-[var(--txt)]">{me?.name ?? 'SolarGPT User'}</div>
          <div className="text-sm text-[var(--muted)]">{me?.email ?? 'Consumer'}</div>
          <button className="mt-3 rounded-full border border-[var(--border)] px-5 py-1.5 text-sm font-medium text-[var(--txt)] hover:bg-[var(--inp-bg)] transition-colors">Edit profile</button>
        </div>
        <div className="px-5">
          <div className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)] pb-2">Account</div>
          <div className="rounded-xl bg-[var(--inp-bg)] divide-y divide-[var(--border)]">
            <div className="flex items-center gap-3 px-4 py-3.5">
              <Mail className="h-5 w-5 text-[var(--txt)]" />
              <span className="flex-1 text-[15px] text-[var(--txt)]">Email</span>
              <span className="text-sm text-[var(--muted)]">—</span>
            </div>
            <div className="flex items-center gap-3 px-4 py-3.5">
              <Phone className="h-5 w-5 text-[var(--txt)]" />
              <span className="flex-1 text-[15px] text-[var(--txt)]">Phone</span>
              <span className="text-sm text-[var(--muted)]">—</span>
            </div>
            <button onClick={toggle} className="flex w-full items-center gap-3 px-4 py-3.5 text-left">
              {theme === 'dark' ? <Sun className="h-5 w-5 text-[var(--txt)]" /> : <Moon className="h-5 w-5 text-[var(--txt)]" />}
              <span className="flex-1 text-[15px] text-[var(--txt)]">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
              <span className="text-sm text-[var(--muted)]">{theme === 'dark' ? 'Dark' : 'Light'}</span>
            </button>
          </div>
        </div>
        <div className="px-5 mt-5 pb-8">
          <div className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)] pb-2">App</div>
          <div className="rounded-xl bg-[var(--inp-bg)] divide-y divide-[var(--border)]">
            <button className="flex w-full items-center gap-3 px-4 py-3.5 text-left">
              <Bell className="h-5 w-5 text-[var(--txt)]" />
              <span className="flex-1 text-[15px] text-[var(--txt)]">Notifications</span>
              <ChevronRight className="h-4 w-4 text-[var(--muted)]" />
            </button>
            <button className="flex w-full items-center gap-3 px-4 py-3.5 text-left">
              <Shield className="h-5 w-5 text-[var(--txt)]" />
              <span className="flex-1 text-[15px] text-[var(--txt)]">Security</span>
              <ChevronRight className="h-4 w-4 text-[var(--muted)]" />
            </button>
            <button className="flex w-full items-center gap-3 px-4 py-3.5 text-left">
              <Settings className="h-5 w-5 text-[var(--txt)]" />
              <span className="flex-1 text-[15px] text-[var(--txt)]">Preferences</span>
              <ChevronRight className="h-4 w-4 text-[var(--muted)]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const ADMIN_EMAIL = 'brendan@nysgpt.com'

export function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname()
  const { theme, toggle } = useTheme()
  const [profileOpen, setProfileOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [me, setMe] = useState<{ name?: string; email?: string; isAdmin?: boolean } | null>(null)

  useEffect(() => {
    fetch('/api/me')
      .then(r => r.json())
      .then((d: { user?: { name?: string; email?: string; isAdmin?: boolean } }) => { if (d?.user) setMe(d.user) })
      .catch(() => {})
  }, [])

  const handleNavClick = () => {
    if (onClose && typeof window !== 'undefined' && window.innerWidth < 1024) onClose()
  }

  return (
    <aside className="flex h-full flex-col bg-[var(--surface)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center px-4 pt-4 pb-2">
        <Sun className="h-5 w-5 text-solar fill-solar/20 mr-2 shrink-0" />
        <span className="flex-1 text-lg sm:text-base font-bold text-[var(--txt)]">SolarGPT</span>
        {/* Mobile: profile avatar */}
        <button
          onClick={() => setProfileOpen(true)}
          className="sm:hidden flex h-8 w-8 items-center justify-center rounded-full bg-solar text-white text-xs font-bold mr-1"
        >
          {me?.name ? me.name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase() : 'SG'}
        </button>
        {/* Collapse sidebar */}
        <button
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-[var(--inp-bg)]"
        >
          <ArrowLeftToLine className="h-5 w-5 text-[var(--txt)]" />
        </button>
      </div>

      {/* Search — always visible in sidebar */}
      <div className="px-3 pb-2">
        <SidebarSearch />
      </div>

      {/* Mobile category icons */}
      <div className="flex items-center justify-start gap-3 px-5 pb-5 sm:hidden">
        {[
          { to: '/',            icon: MessageCircle, label: 'Chat' },
          { to: '/explore',     icon: Compass,       label: 'Explore' },
          { to: '/states',      icon: Map,           label: 'States' },
          { to: '/counties',    icon: MapPin,        label: 'Counties' },
          { to: '/gea-regions', icon: Zap,           label: 'Regions' },
        ].map(({ to, icon: Icon, label }) => (
          <Link
            key={to}
            href={to}
            onClick={handleNavClick}
            className={cn('flex flex-col items-center gap-1.5 transition-colors', pathname.startsWith(to) ? 'text-[var(--txt)]' : 'text-[var(--muted)]')}
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--inp-bg)]">
              <Icon className="h-6 w-6" />
            </div>
            <span className="text-[13px] font-medium">{label}</span>
          </Link>
        ))}
      </div>
      <div className="mx-5 border-t border-[var(--border)] sm:hidden" />

      {/* Nav */}
      <nav className="px-3">
        <div className="space-y-0.5">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => {
            const isActive = pathname === to || (to !== '/' && pathname.startsWith(to))
            return (
              <Link
                key={to}
                href={to}
                onClick={handleNavClick}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] font-medium transition-colors outline-none focus-visible:outline-none',
                  isActive ? 'bg-[var(--inp-bg)] text-[var(--txt)]' : 'text-[var(--txt)] hover:bg-[var(--inp-bg)]'
                )}
              >
                <Icon className="h-[18px] w-[18px] flex-shrink-0" />
                {label}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Scrollable area (reserved for future chat history etc.) */}
      <div className="flex-1 overflow-y-auto" />

      {/* Bottom section */}
      <div className="p-3">
        {/* Desktop: account button */}
        <div className="hidden sm:block relative">
          <button
            onClick={() => setAccountOpen(v => !v)}
            className={cn(
              'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors',
              accountOpen ? 'bg-[var(--inp-bg)]' : 'hover:bg-[var(--inp-bg)]'
            )}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-solar text-white text-xs font-bold flex-shrink-0">
              {me?.name ? me.name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase() : 'SG'}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium text-[var(--txt)] truncate">{me?.name ?? 'SolarGPT User'}</div>
              <div className="text-xs text-[var(--muted)] truncate">{me?.email ?? 'Consumer'}</div>
            </div>
          </button>

          {accountOpen && (
            <div className="absolute bottom-full left-0 right-0 z-50 mb-2 mx-0 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-xl py-1">
              <div className="flex items-center gap-3 px-4 py-3 bg-[var(--inp-bg)] rounded-t-xl mx-0.5 mt-0.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-solar text-white text-xs font-bold flex-shrink-0">SG</div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-[var(--txt)]">{me?.name ?? 'SolarGPT User'}</div>
                  <div className="text-xs text-[var(--muted)] truncate">{me?.email ?? 'Consumer'}</div>
                </div>
              </div>
              <div className="my-1 border-t border-[var(--border)]" />
              <Link href="/profile" onClick={() => setAccountOpen(false)}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-[var(--txt)] hover:bg-[var(--inp-bg)] transition-colors">
                <User className="h-4 w-4 flex-shrink-0" />
                Profile
              </Link>
              <Link href="/settings" onClick={() => setAccountOpen(false)}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-[var(--txt)] hover:bg-[var(--inp-bg)] transition-colors">
                <Settings className="h-4 w-4 flex-shrink-0" />
                Settings
              </Link>
              <Link href="/funds" onClick={() => setAccountOpen(false)}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-[var(--txt)] hover:bg-[var(--inp-bg)] transition-colors">
                <Wallet className="h-4 w-4 flex-shrink-0" />
                Funds
              </Link>
              {me?.isAdmin && (
                <Link href="/admin" onClick={() => setAccountOpen(false)}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-solar font-medium hover:bg-[var(--inp-bg)] transition-colors">
                  <Shield className="h-4 w-4 flex-shrink-0" />
                  Admin
                </Link>
              )}
              <div className="my-1 border-t border-[var(--border)]" />
              <button onClick={toggle} className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-[var(--txt)] hover:bg-[var(--inp-bg)] transition-colors">
                {theme === 'dark' ? <Sun className="h-4 w-4 flex-shrink-0" /> : <Moon className="h-4 w-4 flex-shrink-0" />}
                {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              </button>
              <div className="my-1 border-t border-[var(--border)]" />
              <button className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-[var(--txt)] hover:bg-[var(--inp-bg)] transition-colors">
                <LogOut className="h-4 w-4 flex-shrink-0" />
                Log out
              </button>
            </div>
          )}
        </div>

        {/* Mobile: get quote button */}
        <div className="flex justify-end sm:hidden">
          <Link
            href="/leads/new"
            onClick={handleNavClick}
            className="flex items-center gap-2 rounded-full bg-[var(--txt)] px-5 py-3 text-[var(--bg)] shadow-lg hover:opacity-90 transition-opacity"
          >
            <Sun className="h-5 w-5" />
            <span className="text-[15px] font-medium">Get Quote</span>
          </Link>
        </div>
      </div>

      <ProfileDrawer open={profileOpen} onClose={() => setProfileOpen(false)} me={me} />
    </aside>
  )
}
