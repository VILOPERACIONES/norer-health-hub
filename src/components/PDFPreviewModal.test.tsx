import { act, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PDFPreviewModal } from './PDFPreviewModal';

vi.mock('@/lib/api', () => ({
  default: {
    post: vi.fn().mockResolvedValue({ data: new Blob(['pdf']) }),
  },
}));

Object.defineProperty(URL, 'createObjectURL', {
  configurable: true,
  value: vi.fn(() => 'blob:pdf-preview'),
});

const baseProps = {
  onClose: vi.fn(),
  onSaveMeta: vi.fn(),
  planId: 'plan-1',
};

function expectToggleState(label: RegExp, active: boolean) {
  const labelElement = screen.getByRole('button', { name: label }).querySelector('span');
  expect(labelElement).toHaveClass(active ? 'font-medium' : 'line-through');
  if (active) expect(labelElement).not.toHaveClass('line-through');
}

describe('PDFPreviewModal', () => {
  it('recalcula ambos toggles desde el tipo actual de los menús cada vez que se abre', async () => {
    const legacyMeta = {
      soloEquivalencias: true,
      showDistribucionPorciones: true,
      _manualPdfKeys: ['soloEquivalencias', 'showDistribucionPorciones'],
    };
    const { rerender } = render(
      <PDFPreviewModal
        {...baseProps}
        isOpen={false}
        planCustomMeta={legacyMeta}
        planMenus={[{ tipoContenido: 'platillos' }]}
      />,
    );

    rerender(
      <PDFPreviewModal
        {...baseProps}
        isOpen
        planCustomMeta={legacyMeta}
        planMenus={[{ tipoContenido: 'platillos' }]}
      />,
    );

    await waitFor(() => {
      expectToggleState(/solo equivalencias/i, false);
      expectToggleState(/distribución de porciones/i, false);
      expect(screen.getByRole('button', { name: /solo equivalencias/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /distribución de porciones/i })).toBeDisabled();
    });

    rerender(
      <PDFPreviewModal
        {...baseProps}
        isOpen={false}
        planCustomMeta={{ soloEquivalencias: false, showDistribucionPorciones: false }}
        planMenus={[{ tipoContenido: 'equivalencias' }, { tipoContenido: 'equivalencias' }]}
      />,
    );
    await act(async () => {});

    rerender(
      <PDFPreviewModal
        {...baseProps}
        isOpen
        planCustomMeta={{ soloEquivalencias: false, showDistribucionPorciones: false }}
        planMenus={[{ tipoContenido: 'equivalencias' }, { tipoContenido: 'equivalencias' }]}
      />,
    );

    await waitFor(() => {
      expectToggleState(/solo equivalencias/i, true);
      expectToggleState(/distribución de porciones/i, true);
      expect(screen.getByRole('button', { name: /solo equivalencias/i })).not.toBeDisabled();
      expect(screen.getByRole('button', { name: /distribución de porciones/i })).not.toBeDisabled();
    });
  });
});
