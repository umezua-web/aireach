-- フィルタ選択肢キャッシュ + 検索高速化インデックス + user_id任意化
-- Supabase Dashboard > SQL Editor から実行してください
-- （集計に時間がかかるため、タイムアウトを一時的に延長しています）

SET statement_timeout = '300s';

-- 1) ログイン撤去に伴い user_id を任意化
ALTER TABLE lists ALTER COLUMN user_id DROP NOT NULL;

-- 2) フィルタ選択肢のキャッシュテーブル
CREATE TABLE IF NOT EXISTS filter_options_cache (
  id         INT PRIMARY KEY DEFAULT 1,
  data       JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3) 集計してキャッシュに保存（再実行すれば更新される）
INSERT INTO filter_options_cache (id, data)
VALUES (1, (SELECT get_filter_options()))
ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();

-- 4) 検索を速くするインデックス
CREATE INDEX IF NOT EXISTS idx_companies_industry_major ON companies(industry_major);
CREATE INDEX IF NOT EXISTS idx_companies_industry_minor ON companies(industry_minor);
CREATE INDEX IF NOT EXISTS idx_companies_prefecture     ON companies(prefecture);
CREATE INDEX IF NOT EXISTS idx_companies_employee_range ON companies(employee_range);
CREATE INDEX IF NOT EXISTS idx_companies_revenue_range  ON companies(revenue_range);
CREATE INDEX IF NOT EXISTS idx_companies_founded_year   ON companies(founded_year);
CREATE INDEX IF NOT EXISTS idx_companies_company_name   ON companies(company_name);

-- HPあり/電話ありは該当行が少ないため部分インデックスで高速化
CREATE INDEX IF NOT EXISTS idx_companies_has_hp
  ON companies(houjin_bangou) WHERE hp_url IS NOT NULL AND hp_url <> '';
CREATE INDEX IF NOT EXISTS idx_companies_has_phone
  ON companies(houjin_bangou) WHERE phone IS NOT NULL AND phone <> '';

-- 確認
SELECT jsonb_object_keys(data) FROM filter_options_cache WHERE id = 1;
