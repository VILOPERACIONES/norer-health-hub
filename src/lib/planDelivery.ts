export type PlanDeliveryChannels = {
  email: boolean;
  whatsapp: boolean;
};

export type PlanDeliveryResult = {
  email?: string;
  whatsapp?: string;
};

export const selectedDeliveryLabels = (channels: PlanDeliveryChannels): string[] => [
  channels.email ? 'Correo' : null,
  channels.whatsapp ? 'WhatsApp' : null,
].filter((label): label is string => Boolean(label));

export const getPlanDeliveryFeedback = (
  result: PlanDeliveryResult,
  channels: PlanDeliveryChannels,
) => {
  const selected = [
    channels.email ? { label: 'Correo', status: result.email } : null,
    channels.whatsapp ? { label: 'WhatsApp', status: result.whatsapp } : null,
  ].filter((item): item is { label: string; status: string | undefined } => Boolean(item));

  const delivered = selected.filter(item => item.status === 'ok');
  const failed = selected.filter(item => item.status !== 'ok');

  if (selected.length > 0 && delivered.length === selected.length) {
    return {
      title: 'Plan enviado correctamente',
      description: `${delivered.map(item => item.label).join(' y ')} ${delivered.length === 1 ? 'entregado' : 'entregados'} al paciente.`,
      destructive: false,
    };
  }

  if (delivered.length === 0) {
    return {
      title: 'No se pudo completar el envío',
      description: `${failed.map(item => item.label).join(' y ')} ${failed.length === 1 ? 'falló' : 'fallaron'}. Verifica la configuración.`,
      destructive: true,
    };
  }

  return {
    title: 'Envío completado parcialmente',
    description: `${delivered.map(item => `${item.label} ✓`).join(' · ')} · ${failed.map(item => `${item.label} ✗`).join(' · ')}`,
    destructive: false,
  };
};
