"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatKRW, formatNumber } from "@/lib/portfolio";
import { RefreshButton } from "./refresh-button";
import { RebalancingDialog } from "./rebalancing-dialog";
import type { Account, AggregatedHolding, Holding } from "@/types";

type SortKey = "cost" | "value" | "returnRate" | "weight";
type SortDir = "asc" | "desc";

type GroupedRow = Holding & {
  currentPrice: number;
  costKRW: number;
  valueKRW: number;
  returnRate: number;
  weight: number;
};

interface Props {
  aggregated: AggregatedHolding[];
  accounts: Account[];
  holdings: Holding[];
  prices: Record<string, number>;
  usdKrw: number;
}

const MARKET_BADGE = (market: "KR" | "US") =>
  market === "KR"
    ? "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300"
    : "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300";

export function PortfolioTable({ aggregated, accounts, holdings, prices, usdKrw }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("value");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [groupByAccount, setGroupByAccount] = useState(false);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  function sortedRows<T>(rows: T[], getValue: (r: T) => number): T[] {
    return [...rows].sort((a, b) => {
      const diff = getValue(b) - getValue(a);
      return sortDir === "desc" ? diff : -diff;
    });
  }

  function getAggValue(h: AggregatedHolding): number {
    switch (sortKey) {
      case "cost": return h.totalCostKRW;
      case "value": return h.totalValueKRW;
      case "returnRate": return h.returnRate;
      case "weight": return h.weight;
    }
  }

  function getGroupValue(h: GroupedRow): number {
    switch (sortKey) {
      case "cost": return h.costKRW;
      case "value": return h.valueKRW;
      case "returnRate": return h.returnRate;
      case "weight": return h.weight;
    }
  }

  const totalValueKRW = aggregated.reduce((s, h) => s + h.totalValueKRW, 0);

  const accountGroups = accounts
    .filter((a) => holdings.some((h) => h.account_id === a.id))
    .map((account) => {
      const rows: GroupedRow[] = holdings
        .filter((h) => h.account_id === account.id)
        .map((h) => {
          const currentPrice = prices[h.ticker] ?? h.avg_price;
          const toKRW = h.currency === "USD" ? usdKrw : 1;
          const costKRW = h.quantity * h.avg_price * toKRW;
          const valueKRW = h.quantity * currentPrice * toKRW;
          const returnRate =
            h.avg_price > 0 ? ((currentPrice - h.avg_price) / h.avg_price) * 100 : 0;
          const weight = totalValueKRW > 0 ? (valueKRW / totalValueKRW) * 100 : 0;
          return { ...h, currentPrice, costKRW, valueKRW, returnRate, weight };
        });
      return { account, rows: sortedRows(rows, getGroupValue) };
    });

  const sortedAggregated = sortedRows(aggregated, getAggValue);

  function SortableHead({ label, sortK }: { label: string; sortK: SortKey }) {
    const isActive = sortKey === sortK;
    return (
      <TableHead
        className="cursor-pointer select-none text-right"
        onClick={() => handleSort(sortK)}
      >
        <div className="flex items-center justify-end gap-1">
          {label}
          {isActive ? (
            sortDir === "desc" ? (
              <ArrowDown className="h-3 w-3" />
            ) : (
              <ArrowUp className="h-3 w-3" />
            )
          ) : (
            <ArrowUpDown className="h-3 w-3 opacity-30" />
          )}
        </div>
      </TableHead>
    );
  }

  function StockCell({ h }: { h: { market: "KR" | "US"; name: string; ticker: string } }) {
    return (
      <TableCell>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={`text-xs ${MARKET_BADGE(h.market)}`}>
            {h.market}
          </Badge>
          <div>
            <p className="font-medium">{h.name}</p>
            <p className="text-xs text-muted-foreground">{h.ticker}</p>
          </div>
        </div>
      </TableCell>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">
          {groupByAccount ? "계좌별 현황" : "종목별 현황"}
        </CardTitle>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setGroupByAccount((v) => !v)}
          >
            {groupByAccount ? "종목별 보기" : "계좌별 보기"}
          </Button>
          {!groupByAccount && <RebalancingDialog holdings={aggregated} usdKrw={usdKrw} />}
          <RefreshButton />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {groupByAccount ? (
          // 계좌별 그룹핑 뷰 — 단일 Table로 컬럼 너비 통일
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>종목</TableHead>
                <TableHead className="text-right">수량</TableHead>
                <TableHead className="text-right">평균단가</TableHead>
                <TableHead className="text-right">현재가</TableHead>
                <SortableHead label="투자금액" sortK="cost" />
                <SortableHead label="평가금액" sortK="value" />
                <SortableHead label="수익률" sortK="returnRate" />
                <SortableHead label="비중" sortK="weight" />
              </TableRow>
            </TableHeader>
            {accountGroups.map(({ account, rows }) => (
              <TableBody key={account.id}>
                <TableRow className="hover:bg-transparent">
                  <TableCell
                    colSpan={8}
                    className="bg-muted/40 py-2 text-xs font-semibold text-muted-foreground"
                  >
                    {account.broker} · {account.name}
                  </TableCell>
                </TableRow>
                {rows.map((h) => (
                      <TableRow key={h.id}>
                        <StockCell h={h} />
                        <TableCell className="text-right">{formatNumber(h.quantity)}</TableCell>
                        <TableCell className="text-right">
                          {h.currency === "USD"
                            ? `$${formatNumber(h.avg_price, 2)}`
                            : formatKRW(h.avg_price)}
                        </TableCell>
                        <TableCell className="text-right">
                          {h.currency === "USD"
                            ? `$${formatNumber(h.currentPrice, 2)}`
                            : formatKRW(h.currentPrice)}
                        </TableCell>
                        <TableCell className="text-right">{formatKRW(h.costKRW)}</TableCell>
                        <TableCell className="text-right">{formatKRW(h.valueKRW)}</TableCell>
                        <TableCell
                          className={`text-right font-medium ${h.returnRate >= 0 ? "text-red-500" : "text-blue-500"}`}
                        >
                          {h.returnRate >= 0 ? "+" : ""}
                          {h.returnRate.toFixed(2)}%
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {h.weight.toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    ))}
              </TableBody>
            ))}
          </Table>
        ) : (
          // 종목별 집계 뷰
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>종목</TableHead>
                <TableHead className="text-right">수량</TableHead>
                <TableHead className="text-right">평균단가</TableHead>
                <TableHead className="text-right">현재가</TableHead>
                <SortableHead label="투자금액" sortK="cost" />
                <SortableHead label="평가금액" sortK="value" />
                <SortableHead label="수익률" sortK="returnRate" />
                <SortableHead label="비중" sortK="weight" />
                <TableHead>보유 계좌</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedAggregated.map((h) => (
                <TableRow key={h.ticker}>
                  <StockCell h={h} />
                  <TableCell className="text-right">{formatNumber(h.totalQuantity)}</TableCell>
                  <TableCell className="text-right">
                    {h.currency === "USD"
                      ? `$${formatNumber(h.avgPrice, 2)}`
                      : formatKRW(h.avgPrice)}
                  </TableCell>
                  <TableCell className="text-right">
                    {h.currency === "USD"
                      ? `$${formatNumber(h.currentPrice, 2)}`
                      : formatKRW(h.currentPrice)}
                  </TableCell>
                  <TableCell className="text-right">{formatKRW(h.totalCostKRW)}</TableCell>
                  <TableCell className="text-right">{formatKRW(h.totalValueKRW)}</TableCell>
                  <TableCell
                    className={`text-right font-medium ${h.returnRate >= 0 ? "text-red-500" : "text-blue-500"}`}
                  >
                    {h.returnRate >= 0 ? "+" : ""}
                    {h.returnRate.toFixed(2)}%
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
        )}
      </CardContent>
    </Card>
  );
}
