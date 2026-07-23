import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AppointmentSummary, formatAppointmentDate } from './AppointmentSummary';

describe('AppointmentSummary', () => {
  it('muestra el resumen completo antes de reservar', () => {
    render(<AppointmentSummary data={{
      fecha: '2026-07-25T16:00:00.000Z',
      modalidad: 'online',
      eventTypeId: 1,
      name: 'Ana Pérez',
      email: 'ana@example.com',
      phone: '9991234567',
    }} />);

    expect(screen.getByText('Ana Pérez')).toBeInTheDocument();
    expect(screen.getByText('En línea')).toBeInTheDocument();
    expect(screen.getByText('ana@example.com')).toBeInTheDocument();
    expect(screen.getByText('9991234567')).toBeInTheDocument();
  });

  it('formatea usando la zona de Mérida', () => {
    expect(formatAppointmentDate('2026-07-25T16:00:00.000Z')).toContain('10:00');
  });
});
