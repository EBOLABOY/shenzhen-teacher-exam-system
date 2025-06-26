#!/usr/bin/env node
/**
 * 快速删除重复题目 - 保留最早的版本
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function quickRemoveDuplicates() {
  console.log('🚀 快速删除重复题目...\n');
  
  try {
    // 1. 先查看当前题目总数
    console.log('1️⃣ 检查当前题目总数...');
    const { count: totalCount, error: countError } = await supabase
      .from('questions')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('❌ 获取题目总数失败:', countError.message);
      return;
    }
    
    console.log(`📊 当前题目总数: ${totalCount} 道`);
    
    // 2. 查找重复题目 - 使用SQL查询
    console.log('\n2️⃣ 查找重复题目...');
    
    // 获取所有重复的题目组
    const { data: duplicateGroups, error: duplicateError } = await supabase
      .rpc('find_duplicate_questions');
    
    if (duplicateError) {
      console.log('⚠️  RPC函数不存在，使用备用方法...');
      
      // 备用方法：分批获取并在客户端处理
      let allQuestions = [];
      let page = 0;
      const pageSize = 1000;
      
      while (true) {
        const { data: pageData, error: pageError } = await supabase
          .from('questions')
          .select('id, question, answer, created_at')
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
      
      console.log(`✅ 获取完成，共 ${allQuestions.length} 道题`);
      
      // 3. 在客户端识别重复题目
      console.log('\n3️⃣ 识别重复题目...');
      const questionMap = new Map();
      const duplicatesToDelete = [];
      
      allQuestions.forEach(q => {
        const key = `${q.question.trim()}|||${q.answer.trim()}`;
        
        if (questionMap.has(key)) {
          // 发现重复，保留最早的
          const existing = questionMap.get(key);
          const existingTime = new Date(existing.created_at);
          const currentTime = new Date(q.created_at);
          
          if (currentTime > existingTime) {
            // 当前题目更新，删除当前的
            duplicatesToDelete.push(q.id);
          } else {
            // 当前题目更早，删除之前记录的，保留当前的
            duplicatesToDelete.push(existing.id);
            questionMap.set(key, q);
          }
        } else {
          questionMap.set(key, q);
        }
      });
      
      console.log(`📊 发现重复题目: ${duplicatesToDelete.length} 道`);
      console.log(`✅ 将保留唯一题目: ${allQuestions.length - duplicatesToDelete.length} 道`);
      
      if (duplicatesToDelete.length === 0) {
        console.log('\n✅ 没有发现重复题目！');
        return;
      }
      
      // 4. 执行删除
      console.log('\n4️⃣ 开始删除重复题目...');
      
      const batchSize = 100;
      let deletedCount = 0;
      
      for (let i = 0; i < duplicatesToDelete.length; i += batchSize) {
        const batch = duplicatesToDelete.slice(i, i + batchSize);
        
        console.log(`删除批次 ${Math.floor(i/batchSize) + 1}: ${batch.length} 道题...`);
        
        const { error } = await supabase
          .from('questions')
          .delete()
          .in('id', batch);
        
        if (error) {
          console.error(`❌ 删除批次失败:`, error.message);
          break;
        }
        
        deletedCount += batch.length;
        const progress = ((deletedCount / duplicatesToDelete.length) * 100).toFixed(1);
        console.log(`✅ 已删除 ${deletedCount}/${duplicatesToDelete.length} 道题 (${progress}%)`);
        
        // 短暂延迟
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      console.log(`\n🎉 删除完成！删除了 ${deletedCount} 道重复题目`);
      
      // 5. 验证结果
      console.log('\n5️⃣ 验证删除结果...');
      const { count: finalCount, error: finalCountError } = await supabase
        .from('questions')
        .select('*', { count: 'exact', head: true });
      
      if (!finalCountError) {
        console.log(`✅ 删除后题目总数: ${finalCount} 道`);
        console.log(`📊 删除统计:`);
        console.log(`   原始题目: ${totalCount} 道`);
        console.log(`   删除题目: ${deletedCount} 道`);
        console.log(`   最终题目: ${finalCount} 道`);
        console.log(`   预期题目: ${totalCount - deletedCount} 道`);
        
        if (finalCount === totalCount - deletedCount) {
          console.log('✅ 删除结果验证成功！');
        } else {
          console.log('⚠️  删除结果与预期不符！');
        }
      }
    }
    
  } catch (error) {
    console.error('❌ 删除过程中出现异常:', error.message);
    console.error('错误详情:', error);
  }
}

// 运行删除
if (require.main === module) {
  console.log('⚠️  警告：此操作将删除重复题目，不可逆！');
  console.log('🔄 开始执行...\n');
  
  quickRemoveDuplicates()
    .then(() => {
      console.log('\n✅ 操作完成');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ 操作失败:', error);
      process.exit(1);
    });
}

module.exports = { quickRemoveDuplicates };
