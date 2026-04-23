import { getAccounts, getCoinHoldings, getHoldings } from "@/lib/supabase/queries";
import { aggregateCoinHoldings, aggregateHoldings, formatKRW } from "@/lib/portfolio";
import { getStockPrices } from "@/lib/kis-api/client";
import { getCoinPrices } from "@/lib/upbit-api/client";
import { Card, CardContent } from "@/components/ui/card";
import { PortfolioTable } from "./portfolio-table";

interface Props {
  usdKrw: number;
}

export async function PortfolioContent({ usdKrw }: Props) {
  const [accounts, holdings, coinHoldings] = await Promise.all([
    getAccounts(),
    getHoldings(),
    getCoinHoldings(),
  ]);

  const uniqueTickers = Array.from(
    new Map(holdings.map((h) => [h.ticker, { ticker: h.ticker, market: h.market }])).values()
  ).filter((t): t is { ticker: string; market: "KR" | "US" } => t.market === "KR" || t.market === "US");
  const uniqueCoinTickers = Array.from(new Set(coinHoldings.map((c) => c.ticker)));

  const [prices, coinPrices] = await Promise.all([
    holdings.length > 0 ? getStockPrices(uniqueTickers) : {},
    coinHoldings.length > 0 ? getCoinPrices(uniqueCoinTickers) : {},
  ]);

  const aggregatedStocks = aggregateHoldings(holdings, accounts, prices, usdKrw);
  const aggregatedCoins = aggregateCoinHoldings(coinHoldings, coinPrices);

  // 합산 후 비중 재계산
  const allAggregated = [...aggregatedStocks, ...aggregatedCoins];
  const grandTotalKRW = allAggregated.reduce((s, h) => s + h.totalValueKRW, 0);
  const aggregated = allAggregated.map((h) => ({
    ...h,
    weight: grandTotalKRW > 0 ? (h.totalValueKRW / grandTotalKRW) * 100 : 0,
  }));
  const totalValueKRW = grandTotalKRW;
  const totalCostKRW = aggregated.reduce((s, h) => s + h.totalCostKRW, 0);
  const totalReturnRate =
    totalCostKRW > 0 ? ((totalValueKRW - totalCostKRW) / totalCostKRW) * 100 : 0;

  return (
    <>
      <div className="grid grid-cols-1 gap-1.5 md:grid-cols-3 md:gap-4">
        <Card className="py-2 md:py-4">
          <CardContent className="flex items-center justify-between px-4 md:block">
            <p className="text-xs font-medium text-muted-foreground md:mb-1 md:text-sm">총 평가금액</p>
            <p className="text-sm font-bold md:text-2xl">{formatKRW(totalValueKRW)}</p>
          </CardContent>
        </Card>
        <Card className="py-2 md:py-4">
          <CardContent className="flex items-center justify-between px-4 md:block">
            <p className="text-xs font-medium text-muted-foreground md:mb-1 md:text-sm">총 매입금액</p>
            <p className="text-sm font-bold md:text-2xl">{formatKRW(totalCostKRW)}</p>
          </CardContent>
        </Card>
        <Card className="py-2 md:py-4">
          <CardContent className="flex items-center justify-between px-4 md:block">
            <p className="text-xs font-medium text-muted-foreground md:mb-1 md:text-sm">총 수익률</p>
            <p className={`text-sm font-bold md:text-2xl ${totalReturnRate >= 0 ? "text-red-500" : "text-blue-500"}`}>
              {totalReturnRate >= 0 ? "+" : ""}
              {totalReturnRate.toFixed(2)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {aggregated.length === 0 ? (
        <p className="text-sm text-muted-foreground">계좌 관리에서 보유 종목을 추가해주세요.</p>
      ) : (
        <PortfolioTable
          aggregated={aggregated}
          accounts={accounts}
          holdings={holdings}
          prices={prices}
          coinHoldings={coinHoldings}
          coinPrices={coinPrices}
          usdKrw={usdKrw}
        />
      )}
    </>
  );
}
