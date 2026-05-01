/**
 * Timezone utilities for Jakarta (UTC+7)
 */

/**
 * Get current time in Jakarta as a Date object (UTC)
 */
export function getJakartaNow() {
  const now = new Date();
  // Return the original date,prisma handles UTC storage
  return now;
}

/**
 * Get start of day in Jakarta (00:00:00 UTC+7) as a UTC Date
 */
export function getJakartaStartOfDay(dateInput?: Date) {
  const now = dateInput || new Date();
  
  // Format to Jakarta YYYY-MM-DD
  const jakartaDateStr = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
  
  // Return 00:00:00 in Jakarta as a UTC Date
  return new Date(`${jakartaDateStr}T00:00:00+07:00`);
}

/**
 * Get end of day in Jakarta (23:59:59.999 UTC+7) as a UTC Date
 */
export function getJakartaEndOfDay(dateInput?: Date) {
  const now = dateInput || new Date();
  const jakartaDateStr = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
  return new Date(`${jakartaDateStr}T23:59:59.999+07:00`);
}
