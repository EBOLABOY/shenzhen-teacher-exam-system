import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// 获取可用的预测卷列表
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

    // 查询所有预测卷（通过exam_segment包含"预测"来识别）
    const { data: predictions, error } = await supabase
      .from('questions')
      .select('exam_year, exam_date, exam_segment')
      .ilike('exam_segment', '%预测%')
      .order('exam_year', { ascending: false })
      .order('exam_date', { ascending: false })

    if (error) {
      console.error('获取预测卷失败:', error)
      return NextResponse.json({ error: '获取预测卷失败' }, { status: 500 })
    }

    // 去重并统计每个预测卷的题目数量
    const uniquePredictions = []
    const seen = new Set()

    for (const prediction of predictions) {
      const key = `${prediction.exam_year}-${prediction.exam_date}-${prediction.exam_segment}`
      if (!seen.has(key)) {
        seen.add(key)
        
        // 统计该预测卷的题目数量
        const { count } = await supabase
          .from('questions')
          .select('*', { count: 'exact', head: true })
          .eq('exam_year', prediction.exam_year)
          .eq('exam_date', prediction.exam_date)
          .eq('exam_segment', prediction.exam_segment)

        // 获取题目分布统计
        const { data: questions } = await supabase
          .from('questions')
          .select('type, subject, difficulty')
          .eq('exam_year', prediction.exam_year)
          .eq('exam_date', prediction.exam_date)
          .eq('exam_segment', prediction.exam_segment)

        // 统计题型分布
        const typeStats = questions?.reduce((acc, q) => {
          const type = q.type || 'unknown'
          acc[type] = (acc[type] || 0) + 1
          return acc
        }, {} as Record<string, number>) || {}

        // 统计科目分布
        const subjectStats = questions?.reduce((acc, q) => {
          const subject = q.subject || '未知'
          acc[subject] = (acc[subject] || 0) + 1
          return acc
        }, {} as Record<string, number>) || {}

        // 统计难度分布
        const difficultyStats = questions?.reduce((acc, q) => {
          const difficulty = q.difficulty || 'medium'
          acc[difficulty] = (acc[difficulty] || 0) + 1
          return acc
        }, {} as Record<string, number>) || {}

        uniquePredictions.push({
          exam_year: prediction.exam_year,
          exam_date: prediction.exam_date,
          exam_segment: prediction.exam_segment,
          question_count: count || 0,
          type_distribution: typeStats,
          subject_distribution: subjectStats,
          difficulty_distribution: difficultyStats
        })
      }
    }

    return NextResponse.json({
      success: true,
      data: uniquePredictions
    })

  } catch (error) {
    console.error('API错误:', error)
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
}

// 获取特定预测卷的题目
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

    if (!exam_year || !exam_date || !exam_segment) {
      return NextResponse.json({ error: '缺少必要的预测卷信息' }, { status: 400 })
    }

    // 获取预测卷的所有题目，按题目编号排序
    const { data: questions, error } = await supabase
      .from('questions')
      .select('*')
      .eq('exam_year', exam_year)
      .eq('exam_date', exam_date)
      .eq('exam_segment', exam_segment)
      .order('question_number', { ascending: true })

    if (error) {
      console.error('获取预测卷题目失败:', error)
      return NextResponse.json({ error: '获取预测卷题目失败' }, { status: 500 })
    }

    if (!questions || questions.length === 0) {
      return NextResponse.json({ error: '未找到该预测卷的题目' }, { status: 404 })
    }

    // 格式化题目数据
    const formattedQuestions = questions.map(q => {
      // 确保选项是对象格式
      let options = q.options;
      if (typeof options === 'string') {
        try {
          options = JSON.parse(options);
        } catch (e) {
          console.error('解析选项失败:', e, '原始数据:', options);
          options = {};
        }
      }

      return {
        id: q.id,
        question: q.question,
        options: options,
        answer: q.answer,
        explanation: q.explanation,
        type: q.type,
        subject: q.subject,
        difficulty: q.difficulty,
        question_number: q.question_number,
        points: q.points
      };
    })

    return NextResponse.json({
      success: true,
      data: {
        exam_info: {
          year: exam_year,
          date: exam_date,
          segment: exam_segment,
          total_questions: questions.length
        },
        questions: formattedQuestions
      }
    })

  } catch (error) {
    console.error('API错误:', error)
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
}
