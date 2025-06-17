-- 完整修复错题表结构和权限问题
-- 请在 Supabase Dashboard 的 SQL Editor 中执行此脚本

-- 1. 添加缺失的字段到 wrong_questions 表
ALTER TABLE wrong_questions ADD COLUMN IF NOT EXISTS user_answer TEXT;
ALTER TABLE wrong_questions ADD COLUMN IF NOT EXISTS correct_answer TEXT;
ALTER TABLE wrong_questions ADD COLUMN IF NOT EXISTS question_type TEXT;
ALTER TABLE wrong_questions ADD COLUMN IF NOT EXISTS subject TEXT;
ALTER TABLE wrong_questions ADD COLUMN IF NOT EXISTS difficulty TEXT;
ALTER TABLE wrong_questions ADD COLUMN IF NOT EXISTS first_wrong_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE wrong_questions ADD COLUMN IF NOT EXISTS mastered_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE wrong_questions ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE wrong_questions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 2. 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_wrong_questions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 删除旧的触发器（如果存在）
DROP TRIGGER IF EXISTS update_wrong_questions_updated_at ON wrong_questions;

-- 创建新的触发器
CREATE TRIGGER update_wrong_questions_updated_at 
    BEFORE UPDATE ON wrong_questions
    FOR EACH ROW 
    EXECUTE FUNCTION update_wrong_questions_updated_at();

-- 3. 设置 Row Level Security (RLS) 策略
-- 启用 RLS
ALTER TABLE wrong_questions ENABLE ROW LEVEL SECURITY;

-- 删除现有策略（如果存在）
DROP POLICY IF EXISTS "Users can view their own wrong questions" ON wrong_questions;
DROP POLICY IF EXISTS "Users can insert their own wrong questions" ON wrong_questions;
DROP POLICY IF EXISTS "Users can update their own wrong questions" ON wrong_questions;
DROP POLICY IF EXISTS "Users can delete their own wrong questions" ON wrong_questions;

-- 创建新的 RLS 策略
-- 用户可以查看自己的错题
CREATE POLICY "Users can view their own wrong questions" ON wrong_questions
    FOR SELECT USING (auth.uid() = user_id);

-- 用户可以插入自己的错题
CREATE POLICY "Users can insert their own wrong questions" ON wrong_questions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 用户可以更新自己的错题
CREATE POLICY "Users can update their own wrong questions" ON wrong_questions
    FOR UPDATE USING (auth.uid() = user_id);

-- 用户可以删除自己的错题
CREATE POLICY "Users can delete their own wrong questions" ON wrong_questions
    FOR DELETE USING (auth.uid() = user_id);

-- 4. 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_wrong_questions_user_question ON wrong_questions(user_id, question_id);
CREATE INDEX IF NOT EXISTS idx_wrong_questions_last_wrong_at ON wrong_questions(last_wrong_at);
CREATE INDEX IF NOT EXISTS idx_wrong_questions_is_mastered ON wrong_questions(is_mastered);
CREATE INDEX IF NOT EXISTS idx_wrong_questions_subject ON wrong_questions(subject);
CREATE INDEX IF NOT EXISTS idx_wrong_questions_difficulty ON wrong_questions(difficulty);

-- 5. 验证表结构
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'wrong_questions' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 6. 显示当前 RLS 策略
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'wrong_questions';

-- 完成提示
SELECT '错题表结构和权限修复完成！' as status;
