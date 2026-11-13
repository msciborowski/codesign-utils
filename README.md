# @codesign-eu/utils

Shared TypeScript utilities for Codesign applications.

The library currently focuses on four areas:

- date and time helpers
- spatial / coordinate formatting helpers
- Maidenhead (QTH) grid conversion helpers
- reading amateur radio QSO log files (ADIF, EDI)

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

### `@codesign-eu/utils/qso-log`

Reads amateur radio QSO log files, with no runtime dependencies, so a browser preview and a server check of the same file give the same result:

```ts
import { importLog } from '@codesign-eu/utils/qso-log'

const log = importLog({ name: file.name, content: await file.text() })

if (log) {
  for (const qso of log.qsos) {
    console.log(log.format, qso.callsign, qso.qsoAt, qso.band, qso.frequencyMhz, qso.mode, qso.locator)
  }
}
```

- `importLog({ name, content })` - one entry point for log files: returns `{ format, program, qsos, problems }`, or `null` when the format is not supported. Formats: ADIF in the ADI syntax (`.adi`, `.adif`) and EDI, the IARU Region 1 contest log (`REG1TEST`, `.edi`). Further formats will return the same shape.
- `detectLogFormat({ name, content })` - `'adif'` or `'edi'` by the extension, else by the content (`[REG1TEST;` at the start, an `<EOR>` anywhere); `null` otherwise. ADX (XML) and Cabrillo are not read.
- `parseAdi(text)` - the ADI reader: header fields, records as upper-case field name → value, and the problems it recovered from.
- `parseEdi(text)` - the EDI reader: header (upper-case keys), remarks, QSO lines field by field, and the problems it recovered from.
- `adifDateTime(date, time)` - ADIF `YYYYMMDD` and `HHMM`/`HHMMSS` (UTC) as an ISO 8601 moment, or `null`.
- `adifBandOfMhz(mhz)`, `ADIF_BANDS` - the ADIF band enumeration (3.1.7) and the band of a frequency.
- `ediBandMhz(pband)`, `isEdi(text)` - EDI `PBand` (`145 MHz`, `1,3 GHz`) in MHz, and whether a text starts like an EDI file.

Each QSO carries `record` (position in the file), `callsign`, `stationCallsign`, `locator`, `myLocator`, `qsoAt`, `frequencyMhz`, `band` (an ADIF band name, lower-case), `mode` and `submode` (upper-case), and every field as written in `fields`. Values are trimmed; missing or malformed ones are `null`. Locators, bands and callsigns are not validated: that is up to the application.

| QSO field         | ADIF                                | EDI                                                                      |
| ----------------- | ----------------------------------- | ------------------------------------------------------------------------ |
| `callsign`        | `CALL`                              | call; `null` for an `ERROR` line                                         |
| `stationCallsign` | `STATION_CALLSIGN`, else `OPERATOR` | `PCall` (header)                                                         |
| `locator`         | `GRIDSQUARE`                        | received WWL                                                             |
| `myLocator`       | `MY_GRIDSQUARE`                     | `PWWLo` (header)                                                         |
| `qsoAt`           | `QSO_DATE` + `TIME_ON`              | `YYMMDD` + `HHMM`, the century from `TDate`                              |
| `frequencyMhz`    | `FREQ`                              | always `null`: EDI has no frequency per QSO                              |
| `band`            | `BAND`                              | `PBand` (header) mapped to the ADIF band                                 |
| `mode`            | `MODE`                              | mode codes 1 SSB, 2 CW, 5 AM, 6 FM, 8 SSTV, 9 ATV; `null` for 0, 3, 4, 7 |
| `fields`          | ADIF field names                    | `DATE`, `TIME`, `CALL`, `MODE_CODE` … `RECEIVED_WWL` … `DUPLICATE`       |

ADI is specified as ASCII, but logging programs write UTF-8 and count value lengths in bytes, characters or UTF-16 code units. Lengths are read in UTF-16 code units, and a value whose length runs into the next data specifier is cut before it (`LENGTH_MISMATCH` in `problems`), so one name with diacritics does not shift the fields after it. The other ADI problems are `TRUNCATED_VALUE`, `DUPLICATE_FIELD` (the first value is kept), `UNTERMINATED_RECORD` (fields after the last `<EOR>` are left out) and `MISSING_EOH`. EDI problems are `MISSING_IDENTIFIER`, `SHORT_RECORD` (a QSO line with fewer than ten fields, left out) and `RECORD_COUNT`.

Everything in this subpath is also exported from the package root.

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
