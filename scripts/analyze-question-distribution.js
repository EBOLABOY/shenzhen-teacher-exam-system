#!/usr/bin/env node

/**
 * 分析题目ID分布和选题逻辑
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function analyzeQuestionDistribution() {
  console.log('🔍 分析题目ID分布和选题逻辑...\n')
  
  try {
    // 获取所有题目的ID和基本信息
    const { data: questions, error } = await supabase
      .from('questions')
      .select('id, created_at, exam_year, exam_date')
      .order('id')
    
    if (error) {
      console.error('获取题目失败:', error)
      return
    }
    
    console.log(`📊 数据库中总共有 ${questions.length} 道题目`)
    
    // 分析ID分布
    const ids = questions.map(q => q.id)
    const minId = Math.min(...ids)
    const maxId = Math.max(...ids)
    
    console.log(`\n📋 ID分布分析:`)
    console.log(`- 最小ID: ${minId}`)
    console.log(`- 最大ID: ${maxId}`)
    console.log(`- ID范围: ${maxId - minId + 1}`)
    console.log(`- 实际题目数: ${questions.length}`)
    console.log(`- ID连续性: ${questions.length === (maxId - minId + 1) ? '连续' : '不连续'}`)
    
    // 分析ID段分布
    const ranges = [
      { name: '1-100', min: 1, max: 100 },
      { name: '101-500', min: 101, max: 500 },
      { name: '501-1000', min: 501, max: 1000 },
      { name: '1001-1500', min: 1001, max: 1500 },
      { name: '1501-2000', min: 1501, max: 2000 },
      { name: '2000+', min: 2001, max: Infinity }
    ]
    
    console.log(`\n📊 ID段分布:`)
    ranges.forEach(range => {
      const count = questions.filter(q => q.id >= range.min && q.id <= range.max).length
      if (count > 0) {
        console.log(`- ${range.name}: ${count} 道题目`)
      }
    })
    
    // 分析缺失的ID
    const missingIds = []
    for (let i = minId; i <= maxId; i++) {
      if (!ids.includes(i)) {
        missingIds.push(i)
      }
    }
    
    if (missingIds.length > 0) {
      console.log(`\n⚠️  发现 ${missingIds.length} 个缺失的ID`)
      if (missingIds.length <= 20) {
        console.log(`缺失的ID: ${missingIds.join(', ')}`)
      } else {
        console.log(`缺失的ID (前20个): ${missingIds.slice(0, 20).join(', ')}...`)
      }
    }
    
    // 分析按年份分布
    const yearDistribution = {}
    questions.forEach(q => {
      const year = q.exam_year || '未知年份'
      yearDistribution[year] = (yearDistribution[year] || 0) + 1
    })
    
    console.log(`\n📅 按年份分布:`)
    Object.entries(yearDistribution)
      .sort(([a], [b]) => {
        if (a === '未知年份') return 1
        if (b === '未知年份') return -1
        return parseInt(a) - parseInt(b)
      })
      .forEach(([year, count]) => {
        console.log(`- ${year}: ${count} 道题目`)
      })
    
    // 分析创建时间分布
    const createdDates = questions
      .filter(q => q.created_at)
      .map(q => q.created_at.substring(0, 10))
    
    const dateDistribution = {}
    createdDates.forEach(date => {
      dateDistribution[date] = (dateDistribution[date] || 0) + 1
    })
    
    console.log(`\n📆 按创建日期分布 (显示前10个):`)
    Object.entries(dateDistribution)
      .sort(([a], [b]) => b.localeCompare(a))
      .slice(0, 10)
      .forEach(([date, count]) => {
        console.log(`- ${date}: ${count} 道题目`)
      })
    
    // 模拟当前选题逻辑的问题
    console.log(`\n🎯 选题逻辑分析:`)
    
    // 模拟用户已做1000道题的情况
    const simulatedAnsweredIds = ids.slice(0, Math.min(1000, ids.length))
    const remainingIds = ids.filter(id => !simulatedAnsweredIds.includes(id))
    
    console.log(`- 如果用户已做前${simulatedAnsweredIds.length}道题目`)
    console.log(`- 剩余可选题目: ${remainingIds.length} 道`)
    console.log(`- 剩余题目ID范围: ${remainingIds.length > 0 ? `${Math.min(...remainingIds)} - ${Math.max(...remainingIds)}` : '无'}`)
    
    // 检查是否存在选题逻辑问题
    if (remainingIds.length < 20 && questions.length > 1000) {
      console.log(`\n⚠️  发现潜在问题:`)
      console.log(`- 数据库有 ${questions.length} 道题目`)
      console.log(`- 但用户做完1000道后只剩 ${remainingIds.length} 道可选`)
      console.log(`- 这可能导致用户遇到重复题目或无题可做`)
      
      console.log(`\n💡 建议解决方案:`)
      console.log(`1. 检查选题算法是否正确排除已做题目`)
      console.log(`2. 确保选题范围覆盖所有有效题目ID`)
      console.log(`3. 考虑重新整理题目ID，使其连续`)
    }
    
    // 检查用户答题记录
    console.log(`\n👥 检查用户答题情况...`)
    const { data: userAnswers, error: answersError } = await supabase
      .from('user_answers')
      .select('question_id')
    
    if (!answersError && userAnswers) {
      const answeredQuestionIds = [...new Set(userAnswers.map(a => a.question_id))]
      const validAnsweredIds = answeredQuestionIds.filter(id => ids.includes(id))
      const invalidAnsweredIds = answeredQuestionIds.filter(id => !ids.includes(id))
      
      console.log(`- 用户总答题记录: ${userAnswers.length} 条`)
      console.log(`- 涉及不同题目: ${answeredQuestionIds.length} 道`)
      console.log(`- 有效题目ID: ${validAnsweredIds.length} 道`)
      
      if (invalidAnsweredIds.length > 0) {
        console.log(`- ⚠️  无效题目ID: ${invalidAnsweredIds.length} 道`)
        console.log(`  (这些ID在题目表中不存在: ${invalidAnsweredIds.slice(0, 10).join(', ')}${invalidAnsweredIds.length > 10 ? '...' : ''})`)
      }
      
      // 分析最常被答的题目
      const answerCounts = {}
      userAnswers.forEach(a => {
        answerCounts[a.question_id] = (answerCounts[a.question_id] || 0) + 1
      })
      
      const mostAnswered = Object.entries(answerCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
      
      if (mostAnswered.length > 0) {
        console.log(`\n📊 最常被回答的题目 (可能表明重复问题):`)
        mostAnswered.forEach(([questionId, count], index) => {
          console.log(`${index + 1}. 题目ID ${questionId}: 被回答 ${count} 次`)
        })
      }
    }
    
  } catch (error) {
    console.error('❌ 分析过程出错:', error)
  }
}

// 运行分析
analyzeQuestionDistribution()
