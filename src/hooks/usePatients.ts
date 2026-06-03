import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Paciente } from '@/types';

const KEY = 'pacientes';

// ── Fetch todos los pacientes (con búsqueda opcional) ─────────────────────────
export const usePatients = (search = '') => {
  return useQuery({
    queryKey: [KEY, search],
    queryFn: async () => {
      const url = `/api/pacientes${search ? `?buscar=${encodeURIComponent(search)}` : ''}`;
      const { data } = await api.get(url);
      const list = data?.data || data;
      return Array.isArray(list) ? (list as Paciente[]) : [];
    },
    staleTime: 60 * 1000,           // 1 min — navegación instantánea desde cache
    refetchInterval: 60 * 1000,     // Refresca en background cada minuto
    placeholderData: (prev) => prev, // Muestra datos anteriores mientras refresca
  });
};

// ── Fetch paciente individual ─────────────────────────────────────────────────
export const usePaciente = (id: string | undefined) => {
  return useQuery({
    queryKey: [KEY, id],
    queryFn: async () => {
      const { data } = await api.get(`/api/pacientes/${id}`);
      return (data?.data || data) as Paciente;
    },
    enabled: !!id,
    staleTime: 60 * 1000,
    placeholderData: (prev) => prev,
  });
};

// ── Crear paciente ─────────────────────────────────────────────────────────────
export const useCreatePaciente = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<Paciente>) => api.post('/api/pacientes', body),
    onSuccess: () => {
      // Invalida la lista general para que recargue con el nuevo paciente
      qc.invalidateQueries({ queryKey: [KEY] });
    },
  });
};

// ── Actualizar paciente ────────────────────────────────────────────────────────
export const useUpdatePaciente = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<Paciente>) => api.put(`/api/pacientes/${id}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY, id] });
      qc.invalidateQueries({ queryKey: [KEY] });
    },
  });
};
