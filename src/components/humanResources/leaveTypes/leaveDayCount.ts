import dayjs from 'dayjs';

/**
 * Calendar days between two dates (inclusive), optionally excluding
 * Saturdays and/or Sundays — mirrors LeaveType.excludes_saturday/
 * excludes_sunday so a leave request's days_requested reflects how that
 * leave type is actually meant to be counted. The two flags are
 * independent (not a single "excludes weekends" toggle) since real
 * policies vary: some exclude neither, some only Sunday (6-day work week),
 * some only Saturday, some both (5-day work week — the common convention
 * for Annual Leave).
 */
export const computeLeaveDays = (
  startDate: string | null | undefined,
  endDate: string | null | undefined,
  excludesSaturday: boolean,
  excludesSunday: boolean
): number | null => {
  if (!startDate || !endDate) return null;

  const start = dayjs(startDate).startOf('day');
  const end = dayjs(endDate).startOf('day');
  if (!start.isValid() || !end.isValid() || end.isBefore(start)) return null;

  if (!excludesSaturday && !excludesSunday) {
    return end.diff(start, 'day') + 1;
  }

  let count = 0;
  let cursor = start;
  while (cursor.isBefore(end) || cursor.isSame(end)) {
    const dayOfWeek = cursor.day(); // 0 = Sunday, 6 = Saturday
    const excluded =
      (dayOfWeek === 0 && excludesSunday) ||
      (dayOfWeek === 6 && excludesSaturday);
    if (!excluded) {
      count++;
    }
    cursor = cursor.add(1, 'day');
  }

  return count;
};
