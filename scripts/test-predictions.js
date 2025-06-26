const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

/**
 * 测试预测卷功能
 */
async function testPredictions() {
  console.log('🧪 开始测试预测卷功能...\n');

  try {
    // 1. 测试获取预测卷列表
    console.log('1️⃣ 测试获取预测卷列表...');
    
    const { data: predictions, error } = await supabase
      .from('questions')
      .select('exam_year, exam_date, exam_segment')
      .ilike('exam_segment', '%预测%')
      .order('exam_year', { ascending: false })
      .order('exam_date', { ascending: false });

    if (error) {
      console.error('❌ 获取预测卷失败:', error.message);
      return;
    }

    console.log(`✅ 找到 ${predictions.length} 条预测卷记录`);
    
    // 去重
    const uniquePredictions = [];
    const seen = new Set();

    for (const prediction of predictions) {
      const key = `${prediction.exam_year}-${prediction.exam_date}-${prediction.exam_segment}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniquePredictions.push(prediction);
      }
    }

    console.log(`📊 去重后有 ${uniquePredictions.length} 个独特的预测卷:`);
    uniquePredictions.forEach((p, index) => {
      console.log(`   ${index + 1}. ${p.exam_year}年${p.exam_date} - ${p.exam_segment}`);
    });

    if (uniquePredictions.length === 0) {
      console.log('⚠️  没有找到预测卷，请检查数据导入是否成功');
      return;
    }

    // 2. 测试获取特定预测卷的题目
    console.log('\n2️⃣ 测试获取预测卷题目...');
    const testPrediction = uniquePredictions[0];
    
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('*')
      .eq('exam_year', testPrediction.exam_year)
      .eq('exam_date', testPrediction.exam_date)
      .eq('exam_segment', testPrediction.exam_segment)
      .order('question_number', { ascending: true });

    if (questionsError) {
      console.error('❌ 获取预测卷题目失败:', questionsError.message);
      return;
    }

    console.log(`✅ 成功获取预测卷题目: ${questions.length} 道题`);
    
    // 统计题型分布
    const typeStats = questions.reduce((acc, q) => {
      const type = q.type || 'unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    console.log('📈 题型分布:');
    Object.entries(typeStats).forEach(([type, count]) => {
      console.log(`   ${type}: ${count}题`);
    });

    // 统计科目分布
    const subjectStats = questions.reduce((acc, q) => {
      const subject = q.subject || '未知';
      acc[subject] = (acc[subject] || 0) + 1;
      return acc;
    }, {});

    console.log('📚 科目分布:');
    Object.entries(subjectStats).forEach(([subject, count]) => {
      console.log(`   ${subject}: ${count}题`);
    });

    // 3. 测试API端点
    console.log('\n3️⃣ 测试API端点...');
    
    try {
      // 测试获取预测卷列表API
      const listResponse = await fetch('http://localhost:3000/api/predictions');
      const listResult = await listResponse.json();
      
      if (listResult.success) {
        console.log(`✅ 预测卷列表API正常: 返回 ${listResult.data.length} 个预测卷`);
      } else {
        console.log('❌ 预测卷列表API失败:', listResult.error);
      }

      // 测试获取特定预测卷题目API
      const questionsResponse = await fetch('http://localhost:3000/api/predictions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          exam_year: testPrediction.exam_year,
          exam_date: testPrediction.exam_date,
          exam_segment: testPrediction.exam_segment
        })
      });

      const questionsResult = await questionsResponse.json();
      
      if (questionsResult.success) {
        console.log(`✅ 预测卷题目API正常: 返回 ${questionsResult.data.questions.length} 道题`);
        console.log('📋 预测卷信息:', questionsResult.data.exam_info);
      } else {
        console.log('❌ 预测卷题目API失败:', questionsResult.error);
      }

    } catch (apiError) {
      console.log('⚠️  API测试跳过 (开发服务器可能未启动):', apiError.message);
    }

    // 4. 显示示例题目
    console.log('\n4️⃣ 示例题目预览:');
    const sampleQuestions = questions.slice(0, 3);
    
    sampleQuestions.forEach((q, index) => {
      console.log(`\n📝 题目 ${index + 1} (${q.type}):`);
      console.log(`   问题: ${q.question.substring(0, 100)}${q.question.length > 100 ? '...' : ''}`);
      console.log(`   选项: ${q.options ? Object.keys(q.options).length : 0} 个`);
      console.log(`   答案: ${q.answer}`);
      console.log(`   分值: ${q.points || 1} 分`);
    });

    console.log('\n🎉 预测卷功能测试完成！');
    console.log('\n💡 使用建议:');
    console.log('   1. 访问 http://localhost:3000/exams 查看预测卷');
    console.log('   2. 点击"预测卷"标签页');
    console.log('   3. 选择预测卷开始练习');
    console.log('   4. 预测卷会按题目编号顺序显示');

  } catch (error) {
    console.error('❌ 测试过程中出现错误:', error);
  }
}

// 运行测试
if (require.main === module) {
  testPredictions().then(() => {
    console.log('\n测试完成');
    process.exit(0);
  }).catch(error => {
    console.error('测试失败:', error);
    process.exit(1);
  });
}

module.exports = { testPredictions };
