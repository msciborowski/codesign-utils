import type { LatLngBoundsLike } from '../spatial/spatial.service'

export type GridPrecision = 2 | 4 | 6 | 8

export type GridLocation = {
  lat: number
  lng: number
}

export type GridStep = {
  lat: number
  lng: number
}

/** Bounding box in GeoJSON order: `[west, south, east, north]`. */
export type GridBounds = [number, number, number, number]

const FIELD_COUNT = 18
const FIELD_LAT_SPAN = 10
const FIELD_LNG_SPAN = 20
const SQUARE_COUNT = 10
const SUBSQUARE_COUNT = 24
const EXTENDED_COUNT = 10

const FIELD_CHAR_CODE = 'A'.charCodeAt(0)
const SUBSQUARE_CHAR_CODE = 'a'.charCodeAt(0)

const WORLD_EAST = 180
const WORLD_NORTH = 90
const WORLD_SOUTH = -90
const WORLD_WEST = -180

const LOCATOR_PATTERN = /^[A-R]{2}(?:\d{2}(?:[A-X]{2}(?:\d{2})?)?)?$/i

const isSupportedPrecision = (precision: number): precision is GridPrecision => {
  return precision === 2 || precision === 4 || precision === 6 || precision === 8
}

export const assertPrecision: (precision: number) => asserts precision is GridPrecision = precision => {
  if (!Number.isInteger(precision) || !isSupportedPrecision(precision)) {
    throw new Error('Unsupported Maidenhead precision')
  }
}

const clampLatitude = (lat: number) => {
  return Math.max(WORLD_SOUTH, Math.min(WORLD_NORTH, lat))
}

const clampLongitude = (lng: number) => {
  return Math.max(WORLD_WEST, Math.min(WORLD_EAST, lng))
}

const roundCoordinate = (value: number) => {
  return Number(value.toFixed(12))
}

/**
 * Index of a cell inside its parent, clamped to the valid range.
 *
 * Clamping matters at the antimeridian and at the poles: `lat = 90` and `lng = 180` sit exactly on the
 * upper edge of the world, so the raw division yields one index past the last cell.
 */
const toCellIndex = (offset: number, span: number, count: number) => {
  return Math.min(count - 1, Math.max(0, Math.floor(offset / span)))
}

/**
 * Size of a single locator cell, in degrees.
 */
export const getGridStep = (precision: GridPrecision): GridStep => {
  assertPrecision(precision)

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

/**
 * Whether the value is a well-formed Maidenhead locator of 2, 4, 6 or 8 characters.
 *
 * Case-insensitive, surrounding whitespace is ignored.
 */
export const isValidLocator = (value: string): boolean => {
  return LOCATOR_PATTERN.test(value.trim())
}

/**
 * Canonical form of a locator — field upper case, sub-square lower case — or `null` when the value is not a locator.
 *
 * `' ko02KK '` becomes `'KO02kk'`.
 */
export const normalizeLocator = (value: string): string | null => {
  const trimmed = value.trim()

  if (!LOCATOR_PATTERN.test(trimmed)) {
    return null
  }

  return trimmed.slice(0, 2).toUpperCase() + trimmed.slice(2, 4) + trimmed.slice(4, 6).toLowerCase() + trimmed.slice(6, 8)
}

/**
 * Precision of a locator, or `null` when the value is not a locator.
 */
export const getLocatorPrecision = (value: string): GridPrecision | null => {
  const normalized = normalizeLocator(value)

  return normalized ? (normalized.length as GridPrecision) : null
}

const requireLocator = (value: string): string => {
  const normalized = normalizeLocator(value)

  if (!normalized) {
    throw new Error('Invalid QTH locator format')
  }

  return normalized
}

/**
 * Convert latitude & longitude to a Maidenhead (QTH) locator.
 *
 * @param lat Latitude in degrees (-90 .. +90)
 * @param lng Longitude in degrees (-180 .. +180)
 * @param precision Number of characters in the locator (2, 4, 6, 8)
 */
export const latLngToGrid = (lat: number, lng: number, precision: GridPrecision = 6): string => {
  assertPrecision(precision)

  let lngOffset = clampLongitude(lng) - WORLD_WEST
  let latOffset = clampLatitude(lat) - WORLD_SOUTH

  const lngField = toCellIndex(lngOffset, FIELD_LNG_SPAN, FIELD_COUNT)
  const latField = toCellIndex(latOffset, FIELD_LAT_SPAN, FIELD_COUNT)
  const locator = String.fromCharCode(FIELD_CHAR_CODE + lngField) + String.fromCharCode(FIELD_CHAR_CODE + latField)

  if (precision === 2) {
    return locator
  }

  lngOffset -= lngField * FIELD_LNG_SPAN
  latOffset -= latField * FIELD_LAT_SPAN

  const lngSquare = toCellIndex(lngOffset, FIELD_LNG_SPAN / SQUARE_COUNT, SQUARE_COUNT)
  const latSquare = toCellIndex(latOffset, FIELD_LAT_SPAN / SQUARE_COUNT, SQUARE_COUNT)
  const squareLocator = `${locator}${lngSquare}${latSquare}`

  if (precision === 4) {
    return squareLocator
  }

  lngOffset -= lngSquare * (FIELD_LNG_SPAN / SQUARE_COUNT)
  latOffset -= latSquare * (FIELD_LAT_SPAN / SQUARE_COUNT)

  const lngSubsquare = toCellIndex(lngOffset, 2 / SUBSQUARE_COUNT, SUBSQUARE_COUNT)
  const latSubsquare = toCellIndex(latOffset, 1 / SUBSQUARE_COUNT, SUBSQUARE_COUNT)
  const subsquareLocator = squareLocator + String.fromCharCode(SUBSQUARE_CHAR_CODE + lngSubsquare) + String.fromCharCode(SUBSQUARE_CHAR_CODE + latSubsquare)

  if (precision === 6) {
    return subsquareLocator
  }

  lngOffset -= lngSubsquare * (2 / SUBSQUARE_COUNT)
  latOffset -= latSubsquare * (1 / SUBSQUARE_COUNT)

  const lngExtended = toCellIndex(lngOffset, 2 / SUBSQUARE_COUNT / EXTENDED_COUNT, EXTENDED_COUNT)
  const latExtended = toCellIndex(latOffset, 1 / SUBSQUARE_COUNT / EXTENDED_COUNT, EXTENDED_COUNT)

  return `${subsquareLocator}${lngExtended}${latExtended}`
}

/**
 * South-west corner of a locator cell. Expects an already normalized locator.
 */
const gridToOrigin = (normalizedLocator: string): GridLocation => {
  let lng = WORLD_WEST
  let lat = WORLD_SOUTH

  lng += (normalizedLocator.charCodeAt(0) - FIELD_CHAR_CODE) * FIELD_LNG_SPAN
  lat += (normalizedLocator.charCodeAt(1) - FIELD_CHAR_CODE) * FIELD_LAT_SPAN

  if (normalizedLocator.length >= 4) {
    lng += Number(normalizedLocator[2]) * (FIELD_LNG_SPAN / SQUARE_COUNT)
    lat += Number(normalizedLocator[3]) * (FIELD_LAT_SPAN / SQUARE_COUNT)
  }

  if (normalizedLocator.length >= 6) {
    lng += (normalizedLocator.charCodeAt(4) - SUBSQUARE_CHAR_CODE) * (2 / SUBSQUARE_COUNT)
    lat += (normalizedLocator.charCodeAt(5) - SUBSQUARE_CHAR_CODE) * (1 / SUBSQUARE_COUNT)
  }

  if (normalizedLocator.length >= 8) {
    lng += Number(normalizedLocator[6]) * (2 / SUBSQUARE_COUNT / EXTENDED_COUNT)
    lat += Number(normalizedLocator[7]) * (1 / SUBSQUARE_COUNT / EXTENDED_COUNT)
  }

  return { lat, lng }
}

/**
 * Convert a Maidenhead (QTH) locator to the centre of its cell.
 *
 * @throws when the value is not a well-formed locator.
 */
export const gridToLatLng = (locator: string): GridLocation => {
  const normalized = requireLocator(locator)
  const origin = gridToOrigin(normalized)
  const step = getGridStep(normalized.length as GridPrecision)

  return {
    lat: origin.lat + step.lat / 2,
    lng: origin.lng + step.lng / 2,
  }
}

/**
 * Bounding box of a locator cell, in GeoJSON order: `[west, south, east, north]`.
 *
 * This is the turf-free counterpart of `gridToPolygon` — useful on a server that only needs an envelope.
 *
 * @throws when the value is not a well-formed locator.
 */
export const gridToBounds = (locator: string): GridBounds => {
  const normalized = requireLocator(locator)
  const origin = gridToOrigin(normalized)
  const step = getGridStep(normalized.length as GridPrecision)

  return [roundCoordinate(origin.lng), roundCoordinate(origin.lat), roundCoordinate(origin.lng + step.lng), roundCoordinate(origin.lat + step.lat)]
}

/**
 * The enclosing locator one precision level up, or `null` for a 2-character field.
 *
 * @throws when the value is not a well-formed locator.
 */
export const getLocatorParent = (locator: string): string | null => {
  const normalized = requireLocator(locator)

  return normalized.length === 2 ? null : normalized.slice(0, normalized.length - 2)
}

/**
 * Every locator one precision level down, in ascending order. Empty for an 8-character locator.
 *
 * Counts are 100 (field to square), 576 (square to sub-square) and 100 (sub-square to extended square).
 *
 * @throws when the value is not a well-formed locator.
 */
export const getLocatorChildren = (locator: string): string[] => {
  const normalized = requireLocator(locator)

  if (normalized.length === 8) {
    return []
  }

  const children: string[] = []

  if (normalized.length === 4) {
    for (let lngIndex = 0; lngIndex < SUBSQUARE_COUNT; lngIndex += 1) {
      for (let latIndex = 0; latIndex < SUBSQUARE_COUNT; latIndex += 1) {
        children.push(normalized + String.fromCharCode(SUBSQUARE_CHAR_CODE + lngIndex) + String.fromCharCode(SUBSQUARE_CHAR_CODE + latIndex))
      }
    }

    return children
  }

  const childCount = normalized.length === 2 ? SQUARE_COUNT : EXTENDED_COUNT

  for (let lngIndex = 0; lngIndex < childCount; lngIndex += 1) {
    for (let latIndex = 0; latIndex < childCount; latIndex += 1) {
      children.push(`${normalized}${lngIndex}${latIndex}`)
    }
  }

  return children
}

/**
 * Bounds clamped to the world and ordered, so callers may pass them in any orientation.
 *
 * Bounds that wrap across the antimeridian are not split — they widen to the whole longitude range.
 */
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

const getGridIndexRange = (bounds: LatLngBoundsLike, precision: GridPrecision) => {
  const normalizedBounds = normalizeBounds(bounds)
  const step = getGridStep(precision)
  const lngCount = Math.round((WORLD_EAST - WORLD_WEST) / step.lng)
  const latCount = Math.round((WORLD_NORTH - WORLD_SOUTH) / step.lat)

  return {
    endLatIndex: toCellIndex(normalizedBounds.north - WORLD_SOUTH, step.lat, latCount),
    endLngIndex: toCellIndex(normalizedBounds.east - WORLD_WEST, step.lng, lngCount),
    startLatIndex: toCellIndex(normalizedBounds.south - WORLD_SOUTH, step.lat, latCount),
    startLngIndex: toCellIndex(normalizedBounds.west - WORLD_WEST, step.lng, lngCount),
    step,
  }
}

/**
 * How many locator cells `locatorGridsForBounds` would return, without building them.
 *
 * Cell counts explode with precision — an 8-character grid covers the world in 43 200 × 43 200 cells — so a
 * renderer should check this before asking for the references.
 */
export const countLocatorGridsForBounds = (bounds: LatLngBoundsLike, precision: GridPrecision): number => {
  assertPrecision(precision)

  const { endLatIndex, endLngIndex, startLatIndex, startLngIndex } = getGridIndexRange(bounds, precision)

  return (endLngIndex - startLngIndex + 1) * (endLatIndex - startLatIndex + 1)
}

/**
 * Every locator cell overlapping the bounds, in ascending order.
 *
 * Cells are aligned to the Maidenhead grid, not to the bounds, so a viewport that starts mid-cell still gets the
 * cell it starts in. A viewport touching a cell edge includes the neighbour on the far side of that edge.
 */
export const locatorGridsForBounds = (bounds: LatLngBoundsLike, precision: GridPrecision): string[] => {
  assertPrecision(precision)

  const { endLatIndex, endLngIndex, startLatIndex, startLngIndex, step } = getGridIndexRange(bounds, precision)
  const references: string[] = []

  for (let lngIndex = startLngIndex; lngIndex <= endLngIndex; lngIndex += 1) {
    const centerLng = WORLD_WEST + lngIndex * step.lng + step.lng / 2

    for (let latIndex = startLatIndex; latIndex <= endLatIndex; latIndex += 1) {
      const centerLat = WORLD_SOUTH + latIndex * step.lat + step.lat / 2

      references.push(latLngToGrid(centerLat, centerLng, precision))
    }
  }

  return references.sort()
}
