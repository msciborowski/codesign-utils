import { type AdiProblem, parseAdi } from './adi.js'
import { adifBandOfMhz } from './bands.js'
import { type EdiProblem, type EdiRecord, ediBandMhz, isEdi, parseEdi } from './edi.js'

/**
 * One entry point for QSO log files: a file goes in, QSOs in one shape come out, whatever the format. ADIF (ADI) and
 * EDI (REG1TEST) so far; another format adds a reader that returns the same `LogImport`.
 */
export type LogFormat = 'adif' | 'edi'

export type LogFile = {
  /** File name; a known extension (`.adi`, `.adif`, `.edi`) picks the format, otherwise the content does. */
  name: string
  /** The file as text. */
  content: string
}

/** Field name → value as written; ADIF field names for ADIF, `DATE`, `CALL`, `MODE_CODE` … for EDI. */
export type LogFields = Record<string, string>

export type LogQso = {
  /** Position of the record in the file, from 0. */
  record: number
  /** Worked station (ADIF `CALL`), trimmed and upper-case; null for an EDI `ERROR` line. */
  callsign: string | null
  /** Logging station: ADIF `STATION_CALLSIGN`, or `OPERATOR` when it is absent; EDI `PCall`. Upper-case. */
  stationCallsign: string | null
  /** Worked station's locator (ADIF `GRIDSQUARE`, EDI received WWL), trimmed, not validated. */
  locator: string | null
  /** Logging station's locator (ADIF `MY_GRIDSQUARE`, EDI `PWWLo`), trimmed, not validated. */
  myLocator: string | null
  /** Start of the QSO in ISO 8601, UTC; null when the date or time is missing or not valid. */
  qsoAt: string | null
  /** ADIF `FREQ` in MHz; null when missing or not a number, and always for EDI, which has none. */
  frequencyMhz: number | null
  /** ADIF band, lower-case (`2m`, `70cm`): ADIF `BAND` as written, EDI `PBand` mapped to the ADIF enumeration. */
  band: string | null
  /** Upper-case: ADIF `MODE`; for EDI the mode of codes 1, 2, 5, 6, 8 and 9, null for 0, 3, 4 and 7. */
  mode: string | null
  /** ADIF `SUBMODE`, upper-case; null for EDI. */
  submode: string | null
  /** Every field of the record. */
  fields: LogFields
}

export type LogImportProblem = AdiProblem | EdiProblem

export type LogImport = {
  format: LogFormat
  /** Logging program named by the file (`PROGRAMID`, `PROGRAMVERSION` of an ADIF header); EDI names none. */
  program: { id: string | null; version: string | null }
  /** Every record, in file order. */
  qsos: LogQso[]
  /** Syntax problems the reader recovered from. */
  problems: LogImportProblem[]
}

const EXTENSIONS: Record<string, LogFormat> = { adi: 'adif', adif: 'adif', edi: 'edi' }

const extensionOf = (name: string): string => {
  const dot = name.lastIndexOf('.')

  return dot < 0 ? '' : name.slice(dot + 1).toLowerCase()
}

/** The format of a log file, by its extension, else by its content; null when it is not a supported one. */
export const detectLogFormat = (file: LogFile): LogFormat | null => {
  const byExtension = EXTENSIONS[extensionOf(file.name)]

  if (byExtension) {
    return byExtension
  }

  if (isEdi(file.content)) {
    return 'edi'
  }

  return /<eor>/i.test(file.content) ? 'adif' : null
}

const text = (value: string | undefined): string | null => {
  const trimmed = value === undefined ? '' : value.trim()

  return trimmed ? trimmed : null
}

const upper = (value: string | undefined): string | null => {
  const trimmed = text(value)

  return trimmed === null ? null : trimmed.toUpperCase()
}

/** ADIF Number: digits with an optional minus sign and at most one decimal point. */
const ADIF_NUMBER = /^-?(\d+(\.\d*)?|\.\d+)$/

const adifNumber = (value: string | undefined): number | null => {
  const trimmed = text(value)

  return trimmed !== null && ADIF_NUMBER.test(trimmed) ? Number(trimmed) : null
}

/** ADIF Date `YYYYMMDD` (from 1930) and Time `HHMM` or `HHMMSS`, both UTC, as an ISO 8601 moment. */
export const adifDateTime = (date: string | undefined, time: string | undefined): string | null => {
  const day = /^(\d{4})(\d{2})(\d{2})$/.exec(text(date) ?? '')
  const clock = /^(\d{2})(\d{2})(\d{2})?$/.exec(text(time) ?? '')

  if (!day || !clock) {
    return null
  }

  const [year, month, dayOfMonth] = [Number(day[1]), Number(day[2]), Number(day[3])]
  const [hours, minutes, seconds] = [Number(clock[1]), Number(clock[2]), Number(clock[3] ?? 0)]
  const moment = new Date(Date.UTC(year, month - 1, dayOfMonth, hours, minutes, seconds))
  const valid =
    year >= 1930 &&
    moment.getUTCFullYear() === year &&
    moment.getUTCMonth() === month - 1 &&
    moment.getUTCDate() === dayOfMonth &&
    hours < 24 &&
    minutes < 60 &&
    seconds < 60

  return valid ? moment.toISOString() : null
}

const fromAdif = (content: string): LogImport => {
  const document = parseAdi(content)

  return {
    format: 'adif',
    program: { id: text(document.header.PROGRAMID), version: text(document.header.PROGRAMVERSION) },
    qsos: document.records.map((fields, record): LogQso => {
      const band = text(fields.BAND)

      return {
        record,
        callsign: upper(fields.CALL),
        stationCallsign: upper(fields.STATION_CALLSIGN) ?? upper(fields.OPERATOR),
        locator: text(fields.GRIDSQUARE),
        myLocator: text(fields.MY_GRIDSQUARE),
        qsoAt: adifDateTime(fields.QSO_DATE, fields.TIME_ON),
        frequencyMhz: adifNumber(fields.FREQ),
        band: band === null ? null : band.toLowerCase(),
        mode: upper(fields.MODE),
        submode: upper(fields.SUBMODE),
        fields,
      }
    }),
    problems: document.problems,
  }
}

/** EDI mode codes that name one mode for both directions; 0 (none of these), 3 and 4 (cross-mode) and 7 (RTTY or MGM) do not. */
const EDI_MODES: Record<string, string> = { '1': 'SSB', '2': 'CW', '5': 'AM', '6': 'FM', '8': 'SSTV', '9': 'ATV' }

const EDI_FIELD_NAMES: Record<keyof EdiRecord, string> = {
  date: 'DATE',
  time: 'TIME',
  call: 'CALL',
  modeCode: 'MODE_CODE',
  sentRst: 'SENT_RST',
  sentNumber: 'SENT_NUMBER',
  receivedRst: 'RECEIVED_RST',
  receivedNumber: 'RECEIVED_NUMBER',
  receivedExchange: 'RECEIVED_EXCHANGE',
  receivedLocator: 'RECEIVED_WWL',
  points: 'POINTS',
  newExchange: 'NEW_EXCHANGE',
  newLocator: 'NEW_WWL',
  newDxcc: 'NEW_DXCC',
  duplicate: 'DUPLICATE',
}

const ediFields = (record: EdiRecord): LogFields => {
  const fields: LogFields = {}

  for (const key of Object.keys(EDI_FIELD_NAMES) as (keyof EdiRecord)[]) {
    fields[EDI_FIELD_NAMES[key]] = record[key]
  }

  return fields
}

const fromEdi = (content: string): LogImport => {
  const document = parseEdi(content)
  const mhz = ediBandMhz(document.header.PBAND)
  const band = mhz === null ? null : adifBandOfMhz(mhz)
  // QSO dates have two-digit years: the century comes from the contest dates (`TDate=YYYYMMDD;YYYYMMDD`).
  const century = (/^\s*(\d{2})\d{6}/.exec(document.header.TDATE ?? '') ?? [])[1] ?? '20'

  return {
    format: 'edi',
    program: { id: null, version: null },
    qsos: document.records.map((record, index): LogQso => ({
      record: index,
      callsign: record.call.toUpperCase() === 'ERROR' ? null : upper(record.call),
      stationCallsign: upper(document.header.PCALL),
      locator: text(record.receivedLocator),
      myLocator: text(document.header.PWWLO),
      qsoAt: /^\d{6}$/.test(record.date) ? adifDateTime(`${century}${record.date}`, record.time) : null,
      frequencyMhz: null,
      band,
      mode: EDI_MODES[record.modeCode] ?? null,
      submode: null,
      fields: ediFields(record),
    })),
    problems: document.problems,
  }
}

/** Reads a QSO log file; null when its format is not supported. */
export const importLog = (file: LogFile): LogImport | null => {
  const format = detectLogFormat(file)

  if (format === 'adif') {
    return fromAdif(file.content)
  }

  return format === 'edi' ? fromEdi(file.content) : null
}
