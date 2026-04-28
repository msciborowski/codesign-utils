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
import { dateTimeService, spatialService, GridLocationService } from '@codesign-eu/utils'

const day = dateTimeService.formatDay(new Date('2026-04-28T12:30:00Z'))
const parsed = dateTimeService.parseDate('20260428')

const pointLabel = spatialService.coordinatesGeoJsonToString({
  type: 'Point',
  coordinates: [21.0122, 52.2297],
})

const locator = GridLocationService.latLngToGrid(52.2297, 21.0122, 6)
const center = GridLocationService.gridToLatLng('KO02mf')

console.log(day, parsed, pointLabel, locator, center)
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

- `swapLatLng(coordinates)`
- `leafletBoundsToString(boundsLike)`
- `getPointFromPolygon(coordinates)`
- `coordinatesGeoJsonToString(point)`
- `coordinatesGeoJsonToDegreesString(point)`

`leafletBoundsToString` accepts any object with `getNorth()`, `getEast()`, `getSouth()`, and `getWest()` methods, which keeps it compatible with Leaflet bounds objects without forcing a runtime Leaflet dependency.

### `GridLocationService`

Helpers for Maidenhead locator work:

- `latLngToGrid(lat, lng, precision?)`
- `gridToLatLng(locator)`
- `locatorGridsForGeoJSON(feature, precision)`

Supported precisions today:

- `2`
- `4`
- `6`
- `8`

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
