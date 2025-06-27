require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixNow() {
  console.log('🔧 开始修复选项格式...');
  
  try {
    // 获取所有题目
    const { data: questions, error } = await supabase
      .from('questions')
      .select('id, options')
      .limit(2000);
    
    if (error) throw error;
    
    console.log(`📊 检查 ${questions.length} 道题目`);
    
    const toFix = [];
    let stringCount = 0;
    let objectCount = 0;
    
    for (const q of questions) {
      if (typeof q.options === 'string') {
        stringCount++;
        try {
          const parsed = JSON.parse(q.options);
          if (typeof parsed === 'object' && parsed !== null) {
            toFix.push({ id: q.id, options: parsed });
          }
        } catch (e) {
          // 忽略无法解析的
        }
      } else {
        objectCount++;
      }
    }
    
    console.log(`📈 字符串格式: ${stringCount}, 对象格式: ${objectCount}, 需修复: ${toFix.length}`);
    
    if (toFix.length === 0) {
      console.log('✅ 无需修复!');
      return;
    }
    
    // 批量修复
    console.log(`🔧 修复 ${toFix.length} 道题目...`);
    let fixed = 0;
    
    for (const item of toFix) {
      const { error: updateError } = await supabase
        .from('questions')
        .update({ options: item.options })
        .eq('id', item.id);
      
      if (!updateError) {
        fixed++;
        if (fixed % 20 === 0) {
          console.log(`已修复 ${fixed}/${toFix.length}`);
        }
      }
    }
    
    console.log(`✅ 修复完成! 成功: ${fixed}, 总计: ${toFix.length}`);
    
  } catch (error) {
    console.error('❌ 修复失败:', error);
  }
}

fixNow();
