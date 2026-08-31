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

  it('para una valoración histórica usa solo los tiempos de su barrido y conserva el orden', () => {
    const rows = resolveAssessmentDietetica(
      {
        dietetica: null,
        barrido: {
          tiempos: [
            { id: 'pre', nombre: 'Pre-entreno' },
            { id: 'des', nombre: 'Desayuno' },
            { id: 'col-1', nombre: 'Colación' },
            { id: 'alm', nombre: 'Almuerzo' },
            { id: 'col-2', nombre: 'Colación' },
            { id: 'cen', nombre: 'Cena' },
          ],
        },
      },
      [
        { label: 'Ante-entreno', hora: '04:00', notas: 'No debe heredarse' },
        { label: 'Post-ante-entreno', hora: '05:00', notas: 'No debe heredarse' },
        { label: 'Pre-entreno', hora: '06:00', notas: 'Pre' },
        { label: 'Colación', hora: '08:00', notas: 'Primera' },
        { label: 'Desayuno', hora: '07:00', notas: 'Desayuno' },
        { label: 'Almuerzo', hora: '13:00', notas: 'Almuerzo' },
        { label: 'Colación', hora: '16:00', notas: 'Segunda' },
        { label: 'Cena', hora: '20:00', notas: 'Cena' },
      ],
    );

    expect(rows.map(({ label, hora }) => ({ label, hora }))).toEqual([
      { label: 'Pre-entreno', hora: '06:00' },
      { label: 'Desayuno', hora: '07:00' },
      { label: 'Colación', hora: '08:00' },
      { label: 'Almuerzo', hora: '13:00' },
      { label: 'Colación', hora: '16:00' },
      { label: 'Cena', hora: '20:00' },
    ]);
  });

  it('usa el expediente como base únicamente cuando todavía no existe una consulta', () => {
    const rows = resolveAssessmentDietetica(
      null,
      [{ label: 'Desayuno', hora: '07:00', notas: 'Base inicial' }],
    );

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ label: 'Desayuno', hora: '07:00', notas: 'Base inicial' });
  });

  it('serializa la fotografía sin IDs temporales de interfaz', () => {
    expect(serializeRecall24([{ id: 'temporal', label: 'Cena', hora: '20:00', notas: 'Ligera' }]))
      .toEqual([{ label: 'Cena', hora: '20:00', notas: 'Ligera' }]);
  });

  it('usa el ajuste de una consulta como base exacta de la siguiente', () => {
    const adjusted = [
      { id: 'ui-1', label: 'Desayuno', hora: '09:00', notas: 'Huevos' },
      { id: 'ui-2', label: 'Cena', hora: '19:30', notas: 'Ligera' },
      { id: 'ui-3', label: 'Colación', hora: '21:00', notas: 'Yogurt' },
    ];
    const savedSnapshot = serializeRecall24(adjusted);
    const nextAssessment = resolveAssessmentDietetica(
      { dietetica: savedSnapshot },
      [{ label: 'Desayuno', hora: '07:00', notas: 'Base antigua' }],
    );

    expect(nextAssessment.map(({ label, hora, notas }) => ({ label, hora, notas })))
      .toEqual(savedSnapshot);
  });
});
