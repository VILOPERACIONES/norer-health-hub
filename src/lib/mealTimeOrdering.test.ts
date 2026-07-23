import { describe, expect, it } from 'vitest';
import type { Menu, TiempoComida } from '@/types';
import {
  appendMealTimeToMenus,
  removeMealTimeFromMenus,
  reorderMealTimes,
  restoreMealTimeToMenus,
} from './mealTimeOrdering';

const tiempo = (nombre: string, alimento: string): TiempoComida => ({
  nombre,
  ingredientes: [{ descripcion: alimento, cantidad: 1, unidad: 'PZA' }],
});

const menusFixture = (): Menu[] => [
  { nombre: 'Menú 1', tiempos: [tiempo('Desayuno', 'Huevo'), tiempo('Colación', 'Manzana'), tiempo('Colación', 'Yogur')] },
  { nombre: 'Menú 2', tiempos: [tiempo('Desayuno', 'Avena'), tiempo('Colación', 'Pera'), tiempo('Colación', 'Nueces')] },
];

describe('mealTimeOrdering', () => {
  it('reordena por posición en todos los menús sin confundir nombres repetidos', () => {
    const result = reorderMealTimes(menusFixture(), 2, 0);

    expect(result[0].tiempos.map((item) => item.ingredientes[0].descripcion)).toEqual(['Yogur', 'Huevo', 'Manzana']);
    expect(result[1].tiempos.map((item) => item.ingredientes[0].descripcion)).toEqual(['Nueces', 'Avena', 'Pera']);
  });

  it('elimina y recupera el mismo tiempo con todos sus alimentos', () => {
    const deleted = removeMealTimeFromMenus(menusFixture(), 1);
    expect(deleted.menus.every((menu) => menu.tiempos.length === 2)).toBe(true);
    expect(deleted.removed?.label).toBe('Colación');

    const restored = restoreMealTimeToMenus(deleted.menus, deleted.removed!);
    expect(restored[0].tiempos[2].ingredientes[0].descripcion).toBe('Manzana');
    expect(restored[1].tiempos[2].ingredientes[0].descripcion).toBe('Pera');
  });

  it('crea el tiempo nuevo alineado en todos los menús', () => {
    const result = appendMealTimeToMenus(menusFixture(), 'Nuevo tiempo', 'tiempo-nuevo');
    expect(result.every((menu) => menu.tiempos.at(-1)?.nombre === 'Nuevo tiempo')).toBe(true);
    expect(result.every((menu) => menu.tiempos.at(-1)?.barridoTiempoId === 'tiempo-nuevo')).toBe(true);
  });
});
