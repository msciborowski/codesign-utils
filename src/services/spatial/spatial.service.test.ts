import { describe, expect, it } from 'vitest'
import { spatialService } from './spatial.service'
import { LatLng, LatLngBounds } from 'leaflet'

// TODO it should work without this
import '@testing-library/jest-dom'

describe('spatial service', () => {
  describe('leafletBoundsToString', () => {
    const bounds: LatLngBounds = new LatLngBounds(new LatLng(12.345, 23.456), new LatLng(34.567, 45.678))

    it('should convert leafletBounds to url string', () => {
      const boundsString = spatialService.leafletBoundsToString(bounds)

      expect(boundsString).toBe('n=34.567&e=45.678&s=12.345&w=23.456')
    })
  })

  describe('swapLatLng', () => {
    it('should swap flat array', () => {
      const coords = [
        [123, 234],
        [1, 2],
      ]
      expect(spatialService.swapLatLng(coords)).toEqual([
        [234, 123],
        [2, 1],
      ])
    })
    it('should swap array level one deep', () => {
      const coords = [
        [123, 234],
        [
          [345, 456],
          [567, 678],
        ],
        [1, 2],
      ]
      expect(spatialService.swapLatLng(coords)).toEqual([
        [234, 123],
        [
          [456, 345],
          [678, 567],
        ],
        [2, 1],
      ])
    })
    it('should swap array level two deep', () => {
      const coords = [
        [123, 234],
        [
          [345, 456],
          [567, 678],
        ],
        [1, 2],
        [
          [
            [222, 333],
            [444, 555],
            [
              [666, 777],
              [888, 999],
            ],
          ],
        ],
      ]
      expect(spatialService.swapLatLng(coords)).toEqual([
        [234, 123],
        [
          [456, 345],
          [678, 567],
        ],
        [2, 1],
        [
          [
            [333, 222],
            [555, 444],
            [
              [777, 666],
              [999, 888],
            ],
          ],
        ],
      ])
    })
  })

  describe('getPointFromPolygon', () => {
    it('1', () => {
      const coords = [123, 234]
      expect(spatialService.getPointFromPolygon(coords)).toEqual([123, 234])
    })
    it('2', () => {
      const coords = [
        [345, 456],
        [6, 27],
      ]
      expect(spatialService.getPointFromPolygon(coords)).toEqual([345, 456])
    })
    it('3', () => {
      const coords = [
        [111, 222],
        [
          [345, 456],
          [567, 678],
        ],
        [1, 2],
        [
          [
            [222, 333],
            [444, 555],
            [
              [666, 777],
              [888, 999],
            ],
          ],
        ],
      ]
      expect(spatialService.getPointFromPolygon(coords)).toEqual([111, 222])
    })
    it('4', () => {
      const coords = [
        [
          [
            [222, 333],
            [444, 555],
            [
              [666, 777],
              [888, 999],
            ],
          ],
        ],
        [1, 2],
      ]
      expect(spatialService.getPointFromPolygon(coords)).toEqual([222, 333])
    })
    it('5', () => {
      expect(spatialService.getPointFromPolygon(null)).toBeUndefined()
    })
  })
})
