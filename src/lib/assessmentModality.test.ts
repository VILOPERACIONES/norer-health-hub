import { describe, expect, it } from 'vitest';
import {
  buildOnlinePerimeters,
  hasInvalidOnlineMeasurement,
  onlineMeasurementsFromPerimeters,
} from './assessmentModality';

describe('modalidad de consulta en línea', () => {
  it('recupera los cuatro perímetros internos guardados', () => {
    expect(onlineMeasurementsFromPerimeters({
      brazoRelajado: 29.5,
      brazoContraido: 31.2,
      cintura: 78.4,
      cadera: 96.1,
    })).toEqual({
      brazoRelajado: '29.5',
      brazoContraido: '31.2',
      cintura: '78.4',
      cadera: '96.1',
    });
  });

  it('serializa medidas numéricas y conserva vacíos como null', () => {
    expect(buildOnlinePerimeters({
      brazoRelajado: '29.5',
      brazoContraido: '',
      cintura: '78.4',
      cadera: '96.1',
    })).toEqual({
      brazoRelajado: 29.5,
      brazoContraido: null,
      cintura: 78.4,
      cadera: 96.1,
    });
  });

  it('rechaza valores negativos o no numéricos', () => {
    expect(hasInvalidOnlineMeasurement({
      brazoRelajado: '29.5',
      brazoContraido: 'texto',
      cintura: '78.4',
      cadera: '96.1',
    })).toBe(true);
    expect(hasInvalidOnlineMeasurement({
      brazoRelajado: '29.5',
      brazoContraido: '31.2',
      cintura: '78.4',
      cadera: '96.1',
    })).toBe(false);
  });
});
