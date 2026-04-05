"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addHolding, updateHolding } from "../actions";
import { useStockSearch } from "@/hooks/use-stock-search";

interface HoldingDialogProps {
  accountId: string;
  holding?: any;
  trigger: any;
}

export function HoldingDialog({ accountId, holding, trigger }: HoldingDialogProps) {
  const [open, setOpen] = useState(false);
  const [market, setMarket] = useState<"KR" | "US">(holding?.market ?? "KR");
  const [ticker, setTicker] = useState("");
  const [name, setName] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [avgPriceDisplay, setAvgPriceDisplay] = useState(
    holding?.avg_price != null ? Number(holding.avg_price).toLocaleString() : ""
  );
  const action = holding ? updateHolding : addHolding;
  const formRef = useRef<HTMLFormElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { query, setQuery, results } = useStockSearch(market);

  const [state, formAction, isPending] = useActionState(async (_: unknown, formData: FormData) => {
    const result = await action(formData);
    if (!result?.error) setOpen(false);
    return result ?? null;
  }, null);

  useEffect(() => {
    if (!open) {
      formRef.current?.reset();
      setMarket(holding?.market ?? "KR");
      setTicker("");
      setName("");
      setQuery("");
      setShowDropdown(false);
      setAvgPriceDisplay(
        holding?.avg_price != null ? Number(holding.avg_price).toLocaleString() : ""
      );
    }
  }, [open, holding?.market, holding?.avg_price, setQuery]);

  // 시장 변경 시 입력값 초기화
  useEffect(() => {
    setTicker("");
    setName("");
    setQuery("");
    setShowDropdown(false);
  }, [market, setQuery]);

  const isEdit = !!holding;

  function handleSelectStock(result: { ticker: string; name: string }) {
    setTicker(result.ticker);
    setName(result.name);
    setQuery(result.ticker);
    setShowDropdown(false);
  }

  const handleTriggerClick = () => {
    setOpen(true);
  };

  return (
    <>
      {React.isValidElement(trigger)
        ? React.cloneElement(trigger as any, { onClick: handleTriggerClick })
        : trigger}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{isEdit ? "종목 수정" : "종목 추가"}</DialogTitle>
          </DialogHeader>
          <form ref={formRef} action={formAction} className="space-y-4">
            <input type="hidden" name="account_id" value={accountId} />
            {holding && <input type="hidden" name="id" value={holding.id} />}

            {!isEdit && (
              <>
                {/* 시장 선택 */}
                <div className="space-y-2">
                  <Label>시장</Label>
                  <div className="flex gap-2">
                    {(["KR", "US"] as const).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setMarket(m)}
                        className={`flex-1 rounded-md border py-2 text-sm font-medium transition-colors
                        ${market === m ? "border-foreground bg-foreground text-background" : "border-input hover:bg-accent"}`}
                      >
                        {m === "KR" ? "국내 (KR)" : "해외 (US)"}
                      </button>
                    ))}
                  </div>
                  <input type="hidden" name="market" value={market} />
                </div>

                {/* 종목 검색 자동완성 */}
                <div className="space-y-2">
                  <Label>종목 검색</Label>
                  <div className="relative" ref={dropdownRef}>
                    <Input
                      placeholder={
                        market === "KR"
                          ? "종목코드 또는 종목명 입력 (예: 005930, 삼성전자)"
                          : "Ticker or name (e.g. AAPL, Apple)"
                      }
                      value={query}
                      onChange={(e) => {
                        setQuery(e.target.value);
                        setShowDropdown(true);
                        // 직접 입력 허용: 검색어 그대로 ticker에 반영
                        setTicker(e.target.value);
                        setName("");
                      }}
                      onFocus={() => query && setShowDropdown(true)}
                      onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                      autoComplete="off"
                    />
                    {showDropdown && results.length > 0 && (
                      <div className="absolute z-50 mt-1 w-full rounded-md border bg-background shadow-md max-h-60 overflow-y-auto">
                        {results.map((r) => (
                          <button
                            key={r.ticker}
                            type="button"
                            className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent text-left"
                            onMouseDown={() => handleSelectStock(r)}
                          >
                            <span className="flex-1 font-medium">{r.name}</span>
                            <span className="shrink-0 text-xs text-muted-foreground">
                              {r.ticker} · {r.exchange}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* hidden inputs for form submission */}
                <input type="hidden" name="ticker" value={ticker} />
                <input type="hidden" name="name" value={name || ticker} />
              </>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">수량</Label>
                <Input
                  id="quantity"
                  name="quantity"
                  type="number"
                  inputMode="decimal"
                  min="0.0001"
                  step="any"
                  defaultValue={holding?.quantity}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="avg_price">
                  평균단가 (
                  {isEdit
                    ? holding?.currency === "USD"
                      ? "USD"
                      : "KRW"
                    : market === "US"
                      ? "USD"
                      : "KRW"}
                  )
                </Label>
                <Input
                  id="avg_price"
                  type="text"
                  inputMode="decimal"
                  value={avgPriceDisplay}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/,/g, "");
                    if (raw === "" || /^\d*\.?\d*$/.test(raw)) {
                      const parts = raw.split(".");
                      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                      setAvgPriceDisplay(parts.join("."));
                    }
                  }}
                  placeholder="0"
                  required
                />
                <input type="hidden" name="avg_price" value={avgPriceDisplay.replace(/,/g, "")} />
              </div>
            </div>

            {/* 선택된 종목 미리보기 */}
            {!isEdit && ticker && (
              <p className="text-xs text-muted-foreground">
                선택: <span className="font-medium text-foreground">{name || ticker}</span> (
                {ticker})
              </p>
            )}

            {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                취소
              </Button>
              <Button type="submit" disabled={isPending || (!isEdit && !ticker)}>
                {isPending ? "저장 중..." : "저장"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
