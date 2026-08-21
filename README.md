# AI Wardrobe Agent — 穿搭智能体

一个把「AI 对话」和「真实衣橱数据」打通的全栈穿搭助手：用户端用自然语言跟 AI 聊搭配、让 AI 审自己搭好的衣服；搭配师端负责沉淀知识库、维护翻车案例、纠错 AI 输出；配置端负责管 Prompt、切模型、看成本。三端共享同一个 FastAPI 后端和同一份 SQLite 数据库。

---

## 一、三端架构总览

```
┌─────────────────┐   ┌──────────────────┐   ┌──────────────────┐
│   用户端 H5      │   │   搭配师端 Web    │   │   配置端 Web      │
│  uni-app Vue3    │   │  Vue3 + EP       │   │  Vue3 + EP       │
│  :5173           │   │  :5175 /stylist  │   │  :5175 /config   │
└────────┬────────┘   └────────┬─────────┘   └────────┬─────────┘
         │                     │                      │
         └─────────────────────┼──────────────────────┘
                               ▼
                     FastAPI 后端（:8000）
        ┌──────────┬───────────┬───────────┬───────────┐
        ▼          ▼           ▼           ▼           ▼
     ReAct Agent  RAG 知识库   视觉管线      模型工厂     SQLite
     (LangGraph)  (向量检索)   (YOLO+CLIP)  (DS/GLM/Qwen)
```

| 端 | 技术 | 地址 | 谁来用 |
|----|------|------|--------|
| 后端 | Python FastAPI + SQLAlchemy + SQLite | `:8000` | 所有接口 / 模型调用 / 数据存储 |
| 用户端 | uni-app（Vue3 + Vite）编译 H5 | `:5173` | 普通用户：对话搭配、衣橱、分析、个人中心 |
| 运营端 | Vue3 + Element Plus + ECharts | `:5175` | 搭配师（`/stylist`）与管理员（`/config`） |

---

## 二、用户端（H5，:5173）功能详解

用户端是单个长页面内按底部导航切换的 SPA，共 5 个主 Tab：**首页 / 对话 / 衣橱 / 分析 / 我的**。

### 1. 首页工作台（今日推荐）
- **顶部问候条**：按时间段问候 + 呼吸点装饰 + 天气胶囊（真实 GPS 定位 + 逆地理显示城市，天气数据来自 Open-Meteo，按真实坐标计算，不是"最近城市"近似）
- **通知铃铛**：未读徽章 + 抖动动画，点开是通知抽屉
- **今日推荐卡**：AI 根据「今天天气 + 用户衣橱 + 用户身材肤色偏好」推一套当季穿搭，图片实时拼贴合成，下面是 **换一套 / 确认今日穿搭** 两个按钮
- **横向分类入口**：通勤 / 约会 / 运动 / 聚会 / 旅行 / 面试 6 个场景，一键直达场景推荐
- **搭配工具**：搭配审核（进 AI 审核页）+ 我的衣橱
- **衣橱为空时**：展示"衣橱空空"空状态（淡薰衣草呼吸动效图标）

### 2. AI 对话（chat Tab）
- 自然语言对话式搭配咨询，走 **ReAct 智能体**（LangGraph 状态机）：能自动调用天气、衣橱、知识库等工具，回答更准
- 右侧"历史"侧边抽屉：查看过往对话、给回答打分（好评/差评，供搭配师端复盘）
- 对话过程自动写入 `agent_steps` 表（思考链、工具调用、耗时），配置端可回放

### 3. 衣橱（wardrobe Tab）
- **＋ 拍照/上传**：底部弹层选择——单张拍照/上传（走完整视觉管线）或批量上传（最多 10 张）
- **AI 自动识别**：上传后 YOLOv8 检测衣物 → 抠图 → 通义 VL 大模型识别「品类/颜色/风格/材质/图案/季节/场合」→ 自动建条目，识别不准可手动修正
- **衣物卡片**：图片 + 名称 + 标签，点击看详情、可标记"穿过"（计入穿着次数与历史）
- **筛选分组**：按品类（上装/下装/鞋/外套…）、颜色、季节等分组查看
- **搜索**：支持文字搜"白色衬衫"这类语义搜索（走 CLIP 向量检索）
- **我的套装**：从衣橱里勾选单品组成套装保存，方便一键回顾
- **穿搭回顾**：选某天，回看当天穿过哪些衣服（穿的历史）

### 4. 衣橱分析（analysis Tab）
- **品类分布**：衣橱里上装/下装/鞋子等的占比（环形图，三色系配色）
- **季节分布**：春夏秋冬分布（配色轮自动取色，每个季节颜色不同）
- **颜色分布**：主色占比，色块 chip 展示
- **闲置分析**：超过 N 天没穿的"闲置衣物"清单
- **重复预警**：相似衣物提醒（避免重复购买）
- **购物建议**：结合分析生成的"该买什么"建议

### 5. 个人中心（我的 Tab）
- **Hero 区**：纯色浅蓝背景 + 头像 + 昵称 + 副标题
- **三列数据卡**：单品数（点击进衣橱）/ 搭配数（点击进我的套装）/ 未读通知（点击进通知中心）
- **菜单**：我的衣橱 / 我的套装 / 穿搭回顾 / 身形资料
- **身形资料弹窗**：身高 / 体重 / 肤色 / 体型 / 风格偏好 + **城市三级级联选择**（省/市/区 picker，选择即本地持久化，退出登录不丢）
- **退出登录**：底部小灰字

### 6. 通知中心（抽屉）
- 铃铛 / 底部入口均可打开：通知列表（未读左侧色条 + 标签 chip 按类型配色）
- 类型：系统通知 / 衣橱月报 / 穿搭热点
- 全部已读按钮（珊瑚胶囊）

### 7. 场景快捷推荐
- 首页 6 个场景（通勤/约会/运动/聚会/旅行/面试）点进去
- 底部弹层里展示 AI 推荐的多套穿搭 + **采纳**按钮（一键生成穿搭日志）

### 8. 穿搭日志 / 日程
- 采纳过的穿搭自动进"穿搭日志"（wear-diary），回看"哪套穿了、哪天穿的"
- 日程：给自己的穿搭/活动建日程提醒（如"周三相亲穿这套"）

---

## 三、搭配师端（Web，:5175/stylist）功能详解

给"搭配师"角色用，核心是**让 AI 越用越准**。

### 1. 概览 Dashboard
- 今日问候 + 待办任务清单（可勾选）
- 统计卡：知识库条数 / 标签数 / 错误修正数 / 平均评分
- 7 日趋势折线图（纠正量、评分走势）

### 2. 翻车案例（会话纠错）
- 列出用户打分差 / 被标记异常的对话（用户原问 + AI 回答 + 评分）
- 搭配师补写"正确答案"→ 提交修正 → 进入审批流水线
- 修正内容会沉淀成 Few-Shot 示例，反哺 AI

### 3. 知识库
- 上传 PDF / Markdown 文档 → 后端解析分块 → **向量化入库**（Chroma）
- 分页浏览文档片段、删除、按来源筛选
- 统计：总块数、各来源占比
- **作用**：AI 回答穿搭规则/场合礼仪/风格指南类问题时，自动检索知识库给依据（ReAct 的 `retrieve_knowledge` 工具）

### 4. 标签管理
- 维护全局标签库（风格/颜色/季节/场合/材质/图案 6 类）
- 自定义标签 + 颜色，供衣橱条目引用

### 5. Few-Shot 示例
- 维护"高质量问答范例"：用户输入 + 标准答案
- 翻车案例可一键"转 Few-Shot"（自动预填）
- 作用：让大模型模仿范例的回答方式，输出更稳定

### 6. 知识缺口检测
- 自动扫描"用户问得频繁但 AI 答不好"的话题（基于对话数据聚类）
- 搭配师查看缺口 → 补知识库或转 Few-Shot → 标记已处理（闭环）

### 7. 单品纠错
- 用户衣橱里 AI 识别错的单品（如把"针织衫"识别成"T恤"）
- 搭配师修正字段 → **一键应用**（改回用户衣橱真实数据）/ 拒绝
- 与"会话纠错"不同：这是**衣橱维度**的纠错

### 8. AI 推理轨迹（只读）
- 每次 AI 调用的思考链回放：输入 → 思考 → 工具调用 → LLM 返回 → 输出
- 用于定位"AI 为什么这么回答"

---

## 四、配置端（Web，:5175/config）功能详解

给"管理员"角色用，管系统级配置与运维。

### 1. 概览 Dashboard
- 用户数 / 今日推荐数 / 采纳率 / 7 日活跃趋势
- 采纳来源分布环形图、日历（打卡热力）

### 2. Prompt 管理
- 系统提示词版本管理：新建 / 编辑 / 删除 / **发布上线**
- 每个版本可标记为 online，AI 实际使用 **online 版本**（历史版本可回滚）

### 3. 模型配置
- **对话模型**下拉（一个下拉按组分类）：
  - DeepSeek：DeepSeek Chat
  - 智谱 AI（GLM）：GLM-4-Flash（免费）/ GLM-4-Plus / GLM-4-Air / GLM-4-FlashX
  - 通义千问（Qwen）：Qwen-Plus / Qwen-Turbo / Qwen-Max
- Temperature / Top-P 滑杆
- **保存即热切换**：点保存，后端内存态配置立刻更新，用户端下一次对话就用新模型（无需重启）
- 供应商由模型名前缀自动推断（`glm-*` → 智谱、`qwen-*` → 通义、其余 → DeepSeek）

### 4. 工具管理
- 12 个 Agent 工具的开关注册表（带分页 + 翻页动画）：

| 工具 | 作用 |
|------|------|
| `get_weather` | 查天气（Open-Meteo，支持经纬度/城市） |
| `get_wardrobe` | 查用户衣橱单品 |
| `retrieve_knowledge` | 知识库语义检索 |
| `check_outfit` | LLM 逐维度审核一套搭配（色彩/季节/场合/完整性） |
| `analyze_image` | 识图（VL 大模型） |
| `search_similar_clothes` | CLIP 语义找相似款；**配齐模式**自动补下装/鞋 |
| `get_user_profile` | 读用户身材/肤色/风格偏好 |
| `get_my_outfits` | 读用户保存的套装 |
| `get_color_harmony` | 12 色配色轮：互补/邻近/三角/四角/分离互补/同色（带 CIEDE2000 ΔE 验证） |
| `convert_to_pantone` | HEX → Pantone TCX 服装色号（ΔE 排序，内置 130+ 色表） |
| `score_outfit_detailed` | 可解释规则评分（颜色 25/场合 25/比例 20/材质 15/季节 10/重复 5，给改进建议） |
| `get_seasonal_suitability` | 季节适配评估（材质温度区间 × 实时气温） |

- 每个工具可独立开关，重启后状态持久化（tool_configs 表）

### 5. 审批流水线
- 翻车案例修正的流转：`待修正 → 已修正 → 已审批 → 已上线`
- 管理员审批后修正才进知识库/Few-Shot
- 漏斗图 + 瓶颈分析

### 6. 用户管理
- 用户列表（分页 + 翻页动画）、搜索、禁用/启用
- 查看任意用户的衣橱（只读）

### 7. AI 推理轨迹
- 所有 Agent 调用的思考链回放（分页 + 点击行展开步骤详情）

### 8. 系统监控
- 后端进程状态、接口健康检查
- **成本统计**：每日 LLM Token 消耗（按模型分组，DeepSeek/智谱/通义分别统计）+ 图片识别成本

---

## 五、后端核心能力

### 1. ReAct 智能体（LangGraph）
- `agent/react_agent.py`：StateGraph 状态机（agent 节点 ↔ tools 节点条件边），对外 `run()` 接口兼容
- 对话/场景推荐/自主搭配审核全走同一张图
- 每次请求**新建 agent** → 实时读最新模型配置 → **切模型立刻生效**

### 2. 模型工厂（多供应商）
- `llm/__init__.py` 的 `get_llm_client()`：按 provider / 模型名前缀返回客户端
- **DeepSeek**（`deepseek.py`）：OpenAI 兼容，支持 tools 函数调用、web_search（Responses API）
- **智谱 GLM**（`zhipu.py`）：OpenAI 兼容，JWT 鉴权
- **通义千问**（`tongyi.py`）：DashScope OpenAI 兼容模式
- 全部带 **成本记录**（`services/cost_tracker.py`）与无 Key 兜底文案

### 3. 视觉管线（`app/vision/`）
- `detector.py`：YOLOv8n 检测人物/衣物 → 裁剪单品
- `clothing_embedder.py`：CLIP（clip-ViT-B-32）生成衣物向量
- 上传管线：YOLO 裁剪 → 抠图 → VL 识图 → CLIP 向量化 → 入库
- 相似款检索：向量存 `chroma_data/clothing_store.json`，余弦相似度搜索

### 4. RAG 知识库（`app/rag/`）
- PDF/MD 解析分块 + 向量化 + 语义检索
- 向量文件独立于衣物向量（`store.json` / `clothing_store.json`）

### 5. 定时任务（`services/scheduled.py`）
- **天气告警**：每 4 小时扫描，降雨/降雪/≤5℃/≥33℃ 时按天幂等推送 + WebSocket 实时通知
- **日程提醒**：每天早上 7 点提醒当天日程

### 6. 内容安全（`services/moderation.py`）
- 通义 VL 审核上传图片，不安全 → 单品转 pending + 生成审核记录（开关控制）

### 7. 数据库（SQLite，模型见 `app/models/`）
- 用户 / 衣橱（含材质、图案、穿着记录）/ 套装 / 对话 / 纠错 / 知识库 / Few-Shot / 标签 / 工具配置 / Prompt 版本 / 通知 / 日程 / 采纳日志 / 成本 / 推理轨迹 / 审核记录

---

## 六、技术栈

| 层 | 技术 |
|----|------|
| 后端 | Python 3.12 + FastAPI + SQLAlchemy + SQLite + LangGraph + Chroma（RAG） |
| 用户端 | uni-app（Vue3 + Vite）编译 H5，patch-package 修复 uni-alpha 兼容 |
| 运营端 | Vue3 + Element Plus + ECharts |
| 大模型 | DeepSeek（对话/嵌入）、智谱 GLM、通义千问 Qwen、通义 VL（识图） |
| 视觉 | YOLOv8n（检测）、CLIP（向量）、remove.bg（抠图） |
| 动效 | CSS 三色系统（浅蓝/淡薰衣草/珊瑚）+ cubic-bezier 动效 token + 拟物按钮 |

---

## 七、目录结构

```
ai-wardrobe-agent/
├── backend/                # 后端 FastAPI（:8000）
│   ├── app/
│   │   ├── main.py         # 入口（注册路由、WebSocket）
│   │   ├── config.py       # .env 配置 + MODEL_CONFIG（provider/model_name/temp/top_p）
│   │   ├── auth/           # JWT 登录鉴权
│   │   ├── api/            # 接口层：user(用户端) / stylist(搭配师) / config(配置) / features(场景) / admin / notification
│   │   ├── agent/          # ReAct 智能体 + 12 个工具 + init_tools（注册表）
│   │   ├── rag/            # 知识库向量检索（document_parser / embedder / vector_store）
│   │   ├── llm/            # 模型客户端工厂：deepseek / zhipu / tongyi / tongyi_vl / embeddings
│   │   ├── vision/         # YOLOv8 检测 + CLIP 向量
│   │   ├── models/         # SQLAlchemy 表定义 + migrate.py（启动幂等加列）
│   │   ├── services/       # 业务：cost_tracker / moderation / ab_test / scheduled / clothing_search
│   │   ├── schemas/        # Pydantic 请求/响应模型
│   │   ├── utils/          # 拼图、LLM JSON 提取、抠图
│   │   └── uploads/        # 运行时图片（衣物图/拼贴图）
│   ├── scripts/            # seed_wardrobe.py 等数据脚本
│   ├── app.db              # SQLite 数据库（勿删）
│   ├── .env                # 密钥：DEEPSEEK / ZHIPU / TONGYI API Key（勿提交）
│   └── requirements.txt
├── frontend/               # 用户端 uni-app H5（:5173）
│   └── src/
│       ├── pages/login/    # 登录/注册（密码可视动画、记住密码）
│       ├── pages/user/     # 用户端 SPA：今日推荐/对话/衣橱/分析/个人中心/通知/场景弹窗
│       └── components/     # IconSvg（40+ lucide 线性图标）
├── frontend-web/           # 运营端 Vue3 + EP（:5175）
│   ├── src/views/Login.vue         # 统一登录页（角色切换）
│   ├── src/views/stylist/Index.vue # 搭配师端
│   ├── src/views/config/Index.vue  # 配置端
│   └── src/components/SidebarLayout.vue  # 双端共用侧栏布局（花瓣形→胶囊、徽章、动效）
├── scripts/                # 工具脚本（run_backend / test_api / 一次性脚本归档）
├── logs/                   # 运行日志（可清空）
├── archive/                # 历史遗留归档（不参与运行）
└── .workbuddy/             # AI 助手项目记忆（勿手动改）
```

---

## 八、启动方式（从零开始）

### 0. 环境要求
| 依赖 | 版本 | 检查命令 |
|------|------|----------|
| Python | 3.10+（推荐 3.12） | `python --version` |
| Node.js | 18+（推荐 22） | `node --version` |
| npm | 9+ | `npm --version` |

> 项目在 Windows 下开发，以下命令均已按 Windows PowerShell / Git Bash 验证。

### 步骤 1：初始化后端（一次性）

```bash
# 1) 进入后端目录
cd backend

# 2) 创建 Python 虚拟环境（若已存在 .venv 可跳过）
python -m venv .venv

# 3) 安装依赖（若已安装可跳过）
.venv/Scripts/python.exe -m pip install -r requirements.txt
```

### 步骤 2：配置密钥（一次性）

复制一份 `backend/.env`（若不存在则新建），填入：

```bash
# backend/.env
DEEPSEEK_API_KEY=sk-你的deepseek密钥        # DeepSeek 对话模型（必填，否则走演示模式）
ZHIPU_API_KEY=你的智谱JWT密钥               # 智谱 GLM（可选，用于切换智谱模型）
TONGYI_API_KEY=sk-你的千问密钥              # 通义千问（可选，用于切换千问模型）
JWT_SECRET_KEY=随便一段长字符串             # 登录 token 签名
```

> 三个模型 Key 至少配一个。一个都不配时，AI 会返回"（演示模式）请先配置 API Key"的兜底文案，其余功能（衣橱、分析、通知）仍可用。

### 步骤 3：启动后端（:8000）

命令行方式（推荐，日志直接看得到）：

```bash
cd backend
.venv/Scripts/python.exe -m uvicorn app.main:app --port 8000
```

或在 PyCharm 里配置：
- Script: `.venv/Scripts/python.exe -m uvicorn`
- Parameters: `app.main:app --port 8000`
- Working directory: `backend`

启动成功的标志：控制台出现 `Uvicorn running on http://127.0.0.1:8000`，接口文档可访问 `http://127.0.0.1:8000/docs`。

### 步骤 4：启动用户端（:5173，H5）

```bash
cd frontend
npm install          # 首次运行：装依赖（会自动执行 postinstall 打 uni 兼容补丁）
npm run dev:h5       # 启动 dev server
```

启动成功 → 浏览器打开 **http://localhost:5173**（自动进登录页）。

> ⚠️ 前端 `node_modules` 一旦损坏（报 `Cannot find module 'vite/dist/node/chunks/dist.js'` 之类），先删 `frontend/node_modules/vite` 再 `npm install vite@5.4.21 --force`，然后重跑 `npm run postinstall` 补丁。

### 步骤 5：启动运营端（:5175）

```bash
cd frontend-web
npm install
npm run dev
```

启动成功 → 浏览器打开 **http://localhost:5175**（统一登录页，顶部可切换搭配师端 / 配置端身份）。

### 演示账号

| 端 | 账号 | 密码 | 说明 |
|----|------|------|------|
| 用户端 | `user` | `123456` | 衣橱预置 9 件演示衣物，可直接体验全套功能 |
| 搭配师端 | `stylist` | `123456` | 知识库 / 翻车案例 / Few-Shot 维护 |
| 配置端 | `admin` | `123456` | Prompt / 模型 / 工具 / 用户管理 |

### 常见问题

| 现象 | 处理 |
|------|------|
| 8000 端口被占用 | 换端口起：`.venv/Scripts/python.exe -m uvicorn app.main:app --port 8001`，前端 `/api` 代理默认指 8000，换端口需同步改 |
| 改了后端代码但接口没变化 | uvicorn 不带 `--reload` 时不会热更，**彻底重启后端进程** |
| 前端页面白屏 / 报 Vue 只读属性错 | Ctrl+Shift+R 硬刷；若仍不行执行步骤 4 的 node_modules 修复 |
| 用户端天气定位不准 | GPS 仅在 `localhost` / `HTTPS` 下可用；局域网 http 访问拿不到定位，会退回 IP 反查 |
| 想验证多模型切换 | 配置端 → 模型配置 → 切供应商保存，用户端下一条对话即生效（详见第九节） |

### 一键启动（可选）

如果不想开三个终端，可用 IDE 的多 Run Configuration 或自行组合成脚本：

```bash
# 后端 + 用户端 + 运营端 三个终端分别执行各自命令即可，无依赖顺序（建议先起后端）
```

---

## 九、模型切换说明

1. 配置端 → **模型配置** → "对话模型"下拉选择（DeepSeek / 智谱 GLM / 通义千问）
2. 点**保存配置** → 弹窗提示"已切换至 XX · 模型名，立即生效"
3. 之后所有链路（用户对话、场景推荐、搭配审核、定时天气、A/B 测试）走新模型
4. 重启后端会恢复 `.env` 默认；想固定默认，在 `backend/.env` 设置：
   ```
   LLM_PROVIDER=zhipu        # 或 tongyi / deepseek
   DEFAULT_LLM_MODEL=glm-4-flash
   ```

---

## 十、注意事项

- `backend/.env` 含真实 API Key，**不要提交到 Git**
- `backend/uploads/` 与 `backend/app.db` 是运行时数据，删除会丢数据
- 模型配置是**内存态**（前端改，重启恢复默认）；如需持久默认见上文
- 8000 后端由宿主编译器/IDE 启动时，沙箱无法 kill；改后端代码后**彻底重启后端**才生效
- 用户端 GPS 定位仅在 `localhost` / `HTTPS` 下可用；手机局域网（http）定位不可用
- `scripts/legacy/` 与 `archive/` 为历史遗留，可忽略

---

## 十一、给二次开发者

- **加一个新 Agent 工具**：在 `backend/app/agent/tools/` 建文件 → 继承 `Tool` 实现 `get_definition()` + `execute()` → 在 `init_tools.py` 注册 → 配置端工具管理自动出现开关
- **加一个新模型供应商**：仿 `llm/zhipu.py` 写客户端 → `llm/__init__.py` 加前缀推断 → 前端下拉加分组
- **前端视觉规范**：三色 token（浅蓝 `#7aa8ff` / 淡薰衣草 `#8B7AC0` / 珊瑚 `#FF9E8E`）已内联在样式里，新页面直接复用色值即可
