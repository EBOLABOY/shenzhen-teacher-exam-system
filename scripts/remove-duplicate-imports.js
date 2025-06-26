#!/usr/bin/env node
/**
 * 删除重复导入的题目，保留原有题目
 * 基于创建时间和题目内容来识别重复导入
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 需要服务角色密钥来执行删除操作');
  console.error('请在 .env.local 中设置 SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function removeDuplicateImports() {
  console.log('🔧 开始删除重复导入的题目...\n');
  
  try {
    // 1. 获取所有题目，按创建时间排序
    console.log('1️⃣ 获取所有题目数据...');
    let allQuestions = [];
    let page = 0;
    const pageSize = 1000;
    
    while (true) {
      const { data: pageData, error: pageError } = await supabase
        .from('questions')
        .select('id, question, answer, exam_year, exam_date, created_at, question_type')
        .range(page * pageSize, (page + 1) * pageSize - 1)
        .order('created_at', { ascending: true });
      
      if (pageError) {
        console.error(`❌ 获取数据失败:`, pageError.message);
        return;
      }
      
      if (!pageData || pageData.length === 0) {
        break;
      }
      
      allQuestions = allQuestions.concat(pageData);
      console.log(`   获取第 ${page + 1} 页: ${pageData.length} 道题`);
      page++;
      
      if (pageData.length < pageSize) {
        break;
      }
    }
    
    console.log(`✅ 总共获取 ${allQuestions.length} 道题\n`);
    
    // 2. 按创建时间分析导入批次
    console.log('2️⃣ 分析导入批次...');
    const dateStats = {};
    allQuestions.forEach(q => {
      const date = new Date(q.created_at).toDateString();
      if (!dateStats[date]) {
        dateStats[date] = [];
      }
      dateStats[date].push(q);
    });
    
    console.log('📅 按日期分组的题目数量:');
    const sortedDates = Object.keys(dateStats).sort((a, b) => new Date(a) - new Date(b));
    sortedDates.forEach(date => {
      console.log(`   ${date}: ${dateStats[date].length} 道题`);
    });
    
    // 3. 识别重复题目
    console.log('\n3️⃣ 识别重复题目...');
    const questionMap = new Map(); // key: question+answer, value: earliest question
    const duplicatesToDelete = [];
    
    allQuestions.forEach(q => {
      const key = `${q.question.trim()}|${q.answer.trim()}`;
      
      if (questionMap.has(key)) {
        // 发现重复，保留最早的，删除后来的
        const existing = questionMap.get(key);
        const existingTime = new Date(existing.created_at);
        const currentTime = new Date(q.created_at);
        
        if (currentTime > existingTime) {
          // 当前题目更新，标记删除
          duplicatesToDelete.push({
            id: q.id,
            question: q.question.substring(0, 50) + '...',
            created_at: q.created_at,
            exam_year: q.exam_year,
            reason: 'duplicate_newer'
          });
        } else {
          // 当前题目更早，替换map中的记录，删除之前的
          duplicatesToDelete.push({
            id: existing.id,
            question: existing.question.substring(0, 50) + '...',
            created_at: existing.created_at,
            exam_year: existing.exam_year,
            reason: 'duplicate_older'
          });
          questionMap.set(key, q);
        }
      } else {
        questionMap.set(key, q);
      }
    });
    
    console.log(`📊 发现重复题目: ${duplicatesToDelete.length} 道`);
    console.log(`✅ 保留唯一题目: ${allQuestions.length - duplicatesToDelete.length} 道`);
    
    // 4. 按删除原因分组显示
    const deleteByReason = {};
    duplicatesToDelete.forEach(item => {
      if (!deleteByReason[item.reason]) {
        deleteByReason[item.reason] = [];
      }
      deleteByReason[item.reason].push(item);
    });
    
    console.log('\n📋 删除原因统计:');
    Object.entries(deleteByReason).forEach(([reason, items]) => {
      console.log(`   ${reason}: ${items.length} 道题`);
    });
    
    // 5. 显示最近导入的重复题目示例
    console.log('\n🔍 最近导入的重复题目示例:');
    const recentDuplicates = duplicatesToDelete
      .filter(item => item.reason === 'duplicate_newer')
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 5);
    
    recentDuplicates.forEach((item, index) => {
      console.log(`${index + 1}. ID: ${item.id} (${item.exam_year}年)`);
      console.log(`   创建时间: ${item.created_at}`);
      console.log(`   题目: ${item.question}`);
    });
    
    // 6. 确认删除
    if (duplicatesToDelete.length === 0) {
      console.log('\n✅ 没有发现重复题目，无需删除！');
      return;
    }
    
    console.log(`\n⚠️  准备删除 ${duplicatesToDelete.length} 道重复题目`);
    console.log(`✅ 删除后将保留 ${allQuestions.length - duplicatesToDelete.length} 道唯一题目`);
    
    // 安全确认 - 先模拟
    const SIMULATE_ONLY = false; // 设置为 true 来仅模拟
    
    if (SIMULATE_ONLY) {
      console.log('\n⚠️  模拟模式：不会真正删除数据');
      console.log('模拟删除的题目ID:');
      duplicatesToDelete.slice(0, 10).forEach(item => {
        console.log(`   ID: ${item.id} (${item.reason})`);
      });
      if (duplicatesToDelete.length > 10) {
        console.log(`   ... 还有 ${duplicatesToDelete.length - 10} 道题`);
      }
    } else {
      console.log('\n🗑️  开始删除重复题目...');
      console.log('⚠️  此操作不可逆，请确保已备份数据！');
      
      // 分批删除，避免一次删除太多
      const batchSize = 50;
      let deletedCount = 0;
      const idsToDelete = duplicatesToDelete.map(item => item.id);
      
      for (let i = 0; i < idsToDelete.length; i += batchSize) {
        const batch = idsToDelete.slice(i, i + batchSize);
        
        console.log(`删除批次 ${Math.floor(i/batchSize) + 1}: ${batch.length} 道题...`);
        
        const { error } = await supabase
          .from('questions')
          .delete()
          .in('id', batch);
        
        if (error) {
          console.error(`❌ 删除批次失败:`, error.message);
          console.error(`失败的批次: ${batch.join(', ')}`);
          break;
        }
        
        deletedCount += batch.length;
        const progress = ((deletedCount / idsToDelete.length) * 100).toFixed(1);
        console.log(`✅ 已删除 ${deletedCount}/${idsToDelete.length} 道题 (${progress}%)`);
        
        // 短暂延迟，避免过快请求
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      console.log(`\n🎉 删除完成！`);
      console.log(`   删除了 ${deletedCount} 道重复题目`);
      console.log(`   保留了 ${allQuestions.length - deletedCount} 道唯一题目`);
      
      // 验证删除结果
      console.log('\n🔍 验证删除结果...');
      const { count, error: countError } = await supabase
        .from('questions')
        .select('*', { count: 'exact', head: true });
      
      if (!countError) {
        console.log(`✅ 当前题库总数: ${count} 道题`);
        if (count === allQuestions.length - deletedCount) {
          console.log('✅ 删除结果验证成功！');
        } else {
          console.log('⚠️  删除结果与预期不符，请检查！');
        }
      }
    }
    
    // 7. 生成删除报告
    console.log('\n📊 删除报告:');
    console.log('=============');
    console.log(`原始题目数: ${allQuestions.length}`);
    console.log(`重复题目数: ${duplicatesToDelete.length}`);
    console.log(`最终题目数: ${allQuestions.length - duplicatesToDelete.length}`);
    console.log(`去重率: ${((duplicatesToDelete.length / allQuestions.length) * 100).toFixed(1)}%`);
    
    // 8. 更新导入统计
    if (!SIMULATE_ONLY && deletedCount > 0) {
      console.log('\n📝 建议更新导入统计文件...');
      console.log('请运行数据检查脚本来更新统计信息');
    }
    
  } catch (error) {
    console.error('❌ 删除过程中出现异常:', error.message);
    console.error('错误详情:', error);
  }
}

// 运行删除
if (require.main === module) {
  console.log('🗑️  重复题目删除工具');
  console.log('====================');
  console.log('✅ 保留最早导入的题目版本');
  console.log('✅ 删除后来重复导入的题目');
  console.log('⚠️  请确保已备份数据！\n');
  
  removeDuplicateImports().catch(console.error);
}

module.exports = { removeDuplicateImports };
