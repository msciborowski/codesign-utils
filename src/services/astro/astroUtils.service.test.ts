import { describe, expect, it } from 'vitest'
import {
  abs,
  dDDH,
  dDDeg,
  dDMin,
  dDSec,
  dHDD,
  dHHour,
  dHMin,
  dHSec,
  floor,
  formatSecondsWithMilliseconds,
  round,
  trunc,
  zeroPad,
  zeroPadRight,
} from './astroUtils.service'

describe('astroUtils', () => {
  describe('abs', () => {
    it('3.87', () => {
      expect(abs(3.87)).toBe(3.87)
    })
    it('3.14', () => {
      expect(abs(3.14)).toBe(3.14)
    })
    it('-3.14', () => {
      expect(abs(-3.14)).toBe(3.14)
    })
    it('-3.87', () => {
      expect(abs(-3.87)).toBe(3.87)
    })
  })
  describe('floor', () => {
    it('3.87', () => {
      expect(floor(3.87)).toBe(3)
    })
    it('3.14', () => {
      expect(floor(3.14)).toBe(3)
    })
    it('-3.14', () => {
      expect(floor(-3.14)).toBe(-4)
    })
    it('-3.87', () => {
      expect(floor(-3.87)).toBe(-4)
    })
  })
  describe('round', () => {
    it('3.87654321, 2', () => {
      expect(round(3.87654321, 2)).toBe(3.88)
    })
    it('3.87654321, 3', () => {
      expect(round(3.87654321, 3)).toBe(3.877)
    })
    it('3.87654321, 4', () => {
      expect(round(3.87654321, 4)).toBe(3.8765)
    })
    it('3.87654321, 5', () => {
      expect(round(3.87654321, 5)).toBe(3.87654)
    })
  })
  describe('trunc', () => {
    it('3.87', () => {
      expect(trunc(3.87)).toBe(3)
    })
    it('3.14', () => {
      expect(trunc(3.14)).toBe(3)
    })
    it('-3.14', () => {
      expect(trunc(-3.14)).toBe(-3)
    })
    it('-3.87', () => {
      expect(trunc(-3.87)).toBe(-3)
    })
  })
  describe('zeroPad', () => {
    it('test 1', () => {
      expect(zeroPad(1, 2)).toBe('01')
    })
    it('test 2', () => {
      expect(zeroPad(123, 0)).toBe('123')
    })
    it('test 3', () => {
      expect(zeroPad(123, 6)).toBe('000123')
    })
    it('test 4', () => {
      expect(zeroPad(0, 6)).toBe('000000')
    })
  })
  describe('zeroPadRight', () => {
    it('test 1', () => {
      expect(zeroPadRight(1, 2)).toBe('10')
    })
    it('test 2', () => {
      expect(zeroPadRight(123, 0)).toBe('123')
    })
    it('test 3', () => {
      expect(zeroPadRight(123, 6)).toBe('123000')
    })
    it('test 4', () => {
      expect(zeroPadRight(0, 6)).toBe('000000')
    })
  })
  describe('formatSecondsWithMilliseconds', () => {
    it('is a string', () => {
      expect(typeof formatSecondsWithMilliseconds(12.13, 3)).toBe('string')
    })
    it('0', () => {
      expect(formatSecondsWithMilliseconds(0)).toBe('00.000')
    })
    it('0 with length 2', () => {
      expect(formatSecondsWithMilliseconds(0, 2)).toBe('00.00')
    })
    it('59.2', () => {
      expect(formatSecondsWithMilliseconds(59.2)).toBe('59.200')
    })
    it('12.345678', () => {
      expect(formatSecondsWithMilliseconds(12.345678)).toBe('12.346')
    })
  })
  describe('decimal degrees to decimal hours', () => {
    it('0', () => {
      expect(dDDH(0)).toBe(0)
    })
    it('120', () => {
      expect(dDDH(120)).toBe(8)
    })
    it('123.45', () => {
      expect(dDDH(123.45)).toBe(8.23)
    })
    it('-67.89', () => {
      expect(dDDH(-67.89)).toBe(-4.526)
    })
    it('12', () => {
      expect(dDDH(12)).toBe(0.8)
    })
    it('-12', () => {
      expect(dDDH(-12)).toBe(-0.8)
    })
    it('12.123', () => {
      expect(dDDH(12.123)).toBe(0.8081999999999999)
    })
    it('15', () => {
      expect(dDDH(15)).toBe(1)
    })
    it('-15', () => {
      expect(dDDH(-15)).toBe(-1)
    })
    it('180', () => {
      expect(dDDH(180)).toBe(12)
    })
    it('360', () => {
      expect(dDDH(360)).toBe(24)
    })
  })
  describe('decimal hours to decimal degrees', () => {
    it('0', () => {
      expect(dHDD(0)).toBe(0)
    })
    it('8', () => {
      expect(dHDD(8)).toBe(120)
    })
    it('8.23', () => {
      expect(dHDD(8.23)).toBe(123.45)
    })
    it('-4.526', () => {
      expect(dHDD(-4.526)).toBe(-67.89)
    })
    it('0.8', () => {
      expect(dHDD(0.8)).toBe(12)
    })
    it('-0.8', () => {
      expect(dHDD(-0.8)).toBe(-12)
    })
    it('0.8081999999999999', () => {
      expect(dHDD(0.8081999999999999)).toBe(12.123)
    })
    it('1', () => {
      expect(dHDD(1)).toBe(15)
    })
    it('-1', () => {
      expect(dHDD(-1)).toBe(-15)
    })
    it('12', () => {
      expect(dHDD(12)).toBe(180)
    })
    it('24', () => {
      expect(dHDD(24)).toBe(360)
    })
  })
  describe('degrees from decimal degrees', () => {
    it('0', () => expect(dDDeg(0)).toBe(0))
    it('23.436694', () => {
      expect(dDDeg(23.436694)).toBe(23)
    })
    it('-66.560833', () => {
      expect(dDDeg(-66.560833)).toBe(-66)
    })
    it('182.52416667', () => {
      expect(dDDeg(182.52416667)).toBe(182)
    })
    it('-182.52416667', () => {
      expect(dDDeg(-182.52416667)).toBe(-182)
    })
    it('53.48694444444445', () => {
      expect(dDDeg(53.48694444444445)).toBe(53)
    })
    it('18.756944444444443', () => {
      expect(dDDeg(18.756944444444443)).toBe(18)
    })
  })
  describe('minutes from decimal degrees', () => {
    it('0', () => expect(dDMin(0)).toBe(0))
    it('23.436694', () => {
      expect(dDMin(23.436694)).toBe(26)
    })
    it('-66.560833', () => {
      expect(dDMin(-66.560833)).toBe(33)
    })
    it('182.52416667', () => {
      expect(dDMin(182.52416667)).toBe(31)
    })
    it('-182.52416667', () => {
      expect(dDMin(-182.52416667)).toBe(31)
    })
    it('53.48694444444445', () => {
      expect(dDMin(53.48694444444445)).toBe(29)
    })
    it('18.756944444444443', () => {
      expect(dDMin(18.756944444444443)).toBe(45)
    })
  })
  describe('seconds from decimal degrees', () => {
    it('0', () => expect(dDSec(0)).toBe(0))
    it('23.436694', () => {
      expect(dDSec(23.436694)).toBe(12.1)
    })
    it('-66.560833', () => {
      expect(dDSec(-66.560833)).toBe(39)
    })
    it('182.52416667', () => {
      expect(dDSec(182.52416667)).toBe(27)
    })
    it('-182.52416667', () => {
      expect(dDSec(-182.52416667)).toBe(27)
    })
    it('53.48694444444445', () => {
      expect(dDSec(53.48694444444445)).toBe(13)
    })
    it('18.756944444444443', () => {
      expect(dDSec(18.756944444444443)).toBe(25)
    })
  })
  describe('hours from decimal hour', () => {
    it('0', () => expect(dHHour(0)).toBe(0))
    it('1.2345678', () => {
      expect(dHHour(1.2345678)).toBe(1)
    })
    it('12.9977', () => {
      expect(dHHour(12.9977)).toBe(12)
    })
    it('-9.876', () => {
      expect(dHHour(-9.876)).toBe(-9)
    })
    it('12.168277778', () => {
      expect(dHHour(dDDH(182.52416667))).toBe(12)
    })
    it('3.5657962962966', () => {
      expect(dHHour(dDDH(53.48694444444445))).toBe(3)
    })
    it('1.2504629629629629', () => {
      expect(dHHour(dDDH(18.756944444444443))).toBe(1)
    })
  })
  describe('minutes from decimal hour', () => {
    it('0', () => expect(dHMin(0)).toBe(0))
    it('1.2345678', () => {
      expect(dHMin(1.2345678)).toBe(14)
    })
    it('12.9977', () => {
      expect(dHMin(12.9977)).toBe(59)
    })
    it('-9.876', () => {
      expect(dHMin(-9.876)).toBe(52)
    })
    it('12.168277778', () => {
      expect(dHMin(dDDH(182.52416667))).toBe(10)
    })
    it('3.5657962962966', () => {
      expect(dHMin(dDDH(53.48694444444445))).toBe(33)
    })
    it('1.2504629629629629', () => {
      expect(dHMin(dDDH(18.756944444444443))).toBe(15)
    })
  })
  describe('seconds from decimal hour', () => {
    it('0', () => expect(dHSec(0)).toBe(0))
    it('1.2345678', () => {
      expect(dHSec(1.2345678)).toBe(4.44)
    })
    it('12.9977', () => {
      expect(dHSec(12.9977)).toBe(51.72)
    })
    it('-9.876', () => {
      expect(dHSec(-9.876)).toBe(33.6)
    })
    it('12.168277778', () => {
      expect(dHSec(dDDH(182.52416667))).toBe(5.8)
    })
    it('3.5657962962966', () => {
      expect(dHSec(dDDH(53.48694444444445))).toBe(56.87)
    })
    it('1.2504629629629629', () => {
      expect(dHSec(dDDH(18.756944444444443))).toBe(1.67)
    })
  })
})
