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
  h: number
  m: number
  s: number

  constructor(h = 0, m = 0, s = 0) {
    this.h = h
    this.m = m
    this.s = s
  }
}

/** Universal time converted from a greenwich sidereal time */
export class UniversalTime extends CalendarTime {
  /** True when the conversion is ambiguous (sidereal day is ~3m56s shorter than a solar day) */
  warning: boolean

  constructor(h: number, m: number, s: number, warning: boolean) {
    super(h, m, s)
    this.warning = warning
  }
}

export class GreenwichSiderealTime extends CalendarTime {
  /** Greenwich sidereal time as decimal hours */
  gst: number

  constructor(h: number, m: number, s: number, gst: number) {
    super(h, m, s)
    this.gst = gst
  }
}

export class LocalSiderealTime extends CalendarTime {
  /** Local sidereal time as decimal hours */
  lst: number

  constructor(h: number, m: number, s: number, lst: number) {
    super(h, m, s)
    this.lst = lst
  }
}

export class CalendarDateTime {
  year: number
  month: number
  day: number
  dayFull?: number
  hour: number
  minute: number
  second: number
  secondFull?: number
  daylightSaving: number
  zoneCorrection: number
  /** Universal time as decimal hours (set by localCivilTime2universalTime) */
  ut?: number

  constructor(year = 0, month = 0, day = 0, hour = 0, minute = 0, second = 0) {
    this.year = year
    this.month = month
    this.day = day
    this.hour = hour
    this.minute = minute
    this.second = second
    this.daylightSaving = 0
    this.zoneCorrection = 0
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
