import { describe, expect, it } from 'vitest';
import {
  getAmountPerEquivalent,
  scaleIngredientEquivalences,
  scaleIngredientToPrimaryEquivalent,
} from './smaeScaling';

describe('SMAE scaling', () => {
  it('derives the unit anchor from the complete reference portion', () => {
    expect(getAmountPerEquivalent(150, 5)).toBe(30);
  });

  it('converts 8 chicken equivalents to 240 g when 150 g equals 5 equivalents', () => {
    const scaled = scaleIngredientToPrimaryEquivalent({
      descripcion: 'Pechuga de pollo',
      cantidad: 150,
      unidad: 'GR',
      eqCantidad: 5,
      eqGrupo: 'AOA Muy Bajo',
      equivalencias: [{ cantidad: 5, grupo: 'AOA Muy Bajo' }],
      smaeGrPorEq: 30,
    }, 8);

    expect(scaled.cantidad).toBe(240);
    expect(scaled.eqCantidad).toBe(8);
    expect(scaled.equivalencias).toEqual([{ cantidad: 8, grupo: 'AOA Muy Bajo' }]);
  });

  it('scales secondary groups and practical measures with the same proportion', () => {
    const scaled = scaleIngredientEquivalences({
      descripcion: 'Preparación mixta',
      cantidad: 1,
      unidad: 'TAZA',
      eqCantidad: 2,
      eqGrupo: 'Cereal s/grasa',
      equivalencias: [
        { cantidad: 2, grupo: 'Cereal s/grasa' },
        { cantidad: 1, grupo: 'Grasa s/prot' },
      ],
    }, 1.5);

    expect(scaled.cantidad).toBe(1.5);
    expect(scaled.equivalencias).toEqual([
      { cantidad: 3, grupo: 'Cereal s/grasa' },
      { cantidad: 1.5, grupo: 'Grasa s/prot' },
    ]);
  });
});
