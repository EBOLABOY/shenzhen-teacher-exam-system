import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// 获取可用的考试卷子列表
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          async get() { return undefined },
        },
      }
    )

    // 分页获取所有考试信息
    let allQuestions = []
    let from = 0
    const pageSize = 1000

    while (true) {
      const { data: pageData, error: pageError } = await supabase
        .from('questions')
        .select('id, exam_year, exam_date, exam_segment')
        .not('exam_year', 'is', null)
        .range(from, from + pageSize - 1)

      if (pageError) {
        console.error('获取题目失败:', pageError)
        return NextResponse.json({ error: '获取考试信息失败' }, { status: 500 })
      }

      if (!pageData || pageData.length === 0) {
        break
      }

      allQuestions = allQuestions.concat(pageData)

      if (pageData.length < pageSize) {
        break
      }

      from += pageSize
    }



    // 按考试分组统计（使用题目ID确保不重复计算）
    const examGroups = new Map()
    const processedIds = new Set()

    allQuestions?.forEach(item => {
      // 避免重复计算同一道题
      if (processedIds.has(item.id)) return
      processedIds.add(item.id)

      const key = `${item.exam_year}-${item.exam_date || '未知'}-${item.exam_segment || 'default'}`
      if (!examGroups.has(key)) {
        examGroups.set(key, {
          exam_year: item.exam_year,
          exam_date: item.exam_date || '未知',
          exam_segment: item.exam_segment,
          question_count: 0
        })
      }
      examGroups.get(key).question_count++
    })

    // 转换为数组并排序
    const exams = Array.from(examGroups.values())
      .sort((a, b) => {
        // 按年份降序，然后按日期排序
        if (a.exam_year !== b.exam_year) {
          return b.exam_year - a.exam_year
        }
        return (a.exam_date || '').localeCompare(b.exam_date || '')
      })

    return NextResponse.json({
      success: true,
      data: exams
    })

  } catch (error) {
    console.error('API错误:', error)
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
}

// 获取特定考试的题目
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          async get() { return undefined },
        },
      }
    )

    const body = await request.json()
    const { exam_year, exam_date, exam_segment } = body

    if (!exam_year || !exam_date) {
      return NextResponse.json({ error: '缺少必要的考试信息' }, { status: 400 })
    }

    // 构建查询条件
    let query = supabase
      .from('questions')
      .select('*')
      .eq('exam_year', exam_year)
      .eq('exam_date', exam_date)

    if (exam_segment) {
      query = query.eq('exam_segment', exam_segment)
    } else {
      // 如果exam_segment为null，需要明确查询null值
      query = query.is('exam_segment', null)
    }

    // 按题目编号排序，保持原始考试顺序
    query = query.order('question_number', { ascending: true })

    const { data: questions, error } = await query

    if (error) {
      console.error('获取考试题目失败:', error)
      return NextResponse.json({ error: '获取考试题目失败' }, { status: 500 })
    }

    // 统计题目信息
    const stats = {
      total_questions: questions?.length || 0,
      subject_distribution: {},
      difficulty_distribution: {},
      section_distribution: {}
    }

    questions?.forEach(q => {
      // 科目分布
      stats.subject_distribution[q.subject] = (stats.subject_distribution[q.subject] || 0) + 1
      
      // 难度分布
      stats.difficulty_distribution[q.difficulty] = (stats.difficulty_distribution[q.difficulty] || 0) + 1
      
      // 题型分布
      stats.section_distribution[q.section_type || '未知'] = (stats.section_distribution[q.section_type || '未知'] || 0) + 1
    })

    return NextResponse.json({
      success: true,
      data: questions || [],
      stats,
      exam_info: {
        exam_year,
        exam_date,
        exam_segment
      }
    })

  } catch (error) {
    console.error('API错误:', error)
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
}
