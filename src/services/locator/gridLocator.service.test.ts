import { describe, expect, it } from 'vitest'
import { GridLocationService } from './gridLocator.Service'

import '@testing-library/jest-dom'

describe('gridLocator service', () => {
  describe('latLng to Locator', () => {
    it('should convert latLng to locator with precision 6 for Warsaw', () => {
      const locator = GridLocationService.latLngToGrid(52.2297, 21.0122, 6)
      expect(locator).toBe('KO02mf')
    })

    it('should convert latLng to locator with precision 6 for Chicago', () => {
      const locator = GridLocationService.latLngToGrid(41.8781, -87.6298, 6)
      expect(locator).toBe('EN61ev')
    })

    it('should convert latLng to locator with precision 4 for London', () => {
      const locator = GridLocationService.latLngToGrid(51.5074, -0.1278, 4)
      expect(locator).toBe('IO91')
    })

    it('should convert latLng to locator with precision 6 for Paris', () => {
      const locator = GridLocationService.latLngToGrid(48.8566, 2.3522, 6)
      expect(locator).toBe('JN18eu')
    })

    it('should convert latLng to locator with precision 6 for Tokyo', () => {
      const locator = GridLocationService.latLngToGrid(35.6762, 139.6503, 6)
      expect(locator).toBe('PM95tq')
    })

    it('should convert latLng to locator with precision 4 for Sydney', () => {
      const locator = GridLocationService.latLngToGrid(-33.8688, 151.2093, 4)
      expect(locator).toBe('QF56')
    })

    it('should convert latLng to locator with precision 6 for Beijing', () => {
      const locator = GridLocationService.latLngToGrid(39.9042, 116.4074, 6)
      expect(locator).toBe('OM89ev')
    })

    it('should convert latLng to locator with precision 6 for Cairo', () => {
      const locator = GridLocationService.latLngToGrid(30.0444, 31.2357, 6)
      expect(locator).toBe('KM50ob')
    })

    it('should convert latLng to locator with precision 6 for Marrakesh', () => {
      const locator = GridLocationService.latLngToGrid(31.6295, -7.9811, 6)
      expect(locator).toBe('IM61ap')
    })

    it('should convert latLng to locator with precision 2 for Lisbon', () => {
      const locator = GridLocationService.latLngToGrid(38.7223, -9.1393, 2)
      expect(locator).toBe('IM')
    })

    it('should convert latLng to locator with precision 6 for Sao Paulo', () => {
      const locator = GridLocationService.latLngToGrid(-23.5505, -46.6333, 6)
      expect(locator).toBe('GG66qk')
    })

    it('should convert latLng to locator with precision 6 for Mexico City', () => {
      const locator = GridLocationService.latLngToGrid(19.4326, -99.1332, 6)
      expect(locator).toBe('EK09kk')
    })

    it('should convert latLng to locator with precision 4 for New York', () => {
      const locator = GridLocationService.latLngToGrid(40.7128, -74.006, 4)
      expect(locator).toBe('FN20')
    })

    it('should convert latLng to locator with precision 6 for Gdansk', () => {
      const locator = GridLocationService.latLngToGrid(54.352, 18.6466, 6)
      expect(locator).toBe('JO94hi')
    })

    it('should convert latLng to locator with precision 6 for Rome', () => {
      const locator = GridLocationService.latLngToGrid(41.9028, 12.4964, 6)
      expect(locator).toBe('JN61fv')
    })

    it('should convert latLng to locator with precision 4 for Bangkok', () => {
      const locator = GridLocationService.latLngToGrid(13.7563, 100.5018, 4)
      expect(locator).toBe('OK03')
    })

    it('should convert latLng to locator with precision 6 for Accra', () => {
      const locator = GridLocationService.latLngToGrid(5.6037, -0.187, 6)
      expect(locator).toBe('IJ95vo')
    })

    it('should convert latLng to locator with precision 2 for Berlin', () => {
      const locator = GridLocationService.latLngToGrid(52.52, 13.405, 2)
      expect(locator).toBe('JO')
    })

    it('should convert latLng to locator with precision 6 for Madrid', () => {
      const locator = GridLocationService.latLngToGrid(40.4168, -3.7038, 6)
      expect(locator).toBe('IN80dk')
    })

    it('should convert latLng to locator with precision 6 for Tromso', () => {
      const locator = GridLocationService.latLngToGrid(69.6492, 18.9553, 6)
      expect(locator).toBe('JP99lp')
    })
  })

  describe('Locator to latLng', () => {
    it('should convert locator to latLng for Warsaw', () => {
      const latLng = GridLocationService.gridToLatLng('KO02mf')
      expect(latLng).toEqual({ lat: 52.22916666666667, lng: 21.041666666666668 })
    })
    it('should convert locator to latLng for Chicago', () => {
      const latLng = GridLocationService.gridToLatLng('EN61ev')
      expect(latLng).toEqual({ lat: 41.895833333333336, lng: -87.625 })
    })
    it('should convert locator to latLng for London', () => {
      const latLng = GridLocationService.gridToLatLng('IO91')
      expect(latLng).toEqual({ lat: 51.5, lng: -1 })
    })
    it('should convert locator to latLng for Paris', () => {
      const latLng = GridLocationService.gridToLatLng('JN18eu')
      expect(latLng).toEqual({ lat: 48.85416666666667, lng: 2.375 })
    })
    it('should convert locator to latLng for Tokyo', () => {
      const latLng = GridLocationService.gridToLatLng('PM95tq')
      expect(latLng).toEqual({ lat: 35.6875, lng: 139.625 })
    })
    it('should convert locator to latLng for Sydney', () => {
      const latLng = GridLocationService.gridToLatLng('QF56')
      expect(latLng).toEqual({ lat: -33.5, lng: 151 })
    })
  })

  describe('locatorGridsForGeoJSON', () => {
    it('should return locator grids for given GeoJSON polygon', () => {
      const polygon: Feature<Polygon> = {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [-5.0, 50.0],
              [-5.0, 51.0],
              [-4.0, 51.0],
              [-4.0, 50.0],
              [-5.0, 50.0],
            ],
          ],
        },
      }

      const locators = GridLocationService.locatorGridsForGeoJSON(polygon, 4)
      // expect(locators).toEqual([])
      expect(locators).toEqual(['IO80', 'IO81'])
    })
  })
})
