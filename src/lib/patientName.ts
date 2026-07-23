export function buildPatientFullName(nombre?: string | null, apellido?: string | null): string {
  return [nombre, apellido]
    .map((part) => String(part || '').trim())
    .filter(Boolean)
    .join(' ');
}
