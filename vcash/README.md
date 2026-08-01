# vcash

基于 Vendure 的多租户多仓库 POS 收银系统。

## 技术栈

- 后端: Vendure 3.6.x + TypeScript
- 前端: Vue 3 + Pinia + Apollo（Phase 3 起）
- 数据库: better-sqlite3（开发）/ PostgreSQL（生产）
- 包管理: pnpm workspace

## 快速开始

```bash
# 安装依赖
pnpm install

# 填充测试数据
pnpm populate

# 启动开发服务器
pnpm dev
```

服务启动后：
- Admin API: http://localhost:3000/admin-api
- Shop API: http://localhost:3000/shop-api
- Admin UI: http://localhost:3000/admin

默认管理员账号: superadmin / superadmin

## 项目结构

```
packages/
  vcash-pos-plugin/      # POS 业务核心插件（Phase 2）
  vcash-offline-plugin/  # 离线同步插件（Phase 2）
web/                     # POS 前端 SPA（Phase 3）
server/                  # Vendure 实例入口
docs/                    # 设计文档与实施计划
```

## 文档

- [设计 Spec](docs/superpowers/specs/2026-08-01-vcash-redesign-design.md)
- [Phase 1 实施计划](docs/superpowers/plans/2026-08-01-vcash-phase1-infrastructure.md)

## 开发命令

```bash
pnpm test          # 运行所有测试
pnpm build         # 构建所有包
pnpm --filter @vcash/server test  # 仅运行 server 测试
```
