export const dynamic = 'force-dynamic'

import { getAllStates, nameToSlug } from '@/lib/queries'
import NewChatClient from './new-chat/NewChatClient'

const US_STATES = new Set([
  'Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut',
  'Delaware','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa',
  'Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan',
  'Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada',
  'New Hampshire','New Jersey','New Mexico','New York','North Carolina',
  'North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania','Rhode Island',
  'South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont',
  'Virginia','Washington','West Virginia','Wisconsin','Wyoming',
])

export default async function HomePage() {
  const allStates = await getAllStates()
  const stateChips = allStates
    .filter(s => US_STATES.has(s.state_name))
    .sort((a, b) => (b.count_qualified ?? 0) - (a.count_qualified ?? 0))
    .map(s => ({
      name: s.state_name,
      slug: nameToSlug(s.state_name),
      flag_url: s.flag_url ?? null,
      untapped: '',
      grade: s.sunlight_grade,
    }))
  return <NewChatClient stateChips={stateChips} />
}
