#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
简化版PDF题目提取器
使用PyPDF2提取PDF文本内容
"""

import re
import json
import os
import sys

def extract_text_from_pdf(pdf_path):
    """使用PyPDF2提取PDF文本"""
    try:
        import PyPDF2
    except ImportError:
        print("错误: 需要安装 PyPDF2")
        print("请运行: pip install PyPDF2")
        return ""
    
    text = ""
    try:
        with open(pdf_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            print(f"PDF页数: {len(pdf_reader.pages)}")
            
            for i, page in enumerate(pdf_reader.pages):
                print(f"正在处理第 {i+1} 页...")
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
                    
    except Exception as e:
        print(f"提取PDF失败: {e}")
        return ""
    
    return text

def save_text_to_file(text, filename):
    """保存文本到文件"""
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(text)
    print(f"文本已保存到: {filename}")

def main():
    # 检查PDF文件是否存在
    question_pdf = "24年12月版小学客观题.pdf"
    answer_pdf = "24年12月版历年小学试卷答案.pdf"
    
    if not os.path.exists(question_pdf):
        print(f"错误: 题目文件不存在: {question_pdf}")
        return
    
    if not os.path.exists(answer_pdf):
        print(f"错误: 答案文件不存在: {answer_pdf}")
        return
    
    print("开始提取PDF文本...")
    
    # 提取题目PDF
    print(f"\n=== 提取题目PDF: {question_pdf} ===")
    question_text = extract_text_from_pdf(question_pdf)
    if question_text:
        save_text_to_file(question_text, "questions_text.txt")
        print(f"题目文本长度: {len(question_text)} 字符")
    
    # 提取答案PDF
    print(f"\n=== 提取答案PDF: {answer_pdf} ===")
    answer_text = extract_text_from_pdf(answer_pdf)
    if answer_text:
        save_text_to_file(answer_text, "answers_text.txt")
        print(f"答案文本长度: {len(answer_text)} 字符")
    
    print("\n提取完成！请检查生成的文本文件。")

if __name__ == "__main__":
    main()
