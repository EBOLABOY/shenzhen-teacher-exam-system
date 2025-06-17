#!/usr/bin/env node
/**
 * 调试题目数量问题
 * 分析为什么题目数量从1563变成了1000
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

async function debugQuestionCount() {
  console.log('🔍 开始调试题目数量问题...\n');
  
  try {
    // 1. 检查数据库连接
    console.log('1️⃣ 检查数据库连接...');
    const { data: testData, error: testError } = await supabase
      .from('questions')
      .select('id')
      .limit(1);
    
    if (testError) {
      console.error('❌ 数据库连接失败:', testError.message);
      return;
    }
    console.log('✅ 数据库连接正常\n');
    
    // 2. 使用不同方法统计题目数量
    console.log('2️⃣ 使用多种方法统计题目数量...');
    
    // 方法A: count查询
    const { count, error: countError } = await supabase
      .from('questions')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('❌ Count查询失败:', countError.message);
    } else {
      console.log(`📊 方法A (count查询): ${count} 道题`);
    }
    
    // 方法B: 获取所有ID并计数
    const { data: allIds, error: idsError } = await supabase
      .from('questions')
      .select('id');
    
    if (idsError) {
      console.error('❌ ID查询失败:', idsError.message);
    } else {
      console.log(`📊 方法B (ID计数): ${allIds.length} 道题`);
    }
    
    // 方法C: 分页查询总数
    let totalCount = 0;
    let page = 0;
    const pageSize = 1000;
    
    while (true) {
      const { data: pageData, error: pageError } = await supabase
        .from('questions')
        .select('id')
        .range(page * pageSize, (page + 1) * pageSize - 1);
      
      if (pageError) {
        console.error(`❌ 分页查询失败 (页面${page}):`, pageError.message);
        break;
      }
      
      if (!pageData || pageData.length === 0) {
        break;
      }
      
      totalCount += pageData.length;
      console.log(`   页面 ${page + 1}: ${pageData.length} 道题`);
      page++;
      
      if (pageData.length < pageSize) {
        break; // 最后一页
      }
    }
    
    console.log(`📊 方法C (分页统计): ${totalCount} 道题\n`);
    
    // 3. 检查ID范围和分布
    console.log('3️⃣ 检查ID范围和分布...');
    
    const { data: minMaxData, error: minMaxError } = await supabase
      .from('questions')
      .select('id')
      .order('id', { ascending: true })
      .limit(1);
    
    const { data: maxData, error: maxError } = await supabase
      .from('questions')
      .select('id')
      .order('id', { ascending: false })
      .limit(1);
    
    if (minMaxError || maxError) {
      console.error('❌ ID范围查询失败');
    } else {
      const minId = minMaxData[0]?.id;
      const maxId = maxData[0]?.id;
      console.log(`📈 ID范围: ${minId} - ${maxId}`);
      console.log(`📏 ID跨度: ${maxId - minId + 1}`);
    }
    
    // 4. 检查是否有重复ID
    console.log('\n4️⃣ 检查是否有重复ID...');
    const { data: duplicateCheck, error: dupError } = await supabase
      .rpc('check_duplicate_ids', {});
    
    if (dupError) {
      console.log('⚠️  无法检查重复ID (可能没有相关函数)');
    }
    
    // 5. 按创建时间统计
    console.log('\n5️⃣ 按创建时间统计...');
    const { data: timeData, error: timeError } = await supabase
      .from('questions')
      .select('created_at')
      .order('created_at', { ascending: true });
    
    if (timeError) {
      console.error('❌ 时间查询失败:', timeError.message);
    } else {
      const timeStats = {};
      timeData.forEach(q => {
        const date = new Date(q.created_at).toDateString();
        timeStats[date] = (timeStats[date] || 0) + 1;
      });
      
      console.log('📅 按创建日期统计:');
      Object.entries(timeStats).forEach(([date, count]) => {
        console.log(`   ${date}: ${count} 道题`);
      });
    }
    
    // 6. 检查前端显示逻辑
    console.log('\n6️⃣ 检查前端显示逻辑...');
    console.log('检查管理员页面的统计逻辑...');
    
    // 模拟管理员页面的查询
    const { data: adminData, error: adminError } = await supabase
      .from('questions')
      .select('*');
    
    if (adminError) {
      console.error('❌ 管理员查询失败:', adminError.message);
    } else {
      console.log(`📊 管理员页面查询结果: ${adminData.length} 道题`);
      
      // 检查是否有查询限制
      if (adminData.length === 1000) {
        console.log('⚠️  可能存在1000条记录的查询限制！');
      }
    }
    
    // 7. 总结分析
    console.log('\n📋 问题分析总结:');
    console.log('==================');
    
    if (count !== allIds?.length || count !== totalCount) {
      console.log('❌ 发现数据不一致！');
      console.log(`   Count查询: ${count}`);
      console.log(`   ID计数: ${allIds?.length}`);
      console.log(`   分页统计: ${totalCount}`);
    } else {
      console.log('✅ 数据库中的实际题目数量一致');
      console.log(`   实际题目数: ${count}`);
    }
    
    if (adminData?.length === 1000 && count > 1000) {
      console.log('🎯 问题根源: Supabase查询默认限制为1000条记录');
      console.log('💡 解决方案: 需要在查询中明确指定更大的limit或使用分页');
    }
    
  } catch (error) {
    console.error('❌ 调试过程中出现异常:', error.message);
  }
}

// 运行调试
if (require.main === module) {
  debugQuestionCount().catch(console.error);
}
