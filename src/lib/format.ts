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
  const num = typeof n === 'string' ? parseFloat(n.toString().replace(',', '.')) : n;
  if (isNaN(num)) return '—';
  return num.toFixed(decimals).replace('.', ',');
};

export const getBadgeForValuation = (val: any) => {
  if (!val) return { text: 'Sin Registro', cls: 'bg-gray-500/10 text-gray-500 border-gray-500/20' };
  
  if (val.estadoFlujo) {
    if (val.estadoFlujo === 'Pendiente de plan') return { text: 'Pendiente de plan', cls: 'bg-rose-500/10 text-rose-500 border-rose-500/20' };
    if (val.estadoFlujo === 'Plan en Proceso') return { text: 'Plan en Proceso', cls: 'bg-amber-500/10 text-amber-500 border-amber-500/20' };
    if (val.estadoFlujo === 'Listo para enviar') return { text: 'Listo para enviar', cls: 'bg-green-500/10 text-green-500 border-green-500/20' };
    if (val.estadoFlujo === 'Enviado') return { text: 'Enviado', cls: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' };
  }
  
  const plan = val.plan;
  const planId = val.planId || plan?.id;
  const estadoEnvio = val.estadoEnvio || plan?.estadoEnvio || 'pendiente';
  const hasBarrido = val.hasBarrido;
  
  if (!hasBarrido && !planId) {
    // Las mediciones y pliegues ya fueron tomadas pero aún no se han asignado las equivalencias.
    return { text: 'Pendiente de plan', cls: 'bg-rose-500/10 text-rose-500 border-rose-500/20' };
  }
  
  if (!planId || (plan && (!plan.menus || plan.menus.length === 0) && estadoEnvio !== 'enviado')) {
    // Las equivalencias ya fueron asignadas, pero aún no se asigna un menú.
    return { text: 'Plan en Proceso', cls: 'bg-amber-500/10 text-amber-500 border-amber-500/20' };
  }
  
  if (estadoEnvio === 'pendiente') {
    // El PDF ya fue configurado, pero aún no se le da click a enviar al paciente.
    return { text: 'Listo para enviar', cls: 'bg-green-500/10 text-green-500 border-green-500/20' };
  }
  
  return { text: 'Enviado', cls: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' };
};
