#!/usr/bin/env node
/**
 * 真题数据API导入脚本
 * 将JSON格式的真题数据通过API导入到应用中
 */

const fs = require('fs');
const path = require('path');

/**
 * 发送HTTP请求（简单实现）
 */
async function makeRequest(url, method = 'GET', data = null) {
  const https = require('http'); // 本地开发使用http
  const urlParts = new URL(url);
  
  const options = {
    hostname: urlParts.hostname,
    port: urlParts.port || 3000,
    path: urlParts.pathname,
    method: method,
    headers: {
      'Content-Type': 'application/json',
    }
  };

  if (data) {
    const jsonData = JSON.stringify(data);
    options.headers['Content-Length'] = Buffer.byteLength(jsonData);
  }

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: parsed });
        } catch (error) {
          resolve({ status: res.statusCode, data: responseData });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

/**
 * 转换题目数据格式
 */
function convertQuestionForAPI(question, examInfo, sectionInfo) {
  // 处理选项格式
  let options = {};
  if (question.options) {
    options = question.options;
  } else if (sectionInfo.type === "是非题") {
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

  // 确定难度
  let difficulty = "medium";
  if (question.number <= 20) {
    difficulty = "easy";
  } else if (question.number >= 70) {
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
    metadata: {
      exam_year: examInfo.year,
      exam_date: examInfo.month_day,
      exam_segment: examInfo.segment,
      section_type: sectionInfo.type,
      points: sectionInfo.points_per_question || 1.0,
      original_number: question.number
    }
  };
}

/**
 * 通过API导入单道题目
 */
async function importQuestionToAPI(questionData, apiUrl = 'http://localhost:3000/api/questions') {
  try {
    const response = await makeRequest(apiUrl, 'POST', questionData);
    return response;
  } catch (error) {
    console.error(`API请求失败: ${error.message}`);
    return { status: 500, error: error.message };
  }
}

/**
 * 导入JSON文件到API
 */
async function importFileToAPI(filePath) {
  console.log(`\n开始导入文件: ${filePath}`);
  
  let data;
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    data = JSON.parse(fileContent);
  } catch (error) {
    console.error(`读取文件失败: ${error.message}`);
    return 0;
  }

  const examInfo = data.exam_info;
  let successCount = 0;
  let failCount = 0;

  console.log(`考试信息: ${examInfo.year}年${examInfo.month_day} ${examInfo.segment}`);

  // 遍历所有题目部分
  for (const section of data.sections) {
    console.log(`\n处理: ${section.type} (${section.count}题)`);
    
    if (!section.questions || section.questions.length === 0) {
      console.log("该部分没有题目数据");
      continue;
    }

    // 处理每道题目
    for (const question of section.questions) {
      // 跳过缺失的题目
      if (question.text === "缺失" || !question.text) {
        console.log(`跳过第${question.number}题（内容缺失）`);
        continue;
      }

      try {
        const questionData = convertQuestionForAPI(question, examInfo, section);
        const response = await importQuestionToAPI(questionData);
        
        if (response.status === 200 || response.status === 201) {
          successCount++;
          if (successCount <= 3) { // 只显示前3题的成功信息
            console.log(`✓ 第${question.number}题导入成功`);
          }
        } else {
          failCount++;
          console.error(`✗ 第${question.number}题导入失败: ${response.status}`);
        }
        
        // 添加延迟避免请求过快
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        failCount++;
        console.error(`✗ 第${question.number}题处理失败: ${error.message}`);
      }
    }
  }

  console.log(`\n文件导入完成:`);
  console.log(`  成功: ${successCount} 题`);
  console.log(`  失败: ${failCount} 题`);
  
  return successCount;
}

/**
 * 检查API服务是否可用
 */
async function checkAPIStatus() {
  try {
    console.log("检查API服务状态...");
    const response = await makeRequest('http://localhost:3000/api/questions');
    
    if (response.status === 200) {
      console.log("✓ API服务正常");
      return true;
    } else {
      console.log(`✗ API服务异常，状态码: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`✗ 无法连接到API服务: ${error.message}`);
    console.log("请确保Next.js开发服务器正在运行 (npm run dev)");
    return false;
  }
}

/**
 * 主导入函数
 */
async function main() {
  console.log("=== 深圳教师考编真题API导入工具 ===");
  
  // 检查API服务
  const apiAvailable = await checkAPIStatus();
  if (!apiAvailable) {
    console.log("\n请先启动Next.js开发服务器:");
    console.log("  npm run dev");
    process.exit(1);
  }

  // 查找JSON文件
  const jsonDir = path.join(__dirname, '真题JSON');
  
  if (!fs.existsSync(jsonDir)) {
    console.error("真题JSON文件夹不存在");
    process.exit(1);
  }

  const files = fs.readdirSync(jsonDir).filter(file => 
    file.endsWith('.JSON') || file.endsWith('.json')
  );
  
  if (files.length === 0) {
    console.log("真题JSON文件夹中没有找到JSON文件");
    process.exit(1);
  }

  console.log(`\n找到 ${files.length} 个JSON文件:`);
  files.forEach(file => console.log(`  - ${file}`));

  let totalImported = 0;

  // 逐个导入文件
  for (const file of files) {
    const filePath = path.join(jsonDir, file);
    const imported = await importFileToAPI(filePath);
    totalImported += imported;
  }

  console.log(`\n=== 导入总结 ===`);
  console.log(`处理文件数: ${files.length}`);
  console.log(`成功导入题目数: ${totalImported}`);
  
  // 验证导入结果
  console.log("\n验证导入结果...");
  try {
    const response = await makeRequest('http://localhost:3000/api/questions');
    if (response.status === 200 && response.data.success) {
      console.log(`✓ 当前数据库中共有 ${response.data.total} 道题目`);
    }
  } catch (error) {
    console.log("无法验证导入结果");
  }
}

// 运行主程序
if (require.main === module) {
  main().catch(error => {
    console.error("程序执行失败:", error);
    process.exit(1);
  });
}

module.exports = { importFileToAPI, checkAPIStatus };
