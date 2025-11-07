# ClassPicker API

ClassPicker API 是一个使用 Node.js、Express 和 Sequelize 构建的课堂随机抽问系统后端，提供学生管理、签到与随机抽问等 RESTful 接口。

## ✨ 功能特性

- 学生信息的导入、查询与更新。
- 支持 JSON 与 CSV 两种名单导入格式。
- 随机抽问支持完全随机与均衡随机策略，并记录抽问结果。
- 签到状态管理与统计数据查询。

## 🏗️ 技术栈

- Node.js 18+
- Express
- Sequelize + MySQL
- MVC 架构（Models / Controllers / Routes / Services）

## 📁 目录结构

```
.
├── app.js
├── server.js
├── config/
│   ├── config.js
│   └── db.js
├── controllers/
│   ├── randomController.js
│   ├── recordController.js
│   └── studentController.js
├── models/
│   ├── Record.js
│   ├── Student.js
│   └── index.js
├── routes/
│   ├── randomRoutes.js
│   ├── recordRoutes.js
│   └── studentRoutes.js
├── services/
│   └── randomService.js
├── migrations/
│   ├── 20240101000000-create-students.js
│   └── 20240101001000-create-records.js
├── .env.example
└── README.md
```

## ⚙️ 环境配置

复制 `.env.example` 为 `.env` 并根据实际数据库信息调整：

```
DB_HOST=localhost
DB_USER=root
DB_PASS=yourpassword
DB_NAME=classpicker
DB_DIALECT=mysql
DB_PORT=3306
PORT=5000
NODE_ENV=development
```

## 🚀 启动步骤

```bash
npm install
npx sequelize-cli db:migrate
npm start
```

服务启动后，接口运行于 `http://localhost:5000`。

## 🔌 主要 API

| 方法 | 路径 | 说明 |
| ---- | ---- | ---- |
| `GET` | `/api/students` | 获取学生列表 |
| `POST` | `/api/students/import` | 导入学生名单（JSON / CSV） |
| `PUT` | `/api/students/:id` | 更新学生信息 |
| `PUT` | `/api/students/:id/attendance` | 更新签到状态 |
| `POST` | `/api/random` | 执行随机抽问（支持 `pure` / `balanced` 策略） |
| `GET` | `/api/records` | 获取抽问记录（最新 20 条，可通过 `limit` 查询参数调整） |
| `GET` | `/api/statistics` | 获取抽问与签到统计 |

### 导入接口示例

**JSON**

```json
POST /api/students/import
{
  "format": "json",
  "data": [
    { "name": "Alice", "student_number": "S001", "class": "Class A" },
    { "name": "Bob", "student_number": "S002", "class": "Class A" }
  ]
}
```

**CSV**

```json
POST /api/students/import
{
  "format": "csv",
  "data": "name,student_number,class\\nAlice,S001,Class A\\nBob,S002,Class A"
}
```

## 📊 统计说明

- `attendanceRate`：出勤率（出勤人数 / 总人数）。
- `records.total`：抽问总次数。
- `records.answered/skipped/absent`：不同结果的次数分布。

## 📝 许可

MIT License
