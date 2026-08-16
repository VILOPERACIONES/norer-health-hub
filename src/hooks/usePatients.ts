import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Paciente } from '@/types';
import { queryKeys } from '@/lib/queryKeys';
import { invalidateAfterPacienteChange } from '@/lib/invalidation';

// ── Fetch todos los pacientes (con búsqueda opcional) ─────────────────────────
export const usePatients = (search = '') => {
  return useQuery({
    queryKey: queryKeys.pacientes.list(search),
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
    queryKey: queryKeys.pacientes.detail(id!),
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
      invalidateAfterPacienteChange(qc);
    },
  });
};

// ── Actualizar paciente ────────────────────────────────────────────────────────
export const useUpdatePaciente = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<Paciente>) => api.put(`/api/pacientes/${id}`, body),
    onSuccess: () => {
      invalidateAfterPacienteChange(qc, id);
    },
  });
};
