import { describe, expect, it } from 'vitest';
import { findPreviousConsultationPlan } from './previousConsultationPlan';

const valuations = [
  { id: 'latest', fecha: '2026-08-24', numeroValoracion: 3, plan: { id: 'plan-latest' } },
  { id: 'middle', fecha: '2026-08-20', numeroValoracion: 2, plan: { id: 'plan-middle' } },
  { id: 'oldest', fecha: '2026-08-10', numeroValoracion: 1, plan: { id: 'plan-oldest' } },
];

describe('findPreviousConsultationPlan', () => {
  it('uses the latest plan when creating a new assessment', () => {
    expect(findPreviousConsultationPlan(valuations)).toEqual({
      planId: 'plan-latest',
      fecha: '2026-08-24',
    });
  });

  it('uses the plan immediately before the assessment being edited', () => {
    expect(findPreviousConsultationPlan(valuations, 'middle')).toEqual({
      planId: 'plan-oldest',
      fecha: '2026-08-10',
    });
  });

  it('skips assessments without a plan', () => {
    expect(findPreviousConsultationPlan([
      { id: 'latest', fecha: '2026-08-24', numeroValoracion: 3, plan: null },
      valuations[1],
    ])).toEqual({
      planId: 'plan-middle',
      fecha: '2026-08-20',
    });
  });
});
