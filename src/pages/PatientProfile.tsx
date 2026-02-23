import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Phone, Mail, Calendar, UserCog, Plus, FileText, ArrowLeft, Edit2, Save, X } from 'lucide-react';
import api from '@/lib/api';
import type { Paciente, Valoracion, Plan, Ejercicio, Antecedentes, Consumo } from '@/types';
import { formatDate, formatDecimal } from '@/lib/format';
import { useToast } from '@/hooks/use-toast';

const mockPaciente: Paciente = {
  _id: '1', nombre: 'Ana', apellido: 'García López', telefono: '555-123-4567',
  email: 'ana@email.com', fechaNacimiento: '1990-05-15', sexo: 'F',
  membresia: 'premium', ultimoPeso: 65.2, ultimaVisita: '2026-02-10',
};

const mockValoraciones: Valoracion[] = [
  { _id: 'v1', pacienteId: '1', fecha: '2026-02-10', numeracion: 3, peso: 65.2, talla: 1.62, imc: 24.8, porcentajeGrasa: 28.5 },
  { _id: 'v2', pacienteId: '1', fecha: '2026-01-10', numeracion: 2, peso: 66.8, talla: 1.62, imc: 25.5, porcentajeGrasa: 29.1 },
  { _id: 'v3', pacienteId: '1', fecha: '2025-12-05', numeracion: 1, peso: 68.0, talla: 1.62, imc: 25.9, porcentajeGrasa: 30.2 },
];

const mockPlan: Plan = {
  _id: 'p1', pacienteId: '1', tipo: 'Balanceada', calorias: 1600,
  macros: { proteinas: 30, carbohidratos: 45, grasas: 25 },
  menus: [
    { nombre: 'Menú #1', tiempos: [
      { nombre: 'Desayuno', ingredientes: [{ descripcion: '2 huevos revueltos', cantidad: 2, unidad: 'pza', equivalentes: '2 eq aoa' }, { descripcion: 'Tortilla de maíz', cantidad: 2, unidad: 'pza', equivalentes: '2 eq cereal' }], nota: 'Tomar con agua natural 250ml' },
      { nombre: 'Colación mañana', ingredientes: [{ descripcion: 'Manzana', cantidad: 1, unidad: 'pza', equivalentes: '1 eq fruta' }] },
      { nombre: 'Almuerzo', ingredientes: [{ descripcion: 'Pechuga de pollo', cantidad: 120, unidad: 'gr', equivalentes: '4 eq aoa mb' }, { descripcion: 'Arroz integral', cantidad: 80, unidad: 'gr', equivalentes: '2 eq cereal' }] },
    ]},
    { nombre: 'Menú #2', tiempos: [
      { nombre: 'Desayuno', ingredientes: [{ descripcion: 'Avena con leche', cantidad: 40, unidad: 'gr', equivalentes: '2 eq cereal' }] },
      { nombre: 'Almuerzo', ingredientes: [{ descripcion: 'Filete de res', cantidad: 100, unidad: 'gr', equivalentes: '3 eq aoa mb' }] },
    ]},
  ],
  proximaSesion: '2026-03-10', notas: 'Incrementar proteína gradualmente', activo: true,
};

type Tab = 'expediente' | 'historial' | 'plan';

const PatientProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [paciente, setPaciente] = useState<Paciente>(mockPaciente);
  const [valoraciones, setValoraciones] = useState<Valoracion[]>(mockValoraciones);
  const [planActivo, setPlanActivo] = useState<Plan | null>(mockPlan);
  const [tab, setTab] = useState<Tab>('expediente');
  const [editingSection, setEditingSection] = useState<string | null>(null);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [pRes, vRes, plRes] = await Promise.all([
          api.get(`/api/pacientes/${id}`),
          api.get(`/api/pacientes/${id}/valoraciones`),
          api.get(`/api/pacientes/${id}/planes/activo`).catch(() => ({ data: null })),
        ]);
        setPaciente(pRes.data);
        setValoraciones(vRes.data);
        setPlanActivo(plRes.data);
      } catch { /* mock */ }
    };
    fetchAll();
  }, [id]);

  const calcAge = (dob?: string) => {
    if (!dob) return '—';
    const diff = Date.now() - new Date(dob).getTime();
    return Math.floor(diff / 31557600000);
  };

  const badgeClass = (m?: string) => m === 'premium' ? 'norder-badge-premium' : m === 'basica' ? 'norder-badge-basica' : 'norder-badge-none';
  const badgeLabel = (m?: string) => m === 'premium' ? 'Premium' : m === 'basica' ? 'Básica' : 'Sin membresía';

  const tabs: { key: Tab; label: string }[] = [
    { key: 'expediente', label: 'Expediente' },
    { key: 'historial', label: 'Historial' },
    { key: 'plan', label: 'Plan Activo' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <button onClick={() => navigate('/pacientes')} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> Volver a pacientes
      </button>

      {/* Header */}
      <div className="norder-card">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-xl font-bold text-foreground">{paciente.nombre} {paciente.apellido}</h1>
              <span className={badgeClass(paciente.membresia)}>{badgeLabel(paciente.membresia)}</span>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{paciente.telefono}</span>
              {paciente.email && <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{paciente.email}</span>}
              <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{calcAge(paciente.fechaNacimiento)} años · {paciente.sexo === 'F' ? 'Femenino' : 'Masculino'}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => navigate(`/pacientes/${id}/valoracion/nueva`)}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-accent transition-colors"
            >
              <Plus className="h-4 w-4" /> Nueva valoración
            </button>
            {planActivo && (
              <button
                onClick={() => navigate(`/pacientes/${id}/planes/${planActivo._id}`)}
                className="flex items-center gap-2 bg-card text-foreground border border-border px-4 py-2 rounded-lg text-sm font-medium hover:bg-muted transition-colors"
              >
                <FileText className="h-4 w-4" /> Ver plan activo
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === t.key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'expediente' && (
        <div className="space-y-4">
          <ExpedienteSection title="Datos personales" fields={[
            { label: 'Nombre', value: `${paciente.nombre} ${paciente.apellido}` },
            { label: 'Teléfono', value: paciente.telefono },
            { label: 'Email', value: paciente.email || '—' },
            { label: 'Fecha de nacimiento', value: paciente.fechaNacimiento ? formatDate(paciente.fechaNacimiento) : '—' },
            { label: 'Sexo', value: paciente.sexo === 'F' ? 'Femenino' : paciente.sexo === 'M' ? 'Masculino' : '—' },
          ]} />
          <ExpedienteSection title="Ejercicio" fields={[
            { label: 'Tipo', value: 'Cardio y pesas' },
            { label: 'Frecuencia', value: '4 veces por semana' },
            { label: 'Duración', value: '60 minutos' },
          ]} />
          <ExpedienteSection title="Antecedentes clínicos" fields={[
            { label: 'Personales', value: 'Sin antecedentes relevantes' },
            { label: 'Familiares', value: 'Diabetes tipo 2 (padre)' },
            { label: 'Alergias', value: 'Ninguna' },
          ]} />
          <ExpedienteSection title="Hábitos alimentarios" fields={[
            { label: 'Desayuno habitual', value: 'Cereal con leche' },
            { label: 'Agua', value: '1.5 litros al día' },
            { label: 'Alcohol', value: 'Ocasional' },
          ]} />
        </div>
      )}

      {tab === 'historial' && (
        <div className="space-y-3">
          {valoraciones.length === 0 ? (
            <div className="norder-card text-center py-8 text-muted-foreground text-sm">
              No hay valoraciones registradas
            </div>
          ) : (
            valoraciones.map((v) => (
              <div key={v._id} className="norder-card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Valoración #{v.numeracion} — {formatDate(v.fecha)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Peso: {formatDecimal(v.peso)} kg · IMC: {v.imc ? formatDecimal(v.imc) : '—'} · % Grasa: {v.porcentajeGrasa ? formatDecimal(v.porcentajeGrasa) : '—'}%
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/pacientes/${id}/valoraciones/${v._id}`)}
                    className="text-xs text-primary hover:text-accent font-medium px-3 py-1.5 border border-border rounded-lg hover:bg-muted transition-colors"
                  >
                    Ver detalle
                  </button>
                  {v.plan && (
                    <button
                      onClick={() => navigate(`/pacientes/${id}/planes/${v.plan!._id}`)}
                      className="text-xs text-primary hover:text-accent font-medium px-3 py-1.5 border border-border rounded-lg hover:bg-muted transition-colors"
                    >
                      Ver plan
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'plan' && (
        <div>
          {planActivo ? (
            <div className="space-y-4">
              <div className="norder-card">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-foreground">{planActivo.tipo}</h3>
                    <p className="text-sm text-muted-foreground">{planActivo.calorias} kcal · P{planActivo.macros.proteinas}% C{planActivo.macros.carbohidratos}% G{planActivo.macros.grasas}%</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => navigate(`/pacientes/${id}/planes/${planActivo._id}/editar`)} className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-lg font-medium hover:bg-accent transition-colors">Editar plan</button>
                  </div>
                </div>
                {planActivo.notas && <p className="text-sm text-muted-foreground mb-4">{planActivo.notas}</p>}
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {planActivo.menus.map((menu, i) => (
                  <div key={i} className="norder-card">
                    <h4 className="font-semibold text-foreground mb-3">{menu.nombre}</h4>
                    <div className="space-y-3">
                      {menu.tiempos.map((t, j) => (
                        <div key={j}>
                          <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-1">{t.nombre}</p>
                          <ul className="space-y-0.5">
                            {t.ingredientes.map((ing, k) => (
                              <li key={k} className="text-sm text-foreground">
                                — {ing.cantidad} {ing.unidad} {ing.descripcion} {ing.equivalentes && <span className="text-muted-foreground">({ing.equivalentes})</span>}
                              </li>
                            ))}
                          </ul>
                          {t.nota && <p className="text-xs text-muted-foreground mt-1 italic">{t.nota}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="norder-card text-center py-8">
              <p className="text-muted-foreground text-sm mb-3">No hay plan activo</p>
              <button
                onClick={() => navigate(`/pacientes/${id}/planes/nuevo`)}
                className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-accent transition-colors"
              >
                Crear plan nutricional
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const ExpedienteSection = ({ title, fields }: { title: string; fields: { label: string; value: string }[] }) => (
  <div className="norder-card">
    <div className="flex items-center justify-between mb-4">
      <h3 className="font-semibold text-foreground">{title}</h3>
      <button className="flex items-center gap-1 text-xs text-primary hover:text-accent font-medium">
        <Edit2 className="h-3 w-3" /> Editar
      </button>
    </div>
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {fields.map((f) => (
        <div key={f.label}>
          <p className="text-xs text-muted-foreground">{f.label}</p>
          <p className="text-sm text-foreground">{f.value}</p>
        </div>
      ))}
    </div>
  </div>
);

export default PatientProfile;
