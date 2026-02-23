import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, UserPlus, ChevronRight } from 'lucide-react';
import api from '@/lib/api';
import type { Paciente } from '@/types';
import { formatDate } from '@/lib/format';

const mockPacientes: Paciente[] = [
  { _id: '1', nombre: 'Ana', apellido: 'García López', telefono: '555-123-4567', sexo: 'F', membresia: 'premium', ultimoPeso: 65.2, ultimaVisita: '2026-02-10' },
  { _id: '2', nombre: 'Carlos', apellido: 'Ramírez Soto', telefono: '555-987-6543', sexo: 'M', membresia: 'basica', ultimoPeso: 82.5, ultimaVisita: '2026-01-05' },
  { _id: '3', nombre: 'María', apellido: 'Torres', telefono: '555-456-7890', sexo: 'F', membresia: 'ninguna', ultimoPeso: 58.0, ultimaVisita: '2026-02-20' },
  { _id: '4', nombre: 'José', apellido: 'Hernández', telefono: '555-321-0987', sexo: 'M', membresia: 'premium', ultimoPeso: 90.1, ultimaVisita: '2025-12-15' },
  { _id: '5', nombre: 'Laura', apellido: 'Méndez', telefono: '555-111-2222', sexo: 'F', membresia: 'basica', ultimoPeso: 70.3, ultimaVisita: '2026-02-18' },
];

const Patients = () => {
  const [pacientes, setPacientes] = useState<Paciente[]>(mockPacientes);
  const [search, setSearch] = useState('');
  const [filtro, setFiltro] = useState('todos');
  const navigate = useNavigate();

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get('/api/pacientes', { params: { buscar: search || undefined } });
        setPacientes(data);
      } catch { /* use mock */ }
    };
    fetch();
  }, [search]);

  const filtered = pacientes.filter((p) => {
    const matchSearch =
      !search ||
      `${p.nombre} ${p.apellido}`.toLowerCase().includes(search.toLowerCase()) ||
      p.telefono.includes(search);
    const matchFilter = filtro === 'todos' || p.membresia === filtro;
    return matchSearch && matchFilter;
  });

  const diasSinVisita = (fecha?: string) => {
    if (!fecha) return null;
    const diff = Math.floor((Date.now() - new Date(fecha).getTime()) / 86400000);
    return diff;
  };

  const badgeClass = (m?: string) => {
    if (m === 'premium') return 'norder-badge-premium';
    if (m === 'basica') return 'norder-badge-basica';
    return 'norder-badge-none';
  };

  const badgeLabel = (m?: string) => {
    if (m === 'premium') return 'Premium';
    if (m === 'basica') return 'Básica';
    return 'Sin membresía';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pacientes</h1>
          <p className="text-sm text-muted-foreground mt-1">{filtered.length} pacientes encontrados</p>
        </div>
        <button
          onClick={() => navigate('/pacientes/nuevo')}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-accent transition-colors self-start"
        >
          <UserPlus className="h-4 w-4" /> Nuevo paciente
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por nombre o teléfono..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="norder-input w-full pl-10"
          />
        </div>
        <select
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          className="norder-input"
        >
          <option value="todos">Todas las membresías</option>
          <option value="ninguna">Sin membresía</option>
          <option value="basica">Básica</option>
          <option value="premium">Premium</option>
        </select>
      </div>

      <div className="norder-card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Paciente</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3 hidden md:table-cell">Teléfono</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3 hidden lg:table-cell">Último peso</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Membresía</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3 hidden sm:table-cell">Última visita</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((p) => {
                const dias = diasSinVisita(p.ultimaVisita);
                return (
                  <tr key={p._id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-foreground">{p.nombre} {p.apellido}</p>
                      <p className="text-xs text-muted-foreground md:hidden">{p.telefono}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground hidden md:table-cell">{p.telefono}</td>
                    <td className="px-6 py-4 text-sm text-foreground hidden lg:table-cell">
                      {p.ultimoPeso ? `${p.ultimoPeso.toFixed(1)} kg` : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={badgeClass(p.membresia)}>{badgeLabel(p.membresia)}</span>
                    </td>
                    <td className="px-6 py-4 hidden sm:table-cell">
                      <div className="flex flex-col">
                        <span className="text-sm text-foreground">{p.ultimaVisita ? formatDate(p.ultimaVisita) : '—'}</span>
                        {dias !== null && dias > 30 && (
                          <span className="text-xs text-destructive font-medium">{dias} días sin visita</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => navigate(`/pacientes/${p._id}`)}
                        className="text-primary hover:text-accent transition-colors"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Patients;
