# AI Wardrobe Agent — 长期项目笔记

## 架构
- 三端：uni-app(Vue3+Vite) 用户端 H5 → 5173；Vue3+Element Plus+ECharts web 端 → 5175（搭配师/配置端）；FastAPI 后端 → 8000。
- 后端 venv：`backend/.venv/Scripts/python.exe`；入口 `uvicorn app.main:app --port 8000`（从 `backend/` 启动；库 `backend/app.db`）。
- 前端 `frontend/src/utils/request.js`：BASE=`/api`，自动带 `Bearer`；接口用 `get('/user/xxx')` 不要自己加 `/api`。
- 无状态 JWT 鉴权（`resolve_user_id` 从 token 解析 user_id，多用户隔离）；`app/auth/permissions.py` 的 `get_current_user` 也校验 `is_active`。配置端「用户管理」可禁用/恢复普通用户；禁用账号登录返回 401「账号已被禁用」。
- **JWT 密钥默认每次后端启动随机生成（仅内存）** → 重启后端即全员强制重新登录（用户端/运营端/搭配师端）。`.env` 设固定 `JWT_SECRET_KEY` 才跨重启保持。H5 的 `request.js` 与 web 的 `main.js` 均已对 401 做“清 token + 跳登录」。

## 设计系统（前端视觉，三端统一）★2026-09-22 已整体改造
- **现行=极简 SaaS 风**（Linear/Notion/Stripe 那种）：文字近黑`#18181B`/次级`#6B7280`/三级`#9CA3AF`；唯一品牌色**靛蓝`#4F46E5`**（深浅阶 `#312E81→#E0E7FF`）；中性灰底`#F7F8FA`/`#F4F4F5`/`#EEF2FF`；danger 红`#EF4444`；warn 琥珀`#F59E0B`。
- **已废弃（勿再用）甜系三色**：浅蓝`#7aa8ff`/珊瑚`#FF9E8E`/淡薰衣草`#D4C0E8`/墨蓝`#2D3A5A`/奶油`#FDFBF7`。
- 图表（H5 分析页）：品类环形图用 `INDIGO_SCALE` 单色阶、季节条同色系、琥珀只留给「四季」；图例用迷你占比条 `legend-track/legend-fill`。
- **注意**：`pages/user/index.vue` 的 `COLOR_HEX`/`COLOR_HEX_MAP` 是**衣物真实颜色字典**，批量换色时必须整块跳过，勿改成主题色。
- H5=社区风（greet-strip+天气胶囊+通知铃+大圆角卡片+底部导航）；web双端=仪表板（左侧图标栏+顶部栏+白底卡片）。无 emoji，用`frontend/src/components/IconSvg.vue`线性SVG。
- 动效 token（App.vue 全局）：入场/移动/弹簧三条贝塞尔；关键帧`h5FadeUp/h5Pop/h5Mask/h5SheetUp/h5Shimmer/h5BellShake/h5Breath`；仅动`transform+opacity`，不用`transition:all`；`@media(prefers-reduced-motion:reduce)`降速。

## ★ 必须知道的坑（反复踩）
1. **uni-app H5 dev server 忽略 `vite.config.js` 的 `server.proxy`**，永远把`/api`代理到`localhost:8000`。改代理目标无效。
2. **8000 后端宿主进程沙箱杀不掉**：沙箱只见网络不见 PID；8000 没监听时沙箱可自己拉起实例。判断：`netstat -ano | findstr :8000` 无 LISTENING 即可起。
3. **前端改完代码要 `git commit` 才不被沙箱恢复删掉**（仅`git add`不够）。vite/vue 项目必须有 index.html。
4. **8000 残留多 uvicorn 进程 → 假成功/500/删除不生效**：删除/写操作“看起来成功但库没变”的根因。**根治：宿主 PowerShell 杀光所有 python/uvicorn → 确认 8000 释放 → 启动唯一实例**（先不加`--reload`）。
5. **vite node_modules 易损坏**：报 `Cannot find module 'vite/dist/node/chunks/dist.js'` 时重装 vite@5.4.21 并 `npm run postinstall`。`vite.config.js` 必须带 `import { defineConfig } from 'vite'` 和 `import uni from '@dcloudio/vite-plugin-uni'`，勿带 BOM。
6. **uvicorn `--reload` 在 Windows 对 `user.py` 改动常不生效**，改代码仍 500 优先彻底重启。
7. **沙箱 Python 安全 shim** 会拦截后端进程内累计批量 `os.remove`/`shutil`（触发`SystemExit`）。后端清理用“固定文件名覆盖写”，勿循环删旧文件；agent Bash 用 `rm` 不受影响。
8. **PowerShell 5.1 默认 ANSI(GBK)** 会损坏 UTF-8 中文文件。改 `.vue/.py` 一律用编辑工具/UTF-8 读写，禁 PS Set-Content 默认编码。
9. **`.env` 里 `JWT_SECRET_KEY=your_secret_key_change_this` 占位值会让“随机密钥”逻辑失效**：`config.py` 用 `os.getenv("JWT_SECRET_KEY") or secrets.token_hex(32)`，占位串非空会短路走固定值 → 重启后端旧 token 仍有效、不会强制重新登录。**要“重启即强制重登”必须注释/删除该 `.env` 行**（当前已注释）。改完须真正重启后端进程才生效（运行中的进程内存里仍是旧密钥）。
10. **`is_active` 是 `Column(Integer, default=1)`（0/1 整数），禁用判定必须用 `if not getattr(user,"is_active",True):` 而绝不能写 `is False`**：Python 中 `0 is False` 恒为 `False`，会导致禁用账号照样通过校验（登录/me/受保护接口全拦不住）。三处均已改为 `not`：`app/api/auth.py`(login `is_active` 校验、me 校验)、`app/auth/permissions.py`(get_current_user)。仅改文件不够，**须真正重启后端进程**才生效（旧进程内存里还是坏逻辑）。
11. **所有 LLM 客户端必须对齐：长超时 + try/except 兜底**：`app/llm/zhipu.py` 与 `app/llm/deepseek.py`（及将来 `tongyi.py`）必须既设 `httpx.Client(timeout=90)` 应对高发期网关慢、又把整段 `client.post + resp.json()` 包进 `try/except Exception`。漏掉任一供应商就会在高峰让 `httpx.ReadTimeout`/`ConnectError` 穿透到 FastAPI 抛 500。前端 devtools 体现为 `/api/user/chat` 偶发 500 → 页面"请求失败，请检查后端"。**修完必须真重启后端**才生效。临时盲测脚本：`backend/test_sampling.py`（在内存改 `cfg.MODEL_CONFIG["temperature"]/["top_p"]`，不落库）。
13. **★ 本仓库沙箱会「额外删除」工作区文件，`git rm` 会报假错（2026-09-22 严重踩坑）**：执行 `git rm` 后常见 `fatal: pathspec ... did not match any files`，而此时**文件其实已被删掉，且可能连带删掉未在删除清单内的兄弟文件**（实测：删 `scripts/legacy` 时 `scripts/` 下 6 个在用脚本一并消失；删 `index.vue.rev` 时主文件 `index.vue` 也消失）。**规避做法**：① 每次删除后立刻 `git status --short` 核对 ` D`（未暂存删除）清单；② 误删一律 `git checkout HEAD -- <path>` 恢复（已跟踪文件 100% 可恢复）；③ 删除动作完成后**立即 commit** 锁定；④ 临时脚本别放项目根目录（会被秒删），改用已跟踪文件直接编辑。
14. **新工具必须加进 `ReActAgent._inject_context` 白名单**（`react_agent.py:91-94`）：任何按 `user_id` 做数据隔离的工具（衣橱/搭配/相似衣物/个人资料/我的搭配 + `score_outfit_detailed` + `get_seasonal_suitability`）**必须**在这白名单里，否则工具 `_resolve_items` 拿不到 user_id 查不到任何单品 → 返回 `{"error":"未找到这些单品（可能不属于当前用户或已删除）"}` → LLM 意译成「评分工具因单品ID与当前用户不匹配无法校验」反馈给用户。新加工具时同步检查白名单。Quick-recommend 真实接口路径是 `/api/user/quick-recommend`（不是 `/api/user/features/quick-recommend`）。

## 用户协作偏好
- 用户只用命令行启动三端（不要一键 launcher，曾删过 `start-all.bat`/`stop-all.bat`）。
- **强偏好实时 GPS 定位，不要“最近城市”近似**。用户在**德化（福建泉州下辖县）**；H5 用真实 GPS+逆地理如实显示，天气按真实坐标。GPS 仅 localhost/HTTPS 可用。
- 用户只熟悉 Java，前端 Vue 由助手维护，勿把 JS 代码丢给用户改。

## 演示账号
- user/123456（用户端）、stylist/123456（搭配师端）、admin/123456（配置端）。

## 长期稳定的关键事实
- **2026-10-20 阿里云 DashScope 已下线旧 VL 系列**：`qwen-vl-plus`/`qwen-vl-max` 调用返回 `Model not exist`（此前衣橱识图一直在静默失败）。已换 **`qwen3-vl-plus`**（实测可调）：`.env` 加 `VISION_MODEL=qwen3-vl-plus`，`config.py` 默认值、`schemas/__init__.py` ModelConfigUpdate、`tongyi_vl.py` 兜底同步改（提交 `a85b86f`）。改后**须重启后端**才生效。
- **云端 AI 额度口径（2026-10-20 实测/查证）**：百炼新用户每模型 100 万 tokens、90 天有效，本账号一批 **2026/10/31 到期**，各模型（含日期快照版）额度独立不互通；「免费额度用完即停」开关开=用完即停，按量付费需另行开通（qwen-plus 剩 97.7 万）。DeepSeek=充值余额（注册 500 万 tokens 仅 30 天、早已过期）；智谱为备选 provider 默认未启用；remove.bg 实测纯免费档（free_calls=50/月、credits=0）。本地 embedding/YOLO+CLIP 无额度问题。
- 老库加列用 `app/models/migrate.py`（启动时幂等 ALTER）。
- 视觉管线模型：`E:\models\...` 下 YOLOv8n + CLIP(sentence-transformers/clip-ViT-B-32)，衣物向量存 `backend/chroma_data/clothing_store.json`。
- 衣橱单品 `status`：`confirmed` 才进推荐/衣橱列表；批量上传用 `pending` 草稿。`wardrobe-analysis`/`shopping-list` 只统计 `confirmed`；`delete_clothing` 已加 `user_id` 鉴权。
- 场景推荐 `quick-recommend`：后端先 `_pick_outfit_items` 程序化精选一套（每品类一件、最多5件）再交给 AI 只写这一套，返回 `item_ids`；前端 `sceneItems` 优先用 `item_ids` 展示。
- 时间显示：后端存 UTC、返回不带 `Z`；前端统一按 UTC 解析转本地时间（已修 8 小时时差）。
- 衣橱风格筛选匹配 `style`+`occasion`+`tags`；季节筛选按单字模糊（“春”/“夏”匹配“春夏”）。
- 自主搭配审核结果不再后端生成“我的搭配”拼贴图；改由前端在审核结果里用衣橱卡片样式展示“搭配单品”（左侧图片 + 右侧名称 + 分类/颜色/季节标签）。
- **产品决策（2026-08-24）：用户端不提供「日程」入口、也不提供独立「穿搭日志」Tab**。保留「穿搭回顾」（`GET /api/user/wardrobe/wear-by-date`，读 `wear_logs`，由 `mark-worn` 写入）。
- **2026-09-22 死代码清理（提交 `85cf921`/`b23dab7`/`15fb99f`）**：日程(FR-C6)与采纳链路(FR-C7)的代码**已彻底删除**（不再是"保留但未启用"）——`models/calendar.py`、4 个 `/api/user/calendar`、`CalendarEvent*`/`Adoption*`/`ABTest*` schema、`services/{pipeline,ab_test}.py`、`scheduled.py` 的 `run_event_reminders`/`run_daily_push`、H5 的 `src/views/*`+`src/router/index.js`；另删 7 个零调用接口（logout、tools/reorder、ab-test、knowledge/sources、corrections/{id}/submit、wardrobe/upload-image、outfits/adopt）。接口数 93→80。
- **清理后仍须保留**：`POST /api/user/notifications/trigger?job=monthly|trend|all`（答辩现场手动触发推送的唯一手段，前端不调用但勿删）；`models/adoption.py`+`adoption_records` 表。
## 毕设 / 开题（2026-10-19 确认）
- **本仓库即毕业设计**：题目《基于大语言模型智能体的个性化衣橱管理与穿搭推荐系统设计与实现》，2027 届，**厦门大学嘉庚学院**（开题模板为该校《本科生毕业论文（设计）指导工作进度记录表》）。`答辩话术.md` 亦自述为"毕设答辩话术"。
- 开题报告成品：`C:\Users\23737\Desktop\开题报告_基于大模型智能体的个性化衣橱管理与穿搭推荐系统.docx`；进度口径 2026.10—2027.05（5 阶段）。
- 工具坑：`editor_sdk`（tencent-local-office-edit）对二进制 `.doc` 打开后所有 `doc_*` 报 `document is not open`；改用 **Word COM（PowerShell）** 转 docx + 段落级填充。中文内容走 UTF-8 JSON 文件传入，.ps1 在本机无法执行，**内联命令可执行**。

- **采纳记录已重新接线（2026-09-22 提交 `5f5ca77`）**：写入挂在 `mark-worn`（「确认今日穿搭」/「标记穿过」，`backend/app/api/user.py`）成功后 → 补写一条 `AdoptionRecord`（`source='today'`、`scene='今日穿搭'`）。幂等口径=**同用户+同天+同批单品只记一次；点「换一套」后再确认会再记一条**。返回体带 `adoption_id`/`adoption_counted` 便于观察。**不要**再把它当成"冻结的历史数据"——运营端「采纳数/采纳率/采纳来源分布」现在会随演示增长（`admin.py:79,104` 读它）。用户端「穿搭日志」列表入口仍不提供。
