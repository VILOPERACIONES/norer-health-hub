import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowLeft, Edit2, FileText, Send, Lock, Trash2, Clock, Settings2 } from 'lucide-react';
import api from '@/lib/api';
import type { Plan } from '@/types';
import { PDFPreviewModal } from '@/components/PDFPreviewModal';
import { formatDate, formatDecimal } from '@/lib/format';
import { useToast } from '@/hooks/use-toast';

export const PlanEnvioForm = ({ pacienteId: propPacienteId, planId: propPlanId, onFinish }: { pacienteId?: string, planId?: string, onFinish?: () => void }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const pacienteId = propPacienteId;
  const planId = propPlanId;
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [pacienteNombre, setPacienteNombre] = useState('');

  useEffect(() => {
    const fetch = async () => {
      try {
        // Cargar plan y paciente en paralelo
        const [planRes, pacRes] = await Promise.all([
          api.get(`/api/pacientes/${pacienteId}/planes/${planId}`),
          api.get(`/api/pacientes/${pacienteId}`).catch(() => null),
        ]);
        let serverData = planRes.data?.data || planRes.data;
        if (serverData) {
          serverData.menus = serverData.menus?.map((m: any) => ({
            ...m,
            tiempos: (m.tiemposComida || m.tiempos || []).map((t: any) => ({
              ...t,
              nota: t.nota || t.notaPie || '',
              ingredientes: (t.ingredientes || []).map((i: any) => ({
                ...i,
                cantidad: parseFloat(i.cantidad) || i.cantidad,
                eqCantidad: parseFloat(i.eqCantidad) || i.eqCantidad
              }))
            }))
          })) || [];
          setPlan(serverData);
        }
        if (pacRes) {
          const p = pacRes.data?.data || pacRes.data;
          if (p) setPacienteNombre(`${p.nombre || ''} ${p.apellido || ''}`.trim());
        }
      } catch (err) {
        console.error('Error cargando plan:', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [pacienteId, planId]);

  const [showConfig, setShowConfig] = useState(false);
  const [savingMeta, setSavingMeta] = useState(false);

  const handleSaveMeta = async (meta: any) => {
    setSavingMeta(true);
    try {
      await api.put(`/api/planes/${planId}/pdf-meta`, meta);
      setPlan(prev => prev ? { ...prev, pdfCustomMeta: meta } as Plan : prev);
      toast({ title: 'Configuración PDF guardada', description: 'Los ajustes se aplicarán al generar o enviar.' });
      setShowConfig(false);
    } catch (err) {
      toast({ title: 'Error', description: 'No se pudo guardar la configuración.', variant: 'destructive' });
    } finally {
      setSavingMeta(false);
    }
  };

  const handlePdf = async () => {
    try {
      toast({ title: 'Generando Reporte', description: 'Componiendo estructura maestra en PDF...' });
      const res = await api.get(`/api/planes/${planId}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Plan_${plan?.pacienteId}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast({ title: 'PDF DESCARGADO', description: 'El reporte se ha generado correctamente.' });
    } catch (err) {
      toast({ title: 'Error de Generación', description: 'No se pudo generar el reporte PDF', variant: 'destructive' });
    }
  };

  const [sending, setSending] = useState(false);

  const handleEnviar = async () => {
    if (!window.confirm('¿Enviar este plan al paciente por correo y WhatsApp?')) return;
    setSending(true);
    try {
      const { data } = await api.post(`/api/planes/${planId}/enviar`);
      const resultado = data?.data || data;
      const emailOk    = resultado?.email    === 'ok';
      const whatsappOk = resultado?.whatsapp === 'ok';
      const ambosOk    = emailOk && whatsappOk;
      const ambosErr   = !emailOk && !whatsappOk;

      let title = 'Plan enviado';
      let description = '';

      if (ambosOk) {
        title = 'Plan enviado correctamente';
        description = 'Correo y WhatsApp entregados al paciente.';
      } else if (ambosErr) {
        title = 'Enviado con advertencias';
        description = 'El plan se marcó como enviado, pero tanto el correo como WhatsApp fallaron. Verifica la configuración.';
      } else {
        const ok  = emailOk ? 'Correo ✓' : 'WhatsApp ✓';
        const err = emailOk ? 'WhatsApp ✗' : 'Correo ✗';
        description = `${ok} entregado. ${err} falló — verifica la configuración.`;
      }

      toast({ title, description });
      setPlan((prev) => prev ? { ...prev, estadoEnvio: 'enviado' } as Plan : prev);
    } catch (err: any) {
      toast({
        title: 'Error al enviar',
        description: err.response?.data?.message || 'No se pudo enviar el plan. Verifica la configuración de correo y WhatsApp.',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  if (loading) return (
    <div className="h-[80vh] flex flex-col items-center justify-center gap-6 animate-pulse">
      <div className="w-8 h-8 rounded-full border-2 border-black/20 border-t-black dark:border-white/20 dark:border-t-white animate-spin" />
      <p className="text-[14px] font-medium text-[#8a8a8a]">Sincronizando plan...</p>
    </div>
  );
  
  if (!plan) return (
     <div className="h-[80vh] flex flex-col items-center justify-center gap-6">
      <p className="text-[16px] font-medium text-[#8a8a8a]">Plan alimenticio no localizado</p>
      <button onClick={() => onFinish ? onFinish() : navigate(`/pacientes/${pacienteId}`)} className="text-[14px] font-medium text-white hover:text-[#c0c0c0] transition-colors underline underline-offset-4">Volver al expediente</button>
    </div>
  );

  return (
    <div className="space-y-10 animate-fade-in max-w-none pb-24">
      <div className="flex flex-col gap-6 pt-6">
        {(!onFinish || onFinish) && (
          <button onClick={() => onFinish ? onFinish() : navigate(`/pacientes/${pacienteId}`)} className="flex items-center gap-2 text-[14px] font-medium text-[#c0c0c0] hover:text-white transition-colors w-fit group">
            <ArrowLeft className="h-[18px] w-[18px] group-hover:-translate-x-1 transition-transform" /> {onFinish ? 'Finalizar Plan y Salir' : 'Volver al expediente'}
          </button>
        )}
        
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 animate-slide-up">
           <div className="space-y-0.5">
              {/* Nombre del Paciente como título principal */}
              {pacienteNombre && (
                <h1 className="text-[26px] font-bold text-white m-0 tracking-tight">
                  {pacienteNombre}
                </h1>
              )}
              <p className="text-[#8a8a8a] font-medium text-[13px] m-0 uppercase tracking-widest">
                Plan alimenticio &mdash; {plan.tipoPlan || plan.tipo}
              </p>
           </div>
           
           <div className="flex flex-wrap gap-3">
              <button
                onClick={() => navigate(`/pacientes/${pacienteId}/planes/${planId}/editar`)}
                className="flex items-center gap-2 px-[18px] py-[10px] bg-[#181818] text-white border border-[#2a2a2a] rounded-[8px] text-[14px] font-medium transition-colors hover:bg-[#222]"
              >
                <Edit2 className="h-[18px] w-[18px]" /> Editar
              </button>
              <button
                onClick={() => setShowConfig(true)}
                className="flex items-center gap-2 px-[18px] py-[10px] bg-[#111111] text-white border border-[#2a2a2a] rounded-[8px] text-[14px] font-medium transition-colors hover:bg-[#181818]"
              >
                <Settings2 className="h-[18px] w-[18px]" /> Configurar PDF
              </button>
              <button
                onClick={handlePdf}
                className="flex items-center gap-2 px-[18px] py-[10px] bg-[#111111] text-white border border-[#2a2a2a] rounded-[8px] text-[14px] font-medium transition-colors hover:bg-[#181818]"
              >
                <FileText className="h-[18px] w-[18px]" /> Descargar
              </button>
              <button
                onClick={handleEnviar}
                disabled={sending}
                className="flex items-center gap-2 px-[18px] py-[10px] bg-[#1a2e1a] text-accent-green border border-accent-green/20 rounded-[8px] text-[14px] font-medium transition-colors hover:bg-accent-green hover:text-[#000] disabled:opacity-50"
              >
                {sending ? (
                  <div className="w-[18px] h-[18px] border-2 border-white/20 border-t-white dark:border-black/20 dark:border-t-black rounded-full animate-spin" />
                ) : (
                  <Send className="h-[18px] w-[18px]" />
                )}
                {sending ? 'Enviando...' : 'Enviar al paciente'}
              </button>
           </div>
        </div>
      </div>

      <div className="bg-[#111111] border border-[#2a2a2a] p-6 rounded-[12px] animate-slide-up">
         <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="space-y-1">
               <p className="text-[12px] font-medium text-[#8a8a8a] m-0">Calorías Diarias</p>
               <p className="text-[22px] font-bold text-white m-0">{plan.calorias}<span className="text-[14px] font-medium text-[#c0c0c0] ml-1">Kcal</span></p>
            </div>
            <div className="space-y-1">
               <p className="text-[12px] font-medium text-[#8a8a8a] m-0">Proteínas</p>
               <p className="text-[22px] font-bold text-white m-0">{plan.proteinasPct}<span className="text-[14px] font-medium text-[#c0c0c0] ml-1">%</span></p>
            </div>
            <div className="space-y-1">
               <p className="text-[12px] font-medium text-[#8a8a8a] m-0">Carbohidratos</p>
               <p className="text-[22px] font-bold text-white m-0">{plan.carbohidratosPct}<span className="text-[14px] font-medium text-[#c0c0c0] ml-1">%</span></p>
            </div>
            <div className="space-y-1">
               <p className="text-[12px] font-medium text-[#8a8a8a] m-0">Lípidos</p>
               <p className="text-[22px] font-bold text-white m-0">{plan.grasasPct}<span className="text-[14px] font-medium text-[#c0c0c0] ml-1">%</span></p>
            </div>
         </div>
      </div>

      {(plan.notasGenerales || plan.notas) && (
        <div className="bg-[#181818] p-6 rounded-[12px] border border-[#2a2a2a]">
           <div className="flex items-center gap-2 mb-3 text-[#c0c0c0]">
             <FileText className="w-[18px] h-[18px] text-white" />
             <h3 className="text-[16px] font-semibold text-white m-0">Recomendaciones Generales</h3>
           </div>
          <p className="text-[14px] font-normal leading-relaxed text-[#c0c0c0] m-0">{plan.notasGenerales || plan.notas}</p>
        </div>
      )}

      {/* Menus Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {plan.menus.map((menu, i) => (
          <div key={i} className="bg-[#111111] border border-[#2a2a2a] p-6 rounded-[12px] flex flex-col h-full hover:border-[#444] transition-colors">
            <div className="flex items-center gap-3 mb-6 border-b border-[#2a2a2a] pb-4">
              <div className="w-1.5 h-5 bg-brand-primary rounded-full" />
              <h3 className="text-[18px] font-semibold text-white m-0">{menu.nombre}</h3>
            </div>
            
            <div className="space-y-6 flex-1">
              {menu.tiempos.map((t, j) => (
                <div key={j} className="group/tiempo p-4 bg-[#181818] rounded-[8px] border border-[#2a2a2a]">
                  <div className="flex items-center gap-2 mb-4">
                     <Clock className="w-4 h-4 text-[#8a8a8a]" />
                     <span className="text-[14px] font-semibold text-white m-0">{t.nombre}</span>
                  </div>
                   <ul className="space-y-3">
                     {t.ingredientes.map((ing, k) => (
                       <li key={k} className="flex flex-col gap-1">
                          <div className="flex items-start gap-2">
                             <div className="mt-1.5 min-w-[6px] h-[6px] rounded-full bg-text-muted" />
                             <span className="text-[14px] font-medium text-[#c0c0c0] m-0 leading-tight">
                                {ing.cantidad} {ing.unidad} <span className="text-white">{ing.descripcion}</span>
                             </span>
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 ml-[14px]">
                             {ing.eqCantidad && (
                                <p className="text-[12px] font-medium text-[#8a8a8a] m-0">
                                   Eq: {ing.eqCantidad} {ing.eqGrupo}
                                 </p>
                             )}
                             {ing.nota && (
                                <p className="text-[12px] font-normal italic text-[#8a8a8a] m-0">
                                   * {ing.nota}
                                </p>
                             )}
                          </div>
                       </li>
                     ))}
                   </ul>
                  {t.nota && <p className="text-[13px] font-normal text-[#8a8a8a] mt-4 p-3 bg-[#0a0a0a] rounded-[6px] border border-[#2a2a2a] italic m-0">{t.nota}</p>}
                </div>
              ))}
            </div>
            
            {plan.proximaSesion && plan.menus.length === 1 && (
               <div className="mt-6 pt-6 border-t border-[#333]">
                  <div className="flex items-center gap-3 p-4 bg-[#181818] rounded-[8px] border border-[#2a2a2a]">
                     <Lock className="h-[18px] w-[18px] text-[#c0c0c0]" />
                     <p className="text-[14px] font-medium text-white m-0">
                        Siguiente cita: <span className="font-normal text-[#c0c0c0]">{formatDate(plan.proximaSesion)}</span>
                     </p>
                  </div>
               </div>
            )}
          </div>
        ))}
      </div>

      {plan.proximaSesion && plan.menus.length > 1 && (
        <div className="bg-[#181818] border border-[#2a2a2a] py-4 px-6 rounded-[12px] flex items-center justify-center animate-slide-up">
          <p className="text-[14px] font-medium text-white m-0">
            Próxima cita de seguimiento: <span className="font-normal text-[#c0c0c0]">{formatDate(plan.proximaSesion)}</span>
          </p>
        </div>
      )}

      <PDFPreviewModal 
        isOpen={showConfig} 
        onClose={() => setShowConfig(false)} 
        planId={planId}
        planCustomMeta={plan.pdfCustomMeta || {}}
        onSaveMeta={handleSaveMeta}
        loading={savingMeta}
      />
    </div>
  );
};

export default function PlanView() {
  const { id: pacienteId, planId } = useParams();
  return <PlanEnvioForm pacienteId={pacienteId} planId={planId} />;
}
