export const dynamic = 'force-dynamic'

import { getAllGeas, getGeaKpi, getAllCambiumCountiesForMap, getCountiesForMap, type GeaKpi } from '@/lib/queries'
import GEAChoropleth from '@/components/GEAChoropleth'

export default async function Explore2Page() {
  const [geas, cambiumCounties, sunroofCounties] = await Promise.all([
    getAllGeas(),
    getAllCambiumCountiesForMap(),
    getCountiesForMap(),
  ])

  const geaKpis = (await Promise.all(geas.map(g => getGeaKpi(g)))).filter(Boolean) as GeaKpi[]

  return (
    <div className="flex flex-1 flex-col overflow-hidden animate-zoom-in">
      <GEAChoropleth
        mode="cambium"
        cambiumCounties={cambiumCounties}
        sunroofCounties={sunroofCounties}
        geaKpis={geaKpis}
        className="w-full flex-1 overflow-hidden"
      />
    </div>
  )
}
