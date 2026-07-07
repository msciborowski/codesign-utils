/**
 * Math and sexagesimal conversion helpers used by the astro services.
 * Ported from the archived astropack Utils (TypeScript) implementation,
 * which itself was a port of the js-v2 utils service.
 */

export const abs = (input: number): number => Math.abs(input)

export const floor = (decimalInput: number): number => Math.floor(decimalInput)

export const round = (decimalInput: number, decimalPlaces: number): number => Number(Number(decimalInput).toFixed(decimalPlaces))

export const trunc = (decimalInput: number): number => Math.trunc(decimalInput)

// TODO: verify usage — part of an unfinished sunrise/sunset algorithm in the original sources
export const approximateTime = (dayOfTheYear: number, lngHour: number): number => {
  // "N" -> dayOfTheYear
  return lngHour > 0 ? dayOfTheYear + (6 - lngHour) / 24 : dayOfTheYear + (18 - lngHour) / 24
}

// TODO: verify usage — part of an unfinished sunrise/sunset algorithm in the original sources
export const longitudeHour = (lng: number): number => lng / 15

export const zeroPad = (value: number, size: number): string => {
  let result = String(value)

  while (result.length < size) {
    result = `0${result}`
  }

  return result
}

export const zeroPadRight = (value: number, size: number): string => {
  let result = String(value)

  while (result.length < size) {
    result = `${result}0`
  }

  return result
}

export const formatSecondsWithMilliseconds = (seconds: number, millisecondsLength = 3): string => {
  const s = floor(seconds)
  const ms = round((seconds - s) * Math.pow(10, millisecondsLength), 0)
  return `${zeroPad(s, 2)}.${zeroPadRight(ms, millisecondsLength)}`
}

/** Decimal degrees to decimal hours */
export const dDDH = (dd: number): number => dd / 15

/** Decimal hours to decimal degrees */
export const dHDD = (dh: number): number => dh * 15

/** Degrees from decimal degrees */
export const dDDeg = (dd: number): number => {
  const a = abs(dd)
  const b = a * 3600
  const c = round(b - 60 * floor(b / 60), 2)
  const e = c === 60 ? b + 60 : b

  return dd < 0 ? -floor(e / 3600) : floor(e / 3600)
}

/** Minutes from decimal degrees */
export const dDMin = (dd: number): number => {
  const a = abs(dd)
  const b = a * 3600
  const c = round(b - 60 * floor(b / 60), 2)
  const e = c === 60 ? b + 60 : b

  return floor(e / 60) % 60
}

/** Seconds from decimal degrees */
export const dDSec = (dd: number): number => {
  const a = abs(dd)
  const b = a * 3600
  const c = round(b - 60 * floor(b / 60), 2)

  return c === 60 ? 0 : c
}

/** Hours from decimal hours */
export const dHHour = (dh: number): number => {
  const a = abs(dh)
  const b = a * 3600
  const c = round(b - 60 * floor(b / 60), 2)
  const e = c === 60 ? b + 60 : b

  return dh < 0 ? -floor(e / 3600) : floor(e / 3600)
}

/** Minutes from decimal hours */
export const dHMin = (dh: number): number => {
  const a = abs(dh)
  const b = a * 3600
  const c = round(b - 60 * floor(b / 60), 2)
  const e = c === 60 ? b + 60 : b

  return floor(e / 60) % 60
}

/** Seconds from decimal hours */
export const dHSec = (dh: number): number => {
  const a = abs(dh)
  const b = a * 3600
  const c = round(b - 60 * floor(b / 60), 2)

  return c === 60 ? 0 : c
}

export const astroUtilsService = {
  abs,
  approximateTime,
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
  longitudeHour,
  round,
  trunc,
  zeroPad,
  zeroPadRight,
}
