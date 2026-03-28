"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function RefreshButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleRefresh() {
    setLoading(true);
    router.refresh();
    // refresh()는 Promise를 반환하지 않으므로 짧게 대기 후 해제
    setTimeout(() => setLoading(false), 1500);
  }

  return (
    <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
      {loading ? "조회 중..." : "현재가 새로고침"}
    </Button>
  );
}
