import { describe, expect, it } from 'vitest'
import { CalendarDateTime, CalendarTime } from './astro.models'
import {
  dateOfEaster,
  dayOfTheWeek,
  daysInMonth,
  decimalHours2HMS,
  greenwichSiderealTime2UniversalTime,
  greenwichSiderealTimeToLocalSiderealTime,
  gregorian,
  hMS2DecimalHours,
  isLapYear,
  jd,
  jdcDay,
  jdcMonth,
  jdcYear,
  localCivilTime2universalTime,
  localSiderealTimeToGreenwichSiderealTime,
  tod,
  universalTime2GreenwichSiderealTime,
  universalTime2LocalCivilTime,
} from './astroCalendar.service'

describe('astroCalendar', () => {
  describe('jd ranges validation', () => {
    it('time of the day cannot be grater than 1', () => {
      expect(() => jd(2000, 1, 1, 1.01)).toThrow('Time of day cannot be greater than or equal to 1')
    })
    it('time of the day cannot be equal to 1', () => {
      expect(() => jd(2000, 1, 1, 1)).toThrow('Time of day cannot be greater than or equal to 1')
    })
    it('month less than 0', () => {
      expect(() => jd(2000, 0, 1)).toThrow('Month must be between 1 and 12')
    })
    it('month greater than 12', () => {
      expect(() => jd(2000, 13, 1)).toThrow('Month must be between 1 and 12')
    })
    it('day less than 0', () => {
      expect(() => jd(2000, 1, -0.1)).toThrow('Day must be greater than 0')
    })
    it.skip('day greater than 31', () => {
      expect(() => jd(2000, 1, 32)).toThrow('Day must be between 0 and 32')
    })
    it('hour less than 0', () => {
      expect(() => jd(2000, 1, 1, -1, 30, 30)).toThrow('Hour must be between 0 and 23')
    })
    it('minute less than 0', () => {
      expect(() => jd(2000, 1, 1, 12, -1, 30)).toThrow('Minute must be between 0 and 59')
    })
    it('minute greater than 59', () => {
      expect(() => jd(2000, 1, 1, 12, 60, 30)).toThrow('Minute must be between 0 and 59')
    })
    it('second less than 0', () => {
      expect(() => jd(2000, 1, 1, 12, 30, -1)).toThrow('Second must be between 0 and 59')
    })
    it('second greater than 59', () => {
      expect(() => jd(2000, 1, 1, 12, 30, 60)).toThrow('Second must be between 0 and 59')
    })
    it('date earlier than 1582-10-15 causes an error', () => {
      expect(() => jd(1582, 10, 14)).toThrow('Date less than 1582-10-15')
    })
  })
  describe('jd', () => {
    it('beginning of gregorian calendar DATE', () => {
      const date = new Date(1582, 9, 15) // 1582-10-15
      expect(jd(date)).toBe(2299160.5)
    })
    it('beginning of gregorian calendar DATE + TOD', () => {
      const date = new Date(1582, 9, 15) // 1582-10-15
      expect(jd(date, 0)).toBe(2299160.5)
    })
    it('beginning of gregorian calendar YMD', () => {
      expect(jd(1582, 10, 15)).toBe(2299160.5)
    })
    it('beginning of gregorian calendar YMD + TOD', () => {
      expect(jd(1582, 10, 15, 0)).toBe(2299160.5)
    })
    it('beginning of gregorian calendar YMDHMS', () => {
      expect(jd(1582, 10, 15, 0, 0, 0)).toBe(2299160.5)
    })
    it('first sputnik DATE', () => {
      const date = new Date(1957, 9, 4, 19, 26, 24) // 1957-10-04
      expect(jd(date)).toBe(2436116.31)
    })
    it('first sputnik DATE + TOD', () => {
      const date = new Date(1957, 9, 4) // 1957-10-04
      expect(jd(date, 0.81)).toBe(2436116.31)
    })
    it('first sputnik YMD + TOD', () => {
      expect(jd(1957, 10, 4, 0.81)).toBe(2436116.31)
    })
    it('first sputnik YMD HMS', () => {
      expect(jd(1957, 10, 4, 19, 26, 24)).toBe(2436116.31)
    })
    it('first man on the moon DATE', () => {
      const date = new Date(1969, 6, 20, 20, 24, 0) // 1969-07-20
      expect(jd(date)).toBe(2440423.35)
    })
    it('first man on the moon DATE + TOD', () => {
      const date = new Date(1969, 6, 20) // 1969-07-20
      expect(jd(date, 0.85)).toBe(2440423.35)
    })
    it('first man on the moon YMD + TOD', () => {
      expect(jd(1969, 7, 20, 0.85)).toBe(2440423.35)
    })
    it('first man on the moon YMD HMS', () => {
      expect(jd(1969, 7, 20, 20, 24, 0)).toBe(2440423.35)
    })
    it('the sixth of november YMD + TOD', () => {
      expect(jd(2017, 11, 6, 0.5)).toBe(2458064)
    })
    it('ms birthday DATE', () => {
      const date = new Date(1978, 10, 16, 5, 5, 0)
      expect(jd(date)).toBe(2443828.7118055555)
    })
    it('ms birthday DATE + TOD', () => {
      const date = new Date(1978, 10, 16)
      expect(jd(date, 0.2118055555)).toBe(2443828.7118055555)
    })
    it('ms birthday YMD + TOD', () => {
      expect(jd(1978, 11, 16, 0.2118055555)).toBe(2443828.7118055555)
    })
    it('ms birthday YMD HMS', () => {
      expect(jd(1978, 11, 16, 5, 5, 0)).toBe(2443828.7118055555)
    })
  })

  describe('gregorian ranges validation', () => {
    it('julian date less than 2299160.5', () => {
      expect(() => gregorian(2299160.4)).toThrow('Julian date less than 2299160.5')
    })
    it('julian date more or equal than 2299160.5', () => {
      gregorian(2299160.5)
    })
    it('returned is a date, typeof object', () => {
      expect(typeof gregorian(2299160.5)).toBe('object')
    })
  })
  describe('gregorian', () => {
    it('beginning of gregorian calendar', () => {
      const test = gregorian(2299160.5) // 1582-10-15

      expect(test.year).toBe(1582)
      expect(test.month).toBe(10)
      expect(test.day).toBe(15)
      expect(test.hour).toBe(0)
      expect(test.minute).toBe(0)
      expect(test.second).toBe(0)
    })
    it('first sputnik', () => {
      const test = gregorian(2436116.31) // 1957-10-04 19:26:24

      expect(test.year).toBe(1957)
      expect(test.month).toBe(10)
      expect(test.day).toBe(4)
      expect(test.hour).toBe(19)
      expect(test.minute).toBe(26)
      expect(test.second).toBe(24)
    })
    it('first man on the moon', () => {
      const test = gregorian(2440423.35) // 1969-07-20 20:24:00

      expect(test.year).toBe(1969)
      expect(test.month).toBe(7)
      expect(test.day).toBe(20)
      expect(test.hour).toBe(20)
      expect(test.minute).toBe(24)
      expect(test.second).toBe(0)
    })
    it('my birthdate', () => {
      const test = gregorian(2443828.71180556) // 1978-11-16 05:05:00

      expect(test.year).toBe(1978)
      expect(test.month).toBe(11)
      expect(test.day).toBe(16)
      expect(test.hour).toBe(5)
      expect(test.minute).toBe(5)
      expect(test.second).toBe(0)
    })
  })

  describe('tod', () => {
    it('beginning of gregorian calendar', () => {
      const date = new Date(1582, 9, 15) // 1582-10-15
      expect(Number(tod(date))).toBe(0.5)
    })
    it('first sputnik', () => {
      const date = new Date(1957, 9, 4, 19, 26, 24) // 1957-10-04
      expect(Number(tod(date))).toBe(0.31)
    })
    it('first man on the moon', () => {
      const date = new Date(1969, 6, 20, 20, 24, 0) // 1969-07-20
      expect(Number(tod(date))).toBe(0.35)
    })
    it('my birthdate', () => {
      const date = new Date(1978, 10, 16, 5, 5, 0) // 1978-11-16
      expect(Number(tod(date))).toBe(0.7118055556)
    })
  })

  describe('date of Easter', () => {
    it('2018', () => {
      const test = dateOfEaster(2018)
      expect(test.month).toBe(4)
      expect(test.day).toBe(1)
    })
    it('2017', () => {
      const test = dateOfEaster(2017)
      expect(test.month).toBe(4)
      expect(test.day).toBe(16)
    })
    it('2016', () => {
      const test = dateOfEaster(2016)
      expect(test.month).toBe(3)
      expect(test.day).toBe(27)
    })
    it('2015', () => {
      const test = dateOfEaster(2015)
      expect(test.month).toBe(4)
      expect(test.day).toBe(5)
    })
    it('2014', () => {
      const test = dateOfEaster(2014)
      expect(test.month).toBe(4)
      expect(test.day).toBe(20)
    })
    it('2013', () => {
      const test = dateOfEaster(2013)
      expect(test.month).toBe(3)
      expect(test.day).toBe(31)
    })
    it('2012', () => {
      const test = dateOfEaster(2012)
      expect(test.month).toBe(4)
      expect(test.day).toBe(8)
    })
    it('2000', () => {
      const test = dateOfEaster(2000)
      expect(test.month).toBe(4)
      expect(test.day).toBe(23)
    })
    it('1900', () => {
      const test = dateOfEaster(1900)
      expect(test.month).toBe(4)
      expect(test.day).toBe(15)
    })
    it('1582', () => {
      expect(() => dateOfEaster(1582)).toThrow('Year must be higher than 1582')
    })
  })

  describe('day of the week', () => {
    it('2018-02-01', () => {
      expect(dayOfTheWeek(jd(2018, 2, 1))).toBe(4) // thu
    })
    it('2018-01-31', () => {
      expect(dayOfTheWeek(jd(2018, 1, 31))).toBe(3) // wed
    })
    it('2018-01-30', () => {
      expect(dayOfTheWeek(jd(2018, 1, 30))).toBe(2) // tue
    })
    it('2018-01-29', () => {
      expect(dayOfTheWeek(jd(2018, 1, 29))).toBe(1) // mon
    })
    it('2018-01-28', () => {
      expect(dayOfTheWeek(jd(2018, 1, 28))).toBe(0) // sun
    })
    it('2018-01-27', () => {
      expect(dayOfTheWeek(jd(2018, 1, 27))).toBe(6) // sat
    })
    it('2018-01-26', () => {
      expect(dayOfTheWeek(jd(2018, 1, 26))).toBe(5) // fri
    })
  })

  describe('jdcDay day from julian date', () => {
    it('beginning of gregorian calendar', () => {
      expect(Number(jdcDay(2299160.5))).toBe(15) // 1582-10-15
    })
    it('first sputnik', () => {
      expect(Number(jdcDay(2436116.31))).toBe(4.8100000000558794) // 1957-10-04
    })
    it('first man on the moon', () => {
      expect(Number(jdcDay(2440423.35))).toBe(20.8500000000931323) // 1969-07-20
    })
    it('my birthdate', () => {
      expect(Number(jdcDay(2443828.71180556))).toBe(16.2118055601604283) // 1978-11-16
    })
  })
  describe('jdcMonth month from julian date', () => {
    it('beginning of gregorian calendar', () => {
      expect(jdcMonth(2299160.5)).toBe(10) // 1582-10-15
    })
    it('first sputnik', () => {
      expect(jdcMonth(2436116.31)).toBe(10) // 1957-10-04
    })
    it('first man on the moon', () => {
      expect(jdcMonth(2440423.35)).toBe(7) // 1969-07-20
    })
    it('my birthdate', () => {
      expect(jdcMonth(2443828.71180556)).toBe(11) // 1978-11-16
    })
  })
  describe('jdcYear year from julian date', () => {
    it('beginning of gregorian calendar', () => {
      expect(jdcYear(2299160.5)).toBe(1582) // 1582-10-15
    })
    it('first sputnik', () => {
      expect(jdcYear(2436116.31)).toBe(1957) // 1957-10-04
    })
    it('first man on the moon', () => {
      expect(jdcYear(2440423.35)).toBe(1969) // 1969-07-20
    })
    it('my birthdate', () => {
      expect(jdcYear(2443828.71180556)).toBe(1978) // 1978-11-16
    })
  })

  describe('daysInMonth', () => {
    it('2018-01', () => {
      expect(daysInMonth(2018, 1)).toBe(31)
    })
    it('2018-02', () => {
      expect(daysInMonth(2018, 2)).toBe(28)
    })
    it('2018-03', () => {
      expect(daysInMonth(2018, 3)).toBe(31)
    })
    it('2018-04', () => {
      expect(daysInMonth(2018, 4)).toBe(30)
    })
    it('2018-05', () => {
      expect(daysInMonth(2018, 5)).toBe(31)
    })
    it('2018-06', () => {
      expect(daysInMonth(2018, 6)).toBe(30)
    })
    it('2018-07', () => {
      expect(daysInMonth(2018, 7)).toBe(31)
    })
    it('2018-08', () => {
      expect(daysInMonth(2018, 8)).toBe(31)
    })
    it('2018-09', () => {
      expect(daysInMonth(2018, 9)).toBe(30)
    })
    it('2018-10', () => {
      expect(daysInMonth(2018, 10)).toBe(31)
    })
    it('2018-11', () => {
      expect(daysInMonth(2018, 11)).toBe(30)
    })
    it('2018-12', () => {
      expect(daysInMonth(2018, 12)).toBe(31)
    })
    it('2016-02', () => {
      expect(daysInMonth(2016, 2)).toBe(29)
    })
    it('2000-02', () => {
      expect(daysInMonth(2000, 2)).toBe(29)
    })
    it('1900-02', () => {
      expect(daysInMonth(1900, 2)).toBe(28)
    })
  })
  describe('isLapYear', () => {
    it('2018', () => {
      expect(isLapYear(2018)).toBe(false)
    })
    it('2017', () => {
      expect(isLapYear(2017)).toBe(false)
    })
    it('2016', () => {
      expect(isLapYear(2016)).toBe(true)
    })
    it('2015', () => {
      expect(isLapYear(2015)).toBe(false)
    })
    it('2014', () => {
      expect(isLapYear(2014)).toBe(false)
    })
    it('2013', () => {
      expect(isLapYear(2013)).toBe(false)
    })
    it('2012', () => {
      expect(isLapYear(2012)).toBe(true)
    })
    it('2000', () => {
      expect(isLapYear(2000)).toBe(true)
    })
    it('1900', () => {
      expect(isLapYear(1900)).toBe(false)
    })
  })

  describe('hour, minute, second to decimal hours', () => {
    it('05:05:00', () => {
      expect(hMS2DecimalHours(5, 5, 0)).toBe(5.083333333333333)
    })
    it('18:31:27', () => {
      expect(hMS2DecimalHours(18, 31, 27)).toBe(18.524166666666666)
    })
    it('18:31:27.01', () => {
      expect(hMS2DecimalHours(18, 31, 27.01)).toBe(18.524169444444446)
    })
    it('12:00:00', () => {
      expect(hMS2DecimalHours(12, 0, 0)).toBe(12)
    })
    it('23:59:59.123', () => {
      expect(hMS2DecimalHours(23, 59, 59.123)).toBe(23.99975638888889)
    })
  })
  describe('decimal hours to hour, minute, seconds', () => {
    it('05:05:00', () => {
      const test = decimalHours2HMS(5.083333333333333)
      expect(test.h).toBe(5)
      expect(test.m).toBe(5)
      expect(test.s).toBe(0)
    })
    it('18:31:27', () => {
      const test = decimalHours2HMS(18.524166666666666)
      expect(test.h).toBe(18)
      expect(test.m).toBe(31)
      expect(test.s).toBe(27)
    })
    it('18:31:27.01', () => {
      const test = decimalHours2HMS(18.524169444444446)
      expect(test.h).toBe(18)
      expect(test.m).toBe(31)
      expect(test.s).toBe(27.01)
    })
    it('12:00:00', () => {
      const test = decimalHours2HMS(12)
      expect(test.h).toBe(12)
      expect(test.m).toBe(0)
      expect(test.s).toBe(0)
    })
    it('23:59:59.123', () => {
      const test = decimalHours2HMS(23.99975638888889)
      expect(test.h).toBe(23)
      expect(test.m).toBe(59)
      expect(test.s).toBe(59.123)
    })
  })
  describe('local civil time to universal time', () => {
    it('2013-07-01 03:37:00 daylightSaving +4', () => {
      const local = new CalendarDateTime(2013, 7, 1, 3, 37, 0)
      local.daylightSaving = 1
      local.zoneCorrection = 4
      const ut = localCivilTime2universalTime(local)

      expect(ut.year).toBe(2013)
      expect(ut.month).toBe(6)
      expect(ut.day).toBe(30)
      expect(ut.hour).toBe(22)
      expect(ut.minute).toBe(37)
      expect(ut.second).toBe(0)
    })
    it('2018-02-15 18:25:30 +1', () => {
      const local = new CalendarDateTime(2018, 2, 15, 18, 25, 30)
      local.daylightSaving = 0
      local.zoneCorrection = 1
      const ut = localCivilTime2universalTime(local)

      expect(ut.year).toBe(2018)
      expect(ut.month).toBe(2)
      expect(ut.day).toBe(15)
      expect(ut.hour).toBe(17)
      expect(ut.minute).toBe(25)
      expect(ut.second).toBe(30)
    })
    it('2018-02-15 18:25:30 daylightSaving +1', () => {
      const local = new CalendarDateTime(2018, 2, 15, 18, 25, 30)
      local.daylightSaving = 1
      local.zoneCorrection = 1
      const ut = localCivilTime2universalTime(local)

      expect(ut.year).toBe(2018)
      expect(ut.month).toBe(2)
      expect(ut.day).toBe(15)
      expect(ut.hour).toBe(16)
      expect(ut.minute).toBe(25)
      expect(ut.second).toBe(30)
    })
    it('1957-10-04 19:26:24', () => {
      const local = new CalendarDateTime(1957, 10, 4, 19, 26, 24)
      local.daylightSaving = 0
      local.zoneCorrection = -7
      const ut = localCivilTime2universalTime(local)

      expect(ut.year).toBe(1957)
      expect(ut.month).toBe(10)
      expect(ut.day).toBe(5)
      expect(ut.hour).toBe(2)
      expect(ut.minute).toBe(26)
      expect(ut.second).toBe(24)
    })
    it('1969-07-20 20:24:00', () => {
      const local = new CalendarDateTime(1969, 7, 20, 20, 24, 0)
      local.daylightSaving = 1
      local.zoneCorrection = 6
      const ut = localCivilTime2universalTime(local)

      expect(ut.year).toBe(1969)
      expect(ut.month).toBe(7)
      expect(ut.day).toBe(20)
      expect(ut.hour).toBe(13)
      expect(ut.minute).toBe(24)
      expect(ut.second).toBe(0)
    })
    it('1999-12-31 23:59:59 daylightSaving -1 ', () => {
      const local = new CalendarDateTime(1999, 12, 31, 23, 59, 59)
      local.daylightSaving = 1
      local.zoneCorrection = -1
      const ut = localCivilTime2universalTime(local)

      expect(ut.year).toBe(1999)
      expect(ut.month).toBe(12)
      expect(ut.day).toBe(31)
      expect(ut.hour).toBe(23)
      expect(ut.minute).toBe(59)
      expect(ut.second).toBe(59)
    })
    it('1999-12-31 23:59:59 -1 ', () => {
      const local = new CalendarDateTime(1999, 12, 31, 23, 59, 59)
      local.daylightSaving = 0
      local.zoneCorrection = -1
      const ut = localCivilTime2universalTime(local)

      expect(ut.year).toBe(2000)
      expect(ut.month).toBe(1)
      expect(ut.day).toBe(1)
      expect(ut.hour).toBe(0)
      expect(ut.minute).toBe(59)
      expect(ut.second).toBe(59)
    })
    it('2012-01-01 01:23:45 daylightSaving +1', () => {
      const local = new CalendarDateTime(2012, 1, 1, 1, 23, 45)
      local.daylightSaving = 1
      local.zoneCorrection = 1
      const ut = localCivilTime2universalTime(local)

      expect(ut.year).toBe(2011)
      expect(ut.month).toBe(12)
      expect(ut.day).toBe(31)
      expect(ut.hour).toBe(23)
      expect(ut.minute).toBe(23)
      expect(ut.second).toBe(45)
    })
    it('2012-01-01 01:23:45 daylightSaving -1', () => {
      const local = new CalendarDateTime(2012, 1, 1, 1, 23, 45)
      local.daylightSaving = 1
      local.zoneCorrection = -1
      const ut = localCivilTime2universalTime(local)

      expect(ut.year).toBe(2012)
      expect(ut.month).toBe(1)
      expect(ut.day).toBe(1)
      expect(ut.hour).toBe(1)
      expect(ut.minute).toBe(23)
      expect(ut.second).toBe(45)
    })
  })
  describe('universal time to local civil time', () => {
    it('2013-06-30 22:37:00 daylightSaving +4', () => {
      const ut = new CalendarDateTime(2013, 6, 30, 22, 37, 0)
      const local = universalTime2LocalCivilTime(ut, 1, 4)

      expect(local.year).toBe(2013)
      expect(local.month).toBe(7)
      expect(local.day).toBe(1)
      expect(local.hour).toBe(3)
      expect(local.minute).toBe(37)
      expect(local.second).toBe(0)
    })
    it('2018-02-15 16:25:30 +1', () => {
      const ut = new CalendarDateTime(2018, 2, 15, 16, 25, 30)
      const local = universalTime2LocalCivilTime(ut, 0, 1)

      expect(local.year).toBe(2018)
      expect(local.month).toBe(2)
      expect(local.day).toBe(15)
      expect(local.hour).toBe(17)
      expect(local.minute).toBe(25)
      expect(local.second).toBe(30)
    })
    it('1957-10-05 02:26:24 -7', () => {
      const ut = new CalendarDateTime(1957, 10, 5, 2, 26, 24)
      const local = universalTime2LocalCivilTime(ut, 0, -7)

      expect(local.year).toBe(1957)
      expect(local.month).toBe(10)
      expect(local.day).toBe(4)
      expect(local.hour).toBe(19)
      expect(local.minute).toBe(26)
      expect(local.second).toBe(24)
    })
    it('1969-07-20 13:24:00 daylightSaving +6', () => {
      const ut = new CalendarDateTime(1969, 7, 20, 13, 24, 0)
      const local = universalTime2LocalCivilTime(ut, 1, 6)

      expect(local.year).toBe(1969)
      expect(local.month).toBe(7)
      expect(local.day).toBe(20)
      expect(local.hour).toBe(20)
      expect(local.minute).toBe(24)
      expect(local.second).toBe(0)
    })
    it('1999-12-31 23:59:59 daylightSavingTime, -1', () => {
      const ut = new CalendarDateTime(1999, 12, 31, 23, 59, 59)
      const local = universalTime2LocalCivilTime(ut, 1, -1)

      expect(local.year).toBe(1999)
      expect(local.month).toBe(12)
      expect(local.day).toBe(31)
      expect(local.hour).toBe(23)
      expect(local.minute).toBe(59)
      expect(local.second).toBe(59)
    })
    it('2000-01-01 00:59:59 -1', () => {
      const ut = new CalendarDateTime(2000, 1, 1, 0, 59, 59)
      const local = universalTime2LocalCivilTime(ut, 0, -1)

      expect(local.year).toBe(1999)
      expect(local.month).toBe(12)
      expect(local.day).toBe(31)
      expect(local.hour).toBe(23)
      expect(local.minute).toBe(59)
      expect(local.second).toBe(59)
    })
    it('2011-12-31 23:23:45 daylightSaving +1', () => {
      const ut = new CalendarDateTime(2011, 12, 31, 23, 23, 45)
      const local = universalTime2LocalCivilTime(ut, 1, 1)

      expect(local.year).toBe(2012)
      expect(local.month).toBe(1)
      expect(local.day).toBe(1)
      expect(local.hour).toBe(1)
      expect(local.minute).toBe(23)
      expect(local.second).toBe(45)
    })
    it('2012-01-01 01:23:45 daylightSaving -1', () => {
      const ut = new CalendarDateTime(2012, 1, 1, 1, 23, 45)
      const local = universalTime2LocalCivilTime(ut, 1, -1)

      expect(local.year).toBe(2012)
      expect(local.month).toBe(1)
      expect(local.day).toBe(1)
      expect(local.hour).toBe(1)
      expect(local.minute).toBe(23)
      expect(local.second).toBe(45)
    })
  })
  describe('universal time to greenwich sidereal time', () => {
    it('1980-04-22 14:36:51.67', () => {
      const ut = new CalendarDateTime(1980, 4, 22, 14, 36, 51.67)
      const st = universalTime2GreenwichSiderealTime(ut)

      expect(st.h).toBe(4)
      expect(st.m).toBe(40)
      expect(st.s).toBe(5.23)
    })
    it('2018-02-22 18:07:25.12', () => {
      const ut = new CalendarDateTime(2018, 2, 22, 18, 7, 25.12)
      const st = universalTime2GreenwichSiderealTime(ut)

      expect(st.h).toBe(4)
      expect(st.m).toBe(17)
      expect(st.s).toBe(48.45)
    })
    it('1978-11-16 05:05:00', () => {
      const ut = new CalendarDateTime(1978, 11, 16, 5, 5, 0)
      const st = universalTime2GreenwichSiderealTime(ut)

      expect(st.h).toBe(8)
      expect(st.m).toBe(44)
      expect(st.s).toBe(41.16)
    })
    it('1978-11-16 05:05:00.01', () => {
      const ut = new CalendarDateTime(1978, 11, 16, 5, 5, 0.01)
      const st = universalTime2GreenwichSiderealTime(ut)

      expect(st.h).toBe(8)
      expect(st.m).toBe(44)
      expect(st.s).toBe(41.17)
    })
  })
  describe('greenwich sidereal time to universal time', () => {
    it('1980-04-22 04:40:05.23', () => {
      const gst = new CalendarDateTime(1980, 4, 22, 4, 40, 5.23)
      const ut = greenwichSiderealTime2UniversalTime(gst)

      expect(ut.h).toBe(14)
      expect(ut.m).toBe(36)
      expect(ut.s).toBe(51.67)
      expect(ut.warning).toBe(false)
    })
    it('2018-02-22 04:17:48.45', () => {
      const gst = new CalendarDateTime(2018, 2, 22, 4, 17, 48.45)
      const ut = greenwichSiderealTime2UniversalTime(gst)

      expect(ut.h).toBe(18)
      expect(ut.m).toBe(7)
      expect(ut.s).toBe(25.12)
      expect(ut.warning).toBe(false)
    })
    it('1978-11-16 08:44:41.16', () => {
      const gst = new CalendarDateTime(1978, 11, 16, 8, 44, 41.16)
      const ut = greenwichSiderealTime2UniversalTime(gst)

      expect(ut.h).toBe(5)
      expect(ut.m).toBe(5)
      expect(ut.s).toBe(0)
      expect(ut.warning).toBe(false)
    })
    it('1978-11-16 08:44:41.17', () => {
      const gst = new CalendarDateTime(1978, 11, 16, 8, 44, 41.17)
      const ut = greenwichSiderealTime2UniversalTime(gst)

      expect(ut.h).toBe(5)
      expect(ut.m).toBe(5)
      expect(ut.s).toBe(0.01)
      expect(ut.warning).toBe(false)
    })
    it('2015-04-22 14:01:05.23', () => {
      const gst = new CalendarDateTime(2015, 4, 22, 14, 1, 5.23)
      const ut = greenwichSiderealTime2UniversalTime(gst)

      expect(ut.h).toBe(0)
      expect(ut.m).toBe(2)
      expect(ut.s).toBe(8.1)
      expect(ut.warning).toBe(true)
    })
  })
  describe('greenwich sidereal time to local sidereal time', () => {
    it('04:40:05.23 -64', () => {
      const gst = new CalendarTime(4, 40, 5.23)
      const test = greenwichSiderealTimeToLocalSiderealTime(gst, -64)

      expect(test.h).toBe(0)
      expect(test.m).toBe(24)
      expect(test.s).toBe(5.23)
    })
    it('04:40:05.23 21.017532', () => {
      const gst = new CalendarTime(4, 40, 5.23)
      const test = greenwichSiderealTimeToLocalSiderealTime(gst, 21.017532)

      expect(test.h).toBe(6)
      expect(test.m).toBe(4)
      expect(test.s).toBe(9.44)
    })
    it('12:00:00 21.017532', () => {
      const gst = new CalendarTime(12, 0, 0)
      const test = greenwichSiderealTimeToLocalSiderealTime(gst, 21.017532)

      expect(test.h).toBe(13)
      expect(test.m).toBe(24)
      expect(test.s).toBe(4.21)
    })
    it('22:33:44.55 66.778899', () => {
      const gst = new CalendarTime(22, 33, 44.55)
      const test = greenwichSiderealTimeToLocalSiderealTime(gst, 66.778899)

      expect(test.h).toBe(3)
      expect(test.m).toBe(0)
      expect(test.s).toBe(51.49)
    })
  })
  describe('local sidereal time to greenwich sidereal time', () => {
    it('00:24:05.23 -64', () => {
      const lst = new CalendarTime(0, 24, 5.23)
      const test = localSiderealTimeToGreenwichSiderealTime(lst, -64)

      expect(test.h).toBe(4)
      expect(test.m).toBe(40)
      expect(test.s).toBe(5.23)
    })
    it('06:04:09.44 21.017532', () => {
      const lst = new CalendarTime(6, 4, 9.44)
      const test = localSiderealTimeToGreenwichSiderealTime(lst, 21.017532)

      expect(test.h).toBe(4)
      expect(test.m).toBe(40)
      expect(test.s).toBe(5.23)
    })
    it('13:24:04.21 21.017532', () => {
      const lst = new CalendarTime(13, 24, 4.21)
      const test = localSiderealTimeToGreenwichSiderealTime(lst, 21.017532)

      expect(test.h).toBe(12)
      expect(test.m).toBe(0)
      expect(test.s).toBe(0)
    })
    it('03:00:51.49 66.778899', () => {
      const lst = new CalendarTime(3, 0, 51.49)
      const test = localSiderealTimeToGreenwichSiderealTime(lst, 66.778899)

      expect(test.h).toBe(22)
      expect(test.m).toBe(33)
      expect(test.s).toBe(44.55)
    })
  })
})
