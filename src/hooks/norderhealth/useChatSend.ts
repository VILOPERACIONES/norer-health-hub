import { useMutation, useQuery } from '@tanstack/react-query';
import portalApi from '@/lib/portalApi';

export interface ChatSendPayload {
  mensaje?: string;
  imagen_base64?: string;
}

export interface ChatSendResult {
  respuesta: string;
  preguntasRestantes?: number;
  limiteGratis?: number;
}

interface ChatErrorClassification {
  message: string;
  /** El backend ya reportó un estado terminal (límite/acceso) — no es un fallo de red. */
  terminal: boolean;
  restantesOverride?: number;
}

export function classifyChatError(err: unknown): ChatErrorClassification {
  const error = err as { response?: { status?: number; data?: { error?: string; codigo?: string } } };
  const status = error.response?.status;
  const codigo = error.response?.data?.codigo;

  if (status === 429) {
    return { message: 'Demasiados mensajes seguidos. Espera un momento.', terminal: true };
  }
  if (codigo === 'limite_gratis_diario') {
    return { message: '⚠️ Límite diario alcanzado. Regresa mañana o activa un plan.', terminal: true, restantesOverride: 0 };
  }
  if (status === 403) {
    return { message: error.response?.data?.error || 'No tienes acceso a esta función.', terminal: true };
  }
  return { message: 'No pude conectarme. Intenta de nuevo.', terminal: false };
}

function isRetryableError(err: unknown): boolean {
  const error = err as { response?: { status?: number }; code?: string };
  if (error.code === 'ECONNABORTED') return true;
  const status = error.response?.status;
  if (status == null) return true; // network error, no response at all
  return status >= 500;
}

export function useChatSend() {
  return useMutation({
    mutationFn: (payload: ChatSendPayload) =>
      portalApi.post<ChatSendResult>('/api/portal/chat', payload, { timeout: 180_000 }).then((r) => r.data),
    retry: (failureCount, error) => isRetryableError(error) && failureCount < 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
  });
}

interface ChatHealth {
  healthy: boolean;
  failureRate: number;
  sampleSize: number;
}

/**
 * Consulta la señal de salud del backend (agregada sobre las últimas llamadas
 * al webhook de n8n). Solo se activa (enabled) después de un primer fallo local,
 * para no gastar una llamada extra en el camino feliz.
 */
export function useChatHealth(enabled: boolean) {
  return useQuery({
    queryKey: ['portal', 'chat-health'],
    queryFn: () => portalApi.get<ChatHealth>('/api/portal/chat/health').then((r) => r.data),
    enabled,
    refetchInterval: enabled ? 15_000 : false,
    staleTime: 10_000,
  });
}
