"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Trash2 } from "lucide-react";

interface DeleteButtonProps {
  onDelete: () => Promise<{ error: string } | undefined>;
  description?: string;
  variant?: "icon" | "text";
}

export function DeleteButton({ onDelete, description, variant = "icon" }: DeleteButtonProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const result = await onDelete();
      if (result?.error) {
        setError(result.error);
      } else {
        setOpen(false);
      }
    });
  }

  return (
    <>
      {variant === "icon" ? (
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => setOpen(true)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      ) : (
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive" onClick={() => setOpen(true)}>
          삭제
        </Button>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
        <DialogHeader>
          <DialogTitle>정말 삭제하시겠어요?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          {description ?? "이 작업은 되돌릴 수 없습니다."}
        </p>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>취소</Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
            {isPending ? "삭제 중..." : "삭제"}
          </Button>
        </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
