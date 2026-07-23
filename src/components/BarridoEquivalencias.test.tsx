import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import BarridoEquivalencias, { type BarridoData } from './BarridoEquivalencias';

describe('BarridoEquivalencias', () => {
  it('permite borrar la última letra del título sin perder los valores de la columna', async () => {
    const onChange = vi.fn();
    const value: BarridoData = {
      tiempos: [{ id: 'tiempo-colacion', nombre: 'A' }],
      porciones: { frutas: 2 },
      distribucion: { 'tiempo-colacion': { frutas: 2 } },
      kcalTotal: 120,
    };

    render(<BarridoEquivalencias value={value} onChange={onChange} />);
    const titleInput = screen.getByTitle('Editable');
    fireEvent.change(titleInput, { target: { value: '' } });

    expect(titleInput).toHaveValue('');
    await waitFor(() => expect(onChange).toHaveBeenCalled());
    const updated = onChange.mock.calls.at(-1)?.[0] as BarridoData;
    expect(updated.tiempos[0]).toEqual({ id: 'tiempo-colacion', nombre: '' });
    expect(updated.distribucion['tiempo-colacion'].frutas).toBe(2);
  });
});
