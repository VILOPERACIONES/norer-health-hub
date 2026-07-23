import { describe, expect, it } from 'vitest';
import { buildAvoidFoods } from './avoidFoods';

describe('alimentos a evitar', () => {
  it('combina la consulta y el expediente sin duplicados', () => {
    expect(buildAvoidFoods(
      [{ valor: 'Lácteos' }, { valor: 'Azúcar' }],
      'lácteos\nMariscos',
    )).toEqual(['Lácteos', 'Azúcar', 'Mariscos']);
  });

  it('acepta el formato de texto guardado por la API', () => {
    expect(buildAvoidFoods('Gluten\nNueces', '')).toEqual(['Gluten', 'Nueces']);
  });
});
