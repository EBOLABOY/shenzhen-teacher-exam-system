'use client'

import { useState } from 'react'
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react'

interface ImportToolProps {
  onImportComplete: () => void
}

export default function ImportTool({ onImportComplete }: ImportToolProps) {
  const [isImporting, setIsImporting] = useState(false)
  const [importStatus, setImportStatus] = useState('')
  const [importResults, setImportResults] = useState<any>(null)

  // 转换题目数据格式
  const convertQuestionFormat = (question: any, examInfo: any, sectionInfo: any) => {
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
      }
    }
  }

  // 处理文件上传
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    setImportStatus('正在读取JSON文件...')

    try {
      const text = await file.text()
      const examData = JSON.parse(text)

      setImportStatus('正在解析题目数据...')
      
      const examInfo = examData.exam_info
      let totalImported = 0
      let totalSkipped = 0
      const results = []

      // 处理每个部分的题目
      for (const section of examData.sections) {
        if (!section.questions || section.questions.length === 0) {
          continue
        }

        setImportStatus(`正在处理: ${section.type} (${section.questions.length}题)`)
        
        let sectionImported = 0
        let sectionSkipped = 0

        for (const question of section.questions) {
          // 跳过缺失的题目
          if (question.text === "缺失" || !question.text) {
            sectionSkipped++
            continue
          }

          try {
            const convertedQuestion = convertQuestionFormat(question, examInfo, section)
            
            const response = await fetch('/api/questions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(convertedQuestion)
            })

            if (response.ok) {
              const result = await response.json()
              if (result.success) {
                if (result.message && result.message.includes('已存在')) {
                  sectionSkipped++
                } else {
                  sectionImported++
                }
              }
            } else {
              sectionSkipped++
            }
            
            // 添加延迟避免请求过快
            await new Promise(resolve => setTimeout(resolve, 50))
            
          } catch (error) {
            console.error(`处理题目 ${question.number} 失败:`, error)
            sectionSkipped++
          }
        }

        results.push({
          section: section.type,
          total: section.questions.length,
          imported: sectionImported,
          skipped: sectionSkipped
        })

        totalImported += sectionImported
        totalSkipped += sectionSkipped
      }

      setImportResults({
        exam_info: examInfo,
        total_imported: totalImported,
        total_skipped: totalSkipped,
        sections: results
      })

      setImportStatus(`导入完成！成功导入 ${totalImported} 道题目，跳过 ${totalSkipped} 道题目`)
      
      // 通知父组件更新统计信息
      onImportComplete()
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误'
      setImportStatus(`导入失败: ${errorMessage}`)
      console.error('导入失败:', error)
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-semibold mb-4">JSON文件导入工具</h2>
      
      <div className="space-y-4">
        {/* 文件上传区域 */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <div className="space-y-2">
            <p className="text-lg font-medium">选择JSON文件导入</p>
            <p className="text-sm text-gray-600">
              支持深圳教师考编真题JSON格式文件
            </p>
            <input
              type="file"
              accept=".json,.JSON"
              onChange={handleFileUpload}
              disabled={isImporting}
              className="hidden"
              id="json-file-input"
            />
            <label
              htmlFor="json-file-input"
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-colors ${
                isImporting 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              <FileText className="h-4 w-4" />
              {isImporting ? '导入中...' : '选择文件'}
            </label>
          </div>
        </div>

        {/* 导入状态 */}
        {importStatus && (
          <div className={`p-4 rounded-lg border ${
            importStatus.includes('失败') 
              ? 'bg-red-50 border-red-200 text-red-800' 
              : 'bg-blue-50 border-blue-200 text-blue-800'
          }`}>
            <div className="flex items-center gap-2">
              {importStatus.includes('失败') ? (
                <AlertCircle className="h-5 w-5" />
              ) : (
                <CheckCircle className="h-5 w-5" />
              )}
              <p>{importStatus}</p>
            </div>
          </div>
        )}

        {/* 导入结果详情 */}
        {importResults && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold mb-3">导入详情</h3>
            <div className="space-y-2 text-sm">
              <p><strong>考试信息:</strong> {importResults.exam_info.year}年{importResults.exam_info.month_day} {importResults.exam_info.segment}</p>
              <p><strong>总计:</strong> 导入 {importResults.total_imported} 题，跳过 {importResults.total_skipped} 题</p>
              
              <div className="mt-3">
                <p className="font-medium mb-2">各部分详情:</p>
                <div className="space-y-1">
                  {importResults.sections.map((section: any, index: number) => (
                    <div key={index} className="flex justify-between text-xs bg-white p-2 rounded">
                      <span>{section.section}</span>
                      <span>导入: {section.imported}, 跳过: {section.skipped}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 使用说明 */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-medium text-yellow-800 mb-2">使用说明</h4>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• 支持标准的深圳教师考编真题JSON格式</li>
            <li>• 系统会自动跳过重复题目</li>
            <li>• 支持单选题、多选题、是非题</li>
            <li>• 导入过程中请勿关闭页面</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
