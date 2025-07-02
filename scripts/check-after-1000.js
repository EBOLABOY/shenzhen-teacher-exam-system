#!/usr/bin/env node

/**
 * 专门检查1000道以后题目的重复情况
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkAfter1000() {
  console.log('🔍 专门检查1000道以后的题目重复情况...\n')
  
  try {
    // 获取题目总数
    const { count: totalCount, error: countError } = await supabase
      .from('questions')
      .select('*', { count: 'exact', head: true })
    
    if (countError) {
      console.error('获取题目总数失败:', countError)
      return
    }
    
    console.log(`📊 数据库中总共有 ${totalCount} 道题目`)
    
    // 获取前1000道题目
    console.log('📥 获取前1000道题目...')
    const { data: first1000, error: first1000Error } = await supabase
      .from('questions')
      .select('id, question, answer, created_at, exam_year, exam_date')
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
      .select('id, question, answer, created_at, exam_year, exam_date')
      .gt('id', 1000)
      .order('id')
    
    if (after1000Error) {
      console.error('获取1000道以后题目失败:', after1000Error)
      return
    }
    
    console.log(`✅ 获取到1000道以后题目: ${after1000.length} 道`)
    
    if (after1000.length === 0) {
      console.log('ℹ️  数据库中只有1000道题目，没有更多题目需要检查')
      return
    }
    
    // 建立前1000道题目的索引
    console.log('🔍 建立前1000道题目索引...')
    const first1000Map = new Map()
    first1000.forEach(q => {
      const key = `${q.question.trim()}-${q.answer.trim()}`
      first1000Map.set(key, q)
    })
    
    // 检查1000道以后的题目与前1000道的重复
    console.log('🔍 检查1000道以后题目与前1000道的重复...')
    const duplicatesWithFirst1000 = []
    after1000.forEach(q => {
      const key = `${q.question.trim()}-${q.answer.trim()}`
      if (first1000Map.has(key)) {
        duplicatesWithFirst1000.push({
          original: first1000Map.get(key),
          duplicate: q
        })
      }
    })
    
    // 检查1000道以后题目内部的重复
    console.log('🔍 检查1000道以后题目内部重复...')
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
    
    // 输出结果
    console.log(`\n📋 检查结果:`)
    console.log(`🔸 1000道以后与前1000道重复: ${duplicatesWithFirst1000.length} 个`)
    console.log(`🔸 1000道以后内部重复: ${duplicatesWithinAfter1000.length} 个`)
    
    const totalDuplicatesAfter1000 = duplicatesWithFirst1000.length + duplicatesWithinAfter1000.length
    
    if (totalDuplicatesAfter1000 > 0) {
      console.log(`\n⚠️  发现 ${totalDuplicatesAfter1000} 个重复题目！`)
      
      if (duplicatesWithFirst1000.length > 0) {
        console.log(`\n📋 与前1000道重复的题目 (显示前10个):`)
        duplicatesWithFirst1000.slice(0, 10).forEach((dup, index) => {
          console.log(`\n--- 重复 ${index + 1} ---`)
          console.log(`原题目: ID ${dup.original.id} (${dup.original.exam_year || '未知年份'}-${dup.original.exam_date || '未知日期'})`)
          console.log(`重复题目: ID ${dup.duplicate.id} (${dup.duplicate.exam_year || '未知年份'}-${dup.duplicate.exam_date || '未知日期'})`)
          console.log(`题目内容: ${dup.original.question.substring(0, 80)}...`)
          console.log(`答案: ${dup.original.answer}`)
        })
        if (duplicatesWithFirst1000.length > 10) {
          console.log(`\n... 还有 ${duplicatesWithFirst1000.length - 10} 个与前1000道重复的题目`)
        }
      }
      
      if (duplicatesWithinAfter1000.length > 0) {
        console.log(`\n📋 1000道以后内部重复的题目 (显示前5个):`)
        duplicatesWithinAfter1000.slice(0, 5).forEach((dup, index) => {
          console.log(`\n--- 重复 ${index + 1} ---`)
          console.log(`原题目: ID ${dup.original.id} (${dup.original.exam_year || '未知年份'}-${dup.original.exam_date || '未知日期'})`)
          console.log(`重复题目: ID ${dup.duplicate.id} (${dup.duplicate.exam_year || '未知年份'}-${dup.duplicate.exam_date || '未知日期'})`)
          console.log(`题目内容: ${dup.original.question.substring(0, 80)}...`)
          console.log(`答案: ${dup.original.answer}`)
        })
        if (duplicatesWithinAfter1000.length > 5) {
          console.log(`\n... 还有 ${duplicatesWithinAfter1000.length - 5} 个1000道以后内部重复的题目`)
        }
      }
      
      console.log(`\n📊 统计信息:`)
      console.log(`- 1000道以后总题目数: ${after1000.length}`)
      console.log(`- 重复题目数: ${totalDuplicatesAfter1000}`)
      console.log(`- 1000道以后重复率: ${((totalDuplicatesAfter1000 / after1000.length) * 100).toFixed(2)}%`)
      console.log(`- 如果删除重复题目，1000道以后剩余: ${after1000.length - totalDuplicatesAfter1000} 道`)
      
      // 分析重复题目的来源
      const duplicatesBySource = {}
      duplicatesWithFirst1000.forEach(dup => {
        const source = `${dup.duplicate.exam_year || '未知'}-${dup.duplicate.exam_date || '未知'}`
        duplicatesBySource[source] = (duplicatesBySource[source] || 0) + 1
      })
      
      if (Object.keys(duplicatesBySource).length > 0) {
        console.log(`\n📊 重复题目来源分析:`)
        Object.entries(duplicatesBySource)
          .sort(([,a], [,b]) => b - a)
          .forEach(([source, count]) => {
            console.log(`- ${source}: ${count} 道重复题目`)
          })
      }
      
      console.log(`\n💡 建议:`)
      console.log(`1. 运行去重脚本删除重复题目`)
      console.log(`2. 检查题目导入流程，避免重复导入`)
      console.log(`3. 在导入新题目时加强去重检查`)
      
    } else {
      console.log('✅ 1000道以后的题目没有重复，数据很干净！')
    }
    
  } catch (error) {
    console.error('❌ 检查过程出错:', error)
  }
}

// 运行检查
checkAfter1000()
