#!/usr/bin/env node
/**
 * 测试所有API的选项格式是否正确
 */

// 使用Node.js内置的fetch API (Node.js 18+)
// 如果是较老版本的Node.js，请安装node-fetch: npm install node-fetch

async function testAllAPIs() {
  console.log('🔍 测试所有API的选项格式...\n');
  
  const baseUrl = 'http://localhost:3000';
  const tests = [];
  
  try {
    // 1. 测试智能刷题API
    console.log('1️⃣ 测试智能刷题API (/api/questions)...');
    try {
      const response = await fetch(`${baseUrl}/api/questions?limit=3`);
      const data = await response.json();
      
      if (data.success && data.data.length > 0) {
        const question = data.data[0];
        console.log(`   ✅ 智能刷题API正常`);
        console.log(`   📝 题目: ${question.question.substring(0, 50)}...`);
        console.log(`   🔧 选项类型: ${typeof question.options}`);
        console.log(`   📊 选项数量: ${Object.keys(question.options || {}).length}`);
        
        if (typeof question.options === 'object' && question.options !== null) {
          console.log(`   ✅ 选项格式正确`);
        } else {
          console.log(`   ❌ 选项格式错误: ${JSON.stringify(question.options)}`);
        }
      } else {
        console.log(`   ❌ 智能刷题API失败: ${data.error || '无数据'}`);
      }
    } catch (error) {
      console.log(`   ❌ 智能刷题API错误: ${error.message}`);
    }
    
    console.log('');
    
    // 2. 测试历年真题API
    console.log('2️⃣ 测试历年真题API (/api/exams)...');
    try {
      // 先获取可用的考试列表
      const examListResponse = await fetch(`${baseUrl}/api/exams`);
      const examListData = await examListResponse.json();
      
      if (examListData.success && examListData.data.length > 0) {
        const exam = examListData.data[0];
        
        // 获取具体考试题目
        const examResponse = await fetch(`${baseUrl}/api/exams`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            exam_year: exam.exam_year,
            exam_date: exam.exam_date,
            exam_segment: exam.exam_segment
          })
        });
        
        const examData = await examResponse.json();
        
        if (examData.success && examData.data.length > 0) {
          const question = examData.data[0];
          console.log(`   ✅ 历年真题API正常`);
          console.log(`   📝 考试: ${exam.exam_year}年${exam.exam_date}`);
          console.log(`   📝 题目: ${question.question.substring(0, 50)}...`);
          console.log(`   🔧 选项类型: ${typeof question.options}`);
          console.log(`   📊 选项数量: ${Object.keys(question.options || {}).length}`);
          
          if (typeof question.options === 'object' && question.options !== null) {
            console.log(`   ✅ 选项格式正确`);
          } else {
            console.log(`   ❌ 选项格式错误: ${JSON.stringify(question.options)}`);
          }
        } else {
          console.log(`   ❌ 历年真题题目获取失败: ${examData.error || '无数据'}`);
        }
      } else {
        console.log(`   ❌ 历年真题列表获取失败: ${examListData.error || '无数据'}`);
      }
    } catch (error) {
      console.log(`   ❌ 历年真题API错误: ${error.message}`);
    }
    
    console.log('');
    
    // 3. 测试预测卷API
    console.log('3️⃣ 测试预测卷API (/api/predictions)...');
    try {
      // 先获取可用的预测卷列表
      const predictionListResponse = await fetch(`${baseUrl}/api/predictions`);
      const predictionListData = await predictionListResponse.json();
      
      if (predictionListData.success && predictionListData.data.length > 0) {
        const prediction = predictionListData.data[0];
        
        // 获取具体预测卷题目
        const predictionResponse = await fetch(`${baseUrl}/api/predictions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            exam_year: prediction.exam_year,
            exam_date: prediction.exam_date,
            exam_segment: prediction.exam_segment
          })
        });
        
        const predictionData = await predictionResponse.json();
        
        if (predictionData.success && predictionData.data.questions.length > 0) {
          const question = predictionData.data.questions[0];
          console.log(`   ✅ 预测卷API正常`);
          console.log(`   📝 预测卷: ${prediction.exam_year}年${prediction.exam_date}`);
          console.log(`   📝 题目: ${question.question.substring(0, 50)}...`);
          console.log(`   🔧 选项类型: ${typeof question.options}`);
          console.log(`   📊 选项数量: ${Object.keys(question.options || {}).length}`);
          
          if (typeof question.options === 'object' && question.options !== null) {
            console.log(`   ✅ 选项格式正确`);
          } else {
            console.log(`   ❌ 选项格式错误: ${JSON.stringify(question.options)}`);
          }
        } else {
          console.log(`   ❌ 预测卷题目获取失败: ${predictionData.error || '无数据'}`);
        }
      } else {
        console.log(`   ❌ 预测卷列表获取失败: ${predictionListData.error || '无数据'}`);
      }
    } catch (error) {
      console.log(`   ❌ 预测卷API错误: ${error.message}`);
    }
    
    console.log('');
    console.log('🎉 API测试完成！');
    console.log('');
    console.log('💡 如果发现选项格式错误，请：');
    console.log('   1. 检查数据库中的选项数据格式');
    console.log('   2. 确认API是否正确处理选项格式转换');
    console.log('   3. 重新运行修复预测卷功能');
    
  } catch (error) {
    console.error('❌ 测试过程中出现错误:', error);
  }
}

testAllAPIs()
  .then(() => {
    console.log('\n✅ 测试完成');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ 测试失败:', error);
    process.exit(1);
  });
