import { NextRequest } from 'next/server'
import { openai } from '@ai-sdk/openai'
import { streamText } from 'ai'
import { auth } from '../../../../auth'

const SYSTEM_PROMPT = `You are SolarGPT, an AI assistant specialized in residential and commercial solar energy. You help users understand solar potential for their region, evaluate installation options, estimate savings, and navigate solar adoption decisions. You have access to data on every U.S. county's rooftop solar potential, regional grid pricing, and emissions factors. Be concise, factual, and grounded — when you don't know something, say so. Never invent specific dollar figures or technical specs you can't verify.`

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { messages } = await req.json()

  const result = streamText({
    model: openai('gpt-4o-mini'),
    system: SYSTEM_PROMPT,
    messages,
  })

  return result.toTextStreamResponse()
}
