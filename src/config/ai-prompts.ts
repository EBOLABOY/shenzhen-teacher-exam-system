/**
 * AI私教系统提示词配置 (V3.1 - 格式修正版)
 *
 * 核心理念：AI的角色不是“学习教练”，而是“知识私教”。
 * 主要任务：精准定位学员不熟悉的具体知识点，并直接进行教学，通过讲解、举例和思维导图等方式，帮助学员真正理解和掌握。
 *
 * @version 3.1
 */

export const AI_SYSTEM_PROMPT = `你是一位顶级的教师考编教学专家，尤其擅长将复杂的“教育心理学”、“教育学”和“教育法律法规”知识点讲解得清晰易懂。你的核心任务不再是提供学习计划，而是直接针对学员的错题，进行“一对一”的知识点教学。

请严格遵循以下模式，完成教学任务：

## 核心任务：精准诊断与靶向教学

### 1. 精准诊断薄弱点
- **目标**：分析所有错题，识别出学员最薄弱的学科、章节，并定位到**具体**的知识点层面（例如：不是笼统的“学习动机”，而是“成就动机理论中的‘避免失败者’”）。
- **产出**：在分析报告的开头部分，清晰地列出薄弱知识点清单。

### 2. 实施靶向教学 (Targeted Tutoring)
- **理念**：对于每一个诊断出的核心薄弱知识点，你都需要提供一个完整的“微型教学课堂”。
- **教学流程必须包含以下四部分**：
    1.  **核心概念讲解**：用最通俗易懂的语言，解释这个知识点的定义、内涵和关键特征。
    2.  **关联错题剖析**：直接引用学员做错的那道题，分析TA的错误选项为什么不对，正确选项为什么对，将理论与实际题目紧密结合，点出其思维误区。
    3.  **情境化举例**：提供1-2个全新的、易于理解的教学或生活情境例子，来帮助学员加深对该知识点的理解和应用能力。
    4.  **知识结构梳理 (文字+可视化)**：
        - 文字总结：简洁描述知识点的核心结构和关联关系
        - 可视化图表：根据知识特点生成SVG图表（思维导图、流程图、对比表等）
        - 文本备用：提供文本版本的结构化内容，确保兼容性

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
      "knowledge_point": "这里是具体的薄弱知识点名称，如：维果茨基的‘最近发展区’",
      "core_concept_explanation": "这里是对‘最近发展区’这个核心概念的通俗化讲解。",
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
        "title": "关于‘最近发展区’的思维导图",
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
\`\`\`
`

export const AI_USER_PROMPT_TEMPLATE = `请以一位教学专家的身份，分析以下教师考编学员的错题情况，并直接教会我掌握那些不熟悉的知识点。

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

**重要说明**：在knowledge_mind_map字段中，请在现有基础上增加以下字段：
- "summary": 用文字简洁总结该知识点的核心内容和结构关系
- "svg_chart": 生成对应的SVG可视化图表（思维导图、流程图、对比表等）
- "chart_type": 图表类型（如"mindmap"、"flowchart"、"comparison"等）

请产出一份能让我直接学习并掌握知识的深度分析报告。`

// AI配置 (从环境变量读取)
export const AI_CONFIG = {
  baseURL: process.env.AI_BASE_URL || 'http://154.19.184.12:3000/v1',
  apiKey: process.env.AI_API_KEY || '',
  model: process.env.AI_MODEL || 'gemini-2.5-flash-preview-05-20',
  maxTokens: process.env.AI_MAX_TOKENS ? parseInt(process.env.AI_MAX_TOKENS) : undefined, // 不限制，使用模型完整1M上下文
  temperature: parseFloat(process.env.AI_TEMPERATURE || '0.7'),
  timeout: parseInt(process.env.AI_TIMEOUT || '300000'), // 5分钟，适合思考模型
}

// 科目映射 (已根据您的要求合并心理学，并保留细化知识点)
export const SUBJECT_MAPPING = {
  '教育学': {
    name: '教育学',
    description: '教育基本理论、教育目的、教育过程、教学原理等',
    keyTopics: ['教育与教育学', '教育功能', '教育目的与制度', '教师与学生', '课程理论（新课改）', '教学原理（原则、方法、规律）', '德育原理', '班级管理与班主任工作']
  },
  '教育心理学': {
    name: '教育心理学',
    description: '学习心理、教学心理、学生心理发展等，涵盖普通心理学在教育中的应用',
    keyTopics: ['教育心理学概述', '认知发展（皮亚杰/维果茨基）', '人格与社会性发展', '学习理论（行为/认知/建构/人本）', '学习动机', '学习迁移与策略', '知识的学习（陈述性/程序性）', '问题解决与创造性', '品德发展与心理健康', '教师心理']
  },
  '职业道德': {
    name: '教师职业道德',
    description: '教师职业道德规范和职业操守',
    keyTopics: ['教师职业道德概述', '《中小学教师职业道德规范（2008年修订）》详解', '教师职业行为准则', '师德修养', '师德案例分析']
  },
  '教育法律法规': {
    name: '教育法律法规',
    description: '教育相关法律法规和政策',
    keyTopics: ['《中华人民共和国教育法》', '《中华人民共和国义务教育法》', '《中华人民共和国教师法》', '《中华人民共和国未成年人保护法》', '《学生伤害事故处理办法》', '《新时代中小学教师职业行为十项准则》']
  }
}

// 难度级别映射 (保持不变)
export const DIFFICULTY_MAPPING = {
  'easy': { name: '简单', weight: 1 },
  'medium': { name: '中等', weight: 2 },
  'hard': { name: '困难', weight: 3 }
}

// 题型映射 (保持不变)
export const QUESTION_TYPE_MAPPING = {
  'singleChoice': { name: '单选题', description: '单项选择题' },
  'multipleChoice': { name: '多选题', description: '多项选择题' },
  'trueOrFalse': { name: '判断题', description: '判断正误题' },
  'caseStudy': { name: '材料分析题', description: '结合材料进行分析论述' }
}