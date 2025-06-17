import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 数据库表结构定义
export interface Question {
  id: number
  question: string
  options: Record<string, string>
  answer: string
  explanation: string
  type: string
  subject: string
  difficulty: 'easy' | 'medium' | 'hard'
  created_at?: string
}

export interface UserAnswer {
  id: number
  user_id: string
  question_id: number
  selected_answer: string
  is_correct: boolean
  answered_at: string
}

export interface UserProgress {
  id: number
  user_id: string
  total_questions: number
  correct_answers: number
  total_time: number
  last_practice_at: string
}
