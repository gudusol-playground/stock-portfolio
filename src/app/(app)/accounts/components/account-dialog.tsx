"use client";

import { useActionState, useEffect, useRef, useState, cloneElement } from "react";
import type { ReactElement } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addAccount, updateAccount } from "../actions";
import type { Account } from "@/types";

const BROKERS = [
  "키움증권",
  "미래에셋증권",
  "삼성증권",
  "NH투자증권",
  "KB증권",
  "한국투자증권",
  "신한투자증권",
  "대신증권",
  "하나증권",
  "토스증권",
  "카카오페이증권",
];

interface AccountDialogProps {
  account?: Account;
  trigger: ReactElement<{ onClick?: () => void }>;
}

export function AccountDialog({ account, trigger }: AccountDialogProps) {
  const [open, setOpen] = useState(false);
  const action = account ? updateAccount : addAccount;
  const formRef = useRef<HTMLFormElement>(null);

  const [brokerQuery, setBrokerQuery] = useState(account?.broker ?? "");
  const [showBrokerDropdown, setShowBrokerDropdown] = useState(false);

  const filteredBrokers = BROKERS.filter((b) =>
    b.toLowerCase().includes(brokerQuery.toLowerCase())
  );

  const [state, formAction, isPending] = useActionState(async (_: unknown, formData: FormData) => {
    const result = await action(formData);
    if (!result?.error) setOpen(false);
    return result ?? null;
  }, null);

  useEffect(() => {
    if (!open) {
      formRef.current?.reset();
      setBrokerQuery(account?.broker ?? "");
      setShowBrokerDropdown(false);
    }
  }, [open, account?.broker]);

  return (
    <>
      {cloneElement(trigger, { onClick: () => setOpen(true) })}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{account ? "계좌 수정" : "계좌 추가"}</DialogTitle>
          </DialogHeader>
          <form ref={formRef} action={formAction} className="space-y-4">
            {account && <input type="hidden" name="id" value={account.id} />}
            <input type="hidden" name="broker" value={brokerQuery} />
            <div className="space-y-2">
              <Label htmlFor="name">계좌명</Label>
              <Input
                id="name"
                name="name"
                defaultValue={account?.name}
                placeholder="키움 ISA"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="broker-input">증권사</Label>
              <div className="relative">
                <Input
                  id="broker-input"
                  placeholder="증권사 선택 또는 직접 입력"
                  value={brokerQuery}
                  onChange={(e) => {
                    setBrokerQuery(e.target.value);
                    setShowBrokerDropdown(true);
                  }}
                  onFocus={() => setShowBrokerDropdown(true)}
                  onBlur={() => setTimeout(() => setShowBrokerDropdown(false), 150)}
                  autoComplete="off"
                  required
                />
                {showBrokerDropdown && (
                  <div className="absolute z-50 mt-1 w-full rounded-md border bg-background shadow-md max-h-60 overflow-y-auto">
                    {filteredBrokers.map((b) => (
                      <button
                        key={b}
                        type="button"
                        className="flex w-full items-center px-3 py-2 text-sm hover:bg-accent text-left"
                        onMouseDown={() => {
                          setBrokerQuery(b);
                          setShowBrokerDropdown(false);
                        }}
                      >
                        {b}
                      </button>
                    ))}
                    {filteredBrokers.length === 0 && (
                      <p className="px-3 py-2 text-sm text-muted-foreground">
                        직접 입력한 값으로 저장됩니다
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
            {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                취소
              </Button>
              <Button type="submit" disabled={isPending || brokerQuery.trim() === ""}>
                {isPending ? "저장 중..." : "저장"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
