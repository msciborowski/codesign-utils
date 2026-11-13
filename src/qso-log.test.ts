import { describe, expect, it } from 'vitest'
import * as qsoLogEntry from './qso-log'

/** The `@codesign-eu/utils/qso-log` subpath contract; `services/qso-log` tests cover the behaviour. */
describe('qso-log entry point', () => {
  it('exports the log readers', () => {
    expect(Object.keys(qsoLogEntry).sort()).toEqual([
      'ADIF_BANDS',
      'adifBandOfMhz',
      'adifDateTime',
      'detectLogFormat',
      'ediBandMhz',
      'importLog',
      'isEdi',
      'parseAdi',
      'parseEdi',
    ])
  })

  it('reads a record', () => {
    expect(qsoLogEntry.importLog({ name: 'log.adi', content: '<CALL:5>SP5AA<EOR>' })?.qsos[0].callsign).toBe('SP5AA')
  })
})
