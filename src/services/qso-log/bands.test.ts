import { describe, expect, it } from 'vitest'
import { adifBandOfMhz } from './bands'

describe('adifBandOfMhz', () => {
  it('names the ADIF band of a frequency, edges included', () => {
    expect(adifBandOfMhz(144.05)).toBe('2m')
    expect(adifBandOfMhz(146.5)).toBe('2m')
    expect(adifBandOfMhz(432.2)).toBe('70cm')
    expect(adifBandOfMhz(1300)).toBe('23cm')
    expect(adifBandOfMhz(14.04)).toBe('20m')
    expect(adifBandOfMhz(0.1357)).toBe('2190m')
    expect(adifBandOfMhz(7500000)).toBe('submm')
  })

  it('returns null between bands', () => {
    expect(adifBandOfMhz(100)).toBeNull()
    expect(adifBandOfMhz(Number.NaN)).toBeNull()
  })
})
