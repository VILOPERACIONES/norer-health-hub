import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit2 } from 'lucide-react';
import api from '@/lib/api';
import type { Valoracion } from '@/types';
import { formatDate, formatDecimal } from '@/lib/format';

const mockValoracion: Valoracion = {
  _id: 'v1', pacienteId: '1', fecha: '2026-02-10', hora: '10:00', numeracion: 3,
  peso: 65.2, talla: 1.62, imc: 24.84, porcentajeGrasa: 28.5,
  pliegues: { Trícep: 18, Bícep: 8, Subescapular: 14, 'Cresta ilíaca': 20, Supraespinal: 12, Abdominal: 22, 'Muslo frontal': 24, Pantorrilla: 16 },
  perimetros: { 'Brazo relajado': 28, 'Brazo contraído': 30, Cintura: 76, Cadera: 98 },
  composicion: { pctGrasa: 28.5, kgGrasa: 18.6, kgMagra: 46.6 },
  comentarios: 'Paciente presenta mejoría respecto a la valoración anterior. Continuar con plan actual.',
  suplementacion: 'Proteína whey 1 scoop post-entreno',
};

const AssessmentDetail = () => {
  const { id: pacienteId, valoracionId } = useParams();
  const navigate = useNavigate();
  const [val, setVal] = useState<Valoracion>(mockValoracion);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get(`/api/pacientes/${pacienteId}/valoraciones/${valoracionId}`);
        setVal(data);
      } catch { /* mock */ }
    };
    fetch();
  }, [pacienteId, valoracionId]);

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="norer-card">
      <h3 className="font-semibold text-foreground mb-3">{title}</h3>
      {children}
    </div>
  );

  const DataRow = ({ label, value }: { label: string; value: string | number }) => (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm text-foreground font-medium">{typeof value === 'number' ? formatDecimal(value) : value}</p>
    </div>
  );

  return (
    <div className="space-y-4 animate-fade-in max-w-4xl">
      <button onClick={() => navigate(`/pacientes/${pacienteId}`)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Volver al paciente
      </button>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Valoración #{val.numeracion}</h1>
          <p className="text-sm text-muted-foreground">{formatDate(val.fecha)}{val.hora && ` · ${val.hora}`}</p>
        </div>
        <button className="flex items-center gap-2 bg-card text-foreground border border-border px-4 py-2 rounded-lg text-sm font-medium hover:bg-muted transition-colors">
          <Edit2 className="h-4 w-4" /> Editar
        </button>
      </div>

      <Section title="Datos básicos">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <DataRow label="Peso" value={`${formatDecimal(val.peso)} kg`} />
          <DataRow label="Talla" value={`${formatDecimal(val.talla)} m`} />
          <DataRow label="IMC" value={val.imc ? formatDecimal(val.imc) : '—'} />
          <DataRow label="% Grasa" value={val.porcentajeGrasa ? `${formatDecimal(val.porcentajeGrasa)}%` : '—'} />
        </div>
      </Section>

      {val.pliegues && Object.keys(val.pliegues).length > 0 && (
        <Section title="Pliegues (mm)">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(val.pliegues).map(([k, v]) => (
              <DataRow key={k} label={k} value={v} />
            ))}
          </div>
        </Section>
      )}

      {val.perimetros && Object.keys(val.perimetros).length > 0 && (
        <Section title="Perímetros (cm)">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(val.perimetros).map(([k, v]) => (
              <DataRow key={k} label={k} value={v} />
            ))}
          </div>
        </Section>
      )}

      {val.composicion && (
        <Section title="Composición corporal">
          <div className="grid grid-cols-3 gap-4">
            <DataRow label="% Grasa" value={`${formatDecimal(val.composicion.pctGrasa || 0)}%`} />
            <DataRow label="Kg grasa" value={`${formatDecimal(val.composicion.kgGrasa || 0)} kg`} />
            <DataRow label="Masa magra" value={`${formatDecimal(val.composicion.kgMagra || 0)} kg`} />
          </div>
        </Section>
      )}

      {(val.comentarios || val.suplementacion) && (
        <Section title="Notas">
          {val.comentarios && (
            <div className="mb-3">
              <p className="text-xs text-muted-foreground mb-1">Comentarios</p>
              <p className="text-sm text-foreground">{val.comentarios}</p>
            </div>
          )}
          {val.suplementacion && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Suplementación</p>
              <p className="text-sm text-foreground">{val.suplementacion}</p>
            </div>
          )}
        </Section>
      )}

      <div className="flex gap-3">
        <button
          onClick={() => {/* TODO: comparar */}}
          className="bg-card text-foreground border border-border px-4 py-2 rounded-lg text-sm font-medium hover:bg-muted transition-colors"
        >
          Comparar con otra valoración
        </button>
      </div>
    </div>
  );
};

export default AssessmentDetail;
