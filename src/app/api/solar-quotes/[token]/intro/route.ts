import { NextRequest } from 'next/server'
import { createOpenAI } from '@ai-sdk/openai'
import { streamText } from 'ai'

const openai = createOpenAI({ apiKey: process.env.NEW_SOLAR_OPENAI_KEY })

export async function POST(req: NextRequest) {
  const q = await req.json()

  const prompt = `Write a single punchy sentence greeting for a solar quote — maximum 2 sentences total.

Name: ${q.first_name} ${q.last_name}
Address: ${q.address}
Monthly electric bill: ${q.monthly_bill}
Roof: ${q.roof_age} old · ${q.roof_shade} sun · facing ${q.roof_direction ?? 'south'}
Homeownership: ${q.homeownership}
Estimated monthly savings: ~$${q.monthly_savings}/month

Rules:
- Open with "Hi **[first name]**!" (bold the name)
- In one sentence: mention roof direction, sun exposure, and bill size to establish why the address is a good solar candidate. Bold the street address (not city/state).
- End with the estimated monthly savings figure
- No second paragraph. No "here's what we found." No filler. Max 2 sentences, ~50 words total.
- Match this style exactly: "Hi **Steph**! Your south-facing roof, full sun exposure, and $300+ monthly electric bill make **111 Fischer Avenue** a strong candidate for solar. As a homeowner, you're well-positioned to invest — and we estimate a tailored system could save you about $278 a month."`

  const result = streamText({
    model: openai('gpt-4o-mini'),
    system: 'You are SolarGPT, a friendly solar market analyst. Write in a warm, concise, human tone.',
    messages: [{ role: 'user', content: prompt }],
  })

  return result.toTextStreamResponse()
}
