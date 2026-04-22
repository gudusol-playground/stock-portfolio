export type Market = "KR" | "US" | "COIN";
export type Currency = "KRW" | "USD";

/** DB: accounts 테이블 */
export interface Account {
  id: string;
  user_id: string;
  name: string;
  broker: string;
  created_at: string;
}

/** DB: holdings 테이블 */
export interface Holding {
  id: string;
  user_id: string;
  account_id: string;
  ticker: string;
  name: string;
  market: Market;
  quantity: number;
  avg_price: number;
  currency: Currency;
  created_at: string;
  updated_at: string;
}

/** DB: coin_holdings 테이블 */
export interface CoinHolding {
  id: string;
  user_id: string;
  exchange: string;
  ticker: string;
  name: string;
  quantity: number;
  avg_price: number;
  created_at: string;
  updated_at: string;
}

/** 대시보드용 — ticker 기준으로 계좌 통합 집계 */
export interface AggregatedHolding {
  ticker: string;
  name: string;
  market: Market;
  currency: Currency;
  totalQuantity: number;
  avgPrice: number; // 가중평균 매입가
  currentPrice: number; // 현재가
  totalCostKRW: number; // 총 매입금액 (원화 환산)
  totalValueKRW: number; // 현재 평가금액 (원화 환산)
  returnRate: number; // 수익률 (%)
  weight: number; // 포트폴리오 비중 (%)
  accounts: { accountName: string; quantity: number }[];
}
