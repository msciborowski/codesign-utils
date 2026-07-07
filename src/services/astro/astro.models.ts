/**
 * Models for the astro services, ported from the original astro implementations
 * ("Astronomy with your personal computer" era pocket-calculator algorithms).
 */

export class CalendarDate {
  year: number
  month: number
  day: number

  constructor(year: number, month: number, day: number) {
    this.year = year
    this.month = month
    this.day = day
  }
}

export class CalendarTime {
  h?: number
  m?: number
  s?: number
  warning?: boolean
  /** Greenwich sidereal time as decimal hours (set by universalTime2GreenwichSiderealTime) */
  gst?: number
  /** Local sidereal time as decimal hours (set by greenwichSiderealTimeToLocalSiderealTime) */
  lst?: number

  constructor(h?: number, m?: number, s?: number) {
    this.h = h
    this.m = m
    this.s = s
  }
}

export class CalendarDateTime {
  year?: number
  month?: number
  day?: number
  dayFull?: number
  hour?: number
  minute?: number
  second?: number
  secondFull?: number
  daylightSaving?: number
  zoneCorrection?: number
  /** Universal time as decimal hours (set by localCivilTime2universalTime) */
  ut?: number

  constructor(year?: number, month?: number, day?: number, hour?: number, minute?: number, second?: number) {
    this.year = year
    this.month = month
    this.day = day
    this.hour = hour
    this.minute = minute
    this.second = second
  }
}

/** Degrees / minutes / seconds coordinates */
export class Coordinates {
  deg: number
  min: number
  sec: number
  hemisphere?: string

  constructor(deg: number, min: number, sec: number, hemisphere?: string) {
    this.deg = deg
    this.min = min
    this.sec = sec
    this.hemisphere = hemisphere
  }
}
