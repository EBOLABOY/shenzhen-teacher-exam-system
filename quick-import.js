// 快速导入真题脚本
require('dotenv').config({ path: '.env.local' });

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('环境变量未设置');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function importQuestions() {
  console.log('开始导入真题...');
  
  const jsonDir = path.join(__dirname, '真题JSON');
  const files = fs.readdirSync(jsonDir).filter(file => 
    file.endsWith('.JSON') || file.endsWith('.json')
  );
  
  console.log(`找到 ${files.length} 个文件`);
  
  let totalImported = 0;
  
  for (const file of files) { // 导入所有文件
    console.log(`\n导入文件: ${file}`);
    
    try {
      const filePath = path.join(jsonDir, file);
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      const examInfo = data.exam_info;
      console.log(`考试: ${examInfo.year}年${examInfo.month_day} ${examInfo.segment}`);
      
      for (const section of data.sections) {
        console.log(`处理: ${section.type} (${section.questions?.length || 0}题)`);
        
        if (!section.questions) continue;
        
        const questionsToInsert = [];
        
        for (const question of section.questions) {
          if (!question.text || question.text === "缺失") continue;
          
          // 确定题目类型
          let questionType = "multiple_choice";
          if (section.type === "多项选择题") {
            questionType = "multiple_select";
          } else if (section.type === "是非题") {
            questionType = "true_false";
          }
          
          // 确定科目
          let subject = "教育学";
          if (section.note && section.note.includes("教育教学技能")) {
            subject = "教育教学技能";
          } else if (section.note && section.note.includes("教育教学基础")) {
            subject = "教育教学基础";
          }
          
          questionsToInsert.push({
            question: question.text,
            options: question.options || {},
            answer: question.correct_answer || "",
            explanation: question.explanation || "",
            type: questionType,
            subject: subject,
            difficulty: "medium",
            exam_year: examInfo.year,
            exam_date: examInfo.month_day,
            exam_segment: examInfo.segment,
            section_type: section.type,
            points: section.points_per_question || 1.0,
            question_number: question.number
          });
        }
        
        if (questionsToInsert.length > 0) {
          // 批量插入
          const { data: insertData, error } = await supabase
            .from('questions')
            .insert(questionsToInsert);
          
          if (error) {
            console.error('插入失败:', error.message);
          } else {
            console.log(`✓ 成功插入 ${questionsToInsert.length} 道题`);
            totalImported += questionsToInsert.length;
          }
        }
      }
    } catch (error) {
      console.error(`处理文件 ${file} 失败:`, error.message);
    }
  }
  
  console.log(`\n=== 导入完成 ===`);
  console.log(`总共导入: ${totalImported} 道题`);
  
  // 查询数据库中的题目总数
  const { data: questions, error } = await supabase
    .from('questions')
    .select('id', { count: 'exact' });
  
  if (!error) {
    console.log(`数据库中现有题目总数: ${questions.length}`);
  }
}

importQuestions().catch(console.error);
