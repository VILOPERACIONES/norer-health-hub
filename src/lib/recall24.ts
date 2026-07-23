export type Recall24Row = {
  label: string;
  hora: string;
  ayer: string;
  usualmente: string;
};

export const DEFAULT_RECALL_24: Recall24Row[] = [
  { label: 'Desayuno', hora: '', ayer: '', usualmente: '' },
  { label: 'Colación', hora: '', ayer: '', usualmente: '' },
  { label: 'Comida', hora: '', ayer: '', usualmente: '' },
  { label: 'Colación', hora: '', ayer: '', usualmente: '' },
  { label: 'Cena', hora: '', ayer: '', usualmente: '' },
];

export function normalizeRecall24(value: unknown): Recall24Row[] {
  if (Array.isArray(value)) {
    return value.map((row, index) => ({
      label: String(row?.label || DEFAULT_RECALL_24[index]?.label || `Tiempo ${index + 1}`),
      hora: String(row?.hora || ''),
      ayer: String(row?.ayer || ''),
      usualmente: String(row?.usualmente || ''),
    }));
  }

  if (value && typeof value === 'object') {
    const legacy = value as Record<string, any>;
    return [
      { label: 'Desayuno', ...legacy.desayuno },
      { label: 'Colación', ...legacy.colacion1 },
      { label: 'Comida', ...legacy.almuerzo },
      { label: 'Colación', ...legacy.colacion2 },
      { label: 'Cena', ...legacy.cena },
    ].map((row) => ({
      label: String(row.label || ''),
      hora: String(row.hora || ''),
      ayer: String(row.ayer || ''),
      usualmente: String(row.usualmente || ''),
    }));
  }

  return DEFAULT_RECALL_24.map((row) => ({ ...row }));
}

export function hasRecall24Data(rows: Recall24Row[]): boolean {
  return rows.some((row) => Boolean(row.hora || row.ayer || row.usualmente));
}
