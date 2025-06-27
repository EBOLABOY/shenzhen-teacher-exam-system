@echo off
echo 🚀 更新代码到GitHub...
echo.

cd /d "d:\我的文档\Desktop\教师考编"

echo 📝 添加所有文件...
git add .

echo 💾 提交更改...
git commit -m "全面修复选项显示问题 - 所有练习模式现在正确显示选项内容"

echo 🌐 推送到GitHub...
git push origin main

echo.
echo ✅ 更新完成！
echo.
pause
