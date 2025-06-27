import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 开始修复预测卷数据...')

    // 1. 删除现有预测卷数据
    console.log('1️⃣ 删除现有预测卷数据...')
    const { error: deleteError } = await supabase
      .from('questions')
      .delete()
      .eq('exam_year', 2025)
      .eq('exam_date', '7月5日')

    if (deleteError) {
      console.error('❌ 删除失败:', deleteError.message)
      return NextResponse.json({ 
        success: false, 
        error: `删除现有数据失败: ${deleteError.message}` 
      }, { status: 500 })
    }

    console.log('✅ 现有预测卷数据已删除')

    // 2. 读取JSON文件
    console.log('2️⃣ 读取JSON文件...')
    const jsonPath = path.join(process.cwd(), '真题JSON', '2025年7月5日(预测题).json')
    
    if (!fs.existsSync(jsonPath)) {
      return NextResponse.json({ 
        success: false, 
        error: '预测卷JSON文件不存在' 
      }, { status: 404 })
    }

    const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'))
    console.log('✅ JSON文件读取成功')

    // 3. 准备题目数据
    console.log('3️⃣ 准备题目数据...')
    const questionsToInsert: any[] = []

    jsonData.sections.forEach((section: any) => {
      let questionType = 'multiple_choice'
      if (section.type === '多项选择题') {
        questionType = 'multiple_select'
      } else if (section.type === '是非题') {
        questionType = 'true_false'
      }

      section.questions.forEach((q: any) => {
        questionsToInsert.push({
          question: q.text,
          options: q.options || {},
          answer: q.correct_answer,
          explanation: q.explanation || '',
          type: questionType,
          subject: '教育学',
          difficulty: 'medium',
          points: section.points_per_question || 1,
          exam_year: 2025,
          exam_date: '7月5日',
          exam_segment: '小学客观题预测'
        })
      })
    })

    console.log(`📝 准备导入 ${questionsToInsert.length} 道题目`)

    // 4. 分批导入
    console.log('4️⃣ 开始导入...')
    const batchSize = 50
    let importedCount = 0
    const errors: string[] = []

    for (let i = 0; i < questionsToInsert.length; i += batchSize) {
      const batch = questionsToInsert.slice(i, i + batchSize)

      const { error: insertError } = await supabase
        .from('questions')
        .insert(batch)

      if (insertError) {
        const errorMsg = `导入批次 ${Math.floor(i/batchSize) + 1} 失败: ${insertError.message}`
        console.error('❌', errorMsg)
        errors.push(errorMsg)
        break
      }

      importedCount += batch.length
      const progress = ((importedCount / questionsToInsert.length) * 100).toFixed(1)
      console.log(`✅ 已导入 ${importedCount}/${questionsToInsert.length} 道题 (${progress}%)`)
    }

    // 5. 验证结果
    console.log('5️⃣ 验证结果...')
    const { data: finalData, error: finalError } = await supabase
      .from('questions')
      .select('id, type')
      .eq('exam_year', 2025)
      .eq('exam_date', '7月5日')

    if (finalError) {
      return NextResponse.json({ 
        success: false, 
        error: `验证失败: ${finalError.message}` 
      }, { status: 500 })
    }

    const stats: Record<string, number> = {}
    finalData.forEach((q: any) => {
      stats[q.type] = (stats[q.type] || 0) + 1
    })

    console.log(`✅ 最终题目数量: ${finalData.length} 道`)
    console.log('📋 题型分布:', stats)

    const isSuccess = finalData.length === 90
    
    return NextResponse.json({
      success: isSuccess,
      message: isSuccess ? '预测卷修复成功！' : '题目数量不正确',
      data: {
        totalQuestions: finalData.length,
        expectedQuestions: 90,
        typeDistribution: stats,
        importedCount,
        errors
      }
    })

  } catch (error: any) {
    console.error('❌ 修复失败:', error.message)
    return NextResponse.json({ 
      success: false, 
      error: `修复过程中出现异常: ${error.message}` 
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    // 检查当前预测卷状态
    const { data: currentData, error } = await supabase
      .from('questions')
      .select('id, type')
      .eq('exam_year', 2025)
      .eq('exam_date', '7月5日')

    if (error) {
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      }, { status: 500 })
    }

    const stats: Record<string, number> = {}
    currentData.forEach((q: any) => {
      stats[q.type] = (stats[q.type] || 0) + 1
    })

    return NextResponse.json({
      success: true,
      data: {
        totalQuestions: currentData.length,
        expectedQuestions: 90,
        typeDistribution: stats,
        needsFix: currentData.length !== 90
      }
    })

  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}
