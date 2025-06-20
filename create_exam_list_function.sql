-- 创建获取考试列表的数据库函数
-- 这个函数会正确统计每个考试的题目数量，避免重复计算

CREATE OR REPLACE FUNCTION get_exam_list()
RETURNS TABLE (
  exam_year INTEGER,
  exam_date TEXT,
  exam_segment TEXT,
  question_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    q.exam_year,
    q.exam_date,
    q.exam_segment,
    COUNT(DISTINCT q.id) as question_count
  FROM questions q
  WHERE q.exam_year IS NOT NULL 
    AND q.exam_date IS NOT NULL
  GROUP BY q.exam_year, q.exam_date, q.exam_segment
  ORDER BY q.exam_year DESC, q.exam_date ASC;
END;
$$ LANGUAGE plpgsql;
