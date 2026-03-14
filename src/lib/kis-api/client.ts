/**
 * 한국투자증권 Open API 클라이언트
 * 문서: https://apiportal.koreainvestment.com
 */

const KIS_BASE_URL = process.env.KIS_IS_REAL === "true"
  ? "https://openapi.koreainvestment.com:9443"
  : "https://openapivts.koreainvestment.com:29443"; // 모의투자

const APP_KEY = process.env.KIS_APP_KEY!;
const APP_SECRET = process.env.KIS_APP_SECRET!;

let cachedToken: { token: string; expiresAt: number } | null = null;

/** OAuth 토큰 발급 (캐싱 포함) */
export async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token;
  }

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

  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000, // 만료 1분 전 갱신
  };

  return cachedToken.token;
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
