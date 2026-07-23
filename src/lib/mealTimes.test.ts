import { describe, expect, it } from 'vitest';
import { formatMealTimeName } from './mealTimes';

describe('formatMealTimeName', () => {
  it.each([
    ['COLACIÓN', 'Colación'],
    ['COLACION 2', 'Colación 2'],
    ['PRE ENTRENO', 'Pre-entreno'],
    ['POST-ENTRENO', 'Post-entreno'],
    ['DESAYUNO', 'Desayuno'],
  ])('convierte %s a %s', (input, expected) => {
    expect(formatMealTimeName(input)).toBe(expected);
  });

  it('conserva nombres personalizados', () => {
    expect(formatMealTimeName('Snack AM')).toBe('Snack AM');
  });
});
