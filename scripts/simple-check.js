#!/usr/bin/env node
/**
 * 简单检查数据库状态
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function quickCheck() {
  console.log('🔍 快速检查数据库状态...\n');

  try {
    // 1. 检查题目总数
    const { count, error } = await supabase
      .from('questions')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('❌ 查询失败:', error.message);
      return;
    }

    console.log(`📊 当前题目总数: ${count} 道`);

    // 2. 检查预测卷题目
    const { data: predictions, error: predError } = await supabase
      .from('questions')
      .select('id, exam_year, exam_date')
      .eq('exam_year', 2025)
      .eq('exam_date', '7月5日');

    if (!predError && predictions) {
      console.log(`🔮 预测卷题目: ${predictions.length} 道`);
    }

    // 3. 按年份统计
    const { data: yearStats, error: yearError } = await supabase
      .from('questions')
      .select('exam_year')
      .not('exam_year', 'is', null);

    if (!yearError && yearStats) {
      const stats = {};
      yearStats.forEach(q => {
        const year = q.exam_year;
        stats[year] = (stats[year] || 0) + 1;
      });

      console.log('\n📅 按年份统计:');
      Object.entries(stats)
        .sort(([a], [b]) => a.localeCompare(b))
        .forEach(([year, count]) => {
          console.log(`   ${year}年: ${count} 道题`);
        });
    }

    console.log('\n✅ 检查完成！');

  } catch (error) {
    console.error('❌ 检查失败:', error.message);
  }
}

if (require.main === module) {
  quickCheck();
}
