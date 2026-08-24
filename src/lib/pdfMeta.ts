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

/** Claves cuyo valor por defecto se deriva del tipo de contenido del plan (platillos vs.
 * equivalencias) en vez de ser una preferencia fija. Solo se respeta un valor guardado para
 * estas claves si el usuario lo tocó a mano — ver `_manualPdfKeys` más abajo. */
const AUTO_DERIVED_PDF_KEYS = ['soloEquivalencias', 'showDistribucionPorciones'] as const;

function manualKeysOf(planMeta: PdfMeta): Set<string> {
  return new Set(Array.isArray(planMeta._manualPdfKeys) ? (planMeta._manualPdfKeys as string[]) : []);
}

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
 * no tiene un valor tocado a mano — calculado a partir de si el plan es de platillos (false) o de
 * solo equivalencias (true). Si se omite, cae al default general (true).
 * @param defaultSoloEquivalencias Default para "Solo equivalencias" — calculado igual que
 * distribución de porciones. Si se omite, cae al default general (false).
 */
export function buildPdfMeta(globalPreferences: PdfMeta = {}, planMeta: PdfMeta = {}, defaultShowDistribucionPorciones?: boolean, defaultSoloEquivalencias?: boolean): PdfMeta {
  // "Solo equivalencias" y "Distribución de porciones" no son preferencias globales: por defecto
  // siguen el tipo de contenido del plan (platillos vs. equivalencias) y solo se "pegan" a un valor
  // guardado si el usuario tocó el toggle a mano (ver _manualPdfKeys en togglePdfMetaFlag). Sin esto,
  // el guardado automático que dispara "Descargar"/"Enviar" (que persiste el default calculado tal
  // cual) terminaba fijando ese valor para siempre, ignorando cambios posteriores en los menús.
  const { soloEquivalencias: _ignoredGlobalValue, showDistribucionPorciones: _ignoredGlobalDist, ...safeGlobalPreferences } = globalPreferences;
  const manualKeys = manualKeysOf(planMeta);

  return {
    ...DEFAULT_PDF_META,
    ...safeGlobalPreferences,
    ...planMeta,
    soloEquivalencias:
      manualKeys.has('soloEquivalencias') && typeof planMeta.soloEquivalencias === 'boolean'
        ? planMeta.soloEquivalencias
        : (defaultSoloEquivalencias ?? DEFAULT_PDF_META.soloEquivalencias),
    showDistribucionPorciones:
      manualKeys.has('showDistribucionPorciones') && typeof planMeta.showDistribucionPorciones === 'boolean'
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
 * equivalencias siempre la necesita. Desactivar "Solo equivalencias" apaga
 * "Distribución de porciones". El resto de toggles cambian normal.
 *
 * Marca la(s) clave(s) tocadas en `_manualPdfKeys` para que `buildPdfMeta` las trate como una
 * decisión explícita del usuario en vez de seguir derivándolas del tipo de contenido del plan.
 */
export function togglePdfMetaFlag(meta: PdfMeta, key: string): PdfMeta {
  const newMeta: PdfMeta = { ...meta, [key]: !meta[key] };
  const manualKeys = manualKeysOf(meta);
  manualKeys.add(key);
  if (key === 'soloEquivalencias') {
    newMeta.showDistribucionPorciones = newMeta.soloEquivalencias === true;
    manualKeys.add('showDistribucionPorciones');
  }
  if (AUTO_DERIVED_PDF_KEYS.includes(key as typeof AUTO_DERIVED_PDF_KEYS[number])) {
    newMeta._manualPdfKeys = Array.from(manualKeys);
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
