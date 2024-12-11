export const formatLargeNumber = (num: number, alwaysShowDecimals = false): string => {
  if (num < 1000000000 && !alwaysShowDecimals) {
    return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  const units = ['', 'B', 'T', 'Q'];
  const unitIndex = Math.floor(Math.log10(Math.abs(num)) / 3) - 2;
  const value = num / Math.pow(1000, unitIndex + 2);

  if (unitIndex < 0) {
    return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  if (unitIndex >= units.length - 1) {
    return num.toExponential(2);
  }

  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }) + units[unitIndex];
}; 