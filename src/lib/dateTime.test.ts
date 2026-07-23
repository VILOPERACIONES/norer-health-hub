import { describe, expect, it } from 'vitest';
import {
  formatMexicoCityAppointment,
  getMexicoCityDateTimeParts,
} from './dateTime';

describe('dateTime de Ciudad de México', () => {
  it('muestra la cita UTC de Regina como 09:30', () => {
    expect(getMexicoCityDateTimeParts('2026-09-14T15:30:00.000Z')).toEqual({
      date: '2026-09-14',
      time: '09:30',
    });
  });

  it('formatea sin depender de la zona horaria del navegador', () => {
    const result = formatMexicoCityAppointment('2026-09-14T15:30:00.000Z', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    expect(result).toContain('09:30');
  });
});
