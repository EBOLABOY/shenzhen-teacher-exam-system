const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkQuestionTypes() {
  console.log('🔍 检查题目类型和数据结构...');
  
  // 获取几道不同类型的题目
  const { data: questions, error } = await supabase
    .from('questions')
    .select('*')
    .limit(10);
  
  if (error) {
    console.error('查询失败:', error.message);
    return;
  }
  
  console.log('📊 题目数据结构分析:');
  questions.forEach((q, index) => {
    console.log(`\n题目 ${index + 1}:`);
    console.log(`  ID: ${q.id}`);
    console.log(`  题目: ${q.question.substring(0, 50)}...`);
    console.log(`  题型: ${q.question_type || '未知'}`);
    console.log(`  选项数量: ${Object.keys(q.options).length}`);
    console.log(`  选项: ${JSON.stringify(q.options)}`);
    console.log(`  答案: ${q.answer}`);
    console.log(`  科目: ${q.subject}`);
    
    // 分析题型
    const optionCount = Object.keys(q.options).length;
    const answerLength = q.answer.length;
    let guessedType = '';
    
    if (optionCount === 2 && (q.options.A === '正确' || q.options.A === '对' || q.options.A === '是')) {
      guessedType = '判断题';
    } else if (answerLength === 1) {
      guessedType = '单选题';
    } else if (answerLength > 1) {
      guessedType = '多选题';
    }
    
    console.log(`  推测题型: ${guessedType}`);
  });
  
  // 统计题型分布
  console.log('\n📈 题型分布统计:');
  const typeStats = {};
  questions.forEach(q => {
    const optionCount = Object.keys(q.options).length;
    const answerLength = q.answer.length;
    
    let type = '';
    if (optionCount === 2 && (q.options.A === '正确' || q.options.A === '对' || q.options.A === '是')) {
      type = '判断题';
    } else if (answerLength === 1) {
      type = '单选题';
    } else if (answerLength > 1) {
      type = '多选题';
    } else {
      type = '未知';
    }
    
    typeStats[type] = (typeStats[type] || 0) + 1;
  });
  
  Object.entries(typeStats).forEach(([type, count]) => {
    console.log(`  ${type}: ${count} 道`);
  });
}

checkQuestionTypes();
