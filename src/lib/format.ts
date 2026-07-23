import { getMexicoCityDateTimeParts } from './dateTime';

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export const formatDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '—';
  // Si trae "T00:00:00.000Z" (fecha pura de BD) o no trae "T" ni "Z" (YYYY-MM-DD),
  // le forzamos UTC o medio día para que no se atrase un día en UTC-6.
  // Pero si trae una hora real (ej: citas de Cal.com con T15:00:00.000Z), lo dejamos convertir a hora local.
  let isDateOnly = false;
  if (!dateStr.includes('T') || dateStr.includes('T00:00:00.000Z')) isDateOnly = true;

  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';

  // Si era solo fecha, forzamos usar los métodos UTC para ignorar el desfase local y mostrar la fecha exacta pactada
  if (isDateOnly) {
    return `${d.getUTCDate()} de ${MONTHS[d.getUTCMonth()]} de ${d.getUTCFullYear()}`;
  }

  const mexicoParts = getMexicoCityDateTimeParts(d);
  if (!mexicoParts) return '—';
  const [year, month, day] = mexicoParts.date.split('-').map(Number);
  return `${day} de ${MONTHS[month - 1]} de ${year}`;
};

export const formatDateShort = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '—';
  let isDateOnly = false;
  if (!dateStr.includes('T') || dateStr.includes('T00:00:00.000Z')) isDateOnly = true;

  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';

  if (isDateOnly) {
    return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()].slice(0, 3)}`;
  }

  const mexicoParts = getMexicoCityDateTimeParts(d);
  if (!mexicoParts) return '—';
  const [, month, day] = mexicoParts.date.split('-').map(Number);
  return `${day} ${MONTHS[month - 1].slice(0, 3)}`;
};

export const formatDecimal = (n: number | string | null | undefined, decimals = 2): string => {
  if (n == null || n === '') return '—';
  const num = typeof n === 'string' ? parseFloat(n.toString().replace(',', '.')) : n;
  if (isNaN(num)) return '—';
  return num.toFixed(decimals).replace('.', ',');
};

export const getBadgeForValuation = (val: any) => {
  if (!val) return { text: 'Sin Registro', cls: 'bg-gray-500/10 text-gray-500 border-gray-500/20' };

  if (val.estadoFlujo) {
    if (val.estadoFlujo === 'Pendiente de plan') return { text: 'Pendiente de menú', cls: 'bg-rose-500/10 text-rose-500 border-rose-500/20' };
    if (val.estadoFlujo === 'Plan en Proceso') return { text: 'Menú en Proceso', cls: 'bg-amber-500/10 text-amber-500 border-amber-500/20' };
    if (val.estadoFlujo === 'Listo para enviar') return { text: 'Menú Listo', cls: 'bg-sky-500/10 text-sky-400 border-sky-500/20' };
    if (val.estadoFlujo === 'Enviado') return { text: 'Enviado', cls: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' };
  }

  const plan = val.plan;
  const planId = val.planId || plan?.id;
  const estadoEnvio = val.estadoEnvio || plan?.estadoEnvio || 'pendiente';
  const hasBarrido = val.hasBarrido;

  if (!hasBarrido && !planId) {
    return { text: 'Pendiente de menú', cls: 'bg-rose-500/10 text-rose-500 border-rose-500/20' };
  }

  // Plan asignado pero sin menús completos → aún en proceso
  if (!planId || (plan && (!plan.menus || plan.menus.length === 0) && estadoEnvio !== 'enviado')) {
    return { text: 'Menú en Proceso', cls: 'bg-amber-500/10 text-amber-500 border-amber-500/20' };
  }

  if (estadoEnvio === 'pendiente') {
    // Plan terminado y guardado, falta enviar
    return { text: 'Menú Listo', cls: 'bg-sky-500/10 text-sky-400 border-sky-500/20' };
  }

  return { text: 'Enviado', cls: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' };
};

