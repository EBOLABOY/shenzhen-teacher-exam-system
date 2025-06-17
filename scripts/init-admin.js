#!/usr/bin/env node
/**
 * 管理员账户初始化脚本
 * 创建管理员账户并设置初始邀请码
 */

const { createClient } = require('@supabase/supabase-js');

// Supabase配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('请设置环境变量 NEXT_PUBLIC_SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * 生成随机邀请码
 */
function generateInviteCode(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * 创建管理员账户
 */
async function createAdminAccount() {
  const adminEmail = '1242772513@qq.com';
  const adminPassword = '1242772513';
  
  console.log('正在创建管理员账户...');
  
  try {
    // 创建用户账户
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true
    });
    
    if (authError) {
      if (authError.message.includes('already registered')) {
        console.log('管理员账户已存在，正在更新配置...');
        
        // 获取现有用户
        const { data: users, error: getUserError } = await supabase.auth.admin.listUsers();
        if (getUserError) {
          throw getUserError;
        }
        
        const existingUser = users.users.find(user => user.email === adminEmail);
        if (!existingUser) {
          throw new Error('无法找到现有管理员账户');
        }
        
        // 更新用户配置
        await updateUserProfile(existingUser.id, true);
        return existingUser.id;
      } else {
        throw authError;
      }
    }
    
    console.log('✓ 管理员账户创建成功');
    
    // 创建用户配置
    await updateUserProfile(authData.user.id, true);
    
    return authData.user.id;
  } catch (error) {
    console.error('创建管理员账户失败:', error);
    throw error;
  }
}

/**
 * 更新用户配置
 */
async function updateUserProfile(userId, isAdmin = false) {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: userId,
        display_name: '系统管理员',
        is_admin: isAdmin
      });
    
    if (error) {
      throw error;
    }
    
    console.log('✓ 用户配置更新成功');
  } catch (error) {
    console.error('更新用户配置失败:', error);
    throw error;
  }
}

/**
 * 创建初始邀请码
 */
async function createInitialInviteCodes(adminUserId, count = 10) {
  console.log(`正在创建 ${count} 个初始邀请码...`);
  
  const inviteCodes = [];
  for (let i = 0; i < count; i++) {
    inviteCodes.push({
      code: generateInviteCode(),
      created_by: adminUserId,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30天后过期
    });
  }
  
  try {
    const { data, error } = await supabase
      .from('invite_codes')
      .insert(inviteCodes);
    
    if (error) {
      throw error;
    }
    
    console.log('✓ 初始邀请码创建成功');
    console.log('邀请码列表:');
    inviteCodes.forEach((code, index) => {
      console.log(`  ${index + 1}. ${code.code}`);
    });
    
    return inviteCodes;
  } catch (error) {
    console.error('创建邀请码失败:', error);
    throw error;
  }
}

/**
 * 初始化用户进度表
 */
async function initializeUserProgress(userId) {
  try {
    const { data, error } = await supabase
      .from('user_progress')
      .upsert({
        user_id: userId,
        total_questions: 0,
        correct_answers: 0,
        total_time: 0,
        streak_days: 0,
        best_streak: 0
      });
    
    if (error) {
      throw error;
    }
    
    console.log('✓ 用户进度初始化成功');
  } catch (error) {
    console.error('初始化用户进度失败:', error);
    throw error;
  }
}

/**
 * 主初始化函数
 */
async function initializeSystem() {
  try {
    console.log('=== 系统初始化开始 ===\n');
    
    // 1. 创建管理员账户
    const adminUserId = await createAdminAccount();
    
    // 2. 初始化管理员进度
    await initializeUserProgress(adminUserId);
    
    // 3. 创建初始邀请码
    const inviteCodes = await createInitialInviteCodes(adminUserId);
    
    console.log('\n=== 系统初始化完成 ===');
    console.log('管理员账户信息:');
    console.log('  邮箱: 1242772513@qq.com');
    console.log('  密码: 1242772513');
    console.log('\n请妥善保管邀请码，用户注册时需要使用。');
    
  } catch (error) {
    console.error('\n系统初始化失败:', error);
    process.exit(1);
  }
}

// 主程序
if (require.main === module) {
  initializeSystem();
}

module.exports = {
  createAdminAccount,
  createInitialInviteCodes,
  generateInviteCode
};
