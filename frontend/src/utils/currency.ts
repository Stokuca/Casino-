export const fmtUSD = (cents?: string | number | null) =>
    (Number(cents ?? 0) / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
  