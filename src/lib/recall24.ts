export type Recall24Row = {
  id?: string;
  label: string;
  hora: string;
  notas: string;
};

export const DEFAULT_RECALL_24: Recall24Row[] = [
  { id: 'diet-def-1', label: 'Desayuno', hora: '', notas: '' },
  { id: 'diet-def-2', label: 'Colación', hora: '', notas: '' },
  { id: 'diet-def-3', label: 'Almuerzo', hora: '', notas: '' },
  { id: 'diet-def-4', label: 'Colación', hora: '', notas: '' },
  { id: 'diet-def-5', label: 'Cena', hora: '', notas: '' },
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
      id: row?.id || `diet-row-${index + 1}-${Math.random().toString(36).slice(2, 7)}`,
      label: normalizeMealLabel(row?.label, row?.label === undefined ? DEFAULT_RECALL_24[index]?.label || `Tiempo ${index + 1}` : ''),
      hora: String(row?.hora || ''),
      notas: legacyNotas(row),
    }));
  }

  if (value && typeof value === 'object') {
    const legacy = value as Record<string, any>;
    return [
      { id: 'diet-legacy-1', label: 'Desayuno', ...legacy.desayuno },
      { id: 'diet-legacy-2', label: 'Colación', ...legacy.colacion1 },
      { id: 'diet-legacy-3', label: 'Almuerzo', ...legacy.almuerzo },
      { id: 'diet-legacy-4', label: 'Colación', ...legacy.colacion2 },
      { id: 'diet-legacy-5', label: 'Cena', ...legacy.cena },
    ].map((row) => ({
      id: row.id,
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

export function serializeRecall24(rows: Recall24Row[]): Omit<Recall24Row, 'id'>[] {
  return rows.map(({ label, hora, notas }) => ({ label, hora, notas }));
}

/**
 * Una nueva valoración parte exclusivamente de la Dietética de la última valoración.
 * Para pacientes históricos cuya última valoración todavía no tenga fotografía propia,
 * se usa la Dietética del expediente como compatibilidad inicial.
 */
export function resolveAssessmentDietetica(
  latestAssessment: { dietetica?: unknown } | null | undefined,
  patientDietetica: unknown,
): Recall24Row[] {
  if (Array.isArray(latestAssessment?.dietetica)) {
    return normalizeRecall24(latestAssessment.dietetica);
  }
  return normalizeRecall24(patientDietetica);
}
