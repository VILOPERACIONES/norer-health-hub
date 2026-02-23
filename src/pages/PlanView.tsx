import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit2, FileText, MessageCircle, Lock } from 'lucide-react';
import api from '@/lib/api';
import type { Plan } from '@/types';
import { formatDate, formatDecimal } from '@/lib/format';
import { useToast } from '@/hooks/use-toast';

const mockPlan: Plan = {
  _id: 'p1', pacienteId: '1', tipo: 'Balanceada', calorias: 1600,
  macros: { proteinas: 30, carbohidratos: 45, grasas: 25 },
  menus: [
    { nombre: 'Menú #1', tiempos: [
      { nombre: 'Desayuno', ingredientes: [{ descripcion: '2 huevos revueltos', cantidad: 2, unidad: 'pza', equivalentes: '2 eq aoa' }, { descripcion: 'Tortilla de maíz', cantidad: 2, unidad: 'pza', equivalentes: '2 eq cereal' }], nota: 'Tomar con agua natural 250ml' },
      { nombre: 'Colación mañana', ingredientes: [{ descripcion: 'Manzana', cantidad: 1, unidad: 'pza', equivalentes: '1 eq fruta' }] },
      { nombre: 'Almuerzo', ingredientes: [{ descripcion: 'Pechuga de pollo', cantidad: 120, unidad: 'gr', equivalentes: '4 eq aoa mb' }, { descripcion: 'Arroz integral', cantidad: 80, unidad: 'gr', equivalentes: '2 eq cereal' }, { descripcion: 'Ensalada mixta', cantidad: 1, unidad: 'taza', equivalentes: '1 eq verdura' }] },
      { nombre: 'Cena', ingredientes: [{ descripcion: 'Atún en agua', cantidad: 1, unidad: 'lata', equivalentes: '3 eq aoa mb' }, { descripcion: 'Tostadas integrales', cantidad: 2, unidad: 'pza', equivalentes: '2 eq cereal' }] },
    ]},
    { nombre: 'Menú #2', tiempos: [
      { nombre: 'Desayuno', ingredientes: [{ descripcion: 'Avena con leche', cantidad: 40, unidad: 'gr', equivalentes: '2 eq cereal' }, { descripcion: 'Plátano', cantidad: 1, unidad: 'pza', equivalentes: '1 eq fruta' }] },
      { nombre: 'Almuerzo', ingredientes: [{ descripcion: 'Filete de res', cantidad: 100, unidad: 'gr', equivalentes: '3 eq aoa mb' }, { descripcion: 'Pasta integral', cantidad: 80, unidad: 'gr', equivalentes: '2 eq cereal' }] },
      { nombre: 'Cena', ingredientes: [{ descripcion: 'Quesadilla con queso panela', cantidad: 2, unidad: 'pza', equivalentes: '2 eq cereal + 2 eq aoa' }] },
    ]},
  ],
  proximaSesion: '2026-03-10', notas: 'Incrementar proteína gradualmente. Hidratación mínima 2L de agua.', activo: true,
};

const PlanView = () => {
  const { id: pacienteId, planId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [plan, setPlan] = useState<Plan>(mockPlan);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get(`/api/pacientes/${pacienteId}/planes/${planId}`);
        setPlan(data);
      } catch { /* mock */ }
    };
    fetch();
  }, [pacienteId, planId]);

  const handlePdf = () => {
    toast({ title: 'Configuración pendiente', description: 'La generación de PDF estará disponible próximamente.' });
  };

  const handleWhatsApp = () => {
    toast({ title: 'Configuración pendiente', description: 'El envío por WhatsApp estará disponible próximamente.' });
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <button onClick={() => navigate(`/pacientes/${pacienteId}`)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Volver al paciente
      </button>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Plan nutricional</h1>
          <p className="text-sm text-muted-foreground">{plan.tipo} · {plan.calorias} kcal · P{plan.macros.proteinas}% C{plan.macros.carbohidratos}% G{plan.macros.grasas}%</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => navigate(`/pacientes/${pacienteId}/planes/${planId}/editar`)}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-accent transition-colors"
          >
            <Edit2 className="h-4 w-4" /> Editar plan
          </button>
          <button
            onClick={handlePdf}
            className="flex items-center gap-2 bg-card text-muted-foreground border border-border px-4 py-2 rounded-lg text-sm font-medium hover:bg-muted transition-colors"
          >
            <FileText className="h-4 w-4" /> Generar PDF
            <Lock className="h-3 w-3 ml-1" />
          </button>
          <button
            onClick={handleWhatsApp}
            className="flex items-center gap-2 bg-card text-muted-foreground border border-border px-4 py-2 rounded-lg text-sm font-medium hover:bg-muted transition-colors"
          >
            <MessageCircle className="h-4 w-4" /> Enviar por WhatsApp
            <Lock className="h-3 w-3 ml-1" />
          </button>
        </div>
      </div>

      {plan.notas && (
        <div className="norder-card">
          <p className="text-sm text-muted-foreground">{plan.notas}</p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {plan.menus.map((menu, i) => (
          <div key={i} className="norder-card">
            <h3 className="text-lg font-semibold text-foreground mb-4">{menu.nombre}</h3>
            <div className="space-y-4">
              {menu.tiempos.map((t, j) => (
                <div key={j}>
                  <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-1.5">{t.nombre}</p>
                  <ul className="space-y-0.5">
                    {t.ingredientes.map((ing, k) => (
                      <li key={k} className="text-sm text-foreground">
                        — {ing.cantidad} {ing.unidad} {ing.descripcion}
                        {ing.equivalentes && <span className="text-muted-foreground ml-1">({ing.equivalentes})</span>}
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

      {plan.proximaSesion && (
        <div className="norder-card bg-muted/50">
          <p className="text-sm text-muted-foreground">
            Próxima sesión: <strong className="text-foreground">{formatDate(plan.proximaSesion)}</strong>
            {plan.proximaSesionHora && ` a las ${plan.proximaSesionHora}`}
          </p>
        </div>
      )}
    </div>
  );
};

export default PlanView;
