const fs = require('fs');
const path = require('path');

// 需要修复的文件和对应的修复规则
const fixes = [
  // API 路由中的 error.message 修复
  {
    file: 'src/app/api/questions/route.ts',
    replacements: [
      {
        search: /{ success: false, error: '创建题目失败: ' \+ error\.message }/g,
        replace: "{ success: false, error: '创建题目失败: ' + (error instanceof Error ? error.message : '未知错误') }"
      }
    ]
  },
  {
    file: 'src/app/api/questions/batch/route.ts',
    replacements: [
      {
        search: /{ success: false, error: '批量导入失败: ' \+ error\.message }/g,
        replace: "{ success: false, error: '批量导入失败: ' + (error instanceof Error ? error.message : '未知错误') }"
      }
    ]
  },
  {
    file: 'src/app/register/page.tsx',
    replacements: [
      {
        search: /setErrors\(\{ inviteCode: inviteResult\.message \}\)/g,
        replace: "setErrors({ inviteCode: inviteResult.message || '邀请码验证失败' })"
      }
    ]
  },
  {
    file: 'src/app/practice/page.tsx',
    replacements: [
      {
        search: /setCurrentTask\(prev => \(\{ \.\.\.prev, \.\.\.updateData \}\)\)/g,
        replace: "setCurrentTask((prev: any) => ({ ...prev, ...updateData }))"
      },
      {
        search: /\.map\(\(\[key, value\]\) => \{/g,
        replace: ".map(([key, value]: [string, any]) => {"
      }
    ]
  },
  {
    file: 'src/app/admin/page.tsx',
    replacements: [
      {
        search: /maxWidth="6xl"/g,
        replace: 'maxWidth="2xl"'
      },
      {
        search: /\.map\(\(question, index\) => \(/g,
        replace: ".map((question: any, index: number) => ("
      },
      {
        search: /Object\.entries\(question\.options\)\.map\(\(\[key, value\]\) => \(/g,
        replace: "Object.entries(question.options).map(([key, value]: [string, any]) => ("
      }
    ]
  },
  {
    file: 'src/app/ai-analysis/page.tsx',
    replacements: [
      {
        search: /maxWidth="6xl"/g,
        replace: 'maxWidth="2xl"'
      }
    ]
  }
];

// 执行修复
function applyFixes() {
  console.log('🔧 开始批量修复 TypeScript 类型错误...\n');
  
  let totalFixed = 0;
  
  fixes.forEach(({ file, replacements }) => {
    const filePath = path.join(__dirname, file);
    
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  文件不存在: ${file}`);
      return;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    let fileFixed = 0;
    
    replacements.forEach(({ search, replace }) => {
      const matches = content.match(search);
      if (matches) {
        content = content.replace(search, replace);
        fileFixed += matches.length;
        console.log(`✅ ${file}: 修复 ${matches.length} 处`);
      }
    });
    
    if (fileFixed > 0) {
      fs.writeFileSync(filePath, content, 'utf8');
      totalFixed += fileFixed;
    } else {
      console.log(`ℹ️  ${file}: 无需修复`);
    }
  });
  
  console.log(`\n🎉 批量修复完成！总共修复了 ${totalFixed} 处类型错误。`);
}

// 运行修复
if (require.main === module) {
  applyFixes();
}

module.exports = { applyFixes };
