import { useMemo } from 'react';
import { usePatients } from '@/hooks/usePatients';
import { getBadgeForValuation } from '@/lib/format';

/**
 * Returns the number of pending valoraciones (not yet "Enviado").
 * Reuses the same patients cache — no extra API call.
 */
export const usePendingCount = (): number => {
  const { data: patients = [] } = usePatients();

  return useMemo(() => {
    let count = 0;

    patients.forEach((pac: any) => {
      const valArr = pac.valoraciones || [];
      valArr.forEach((val: any) => {
        // Inject plan if not present (same logic as Pending.tsx)
        if (!val.plan && pac.planes && Array.isArray(pac.planes)) {
          const planAsociado = pac.planes.find((pl: any) => pl.valoracionId === val.id);
          if (planAsociado) {
            val.plan = planAsociado;
            val.planId = planAsociado.id;
            val.estadoEnvio = planAsociado.estadoEnvio;
          }
        }

        const statusInfo = getBadgeForValuation(val);
        if (statusInfo.text !== 'Enviado') {
          count++;
        }
      });
    });

    return count;
  }, [patients]);
};
