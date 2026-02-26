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
    <div className="flex flex-col items-center justify-center min-h-[400px] animate-pulse h-[60vh] space-y-6">
      <div className="w-12 h-12 border-[4px] border-foreground/5 border-t-foreground rounded-none animate-spin" />
      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">SINCRONIZANDO PROTOCOLO...</p>
    </div>
  );
  
  if (!plan) return (
     <div className="flex flex-col items-center justify-center min-h-[400px] h-[60vh] space-y-6">
      <p className="text-xl font-black text-muted-foreground uppercase tracking-[0.3em] opacity-10">PROTOCOLO NO LOCALIZADO</p>
      <button onClick={() => navigate(`/pacientes/${pacienteId}`)} className="text-[10px] font-black text-foreground uppercase tracking-[0.3em] border-b border-foreground pb-1 hover:opacity-50 transition-all">VOLVER AL EXPEDIENTE</button>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl pb-20 mx-auto">
      <div className="flex flex-col gap-6">
        <button onClick={() => navigate(`/pacientes/${pacienteId}`)} className="flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-all w-fit group leading-none">
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-all" /> VOLVER AL EXPEDIENTE
        </button>
        
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 animate-slide-up">
           <div className="space-y-2">
              <h1 className="text-3xl font-black text-foreground tracking-tighter uppercase leading-none">Plan {plan.tipo}</h1>
              <p className="text-muted-foreground font-black text-[10px] uppercase tracking-[0.3em] opacity-40 leading-none">CONFIGURACIÓN INTEGRAL DE MACRONUTRIENTES Y SUPLEMENTACIÓN</p>
           </div>
           
           <div className="flex flex-wrap gap-2">
              <button
                onClick={() => navigate(`/pacientes/${pacienteId}/planes/${planId}/editar`)}
                className="px-6 py-3 bg-foreground text-background rounded-none text-[11px] font-black uppercase tracking-[0.1em] transition-all flex items-center gap-3 border border-foreground"
              >
                <Edit2 className="h-4 w-4" /> EDITAR
              </button>
              <button
                onClick={handleDelete}
                className="px-6 py-3 border border-border/80 text-destructive text-[11px] font-black uppercase tracking-[0.1em] rounded-none hover:bg-destructive/5 transition-all"
              >
                ELIMINAR
              </button>
              <button
                onClick={handlePdf}
                className="px-6 py-3 bg-background border border-border/80 rounded-none text-[11px] font-black uppercase tracking-[0.1em] flex items-center gap-3 hover:bg-secondary/10 transition-all"
              >
                <FileText className="h-4 w-4" /> PDF
              </button>
              <button
                onClick={handleWhatsApp}
                className="px-6 py-3 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 rounded-none text-[11px] font-black uppercase tracking-[0.1em] flex items-center gap-3 hover:bg-emerald-500 hover:text-white transition-all"
              >
                <MessageCircle className="h-4 w-4" /> WHATSAPP
              </button>
           </div>
        </div>
      </div>

      <div className="bg-foreground text-background p-6 rounded-none animate-slide-up">
         <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="space-y-2">
               <p className="text-[10px] font-black opacity-30 uppercase tracking-[0.2em] leading-none">Masa Térmica Diaria</p>
               <p className="text-xl font-black tracking-tighter uppercase leading-none">{plan.calorias}<span className="text-sm ml-2 tracking-[0.1em] opacity-30">KCAL</span></p>
            </div>
            <div className="space-y-2">
               <p className="text-[10px] font-black opacity-30 uppercase tracking-[0.2em] leading-none">Sintetización Pro</p>
               <p className="text-xl font-black text-emerald-400 tracking-tighter leading-none">{plan.proteinasPct}<span className="text-sm ml-2 tracking-[0.1em] opacity-30">% PRO</span></p>
            </div>
            <div className="space-y-2">
               <p className="text-[10px] font-black opacity-30 uppercase tracking-[0.2em] leading-none">Energía Carbo</p>
               <p className="text-xl font-black text-amber-400 tracking-tighter leading-none">{plan.carbohidratosPct}<span className="text-sm ml-2 tracking-[0.1em] opacity-30">% CHO</span></p>
            </div>
            <div className="space-y-2">
               <p className="text-[10px] font-black opacity-30 uppercase tracking-[0.2em] leading-none">Densidad Lípidos</p>
               <p className="text-xl font-black text-rose-400 tracking-tighter leading-none">{plan.grasasPct}<span className="text-sm ml-2 tracking-[0.1em] opacity-30">% LIPS</span></p>
            </div>
         </div>
      </div>

      {(plan.notasGenerales || plan.notas) && (
        <div className="bg-secondary/10 p-6 rounded-none border border-foreground/5">
          <h3 className="text-[10px] font-black text-foreground uppercase tracking-[0.3em] mb-4 opacity-40 leading-none">{`// RECOMENDACIONES ESTRATÉGICAS`}</h3>
          <p className="text-sm font-black leading-relaxed uppercase tracking-tighter text-foreground/70">{plan.notasGenerales || plan.notas}</p>
        </div>
      )}

      {/* Menus Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {plan.menus.map((menu, i) => (
          <div key={i} className="bg-background border border-border/40 p-6 rounded-none hover:border-foreground/20 transition-all flex flex-col h-full">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-1.5 h-6 bg-foreground" />
              <h3 className="text-xl font-black text-foreground tracking-tighter uppercase whitespace-nowrap">{menu.nombre}</h3>
            </div>
            
            <div className="space-y-8 flex-1">
              {menu.tiempos.map((t, j) => (
                <div key={j} className="group/tiempo">
                  <div className="flex items-center gap-3 mb-4">
                     <span className="text-[10px] font-black text-foreground uppercase tracking-[0.2em] leading-none">{t.nombre}</span>
                     <div className="h-[1px] flex-1 bg-foreground/5 group-hover/tiempo:bg-foreground/10 transition-colors" />
                  </div>
                   <ul className="space-y-4">
                     {t.ingredientes.map((ing, k) => (
                       <li key={k} className="flex items-start gap-3">
                          <div className="mt-2 w-1 h-1 rounded-full bg-foreground/10" />
                          <div className="flex-1 space-y-1">
                             <span className="text-sm font-black text-foreground uppercase tracking-tight leading-loose block">
                                {ing.cantidad} {ing.unidad} {ing.descripcion}
                             </span>
                             <div className="flex flex-wrap gap-x-4 gap-y-1">
                                {ing.eqCantidad && (
                                   <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.1em] opacity-40 leading-none">
                                      Eq: {ing.eqCantidad} {ing.eqGrupo}
                                    </p>
                                )}
                                {ing.nota && (
                                   <p className="text-[9px] font-bold text-muted-foreground italic leading-none opacity-30">
                                      * {ing.nota}
                                   </p>
                                )}
                             </div>
                          </div>
                       </li>
                     ))}
                   </ul>
                  {t.nota && <p className="text-[11px] font-black text-foreground/40 mt-4 pl-4 border-l border-foreground/10 uppercase tracking-tighter leading-relaxed font-mono">{t.nota}</p>}
                </div>
              ))}
            </div>
            
            {plan.proximaSesion && plan.menus.length === 1 && (
               <div className="mt-8 pt-6 border-t border-border/20">
                  <div className="flex items-center gap-3 p-4 bg-secondary/5 rounded-none border border-foreground/5">
                     <Lock className="h-4 w-4 opacity-10" />
                     <p className="text-[10px] font-black text-foreground uppercase tracking-[0.2em] leading-none opacity-40">
                        SIGUIENTE HIT: {formatDate(plan.proximaSesion)}
                     </p>
                  </div>
               </div>
            )}
          </div>
        ))}
      </div>

      {plan.proximaSesion && plan.menus.length > 1 && (
        <div className="bg-foreground text-background p-6 rounded-none flex items-center justify-center animate-slide-up">
          <p className="text-[11px] font-black uppercase tracking-[0.3em] text-center leading-none">
            PRÓXIMA SESIÓN DE CONTROL MAESTRO · {formatDate(plan.proximaSesion)}
          </p>
        </div>
      )}
    </div>
  );
};

export default PlanView;
