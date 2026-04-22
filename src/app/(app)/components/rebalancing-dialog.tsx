"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { AggregatedHolding } from "@/types";

interface Props {
  holdings: AggregatedHolding[];
  usdKrw: number;
}

interface InputRow {
  qty: string;
  price: string;
}

function parseNum(s: string) {
  const n = Number(s.replace(/,/g, ""));
  return isNaN(n) || n < 0 ? 0 : n;
}

function formatPrice(value: number, currency: "KRW" | "USD") {
  if (currency === "USD") {
    return `$${value.toLocaleString("ko-KR", { maximumFractionDigits: 2 })}`;
  }
  return `₩${Math.round(value).toLocaleString("ko-KR")}`;
}

export function RebalancingDialog({ holdings, usdKrw }: Props) {
  const [open, setOpen] = useState(false);
  const [inputs, setInputs] = useState<Record<string, InputRow>>({});

  function handleOpen() {
    // 다이얼로그 열 때 현재 수량으로 초기화
    const initial: Record<string, InputRow> = {};
    holdings.forEach((h) => {
      initial[h.ticker] = {
        qty: String(h.totalQuantity),
        price: "",
      };
    });
    setInputs(initial);
    setOpen(true);
  }

  function setInput(ticker: string, field: keyof InputRow, value: string) {
    setInputs((prev) => ({
      ...prev,
      [ticker]: { ...(prev[ticker] ?? { qty: "", price: "" }), [field]: value },
    }));
  }

  // 목표 수량 기준으로 계산
  const rows = holdings.map((h) => {
    const input = inputs[h.ticker] ?? { qty: String(h.totalQuantity), price: "" };
    const targetQty = parseNum(input.qty);
    const diffQty = targetQty - h.totalQuantity; // 양수=매수, 음수=매도
    const tradePrice = parseNum(input.price) || h.currentPrice;

    let newAvgPrice = h.avgPrice;
    if (diffQty > 0) {
      // 매수: 평단가 재계산
      const newCost = h.totalQuantity * h.avgPrice + diffQty * tradePrice;
      newAvgPrice = targetQty > 0 ? newCost / targetQty : h.avgPrice;
    }
    // 매도: 평단가 변동 없음

    const toKRW = h.currency === "USD" ? usdKrw : 1;
    const newValueKRW = targetQty * h.currentPrice * toKRW;

    return { ...h, targetQty, diffQty, newAvgPrice, newValueKRW };
  });

  const newTotalKRW = rows.reduce((s, r) => s + r.newValueKRW, 0);
  const hasChange = rows.some((r) => r.diffQty !== 0);

  return (
    <>
      <Button variant="outline" size="sm" onClick={handleOpen}>
        매매 시뮬레이션
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="flex w-full max-w-[95vw] flex-col max-h-[90vh] md:max-w-[80vw] md:max-h-[85vh]">
          <DialogHeader>
            <DialogTitle>매매 시뮬레이션</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground -mt-2">
            수량을 수정하면 매수/매도 후 평단가와 비중을 실시간으로 확인할 수 있어요.
          </p>
          <div className="overflow-auto flex-1 min-h-0">
            {/* 모바일: 카드형 레이아웃 */}
            <div className="space-y-3 md:hidden">
              {rows.map((h) => {
                const newWeight = newTotalKRW > 0 ? (h.newValueKRW / newTotalKRW) * 100 : 0;
                const weightDiff = newWeight - h.weight;
                const avgDiff = h.newAvgPrice - h.avgPrice;
                const input = inputs[h.ticker] ?? { qty: String(h.totalQuantity), price: "" };
                const changed = h.diffQty !== 0;
                const isBuy = h.diffQty > 0;
                const isSell = h.diffQty < 0;

                return (
                  <div
                    key={h.ticker}
                    className={`rounded-lg border p-3 ${changed ? "border-primary/30 bg-muted/40" : ""}`}
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <Badge variant={h.market === "KR" ? "default" : "secondary"} className="text-xs">
                        {h.market}
                      </Badge>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{h.name}</p>
                        <p className="text-xs text-muted-foreground">{h.ticker}</p>
                      </div>
                      {changed && (
                        <span className={`ml-auto shrink-0 text-xs font-medium ${isBuy ? "text-red-500" : "text-blue-500"}`}>
                          {isBuy ? "▲ 매수" : "▼ 매도"} {Math.abs(h.diffQty).toLocaleString("ko-KR")}
                        </span>
                      )}
                    </div>
                    <div className="mb-3 flex gap-3 text-xs text-muted-foreground">
                      <span>{h.avgPrice ? formatPrice(h.avgPrice, h.currency) : "-"}</span>
                      <span>·</span>
                      <span>{h.weight.toFixed(1)}%</span>
                    </div>
                    <div className="mb-3 grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">수량</p>
                        <Input
                          className="h-8 text-right md:text-sm"
                          inputMode="decimal"
                          value={input.qty}
                          onChange={(e) => setInput(h.ticker, "qty", e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">
                          {isSell ? "매도가격" : "매수가격"}
                        </p>
                        <Input
                          className="h-8 text-right md:text-sm"
                          inputMode="decimal"
                          placeholder={formatPrice(h.currentPrice, h.currency).replace(/[₩$]/g, "")}
                          value={input.price}
                          onChange={(e) => setInput(h.ticker, "price", e.target.value)}
                          disabled={isSell}
                        />
                      </div>
                    </div>
                    <div className="flex gap-4 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">새 평단가</p>
                        <p className="font-medium">{formatPrice(h.newAvgPrice, h.currency)}</p>
                        {changed && avgDiff !== 0 && (
                          <p className={`text-xs ${avgDiff > 0 ? "text-red-500" : "text-blue-500"}`}>
                            {avgDiff > 0 ? "▲" : "▼"} {formatPrice(Math.abs(avgDiff), h.currency)}
                          </p>
                        )}
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">새 비중</p>
                        <p className="font-medium">{newWeight.toFixed(1)}%</p>
                        {hasChange && weightDiff !== 0 && (
                          <p className={`text-xs ${weightDiff > 0 ? "text-red-500" : "text-blue-500"}`}>
                            {weightDiff > 0 ? "▲" : "▼"} {Math.abs(weightDiff).toFixed(1)}%p
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 데스크탑: 테이블 */}
            <Table className="hidden md:table">
              <TableHeader>
                <TableRow>
                  <TableHead>종목</TableHead>
                  <TableHead className="text-right">현재 평단가</TableHead>
                  <TableHead className="text-right">현재 비중</TableHead>
                  <TableHead className="w-32 text-right">수량</TableHead>
                  <TableHead className="w-32 text-right">거래가격</TableHead>
                  <TableHead className="text-right">새 평단가</TableHead>
                  <TableHead className="text-right">새 비중</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((h) => {
                  const newWeight = newTotalKRW > 0 ? (h.newValueKRW / newTotalKRW) * 100 : 0;
                  const weightDiff = newWeight - h.weight;
                  const avgDiff = h.newAvgPrice - h.avgPrice;
                  const input = inputs[h.ticker] ?? { qty: String(h.totalQuantity), price: "" };
                  const changed = h.diffQty !== 0;
                  const isBuy = h.diffQty > 0;
                  const isSell = h.diffQty < 0;

                  return (
                    <TableRow key={h.ticker} className={changed ? "bg-muted/40" : ""}>
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
                      <TableCell className="text-right">{formatPrice(h.avgPrice, h.currency)}</TableCell>
                      <TableCell className="text-right">{h.weight.toFixed(1)}%</TableCell>
                      <TableCell className="text-right">
                        <Input
                          className="h-8 text-right md:text-sm"
                          inputMode="decimal"
                          value={input.qty}
                          onChange={(e) => setInput(h.ticker, "qty", e.target.value)}
                        />
                        {changed && (
                          <p className={`mt-0.5 text-xs ${isBuy ? "text-red-500" : "text-blue-500"}`}>
                            {isBuy ? "▲" : "▼"} {Math.abs(h.diffQty).toLocaleString("ko-KR")}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          className="h-8 text-right md:text-sm"
                          inputMode="decimal"
                          placeholder={formatPrice(h.currentPrice, h.currency).replace(/[₩$]/g, "")}
                          value={input.price}
                          onChange={(e) => setInput(h.ticker, "price", e.target.value)}
                          disabled={isSell}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <span>{formatPrice(h.newAvgPrice, h.currency)}</span>
                        {changed && avgDiff !== 0 && (
                          <p className={`text-xs ${avgDiff > 0 ? "text-red-500" : "text-blue-500"}`}>
                            {avgDiff > 0 ? "▲" : "▼"} {formatPrice(Math.abs(avgDiff), h.currency)}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <span>{newWeight.toFixed(1)}%</span>
                        {hasChange && weightDiff !== 0 && (
                          <p className={`text-xs ${weightDiff > 0 ? "text-red-500" : "text-blue-500"}`}>
                            {weightDiff > 0 ? "▲" : "▼"} {Math.abs(weightDiff).toFixed(1)}%p
                          </p>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setOpen(false);
              }}
            >
              닫기
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
