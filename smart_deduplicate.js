#!/usr/bin/env node
/**
 * 智能题目去重脚本
 * 考虑题目内容、选项、答案和考试时间
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

// 生成题目的唯一标识
function generateQuestionKey(question, options) {
  const normalizedQuestion = question.trim().toLowerCase();
  const normalizedOptions = Object.entries(options)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}:${value.trim().toLowerCase()}`)
    .join('|');
  return `${normalizedQuestion}###${normalizedOptions}`;
}

// 比较考试时间，返回更新的题目
function getNewerQuestion(q1, q2) {
  // 优先级：考试年份 > 考试日期 > 创建时间
  
  // 1. 比较考试年份
  const year1 = q1.exam_year || 0;
  const year2 = q2.exam_year || 0;
  
  if (year1 !== year2) {
    return year1 > year2 ? q1 : q2;
  }
  
  // 2. 如果年份相同，比较考试日期
  if (q1.exam_date && q2.exam_date) {
    // 简单的日期比较（假设格式为"X月Y日"）
    const date1 = q1.exam_date;
    const date2 = q2.exam_date;
    if (date1 !== date2) {
      return date1 > date2 ? q1 : q2;
    }
  }
  
  // 3. 最后比较创建时间
  const created1 = new Date(q1.created_at);
  const created2 = new Date(q2.created_at);
  
  return created1 > created2 ? q1 : q2;
}

async function smartDeduplicate() {
  console.log('🧠 开始智能题目去重处理...\n');
  
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
        .range(page * pageSize, (page + 1) * pageSize - 1);
      
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
    
    // 2. 智能分组和去重
    console.log('2️⃣ 智能分析题目重复情况...');
    
    const questionGroups = new Map(); // key -> [questions]
    const toDelete = [];
    const conflicts = [];
    
    // 按题目内容和选项分组
    allQuestions.forEach(q => {
      const key = generateQuestionKey(q.question, q.options);
      
      if (!questionGroups.has(key)) {
        questionGroups.set(key, []);
      }
      questionGroups.get(key).push(q);
    });
    
    console.log(`📊 发现 ${questionGroups.size} 个唯一题目组`);
    
    // 3. 处理每个组
    let exactDuplicates = 0;
    let answerConflicts = 0;
    let kept = 0;
    
    questionGroups.forEach((questions, key) => {
      if (questions.length === 1) {
        // 唯一题目，保留
        kept++;
        return;
      }
      
      // 按答案分组
      const answerGroups = new Map();
      questions.forEach(q => {
        const answer = q.answer.trim().toUpperCase();
        if (!answerGroups.has(answer)) {
          answerGroups.set(answer, []);
        }
        answerGroups.get(answer).push(q);
      });
      
      if (answerGroups.size === 1) {
        // 所有题目答案相同，完全重复
        exactDuplicates++;
        const questionsToKeep = questions.sort((a, b) => {
          return getNewerQuestion(a, b) === a ? -1 : 1;
        });
        
        // 保留最新的，删除其他的
        const keepQuestion = questionsToKeep[0];
        const deleteQuestions = questionsToKeep.slice(1);
        
        deleteQuestions.forEach(q => toDelete.push(q.id));
        kept++;
        
        console.log(`   ✅ 完全重复组: 保留ID ${keepQuestion.id} (${keepQuestion.exam_year}年), 删除 ${deleteQuestions.length} 道`);
        
      } else {
        // 答案不同，需要特殊处理
        answerConflicts++;
        
        console.log(`   ⚠️  答案冲突组: ${questions[0].question.substring(0, 40)}...`);
        
        // 按考试时间选择最新的答案
        const newestQuestion = questions.reduce((newest, current) => {
          return getNewerQuestion(newest, current);
        });
        
        // 删除其他版本
        const deleteQuestions = questions.filter(q => q.id !== newestQuestion.id);
        deleteQuestions.forEach(q => toDelete.push(q.id));
        kept++;
        
        conflicts.push({
          kept: newestQuestion,
          deleted: deleteQuestions,
          question: questions[0].question.substring(0, 50) + '...'
        });
        
        console.log(`     保留: ID ${newestQuestion.id} (${newestQuestion.exam_year}年, 答案:${newestQuestion.answer})`);
        console.log(`     删除: ${deleteQuestions.map(q => `ID ${q.id}(${q.exam_year}年,答案:${q.answer})`).join(', ')}`);
      }
    });
    
    console.log(`\n📊 分析结果:`);
    console.log(`   完全重复组: ${exactDuplicates} 组`);
    console.log(`   答案冲突组: ${answerConflicts} 组`);
    console.log(`   唯一题目: ${kept} 道`);
    console.log(`   待删除: ${toDelete.length} 道`);
    
    // 4. 显示答案冲突处理详情
    if (conflicts.length > 0) {
      console.log(`\n⚠️  答案冲突处理详情 (保留最新考试的版本):`);
      conflicts.slice(0, 5).forEach((conflict, index) => {
        console.log(`${index + 1}. ${conflict.question}`);
        console.log(`   保留: ${conflict.kept.exam_year}年 答案:${conflict.kept.answer}`);
        console.log(`   删除: ${conflict.deleted.map(d => `${d.exam_year}年答案:${d.answer}`).join(', ')}`);
      });
      
      if (conflicts.length > 5) {
        console.log(`   ... 还有 ${conflicts.length - 5} 组冲突`);
      }
    }
    
    // 5. 执行删除确认
    console.log(`\n🗑️  准备删除 ${toDelete.length} 道重复/过时题目`);
    console.log(`✅ 最终保留 ${kept} 道唯一题目`);
    
    // 安全确认
    const SIMULATE_ONLY = false; // 设置为 true 来仅模拟
    
    if (SIMULATE_ONLY) {
      console.log('\n⚠️  模拟模式：不会真正删除数据');
      console.log(`模拟删除题目ID: ${toDelete.slice(0, 10).join(', ')}...`);
    } else {
      console.log('\n⚠️  即将执行真实删除操作！');
      console.log('按 Ctrl+C 取消，或等待5秒后自动开始...');
      
      // 等待5秒
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      console.log('\n🗑️  开始删除重复题目...');
      
      // 分批删除
      const batchSize = 50;
      let deletedCount = 0;
      
      for (let i = 0; i < toDelete.length; i += batchSize) {
        const batch = toDelete.slice(i, i + batchSize);
        
        const { error } = await supabase
          .from('questions')
          .delete()
          .in('id', batch);
        
        if (error) {
          console.error(`❌ 删除批次失败:`, error.message);
          break;
        }
        
        deletedCount += batch.length;
        console.log(`✅ 已删除 ${deletedCount}/${toDelete.length} 道题 (${((deletedCount/toDelete.length)*100).toFixed(1)}%)`);
        
        // 短暂延迟，避免过快请求
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      console.log(`\n🎉 智能去重完成！`);
      console.log(`   删除了 ${deletedCount} 道重复/过时题目`);
      console.log(`   保留了 ${kept} 道唯一题目`);
    }
    
    // 6. 生成最终报告
    console.log('\n📊 智能去重报告:');
    console.log('==================');
    console.log(`原始题目数: ${allQuestions.length}`);
    console.log(`删除题目数: ${toDelete.length}`);
    console.log(`最终题目数: ${kept}`);
    console.log(`去重率: ${((toDelete.length / allQuestions.length) * 100).toFixed(1)}%`);
    console.log(`数据质量提升: ${((1 - toDelete.length / allQuestions.length) * 100).toFixed(1)}%`);
    
  } catch (error) {
    console.error('❌ 智能去重过程中出现异常:', error.message);
  }
}

// 运行智能去重
if (require.main === module) {
  console.log('🧠 智能题目去重工具');
  console.log('===================');
  console.log('✅ 考虑题目内容和选项的完整匹配');
  console.log('✅ 答案冲突时保留最新考试年份的版本');
  console.log('✅ 智能处理考试时间优先级');
  console.log('⚠️  请确保已备份数据！\n');
  
  smartDeduplicate().catch(console.error);
}
