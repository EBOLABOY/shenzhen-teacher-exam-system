#!/usr/bin/env node
/**
 * 检查user_progress表结构和数据
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkUserProgressTable() {
  console.log('🔍 检查user_progress表...\n');
  
  try {
    // 检查表是否存在
    const { data, error } = await supabase
      .from('user_progress')
      .select('*')
      .limit(1);
    
    if (error) {
      if (error.code === '42P01') {
        console.log('❌ user_progress表不存在');
        console.log('需要创建user_progress表');
        return;
      } else {
        console.error('❌ 查询失败:', error);
        return;
      }
    }
    
    console.log('✅ user_progress表存在');
    
    // 获取表中的数据
    const { data: allData, error: allError } = await supabase
      .from('user_progress')
      .select('*');
    
    if (allError) {
      console.error('❌ 获取数据失败:', allError);
      return;
    }
    
    console.log(`📊 表中共有 ${allData.length} 条记录\n`);
    
    if (allData.length > 0) {
      console.log('前几条记录:');
      allData.slice(0, 3).forEach((record, index) => {
        console.log(`${index + 1}. 用户ID: ${record.user_id}`);
        console.log(`   总题数: ${record.total_questions}`);
        console.log(`   正确数: ${record.correct_answers}`);
        console.log(`   总时间: ${record.total_time}`);
        console.log(`   最后练习: ${record.last_practice_at}`);
        console.log('---');
      });
    }
    
  } catch (error) {
    console.error('❌ 执行失败:', error);
  }
}

checkUserProgressTable().then(() => {
  console.log('✅ 检查完成');
  process.exit(0);
}).catch(console.error);
