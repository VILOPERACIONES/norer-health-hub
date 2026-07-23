import { describe, expect, it } from 'vitest';
import { hasRecall24Data, normalizeRecall24 } from './recall24';

describe('recordatorio de 24 horas', () => {
  it('conserva el formato actual basado en filas', () => {
    const rows = normalizeRecall24([{ label: 'Desayuno', hora: '08:00', ayer: 'Avena', usualmente: 'Huevos' }]);

    expect(rows[0]).toEqual({ label: 'Desayuno', hora: '08:00', ayer: 'Avena', usualmente: 'Huevos' });
    expect(hasRecall24Data(rows)).toBe(true);
  });

  it('mantiene visibles los datos del formato anterior', () => {
    const rows = normalizeRecall24({ desayuno: { hora: '07:00', ayer: 'Fruta' } });

    expect(rows[0]).toMatchObject({ label: 'Desayuno', hora: '07:00', ayer: 'Fruta' });
  });
});
