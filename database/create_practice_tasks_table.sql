-- 创建练习任务表
CREATE TABLE IF NOT EXISTS practice_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_type TEXT NOT NULL, -- 'wrong_questions_review', 'subject_practice', 'difficulty_practice', 'random_practice'
  title TEXT NOT NULL,
  description TEXT,
  question_ids TEXT[] NOT NULL, -- 题目ID数组
  total_questions INTEGER NOT NULL DEFAULT 0,
  completed_questions INTEGER NOT NULL DEFAULT 0,
  correct_answers INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'paused'
  difficulty_distribution JSONB, -- 难度分布统计
  subject_distribution JSONB, -- 科目分布统计
  estimated_time INTEGER, -- 预计完成时间（分钟）
  actual_time INTEGER, -- 实际完成时间（分钟）
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建练习任务进度表
CREATE TABLE IF NOT EXISTS practice_task_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES practice_tasks(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  user_answer TEXT,
  correct_answer TEXT,
  is_correct BOOLEAN,
  time_spent INTEGER, -- 答题用时（秒）
  answered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_practice_tasks_user_id ON practice_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_practice_tasks_status ON practice_tasks(status);
CREATE INDEX IF NOT EXISTS idx_practice_tasks_task_type ON practice_tasks(task_type);
CREATE INDEX IF NOT EXISTS idx_practice_tasks_created_at ON practice_tasks(created_at);

CREATE INDEX IF NOT EXISTS idx_practice_task_progress_task_id ON practice_task_progress(task_id);
CREATE INDEX IF NOT EXISTS idx_practice_task_progress_question_id ON practice_task_progress(question_id);
CREATE INDEX IF NOT EXISTS idx_practice_task_progress_answered_at ON practice_task_progress(answered_at);

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_practice_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_practice_tasks_updated_at ON practice_tasks;
CREATE TRIGGER update_practice_tasks_updated_at 
  BEFORE UPDATE ON practice_tasks 
  FOR EACH ROW EXECUTE FUNCTION update_practice_tasks_updated_at();

-- 创建RLS策略
ALTER TABLE practice_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_task_progress ENABLE ROW LEVEL SECURITY;

-- 用户只能访问自己的练习任务
CREATE POLICY "Users can view own practice tasks" ON practice_tasks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own practice tasks" ON practice_tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own practice tasks" ON practice_tasks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own practice tasks" ON practice_tasks
  FOR DELETE USING (auth.uid() = user_id);

-- 用户只能访问自己任务的进度
CREATE POLICY "Users can view own task progress" ON practice_task_progress
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM practice_tasks 
      WHERE practice_tasks.id = practice_task_progress.task_id 
      AND practice_tasks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own task progress" ON practice_task_progress
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM practice_tasks 
      WHERE practice_tasks.id = practice_task_progress.task_id 
      AND practice_tasks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own task progress" ON practice_task_progress
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM practice_tasks 
      WHERE practice_tasks.id = practice_task_progress.task_id 
      AND practice_tasks.user_id = auth.uid()
    )
  );

-- 创建统计视图
CREATE OR REPLACE VIEW practice_task_stats AS
SELECT 
  pt.id,
  pt.user_id,
  pt.title,
  pt.task_type,
  pt.status,
  pt.total_questions,
  pt.completed_questions,
  pt.correct_answers,
  CASE 
    WHEN pt.completed_questions > 0 THEN 
      ROUND((pt.correct_answers::DECIMAL / pt.completed_questions) * 100, 2)
    ELSE 0 
  END as accuracy_rate,
  CASE 
    WHEN pt.total_questions > 0 THEN 
      ROUND((pt.completed_questions::DECIMAL / pt.total_questions) * 100, 2)
    ELSE 0 
  END as completion_rate,
  pt.estimated_time,
  pt.actual_time,
  pt.started_at,
  pt.completed_at,
  pt.created_at,
  pt.updated_at
FROM practice_tasks pt;

-- 授予权限
GRANT SELECT ON practice_task_stats TO authenticated;

COMMENT ON TABLE practice_tasks IS '练习任务表，记录用户的各种练习任务';
COMMENT ON TABLE practice_task_progress IS '练习任务进度表，记录每道题的答题情况';
COMMENT ON VIEW practice_task_stats IS '练习任务统计视图，提供任务的统计信息';
