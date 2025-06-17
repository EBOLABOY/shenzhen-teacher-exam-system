// 检查数据库中的题目数量
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkDatabase() {
  try {
    console.log('=== 数据库题目统计 ===\n');
    
    // 1. 获取总题目数（不使用count，直接查询所有记录，增加限制）
    const { data: allQuestions, error: allError } = await supabase
      .from('questions')
      .select('id, exam_year, exam_date, subject, type')
      .limit(2000); // 增加限制到2000
    
    if (allError) {
      console.error('查询失败:', allError);
      return;
    }
    
    console.log(`实际题目总数: ${allQuestions.length}`);
    
    // 2. 按年份统计
    const byYear = {};
    const bySubject = {};
    const byType = {};
    
    allQuestions.forEach(q => {
      // 按年份
      const year = q.exam_year || '未知';
      byYear[year] = (byYear[year] || 0) + 1;
      
      // 按科目
      const subject = q.subject || '未知';
      bySubject[subject] = (bySubject[subject] || 0) + 1;
      
      // 按类型
      const type = q.type || '未知';
      byType[type] = (byType[type] || 0) + 1;
    });
    
    console.log('\n按年份分布:');
    Object.entries(byYear).sort().forEach(([year, count]) => {
      console.log(`  ${year}: ${count} 道题`);
    });
    
    console.log('\n按科目分布:');
    Object.entries(bySubject).forEach(([subject, count]) => {
      console.log(`  ${subject}: ${count} 道题`);
    });
    
    console.log('\n按题型分布:');
    Object.entries(byType).forEach(([type, count]) => {
      console.log(`  ${type}: ${count} 道题`);
    });
    
    // 3. 检查是否有重复题目
    const questionTexts = allQuestions.map(q => q.id);
    const uniqueTexts = new Set(questionTexts);
    
    console.log(`\n重复检查:`);
    console.log(`  总记录数: ${allQuestions.length}`);
    console.log(`  唯一ID数: ${uniqueTexts.size}`);
    console.log(`  重复记录: ${allQuestions.length - uniqueTexts.size}`);
    
    // 4. 使用count查询验证
    const { count, error: countError } = await supabase
      .from('questions')
      .select('*', { count: 'exact', head: true });
    
    if (!countError) {
      console.log(`\nSupabase count查询结果: ${count}`);
    }
    
    // 5. 检查最近插入的题目
    const { data: recentQuestions, error: recentError } = await supabase
      .from('questions')
      .select('id, question, exam_year, exam_date, created_at')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (!recentError && recentQuestions) {
      console.log('\n最近插入的10道题:');
      recentQuestions.forEach((q, index) => {
        console.log(`  ${index + 1}. ID:${q.id} ${q.exam_year}年${q.exam_date} - ${q.question.substring(0, 30)}...`);
      });
    }
    
  } catch (error) {
    console.error('检查失败:', error);
  }
}

checkDatabase();
