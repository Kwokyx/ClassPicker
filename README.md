# 智问 - 课堂抽问系统

一款面向课堂教学场景的学生抽问系统，支持多种抽取模式、考勤管理和成绩记录。

## 功能特性

- **多种抽取模式**：随机抽取、公平抽取（优先选择被抽中次数少的学生）、签到模式
- **可视化转盘**：流畅的转盘动画，直观展示抽取过程
- **学生管理**：添加、删除、批量导入学生
- **考勤管理**：标记出勤/缺席状态，缺席学生不参与抽取
- **成绩评分**：优秀/良好/及格/不合格多档次评分
- **数据导出**：考勤表导出为 CSV 文件
- **历史记录**：记录每次抽取的时间、学生、模式和评分

## 技术栈

- 前端：Vue 3 + Vite
- 后端：Flask + PyMySQL
- 数据库：MySQL

## 项目结构

```
课程抽问系统/
├── frontend/                    # 前端
│   ├── src/
│   │   ├── components/          # 组件
│   │   │   ├── RouletteWheel.vue      # 转盘
│   │   │   ├── StudentList.vue        # 学生列表
│   │   │   ├── AttendanceModal.vue    # 考勤表
│   │   │   └── HistoryModal.vue       # 历史记录
│   │   ├── App.vue
│   │   └── main.js
│   ├── package.json
│   └── vite.config.js
├── backend/
│   ├── app.py                   # Flask 应用
│   └── requirements.txt
└── README.md
```

## 快速开始

### 环境要求

- Node.js >= 18
- Python >= 3.9
- MySQL >= 8.0

### 数据库配置

```sql
CREATE DATABASE classroom_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

修改 `backend/app.py` 中的数据库连接配置：

```python
MYSQL_CONFIG = {
    'host': '127.0.0.1',
    'user': 'your_username',
    'password': 'your_password',
    'database': 'classroom_system',
}
```

### 启动后端

```bash
cd backend
pip install flask flask-cors pymysql
python app.py
```

服务运行在 http://localhost:5001

### 启动前端

```bash
cd frontend
npm install
npm run dev
```

服务运行在 http://localhost:5173

## API 接口

### 学生

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/students | 获取学生列表 |
| POST | /api/students | 添加学生 |
| POST | /api/students/batch | 批量添加 |
| DELETE | /api/students/:id | 删除学生 |
| PUT | /api/students/:id/status | 更新考勤状态 |
| PUT | /api/students/:id/score | 更新分数 |

### 抽取

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/spin | 转盘抽取，参数 mode: random/fair/rollCall |

### 历史记录

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/history | 获取记录 |
| POST | /api/history | 添加记录 |
| DELETE | /api/history | 清空记录 |

## 使用说明

1. **添加学生**：在输入框输入姓名后点击添加，或点击"导入"批量添加
2. **抽取学生**：选择模式后点击转盘中心的"开始"
3. **评分**：抽取后选择评分等级
4. **考勤管理**：点击"考勤表"查看和修改学生出勤状态
