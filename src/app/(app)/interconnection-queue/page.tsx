export const dynamic = 'force-dynamic'

import { getInterconnectionQueue, getQueueGrowth } from '@/lib/queries'
import InterconnectionQueueClient from './InterconnectionQueueClient'

export default async function InterconnectionQueuePage() {
  const [rows, growth] = await Promise.all([getInterconnectionQueue(), getQueueGrowth()])
  return <InterconnectionQueueClient rows={rows} growth={growth} />
}
