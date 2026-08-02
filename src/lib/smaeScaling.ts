import type { EquivalenciaItem, Ingrediente } from '@/types';
import { groupToBarridoKey, normalizeGroup } from '@/lib/smaeGroups';

const toPositiveNumber = (value: unknown): number => {
  const parsed = Number(String(value ?? '').replace(',', '.'));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

export const roundSmaeMeasure = (value: number): number =>
  Number.isFinite(value) ? parseFloat(value.toFixed(2)) : 0;

/**
 * The catalog stores the physical amount of a reference portion and how many
 * equivalents that complete portion contributes. Conversion needs the ratio,
 * never the complete portion amount as if it represented a single equivalent.
 */
export const getAmountPerEquivalent = (amount: unknown, equivalents: unknown): number => {
  const numericAmount = toPositiveNumber(amount);
  const numericEquivalents = toPositiveNumber(equivalents) || 1;
  return numericAmount > 0 ? roundSmaeMeasure(numericAmount / numericEquivalents) : 0;
};

/**
 * Custom foods keep a 1-unit reference portion in `equivalentesBase`, while
 * `equivalencias` describes how many SMAE equivalents each food group receives.
 * When the base group is also present there, that explicit contribution wins.
 */
export const getCatalogGroupContribution = (
  baseGroup: string,
  referenceEquivalents: unknown,
  equivalences: EquivalenciaItem[] | undefined,
): number => {
  const baseKey = groupToBarridoKey(normalizeGroup(baseGroup));
  const explicit = (equivalences || []).find(item =>
    item?.grupo && groupToBarridoKey(normalizeGroup(item.grupo)) === baseKey,
  );
  return toPositiveNumber(explicit?.cantidad) || toPositiveNumber(referenceEquivalents) || 1;
};

export const getIngredientEquivalences = (ingredient: Ingrediente): EquivalenciaItem[] => {
  const fromArray = (ingredient.equivalencias || []).filter(
    item => item?.grupo && String(item.grupo).trim() && toPositiveNumber(item.cantidad) > 0,
  );
  if (fromArray.length > 0) return fromArray;

  if (ingredient.eqGrupo && toPositiveNumber(ingredient.eqCantidad) > 0) {
    return [{ grupo: ingredient.eqGrupo, cantidad: toPositiveNumber(ingredient.eqCantidad) }];
  }
  return [];
};

/** Scale one ingredient while keeping grams, practical measures and every SMAE group in sync. */
export const scaleIngredientEquivalences = (
  ingredient: Ingrediente,
  factor: number,
): Ingrediente => {
  if (!Number.isFinite(factor) || factor <= 0 || ingredient.fijarEq) return ingredient;

  const equivalencias = getIngredientEquivalences(ingredient).map(item => ({
    ...item,
    cantidad: roundSmaeMeasure(toPositiveNumber(item.cantidad) * factor),
  }));
  const primaryEq = equivalencias[0] ? toPositiveNumber(equivalencias[0].cantidad) : 0;
  const currentAmount = toPositiveNumber(ingredient.cantidad);
  const unit = String(ingredient.unidad || '').toUpperCase().trim();
  const gramsPerEq = toPositiveNumber(ingredient.smaeGrPorEq);

  // In grams, the immutable catalog anchor is more reliable than a previously
  // rounded or historically corrupted quantity. Other units use proportionality.
  const cantidad = unit === 'GR' && gramsPerEq > 0 && primaryEq > 0
    ? roundSmaeMeasure(primaryEq * gramsPerEq)
    : roundSmaeMeasure(currentAmount * factor);

  return {
    ...ingredient,
    cantidad,
    equivalencias,
    eqCantidad: primaryEq || ingredient.eqCantidad,
    eqGrupo: equivalencias[0]?.grupo || ingredient.eqGrupo,
  };
};

export const scaleIngredientToPrimaryEquivalent = (
  ingredient: Ingrediente,
  targetEquivalent: number,
): Ingrediente => {
  const currentPrimaryEq = toPositiveNumber(getIngredientEquivalences(ingredient)[0]?.cantidad)
    || toPositiveNumber(ingredient.eqCantidad);
  if (currentPrimaryEq <= 0 || !Number.isFinite(targetEquivalent) || targetEquivalent <= 0) {
    return ingredient;
  }
  return scaleIngredientEquivalences(ingredient, targetEquivalent / currentPrimaryEq);
};
