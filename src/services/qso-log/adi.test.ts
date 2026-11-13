import { describe, expect, it } from 'vitest'
import { parseAdi } from './adi'

describe('parseAdi', () => {
  it('reads a header of free text and data specifiers, then the records', () => {
    const document = parseAdi(
      [
        'Generated on 2026-11-12T19:19:54.228Z ',
        '<adif_ver:5>3.0.5',
        '<programid:5>HAMRS',
        '<EOH>',
        '',
        '<band:2>2m',
        '<call:6>SP5AAA',
        '<eor>',
        '',
        '<BAND:4>70cm <CALL:5>SP5BB <EOR>',
      ].join('\n')
    )

    expect(document.header).toEqual({ ADIF_VER: '3.0.5', PROGRAMID: 'HAMRS' })
    expect(document.records).toEqual([
      { BAND: '2m', CALL: 'SP5AAA' },
      { BAND: '70cm', CALL: 'SP5BB' },
    ])
    expect(document.problems).toEqual([])
  })

  it('reads a file without a header', () => {
    expect(parseAdi('<CALL:5>SP5AA<EOR>')).toEqual({ header: {}, records: [{ CALL: 'SP5AA' }], problems: [] })
  })

  it('takes data specifiers before an <EOH> as the header even when the file starts with one', () => {
    expect(parseAdi('<ADIF_VER:5>3.1.7<EOH><CALL:5>SP5AA<EOR>')).toEqual({
      header: { ADIF_VER: '3.1.7' },
      records: [{ CALL: 'SP5AA' }],
      problems: [],
    })
  })

  it('skips a byte order mark', () => {
    expect(parseAdi('\ufeff<CALL:5>SP5AA<EOR>').records).toEqual([{ CALL: 'SP5AA' }])
  })

  it('accepts type indicators, leading zeros, any case and anything between data specifiers', () => {
    const document = parseAdi('<qso_date:8:d>20261112 a < b {note}\r\n<Call:005>SP5AA\t<FREQ:7:N>144.040 <eOr>')

    expect(document.records).toEqual([{ QSO_DATE: '20261112', CALL: 'SP5AA', FREQ: '144.040' }])
  })

  it('reads user-defined field names with spaces and empty values', () => {
    expect(parseAdi('<SWEATER SIZE:1>M<COMMENT:0><EOR>').records).toEqual([{ 'SWEATER SIZE': 'M', COMMENT: '' }])
  })

  it('ignores empty records and a stray <EOH> after the header', () => {
    expect(parseAdi('<EOR><CALL:5>SP5AA<EOH><EOR>  <EOR>').records).toEqual([{ CALL: 'SP5AA' }])
  })

  it('keeps UTF-16 lengths, as JavaScript counts them', () => {
    expect(parseAdi('<NOTES:2>😁<CALL:5>SP5AA<EOR>').records).toEqual([{ NOTES: '😁', CALL: 'SP5AA' }])
  })

  it('cuts a value whose length counts bytes before the next data specifier', () => {
    const document = parseAdi('<NAME:7>Łukasz<CALL:5>SP5AA<EOR><NAME:8>Józef<EOR>')

    expect(document.records).toEqual([{ NAME: 'Łukasz', CALL: 'SP5AA' }, { NAME: 'Józef' }])
    expect(document.problems).toEqual([
      { code: 'LENGTH_MISMATCH', record: 0, field: 'NAME' },
      { code: 'LENGTH_MISMATCH', record: 1, field: 'NAME' },
    ])
  })

  it('cuts a value that runs past the end of the file', () => {
    const document = parseAdi('<CALL:5>SP5AA<EOR><CALL:9>SP5BB')

    expect(document.records).toEqual([{ CALL: 'SP5AA' }])
    expect(document.problems).toEqual([
      { code: 'TRUNCATED_VALUE', record: 1, field: 'CALL' },
      { code: 'UNTERMINATED_RECORD', record: 1 },
    ])
  })

  it('keeps the first of repeated fields', () => {
    const document = parseAdi('<PROGRAMID:1>A<PROGRAMID:1>B<EOH><CALL:5>SP5AA<CALL:5>SP5BB<EOR>')

    expect(document.header).toEqual({ PROGRAMID: 'A' })
    expect(document.records).toEqual([{ CALL: 'SP5AA' }])
    expect(document.problems).toEqual([
      { code: 'DUPLICATE_FIELD', field: 'PROGRAMID' },
      { code: 'DUPLICATE_FIELD', record: 0, field: 'CALL' },
    ])
  })

  it('reports a header without <EOH> and reads on', () => {
    const document = parseAdi('My log\n<CALL:5>SP5AA<EOR>')

    expect(document.records).toEqual([{ CALL: 'SP5AA' }])
    expect(document.problems).toEqual([{ code: 'MISSING_EOH' }])
  })

  it('returns nothing for an empty file or text that is not ADI', () => {
    expect(parseAdi('')).toEqual({ header: {}, records: [], problems: [] })
    expect(parseAdi('<RECORD><CALL>SP5AA</CALL></RECORD>').records).toEqual([])
  })

  it('can be called again after a failed read', () => {
    parseAdi('<CALL:9>SP5')

    expect(parseAdi('<CALL:5>SP5AA<EOR>').records).toEqual([{ CALL: 'SP5AA' }])
  })
})
