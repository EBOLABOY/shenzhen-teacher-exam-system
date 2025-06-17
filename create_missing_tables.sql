-- 创建缺失的数据库表和功能
-- 请在 Supabase Dashboard 的 SQL Editor 中执行此脚本

-- 1. 创建AI分析记录表
CREATE TABLE IF NOT EXISTS ai_analysis (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  analysis_type TEXT NOT NULL DEFAULT 'weakness_analysis',
  wrong_questions_data JSONB NOT NULL,
  ai_response TEXT NOT NULL,
  weak_subjects JSONB,
  recommendations JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 创建AI分析表索引
CREATE INDEX IF NOT EXISTS idx_ai_analysis_user_id ON ai_analysis(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_type ON ai_analysis(analysis_type);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_created_at ON ai_analysis(created_at);

-- 3. 启用AI分析表的RLS
ALTER TABLE ai_analysis ENABLE ROW LEVEL SECURITY;

-- 4. 创建AI分析表的RLS策略
DROP POLICY IF EXISTS "Users can view own ai analysis" ON ai_analysis;
DROP POLICY IF EXISTS "Users can insert own ai analysis" ON ai_analysis;

CREATE POLICY "Users can view own ai analysis" ON ai_analysis
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ai analysis" ON ai_analysis
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 5. 检查并添加错题库表的缺失列（如果需要）
DO $$
BEGIN
    -- 检查 mastered_at 列是否存在
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'wrong_questions'
        AND column_name = 'mastered_at'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE wrong_questions ADD COLUMN mastered_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- 检查 is_mastered 列是否存在
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'wrong_questions' 
        AND column_name = 'is_mastered'
    ) THEN
        ALTER TABLE wrong_questions ADD COLUMN is_mastered BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- 检查 question_type 列是否存在
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'wrong_questions' 
        AND column_name = 'question_type'
    ) THEN
        ALTER TABLE wrong_questions ADD COLUMN question_type TEXT NOT NULL DEFAULT 'unknown';
    END IF;
    
    -- 检查 difficulty 列是否存在
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'wrong_questions' 
        AND column_name = 'difficulty'
    ) THEN
        ALTER TABLE wrong_questions ADD COLUMN difficulty TEXT;
    END IF;
    
    -- 检查 subject 列是否存在
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'wrong_questions' 
        AND column_name = 'subject'
    ) THEN
        ALTER TABLE wrong_questions ADD COLUMN subject TEXT NOT NULL DEFAULT 'unknown';
    END IF;
    
    -- 检查 user_answer 列是否存在
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'wrong_questions' 
        AND column_name = 'user_answer'
    ) THEN
        ALTER TABLE wrong_questions ADD COLUMN user_answer TEXT NOT NULL DEFAULT '';
    END IF;
    
    -- 检查 correct_answer 列是否存在
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'wrong_questions' 
        AND column_name = 'correct_answer'
    ) THEN
        ALTER TABLE wrong_questions ADD COLUMN correct_answer TEXT NOT NULL DEFAULT '';
    END IF;
END $$;

-- 6. 创建或更新错题库表的索引
CREATE INDEX IF NOT EXISTS idx_wrong_questions_user_id ON wrong_questions(user_id);
CREATE INDEX IF NOT EXISTS idx_wrong_questions_subject ON wrong_questions(subject);
CREATE INDEX IF NOT EXISTS idx_wrong_questions_question_type ON wrong_questions(question_type);
CREATE INDEX IF NOT EXISTS idx_wrong_questions_is_mastered ON wrong_questions(is_mastered);
CREATE INDEX IF NOT EXISTS idx_wrong_questions_created_at ON wrong_questions(created_at);

-- 7. 确保错题库表的RLS策略存在
ALTER TABLE wrong_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own wrong questions" ON wrong_questions;
DROP POLICY IF EXISTS "Users can insert own wrong questions" ON wrong_questions;
DROP POLICY IF EXISTS "Users can update own wrong questions" ON wrong_questions;
DROP POLICY IF EXISTS "Users can delete own wrong questions" ON wrong_questions;

CREATE POLICY "Users can view own wrong questions" ON wrong_questions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wrong questions" ON wrong_questions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own wrong questions" ON wrong_questions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own wrong questions" ON wrong_questions
  FOR DELETE USING (auth.uid() = user_id);

-- 8. 创建更新时间触发器函数（如果不存在）
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 9. 创建错题库表的更新触发器
DROP TRIGGER IF EXISTS update_wrong_questions_updated_at ON wrong_questions;
CREATE TRIGGER update_wrong_questions_updated_at 
  BEFORE UPDATE ON wrong_questions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 10. 创建统计视图（可选）
CREATE OR REPLACE VIEW wrong_questions_stats AS
SELECT 
  user_id,
  COUNT(*) as total_wrong,
  COUNT(CASE WHEN is_mastered = false THEN 1 END) as unmastered_count,
  COUNT(CASE WHEN is_mastered = true THEN 1 END) as mastered_count,
  subject,
  question_type,
  AVG(wrong_count) as avg_wrong_count
FROM wrong_questions
GROUP BY user_id, subject, question_type;

-- 为视图设置安全策略
ALTER VIEW wrong_questions_stats SET (security_invoker = true);

-- 完成提示
SELECT 'Database setup completed successfully!' as status;
