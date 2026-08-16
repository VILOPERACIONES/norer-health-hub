/**
 * invalidation.ts — Helpers centralizados para invalidar queries relacionadas
 * después de mutaciones.
 *
 * Cada helper invalida todas las queries que podrían verse afectadas por un
 * cambio en una entidad. Esto resuelve el problema de "datos stale" al
 * navegar entre vistas después de crear/editar/eliminar.
 */
import type { QueryClient } from '@tanstack/react-query';
import { queryKeys } from './queryKeys';

/**
 * Invalida queries después de crear, editar o eliminar un paciente.
 * Afecta: lista de pacientes, detalle del paciente, y métricas del dashboard.
 */
export function invalidateAfterPacienteChange(qc: QueryClient, pacienteId?: string) {
  // Invalida TODAS las variantes de la lista (con/sin búsqueda)
  qc.invalidateQueries({ queryKey: queryKeys.pacientes.all });

  // Si tenemos el ID, invalidar también el detalle específico
  if (pacienteId) {
    qc.invalidateQueries({ queryKey: queryKeys.pacientes.detail(pacienteId) });
  }

  // El dashboard depende de la lista de pacientes para KPIs
  qc.invalidateQueries({ queryKey: queryKeys.dashboard.all });
}

/**
 * Invalida queries después de crear, editar, enviar o eliminar un plan.
 * Afecta: lista de pacientes (contiene status del plan), detalle del paciente,
 *         valoraciones, planes base, y dashboard.
 */
export function invalidateAfterPlanChange(qc: QueryClient, pacienteId?: string) {
  // La lista de pacientes incluye planes embebidos (para calcular pendientes)
  qc.invalidateQueries({ queryKey: queryKeys.pacientes.all });

  if (pacienteId) {
    qc.invalidateQueries({ queryKey: queryKeys.pacientes.detail(pacienteId) });
    // Las valoraciones traen el plan asociado
    qc.invalidateQueries({ queryKey: queryKeys.valoraciones.byPaciente(pacienteId) });
  }

  // Planes base (biblioteca de menús)
  qc.invalidateQueries({ queryKey: queryKeys.planes.base() });

  // Dashboard muestra métricas de menús pendientes
  qc.invalidateQueries({ queryKey: queryKeys.dashboard.all });
}

/**
 * Invalida queries después de crear o editar una valoración.
 * Afecta: valoraciones del paciente, detalle del paciente, lista de pacientes,
 *         y dashboard (consultas de hoy/mes).
 */
export function invalidateAfterValoracionChange(qc: QueryClient, pacienteId: string) {
  qc.invalidateQueries({ queryKey: queryKeys.valoraciones.byPaciente(pacienteId) });
  qc.invalidateQueries({ queryKey: queryKeys.valoraciones.archived(pacienteId) });
  qc.invalidateQueries({ queryKey: queryKeys.pacientes.detail(pacienteId) });
  // La lista de pacientes embebe valoraciones (para Dashboard y Pending)
  qc.invalidateQueries({ queryKey: queryKeys.pacientes.all });
  // Dashboard muestra consultas de hoy y métricas
  qc.invalidateQueries({ queryKey: queryKeys.dashboard.all });
}

/**
 * Invalida queries después de crear, editar o eliminar un platillo.
 */
export function invalidateAfterPlatilloChange(qc: QueryClient) {
  qc.invalidateQueries({ queryKey: queryKeys.platillos.all() });
}
