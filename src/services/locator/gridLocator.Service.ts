/**
 * Convert latitude & longitude to Maidenhead (QTH) locator
 *
 * @param lat Latitude in degrees (-90 .. +90)
 * @param lng Longitude in degrees (-180 .. +180)
 * @param precision Number of characters in locator (even number: 2, 4, 6, 8)
 *                  Default = 6 (most common)
 */
const latLngToGrid = (lat: number, lng: number, precision: number = 6) => {
  if (precision % 2 !== 0 || precision < 2) {
    throw new Error('Precision must be an even number >= 2')
  }

  // Clamp values
  lat = Math.max(-90, Math.min(90, lat))
  lng = Math.max(-180, Math.min(180, lng))

  // Shift to positive ranges
  let adjLng = lng + 180
  let adjLat = lat + 90

  let locator = ''

  // Field (A-R)
  locator += String.fromCharCode('A'.charCodeAt(0) + Math.floor(adjLng / 20))
  locator += String.fromCharCode('A'.charCodeAt(0) + Math.floor(adjLat / 10))

  if (precision === 2) return locator

  // Square (0-9)
  adjLng %= 20
  adjLat %= 10
  locator += Math.floor(adjLng / 2).toString()
  locator += Math.floor(adjLat / 1).toString()

  if (precision === 4) return locator

  // Subsquare (a-x)
  adjLng %= 2
  adjLat %= 1
  locator += String.fromCharCode('a'.charCodeAt(0) + Math.floor(adjLng / (2 / 24)))
  locator += String.fromCharCode('a'.charCodeAt(0) + Math.floor(adjLat / (1 / 24)))

  if (precision === 6) return locator

  // Extended precision (digits again)
  adjLng %= 2 / 24
  adjLat %= 1 / 24
  locator += Math.floor(adjLng / (2 / 24 / 10)).toString()
  locator += Math.floor(adjLat / (1 / 24 / 10)).toString()

  return locator.substring(0, precision)
}

/**
 * Convert Maidenhead (QTH) locator to latitude & longitude (center of square)
 *
 * @param locator QTH locator (e.g. "KO02mf", "FN31")
 * @returns Object with latitude and longitude in degrees
 */
const gridToLatLng = (
  locator: string
): {
  lat: number
  lng: number
} => {
  if (!locator || locator.length < 2 || locator.length % 2 !== 0) {
    throw new Error('Invalid QTH locator format')
  }

  const loc = locator.trim().toUpperCase()
  let lng = -180
  let lat = -90

  // Field (A-R)
  lng += (loc.charCodeAt(0) - 65) * 20
  lat += (loc.charCodeAt(1) - 65) * 10

  if (loc.length >= 4) {
    // Square (0-9)
    lng += parseInt(loc[2], 10) * 2
    lat += parseInt(loc[3], 10) * 1
  }

  if (loc.length >= 6) {
    // Subsquare (a-x)
    lng += (loc[4].toLowerCase().charCodeAt(0) - 97) * (2 / 24)
    lat += (loc[5].toLowerCase().charCodeAt(0) - 97) * (1 / 24)
  }

  if (loc.length >= 8) {
    // Extended square (0-9)
    lng += parseInt(loc[6], 10) * (2 / 24 / 10)
    lat += parseInt(loc[7], 10) * (1 / 24 / 10)
  }

  // Calculate center of the square
  let lngSize = 20
  let latSize = 10

  if (loc.length >= 4) {
    lngSize = 2
    latSize = 1
  }
  if (loc.length >= 6) {
    lngSize = 2 / 24
    latSize = 1 / 24
  }
  if (loc.length >= 8) {
    lngSize = 2 / 24 / 10
    latSize = 1 / 24 / 10
  }

  lng += lngSize / 2
  lat += latSize / 2

  return { lat, lng }
}

export const GridLocationService = {
  latLngToGrid,
  gridToLatLng,
}
