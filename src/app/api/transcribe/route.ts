import { NextRequest, NextResponse } from 'next/server'

const SOLAR_DOMAIN_PROMPT =
  'The user is asking about residential and commercial solar energy. Common terms include: ' +
  'SolarGPT, kilowatt-hour, photovoltaic, solar panel, GEA region, LRMER, Cambium, NREL, ' +
  'Project Sunroof, net metering, ITC, IRA, interconnection, rooftop solar, grid emissions, capacity factor.'

const ADDRESS_PROMPT =
  'The user is dictating a US street address for a solar property lookup. ' +
  'Transcribe exactly what is said as a street address, including house number, street name, ' +
  'city or town, and state if given. Common address components: street, avenue, road, drive, ' +
  'lane, place, court, boulevard, terrace, circle, way.'

const MAX_BYTES = 25 * 1024 * 1024 // OpenAI hard limit

export async function POST(req: NextRequest) {
  const apiKey = process.env.NEW_SOLAR_OPENAI_KEY
  if (!apiKey) {
    console.error('/api/transcribe: NEW_SOLAR_OPENAI_KEY is not set')
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No audio file provided' }, { status: 400 })
  if (file.size > MAX_BYTES)
    return NextResponse.json({ error: 'Audio file too large (max 25 MB)' }, { status: 400 })

  const mode = formData.get('mode') as string | null
  const prompt = mode === 'address' ? ADDRESS_PROMPT : SOLAR_DOMAIN_PROMPT

  try {
    const openaiForm = new FormData()
    openaiForm.append('file', file)
    openaiForm.append('model', 'gpt-4o-mini-transcribe')
    openaiForm.append('response_format', 'json')
    openaiForm.append('prompt', prompt)

    const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: openaiForm,
    })

    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      console.error('/api/transcribe: OpenAI error', res.status, detail)
      return NextResponse.json({ error: 'Transcription failed' }, { status: 500 })
    }

    const data = await res.json()
    return NextResponse.json({ text: data.text ?? '' })
  } catch (err) {
    console.error('/api/transcribe: unexpected error', err)
    return NextResponse.json({ error: 'Transcription failed' }, { status: 500 })
  }
}
