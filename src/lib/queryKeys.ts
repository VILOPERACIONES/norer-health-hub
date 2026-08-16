/**
 * queryKeys.ts — Factory functions centralizadas para todas las React Query keys.
 *
 * Usar estos helpers en vez de strings hardcoded garantiza que las
 * invalidaciones siempre coincidan con las keys de los useQuery.
 */
export const queryKeys = {
  pacientes: {
    /** Prefijo raíz — útil para invalidar TODO lo de pacientes */
    all: ['pacientes'] as const,
    /** Lista filtrable (search puede ser '' para la lista completa) */
    list: (search = '') => ['pacientes', search] as const,
    /** Detalle de un paciente individual */
    detail: (id: string) => ['paciente', id] as const,
  },

  valoraciones: {
    /** Todas las valoraciones de un paciente */
    byPaciente: (pacienteId: string) => ['valoraciones', pacienteId] as const,
    /** Valoraciones archivadas de un paciente */
    archived: (pacienteId: string) => ['valoraciones-archivadas', pacienteId] as const,
  },

  planes: {
    /** Lista de planes base (biblioteca de menús) */
    base: () => ['planes-base'] as const,
    /** Plan individual de un paciente */
    detail: (pacienteId: string, planId: string) => ['plan', pacienteId, planId] as const,
  },

  platillos: {
    /** Lista completa de platillos */
    all: () => ['platillos'] as const,
  },

  dashboard: {
    /** Prefijo raíz para todo el dashboard */
    all: ['dashboard'] as const,
    metricas: () => ['dashboard', 'metricas'] as const,
    alertas: () => ['dashboard', 'alertas'] as const,
    topClientes: () => ['dashboard', 'top-clientes'] as const,
  },
} as const;
