#!/usr/bin/env node
/**
 * 修复未知类型题目（缺少选项的判断题）
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 需要服务角色密钥来执行更新操作');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixUnknownQuestions() {
  console.log('🔧 开始修复未知类型题目...\n');
  
  try {
    // 1. 找到所有缺少选项的题目
    const { data: unknownQuestions, error: fetchError } = await supabase
      .from('questions')
      .select('*')
      .limit(2000);
    
    if (fetchError) {
      console.error('❌ 获取题目失败:', fetchError.message);
      return;
    }
    
    const toFix = unknownQuestions.filter(q => {
      const optionCount = Object.keys(q.options).length;
      return optionCount === 0 && q.question.includes('（');
    });
    
    console.log(`📊 发现需要修复的题目: ${toFix.length} 道`);
    
    if (toFix.length === 0) {
      console.log('✅ 没有需要修复的题目');
      return;
    }
    
    // 2. 批量修复
    console.log('🔧 开始批量修复...');
    
    const batchSize = 50;
    let fixedCount = 0;
    
    for (let i = 0; i < toFix.length; i += batchSize) {
      const batch = toFix.slice(i, i + batchSize);
      
      // 为每道题添加标准的判断题选项
      const updates = batch.map(q => ({
        id: q.id,
        options: {
          A: '正确',
          B: '错误'
        }
      }));
      
      // 执行批量更新
      for (const update of updates) {
        const { error: updateError } = await supabase
          .from('questions')
          .update({ options: update.options })
          .eq('id', update.id);
        
        if (updateError) {
          console.error(`❌ 更新题目 ${update.id} 失败:`, updateError.message);
        } else {
          fixedCount++;
        }
      }
      
      console.log(`✅ 已修复 ${fixedCount}/${toFix.length} 道题 (${((fixedCount/toFix.length)*100).toFixed(1)}%)`);
      
      // 短暂延迟
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`\n🎉 修复完成！`);
    console.log(`   成功修复: ${fixedCount} 道题`);
    console.log(`   失败: ${toFix.length - fixedCount} 道题`);
    
    // 3. 验证修复结果
    console.log('\n🔍 验证修复结果...');
    
    const { data: verifyQuestions, error: verifyError } = await supabase
      .from('questions')
      .select('*')
      .limit(2000);
    
    if (verifyError) {
      console.error('❌ 验证失败:', verifyError.message);
      return;
    }
    
    const stillUnknown = verifyQuestions.filter(q => {
      const optionCount = Object.keys(q.options).length;
      const answerLength = q.answer.length;
      const options = Object.values(q.options);
      
      return !(
        (optionCount === 2 && (options.includes('正确') || options.includes('错误'))) ||
        (answerLength > 1) ||
        (answerLength === 1 && optionCount > 2)
      );
    });
    
    console.log(`📊 修复后未知类型题目: ${stillUnknown.length} 道`);
    
    if (stillUnknown.length > 0) {
      console.log('⚠️  仍有未知类型题目:');
      stillUnknown.slice(0, 3).forEach((q, index) => {
        console.log(`  ${index + 1}. ID:${q.id} - ${q.question.substring(0, 30)}...`);
      });
    } else {
      console.log('✅ 所有题目类型都已正确识别！');
    }
    
  } catch (error) {
    console.error('❌ 修复过程中出现异常:', error.message);
  }
}

// 运行修复
if (require.main === module) {
  console.log('🔧 题目类型修复工具');
  console.log('===================');
  console.log('✅ 自动为缺少选项的判断题添加标准选项');
  console.log('✅ 批量处理，安全可靠');
  console.log('⚠️  请确保已备份数据！\n');
  
  fixUnknownQuestions().catch(console.error);
}
