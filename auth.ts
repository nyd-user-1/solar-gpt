import NextAuth from 'next-auth'
import Resend from 'next-auth/providers/resend'
import PostgresAdapter from '@auth/pg-adapter'
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PostgresAdapter(pool),
  providers: [
    Resend({
      from: 'SolarGPT <noreply@craic.in>',
      apiKey: process.env.RESEND_API_KEY ?? undefined,
      sendVerificationRequest: process.env.RESEND_API_KEY
        ? undefined
        : async ({ url }) => {
            console.warn('[SolarGPT Auth] RESEND_API_KEY not set — magic link URL:', url)
          },
    }),
  ],
  pages: {
    signIn: '/sign-in',
    verifyRequest: '/auth/verify-request',
    error: '/auth/error',
  },
  callbacks: {
    session({ session, user }) {
      session.user.id = user.id
      return session
    },
  },
})
