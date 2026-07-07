/**
 * Calendar / Julian date / sidereal time calculations.
 * Ported from the archived js-v2 calendar service (the most complete implementation).
 * Type checks are handled by TypeScript; runtime validation covers value ranges only.
 */
import { CalendarDate, CalendarDateTime, CalendarTime, GreenwichSiderealTime, LocalSiderealTime, UniversalTime } from './astro.models'
import { abs, dHHour, dHMin, dHSec, floor, round, trunc } from './astroUtils.service'

const verifyMonth = (month: number): void => {
  if (month < 1 || month > 12) {
    throw new Error('Month must be between 1 and 12')
  }
}

const verifyDay = (day: number): void => {
  if (day < 0) {
    throw new Error('Day must be greater than 0')
  }
}

const verifyHour = (hour: number): void => {
  if (hour < 0 || hour > 23) {
    throw new Error('Hour must be between 0 and 23')
  }
}

const verifyMinute = (minute: number): void => {
  if (minute < 0 || minute > 59) {
    throw new Error('Minute must be between 0 and 59')
  }
}

const verifySecond = (second: number): void => {
  if (second < 0 || second > 59) {
    throw new Error('Second must be between 0 and 59')
  }
}

const verifyTimeOfDay = (tod: number): void => {
  if (tod >= 1) {
    throw new Error('Time of day cannot be greater than or equal to 1')
  }
}

const verifyMinDate = (year: number, month: number, day: number): void => {
  const minDate = new Date(1582, 10 - 1, 15)
  const date = new Date(year, month - 1, day)
  if (date < minDate) {
    throw new Error('Date less than 1582-10-15')
  }
}

const createJulianDate = (year: number, month: number, day: number, tod: number): number => {
  verifyMinDate(year, month, day)
  verifyTimeOfDay(tod)
  verifyMonth(month)
  verifyDay(day)

  const y = month === 1 || month === 2 ? year - 1 : year
  const m = month === 1 || month === 2 ? month + 12 : month
  const d = day

  const a = trunc(y / 100)
  const b = 2 - a + trunc(a / 4)

  return trunc(365.25 * y) + trunc(30.6001 * (m + 1)) + b + d + tod + 1720994.5
}

const createTod = (hour: number, minute: number, second: number): number => {
  return (hour * 3600 + minute * 60 + second) / 86400
}

const fromYMDHMS = (year: number, month: number, day: number, hour: number, minute: number, second: number): number => {
  verifyHour(hour)
  verifyMinute(minute)
  verifySecond(second)

  return createJulianDate(year, month, day, createTod(hour, minute, second))
}

const fromDate = (date: Date): number => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds() + date.getMilliseconds() / 1000

  return createJulianDate(year, month, day, createTod(hour, minute, second))
}

const fromDateAndTod = (date: Date, tod: number): number => {
  return createJulianDate(date.getFullYear(), date.getMonth() + 1, date.getDate(), tod)
}

type JulianDateFn = {
  (date: Date): number
  (date: Date, tod: number): number
  (year: number, month: number, day: number, tod?: number): number
  (year: number, month: number, day: number, hour: number, minute: number, second: number): number
}

/**
 * Julian date. Accepts (date) | (date, tod) | (year, month, day) | (year, month, day, tod) | (year, month, day, hour, minute, second)
 */
export const jd: JulianDateFn = (a: Date | number, b?: number, c?: number, d?: number, e?: number, f?: number): number => {
  if (a instanceof Date) {
    return b === undefined ? fromDate(a) : fromDateAndTod(a, b)
  }
  if (e !== undefined && f !== undefined) {
    return fromYMDHMS(a, b ?? 0, c ?? 0, d ?? 0, e, f)
  }
  return createJulianDate(a, b ?? 0, c ?? 0, d ?? 0)
}

/** Gregorian calendar date from a julian date */
export const gregorian = (julianDate: number): CalendarDateTime => {
  if (julianDate < 2299160.5) {
    throw new Error('Julian date less than 2299160.5')
  }

  const z = trunc(julianDate + 0.5)
  const a = trunc((z - 1867216.25) / 36524.25)
  const b = z + 1 + a - trunc(a / 4) + 1524
  const c = trunc((b - 122.1) / 365.25)
  const d = trunc(365.25 * c)
  const e = trunc((b - d) / 30.6001)
  const dd = julianDate + 0.5 - z

  const day = b - d - trunc(30.6001 * e)
  const month = e < 13.5 ? e - 1 : e - 13
  const year = month < 2.5 ? c - 4715 : c - 4716

  const tod = 86400 * dd
  const hour = trunc(tod / 3600)
  const minute = trunc((tod - hour * 3600) / 60)
  const second = tod - hour * 3600 - minute * 60

  const result = new CalendarDateTime(year, month, day, hour, minute, trunc(second))
  result.secondFull = second
  return result
}

/** Time of day (fraction) from a Date, offset to the julian day start (noon) */
export const tod = (date: Date): string => {
  const t = createTod(date.getHours(), date.getMinutes(), date.getSeconds()) + 0.5
  const result = t >= 1 ? t - 1 : t

  return result.toFixed(10)
}

export const dayOfTheYear = (date: Date): number => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()

  const n1 = trunc((275 * month) / 9)
  const n2 = trunc((month + 9) / 12)
  const n3 = 1 + trunc((year - 4 * trunc(year / 4) + 2) / 3)

  return n1 - n2 * n3 + day - 30
}

export const dateOfEaster = (year: number): CalendarDate => {
  if (year <= 1582) {
    throw new Error('Year must be higher than 1582')
  }

  const a = year % 19
  const b = trunc(year / 100)
  const c = year % 100
  const d = trunc(b / 4)
  const e = b % 4
  const f = trunc((b + 8) / 25)
  const g = trunc((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = trunc(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = trunc((a + 11 * h + 22 * l) / 451)
  const n = trunc((h + l - 7 * m + 114) / 31)
  const p = (h + l - 7 * m + 114) % 31

  return new CalendarDate(year, n, p + 1)
}

/** Day of the week from a julian date (0 = Sunday) */
export const dayOfTheWeek = (julianDate: number): number => {
  const jd = trunc(julianDate - 0.5) + 0.5
  return (jd + 1.5) % 7
}

export const isLapYear = (year: number): boolean => {
  return year % 4 === 0 && !(year % 100 === 0 && year % 400 !== 0)
}

export const daysInMonth = (year: number, month: number): number => {
  switch (month) {
    case 2: {
      return isLapYear(year) ? 29 : 28
    }
    case 4:
    case 6:
    case 9:
    case 11: {
      return 30
    }
    default:
      return 31
  }
}

export const hMS2DecimalHours = (h: number, m: number, s: number): number => {
  const a = abs(s) / 60
  const b = (abs(m) + a) / 60
  const c = abs(h) + b

  return h < 0 || m < 0 || s < 0 ? -c : c
}

export const decimalHours2HMS = (decimalHour: number): CalendarTime => {
  const a = abs(decimalHour) // unsigned decimal
  const b = a * 3600 // total seconds
  const c = round(b % 60, 3) // seconds to 3 decimal places
  const d = c === 60 ? 0 : c // corrected seconds
  const e = c === 60 ? b + 60 : b // corrected remainder
  const f = trunc(e / 60) % 60 // minutes
  const g = trunc(e / 3600) // unsigned hours
  const h = decimalHour < 0 ? g * -1 : g // signed hours

  return new CalendarTime(h, f, d)
}

// day from julian date
// deprecated: use gregorian()
export const jdcDay = (jd: number): string => {
  const i = floor(jd + 0.5)
  const f = jd + 0.5 - i
  const a = floor((i - 1867216.25) / 36524.25)
  const b = i > 2299160 ? i + 1 + a - floor(a / 4) : i
  const c = b + 1524
  const d = floor((c - 122.1) / 365.25)
  const e = floor(365.25 * d)
  const g = floor((c - e) / 30.6001)
  const result = c - e + f - floor(30.6001 * g)

  return Number(result).toFixed(16)
}

// month from julian date
// deprecated: use gregorian()
export const jdcMonth = (jd: number): number => {
  const i = floor(jd + 0.5)
  const a = floor((i - 1867216.25) / 36524.25)
  const b = i > 2299160 ? i + 1 + a - floor(a / 4) : i
  const c = b + 1524
  const d = floor((c - 122.1) / 365.25)
  const e = floor(365.25 * d)
  const g = floor((c - e) / 30.6001)

  return g < 13.5 ? g - 1 : g - 13
}

// year from julian date
// deprecated: use gregorian()
export const jdcYear = (jd: number): number => {
  const i = floor(jd + 0.5)
  const a = floor((i - 1867216.25) / 36524.25)
  const b = i > 2299160 ? i + 1 + a - floor(a / 4) : i
  const c = b + 1524
  const d = floor((c - 122.1) / 365.25)
  const e = floor(365.25 * d)
  const g = floor((c - e) / 30.6001)
  const h = g < 13.5 ? g - 1 : g - 13

  return h > 2.5 ? d - 4716 : d - 4715
}

export const gregorianDateToCalendarDateTime = (date: Date): CalendarDateTime => {
  return new CalendarDateTime(date.getFullYear(), date.getMonth() + 1, date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds())
}

export const localCivilTime2universalTime = (local: CalendarDateTime): CalendarDateTime => {
  const a = hMS2DecimalHours(local.hour, local.minute, local.second) // lct
  const b = a - local.daylightSaving - local.zoneCorrection // ut
  const c = local.day + b / 24 // g day
  const d = jd(local.year, local.month, c) // jd
  const gregorianDate = gregorian(d)
  const e = gregorianDate.day + c
  const h = 24 * (e - trunc(e)) // UT

  const result = new CalendarDateTime(gregorianDate.year, gregorianDate.month, gregorianDate.day, dHHour(h), dHMin(h), floor(dHSec(h)))
  result.dayFull = gregorianDate.day + c
  result.secondFull = Number(dHSec(h))
  result.ut = h

  return result
}

export const universalTime2LocalCivilTime = (ut: CalendarDateTime, daylightSaving: number, zoneCorrection: number): CalendarDateTime => {
  const a = hMS2DecimalHours(ut.hour, ut.minute, ut.second)
  const b = a + zoneCorrection
  const c = b + daylightSaving
  const d = jd(ut.year, ut.month, ut.day) + c / 24
  const gregorianDate = gregorian(d)
  const e = Number(jdcDay(d))
  const f = trunc(e)
  const i = 24 * (e - f)

  return new CalendarDateTime(gregorianDate.year, gregorianDate.month, f, dHHour(i), dHMin(i), dHSec(i))
}

export const universalTime2GreenwichSiderealTime = (ut: CalendarDateTime): GreenwichSiderealTime => {
  const { year, month, day, hour, minute } = ut
  const second = ut.secondFull || ut.second

  const a = jd(year, month, day) // jd
  const b = a - 2451545 // s
  const c = b / 36525 // T
  const d = 6.697374558 + 2400.051336 * c + 0.000025862 * c * c // T0
  const e = d - 24 * floor(d / 24) // T0
  const f = hMS2DecimalHours(hour, minute, second) // UT
  const g = f * 1.002737909 // A
  const h = e + g
  const i = h - 24 * floor(h / 24)

  return new GreenwichSiderealTime(dHHour(i), dHMin(i), dHSec(i), i)
}

export const greenwichSiderealTime2UniversalTime = (gst: CalendarDateTime): UniversalTime => {
  const { year, month, day, hour, minute } = gst
  const second = gst.secondFull || gst.second

  const a = jd(year, month, day) // jd
  const b = a - 2451545 // s
  const c = b / 36525
  const d = 6.697374558 + 2400.051336 * c + 0.000025862 * c * c // T0
  const e = d - 24 * floor(d / 24) // T0
  const f = hMS2DecimalHours(hour, minute, second) // gst (hours)
  const g = f - e
  const h = g - 24 * floor(g / 24)
  const i = h * 0.9972695663

  const warning = i < 0.065574

  return new UniversalTime(dHHour(i), dHMin(i), dHSec(i), warning)
}

export const greenwichSiderealTimeToLocalSiderealTime = (gst: CalendarTime, longitude: number): LocalSiderealTime => {
  const a = hMS2DecimalHours(gst.h, gst.m, gst.s) // gst decimal
  const b = longitude / 15 // offset
  const c = a + b
  const d = c - 24 * floor(c / 24)

  return new LocalSiderealTime(dHHour(d), dHMin(d), dHSec(d), d)
}

export const localSiderealTimeToGreenwichSiderealTime = (lst: CalendarTime, longitude: number): CalendarTime => {
  const a = hMS2DecimalHours(lst.h, lst.m, lst.s)
  const b = longitude / 15
  const c = a - b
  const d = c - 24 * floor(c / 24)

  return new CalendarTime(dHHour(d), dHMin(d), dHSec(d))
}

export const astroCalendarService = {
  dateOfEaster,
  dayOfTheWeek,
  dayOfTheYear,
  daysInMonth,
  decimalHours2HMS,
  greenwichSiderealTime2UniversalTime,
  greenwichSiderealTimeToLocalSiderealTime,
  gregorian,
  gregorianDateToCalendarDateTime,
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
}
