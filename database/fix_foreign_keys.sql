-- 修复外键关系和约束名称

-- 首先删除可能存在的旧约束
ALTER TABLE invite_codes DROP CONSTRAINT IF EXISTS invite_codes_created_by_fkey;
ALTER TABLE invite_codes DROP CONSTRAINT IF EXISTS invite_codes_used_by_fkey;

-- 重新创建正确的外键约束
ALTER TABLE invite_codes 
ADD CONSTRAINT invite_codes_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE invite_codes 
ADD CONSTRAINT invite_codes_used_by_fkey 
FOREIGN KEY (used_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- 确保user_profiles表的外键也正确
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_user_id_fkey;
ALTER TABLE user_profiles 
ADD CONSTRAINT user_profiles_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 创建一个视图来简化邀请码查询
CREATE OR REPLACE VIEW invite_codes_with_profiles AS
SELECT 
  ic.*,
  cp.display_name as created_by_name,
  up.display_name as used_by_name
FROM invite_codes ic
LEFT JOIN user_profiles cp ON ic.created_by = cp.user_id
LEFT JOIN user_profiles up ON ic.used_by = up.user_id;

-- 授予必要的权限
GRANT SELECT ON invite_codes_with_profiles TO authenticated;
GRANT SELECT ON invite_codes_with_profiles TO anon;
