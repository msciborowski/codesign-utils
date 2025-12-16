import { LatLngBounds } from 'leaflet'

export const swapLatLng = (arr: any) =>
  arr.map((x: any) => (x.length === 2 && typeof x[0] === 'number' && typeof x[1] === 'number' ? [x[1], x[0]] : swapLatLng(x)))

export const leafletBoundsToString = (bounds: LatLngBounds) => `n=${bounds.getNorth()}&e=${bounds.getEast()}&s=${bounds.getSouth()}&w=${bounds.getWest()}`

export const getPointFromPolygon = (coords: any): any => {
  if (!coords) return
  return coords.length === 2 && typeof coords[0] === 'number' && typeof coords[1] === 'number' ? coords : getPointFromPolygon(coords[0])
}

export const coordinatesGeoJsonToString = (geoJson: any): string | undefined => {
  if (!geoJson || geoJson.type !== 'Point') return

  const [lng, lat] = geoJson.coordinates

  return `${lat}, ${lng}`
}

export const coordinatesGeoJsonToDegreesString = (geoJson: any): string | undefined => {
  if (!geoJson || geoJson.type !== 'Point') return

  const [lng, lat] = geoJson.coordinates

  const toDegrees = (num: number) => {
    const absolute = Math.abs(num)
    const degrees = Math.floor(absolute)
    const minutesNotTruncated = (absolute - degrees) * 60
    const minutes = Math.floor(minutesNotTruncated)
    const seconds = Math.floor((minutesNotTruncated - minutes) * 60)

    return `${degrees}°${minutes}'${seconds}"`
  }
  const latDegrees = toDegrees(lat) + (lat >= 0 ? 'N' : 'S')
  const lngDegrees = toDegrees(lng) + (lng >= 0 ? 'E' : 'W')

  return `${latDegrees}, ${lngDegrees}`
}

export const spatialService = {
  coordinatesGeoJsonToDegreesString,
  coordinatesGeoJsonToString,
  getPointFromPolygon,
  leafletBoundsToString,
  swapLatLng,
}
