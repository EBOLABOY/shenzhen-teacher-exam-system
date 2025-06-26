'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { GlassCard, GlassButton, GlassContainer } from '@/components/ui'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { Calendar, BookOpen, Users, Clock, ArrowRight, FileText, BarChart3, Zap, Star } from 'lucide-react'

interface ExamInfo {
  exam_year: number
  exam_date: string
  exam_segment: string
  question_count: number
}

type TabType = 'history' | 'prediction' | 'special'

export default function ExamsPage() {
  const router = useRouter()
  const isMobile = useIsMobile()
  const [exams, setExams] = useState<ExamInfo[]>([])
  const [predictions, setPredictions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [predictionLoading, setPredictionLoading] = useState(false)
  const [selectedExam, setSelectedExam] = useState<ExamInfo | null>(null)
  const [selectedPrediction, setSelectedPrediction] = useState<any>(null)
  const [examStats, setExamStats] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<TabType>('history')

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)
      await fetchExams()
    }
    checkAuth()
  }, [])

  // 当切换到预测卷标签时获取预测卷数据
  useEffect(() => {
    if (activeTab === 'prediction' && predictions.length === 0) {
      fetchPredictions()
    }
  }, [activeTab])

  const fetchExams = async () => {
    try {
      const response = await fetch('/api/exams')
      const result = await response.json()

      if (result.success) {
        setExams(result.data)
      } else {
        console.error('获取考试列表失败:', result.error)
      }
    } catch (error) {
      console.error('获取考试列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPredictions = async () => {
    setPredictionLoading(true)
    try {
      const response = await fetch('/api/predictions')
      const result = await response.json()

      if (result.success) {
        setPredictions(result.data)
      } else {
        console.error('获取预测卷列表失败:', result.error)
      }
    } catch (error) {
      console.error('获取预测卷列表失败:', error)
    } finally {
      setPredictionLoading(false)
    }
  }

  const handleExamSelect = async (exam: ExamInfo) => {
    setSelectedExam(exam)
    setLoading(true)

    try {
      const response = await fetch('/api/exams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          exam_year: exam.exam_year,
          exam_date: exam.exam_date,
          exam_segment: exam.exam_segment
        })
      })

      const result = await response.json()

      if (result.success) {
        setExamStats(result.stats)
      } else {
        console.error('获取考试详情失败:', result.error)
      }
    } catch (error) {
      console.error('获取考试详情失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePredictionSelect = async (prediction: any) => {
    setSelectedPrediction(prediction)
    // 预测卷不需要额外获取统计信息，因为已经包含在列表中
  }

  const startExamPractice = () => {
    if (!selectedExam) return

    // 跳转到练习页面，传递考试信息
    const params = new URLSearchParams({
      mode: 'exam',
      exam_year: selectedExam.exam_year.toString(),
      exam_date: selectedExam.exam_date,
      exam_segment: selectedExam.exam_segment || ''
    })

    router.push(`/practice?${params.toString()}`)
  }

  const startPredictionPractice = () => {
    if (!selectedPrediction) return

    // 跳转到练习页面，传递预测卷信息
    const params = new URLSearchParams({
      mode: 'prediction',
      exam_year: selectedPrediction.exam_year.toString(),
      exam_date: selectedPrediction.exam_date,
      exam_segment: selectedPrediction.exam_segment
    })

    router.push(`/practice?${params.toString()}`)
  }

  if (loading && !selectedExam) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <GlassCard className="text-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-slate-600">加载考试列表中...</p>
        </GlassCard>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <GlassContainer maxWidth="4xl" className={`py-8 ${isMobile ? 'pt-4 px-2' : ''}`}>
        {/* 页面标题 */}
        <GlassCard className={`mb-6 ${isMobile ? 'mx-2' : 'mb-8'}`}>
          <div className="flex items-center gap-4">
            <div className={`${isMobile ? 'w-10 h-10' : 'w-12 h-12'} bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center`}>
              <FileText className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'} text-white`} />
            </div>
            <div>
              <h1 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold text-slate-800`}>试卷中心</h1>
              {!isMobile && (
                <p className="text-slate-600 mt-2">历年真题、预测卷和专项练习，全方位备考</p>
              )}
            </div>
          </div>
        </GlassCard>

        {/* 标签页切换 */}
        <GlassCard className={`mb-6 ${isMobile ? 'mx-2' : 'mb-8'}`}>
          <div className={`flex items-center ${isMobile ? 'gap-1' : 'gap-2'}`}>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 ${isMobile ? 'px-3 py-2 text-sm' : 'px-4 py-2'} rounded-lg transition-all duration-200 ${
                activeTab === 'history'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span className="font-medium">{isMobile ? '真题' : '历年真题'}</span>
            </button>
            <button
              onClick={() => setActiveTab('prediction')}
              className={`flex items-center gap-2 ${isMobile ? 'px-3 py-2 text-sm' : 'px-4 py-2'} rounded-lg transition-all duration-200 ${
                activeTab === 'prediction'
                  ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span className="font-medium">{isMobile ? '预测' : '预测卷'}</span>
            </button>
            <button
              onClick={() => setActiveTab('special')}
              className={`flex items-center gap-2 ${isMobile ? 'px-3 py-2 text-sm' : 'px-4 py-2'} rounded-lg transition-all duration-200 ${
                activeTab === 'special'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Star className="w-4 h-4" />
              <span className="font-medium">{isMobile ? '专项' : '专项卷'}</span>
              <span className={`text-xs bg-orange-500 text-white px-2 py-0.5 rounded-full ${isMobile ? 'hidden' : ''}`}>即将上线</span>
            </button>
          </div>
        </GlassCard>

        <div className={`${isMobile ? 'space-y-6' : 'grid lg:grid-cols-3 gap-8'}`}>
          {/* 考试列表 */}
          <div className={`${isMobile ? '' : 'lg:col-span-2'}`}>
            {activeTab === 'history' && (
              <GlassCard className={isMobile ? 'mx-2' : ''}>
                <h2 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold text-slate-800 mb-6`}>历年真题卷子</h2>

                {exams.length === 0 ? (
                  <div className={`text-center ${isMobile ? 'py-8' : 'py-12'}`}>
                    <BookOpen className={`${isMobile ? 'w-12 h-12' : 'w-16 h-16'} text-slate-400 mx-auto mb-4`} />
                    <p className="text-slate-500">暂无可用的考试卷子</p>
                    <p className="text-sm text-slate-400 mt-2">请联系管理员导入真题数据</p>
                  </div>
                ) : (
                  <div className={`space-y-${isMobile ? '3' : '4'}`}>
                    {exams.map((exam, index) => (
                      <GlassCard
                        key={index}
                        variant={selectedExam === exam ? "primary" : "light"}
                        className={`cursor-pointer transition-all ${isMobile ? 'hover:scale-[1.01]' : 'hover:scale-[1.02]'} ${
                          selectedExam === exam ? 'ring-2 ring-purple-500' : ''
                        }`}
                        onClick={() => handleExamSelect(exam)}
                      >
                        <div className={`flex items-center ${isMobile ? 'gap-3' : 'justify-between'}`}>
                          <div className={`flex items-center ${isMobile ? 'gap-3' : 'gap-4'}`}>
                            <div className={`${isMobile ? 'w-10 h-10' : 'w-12 h-12'} bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center`}>
                              <Calendar className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'} text-white`} />
                            </div>
                            <div className="flex-1">
                              <h3 className={`font-bold text-slate-800 ${isMobile ? 'text-sm' : ''}`}>
                                {exam.exam_year}年深圳教师招聘考试
                              </h3>
                              <div className={`flex items-center ${isMobile ? 'gap-2 mt-1 text-xs' : 'gap-4 mt-1 text-sm'} text-slate-600 ${isMobile ? 'flex-wrap' : ''}`}>
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {exam.exam_date}
                                </span>
                                {exam.exam_segment && (
                                  <span className={`flex items-center gap-1 ${isMobile ? 'truncate max-w-20' : ''}`}>
                                    <Users className="w-3 h-3" />
                                    <span className={isMobile ? 'truncate' : ''}>{exam.exam_segment}</span>
                                  </span>
                                )}
                                <span className="flex items-center gap-1">
                                  <BookOpen className="w-3 h-3" />
                                  {exam.question_count}题
                                </span>
                              </div>
                            </div>
                          </div>
                          {!isMobile && <ArrowRight className="w-5 h-5 text-slate-400" />}
                        </div>
                      </GlassCard>
                    ))}
                  </div>
                )}
              </GlassCard>
            )}

            {activeTab === 'prediction' && (
              <GlassCard className={isMobile ? 'mx-2' : ''}>
                <h2 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold text-slate-800 mb-6`}>AI预测卷</h2>

                {predictionLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
                    <p className="text-slate-600">加载预测卷中...</p>
                  </div>
                ) : predictions.length === 0 ? (
                  <div className={`text-center ${isMobile ? 'py-8' : 'py-12'}`}>
                    <Zap className={`${isMobile ? 'w-12 h-12' : 'w-16 h-16'} text-orange-400 mx-auto mb-4`} />
                    <p className={`text-slate-500 ${isMobile ? 'text-base' : 'text-lg'} font-medium mb-2`}>暂无预测卷</p>
                    <p className={`text-sm text-slate-400 ${isMobile ? 'mb-4' : 'mb-6'}`}>基于历年真题和考试趋势，AI智能生成预测试卷</p>
                  </div>
                ) : (
                  <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
                    {predictions.map((prediction, index) => (
                      <GlassCard
                        key={index}
                        className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] ${
                          selectedPrediction === prediction ? 'ring-2 ring-orange-500 bg-orange-50' : ''
                        }`}
                        onClick={() => handlePredictionSelect(prediction)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Zap className="w-5 h-5 text-orange-500" />
                              <h3 className={`font-bold text-slate-800 ${isMobile ? 'text-sm' : 'text-base'}`}>
                                {prediction.exam_year}年{prediction.exam_date}
                              </h3>
                              <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs font-medium">
                                预测卷
                              </span>
                            </div>
                            <p className={`text-slate-600 mb-3 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                              {prediction.exam_segment}
                            </p>
                            <div className={`flex flex-wrap gap-2 ${isMobile ? 'text-xs' : 'text-sm'} text-slate-500`}>
                              <span className="flex items-center gap-1">
                                <BookOpen className="w-3 h-3" />
                                {prediction.question_count}题
                              </span>
                            </div>
                          </div>
                          {!isMobile && <ArrowRight className="w-5 h-5 text-slate-400" />}
                        </div>
                      </GlassCard>
                    ))}
                  </div>
                )}
              </GlassCard>
            )}

            {activeTab === 'special' && (
              <GlassCard className={isMobile ? 'mx-2' : ''}>
                <h2 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold text-slate-800 mb-6`}>专项练习卷</h2>
                <div className={`text-center ${isMobile ? 'py-8' : 'py-12'}`}>
                  <Star className={`${isMobile ? 'w-12 h-12' : 'w-16 h-16'} text-purple-400 mx-auto mb-4`} />
                  <p className={`text-slate-500 ${isMobile ? 'text-base' : 'text-lg'} font-medium mb-2`}>专项卷功能即将上线</p>
                  <p className={`text-sm text-slate-400 ${isMobile ? 'mb-4' : 'mb-6'}`}>针对特定知识点和题型的专项强化练习</p>
                  <div className={`bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg ${isMobile ? 'p-3 mx-4' : 'p-4 max-w-md mx-auto'}`}>
                    <h4 className={`font-medium text-purple-800 mb-2 ${isMobile ? 'text-sm' : ''}`}>专项卷类型</h4>
                    <ul className={`${isMobile ? 'text-xs' : 'text-sm'} text-purple-700 space-y-1 text-left`}>
                      <li>• 教育学专项练习</li>
                      <li>• 教育心理学专项</li>
                      <li>• 职业道德专项</li>
                      <li>• 易错题专项突破</li>
                    </ul>
                  </div>
                </div>
              </GlassCard>
            )}
          </div>

          {/* 考试详情和开始按钮 */}
          <div className={`space-y-${isMobile ? '4' : '6'}`}>
            {(selectedExam || selectedPrediction) ? (
              <>
                <GlassCard className={isMobile ? 'mx-2' : ''}>
                  <h3 className={`font-bold text-slate-800 mb-4 flex items-center gap-2 ${isMobile ? 'text-base' : ''}`}>
                    {selectedPrediction ? <Zap className="w-5 h-5 text-orange-500" /> : <Calendar className="w-5 h-5 text-blue-500" />}
                    {selectedPrediction ? '预测卷信息' : '考试信息'}
                  </h3>
                  <div className={`space-y-${isMobile ? '2' : '3'}`}>
                    <div className={`flex items-center gap-2 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                      <Calendar className="w-4 h-4 text-blue-500" />
                      <span className="text-slate-600">{selectedPrediction ? '预测时间:' : '考试时间:'}</span>
                      <span className="font-medium">
                        {selectedPrediction ?
                          `${selectedPrediction.exam_year}年${selectedPrediction.exam_date}` :
                          `${selectedExam.exam_year}年${selectedExam.exam_date}`
                        }
                      </span>
                    </div>
                    {(selectedExam?.exam_segment || selectedPrediction?.exam_segment) && (
                      <div className={`flex items-center gap-2 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                        <Users className="w-4 h-4 text-green-500" />
                        <span className="text-slate-600">{selectedPrediction ? '预测类型:' : '考试段别:'}</span>
                        <span className={`font-medium ${isMobile ? 'truncate' : ''}`}>
                          {selectedPrediction ? selectedPrediction.exam_segment : selectedExam.exam_segment}
                        </span>
                      </div>
                    )}
                    <div className={`flex items-center gap-2 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                      <BookOpen className="w-4 h-4 text-purple-500" />
                      <span className="text-slate-600">题目数量:</span>
                      <span className="font-medium">
                        {selectedPrediction ? selectedPrediction.question_count : selectedExam.question_count}题
                      </span>
                    </div>
                    <div className={`flex items-center gap-2 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                      <Clock className="w-4 h-4 text-orange-500" />
                      <span className="text-slate-600">预计用时:</span>
                      <span className="font-medium">
                        {Math.ceil((selectedPrediction ? selectedPrediction.question_count : selectedExam.question_count) * 1.5)}分钟
                      </span>
                    </div>
                  </div>
                </GlassCard>

                {(examStats || selectedPrediction) && (
                  <GlassCard className={isMobile ? 'mx-2' : ''}>
                    <h3 className={`font-bold text-slate-800 mb-4 flex items-center gap-2 ${isMobile ? 'text-base' : ''}`}>
                      <BarChart3 className="w-5 h-5" />
                      题目分布
                    </h3>

                    <div className={`space-y-${isMobile ? '3' : '4'}`}>
                      {/* 科目分布 */}
                      <div>
                        <p className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-slate-700 mb-2`}>科目分布</p>
                        <div className="space-y-1">
                          {Object.entries((selectedPrediction ? selectedPrediction.subject_distribution : examStats.subject_distribution) || {}).map(([subject, count]) => (
                            <div key={subject} className={`flex justify-between ${isMobile ? 'text-xs' : 'text-sm'}`}>
                              <span className="text-slate-600 truncate">{subject}</span>
                              <span className="font-medium">{count}题</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 难度分布 */}
                      <div>
                        <p className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-slate-700 mb-2`}>难度分布</p>
                        <div className="space-y-1">
                          {Object.entries((selectedPrediction ? selectedPrediction.difficulty_distribution : examStats.difficulty_distribution) || {}).map(([difficulty, count]) => (
                            <div key={difficulty} className={`flex justify-between ${isMobile ? 'text-xs' : 'text-sm'}`}>
                              <span className="text-slate-600">
                                {difficulty === 'easy' ? '简单' : difficulty === 'medium' ? '中等' : '困难'}
                              </span>
                              <span className="font-medium">{count}题</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </GlassCard>
                )}

                <div className={isMobile ? 'mx-2' : ''}>
                  <GlassButton
                    onClick={selectedPrediction ? startPredictionPractice : startExamPractice}
                    variant="primary"
                    size={isMobile ? "md" : "lg"}
                    className="w-full"
                    disabled={loading || predictionLoading}
                  >
                    {(loading || predictionLoading) ? '加载中...' : `开始${selectedPrediction ? '预测卷' : '考试'}练习`}
                  </GlassButton>
                </div>
              </>
            ) : (
              <GlassCard className={`text-center ${isMobile ? 'py-8 mx-2' : 'py-12'}`}>
                <FileText className={`${isMobile ? 'w-12 h-12' : 'w-16 h-16'} text-slate-400 mx-auto mb-4`} />
                <p className="text-slate-500">
                  请选择一个{activeTab === 'prediction' ? '预测卷' : '考试卷子'}
                </p>
                <p className={`text-sm text-slate-400 mt-2 ${isMobile ? 'px-4' : ''}`}>
                  {isMobile ?
                    `点击上方的${activeTab === 'prediction' ? '预测卷' : '考试卷子'}查看详情` :
                    `点击左侧的${activeTab === 'prediction' ? '预测卷' : '考试卷子'}查看详情`
                  }
                </p>
              </GlassCard>
            )}
          </div>
        </div>
      </GlassContainer>
    </div>
  )
}
