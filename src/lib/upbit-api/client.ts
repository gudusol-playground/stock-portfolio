/** 업비트 공개 API — 코인 현재가 조회 */

export async function getCoinPrices(
  tickers: string[]
): Promise<Record<string, number>> {
  if (tickers.length === 0) return {};

  const markets = tickers.map((t) => `KRW-${t}`).join(",");

  try {
    const res = await fetch(
      `https://api.upbit.com/v1/ticker?markets=${markets}`,
      { next: { revalidate: 60 } } // 1분 캐시
    );
    if (!res.ok) return {};

    const data: { market: string; trade_price: number }[] = await res.json();

    return Object.fromEntries(
      data.map((item) => [
        item.market.replace("KRW-", ""),
        item.trade_price,
      ])
    );
  } catch {
    return {};
  }
}
