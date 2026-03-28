"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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

  const hasInput = Object.values(inputs).some(
    (v) => parseNum(v.qty) > 0
  );

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        추가매수 시뮬레이션
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[80vw] w-full max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>추가매수 시뮬레이션</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground -mt-2">
            추가매수 수량과 가격을 입력하면 새 평단가와 비중을 실시간으로 확인할 수 있어요.
          </p>
          <div className="overflow-auto flex-1 min-h-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>종목</TableHead>
                  <TableHead className="text-right">현재 수량</TableHead>
                  <TableHead className="text-right">현재 평단가</TableHead>
                  <TableHead className="text-right">현재 비중</TableHead>
                  <TableHead className="text-right w-28">추가수량</TableHead>
                  <TableHead className="text-right w-32">매수가격</TableHead>
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
                          <span className="text-xs text-blue-500 ml-1">
                            +{parseNum(input.qty).toLocaleString("ko-KR")} → {h.newQty.toLocaleString("ko-KR")}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">{formatPrice(h.avgPrice, h.currency)}</TableCell>
                      <TableCell className="text-right">{h.weight.toFixed(1)}%</TableCell>
                      <TableCell className="text-right">
                        <Input
                          className="h-8 text-right text-sm"
                          placeholder="0"
                          value={input.qty}
                          onChange={(e) => setInput(h.ticker, "qty", e.target.value)}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          className="h-8 text-right text-sm"
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
            <Button variant="outline" onClick={() => { setInputs({}); setOpen(false); }}>닫기</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
