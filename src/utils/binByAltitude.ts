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
  selectedTab: string,
): BinnedResult[] {
  const altitudeBins: {
    [bin: string]: { temperatures: number[]; humidities: number[] };
  } = {};

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

  // Only calculate the average for the selected tab
  return Object.entries(altitudeBins).map(([binLabel, binData]) => {
    if (selectedTab === 'Altitude - Temperature') {
      return {
        altitude_bin: binLabel,
        average_temperature:
          binData.temperatures.reduce((a, b) => a + b, 0) /
          binData.temperatures.length,
        average_humidity: NaN, // Not needed for this tab
      };
    } else {
      return {
        altitude_bin: binLabel,
        average_temperature: NaN, // Not needed for this tab
        average_humidity:
          binData.humidities.reduce((a, b) => a + b, 0) /
          binData.humidities.length,
      };
    }
  });
}
