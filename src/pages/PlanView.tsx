import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit2, FileText, MessageCircle, Lock, Trash2 } from 'lucide-react';
import api from '@/lib/api';
import type { Plan } from '@/types';
import { formatDate, formatDecimal } from '@/lib/format';
import { useToast } from '@/hooks/use-toast';

const PlanView = () => {
  const { id: pacienteId, planId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get(`/api/pacientes/${pacienteId}/planes/${planId}`);
        let serverData = data?.data || data;
        if (serverData) {
          // Normalización para visualización
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
      } catch (err) {
        console.error('Error cargando plan:', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [pacienteId, planId]);

  const handleDelete = async () => {
    if (!window.confirm('¿ELIMINAR ESTE PROTOCOLO MAESTRO?')) return;
    try {
      await api.delete(`/api/pacientes/${pacienteId}/planes/${planId}`);
      toast({ title: 'Protocolo eliminado' });
      navigate(`/pacientes/${pacienteId}`);
    } catch (err) {
      toast({ title: 'Error', description: 'No se pudo eliminar el plan', variant: 'destructive' });
    }
  };

  const handlePdf = async () => {
    try {
      toast({ title: 'GENERANDO REPORTE', description: 'Preparando protocolo clínico maestro...' });
      const response = await api.get(`/api/planes/${planId}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `plan-${planId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      // Sincronizar estado enviado
      await api.put(`/api/planes/${planId}/estado`, { estadoEnvio: 'enviado' });
      toast({ title: 'ESTADO SINCRONIZADO', description: 'El reporte ha sido marcado como enviado.' });
    } catch (err) {
      toast({ title: 'Error de Generación', description: 'No se pudo sincronizar el reporte PDF', variant: 'destructive' });
    }
  };

  const handleWhatsApp = () => {
    toast({ title: 'Sincronización pendiente', description: 'El envío por canal maestro WhatsApp estará disponible próximamente.' });
  };

  if (loading) return (
    <div className="h-[80vh] flex flex-col items-center justify-center gap-6 animate-pulse">
      <div className="w-8 h-8 rounded-full border-2 border-border-subtle border-t-text-primary animate-spin" />
      <p className="text-[14px] font-medium text-text-muted">Sincronizando protocolo...</p>
    </div>
  );
  
  if (!plan) return (
     <div className="h-[80vh] flex flex-col items-center justify-center gap-6">
      <p className="text-[16px] font-medium text-text-muted">Protocolo no localizado</p>
      <button onClick={() => navigate(`/pacientes/${pacienteId}`)} className="text-[14px] font-medium text-text-primary hover:text-text-secondary transition-colors underline underline-offset-4">Volver al expediente</button>
    </div>
  );

  return (
    <div className="space-y-10 animate-fade-in max-w-none pb-24 px-6">
      <div className="flex flex-col gap-6 pt-6">
        <button onClick={() => navigate(`/pacientes/${pacienteId}`)} className="flex items-center gap-2 text-[14px] font-medium text-text-secondary hover:text-text-primary transition-colors w-fit group">
          <ArrowLeft className="h-[18px] w-[18px] group-hover:-translate-x-1 transition-transform" /> Volver al expediente
        </button>
        
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 animate-slide-up">
           <div className="space-y-1">
              <h1 className="text-[26px] font-bold text-text-primary m-0 tracking-tight">Plan {plan.tipo}</h1>
              <p className="text-text-secondary font-normal text-[14px] m-0">Configuración integral de macronutrientes y suplementación</p>
           </div>
           
           <div className="flex flex-wrap gap-3">
              <button
                onClick={() => navigate(`/pacientes/${pacienteId}/planes/${planId}/editar`)}
                className="flex items-center gap-2 px-[18px] py-[10px] bg-bg-elevated text-text-primary border border-border-subtle rounded-[8px] text-[14px] font-medium transition-colors hover:bg-[#222]"
              >
                <Edit2 className="h-[18px] w-[18px]" /> Editar
              </button>
              <button
                onClick={handlePdf}
                className="flex items-center gap-2 px-[18px] py-[10px] bg-bg-surface text-text-primary border border-border-subtle rounded-[8px] text-[14px] font-medium transition-colors hover:bg-bg-elevated"
              >
                <FileText className="h-[18px] w-[18px]" /> PDF
              </button>
              <button
                onClick={handleWhatsApp}
                className="flex items-center gap-2 px-[18px] py-[10px] bg-[#1a2e1a] text-accent-green border border-accent-green/20 rounded-[8px] text-[14px] font-medium transition-colors hover:bg-accent-green hover:text-[#000]"
              >
                <MessageCircle className="h-[18px] w-[18px]" /> WhatsApp
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 px-[18px] py-[10px] bg-[#2e1a1a] text-accent-red border border-accent-red/20 rounded-[8px] text-[14px] font-medium transition-colors hover:bg-[#3d1a1a]"
              >
                <Trash2 className="h-[18px] w-[18px]" /> Eliminar
              </button>
           </div>
        </div>
      </div>

      <div className="bg-bg-surface border border-border-subtle p-6 rounded-[12px] animate-slide-up">
         <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="space-y-1">
               <p className="text-[12px] font-medium text-text-muted m-0">Calorías Diarias</p>
               <p className="text-[22px] font-bold text-text-primary m-0">{plan.calorias}<span className="text-[14px] font-medium text-text-secondary ml-1">Kcal</span></p>
            </div>
            <div className="space-y-1">
               <p className="text-[12px] font-medium text-text-muted m-0">Proteínas</p>
               <p className="text-[22px] font-bold text-text-primary m-0">{plan.proteinasPct}<span className="text-[14px] font-medium text-text-secondary ml-1">%</span></p>
            </div>
            <div className="space-y-1">
               <p className="text-[12px] font-medium text-text-muted m-0">Carbohidratos</p>
               <p className="text-[22px] font-bold text-text-primary m-0">{plan.carbohidratosPct}<span className="text-[14px] font-medium text-text-secondary ml-1">%</span></p>
            </div>
            <div className="space-y-1">
               <p className="text-[12px] font-medium text-text-muted m-0">Lípidos</p>
               <p className="text-[22px] font-bold text-text-primary m-0">{plan.grasasPct}<span className="text-[14px] font-medium text-text-secondary ml-1">%</span></p>
            </div>
         </div>
      </div>

      {(plan.notasGenerales || plan.notas) && (
        <div className="bg-bg-elevated p-6 rounded-[12px] border border-border-subtle">
           <div className="flex items-center gap-2 mb-3 text-text-secondary">
             <FileText className="w-[18px] h-[18px] text-text-primary" />
             <h3 className="text-[16px] font-semibold text-text-primary m-0">Recomendaciones Generales</h3>
           </div>
          <p className="text-[14px] font-normal leading-relaxed text-text-secondary m-0">{plan.notasGenerales || plan.notas}</p>
        </div>
      )}

      {/* Menus Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {plan.menus.map((menu, i) => (
          <div key={i} className="bg-bg-surface border border-border-subtle p-6 rounded-[12px] flex flex-col h-full hover:border-[#444] transition-colors">
            <div className="flex items-center gap-3 mb-6 border-b border-border-subtle pb-4">
              <div className="w-1.5 h-5 bg-brand-primary rounded-full" />
              <h3 className="text-[18px] font-semibold text-text-primary m-0">{menu.nombre}</h3>
            </div>
            
            <div className="space-y-6 flex-1">
              {menu.tiempos.map((t, j) => (
                <div key={j} className="group/tiempo p-4 bg-bg-elevated rounded-[8px] border border-border-subtle">
                  <div className="flex items-center gap-2 mb-4">
                     <Clock className="w-4 h-4 text-text-muted" />
                     <span className="text-[14px] font-semibold text-text-primary m-0">{t.nombre}</span>
                  </div>
                   <ul className="space-y-3">
                     {t.ingredientes.map((ing, k) => (
                       <li key={k} className="flex flex-col gap-1">
                          <div className="flex items-start gap-2">
                             <div className="mt-1.5 min-w-[6px] h-[6px] rounded-full bg-text-muted" />
                             <span className="text-[14px] font-medium text-text-secondary m-0 leading-tight">
                                {ing.cantidad} {ing.unidad} <span className="text-text-primary">{ing.descripcion}</span>
                             </span>
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 ml-[14px]">
                             {ing.eqCantidad && (
                                <p className="text-[12px] font-medium text-text-muted m-0">
                                   Eq: {ing.eqCantidad} {ing.eqGrupo}
                                 </p>
                             )}
                             {ing.nota && (
                                <p className="text-[12px] font-normal italic text-text-muted m-0">
                                   * {ing.nota}
                                </p>
                             )}
                          </div>
                       </li>
                     ))}
                   </ul>
                  {t.nota && <p className="text-[13px] font-normal text-text-muted mt-4 p-3 bg-bg-base rounded-[6px] border border-border-subtle italic m-0">{t.nota}</p>}
                </div>
              ))}
            </div>
            
            {plan.proximaSesion && plan.menus.length === 1 && (
               <div className="mt-6 pt-6 border-t border-border-default">
                  <div className="flex items-center gap-3 p-4 bg-bg-elevated rounded-[8px] border border-border-subtle">
                     <Lock className="h-[18px] w-[18px] text-text-secondary" />
                     <p className="text-[14px] font-medium text-text-primary m-0">
                        Siguiente cita: <span className="font-normal text-text-secondary">{formatDate(plan.proximaSesion)}</span>
                     </p>
                  </div>
               </div>
            )}
          </div>
        ))}
      </div>

      {plan.proximaSesion && plan.menus.length > 1 && (
        <div className="bg-bg-elevated border border-border-subtle py-4 px-6 rounded-[12px] flex items-center justify-center animate-slide-up">
          <p className="text-[14px] font-medium text-text-primary m-0">
            Próxima cita de seguimiento: <span className="font-normal text-text-secondary">{formatDate(plan.proximaSesion)}</span>
          </p>
        </div>
      )}
    </div>
  );
};

export default PlanView;
