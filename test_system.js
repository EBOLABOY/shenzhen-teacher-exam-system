#!/usr/bin/env node
/**
 * 系统功能测试脚本
 * 测试主要API接口和数据库连接
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 环境变量配置错误');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDatabase() {
  console.log('🔍 测试数据库连接...');
  
  try {
    // 测试题目表
    const { data: questions, error: qError } = await supabase
      .from('questions')
      .select('count')
      .limit(1);
    
    if (qError) throw qError;
    
    const { count, error: countError } = await supabase
      .from('questions')
      .select('*', { count: 'exact', head: true });

    if (countError) throw countError;

    console.log('✅ 数据库连接成功');
    console.log(`📊 题目总数: ${count || 0}`);
    
    // 测试用户配置表
    const { data: profiles, error: pError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(5);
    
    if (pError) throw pError;
    console.log(`👥 用户配置数: ${profiles.length}`);
    
    // 测试邀请码表
    const { data: invites, error: iError } = await supabase
      .from('invite_codes')
      .select('*')
      .limit(5);
    
    if (iError) throw iError;
    console.log(`🎫 邀请码数: ${invites.length}`);
    
    return true;
  } catch (error) {
    console.error('❌ 数据库测试失败:', error.message);
    return false;
  }
}

async function testAPI() {
  console.log('\n🔍 测试API接口...');
  
  try {
    // 测试题目API
    const response = await fetch('http://localhost:3000/api/questions?limit=3');
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    if (!data.success) {
      throw new Error('API返回失败状态');
    }
    
    console.log('✅ 题目API正常');
    console.log(`📝 返回题目数: ${data.data.length}`);
    
    if (data.data.length > 0) {
      const question = data.data[0];
      console.log(`📋 示例题目: ${question.question.substring(0, 50)}...`);
      console.log(`🏷️  科目: ${question.subject}, 难度: ${question.difficulty}`);
    }
    
    return true;
  } catch (error) {
    console.error('❌ API测试失败:', error.message);
    return false;
  }
}

async function testQuestionDistribution() {
  console.log('\n🔍 测试题目分布...');
  
  try {
    // 按科目统计
    const { data: subjects } = await supabase
      .from('questions')
      .select('subject')
      .limit(1000);
    
    const subjectStats = {};
    subjects.forEach(q => {
      subjectStats[q.subject] = (subjectStats[q.subject] || 0) + 1;
    });
    
    console.log('📊 科目分布:');
    Object.entries(subjectStats).forEach(([subject, count]) => {
      console.log(`   ${subject}: ${count}题`);
    });
    
    // 按难度统计
    const { data: difficulties } = await supabase
      .from('questions')
      .select('difficulty')
      .limit(1000);
    
    const difficultyStats = {};
    difficulties.forEach(q => {
      difficultyStats[q.difficulty] = (difficultyStats[q.difficulty] || 0) + 1;
    });
    
    console.log('📊 难度分布:');
    Object.entries(difficultyStats).forEach(([difficulty, count]) => {
      const label = difficulty === 'easy' ? '简单' : 
                   difficulty === 'medium' ? '中等' : '困难';
      console.log(`   ${label}: ${count}题`);
    });
    
    return true;
  } catch (error) {
    console.error('❌ 题目分布测试失败:', error.message);
    return false;
  }
}

async function testSystemHealth() {
  console.log('\n🔍 测试系统健康状况...');
  
  try {
    // 检查是否有管理员用户
    const { data: admins } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('is_admin', true);
    
    console.log(`👑 管理员数量: ${admins.length}`);
    
    // 检查可用邀请码
    const { data: availableCodes } = await supabase
      .from('invite_codes')
      .select('*')
      .eq('is_used', false)
      .gt('expires_at', new Date().toISOString());
    
    console.log(`🎫 可用邀请码: ${availableCodes.length}`);
    
    // 检查最近的答题记录
    const { data: recentAnswers } = await supabase
      .from('user_answers')
      .select('*')
      .order('answered_at', { ascending: false })
      .limit(5);
    
    console.log(`📝 最近答题记录: ${recentAnswers.length}`);
    
    return true;
  } catch (error) {
    console.error('❌ 系统健康检查失败:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 开始系统测试...\n');
  
  const tests = [
    { name: '数据库连接', fn: testDatabase },
    { name: 'API接口', fn: testAPI },
    { name: '题目分布', fn: testQuestionDistribution },
    { name: '系统健康', fn: testSystemHealth }
  ];
  
  let passedTests = 0;
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        passedTests++;
      }
    } catch (error) {
      console.error(`❌ ${test.name}测试异常:`, error.message);
    }
  }
  
  console.log('\n📊 测试结果汇总:');
  console.log(`✅ 通过: ${passedTests}/${tests.length}`);
  console.log(`❌ 失败: ${tests.length - passedTests}/${tests.length}`);
  
  if (passedTests === tests.length) {
    console.log('\n🎉 所有测试通过！系统运行正常。');
  } else {
    console.log('\n⚠️  部分测试失败，请检查相关功能。');
  }
}

// 运行测试
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testDatabase, testAPI, testQuestionDistribution, testSystemHealth };
