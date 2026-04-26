import type { Metadata } from 'next'
import { ThemeProvider } from '@/hooks/useTheme'
import './globals.css'

export const metadata: Metadata = {
  title: 'SolarGPT',
  description: 'Solar roofing installation quotes for New York State',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300..700;1,9..40,300..700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <ThemeProvider>
          <div style={{ height: '100dvh' }}>
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
