/**
 * Dependency-free entry point: `@codesign-eu/utils/qso-log`.
 *
 * Reads QSO logs: `importLog` turns a log file (ADIF or EDI) into QSOs in one shape; `parseAdi` and `parseEdi` are the
 * lower-level readers. The same code runs in the browser and in Node, so a preview and a server check agree.
 *
 * Everything exported here is also reachable from the package root.
 */
export { ADIF_BANDS, adifBandOfMhz, adifDateTime, detectLogFormat, ediBandMhz, importLog, isEdi, parseAdi, parseEdi } from './services/qso-log/index.js'

export type {
  AdiDocument,
  AdiFields,
  AdiProblem,
  AdiProblemCode,
  EdiDocument,
  EdiProblem,
  EdiProblemCode,
  EdiRecord,
  LogFields,
  LogFile,
  LogFormat,
  LogImport,
  LogImportProblem,
  LogQso,
} from './services/qso-log/index.js'
