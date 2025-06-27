#!/usr/bin/env node
/**
 * 修复所有题目的选项格式问题
 * 将字符串格式的选项转换为对象格式
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixAllOptions() {
  console.log('🔧 开始修复所有题目的选项格式...\n');
  
  try {
    // 1. 获取所有题目
    console.log('📊 获取所有题目数据...');
    const { data: allQuestions, error: fetchError } = await supabase
      .from('questions')
      .select('id, question, options, exam_year, exam_date, exam_segment')
      .order('id');
    
    if (fetchError) {
      throw new Error(`获取题目失败: ${fetchError.message}`);
    }
    
    console.log(`📝 找到 ${allQuestions.length} 道题目`);
    
    // 2. 分析选项格式
    let stringOptionsCount = 0;
    let objectOptionsCount = 0;
    let invalidOptionsCount = 0;
    const questionsToFix = [];
    
    console.log('\n🔍 分析选项格式...');
    
    for (const question of allQuestions) {
      if (!question.options) {
        invalidOptionsCount++;
        continue;
      }
      
      if (typeof question.options === 'string') {
        stringOptionsCount++;
        try {
          const parsed = JSON.parse(question.options);
          if (typeof parsed === 'object' && parsed !== null) {
            questionsToFix.push({
              id: question.id,
              question: question.question.substring(0, 50) + '...',
              originalOptions: question.options,
              parsedOptions: parsed,
              exam_info: `${question.exam_year || '未知'}年${question.exam_date || '未知'}${question.exam_segment ? ` ${question.exam_segment}` : ''}`
            });
          } else {
            invalidOptionsCount++;
          }
        } catch (e) {
          invalidOptionsCount++;
        }
      } else if (typeof question.options === 'object') {
        objectOptionsCount++;
      } else {
        invalidOptionsCount++;
      }
    }
    
    console.log(`   📊 统计结果:`);
    console.log(`   ✅ 对象格式选项: ${objectOptionsCount} 道题`);
    console.log(`   🔧 字符串格式选项: ${stringOptionsCount} 道题`);
    console.log(`   ❌ 无效选项: ${invalidOptionsCount} 道题`);
    console.log(`   🛠️  需要修复: ${questionsToFix.length} 道题`);
    
    if (questionsToFix.length === 0) {
      console.log('\n🎉 所有题目的选项格式都正确，无需修复！');
      return;
    }
    
    // 3. 显示需要修复的题目示例
    console.log('\n📋 需要修复的题目示例:');
    questionsToFix.slice(0, 3).forEach((q, index) => {
      console.log(`   ${index + 1}. ${q.question} (${q.exam_info})`);
      console.log(`      原始选项: ${q.originalOptions.substring(0, 100)}...`);
      console.log(`      解析后选项: ${JSON.stringify(q.parsedOptions).substring(0, 100)}...`);
    });
    
    // 4. 确认修复
    console.log(`\n⚠️  即将修复 ${questionsToFix.length} 道题目的选项格式`);
    console.log('   这将把字符串格式的选项转换为对象格式');
    
    // 5. 批量修复
    console.log('\n🔧 开始批量修复...');
    
    const batchSize = 50;
    let fixedCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < questionsToFix.length; i += batchSize) {
      const batch = questionsToFix.slice(i, i + batchSize);
      
      console.log(`   处理批次 ${Math.floor(i / batchSize) + 1}/${Math.ceil(questionsToFix.length / batchSize)} (${batch.length} 道题)...`);
      
      for (const question of batch) {
        try {
          const { error: updateError } = await supabase
            .from('questions')
            .update({ options: question.parsedOptions })
            .eq('id', question.id);
          
          if (updateError) {
            console.error(`     ❌ 修复题目 ${question.id} 失败: ${updateError.message}`);
            errorCount++;
          } else {
            fixedCount++;
          }
        } catch (error) {
          console.error(`     ❌ 修复题目 ${question.id} 异常: ${error.message}`);
          errorCount++;
        }
      }
      
      // 避免过快请求
      if (i + batchSize < questionsToFix.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    console.log('\n📊 修复完成统计:');
    console.log(`   ✅ 成功修复: ${fixedCount} 道题`);
    console.log(`   ❌ 修复失败: ${errorCount} 道题`);
    console.log(`   📈 成功率: ${((fixedCount / questionsToFix.length) * 100).toFixed(1)}%`);
    
    if (fixedCount > 0) {
      console.log('\n🎉 选项格式修复完成！');
      console.log('💡 建议运行以下命令验证修复结果:');
      console.log('   npm run test-apis');
    }
    
  } catch (error) {
    console.error('❌ 修复过程中出现错误:', error);
    throw error;
  }
}

fixAllOptions()
  .then(() => {
    console.log('\n✅ 修复完成');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ 修复失败:', error);
    process.exit(1);
  });
