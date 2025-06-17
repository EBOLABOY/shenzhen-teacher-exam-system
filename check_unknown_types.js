const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkUnknownTypes() {
  console.log('🔍 检查未知类型题目...');
  
  const { data: allQuestions, error } = await supabase
    .from('questions')
    .select('*')
    .limit(1000);
  
  if (error) {
    console.error('查询失败:', error.message);
    return;
  }
  
  const unknown = [];
  
  allQuestions.forEach(q => {
    const optionCount = Object.keys(q.options).length;
    const answerLength = q.answer.length;
    const options = Object.values(q.options);
    
    // 不是标准的单选、多选、判断题
    if (!(
      (optionCount === 2 && (options.includes('正确') || options.includes('错误'))) ||
      (answerLength > 1) ||
      (answerLength === 1 && optionCount > 2)
    )) {
      unknown.push(q);
    }
  });
  
  console.log(`📊 未知类型题目数量: ${unknown.length}`);
  
  // 分析未知类型的特征
  const patterns = {};
  unknown.forEach(q => {
    const optionCount = Object.keys(q.options).length;
    const answerLength = q.answer.length;
    const hasOptions = optionCount > 0;
    
    const pattern = `选项数:${optionCount}, 答案长度:${answerLength}, 有选项:${hasOptions}`;
    patterns[pattern] = (patterns[pattern] || 0) + 1;
  });
  
  console.log('\n📈 未知类型模式分析:');
  Object.entries(patterns).forEach(([pattern, count]) => {
    console.log(`  ${pattern} - ${count}道`);
  });
  
  // 显示具体示例
  console.log('\n📝 未知类型题目示例:');
  unknown.slice(0, 5).forEach((q, index) => {
    console.log(`\n示例 ${index + 1}:`);
    console.log(`  ID: ${q.id}`);
    console.log(`  题目: ${q.question}`);
    console.log(`  选项数量: ${Object.keys(q.options).length}`);
    console.log(`  选项内容: ${JSON.stringify(q.options)}`);
    console.log(`  答案: ${q.answer}`);
    console.log(`  答案长度: ${q.answer.length}`);
    console.log(`  科目: ${q.subject}`);
  });
  
  // 分析可能的原因
  console.log('\n🔍 可能的原因分析:');
  console.log('1. 选项数据缺失或格式异常');
  console.log('2. 答案格式不标准');
  console.log('3. 特殊题型（如填空题、简答题）');
  console.log('4. 数据导入时的格式问题');
}

checkUnknownTypes();
