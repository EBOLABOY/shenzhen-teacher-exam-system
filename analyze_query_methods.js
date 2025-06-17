#!/usr/bin/env node
/**
 * 分析不同查询方法的性能和适用性
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function compareQueryMethods() {
  console.log('🔍 分析不同查询方法的性能...\n');
  
  try {
    // 方法1: Count查询 (推荐用于统计)
    console.log('1️⃣ Count查询方法:');
    const startTime1 = Date.now();
    const { count, error: countError } = await supabase
      .from('questions')
      .select('*', { count: 'exact', head: true });
    const time1 = Date.now() - startTime1;
    
    if (countError) {
      console.error('❌ Count查询失败:', countError.message);
    } else {
      console.log(`✅ 结果: ${count} 道题`);
      console.log(`⏱️  耗时: ${time1}ms`);
      console.log(`📊 数据传输: 最小 (只返回count)`);
      console.log(`💾 内存使用: 最小`);
    }
    
    // 方法2: 大limit查询 (不推荐)
    console.log('\n2️⃣ 大limit查询方法:');
    const startTime2 = Date.now();
    const { data: allData, error: allError } = await supabase
      .from('questions')
      .select('*')
      .limit(5000); // 设置一个大的limit
    const time2 = Date.now() - startTime2;
    
    if (allError) {
      console.error('❌ 大limit查询失败:', allError.message);
    } else {
      console.log(`✅ 结果: ${allData.length} 道题`);
      console.log(`⏱️  耗时: ${time2}ms`);
      console.log(`📊 数据传输: 大 (~${Math.round(JSON.stringify(allData).length / 1024)}KB)`);
      console.log(`💾 内存使用: 大`);
    }
    
    // 方法3: 分页查询 (推荐用于数据处理)
    console.log('\n3️⃣ 分页查询方法:');
    const startTime3 = Date.now();
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
      page++;
      
      if (pageData.length < pageSize) {
        break;
      }
    }
    const time3 = Date.now() - startTime3;
    
    console.log(`✅ 结果: ${totalCount} 道题`);
    console.log(`⏱️  耗时: ${time3}ms`);
    console.log(`📊 数据传输: 中等 (分批传输)`);
    console.log(`💾 内存使用: 中等 (可控制)`);
    console.log(`🔄 网络请求: ${page} 次`);
    
    // 性能对比总结
    console.log('\n📋 性能对比总结:');
    console.log('==================');
    console.log(`Count查询:   ${time1}ms (最快)`);
    console.log(`大limit查询: ${time2}ms`);
    console.log(`分页查询:    ${time3}ms`);
    
    console.log('\n💡 推荐使用场景:');
    console.log('================');
    console.log('📊 仅需要统计数量 → Count查询');
    console.log('🔍 需要少量数据预览 → 小limit查询');
    console.log('📄 需要处理所有数据 → 分页查询');
    console.log('❌ 避免使用大limit查询 (性能差，内存占用大)');
    
  } catch (error) {
    console.error('❌ 分析过程中出现异常:', error.message);
  }
}

// 运行分析
if (require.main === module) {
  compareQueryMethods().catch(console.error);
}
