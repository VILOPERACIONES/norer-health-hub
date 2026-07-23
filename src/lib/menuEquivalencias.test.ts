import { describe, expect, it } from 'vitest';
import { getMenuTimesForDisplay } from './menuEquivalencias';

describe('getMenuTimesForDisplay', () => {
  it('muestra el barrido por tiempo para un menú de equivalencias', () => {
    const times = getMenuTimesForDisplay({
      nombre: 'Menú 1',
      tipoContenido: 'equivalencias',
      barridoEquivalencias: {
        tiempos: [{ id: 'des', nombre: 'Desayuno' }],
        porciones: { frutas: 2 },
        distribucion: { des: { frutas: 2, cerealSinGr: 3 } },
      },
      tiempos: [{ nombre: 'Desayuno', barridoTiempoId: 'des', ingredientes: [] }],
    });

    expect(times[0].ingredientes.map(item => item.descripcion)).toEqual([
      '2 eq Frutas',
      '3 eq Cereal s/grasa',
    ]);
  });

  it('no cambia un menú normal', () => {
    const menu = {
      nombre: 'Menú 1',
      tipoContenido: 'platillos' as const,
      tiempos: [{ nombre: 'Desayuno', ingredientes: [{ descripcion: 'Huevos', cantidad: 2, unidad: 'pz' }] }],
    };
    expect(getMenuTimesForDisplay(menu)).toBe(menu.tiempos);
  });
});
