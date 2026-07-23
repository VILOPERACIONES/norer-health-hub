import { describe, expect, it } from 'vitest';
import { getPlanDeliveryFeedback, selectedDeliveryLabels } from './planDelivery';

describe('planDelivery', () => {
  it('permite seleccionar ambos canales o solamente uno', () => {
    expect(selectedDeliveryLabels({ email: true, whatsapp: true })).toEqual(['Correo', 'WhatsApp']);
    expect(selectedDeliveryLabels({ email: false, whatsapp: true })).toEqual(['WhatsApp']);
  });

  it('solo evalúa los canales que el usuario seleccionó', () => {
    const feedback = getPlanDeliveryFeedback(
      { email: 'omitido', whatsapp: 'ok' },
      { email: false, whatsapp: true },
    );

    expect(feedback.title).toBe('Plan enviado correctamente');
    expect(feedback.description).toContain('WhatsApp');
    expect(feedback.description).not.toContain('Correo');
  });
});
