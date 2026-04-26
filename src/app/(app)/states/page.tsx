export const dynamic = 'force-dynamic'

import { getAllStates } from '@/lib/queries'
import StatesClient from './StatesClient'

export default async function StatesPage() {
  const states = await getAllStates()
  return <StatesClient states={states} />
}
