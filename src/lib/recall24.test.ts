import { describe, expect, it } from 'vitest';
import { hasRecall24Data, normalizeRecall24, resolveAssessmentDietetica, serializeRecall24 } from './recall24';

describe('recordatorio de 24 horas', () => {
  it('conserva el formato actual basado en filas', () => {
    const rows = normalizeRecall24([{ label: 'Desayuno', hora: '08:00', notas: 'Avena con huevos' }]);

    expect(rows[0]).toMatchObject({ label: 'Desayuno', hora: '08:00', notas: 'Avena con huevos' });
    expect(hasRecall24Data(rows)).toBe(true);
  });

  it('combina los campos legacy ayer/usualmente en notas', () => {
    const rows = normalizeRecall24([{ label: 'Desayuno', hora: '08:00', ayer: 'Avena', usualmente: 'Huevos' }]);

    expect(rows[0]).toMatchObject({ label: 'Desayuno', hora: '08:00', notas: 'Avena / Huevos' });
  });

  it('mantiene visibles los datos del formato anterior', () => {
    const rows = normalizeRecall24({ desayuno: { hora: '07:00', ayer: 'Fruta' } });

    expect(rows[0]).toMatchObject({ label: 'Desayuno', hora: '07:00', notas: 'Fruta' });
  });

  it('usa únicamente la Dietética de la última valoración cuando existe', () => {
    const rows = resolveAssessmentDietetica(
      { dietetica: [{ label: 'Post-entreno', hora: '10:30', notas: 'Licuado' }] },
      [{ label: 'Desayuno', hora: '07:00', notas: 'Dato del expediente' }],
    );

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ label: 'Post-entreno', hora: '10:30', notas: 'Licuado' });
  });

  it('usa el expediente solo como compatibilidad si la última valoración no tiene fotografía', () => {
    const rows = resolveAssessmentDietetica(
      { dietetica: null },
      [{ label: 'Desayuno', hora: '07:00', notas: 'Base' }],
    );

    expect(rows[0]).toMatchObject({ label: 'Desayuno', hora: '07:00', notas: 'Base' });
  });

  it('serializa la fotografía sin IDs temporales de interfaz', () => {
    expect(serializeRecall24([{ id: 'temporal', label: 'Cena', hora: '20:00', notas: 'Ligera' }]))
      .toEqual([{ label: 'Cena', hora: '20:00', notas: 'Ligera' }]);
  });
});
