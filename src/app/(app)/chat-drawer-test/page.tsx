'use client'

import { useState } from 'react'
import { ChatDrawer } from '@/components/ChatDrawer'
import { MessageCircle } from 'lucide-react'

export default function ChatDrawerTestPage() {
  const [open, setOpen] = useState(false)

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-2xl font-bold text-[var(--txt)]">ChatDrawer Test</h1>
      <p className="text-sm text-[var(--muted)] text-center max-w-sm">
        Click the button below to open the ChatDrawer portal. It slides in from the right on desktop and full-screen on mobile.
      </p>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-full bg-solar px-6 py-3 text-sm font-semibold text-white hover:bg-orange-600 transition-colors"
      >
        <MessageCircle className="h-4 w-4" />
        Open Chat Drawer
      </button>
      <ChatDrawer
        open={open}
        onClose={() => setOpen(false)}
        title="SolarGPT"
        context="Suffolk County, NY"
      />
    </div>
  )
}
