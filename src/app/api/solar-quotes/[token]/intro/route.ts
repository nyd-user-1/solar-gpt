import { NextRequest } from 'next/server'
import { createOpenAI } from '@ai-sdk/openai'
import { streamText } from 'ai'

const openai = createOpenAI({ apiKey: process.env.SOLARGPT_OPENAI_KEY ?? process.env.SOLAR_OPENAI_KEY })

export async function POST(req: NextRequest) {
  const q = await req.json()

  const prompt = `Write a warm, personalized 2-paragraph intro for a solar quote.

Name: ${q.first_name} ${q.last_name}
Address: ${q.address}
Monthly electric bill: ${q.monthly_bill}
Roof: ${q.roof_age} old · ${q.roof_shade} sun · facing ${q.roof_direction ?? 'unknown direction'}
Primary goal: ${q.goal}
System size: ${q.system_kw} kW
Net cost after 30% federal tax credit: $${Number(q.net_cost).toLocaleString()}
Estimated monthly savings: ~$${q.monthly_savings}/month
${q.sunshine_hours ? `Annual sunshine hours: ${Number(q.sunshine_hours).toLocaleString()}` : ''}
${q.max_panels ? `Max panels: ${q.max_panels}` : ''}

Paragraph 1: Greet them warmly by first name (**bold**). Highlight 2-3 things working in their favour (roof direction, sun exposure, bill size, homeownership). Keep it encouraging.
Paragraph 2: Reference the specific address (**bold**) and transition naturally into "here's what we found for you." One sentence max.
No headers. No bullet points. Just two tight paragraphs. Conversational, not salesy.`

  const result = streamText({
    model: openai('gpt-4o-mini'),
    system: 'You are SolarGPT, a friendly solar market analyst. Write in a warm, concise, human tone.',
    messages: [{ role: 'user', content: prompt }],
  })

  return result.toTextStreamResponse()
}
