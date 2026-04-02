import { describe, it, expect } from 'vitest';

// Simulación de la lógica que debería estar abstraída desde CreateEditPlan.tsx
const MACROS_SMAE: Record<string, { p: number; c: number; g: number }> = {
  verduras:     { p: 2, c: 4,  g: 0 },
  frutas:       { p: 0, c: 15, g: 0 },
  cerealSinGr: { p: 2, c: 15, g: 0 },
  cerealConGr: { p: 2, c: 15, g: 5 },
  leguminosas:  { p: 8, c: 20, g: 1 },
};

function calcularPorcentajesDeBarrido(porciones: Record<string, number>) {
  let p = 0; let c = 0; let g = 0;
  Object.entries(porciones).forEach(([grupo, cant]) => {
    const m = MACROS_SMAE[grupo] || { p: 0, c: 0, g: 0 };
    p += cant * m.p;
    c += cant * m.c;
    g += cant * m.g;
  });
  const totalKcal = (p * 4) + (c * 4) + (g * 9);
  if (totalKcal === 0) return null;
  return {
    kcalTotales: totalKcal,
    pPct: Math.round((p * 4 / totalKcal) * 100),
    cPct: Math.round((c * 4 / totalKcal) * 100),
    gPct: Math.round((g * 9 / totalKcal) * 100),
  };
}

describe('Cálculos Médicos - Sistema Mexicano de Alimentos Equivalentes (SMAE)', () => {
  it('Debería retornar nulo si no hay porciones asignadas', () => {
    const resultado = calcularPorcentajesDeBarrido({});
    expect(resultado).toBeNull();
  });

  it('Debería calcular correctamente Kcal y % para 1 porción de Fruta', () => {
    const resultado = calcularPorcentajesDeBarrido({ frutas: 1 });
    // Fruta: P=0, C=15, G=0. Kcal = (0*4) + (15*4) + (0*9) = 60
    expect(resultado).not.toBeNull();
    expect(resultado?.kcalTotales).toBe(60);
    expect(resultado?.pPct).toBe(0);
    expect(resultado?.cPct).toBe(100);
    expect(resultado?.gPct).toBe(0);
  });

  it('Debería calcular mezcla de Cereal con Grasa y Leguminosas', () => {
    // 1 CerealConGr: P=2, C=15, G=5 => Kcal: 8 + 60 + 45 = 113
    // 1 Leguminosas: P=8, C=20, G=1 => Kcal: 32 + 80 + 9 = 121
    // Totales: P=10, C=35, G=6 => Kcal Totales = 113 + 121 = 234
    const resultado = calcularPorcentajesDeBarrido({
      cerealConGr: 1,
      leguminosas: 1
    });

    expect(resultado?.kcalTotales).toBe(234);
    
    const pPct = Math.round((10 * 4 / 234) * 100); // 17%
    const cPct = Math.round((35 * 4 / 234) * 100); // 60%
    const gPct = Math.round((6 * 9 / 234) * 100); // 23%
    
    expect(resultado?.pPct).toBe(pPct);
    expect(resultado?.cPct).toBe(cPct);
    expect(resultado?.gPct).toBe(gPct);
  });
});
