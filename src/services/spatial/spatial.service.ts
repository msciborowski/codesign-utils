/* eslint-disable @typescript-eslint/no-explicit-any */
import { LatLngBounds } from 'leaflet'

export const swapLatLng = (arr: any) =>
  arr.map((x: any) => (x.length === 2 && typeof x[0] === 'number' && typeof x[1] === 'number' ? [x[1], x[0]] : swapLatLng(x)))

export const leafletBoundsToString = (bounds: LatLngBounds) => `n=${bounds.getNorth()}&e=${bounds.getEast()}&s=${bounds.getSouth()}&w=${bounds.getWest()}`

export const spatialService = {
  swapLatLng,
  leafletBoundsToString,
}
