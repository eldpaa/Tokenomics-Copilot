
// Potong address jadi 0x1234...abcd
export function shortenAddress(address?: string, chars = 4): string {
  if (!address) return "N/A";
  return `${address.substring(0, chars + 2)}...${address.substring(address.length - chars)}`;
}

// Format angka gede (misal: 1.5M, 2.3B)
export function formatSupply(supply: string | number): string {
  const num = typeof supply === "string" ? parseFloat(supply) : supply;
  if (isNaN(num)) return "0";

  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(num);
}

// Format mata uang USD (misal: $1.25M, $450.2K)
export function formatCurrency(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) return "N/A";
  if (val >= 1e9) return `$${(val / 1e9).toFixed(2)}B`;
  if (val >= 1e6) return `$${(val / 1e6).toFixed(2)}M`;
  if (val >= 1e3) return `$${(val / 1e3).toFixed(2)}K`;
  if (val < 0.0001) return `$${val.toExponential(2)}`;
  if (val < 1) return `$${val.toFixed(4)}`;
  return `$${val.toFixed(2)}`;
}

// Format persentase (misal: 45.2%)
export function formatPercent(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) return "N/A";
  return `${val.toFixed(1)}%`;
}
