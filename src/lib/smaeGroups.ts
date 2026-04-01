/**
 * smaeGroups.ts
 * Mapa canónico de grupos SMAE con alias para normalización.
 * Centraliza todas las variantes de nombres para que no hayan inconsistencias
 * al importar platillos, guardar equivalencias, o calcular el barrido.
 */

/** Etiqueta canónica → lista de alias (case-insensitive) */
export const SMAE_CANONICAL_ALIASES: Record<string, string[]> = {
  'Verduras':             ['verduras', 'verdura', 'veg', 'vegetales'],
  'Frutas':               ['frutas', 'fruta'],
  'Cereal s/grasa':       ['cereal s/grasa', 'cereal sin grasa', 'c y t sin grasa', 'cyt sin grasa', 'cereal sg', 'c/t sin grasa'],
  'Cereal c/grasa':       ['cereal c/grasa', 'cereal con grasa', 'c y t con grasa', 'cyt con grasa', 'cereal cg', 'c/t con grasa'],
  'Leguminosas':          ['leguminosas', 'leguminosa', 'legumbres'],
  'AOA Muy Bajo':         ['aoa muy bajo', 'aoa mb', 'aoa muy b', 'proteina muy baja', 'aoa-mb', 'aoa muy bajo fat'],
  'AOA Bajo':             ['aoa bajo', 'aoa b', 'aoa bajo fat', 'proteina baja', 'aoa-b'],
  'AOA Moderado':         ['aoa moderado', 'aoa mod', 'aoa m', 'proteina moderada', 'aoa-mod'],
  'AOA Alto':             ['aoa alto', 'aoa a', 'proteina alta', 'aoa-a'],
  'Leche Descrem.':       ['leche descrem.', 'leche descremada', 'leche desc', 'leche 0%', 'ld'],
  'Leche Semi':           ['leche semi', 'leche semidescremada', 'leche semi-descremada', 'ls'],
  'Leche Entera':         ['leche entera', 'leche ent', 'leche 3%', 'le'],
  'Leche Azucarada':      ['leche azucarada', 'leche az', 'leche azuc', 'la'],
  'Grasa s/prot':         ['grasa s/prot', 'grasa sin proteina', 'grasa sin prot', 'a y g sin proteina', 'ayg sin prot', 'gsp'],
  'Grasa c/prot':         ['grasa c/prot', 'grasa con proteina', 'grasa con prot', 'a y g con proteina', 'ayg con prot', 'gcp'],
  'Azúcar s/grasa':       ['azúcar s/grasa', 'azucar s/grasa', 'az sin grasa', 'azúcar sin grasa', 'azucar sin grasa', 'asg'],
  'Azúcar c/grasa':       ['azúcar c/grasa', 'azucar c/grasa', 'az con grasa', 'azúcar con grasa', 'azucar con grasa', 'acg'],
};

/** Invierte el mapa: alias (minúscula) → etiqueta canónica */
const _ALIAS_TO_CANONICAL: Record<string, string> = {};
for (const [canonical, aliases] of Object.entries(SMAE_CANONICAL_ALIASES)) {
  // El propio canónico también es un alias de sí mismo
  _ALIAS_TO_CANONICAL[canonical.toLowerCase()] = canonical;
  for (const alias of aliases) {
    _ALIAS_TO_CANONICAL[alias.toLowerCase()] = canonical;
  }
}

/**
 * Normaliza cualquier variante de nombre de grupo SMAE a su etiqueta canónica.
 * Si no se encuentra, devuelve el texto original sin modificar.
 */
export function normalizeGroup(raw: string): string {
  if (!raw) return raw;
  return _ALIAS_TO_CANONICAL[raw.trim().toLowerCase()] ?? raw;
}

/** Etiqueta canónica → clave del objeto `distribucion` en el BarridoEquivalencias */
export const CANONICAL_TO_BARRIDO_KEY: Record<string, string> = {
  'Verduras':          'verduras',
  'Frutas':            'frutas',
  'Cereal s/grasa':    'cerealSinGr',
  'Cereal c/grasa':    'cerealConGr',
  'Leguminosas':       'leguminosas',
  'AOA Muy Bajo':      'aoaMuyBajo',
  'AOA Bajo':          'aoaBajo',
  'AOA Moderado':      'aoaModerado',
  'AOA Alto':          'aoaAlto',
  'Leche Descrem.':    'lecheDesc',
  'Leche Semi':        'lecheSemi',
  'Leche Entera':      'lecheEntera',
  'Leche Azucarada':   'lecheAz',
  'Grasa s/prot':      'grasaSinProt',
  'Grasa c/prot':      'grasaConProt',
  'Azúcar s/grasa':    'azSinGr',
  'Azúcar c/grasa':    'azConGr',
};

/**
 * Convierte una etiqueta canónica (o cualquier alias) a su clave de barrido.
 * Si no se encuentra, devuelve la cadena original.
 */
export function groupToBarridoKey(rawOrCanonical: string): string {
  const canonical = normalizeGroup(rawOrCanonical);
  return CANONICAL_TO_BARRIDO_KEY[canonical] ?? canonical;
}

/**
 * Lista oficial de todas las etiquetas canónicas de grupos SMAE.
 * Útil para poblar dropdowns.
 */
export const SMAE_GROUP_LABELS = Object.keys(SMAE_CANONICAL_ALIASES);
