import { describe, expect, it } from 'vitest';
import { buildPdfMeta, getGlobalPdfPreferences, parsePdfPreferences } from './pdfMeta';

describe('configuración del PDF', () => {
  it('muestra el menú completo por defecto aunque exista una preferencia global antigua', () => {
    const meta = buildPdfMeta({ soloEquivalencias: true });

    expect(meta.soloEquivalencias).toBe(false);
  });

  it('respeta solo equivalencias cuando fue guardado explícitamente en el plan', () => {
    const meta = buildPdfMeta({}, { soloEquivalencias: true });

    expect(meta.soloEquivalencias).toBe(true);
  });

  it('no guarda solo equivalencias como preferencia global', () => {
    const preferences = getGlobalPdfPreferences({ soloEquivalencias: true });

    expect(preferences).not.toHaveProperty('soloEquivalencias');
  });

  it('permite mostrar contacto y alimentos a evitar al mismo tiempo', () => {
    const meta = buildPdfMeta(
      { showContacto: true, showAlimentosEvitar: true },
      {},
    );

    expect(meta.showContacto).toBe(true);
    expect(meta.showAlimentosEvitar).toBe(true);
  });

  it('ignora preferencias almacenadas con JSON inválido', () => {
    expect(parsePdfPreferences('{')).toEqual({});
  });
});
