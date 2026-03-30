-- ============================================================
-- accounts: 계좌
-- ============================================================
CREATE TABLE accounts (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,   -- 계좌명 (ex: "키움 ISA")
  broker     TEXT NOT NULL,   -- 증권사 (ex: "키움증권")
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- holdings: 보유 종목 (계좌별)
-- ============================================================
CREATE TABLE holdings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id  UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  ticker      TEXT NOT NULL,                          -- 종목코드 (ex: 005930, AAPL)
  name        TEXT NOT NULL,                          -- 종목명
  market      TEXT NOT NULL CHECK (market IN ('KR', 'US')),
  quantity    NUMERIC NOT NULL CHECK (quantity > 0),  -- 보유 수량
  avg_price   NUMERIC NOT NULL CHECK (avg_price > 0), -- 평균 매입가
  currency    TEXT NOT NULL DEFAULT 'KRW',            -- KRW | USD
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- kis_token: 한국투자증권 API 액세스 토큰 캐시 (전역 1행)
-- ============================================================
CREATE TABLE kis_token (
  id         INT PRIMARY KEY DEFAULT 1,  -- 항상 1행만 유지
  token      TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL
);

-- updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER holdings_updated_at
  BEFORE UPDATE ON holdings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- RLS (Row Level Security): 본인 데이터만 접근 가능
-- ============================================================
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE holdings ENABLE ROW LEVEL SECURITY;

-- accounts RLS
CREATE POLICY "accounts: 본인만 조회" ON accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "accounts: 본인만 생성" ON accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "accounts: 본인만 수정" ON accounts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "accounts: 본인만 삭제" ON accounts FOR DELETE USING (auth.uid() = user_id);

-- holdings RLS
CREATE POLICY "holdings: 본인만 조회" ON holdings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "holdings: 본인만 생성" ON holdings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "holdings: 본인만 수정" ON holdings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "holdings: 본인만 삭제" ON holdings FOR DELETE USING (auth.uid() = user_id);
