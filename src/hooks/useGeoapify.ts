const GEOAPIFY_KEY = import.meta.env.VITE_GEOAPIFY_KEY ?? ''

export interface GeoapifyPlace {
  properties: {
    city?: string
    name: string
    lat: number
    lon: number
    timezone: { name: string; offset_STD_seconds: number }
  }
}

export async function searchPlaces(query: string): Promise<GeoapifyPlace[]> {
  if (!query.trim() || !GEOAPIFY_KEY) return []
  const res = await fetch(
    `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(query)}&apiKey=${GEOAPIFY_KEY}&limit=8`
  )
  const data = await res.json()
  return data.features ?? []
}
