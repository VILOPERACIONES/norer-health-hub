import { describe, expect, it } from 'vitest';
import { buildPdfMeta, getGlobalPdfPreferences, parsePdfPreferences } from './pdfMeta';

describe('configuración del PDF', () => {
  it('muestra el menú completo por defecto aunque exista una preferencia global antigua', () => {
    const meta = buildPdfMeta({ soloEquivalencias: true });

    expect(meta.soloEquivalencias).toBe(false);
  });

  it('respeta solo equivalencias cuando fue guardado explícitamente en el plan', () => {
    const meta = buildPdfMeta({}, { soloEquivalencias: true, _manualPdfKeys: ['soloEquivalencias'] });

    expect(meta.soloEquivalencias).toBe(true);
  });

  it('ignora un valor guardado que no fue tocado a mano y usa el default calculado del tipo de menú', () => {
    // Simula el caso reportado: el plan tiene platillos (default false), el usuario descarga el PDF
    // una vez (lo que persiste soloEquivalencias:false sin que haya sido un toggle manual), luego
    // cambia el menú a "solo equivalencias" y recarga — debe reflejar el nuevo default (true), no el
    // valor viejo guardado.
    const meta = buildPdfMeta({}, { soloEquivalencias: false }, true, true);

    expect(meta.soloEquivalencias).toBe(true);
    expect(meta.showDistribucionPorciones).toBe(true);
  });

  it('togglePdfMetaFlag marca la clave como tocada a mano para que quede pegada', async () => {
    const { togglePdfMetaFlag } = await import('./pdfMeta');
    const toggled = togglePdfMetaFlag({}, 'soloEquivalencias');

    expect(toggled._manualPdfKeys).toContain('soloEquivalencias');
    expect(toggled._manualPdfKeys).toContain('showDistribucionPorciones');

    // Con la clave marcada, un default distinto ya no la pisa.
    const meta = buildPdfMeta({}, toggled, false, false);
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
