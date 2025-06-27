#!/usr/bin/env node
/**
 * 检查预测卷题目选项格式
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkOptionsFormat() {
  console.log('🔍 检查预测卷题目选项格式...\n');
  
  try {
    const { data, error } = await supabase
      .from('questions')
      .select('id, question, options, type')
      .eq('exam_year', 2025)
      .eq('exam_date', '7月5日')
      .limit(5);
    
    if (error) {
      console.error('❌ 查询失败:', error);
      return;
    }
    
    if (!data || data.length === 0) {
      console.log('❌ 没有找到预测卷题目');
      return;
    }
    
    console.log(`📊 找到 ${data.length} 道预测卷题目\n`);
    
    data.forEach((q, i) => {
      console.log(`题目 ${i+1}:`);
      console.log(`  ID: ${q.id}`);
      console.log(`  问题: ${q.question.substring(0, 60)}...`);
      console.log(`  题目类型: ${q.type}`);
      console.log(`  选项数据类型: ${typeof q.options}`);
      console.log(`  选项内容: ${JSON.stringify(q.options)}`);
      
      // 尝试解析选项
      if (typeof q.options === 'string') {
        try {
          const parsed = JSON.parse(q.options);
          console.log(`  解析后选项: ${JSON.stringify(parsed)}`);
          console.log(`  选项数量: ${Object.keys(parsed).length}`);
        } catch (e) {
          console.log(`  ❌ 选项解析失败: ${e.message}`);
        }
      } else if (typeof q.options === 'object' && q.options !== null) {
        console.log(`  选项数量: ${Object.keys(q.options).length}`);
      }
      
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ 检查过程中出现错误:', error);
  }
}

checkOptionsFormat()
  .then(() => {
    console.log('✅ 检查完成');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ 检查失败:', error);
    process.exit(1);
  });
