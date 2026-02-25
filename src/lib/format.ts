const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export const formatDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '—';
  // Parche Timezone: si trae formato ISO, centrar a medio día (12:00) 
  // para evitar restar días en zonas horarias negativas como UTM-6.
  const cleanStr = dateStr.includes('T') ? dateStr.split('T')[0] + 'T12:00:00' : dateStr;
  const d = new Date(cleanStr);
  if (isNaN(d.getTime())) return '—';
  return `${d.getDate()} de ${MONTHS[d.getMonth()]} de ${d.getFullYear()}`;
};

export const formatDateShort = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '—';
  const cleanStr = dateStr.includes('T') ? dateStr.split('T')[0] + 'T12:00:00' : dateStr;
  const d = new Date(cleanStr);
  if (isNaN(d.getTime())) return '—';
  return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`;
};

export const formatDecimal = (n: number | string | null | undefined, decimals = 2): string => {
  if (n == null || n === '') return '—';
  const num = typeof n === 'string' ? parseFloat(n) : n;
  if (isNaN(num)) return '—';
  return num.toFixed(decimals).replace('.', ',');
};
