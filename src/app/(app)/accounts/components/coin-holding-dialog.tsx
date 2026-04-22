"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addCoinHolding, updateCoinHolding } from "../actions";
import type { CoinHolding } from "@/types";

const COINS = [
  { ticker: "BTC", name: "비트코인" },
  { ticker: "ETH", name: "이더리움" },
];

interface Props {
  coin?: CoinHolding;
  trigger: any;
}

export function CoinHoldingDialog({ coin, trigger }: Props) {
  const [open, setOpen] = useState(false);
  const [selectedTicker, setSelectedTicker] = useState(coin?.ticker ?? "");
  const [avgPriceDisplay, setAvgPriceDisplay] = useState(
    coin?.avg_price != null ? Number(coin.avg_price).toLocaleString() : ""
  );
  const formRef = useRef<HTMLFormElement>(null);
  const isEdit = !!coin;
  const action = isEdit ? updateCoinHolding : addCoinHolding;

  const selectedCoin = COINS.find((c) => c.ticker === selectedTicker);

  const [state, formAction, isPending] = useActionState(async (_: unknown, formData: FormData) => {
    const result = await action(formData);
    if (!result?.error) setOpen(false);
    return result ?? null;
  }, null);

  useEffect(() => {
    if (!open) {
      formRef.current?.reset();
      setSelectedTicker(coin?.ticker ?? "");
      setAvgPriceDisplay(
        coin?.avg_price != null ? Number(coin.avg_price).toLocaleString() : ""
      );
    }
  }, [open, coin?.ticker, coin?.avg_price]);

  return (
    <>
      {React.isValidElement(trigger)
        ? React.cloneElement(trigger as any, { onClick: () => setOpen(true) })
        : trigger}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isEdit ? "코인 수정" : "코인 추가"}</DialogTitle>
          </DialogHeader>
          <form ref={formRef} action={formAction} className="space-y-4">
            {isEdit && <input type="hidden" name="id" value={coin.id} />}
            <input type="hidden" name="ticker" value={selectedTicker} />
            <input type="hidden" name="name" value={selectedCoin?.name ?? ""} />

            {!isEdit && (
              <div className="space-y-2">
                <Label>코인 선택</Label>
                <div className="flex gap-2">
                  {COINS.map((c) => (
                    <button
                      key={c.ticker}
                      type="button"
                      onClick={() => setSelectedTicker(c.ticker)}
                      className={`flex-1 rounded-md border py-2 text-sm font-medium transition-colors
                        ${selectedTicker === c.ticker
                          ? "border-foreground bg-foreground text-background"
                          : "border-input hover:bg-accent"}`}
                    >
                      {c.name}
                      <span className="ml-1 text-xs opacity-60">{c.ticker}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {isEdit && (
              <div className="space-y-1">
                <Label>코인</Label>
                <p className="text-sm font-medium">{coin.name} <span className="text-muted-foreground">{coin.ticker}</span></p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="exchange">거래소</Label>
              <Input
                id="exchange"
                name="exchange"
                placeholder="업비트"
                defaultValue={coin?.exchange}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">수량</Label>
                <Input
                  id="quantity"
                  name="quantity"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="any"
                  defaultValue={coin?.quantity}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="avg_price">평균단가 (KRW)</Label>
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

            {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                취소
              </Button>
              <Button type="submit" disabled={isPending || (!isEdit && !selectedTicker)}>
                {isPending ? "저장 중..." : "저장"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
