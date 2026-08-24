export interface ValuationWithPlan {
  id?: string;
  fecha?: string;
  numeroValoracion?: number;
  plan?: { id?: string } | null;
}

export interface PreviousConsultationPlan {
  planId: string;
  fecha?: string;
}

export function findPreviousConsultationPlan(
  valuations: ValuationWithPlan[] | null | undefined,
  currentValuationId?: string,
): PreviousConsultationPlan | null {
  if (!Array.isArray(valuations)) return null;

  const ordered = [...valuations].sort((a, b) => {
    const dateA = a.fecha ? new Date(a.fecha).getTime() : 0;
    const dateB = b.fecha ? new Date(b.fecha).getTime() : 0;
    const byDate = dateB - dateA;
    return byDate || Number(b.numeroValoracion || 0) - Number(a.numeroValoracion || 0);
  });

  const currentIndex = currentValuationId
    ? ordered.findIndex((item) => item.id === currentValuationId)
    : -1;
  const candidates = currentIndex >= 0 ? ordered.slice(currentIndex + 1) : ordered;
  const previous = candidates.find((item) => item.id !== currentValuationId && item.plan?.id);

  return previous?.plan?.id
    ? { planId: previous.plan.id, fecha: previous.fecha }
    : null;
}
