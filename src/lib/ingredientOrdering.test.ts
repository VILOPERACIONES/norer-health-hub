import { describe, expect, it } from 'vitest';
import type { Ingrediente } from '@/types';
import { reorderDishGroups, reorderIngredientWithinDish } from './ingredientOrdering';

const item = (descripcion: string, platillo: string): Ingrediente => ({ descripcion, platillo, cantidad: 1, unidad: 'PZA' });

describe('ingredientOrdering', () => {
  it('mueve el platillo completo sin separar sus ingredientes', () => {
    const result = reorderDishGroups([item('Pan', 'Sándwich'), item('Pollo', 'Sándwich'), item('Leche', 'Licuado')], 1, 0);
    expect(result.map((i) => i.descripcion)).toEqual(['Leche', 'Pan', 'Pollo']);
  });

  it('reordena ingredientes únicamente dentro del mismo platillo', () => {
    const source = [item('Pan', 'Sándwich'), item('Pollo', 'Sándwich'), item('Leche', 'Licuado')];
    expect(reorderIngredientWithinDish(source, 1, 0).map((i) => i.descripcion)).toEqual(['Pollo', 'Pan', 'Leche']);
    expect(reorderIngredientWithinDish(source, 0, 2)).toBe(source);
  });
});
