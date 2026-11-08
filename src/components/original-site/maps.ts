// Verified from the live Wix maps' public Map/Marker instances, 2026-11-07.
// Coordinates, not a fresh address/POI lookup: Google's named-place result for
// Cohon differs from the marker actually published on the original site.
export const sourceMaps = {
  'comp-mkuf0kpq': {
    title: 'Jared L. Cohon University Center',
    marker: { lat: 40.4430243, lng: -79.9423106 },
    sourceCenter: { lat: 40.44563711187599, lng: -79.94231060000001 },
    zoom: 14,
  },
  'comp-mkuf2smj': {
    title: 'Morewood Lot CMU',
    marker: { lat: 40.4453231, lng: -79.9439118 },
    sourceCenter: { lat: 40.44793582251814, lng: -79.9439118 },
    zoom: 14,
  },
} as const

export type SourceMap = (typeof sourceMaps)[keyof typeof sourceMaps]

export function mapUrls(map: SourceMap) {
  const point = `${map.marker.lat},${map.marker.lng}`
  const parameters = new URLSearchParams({
    q: point, ll: `${map.sourceCenter.lat},${map.sourceCenter.lng}`,
    z: String(map.zoom), t: 'm', hl: 'en', output: 'embed',
  })
  return {
    embed: `https://www.google.com/maps?${parameters}`,
    open: `https://www.google.com/maps/search/?${new URLSearchParams({ api: '1', query: point })}`,
  }
}
