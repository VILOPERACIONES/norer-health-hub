import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import api from '@/lib/api';
import { Phase4Delivery } from './Phase4Delivery';

vi.mock('@/lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

Object.defineProperty(URL, 'createObjectURL', {
  configurable: true,
  value: vi.fn(() => 'blob:plan-preview'),
});

Object.defineProperty(URL, 'revokeObjectURL', {
  configurable: true,
  value: vi.fn(),
});

describe('Phase4Delivery en el detalle del plan', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(api.get).mockImplementation(async (url) => {
      if (String(url).includes('/api/planes/')) {
        return {
          data: {
            data: {
              menus: [{ tipoContenido: 'platillos' }],
              pdfCustomMeta: {},
            },
          },
        } as never;
      }
      return {
        data: {
          data: {
            nombre: 'Paciente',
            apellido: 'Prueba',
            email: 'paciente@example.com',
            telefono: '9990000000',
          },
        },
      } as never;
    });
    vi.mocked(api.post).mockResolvedValue({ data: new Blob(['pdf']) } as never);
  });

  it('muestra configuración, vista previa y envío directo sin finalizar consulta', async () => {
    render(
      <Phase4Delivery
        pacienteId="paciente-1"
        planId="plan-1"
        onFinish={vi.fn()}
        context="plan-detail"
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /configurar y enviar pdf/i })).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /descargar oficial pdf/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /enviar al paciente/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /omitir y.*finalizar consulta/i })).not.toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByTitle('PDF Preview')).toBeInTheDocument();
    }, { timeout: 2_000 });
  });
});
