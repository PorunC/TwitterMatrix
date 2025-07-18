# Twitter Bot Matrix

一个功能强大的Twitter机器人管理系统，支持多机器人协作、智能内容生成和实时互动管理。

## 🚀 功能特性

### 核心功能
- **多机器人管理** - 创建、配置和管理多个Twitter机器人
- **智能内容生成** - 基于LLM的自动化内容创作
- **机器人互动** - 支持机器人之间的相互关注、点赞和评论
- **批量导入** - 通过CSV文件批量导入机器人配置
- **实时监控** - WebSocket实时状态更新和活动日志

### 高级功能
- **自动化发布** - 定时发布推文和自动回复
- **数据分析** - 详细的互动统计和性能分析
- **API管理** - 灵活的API配置和使用量监控
- **活动日志** - 完整的操作历史记录

## 🛠️ 技术架构

### 前端
- **React 18** + TypeScript
- **Tailwind CSS** + shadcn/ui 组件库
- **Wouter** 路由管理
- **TanStack Query** 状态管理
- **WebSocket** 实时通信

### 后端
- **Node.js** + Express.js
- **PostgreSQL** + Drizzle ORM
- **TypeScript** 全栈类型安全
- **WebSocket** 实时通信服务器

### 外部服务
- **apidance.pro** - Twitter API代理服务
- **bianxie.ai** - LLM内容生成服务
- **Neon Database** - PostgreSQL云数据库

## 📦 安装和部署

### 1. 环境要求
- Node.js 18+
- PostgreSQL 数据库
- Twitter API 访问权限
- LLM API 访问权限

### 2. 安装依赖
```bash
npm install
```

### 3. 环境配置
复制 `.env` 文件并填入相应的配置：

```bash
cp .env.example .env
```

配置以下环境变量：
```env
# 数据库配置
DATABASE_URL=postgresql://username:password@localhost:5432/twitter_bot_matrix

# Twitter API 配置
APIDANCE_API_KEY=your_apidance_api_key_here
APIDANCE_BASE_URL=https://api.apidance.pro

# LLM API 配置
BIANXIE_API_KEY=your_bianxie_api_key_here
BIANXIE_BASE_URL=https://api.bianxie.ai/v1

# 会话配置
SESSION_SECRET=your_session_secret_here
```

### 4. 数据库设置
```bash
# 推送数据库架构
npm run db:push

# 或者运行迁移
npm run db:migrate
```

### 5. 启动应用
```bash
# 开发环境
npm run dev

# 生产环境
npm run build
npm start
```

## 🎯 使用指南

### 创建机器人
1. 访问 "机器人管理" 页面
2. 点击 "创建机器人" 按钮
3. 填写机器人信息（用户名、简介、话题等）
4. 输入Twitter认证令牌
5. 保存配置

### 批量导入机器人
1. 下载CSV模板文件
2. 按照模板格式填写机器人信息
3. 在机器人管理页面点击 "批量导入"
4. 上传CSV文件并确认导入

### 配置机器人互动
1. 访问 "机器人互动" 页面
2. 选择要配置的机器人
3. 设置互动参数（关注概率、点赞频率等）
4. 启动互动功能

### 内容生成
1. 访问 "内容生成" 页面
2. 选择机器人和内容主题
3. 生成内容预览
4. 发布或保存为草稿

## 📊 API文档

### 机器人管理
- `GET /api/bots` - 获取机器人列表
- `POST /api/bots` - 创建新机器人
- `PUT /api/bots/:id` - 更新机器人配置
- `DELETE /api/bots/:id` - 删除机器人

### 内容管理
- `POST /api/content/generate` - 生成内容
- `POST /api/content/publish` - 发布内容
- `GET /api/activities` - 获取活动日志

### 互动管理
- `GET /api/interactions` - 获取互动配置
- `POST /api/interactions` - 创建互动配置
- `PUT /api/interactions/:id/toggle` - 启停互动

## 🔧 配置选项

### 机器人配置
```typescript
interface BotConfig {
  username: string;      // Twitter用户名
  displayName: string;   // 显示名称
  bio: string;          // 简介
  topics: string[];     // 关注话题
  personality: string;   // 性格特征
  postFrequency: number; // 发布频率（分钟）
  isActive: boolean;    // 是否激活
  authToken: string;    // 认证令牌
}
```

### 互动配置
```typescript
interface InteractionConfig {
  followProbability: number;  // 关注概率 (0-1)
  likeProbability: number;    // 点赞概率 (0-1)
  replyProbability: number;   // 回复概率 (0-1)
  interactionFrequency: number; // 互动频率（分钟）
}
```

## 🐛 故障排除

### 常见问题

**WebSocket连接错误**
- 开发环境中的频繁连接断开是正常现象
- 不影响应用功能，可以忽略控制台错误

**API调用失败**
- 检查API密钥是否正确配置
- 验证API服务状态和配额限制

**数据库连接问题**
- 确认DATABASE_URL配置正确
- 检查数据库服务是否运行

**机器人无法发布内容**
- 验证Twitter认证令牌有效性
- 检查API使用限制和余额

## 📄 许可证

本项目采用 MIT 许可证。

## 🤝 贡献

欢迎提交问题和拉取请求来改进本项目。

## 📞 支持

如需帮助，请：
1. 查看文档和故障排除指南
2. 提交GitHub Issues
3. 联系开发团队

---

**注意**: 本项目仅用于学习和研究目的，请确保遵守Twitter的使用条款和相关法律法规。