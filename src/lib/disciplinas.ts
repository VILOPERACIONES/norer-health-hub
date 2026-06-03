export interface DisciplinaItem {
  disciplina: string;
  frecuencia: string;
  tiempo: string;
}

export const encodeDisciplinas = (arr: DisciplinaItem[]): { disciplina: string; frecuencia: string; tiempo: string } => {
  const clean = arr.filter(d => d.disciplina || d.frecuencia || d.tiempo);
  if (clean.length === 0) return { disciplina: '', frecuencia: '', tiempo: '' };
  if (clean.length === 1) return { disciplina: clean[0].disciplina, frecuencia: clean[0].frecuencia, tiempo: clean[0].tiempo };
  return {
    disciplina: JSON.stringify(clean),
    frecuencia: clean[0].frecuencia,
    tiempo: clean[0].tiempo,
  };
};

export const decodeDisciplinas = (raw: string | undefined | null, fallback: { frecuencia?: string; tiempo?: string }): DisciplinaItem[] => {
  if (typeof raw === 'string' && raw.trim().startsWith('[')) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((p: any) => ({
          disciplina: p.disciplina || '',
          frecuencia: p.frecuencia || '',
          tiempo: p.tiempo || '',
        }));
      }
    } catch {
      // fall through
    }
  }
  return [{ disciplina: raw || '', frecuencia: fallback.frecuencia || '', tiempo: fallback.tiempo || '' }];
};

export const formatDisciplinasForDisplay = (raw: string | undefined | null, fallback: { frecuencia?: string; tiempo?: string }): string => {
  const arr = decodeDisciplinas(raw, fallback);
  if (arr.length === 0 || (arr.length === 1 && !arr[0].disciplina)) return 'N/A';
  return arr.map(d => {
    const parts = [d.disciplina].filter(Boolean);
    if (d.frecuencia) parts.push(d.frecuencia);
    if (d.tiempo) parts.push(d.tiempo);
    return parts.join(' · ');
  }).join('  |  ');
};
