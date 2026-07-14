-- ログイン機能撤去に伴い user_id を任意化
-- Supabase Dashboard > SQL Editor から実行してください

ALTER TABLE lists ALTER COLUMN user_id DROP NOT NULL;
