# Google Solar API — Reference Documentation

> **Coverage note:** Data is available across the US and many global regions. Imagery quality: `HIGH` (0.1 m/px aerial), `MEDIUM` (0.25 m/px enhanced aerial), `BASE` (0.25 m/px satellite). EEA developers: certain content no longer returned after 8 July 2025.

---

## Endpoints

### 1. buildingInsights:findClosest
Returns solar potential, roof geometry, panel configs, and financial analysis for the nearest building.

```
GET https://solar.googleapis.com/v1/buildingInsights:findClosest
  ?location.latitude=37.4450
  &location.longitude=-122.1390
  &requiredQuality=LOW        // LOW = accept any quality (avoids 404)
  &key=YOUR_API_KEY
```

**Key response fields:**
- `center` — LatLng of building center
- `boundingBox` — LatLngBox of building footprint (sw/ne). **Use this for overlay bounds, not dataLayers.**
- `solarPotential.maxSunshineHoursPerYear`
- `solarPotential.maxArrayAreaMeters2` — multiply × 10.764 for sq ft
- `solarPotential.maxArrayPanelsCount`
- `solarPotential.panelCapacityWatts` — typically 400W
- `solarPotential.carbonOffsetFactorKgPerMwh`
- `solarPotential.solarPanelConfigs[]` — array sorted by panelsCount; last entry = max config
- `solarPotential.financialAnalyses[]` — indexed by monthlyBill
- `imageryQuality` — `HIGH` | `MEDIUM` | `BASE`

**Behavior:**
- Always returns the single nearest building (not multiple).
- If no data meets `requiredQuality`, returns 404.
- If higher quality exists than requested, returns highest available.

---

### 2. dataLayers:get
Returns URLs for raw solar GeoTIFF datasets for a radius around a location.

```
GET https://solar.googleapis.com/v1/dataLayers:get
  ?location.latitude=37.4450
  &location.longitude=-122.1390
  &radiusMeters=100
  &view=FULL_LAYERS
  &pixelSizeMeters=0.5        // 0.1 | 0.25 | 0.5 | 1.0 — use 0.5 for speed
  &requiredQuality=LOW
  &key=YOUR_API_KEY
```

**Response fields:**
- `annualFluxUrl` — annual kWh/kW/yr raster (32-bit float, 1 band)
- `monthlyFluxUrl` — monthly flux (32-bit float, 12 bands = Jan–Dec)
- `dsmUrl` — digital surface model in meters above sea level
- `rgbUrl` — aerial/satellite RGB image (3 bands)
- `maskUrl` — 1-bit rooftop mask
- `hourlyShadeUrls[]` — 12 URLs (one per month), each with 24 bands (hours), each pixel = 32-bit int (31 bits = days)
- `imageryQuality`

> **Important:** Response URLs **expire after 1 hour**. Re-fetch if stale. Never cache across sessions.
> **Note:** `dataLayers` response does NOT include `boundingBox` — get that from `buildingInsights`.

**Expanded coverage (experimental):** Add `experiments=EXPANDED_COVERAGE&requiredQuality=BASE` for Brazil, Colombia, Peru, Puerto Rico.

---

### 3. geoTiff:get
Fetches the actual GeoTIFF binary.

```
GET https://solar.googleapis.com/v1/geoTiff:get?id=HASHED_ID&key=YOUR_API_KEY
```

- **CORS:** Supported — fetch directly from browser with `&key=`.
- All layers except RGB display blank in standard image viewers — use geotiff.js or QGIS.
- GeoTIFF files can be stored up to 30 days.

---

## TypeScript Type Definitions

```typescript
export interface BuildingInsightsResponse {
  name: string;
  center: LatLng;
  boundingBox: LatLngBox;
  imageryDate: Date;
  imageryProcessedDate: Date;
  postalCode: string;
  administrativeArea: string;
  statisticalArea: string;
  regionCode: string;
  solarPotential: SolarPotential;
  imageryQuality: 'HIGH' | 'MEDIUM' | 'BASE';
}

export interface SolarPotential {
  maxArrayPanelsCount: number;
  panelCapacityWatts: number;        // typically 400W
  panelHeightMeters: number;         // 1.879
  panelWidthMeters: number;          // 1.045
  panelLifetimeYears: number;        // 20
  maxArrayAreaMeters2: number;
  maxSunshineHoursPerYear: number;
  carbonOffsetFactorKgPerMwh: number;
  wholeRoofStats: SizeAndSunshineStats;
  buildingStats: SizeAndSunshineStats;
  roofSegmentStats: RoofSegmentSizeAndSunshineStats[];
  solarPanels: SolarPanel[];
  solarPanelConfigs: SolarPanelConfig[];
  financialAnalyses: FinancialAnalysis[];
}

export interface SolarPanelConfig {
  panelsCount: number;
  yearlyEnergyDcKwh: number;         // KEY for financial calcs
  roofSegmentSummaries: RoofSegmentSummary[];
}

export interface FinancialAnalysis {
  monthlyBill: { currencyCode: string; units: string };
  panelConfigIndex: number;          // -1 = no viable config for this bill
  financialDetails?: {
    initialAcKwhPerYear: number;
    remainingLifetimeUtilityBill: Money;
    federalIncentive: Money;
    stateIncentive: Money;
    utilityIncentive: Money;
    lifetimeSrecTotal: Money;
    costOfElectricityWithoutSolar: Money;
    netMeteringAllowed: boolean;
    solarPercentage: number;
    percentageExportedToGrid: number;
  };
  cashPurchaseSavings?: {
    outOfPocketCost: Money;
    upfrontCost: Money;              // after rebate
    rebateValue: Money;
    paybackYears: number;
    savings: SavingsOverTime;
  };
  leasingSavings?: {
    leasesAllowed: boolean;
    leasesSupported: boolean;
    annualLeasingCost: Money;
    savings: SavingsOverTime;
  };
  financedPurchaseSavings?: {
    annualLoanPayment: Money;
    rebateValue: Money;
    loanInterestRate: number;        // e.g. 0.05 = 5%
    savings: SavingsOverTime;
  };
}

export interface SavingsOverTime {
  savingsYear1: Money;
  savingsYear20: Money;
  presentValueOfSavingsYear20: Money;
  financiallyViable: boolean;
  savingsLifetime: Money;
  presentValueOfSavingsLifetime: Money;
}

export interface SizeAndSunshineStats {
  areaMeters2: number;
  sunshineQuantiles: number[];       // 10 percentiles
  groundAreaMeters2: number;
}

export interface RoofSegmentSizeAndSunshineStats {
  pitchDegrees: number;
  azimuthDegrees: number;            // 0=N, 90=E, 180=S, 270=W
  stats: SizeAndSunshineStats;
  center: LatLng;
  boundingBox: LatLngBox;
  planeHeightAtCenterMeters: number;
}

export interface SolarPanel {
  center: LatLng;
  orientation: 'LANDSCAPE' | 'PORTRAIT';
  segmentIndex: number;
  yearlyEnergyDcKwh: number;
}

export interface RoofSegmentSummary {
  pitchDegrees: number;
  azimuthDegrees: number;
  panelsCount: number;
  yearlyEnergyDcKwh: number;
  segmentIndex: number;
}

export interface DataLayersResponse {
  imageryDate: Date;
  imageryProcessedDate: Date;
  dsmUrl: string;
  rgbUrl: string;
  maskUrl: string;
  annualFluxUrl: string;
  monthlyFluxUrl: string;            // single URL, 12-band GeoTIFF
  hourlyShadeUrls: string[];         // 12 URLs (one per month)
  imageryQuality: 'HIGH' | 'MEDIUM' | 'BASE';
}

export interface LatLng { latitude: number; longitude: number; }
export interface LatLngBox { sw: LatLng; ne: LatLng; }
export interface Date { year: number; month: number; day: number; }
interface Money { currencyCode: string; units?: string; nanos?: number; }
```

---

## GeoTIFF Layers Reference

| Layer | Bands | Bit Depth | Resolution | Values | nodata |
|---|---|---|---|---|---|
| DSM | 1 | 32-bit float | 0.1 m/px | Meters above sea level | -9999 |
| RGB | 3 | 8-bit | 0.1–0.25 m/px | 0–255 per channel | — |
| Mask | 1 | 1-bit | 0.1 m/px | 1 = rooftop, 0 = not | — |
| Annual Flux | 1 | 32-bit float | 0.1 m/px | kWh/kW/year (unmasked) | -9999 |
| Monthly Flux | 12 | 32-bit float | 0.5 m/px | kWh/kW/year per month | -9999 |
| Hourly Shade | 24/file × 12 files | 32-bit int | 1 m/px | Bitmask: bit N = day N+1 saw sun | -9999 (bit 31 set) |

**Decoding hourly shade** for location (x,y) at 4 PM on June 22:
```
(hourlyShadeUrls[5])(x, y)[16] & (1 << 21)  // month=6→index5, hour=16, day=22→bit21
```

---

## Financial Calculation Methodology (US)

All calculations use a 20-year installation lifespan.

### Constants (US defaults)
| Variable | Value |
|---|---|
| DC to AC derate | 0.85 |
| Panel efficiency decline/year | 0.995 (0.5%) |
| Electricity cost increase/year | 1.022 (2.2%) |
| Discount rate | 1.04 (4%) |
| Installation lifespan | 20 years |

### Key Formulas

**Annual solar production (AC):**
```
initialAcKwhPerYear = yearlyEnergyDcKwh × 0.85

// Year-by-year production (geometric decay):
year[n] = initialAcKwhPerYear × 0.995^n

// Lifetime production:
LifetimeProductionAcKwh = (0.85 × initialAcKwhPerYear × (1 - 0.995^20)) / (1 - 0.995)
```

**Annual utility bill WITH solar (year n):**
```
utilityKwh = max(0, yearlyKWhConsumption - year[n])
bill[n] = (utilityKwh × energyCostPerKwh × 1.022^n) / 1.04^n
remainingLifetimeUtilityBill = Σ bill[n] for n=0..19
```

**Annual utility bill WITHOUT solar (year n):**
```
noBill[n] = (monthlyBill × 12 × 1.022^n) / 1.04^n
costOfElectricityWithoutSolar = Σ noBill[n] for n=0..19
```

**Total cost comparison:**
```
installationCost = installationCostPerWatt × (panelsCount × panelCapacityWatts / 1000) × 1000
totalCostWithSolar = installationCost + remainingLifetimeUtilityBill - incentives
savings = costOfElectricityWithoutSolar - totalCostWithSolar
```

### Reference TypeScript Implementation
```typescript
// From buildingInsights.solarPotential.solarPanelConfigs
let panelsCount = 20;
let yearlyEnergyDcKwh = 12000;

// Inputs
let monthlyAverageEnergyBill = 300;
let energyCostPerKwh = 0.31;
let panelCapacityWatts = 400;
let solarIncentives = 7000;
let installationCostPerWatt = 4.0;
let installationLifeSpan = 20;

// Advanced (US defaults)
let dcToAcDerate = 0.85;
let efficiencyDepreciationFactor = 0.995;
let costIncreaseFactor = 1.022;
let discountRate = 1.04;

// Derived
let installationSizeKw = (panelsCount * panelCapacityWatts) / 1000;
let installationCostTotal = installationCostPerWatt * installationSizeKw * 1000;
let monthlyKwhEnergyConsumption = monthlyAverageEnergyBill / energyCostPerKwh;
let yearlyKwhEnergyConsumption = monthlyKwhEnergyConsumption * 12;
let initialAcKwhPerYear = yearlyEnergyDcKwh * dcToAcDerate;

let yearlyProductionAcKwh = [...Array(installationLifeSpan).keys()]
  .map((year) => initialAcKwhPerYear * efficiencyDepreciationFactor ** year);

let remainingLifetimeUtilityBill = yearlyProductionAcKwh
  .map((produced, year) => {
    const billKwh = yearlyKwhEnergyConsumption - produced;
    return Math.max(0, (billKwh * energyCostPerKwh * costIncreaseFactor ** year) / discountRate ** year);
  })
  .reduce((a, b) => a + b, 0);

let totalCostWithSolar = installationCostTotal + remainingLifetimeUtilityBill - solarIncentives;

let totalCostWithoutSolar = [...Array(installationLifeSpan).keys()]
  .map((year) => (monthlyAverageEnergyBill * 12 * costIncreaseFactor ** year) / discountRate ** year)
  .reduce((a, b) => a + b, 0);

let savings = totalCostWithoutSolar - totalCostWithSolar;
```

---

## GeoTIFF Download & Reprojection (TypeScript)

**Important:** Solar API GeoTIFFs may be in a projected CRS (not WGS84). Always reproject `getBoundingBox()` using `geotiff-geokeys-to-proj4` + `proj4`.

```typescript
// npm install geotiff geotiff-geokeys-to-proj4 proj4
import * as geotiff from 'geotiff';
import * as geokeysToProj4 from 'geotiff-geokeys-to-proj4';
import proj4 from 'proj4';

export async function downloadGeoTIFF(url: string, apiKey: string) {
  const solarUrl = url.includes('solar.googleapis.com') ? `${url}&key=${apiKey}` : url;
  const response = await fetch(solarUrl);
  const arrayBuffer = await response.arrayBuffer();
  const tiff = await geotiff.fromArrayBuffer(arrayBuffer);
  const image = await tiff.getImage();
  const rasters = await image.readRasters();

  // Reproject bounding box to WGS84 lat/lon
  const geoKeys = image.getGeoKeys();
  const projObj = geokeysToProj4.toProj4(geoKeys);
  const projection = proj4(projObj.proj4, 'WGS84');
  const box = image.getBoundingBox();
  const sw = projection.forward({
    x: box[0] * projObj.coordinatesConversionParameters.x,
    y: box[1] * projObj.coordinatesConversionParameters.y,
  });
  const ne = projection.forward({
    x: box[2] * projObj.coordinatesConversionParameters.x,
    y: box[3] * projObj.coordinatesConversionParameters.y,
  });

  return {
    width: rasters.width,
    height: rasters.height,
    rasters: [...Array(rasters.length).keys()].map((i) => Array.from(rasters[i])),
    bounds: { north: ne.y, south: sw.y, east: ne.x, west: sw.x },
  };
}
```

---

## Visualization Helper Functions

```typescript
// Render RGB GeoTIFF to canvas (optionally masked)
export function renderRGB(rgb: GeoTiff, mask?: GeoTiff): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = mask ? mask.width : rgb.width;
  canvas.height = mask ? mask.height : rgb.height;
  const dw = rgb.width / canvas.width;
  const dh = rgb.height / canvas.height;
  const ctx = canvas.getContext('2d')!;
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const rgbIdx = Math.floor(y * dh) * rgb.width + Math.floor(x * dw);
      const maskIdx = y * canvas.width + x;
      const imgIdx = (y * canvas.width + x) * 4;
      img.data[imgIdx + 0] = rgb.rasters[0][rgbIdx];
      img.data[imgIdx + 1] = rgb.rasters[1][rgbIdx];
      img.data[imgIdx + 2] = rgb.rasters[2][rgbIdx];
      img.data[imgIdx + 3] = mask ? mask.rasters[0][maskIdx] * 255 : 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

// Render single-band GeoTIFF with a color palette
export function renderPalette({ data, mask, colors = ['000000', 'ffffff'], min = 0, max = 1, index = 0 }:
  { data: GeoTiff; mask?: GeoTiff; colors?: string[]; min?: number; max?: number; index?: number }
): HTMLCanvasElement {
  const palette = createPalette(colors);
  const indices = data.rasters[index]
    .map((x) => Math.max(0, Math.min(1, (x - min) / (max - min))))
    .map((x) => Math.round(x * (palette.length - 1)));
  return renderRGB({
    ...data,
    rasters: [
      indices.map((i) => palette[i].r),
      indices.map((i) => palette[i].g),
      indices.map((i) => palette[i].b),
    ],
  }, mask);
}

// Build 256-color palette from hex stops
export function createPalette(hexColors: string[]): { r: number; g: number; b: number }[] {
  const rgb = hexColors.map(colorToRGB);
  return Array(256).fill(0).map((_, i) => {
    const index = i * (rgb.length - 1) / 255;
    const lo = Math.floor(index), hi = Math.ceil(index), t = index - lo;
    return {
      r: Math.round(rgb[lo].r + t * (rgb[hi].r - rgb[lo].r)),
      g: Math.round(rgb[lo].g + t * (rgb[hi].g - rgb[lo].g)),
      b: Math.round(rgb[lo].b + t * (rgb[hi].b - rgb[lo].b)),
    };
  });
}

export function colorToRGB(color: string) {
  const hex = color.startsWith('#') ? color.slice(1) : color;
  return { r: parseInt(hex.slice(0,2),16), g: parseInt(hex.slice(2,4),16), b: parseInt(hex.slice(4,6),16) };
}
```

---

## Solar Potential Assumptions
- Each panel: **400W**, **20.4% efficiency**, DC-to-AC derate **85%**
- Panels mounted flush with roof (including flat surfaces)
- Arrays between **2 kW and 1000 kW** (buildings only, not parking lots/fields)
- Sunlight threshold: panels must receive ≥75% of county maximum annual sun
- Minimum viable segment: ≥4 m² of space, ≥1.6 kW total installation size

## Data Sources
- Imagery + 3D modeling: Google ML algorithms
- Weather: NREL + Meteonorm
- Electricity rates: Clean Power Research
- Solar pricing: EnergySage + OpenSolar (aggregated/anonymized)
- Incentives: Clean Power Research + federal/state/local authorities
- SRECs: Bloomberg NEF + SRECTrade

## Selecting the Right financialAnalysis Entry
`financialAnalyses` is an array sorted by `monthlyBill.units`. To find the best match for a user's actual bill:
```typescript
const best = financialAnalyses
  .filter(f => f.panelConfigIndex >= 0)  // -1 = no viable config
  .sort((a, b) =>
    Math.abs(parseFloat(a.monthlyBill.units) - userMonthlyBill) -
    Math.abs(parseFloat(b.monthlyBill.units) - userMonthlyBill)
  )[0];
```
