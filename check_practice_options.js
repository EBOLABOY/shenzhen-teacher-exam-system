#!/usr/bin/env node
/**
 * 检查练习页面题目选项格式
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkPracticeOptions() {
  console.log('🔍 检查练习页面题目选项格式...\n');
  
  try {
    // 获取前5道题目
    const { data, error } = await supabase
      .from('questions')
      .select('id, question, options, answer, type')
      .limit(5);
    
    if (error) {
      console.error('❌ 查询失败:', error);
      return;
    }
    
    if (!data || data.length === 0) {
      console.log('❌ 没有找到题目数据');
      return;
    }
    
    console.log(`📊 找到 ${data.length} 道题目\n`);
    
    data.forEach((question, index) => {
      console.log(`=== 题目 ${index + 1} (ID: ${question.id}) ===`);
      console.log('问题:', question.question.substring(0, 100) + '...');
      console.log('选项类型:', typeof question.options);
      console.log('选项原始数据:', question.options);
      
      // 尝试解析选项
      let parsedOptions = question.options;
      if (typeof question.options === 'string') {
        try {
          parsedOptions = JSON.parse(question.options);
          console.log('解析后的选项:', parsedOptions);
        } catch (e) {
          console.log('❌ 选项解析失败:', e.message);
        }
      }
      
      console.log('答案:', question.answer);
      console.log('题目类型:', question.type);
      console.log('---\n');
    });
    
  } catch (error) {
    console.error('❌ 执行失败:', error);
  }
}

checkPracticeOptions().then(() => {
  console.log('✅ 检查完成');
  process.exit(0);
}).catch(console.error);
