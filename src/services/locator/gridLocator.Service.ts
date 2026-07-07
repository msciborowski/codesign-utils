import * as turf from '@turf/turf'
import type { Feature, MultiPolygon, Polygon } from 'geojson'
import type { LatLngBoundsLike } from '../spatial/spatial.service'

export type GridLocation = {
  lat: number
  lng: number
}

export type GridPrecision = 2 | 4 | 6 | 8

export type LocatorGridFeature = {
  center: GridLocation
  polygon: Feature<Polygon>
  reference: string
}

const clampLatitude = (lat: number) => {
  return Math.max(-90, Math.min(90, lat))
}

const clampLongitude = (lng: number) => {
  return Math.max(-180, Math.min(180, lng))
}

const isSupportedPrecision = (precision: number): precision is GridPrecision => {
  return precision === 2 || precision === 4 || precision === 6 || precision === 8
}

const assertPrecision: (precision: number) => asserts precision is GridPrecision = precision => {
  if (!Number.isInteger(precision) || !isSupportedPrecision(precision)) {
    throw new Error('Unsupported Maidenhead precision')
  }
}

const roundCoordinate = (value: number) => {
  return Number(value.toFixed(12))
}

const normalizeBounds = (bounds: LatLngBoundsLike) => {
  const north = clampLatitude(bounds.getNorth())
  const east = clampLongitude(bounds.getEast())
  const south = clampLatitude(bounds.getSouth())
  const west = clampLongitude(bounds.getWest())

  return {
    east: Math.max(east, west),
    north: Math.max(north, south),
    south: Math.min(north, south),
    west: Math.min(east, west),
  }
}

/**
 * Convert latitude & longitude to Maidenhead (QTH) locator.
 *
 * @param lat Latitude in degrees (-90 .. +90)
 * @param lng Longitude in degrees (-180 .. +180)
 * @param precision Number of characters in locator (2, 4, 6, 8)
 */
const latLngToGrid = (lat: number, lng: number, precision: GridPrecision = 6) => {
  assertPrecision(precision)

  lat = clampLatitude(lat)
  lng = clampLongitude(lng)

  let adjLng = lng + 180
  let adjLat = lat + 90

  let locator = ''

  locator += String.fromCharCode('A'.charCodeAt(0) + Math.floor(adjLng / 20))
  locator += String.fromCharCode('A'.charCodeAt(0) + Math.floor(adjLat / 10))

  if (precision === 2) {
    return locator
  }

  adjLng %= 20
  adjLat %= 10
  locator += Math.floor(adjLng / 2).toString()
  locator += Math.floor(adjLat / 1).toString()

  if (precision === 4) {
    return locator
  }

  adjLng %= 2
  adjLat %= 1
  locator += String.fromCharCode('a'.charCodeAt(0) + Math.floor(adjLng / (2 / 24)))
  locator += String.fromCharCode('a'.charCodeAt(0) + Math.floor(adjLat / (1 / 24)))

  if (precision === 6) {
    return locator
  }

  adjLng %= 2 / 24
  adjLat %= 1 / 24
  locator += Math.floor(adjLng / (2 / 24 / 10)).toString()
  locator += Math.floor(adjLat / (1 / 24 / 10)).toString()

  return locator
}

/**
 * Convert Maidenhead (QTH) locator to latitude & longitude (center of square).
 */
const gridToLatLng = (locator: string): GridLocation => {
  const normalizedLocator = locator.trim()
  const precision = normalizedLocator.length

  if (!normalizedLocator || precision % 2 !== 0 || !isSupportedPrecision(precision)) {
    throw new Error('Invalid QTH locator format')
  }

  const loc = normalizedLocator.toUpperCase()
  let lng = -180
  let lat = -90

  lng += (loc.charCodeAt(0) - 65) * 20
  lat += (loc.charCodeAt(1) - 65) * 10

  if (loc.length >= 4) {
    lng += parseInt(loc[2], 10) * 2
    lat += parseInt(loc[3], 10) * 1
  }

  if (loc.length >= 6) {
    lng += (loc[4].toLowerCase().charCodeAt(0) - 97) * (2 / 24)
    lat += (loc[5].toLowerCase().charCodeAt(0) - 97) * (1 / 24)
  }

  if (loc.length >= 8) {
    lng += parseInt(loc[6], 10) * (2 / 24 / 10)
    lat += parseInt(loc[7], 10) * (1 / 24 / 10)
  }

  const step = gridStep(precision)

  return {
    lat: lat + step.lat / 2,
    lng: lng + step.lng / 2,
  }
}

const gridStep = (precision: GridPrecision) => {
  switch (precision) {
    case 2:
      return { lat: 10, lng: 20 }
    case 4:
      return { lat: 1, lng: 2 }
    case 6:
      return { lat: 1 / 24, lng: 2 / 24 }
    case 8:
      return { lat: 1 / 240, lng: 2 / 240 }
  }
}

const gridToPolygon = (locator: string): Feature<Polygon> => {
  const normalizedLocator = locator.trim()
  const precision = normalizedLocator.length

  if (!normalizedLocator || precision % 2 !== 0 || !isSupportedPrecision(precision)) {
    throw new Error('Invalid QTH locator format')
  }

  const { lat, lng } = gridToLatLng(normalizedLocator)
  const step = gridStep(precision)
  const minLon = lng - step.lng / 2
  const maxLon = lng + step.lng / 2
  const minLat = lat - step.lat / 2
  const maxLat = lat + step.lat / 2

  return turf.bboxPolygon([minLon, minLat, maxLon, maxLat]) as Feature<Polygon>
}

const locatorGridsForGeoJSON = (feature: Feature<Polygon | MultiPolygon>, precision: GridPrecision): string[] => {
  assertPrecision(precision)

  const bbox = turf.bbox(feature)
  const step = gridStep(precision)
  const result = new Set<string>()

  for (let lon = bbox[0]; lon <= bbox[2]; lon = roundCoordinate(lon + step.lng)) {
    for (let lat = bbox[1]; lat <= bbox[3]; lat = roundCoordinate(lat + step.lat)) {
      const locator = latLngToGrid(lat + step.lat / 2, lon + step.lng / 2, precision)

      if (result.has(locator)) {
        continue
      }

      if (turf.booleanIntersects(feature, gridToPolygon(locator))) {
        result.add(locator)
      }
    }
  }

  return Array.from(result).sort()
}

const locatorGridsForBounds = (bounds: LatLngBoundsLike, precision: GridPrecision): string[] => {
  assertPrecision(precision)

  const normalizedBounds = normalizeBounds(bounds)
  const viewportFeature = turf.bboxPolygon([normalizedBounds.west, normalizedBounds.south, normalizedBounds.east, normalizedBounds.north]) as Feature<Polygon>

  return locatorGridsForGeoJSON(viewportFeature, precision)
}

const locatorFeaturesForBounds = (bounds: LatLngBoundsLike, precision: GridPrecision): LocatorGridFeature[] => {
  return locatorGridsForBounds(bounds, precision).map(reference => ({
    center: gridToLatLng(reference),
    polygon: gridToPolygon(reference),
    reference,
  }))
}

export const GridLocationService = {
  gridToLatLng,
  gridToPolygon,
  latLngToGrid,
  locatorFeaturesForBounds,
  locatorGridsForBounds,
  locatorGridsForGeoJSON,
}
