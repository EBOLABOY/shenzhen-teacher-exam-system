const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testQuestionTypesDisplay() {
  console.log('🔍 测试不同题型的显示效果...\n');
  
  try {
    // 获取不同类型的题目示例
    const { data: allQuestions, error } = await supabase
      .from('questions')
      .select('*')
      .limit(500);
    
    if (error) {
      console.error('查询失败:', error.message);
      return;
    }
    
    const singleChoice = [];
    const multipleChoice = [];
    const trueOrFalse = [];
    
    allQuestions.forEach(q => {
      const optionCount = Object.keys(q.options).length;
      const answerLength = q.answer.length;
      const options = Object.values(q.options);
      
      if (optionCount === 2 && 
          (options.includes('正确') || options.includes('错误'))) {
        trueOrFalse.push(q);
      } else if (answerLength > 1) {
        multipleChoice.push(q);
      } else if (answerLength === 1 && optionCount > 2) {
        singleChoice.push(q);
      }
    });
    
    console.log('📊 题型分布:');
    console.log(`  单选题: ${singleChoice.length} 道`);
    console.log(`  多选题: ${multipleChoice.length} 道`);
    console.log(`  判断题: ${trueOrFalse.length} 道`);
    
    // 显示每种题型的详细示例
    console.log('\n📝 单选题示例:');
    if (singleChoice.length > 0) {
      const example = singleChoice[0];
      console.log(`题目: ${example.question}`);
      console.log(`选项: ${JSON.stringify(example.options, null, 2)}`);
      console.log(`正确答案: ${example.answer}`);
      console.log(`题型识别: 单选题 (选项数=${Object.keys(example.options).length}, 答案长度=${example.answer.length})`);
    }
    
    console.log('\n📝 多选题示例:');
    if (multipleChoice.length > 0) {
      const example = multipleChoice[0];
      console.log(`题目: ${example.question}`);
      console.log(`选项: ${JSON.stringify(example.options, null, 2)}`);
      console.log(`正确答案: ${example.answer}`);
      console.log(`题型识别: 多选题 (选项数=${Object.keys(example.options).length}, 答案长度=${example.answer.length})`);
      console.log(`答案拆分: [${example.answer.split('').join(', ')}]`);
    }
    
    console.log('\n📝 判断题示例:');
    if (trueOrFalse.length > 0) {
      const example = trueOrFalse[0];
      console.log(`题目: ${example.question}`);
      console.log(`选项: ${JSON.stringify(example.options, null, 2)}`);
      console.log(`正确答案: ${example.answer}`);
      console.log(`题型识别: 判断题 (选项数=${Object.keys(example.options).length}, 答案长度=${example.answer.length})`);
    }
    
    console.log('\n🎯 前端显示测试建议:');
    console.log('1. 单选题: 使用圆形单选按钮 ○');
    console.log('2. 多选题: 使用方形复选框 □');
    console.log('3. 判断题: 使用圆形单选按钮 ○');
    console.log('4. 题型标识: 在题目上方显示题型标签');
    console.log('5. 多选提示: 显示"可选择多个答案"提示');
    
  } catch (error) {
    console.error('测试过程中出现异常:', error.message);
  }
}

testQuestionTypesDisplay();
