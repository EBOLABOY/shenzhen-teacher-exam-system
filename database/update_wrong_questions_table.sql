-- 更新错题表结构，确保包含所有必要字段
-- 请在 Supabase Dashboard 的 SQL Editor 中执行此脚本

-- 首先检查并添加缺失的字段
DO $$ 
BEGIN
    -- 添加 user_answer 字段（如果不存在）
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'wrong_questions' AND column_name = 'user_answer') THEN
        ALTER TABLE wrong_questions ADD COLUMN user_answer TEXT;
    END IF;

    -- 添加 correct_answer 字段（如果不存在）
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'wrong_questions' AND column_name = 'correct_answer') THEN
        ALTER TABLE wrong_questions ADD COLUMN correct_answer TEXT;
    END IF;

    -- 添加 question_type 字段（如果不存在）
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'wrong_questions' AND column_name = 'question_type') THEN
        ALTER TABLE wrong_questions ADD COLUMN question_type TEXT;
    END IF;

    -- 添加 subject 字段（如果不存在）
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'wrong_questions' AND column_name = 'subject') THEN
        ALTER TABLE wrong_questions ADD COLUMN subject TEXT;
    END IF;

    -- 添加 difficulty 字段（如果不存在）
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'wrong_questions' AND column_name = 'difficulty') THEN
        ALTER TABLE wrong_questions ADD COLUMN difficulty TEXT;
    END IF;

    -- 添加 first_wrong_at 字段（如果不存在）
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'wrong_questions' AND column_name = 'first_wrong_at') THEN
        ALTER TABLE wrong_questions ADD COLUMN first_wrong_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;

    -- 添加 mastered_at 字段（如果不存在）
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'wrong_questions' AND column_name = 'mastered_at') THEN
        ALTER TABLE wrong_questions ADD COLUMN mastered_at TIMESTAMP WITH TIME ZONE;
    END IF;

    -- 添加 created_at 字段（如果不存在）
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'wrong_questions' AND column_name = 'created_at') THEN
        ALTER TABLE wrong_questions ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;

    -- 添加 updated_at 字段（如果不存在）
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'wrong_questions' AND column_name = 'updated_at') THEN
        ALTER TABLE wrong_questions ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- 创建更新时间触发器（如果不存在）
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

-- 确保索引存在
CREATE INDEX IF NOT EXISTS idx_wrong_questions_user_question ON wrong_questions(user_id, question_id);
CREATE INDEX IF NOT EXISTS idx_wrong_questions_last_wrong_at ON wrong_questions(last_wrong_at);
CREATE INDEX IF NOT EXISTS idx_wrong_questions_is_mastered ON wrong_questions(is_mastered);

-- 显示表结构确认
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'wrong_questions' 
ORDER BY ordinal_position;
