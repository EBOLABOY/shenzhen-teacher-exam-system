// 测试错题功能修复效果
// 运行命令: node test_wrong_questions_fix.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testWrongQuestionsFix() {
  console.log('🧪 测试错题功能修复效果...\n');

  try {
    // 1. 检查表结构
    console.log('1️⃣ 检查表结构...');
    const { data: sampleData, error: sampleError } = await supabase
      .from('wrong_questions')
      .select('*')
      .limit(1);

    if (sampleError && sampleError.code === 'PGRST106') {
      console.log('❌ wrong_questions表不存在');
      return;
    }

    console.log('✅ wrong_questions表存在');

    // 2. 获取测试题目
    console.log('\n2️⃣ 获取测试题目...');
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('id, subject, difficulty, type, answer')
      .limit(1);

    if (questionsError || !questions || questions.length === 0) {
      console.log('❌ 没有找到测试题目');
      return;
    }

    const testQuestion = questions[0];
    console.log('✅ 找到测试题目:', testQuestion.id);

    // 3. 模拟用户登录（需要真实用户）
    console.log('\n3️⃣ 检查用户认证...');
    
    // 注意：这里需要真实的用户认证，我们先测试匿名访问
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.log('⚠️  没有认证用户，无法测试完整功能');
      console.log('   请确保：');
      console.log('   1. 在Supabase Dashboard中执行了 fix_wrong_questions_complete.sql');
      console.log('   2. 用户已登录系统');
      return;
    }

    console.log('✅ 用户已认证:', user.id.substring(0, 8) + '...');

    // 4. 测试错题插入
    console.log('\n4️⃣ 测试错题插入...');
    const wrongQuestionData = {
      user_id: user.id,
      question_id: testQuestion.id,
      user_answer: 'A',
      correct_answer: testQuestion.answer,
      question_type: testQuestion.type || 'multiple_choice',
      subject: testQuestion.subject,
      difficulty: testQuestion.difficulty,
      wrong_count: 1,
      first_wrong_at: new Date().toISOString(),
      last_wrong_at: new Date().toISOString(),
      is_mastered: false
    };

    const { data: insertResult, error: insertError } = await supabase
      .from('wrong_questions')
      .insert(wrongQuestionData)
      .select();

    if (insertError) {
      console.log('❌ 错题插入失败:', insertError.message);
      console.log('   错误代码:', insertError.code);
      console.log('   可能原因:');
      console.log('   - 表结构未更新（缺少字段）');
      console.log('   - RLS策略未正确配置');
      console.log('   - 用户权限问题');
    } else {
      console.log('✅ 错题插入成功');
      console.log('   插入的记录ID:', insertResult[0].id);

      // 5. 测试错题查询
      console.log('\n5️⃣ 测试错题查询...');
      const { data: queryResult, error: queryError } = await supabase
        .from('wrong_questions')
        .select(`
          *,
          questions (
            id,
            question,
            options,
            answer,
            explanation,
            subject,
            difficulty
          )
        `)
        .eq('user_id', user.id);

      if (queryError) {
        console.log('❌ 错题查询失败:', queryError.message);
      } else {
        console.log('✅ 错题查询成功');
        console.log(`   查询到 ${queryResult.length} 条错题记录`);
        if (queryResult.length > 0) {
          const record = queryResult[0];
          console.log('   记录详情:');
          console.log(`   - 题目ID: ${record.question_id}`);
          console.log(`   - 用户答案: ${record.user_answer}`);
          console.log(`   - 正确答案: ${record.correct_answer}`);
          console.log(`   - 科目: ${record.subject}`);
          console.log(`   - 难度: ${record.difficulty}`);
        }
      }

      // 6. 测试错题更新
      console.log('\n6️⃣ 测试错题更新...');
      const { data: updateResult, error: updateError } = await supabase
        .from('wrong_questions')
        .update({
          wrong_count: 2,
          last_wrong_at: new Date().toISOString(),
          user_answer: 'B'
        })
        .eq('id', insertResult[0].id)
        .select();

      if (updateError) {
        console.log('❌ 错题更新失败:', updateError.message);
      } else {
        console.log('✅ 错题更新成功');
        console.log('   更新后错误次数:', updateResult[0].wrong_count);
      }

      // 7. 清理测试数据
      console.log('\n7️⃣ 清理测试数据...');
      const { error: deleteError } = await supabase
        .from('wrong_questions')
        .delete()
        .eq('id', insertResult[0].id);

      if (deleteError) {
        console.log('❌ 清理测试数据失败:', deleteError.message);
      } else {
        console.log('✅ 测试数据已清理');
      }
    }

    // 8. 总结
    console.log('\n8️⃣ 测试总结...');
    if (!insertError && !queryError && !updateError) {
      console.log('🎉 错题功能修复成功！');
      console.log('   ✅ 表结构正确');
      console.log('   ✅ RLS策略正常');
      console.log('   ✅ 插入功能正常');
      console.log('   ✅ 查询功能正常');
      console.log('   ✅ 更新功能正常');
    } else {
      console.log('⚠️  部分功能仍有问题，请检查：');
      console.log('   1. 是否执行了完整的修复SQL脚本');
      console.log('   2. 是否有用户认证');
      console.log('   3. RLS策略是否正确配置');
    }

  } catch (error) {
    console.error('❌ 测试过程中出现错误:', error.message);
  }
}

// 运行测试
testWrongQuestionsFix();
