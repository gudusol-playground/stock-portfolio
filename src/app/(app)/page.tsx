import { Suspense } from "react";
import { PortfolioContent } from "./components/portfolio-content";
import { PortfolioSkeleton } from "./components/portfolio-skeleton";

function formatSearchDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

async function getUsdKrw(): Promise<{ rate: number; date: string }> {
  const authkey = process.env.KOREAEXIM_API_KEY;
  if (!authkey) return { rate: 1380, date: "" };

  // 비영업일·오전 11시 이전엔 null 반환 → 최대 7일 전까지 재시도
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const searchdate = formatSearchDate(d);

    try {
      const res = await fetch(
        `https://oapi.koreaexim.go.kr/site/program/financial/exchangeJSON?authkey=${authkey}&searchdate=${searchdate}&data=AP01`,
        { next: { revalidate: 3600 } }
      );
      const data: Array<{ result: number; cur_unit: string; deal_bas_r: string }> = await res.json();

      if (!Array.isArray(data) || data.length === 0) continue;

      const usd = data.find((item) => item.cur_unit === "USD" && item.result === 1);
      if (!usd) continue;

      const rate = parseFloat(usd.deal_bas_r.replace(/,/g, ""));
      if (!rate || isNaN(rate)) continue;

      const dateStr = `${searchdate.slice(0, 4)}-${searchdate.slice(4, 6)}-${searchdate.slice(6, 8)}`;
      return { rate, date: dateStr };
    } catch {
      continue;
    }
  }

  return { rate: 1380, date: "" };
}

export default async function DashboardPage() {
  const { rate: USD_KRW, date: rateDate } = await getUsdKrw();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold">전체 포트폴리오</h1>
        <div className="text-left md:text-right">
          <p className="text-sm font-medium">
            USD/KRW {USD_KRW.toLocaleString("ko-KR", { maximumFractionDigits: 2 })}원
          </p>
          {rateDate && <p className="text-xs text-muted-foreground">{rateDate} 기준 (한국수출입은행)</p>}
        </div>
      </div>

      <Suspense fallback={<PortfolioSkeleton />}>
        <PortfolioContent usdKrw={USD_KRW} />
      </Suspense>
    </div>
  );
}
