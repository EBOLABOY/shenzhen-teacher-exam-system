'use client'

import { useState } from 'react'

export default function TestImportPage() {
  const [result, setResult] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsLoading(true)
    setResult('正在读取文件...')

    try {
      const text = await file.text()
      setResult('文件读取成功，正在解析JSON...')
      
      const data = JSON.parse(text)
      setResult('JSON解析成功！')
      
      console.log('解析的数据:', data)
      
      // 显示基本信息
      const examInfo = data.exam_info
      let totalQuestions = 0
      
      data.sections.forEach((section: any) => {
        if (section.questions) {
          totalQuestions += section.questions.filter((q: any) => q.text !== "缺失" && q.text).length
        }
      })
      
      setResult(`
        ✅ JSON解析成功！
        考试信息: ${examInfo.year}年${examInfo.month_day} ${examInfo.segment}
        题目部分数: ${data.sections.length}
        总有效题目数: ${totalQuestions}
      `)
      
      // 尝试导入第一道题目
      if (data.sections.length > 0 && data.sections[0].questions.length > 0) {
        const firstQuestion = data.sections[0].questions[0]
        if (firstQuestion.text !== "缺失" && firstQuestion.text) {
          setResult(prev => prev + '\n\n正在测试导入第一道题目...')
          
          const questionData = {
            question: firstQuestion.text,
            options: firstQuestion.options || {},
            answer: firstQuestion.correct_answer || "",
            explanation: firstQuestion.explanation || "",
            type: "multiple_choice",
            subject: "教育教学基础",
            difficulty: "medium"
          }
          
          const response = await fetch('/api/questions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(questionData)
          })
          
          if (response.ok) {
            const apiResult = await response.json()
            setResult(prev => prev + '\n✅ 题目导入测试成功！')
            console.log('API响应:', apiResult)
          } else {
            setResult(prev => prev + '\n❌ 题目导入测试失败')
          }
        }
      }
      
    } catch (error) {
      setResult(`❌ 错误: ${error instanceof Error ? error.message : '未知错误'}`)
      console.error('处理文件失败:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">JSON导入测试</h1>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              选择JSON文件
            </label>
            <input
              type="file"
              accept=".json,.JSON"
              onChange={handleFileUpload}
              disabled={isLoading}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>
          
          {result && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium mb-2">处理结果:</h3>
              <pre className="text-sm whitespace-pre-wrap">{result}</pre>
            </div>
          )}
          
          {isLoading && (
            <div className="text-center py-4">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-sm text-gray-600">处理中...</p>
            </div>
          )}
        </div>
        
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-medium text-yellow-800 mb-2">测试说明</h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• 选择JSON文件后会自动解析并显示基本信息</li>
            <li>• 会尝试导入第一道题目到数据库</li>
            <li>• 可以测试 20120512.JSON 或 test_small.json</li>
            <li>• 查看浏览器控制台获取详细信息</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
