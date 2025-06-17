-- 修复错题表结构
-- 请在 Supabase Dashboard 的 SQL Editor 中执行此脚本

-- 1. 添加缺失的字段
ALTER TABLE wrong_questions ADD COLUMN IF NOT EXISTS user_answer TEXT;
ALTER TABLE wrong_questions ADD COLUMN IF NOT EXISTS correct_answer TEXT;
ALTER TABLE wrong_questions ADD COLUMN IF NOT EXISTS question_type TEXT;
ALTER TABLE wrong_questions ADD COLUMN IF NOT EXISTS subject TEXT;
ALTER TABLE wrong_questions ADD COLUMN IF NOT EXISTS difficulty TEXT;
ALTER TABLE wrong_questions ADD COLUMN IF NOT EXISTS first_wrong_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE wrong_questions ADD COLUMN IF NOT EXISTS mastered_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE wrong_questions ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE wrong_questions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 2. 更新现有数据，从关联的questions表获取信息
UPDATE wrong_questions 
SET 
  correct_answer = q.answer,
  question_type = q.type,
  subject = q.subject,
  difficulty = q.difficulty,
  user_answer = COALESCE(wrong_questions.user_answer, 'unknown'),
  first_wrong_at = COALESCE(wrong_questions.first_wrong_at, wrong_questions.last_wrong_at),
  created_at = COALESCE(wrong_questions.created_at, wrong_questions.last_wrong_at),
  updated_at = COALESCE(wrong_questions.updated_at, wrong_questions.last_wrong_at)
FROM questions q
WHERE wrong_questions.question_id = q.id
  AND (wrong_questions.correct_answer IS NULL 
       OR wrong_questions.question_type IS NULL 
       OR wrong_questions.subject IS NULL);

-- 3. 创建索引
CREATE INDEX IF NOT EXISTS idx_wrong_questions_subject ON wrong_questions(subject);
CREATE INDEX IF NOT EXISTS idx_wrong_questions_question_type ON wrong_questions(question_type);
CREATE INDEX IF NOT EXISTS idx_wrong_questions_is_mastered ON wrong_questions(is_mastered);
CREATE INDEX IF NOT EXISTS idx_wrong_questions_created_at ON wrong_questions(created_at);

-- 4. 创建更新时间触发器（如果不存在）
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为错题表创建触发器
DROP TRIGGER IF EXISTS update_wrong_questions_updated_at ON wrong_questions;
CREATE TRIGGER update_wrong_questions_updated_at 
  BEFORE UPDATE ON wrong_questions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. 验证更新结果
SELECT 
  id,
  question_id,
  user_answer,
  correct_answer,
  question_type,
  subject,
  difficulty,
  wrong_count,
  is_mastered,
  last_wrong_at
FROM wrong_questions
ORDER BY last_wrong_at DESC;
