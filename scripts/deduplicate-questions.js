#!/usr/bin/env node

/**
 * 题目去重脚本
 * 检查并清理数据库中的重复题目
 */

require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// 计算题目相似度
function calculateSimilarity(q1, q2) {
  // 简单的文本相似度计算
  const text1 = q1.question.toLowerCase().replace(/\s+/g, ' ').trim()
  const text2 = q2.question.toLowerCase().replace(/\s+/g, ' ').trim()
  
  // 完全相同
  if (text1 === text2) return 1.0
  
  // 计算编辑距离相似度
  const maxLen = Math.max(text1.length, text2.length)
  if (maxLen === 0) return 1.0
  
  const distance = levenshteinDistance(text1, text2)
  return 1 - (distance / maxLen)
}

// 计算编辑距离
function levenshteinDistance(str1, str2) {
  const matrix = []
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i]
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }
  
  return matrix[str2.length][str1.length]
}

// 检查选项是否相同
function optionsEqual(options1, options2) {
  try {
    const opts1 = typeof options1 === 'string' ? JSON.parse(options1) : options1
    const opts2 = typeof options2 === 'string' ? JSON.parse(options2) : options2
    
    return JSON.stringify(opts1) === JSON.stringify(opts2)
  } catch (error) {
    return false
  }
}

async function findDuplicateQuestions() {
  console.log('🔍 开始查找重复题目...\n')
  
  // 获取所有题目
  const { data: questions, error } = await supabase
    .from('questions')
    .select('*')
    .order('id')
  
  if (error) {
    console.error('获取题目失败:', error)
    return
  }
  
  console.log(`📊 总共找到 ${questions.length} 道题目`)
  
  const duplicateGroups = []
  const processed = new Set()
  
  for (let i = 0; i < questions.length; i++) {
    if (processed.has(questions[i].id)) continue
    
    const currentQuestion = questions[i]
    const duplicates = [currentQuestion]
    processed.add(currentQuestion.id)
    
    // 查找与当前题目相似的题目
    for (let j = i + 1; j < questions.length; j++) {
      if (processed.has(questions[j].id)) continue
      
      const compareQuestion = questions[j]
      const similarity = calculateSimilarity(currentQuestion, compareQuestion)
      
      // 如果相似度很高，认为是重复题目
      if (similarity > 0.9 || 
          (currentQuestion.question === compareQuestion.question && 
           currentQuestion.answer === compareQuestion.answer)) {
        duplicates.push(compareQuestion)
        processed.add(compareQuestion.id)
      }
    }
    
    // 如果找到重复题目，加入重复组
    if (duplicates.length > 1) {
      duplicateGroups.push(duplicates)
    }
  }
  
  console.log(`\n🔍 找到 ${duplicateGroups.length} 组重复题目`)
  
  return { questions, duplicateGroups }
}

async function showDuplicateAnalysis(duplicateGroups) {
  console.log('\n📋 重复题目分析:')
  
  let totalDuplicates = 0
  
  duplicateGroups.forEach((group, index) => {
    console.log(`\n--- 重复组 ${index + 1} ---`)
    console.log(`重复数量: ${group.length} 道题目`)
    
    group.forEach((q, i) => {
      console.log(`  ${i + 1}. ID: ${q.id} | 创建时间: ${q.created_at?.substring(0, 10)} | 题目: ${q.question.substring(0, 50)}...`)
    })
    
    totalDuplicates += group.length - 1 // 每组保留一个，其余为重复
  })
  
  console.log(`\n📊 统计信息:`)
  console.log(`- 重复题目组数: ${duplicateGroups.length}`)
  console.log(`- 可删除的重复题目: ${totalDuplicates} 道`)
  console.log(`- 删除后剩余题目: ${await getTotalQuestions() - totalDuplicates} 道`)
}

async function getTotalQuestions() {
  const { count } = await supabase
    .from('questions')
    .select('*', { count: 'exact', head: true })
  return count || 0
}

async function removeDuplicates(duplicateGroups, dryRun = true) {
  console.log(`\n${dryRun ? '🧪 模拟' : '🗑️ 实际'}删除重复题目...`)
  
  let deletedCount = 0
  const deletedIds = []
  
  for (const group of duplicateGroups) {
    // 保留第一个题目（通常是最早创建的），删除其余的
    const [keep, ...toDelete] = group.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    
    console.log(`\n保留题目 ID: ${keep.id} (${keep.created_at?.substring(0, 10)})`)
    console.log(`删除题目 ID: ${toDelete.map(q => q.id).join(', ')}`)
    
    for (const question of toDelete) {
      if (!dryRun) {
        // 首先检查是否有用户答题记录
        const { data: userAnswers } = await supabase
          .from('user_answers')
          .select('id')
          .eq('question_id', question.id)
          .limit(1)
        
        if (userAnswers && userAnswers.length > 0) {
          console.log(`  ⚠️  题目 ${question.id} 有用户答题记录，将答题记录转移到保留题目`)
          
          // 将答题记录转移到保留的题目
          const { error: updateError } = await supabase
            .from('user_answers')
            .update({ question_id: keep.id })
            .eq('question_id', question.id)
          
          if (updateError) {
            console.error(`    转移答题记录失败:`, updateError)
            continue
          }
        }
        
        // 检查错题记录
        const { data: wrongQuestions } = await supabase
          .from('wrong_questions')
          .select('id')
          .eq('question_id', question.id)
          .limit(1)
        
        if (wrongQuestions && wrongQuestions.length > 0) {
          console.log(`  ⚠️  题目 ${question.id} 有错题记录，将错题记录转移到保留题目`)
          
          // 将错题记录转移到保留的题目
          const { error: updateError } = await supabase
            .from('wrong_questions')
            .update({ question_id: keep.id })
            .eq('question_id', question.id)
          
          if (updateError) {
            console.error(`    转移错题记录失败:`, updateError)
            continue
          }
        }
        
        // 删除重复题目
        const { error: deleteError } = await supabase
          .from('questions')
          .delete()
          .eq('id', question.id)
        
        if (deleteError) {
          console.error(`  ❌ 删除题目 ${question.id} 失败:`, deleteError)
        } else {
          console.log(`  ✅ 已删除题目 ${question.id}`)
          deletedCount++
          deletedIds.push(question.id)
        }
      } else {
        console.log(`  🧪 将删除题目 ${question.id}`)
        deletedCount++
        deletedIds.push(question.id)
      }
    }
  }
  
  console.log(`\n${dryRun ? '模拟' : '实际'}删除完成:`)
  console.log(`- ${dryRun ? '将' : '已'}删除 ${deletedCount} 道重复题目`)
  console.log(`- 删除的题目ID: ${deletedIds.join(', ')}`)
  
  return { deletedCount, deletedIds }
}

async function main() {
  try {
    console.log('🚀 开始题目去重处理...\n')
    
    // 1. 查找重复题目
    const { questions, duplicateGroups } = await findDuplicateQuestions()
    
    if (duplicateGroups.length === 0) {
      console.log('✅ 没有找到重复题目，数据库很干净！')
      return
    }
    
    // 2. 显示重复分析
    await showDuplicateAnalysis(duplicateGroups)
    
    // 3. 询问用户是否要删除
    const readline = require('readline')
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })
    
    const question = (query) => new Promise(resolve => rl.question(query, resolve))
    
    console.log('\n❓ 请选择操作:')
    console.log('1. 模拟删除 (查看将要删除的题目，不实际删除)')
    console.log('2. 实际删除 (真正删除重复题目)')
    console.log('3. 退出')
    
    const choice = await question('请输入选择 (1/2/3): ')
    
    if (choice === '1') {
      await removeDuplicates(duplicateGroups, true)
    } else if (choice === '2') {
      const confirm = await question('⚠️  确定要删除重复题目吗？这个操作不可撤销！(y/N): ')
      if (confirm.toLowerCase() === 'y' || confirm.toLowerCase() === 'yes') {
        await removeDuplicates(duplicateGroups, false)
        console.log('\n✅ 题目去重完成！')
      } else {
        console.log('❌ 操作已取消')
      }
    } else {
      console.log('👋 退出程序')
    }
    
    rl.close()
    
  } catch (error) {
    console.error('❌ 程序执行出错:', error)
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main()
}
