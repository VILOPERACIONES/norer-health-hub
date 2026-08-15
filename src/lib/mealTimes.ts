const MEAL_TIME_NAMES: Record<string, string> = {
  desayuno: 'DESAYUNO',
  colacion: 'COLACIÓN',
  almuerzo: 'ALMUERZO',
  comida: 'COMIDA',
  cena: 'CENA',
  snack: 'SNACK',
  merienda: 'MERIENDA',
  colaciones: 'COLACIONES',
  'pre entreno': 'PRE-ENTRENO',
  'pre-entreno': 'PRE-ENTRENO',
  'post entreno': 'POST-ENTRENO',
  'post-entreno': 'POST-ENTRENO',
};

export const formatMealTimeName = (value: unknown): string => {
  const original = String(value ?? '').trim();
  if (!original) return '';

  const normalized = original
    .toLocaleLowerCase('es-MX')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  const suffixMatch = normalized.match(/^(.*?)(\s+\d+)$/);
  const base = suffixMatch?.[1] ?? normalized;
  const suffix = suffixMatch?.[2] ?? '';

  if (MEAL_TIME_NAMES[base]) {
    return `${MEAL_TIME_NAMES[base]}${suffix}`;
  }

  return original.toUpperCase();
};
