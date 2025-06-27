#!/usr/bin/env node
/**
 * 检查wrong_questions表结构
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkWrongQuestionsTable() {
  console.log('🔍 检查wrong_questions表结构...\n');
  
  try {
    // 尝试查询表结构
    const { data, error } = await supabase
      .from('wrong_questions')
      .select('*')
      .limit(1);
    
    if (error) {
      if (error.code === '42P01') {
        console.log('❌ wrong_questions表不存在');
        return;
      } else {
        console.error('❌ 查询失败:', error);
        return;
      }
    }
    
    console.log('✅ wrong_questions表存在');
    
    // 获取表中的数据
    const { data: allData, error: allError } = await supabase
      .from('wrong_questions')
      .select('*')
      .limit(3);
    
    if (allError) {
      console.error('❌ 获取数据失败:', allError);
      return;
    }
    
    console.log(`📊 表中共有数据，前3条记录:\n`);
    
    if (allData && allData.length > 0) {
      console.log('表结构字段:');
      const firstRecord = allData[0];
      Object.keys(firstRecord).forEach(key => {
        console.log(`  - ${key}: ${typeof firstRecord[key]} (${firstRecord[key]})`);
      });
      
      console.log('\n前几条记录:');
      allData.forEach((record, index) => {
        console.log(`${index + 1}. 用户ID: ${record.user_id}`);
        console.log(`   题目ID: ${record.question_id}`);
        console.log(`   是否掌握: ${record.is_mastered}`);
        console.log(`   最后错误时间: ${record.last_wrong_at}`);
        console.log('---');
      });
    } else {
      console.log('表中暂无数据');
    }
    
  } catch (error) {
    console.error('❌ 执行失败:', error);
  }
}

checkWrongQuestionsTable().then(() => {
  console.log('✅ 检查完成');
  process.exit(0);
}).catch(console.error);
