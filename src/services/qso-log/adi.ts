/**
 * ADI, the original ADIF file syntax (ADIF 3.1.7, chapter IV.A): an optional header closed by `<EOH>`, then records of
 * data specifiers `<NAME:LENGTH[:TYPE]>data`, each record closed by `<EOR>`. Characters outside data specifiers are
 * ignored, so line breaks and comments may sit anywhere between them.
 *
 * ADI is specified as ASCII, but logging programs write UTF-8 and count the length in bytes, in characters or in
 * UTF-16 code units. The length is read in UTF-16 code units (JavaScript string length), and a value whose declared
 * length runs into the next data specifier is cut before it, so one name with diacritics never shifts the fields after
 * it.
 */

export type AdiProblemCode =
  /** A value's declared length runs into the next data specifier; the value was cut before it. */
  | 'LENGTH_MISMATCH'
  /** A value's declared length runs past the end of the file; the value was cut there. */
  | 'TRUNCATED_VALUE'
  /** A field appears more than once in a record or in the header; the first value was kept. */
  | 'DUPLICATE_FIELD'
  /** Fields after the last `<EOR>`; they were left out. */
  | 'UNTERMINATED_RECORD'
  /** The file starts with text, which makes it a header, but has no `<EOH>` before the first record. */
  | 'MISSING_EOH'

export type AdiProblem = {
  code: AdiProblemCode
  /** Index of the record, from 0; absent for the header and for the file as a whole. */
  record?: number
  /** Upper-case field name, for a problem with one field. */
  field?: string
}

/** Upper-case field name → value as written in the file. */
export type AdiFields = Record<string, string>

export type AdiDocument = {
  /** Data specifiers of the header (`ADIF_VER`, `PROGRAMID` …); empty when the file has no header. */
  header: AdiFields
  records: AdiFields[]
  /** What the reader recovered from; the records are still returned. */
  problems: AdiProblem[]
}

/**
 * `<EOR>`, `<EOH>` or a data specifier `<NAME:LENGTH[:TYPE]>`. A field name has no angle or curly brackets, colons or
 * commas; user-defined names may contain single spaces. Leading zeros in the length are accepted (import-only).
 */
const TOKEN = /<(?:(eor|eoh)|([^<>:,{}\s]+(?: [^<>:,{}\s]+)*):(\d+)(?::[A-Za-z]*)?)>/gi

const hasOwn = (fields: AdiFields, name: string): boolean => Object.prototype.hasOwnProperty.call(fields, name)

/** The header ends at the first `<EOH>`, provided it comes before the first `<EOR>`. */
const headerEnd = (text: string): number => {
  const eoh = text.search(/<eoh>/i)
  const eor = text.search(/<eor>/i)

  return eoh >= 0 && (eor < 0 || eoh < eor) ? eoh : -1
}

/** Reads an ADI file. Never throws: anything that is not ADI yields no records. */
export const parseAdi = (text: string): AdiDocument => {
  const source = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text
  const header: AdiFields = {}
  const records: AdiFields[] = []
  const problems: AdiProblem[] = []
  const end = headerEnd(source)
  let inHeader = end >= 0
  let fields: AdiFields = {}
  let fieldCount = 0

  if (!inHeader && source.length > 0 && source.charAt(0) !== '<') {
    problems.push({ code: 'MISSING_EOH' })
  }

  TOKEN.lastIndex = 0

  for (let token = TOKEN.exec(source); token; token = TOKEN.exec(source)) {
    const tag = token[1]?.toUpperCase()

    if (tag === 'EOH') {
      inHeader = false
      continue
    }

    if (tag === 'EOR') {
      if (fieldCount > 0) {
        records.push(fields)
      }

      fields = {}
      fieldCount = 0
      continue
    }

    const name = token[2].toUpperCase()
    const start = TOKEN.lastIndex
    const declaredEnd = start + Number(token[3])
    const where: Pick<AdiProblem, 'record' | 'field'> = inHeader ? { field: name } : { record: records.length, field: name }
    // The next specifier, wherever it is: a value never swallows one.
    const next = TOKEN.exec(source)
    let valueEnd = Math.min(declaredEnd, source.length)

    if (next && next.index < declaredEnd) {
      valueEnd = next.index
      problems.push({ code: 'LENGTH_MISMATCH', ...where })
    } else if (declaredEnd > source.length) {
      problems.push({ code: 'TRUNCATED_VALUE', ...where })
    }

    TOKEN.lastIndex = valueEnd

    const target = inHeader ? header : fields

    if (hasOwn(target, name)) {
      problems.push({ code: 'DUPLICATE_FIELD', ...where })
    } else {
      target[name] = source.slice(start, valueEnd)
      fieldCount += inHeader ? 0 : 1
    }
  }

  if (fieldCount > 0) {
    problems.push({ code: 'UNTERMINATED_RECORD', record: records.length })
  }

  return { header, records, problems }
}
