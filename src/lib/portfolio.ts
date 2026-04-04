import type { Account, AggregatedHolding, Holding } from "@/types";

export function aggregateHoldings(
  holdings: Holding[],
  accounts: Account[],
  prices: Record<string, number>,
  usdKrw: number
): AggregatedHolding[] {
  const accountMap = Object.fromEntries(accounts.map((a) => [a.id, a.name]));
  const grouped = new Map<string, Holding[]>();

  for (const h of holdings) {
    const existing = grouped.get(h.ticker) ?? [];
    grouped.set(h.ticker, [...existing, h]);
  }

  const aggregated: Omit<AggregatedHolding, "weight">[] = [];

  for (const [ticker, items] of grouped.entries()) {
    const first = items[0];
    const totalQuantity = items.reduce((s, h) => s + h.quantity, 0);
    const totalCost = items.reduce((s, h) => s + h.quantity * h.avg_price, 0);
    const avgPrice = totalCost / totalQuantity;
    const currentPrice = prices[ticker] ?? avgPrice;
    const toKRW = first.currency === "USD" ? usdKrw : 1;

    const totalCostKRW = totalCost * toKRW;
    const totalValueKRW = totalQuantity * currentPrice * toKRW;
    const returnRate = ((currentPrice - avgPrice) / avgPrice) * 100;

    aggregated.push({
      ticker,
      name: first.name,
      market: first.market,
      currency: first.currency,
      totalQuantity,
      avgPrice,
      currentPrice,
      totalCostKRW,
      totalValueKRW,
      returnRate,
      accounts: items.map((h) => ({
        accountName: accountMap[h.account_id] ?? h.account_id,
        quantity: h.quantity,
      })),
    });
  }

  const totalValueKRW = aggregated.reduce((s, h) => s + h.totalValueKRW, 0);

  return aggregated
    .map((h) => ({ ...h, weight: totalValueKRW > 0 ? (h.totalValueKRW / totalValueKRW) * 100 : 0 }))
    .sort((a, b) => b.totalValueKRW - a.totalValueKRW);
}

export function formatKRW(value: number) {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number, digits = 0) {
  return new Intl.NumberFormat("ko-KR", { maximumFractionDigits: digits }).format(value);
}
