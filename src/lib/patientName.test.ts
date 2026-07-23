import { describe, expect, it } from 'vitest';
import { buildPatientFullName } from './patientName';

describe('nombre completo del paciente', () => {
  it('combina nombre y apellido para enviarlos a Cal.com', () => {
    expect(buildPatientFullName('Ana María', 'López Pérez')).toBe('Ana María López Pérez');
  });

  it('evita espacios adicionales cuando falta una parte', () => {
    expect(buildPatientFullName(' Ana ', '')).toBe('Ana');
  });
});
