type AvoidFoodEntry = string | { valor?: unknown };

export function buildAvoidFoods(consultationValue: unknown, patientValue: unknown): string[] {
  const consultationEntries: AvoidFoodEntry[] = Array.isArray(consultationValue)
    ? consultationValue
    : typeof consultationValue === 'string'
      ? consultationValue.split(/\r?\n/)
      : [];

  const patientEntries = typeof patientValue === 'string'
    ? patientValue.split(/\r?\n/)
    : [];

  const values = [...consultationEntries, ...patientEntries]
    .map((entry) => typeof entry === 'string' ? entry : String(entry?.valor || ''))
    .map((entry) => entry.trim())
    .filter(Boolean);

  return values.filter((entry, index) =>
    values.findIndex((candidate) => candidate.toLocaleLowerCase('es-MX') === entry.toLocaleLowerCase('es-MX')) === index
  );
}
