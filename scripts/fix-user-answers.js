#!/usr/bin/env node

/**
 * 修复用户答题记录中的无效题目ID
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function fixUserAnswers(dryRun = true) {
  console.log(`🔧 ${dryRun ? '模拟' : '实际'}修复用户答题记录...\n`)
  
  try {
    // 获取所有有效的题目ID
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('id')
    
    if (questionsError) {
      console.error('获取题目ID失败:', questionsError)
      return
    }
    
    const validQuestionIds = new Set(questions.map(q => q.id))
    console.log(`✅ 获取到 ${validQuestionIds.size} 个有效题目ID`)
    
    // 获取所有用户答题记录
    const { data: userAnswers, error: answersError } = await supabase
      .from('user_answers')
      .select('id, question_id, user_id')
    
    if (answersError) {
      console.error('获取用户答题记录失败:', answersError)
      return
    }
    
    console.log(`📊 总共有 ${userAnswers.length} 条用户答题记录`)
    
    // 分析无效记录
    const invalidAnswers = userAnswers.filter(answer => !validQuestionIds.has(answer.question_id))
    const validAnswers = userAnswers.filter(answer => validQuestionIds.has(answer.question_id))
    
    console.log(`\n📋 分析结果:`)
    console.log(`- 有效答题记录: ${validAnswers.length} 条`)
    console.log(`- 无效答题记录: ${invalidAnswers.length} 条`)
    console.log(`- 无效记录比例: ${((invalidAnswers.length / userAnswers.length) * 100).toFixed(2)}%`)
    
    if (invalidAnswers.length === 0) {
      console.log('✅ 所有答题记录都是有效的，无需修复')
      return
    }
    
    // 分析无效记录的分布
    const invalidQuestionIds = {}
    const userStats = {}
    
    invalidAnswers.forEach(answer => {
      // 统计无效题目ID
      invalidQuestionIds[answer.question_id] = (invalidQuestionIds[answer.question_id] || 0) + 1
      
      // 统计每个用户的无效记录
      userStats[answer.user_id] = (userStats[answer.user_id] || 0) + 1
    })
    
    console.log(`\n📊 无效题目ID统计 (显示前10个):`)
    Object.entries(invalidQuestionIds)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .forEach(([questionId, count]) => {
        console.log(`- 题目ID ${questionId}: ${count} 条无效记录`)
      })
    
    console.log(`\n👥 受影响的用户统计:`)
    const affectedUsers = Object.keys(userStats).length
    console.log(`- 受影响用户数: ${affectedUsers}`)
    
    Object.entries(userStats)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .forEach(([userId, count]) => {
        console.log(`- 用户 ${userId.substring(0, 8)}...: ${count} 条无效记录`)
      })
    
    if (!dryRun) {
      console.log(`\n🗑️ 开始删除无效答题记录...`)
      
      // 分批删除无效记录
      const batchSize = 100
      let deletedCount = 0
      
      for (let i = 0; i < invalidAnswers.length; i += batchSize) {
        const batch = invalidAnswers.slice(i, i + batchSize)
        const batchIds = batch.map(answer => answer.id)
        
        console.log(`删除第 ${i + 1} - ${Math.min(i + batchSize, invalidAnswers.length)} 条记录...`)
        
        const { error: deleteError } = await supabase
          .from('user_answers')
          .delete()
          .in('id', batchIds)
        
        if (deleteError) {
          console.error(`删除批次失败:`, deleteError)
        } else {
          deletedCount += batch.length
          console.log(`✅ 成功删除 ${batch.length} 条记录`)
        }
        
        // 添加延迟避免请求过快
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      
      console.log(`\n📊 删除完成:`)
      console.log(`- 成功删除: ${deletedCount} 条无效记录`)
      console.log(`- 保留有效记录: ${validAnswers.length} 条`)
      
      // 同样处理错题记录
      console.log(`\n🔧 检查错题记录...`)
      const { data: wrongQuestions, error: wrongError } = await supabase
        .from('wrong_questions')
        .select('id, question_id')
      
      if (!wrongError && wrongQuestions) {
        const invalidWrongQuestions = wrongQuestions.filter(wq => !validQuestionIds.has(wq.question_id))
        
        if (invalidWrongQuestions.length > 0) {
          console.log(`发现 ${invalidWrongQuestions.length} 条无效错题记录，正在删除...`)
          
          const { error: deleteWrongError } = await supabase
            .from('wrong_questions')
            .delete()
            .in('id', invalidWrongQuestions.map(wq => wq.id))
          
          if (deleteWrongError) {
            console.error('删除无效错题记录失败:', deleteWrongError)
          } else {
            console.log(`✅ 成功删除 ${invalidWrongQuestions.length} 条无效错题记录`)
          }
        } else {
          console.log('✅ 错题记录都是有效的')
        }
      }
      
      // 重新同步用户进度
      console.log(`\n🔄 重新同步用户进度...`)
      try {
        const response = await fetch('http://localhost:3000/api/user-progress/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          }
        })
        
        if (response.ok) {
          console.log('✅ 用户进度同步成功')
        } else {
          console.log('⚠️  用户进度同步失败，请手动同步')
        }
      } catch (error) {
        console.log('⚠️  无法自动同步用户进度，请手动同步')
      }
      
    } else {
      console.log(`\n🧪 这是模拟运行，实际操作将:`)
      console.log(`- 删除 ${invalidAnswers.length} 条无效答题记录`)
      console.log(`- 保留 ${validAnswers.length} 条有效答题记录`)
      console.log(`- 清理相关的错题记录`)
      console.log(`- 重新同步用户进度`)
      console.log(`\n如果要实际执行，请运行: npm run fix-user-answers-real`)
    }
    
    console.log(`\n💡 修复后的效果:`)
    console.log(`- 用户将不再遇到无效题目`)
    console.log(`- 选题算法将正确工作`)
    console.log(`- 用户可以练习所有1000道有效题目`)
    console.log(`- 重复题目问题将得到解决`)
    
  } catch (error) {
    console.error('❌ 修复过程出错:', error)
  }
}

// 检查命令行参数
const args = process.argv.slice(2)
const isRealRun = args.includes('--real') || args.includes('-r')

if (isRealRun) {
  console.log('⚠️  这将实际删除无效的答题记录！')
  fixUserAnswers(false)
} else {
  console.log('🧪 这是模拟运行，不会实际删除记录')
  console.log('如果要实际删除，请添加 --real 参数\n')
  fixUserAnswers(true)
}
