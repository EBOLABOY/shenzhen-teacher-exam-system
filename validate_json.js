const fs = require('fs');

function validateJSON(filePath) {
  try {
    console.log(`验证JSON文件: ${filePath}`);
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);
    
    console.log('✅ JSON格式有效');
    console.log(`考试信息: ${data.exam_info.year}年${data.exam_info.month_day} ${data.exam_info.segment}`);
    console.log(`题目部分数: ${data.sections.length}`);
    
    let totalQuestions = 0;
    data.sections.forEach((section, index) => {
      const validQuestions = section.questions.filter(q => q.text !== "缺失" && q.text);
      totalQuestions += validQuestions.length;
      console.log(`第${index + 1}部分 ${section.type}: ${validQuestions.length}/${section.questions.length} 题`);
    });
    
    console.log(`总有效题目数: ${totalQuestions}`);
    return true;
  } catch (error) {
    console.error('❌ JSON格式错误:', error.message);
    return false;
  }
}

// 验证真题JSON文件
validateJSON('真题JSON/20120512.JSON');
