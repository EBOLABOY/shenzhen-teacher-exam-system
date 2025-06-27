#!/usr/bin/env node
/**
 * 调试选项显示问题
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugOptionsDisplay() {
  console.log('🔍 调试选项显示问题...\n');
  
  try {
    // 获取前3道题目
    const { data, error } = await supabase
      .from('questions')
      .select('id, question, options, answer, type')
      .limit(3);
    
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
      console.log('问题:', question.question.substring(0, 80) + '...');
      console.log('选项类型:', typeof question.options);
      
      if (typeof question.options === 'string') {
        console.log('选项原始字符串:', question.options);
        try {
          const parsed = JSON.parse(question.options);
          console.log('解析后的选项:', parsed);
          console.log('选项条目:');
          Object.entries(parsed).forEach(([key, value]) => {
            console.log(`  ${key}: ${value}`);
          });
        } catch (e) {
          console.log('❌ 选项解析失败:', e.message);
        }
      } else if (typeof question.options === 'object') {
        console.log('选项对象:', question.options);
        console.log('选项条目:');
        Object.entries(question.options).forEach(([key, value]) => {
          console.log(`  ${key}: ${value}`);
        });
      } else {
        console.log('❌ 未知的选项格式:', question.options);
      }
      
      console.log('答案:', question.answer);
      console.log('题目类型:', question.type);
      console.log('---\n');
    });
    
  } catch (error) {
    console.error('❌ 执行失败:', error);
  }
}

debugOptionsDisplay().then(() => {
  console.log('✅ 调试完成');
  process.exit(0);
}).catch(console.error);
