import { describe, expect, it } from 'vitest'
import type { LatLngBoundsLike } from '../spatial/spatial.service'
import {
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
} from './maidenhead'

const buildBounds = ({ east, north, south, west }: { east: number; north: number; south: number; west: number }): LatLngBoundsLike => ({
  getEast: () => east,
  getNorth: () => north,
  getSouth: () => south,
  getWest: () => west,
})

describe('maidenhead', () => {
  describe('isValidLocator', () => {
    it.each([
      ['KO', true],
      ['KO02', true],
      ['KO02kk', true],
      ['KO02kk11', true],
      ['ko02KK', true],
      [' io91 ', true],
      ['', false],
      ['K', false],
      ['KO0', false],
      ['SS00', false],
      ['KO02zz', false],
      ['KO02kk1', false],
      ['KO02kk1111', false],
      ['KO-02', false],
    ])('treats %s as %s', (value, expected) => {
      expect(isValidLocator(value)).toBe(expected)
    })
  })

  describe('normalizeLocator', () => {
    it('upper-cases the field and lower-cases the sub-square', () => {
      expect(normalizeLocator(' ko02KK ')).toBe('KO02kk')
    })

    it('normalizes every supported precision', () => {
      expect(normalizeLocator('ko')).toBe('KO')
      expect(normalizeLocator('ko02')).toBe('KO02')
      expect(normalizeLocator('ko02MF')).toBe('KO02mf')
      expect(normalizeLocator('ko02MF15')).toBe('KO02mf15')
    })

    it('returns null for values that are not locators', () => {
      expect(normalizeLocator('ZZ99')).toBeNull()
      expect(normalizeLocator('KO0')).toBeNull()
      expect(normalizeLocator('')).toBeNull()
    })
  })

  describe('getLocatorPrecision', () => {
    it('derives the precision from the locator length', () => {
      expect(getLocatorPrecision('KO')).toBe(2)
      expect(getLocatorPrecision('KO02')).toBe(4)
      expect(getLocatorPrecision('ko02mf')).toBe(6)
      expect(getLocatorPrecision('KO02MF15')).toBe(8)
    })

    it('returns null for values that are not locators', () => {
      expect(getLocatorPrecision('nope')).toBeNull()
    })
  })

  describe('getGridStep', () => {
    it('returns the cell size for every supported precision', () => {
      expect(getGridStep(2)).toEqual({ lat: 10, lng: 20 })
      expect(getGridStep(4)).toEqual({ lat: 1, lng: 2 })
      expect(getGridStep(6)).toEqual({ lat: 1 / 24, lng: 2 / 24 })
      expect(getGridStep(8)).toEqual({ lat: 1 / 240, lng: 2 / 240 })
    })
  })

  describe('latLngToGrid', () => {
    it('defaults to precision 6', () => {
      expect(latLngToGrid(52.2297, 21.0122)).toBe('KO02mf')
    })

    it('stays inside the Maidenhead field range at the north-east corner of the world', () => {
      expect(latLngToGrid(90, 180, 2)).toBe('RR')
      expect(latLngToGrid(90, 180, 4)).toBe('RR99')
      expect(latLngToGrid(90, 180, 6)).toBe('RR99xx')
      expect(latLngToGrid(90, 180, 8)).toBe('RR99xx99')
    })

    it('stays inside the Maidenhead field range at the south-west corner of the world', () => {
      expect(latLngToGrid(-90, -180, 2)).toBe('AA')
      expect(latLngToGrid(-90, -180, 8)).toBe('AA00aa00')
    })

    it('clamps coordinates that fall outside the world', () => {
      expect(latLngToGrid(95, 185, 8)).toBe('RR99xx99')
      expect(latLngToGrid(-95, -185, 8)).toBe('AA00aa00')
    })

    it('rejects an unsupported precision', () => {
      // @ts-expect-error testing the runtime guard against an unsupported precision
      expect(() => latLngToGrid(52.2297, 21.0122, 3)).toThrow('Unsupported Maidenhead precision')
    })

    it('rejects a fractional precision', () => {
      // @ts-expect-error testing the runtime guard against a fractional precision
      expect(() => latLngToGrid(52.2297, 21.0122, 4.5)).toThrow('Unsupported Maidenhead precision')
    })
  })

  describe('round trips', () => {
    it.each([2, 4, 6, 8] as const)('returns a point inside the original cell at precision %i', precision => {
      const reference = latLngToGrid(52.2297, 21.0122, precision)
      const center = gridToLatLng(reference)

      expect(latLngToGrid(center.lat, center.lng, precision)).toBe(reference)
    })

    it('keeps the centre within half a cell of the source coordinates at precision 8', () => {
      const step = getGridStep(8)
      const center = gridToLatLng(latLngToGrid(52.2297, 21.0122, 8))

      expect(Math.abs(center.lat - 52.2297)).toBeLessThanOrEqual(step.lat / 2)
      expect(Math.abs(center.lng - 21.0122)).toBeLessThanOrEqual(step.lng / 2)
    })
  })

  describe('gridToBounds', () => {
    it('returns the cell extent in GeoJSON order', () => {
      expect(gridToBounds('IO91')).toEqual([-2, 51, 0, 52])
    })

    it('covers every supported precision', () => {
      expect(gridToBounds('KO')).toEqual([20, 50, 40, 60])
      expect(gridToBounds('KO02mf')).toEqual([21, 52.208333333333, 21.083333333333, 52.25])
      expect(gridToBounds('KO02mf15')).toEqual([21.008333333333, 52.229166666667, 21.016666666667, 52.233333333333])
    })

    it('accepts a locator in any casing', () => {
      expect(gridToBounds('io91')).toEqual(gridToBounds('IO91'))
    })

    it('rejects a value that is not a locator', () => {
      expect(() => gridToBounds('ZZ99')).toThrow('Invalid QTH locator format')
    })
  })

  describe('gridToLatLng', () => {
    it('rejects a value that is not a locator', () => {
      expect(() => gridToLatLng('ZZ99')).toThrow('Invalid QTH locator format')
    })
  })

  describe('getLocatorParent', () => {
    it('walks one precision level up', () => {
      expect(getLocatorParent('KO02mf15')).toBe('KO02mf')
      expect(getLocatorParent('KO02mf')).toBe('KO02')
      expect(getLocatorParent('KO02')).toBe('KO')
    })

    it('returns null for a field', () => {
      expect(getLocatorParent('KO')).toBeNull()
    })

    it('rejects a value that is not a locator', () => {
      expect(() => getLocatorParent('nope')).toThrow('Invalid QTH locator format')
    })
  })

  describe('getLocatorChildren', () => {
    it('returns 100 squares for a field', () => {
      const children = getLocatorChildren('KO')

      expect(children).toHaveLength(100)
      expect(children.slice(0, 3)).toEqual(['KO00', 'KO01', 'KO02'])
      expect(children[children.length - 1]).toBe('KO99')
    })

    it('returns 576 sub-squares for a square', () => {
      const children = getLocatorChildren('KO02')

      expect(children).toHaveLength(576)
      expect(children.slice(0, 3)).toEqual(['KO02aa', 'KO02ab', 'KO02ac'])
      expect(children[children.length - 1]).toBe('KO02xx')
    })

    it('returns 100 extended squares for a sub-square', () => {
      const children = getLocatorChildren('KO02mf')

      expect(children).toHaveLength(100)
      expect(children[0]).toBe('KO02mf00')
      expect(children[children.length - 1]).toBe('KO02mf99')
    })

    it('returns nothing below the extended square', () => {
      expect(getLocatorChildren('KO02mf15')).toEqual([])
    })

    it('returns children that all resolve back to their parent', () => {
      expect(getLocatorChildren('KO02').every(child => getLocatorParent(child) === 'KO02')).toBe(true)
    })

    it('rejects a value that is not a locator', () => {
      expect(() => getLocatorChildren('nope')).toThrow('Invalid QTH locator format')
    })
  })

  describe('locatorGridsForBounds', () => {
    it('aligns cells to the Maidenhead grid, not to the bounds', () => {
      const locators = locatorGridsForBounds(buildBounds({ east: -4, north: 51, south: 50, west: -5 }), 4)

      expect(locators).toEqual(['IO70', 'IO71', 'IO80', 'IO81'])
    })

    it('normalizes bounds passed in with north/south and east/west swapped', () => {
      const locators = locatorGridsForBounds(buildBounds({ east: -5, north: 50, south: 51, west: -4 }), 4)

      expect(locators).toEqual(['IO70', 'IO71', 'IO80', 'IO81'])
    })

    it('covers a viewport at precision 6', () => {
      const locators = locatorGridsForBounds(buildBounds({ east: 21.1, north: 52.25, south: 52.2, west: 21 }), 6)

      expect(locators).toEqual(['KO02me', 'KO02mf', 'KO02mg', 'KO02ne', 'KO02nf', 'KO02ng'])
    })

    it('clamps out-of-range latitude and longitude values to the whole world', () => {
      expect(locatorGridsForBounds(buildBounds({ east: 185, north: 95, south: -95, west: -185 }), 2)).toHaveLength(324)
    })

    it('resolves a degenerate viewport at the north-east corner of the world', () => {
      expect(locatorGridsForBounds(buildBounds({ east: 180, north: 90, south: 90, west: 180 }), 8)).toEqual(['RR99xx99'])
    })

    it('widens bounds that wrap across the antimeridian instead of splitting them', () => {
      const locators = locatorGridsForBounds(buildBounds({ east: -170, north: 51, south: 50, west: 170 }), 4)

      expect(locators).toHaveLength(342)
      expect(locators).toContain(latLngToGrid(50.5, -169, 4))
      expect(locators).toContain(latLngToGrid(50.5, 169, 4))
      // the widening pulls in the far side of the globe, which a real antimeridian split would not
      expect(locators).toContain(latLngToGrid(50.5, 0, 4))
      // ...but the two cells the viewport actually straddles are still left out
      expect(locators).not.toContain(latLngToGrid(50.5, 179, 4))
    })

    it('rejects an unsupported precision', () => {
      // @ts-expect-error testing the runtime guard against an unsupported precision
      expect(() => locatorGridsForBounds(buildBounds({ east: -4, north: 51, south: 50, west: -5 }), 3)).toThrow('Unsupported Maidenhead precision')
    })
  })

  describe('countLocatorGridsForBounds', () => {
    it('matches the number of references that would be generated', () => {
      const bounds = buildBounds({ east: -4, north: 51, south: 50, west: -5 })

      expect(countLocatorGridsForBounds(bounds, 4)).toBe(locatorGridsForBounds(bounds, 4).length)
    })

    it('counts the whole world without building the references', () => {
      const world = buildBounds({ east: 180, north: 90, south: -90, west: -180 })

      expect(countLocatorGridsForBounds(world, 2)).toBe(324)
      expect(countLocatorGridsForBounds(world, 8)).toBe(1_866_240_000)
    })

    it('rejects an unsupported precision', () => {
      // @ts-expect-error testing the runtime guard against an unsupported precision
      expect(() => countLocatorGridsForBounds(buildBounds({ east: -4, north: 51, south: 50, west: -5 }), 3)).toThrow('Unsupported Maidenhead precision')
    })
  })
})
