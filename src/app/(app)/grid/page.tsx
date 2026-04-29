export const dynamic = 'force-dynamic'

import { getAllGeas, getGeaKpi, getAllCambiumCountiesForMap, type GeaKpi } from '@/lib/queries'
import GEAChoropleth from '@/components/GEAChoropleth'

export default async function Explore2Page() {
  const [geas, cambiumCounties] = await Promise.all([
    getAllGeas(),
    getAllCambiumCountiesForMap(),
  ])

  const geaKpis = (await Promise.all(geas.map(g => getGeaKpi(g)))).filter(Boolean) as GeaKpi[]

  return (
    <div className="flex flex-1 flex-col overflow-hidden animate-zoom-in">
      <GEAChoropleth
        mode="cambium"
        cambiumCounties={cambiumCounties}
        geaKpis={geaKpis}
        className="w-full flex-1 overflow-hidden"
      />
    </div>
  )
}
