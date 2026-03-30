/**
 * 한국투자증권 Open API 클라이언트
 * 문서: https://apiportal.koreainvestment.com
 */

import { createClient } from "@supabase/supabase-js";

const IS_REAL = process.env.KIS_IS_REAL === "true";

const KIS_BASE_URL = IS_REAL
  ? "https://openapi.koreainvestment.com:9443"
  : "https://openapivts.koreainvestment.com:29443"; // 모의투자

const APP_KEY = process.env.KIS_APP_KEY!;
const APP_SECRET = process.env.KIS_APP_SECRET!;

// kis_token 테이블은 RLS 없이 서비스 롤로 접근
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function issueNewToken(): Promise<{ token: string; expiresAt: Date }> {
  const res = await fetch(`${KIS_BASE_URL}/oauth2/tokenP`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "client_credentials",
      appkey: APP_KEY,
      appsecret: APP_SECRET,
    }),
  });

  if (!res.ok) {
    throw new Error(`KIS token request failed: ${res.status}`);
  }

  const data = await res.json();
  const expiresAt = new Date(Date.now() + (data.expires_in - 60) * 1000); // 만료 1분 전 갱신

  await supabaseAdmin.from("kis_token").upsert({ id: 1, token: data.access_token, expires_at: expiresAt.toISOString() });

  return { token: data.access_token, expiresAt };
}

/** OAuth 토큰 조회 — Supabase 캐시 우선, 만료 시 재발급 */
export async function getAccessToken(): Promise<string> {
  const { data } = await supabaseAdmin
    .from("kis_token")
    .select("token, expires_at")
    .eq("id", 1)
    .single();

  if (data && new Date(data.expires_at) > new Date()) {
    return data.token;
  }

  const { token } = await issueNewToken();
  return token;
}

/** KIS API 공통 요청 함수 */
export async function kisRequest<T>(
  path: string,
  trId: string,
  params: Record<string, string>
): Promise<T> {
  const token = await getAccessToken();
  const url = new URL(`${KIS_BASE_URL}${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
      appkey: APP_KEY,
      appsecret: APP_SECRET,
      "tr_id": trId,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    throw new Error(`KIS API error: ${res.status} ${path}`);
  }

  return res.json() as Promise<T>;
}

/** 국내 주식 현재가 조회 */
async function getKrStockPrice(ticker: string): Promise<number> {
  const data = await kisRequest<{ output: { stck_prpr: string } }>(
    "/uapi/domestic-stock/v1/quotations/inquire-price",
    "FHKST01010100",
    { FID_COND_MRKT_DIV_CODE: "J", FID_INPUT_ISCD: ticker }
  );
  const price = Number(data.output?.stck_prpr);
  if (!price) throw new Error(`KR price not found for ${ticker}`);
  return price;
}

// 거래소 코드 추론 (NAS 시도 후 NYS 폴백)
const EXCHANGE_CACHE: Record<string, string> = {};

async function getUsStockPrice(ticker: string): Promise<number> {
  if (!IS_REAL) {
    throw new Error("해외주식 현재가 조회는 실전투자 계정에서만 지원됩니다");
  }

  const exchanges = EXCHANGE_CACHE[ticker]
    ? [EXCHANGE_CACHE[ticker]]
    : ["NAS", "NYS", "AMS"];

  for (const excd of exchanges) {
    try {
      const data = await kisRequest<{ output: { last: string } }>(
        "/uapi/overseas-price/v1/quotations/price",
        "HHDFS76200200",
        { AUTH: "", EXCD: excd, SYMB: ticker }
      );
      const price = Number(data.output?.last);
      if (price) {
        EXCHANGE_CACHE[ticker] = excd;
        return price;
      }
    } catch {
      // 다음 거래소 시도
    }
  }
  throw new Error(`US price not found for ${ticker}`);
}

/** 보유 종목 현재가 일괄 조회. 실패한 종목은 결과에서 제외됨 */
export async function getStockPrices(
  tickers: { ticker: string; market: "KR" | "US" }[]
): Promise<Record<string, number>> {
  const results = await Promise.allSettled(
    tickers.map(async ({ ticker, market }) => {
      const price = market === "KR"
        ? await getKrStockPrice(ticker)
        : await getUsStockPrice(ticker);
      return { ticker, price };
    })
  );

  return Object.fromEntries(
    results
      .filter((r): r is PromiseFulfilledResult<{ ticker: string; price: number }> => r.status === "fulfilled")
      .map((r) => [r.value.ticker, r.value.price])
  );
}
