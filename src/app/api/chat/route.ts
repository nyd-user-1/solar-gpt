import { NextRequest } from 'next/server'
import { createOpenAI } from '@ai-sdk/openai'
import { streamText } from 'ai'
import type { SolarInsight } from '@/lib/solar-types'

const openai = createOpenAI({ apiKey: process.env.SOLARGPT_OPENAI_KEY })

const BASE_SYSTEM_PROMPT = `You are SolarGPT, an AI solar market analyst built on the most comprehensive US rooftop solar dataset available.

Your database covers:
- All 50 US states with state-level solar opportunity KPIs
- 3,000+ US counties with granular rooftop metrics from Google Sunroof
- 18 NREL Cambium Grid Energy Areas (GEAs) with electricity pricing by region

Key metrics available per region:
- Qualified buildings: number of solar-ready rooftops
- Existing installs: already solar-powered buildings
- Untapped annual value (USD/yr): estimated revenue opportunity from uninstalled solar
- Untapped lifetime value: 25-year projection of that opportunity
- Sunlight grade: A+ (exceptional) to D (low), based on roof angle, shading, sun hours
- Sunlight stars: 1–5 rating derived from the grade
- Adoption rate: % of eligible buildings with solar installed
- Median annual savings (USD): estimated savings per installation
- Median payback period (years): time to ROI
- Carbon offset equivalents: cars off road, homes powered

When a user asks about a specific state, county, or GEA region, reason from what you know about that region's characteristics. Be specific and data-driven. Compare regions. Recommend high-opportunity areas. Explain what drives solar ROI — sunlight hours, electricity rates, installation costs, available incentives.

Speak like a sharp solar market analyst. Be concise. Lead with the numbers that matter. When you don't have a specific data point, say so and reason from proxies.

Data sources: Google Sunroof Project (roof-level analysis) · NREL Cambium 2022 (long-run marginal costs & emissions factors)`

function buildSystemPrompt(address?: string, solarInsight?: SolarInsight | null): string {
  if (!address && !solarInsight) return BASE_SYSTEM_PROMPT

  const lines: string[] = [BASE_SYSTEM_PROMPT, '']

  if (address) {
    lines.push(`The user is asking about a specific property: ${address}`)
  }

  if (solarInsight) {
    lines.push('Google Solar API data for this property:')
    if (solarInsight.maxSunshineHoursPerYear != null)
      lines.push(`- Usable sunlight: ${solarInsight.maxSunshineHoursPerYear.toLocaleString()} hours/year`)
    if (solarInsight.maxAreaSqFt != null)
      lines.push(`- Available roof area: ${solarInsight.maxAreaSqFt.toLocaleString()} sq ft`)
    if (solarInsight.recommendedKw != null)
      lines.push(`- Recommended system size: ${solarInsight.recommendedKw} kW`)
    if (solarInsight.maxPanelsCount != null)
      lines.push(`- Maximum panels: ${solarInsight.maxPanelsCount}`)
    if (solarInsight.savings20yr != null)
      lines.push(`- Estimated 20-year net savings: $${solarInsight.savings20yr.toLocaleString()}`)
    if (solarInsight.paybackYears != null)
      lines.push(`- Estimated payback period: ${solarInsight.paybackYears} years`)
    if (solarInsight.imageryQuality)
      lines.push(`- Imagery quality: ${solarInsight.imageryQuality}`)
    lines.push('Use this data to give a personalized, specific analysis of the property\'s solar potential.')
  }

  return lines.join('\n')
}

export async function POST(req: NextRequest) {
  const { messages, address, solarInsight } = await req.json()

  const result = streamText({
    model: openai('gpt-4o-mini'),
    system: buildSystemPrompt(address, solarInsight),
    messages,
  })

  return result.toTextStreamResponse()
}
