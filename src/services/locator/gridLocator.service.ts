import * as turf from '@turf/turf'
import type { Feature, MultiPolygon, Polygon } from 'geojson'
import type { LatLngBoundsLike } from '../spatial/spatial.service'
import {
  assertPrecision,
  countLocatorGridsForBounds,
  getGridStep,
  getLocatorChildren,
  getLocatorParent,
  getLocatorPrecision,
  gridToBounds,
  gridToLatLng,
  isValidLocator,
  latLngToGrid,
  locatorGridsForBounds,
  normalizeLocator,
  type GridPrecision,
} from './maidenhead'

export type { GridBounds, GridLocation, GridPrecision, GridStep } from './maidenhead'

export type LocatorGridFeature = {
  center: { lat: number; lng: number }
  polygon: Feature<Polygon>
  reference: string
}

/**
 * Locator cell as a GeoJSON polygon.
 *
 * @throws when the value is not a well-formed locator.
 */
const gridToPolygon = (locator: string): Feature<Polygon> => {
  return turf.bboxPolygon(gridToBounds(locator)) as Feature<Polygon>
}

/**
 * Every locator cell that actually intersects the geometry, in ascending order.
 *
 * The bounding box only narrows the candidates; each one is then tested against the geometry itself, so a
 * concave or multi-part shape does not pick up cells that merely fall inside its bounding box.
 */
const locatorGridsForGeoJSON = (feature: Feature<Polygon | MultiPolygon>, precision: GridPrecision): string[] => {
  assertPrecision(precision)

  const bbox = turf.bbox(feature)
  const candidates = locatorGridsForBounds(
    {
      getEast: () => bbox[2],
      getNorth: () => bbox[3],
      getSouth: () => bbox[1],
      getWest: () => bbox[0],
    },
    precision
  )

  return candidates.filter(reference => turf.booleanIntersects(feature, gridToPolygon(reference)))
}

/**
 * Locator cells overlapping the bounds, ready to render: reference, centre and polygon.
 */
const locatorFeaturesForBounds = (bounds: LatLngBoundsLike, precision: GridPrecision): LocatorGridFeature[] => {
  return locatorGridsForBounds(bounds, precision).map(reference => ({
    center: gridToLatLng(reference),
    polygon: gridToPolygon(reference),
    reference,
  }))
}

export const GridLocationService = {
  countLocatorGridsForBounds,
  getGridStep,
  getLocatorChildren,
  getLocatorParent,
  getLocatorPrecision,
  gridToBounds,
  gridToLatLng,
  gridToPolygon,
  isValidLocator,
  latLngToGrid,
  locatorFeaturesForBounds,
  locatorGridsForBounds,
  locatorGridsForGeoJSON,
  normalizeLocator,
}
