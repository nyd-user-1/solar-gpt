export const dynamic = 'force-dynamic'

import { getAllCounties } from '@/lib/queries'
import CountiesClient from './CountiesClient'

export default async function CountiesPage() {
  const counties = await getAllCounties()
  return <CountiesClient counties={counties} />
}
