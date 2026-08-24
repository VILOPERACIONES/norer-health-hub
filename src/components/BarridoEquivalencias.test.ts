import { describe, expect, it } from 'vitest';
import { normalizeBarridoData, syncTiemposFromHabitos } from './BarridoEquivalencias';

describe('normalizeBarridoData', () => {
  it('convierte colaciones históricas a etiquetas iguales con IDs y datos independientes', () => {
    const result = normalizeBarridoData({
      tiempos: ['Desayuno', 'Colación 1', 'Almuerzo', 'Colación 2'],
      porciones: { frutas: 3 },
      distribucion: {
        'Colación 1': { frutas: 1 },
        'Colación 2': { frutas: 2 },
      },
      kcalTotal: 180,
    });

    const colaciones = result.tiempos.filter(t => t.nombre === 'Colación');
    expect(colaciones).toHaveLength(2);
    expect(colaciones[0].id).not.toBe(colaciones[1].id);
    expect(result.distribucion[colaciones[0].id].frutas).toBe(1);
    expect(result.distribucion[colaciones[1].id].frutas).toBe(2);
  });

  it('conserva IDs estables del formato v2', () => {
    const result = normalizeBarridoData({
      version: 2,
      tiempos: [
        { id: 'colacion-am', nombre: 'Colación' },
        { id: 'colacion-pm', nombre: 'Colación' },
      ],
      porciones: {},
      distribucion: {
        'colacion-am': { frutas: 1 },
        'colacion-pm': { frutas: 2 },
      },
      kcalTotal: 0,
    });

    expect(result.tiempos.map(t => t.id)).toEqual(['colacion-am', 'colacion-pm']);
  });
});

describe('syncTiemposFromHabitos', () => {
  it('reemplaza tiempos de consultas anteriores y conserva los coincidentes de la consulta actual', () => {
    const result = syncTiemposFromHabitos(
      [
        { id: 'desayuno-previo', nombre: 'Desayuno' },
        { id: 'colacion-vieja', nombre: 'Colación' },
        { id: 'cena-previa', nombre: 'Cena' },
      ],
      [
        { label: 'Desayuno', hora: '08:00', notas: '' },
        { label: 'Post-entreno', hora: '11:00', notas: '' },
      ],
    );

    expect(result.map(({ nombre }) => nombre)).toEqual(['Desayuno', 'Post-entreno']);
    expect(result[0].id).toBe('desayuno-previo');
    expect(result.some(({ id }) => id === 'colacion-vieja' || id === 'cena-previa')).toBe(false);
  });
});
