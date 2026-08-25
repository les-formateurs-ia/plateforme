
/**
 * Adds or subtracts working days to a given date, skipping weekends.
 * @param date The starting date.
 * @param days The number of working days to add (positive) or subtract (negative).
 * @returns A new Date object with the adjusted date.
 */
export const addWorkingDays = (date: Date, days: number): Date => {
  const newDate = new Date(date);
  let totalDays = Math.abs(days);
  const direction = days >= 0 ? 1 : -1;

  // For a duration of N days, a task starts on Day X and ends on Day X + N-1.
  // When moving backward, if we start from an end date (exclusive), we need to
  // move `days` number of *working days* to find the start date (inclusive).
  // E.g., if a task has 1 day duration, starts Monday, ends Monday.
  // If we're calculating backward from Tuesday (end of next task), 1 day duration means
  // it should end Monday. So we go back 1 working day.
  // The loop counts how many working days to effectively traverse.

  let workingDaysCount = 0;
  while (workingDaysCount < totalDays) {
    newDate.setDate(newDate.getDate() + direction);
    const dayOfWeek = newDate.getDay(); // 0 = Sunday, 6 = Saturday
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // If it's not a weekend
      workingDaysCount++;
    }
  }
  return newDate;
};

/**
 * Calculates the ISO week number of a year for a given date.
 * @param date The date to calculate the week number for.
 * @returns The ISO week number.
 */
export const getWeekNumber = (date: Date): number => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  // Set to nearest Thursday: current date + 4 - current day number
  // Make Sunday's day number 7
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  // Get first day of year
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  // Calculate full weeks to nearest Thursday
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return weekNo;
};

/**
 * Formats a Date object to a YYYY-MM-DD string.
 * @param date The Date object to format.
 * @returns A string in YYYY-MM-DD format.
 */
export const formatDateToYYYYMMDD = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Parses a YYYY-MM-DD string to a Date object.
 * @param dateString The date string in YYYY-MM-DD format.
 * @returns A Date object.
 */
export const parseYYYYMMDDToDate = (dateString: string): Date => {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
};
