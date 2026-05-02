export const dynamic = 'force-dynamic'

import GridClient from './GridClient'
import { getAllGeas, getGeaKpi, getAllCambiumCountiesForMap, getCountiesForMap, type GeaKpi, type CambiumCountyMapEntry, type CountyMapEntry } from '@/lib/queries'

const API_KEY = process.env.EIA_API_KEY ?? ''
const EIA = 'https://api.eia.gov/v2'

async function eiaFetch(path: string, params: Record<string, string>) {
  const p = new URLSearchParams({ api_key: API_KEY, ...params })
  try {
    const res = await fetch(`${EIA}/${path}?${p}`, { next: { revalidate: 3600 } })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

async function getBaLoad() {
  const data = await eiaFetch('electricity/rto/region-data/data/', {
    'frequency': 'hourly', 'data[0]': 'value', 'facets[type][]': 'D',
    'sort[0][column]': 'period', 'sort[0][direction]': 'desc', 'length': '1000',
  })
  return data?.response?.data ?? []
}

async function getRetailRates() {
  const data = await eiaFetch('electricity/retail-sales/data/', {
    'frequency': 'monthly', 'data[0]': 'price', 'facets[sectorid][]': 'RES',
    'sort[0][column]': 'period', 'sort[0][direction]': 'desc', 'length': '51',
  })
  return data?.response?.data ?? []
}

async function getRetailHistory() {
  const data = await eiaFetch('electricity/retail-sales/data/', {
    'frequency': 'monthly', 'data[0]': 'price', 'facets[sectorid][]': 'RES',
    'sort[0][column]': 'period', 'sort[0][direction]': 'desc', 'length': '1200',
  })
  return data?.response?.data ?? []
}

async function getFuelMix() {
  const data = await eiaFetch('electricity/rto/fuel-type-data/data/', {
    'frequency': 'hourly', 'data[0]': 'value',
    'sort[0][column]': 'period', 'sort[0][direction]': 'desc', 'length': '5000',
  })
  return data?.response?.data ?? []
}

async function getNetLoad() {
  const [demand, netGen] = await Promise.all([
    eiaFetch('electricity/rto/region-data/data/', {
      'frequency': 'hourly', 'data[0]': 'value', 'facets[type][]': 'D',
      'sort[0][column]': 'period', 'sort[0][direction]': 'desc', 'length': '1000',
    }),
    eiaFetch('electricity/rto/region-data/data/', {
      'frequency': 'hourly', 'data[0]': 'value', 'facets[type][]': 'NG',
      'sort[0][column]': 'period', 'sort[0][direction]': 'desc', 'length': '1000',
    }),
  ])
  return { demand: demand?.response?.data ?? [], netGen: netGen?.response?.data ?? [] }
}

export default async function GridPage() {
  const [baLoad, retailRates, retailHistory, fuelMix, loadData, geas, cambiumCounties, sunroofCounties] =
    await Promise.all([
      getBaLoad(),
      getRetailRates(),
      getRetailHistory(),
      getFuelMix(),
      getNetLoad(),
      getAllGeas(),
      getAllCambiumCountiesForMap(),
      getCountiesForMap(),
    ])

  const geaKpis = (await Promise.all(geas.map((g: string) => getGeaKpi(g)))).filter(Boolean) as GeaKpi[]

  return (
    <GridClient
      baLoad={baLoad}
      retailRates={retailRates}
      retailHistory={retailHistory}
      fuelMix={fuelMix}
      demandData={loadData.demand}
      netGenData={loadData.netGen}
      geaKpis={geaKpis}
      cambiumCounties={cambiumCounties as CambiumCountyMapEntry[]}
      sunroofCounties={sunroofCounties as CountyMapEntry[]}
    />
  )
}
