type Record = {
  altitude: number;
  temperature: number;
  humidity: number;
};

type BinnedResult = {
  altitude_bin: string;
  average_temperature: number;
  average_humidity: number;
};

export function binByAltitude(
  records: Record[],
  binSize: number = 2,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  selectedTab: string,
): BinnedResult[] {
  const altitudeBins: {
    [bin: string]: { temperatures: number[]; humidities: number[] };
  } = {};

  // Bin the data (same as before)
  for (const record of records) {
    const { altitude, temperature, humidity } = record;
    if (
      typeof altitude === 'number' &&
      typeof temperature === 'number' &&
      typeof humidity === 'number'
    ) {
      const binStart = Math.floor(altitude / binSize) * binSize;
      const binEnd = binStart + binSize;
      const binLabel = `${binStart}-${binEnd}m`;

      if (!altitudeBins[binLabel]) {
        altitudeBins[binLabel] = { temperatures: [], humidities: [] };
      }
      altitudeBins[binLabel].temperatures.push(temperature);
      altitudeBins[binLabel].humidities.push(humidity);
    }
  }

  // Calculate BOTH averages for each bin, regardless of tab
  return Object.entries(altitudeBins).map(([binLabel, binData]) => {
    return {
      altitude_bin: binLabel,
      average_temperature:
        binData.temperatures.length > 0
          ? binData.temperatures.reduce((a, b) => a + b, 0) /
            binData.temperatures.length
          : 0,
      average_humidity:
        binData.humidities.length > 0
          ? binData.humidities.reduce((a, b) => a + b, 0) /
            binData.humidities.length
          : 0,
    };
  });
}
