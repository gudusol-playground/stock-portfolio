"use client";

import { useActionState, useEffect, useRef, useState, cloneElement } from "react";
import type { ReactElement } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addAccount, updateAccount } from "../actions";
import type { Account } from "@/types";

interface AccountDialogProps {
  account?: Account;
  trigger: ReactElement<{ onClick?: () => void }>;
}

export function AccountDialog({ account, trigger }: AccountDialogProps) {
  const [open, setOpen] = useState(false);
  const action = account ? updateAccount : addAccount;
  const formRef = useRef<HTMLFormElement>(null);

  const [state, formAction, isPending] = useActionState(
    async (_: unknown, formData: FormData) => {
      const result = await action(formData);
      if (!result?.error) setOpen(false);
      return result ?? null;
    },
    null
  );

  useEffect(() => {
    if (!open) formRef.current?.reset();
  }, [open]);

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
          <div className="space-y-2">
            <Label htmlFor="name">계좌명</Label>
            <Input id="name" name="name" defaultValue={account?.name} placeholder="키움 ISA" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="broker">증권사</Label>
            <Input id="broker" name="broker" defaultValue={account?.broker} placeholder="키움증권" required />
          </div>
          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>취소</Button>
            <Button type="submit" disabled={isPending}>{isPending ? "저장 중..." : "저장"}</Button>
          </div>
        </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
