import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { dateTimeService } from './dateTime.service'

// TODO it should work without this
import '@testing-library/jest-dom'

describe('dateTime service', () => {
  describe('formatDay', () => {
    it('should format the date to YYYY-MM-DD', () => {
      const date = new Date(2024, 0, 1, 12, 23, 34.567)
      const formatted = dateTimeService.formatDay(date)
      expect(formatted).toBe('2024-01-01')
    })
  })

  describe('timestampToString', () => {
    it('should format the date without seconds by default', () => {
      const date = new Date(2024, 0, 1, 12, 23, 34.567)
      const formatted = dateTimeService.timestampToString(date)
      expect(formatted).toMatch(/^2024-01-01 \d{1,2}:23$/)
    })

    it('should include seconds when showSeconds is true', () => {
      const date = new Date(2024, 0, 1, 12, 23, 34.567)
      const formatted = dateTimeService.timestampToString(date, true)
      expect(formatted).toMatch(/^2024-01-01 \d{1,2}:23:34$/)
    })
  })

  describe('parseDate', () => {
    it('should parse an 8-character date string into a Date', () => {
      const parsed = dateTimeService.parseDate('20240101')
      expect(parsed.toISOString().slice(0, 10)).toBe('2024-01-01')
    })

    it('should throw for strings that are not 8 characters', () => {
      expect(() => dateTimeService.parseDate('2024011')).toThrow('Date string to parse must be 8 characters')
    })
  })

  describe('daysBetweenToday', () => {
    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date(2024, 0, 10))
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should return the number of days between today and the given date', () => {
      const days = dateTimeService.daysBetweenToday(new Date(2024, 0, 1))
      expect(days).toBe(9)
    })
  })

  describe('timeAgo', () => {
    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date(2024, 0, 10))
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should return a human readable distance from now', () => {
      const result = dateTimeService.timeAgo(new Date(2024, 0, 1))
      expect(result).toBe('9 days')
    })
  })

  describe('dateIsFromTheFuture', () => {
    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date(2024, 0, 10))
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should return true for a date in the future', () => {
      expect(dateTimeService.dateIsFromTheFuture(new Date(2024, 0, 11))).toBe(true)
    })

    it('should return false for a date in the past', () => {
      expect(dateTimeService.dateIsFromTheFuture(new Date(2024, 0, 9))).toBe(false)
    })
  })
})
