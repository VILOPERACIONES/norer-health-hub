import { useState, useEffect } from 'react';
import { Bot, Copy, CreditCard, Check, Lock, ExternalLink } from 'lucide-react';
import api from '@/lib/api';
import type { Paciente } from '@/types';
import { formatDate } from '@/lib/format';
import { useToast } from '@/hooks/use-toast';

const mockSuscriptores: (Paciente & { membresiaVencimiento?: string })[] = [
  { _id: '1', nombre: 'Ana', apellido: 'García López', telefono: '555-123-4567', membresia: 'premium', membresiaVencimiento: '2026-06-15', ultimoPeso: 65.2, ultimaVisita: '2026-02-10' },
  { _id: '5', nombre: 'Laura', apellido: 'Méndez', telefono: '555-111-2222', membresia: 'basica', membresiaVencimiento: '2026-04-01', ultimoPeso: 70.3, ultimaVisita: '2026-02-18' },
  { _id: '2', nombre: 'Carlos', apellido: 'Ramírez Soto', telefono: '555-987-6543', membresia: 'basica', membresiaVencimiento: '2026-03-20', ultimoPeso: 82.5, ultimaVisita: '2026-01-05' },
];

const WhatsAppBot = () => {
  const [suscriptores, setSuscriptores] = useState(mockSuscriptores);
  const [linkModal, setLinkModal] = useState<{ open: boolean; link: string; nivel: string }>({ open: false, link: '', nivel: '' });
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get('/api/pacientes', { params: { membresia: 'activa' } });
        setSuscriptores(data);
      } catch { /* mock */ }
    };
    fetch();
  }, []);

  const diasRestantes = (fecha?: string) => {
    if (!fecha) return 0;
    return Math.max(0, Math.floor((new Date(fecha).getTime() - Date.now()) / 86400000));
  };

  const generarLink = async (nivel: string) => {
    try {
      // Mock - real endpoint: POST /api/membresias/link-pago
      const link = `https://pay.norer.com/${nivel}/${Date.now()}`;
      setLinkModal({ open: true, link, nivel });
      toast({ title: 'Configuración pendiente', description: 'Los links de pago con Stripe estarán disponibles próximamente.' });
    } catch { /* */ }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(linkModal.link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Bot className="h-6 w-6 text-primary" /> Bot WhatsApp
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Gestión de membresías y suscriptores</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => generarLink('basica')}
          className="flex items-center gap-2 bg-card text-foreground border border-border px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-muted transition-colors"
        >
          <CreditCard className="h-4 w-4" /> Link de pago Básica
          <Lock className="h-3 w-3 text-muted-foreground" />
        </button>
        <button
          onClick={() => generarLink('premium')}
          className="flex items-center gap-2 bg-card text-foreground border border-border px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-muted transition-colors"
        >
          <CreditCard className="h-4 w-4" /> Link de pago Premium
          <Lock className="h-3 w-3 text-muted-foreground" />
        </button>
      </div>

      <div className="norer-card p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="font-semibold text-foreground">Suscriptores activos ({suscriptores.length})</h2>
        </div>
        <div className="divide-y divide-border">
          {suscriptores.map((p) => {
            const dias = diasRestantes(p.membresiaVencimiento);
            return (
              <div key={p._id} className="flex items-center justify-between px-6 py-4">
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{p.nombre} {p.apellido}</p>
                  <p className="text-xs text-muted-foreground">{p.telefono}</p>
                </div>
                <span className={p.membresia === 'premium' ? 'norer-badge-premium' : 'norer-badge-basica'}>
                  {p.membresia === 'premium' ? 'Premium' : 'Básica'}
                </span>
                <div className="ml-4 text-right">
                  <p className="text-xs text-muted-foreground">Vence: {p.membresiaVencimiento ? formatDate(p.membresiaVencimiento) : '—'}</p>
                  <p className={`text-xs font-medium ${dias <= 7 ? 'text-destructive' : 'text-muted-foreground'}`}>
                    {dias} días restantes
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Link Modal */}
      {linkModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-foreground/20" onClick={() => setLinkModal({ ...linkModal, open: false })} />
          <div className="relative norer-card max-w-md w-full">
            <h3 className="font-semibold text-foreground mb-2">Link de pago — {linkModal.nivel}</h3>
            <p className="text-xs text-muted-foreground mb-4">Copia este enlace y envíaselo al paciente</p>
            <div className="flex gap-2">
              <input value={linkModal.link} readOnly className="norer-input flex-1 text-xs" />
              <button onClick={copyLink} className="bg-primary text-primary-foreground px-3 py-2 rounded-lg hover:bg-accent transition-colors">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground bg-muted p-2 rounded-lg">
              <Lock className="h-3 w-3" />
              <span>Integración con Stripe pendiente de configuración</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WhatsAppBot;
