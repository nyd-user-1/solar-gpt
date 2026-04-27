export const dynamic = 'force-dynamic'

import { getAllZips } from '@/lib/queries'
import ZipsClient from './ZipsClient'

export default async function ZipsPage() {
  const zips = await getAllZips()
  return <ZipsClient zips={zips} />
}
