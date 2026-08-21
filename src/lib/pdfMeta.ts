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

/**
 * @param defaultShowDistribucionPorciones Default para "Distribución de porciones" cuando el plan
 * aún no tiene un valor explícito guardado — normalmente calculado a partir de si el plan es de
 * platillos (false) o de solo equivalencias (true). Si se omite, cae al default general (true).
 */
export function buildPdfMeta(globalPreferences: PdfMeta = {}, planMeta: PdfMeta = {}, defaultShowDistribucionPorciones?: boolean): PdfMeta {
  // "Solo equivalencias" y "Distribución de porciones" son decisiones de cada plan, no preferencias
  // globales (la segunda depende del tipo de contenido del plan — platillos vs. equivalencias).
  const { soloEquivalencias: _ignoredGlobalValue, showDistribucionPorciones: _ignoredGlobalDist, ...safeGlobalPreferences } = globalPreferences;

  return {
    ...DEFAULT_PDF_META,
    ...safeGlobalPreferences,
    ...planMeta,
    soloEquivalencias:
      typeof planMeta.soloEquivalencias === 'boolean'
        ? planMeta.soloEquivalencias
        : false,
    showDistribucionPorciones:
      typeof planMeta.showDistribucionPorciones === 'boolean'
        ? planMeta.showDistribucionPorciones
        : (defaultShowDistribucionPorciones ?? DEFAULT_PDF_META.showDistribucionPorciones),
  };
}

/** true solo cuando NINGÚN menú del plan usa platillos (todos son de solo equivalencias). */
export function defaultShowDistribucionForMenus(menus?: { tipoContenido?: string }[] | null): boolean {
  if (!menus || menus.length === 0) return DEFAULT_PDF_META.showDistribucionPorciones;
  return menus.every((m) => m.tipoContenido === 'equivalencias');
}

/**
 * Aplica un toggle del panel de configuración de PDF. Activar "Solo equivalencias"
 * a mano fuerza también "Distribución de porciones" a ON — un plan de solo
 * equivalencias siempre la necesita. El resto de toggles cambian normal.
 */
export function togglePdfMetaFlag(meta: PdfMeta, key: string): PdfMeta {
  const newMeta: PdfMeta = { ...meta, [key]: !meta[key] };
  if (key === 'soloEquivalencias' && newMeta.soloEquivalencias === true) {
    newMeta.showDistribucionPorciones = true;
  }
  return newMeta;
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
