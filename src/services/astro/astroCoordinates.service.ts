/**
 * Equatorial coordinate helpers: DMS <-> decimal degrees, right ascension <-> hour angle.
 * Ported from the archived js-v2 coordinates service (never previously converted to TypeScript).
 */
import { CalendarDate, CalendarDateTime, CalendarTime, Coordinates } from './astro.models'
import {
  greenwichSiderealTimeToLocalSiderealTime,
  hMS2DecimalHours,
  jd,
  jdcDay,
  jdcMonth,
  jdcYear,
  universalTime2GreenwichSiderealTime,
} from './astroCalendar.service'
import { abs, dHHour, dHMin, dHSec, floor, round, trunc } from './astroUtils.service'

export function dMSToDecimalDegrees(coordinates: Coordinates): number {
  // TODO: verify d, m, s
  // m, s should be positive
  const { deg, min, sec } = coordinates

  const a = abs(sec / 60)
  const b = (abs(min) + a) / 60
  const c = abs(deg) + b

  return deg < 0 ? c * -1 : c
}

export function decimalDegreesToDMS(decimal: number): Coordinates {
  const a = abs(decimal) // unsigned decimal
  const b = a * 3600 // total seconds
  const c = round(b % 60, 8) // seconds 8 decimal places
  const d = c === 60 ? 0 : Number(c) // corrected seconds
  const e = c === 60 ? b + 60 : b // corrected remainder
  const f = trunc(e / 60) % 60 // minutes
  const g = trunc(e / 3600) // unsigned degrees
  // note: the original implementation also computed signed degrees but returned the unsigned value

  return new Coordinates(g, f, d)
}

const lctut = (lct: CalendarTime, daylightSaving: number, zoneCorrection: number, localDay: CalendarDate): number => {
  const a = hMS2DecimalHours(lct.h as number, lct.m as number, lct.s as number)
  const b = a - daylightSaving - zoneCorrection
  const c = localDay.day + b / 24
  const d = jd(localDay.year, localDay.month, c)
  const e = Number(jdcDay(d))
  const e1 = floor(e)

  return 24 * (e - e1)
}

const lctGDay = (lct: CalendarTime, daylightSaving: number, zoneCorrection: number, localDay: CalendarDate): number => {
  const a = hMS2DecimalHours(lct.h as number, lct.m as number, lct.s as number)
  const b = a - daylightSaving - zoneCorrection
  const c = localDay.day + b / 24
  const d = jd(localDay.year, localDay.month, c)
  const e = Number(jdcDay(d))

  return floor(e)
}

const lctGMonth = (lct: CalendarTime, daylightSaving: number, zoneCorrection: number, localDay: CalendarDate): number => {
  const a = hMS2DecimalHours(lct.h as number, lct.m as number, lct.s as number)
  const b = a - daylightSaving - zoneCorrection
  const c = localDay.day + b / 24
  const d = jd(localDay.year, localDay.month, c)

  return jdcMonth(d)
}

const lctGYear = (lct: CalendarTime, daylightSaving: number, zoneCorrection: number, localDay: CalendarDate): number => {
  const a = hMS2DecimalHours(lct.h as number, lct.m as number, lct.s as number)
  const b = a - daylightSaving - zoneCorrection
  const c = localDay.day + b / 24
  const d = jd(localDay.year, localDay.month, c)

  return jdcYear(d)
}

export function rightAscensionToHourAngle(
  ra: CalendarTime,
  lct: CalendarTime,
  daylightSaving: number,
  zoneCorrection: number,
  day: CalendarDate,
  longitude: number
): CalendarTime {
  const ut = lctut(lct, daylightSaving, zoneCorrection, day)
  const gDay = lctGDay(lct, daylightSaving, zoneCorrection, day)
  const gMonth = lctGMonth(lct, daylightSaving, zoneCorrection, day)
  const gYear = lctGYear(lct, daylightSaving, zoneCorrection, day)
  const newUT = new CalendarDateTime(gYear, gMonth, gDay, ut, 0, 0)
  const gst = universalTime2GreenwichSiderealTime(newUT).gst as number
  const newGST = new CalendarTime(gst, 0, 0)
  const lst = greenwichSiderealTimeToLocalSiderealTime(newGST, longitude).lst as number
  const ra2 = hMS2DecimalHours(ra.h as number, ra.m as number, ra.s as number)
  const h1 = lst - ra2
  const h = h1 < 0 ? h1 + 24 : h1

  const result = new CalendarTime()
  result.h = dHHour(h)
  result.m = dHMin(h)
  result.s = dHSec(h)

  return result
}

export function hourAngleToRightAscension(
  ha: CalendarTime,
  lct: CalendarTime,
  daylightSaving: number,
  zoneCorrection: number,
  day: CalendarDate,
  longitude: number
): CalendarTime {
  const ut = lctut(lct, daylightSaving, zoneCorrection, day)
  const gDay = lctGDay(lct, daylightSaving, zoneCorrection, day)
  const gMonth = lctGMonth(lct, daylightSaving, zoneCorrection, day)
  const gYear = lctGYear(lct, daylightSaving, zoneCorrection, day)
  const newUT = new CalendarDateTime(gYear, gMonth, gDay, ut, 0, 0)
  const gst = universalTime2GreenwichSiderealTime(newUT).gst as number
  const newGST = new CalendarTime(gst, 0, 0)
  const lst = greenwichSiderealTimeToLocalSiderealTime(newGST, longitude).lst as number
  const ha2 = hMS2DecimalHours(ha.h as number, ha.m as number, ha.s as number)
  const r1 = lst - ha2
  const ra = r1 < 0 ? r1 + 24 : r1

  const result = new CalendarTime()
  result.h = dHHour(ra)
  result.m = dHMin(ra)
  result.s = dHSec(ra)

  return result
}

export const astroCoordinatesService = {
  dMSToDecimalDegrees,
  decimalDegreesToDMS,
  hourAngleToRightAscension,
  rightAscensionToHourAngle,
}
