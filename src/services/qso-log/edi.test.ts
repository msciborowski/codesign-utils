import { describe, expect, it } from 'vitest'
import { ediBandMhz, isEdi, parseEdi } from './edi'

const EDI_LOG = [
  '[REG1TEST;1]',
  'TName=Aktywnosc',
  'TDate=20261112;20261112',
  'PCall=SP5ORI/P',
  'PWWLo=JN99VN',
  'PExch=',
  'PSect=SO',
  'PBand=144 MHz',
  'MOpe1=',
  '[Remarks]',
  'Test remark',
  '[QSORecords;4]',
  '261112;1918;SP5AAA;2;599;001;599;001;;KN09AK;250;;N;N;',
  '261112;1919;SP5BBB/P;2;599;002;599;002;;JN99WL;3;;N;;',
  '261112;1920;ERROR;;;003;;;;;0;;;;',
  '261112;1921;SP5AAA;2;599;004;599;003;;KN09AK;0;;;;D',
].join('\r\n')

describe('parseEdi', () => {
  it('reads the header, the remarks and the QSO lines', () => {
    const document = parseEdi(EDI_LOG)

    expect(document.header).toMatchObject({ TNAME: 'Aktywnosc', PCALL: 'SP5ORI/P', PWWLO: 'JN99VN', PBAND: '144 MHz', PEXCH: '' })
    expect(document.remarks).toEqual(['Test remark'])
    expect(document.problems).toEqual([])
    expect(document.records).toHaveLength(4)
    expect(document.records[0]).toEqual({
      date: '261112',
      time: '1918',
      call: 'SP5AAA',
      modeCode: '2',
      sentRst: '599',
      sentNumber: '001',
      receivedRst: '599',
      receivedNumber: '001',
      receivedExchange: '',
      receivedLocator: 'KN09AK',
      points: '250',
      newExchange: '',
      newLocator: 'N',
      newDxcc: 'N',
      duplicate: '',
    })
    expect(document.records[3].duplicate).toBe('D')
  })

  it('skips a byte order mark, other sections, lines without a key and repeated keys', () => {
    const document = parseEdi(
      '\ufeff[REG1TEST;1]\nPCall=SP5ORI\nnot a header line\npcall=SQ5TK\n[Custom]\nPWWLo=JN99VN\n[QSORecords]\n261112;1918;SP5AAA;2;599;001;599;001;;KN09AK\n'
    )

    expect(document.header).toEqual({ PCALL: 'SP5ORI' })
    expect(document.records.map(record => [record.call, record.points])).toEqual([['SP5AAA', '']])
    expect(document.problems).toEqual([])
  })

  it('reports short QSO lines, a wrong QSO count and a missing identifier', () => {
    expect(parseEdi('[REG1TEST;1]\n[QSORecords;3]\n261112;1918;SP5AAA;2\n261112;1919;SP5BBB;2;599;002;599;002;;JN99WL\n').problems).toEqual([
      { code: 'SHORT_RECORD', record: 0 },
      { code: 'RECORD_COUNT' },
    ])
    expect(parseEdi('PCall=SP5ORI').problems).toEqual([{ code: 'MISSING_IDENTIFIER' }])
    expect(parseEdi('')).toEqual({ header: {}, remarks: [], records: [], problems: [] })
  })
})

describe('isEdi', () => {
  it('recognises the REG1TEST identifier', () => {
    expect(isEdi('[REG1TEST;1]\nPCall=SP5ORI')).toBe(true)
    expect(isEdi('\ufeff  [reg1test;1]')).toBe(true)
    expect(isEdi('<CALL:5>SP5AA<EOR>')).toBe(false)
  })
})

describe('ediBandMhz', () => {
  it('reads PBand in MHz or GHz, with a decimal comma or point', () => {
    expect(ediBandMhz('144 MHz')).toBe(144)
    expect(ediBandMhz('435 MHz')).toBe(435)
    expect(ediBandMhz('1,3 GHz')).toBe(1300)
    expect(ediBandMhz('2.3 GHz')).toBe(2300)
    expect(ediBandMhz('10 GHz')).toBe(10000)
    expect(ediBandMhz('432')).toBe(432)
  })

  it('returns null without a number', () => {
    expect(ediBandMhz('two metres')).toBeNull()
    expect(ediBandMhz(undefined)).toBeNull()
  })
})
