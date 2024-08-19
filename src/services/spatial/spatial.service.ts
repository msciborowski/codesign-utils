/* eslint-disable @typescript-eslint/no-explicit-any */
import { LatLngBounds } from 'leaflet'

export const swapLatLng = (arr: any) =>
  arr.map((x: any) => (x.length === 2 && typeof x[0] === 'number' && typeof x[1] === 'number' ? [x[1], x[0]] : swapLatLng(x)))

export const leafletBoundsToString = (bounds: LatLngBounds) => `n=${bounds.getNorth()}&e=${bounds.getEast()}&s=${bounds.getSouth()}&w=${bounds.getWest()}`

export const getPointFromPolygon = (coords: any): any => {
  if (!coords) return
  return coords.length === 2 && typeof coords[0] === 'number' && typeof coords[1] === 'number' ? coords : getPointFromPolygon(coords[0])
}

export const spatialService = {
  swapLatLng,
  leafletBoundsToString,
  getPointFromPolygon,
}
