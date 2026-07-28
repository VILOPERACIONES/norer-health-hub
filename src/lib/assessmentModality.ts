export interface OnlineMeasurements {
  brazoRelajado: string;
  brazoContraido: string;
  cintura: string;
  cadera: string;
}

export const EMPTY_ONLINE_MEASUREMENTS: OnlineMeasurements = {
  brazoRelajado: '',
  brazoContraido: '',
  cintura: '',
  cadera: '',
};

const toInputValue = (value: unknown) => value == null || value === '' ? '' : String(value);

export const onlineMeasurementsFromPerimeters = (perimeters: Record<string, unknown> | null | undefined): OnlineMeasurements => ({
  brazoRelajado: toInputValue(perimeters?.brazoRelajado),
  brazoContraido: toInputValue(perimeters?.brazoContraido),
  cintura: toInputValue(perimeters?.cintura),
  cadera: toInputValue(perimeters?.cadera),
});

const toOptionalNumber = (value: string) => value.trim() === '' ? null : Number(value);

export const buildOnlinePerimeters = (measurements: OnlineMeasurements) => ({
  brazoRelajado: toOptionalNumber(measurements.brazoRelajado),
  brazoContraido: toOptionalNumber(measurements.brazoContraido),
  cintura: toOptionalNumber(measurements.cintura),
  cadera: toOptionalNumber(measurements.cadera),
});

export const hasInvalidOnlineMeasurement = (measurements: OnlineMeasurements) =>
  Object.values(measurements)
    .filter(value => value.trim() !== '')
    .some(value => !Number.isFinite(Number(value)) || Number(value) < 0);
