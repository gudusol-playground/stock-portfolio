"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";

interface AuthFormProps {
  action: (formData: FormData) => Promise<{ error: string } | void>;
  submitLabel: string;
}

export function AuthForm({ action, submitLabel }: AuthFormProps) {
  const [state, formAction, isPending] = useActionState(async (_: unknown, formData: FormData) => {
    const result = await action(formData);
    return result ?? null;
  }, null);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium">
          이메일
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          placeholder="you@example.com"
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium">
          비밀번호
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          placeholder="••••••••"
        />
      </div>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "처리 중..." : submitLabel}
      </Button>
    </form>
  );
}
