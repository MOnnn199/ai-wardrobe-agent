# AI Wardrobe Agent — 穿搭智能体

一个把「AI 对话」和「真实衣橱数据」打通的全栈穿搭助手。三端共享同一个 FastAPI 后端和同一份 SQLite 数据库：

- **用户端（H5）**：普通用户用自然语言跟 AI 聊搭配、让 AI 识图建衣橱、看今日推荐与衣橱分析。
- **搭配师端（Web）**：运营人员沉淀知识库、维护翻车案例、纠错 AI 输出，让 AI 越用越准。
- **配置端（Web）**：管理员管 Prompt、切模型、看成本、审流水线。

本文档对**每个功能都给出「使用步骤」和「数据怎么走」**，方便上手与排查。

---

## 一、三端架构总览

```
┌─────────────────┐   ┌──────────────────┐   ┌──────────────────┐
│   用户端 H5      │   │   搭配师端 Web    │   │   配置端 Web      │
│  uni-app Vue3    │   │  Vue3 + EP       │   │  Vue3 + EP       │
│  :5173           │   │  :5175 /stylist  │   │  :5175 /config   │
└────────┬────────┘   └────────┬─────────┘   └────────┬─────────┘
         │   /api 代理 (5173)  │   /api 代理 (5175)   │
         └─────────────────────┼──────────────────────┘
                               ▼
                     FastAPI 后端（:8000）
        ┌──────────┬───────────┬───────────┬───────────┐
        ▼          ▼           ▼           ▼           ▼
     ReAct Agent  RAG 知识库   视觉管线      模型工厂     SQLite
     (LangGraph)  (向量检索)   (YOLO+CLIP)  (DS/GLM/Qwen)
                               │
                          chroma_data/ (向量文件)
                          uploads/ (衣物图/拼贴图)
```

| 端 | 技术 | 地址 | 谁来用 |
|----|------|------|--------|
| 后端 | Python FastAPI + SQLAlchemy + SQLite | `:8000` | 所有接口 / 模型调用 / 数据存储 |
| 用户端 | uni-app（Vue3 + Vite）编译 H5 | `:5173` | 普通用户：对话搭配、衣橱、分析、个人中心 |
| 运营端 | Vue3 + Element Plus + ECharts | `:5175` | 搭配师（`/stylist`）与管理员（`/config`） |

### 路由前缀（前端统一走 `/api` 代理）

| 前缀 | 文件 | 主要能力 |
|------|------|----------|
| `/api/auth` | `app/api/auth.py` | 登录 / 注册 / me / 退出 |
| `/api/user` | `app/api/user.py` + `features.py` + `notification.py` | 用户端全部能力（对话、衣橱、分析、场景、套装、日程、通知、身形资料） |
| `/api/stylist` | `app/api/stylist.py` | 搭配师端（翻车案例、知识库、标签、Few-Shot、知识缺口、单品纠错、统计） |
| `/api/config` | `app/api/config.py` | 配置端（Prompt、模型、工具、审批、用户、成本、推理轨迹、监控） |
| `/api/admin` | `app/api/admin.py` | 管理员专属 |
| `/uploads` | `main.py` 挂载的静态目录 | 衣橱图、拼贴图：`http://localhost:8000/uploads/...` |
| `/ws/{user_id}` | `main.py` WebSocket | 天气告警 / 日程提醒的实时推送 |

> 用户端 H5 的 `request.js` 里 `BASE='/api'`，调用 `get('/user/xxx')` 实际请求 `/api/user/xxx`；uni-app 的 dev server **会**把 `/api` 代理到 `localhost:8000`（这是它唯一生效的代理）。运营端 `frontend-web` 的 vite 同样代理 `/api`。两个前端**都不会**代理 `/uploads`，所以图片 `<image :src>` 必须用后端返回的完整地址 `http://localhost:8000/uploads/...`。

---

## 二、环境准备与启动（从零）

### 1. 环境要求
| 依赖 | 版本 | 检查命令 |
|------|------|----------|
| Python | 3.10+（推荐 3.12） | `python --version` |
| Node.js | 18+（推荐 22） | `node --version` |
| npm | 9+ | `npm --version` |

### 2. 后端初始化（一次性）
```bash
cd backend
python -m venv .venv
.venv/Scripts/python.exe -m pip install -r requirements.txt
```

### 3. 配置密钥（一次性）
复制 `backend/.env`（若不存在则新建），填入：
```bash
# backend/.env
DEEPSEEK_API_KEY=sk-你的deepseek密钥        # 对话模型（必填，否则走演示模式兜底）
ZHIPU_API_KEY=你的智谱JWT密钥               # 智谱 GLM（可选）
TONGYI_API_KEY=sk-你的千问密钥              # 通义千问 / 通义 VL 识图（可选）
JWT_SECRET_KEY=随便一段长字符串             # 登录 token 签名（不设则每次重启后端全员强制重登）
```
三个模型 Key 至少配一个；一个都不配时，AI 返回「（演示模式）请先配置 API Key」的兜底文案，其余功能仍可用。

### 4. 启动后端（:8000）
```bash
cd backend
.venv/Scripts/python.exe -m uvicorn app.main:app --port 8000
```
启动成功标志：控制台出现 `Uvicorn running on http://127.0.0.1:8000`，接口文档见 `http://127.0.0.1:8000/docs`。
> 改了后端代码 **必须彻底重启后端进程**（`--reload` 在 Windows 上对 `user.py` 等改动常不生效）。

### 5. 启动用户端（:5173，H5）
```bash
cd frontend
npm install          # 首次会执行 postinstall 打 uni 兼容补丁
npm run dev:h5
```
浏览器打开 **http://localhost:5173** 自动进登录页。
> 若 `node_modules` 损坏（报 `Cannot find module 'vite/dist/node/chunks/dist.js'`），删 `frontend/node_modules/vite` 后 `npm install vite@5.4.21 --force` 再 `npm run postinstall`。

### 6. 启动运营端（:5175）
```bash
cd frontend-web
npm install
npm run dev
```
浏览器打开 **http://localhost:5175** 统一登录页，顶部可切换搭配师端 / 配置端。

### 7. 演示账号
| 端 | 账号 | 密码 | 说明 |
|----|------|------|------|
| 用户端 | `user` | `123456` | 衣橱预置演示衣物，可直接体验全套功能 |
| 搭配师端 | `stylist` | `123456` | 知识库 / 翻车案例 / Few-Shot 维护 |
| 配置端 | `admin` | `123456` | Prompt / 模型 / 工具 / 用户管理 |

---

## 三、用户端（H5 :5173）功能详解

用户端是单长页面按底部导航切换的 SPA，主 Tab：**首页 / 对话 / 衣橱 / 分析 / 我的**。

### 3.1 登录 / 注册（含「记住密码」）

**使用步骤**
1. 打开 `http://localhost:5173` 进入登录页，默认是「登录」标签。
2. 输入账号密码（演示账号 `user` / `123456`），点「登录」进入首页。
3. 没有账号切到「注册」标签，填用户名（≥2 字）+ 密码（≥6 位）+ 昵称，注册成功自动登录。
4. **记住密码**：登录页勾选「记住密码」→ 登录成功后账号密码写入本地 → 之后只要登录态失效（退出 / 后端重启换密钥跳回登录页），账号密码会自动回填、勾选自动打上。

**数据怎么走**
- 前端 `pages/login/index.vue` 调 `POST /api/auth/login {username,password}`。
- 后端 `auth.py` 校验 `password_hash = sha256(password + 固定SALT)`，校验 `is_active`（禁用返回 401）；通过后 `create_access_token({"sub": user.id, "role": user.role})`（HS256，有效期 30 天）。
- 返回 `token/role/nickname/user_id`，前端 `uni.setStorageSync` 存到本地（**token 不落库，无状态**）。
- 勾选记住密码时，额外 `uni.setStorageSync('rememberedUser', {username, password})`；`onLoad` 时读取回填。
- 之后每个 `/api/user/*` 请求经 `request.js` 自动带 `Authorization: Bearer <token>`，后端 `resolve_user_id` 解出 `user_id` 做多用户隔离。
- ⚠️ 密码是**明文**存本地，演示够用；上线建议加密或只记用户名。

### 3.2 首页 · 今日推荐

**使用步骤**
1. 顶部问候条按时间段问候 + 天气胶囊（显示真实城市与天气）。
2. 「今日推荐」卡展示 AI 根据「天气 + 你的衣橱 + 身材肤色」推的当季穿搭（实时拼贴图）。
3. 点「换一套」重新生成；点「确认今日穿搭」把这套标记为今日穿（标记穿过）、并写入穿着记录（供「穿搭回顾」按日期查看当天穿了什么）。**穿搭日志（采纳记录）功能已停用，不再落库。**
4. 横向 6 个场景入口（通勤 / 约会 / 运动 / 聚会 / 旅行 / 面试）点进去做场景推荐。
5. 衣橱为空时显示空状态，引导先去衣橱上传。

**数据怎么走**
- 进首页前端调 `GET /api/user/today-outfit`，后端取该用户 `status='confirmed'` 衣橱 → 必要时取真实天气（Open-Meteo，需用户授权 GPS）→ `ReActAgent.run` 生成推荐文案 + `_render_collage` 拼贴图。
- 「确认今日穿搭」= 前端 `POST /api/user/wardrobe/mark-worn {ids,+worn_date?}`（标记穿过，写 WearLog 供穿搭回顾）；`POST /api/user/outfits/adopt` 仅保留穿着记录写入，不再写采纳日志。
- 天气胶囊走 `get_weather` 工具；GPS 仅在 `localhost` / `HTTPS` 可用，否则退回 IP 反查。

### 3.3 AI 对话（chat Tab）

**使用步骤**
1. 切到「对话」Tab，输入任何穿搭问题，如「帮我搭一套约会穿搭」「梨形身材怎么显瘦」「明天面试穿什么」。
2. AI 流式思考后给出建议；若问题涉及你的衣橱，会附「衣橱单品卡片」+ 拼贴图。
3. 点右上「历史」抽屉查看过往对话；对每条回答可「好评 / 差评」，差评进入搭配师端翻车队列。
4. 多轮追问会带上历史上下文（同一 `conversation_id`）。

**数据怎么走**
- 前端 `fetch('/api/user/chat?user_input=...')`。
- 后端 `user.py:/chat`：有 `conversation_id` 追加到原 `Conversation`，否则新建 → `ReActAgent.run(...)`，回写 `conv.history`（JSON）+ `conv.agent_response`。
- Agent 内部（LangGraph 状态机）：
  - 读 online 版 Prompt（`load_online_prompt`）+ 注入 Few-Shot 范例（按向量相似取 top-2）；
  - `_agent_node` 调 LLM（按 `MODEL_CONFIG` 选 DeepSeek/智谱/通义）；
  - `_tools_node` 执行 LLM 选定的工具，**每执行一个工具名记入 `self.used_tools`**；衣橱类工具强制注入 `user_id`（数据隔离）。
- **衣橱卡片返回逻辑**（关键）：
  - `WARDROBE_TOOLS = {get_wardrobe, get_my_outfits, check_outfit, search_similar_clothes}`
  - 仅当 `agent.used_tools` 命中衣橱工具 **且** 用户**非购物意图**时，才查 `clothing_items`（仅 `confirmed`）→ 文本匹配精选 `_pick_outfit_items` → 生成拼贴图 → 返回 `items` 卡片。
  - 问「你好 / 天气 / 穿搭知识」→ 不调衣橱工具 → 无卡片。
  - 问「我想买件通勤外套」→ 命中购物意图 → 不返衣橱卡片（推荐新买的）。
- 每次调用把思考链写入 `agent_traces` 表（配置端可回放）。
- 返回 `ChatResponse{response, conversation_id, steps, outfit_image, items}`，前端 `items` 非空才渲染卡片。

### 3.4 衣橱（wardrobe Tab）

**使用步骤**
1. 点「＋」底部弹层：单张拍照/上传（走完整 AI 识别）或批量上传（最多 10 张）。
2. 上传后 AI 自动识别「品类/颜色/风格/材质/图案/季节/场合」并建条目；不准可在详情里改。
3. 衣物卡片点开看详情；可「标记穿过」「纠错上报」「删除」。
4. 顶部支持按品类 / 颜色 / 季节筛选分组，并支持语义搜索（如「白色衬衫」）。
5. 「我的套装」：从衣橱勾选单品组成套装保存，一键回顾。
6. 「穿搭回顾」：选某天回看当天穿过哪些。

**数据怎么走**
- **单张上传 + 识别**：前端 `POST /api/user/wardrobe/upload-and-tag`（FormData 含图片），后端流水线：
  1. `crop_for_vl`：YOLOv8 检测，必要时局部裁剪（权重缺失则整图降级，不阻断）；
  2. `remove_background`：AI 抠图去背景（失败保留原图）；
  3. `TongyiVLClient.analyze_image`：`qwen-vl-plus` 返回 JSON 字段（失败兜底默认字段）；
  4. 新建 `ClothingItem(user_id, status='confirmed', image_url='http://localhost:8000/uploads/...')` → 落 `clothing_items` 表；
  5. 自动按 `tags` 表 `name` 精确匹配打标签；
  6. `ClothingEmbedder.embed_image`（CLIP `clip-ViT-B-32`）→ `clothing_search.add_clothing_vector` → 落 `chroma_data/clothing_store.json`；
  7. `check_duplicate_purchase` 返回同名/同色同类列表（前端提示，不落通知）。
- **仅存图不识别**：`POST /api/user/wardrobe/upload-image`；**仅识别不入库**：`POST /api/user/analyze-image`（聊天里传图用它，返回 JSON 不入库）。
- **手动新增**：`POST /api/user/wardrobe`；**改**：`PUT /api/user/wardrobe/{id}`；**删**：`DELETE /api/user/wardrobe/{id}`（按 `item_id + user_id` 双约束，只删 `clothing_items` 行；CLIP 向量不同步删，存在孤儿向量技术债）。
- 列表：`GET /api/user/wardrobe`；语义搜索走 CLIP 向量检索（`search_similar_clothes` 工具 / 衣橱搜索框）。
- 标记穿过：`POST /api/user/wardrobe/mark-worn {ids, worn_date?}`；穿搭历史：`GET /api/user/wardrobe/wear-history?item_id=`、按天：`GET /api/user/wardrobe/wear-by-date?date=`、删历史：`POST /api/user/wardrobe/wear-history/delete`。

### 3.5 衣橱分析（analysis Tab）

**使用步骤**
1. 切到「分析」Tab，自动展示：品类分布（环图）、季节分布、颜色分布（色块）、闲置清单、重复预警、购物建议。
2. 这些数据来自你衣橱的统计，无需手动操作。

**数据怎么走**
- 前端 `GET /api/user/wardrobe-analysis` + `GET /api/user/shopping-list`。
- `wardrobe-analysis`：后端对当前用户 `confirmed` 衣橱按 `category/season/color` 聚合，算闲置（超过 N 天没 `mark-worn`）与重复（相似 name/color/category）。
- `shopping-list`：基于分析与缺口生成「该买什么」建议清单。
- 两者都只看 `status='confirmed'`，`pending` 草稿不计入。

### 3.6 场景快捷推荐

**使用步骤**
1. 首页点 6 个场景入口之一（通勤 / 约会 / 运动 / 聚会 / 旅行 / 面试），或对话里让 AI 按场景推荐。
2. 底部弹层展示 AI 推荐的多套穿搭（基于你衣橱单品）。
3. 点「采纳」仅做交互反馈（提示「已采纳」），采纳日志功能已停用，不再落库。

**数据怎么走**
- 前端 `GET /api/user/scenes`（拿场景列表）→ 选场景后 `POST /api/user/quick-recommend {scene, note?, city?, lat?, lon?}`。
- 后端 `features.py`：**先** `_pick_outfit_items(items, scene)`（场景打分版：按场景风格/颜色加权，每类取一件、最多 5 件）程序化精选一套 → 再把「精选集 + 完整衣橱」交给 `ReActAgent.run` 只围绕精选集写推荐语。
- 返回 `{recommendation, conversation_id, outfit_image, scene, item_ids}`；前端用 `item_ids` 直接拉衣橱卡片展示（**不是** agent 返回的，是程序化精选结果）。
- 采纳：`POST /api/user/outfits/adopt {item_ids, source:'scene', scene}` → 仅写 WearLog（穿搭回顾数据源），`adoptions` 表已停用不再写入；接口返回「功能未启用」提示。

### 3.7 个人中心 / 身形资料（我的 Tab）

**使用步骤**
1. 切到「我的」Tab：看单品数 / 搭配数 / 未读通知三列卡。
2. 点「身形资料」填：身高 / 体重 / 肤色 / 体型 / 风格偏好 + 城市。保存后 AI 对话会自动读取这些资料来回答（无需每次重填）。
3. 底部「退出登录」。

**数据怎么走**
- 身形资料：`GET /api/user/profile` 读取，`PUT /api/user/profile` 保存（落 `users` 表的 `height/weight/skin_tone/body_type/style_preference/city` 等字段）。
- AI 对话时 `get_user_profile` 工具读取该用户资料，`resolve_user_id` 保证只读到自己的。
- 城市三级选择持久化在 `users.city`，退出登录不丢。
- ⚠️ 后端**没有**肩/胸/腰/臀围数值字段，身形判断直接用 `body_type` 标签（苹果/梨形/沙漏/矩形/倒三角）。

### 3.8 通知中心

**使用步骤**
1. 首页铃铛或「我的」未读通知卡点开通知抽屉。
2. 列表分类型（系统 / 衣橱月报 / 穿搭热点 / 天气告警 / 日程提醒），未读有左侧色条。（注：当前用户端未提供建日程入口，故「日程提醒」类型实际不会产生；其余类型正常。）
3. 点单条标记已读，或「全部已读」。

**数据怎么走**
- 读取：`GET /api/user/notifications`、`GET /api/user/notifications/unread-count`；已读：`POST /api/user/notifications/{id}/read`、`POST /api/user/notifications/read-all`。
- 通知统一由 `create_notification(db, user_id, type, title, content)` 写 `notifications` 表，来源有二：
  - **定时任务**（`services/scheduled.py`）：每日 07:30 天气告警、每月 1 日月报 / 热点 → 同时经 **WebSocket `/ws/{user_id}`** 实时推（在线用户立刻弹）。（注：后端另含每日 07:00「日程提醒」任务，但当前用户端未提供日程入口，故默认不会触发。）
  - **业务触发**（如单品纠错被应用等）。
- 新用户首次进通知中心会 `_ensure_monthly_notifications` 自动补生成当月月报 + 热点（幂等，按 `(user_id, type, title)` 去重）。

### 3.9 搭配审核 / 单品纠错上报

**使用步骤**
1. 首页「搭配工具 → 搭配审核」进 AI 审核页：上传 / 选一套衣服，AI 逐维度（色彩/季节/场合/完整性）打分并给改进建议。
2. 衣橱单品详情里「纠错上报」：勾选识别错的字段（品类/颜色/…）+ 填正确值 + 备注 → 提交给搭配师端审核。

**数据怎么走**
- 搭配审核：`POST /api/user/outfit-review {ids}` → 后端 `check_outfit` / `score_outfit_detailed` 工具逐维度评分返回建议。
- 单品纠错上报：`POST /api/user/item-corrections {item_id, error_fields[], correct_attrs{}, note}` → 校验 `item` 属当前用户 → 落 `item_corrections` 表（`status='pending'`）→ 搭配师端审核。

### 3.10 穿搭回顾 / 采纳记录（附：「日程」说明）

> 产品决策：用户端正交「日程」与独立的「穿搭日志」Tab，**当前均不提供**。以下为实际现状。

**穿搭回顾（真实功能，保留）**
- **使用步骤**：在「我的」页点「穿搭回顾」，选一个日期 → 回看那天穿过哪些单品（来自 `wear_logs`）。
- **数据怎么走**：前端按日期查 `wear_logs`（`GET /api/user/wear-log?date=YYYY-MM-DD`，`user.py`）；「确认今日穿搭」「标记穿过」都会写入 `wear_logs`。

**采纳记录（已停用）**
- 穿搭日志（采纳记录）功能已停用：前端不再依赖、后端 `adopt` 接口仅写 WearLog（供穿搭回顾），不再写 `adoptions` 表；`GET /api/user/adoptions`、`GET /api/user/wear-diary` 接口已注释停用。
- 用户端**没有**独立的「穿搭日志」列表页；按日回顾穿搭请用「穿搭回顾」（读 `mark-worn` 写入的 WearLog，正常可用）。

**套装**：`GET/POST/PUT/DELETE /api/user/outfits`（手动建套装）。

**日程（后端支持，前端未开放）**
- 后端已具备：`GET/POST/PUT/DELETE /api/user/calendar` → 落 `calendar_events`；每日 07:00 定时任务扫 `remind=1` 的当天事件 → 通知。
- 但**用户端未提供任何「日程」入口**（底部导航只有 首页/对话/衣橱/分析/我的），用户无法建提醒，该通知链路实际不会触发。如需启用，需先把日程 UI 接回前端。

---

## 四、搭配师端（Web :5175/stylist）功能详解

给「搭配师」角色，核心是**让 AI 越用越准**。顶部搜索框是命令面板（见「通用：命令面板」）。

### 4.1 概览 Dashboard
- 今日问候 + 待办清单（可勾选）+ 统计卡（知识库条数 / 标签数 / 错误修正数 / 平均评分）+ 7 日趋势图。
- 数据：`GET /api/stylist/stats` 聚合自 `knowledge_chunks / tags / corrections / conversations`。

### 4.2 翻车案例（会话纠错）
**使用步骤**
1. 列表展示用户打分 ≤2 或被标记异常的对话（原问 + AI 答 + 评分）。
2. 补写「正确答案」→ 提交修正 → 进入审批流水线。
3. 修正可一键「转 Few-Shot」预填到 Few-Shot 页。

**数据怎么走**
- `GET /api/stylist/conversations/{id}` 看详情；`POST /api/stylist/corrections` 写修正（`corrections` 表，`status='fixed'`、`conv.status='fixed'`）。
- 提交后：`POST /api/stylist/corrections/{id}/submit` → 进配置端审批。
- 通过后由配置端审批流水线写 `few_shot_examples` 表，反哺 AI。

### 4.3 知识库（RAG）
**使用步骤**
1. 点「上传文档」，选 `.txt / .md / .pdf` → 自动解析分块向量化入库。
2. 分页浏览文档片段、按来源筛选、删除片段。
3. 看统计：总块数、各来源占比。

**数据怎么走**
- `POST /api/stylist/knowledge/upload`：校验后缀 → `DocumentParser.parse_*` 按约 300 字切分 → `Embedder.embed`（本地 `BAAI/bge-small-zh` 或 DeepSeek embedding）→ `vector_store.add_chunk` 写 `chroma_data/store.json` + `KnowledgeChunk(...)` 落 `knowledge_chunks` 表（embedding 失败用随机占位向量，文本仍保留）。
- 浏览：`GET /api/stylist/knowledge/chunks|/sources|/stats`；删除：`DELETE /api/stylist/knowledge/chunks/{chunk_id}`（同时删 `knowledge_chunks` 行 + `vector_store.delete`）。
- **作用**：AI 对话里 `retrieve_knowledge` 工具 `embed(query)` → `VectorStore().search(top_k=4)` 查 `store.json` → 给回答提供穿搭规则/礼仪/风格依据。

### 4.4 标签管理
**使用步骤**：维护 6 类标签（风格/颜色/季节/场合/材质/图案），自定义 + 配色，衣橱单品引用。
**数据怎么走**：`GET/POST/PUT/DELETE /api/stylist/tags` ↔ `tags` 表；衣橱上传时按 `name` 精确匹配自动打标签。

### 4.5 Few-Shot 示例
**使用步骤**：维护「高质量问答范例」（用户输入 + 标准答案）；翻车案例可一键转预填。
**数据怎么走**：`POST/DELETE /api/stylist/few-shot-examples` ↔ `few_shot_examples` 表；AI 对话时 `format_few_shot_prompt` 按向量相似取 top-2 注入 system prompt。

### 4.6 知识缺口检测
**使用步骤**：看「用户常问但 AI 答不好」的话题聚类（基于低分对话），补知识库或转 Few-Shot 后标记已处理。
**数据怎么走**：`GET /api/stylist/knowledge-gaps` 对 `conversations` 中 `score<=2 & status='pending'` 语义聚类；状态记 `knowledge_gap_status` 表（配置端也可改 `POST /api/stylist/knowledge-gaps/{topic_key}/status`）。

### 4.7 单品纠错
**使用步骤**：查看用户上报的衣橱识别错项 → 看 AI 原识别 vs 用户正确值 → 「应用」写回用户衣橱真实数据 / 「拒绝」。
**数据怎么走**：`GET /api/stylist/item-corrections` 列表；`POST /api/stylist/item-corrections/{id}/apply` 把 `correct_attrs` 写回 `ClothingItem` 对应字段（`status='applied'`）；`/reject` 置 `rejected`。数据来自用户端 `POST /api/user/item-corrections`。


---

## 五、配置端（Web :5175/config）功能详解

给「管理员」角色，管系统级配置与运维。顶部搜索框同样是命令面板。

### 5.1 概览 Dashboard
用户数 / 今日推荐数 / 7 日活跃趋势 + 打卡日历热力。数据来自 `users / conversations / wear_logs / calendar_events`（注：采纳率原依赖 `adoptions` 表，该表已停用，运营端采纳率统计暂不可用）。

### 5.2 Prompt 管理（增 / 删 / 改 / 发布）
**使用步骤**
1. 列表展示所有 Prompt 版本；「新建」填名称 + 内容；「编辑」改内容。
2. 每行「删除」按钮（带二次确认弹窗）→ `DELETE /api/config/prompts/{id}`。
3. 某版本「发布」→ 置为 online，旧 online 自动转 history；AI 实际只认 **online** 版本。

**数据怎么走**
- `GET/POST/PUT /api/config/prompts` ↔ `prompt_versions` 表（`status: draft/online/history`）。
- `POST /api/config/prompts/{id}/deploy`：其他 online 置 history，本记录 `status='online'`、`deployed_at=now`。
- 运行时 `ReActAgent.load_online_prompt()` 读 `status=='online'` 的最新一条作 system prompt（历史可回滚：重新发布旧版本即可）。

### 5.3 模型配置（热切换）
**使用步骤**
1. 「对话模型」下拉按组选：DeepSeek Chat / 智谱 GLM-4 系列 / 通义千问系列。
2. 拖 Temperature / Top-P 滑杆。
3. 点「保存配置」→ 弹窗「已切换至 XX，立即生效」→ 用户端下一条对话即用新模型。

**数据怎么走**
- `GET/POST /api/config/model-config` ↔ 内存态 `MODEL_CONFIG`（`config.py` 模块级字典，启动时从 `.env` 初始化）。
- `update_model_config` 改内存 + 按模型名前缀对齐 provider（`glm-`→智谱、`qwen-`→通义、其余 DeepSeek）。
- `get_llm_client()` 按 `MODEL_CONFIG["provider"]` / 前缀返回对应客户端。
- ⚠️ **模型配置不落库**，重启后端即从 `.env` 恢复默认。想固定默认在 `.env` 设 `LLM_PROVIDER` / `DEFAULT_LLM_MODEL`。
- 供应商无 Key 时各 client 返回「演示模式」兜底文案，避免 500。

### 5.4 工具管理（12 个 Agent 工具开关）
**使用步骤**：列表展示 12 个工具（带分页），每个独立开关；关闭后该工具在 Agent 里不可用。重启后状态持久化。
**数据怎么走**：`GET /api/config/tools` + `POST /api/config/tools/toggle {tool_name, enabled}` ↔ `tool_configs` 表（这是少数**会持久化**的配置）。工具定义见 `app/agent/tools/`：

| 工具 | 作用 |
|------|------|
| `get_weather` | 查天气（Open-Meteo，经纬度/城市） |
| `get_wardrobe` | 查用户衣橱单品 |
| `retrieve_knowledge` | 知识库语义检索 |
| `check_outfit` | LLM 逐维度审核搭配 |
| `analyze_image` | 识图（通义 VL） |
| `search_similar_clothes` | CLIP 语义找相似款；配齐模式补下装/鞋 |
| `get_user_profile` | 读用户身材/肤色/风格 |
| `get_my_outfits` | 读用户套装 |
| `get_color_harmony` | 12 色配色轮（互补/邻近/三角…，CIEDE2000 ΔE） |
| `convert_to_pantone` | HEX → Pantone TCX 色号 |
| `score_outfit_detailed` | 可解释规则评分（颜色25/场合25/比例20/材质15/季节10/重复5） |
| `get_seasonal_suitability` | 季节适配（材质温度 × 实时气温） |

### 5.5 审批流水线
**使用步骤**：看翻车案例修正流转 `待修正 → 已修正 → 已审批 → 已上线`；管理员「批准 / 上线 / 退回」。漏斗图 + 瓶颈分析。
**数据怎么走**：`GET /api/config/pipeline`、`GET /api/config/pipeline/corrections?status=review`、`POST /api/config/pipeline/approve {action}`：
- `approve` → 已批准；`deploy` → 已上线 + 同步写 `few_shot_examples` + 刷新 few-shot 缓存；`reject` → 退回 pending。

### 5.6 用户管理
**使用步骤**：用户列表（分页）+ 搜索 + 禁用/启用；可查看任意用户衣橱（只读）。
**数据怎么走**：`/api/admin/*` 与 `users` 表；禁用即把 `is_active=0` → 该用户登录/me/受保护接口全部 403（判定用 `if not getattr(user,'is_active',True)` 而非 `is False`，避免 `0 is False` 误判）。

### 5.7 AI 推理轨迹
`GET /api/config/traces`（分页）+ `GET /api/config/traces/{session_id}` 展开步骤，数据来自 `agent_traces` 表。

### 5.8 系统监控 / 成本
**使用步骤**：看后端进程状态、接口健康检查、每日 LLM Token 消耗（按 DeepSeek/智谱/通义分组）+ 图片识别成本。
**数据怎么走**：`GET /api/config/monitor`、`GET /api/config/cost-stats` ↔ `cost` 表（`services/cost_tracker.py` 每次模型调用记一笔）。

### 通用：命令面板（运营端两端共用）
- **触发**：搜索框回车 / 点击搜索框图标或框边 / `Ctrl`(Win) 或 `Cmd`(Mac) + `K`。
- **操作**：输入关键字按页面名（中文）实时过滤侧栏菜单；`↑↓` 选择、`Enter` 跳转、`Esc` / 点遮罩关闭。
- **数据怎么走**：纯前端，复用 `SidebarLayout` 的 `menus` 配置，`emit('update:active', key)` 切页（与点击左侧图标等价），不请求后端。

---

## 六、后端核心能力（全局数据流）

### 6.1 鉴权与多用户隔离
- 登录发 JWT（HS256, 30 天）；前端每次请求带 `Bearer`。
- `resolve_user_id(authorization)` 解出 `user_id` 并校验 `is_active`；**所有**衣橱/对话/套装查询都带 `user_id == uid` 过滤 → 天然多用户隔离。
- `JWT_SECRET_KEY` 不设则每次后端启动随机生成 → 重启全员强制重登（演示方便；生产固定值）。

### 6.2 ReAct 智能体（LangGraph）
- `app/agent/react_agent.py`：`START → agent → tools → agent → END` 状态机；对外 `run()` 接口兼容。
- 每次请求**新建 agent** → 实时读 `MODEL_CONFIG` → 切模型立即生效。
- 衣橱卡片返回条件见 3.3（衣橱工具命中 ∧ 非购物意图）；拼贴图仅在该条件下生成。

### 6.3 模型工厂（多供应商）
- `llm/__init__.py` 的 `get_llm_client()` 按 provider / 模型名前缀返回客户端：DeepSeek（OpenAI 兼容，支持 tools 调用 + web_search）、智谱 GLM（JWT 鉴权）、通义千问 Qwen（DashScope 兼容）、通义 VL（识图）。
- 全部带成本记录与无 Key 兜底。

### 6.4 视觉管线（上传衣物）
- `vision/detector.py`（YOLOv8n 检测，权重 `E:\models\...`，缺失降级整图）→ `utils/remove_bg.py`（抠图）→ `llm/tongyi_vl.py`（VL 识别）→ `vision/clothing_embedder.py`（CLIP 向量）→ `chroma_data/clothing_store.json`。

### 6.5 RAG 知识库
- `rag/`：PDF/MD 解析分块 + `rag/embedder.py` 向量化 + `rag/vector_store.py` 检索，向量独立存 `chroma_data/store.json`（与衣物向量分开）。

### 6.6 定时任务（`services/scheduled.py`，APScheduler）
| 任务 | 时间 | 行为 |
|------|------|------|
| 每日天气穿搭 | 07:30 | Open-Meteo 取有定位用户的天气 → 生成建议 → 通知 + WebSocket 实时推 |
| 日程提醒 | 07:00 | 扫当天 `calendar_events(remind=1)` → 通知（**需用户端建日程才触发；当前前端无日程入口，实际不触发**） |
| 衣橱月报 | 每月 1 日 08:00 | 扫衣橱生成健康月报 → 通知 |
| 穿搭热点 | 每月 1 日 09:00 | DeepSeek 联网 + RAG 生成当月热点 → 通知 |
| 知识缺口 | 每周一 09:00 | 低分对话聚类检测缺口（仅打印） |

> 「今日穿搭」首页实时展示（`GET /api/user/outfit-by-weather`），不进通知中心。

### 6.7 通知
- 统一入口 `create_notification(...)` 写 `notifications` 表，按 `(user_id, type, title)` 幂等。
- 实时通道：`WebSocket /ws/{user_id}` + `notify_user()`，天气告警同时推（日程提醒也走该通道，但当前前端无日程入口，不会触发）。

---

## 七、技术栈
| 层 | 技术 |
|----|------|
| 后端 | Python 3.12 + FastAPI + SQLAlchemy + SQLite + LangGraph + Chroma（RAG） |
| 用户端 | uni-app（Vue3 + Vite）编译 H5，patch-package 修复 uni-alpha 兼容 |
| 运营端 | Vue3 + Element Plus + ECharts |
| 大模型 | DeepSeek（对话/嵌入）、智谱 GLM、通义千问 Qwen、通义 VL（识图） |
| 视觉 | YOLOv8n（检测）、CLIP（向量）、remove.bg（抠图） |
| 动效 | CSS 三色系统（浅蓝 `#7aa8ff` / 淡薰衣草 `#8B7AC0` / 珊瑚 `#FF9E8E`）+ cubic-bezier 动效 token |

---

## 八、目录结构
```
ai-wardrobe-agent/
├── backend/                # 后端 FastAPI（:8000）
│   ├── app/
│   │   ├── main.py         # 入口（路由挂载、/uploads 静态、/ws WebSocket）
│   │   ├── config.py       # .env 配置 + MODEL_CONFIG（内存态）
│   │   ├── auth/           # JWT 登录鉴权（jwt.py / permissions.py）
│   │   ├── api/            # user / stylist / config / admin / features / notification
│   │   ├── agent/          # ReAct 智能体 + 12 工具 + init_tools + react_agent
│   │   ├── rag/            # 知识库（document_parser / embedder / vector_store）
│   │   ├── llm/            # deepseek / zhipu / tongyi / tongyi_vl / embeddings
│   │   ├── vision/         # detector(YOLO) / clothing_embedder(CLIP)
│   │   ├── models/         # SQLAlchemy 表 + migrate.py（启动幂等加列）
│   │   ├── services/       # cost_tracker / moderation / scheduled / clothing_search / notifications
│   │   ├── schemas/        # Pydantic 请求/响应
│   │   ├── utils/          # 拼图 / 抠图 / LLM JSON 提取
│   │   └── uploads/        # 运行时图片（衣物图/拼贴图）
│   ├── chroma_data/        # 向量文件：store.json(知识库) / clothing_store.json(衣物)
│   ├── app.db              # SQLite（勿删）
│   ├── .env                # 密钥（勿提交）
│   └── requirements.txt
├── frontend/               # 用户端 uni-app H5（:5173）
│   └── src/pages/          # login（登录/注册/记住密码） / user（SPA 五 Tab）
├── frontend-web/           # 运营端 Vue3 + EP（:5175）
│   └── src/views/          # Login.vue / stylist/Index.vue / config/Index.vue / components/SidebarLayout.vue
├── scripts/                # 工具脚本（生成 PDF、测试等）
├── logs/                   # 运行日志（可清空）
├── archive/                # 历史遗留（不参与运行）
└── .workbuddy/             # AI 助手项目记忆（勿手动改）
```

---

## 九、模型切换说明
1. 配置端 → 模型配置 → 选「对话模型」下拉 → 拖 Temperature/Top-P。
2. 点「保存配置」→ 内存态 `MODEL_CONFIG` 立即更新，用户端下一条对话即生效（无需重启）。
3. 重启后端会恢复 `.env` 默认；固定默认在 `.env` 设：
   ```
   LLM_PROVIDER=zhipu        # 或 tongyi / deepseek
   DEFAULT_LLM_MODEL=glm-4-flash
   ```

---

## 十、常见问题 / 注意事项
| 现象 | 处理 |
|------|------|
| 8000 端口被占用 | 换端口起 `uvicorn app.main:app --port 8001`，前端 `/api` 代理默认指 8000，换端口需同步改 |
| 改了后端代码但接口没变化 | 彻底重启后端进程（`--reload` 对 `user.py` 等常不生效） |
| 用户端天气定位不准 | GPS 仅 `localhost` / `HTTPS` 可用；局域网 http 拿不到定位，退回 IP 反查 |
| 上传图片不显示 | 衣橱图必须用 `http://localhost:8000/uploads/...` 完整地址；H5 选图预览用本地 blob URL，勿用服务端返回路径覆盖 |
| 聊天衣橱卡片乱出 | 只有 agent 调了衣橱工具且非购物意图才出卡片；问「买/购」类不会出 |
| `node_modules` 损坏 | 见第二节第 5 步修复 |
| 后端重启后前端要重登 | JWT 默认每次启动换密钥（`.env` 不设固定 `JWT_SECRET_KEY`） |

- `backend/.env` 含真实 API Key，**不要提交 Git**。
- `backend/uploads/`、`app.db`、`chroma_data/` 是运行时数据，删除会丢数据。
- `delete_clothing` 当前不清理 CLIP 向量（孤儿向量，技术债）。
- 模型配置是内存态，重启恢复 `.env`；工具开关 `tool_configs` 持久化。
- 用户端 GPS 定位仅在 `localhost` / `HTTPS` 下可用。
- `archive/`、`scripts/legacy/` 为历史遗留，可忽略。

---

## 十一、二次开发
- **加一个新 Agent 工具**：`app/agent/tools/` 建文件 → 继承 `Tool` 实现 `get_definition()` + `execute()` → `init_tools.py` 注册 → 配置端工具管理自动出现开关（且会落入 `tool_configs` 持久化）。
- **加一个新模型供应商**：仿 `llm/zhipu.py` 写客户端 → `llm/__init__.py` 加前缀推断 → 前端下拉加分组。
- **前端视觉规范**：三色 token（浅蓝 `#7aa8ff` / 淡薰衣草 `#8B7AC0` / 珊瑚 `#FF9E8E`）已内联在样式里，新页面直接复用色值。
- **注意两个易混点**：
  1. `/chat` 有 `/api/chat`（无鉴权遗留调试）与 `/api/user/chat`（真实鉴权）两个，前端用的是后者。
  2. `_pick_outfit_items` 有两版：`/chat` 用 `outfit_collage` 文本匹配版，`quick-recommend` 用 `features` 场景打分版。
