const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkQuestionFormat() {
  const { data: questions, error } = await supabase
    .from('questions')
    .select('*')
    .limit(3);
  
  if (error) {
    console.error('错误:', error);
    return;
  }
  
  console.log('题目数据格式检查:');
  questions.forEach((q, index) => {
    console.log(`\n题目 ${index + 1}:`);
    console.log(`ID: ${q.id}`);
    console.log(`题目: ${q.question.substring(0, 50)}...`);
    console.log(`选项类型: ${typeof q.options}`);
    console.log(`选项内容: ${JSON.stringify(q.options)}`);
    console.log(`答案: ${q.answer}`);
    console.log(`科目: ${q.subject}`);
    console.log(`难度: ${q.difficulty}`);
  });
}

checkQuestionFormat();
