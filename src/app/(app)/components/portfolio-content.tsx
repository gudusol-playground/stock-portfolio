import { getAccounts, getHoldings } from "@/lib/supabase/queries";
import { aggregateHoldings, formatKRW } from "@/lib/portfolio";
import { getStockPrices } from "@/lib/kis-api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PortfolioTable } from "./portfolio-table";

interface Props {
  usdKrw: number;
}

export async function PortfolioContent({ usdKrw }: Props) {
  const [accounts, holdings] = await Promise.all([getAccounts(), getHoldings()]);

  const uniqueTickers = Array.from(
    new Map(holdings.map((h) => [h.ticker, { ticker: h.ticker, market: h.market }])).values()
  );
  const prices = holdings.length > 0 ? await getStockPrices(uniqueTickers) : {};

  const aggregated = aggregateHoldings(holdings, accounts, prices, usdKrw);
  const totalValueKRW = aggregated.reduce((s, h) => s + h.totalValueKRW, 0);
  const totalCostKRW = aggregated.reduce((s, h) => s + h.totalCostKRW, 0);
  const totalReturnRate =
    totalCostKRW > 0 ? ((totalValueKRW - totalCostKRW) / totalCostKRW) * 100 : 0;

  return (
    <>
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">총 평가금액</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatKRW(totalValueKRW)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">총 매입금액</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatKRW(totalCostKRW)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">총 수익률</CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className={`text-2xl font-bold ${totalReturnRate >= 0 ? "text-red-500" : "text-blue-500"}`}
            >
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
          usdKrw={usdKrw}
        />
      )}
    </>
  );
}
