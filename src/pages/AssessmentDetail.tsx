import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Brain, Plus, X, FileText, Layers, ChevronDown, ChevronUp, Check, AlertCircle } from 'lucide-react';
import api from '@/lib/api';
import { formatDate } from '@/lib/format';
import { useToast } from '@/hooks/use-toast';
import BarridoEquivalenciasComp, { type BarridoData } from '@/components/BarridoEquivalencias';

// ─── Módulo Plan de la Consulta ───────────────────────────────────────────────
const PlanSection = ({
  pacienteId,
  valoracionId,
  planLigado,
}: {
  pacienteId: string;
  valoracionId: string;
  planLigado?: { id: string; nombre?: string; tipoPlan?: string };
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [plantillas, setPlantillas] = useState<any[]>([]);
  const [loadingPlantillas, setLoadingPlantillas] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [plan, setPlan] = useState(planLigado);

  const fetchPlantillas = useCallback(async () => {
    setLoadingPlantillas(true);
    try {
      const { data } = await api.get('/api/planes?tipo=base');
      setPlantillas(data?.data || data || []);
    } catch {
      toast({ title: 'Error', description: 'No se pudieron cargar las plantillas.', variant: 'destructive' });
    } finally {
      setLoadingPlantillas(false);
    }
  }, [toast]);

  const handleAsignar = async (plantillaId: string) => {
    setAssigning(true);
    try {
      const { data } = await api.post(`/api/planes/${plantillaId}/asignar`, { pacienteId, valoracionId });
      const newPlan = data?.data || data;
      setPlan(newPlan);
      setShowModal(false);
      toast({ title: 'Plantilla asignada correctamente' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.response?.data?.message || 'No se pudo asignar.', variant: 'destructive' });
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="space-y-4">
      {plan ? (
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-bg-elevated rounded-[10px] border border-border-default">
          <div>
            <p className="text-[12px] font-medium text-text-muted m-0">Plan asignado</p>
            <p className="text-[15px] font-semibold text-text-primary m-0">{plan.nombre || plan.tipoPlan || 'Plan alimenticio'}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate(`/pacientes/${pacienteId}/planes/${plan.id}`)}
              className="flex items-center gap-2 px-4 py-2 bg-bg-surface border border-border-subtle rounded-[8px] text-[13px] font-medium text-text-primary hover:bg-[#222] transition-colors"
            >
              <FileText className="w-4 h-4" /> Ver plan
            </button>
            <button
              onClick={() => { setShowModal(true); fetchPlantillas(); }}
              className="flex items-center gap-2 px-4 py-2 bg-bg-elevated border border-border-subtle rounded-[8px] text-[13px] font-medium text-text-secondary hover:text-text-primary transition-colors"
            >
              Cambiar plan
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => navigate(`/pacientes/${pacienteId}/planes/nuevo?valoracionId=${valoracionId}`)}
            className="flex items-center gap-2 px-5 py-2.5 bg-brand-primary text-bg-base rounded-[8px] text-[13px] font-bold hover:bg-[#e0e0e0] transition-all"
          >
            <Plus className="w-4 h-4" /> Crear nuevo plan
          </button>
          <button
            onClick={() => { setShowModal(true); fetchPlantillas(); }}
            className="flex items-center gap-2 px-5 py-2.5 bg-bg-elevated border border-border-subtle text-text-primary rounded-[8px] text-[13px] font-medium hover:bg-[#222] transition-colors"
          >
            <Layers className="w-4 h-4" /> Asignar plantilla
          </button>
        </div>
      )}

      {/* Modal plantillas */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-bg-surface border border-border-subtle rounded-[16px] w-full max-w-lg shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between p-6 border-b border-border-subtle">
              <h3 className="text-[16px] font-bold text-text-primary m-0">Seleccionar plantilla</h3>
              <button onClick={() => setShowModal(false)} className="p-2 text-text-muted hover:text-text-primary transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 max-h-[60vh] overflow-y-auto space-y-3">
              {loadingPlantillas ? (
                <div className="flex justify-center py-10">
                  <div className="w-6 h-6 border-2 border-border-subtle border-t-text-primary rounded-full animate-spin" />
                </div>
              ) : plantillas.length === 0 ? (
                <p className="text-[14px] text-text-secondary text-center py-8">No hay plantillas disponibles</p>
              ) : (
                plantillas.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleAsignar(p.id)}
                    disabled={assigning}
                    className="w-full text-left p-4 bg-bg-elevated hover:bg-[#1e1e1e] border border-border-subtle rounded-[10px] transition-colors disabled:opacity-50"
                  >
                    <p className="text-[14px] font-semibold text-text-primary m-0">{p.tipoPlan || p.nombre || 'Plan'}</p>
                    <p className="text-[12px] text-text-muted m-0 mt-0.5">{p.calorias ? `${p.calorias} kcal` : ''}</p>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── AssessmentDetail principal ───────────────────────────────────────────────
const AssessmentDetail = () => {
  const { id: pacienteId, valoracionId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [val, setVal] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Barrido: estado controlado por el padre, se pasa al componente compartido
  const [barridoData, setBarridoData] = useState<BarridoData | null>(null);
  const [initialBarridoData, setInitialBarridoData] = useState<string | null>(null);
  const [showBarrido, setShowBarrido] = useState(true);
  const [savingBarrido, setSavingBarrido] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const { data } = await api.get(`/api/pacientes/${pacienteId}/valoraciones/${valoracionId}`);
        const serverData = data?.data || data;
        if (serverData) setVal(serverData);

        // Cargar barrido — el backend devuelve { data: null } si no existe
        try {
          const br = await api.get(`/api/pacientes/${pacienteId}/valoraciones/${valoracionId}/barrido`);
          const bd = br.data?.data || br.data;
          if (bd && (bd.tiempos || bd.kcalTotal)) {
            setBarridoData(bd as BarridoData);
            setInitialBarridoData(JSON.stringify(bd));
          }
        } catch {
          // Sin barrido previo, estado inicial null
          setInitialBarridoData(null);
        }
      } catch (err) {
        console.error('Error cargando valoración:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [pacienteId, valoracionId]);

  const handleGuardarBarrido = async () => {
    if (!barridoData) return;
    setSavingBarrido(true);
    try {
      await api.post(
        `/api/pacientes/${pacienteId}/valoraciones/${valoracionId}/barrido`,
        barridoData
      );
      setInitialBarridoData(JSON.stringify(barridoData));
      toast({ title: 'Barrido guardado correctamente' });
    } catch (err: any) {
      toast({
        title: 'Error al guardar',
        description: err.response?.data?.message || 'No se pudo guardar el barrido.',
        variant: 'destructive',
      });
    } finally {
      setSavingBarrido(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-text-muted border-t-text-primary animate-spin mb-4" />
      <p className="text-[14px] font-medium text-text-muted">Cargando valoración...</p>
    </div>
  );

  if (!val) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-10 text-center">
      <h1 className="text-[20px] font-bold text-text-primary m-0 mb-6">Registro no localizado</h1>
      <button
        onClick={() => navigate(`/pacientes/${pacienteId}`)}
        className="px-[18px] py-[10px] bg-bg-surface border border-border-subtle text-text-primary hover:bg-bg-elevated text-[14px] font-medium rounded-[8px] transition-colors"
      >
        Volver al expediente
      </button>
    </div>
  );

  // IMC: validar que sea fisiológicamente posible (10–70).
  // Si el valor guardado es imposible, intentar recalcular desde peso y estatura.
  const imcRaw = parseFloat(val.imc) || 0;
  const imcNum = (() => {
    if (imcRaw >= 10 && imcRaw <= 70) return imcRaw;  // valor válido en BD
    // Intentar recalcular (el valor guardado era corrupto)
    const pesoKg = parseFloat(val.pesoActual || val.peso);
    const estatCm = parseFloat(val.estatura || val.talla);
    if (!pesoKg || !estatCm) return 0;
    const hm = estatCm < 3 ? estatCm : estatCm / 100;  // auto-detectar metros/cm
    const calc = pesoKg / (hm * hm);
    return calc >= 10 && calc <= 70 ? calc : 0;  // si sigue mal, mostrar —
  })();

  // Formato: 2 decimales para precisión
  const imcDisplay = imcNum > 0 ? imcNum.toFixed(2) : '—';

  return (
    <div className="space-y-8 animate-fade-in pb-20 w-full px-6 lg:px-10">
      {/* HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pt-6 pb-6 border-b border-border-subtle">
        <div className="space-y-2">
          <button
            onClick={() => navigate(`/pacientes/${pacienteId}`)}
            className="flex items-center gap-2 text-[14px] font-medium text-text-secondary hover:text-text-primary transition-colors w-fit group mb-4"
          >
            <ArrowLeft className="h-[18px] w-[18px] group-hover:-translate-x-1 transition-transform" /> Volver al expediente
          </button>
          <div className="animate-slide-up space-y-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 bg-[#1a2e1a] text-accent-green rounded-[6px] text-[12px] font-medium">
                Historial Clínico
              </span>
              <span className="text-text-muted text-[13px] font-normal">Consulta #{val.numeroValoracion || '—'}</span>
            </div>
            <h1 className="text-[26px] font-bold text-text-primary tracking-tight m-0">Detalles de Consulta</h1>
            <p className="text-text-secondary font-normal text-[14px] m-0">
              {formatDate(val.fecha)} {val.hora ? `· ${val.hora}` : ''} · ID: {val.id?.slice(-12).toUpperCase()}
            </p>
          </div>
        </div>
      </header>

      {/* RESUMEN BÁSICO */}
      <div className="bg-bg-surface border border-border-subtle rounded-[12px] overflow-hidden">
        <div className="grid grid-cols-2 md:grid-cols-4 bg-bg-elevated border-b border-border-subtle p-6 md:p-8 gap-6">
          <div className="space-y-1">
            <p className="text-[12px] font-medium text-text-secondary m-0">Peso actual</p>
            <p className="text-[20px] font-bold text-text-primary m-0">
              {val.pesoActual || val.peso || '—'}<span className="text-[14px] font-medium text-text-muted ml-1">kg</span>
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-[12px] font-medium text-text-secondary m-0">Estatura</p>
            <p className="text-[20px] font-bold text-text-primary m-0">
              {val.estatura || val.talla || '—'}<span className="text-[14px] font-medium text-text-muted ml-1">cm</span>
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-[12px] font-medium text-text-secondary m-0">IMC</p>
            <p className={`text-[20px] font-bold m-0 ${imcNum >= 30 ? 'text-accent-red' : imcNum >= 25 ? 'text-yellow-400' : 'text-text-primary'}`}>
              {imcDisplay}
            </p>
          </div>
        </div>

        {(val.pctGrasa || val.masaMagra) && (
          <div className="grid grid-cols-2 p-6 md:p-8 gap-6 border-b border-border-subtle">
            {val.pctGrasa && (
              <div className="space-y-1">
                <p className="text-[12px] font-medium text-text-secondary m-0">% Grasa</p>
                <p className="text-[18px] font-bold text-text-primary m-0">{val.pctGrasa}%</p>
              </div>
            )}
            {val.masaMagra && (
              <div className="space-y-1">
                <p className="text-[12px] font-medium text-text-secondary m-0">Masa Magra</p>
                <p className="text-[18px] font-bold text-accent-green m-0">
                  {val.masaMagra}<span className="text-[13px] font-medium text-text-muted ml-1">kg</span>
                </p>
              </div>
            )}
          </div>
        )}

        {val.comentarios && (
          <div className="p-6 md:p-8 border-b border-border-subtle">
            <p className="text-[12px] font-medium text-text-muted m-0 mb-2">Notas de consulta</p>
            <p className="text-[14px] leading-relaxed text-text-secondary font-normal m-0">{val.comentarios}</p>
          </div>
        )}

        {val.temarioConsulta?.length > 0 && (
          <div className="p-6 md:p-8 border-b border-border-subtle">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 rounded-[8px] bg-bg-elevated text-text-muted">
                <Brain className="h-4 w-4" />
              </div>
              <h3 className="text-[14px] font-semibold text-text-primary m-0">Acuerdos y Temario</h3>
            </div>
            <div className="space-y-4">
              {val.temarioConsulta.map((tema: any, i: number) => (
                <div key={tema.id || i} className="border-l-2 border-brand-primary pl-4 py-1">
                  <h4 className="text-[13px] font-semibold text-text-primary m-0 mb-1">{tema.tema}</h4>
                  <p className="text-[14px] text-text-secondary leading-relaxed m-0">{tema.detalle}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* BARRIDO DE EQUIVALENCIAS — componente compartido */}
      <div className="bg-bg-surface border border-border-subtle rounded-[12px] overflow-hidden">
        <button
          onClick={() => setShowBarrido(!showBarrido)}
          className="w-full flex items-center justify-between p-6 hover:bg-bg-elevated/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-[8px] transition-all ${showBarrido ? 'bg-brand-primary/20 text-brand-primary' : 'bg-bg-elevated text-text-muted'}`}>
              <Layers className="w-4 h-4" />
            </div>
            <div className="text-left">
              <h3 className="text-[15px] font-semibold text-text-primary m-0">Barrido de Equivalencias</h3>
              <p className="text-[12px] text-text-muted m-0">
                {barridoData
                  ? `${Math.round(barridoData.kcalTotal || 0).toLocaleString()} kcal registradas`
                  : 'Sin datos — haz clic para ingresar'}
              </p>
            </div>
          </div>
          {showBarrido ? <ChevronUp className="w-5 h-5 text-text-muted" /> : <ChevronDown className="w-5 h-5 text-text-muted" />}
        </button>

        {showBarrido && (
          <div className="p-6 border-t border-border-subtle animate-fade-in space-y-4">
            <BarridoEquivalenciasComp
              value={barridoData}
              onChange={(data) => setBarridoData(data)}
            />
            {/* Botón "Guardar barrido" separado — POST upsert */}
            <div className="flex items-center justify-between pt-4 mt-2 border-t border-border-subtle">
              <div className="text-[12px] text-accent-red font-medium">
                {barridoData?.isValid === false && (
                  <span className="flex items-center gap-1.5"><AlertCircle className="w-4 h-4" /> La distribución de comidas no de cuadra con las porciones planeadas.</span>
                )}
              </div>
              <button
                onClick={handleGuardarBarrido}
                disabled={savingBarrido || barridoData?.isValid === false || JSON.stringify(barridoData) === initialBarridoData}
                className="flex items-center gap-2 px-5 py-2.5 bg-brand-primary text-bg-base rounded-[8px] text-[13px] font-bold hover:bg-[#e0e0e0] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {savingBarrido ? (
                  <div className="w-4 h-4 border-2 border-bg-base/30 border-t-bg-base rounded-full animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                Guardar barrido
              </button>
            </div>
          </div>
        )}
      </div>

      {/* PLAN ALIMENTICIO DE ESTA CONSULTA */}
      <div className="bg-bg-surface border border-border-subtle rounded-[12px] p-6 space-y-4">
        <div className="flex items-center gap-3 border-b border-border-subtle pb-4">
          <div className="p-2 rounded-[8px] bg-bg-elevated text-text-muted">
            <FileText className="w-4 h-4" />
          </div>
          <h3 className="text-[15px] font-semibold text-text-primary m-0">Plan alimenticio de esta consulta</h3>
        </div>

        <PlanSection
          pacienteId={pacienteId!}
          valoracionId={valoracionId!}
          planLigado={val.plan || (val.planId ? { id: val.planId } : undefined)}
        />
      </div>
    </div>
  );
};

export default AssessmentDetail;
