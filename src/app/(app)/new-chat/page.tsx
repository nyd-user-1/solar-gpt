export const dynamic = 'force-dynamic'

import { getTopStates, nameToSlug } from '@/lib/queries'
import { fmtUsd } from '@/lib/utils'
import NewChatClient from './NewChatClient'

export default async function NewChatPage() {
  const topStates = await getTopStates(10)
  const stateChips = topStates.map(s => ({
    name: s.state_name,
    slug: nameToSlug(s.state_name),
    flag_url: s.flag_url ?? null,
    untapped: fmtUsd(s.untapped_annual_value_usd),
    grade: s.sunlight_grade,
  }))
  return <NewChatClient stateChips={stateChips} />
}
