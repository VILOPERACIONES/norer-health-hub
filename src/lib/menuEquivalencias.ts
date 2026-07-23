import type { Ingrediente, Menu, TiempoComida } from '@/types';
import { CANONICAL_TO_BARRIDO_KEY } from '@/lib/smaeGroups';

const BARRIDO_LABELS = Object.fromEntries(
  Object.entries(CANONICAL_TO_BARRIDO_KEY).map(([label, key]) => [key, label])
) as Record<string, string>;

const toObject = (value: unknown): Record<string, any> => {
  if (!value) return {};
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  }
  return typeof value === 'object' ? value as Record<string, any> : {};
};

const toArray = (value: unknown): any[] => {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

const equivalenceIngredients = (source: unknown): Ingrediente[] =>
  Object.entries(toObject(source))
    .map(([key, rawValue]) => ({
      key,
      cantidad: Number(String(rawValue).replace(',', '.')),
    }))
    .filter(item => Number.isFinite(item.cantidad) && item.cantidad > 0)
    .map(({ key, cantidad }, index) => ({
      id: `barrido-${key}-${index}`,
      descripcion: `${cantidad} eq ${BARRIDO_LABELS[key] || key}`,
      cantidad: 0,
      unidad: '-',
      eqCantidad: 0,
      eqGrupo: '',
      equivalencias: [],
      platillo: '',
    }));

/**
 * Construye la representación visible de un menú basado en barrido sin alterar
 * los ingredientes persistidos. Los menús normales se devuelven intactos.
 */
export const getMenuTimesForDisplay = (menu: Menu): TiempoComida[] => {
  const persistedTimes = menu.tiempos || menu.tiemposComida || [];
  if (menu.tipoContenido !== 'equivalencias' || !menu.barridoEquivalencias) {
    return persistedTimes;
  }

  const barrido = toObject(menu.barridoEquivalencias);
  const tiempos = toArray(barrido.tiempos);
  const distribucion = toObject(barrido.distribucion);
  const hasDistribution = tiempos.some(time => {
    const id = String(time?.id || time?.nombre || '');
    return equivalenceIngredients(distribucion[id]).length > 0;
  });

  if (!hasDistribution) {
    const ingredients = equivalenceIngredients(barrido.porciones);
    if (ingredients.length === 0) return persistedTimes;
    return [{
      ...(persistedTimes[0] || {}),
      nombre: 'Porciones del día',
      ingredientes: ingredients,
    }];
  }

  return tiempos.map((time, index) => {
    const id = String(time?.id || time?.nombre || `tiempo-${index + 1}`);
    const existing = persistedTimes.find(item => item.barridoTiempoId === id)
      || persistedTimes[index]
      || { nombre: '', ingredientes: [] };
    return {
      ...existing,
      nombre: String(time?.nombre || time?.label || existing.nombre || `Tiempo ${index + 1}`),
      barridoTiempoId: id,
      ingredientes: equivalenceIngredients(distribucion[id]),
    };
  });
};
