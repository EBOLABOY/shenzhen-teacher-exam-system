#!/usr/bin/env node

/**
 * 简化版题目重复检查脚本
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkDuplicates() {
  console.log('🔍 开始检查重复题目...\n')

  try {
    // 先获取题目总数
    const { count: totalCount, error: countError } = await supabase
      .from('questions')
      .select('*', { count: 'exact', head: true })

    if (countError) {
      console.error('获取题目总数失败:', countError)
      return
    }

    console.log(`📊 数据库中总共有 ${totalCount} 道题目`)

    // 分批获取所有题目，避免内存问题
    const batchSize = 1000
    const allQuestions = []

    for (let offset = 0; offset < totalCount; offset += batchSize) {
      console.log(`正在获取第 ${offset + 1} - ${Math.min(offset + batchSize, totalCount)} 道题目...`)

      const { data: batch, error } = await supabase
        .from('questions')
        .select('id, question, answer, created_at')
        .order('id')
        .range(offset, offset + batchSize - 1)

      if (error) {
        console.error(`获取第 ${offset + 1} 批题目失败:`, error)
        continue
      }

      allQuestions.push(...batch)
    }

    console.log(`✅ 成功获取 ${allQuestions.length} 道题目`)
    
    // 详细的重复检查：相同题目内容和答案
    console.log('\n🔍 开始分析重复题目...')
    const duplicateMap = new Map()
    const duplicates = []
    const first1000 = allQuestions.filter(q => q.id <= 1000)
    const after1000 = allQuestions.filter(q => q.id > 1000)

    console.log(`📊 前1000道题目: ${first1000.length} 道`)
    console.log(`📊 1000道以后题目: ${after1000.length} 道`)

    // 先建立前1000道题目的索引
    first1000.forEach(q => {
      const key = `${q.question.trim()}-${q.answer.trim()}`
      duplicateMap.set(key, q)
    })

    // 检查1000道以后的题目是否与前1000道重复
    const duplicatesAfter1000 = []
    after1000.forEach(q => {
      const key = `${q.question.trim()}-${q.answer.trim()}`
      if (duplicateMap.has(key)) {
        duplicatesAfter1000.push({
          original: duplicateMap.get(key),
          duplicate: q
        })
      }
    })

    // 检查1000道以后题目之间的重复
    const after1000Map = new Map()
    const duplicatesWithinAfter1000 = []
    after1000.forEach(q => {
      const key = `${q.question.trim()}-${q.answer.trim()}`
      if (after1000Map.has(key)) {
        duplicatesWithinAfter1000.push({
          original: after1000Map.get(key),
          duplicate: q
        })
      } else {
        after1000Map.set(key, q)
      }
    })

    // 检查前1000道题目内部的重复
    const first1000Map = new Map()
    const duplicatesWithinFirst1000 = []
    first1000.forEach(q => {
      const key = `${q.question.trim()}-${q.answer.trim()}`
      if (first1000Map.has(key)) {
        duplicatesWithinFirst1000.push({
          original: first1000Map.get(key),
          duplicate: q
        })
      } else {
        first1000Map.set(key, q)
      }
    })

    console.log(`\n📋 重复分析结果:`)
    console.log(`🔸 前1000道题目内部重复: ${duplicatesWithinFirst1000.length} 个`)
    console.log(`🔸 1000道以后与前1000道重复: ${duplicatesAfter1000.length} 个`)
    console.log(`🔸 1000道以后内部重复: ${duplicatesWithinAfter1000.length} 个`)

    const totalDuplicates = duplicatesWithinFirst1000.length + duplicatesAfter1000.length + duplicatesWithinAfter1000.length

    if (totalDuplicates > 0) {
      if (duplicatesWithinFirst1000.length > 0) {
        console.log('\n📋 前1000道题目内部重复:')
        duplicatesWithinFirst1000.slice(0, 5).forEach((dup, index) => {
          console.log(`\n--- 重复 ${index + 1} ---`)
          console.log(`原题目 ID: ${dup.original.id} (${dup.original.created_at?.substring(0, 10)})`)
          console.log(`重复题目 ID: ${dup.duplicate.id} (${dup.duplicate.created_at?.substring(0, 10)})`)
          console.log(`题目内容: ${dup.original.question.substring(0, 50)}...`)
          console.log(`答案: ${dup.original.answer}`)
        })
        if (duplicatesWithinFirst1000.length > 5) {
          console.log(`... 还有 ${duplicatesWithinFirst1000.length - 5} 个重复`)
        }
      }

      if (duplicatesAfter1000.length > 0) {
        console.log('\n📋 1000道以后与前1000道重复:')
        duplicatesAfter1000.slice(0, 10).forEach((dup, index) => {
          console.log(`\n--- 重复 ${index + 1} ---`)
          console.log(`原题目 ID: ${dup.original.id} (前1000道, ${dup.original.created_at?.substring(0, 10)})`)
          console.log(`重复题目 ID: ${dup.duplicate.id} (1000道后, ${dup.duplicate.created_at?.substring(0, 10)})`)
          console.log(`题目内容: ${dup.original.question.substring(0, 50)}...`)
          console.log(`答案: ${dup.original.answer}`)
        })
        if (duplicatesAfter1000.length > 10) {
          console.log(`... 还有 ${duplicatesAfter1000.length - 10} 个重复`)
        }
      }

      if (duplicatesWithinAfter1000.length > 0) {
        console.log('\n📋 1000道以后内部重复:')
        duplicatesWithinAfter1000.slice(0, 5).forEach((dup, index) => {
          console.log(`\n--- 重复 ${index + 1} ---`)
          console.log(`原题目 ID: ${dup.original.id} (${dup.original.created_at?.substring(0, 10)})`)
          console.log(`重复题目 ID: ${dup.duplicate.id} (${dup.duplicate.created_at?.substring(0, 10)})`)
          console.log(`题目内容: ${dup.original.question.substring(0, 50)}...`)
          console.log(`答案: ${dup.original.answer}`)
        })
        if (duplicatesWithinAfter1000.length > 5) {
          console.log(`... 还有 ${duplicatesWithinAfter1000.length - 5} 个重复`)
        }
      }

      console.log(`\n📊 总体统计信息:`)
      console.log(`- 总重复题目数量: ${totalDuplicates}`)
      console.log(`- 可删除的重复题目: ${totalDuplicates}`)
      console.log(`- 删除后剩余题目: ${allQuestions.length - totalDuplicates}`)
      console.log(`- 重复率: ${((totalDuplicates / allQuestions.length) * 100).toFixed(2)}%`)
    } else {
      console.log('✅ 没有找到重复题目，数据库很干净！')
    }
    
  } catch (error) {
    console.error('❌ 检查过程出错:', error)
  }
}

// 运行检查
checkDuplicates()
