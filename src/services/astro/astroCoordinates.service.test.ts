import { describe, expect, it } from 'vitest'
import { CalendarDate, CalendarTime, Coordinates } from './astro.models'
import { dMSToDecimalDegrees, decimalDegreesToDMS, hourAngleToRightAscension, rightAscensionToHourAngle } from './astroCoordinates.service'

describe('astroCoordinates', () => {
  describe('dMSToDecimalDegrees', () => {
    it("182° 31' 27''", () => {
      const coords = new Coordinates(182, 31, 27)
      expect(dMSToDecimalDegrees(coords)).toBe(182.52416666666667)
    })
    it("182° 31' 27.123''", () => {
      const coords = new Coordinates(182, 31, 27.123)
      expect(dMSToDecimalDegrees(coords)).toBe(182.52420083333334)
    })
    it("-182° 31' 27''", () => {
      const coords = new Coordinates(-182, 31, 27)
      expect(dMSToDecimalDegrees(coords)).toBe(-182.52416666666667)
    })
    it("-182° 31' 27.123''", () => {
      const coords = new Coordinates(-182, 31, 27.123)
      expect(dMSToDecimalDegrees(coords)).toBe(-182.52420083333334)
    })
    it('0°', () => {
      const coords = new Coordinates(0, 0, 0)
      expect(dMSToDecimalDegrees(coords)).toBe(0)
    })
    it("53° 29' 13''", () => {
      const coords = new Coordinates(53, 29, 13)
      expect(dMSToDecimalDegrees(coords)).toBe(53.48694444444445)
    })
    it("18° 45' 25''", () => {
      const coords = new Coordinates(18, 45, 25)
      expect(dMSToDecimalDegrees(coords)).toBe(18.756944444444443)
    })
  })
  describe('decimalDegreesToDMS', () => {
    it('182.52416667', () => {
      const test = decimalDegreesToDMS(182.52416666666667)

      expect(test.deg).toBe(182)
      expect(test.min).toBe(31)
      expect(test.sec).toBe(27)
    })
    it('182.52420083333334', () => {
      const test = decimalDegreesToDMS(182.52420083333334)

      expect(test.deg).toBe(182)
      expect(test.min).toBe(31)
      expect(test.sec).toBe(27.123)
    })
    it('-182.52416666666667', () => {
      const test = decimalDegreesToDMS(-182.52416666666667)

      expect(test.deg).toBe(182)
      expect(test.min).toBe(31)
      expect(test.sec).toBe(27)
    })
    it('-182.52420083333334', () => {
      const test = decimalDegreesToDMS(-182.52420083333334)

      expect(test.deg).toBe(182)
      expect(test.min).toBe(31)
      expect(test.sec).toBe(27.123)
    })
    it('0', () => {
      const test = decimalDegreesToDMS(0)

      expect(test.deg).toBe(0)
      expect(test.min).toBe(0)
      expect(test.sec).toBe(0)
    })
    it('53.48694444444445', () => {
      const test = decimalDegreesToDMS(53.48694444444445)

      expect(test.deg).toBe(53)
      expect(test.min).toBe(29)
      expect(test.sec).toBe(13)
    })
    it('18.756944444444443', () => {
      const test = decimalDegreesToDMS(18.756944444444443)

      expect(test.deg).toBe(18)
      expect(test.min).toBe(45)
      expect(test.sec).toBe(25)
    })
  })
  describe('right ascension to hour angle', () => {
    it('test 1', () => {
      const ra = new CalendarTime(18, 32, 21)
      const lct = new CalendarTime(14, 36, 51.67)
      const daylightSaving = 0
      const zoneCorrection = -4
      const day = new CalendarDate(1980, 4, 22)
      const longitude = -64
      const test = rightAscensionToHourAngle(ra, lct, daylightSaving, zoneCorrection, day, longitude)

      expect(test.h).toBe(9)
      expect(test.m).toBe(52)
      expect(test.s).toBe(23.66)
    })
  })
  describe('hour angle to right ascension', () => {
    it('test 1', () => {
      const ha = new CalendarTime(9, 52, 23.66)
      const lct = new CalendarTime(14, 36, 51.67)
      const daylightSaving = 0
      const zoneCorrection = -4
      const day = new CalendarDate(1980, 4, 22)
      const longitude = -64
      const test = hourAngleToRightAscension(ha, lct, daylightSaving, zoneCorrection, day, longitude)

      expect(test.h).toBe(18)
      expect(test.m).toBe(32)
      expect(test.s).toBe(21)
    })
  })
})
