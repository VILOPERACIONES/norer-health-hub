import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PlanDeliveryDialog } from './PlanDeliveryDialog';

describe('PlanDeliveryDialog', () => {
  it('activa ambos canales por defecto y permite elegir solo uno', () => {
    const onConfirm = vi.fn();
    render(
      <PlanDeliveryDialog
        open
        patientName="Ana Pérez"
        email="ana@example.com"
        phone="9991234567"
        onCancel={vi.fn()}
        onConfirm={onConfirm}
      />,
    );

    const email = screen.getByRole('switch', { name: /correo electrónico/i });
    const whatsapp = screen.getByRole('switch', { name: /whatsapp/i });
    expect(email).toHaveAttribute('aria-checked', 'true');
    expect(whatsapp).toHaveAttribute('aria-checked', 'true');

    fireEvent.click(whatsapp);
    fireEvent.click(screen.getByRole('button', { name: /confirmar envío/i }));

    expect(onConfirm).toHaveBeenCalledWith({ email: true, whatsapp: false });
  });

  it('bloquea la confirmación cuando no queda ningún canal seleccionado', () => {
    render(
      <PlanDeliveryDialog
        open
        patientName="Ana Pérez"
        email="ana@example.com"
        phone="9991234567"
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('switch', { name: /correo electrónico/i }));
    fireEvent.click(screen.getByRole('switch', { name: /whatsapp/i }));

    expect(screen.getByText('Selecciona al menos un medio de envío.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /confirmar envío/i })).toBeDisabled();
  });
});
