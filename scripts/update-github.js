#!/usr/bin/env node
/**
 * 更新GitHub仓库脚本
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function updateGitHub() {
  console.log('🚀 开始更新GitHub仓库...\n');

  try {
    // 1. 检查Git状态
    console.log('1️⃣ 检查Git状态...');
    const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' });
    
    if (gitStatus.trim()) {
      console.log('📝 发现以下更改:');
      console.log(gitStatus);
    } else {
      console.log('✅ 工作区干净，没有未提交的更改');
    }

    // 2. 添加所有更改
    console.log('\n2️⃣ 添加所有更改到暂存区...');
    execSync('git add .', { stdio: 'inherit' });
    console.log('✅ 所有更改已添加到暂存区');

    // 3. 提交更改
    console.log('\n3️⃣ 提交更改...');
    const commitMessage = `feat: 完善预测卷功能和学习统计修复

🎯 主要更新:
- ✅ 完成预测卷功能集成 (90道题目)
- ✅ 移除预测卷"即将上线"标识
- ✅ 修复重复题目问题 (删除1614道重复题目)
- ✅ 优化学习统计检查和修复功能
- ✅ 添加数据完整性检查工具

📊 数据状态:
- 题库总数: 1606道题目 (去重后)
- 预测卷: 2025年7月5日小学客观题 (90道)
- 用户统计: 6个用户，1458条答题记录

🔧 新增工具:
- scripts/check-learning-stats.js - 学习统计检查
- scripts/remove-duplicate-imports.js - 重复题目删除
- scripts/quick-remove-duplicates.js - 快速去重
- scripts/deploy-predictions.js - 预测卷部署
- scripts/test-predictions.js - 预测卷测试

🛠️ 修复内容:
- 用户进度统计数据修复
- 预测卷API端点优化
- 数据库查询性能优化
- 错误处理和日志改进

📱 功能改进:
- 预测卷页面UI优化
- 管理员统计同步功能
- 数据完整性监控
- 自动化部署脚本`;

    try {
      execSync(`git commit -m "${commitMessage}"`, { stdio: 'inherit' });
      console.log('✅ 更改已提交');
    } catch (error) {
      if (error.message.includes('nothing to commit')) {
        console.log('ℹ️  没有新的更改需要提交');
      } else {
        console.error('❌ 提交失败:', error.message);
        return;
      }
    }

    // 4. 推送到远程仓库
    console.log('\n4️⃣ 推送到远程仓库...');
    try {
      execSync('git push origin main', { stdio: 'inherit' });
      console.log('✅ 代码已成功推送到GitHub');
    } catch (error) {
      console.error('❌ 推送失败:', error.message);
      console.log('\n💡 可能的解决方案:');
      console.log('1. 检查网络连接');
      console.log('2. 验证GitHub访问权限');
      console.log('3. 手动执行: git push origin main');
      return;
    }

    // 5. 显示更新摘要
    console.log('\n📋 更新摘要:');
    console.log('=============');
    
    // 获取最新提交信息
    try {
      const latestCommit = execSync('git log -1 --oneline', { encoding: 'utf8' });
      console.log(`最新提交: ${latestCommit.trim()}`);
    } catch (error) {
      console.log('无法获取最新提交信息');
    }

    // 显示仓库信息
    try {
      const remoteUrl = execSync('git remote get-url origin', { encoding: 'utf8' });
      console.log(`仓库地址: ${remoteUrl.trim()}`);
    } catch (error) {
      console.log('仓库地址: https://github.com/EBOLABOY/shenzhen-teacher-exam-system.git');
    }

    // 6. 关键文件检查
    console.log('\n📁 关键文件状态:');
    const keyFiles = [
      'src/app/exams/page.tsx',
      'src/app/api/predictions/route.ts',
      'src/app/practice/page.tsx',
      'scripts/check-learning-stats.js',
      'scripts/fix-user-progress.js',
      'scripts/test-predictions.js',
      'package.json'
    ];

    keyFiles.forEach(file => {
      if (fs.existsSync(file)) {
        const stats = fs.statSync(file);
        console.log(`✅ ${file} (${stats.mtime.toLocaleDateString()})`);
      } else {
        console.log(`❌ ${file} - 文件不存在`);
      }
    });

    // 7. 部署建议
    console.log('\n🚀 后续建议:');
    console.log('1. 访问 https://github.com/EBOLABOY/shenzhen-teacher-exam-system 确认更新');
    console.log('2. 如果使用自动部署，等待部署完成');
    console.log('3. 测试生产环境的预测卷功能');
    console.log('4. 在管理员页面执行用户统计同步');
    console.log('5. 运行数据完整性检查: npm run check-data');

    console.log('\n🎉 GitHub更新完成！');

  } catch (error) {
    console.error('❌ 更新过程中出现错误:', error.message);
    console.log('\n🔧 故障排除:');
    console.log('1. 检查Git配置: git config --list');
    console.log('2. 检查远程仓库: git remote -v');
    console.log('3. 检查网络连接');
    console.log('4. 手动执行Git命令');
  }
}

// 运行更新
if (require.main === module) {
  console.log('📦 GitHub仓库更新工具');
  console.log('====================');
  console.log('🔄 准备更新所有更改到GitHub...\n');
  
  updateGitHub();
}

module.exports = { updateGitHub };
