const MEAL_TIME_NAMES: Record<string, string> = {
  desayuno: 'Desayuno',
  colacion: 'Colación',
  almuerzo: 'Almuerzo',
  comida: 'Comida',
  cena: 'Cena',
  'pre entreno': 'Pre-entreno',
  'pre-entreno': 'Pre-entreno',
  'post entreno': 'Post-entreno',
  'post-entreno': 'Post-entreno',
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

  return MEAL_TIME_NAMES[base] ? `${MEAL_TIME_NAMES[base]}${suffix}` : original;
};
