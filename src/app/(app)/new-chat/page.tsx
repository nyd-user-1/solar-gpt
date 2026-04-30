export const dynamic = 'force-dynamic'

import { getTopStates, getTopCounties, nameToSlug } from '@/lib/queries'
import { fmtUsd } from '@/lib/utils'
import NewChatClient from './NewChatClient'

export default async function NewChatPage() {
  const [topStates, topCounties] = await Promise.all([
    getTopStates(10),
    getTopCounties(8),
  ])
  const stateChips = topStates.map(s => ({
    name: s.state_name,
    slug: nameToSlug(s.state_name),
    flag_url: s.flag_url ?? null,
    untapped: fmtUsd(s.untapped_annual_value_usd),
    grade: s.sunlight_grade,
  }))
  const countyChips = topCounties.map(c => ({
    name: c.region_name,
    state: c.state_name,
    slug: nameToSlug(c.region_name),
    seal_url: c.seal_url ?? null,
  }))
  return <NewChatClient stateChips={stateChips} countyChips={countyChips} />
}
