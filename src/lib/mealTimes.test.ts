import { describe, expect, it } from 'vitest';
import { formatMealTimeName } from './mealTimes';

describe('formatMealTimeName', () => {
  it.each([
    ['COLACIÓN', 'COLACIÓN'],
    ['COLACION 2', 'COLACIÓN 2'],
    ['PRE ENTRENO', 'PRE-ENTRENO'],
    ['POST-ENTRENO', 'POST-ENTRENO'],
    ['DESAYUNO', 'DESAYUNO'],
  ])('convierte %s a %s', (input, expected) => {
    expect(formatMealTimeName(input)).toBe(expected);
  });

  it('formatea nombres personalizados a mayúsculas conservando acentos', () => {
    expect(formatMealTimeName('Snack AM')).toBe('SNACK AM');
  });
});
