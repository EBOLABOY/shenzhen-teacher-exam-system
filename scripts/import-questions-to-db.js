#!/usr/bin/env node
/**
 * 真题数据导入到Supabase数据库脚本
 * 将JSON格式的真题数据导入到Supabase数据库中
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Supabase配置 - 需要设置环境变量
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('请设置环境变量 NEXT_PUBLIC_SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * 读取JSON文件
 */
function readJSONFile(filePath) {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`读取文件失败: ${error.message}`);
    return null;
  }
}

/**
 * 转换题目数据格式
 */
function convertQuestionFormat(question, examInfo, sectionInfo) {
  // 处理选项格式
  let options = {};
  if (question.options) {
    options = question.options;
  } else if (sectionInfo.type === "是非题") {
    // 是非题的选项
    options = {
      "A": "正确",
      "B": "错误"
    };
  }

  // 确定题目类型
  let questionType = "multiple_choice";
  if (sectionInfo.type === "多项选择题") {
    questionType = "multiple_select";
  } else if (sectionInfo.type === "是非题") {
    questionType = "true_false";
  }

  // 确定科目
  let subject = "教育学";
  if (sectionInfo.note && sectionInfo.note.includes("教育教学技能")) {
    subject = "教育教学技能";
  } else if (sectionInfo.note && sectionInfo.note.includes("教育教学基础")) {
    subject = "教育教学基础";
  }

  // 确定难度（根据题目编号简单判断）
  let difficulty = "medium";
  if (question.number <= 10) {
    difficulty = "easy";
  } else if (question.number >= 80) {
    difficulty = "hard";
  }

  return {
    question: question.text || "题目内容缺失",
    options: options,
    answer: question.correct_answer || "",
    explanation: question.explanation || "",
    type: questionType,
    subject: subject,
    difficulty: difficulty,
    exam_year: examInfo.year,
    exam_date: examInfo.month_day,
    exam_segment: examInfo.segment,
    section_type: sectionInfo.type,
    points: sectionInfo.points_per_question || 1.0,
    question_number: question.number
  };
}

/**
 * 批量插入题目到数据库
 */
async function insertQuestionsToDatabase(questions) {
  const batchSize = 100; // 每批插入100道题
  let totalInserted = 0;
  
  for (let i = 0; i < questions.length; i += batchSize) {
    const batch = questions.slice(i, i + batchSize);
    
    try {
      const { data, error } = await supabase
        .from('questions')
        .insert(batch);
      
      if (error) {
        console.error(`批量插入失败 (批次 ${Math.floor(i/batchSize) + 1}):`, error);
        continue;
      }
      
      totalInserted += batch.length;
      console.log(`✓ 成功插入第 ${Math.floor(i/batchSize) + 1} 批，共 ${batch.length} 道题`);
    } catch (error) {
      console.error(`插入批次 ${Math.floor(i/batchSize) + 1} 时出错:`, error);
    }
  }
  
  return totalInserted;
}

/**
 * 导入单个JSON文件的数据
 */
async function importQuestionsFromFile(filePath) {
  console.log(`\n开始导入文件: ${filePath}`);
  
  const data = readJSONFile(filePath);
  if (!data) {
    console.error("文件读取失败，跳过导入");
    return 0;
  }

  const examInfo = data.exam_info;
  const questionsToInsert = [];

  console.log(`考试信息: ${examInfo.year}年${examInfo.month_day} ${examInfo.segment}`);

  // 遍历所有题目部分
  data.sections.forEach((section, sectionIndex) => {
    console.log(`\n处理第${sectionIndex + 1}部分: ${section.type} (${section.count}题)`);
    
    if (!section.questions || section.questions.length === 0) {
      console.log("该部分没有题目数据");
      return;
    }

    // 处理每道题目
    section.questions.forEach((question, questionIndex) => {
      try {
        // 跳过缺失的题目
        if (question.text === "缺失" || !question.text) {
          console.log(`跳过第${question.number}题（内容缺失）`);
          return;
        }

        const convertedQuestion = convertQuestionFormat(question, examInfo, section);
        questionsToInsert.push(convertedQuestion);

        if (questionIndex < 3) { // 只显示前3题的详细信息
          console.log(`✓ 第${question.number}题: ${question.text.substring(0, 30)}...`);
        }
      } catch (error) {
        console.error(`处理第${question.number}题时出错: ${error.message}`);
      }
    });

    console.log(`${section.type}部分处理完成，共${section.questions.length}题`);
  });

  // 批量插入到数据库
  const insertedCount = await insertQuestionsToDatabase(questionsToInsert);
  
  console.log(`\n文件导入完成，共导入 ${insertedCount} 道题目`);
  return insertedCount;
}

/**
 * 批量导入真题JSON文件夹中的所有文件
 */
async function importAllQuestions() {
  const jsonDir = path.join(__dirname, '..', '真题JSON');
  
  if (!fs.existsSync(jsonDir)) {
    console.error("真题JSON文件夹不存在");
    return;
  }

  const files = fs.readdirSync(jsonDir).filter(file => file.endsWith('.JSON') || file.endsWith('.json'));
  
  if (files.length === 0) {
    console.log("真题JSON文件夹中没有找到JSON文件");
    return;
  }

  console.log(`找到 ${files.length} 个JSON文件:`);
  files.forEach(file => console.log(`  - ${file}`));

  let totalQuestions = 0;

  for (const file of files) {
    const filePath = path.join(jsonDir, file);
    const imported = await importQuestionsFromFile(filePath);
    totalQuestions += imported;
  }

  console.log(`\n=== 导入总结 ===`);
  console.log(`处理文件数: ${files.length}`);
  console.log(`导入题目总数: ${totalQuestions}`);

  // 生成统计信息
  await generateStatistics();
}

/**
 * 生成统计信息
 */
async function generateStatistics() {
  try {
    const { data: questions, error } = await supabase
      .from('questions')
      .select('type, subject, difficulty, exam_year');
    
    if (error) {
      console.error('获取统计数据失败:', error);
      return;
    }

    const stats = {
      total: questions.length,
      byType: {},
      bySubject: {},
      byDifficulty: {},
      byYear: {}
    };

    questions.forEach(q => {
      // 按类型统计
      stats.byType[q.type] = (stats.byType[q.type] || 0) + 1;
      
      // 按科目统计
      stats.bySubject[q.subject] = (stats.bySubject[q.subject] || 0) + 1;
      
      // 按难度统计
      stats.byDifficulty[q.difficulty] = (stats.byDifficulty[q.difficulty] || 0) + 1;
      
      // 按年份统计
      stats.byYear[q.exam_year] = (stats.byYear[q.exam_year] || 0) + 1;
    });

    console.log(`\n=== 数据统计 ===`);
    console.log(`题目总数: ${stats.total}`);
    console.log(`按类型分布:`, stats.byType);
    console.log(`按科目分布:`, stats.bySubject);
    console.log(`按难度分布:`, stats.byDifficulty);
    console.log(`按年份分布:`, stats.byYear);

    // 保存统计信息
    const statsPath = path.join(__dirname, '..', 'import_statistics_db.json');
    fs.writeFileSync(statsPath, JSON.stringify(stats, null, 2), 'utf8');
    console.log(`统计信息已保存到: ${statsPath}`);
  } catch (error) {
    console.error('生成统计信息失败:', error);
  }
}

// 主程序
if (require.main === module) {
  console.log("=== 深圳教师考编真题数据导入工具（数据库版） ===");
  importAllQuestions().catch(console.error);
}

module.exports = {
  importAllQuestions,
  importQuestionsFromFile
};
