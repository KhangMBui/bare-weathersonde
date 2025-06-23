export function calculateInversion(records: any[]) {
  if (!records || records.length === 0) {
    return {
      inversionIntensity: 0,
      inversionHeight: 0,
      inversionRate: 0,
      highest: null,
      lowest: null,
      totalSamples: 0,
    };
  }

  let highest = records[0];
  let lowest = records[0];

  for (const rec of records) {
    if (typeof rec.airTemp === 'number' && typeof rec.altitude === 'number') {
      if (rec.airTemp > highest.airTemp) highest = rec;
      if (rec.airTemp < lowest.airTemp) lowest = rec;
    }
  }

  let inversionIntensity = 0;
  let inversionHeight = 0;
  let inversionRate = 0;

  if (
    highest &&
    lowest &&
    typeof highest.altitude === 'number' &&
    typeof lowest.altitude === 'number' &&
    highest.altitude > lowest.altitude
  ) {
    inversionIntensity = highest.airTemp - lowest.airTemp;
    inversionHeight = highest.altitude - lowest.altitude;
    inversionRate =
      inversionHeight !== 0 ? inversionIntensity / inversionHeight : 0;
  }

  return {
    inversionIntensity,
    inversionHeight,
    inversionRate,
    highest,
    lowest,
    totalSamples: records.length,
  };
}
