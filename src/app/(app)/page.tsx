import { Suspense } from "react";
import { PortfolioContent } from "./components/portfolio-content";
import { PortfolioSkeleton } from "./components/portfolio-skeleton";

async function getUsdKrw(): Promise<{ rate: number; date: string }> {
  try {
    const res = await fetch("https://api.frankfurter.app/latest?from=USD&to=KRW", {
      next: { revalidate: 3600 },
    });
    const data = await res.json();
    return { rate: data.rates.KRW as number, date: data.date as string };
  } catch {
    return { rate: 1380, date: "" };
  }
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
          {rateDate && <p className="text-xs text-muted-foreground">{rateDate} 기준 (ECB)</p>}
        </div>
      </div>

      <Suspense fallback={<PortfolioSkeleton />}>
        <PortfolioContent usdKrw={USD_KRW} />
      </Suspense>
    </div>
  );
}
