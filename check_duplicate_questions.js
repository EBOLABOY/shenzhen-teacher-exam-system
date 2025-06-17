#!/usr/bin/env node
/**
 * 检查题目重复问题
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkDuplicateQuestions() {
  console.log('🔍 检查题目重复问题...\n');
  
  try {
    // 1. 获取所有题目的关键信息
    console.log('1️⃣ 获取所有题目数据...');
    let allQuestions = [];
    let page = 0;
    const pageSize = 1000;
    
    while (true) {
      const { data: pageData, error: pageError } = await supabase
        .from('questions')
        .select('id, question, answer, exam_year, exam_date, created_at')
        .range(page * pageSize, (page + 1) * pageSize - 1);
      
      if (pageError) {
        console.error(`❌ 获取数据失败 (页面${page}):`, pageError.message);
        break;
      }
      
      if (!pageData || pageData.length === 0) {
        break;
      }
      
      allQuestions = allQuestions.concat(pageData);
      console.log(`   页面 ${page + 1}: ${pageData.length} 道题`);
      page++;
      
      if (pageData.length < pageSize) {
        break;
      }
    }
    
    console.log(`✅ 总共获取 ${allQuestions.length} 道题\n`);
    
    // 2. 检查完全相同的题目 (question + answer)
    console.log('2️⃣ 检查完全相同的题目...');
    const questionAnswerMap = new Map();
    const exactDuplicates = [];
    
    allQuestions.forEach(q => {
      const key = `${q.question.trim()}|${q.answer.trim()}`;
      if (questionAnswerMap.has(key)) {
        const existing = questionAnswerMap.get(key);
        exactDuplicates.push({
          original: existing,
          duplicate: q,
          type: 'exact'
        });
      } else {
        questionAnswerMap.set(key, q);
      }
    });
    
    console.log(`📊 发现完全相同的题目: ${exactDuplicates.length} 组`);
    
    // 3. 检查题目内容相同但答案不同的情况
    console.log('\n3️⃣ 检查题目内容相同但答案不同...');
    const questionMap = new Map();
    const contentDuplicates = [];
    
    allQuestions.forEach(q => {
      const key = q.question.trim();
      if (questionMap.has(key)) {
        const existing = questionMap.get(key);
        if (existing.answer !== q.answer) {
          contentDuplicates.push({
            original: existing,
            duplicate: q,
            type: 'content_same_answer_diff'
          });
        }
      } else {
        questionMap.set(key, q);
      }
    });
    
    console.log(`📊 发现题目相同但答案不同: ${contentDuplicates.length} 组`);
    
    // 4. 按年份统计题目分布
    console.log('\n4️⃣ 按年份统计题目分布...');
    const yearStats = {};
    allQuestions.forEach(q => {
      const year = q.exam_year || 'unknown';
      yearStats[year] = (yearStats[year] || 0) + 1;
    });
    
    console.log('📅 年份分布:');
    Object.entries(yearStats)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([year, count]) => {
        console.log(`   ${year}: ${count} 道题`);
      });
    
    // 5. 按创建时间统计 (检查导入批次)
    console.log('\n5️⃣ 按创建时间统计 (检查导入批次)...');
    const dateStats = {};
    allQuestions.forEach(q => {
      const date = new Date(q.created_at).toDateString();
      dateStats[date] = (dateStats[date] || 0) + 1;
    });
    
    console.log('📅 创建日期分布:');
    Object.entries(dateStats).forEach(([date, count]) => {
      console.log(`   ${date}: ${count} 道题`);
    });
    
    // 6. 显示重复题目详情
    if (exactDuplicates.length > 0) {
      console.log('\n⚠️  完全重复的题目详情:');
      exactDuplicates.slice(0, 5).forEach((dup, index) => {
        console.log(`\n${index + 1}. 重复题目:`);
        console.log(`   原题ID: ${dup.original.id} (${dup.original.exam_year}年)`);
        console.log(`   重复ID: ${dup.duplicate.id} (${dup.duplicate.exam_year}年)`);
        console.log(`   题目: ${dup.original.question.substring(0, 50)}...`);
      });
      
      if (exactDuplicates.length > 5) {
        console.log(`   ... 还有 ${exactDuplicates.length - 5} 组重复题目`);
      }
    }
    
    if (contentDuplicates.length > 0) {
      console.log('\n⚠️  题目相同但答案不同的详情:');
      contentDuplicates.slice(0, 3).forEach((dup, index) => {
        console.log(`\n${index + 1}. 答案冲突:`);
        console.log(`   题目ID: ${dup.original.id} vs ${dup.duplicate.id}`);
        console.log(`   答案: ${dup.original.answer} vs ${dup.duplicate.answer}`);
        console.log(`   题目: ${dup.original.question.substring(0, 50)}...`);
      });
    }
    
    // 7. 总结和建议
    console.log('\n📋 检查结果总结:');
    console.log('==================');
    console.log(`总题目数: ${allQuestions.length}`);
    console.log(`完全重复: ${exactDuplicates.length} 组`);
    console.log(`答案冲突: ${contentDuplicates.length} 组`);
    console.log(`唯一题目: ${allQuestions.length - exactDuplicates.length} 道`);
    
    if (exactDuplicates.length > 0 || contentDuplicates.length > 0) {
      console.log('\n💡 建议处理方案:');
      if (exactDuplicates.length > 0) {
        console.log('1. 删除完全重复的题目，保留最早的版本');
      }
      if (contentDuplicates.length > 0) {
        console.log('2. 人工审核答案冲突的题目，确定正确答案');
      }
      console.log('3. 在导入脚本中添加去重逻辑');
    } else {
      console.log('\n✅ 没有发现重复题目，数据质量良好！');
    }
    
  } catch (error) {
    console.error('❌ 检查过程中出现异常:', error.message);
  }
}

// 运行检查
if (require.main === module) {
  checkDuplicateQuestions().catch(console.error);
}
