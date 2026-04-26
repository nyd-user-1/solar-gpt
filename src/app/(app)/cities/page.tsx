export const dynamic = 'force-dynamic'

import { getAllCities } from '@/lib/queries'
import CitiesClient from './CitiesClient'

export default async function CitiesPage() {
  const cities = await getAllCities()
  return <CitiesClient cities={cities} />
}
