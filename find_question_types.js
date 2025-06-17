const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function findDifferentTypes() {
  console.log('🔍 查找不同题型的例子...');
  
  // 查找所有题目
  const { data: allQuestions, error } = await supabase
    .from('questions')
    .select('*')
    .limit(1000);
  
  if (error) {
    console.error('查询失败:', error.message);
    return;
  }
  
  console.log('📊 分析所有题目类型...');
  
  const singleChoice = [];
  const multipleChoice = [];
  const trueOrFalse = [];
  const unknown = [];
  
  allQuestions.forEach(q => {
    const optionCount = Object.keys(q.options).length;
    const answerLength = q.answer.length;
    const options = Object.values(q.options);
    
    // 判断题：选项是正确/错误、对/错、是/否等
    if (optionCount === 2 && 
        (options.includes('正确') || options.includes('错误') ||
         options.includes('对') || options.includes('错') ||
         options.includes('是') || options.includes('否') ||
         options.includes('√') || options.includes('×'))) {
      trueOrFalse.push(q);
    }
    // 多选题：答案长度>1
    else if (answerLength > 1) {
      multipleChoice.push(q);
    }
    // 单选题：答案长度=1且选项>2
    else if (answerLength === 1 && optionCount > 2) {
      singleChoice.push(q);
    }
    else {
      unknown.push(q);
    }
  });
  
  console.log('📈 题型统计:');
  console.log(`  单选题: ${singleChoice.length} 道`);
  console.log(`  多选题: ${multipleChoice.length} 道`);
  console.log(`  判断题: ${trueOrFalse.length} 道`);
  console.log(`  未知类型: ${unknown.length} 道`);
  
  // 显示每种题型的例子
  if (multipleChoice.length > 0) {
    console.log('\n📝 多选题示例:');
    const example = multipleChoice[0];
    console.log(`  题目: ${example.question}`);
    console.log(`  选项: ${JSON.stringify(example.options)}`);
    console.log(`  答案: ${example.answer}`);
  }
  
  if (trueOrFalse.length > 0) {
    console.log('\n📝 判断题示例:');
    const example = trueOrFalse[0];
    console.log(`  题目: ${example.question}`);
    console.log(`  选项: ${JSON.stringify(example.options)}`);
    console.log(`  答案: ${example.answer}`);
  }
  
  if (singleChoice.length > 0) {
    console.log('\n📝 单选题示例:');
    const example = singleChoice[0];
    console.log(`  题目: ${example.question}`);
    console.log(`  选项: ${JSON.stringify(example.options)}`);
    console.log(`  答案: ${example.answer}`);
  }
  
  // 检查未知类型
  if (unknown.length > 0) {
    console.log('\n❓ 未知类型示例:');
    unknown.slice(0, 3).forEach((q, index) => {
      console.log(`  示例 ${index + 1}:`);
      console.log(`    题目: ${q.question.substring(0, 50)}...`);
      console.log(`    选项数: ${Object.keys(q.options).length}`);
      console.log(`    答案长度: ${q.answer.length}`);
      console.log(`    选项: ${JSON.stringify(q.options)}`);
      console.log(`    答案: ${q.answer}`);
    });
  }
}

findDifferentTypes();
