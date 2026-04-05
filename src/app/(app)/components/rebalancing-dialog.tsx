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

  function setInput(ticker: string, field: keyof InputRow, value: string) {
    setInputs((prev) => ({
      ...prev,
      [ticker]: { ...(prev[ticker] ?? { qty: "", price: "" }), [field]: value },
    }));
  }

  // 입력값을 반영한 계산 결과
  const rows = holdings.map((h) => {
    const input = inputs[h.ticker] ?? { qty: "", price: "" };
    const addQty = parseNum(input.qty);
    const addPrice = parseNum(input.price) || h.currentPrice;

    const newQty = h.totalQuantity + addQty;
    const newCost = h.totalQuantity * h.avgPrice + addQty * addPrice;
    const newAvgPrice = newQty > 0 ? newCost / newQty : h.avgPrice;
    const toKRW = h.currency === "USD" ? usdKrw : 1;
    const newValueKRW = newQty * h.currentPrice * toKRW;

    return { ...h, addQty, newQty, newAvgPrice, newValueKRW };
  });

  const newTotalKRW = rows.reduce((s, r) => s + r.newValueKRW, 0);

  const hasInput = Object.values(inputs).some((v) => parseNum(v.qty) > 0);

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        추가매수 시뮬레이션
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="flex w-full max-w-[95vw] flex-col max-h-[90vh] md:max-w-[80vw] md:max-h-[85vh]">
          <DialogHeader>
            <DialogTitle>추가매수 시뮬레이션</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground -mt-2">
            추가매수 수량과 가격을 입력하면 새 평단가와 비중을 실시간으로 확인할 수 있어요.
          </p>
          <div className="overflow-auto flex-1 min-h-0">
            {/* 모바일: 카드형 레이아웃 */}
            <div className="space-y-3 md:hidden">
              {rows.map((h) => {
                const newWeight = newTotalKRW > 0 ? (h.newValueKRW / newTotalKRW) * 100 : 0;
                const weightDiff = newWeight - h.weight;
                const avgDiff = h.newAvgPrice - h.avgPrice;
                const input = inputs[h.ticker] ?? { qty: "", price: "" };
                const changed = parseNum(input.qty) > 0;

                return (
                  <div
                    key={h.ticker}
                    className={`rounded-lg border p-3 ${changed ? "border-primary/30 bg-muted/40" : ""}`}
                  >
                    {/* 종목 헤더 */}
                    <div className="mb-2 flex items-center gap-2">
                      <Badge variant={h.market === "KR" ? "default" : "secondary"} className="text-xs">
                        {h.market}
                      </Badge>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{h.name}</p>
                        <p className="text-xs text-muted-foreground">{h.ticker}</p>
                      </div>
                    </div>
                    {/* 현재 정보 */}
                    <div className="mb-3 flex gap-3 text-xs text-muted-foreground">
                      <span>
                        {h.totalQuantity.toLocaleString("ko-KR")}주
                        {changed && (
                          <span className="ml-1 text-blue-500">
                            → {h.newQty.toLocaleString("ko-KR")}주
                          </span>
                        )}
                      </span>
                      <span>·</span>
                      <span>{formatPrice(h.avgPrice, h.currency)}</span>
                      <span>·</span>
                      <span>{h.weight.toFixed(1)}%</span>
                    </div>
                    {/* 입력 필드 */}
                    <div className="mb-3 grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">추가수량</p>
                        <Input
                          className="h-8 text-right md:text-sm"
                          inputMode="decimal"
                          placeholder="0"
                          value={input.qty}
                          onChange={(e) => setInput(h.ticker, "qty", e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">매수가격</p>
                        <Input
                          className="h-8 text-right md:text-sm"
                          inputMode="decimal"
                          placeholder={formatPrice(h.currentPrice, h.currency).replace(/[₩$]/g, "")}
                          value={input.price}
                          onChange={(e) => setInput(h.ticker, "price", e.target.value)}
                        />
                      </div>
                    </div>
                    {/* 결과 */}
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
                        {hasInput && weightDiff !== 0 && (
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

            {/* 데스크탑: 기존 테이블 */}
            <Table className="hidden md:table">
              <TableHeader>
                <TableRow>
                  <TableHead>종목</TableHead>
                  <TableHead className="text-right">현재 수량</TableHead>
                  <TableHead className="text-right">현재 평단가</TableHead>
                  <TableHead className="text-right">현재 비중</TableHead>
                  <TableHead className="w-28 text-right">추가수량</TableHead>
                  <TableHead className="w-32 text-right">매수가격</TableHead>
                  <TableHead className="text-right">새 평단가</TableHead>
                  <TableHead className="text-right">새 비중</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((h) => {
                  const newWeight = newTotalKRW > 0 ? (h.newValueKRW / newTotalKRW) * 100 : 0;
                  const weightDiff = newWeight - h.weight;
                  const avgDiff = h.newAvgPrice - h.avgPrice;
                  const input = inputs[h.ticker] ?? { qty: "", price: "" };
                  const changed = parseNum(input.qty) > 0;

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
                      <TableCell className="text-right">
                        {h.totalQuantity.toLocaleString("ko-KR")}
                        {changed && (
                          <span className="ml-1 text-xs text-blue-500">
                            +{parseNum(input.qty).toLocaleString("ko-KR")} →{" "}
                            {h.newQty.toLocaleString("ko-KR")}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">{formatPrice(h.avgPrice, h.currency)}</TableCell>
                      <TableCell className="text-right">{h.weight.toFixed(1)}%</TableCell>
                      <TableCell className="text-right">
                        <Input
                          className="h-8 text-right md:text-sm"
                          placeholder="0"
                          value={input.qty}
                          onChange={(e) => setInput(h.ticker, "qty", e.target.value)}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          className="h-8 text-right md:text-sm"
                          placeholder={formatPrice(h.currentPrice, h.currency).replace(/[₩$]/g, "")}
                          value={input.price}
                          onChange={(e) => setInput(h.ticker, "price", e.target.value)}
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
                        {hasInput && weightDiff !== 0 && (
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
                setInputs({});
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
