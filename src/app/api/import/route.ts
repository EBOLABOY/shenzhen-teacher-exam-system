import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

// 导入题目数据到模拟数据库
let importedQuestions: any[] = []

interface QuestionData {
  number: number
  text: string
  options?: Record<string, string>
  correct_answer: string
  explanation: string
}

interface SectionData {
  type: string
  count: number
  points_per_question: number
  note?: string
  questions: QuestionData[]
}

interface ExamData {
  exam_info: {
    year: number
    month_day: string
    segment: string
  }
  sections: SectionData[]
}

function convertQuestionFormat(question: QuestionData, examInfo: any, sectionInfo: SectionData) {
  // 处理选项格式
  let options = {}
  if (question.options) {
    options = question.options
  } else if (sectionInfo.type === "是非题") {
    options = {
      "A": "正确",
      "B": "错误"
    }
  }

  // 确定题目类型
  let questionType = "multiple_choice"
  if (sectionInfo.type === "多项选择题") {
    questionType = "multiple_select"
  } else if (sectionInfo.type === "是非题") {
    questionType = "true_false"
  }

  // 确定科目
  let subject = "教育学"
  if (sectionInfo.note && sectionInfo.note.includes("教育教学技能")) {
    subject = "教育教学技能"
  } else if (sectionInfo.note && sectionInfo.note.includes("教育教学基础")) {
    subject = "教育教学基础"
  }

  // 确定难度
  let difficulty = "medium"
  if (question.number <= 20) {
    difficulty = "easy"
  } else if (question.number >= 70) {
    difficulty = "hard"
  }

  return {
    id: question.number,
    question: question.text || "题目内容缺失",
    options: options,
    answer: question.correct_answer || "",
    explanation: question.explanation || "",
    type: questionType,
    subject: subject,
    difficulty: difficulty,
    metadata: {
      exam_year: examInfo.year,
      exam_date: examInfo.month_day,
      exam_segment: examInfo.segment,
      section_type: sectionInfo.type,
      points: sectionInfo.points_per_question || 1.0,
      original_number: question.number
    },
    created_at: new Date().toISOString()
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    if (action === 'import_json_files') {
      // 读取真题JSON文件夹
      const jsonDir = path.join(process.cwd(), '真题JSON')
      
      if (!fs.existsSync(jsonDir)) {
        return NextResponse.json(
          { success: false, error: '真题JSON文件夹不存在' },
          { status: 404 }
        )
      }

      const files = fs.readdirSync(jsonDir).filter(file => 
        file.endsWith('.JSON') || file.endsWith('.json')
      )

      if (files.length === 0) {
        return NextResponse.json(
          { success: false, error: '没有找到JSON文件' },
          { status: 404 }
        )
      }

      let totalImported = 0
      const importResults = []

      for (const file of files) {
        try {
          const filePath = path.join(jsonDir, file)
          const fileContent = fs.readFileSync(filePath, 'utf8')
          const examData: ExamData = JSON.parse(fileContent)

          const examInfo = examData.exam_info
          let fileImported = 0

          // 处理每个部分的题目
          for (const section of examData.sections) {
            if (!section.questions || section.questions.length === 0) {
              continue
            }

            for (const question of section.questions) {
              // 跳过缺失的题目
              if (question.text === "缺失" || !question.text) {
                continue
              }

              try {
                const convertedQuestion = convertQuestionFormat(question, examInfo, section)
                
                // 检查是否已存在
                const exists = importedQuestions.find(q => 
                  q.question === convertedQuestion.question && 
                  q.answer === convertedQuestion.answer
                )

                if (!exists) {
                  importedQuestions.push(convertedQuestion)
                  fileImported++
                  totalImported++
                }
              } catch (error) {
                console.error(`处理题目 ${question.number} 失败:`, error)
              }
            }
          }

          importResults.push({
            file: file,
            exam_info: examInfo,
            imported: fileImported,
            success: true
          })

        } catch (error) {
          console.error(`处理文件 ${file} 失败:`, error)
          importResults.push({
            file: file,
            imported: 0,
            success: false,
            error: error instanceof Error ? error.message : '未知错误'
          })
        }
      }

      return NextResponse.json({
        success: true,
        message: `成功导入 ${totalImported} 道题目`,
        data: {
          total_imported: totalImported,
          files_processed: files.length,
          results: importResults,
          total_questions: importedQuestions.length
        }
      })
    }

    return NextResponse.json(
      { success: false, error: '未知的操作类型' },
      { status: 400 }
    )

  } catch (error) {
    console.error('导入失败:', error)
    return NextResponse.json(
      { success: false, error: '导入失败: ' + (error instanceof Error ? error.message : '未知错误') },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    if (action === 'stats') {
      // 返回导入统计信息
      const stats = {
        total: importedQuestions.length,
        byType: {} as Record<string, number>,
        bySubject: {} as Record<string, number>,
        byDifficulty: {} as Record<string, number>,
        byYear: {} as Record<string, number>
      }

      importedQuestions.forEach((q: any) => {
        // 按类型统计
        stats.byType[q.type] = (stats.byType[q.type] || 0) + 1

        // 按科目统计
        stats.bySubject[q.subject] = (stats.bySubject[q.subject] || 0) + 1

        // 按难度统计
        stats.byDifficulty[q.difficulty] = (stats.byDifficulty[q.difficulty] || 0) + 1

        // 按年份统计
        if (q.metadata && q.metadata.exam_year) {
          stats.byYear[q.metadata.exam_year] = (stats.byYear[q.metadata.exam_year] || 0) + 1
        }
      })

      return NextResponse.json({
        success: true,
        data: {
          stats,
          questions: importedQuestions.slice(0, 10) // 返回前10道题目作为预览
        }
      })
    }

    return NextResponse.json(
      { success: false, error: '未知的操作类型' },
      { status: 400 }
    )

  } catch (error) {
    console.error('获取统计信息失败:', error)
    return NextResponse.json(
      { success: false, error: '获取统计信息失败' },
      { status: 500 }
    )
  }
}
