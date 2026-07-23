export const DEFAULT_PDF_META = {
  showPageHistorial: true,
  showPageMenus: true,
  showPageIntercambio: true,
  showPageExtras: true,
  showContacto: false,
  showAlimentosEvitar: true,
  showDistribucionPorciones: true,
  soloEquivalencias: false,
};

type PdfMeta = Record<string, unknown>;

export function parsePdfPreferences(saved: string | null): PdfMeta {
  if (!saved) return {};

  try {
    const parsed = JSON.parse(saved);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

export function buildPdfMeta(globalPreferences: PdfMeta = {}, planMeta: PdfMeta = {}): PdfMeta {
  // "Solo equivalencias" es una decisión de cada plan, no una preferencia global.
  const { soloEquivalencias: _ignoredGlobalValue, ...safeGlobalPreferences } = globalPreferences;

  return {
    ...DEFAULT_PDF_META,
    ...safeGlobalPreferences,
    ...planMeta,
    soloEquivalencias:
      typeof planMeta.soloEquivalencias === 'boolean'
        ? planMeta.soloEquivalencias
        : false,
  };
}

export function getGlobalPdfPreferences(meta: PdfMeta): PdfMeta {
  return {
    showPageHistorial: meta.showPageHistorial !== false,
    showPageMenus: meta.showPageMenus !== false,
    showPageIntercambio: meta.showPageIntercambio !== false,
    showPageExtras: meta.showPageExtras !== false,
    showContacto: meta.showContacto === true,
    showAlimentosEvitar: meta.showAlimentosEvitar !== false,
    showDistribucionPorciones: meta.showDistribucionPorciones !== false,
  };
}
