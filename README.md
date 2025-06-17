# 深圳教师考编刷题系统

一个专为深圳教师考编设计的在线刷题系统，具有完整的用户管理、题库管理、答题记录和进度跟踪功能。

## ✨ 主要功能

### 🔐 用户管理
- **邀请码注册系统**：确保用户质量，需要邀请码才能注册
- **安全认证**：基于Supabase的用户认证系统
- **权限管理**：区分管理员和普通用户权限

### 📚 题库管理
- **批量导入**：支持从JSON文件批量导入历年真题
- **智能分类**：按科目、难度、年份等维度分类
- **多种题型**：支持单选题、多选题、判断题等

### 🎯 智能刷题
- **筛选练习**：可按科目、难度筛选题目
- **记录跟踪**：自动保存答题历史和用时
- **错题本**：智能收集错题，支持重复练习
- **进度统计**：详细的学习进度和统计分析

### 👨‍💼 管理功能
- **题库管理**：导入、编辑、删除题目
- **用户管理**：查看用户信息和学习进度
- **邀请码管理**：生成和管理注册邀请码
- **数据统计**：全面的系统使用统计

## 🚀 快速开始

### 1. 环境配置

```bash
# 安装依赖
npm install

# 配置环境变量
cp .env.example .env.local
# 编辑 .env.local 填入你的Supabase配置：
# NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
# SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 2. 数据库初始化

在Supabase控制台中执行 `database/schema.sql` 文件来创建数据库表结构。

### 3. 系统初始化

```bash
# 创建管理员账户和初始邀请码
npm run init-admin

# 导入真题数据（可选）
npm run import-questions
```

### 4. 启动开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 开始使用。

## 📋 默认管理员账户

- **邮箱**: 1242772513@qq.com
- **密码**: 1242772513

> ⚠️ 请在生产环境中及时修改默认密码

## 📁 项目结构

```
├── src/
│   ├── app/                 # Next.js 应用页面
│   │   ├── admin/          # 管理员后台
│   │   ├── api/            # API 路由
│   │   ├── login/          # 登录页面
│   │   ├── practice/       # 刷题页面
│   │   └── register/       # 注册页面
│   └── lib/                # 工具库
├── scripts/                # 脚本文件
│   ├── init-admin.js      # 管理员初始化
│   ├── import-questions-to-db.js  # 题目导入
│   └── deploy.js          # 部署脚本
├── database/              # 数据库相关
│   └── schema.sql         # 数据库结构
├── 真题JSON/              # 真题数据文件夹
└── 使用说明.md            # 详细使用说明
```

## 🛠️ 技术栈

- **前端**: Next.js 14, React, TypeScript, Tailwind CSS
- **后端**: Next.js API Routes
- **数据库**: Supabase (PostgreSQL)
- **认证**: Supabase Auth
- **部署**: Vercel (推荐)

## 📖 使用流程

### 管理员操作
1. 使用管理员账户登录系统
2. 进入管理后台生成邀请码
3. 导入真题数据（如果还未导入）
4. 管理用户和监控系统使用情况

### 普通用户操作
1. 获取邀请码（联系管理员）
2. 使用邀请码注册账户
3. 登录系统开始刷题练习
4. 查看学习进度和错题本

## 🔧 常用命令

```bash
# 开发环境
npm run dev              # 启动开发服务器
npm run build           # 构建项目
npm run start           # 启动生产服务器

# 系统管理
npm run init-admin      # 初始化管理员账户
npm run import-questions # 导入真题数据
npm run deploy          # 一键部署
```

## 📊 真题数据格式

将JSON格式的真题文件放入 `真题JSON/` 文件夹，系统支持以下格式：

```json
{
  "exam_info": {
    "year": 2012,
    "month_day": "5月27日",
    "segment": "小学段"
  },
  "sections": [
    {
      "type": "单项选择题",
      "count": 30,
      "points_per_question": 0.8,
      "questions": [
        {
          "number": 1,
          "text": "题目内容",
          "options": {
            "A": "选项A",
            "B": "选项B",
            "C": "选项C",
            "D": "选项D"
          },
          "correct_answer": "C",
          "explanation": "答案解析"
        }
      ]
    }
  ]
}
```

## 🎯 核心特性

- ✅ **完整的用户认证系统**
- ✅ **邀请码注册机制**
- ✅ **题库管理和批量导入**
- ✅ **智能刷题和错题本**
- ✅ **管理员后台**
- ✅ **学习进度跟踪**
- ✅ **响应式设计**

## 🚀 部署说明

### Vercel部署（推荐）
1. 连接GitHub仓库到Vercel
2. 配置环境变量
3. 自动部署

### 本地部署
```bash
npm run build
npm run start
```

## 📞 技术支持

- 查看详细文档：[使用说明.md](./使用说明.md)
- 提交问题：GitHub Issues
- 联系管理员：1242772513@qq.com

## 📄 许可证

MIT License

---

**注意**：请妥善保管管理员账户信息和数据库配置，确保系统安全。