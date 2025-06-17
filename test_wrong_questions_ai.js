#!/usr/bin/env node
/**
 * 测试错题AI分析功能
 */

const AI_CONFIG = {
  baseURL: 'http://154.19.184.12:3000/v1',
  apiKey: 'sk-jb6FLf9xavIBMma8Q3u90BrSpX3uT4bfCOSGAD9g0UK4JQJ4',
  model: 'gemini-2.5-flash-preview-05-20',
  maxTokens: 4000,
  temperature: 0.7,
  timeout: 120000
};

const AI_SYSTEM_PROMPT = `你是一位顶级的教师考编教学专家，尤其擅长将复杂的"教育心理学"、"教育学"和"教育法律法规"知识点讲解得清晰易懂。你的核心任务不再是提供学习计划，而是直接针对学员的错题，进行"一对一"的知识点教学。

请严格遵循以下模式，完成教学任务：

## 核心任务：精准诊断与靶向教学

### 1. 精准诊断薄弱点
- **目标**：分析所有错题，识别出学员最薄弱的学科、章节，并定位到**具体**的知识点层面（例如：不是笼统的"学习动机"，而是"成就动机理论中的'避免失败者'"）。
- **产出**：在分析报告的开头部分，清晰地列出薄弱知识点清单。

### 2. 实施靶向教学 (Targeted Tutoring)
- **理念**：对于每一个诊断出的核心薄弱知识点，你都需要提供一个完整的"微型教学课堂"。
- **教学流程必须包含以下四部分**：
    1.  **核心概念讲解**：用最通俗易懂的语言，解释这个知识点的定义、内涵和关键特征。
    2.  **关联错题剖析**：直接引用学员做错的那道题，分析TA的错误选项为什么不对，正确选项为什么对，将理论与实际题目紧密结合，点出其思维误区。
    3.  **情境化举例**：提供1-2个全新的、易于理解的教学或生活情境例子，来帮助学员加深对该知识点的理解和应用能力。
    4.  **知识结构梳理 (思维导图)**：使用文本缩进的方式，生成一个关于该知识点及其相关概念的迷你思维导图，帮助学员构建清晰的知识结构。

## 输出要求

请必须以JSON格式返回分析结果，字段结构如下。**重点是 \`targeted_tutoring_sessions\` 模块**：

\`\`\`json
{
  "analysis_summary": "简明扼要地总结学员的整体情况，直接点出最核心的1-2个薄弱学科。",
  "weakness_diagnostic": {
    "subject": "最薄弱的科目名称",
    "chapter": "最薄弱的章节",
    "knowledge_points": ["具体薄弱知识点1", "具体薄弱知识点2"]
  },
  "targeted_tutoring_sessions": [
    {
      "knowledge_point": "这里是具体的薄弱知识点名称，如：维果茨基的'最近发展区'",
      "core_concept_explanation": "这里是对'最近发展区'这个核心概念的通俗化讲解。",
      "wrong_question_analysis": {
        "question_stem": "这里复述学员做错的题目题干",
        "user_answer": "学员选择的错误答案",
        "correct_answer": "正确的答案",
        "analysis": "这里分析为什么学员的答案错了，以及正确答案背后的逻辑，将概念与题目紧密结合。"
      },
      "illustrative_examples": [
        "例子1：一个具体的教学场景或生活实例。",
        "例子2：另一个角度的补充例子。"
      ],
      "knowledge_mind_map": {
        "title": "关于'最近发展区'的思维导图",
        "map": [
          "最近发展区 (ZPD)",
          "  - 定义：儿童现有水平与潜在发展水平之间的区域",
          "  - 两个关键水平",
          "    - 现有水平：独立解决问题的能力",
          "    - 潜在水平：在成人或更有能力同伴帮助下能达到的水平",
          "  - 核心思想：教学应走在发展的前面",
          "  - 教育启示",
          "    - 搭建支架 (Scaffolding)",
          "    - 同伴互助学习"
        ]
      }
    }
  ],
  "motivational_message": "一段鼓励的话，强调通过这样的精准学习，可以快速攻克难点。"
}
\`\`\``;

const AI_USER_PROMPT_TEMPLATE = `请以一位教学专家的身份，分析以下教师考编学员的错题情况，并直接教会我掌握那些不熟悉的知识点。

## 错题统计概览
- 总错题数：{totalWrongQuestions}
- 涉及科目：{subjects}
- 题型分布：{questionTypes}
- 难度分布：{difficulties}

## 详细错题数据
{wrongQuestionsDetails}

## 科目错误统计
{subjectStats}

我的核心需求是：
1.  **告诉我**：我具体是哪个学科、哪一章节、哪一个知识点没掌握。
2.  **教会我**：请直接为我讲解这个知识点，并分析我为什么会做错这道题，再用新的例子和思维导图帮我彻底搞懂它。我不需要宽泛的学习方法建议。

请产出一份能让我直接学习并掌握知识的深度分析报告。`;

async function testWrongQuestionsAI() {
  console.log('🧪 测试错题AI分析功能...\n');

  try {
    // 模拟错题数据
    const mockWrongQuestions = `题目1：
题干：教学过程的基本规律是什么？
选项：A. 传授知识与发展智力相统一；B. 教师主导与学生主体相统一；C. 掌握知识与培养能力相统一；D. 以上都是
用户答案：A
正确答案：D
科目：教育学
难度：困难
题型：单选题
错误次数：1
解析：教学过程的基本规律包括传授知识与发展智力相统一、教师主导与学生主体相统一、掌握知识与培养能力相统一等。

题目2：
题干：皮亚杰认知发展理论中，7-11岁儿童处于？
选项：A. 感知运动阶段；B. 前运算阶段；C. 具体运算阶段；D. 形式运算阶段
用户答案：B
正确答案：C
科目：教育心理学
难度：中等
题型：单选题
错误次数：1

题目3：
题干：教师职业道德的核心是？
选项：A. 爱岗敬业；B. 关爱学生；C. 教书育人；D. 为人师表
用户答案：A
正确答案：B
科目：职业道德
难度：中等
题型：单选题
错误次数：1`;

    const userPrompt = AI_USER_PROMPT_TEMPLATE
      .replace('{totalWrongQuestions}', '3')
      .replace('{subjects}', '教育学、教育心理学、职业道德')
      .replace('{questionTypes}', '单选题')
      .replace('{difficulties}', '中等、困难')
      .replace('{wrongQuestionsDetails}', mockWrongQuestions)
      .replace('{subjectStats}', '教育学：1题；教育心理学：1题；职业道德：1题');

    console.log('📝 提示词信息:');
    console.log('- 系统提示词长度:', AI_SYSTEM_PROMPT.length);
    console.log('- 用户提示词长度:', userPrompt.length);

    const requestBody = {
      model: AI_CONFIG.model,
      messages: [
        { role: 'system', content: AI_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: AI_CONFIG.maxTokens,
      temperature: AI_CONFIG.temperature
    };

    console.log('\n🤖 发送AI分析请求...');
    const response = await fetch(AI_CONFIG.baseURL + '/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AI_CONFIG.apiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    console.log('响应状态:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API请求失败:', errorText);
      return;
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content;

    if (!aiResponse) {
      console.error('❌ AI响应为空');
      console.error('完整响应:', JSON.stringify(data, null, 2));
      return;
    }

    console.log('\n✅ AI响应成功');
    console.log('响应长度:', aiResponse.length);
    console.log('响应内容:');
    console.log(aiResponse);

    // 尝试解析JSON
    try {
      const jsonMatch = aiResponse.match(/```json\s*([\s\S]*?)\s*```/) || aiResponse.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : aiResponse;
      const analysisResult = JSON.parse(jsonStr);
      
      console.log('\n🎉 JSON解析成功！');
      console.log('分析结果结构:');
      console.log('- 分析概要:', !!analysisResult.analysis_summary);
      console.log('- 薄弱点诊断:', !!analysisResult.weakness_diagnostic);
      console.log('- 教学课堂数量:', analysisResult.targeted_tutoring_sessions?.length || 0);
      console.log('- 激励信息:', !!analysisResult.motivational_message);
      
    } catch (parseError) {
      console.error('❌ JSON解析失败:', parseError.message);
    }

  } catch (error) {
    console.error('❌ 测试过程中出错:', error.message);
  }
}

// 运行测试
testWrongQuestionsAI().then(() => {
  console.log('\n🎉 测试完成!');
  process.exit(0);
}).catch(error => {
  console.error('\n💥 测试失败:', error);
  process.exit(1);
});
