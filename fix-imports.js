const fs = require('fs');
const path = require('path');

// 需要修复的文件列表
const filesToFix = [
  'src/app/ai-analysis/page.tsx',
  'src/app/login/page.tsx', 
  'src/app/practice/page.tsx',
  'src/app/tasks/page.tsx',
  'src/app/wrong-questions/page.tsx',
  'src/app/register/page.tsx',
  'src/app/settings/page.tsx',
  'src/components/ui/AnalysisTimeline.tsx',
  'src/components/ui/MindMapVisualization.tsx',
  'src/components/layout/MobileNavigation.tsx'
];

// 修复函数
function fixImports() {
  console.log('🔧 开始修复导入路径...\n');
  
  let totalFixed = 0;
  
  filesToFix.forEach(file => {
    const filePath = path.join(__dirname, file);
    
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  文件不存在: ${file}`);
      return;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // 修复导入路径
    content = content.replace(
      /from '@\/components\/ui\/GlassCard'/g,
      "from '@/components/ui/GlassCard.tsx'"
    );
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ ${file}: 已修复导入路径`);
      totalFixed++;
    } else {
      console.log(`ℹ️  ${file}: 无需修复`);
    }
  });
  
  console.log(`\n🎉 修复完成！总共修复了 ${totalFixed} 个文件。`);
}

// 执行修复
fixImports();
