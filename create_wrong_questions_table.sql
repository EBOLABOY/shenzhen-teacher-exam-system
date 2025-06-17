-- 创建错题库表
CREATE TABLE IF NOT EXISTS wrong_questions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id BIGINT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  user_answer TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  question_type TEXT NOT NULL,
  subject TEXT NOT NULL,
  difficulty TEXT,
  wrong_count INTEGER DEFAULT 1,
  first_wrong_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_wrong_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_mastered BOOLEAN DEFAULT FALSE,
  mastered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 确保同一用户同一题目只有一条记录
  UNIQUE(user_id, question_id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_wrong_questions_user_id ON wrong_questions(user_id);
CREATE INDEX IF NOT EXISTS idx_wrong_questions_subject ON wrong_questions(subject);
CREATE INDEX IF NOT EXISTS idx_wrong_questions_question_type ON wrong_questions(question_type);
CREATE INDEX IF NOT EXISTS idx_wrong_questions_is_mastered ON wrong_questions(is_mastered);
CREATE INDEX IF NOT EXISTS idx_wrong_questions_created_at ON wrong_questions(created_at);

-- 创建RLS策略
ALTER TABLE wrong_questions ENABLE ROW LEVEL SECURITY;

-- 用户只能访问自己的错题
CREATE POLICY "Users can view own wrong questions" ON wrong_questions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wrong questions" ON wrong_questions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own wrong questions" ON wrong_questions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own wrong questions" ON wrong_questions
  FOR DELETE USING (auth.uid() = user_id);

-- 创建AI分析记录表
CREATE TABLE IF NOT EXISTS ai_analysis (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  analysis_type TEXT NOT NULL DEFAULT 'weakness_analysis',
  wrong_questions_data JSONB NOT NULL,
  ai_response TEXT NOT NULL,
  weak_subjects JSONB,
  recommendations JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 索引
  INDEX (user_id),
  INDEX (analysis_type),
  INDEX (created_at)
);

-- AI分析表的RLS策略
ALTER TABLE ai_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ai analysis" ON ai_analysis
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ai analysis" ON ai_analysis
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_wrong_questions_updated_at 
  BEFORE UPDATE ON wrong_questions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 插入一些示例数据（可选）
COMMENT ON TABLE wrong_questions IS '用户错题库，记录用户答错的题目及相关信息';
COMMENT ON TABLE ai_analysis IS 'AI分析记录，存储对用户错题的智能分析结果';

-- 创建视图：错题统计
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

-- 为视图创建RLS
ALTER VIEW wrong_questions_stats SET (security_invoker = true);
