/**
 * Turf-free entry point: `@codesign-eu/utils/maidenhead`.
 *
 * Maidenhead (QTH) locator arithmetic with no runtime dependencies, for consumers that need locator maths
 * without pulling in the geometry helpers — a Node service computing an envelope from a locator, for example.
 *
 * Everything exported here is also reachable through `GridLocationService` on the package root.
 */
export {
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
} from './services/locator/maidenhead'

export type { GridBounds, GridLocation, GridPrecision, GridStep } from './services/locator/maidenhead'
