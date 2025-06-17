#!/usr/bin/env node
/**
 * 测试AI分析功能
 * 使用模拟的错题数据测试AI分析服务
 */

const fetch = require('node-fetch');

// 模拟错题数据
const mockWrongQuestions = [
  {
    id: 1,
    question_id: 101,
    user_answer: 'A',
    correct_answer: 'C',
    question_type: 'singleChoice',
    subject: '教育学',
    difficulty: 'medium',
    wrong_count: 2,
    questions: {
      question: '教育的本质是什么？',
      options: {
        A: '传授知识',
        B: '培养人才', 
        C: '促进人的全面发展',
        D: '提高技能'
      },
      explanation: '教育的本质是促进人的全面发展，这是教育学的基本观点。'
    }
  },
  {
    id: 2,
    question_id: 102,
    user_answer: 'AB',
    correct_answer: 'BCE',
    question_type: 'multipleChoice',
    subject: '教育心理学',
    difficulty: 'hard',
    wrong_count: 3,
    questions: {
      question: '影响学习动机的因素包括哪些？',
      options: {
        A: '内在兴趣',
        B: '外在奖励',
        C: '学习目标',
        D: '社会压力',
        E: '自我效能感'
      },
      explanation: '学习动机受多种因素影响，包括外在奖励、学习目标和自我效能感等。'
    }
  },
  {
    id: 3,
    question_id: 103,
    user_answer: 'A',
    correct_answer: 'B',
    question_type: 'trueOrFalse',
    subject: '教育法律法规',
    difficulty: 'easy',
    wrong_count: 1,
    questions: {
      question: '教师有权对学生进行体罚。（）',
      options: {
        A: '正确',
        B: '错误'
      },
      explanation: '根据《教师法》和《未成年人保护法》，教师不得对学生进行体罚。'
    }
  },
  {
    id: 4,
    question_id: 104,
    user_answer: 'B',
    correct_answer: 'A',
    question_type: 'singleChoice',
    subject: '教育学',
    difficulty: 'medium',
    wrong_count: 1,
    questions: {
      question: '班级管理的核心是什么？',
      options: {
        A: '建立良好的师生关系',
        B: '制定班规',
        C: '提高学习成绩',
        D: '维护课堂纪律'
      },
      explanation: '班级管理的核心是建立良好的师生关系，这是有效管理的基础。'
    }
  },
  {
    id: 5,
    question_id: 105,
    user_answer: 'A',
    correct_answer: 'C',
    question_type: 'singleChoice',
    subject: '心理学',
    difficulty: 'hard',
    wrong_count: 2,
    questions: {
      question: '皮亚杰认知发展理论中，7-11岁儿童处于？',
      options: {
        A: '感知运动阶段',
        B: '前运算阶段',
        C: '具体运算阶段',
        D: '形式运算阶段'
      },
      explanation: '根据皮亚杰理论，7-11岁儿童处于具体运算阶段。'
    }
  }
];

async function testAIAnalysis() {
  console.log('🧪 开始测试AI分析功能...\n');
  
  try {
    console.log('📊 模拟错题数据:');
    console.log(`- 总错题数: ${mockWrongQuestions.length}`);
    console.log(`- 涉及科目: ${[...new Set(mockWrongQuestions.map(q => q.subject))].join('、')}`);
    console.log(`- 题型分布: ${[...new Set(mockWrongQuestions.map(q => q.question_type))].join('、')}`);
    console.log(`- 难度分布: ${[...new Set(mockWrongQuestions.map(q => q.difficulty))].join('、')}\n`);

    // 直接测试AI服务
    console.log('🤖 调用AI分析服务...');
    
    const { aiAnalysisService } = require('./src/services/ai-service.ts');
    
    const startTime = Date.now();
    const result = await aiAnalysisService.analyzeWrongQuestions(mockWrongQuestions);
    const endTime = Date.now();
    
    console.log(`✅ AI分析完成，耗时: ${(endTime - startTime) / 1000}秒\n`);
    
    // 显示分析结果
    console.log('📋 分析结果:');
    console.log('='.repeat(50));
    
    console.log('\n📝 分析总结:');
    console.log(result.analysis_summary);
    
    console.log('\n🎯 薄弱科目:');
    result.weak_subjects.forEach((subject, index) => {
      console.log(`${index + 1}. ${subject.subject}`);
      console.log(`   - 错误数量: ${subject.error_count}`);
      console.log(`   - 错误率: ${subject.error_rate}`);
      console.log(`   - 严重程度: ${subject.severity}`);
      console.log(`   - 主要问题: ${subject.main_issues.join('、')}`);
      console.log(`   - 知识盲区: ${subject.knowledge_gaps.join('、')}`);
    });
    
    console.log('\n💡 学习建议:');
    result.learning_recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. [${rec.priority}] ${rec.subject}: ${rec.action}`);
      console.log(`   - 推荐资源: ${rec.resources.join('、')}`);
      console.log(`   - 时间安排: ${rec.timeline}`);
    });
    
    console.log('\n📅 学习计划:');
    console.log(`第一阶段 (${result.study_plan.phase1.duration}):`);
    console.log(`  重点: ${result.study_plan.phase1.focus}`);
    console.log(`  目标: ${result.study_plan.phase1.goals.join('、')}`);
    
    console.log(`第二阶段 (${result.study_plan.phase2.duration}):`);
    console.log(`  重点: ${result.study_plan.phase2.focus}`);
    console.log(`  目标: ${result.study_plan.phase2.goals.join('、')}`);
    
    console.log('\n💪 鼓励信息:');
    console.log(result.motivational_message);
    
    console.log('\n🎉 测试完成！AI分析功能正常工作。');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.error('详细错误:', error);
    
    if (error.message.includes('AI分析超时')) {
      console.log('\n💡 提示: AI分析超时可能是因为:');
      console.log('1. 网络连接问题');
      console.log('2. AI服务响应慢（思考模型需要更长时间）');
      console.log('3. API配置问题');
    }
  }
}

// 运行测试
if (require.main === module) {
  console.log('🧪 AI分析功能测试工具');
  console.log('='.repeat(30));
  testAIAnalysis();
}
