#!/usr/bin/env node
/**
 * 题目去重脚本
 * 删除重复题目，保留最早的版本
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 需要服务角色密钥来执行删除操作');
  console.error('请设置 SUPABASE_SERVICE_ROLE_KEY 环境变量');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function deduplicateQuestions() {
  console.log('🔧 开始题目去重处理...\n');
  
  try {
    // 1. 获取所有题目
    console.log('1️⃣ 获取所有题目数据...');
    let allQuestions = [];
    let page = 0;
    const pageSize = 1000;
    
    while (true) {
      const { data: pageData, error: pageError } = await supabase
        .from('questions')
        .select('*')
        .range(page * pageSize, (page + 1) * pageSize - 1)
        .order('created_at', { ascending: true }); // 按创建时间排序，保留最早的
      
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
    
    // 2. 识别重复题目
    console.log('2️⃣ 识别重复题目...');
    const questionMap = new Map();
    const duplicatesToDelete = [];
    const conflictQuestions = [];
    
    allQuestions.forEach(q => {
      const key = `${q.question.trim()}|${q.answer.trim()}`;
      const contentKey = q.question.trim();
      
      if (questionMap.has(key)) {
        // 完全重复，标记删除
        duplicatesToDelete.push(q.id);
      } else if (questionMap.has(contentKey)) {
        // 题目相同但答案不同，需要人工处理
        const existing = questionMap.get(contentKey);
        if (existing.answer !== q.answer) {
          conflictQuestions.push({
            id1: existing.id,
            id2: q.id,
            question: q.question.substring(0, 50) + '...',
            answer1: existing.answer,
            answer2: q.answer
          });
        }
        duplicatesToDelete.push(q.id); // 暂时也标记删除，后续人工处理
      } else {
        questionMap.set(key, q);
        questionMap.set(contentKey, q);
      }
    });
    
    console.log(`📊 发现重复题目: ${duplicatesToDelete.length} 道`);
    console.log(`⚠️  发现答案冲突: ${conflictQuestions.length} 组`);
    
    // 3. 显示答案冲突详情
    if (conflictQuestions.length > 0) {
      console.log('\n⚠️  答案冲突详情 (需要人工审核):');
      conflictQuestions.forEach((conflict, index) => {
        console.log(`${index + 1}. ${conflict.question}`);
        console.log(`   ID ${conflict.id1}: 答案 ${conflict.answer1}`);
        console.log(`   ID ${conflict.id2}: 答案 ${conflict.answer2}`);
      });
    }
    
    // 4. 确认是否执行删除
    console.log(`\n🗑️  准备删除 ${duplicatesToDelete.length} 道重复题目`);
    console.log(`✅ 保留 ${allQuestions.length - duplicatesToDelete.length} 道唯一题目`);
    
    // 模拟删除（安全起见，先不真正删除）
    console.log('\n⚠️  安全模式：仅模拟删除，不会真正删除数据');
    console.log('如需真正删除，请修改脚本中的 SIMULATE_ONLY 变量');
    
    const SIMULATE_ONLY = true; // 设置为 false 来真正执行删除
    
    if (SIMULATE_ONLY) {
      console.log('\n📋 模拟删除结果:');
      console.log(`   将删除题目ID: ${duplicatesToDelete.slice(0, 10).join(', ')}...`);
      console.log(`   删除后题目总数: ${allQuestions.length - duplicatesToDelete.length}`);
    } else {
      // 真正执行删除
      console.log('\n🗑️  开始删除重复题目...');
      
      // 分批删除，避免一次删除太多
      const batchSize = 100;
      let deletedCount = 0;
      
      for (let i = 0; i < duplicatesToDelete.length; i += batchSize) {
        const batch = duplicatesToDelete.slice(i, i + batchSize);
        
        const { error } = await supabase
          .from('questions')
          .delete()
          .in('id', batch);
        
        if (error) {
          console.error(`❌ 删除批次失败:`, error.message);
          break;
        }
        
        deletedCount += batch.length;
        console.log(`✅ 已删除 ${deletedCount}/${duplicatesToDelete.length} 道题`);
      }
      
      console.log(`\n🎉 去重完成！删除了 ${deletedCount} 道重复题目`);
    }
    
    // 5. 生成去重报告
    console.log('\n📊 去重报告:');
    console.log('=============');
    console.log(`原始题目数: ${allQuestions.length}`);
    console.log(`重复题目数: ${duplicatesToDelete.length}`);
    console.log(`答案冲突数: ${conflictQuestions.length}`);
    console.log(`最终题目数: ${allQuestions.length - duplicatesToDelete.length}`);
    console.log(`去重率: ${((duplicatesToDelete.length / allQuestions.length) * 100).toFixed(1)}%`);
    
    // 6. 建议
    console.log('\n💡 后续建议:');
    console.log('1. 人工审核答案冲突的题目');
    console.log('2. 在导入脚本中添加去重逻辑');
    console.log('3. 建立题目唯一性约束');
    console.log('4. 定期检查数据质量');
    
  } catch (error) {
    console.error('❌ 去重过程中出现异常:', error.message);
  }
}

// 运行去重
if (require.main === module) {
  console.log('⚠️  警告：此脚本将删除重复题目，请确保已备份数据！');
  console.log('当前为安全模式，仅模拟删除操作\n');
  deduplicateQuestions().catch(console.error);
}
