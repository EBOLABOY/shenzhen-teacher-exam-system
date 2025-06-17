// 加载环境变量
require('dotenv').config({ path: '.env.local' });

console.log('环境变量检查:');
console.log('SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '已设置' : '未设置');
console.log('SUPABASE_SERVICE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '已设置' : '未设置');

console.log('开始运行初始化脚本...');

// 直接运行初始化函数
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('环境变量未正确设置');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 生成随机邀请码
function generateInviteCode(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// 主初始化函数
async function initializeSystem() {
  try {
    console.log('=== 系统初始化开始 ===\n');

    const adminEmail = '1242772513@qq.com';
    const adminPassword = '1242772513';

    console.log('正在创建管理员账户...');

    // 创建用户账户
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true
    });

    let adminUserId;

    if (authError) {
      if (authError.message.includes('already registered')) {
        console.log('管理员账户已存在，正在获取用户信息...');

        // 获取现有用户
        const { data: users, error: getUserError } = await supabase.auth.admin.listUsers();
        if (getUserError) {
          throw getUserError;
        }

        const existingUser = users.users.find(user => user.email === adminEmail);
        if (!existingUser) {
          throw new Error('无法找到现有管理员账户');
        }

        adminUserId = existingUser.id;
      } else {
        throw authError;
      }
    } else {
      console.log('✓ 管理员账户创建成功');
      adminUserId = authData.user.id;
    }

    // 创建用户配置
    console.log('正在设置用户配置...');
    const { error: profileError } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: adminUserId,
        display_name: '系统管理员',
        is_admin: true
      });

    if (profileError) {
      console.error('用户配置设置失败:', profileError);
    } else {
      console.log('✓ 用户配置设置成功');
    }

    // 初始化用户进度
    console.log('正在初始化用户进度...');
    const { error: progressError } = await supabase
      .from('user_progress')
      .upsert({
        user_id: adminUserId,
        total_questions: 0,
        correct_answers: 0,
        total_time: 0,
        streak_days: 0,
        best_streak: 0
      });

    if (progressError) {
      console.error('用户进度初始化失败:', progressError);
    } else {
      console.log('✓ 用户进度初始化成功');
    }

    // 创建初始邀请码
    console.log('正在创建初始邀请码...');
    const inviteCodes = [];
    for (let i = 0; i < 10; i++) {
      inviteCodes.push({
        code: generateInviteCode(),
        created_by: adminUserId,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      });
    }

    const { error: inviteError } = await supabase
      .from('invite_codes')
      .insert(inviteCodes);

    if (inviteError) {
      console.error('邀请码创建失败:', inviteError);
    } else {
      console.log('✓ 初始邀请码创建成功');
      console.log('邀请码列表:');
      inviteCodes.forEach((code, index) => {
        console.log(`  ${index + 1}. ${code.code}`);
      });
    }

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

// 运行初始化
initializeSystem();
