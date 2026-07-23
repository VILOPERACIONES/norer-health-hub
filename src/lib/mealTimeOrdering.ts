import type { Menu, TiempoComida } from '@/types';

export type RemovedMealTime = {
  index: number;
  label: string;
  tiempos: Array<TiempoComida | null>;
};

export const createEmptyMealTime = (nombre: string, barridoTiempoId?: string): TiempoComida => ({
  barridoTiempoId,
  nombre,
  ingredientes: [],
  nota: '',
  bebida: '',
  suplTiempo: '',
  suplNotas: '',
  ademas: '',
});

export const reorderMealTimes = (menus: Menu[], fromIndex: number, toIndex: number): Menu[] => {
  if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return menus;

  return menus.map((menu) => {
    if (fromIndex >= menu.tiempos.length || toIndex >= menu.tiempos.length) return menu;
    const tiempos = [...menu.tiempos];
    const [moved] = tiempos.splice(fromIndex, 1);
    tiempos.splice(toIndex, 0, moved);
    return { ...menu, tiempos };
  });
};

export const removeMealTimeFromMenus = (
  menus: Menu[],
  index: number,
): { menus: Menu[]; removed: RemovedMealTime | null } => {
  const tiempos = menus.map((menu) => menu.tiempos[index] ?? null);
  const firstRemoved = tiempos.find((tiempo): tiempo is TiempoComida => tiempo !== null);
  if (!firstRemoved) return { menus, removed: null };

  return {
    menus: menus.map((menu) => ({
      ...menu,
      tiempos: menu.tiempos.filter((_, tiempoIndex) => tiempoIndex !== index),
    })),
    removed: { index, label: firstRemoved.nombre, tiempos },
  };
};

export const restoreMealTimeToMenus = (menus: Menu[], removed: RemovedMealTime): Menu[] =>
  menus.map((menu, menuIndex) => ({
    ...menu,
    // Se recupera al final para que sea evidente; después puede arrastrarse a cualquier posición.
    tiempos: [
      ...menu.tiempos,
      removed.tiempos[menuIndex] ?? createEmptyMealTime(removed.label),
    ],
  }));

export const appendMealTimeToMenus = (menus: Menu[], nombre: string, barridoTiempoId?: string): Menu[] =>
  menus.map((menu) => ({
    ...menu,
    tiempos: [...menu.tiempos, createEmptyMealTime(nombre, barridoTiempoId)],
  }));
