# AGENTS.md

## Purpose

This repository is a reusable TypeScript utility library published as `@codesign-eu/utils`.

It exists to hold small, shared helpers that are useful across Codesign projects, especially for:

- date and time formatting
- geospatial coordinate helpers
- Maidenhead / QTH grid conversions

It must stay generic. Do not add product-specific labels, workflows, API clients, or application business logic here.

## Current Scope

The public entrypoint is [src/index.ts](/Users/ms/Web/codesign-utils/src/index.ts), which currently re-exports:

- `dateTimeService`
- `spatialService`
- `GridLocationService`
- the astro services

There is a second, narrower entrypoint at [src/maidenhead.ts](/Users/ms/Web/codesign-utils/src/maidenhead.ts), published as `@codesign-eu/utils/maidenhead`.

The package is intentionally small and should remain easy to consume from browser-based TypeScript apps.

## Core Direction

### Keep utilities pure and predictable

Prefer stateless helpers with explicit inputs and outputs.

Avoid:

- hidden global state
- environment-specific branching unless necessary
- app-specific side effects

### Stay product-agnostic

Do not introduce:

- product names
- domain-specific enums
- app-specific URL formats unrelated to a broadly reusable helper
- knowledge that belongs in an application service

If a helper only makes sense in one product, it probably should not live here.

### Prefer small dependencies and stable APIs

Because this package is published and shared:

- be conservative about adding new dependencies
- avoid exposing third-party runtime types in the public API unless there is a strong reason
- preserve backward compatibility when possible

When a breaking change is necessary, make it explicit in the versioning and docs.

## API Design Rules

### Strong typing over `any`

New helpers should use precise TypeScript types.

When touching older code, prefer tightening public types instead of adding more `any`.

### Clear naming

Public exports should be obvious from the import site. Favor descriptive names over abbreviations unless the domain convention is very strong, like `QTH`.

### Data shape compatibility

For shared geospatial helpers, prefer common standards and lightweight contracts:

- GeoJSON-compatible shapes
- plain coordinate tuples
- simple interface-like objects instead of heavy class requirements when possible

For bounds-shaped inputs, prefer the exported `LatLngBoundsLike` contract over direct third-party runtime types unless there is a strong reason to couple the API to a specific library.

For viewport-oriented Maidenhead helpers, keep the API bounds-based and render-oriented. Accept generic bounds contracts and return geometry/reference data, not app-specific controller state.

### Keep locator arithmetic free of turf

`src/services/locator/maidenhead.ts` holds the Maidenhead maths and must stay dependency-free. `src/services/locator/gridLocator.service.ts` is the only locator file allowed to import turf, and it does so for two helpers: `gridToPolygon` and `locatorGridsForGeoJSON`.

That split is what makes the `@codesign-eu/utils/maidenhead` subpath meaningful: a Node service can convert a locator to an envelope without loading a geometry library. When adding a locator helper, put it in `maidenhead.ts` unless it genuinely needs turf, and re-export it from both `GridLocationService` and `src/maidenhead.ts`.

Locator cell counts grow fast enough to matter — an 8-character grid is 43 200 x 43 200 cells worldwide — so viewport helpers should give callers a way to measure before they allocate, the way `countLocatorGridsForBounds` does.

Viewport helpers align cells to the Maidenhead grid, never to the caller's bounds. A viewport starting mid-cell must still include the cell it starts in; anchoring the sweep to the bounding-box corner silently drops the western and southern edge cells.

## Testing Expectations

Every behavior change should come with tests.

Priority areas:

- timezone-sensitive date formatting
- coordinate conversion edge cases
- Maidenhead precision boundaries
- malformed input handling

Keep tests deterministic and avoid relying on ambient local machine state unless the test is explicitly about that behavior.

## Release Workflow

The package uses:

- Vite library mode for builds
- `prepack` to ensure `dist/` is rebuilt before publishing
- version helper scripts for patch/minor/major bumps
- a local `version:auto` helper used by husky on `main`

If you change published entrypoints, build outputs, or dependencies, verify:

- `npm run check`
- `npm pack --dry-run`
- that each entrypoint still loads in both module systems, for example
  `node -e "require('./dist/maidenhead.cjs')"` and
  `node --input-type=module -e "import('./dist/maidenhead.js')"`

`npm run check` does not run coverage. Run `npm run test:coverage` when touching a service that is expected to stay at 100%.

## Documentation Rules

`README.md` should stay focused on:

- what the package is for
- how to install it
- the public API
- small usage examples

Do not let the README drift into internal app documentation.

When significant changes are made to the library, update both `README.md` and `AGENTS.md` in the same change set.

Treat these as significant changes:

- public API additions, removals, or behavior changes
- new utility domains or exported modules
- dependency changes that affect consumers
- build, packaging, or publishing workflow changes
- shifts in repository rules, scope, or contribution expectations

`README.md` should describe the consumer-facing impact.

`AGENTS.md` should describe the repository rule, maintenance expectation, or development workflow impact.
