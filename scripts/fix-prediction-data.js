#!/usr/bin/env node
/**
 * 修复预测卷数据 - 确保90道题目完整导入
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixPredictionData() {
  console.log('🔧 修复预测卷数据...\n');
  
  try {
    // 1. 检查当前预测卷数据
    console.log('1️⃣ 检查当前预测卷数据...');
    const { data: currentPredictions, error: checkError } = await supabase
      .from('questions')
      .select('id, question, exam_year, exam_date, type')
      .eq('exam_year', 2025)
      .eq('exam_date', '7月5日');
    
    if (checkError) {
      console.error('❌ 检查预测卷数据失败:', checkError.message);
      return;
    }
    
    console.log(`📊 当前预测卷题目数量: ${currentPredictions.length} 道`);

    const typeStats = {};
    if (currentPredictions.length > 0) {
      currentPredictions.forEach(q => {
        typeStats[q.type] = (typeStats[q.type] || 0) + 1;
      });

      console.log('📋 当前题型分布:');
      Object.entries(typeStats).forEach(([type, count]) => {
        console.log(`   ${type}: ${count}题`);
      });
    }
    
    // 2. 读取完整的预测卷JSON文件
    console.log('\n2️⃣ 读取预测卷JSON文件...');
    const jsonPath = path.join(process.cwd(), '真题JSON', '2025年7月5日(预测题).json');
    
    if (!fs.existsSync(jsonPath)) {
      console.error('❌ 预测卷JSON文件不存在:', jsonPath);
      return;
    }
    
    const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    console.log('✅ JSON文件读取成功');
    
    // 3. 统计JSON文件中的题目
    let totalQuestions = 0;
    const expectedStats = {};
    
    jsonData.sections.forEach(section => {
      totalQuestions += section.count;
      const typeMapping = {
        '单项选择题': 'multiple_choice',
        '多项选择题': 'multiple_select', 
        '是非题': 'true_false'
      };
      const mappedType = typeMapping[section.type] || section.type;
      expectedStats[mappedType] = section.count;
    });
    
    console.log(`📊 JSON文件预期题目数量: ${totalQuestions} 道`);
    console.log('📋 预期题型分布:');
    Object.entries(expectedStats).forEach(([type, count]) => {
      console.log(`   ${type}: ${count}题`);
    });
    
    // 4. 比较差异
    console.log('\n3️⃣ 分析数据差异...');
    const missingCount = totalQuestions - currentPredictions.length;
    
    if (missingCount > 0) {
      console.log(`⚠️  缺少 ${missingCount} 道题目`);
      
      // 检查具体缺少哪些题型
      Object.entries(expectedStats).forEach(([type, expected]) => {
        const actual = typeStats[type] || 0;
        if (actual < expected) {
          console.log(`   ${type}: 缺少 ${expected - actual} 道题`);
        }
      });
      
      // 5. 删除现有预测卷数据
      console.log('\n4️⃣ 删除现有不完整的预测卷数据...');
      if (currentPredictions.length > 0) {
        const idsToDelete = currentPredictions.map(q => q.id);
        
        const { error: deleteError } = await supabase
          .from('questions')
          .delete()
          .in('id', idsToDelete);
        
        if (deleteError) {
          console.error('❌ 删除现有数据失败:', deleteError.message);
          return;
        }
        
        console.log(`✅ 已删除 ${currentPredictions.length} 道不完整的预测卷题目`);
      }
      
      // 6. 重新导入完整数据
      console.log('\n5️⃣ 重新导入完整预测卷数据...');
      
      const questionsToInsert = [];
      
      jsonData.sections.forEach(section => {
        const typeMapping = {
          '单项选择题': 'multiple_choice',
          '多项选择题': 'multiple_select',
          '是非题': 'true_false'
        };
        
        const questionType = typeMapping[section.type] || section.type;
        
        section.questions.forEach(q => {
          const questionData = {
            question: q.text,
            options: q.options ? JSON.stringify(q.options) : null,
            answer: q.correct_answer,
            explanation: q.explanation || '',
            type: questionType,
            subject: '教育学',
            difficulty: 'medium', // 默认中等难度
            points: section.points_per_question || 1,
            exam_year: jsonData.exam_info.year,
            exam_date: jsonData.exam_info.month_day,
            exam_segment: jsonData.exam_info.segment
          };
          
          questionsToInsert.push(questionData);
        });
      });
      
      console.log(`📝 准备导入 ${questionsToInsert.length} 道题目...`);
      
      // 分批导入
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
      
      console.log(`\n🎉 预测卷数据修复完成！导入了 ${importedCount} 道题目`);
      
    } else if (missingCount === 0) {
      console.log('✅ 预测卷数据完整，无需修复');
    } else {
      console.log(`⚠️  数据异常：实际题目数量 (${currentPredictions.length}) 超过预期 (${totalQuestions})`);
    }
    
    // 7. 验证修复结果
    console.log('\n6️⃣ 验证修复结果...');
    const { data: finalPredictions, error: finalError } = await supabase
      .from('questions')
      .select('id, type')
      .eq('exam_year', 2025)
      .eq('exam_date', '7月5日');
    
    if (!finalError && finalPredictions) {
      console.log(`✅ 最终预测卷题目数量: ${finalPredictions.length} 道`);
      
      const finalStats = {};
      finalPredictions.forEach(q => {
        finalStats[q.type] = (finalStats[q.type] || 0) + 1;
      });
      
      console.log('📋 最终题型分布:');
      Object.entries(finalStats).forEach(([type, count]) => {
        console.log(`   ${type}: ${count}题`);
      });
      
      // 检查是否符合预期
      const isCorrect = finalPredictions.length === totalQuestions;
      if (isCorrect) {
        console.log('\n🎉 预测卷数据修复成功！题目数量正确');
      } else {
        console.log('\n⚠️  预测卷数据仍有问题，需要进一步检查');
      }
    }
    
  } catch (error) {
    console.error('❌ 修复过程中出现异常:', error.message);
  }
}

if (require.main === module) {
  fixPredictionData()
    .then(() => {
      console.log('\n修复完成');
      process.exit(0);
    })
    .catch(error => {
      console.error('修复失败:', error);
      process.exit(1);
    });
}

module.exports = { fixPredictionData };
