#!/usr/bin/env node
/**
 * 部署脚本
 * 自动化部署流程，包括数据库初始化、管理员创建、数据导入等
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 开始部署深圳教师考编刷题系统...\n');

// 检查环境变量
function checkEnvironment() {
  console.log('📋 检查环境配置...');
  
  const requiredEnvs = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];
  
  const missing = requiredEnvs.filter(env => !process.env[env]);
  
  if (missing.length > 0) {
    console.error('❌ 缺少必要的环境变量:');
    missing.forEach(env => console.error(`   - ${env}`));
    console.error('\n请在 .env.local 文件中配置这些变量');
    process.exit(1);
  }
  
  console.log('✅ 环境配置检查通过\n');
}

// 安装依赖
function installDependencies() {
  console.log('📦 安装项目依赖...');
  try {
    execSync('npm install', { stdio: 'inherit' });
    console.log('✅ 依赖安装完成\n');
  } catch (error) {
    console.error('❌ 依赖安装失败:', error.message);
    process.exit(1);
  }
}

// 构建项目
function buildProject() {
  console.log('🔨 构建项目...');
  try {
    execSync('npm run build', { stdio: 'inherit' });
    console.log('✅ 项目构建完成\n');
  } catch (error) {
    console.error('❌ 项目构建失败:', error.message);
    process.exit(1);
  }
}

// 初始化管理员
function initializeAdmin() {
  console.log('👤 初始化管理员账户...');
  try {
    execSync('npm run init-admin', { stdio: 'inherit' });
    console.log('✅ 管理员账户初始化完成\n');
  } catch (error) {
    console.error('❌ 管理员初始化失败:', error.message);
    console.log('⚠️  如果管理员已存在，可以忽略此错误\n');
  }
}

// 导入题目数据
function importQuestions() {
  console.log('📚 导入真题数据...');
  
  const jsonDir = path.join(__dirname, '..', '真题JSON');
  if (!fs.existsSync(jsonDir)) {
    console.log('⚠️  真题JSON文件夹不存在，跳过数据导入');
    return;
  }
  
  const files = fs.readdirSync(jsonDir).filter(file => 
    file.endsWith('.JSON') || file.endsWith('.json')
  );
  
  if (files.length === 0) {
    console.log('⚠️  真题JSON文件夹为空，跳过数据导入');
    return;
  }
  
  try {
    execSync('npm run import-questions', { stdio: 'inherit' });
    console.log('✅ 真题数据导入完成\n');
  } catch (error) {
    console.error('❌ 真题数据导入失败:', error.message);
    console.log('⚠️  可以稍后手动导入数据\n');
  }
}

// 验证部署
function verifyDeployment() {
  console.log('🔍 验证部署状态...');
  
  // 检查关键文件
  const criticalFiles = [
    'package.json',
    'next.config.js',
    'database/schema.sql',
    'src/app/page.tsx'
  ];
  
  const missing = criticalFiles.filter(file => 
    !fs.existsSync(path.join(__dirname, '..', file))
  );
  
  if (missing.length > 0) {
    console.error('❌ 缺少关键文件:');
    missing.forEach(file => console.error(`   - ${file}`));
    process.exit(1);
  }
  
  console.log('✅ 部署验证通过\n');
}

// 显示部署信息
function showDeploymentInfo() {
  console.log('🎉 部署完成！\n');
  console.log('📋 系统信息:');
  console.log('   - 管理员邮箱: 1242772513@qq.com');
  console.log('   - 管理员密码: 1242772513');
  console.log('   - 项目地址: http://localhost:3000');
  console.log('\n📖 使用说明:');
  console.log('   1. 使用管理员账户登录');
  console.log('   2. 在管理后台生成邀请码');
  console.log('   3. 分发邀请码给用户注册');
  console.log('   4. 用户可以开始刷题练习');
  console.log('\n🚀 启动开发服务器:');
  console.log('   npm run dev');
  console.log('\n📚 查看完整文档:');
  console.log('   cat 使用说明.md');
}

// 主函数
async function main() {
  try {
    checkEnvironment();
    installDependencies();
    buildProject();
    initializeAdmin();
    importQuestions();
    verifyDeployment();
    showDeploymentInfo();
  } catch (error) {
    console.error('\n❌ 部署失败:', error.message);
    process.exit(1);
  }
}

// 如果是直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = {
  checkEnvironment,
  installDependencies,
  buildProject,
  initializeAdmin,
  importQuestions,
  verifyDeployment
};
