export const MEXICO_CITY_TIME_ZONE = 'America/Mexico_City';

export const getMexicoCityDateTimeParts = (
  value: string | Date | null | undefined
): { date: string; time: string } | null => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: MEXICO_CITY_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const values = Object.fromEntries(
    parts.filter(part => part.type !== 'literal').map(part => [part.type, part.value])
  );

  return {
    date: `${values.year}-${values.month}-${values.day}`,
    time: `${values.hour}:${values.minute}`,
  };
};

export const formatMexicoCityAppointment = (
  value: string | Date,
  options: Intl.DateTimeFormatOptions = {
    dateStyle: 'full',
    timeStyle: 'short',
  }
) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value || '');
  return new Intl.DateTimeFormat('es-MX', {
    ...options,
    timeZone: MEXICO_CITY_TIME_ZONE,
  }).format(date);
};
