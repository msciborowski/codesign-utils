# @codesign-eu/utils

Shared TypeScript utilities for Codesign applications.

The library currently focuses on three areas:

- date and time helpers
- spatial / coordinate formatting helpers
- Maidenhead (QTH) grid conversion helpers

## Installation

```bash
npm install @codesign-eu/utils
```

## Usage

```ts
import { dateTimeService, spatialService, GridLocationService, type LatLngBoundsLike } from '@codesign-eu/utils'

const day = dateTimeService.formatDay(new Date('2026-04-28T12:30:00Z'))
const parsed = dateTimeService.parseDate('20260428')

const pointLabel = spatialService.coordinatesGeoJsonToString({
  type: 'Point',
  coordinates: [21.0122, 52.2297],
})

const locator = GridLocationService.latLngToGrid(52.2297, 21.0122, 6)
const center = GridLocationService.gridToLatLng('KO02mf')

const bounds: LatLngBoundsLike = {
  getNorth: () => 54,
  getEast: () => 22,
  getSouth: () => 52,
  getWest: () => 20,
}

const viewportLocators = GridLocationService.locatorFeaturesForBounds(bounds, 4)
const locatorEnvelope = GridLocationService.gridToBounds('KO02kk')
const boundsQuery = spatialService.leafletBoundsToString(bounds)

console.log(day, parsed, pointLabel, locator, center, viewportLocators[0]?.reference, locatorEnvelope, boundsQuery)
```

## Public API

### `dateTimeService`

Helpers for formatting and comparing dates:

- `formatDay(date)`
- `timestampToString(date, showSeconds?)`
- `parseDate('YYYYMMDD')`
- `daysBetweenToday(date)`
- `timeAgo(date)`
- `dateIsFromTheFuture(date)`

### `spatialService`

Helpers for coordinate formatting and nested coordinate structures:

- `LatLngBoundsLike`
- `swapLatLng(coordinates)`
- `leafletBoundsToString(boundsLike)`
- `getPointFromPolygon(coordinates)`
- `coordinatesGeoJsonToString(point)`
- `coordinatesGeoJsonToDegreesString(point)`

`LatLngBoundsLike` is the exported lightweight bounds contract for `leafletBoundsToString`.

`leafletBoundsToString` stays compatible with Leaflet bounds objects, but the library does not require Leaflet as a consumer dependency.

### `GridLocationService`

Helpers for Maidenhead (QTH) locator work.

Parsing and validation:

- `isValidLocator(value)` - `true` for a well-formed 2/4/6/8-character locator; case-insensitive, surrounding whitespace ignored
- `normalizeLocator(value)` - canonical form (`' ko02KK '` becomes `'KO02kk'`), or `null`
- `getLocatorPrecision(value)` - `2 | 4 | 6 | 8`, or `null`

Conversions:

- `latLngToGrid(lat, lng, precision?)` - defaults to precision `6`
- `gridToLatLng(locator)` - centre of the cell
- `gridToBounds(locator)` - `[west, south, east, north]`, computed without turf
- `gridToPolygon(locator)` - the cell as a GeoJSON polygon
- `getGridStep(precision)` - cell size in degrees

Hierarchy:

- `getLocatorParent(locator)` - one precision level up, `null` for a 2-character field
- `getLocatorChildren(locator)` - one precision level down (100, 576 and 100 respectively), empty for an 8-character locator

Viewports:

- `locatorGridsForBounds(bounds, precision)` - references overlapping the bounds, aligned to the Maidenhead grid
- `countLocatorGridsForBounds(bounds, precision)` - how many references the call above would return, without building them
- `locatorFeaturesForBounds(bounds, precision)` - reference, centre and polygon, ready to render
- `locatorGridsForGeoJSON(feature, precision)` - references that actually intersect the geometry, not just its bounding box

Supported precisions: `2`, `4`, `6`, `8`.

Functions that take a locator throw `Invalid QTH locator format` when the value is not one. Functions that take a precision throw `Unsupported Maidenhead precision`.

Two things worth knowing before rendering a grid:

- Cell counts grow fast. An 8-character grid divides the world into 43 200 x 43 200 cells, so check `countLocatorGridsForBounds` before asking for the references.
- Bounds that wrap across the antimeridian are not split. They widen to the whole longitude range.

### `@codesign-eu/utils/maidenhead`

The locator arithmetic is also published as a subpath entry with no runtime dependencies, for consumers that need locator maths without the geometry helpers - a Node service turning a locator into a database envelope, for example:

```ts
import { gridToBounds } from '@codesign-eu/utils/maidenhead'

const [west, south, east, north] = gridToBounds('KO02kk')
```

The subpath exports everything listed above except `gridToPolygon`, `locatorFeaturesForBounds` and `locatorGridsForGeoJSON`, which need turf.

## Development

```bash
npm install
npm run check
```

Useful commands:

```bash
npm run test
npm run build
npm run typecheck
npm run lint
```

## Release Helpers

```bash
npm run version:patch
npm run version:minor
npm run version:major
```

Publishing uses `prepack`, so the package is rebuilt before `npm publish`.
