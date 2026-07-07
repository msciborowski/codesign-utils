/**
 * Calendar / Julian date / sidereal time calculations.
 * Ported from the archived js-v2 calendar service (the most complete implementation),
 * with runtime validation behaviour preserved.
 */
import { CalendarDate, CalendarDateTime, CalendarTime } from './astro.models'
import { abs, dHHour, dHMin, dHSec, floor, round, trunc } from './astroUtils.service'

const verifyYear = (year: unknown): void => {
  if (typeof year !== 'number') {
    throw new Error('Year should be a number')
  }
}

const verifyMonth = (month: unknown): void => {
  if (typeof month !== 'number') {
    throw new Error('Month should be a number')
  }
  if (month < 1 || month > 12) {
    throw new Error('Month must be between 1 and 12')
  }
}

const verifyDay = (day: unknown): void => {
  if (typeof day !== 'number') {
    throw new Error('Day should be a number')
  }
  if (day < 0) {
    throw new Error('Day must be greater than 0')
  }
}

const verifyHour = (hour: unknown): void => {
  if (typeof hour !== 'number') {
    throw new Error('Hour should be a number')
  }
  if (hour < 0 || hour > 23) {
    throw new Error('Hour must be between 0 and 23')
  }
}

const verifyMinute = (minute: unknown): void => {
  if (typeof minute !== 'number') {
    throw new Error('Minute should be a number')
  }
  if (minute < 0 || minute > 59) {
    throw new Error('Minute must be between 0 and 59')
  }
}

const verifySecond = (second: unknown): void => {
  if (typeof second !== 'number') {
    throw new Error('Second should be a number')
  }
  if (second < 0 || second > 59) {
    throw new Error('Second must be between 0 and 59')
  }
}

const verifyTimeOfDay = (tod: unknown): void => {
  if (tod && typeof tod !== 'number') {
    throw new Error('Time of day should be a number')
  }
  if (tod && typeof tod === 'number' && tod >= 1) {
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

const verifyDate: (date: unknown) => asserts date is Date = date => {
  if (!date || typeof date !== 'object') {
    throw new Error('Invalid date')
  }
  if (typeof (date as Date).getDate !== 'function') {
    throw new Error('Invalid date')
  }
}

const createJulianDate = (year: number, month: number, day: number, tod?: number): number => {
  verifyMinDate(year, month, day)
  verifyTimeOfDay(tod)
  verifyYear(year)
  verifyMonth(month)
  verifyDay(day)

  const y = month === 1 || month === 2 ? year - 1 : year
  const m = month === 1 || month === 2 ? month + 12 : month
  const d = day

  const a = trunc(y / 100)
  const b = 2 - a + trunc(a / 4)
  const jd = trunc(365.25 * y) + trunc(30.6001 * (m + 1)) + b + d + (tod || 0) + 1720994.5

  return jd
}

const createTod = (hour: number, minute: number, second: number): number => {
  return (hour * 3600 + minute * 60 + second) / 86400
}

const fromYMDAndTod = (year: unknown, month: unknown, day: unknown, tod: unknown): number => {
  verifyYear(year)
  verifyMonth(month)
  verifyDay(day)
  verifyTimeOfDay(tod)

  return createJulianDate(year as number, month as number, day as number, tod as number)
}

const fromYMDHMS = (year: unknown, month: unknown, day: unknown, hour: unknown, minute: unknown, second: unknown): number => {
  verifyYear(year)
  verifyMonth(month)
  verifyDay(day)
  verifyHour(hour)
  verifyMinute(minute)
  verifySecond(second)

  const tod = createTod(hour as number, minute as number, second as number)
  return createJulianDate(year as number, month as number, day as number, tod)
}

const fromDateAndTod = (date: unknown, tod: unknown): number => {
  verifyDate(date)
  verifyTimeOfDay(tod)
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()

  return createJulianDate(year, month, day, tod as number)
}

const fromDate = (date: unknown): number => {
  verifyDate(date)
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds() + date.getMilliseconds() / 1000

  const tod = createTod(hour, minute, second)

  return createJulianDate(year, month, day, tod)
}

const createDate = (jd: unknown): CalendarDateTime => {
  if (typeof jd !== 'number') {
    throw new Error('Invalid number')
  }
  if (jd < 2299160.5) {
    throw new Error('Julian date less than 2299160.5')
  }

  const z = trunc(jd + 0.5)
  const a = trunc((z - 1867216.25) / 36524.25)
  const b = z + 1 + a - trunc(a / 4) + 1524
  const c = trunc((b - 122.1) / 365.25)
  const d = trunc(365.25 * c)
  const e = trunc((b - d) / 30.6001)
  const dd = jd + 0.5 - z

  const day = b - d - trunc(30.6001 * e)
  const month = e < 13.5 ? e - 1 : e - 13
  const year = month < 2.5 ? c - 4715 : c - 4716

  const tod = 86400 * dd
  const hour = trunc(tod / 3600)
  const minute = trunc((tod - hour * 3600) / 60)
  const second = tod - hour * 3600 - minute * 60

  const result = new CalendarDateTime()
  result.year = year
  result.month = month
  result.day = day
  result.hour = hour
  result.minute = minute
  result.second = trunc(second)
  result.secondFull = second
  return result
}

/**
 * Julian date. Accepts (date) | (date, tod) | (year, month, day) | (year, month, day, tod) | (year, month, day, hour, minute, second)
 */
export function jd(...args: unknown[]): number {
  // TODO: check for null values
  switch (args.length) {
    case 1:
      // date
      return fromDate(args[0])
    case 2:
      // date, tod
      return fromDateAndTod(args[0], args[1])
    case 3:
      // year, month, day
      return fromYMDAndTod(args[0], args[1], args[2], 0)
    case 4:
      // year, month, day, tod
      return fromYMDAndTod(args[0], args[1], args[2], args[3])
    case 6:
      // year, month, day, hour, minute, second
      return fromYMDHMS(args[0], args[1], args[2], args[3], args[4], args[5])
    default:
      throw new Error('Arguments error')
  }
}

/** Gregorian calendar date from a julian date */
export function gregorian(...args: unknown[]): CalendarDateTime {
  switch (args.length) {
    case 1:
      return createDate(args[0])
    default:
      throw new Error('Arguments error')
  }
}

/** Time of day (fraction) from a Date, offset to the julian day start (noon) */
export function tod(...args: unknown[]): string {
  if (args.length !== 1) {
    throw new Error('Arguments error')
  }
  const date = args[0]
  verifyDate(date)

  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  const tod = createTod(hour, minute, second) + 0.5
  const result = tod >= 1 ? tod - 1 : tod

  return result.toFixed(10)
}

export function dayOfTheYear(...args: unknown[]): number {
  if (args.length !== 1) {
    throw new Error('Arguments error')
  }
  const date = args[0]
  verifyDate(date)

  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()

  const n1 = trunc((275 * month) / 9)
  const n2 = trunc((month + 9) / 12)
  const n3 = 1 + trunc((year - 4 * trunc(year / 4) + 2) / 3)

  const n = n1 - n2 * n3 + day - 30
  return n
}

export function dateOfEaster(year: number): CalendarDate {
  // TODO: verify year type, value
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

  const month = n
  const day = p + 1

  return new CalendarDate(year, month, day)
}

/** Day of the week from a julian date (0 = Sunday) */
export function dayOfTheWeek(julianDate: number): number {
  const jd = trunc(julianDate - 0.5) + 0.5
  const n = (jd + 1.5) % 7
  return n
}

export function isLapYear(year: number): boolean {
  return year % 4 === 0 && !(year % 100 === 0 && year % 400 !== 0)
}

export function daysInMonth(year: number, month: number): number {
  // TODO checkMonthInGregorianCalendar
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

const hoursMinutesSeconds2DecimalHours = (h: number, m: number, s: number): number => {
  const a = abs(s) / 60
  const b = (abs(m) + a) / 60
  const c = abs(h) + b
  const d = h < 0 || m < 0 || s < 0 ? -c : c

  return d
}

export function hMS2DecimalHours(h: number, m: number, s: number): number {
  // TODO: handle CalendarTime
  return hoursMinutesSeconds2DecimalHours(h, m, s)
}

export function decimalHours2HMS(decimalHour: number): CalendarTime {
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
export function jdcDay(jd: number): string {
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
export function jdcMonth(jd: number): number {
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
export function jdcYear(jd: number): number {
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

export function gregorianDateToCalendarDateTime(date: Date): CalendarDateTime {
  verifyDate(date)

  const result = new CalendarDateTime()
  result.year = date.getFullYear()
  result.month = date.getMonth() + 1
  result.day = date.getDate()
  result.hour = date.getHours()
  result.minute = date.getMinutes()
  result.second = date.getSeconds()

  return result
}

export function localCivilTime2universalTime(local: CalendarDateTime): CalendarDateTime {
  // TODO: validate localCalendarDateTime
  // TODO: if daylight saving > 1 throw
  const a = hMS2DecimalHours(local.hour as number, local.minute as number, local.second as number) // lct
  const b = a - (local.daylightSaving as number) - (local.zoneCorrection as number) // ut
  const c = (local.day as number) + b / 24 // g day
  const d = jd(local.year, local.month, c) // jd
  const gregorianDate = gregorian(d)
  const e = (gregorianDate.day as number) + c
  const h = 24 * (e - trunc(e)) // UT

  const hour = dHHour(h)
  const minute = dHMin(h)
  const second = floor(dHSec(h))

  const result = new CalendarDateTime(gregorianDate.year, gregorianDate.month, gregorianDate.day, hour, minute, second)
  result.dayFull = (gregorianDate.day as number) + c
  result.secondFull = Number(dHSec(h))
  result.ut = h

  return result
}

export function universalTime2LocalCivilTime(...args: unknown[]): CalendarDateTime {
  if (args.length !== 3) {
    throw new Error('Three arguments must be provided')
  }
  // TODO: validate ut
  // TODO: validate daylightSaving
  // TODO: validate zone correction
  const [ut, daylightSaving, zoneCorrection] = args as [CalendarDateTime, number, number]

  const a = hMS2DecimalHours(ut.hour as number, ut.minute as number, ut.second as number)
  const b = a + zoneCorrection
  const c = b + daylightSaving
  const d = jd(ut.year, ut.month, ut.day) + c / 24
  const gregorianDate = gregorian(d)
  const e = Number(jdcDay(d))
  const f = trunc(e)
  const g = gregorianDate.month
  const h = gregorianDate.year
  const i = 24 * (e - f)

  const result = new CalendarDateTime()
  result.year = h
  result.month = g
  result.day = f
  result.hour = dHHour(i)
  result.minute = dHMin(i)
  result.second = dHSec(i)

  return result
}

export function universalTime2GreenwichSiderealTime(ut: CalendarDateTime): CalendarTime {
  const { year, month, day, hour, minute } = ut
  const second = ut.secondFull || ut.second

  const a = jd(year, month, day) // jd
  const b = a - 2451545 // s
  const c = b / 36525 // T
  const d = 6.697374558 + 2400.051336 * c + 0.000025862 * c * c // T0
  const e = d - 24 * floor(d / 24) // T0
  const f = hMS2DecimalHours(hour as number, minute as number, second as number) // UT
  const g = f * 1.002737909 // A
  const h = e + g
  const i = h - 24 * floor(h / 24)

  const result = new CalendarTime(dHHour(i), dHMin(i), dHSec(i))
  result.gst = i // for rightAscensionToHourAngle
  return result
}

export function greenwichSiderealTime2UniversalTime(gst: CalendarDateTime): CalendarTime {
  const { year, month, day, hour, minute } = gst
  const second = gst.secondFull || gst.second // TODO: check it

  const a = jd(year, month, day) // jd
  const b = a - 2451545 // s
  const c = b / 36525
  const d = 6.697374558 + 2400.051336 * c + 0.000025862 * c * c // T0
  const e = d - 24 * floor(d / 24) // T0
  const f = hMS2DecimalHours(hour as number, minute as number, second as number) // gst (hours)
  const g = f - e
  const h = g - 24 * floor(g / 24)
  const i = h * 0.9972695663

  const warning = i < 0.065574

  const result = new CalendarTime(dHHour(i), dHMin(i), dHSec(i))
  result.warning = warning

  return result
}

export function greenwichSiderealTimeToLocalSiderealTime(gst: CalendarTime, longitude: number): CalendarTime {
  const { h, m, s } = gst

  const a = hMS2DecimalHours(h as number, m as number, s as number) // gst decimal
  const b = longitude / 15 // offset
  const c = a + b
  const d = c - 24 * floor(c / 24)

  const result = new CalendarTime(dHHour(d), dHMin(d), dHSec(d))
  result.lst = d

  return result
}

export function localSiderealTimeToGreenwichSiderealTime(lst: CalendarTime, longitude: number): CalendarTime {
  const { h, m, s } = lst

  const a = hMS2DecimalHours(h as number, m as number, s as number)
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
