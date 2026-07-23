import { describe, expect, it } from 'vitest';
import {
  buildBarridoCollection,
  getBarridoVariantes,
  type BarridoVariante,
} from './BarridosEquivalenciasManager';

describe('BarridosEquivalenciasManager helpers', () => {
  it('mantiene un solo barrido para datos históricos', () => {
    const variants = getBarridoVariantes({
      tiempos: [{ id: 'des', nombre: 'Desayuno' }],
      porciones: { frutas: 2 },
      distribucion: { des: { frutas: 2 } },
      kcalTotal: 120,
    });
    expect(variants).toHaveLength(1);
    expect(variants[0].id).toBe('principal');
  });

  it('conserva dos barridos distintos en la colección', () => {
    const variants: BarridoVariante[] = [
      {
        id: 'principal',
        nombre: 'Barrido 1',
        tiempos: [{ id: 'des', nombre: 'Desayuno' }],
        porciones: { frutas: 2 },
        distribucion: { des: { frutas: 2 } },
        kcalTotal: 120,
      },
      {
        id: 'segundo',
        nombre: 'Barrido 2',
        tiempos: [{ id: 'des', nombre: 'Desayuno' }],
        porciones: { cerealSinGr: 4 },
        distribucion: { des: { cerealSinGr: 4 } },
        kcalTotal: 280,
      },
    ];
    const restored = getBarridoVariantes(buildBarridoCollection(variants));
    expect(restored.map(item => item.id)).toEqual(['principal', 'segundo']);
    expect(restored[1].distribucion.des.cerealSinGr).toBe(4);
  });
});
