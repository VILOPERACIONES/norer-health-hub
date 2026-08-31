import { describe, expect, it } from 'vitest';
import {
  APPOINTMENT_REQUEST_TIMEOUT_MS,
  getBookingFailureCopy
} from './appointmentScheduling';

describe('appointmentScheduling', () => {
  it('espera hasta dos minutos por la respuesta de Cal.com', () => {
    expect(APPOINTMENT_REQUEST_TIMEOUT_MS).toBe(120_000);
  });

  it('no declara que la cita falló cuando sólo venció el timeout', () => {
    expect(getBookingFailureCopy({ code: 'ECONNABORTED' })).toEqual({
      title: 'Valoración guardada; cita por confirmar',
      description: 'Cal.com está tardando en responder. Revisa el calendario antes de volver a intentarlo para evitar una cita duplicada.'
    });
  });

  it('conserva el detalle de un error confirmado por el API', () => {
    expect(getBookingFailureCopy({
      response: { data: { error: 'Cal.com rechazó la solicitud de reserva' } }
    })).toEqual({
      title: 'Valoración guardada, pero la cita no se confirmó',
      description: 'Cal.com rechazó la solicitud de reserva'
    });
  });
});
