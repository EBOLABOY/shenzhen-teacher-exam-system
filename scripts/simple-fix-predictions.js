#!/usr/bin/env node
/**
 * 简单修复预测卷数据
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function simpleFix() {
  console.log('🔧 简单修复预测卷数据...\n');
  
  try {
    // 1. 删除现有预测卷数据
    console.log('1️⃣ 删除现有预测卷数据...');
    const { error: deleteError } = await supabase
      .from('questions')
      .delete()
      .eq('exam_year', 2025)
      .eq('exam_date', '7月5日');
    
    if (deleteError) {
      console.error('❌ 删除失败:', deleteError.message);
      return;
    }
    console.log('✅ 现有预测卷数据已删除');
    
    // 2. 读取JSON文件
    console.log('\n2️⃣ 读取JSON文件...');
    const jsonPath = path.join(process.cwd(), '真题JSON', '2025年7月5日(预测题).json');
    const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    console.log('✅ JSON文件读取成功');
    
    // 3. 准备题目数据
    console.log('\n3️⃣ 准备题目数据...');
    const questionsToInsert = [];
    
    jsonData.sections.forEach(section => {
      let questionType = 'multiple_choice';
      if (section.type === '多项选择题') {
        questionType = 'multiple_select';
      } else if (section.type === '是非题') {
        questionType = 'true_false';
      }
      
      section.questions.forEach(q => {
        questionsToInsert.push({
          question: q.text,
          options: JSON.stringify(q.options || {}),
          answer: q.correct_answer,
          explanation: q.explanation || '',
          type: questionType,
          subject: '教育学',
          difficulty: 'medium',
          points: section.points_per_question || 1,
          exam_year: 2025,
          exam_date: '7月5日',
          exam_segment: '小学客观题预测'
        });
      });
    });
    
    console.log(`📝 准备导入 ${questionsToInsert.length} 道题目`);
    
    // 4. 分批导入
    console.log('\n4️⃣ 开始导入...');
    const batchSize = 50;
    let importedCount = 0;
    
    for (let i = 0; i < questionsToInsert.length; i += batchSize) {
      const batch = questionsToInsert.slice(i, i + batchSize);
      
      const { error: insertError } = await supabase
        .from('questions')
        .insert(batch);
      
      if (insertError) {
        console.error(`❌ 导入批次失败:`, insertError.message);
        break;
      }
      
      importedCount += batch.length;
      const progress = ((importedCount / questionsToInsert.length) * 100).toFixed(1);
      console.log(`✅ 已导入 ${importedCount}/${questionsToInsert.length} 道题 (${progress}%)`);
    }
    
    // 5. 验证结果
    console.log('\n5️⃣ 验证结果...');
    const { data: finalData, error: finalError } = await supabase
      .from('questions')
      .select('id, type')
      .eq('exam_year', 2025)
      .eq('exam_date', '7月5日');
    
    if (!finalError && finalData) {
      console.log(`✅ 最终题目数量: ${finalData.length} 道`);
      
      const stats = {};
      finalData.forEach(q => {
        stats[q.type] = (stats[q.type] || 0) + 1;
      });
      
      console.log('📋 题型分布:');
      Object.entries(stats).forEach(([type, count]) => {
        console.log(`   ${type}: ${count}题`);
      });
      
      if (finalData.length === 90) {
        console.log('\n🎉 预测卷修复成功！');
      } else {
        console.log('\n⚠️  题目数量不正确');
      }
    }
    
  } catch (error) {
    console.error('❌ 修复失败:', error.message);
  }
}

simpleFix()
  .then(() => {
    console.log('\n修复完成');
    process.exit(0);
  })
  .catch(error => {
    console.error('修复失败:', error);
    process.exit(1);
  });
