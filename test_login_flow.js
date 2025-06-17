#!/usr/bin/env node
/**
 * 测试登录流程和题目获取
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testLoginFlow() {
  console.log('🔍 测试管理员登录流程...');
  
  try {
    // 1. 尝试登录管理员账户
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: '1242772513@qq.com',
      password: '1242772513'
    });
    
    if (authError) {
      console.error('❌ 登录失败:', authError.message);
      return false;
    }
    
    console.log('✅ 登录成功');
    console.log(`👤 用户ID: ${authData.user.id}`);
    console.log(`📧 邮箱: ${authData.user.email}`);
    
    // 2. 获取用户配置
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', authData.user.id)
      .single();
    
    if (profileError) {
      console.error('❌ 获取用户配置失败:', profileError.message);
    } else {
      console.log(`👑 管理员权限: ${profile.is_admin ? '是' : '否'}`);
      console.log(`📝 显示名称: ${profile.display_name}`);
    }
    
    // 3. 测试获取题目（模拟练习页面的逻辑）
    console.log('\n🔍 测试题目获取...');
    
    // 简单获取题目
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('*')
      .limit(5);
    
    if (questionsError) {
      console.error('❌ 获取题目失败:', questionsError.message);
      return false;
    }
    
    console.log(`✅ 成功获取 ${questions.length} 道题目`);
    
    if (questions.length > 0) {
      const question = questions[0];
      console.log(`📋 示例题目: ${question.question.substring(0, 50)}...`);
      console.log(`🏷️  科目: ${question.subject}`);
      console.log(`⭐ 难度: ${question.difficulty}`);
      console.log(`🔤 选项数量: ${Object.keys(question.options).length}`);
    }
    
    // 4. 测试用户答题记录查询
    const { data: userAnswers, error: answersError } = await supabase
      .from('user_answers')
      .select('*')
      .eq('user_id', authData.user.id)
      .limit(5);
    
    if (answersError) {
      console.error('⚠️  获取答题记录失败:', answersError.message);
    } else {
      console.log(`📊 用户答题记录: ${userAnswers.length} 条`);
    }
    
    // 5. 测试错题本查询
    const { data: wrongQuestions, error: wrongError } = await supabase
      .from('wrong_questions')
      .select('*')
      .eq('user_id', authData.user.id)
      .limit(5);
    
    if (wrongError) {
      console.error('⚠️  获取错题本失败:', wrongError.message);
    } else {
      console.log(`❌ 错题本记录: ${wrongQuestions.length} 条`);
    }
    
    // 6. 登出
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      console.error('⚠️  登出失败:', signOutError.message);
    } else {
      console.log('✅ 成功登出');
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ 测试过程中出现异常:', error.message);
    return false;
  }
}

async function testQuestionAPI() {
  console.log('\n🔍 测试题目API接口...');
  
  try {
    const response = await fetch('http://localhost:3000/api/questions?limit=3&random=true');
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error('API返回失败状态');
    }
    
    console.log('✅ API接口正常');
    console.log(`📝 返回题目数: ${data.data.length}`);
    
    if (data.data.length > 0) {
      const question = data.data[0];
      console.log(`📋 API题目示例: ${question.question.substring(0, 50)}...`);
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ API测试失败:', error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 开始完整登录流程测试...\n');
  
  const tests = [
    { name: '登录流程', fn: testLoginFlow },
    { name: '题目API', fn: testQuestionAPI }
  ];
  
  let passedTests = 0;
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        passedTests++;
        console.log(`✅ ${test.name}测试通过\n`);
      } else {
        console.log(`❌ ${test.name}测试失败\n`);
      }
    } catch (error) {
      console.error(`❌ ${test.name}测试异常:`, error.message);
      console.log('');
    }
  }
  
  console.log('📊 测试结果汇总:');
  console.log(`✅ 通过: ${passedTests}/${tests.length}`);
  console.log(`❌ 失败: ${tests.length - passedTests}/${tests.length}`);
  
  if (passedTests === tests.length) {
    console.log('\n🎉 所有测试通过！登录和题目获取功能正常。');
    console.log('\n💡 建议操作:');
    console.log('1. 在浏览器中访问 http://localhost:3000');
    console.log('2. 使用管理员账户登录: 1242772513@qq.com / 1242772513');
    console.log('3. 进入练习页面测试刷题功能');
  } else {
    console.log('\n⚠️  部分测试失败，请检查相关功能。');
  }
}

// 运行测试
if (require.main === module) {
  runAllTests().catch(console.error);
}
