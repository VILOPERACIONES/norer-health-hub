import { useQuery } from '@tanstack/react-query';
import portalApi from '@/lib/portalApi';
import { usePortalAuthStore } from '@/store/portalAuth';

// Query única y compartida de /api/portal/me. nivelMembresia puede cambiar
// desde el CRM en cualquier momento (el nutriólogo activa/cambia el plan) —
// refetchOnWindowFocus: 'always' ignora el staleTime y refresca cada vez que
// el paciente regresa a la pestaña/app, para que ese cambio se vea sin
// necesidad de cerrar sesión o recargar manualmente.
export function usePortalMe() {
  const token = usePortalAuthStore((s) => s.token);
  return useQuery({
    queryKey: ['portal', 'me'],
    queryFn: () => portalApi.get('/api/portal/me').then((r) => r.data),
    staleTime: 15_000,
    refetchOnWindowFocus: 'always',
    enabled: !!token,
  });
}
