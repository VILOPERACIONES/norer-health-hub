import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import BarridoEquivalenciasComp, { type BarridoData } from '@/components/BarridoEquivalencias';
import { CreateEditPlanForm } from './CreateEditPlan';
import { PlanEnvioForm } from './PlanView';

const Field = ({
  label, value, onChange, type = 'number', disabled = false, suffix = '', placeholder = '',
}: {
  label: string; value: string | number; onChange?: (v: string) => void;
  type?: string; disabled?: boolean; suffix?: string; placeholder?: string;
}) => (
  <div className="space-y-1">
    <label className="block text-[10px] font-bold text-[#8a8a8a] m-0 uppercase tracking-widest">
      {label}{suffix && ` (${suffix})`}
    </label>
    <div className="relative">
      <input
        type={type}
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        disabled={disabled}
        placeholder={placeholder}
        className={`w-full bg-[#181818] rounded-[6px] px-3 py-2 text-[13px] font-medium text-white outline-none border border-[#333] focus:border-[#555] transition-colors placeholder-[#555] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${disabled ? 'opacity-50 cursor-not-allowed bg-[#111111]' : ''}`}
        step={type === 'number' ? "0.01" : undefined}
      />
    </div>
  </div>
);

const NewAssessment = () => {
  const { id: pacienteId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [paciente, setPaciente] = useState<any>(null);

  const now = new Date();
  const [step, setStep] = useState(1);
  const [fecha, setFecha] = useState(now.toISOString().split('T')[0]);
  const [hora, setHora] = useState(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
  const [numeroValoracion, setNumeroValoracion] = useState(1);
  const [peso, setPeso] = useState('');
  const [estatura, setEstatura] = useState('');
  const [pctGrasa, setPctGrasa] = useState('');
  const [comentarios, setComentarios] = useState('');
  const [temario, setTemario] = useState<{ id: string; tema: string; detalle: string }[]>([]);
  const [barridoData, setBarridoData] = useState<BarridoData | null>(null);

  const [valoracionIdGuardada, setValoracionIdGuardada] = useState<string | null>(null);
  const [planIdGuardado, setPlanIdGuardado] = useState<string | null>(null);

  const totalSteps = 4;
  const STEPS = [
    { id: 1, label: 'Valoración' },
    { id: 2, label: 'Equivalencias' },
    { id: 3, label: 'Creación de Plan' },
    { id: 4, label: 'Opciones de Envío' }
  ];

  // Load drafts
  useEffect(() => {
    const draftStr = localStorage.getItem(`draft_assessment_${pacienteId}`);
    if (draftStr) {
      try {
        const draft = JSON.parse(draftStr);
        if (draft.step) setStep(Math.min(draft.step, 2)); // Dont restore draft into steps 3/4
        if (draft.peso) setPeso(draft.peso);
        if (draft.estatura) setEstatura(draft.estatura);
        if (draft.pctGrasa) setPctGrasa(draft.pctGrasa);
        if (draft.comentarios) setComentarios(draft.comentarios);
        if (draft.temario) setTemario(draft.temario);
        if (draft.barridoData) setBarridoData(draft.barridoData);
        if (draft.fecha) setFecha(draft.fecha);
        if (draft.hora) setHora(draft.hora);
        toast({ title: 'Borrador recuperado', description: 'Se ha restaurado tu progreso previo.' });
      } catch (e) {
        console.error('Error parsing draft:', e);
      }
    }
  }, [pacienteId, toast]);

  // Save drafts
  useEffect(() => {
    if (step > 2) return; // Only save draft for steps 1 and 2
    const draft = { step, peso, estatura, pctGrasa, comentarios, temario, barridoData, fecha, hora };
    localStorage.setItem(`draft_assessment_${pacienteId}`, JSON.stringify(draft));
  }, [step, peso, estatura, pctGrasa, comentarios, temario, barridoData, fecha, hora, pacienteId]);

  useEffect(() => {
    const fetchPatient = async () => {
      try {
        const { data } = await api.get(`/api/pacientes/${pacienteId}`);
        const p = data?.data || data;
        setPaciente(p);
        
        // Solo pre-llenar si no hay borrador para sobreescribirlo
        if (!localStorage.getItem(`draft_assessment_${pacienteId}`)) {
          const vals = p?.valoraciones || [];
          let tValue = 0;
          if (vals.length > 0) {
             const lastVal = [...vals].sort((a: any, b: any) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())[0];
             if (lastVal.estatura && parseFloat(lastVal.estatura) > 0) tValue = parseFloat(lastVal.estatura);
          }
          if (!tValue) {
             tValue = parseFloat(p?.estatura || p?.talla || '0');
          }
          if (tValue > 0) {
            setEstatura(String(tValue < 10 ? Math.round(tValue * 100) : tValue));
          }
        }
        
        const vals = p?.valoraciones || [];
        setNumeroValoracion(vals.length + 1);
      } catch (err) {
        console.error('Error cargando paciente:', err);
      }
    };
    fetchPatient();
  }, [pacienteId]);

  const pesoNum = parseFloat(peso) || 0;
  const estaturaNum = parseFloat(estatura) || 0;
  const estaturaEnMetros = estaturaNum > 0 && estaturaNum < 3 ? estaturaNum : estaturaNum / 100;

  const imc = useMemo(() => {
    if (pesoNum <= 0 || estaturaNum <= 0) return 0;
    return pesoNum / (estaturaEnMetros * estaturaEnMetros);
  }, [pesoNum, estaturaNum, estaturaEnMetros]);

  const masaMagra = useMemo(() => {
    const pg = parseFloat(pctGrasa);
    if (!pesoNum || !pg) return null;
    return pesoNum - (pesoNum * pg / 100);
  }, [pesoNum, pctGrasa]);

  const addTema = () => setTemario([...temario, { id: Date.now().toString(), tema: '', detalle: '' }]);
  const removeTema = (idx: number) => setTemario(temario.filter((_, i) => i !== idx));
  const updateTema = (idx: number, field: 'tema' | 'detalle', val: string) => {
    const nt = [...temario];
    nt[idx][field] = val;
    setTemario(nt);
  };

  const clearDraft = () => localStorage.removeItem(`draft_assessment_${pacienteId}`);

  const handleSave = async (redirectAPlan = false) => {
    if (!peso) { toast({ title: 'Campo requerido', description: 'El peso actual es obligatorio.', variant: 'destructive' }); return; }
    if (!estatura) { toast({ title: 'Campo requerido', description: 'La estatura es obligatoria.', variant: 'destructive' }); return; }

    setSaving(true);
    const body: Record<string, any> = {
      fecha, hora,
      numeroValoracion,
      pesoActual: pesoNum,
      estatura: estaturaNum < 10 ? Math.round(estaturaNum * 100) : estaturaNum,
      imc: parseFloat(imc.toFixed(2)),
      comentarios,
      temario: temario.map(({ tema, detalle }) => ({ tema, detalle })),
    };

    if (pctGrasa) {
      body.pctGrasa = parseFloat(pctGrasa);
      if (masaMagra !== null) body.masaMagra = parseFloat(masaMagra.toFixed(2));
    }

    try {
      const response = await api.post(`/api/pacientes/${pacienteId}/valoraciones`, body);
      const serverData = response.data?.data || response.data;
      const valoracionId = serverData?.id;

      if (valoracionId && barridoData && barridoData.kcalTotal > 0) {
        try { await api.post(`/api/pacientes/${pacienteId}/valoraciones/${valoracionId}/barrido`, barridoData); } catch {}
      }

      toast({ title: 'Valoración guardada correctamente' });
      clearDraft();

      if (redirectAPlan && valoracionId) {
        setValoracionIdGuardada(valoracionId);
        setStep(3);
      } else {
        navigate(`/pacientes/${pacienteId}`);
      }
    } catch (err: any) {
      toast({ title: 'Error al guardar', description: err.response?.data?.message || 'No se pudo guardar la valoración.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="animate-fade-in w-full h-[calc(100vh-60px)] font-sans flex flex-col pb-2" style={{ backgroundColor: '#0a0a0a' }}>
      
      <div className="max-w-none w-full mx-auto flex flex-col flex-1 overflow-hidden min-h-0">
        {/* TOP HEADER */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-3 pb-2 text-[#f0f0f0]">
          {paciente && (
             <div className="flex items-center gap-2">
               <div className="w-8 h-8 rounded-full bg-[#1a1a1a] border border-[#333] text-[#f0f0f0] flex items-center justify-center font-bold text-[12px] uppercase">
                 {paciente?.nombre?.[0] || ''}{paciente?.apellido?.[0] || ''}
               </div>
               <div>
                  <h2 className="text-[14px] font-bold text-white m-0 tracking-tight leading-tight">
                    {paciente.nombre} {paciente.apellido}
                  </h2>
                  <div className="flex items-center gap-1.5 text-[11px] text-[#8a8a8a] mt-0.5">
                    <span>{paciente.fechaNacimiento ? `${Math.floor((Date.now() - new Date(paciente.fechaNacimiento.includes('T') ? paciente.fechaNacimiento.split('T')[0] : paciente.fechaNacimiento).getTime()) / 31557600000)} años` : '—'}</span>
                    <span>·</span>
                    <span>Última visita {(() => {
                      const vals = paciente.valoraciones || [];
                      if (vals.length === 0) return 'Ninguna';
                      const lastVal = [...vals].sort((a: any, b: any) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())[0];
                      const d = new Date(lastVal.fecha);
                      return `${d.getDate()} ${d.toLocaleString('es-ES', { month: 'short' })} ${d.getFullYear()}`;
                   })()}</span>
                   <span>·</span>
                   <span className="uppercase">ID {pacienteId?.slice(-6)}</span>
                  </div>
               </div>
             </div>
          )}
        </div>

        {/* STEPPER */}
        <div className="flex items-center justify-center max-w-lg mx-auto w-full mb-5 mt-1 shrink-0">
          {STEPS.map((s, i, arr) => (
            <React.Fragment key={s.id}>
              <div className="flex flex-col items-center gap-1 relative">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold z-10 transition-colors shadow-none ${step >= s.id ? 'bg-[#f0f0f0] text-[#0a0a0a]' : 'bg-[#1a1a1a] text-[#6a6a6a] border border-[#333]'}`}>
                  {s.id}
                </div>
                <span className={`text-[9px] font-bold absolute -bottom-4 whitespace-nowrap uppercase tracking-wider ${step >= s.id ? 'text-white' : 'text-[#6a6a6a]'}`}>
                  {s.label}
                </span>
              </div>
              {i < arr.length - 1 && (
                <div className={`flex-1 h-[2px] mx-2 transition-colors ${step > s.id ? 'bg-[#f0f0f0]' : 'bg-[#2a2a2a]'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="w-full flex-1 flex flex-col overflow-y-auto custom-scrollbar">
          {/* FASE 1: MÉTRICAS Y TEMARIO */}
          {step === 1 && (
            <div className="flex flex-col flex-1 min-h-0 animate-slide-up gap-4">
              <div className="shrink-0 mb-1">
                <p className="text-[10px] font-semibold text-[#8a8a8a] uppercase tracking-[0.15em] mb-1">Paso 1 de {totalSteps}</p>
                <h3 className="text-[22px] font-bold text-white m-0 tracking-tight">
                  Datos Clínicos y Valoración
                </h3>
                <p className="text-[12px] text-[#8a8a8a] m-0 mt-1">
                  Medidas antropométricas, notas y temas a tratar con el paciente.
                </p>
              </div>
              
              <div className="grid lg:grid-cols-2 gap-4 flex-1 min-h-0">
                 {/* COLUMNA 1: ANTROPOMETRÍA */}
                 <div className="bg-[#111111] p-5 rounded-[16px] border border-[#2a2a2a] flex flex-col shrink-0 h-fit">
                   <h4 className="text-[13px] font-bold text-white tracking-widest uppercase mb-4">Medidas Antropométricas</h4>
                   <div className="grid sm:grid-cols-2 gap-x-6 gap-y-6">
                     <Field label="Fecha" value={fecha} onChange={setFecha} type="date" />
                     <Field label="Hora" value={hora} onChange={setHora} type="time" />
                     
                     <Field label="Peso" value={peso} onChange={setPeso} suffix="kg" placeholder="Ej. 68.5" />
                     <Field label="Estatura" value={estatura} onChange={setEstatura} suffix="cm" placeholder="Ej. 165" />
                     
                     <Field label="% Grasa Corp." value={pctGrasa} onChange={setPctGrasa} placeholder="Ej. 24.3" />
                     <Field label="Masa Muscular" value={masaMagra !== null ? masaMagra.toFixed(2) : ''} disabled suffix="kg" placeholder="Auto" />
                   </div>
                 </div>

                 {/* COLUMNA 2: TEMARIO */}
                 <div className="bg-[#111111] p-5 rounded-[16px] border border-[#2a2a2a] flex flex-col h-full overflow-hidden">
                    <h4 className="text-[12px] font-bold text-white tracking-widest uppercase mb-3 shrink-0">Notas y Temario</h4>
                    <div className="shrink-0">
                       <label className="block text-[10px] font-bold text-[#8a8a8a] m-0 mb-1.5 uppercase tracking-widest">Notas Clínicas</label>
                       <textarea
                         value={comentarios}
                         onChange={(e) => setComentarios(e.target.value)}
                         className="w-full bg-[#181818] rounded-[6px] px-3 py-2 text-[13px] font-medium text-white outline-none border border-[#333] focus:border-[#555] min-h-[60px] resize-y transition-colors placeholder-[#555]"
                         placeholder="Observaciones relevantes de la consulta..."
                       />
                    </div>

                    <div className="flex-1 flex flex-col min-h-0 mt-4">
                       <div className="flex items-center justify-between pb-2 border-b border-[#2a2a2a] shrink-0 mb-3">
                         <label className="block text-[11px] font-bold text-[#8a8a8a] m-0 uppercase tracking-widest">Temario Abordado</label>
                         <button onClick={addTema} className="text-[11px] font-bold text-white hover:opacity-70 flex items-center gap-1.5 transition-colors uppercase tracking-wider bg-[#1a1a1a] px-3 py-1.5 border border-[#333] rounded-[6px]">
                           <Plus className="h-3 w-3" strokeWidth={3} /> Agregar
                         </button>
                       </div>

                       {temario.length === 0 && (
                         <div className="flex flex-col items-center justify-center py-6 border border-[#2a2a2a] border-dashed rounded-[12px] bg-[#141414] shrink-0">
                           <p className="text-[12px] text-[#8a8a8a] text-center max-w-sm px-4">
                             Sin temas asignados. Haz clic en "Agregar" para ir alistando el temario a tratar.
                           </p>
                         </div>
                       )}

                       <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
                         {temario.map((t, idx) => (
                           <div key={t.id} className="relative group space-y-2 pb-3 pt-1 border-b border-[#2a2a2a] last:border-0 last:pb-0">
                             <button onClick={() => removeTema(idx)} className="absolute top-1 right-0 p-1.5 text-[#555] hover:text-[#ff6b6b] hover:bg-[#ff6b6b]/10 rounded-[6px] opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all z-10">
                               <Trash2 className="h-4 w-4" />
                             </button>
                             <input
                               type="text"
                               placeholder="Título del tema..."
                               value={t.tema}
                               onChange={(e) => updateTema(idx, 'tema', e.target.value)}
                               className="w-full bg-transparent text-[14px] font-bold text-white outline-none placeholder-[#555] pr-8 border-none m-0 p-0"
                             />
                             <textarea
                               placeholder="Detalles y comentarios de lo conversado..."
                               value={t.detalle}
                               onChange={(e) => updateTema(idx, 'detalle', e.target.value)}
                               className="w-full bg-[#181818] border border-[#333] focus:border-[#555] rounded-[6px] p-2.5 text-[12px] font-medium text-[#8a8a8a] outline-none min-h-[50px] resize-none placeholder-[#444] transition-colors"
                             />
                           </div>
                         ))}
                       </div>
                    </div>
                 </div>
              </div>
            </div>
          )}

          {/* FASE 2: BARRIDO */}
          {step === 2 && (
            <div className="flex flex-col flex-1 min-h-0 animate-slide-up gap-4">
              <div className="shrink-0 mb-1">
                <p className="text-[10px] font-semibold text-[#8a8a8a] uppercase tracking-[0.15em] mb-1">Paso 2 de {totalSteps}</p>
                <h3 className="text-[22px] font-bold text-white m-0 tracking-tight">
                  Equivalencias
                </h3>
                <p className="text-[12px] text-[#8a8a8a] m-0 mt-1">
                  {barridoData && barridoData.kcalTotal > 0
                     ? `Total temporal: ${Math.round(barridoData.kcalTotal).toLocaleString()} kcal`
                     : 'Asigna el cuadro sintético o los macros del paciente.'}
                </p>
              </div>

              <div className="bg-[#111111] px-5 py-4 rounded-[16px] border border-[#2a2a2a] shadow-none flex-1 min-h-0 overflow-y-auto custom-scrollbar">
                 <div className="-mx-4 md:mx-0">
                   <BarridoEquivalenciasComp value={barridoData} onChange={(data) => setBarridoData(data)} />
                 </div>
              </div>
            </div>
          )}

          {/* FASE 3: CREACION DEL PLAN */}
          {step === 3 && (
            <div className="space-y-4 animate-slide-up mt-4">
              <CreateEditPlanForm 
                pacienteId={pacienteId} 
                valoracionId={valoracionIdGuardada || undefined} 
                onSaved={(planId) => {
                   setPlanIdGuardado(planId);
                   setStep(4);
                }}
                onCancel={() => navigate(`/pacientes/${pacienteId}`)}
              />
            </div>
          )}

          {/* FASE 4: OPCIONES DE ENVIO (PDF / WHATSAPP) */}
          {step === 4 && (
            <div className="space-y-4 animate-slide-up mt-4">
               <PlanEnvioForm 
                 pacienteId={pacienteId} 
                 planId={planIdGuardado || undefined}
                 onFinish={() => navigate(`/pacientes/${pacienteId}`)}
               />
            </div>
          )}

          {/* BOTTOM NAVIGATION - ONLY FOR STEPS 1 AND 2 */}
          {step <= 2 && (
            <div className="flex flex-col sm:flex-row items-center justify-between py-2 shrink-0 border-t border-[#1a1a1a]">
              {step > 1 ? (
                <button 
                   onClick={() => setStep(step - 1)}
                   className="text-[12px] font-bold text-[#8a8a8a] hover:text-white transition-colors flex items-center gap-2 px-3 py-2 uppercase tracking-wide"
                >
                   ← Anterior
                </button>
              ) : (
                <button 
                   onClick={() => navigate(`/pacientes/${pacienteId}`)}
                   className="text-[12px] font-bold text-[#8a8a8a] hover:text-white transition-colors flex items-center gap-2 px-3 py-2 uppercase tracking-wide"
                >
                   ← Salir Sin Guardar
                </button>
              )}

              {/* Dots Indicator */}
              <div className="hidden sm:flex items-center gap-1.5 opacity-50">
                 {[1, 2, 3, 4].map(s => (
                   <div key={s} className={`rounded-full transition-all duration-300 ${step === s ? 'w-6 h-1 bg-white' : 'w-1 h-1 bg-[#444]'}`} />
                 ))}
              </div>

              {step < 2 ? (
                <button 
                   onClick={() => setStep(step + 1)}
                   className="px-5 py-2.5 bg-[#f0f0f0] text-[#0a0a0a] rounded-[8px] text-[12px] font-bold hover:bg-white transition-colors flex items-center justify-center shadow-sm w-full sm:w-auto uppercase tracking-wide"
                >
                   Continuar a Equivalencias →
                </button>
              ) : (
                <div className="flex flex-col-reverse sm:flex-row items-center gap-3 w-full sm:w-auto">
                  <button
                     onClick={() => handleSave(false)}
                     disabled={saving || barridoData?.isValid === false}
                     className="px-5 py-2.5 bg-transparent border border-[#333] text-white rounded-[8px] text-[12px] font-bold hover:bg-[#1a1a1a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto text-center uppercase tracking-wide"
                   >
                     {saving ? 'Guardando...' : 'Sólo Guardar'}
                   </button>
                   <button
                     onClick={() => handleSave(true)}
                     disabled={saving || barridoData?.isValid === false}
                     className="px-5 py-2.5 bg-[#f0f0f0] text-[#0a0a0a] rounded-[8px] text-[12px] font-bold hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 w-full sm:w-auto justify-center shadow-sm uppercase tracking-wide"
                     style={{ minWidth: '220px' }}
                   >
                     {saving ? <div className="w-4 h-4 border-2 border-[#0a0a0a]/20 border-t-[#0a0a0a] rounded-full animate-spin" /> : <>Guardar y Crear Plan →</>}
                   </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewAssessment;
