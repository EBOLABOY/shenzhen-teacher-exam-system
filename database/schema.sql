-- 创建题目表
CREATE TABLE IF NOT EXISTS questions (
  id SERIAL PRIMARY KEY,
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  answer VARCHAR(10) NOT NULL, -- 支持多选题答案如"ABC"
  explanation TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'multiple_choice',
  subject VARCHAR(100) DEFAULT '教育学',
  difficulty VARCHAR(20) DEFAULT 'medium',
  exam_year INTEGER,
  exam_date VARCHAR(50),
  exam_segment VARCHAR(50),
  section_type VARCHAR(50),
  points DECIMAL(3,1) DEFAULT 1.0,
  question_number INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建邀请码表
CREATE TABLE IF NOT EXISTS invite_codes (
  id SERIAL PRIMARY KEY,
  code VARCHAR(20) UNIQUE NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  used_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_used BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  used_at TIMESTAMP WITH TIME ZONE
);

-- 创建用户配置表
CREATE TABLE IF NOT EXISTS user_profiles (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  display_name VARCHAR(100),
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建用户答题记录表
CREATE TABLE IF NOT EXISTS user_answers (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
  selected_answer VARCHAR(10) NOT NULL, -- 支持多选答案
  is_correct BOOLEAN NOT NULL,
  time_spent INTEGER DEFAULT 0, -- 答题用时（秒）
  answered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建用户学习进度表
CREATE TABLE IF NOT EXISTS user_progress (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  total_questions INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  total_time INTEGER DEFAULT 0, -- 总学习时间（秒）
  streak_days INTEGER DEFAULT 0, -- 连续学习天数
  best_streak INTEGER DEFAULT 0, -- 最佳连续学习天数
  last_practice_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 创建错题本表
CREATE TABLE IF NOT EXISTS wrong_questions (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
  wrong_count INTEGER DEFAULT 1,
  last_wrong_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_mastered BOOLEAN DEFAULT FALSE,
  UNIQUE(user_id, question_id)
);

-- 插入示例题目数据
INSERT INTO questions (question, options, answer, explanation, type, subject, difficulty) VALUES
('教育的本质是什么？', '{"A": "传授知识", "B": "培养人才", "C": "促进人的全面发展", "D": "提高技能"}', 'C', '教育的本质是促进人的全面发展，这包括知识、技能、品德、身心等各个方面的协调发展。', 'multiple_choice', '教育学', 'medium'),

('以下哪项不是素质教育的特征？', '{"A": "面向全体学生", "B": "促进学生全面发展", "C": "以考试成绩为唯一标准", "D": "培养学生创新精神"}', 'C', '素质教育强调面向全体学生，促进学生全面发展，培养创新精神，而不是以考试成绩为唯一标准。', 'multiple_choice', '教育学', 'easy'),

('班级管理的核心是什么？', '{"A": "制定班规", "B": "建立良好的师生关系", "C": "提高学习成绩", "D": "维护课堂纪律"}', 'B', '班级管理的核心是建立良好的师生关系，这是有效管理班级的基础。', 'multiple_choice', '教育学', 'medium'),

('教学过程的基本规律是什么？', '{"A": "传授知识与发展智力相统一", "B": "教师主导与学生主体相统一", "C": "掌握知识与培养能力相统一", "D": "以上都是"}', 'D', '教学过程的基本规律包括传授知识与发展智力相统一、教师主导与学生主体相统一、掌握知识与培养能力相统一等。', 'multiple_choice', '教育学', 'hard'),

('课程的基本类型不包括以下哪项？', '{"A": "学科课程", "B": "活动课程", "C": "隐性课程", "D": "考试课程"}', 'D', '课程的基本类型包括学科课程、活动课程、隐性课程等，但不包括考试课程。', 'multiple_choice', '教育学', 'easy'),

('教学方法中，以语言传递为主的方法是？', '{"A": "讲授法", "B": "演示法", "C": "实验法", "D": "练习法"}', 'A', '讲授法是以语言传递为主的教学方法，通过教师的口头语言向学生传授知识。', 'multiple_choice', '教育学', 'easy'),

('学生的学习动机可以分为？', '{"A": "内在动机和外在动机", "B": "认知动机和情感动机", "C": "个人动机和社会动机", "D": "以上都是"}', 'D', '学生的学习动机可以从不同角度进行分类，包括内在动机和外在动机、认知动机和情感动机、个人动机和社会动机等。', 'multiple_choice', '心理学', 'medium'),

('皮亚杰认知发展理论中，7-11岁儿童处于？', '{"A": "感知运动阶段", "B": "前运算阶段", "C": "具体运算阶段", "D": "形式运算阶段"}', 'C', '根据皮亚杰的认知发展理论，7-11岁的儿童处于具体运算阶段，能够进行逻辑思维，但仍需要具体事物的支持。', 'multiple_choice', '心理学', 'medium'),

('教师职业道德的核心是？', '{"A": "爱岗敬业", "B": "关爱学生", "C": "教书育人", "D": "为人师表"}', 'C', '教书育人是教师职业道德的核心，体现了教师的根本职责和使命。', 'multiple_choice', '职业道德', 'medium'),

('新课程改革的核心理念是？', '{"A": "以教师为中心", "B": "以学生发展为本", "C": "以知识为中心", "D": "以考试为中心"}', 'B', '新课程改革的核心理念是以学生发展为本，强调学生的主体地位和全面发展。', 'multiple_choice', '教育学', 'medium');

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_questions_subject ON questions(subject);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_questions_exam_year ON questions(exam_year);
CREATE INDEX IF NOT EXISTS idx_questions_type ON questions(type);
CREATE INDEX IF NOT EXISTS idx_user_answers_user_id ON user_answers(user_id);
CREATE INDEX IF NOT EXISTS idx_user_answers_question_id ON user_answers(question_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_wrong_questions_user_id ON wrong_questions(user_id);
CREATE INDEX IF NOT EXISTS idx_invite_codes_code ON invite_codes(code);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_questions_updated_at BEFORE UPDATE ON questions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_progress_updated_at BEFORE UPDATE ON user_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
