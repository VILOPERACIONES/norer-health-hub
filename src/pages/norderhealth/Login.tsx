import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import portalApi from '@/lib/portalApi';
import { usePortalAuthStore } from '@/store/portalAuth';

const schema = z.object({
  telefono: z.string().min(10, 'Mínimo 10 dígitos'),
  fechaNacimiento: z.string().min(1, 'Selecciona tu fecha de nacimiento'),
});

type FormData = z.infer<typeof schema>;

export default function NorderHealthLogin() {
  const navigate = useNavigate();
  const { setPortalAuth } = usePortalAuthStore();
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setApiError(null);
    setLoading(true);
    try {
      const res = await portalApi.post('/api/portal/login', {
        telefono: data.telefono,
        fechaNacimiento: data.fechaNacimiento,
      });
      setPortalAuth(res.data.token, res.data.paciente);
      navigate('/norder-health', { replace: true });
    } catch (err: any) {
      const codigo = err.response?.data?.codigo;
      if (codigo === 'portal_inactivo') {
        setApiError('Tu acceso no está activado. Contacta a tu nutriólogo.');
      } else if (codigo === 'credenciales_invalidas') {
        setApiError('Teléfono o fecha de nacimiento incorrectos.');
      } else if (err.response?.status === 429) {
        setApiError('Demasiados intentos. Espera unos minutos.');
      } else {
        setApiError('Ocurrió un error. Intenta de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#0d0d0d] flex flex-col">

      {/* Top gradient */}
      <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-[#0a1f12] to-transparent pointer-events-none" />

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative">

        {/* Logo + brand */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 rounded-[22px] bg-gradient-to-br from-[#22c55e] to-[#16a34a] flex items-center justify-center mb-5 shadow-lg shadow-[#22c55e]/20">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z"/>
              <path d="M12 6v6l4 2"/>
            </svg>
          </div>
          <h1 className="text-[26px] font-bold text-white tracking-tight">Norder Health</h1>
          <p className="text-[14px] text-[#555] mt-1">Tu nutriólogo digital</p>
        </div>

        {/* Card */}
        <div className="w-full max-w-sm">
          <div className="bg-[#141414] border border-[#1e1e1e] rounded-[20px] p-6">
            <h2 className="text-[17px] font-semibold text-white mb-1">Iniciar sesión</h2>
            <p className="text-[13px] text-[#555] mb-6">Ingresa con los datos que registró tu nutriólogo</p>

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-[#666] uppercase tracking-wider">Teléfono</label>
                <input
                  type="tel"
                  inputMode="numeric"
                  placeholder="10 dígitos"
                  {...register('telefono')}
                  className="bg-[#0d0d0d] border border-[#242424] rounded-[12px] px-4 py-3 text-[14px] text-white placeholder:text-[#333] focus:outline-none focus:border-[#333] transition-colors"
                />
                {errors.telefono && (
                  <span className="text-[11px] text-[#f87171]">{errors.telefono.message}</span>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-[#666] uppercase tracking-wider">Fecha de nacimiento</label>
                <input
                  type="date"
                  {...register('fechaNacimiento')}
                  className="bg-[#0d0d0d] border border-[#242424] rounded-[12px] px-4 py-3 text-[14px] text-white focus:outline-none focus:border-[#333] transition-colors appearance-none"
                  style={{ colorScheme: 'dark' }}
                />
                {errors.fechaNacimiento && (
                  <span className="text-[11px] text-[#f87171]">{errors.fechaNacimiento.message}</span>
                )}
              </div>

              {apiError && (
                <div className="flex items-start gap-2.5 bg-[#1a0f0f] border border-[#2a1515] rounded-[12px] px-4 py-3">
                  <svg className="flex-shrink-0 mt-0.5" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  <span className="text-[12px] text-[#f87171] leading-relaxed">{apiError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-1 bg-[#22c55e] text-white font-semibold rounded-[12px] py-3.5 text-[14px] hover:bg-[#16a34a] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                    </svg>
                    Entrando...
                  </span>
                ) : 'Entrar'}
              </button>
            </form>
          </div>

          <p className="text-center text-[11px] text-[#333] mt-5">
            ¿Problemas para acceder? Contacta a tu nutriólogo
          </p>
        </div>
      </div>
    </div>
  );
}
