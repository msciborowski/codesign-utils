import { addMinutes, differenceInDays, format, formatDistance } from 'date-fns'

const timestampToString = (ts: Date, showSeconds?: boolean): string => {
  const d = new Date(ts)
  return format(addMinutes(d, d.getTimezoneOffset()), `yyyy-MM-dd H:mm${showSeconds ? ':ss' : ''}`)
}

const formatDay = (d: Date): string => {
  return format(addMinutes(d, d.getTimezoneOffset()), 'yyyy-MM-dd')
}

const parseDate = (s: string): Date => {
  if (s.length !== 8) {
    throw new Error('Date string to parse must be 8 characters')
  }

  return new Date(`${s.substring(0, 4)}-${s.substring(4, 6)}-${s.substring(6, 8)}`)
}

const daysBetweenToday = (d: Date): number => {
  return differenceInDays(new Date(), d)
}

const timeAgo = (d: Date): string => {
  return formatDistance(new Date(d), new Date())
}

const dateIsFromTheFuture = (d: Date): boolean => {
  return new Date(d) > new Date()
}

export const dateTimeService = {
  daysBetweenToday,
  dateIsFromTheFuture,
  formatDay,
  parseDate,
  timestampToString,
  timeAgo,
}
