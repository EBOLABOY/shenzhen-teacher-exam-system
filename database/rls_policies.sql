-- 启用行级安全策略
ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE wrong_questions ENABLE ROW LEVEL SECURITY;

-- 邀请码表策略
-- 管理员可以查看所有邀请码
CREATE POLICY "管理员可以查看所有邀请码" ON invite_codes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.user_id = auth.uid() 
      AND user_profiles.is_admin = true
    )
  );

-- 管理员可以创建邀请码
CREATE POLICY "管理员可以创建邀请码" ON invite_codes
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.user_id = auth.uid() 
      AND user_profiles.is_admin = true
    )
  );

-- 管理员可以更新邀请码
CREATE POLICY "管理员可以更新邀请码" ON invite_codes
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.user_id = auth.uid() 
      AND user_profiles.is_admin = true
    )
  );

-- 用户配置表策略
-- 用户可以查看自己的配置
CREATE POLICY "用户可以查看自己的配置" ON user_profiles
  FOR SELECT
  USING (user_id = auth.uid());

-- 管理员可以查看所有用户配置
CREATE POLICY "管理员可以查看所有用户配置" ON user_profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid() 
      AND up.is_admin = true
    )
  );

-- 用户可以插入自己的配置
CREATE POLICY "用户可以插入自己的配置" ON user_profiles
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- 用户可以更新自己的配置
CREATE POLICY "用户可以更新自己的配置" ON user_profiles
  FOR UPDATE
  USING (user_id = auth.uid());

-- 用户答题记录策略
-- 用户只能查看自己的答题记录
CREATE POLICY "用户只能查看自己的答题记录" ON user_answers
  FOR SELECT
  USING (user_id = auth.uid());

-- 用户只能插入自己的答题记录
CREATE POLICY "用户只能插入自己的答题记录" ON user_answers
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- 用户学习进度策略
-- 用户只能查看自己的学习进度
CREATE POLICY "用户只能查看自己的学习进度" ON user_progress
  FOR SELECT
  USING (user_id = auth.uid());

-- 用户只能插入自己的学习进度
CREATE POLICY "用户只能插入自己的学习进度" ON user_progress
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- 用户只能更新自己的学习进度
CREATE POLICY "用户只能更新自己的学习进度" ON user_progress
  FOR UPDATE
  USING (user_id = auth.uid());

-- 错题本策略
-- 用户只能查看自己的错题
CREATE POLICY "用户只能查看自己的错题" ON wrong_questions
  FOR SELECT
  USING (user_id = auth.uid());

-- 用户只能插入自己的错题
CREATE POLICY "用户只能插入自己的错题" ON wrong_questions
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- 用户只能更新自己的错题
CREATE POLICY "用户只能更新自己的错题" ON wrong_questions
  FOR UPDATE
  USING (user_id = auth.uid());

-- 用户只能删除自己的错题
CREATE POLICY "用户只能删除自己的错题" ON wrong_questions
  FOR DELETE
  USING (user_id = auth.uid());

-- 题目表不需要RLS，所有用户都可以查看
-- questions表保持公开访问
