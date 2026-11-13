import { describe, expect, it } from 'vitest'
import { adifDateTime, detectLogFormat, importLog } from './logImport'

const HAMRS = `Generated on 2026-11-12T19:19:54.228Z 
<adif_ver:5>3.0.5
<programid:5>HAMRS
<programversion:5>1.0.7
<EOH>

<band:3>20m
<call:5>F8GFA
<freq:6>14.040
<mode:2>CW
<my_gridsquare:6>JN99vn
<operator:6>SP5ORI
<qso_date:8>20261112
<time_on:4>1550
<eor>

<band:2>2m
<call:6>SP5AAA
<freq:7>144.040
<gridsquare:6>KN09ak
<mode:2>CW
<my_gridsquare:6>JN99vn
<operator:6>SP5ORI
<qso_date:8>20261112
<time_on:6>191850
<eor>
`

const EDI_LOG = [
  '[REG1TEST;1]',
  'TDate=20261112;20261112',
  'PCall=SP5ORI/P',
  'PWWLo=JN99VN',
  'PBand=144 MHz',
  '[Remarks]',
  '[QSORecords;4]',
  '261112;1918;SP5AAA;2;599;001;599;001;;KN09AK;250;;N;N;',
  '261112;1919;SP5BBB/P;2;599;002;599;002;;JN99WL;3;;N;;',
  '261112;1920;ERROR;;;003;;;;;0;;;;',
  '261112;1921;SP5AAA;2;599;004;599;003;;KN09AK;0;;;;D',
].join('\r\n')

describe('detectLogFormat', () => {
  it('recognises ADIF by the extension, in any case', () => {
    expect(detectLogFormat({ name: 'log.adi', content: '' })).toBe('adif')
    expect(detectLogFormat({ name: 'LOG.ADIF', content: '' })).toBe('adif')
  })

  it('recognises ADIF by an <EOR> in the content', () => {
    expect(detectLogFormat({ name: 'export.txt', content: '<CALL:5>SP5AA<eor>' })).toBe('adif')
    expect(detectLogFormat({ name: 'export', content: '<CALL:5>SP5AA<EOR>' })).toBe('adif')
  })

  it('recognises EDI by the extension or the REG1TEST identifier', () => {
    expect(detectLogFormat({ name: 'SP5ORI.EDI', content: '' })).toBe('edi')
    expect(detectLogFormat({ name: 'export.txt', content: EDI_LOG })).toBe('edi')
  })

  it('returns null for other formats', () => {
    expect(detectLogFormat({ name: 'log.adx', content: '<ADX><RECORDS></RECORDS></ADX>' })).toBeNull()
    expect(detectLogFormat({ name: 'log.cbr', content: 'START-OF-LOG: 3.0' })).toBeNull()
  })
})

describe('importLog', () => {
  it('turns an ADIF file into QSOs', () => {
    const log = importLog({ name: '20261112-PL-0724.adi', content: HAMRS })

    expect(log?.format).toBe('adif')
    expect(log?.program).toEqual({ id: 'HAMRS', version: '1.0.7' })
    expect(log?.problems).toEqual([])
    expect(log?.qsos.map(({ fields: _fields, ...qso }) => qso)).toEqual([
      {
        record: 0,
        callsign: 'F8GFA',
        stationCallsign: 'SP5ORI',
        locator: null,
        myLocator: 'JN99vn',
        qsoAt: '2026-11-12T15:50:00.000Z',
        frequencyMhz: 14.04,
        band: '20m',
        mode: 'CW',
        submode: null,
      },
      {
        record: 1,
        callsign: 'SP5AAA',
        stationCallsign: 'SP5ORI',
        locator: 'KN09ak',
        myLocator: 'JN99vn',
        qsoAt: '2026-11-12T19:18:50.000Z',
        frequencyMhz: 144.04,
        band: '2m',
        mode: 'CW',
        submode: null,
      },
    ])
    expect(log?.qsos[1].fields.OPERATOR).toBe('SP5ORI')
  })

  it('prefers STATION_CALLSIGN to OPERATOR and normalises case and spaces', () => {
    const log = importLog({
      name: 'log.adi',
      content: '<CALL:8> sp5aa/p<STATION_CALLSIGN:8>sp5ori/p<OPERATOR:6>SQ5TK<BAND:4>70CM<MODE:2>cw<SUBMODE:3>pcw<EOR>',
    })

    expect(log?.qsos[0]).toMatchObject({ callsign: 'SP5AA/P', stationCallsign: 'SP5ORI/P', band: '70cm', mode: 'CW', submode: 'PCW' })
  })

  it('leaves out empty and malformed values', () => {
    const log = importLog({ name: 'log.adi', content: '<CALL:2>  <FREQ:7>144,040<QSO_DATE:8>20261112<BAND:0><EOR><FREQ:4>1e10<EOR>' })

    expect(log?.qsos[0]).toMatchObject({ callsign: null, frequencyMhz: null, qsoAt: null, band: null })
    expect(log?.qsos[1].frequencyMhz).toBeNull()
    expect(log?.program).toEqual({ id: null, version: null })
  })

  it('reads ADIF numbers', () => {
    const frequencies = ['144.040', '144.', '.5', '-1', '1296'].map(
      freq => importLog({ name: 'log.adi', content: `<FREQ:${freq.length}>${freq}<EOR>` })?.qsos[0].frequencyMhz
    )

    expect(frequencies).toEqual([144.04, 144, 0.5, -1, 1296])
  })

  it('reports syntax problems', () => {
    expect(importLog({ name: 'log.adi', content: '<CALL:5>SP5AA' })?.problems).toEqual([{ code: 'UNTERMINATED_RECORD', record: 0 }])
  })

  it('turns an EDI file into QSOs', () => {
    const log = importLog({ name: 'SP5ORI.edi', content: EDI_LOG })

    expect(log?.format).toBe('edi')
    expect(log?.program).toEqual({ id: null, version: null })
    expect(log?.problems).toEqual([])
    expect(log?.qsos.map(({ fields: _fields, ...qso }) => qso)[0]).toEqual({
      record: 0,
      callsign: 'SP5AAA',
      stationCallsign: 'SP5ORI/P',
      locator: 'KN09AK',
      myLocator: 'JN99VN',
      qsoAt: '2026-11-12T19:18:00.000Z',
      frequencyMhz: null,
      band: '2m',
      mode: 'CW',
      submode: null,
    })
    expect(log?.qsos[2]).toMatchObject({ callsign: null, mode: null, locator: null })
    expect(log?.qsos[3].fields).toMatchObject({ CALL: 'SP5AAA', MODE_CODE: '2', RECEIVED_WWL: 'KN09AK', DUPLICATE: 'D' })
  })

  it('maps EDI bands, mode codes and two-digit years', () => {
    const line = (date: string, mode: string) => `${date};1200;SP5AAA;${mode};59;001;59;001;;KN09AK;1;;;;`
    const edi = (header: string, lines: string[]) => importLog({ name: 'log.edi', content: ['[REG1TEST;1]', header, '[QSORecords]', ...lines].join('\n') })

    expect(edi('PBand=1,3 GHz\nTDate=19990101;19990101', [line('990101', '6')])?.qsos[0]).toMatchObject({
      band: '23cm',
      mode: 'FM',
      qsoAt: '1999-01-01T12:00:00.000Z',
    })
    expect(edi('PBand=50 MHz', [line('261112', '3'), line('2611', '1')])?.qsos.map(qso => [qso.band, qso.mode, qso.qsoAt])).toEqual([
      ['6m', null, '2026-11-12T12:00:00.000Z'],
      ['6m', 'SSB', null],
    ])
    expect(edi('PBand=unknown', [line('261112', '2')])?.qsos[0]).toMatchObject({ band: null, stationCallsign: null, myLocator: null })
  })

  it('returns null for a file it cannot read', () => {
    expect(importLog({ name: 'log.cbr', content: 'START-OF-LOG: 3.0' })).toBeNull()
  })
})

describe('adifDateTime', () => {
  it('combines an ADIF date with an HHMM or HHMMSS time, in UTC', () => {
    expect(adifDateTime('20261112', '1550')).toBe('2026-11-12T15:50:00.000Z')
    expect(adifDateTime(' 20261112 ', '235959')).toBe('2026-11-12T23:59:59.000Z')
    expect(adifDateTime('19300101', '0000')).toBe('1930-01-01T00:00:00.000Z')
  })

  it('rejects missing, malformed and impossible values', () => {
    expect(adifDateTime(undefined, '1550')).toBeNull()
    expect(adifDateTime('20261112', undefined)).toBeNull()
    expect(adifDateTime('2026-11-12', '1550')).toBeNull()
    expect(adifDateTime('20261112', '155')).toBeNull()
    expect(adifDateTime('19291231', '1550')).toBeNull()
    expect(adifDateTime('20261301', '1550')).toBeNull()
    expect(adifDateTime('20260230', '1550')).toBeNull()
    expect(adifDateTime('20261112', '2400')).toBeNull()
    expect(adifDateTime('20261112', '1560')).toBeNull()
    expect(adifDateTime('20261112', '155060')).toBeNull()
  })
})
