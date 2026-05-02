export const dynamic = 'force-dynamic'

import { getInterconnectionQueue } from '@/lib/queries'
import InterconnectionQueueClient from './InterconnectionQueueClient'

export default async function InterconnectionQueuePage() {
  const rows = await getInterconnectionQueue()
  return <InterconnectionQueueClient rows={rows} />
}
