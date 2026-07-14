-- マイリスト用テーブル
-- Supabase Dashboard > SQL Editor から実行してください

CREATE TABLE IF NOT EXISTS lists (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name       TEXT NOT NULL,
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS list_companies (
  list_id      UUID REFERENCES lists(id) ON DELETE CASCADE NOT NULL,
  houjin_bangou TEXT NOT NULL,
  added_at     TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (list_id, houjin_bangou)
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_lists_user_id ON lists(user_id);
CREATE INDEX IF NOT EXISTS idx_list_companies_list_id ON list_companies(list_id);
