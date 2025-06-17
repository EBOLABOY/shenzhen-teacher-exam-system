#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
深圳教师考试PDF题目提取器
从PDF文件中提取题目、选项和答案，并保存为结构化数据
"""

import re
import json
import os
from typing import List, Dict, Any
import argparse

try:
    import PyPDF2
    PDF_LIBRARY = 'PyPDF2'
except ImportError:
    try:
        import pdfplumber
        PDF_LIBRARY = 'pdfplumber'
    except ImportError:
        print("错误: 需要安装 PyPDF2 或 pdfplumber")
        print("请运行: pip install PyPDF2 pdfplumber")
        exit(1)

class PDFQuestionExtractor:
    def __init__(self):
        self.questions = []
        
    def extract_text_pypdf2(self, pdf_path: str) -> str:
        """使用PyPDF2提取PDF文本"""
        text = ""
        try:
            with open(pdf_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                for page in pdf_reader.pages:
                    text += page.extract_text() + "\n"
        except Exception as e:
            print(f"PyPDF2提取失败: {e}")
        return text
    
    def extract_text_pdfplumber(self, pdf_path: str) -> str:
        """使用pdfplumber提取PDF文本"""
        text = ""
        try:
            import pdfplumber
            with pdfplumber.open(pdf_path) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
        except Exception as e:
            print(f"pdfplumber提取失败: {e}")
        return text
    
    def extract_text_from_pdf(self, pdf_path: str) -> str:
        """从PDF提取文本"""
        print(f"正在提取PDF文件: {pdf_path}")
        
        if PDF_LIBRARY == 'PyPDF2':
            return self.extract_text_pypdf2(pdf_path)
        else:
            return self.extract_text_pdfplumber(pdf_path)
    
    def parse_questions(self, text: str, pdf_type: str = "questions") -> List[Dict[str, Any]]:
        """解析题目文本"""
        questions = []
        
        # 根据PDF类型使用不同的解析策略
        if pdf_type == "questions":
            questions = self.parse_question_pdf(text)
        elif pdf_type == "answers":
            questions = self.parse_answer_pdf(text)
        
        return questions
    
    def parse_question_pdf(self, text: str) -> List[Dict[str, Any]]:
        """解析题目PDF"""
        questions = []
        
        # 匹配题目模式 (例如: 1. 题目内容)
        question_pattern = r'(\d+)\.?\s*([^A-D]*?)(?=[A-D]\.|\n\d+\.|\Z)'
        
        # 匹配选项模式 (A. B. C. D.)
        option_pattern = r'([A-D])\.?\s*([^\n]*?)(?=[A-D]\.|$)'
        
        # 分割文本为题目块
        question_blocks = re.split(r'\n(?=\d+\.)', text)
        
        for block in question_blocks:
            if not block.strip():
                continue
                
            # 提取题目编号和内容
            question_match = re.match(r'(\d+)\.?\s*(.*)', block, re.DOTALL)
            if not question_match:
                continue
                
            question_num = question_match.group(1)
            content = question_match.group(2)
            
            # 分离题目内容和选项
            lines = content.split('\n')
            question_text = ""
            options = {}
            
            current_section = "question"
            
            for line in lines:
                line = line.strip()
                if not line:
                    continue
                    
                # 检查是否是选项
                option_match = re.match(r'([A-D])\.?\s*(.*)', line)
                if option_match:
                    current_section = "options"
                    option_key = option_match.group(1)
                    option_text = option_match.group(2)
                    options[option_key] = option_text
                elif current_section == "question":
                    question_text += line + " "
            
            if question_text.strip() and options:
                question_data = {
                    "id": int(question_num),
                    "question": question_text.strip(),
                    "options": options,
                    "answer": "",  # 答案将从答案PDF中获取
                    "explanation": "",
                    "type": "multiple_choice",
                    "subject": "教师考编",
                    "difficulty": "medium"
                }
                questions.append(question_data)
        
        return questions
    
    def parse_answer_pdf(self, text: str) -> List[Dict[str, Any]]:
        """解析答案PDF，提取答案和解析"""
        answers = []
        
        # 匹配答案模式 (例如: 1. A 或 1.A)
        answer_pattern = r'(\d+)\.?\s*([A-D])\s*(.*?)(?=\n\d+\.|\Z)'
        
        matches = re.findall(answer_pattern, text, re.DOTALL)
        
        for match in matches:
            question_num = int(match[0])
            answer = match[1]
            explanation = match[2].strip()
            
            answer_data = {
                "id": question_num,
                "answer": answer,
                "explanation": explanation
            }
            answers.append(answer_data)
        
        return answers
    
    def merge_questions_and_answers(self, questions: List[Dict], answers: List[Dict]) -> List[Dict]:
        """合并题目和答案"""
        # 创建答案字典以便快速查找
        answer_dict = {ans["id"]: ans for ans in answers}
        
        merged_questions = []
        for question in questions:
            question_id = question["id"]
            if question_id in answer_dict:
                answer_data = answer_dict[question_id]
                question["answer"] = answer_data["answer"]
                question["explanation"] = answer_data["explanation"]
            merged_questions.append(question)
        
        return merged_questions
    
    def save_to_json(self, questions: List[Dict], output_file: str):
        """保存为JSON文件"""
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(questions, f, ensure_ascii=False, indent=2)
        print(f"已保存 {len(questions)} 道题目到 {output_file}")
    
    def process_pdfs(self, question_pdf: str, answer_pdf: str, output_file: str = "questions.json"):
        """处理PDF文件并生成题库"""
        print("开始处理PDF文件...")
        
        # 提取题目
        question_text = self.extract_text_from_pdf(question_pdf)
        questions = self.parse_questions(question_text, "questions")
        print(f"从题目PDF中提取了 {len(questions)} 道题目")
        
        # 提取答案
        answer_text = self.extract_text_from_pdf(answer_pdf)
        answers = self.parse_questions(answer_text, "answers")
        print(f"从答案PDF中提取了 {len(answers)} 个答案")
        
        # 合并题目和答案
        merged_questions = self.merge_questions_and_answers(questions, answers)
        
        # 保存结果
        self.save_to_json(merged_questions, output_file)
        
        return merged_questions

def main():
    parser = argparse.ArgumentParser(description='提取PDF中的题目和答案')
    parser.add_argument('--questions', '-q', required=True, help='题目PDF文件路径')
    parser.add_argument('--answers', '-a', required=True, help='答案PDF文件路径')
    parser.add_argument('--output', '-o', default='questions.json', help='输出JSON文件路径')
    
    args = parser.parse_args()
    
    if not os.path.exists(args.questions):
        print(f"错误: 题目文件不存在: {args.questions}")
        return
    
    if not os.path.exists(args.answers):
        print(f"错误: 答案文件不存在: {args.answers}")
        return
    
    extractor = PDFQuestionExtractor()
    extractor.process_pdfs(args.questions, args.answers, args.output)

if __name__ == "__main__":
    main()
