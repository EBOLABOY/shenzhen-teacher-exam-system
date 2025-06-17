#!/usr/bin/env node
/**
 * 真题数据导入脚本
 * 将JSON格式的真题数据导入到数据库中
 */

const fs = require('fs');
const path = require('path');

// 模拟数据库操作（实际项目中应该连接真实数据库）
let questionsDatabase = [];

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
    id: question.number,
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
    created_at: new Date().toISOString()
  };
}

/**
 * 导入单个JSON文件的数据
 */
function importQuestionsFromFile(filePath) {
  console.log(`\n开始导入文件: ${filePath}`);
  
  const data = readJSONFile(filePath);
  if (!data) {
    console.error("文件读取失败，跳过导入");
    return 0;
  }

  const examInfo = data.exam_info;
  let totalImported = 0;

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
        
        // 添加到数据库（这里是模拟，实际应该插入真实数据库）
        questionsDatabase.push(convertedQuestion);
        totalImported++;

        if (questionIndex < 3) { // 只显示前3题的详细信息
          console.log(`✓ 第${question.number}题: ${question.text.substring(0, 30)}...`);
        }
      } catch (error) {
        console.error(`处理第${question.number}题时出错: ${error.message}`);
      }
    });

    console.log(`${section.type}部分导入完成，共${section.questions.length}题`);
  });

  console.log(`\n文件导入完成，共导入 ${totalImported} 道题目`);
  return totalImported;
}

/**
 * 批量导入真题JSON文件夹中的所有文件
 */
function importAllQuestions() {
  const jsonDir = path.join(__dirname, '真题JSON');
  
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

  files.forEach(file => {
    const filePath = path.join(jsonDir, file);
    const imported = importQuestionsFromFile(filePath);
    totalQuestions += imported;
  });

  console.log(`\n=== 导入总结 ===`);
  console.log(`处理文件数: ${files.length}`);
  console.log(`导入题目总数: ${totalQuestions}`);
  console.log(`数据库中题目总数: ${questionsDatabase.length}`);

  // 保存到文件（模拟数据库操作）
  saveToDatabase();
}

/**
 * 保存到数据库文件（模拟）
 */
function saveToDatabase() {
  try {
    const outputPath = path.join(__dirname, 'imported_questions.json');
    fs.writeFileSync(outputPath, JSON.stringify(questionsDatabase, null, 2), 'utf8');
    console.log(`\n数据已保存到: ${outputPath}`);
    
    // 生成统计信息
    generateStatistics();
  } catch (error) {
    console.error(`保存数据失败: ${error.message}`);
  }
}

/**
 * 生成统计信息
 */
function generateStatistics() {
  const stats = {
    total: questionsDatabase.length,
    byType: {},
    bySubject: {},
    byDifficulty: {},
    byYear: {}
  };

  questionsDatabase.forEach(q => {
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
  const statsPath = path.join(__dirname, 'import_statistics.json');
  fs.writeFileSync(statsPath, JSON.stringify(stats, null, 2), 'utf8');
  console.log(`统计信息已保存到: ${statsPath}`);
}

// 主程序
if (require.main === module) {
  console.log("=== 深圳教师考编真题数据导入工具 ===");
  importAllQuestions();
}
