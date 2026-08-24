export type Recall24Row = {
  label: string;
  hora: string;
  notas: string;
};

export const DEFAULT_RECALL_24: Recall24Row[] = [
  { label: 'Desayuno', hora: '', notas: '' },
  { label: 'Colación', hora: '', notas: '' },
  { label: 'Almuerzo', hora: '', notas: '' },
  { label: 'Colación', hora: '', notas: '' },
  { label: 'Cena', hora: '', notas: '' },
];

// Combina los campos legacy "ayer"/"usualmente" en una sola nota para no perder datos ya capturados.
function legacyNotas(row: Record<string, any> | undefined): string {
  if (!row) return '';
  if (row.notas) return String(row.notas);
  return [row.ayer, row.usualmente].filter(Boolean).join(' / ');
}

// Normaliza etiquetas antiguas (ej. 'Comida' -> 'Almuerzo'), respetando etiquetas vacías
function normalizeMealLabel(label: unknown, fallback?: string): string {
  if (label === undefined || label === null) return fallback ?? '';
  const raw = String(label);
  if (raw.trim().toLowerCase() === 'comida') return 'Almuerzo';
  return raw;
}

export function normalizeRecall24(value: unknown): Recall24Row[] {
  if (Array.isArray(value)) {
    return value.map((row, index) => ({
      label: normalizeMealLabel(row?.label, row?.label === undefined ? DEFAULT_RECALL_24[index]?.label || `Tiempo ${index + 1}` : ''),
      hora: String(row?.hora || ''),
      notas: legacyNotas(row),
    }));
  }

  if (value && typeof value === 'object') {
    const legacy = value as Record<string, any>;
    return [
      { label: 'Desayuno', ...legacy.desayuno },
      { label: 'Colación', ...legacy.colacion1 },
      { label: 'Almuerzo', ...legacy.almuerzo },
      { label: 'Colación', ...legacy.colacion2 },
      { label: 'Cena', ...legacy.cena },
    ].map((row) => ({
      label: normalizeMealLabel(row.label, 'Tiempo'),
      hora: String(row.hora || ''),
      notas: legacyNotas(row),
    }));
  }

  return DEFAULT_RECALL_24.map((row) => ({ ...row }));
}

export function hasRecall24Data(rows: Recall24Row[]): boolean {
  return rows.some((row) => Boolean(row.hora || row.notas));
}
