// 加载环境变量
require('dotenv').config({ path: '.env.local' });

console.log('环境变量检查:');
console.log('SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '已设置' : '未设置');
console.log('SUPABASE_SERVICE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '已设置' : '未设置');

// 运行导入脚本
require('./scripts/import-questions-to-db.js');
