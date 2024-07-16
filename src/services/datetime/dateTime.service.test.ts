import { describe, expect, it } from 'vitest'
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
})
