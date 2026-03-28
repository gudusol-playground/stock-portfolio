import { getAccounts, getHoldings } from "@/lib/supabase/queries";
import { aggregateHoldings, formatKRW, formatNumber } from "@/lib/portfolio";
import { getStockPrices } from "@/lib/kis-api/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RefreshButton } from "./components/refresh-button";
import { RebalancingDialog } from "./components/rebalancing-dialog";

async function getUsdKrw(): Promise<{ rate: number; date: string }> {
  try {
    const res = await fetch("https://api.frankfurter.app/latest?from=USD&to=KRW", {
      next: { revalidate: 3600 },
    });
    const data = await res.json();
    return { rate: data.rates.KRW as number, date: data.date as string };
  } catch {
    return { rate: 1380, date: "" };
  }
}

export default async function DashboardPage() {
  const [[accounts, holdings], { rate: USD_KRW, date: rateDate }] = await Promise.all([
    Promise.all([getAccounts(), getHoldings()]),
    getUsdKrw(),
  ]);

  const uniqueTickers = Array.from(
    new Map(holdings.map((h) => [h.ticker, { ticker: h.ticker, market: h.market }])).values()
  );
  const prices = holdings.length > 0 ? await getStockPrices(uniqueTickers) : {};

  const aggregated = aggregateHoldings(holdings, accounts, prices, USD_KRW);
  const totalValueKRW = aggregated.reduce((s, h) => s + h.totalValueKRW, 0);
  const totalCostKRW = aggregated.reduce((s, h) => s + h.totalCostKRW, 0);
  const totalReturnRate = totalCostKRW > 0 ? ((totalValueKRW - totalCostKRW) / totalCostKRW) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">전체 포트폴리오</h1>
        <div className="text-right">
          <p className="text-sm font-medium">USD/KRW {USD_KRW.toLocaleString("ko-KR", { maximumFractionDigits: 2 })}원</p>
          {rateDate && (
            <p className="text-xs text-muted-foreground">{rateDate} 기준 (ECB)</p>
          )}
        </div>
      </div>

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
            <p className={`text-2xl font-bold ${totalReturnRate >= 0 ? "text-red-500" : "text-blue-500"}`}>
              {totalReturnRate >= 0 ? "+" : ""}{totalReturnRate.toFixed(2)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {aggregated.length === 0 ? (
        <p className="text-sm text-muted-foreground">계좌 관리에서 보유 종목을 추가해주세요.</p>
      ) : (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">종목별 현황</CardTitle>
            <div className="flex gap-2">
              <RebalancingDialog holdings={aggregated} usdKrw={USD_KRW} />
              <RefreshButton />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>종목</TableHead>
                  <TableHead className="text-right">수량</TableHead>
                  <TableHead className="text-right">평균단가</TableHead>
                  <TableHead className="text-right">현재가</TableHead>
                  <TableHead className="text-right">평가금액</TableHead>
                  <TableHead className="text-right">수익률</TableHead>
                  <TableHead className="text-right">비중</TableHead>
                  <TableHead>보유 계좌</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {aggregated.map((h) => (
                  <TableRow key={h.ticker}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant={h.market === "KR" ? "default" : "secondary"} className="text-xs">
                          {h.market}
                        </Badge>
                        <div>
                          <p className="font-medium">{h.name}</p>
                          <p className="text-xs text-muted-foreground">{h.ticker}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{formatNumber(h.totalQuantity)}</TableCell>
                    <TableCell className="text-right">
                      {h.currency === "USD" ? `$${formatNumber(h.avgPrice, 2)}` : formatKRW(h.avgPrice)}
                    </TableCell>
                    <TableCell className="text-right">
                      {h.currency === "USD" ? `$${formatNumber(h.currentPrice, 2)}` : formatKRW(h.currentPrice)}
                    </TableCell>
                    <TableCell className="text-right">{formatKRW(h.totalValueKRW)}</TableCell>
                    <TableCell className={`text-right font-medium ${h.returnRate >= 0 ? "text-red-500" : "text-blue-500"}`}>
                      {h.returnRate >= 0 ? "+" : ""}{h.returnRate.toFixed(2)}%
                    </TableCell>
                    <TableCell className="text-right font-medium">{h.weight.toFixed(1)}%</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                        {h.accounts.map((a) => (
                          <span key={a.accountName} className="text-xs text-muted-foreground">
                            {a.accountName} ({formatNumber(a.quantity)})
                          </span>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
