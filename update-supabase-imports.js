const fs = require('fs');
const path = require('path');

// 需要更新的文件列表
const filesToUpdate = [
  'src/app/page.tsx',
  'src/app/admin/page.tsx',
  'src/app/login/page.tsx',
  'src/app/register/page.tsx',
  'src/app/practice/page.tsx',
  'src/app/tasks/page.tsx',
  'src/app/wrong-questions/page.tsx',
  'src/app/settings/page.tsx',
  'src/app/ai-analysis/page.tsx',
  'src/components/layout/BottomNavigation.tsx',
  'src/hooks/useTopNavigation.ts',
  'src/app/api/wrong-questions/route.ts',
  'src/app/api/wrong-questions/[id]/route.ts',
  'src/app/api/questions/route.ts',
  'src/app/api/questions/batch/route.ts',
  'src/app/api/ai-analysis/route.ts',
  'src/app/api/invite-codes/route.ts',
  'src/app/api/tasks/route.ts',
  'src/app/api/user-answers/route.ts'
];

// 更新函数
function updateSupabaseImports() {
  console.log('🔧 开始更新Supabase导入...\n');
  
  let totalUpdated = 0;
  
  filesToUpdate.forEach(file => {
    const filePath = path.join(__dirname, file);
    
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  文件不存在: ${file}`);
      return;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    let fileUpdated = false;
    
    // 更新客户端组件导入
    if (content.includes('createClientComponentClient')) {
      content = content.replace(
        /import { createClientComponentClient } from '@supabase\/auth-helpers-nextjs'/g,
        "import { createBrowserClient } from '@supabase/ssr'"
      );
      content = content.replace(
        /const supabase = createClientComponentClient\(\)/g,
        `const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)`
      );
      fileUpdated = true;
    }
    
    // 更新服务端路由处理器导入
    if (content.includes('createRouteHandlerClient')) {
      content = content.replace(
        /import { createRouteHandlerClient } from '@supabase\/auth-helpers-nextjs'/g,
        "import { createServerClient } from '@supabase/ssr'"
      );
      content = content.replace(
        /import { cookies } from 'next\/headers'/g,
        "import { cookies } from 'next/headers'"
      );
      content = content.replace(
        /const supabase = createRouteHandlerClient\({ cookies }\)/g,
        `const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )`
      );
      fileUpdated = true;
    }
    
    if (fileUpdated && content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ ${file}: 已更新Supabase导入`);
      totalUpdated++;
    } else if (!fileUpdated) {
      console.log(`ℹ️  ${file}: 无需更新`);
    }
  });
  
  console.log(`\n🎉 更新完成！总共更新了 ${totalUpdated} 个文件。`);
}

// 执行更新
updateSupabaseImports();
