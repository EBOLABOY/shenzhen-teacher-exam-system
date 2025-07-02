#!/usr/bin/env node

/**
 * 专门删除1000道以后的重复题目
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function removeDuplicatesAfter1000(dryRun = true) {
  console.log(`🔍 ${dryRun ? '模拟' : '实际'}删除1000道以后的重复题目...\n`)
  
  try {
    // 获取前1000道题目
    console.log('📥 获取前1000道题目...')
    const { data: first1000, error: first1000Error } = await supabase
      .from('questions')
      .select('id, question, answer')
      .lte('id', 1000)
      .order('id')
    
    if (first1000Error) {
      console.error('获取前1000道题目失败:', first1000Error)
      return
    }
    
    console.log(`✅ 获取到前1000道题目: ${first1000.length} 道`)
    
    // 获取1000道以后的题目
    console.log('📥 获取1000道以后的题目...')
    const { data: after1000, error: after1000Error } = await supabase
      .from('questions')
      .select('id, question, answer, created_at')
      .gt('id', 1000)
      .order('id')
    
    if (after1000Error) {
      console.error('获取1000道以后题目失败:', after1000Error)
      return
    }
    
    console.log(`✅ 获取到1000道以后题目: ${after1000.length} 道`)
    
    if (after1000.length === 0) {
      console.log('ℹ️  没有1000道以后的题目需要处理')
      return
    }
    
    // 建立前1000道题目的索引
    const first1000Set = new Set()
    first1000.forEach(q => {
      const key = `${q.question.trim()}-${q.answer.trim()}`
      first1000Set.add(key)
    })
    
    // 找出与前1000道重复的题目
    const duplicatesWithFirst1000 = []
    after1000.forEach(q => {
      const key = `${q.question.trim()}-${q.answer.trim()}`
      if (first1000Set.has(key)) {
        duplicatesWithFirst1000.push(q)
      }
    })
    
    // 找出1000道以后内部重复的题目
    const after1000Map = new Map()
    const duplicatesWithinAfter1000 = []
    after1000.forEach(q => {
      const key = `${q.question.trim()}-${q.answer.trim()}`
      if (after1000Map.has(key)) {
        // 保留ID较小的（较早的），删除ID较大的
        const existing = after1000Map.get(key)
        if (q.id > existing.id) {
          duplicatesWithinAfter1000.push(q)
        } else {
          duplicatesWithinAfter1000.push(existing)
          after1000Map.set(key, q)
        }
      } else {
        after1000Map.set(key, q)
      }
    })
    
    const allDuplicatesToDelete = [...duplicatesWithFirst1000, ...duplicatesWithinAfter1000]
    
    console.log(`\n📊 发现重复题目:`)
    console.log(`- 与前1000道重复: ${duplicatesWithFirst1000.length} 道`)
    console.log(`- 1000道以后内部重复: ${duplicatesWithinAfter1000.length} 道`)
    console.log(`- 总计需要删除: ${allDuplicatesToDelete.length} 道`)
    
    if (allDuplicatesToDelete.length === 0) {
      console.log('✅ 没有发现重复题目，无需删除')
      return
    }
    
    // 显示将要删除的题目
    console.log(`\n📋 ${dryRun ? '将要' : '正在'}删除的题目 (显示前10个):`)
    allDuplicatesToDelete.slice(0, 10).forEach((q, index) => {
      console.log(`${index + 1}. ID: ${q.id} - ${q.question.substring(0, 50)}...`)
    })
    
    if (allDuplicatesToDelete.length > 10) {
      console.log(`... 还有 ${allDuplicatesToDelete.length - 10} 道题目`)
    }
    
    if (!dryRun) {
      console.log('\n🗑️ 开始删除重复题目...')
      let deletedCount = 0
      let errorCount = 0
      
      // 分批删除，避免一次性删除太多
      const batchSize = 50
      for (let i = 0; i < allDuplicatesToDelete.length; i += batchSize) {
        const batch = allDuplicatesToDelete.slice(i, i + batchSize)
        const batchIds = batch.map(q => q.id)
        
        console.log(`删除第 ${i + 1} - ${Math.min(i + batchSize, allDuplicatesToDelete.length)} 道题目...`)
        
        try {
          // 先检查并转移用户答题记录
          const { data: userAnswers } = await supabase
            .from('user_answers')
            .select('id, question_id')
            .in('question_id', batchIds)
          
          if (userAnswers && userAnswers.length > 0) {
            console.log(`  ⚠️  发现 ${userAnswers.length} 条用户答题记录，将删除这些记录`)
            
            const { error: deleteAnswersError } = await supabase
              .from('user_answers')
              .delete()
              .in('question_id', batchIds)
            
            if (deleteAnswersError) {
              console.error(`  删除用户答题记录失败:`, deleteAnswersError)
            }
          }
          
          // 检查并转移错题记录
          const { data: wrongQuestions } = await supabase
            .from('wrong_questions')
            .select('id, question_id')
            .in('question_id', batchIds)
          
          if (wrongQuestions && wrongQuestions.length > 0) {
            console.log(`  ⚠️  发现 ${wrongQuestions.length} 条错题记录，将删除这些记录`)
            
            const { error: deleteWrongError } = await supabase
              .from('wrong_questions')
              .delete()
              .in('question_id', batchIds)
            
            if (deleteWrongError) {
              console.error(`  删除错题记录失败:`, deleteWrongError)
            }
          }
          
          // 删除题目
          const { error: deleteError } = await supabase
            .from('questions')
            .delete()
            .in('id', batchIds)
          
          if (deleteError) {
            console.error(`  删除题目失败:`, deleteError)
            errorCount += batch.length
          } else {
            console.log(`  ✅ 成功删除 ${batch.length} 道题目`)
            deletedCount += batch.length
          }
          
        } catch (error) {
          console.error(`  批次删除失败:`, error)
          errorCount += batch.length
        }
        
        // 添加延迟避免请求过快
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      
      console.log(`\n📊 删除完成:`)
      console.log(`- 成功删除: ${deletedCount} 道题目`)
      console.log(`- 删除失败: ${errorCount} 道题目`)
      console.log(`- 删除后1000道以后剩余: ${after1000.length - deletedCount} 道题目`)
      
    } else {
      console.log(`\n🧪 这是模拟运行，没有实际删除任何题目`)
      console.log(`如果要实际删除，请运行: node scripts/remove-duplicates-after-1000.js --real`)
    }
    
  } catch (error) {
    console.error('❌ 处理过程出错:', error)
  }
}

// 检查命令行参数
const args = process.argv.slice(2)
const isRealRun = args.includes('--real') || args.includes('-r')

if (isRealRun) {
  console.log('⚠️  这将实际删除重复题目！')
  removeDuplicatesAfter1000(false)
} else {
  console.log('🧪 这是模拟运行，不会实际删除题目')
  console.log('如果要实际删除，请添加 --real 参数\n')
  removeDuplicatesAfter1000(true)
}
