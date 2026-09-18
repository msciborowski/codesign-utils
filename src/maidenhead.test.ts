import { describe, expect, it } from 'vitest'
import * as maidenheadEntry from './maidenhead'

/**
 * The `@codesign-eu/utils/maidenhead` subpath is the turf-free contract consumed by Node services.
 * These tests guard the shape of that contract, not the maths — `services/locator/maidenhead.test.ts` covers the maths.
 */
describe('maidenhead entry point', () => {
  it('exports the locator helpers that do not need turf', () => {
    expect(Object.keys(maidenheadEntry).sort()).toEqual([
      'countLocatorGridsForBounds',
      'getGridStep',
      'getLocatorChildren',
      'getLocatorParent',
      'getLocatorPrecision',
      'gridToBounds',
      'gridToLatLng',
      'isValidLocator',
      'latLngToGrid',
      'locatorGridsForBounds',
      'normalizeLocator',
    ])
  })

  it('resolves a locator to an envelope', () => {
    expect(maidenheadEntry.gridToBounds('IO91')).toEqual([-2, 51, 0, 52])
  })
})
