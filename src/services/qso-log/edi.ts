/**
 * EDI, the IARU Region 1 contest log (`REG1TEST`, VHF Handbook: "Standard format for Electronic Contest Log
 * Exchange"): `[REG1TEST;1]`, a header of `Key=value` lines, `[Remarks]`, then `[QSORecords;N]` and one QSO per line,
 * its fields separated by semicolons. One file covers one band (`PBand`); QSO lines carry no frequency. The format is
 * 7-bit ASCII.
 */

export type EdiProblemCode =
  /** The file does not start with `[REG1TEST;…]`; it was read anyway. */
  | 'MISSING_IDENTIFIER'
  /** A QSO line with fewer than the ten fields up to the received locator; it was left out. */
  | 'SHORT_RECORD'
  /** `[QSORecords;N]` announces another number of QSO lines than the file has. */
  | 'RECORD_COUNT'

export type EdiProblem = {
  code: EdiProblemCode
  /** Index of the QSO line among the QSO lines, from 0, for a problem with one line. */
  record?: number
}

/** A QSO line, field by field, as written (`D` marks a duplicate, `N` a new exchange, locator or DXCC). */
export type EdiRecord = {
  /** `YYMMDD`. */
  date: string
  /** `HHMM`, UTC. */
  time: string
  /** `ERROR` for an invalid QSO. */
  call: string
  /** 0 none of these, 1 SSB, 2 CW, 3 SSB TX / CW RX, 4 CW TX / SSB RX, 5 AM, 6 FM, 7 RTTY/MGM, 8 SSTV, 9 ATV. */
  modeCode: string
  sentRst: string
  sentNumber: string
  receivedRst: string
  receivedNumber: string
  receivedExchange: string
  /** Worked station's locator: empty, four or six characters. */
  receivedLocator: string
  points: string
  newExchange: string
  newLocator: string
  newDxcc: string
  duplicate: string
}

export type EdiDocument = {
  /** Header lines, upper-case key → value (`PCALL`, `PWWLO`, `PBAND`, `TDATE` …). */
  header: Record<string, string>
  /** Lines of the `[Remarks]` section. */
  remarks: string[]
  records: EdiRecord[]
  /** What the reader recovered from; the records are still returned. */
  problems: EdiProblem[]
}

const RECORD_FIELDS = [
  'date',
  'time',
  'call',
  'modeCode',
  'sentRst',
  'sentNumber',
  'receivedRst',
  'receivedNumber',
  'receivedExchange',
  'receivedLocator',
  'points',
  'newExchange',
  'newLocator',
  'newDxcc',
  'duplicate',
] as const

/** Fields up to the received locator: a shorter line is not a QSO. */
const MIN_RECORD_FIELDS = 10

const toRecord = (values: readonly string[]): EdiRecord => {
  const record = {} as EdiRecord

  RECORD_FIELDS.forEach((field, index) => {
    record[field] = (values[index] ?? '').trim()
  })

  return record
}

type Section = 'header' | 'remarks' | 'records' | 'other'

const SECTIONS: Record<string, Section> = { REG1TEST: 'header', REMARKS: 'remarks', QSORECORDS: 'records' }

/** Whether a text starts like an EDI file. */
export const isEdi = (text: string): boolean => /^\uFEFF?\s*\[REG1TEST;/i.test(text)

/** Reads an EDI file. Never throws: anything that is not EDI yields no records. */
export const parseEdi = (text: string): EdiDocument => {
  const header: Record<string, string> = {}
  const remarks: string[] = []
  const records: EdiRecord[] = []
  const problems: EdiProblem[] = []
  let section: Section = 'header'
  let announced: number | null = null
  let lines = 0

  if (text.trim() && !isEdi(text)) {
    problems.push({ code: 'MISSING_IDENTIFIER' })
  }

  for (const raw of text.replace(/^\uFEFF/, '').split(/\r\n|\r|\n/)) {
    const line = raw.trim()
    const opening = /^\[([^\];]+)(?:;([^\]]*))?\]$/.exec(line)

    if (opening) {
      const name = opening[1].toUpperCase()

      section = SECTIONS[name] ?? 'other'

      if (section === 'records' && /^\d+$/.test((opening[2] ?? '').trim())) {
        announced = Number(opening[2])
      }

      continue
    }

    if (section === 'header') {
      const equals = line.indexOf('=')
      const key = line.slice(0, equals).trim().toUpperCase()

      if (equals > 0 && !Object.prototype.hasOwnProperty.call(header, key)) {
        header[key] = line.slice(equals + 1).trim()
      }
    } else if (section === 'remarks') {
      remarks.push(raw)
    } else if (section === 'records' && line) {
      const values = line.split(';')

      if (values.length < MIN_RECORD_FIELDS) {
        problems.push({ code: 'SHORT_RECORD', record: lines })
      } else {
        records.push(toRecord(values))
      }

      lines += 1
    }
  }

  if (announced !== null && announced !== lines) {
    problems.push({ code: 'RECORD_COUNT' })
  }

  return { header, remarks, records, problems }
}

/** `PBand` in MHz: `145 MHz` → 145, `1,3 GHz` → 1300, a bare number is in MHz; null when it is not a band. */
export const ediBandMhz = (band: string | undefined): number | null => {
  const match = /(\d+(?:[.,]\d+)?)\s*([GM]HZ)?/i.exec(band ?? '')

  if (!match) {
    return null
  }

  const value = Number(match[1].replace(',', '.'))

  return (match[2] ?? '').toUpperCase() === 'GHZ' ? Math.round(value * 1000 * 1000) / 1000 : value
}
