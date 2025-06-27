@echo off
echo 🔧 修复预测卷数据...
echo.
echo 当前问题: 预测卷只显示37道题，但应该有90道题
echo 预期结构:
echo   - 单项选择题: 50题
echo   - 多项选择题: 30题  
echo   - 是非题: 10题
echo   - 总计: 90题
echo.

echo 开始修复...
node scripts/fix-prediction-data.js

echo.
echo 修复完成后，请验证:
echo 1. 访问 http://localhost:3000/exams
echo 2. 点击"预测卷"标签
echo 3. 确认显示90道题目
echo 4. 测试题目类型分布是否正确
echo.

pause
