# AI Wardrobe Agent — 长期项目笔记

## 架构
- 三端：uni-app(Vue3+Vite) 用户端 H5 → 5173；Vue3+Element Plus+ECharts web 端 → 5175（搭配师/配置端）；FastAPI 后端 → 8000。
- 后端 venv：`backend/.venv/Scripts/python.exe`；入口 `uvicorn app.main:app --port 8000`（从 `backend/` 启动；库 `backend/app.db`）。
- 前端 `frontend/src/utils/request.js`：BASE=`/api`，自动带 `Bearer`；接口用 `get('/user/xxx')` 不要自己加 `/api`。
- 无状态 JWT 鉴权（`resolve_user_id` 从 token 解析 user_id，多用户隔离）；`app/auth/permissions.py` 的 `get_current_user` 也校验 `is_active`。配置端「用户管理」可禁用/恢复普通用户；禁用账号登录返回 401「账号已被禁用」。
- **JWT 密钥默认每次后端启动随机生成（仅内存）** → 重启后端即全员强制重新登录（用户端/运营端/搭配师端）。`.env` 设固定 `JWT_SECRET_KEY` 才跨重启保持。H5 的 `request.js` 与 web 的 `main.js` 均已对 401 做“清 token + 跳登录」。

## 设计系统（前端视觉，三端统一）
- **三色和谐**：浅蓝(Base)`#eef5ff/#ffffff/#7aa8ff/#a9c6ff/#d6e5ff` + 淡薰衣草(Accent)`--lav-200 #D4C0E8 / --lav-400 #B19CD9 / --lav-600 #8B7AC0` + 珊瑚(CTA)`#FF9E8E`。文字：墨蓝`#2D3A5A`/次级`#6B7A9C`。
- 禁止紫蓝`#6C5DD3`或旧蓝灰`#3E7BFF`。淡薰衣草工具类`.lav-bg/.lav-text/.lav-border/.lav-badge`。
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
12. **新工具必须加进 `ReActAgent._inject_context` 白名单**（`react_agent.py:91-94`）：任何按 `user_id` 做数据隔离的工具（衣橱/搭配/相似衣物/个人资料/我的搭配 + `score_outfit_detailed` + `get_seasonal_suitability`）**必须**在这白名单里，否则工具 `_resolve_items` 拿不到 user_id 查不到任何单品 → 返回 `{"error":"未找到这些单品（可能不属于当前用户或已删除）"}` → LLM 意译成「评分工具因单品ID与当前用户不匹配无法校验」反馈给用户。新加工具时同步检查白名单。Quick-recommend 真实接口路径是 `/api/user/quick-recommend`（不是 `/api/user/features/quick-recommend`）。

## 用户协作偏好
- 用户只用命令行启动三端（不要一键 launcher，曾删过 `start-all.bat`/`stop-all.bat`）。
- **强偏好实时 GPS 定位，不要“最近城市”近似**。用户在**德化（福建泉州下辖县）**；H5 用真实 GPS+逆地理如实显示，天气按真实坐标。GPS 仅 localhost/HTTPS 可用。
- 用户只熟悉 Java，前端 Vue 由助手维护，勿把 JS 代码丢给用户改。

## 演示账号
- user/123456（用户端）、stylist/123456（搭配师端）、admin/123456（配置端）。

## 长期稳定的关键事实
- 老库加列用 `app/models/migrate.py`（启动时幂等 ALTER）。
- 视觉管线模型：`E:\models\...` 下 YOLOv8n + CLIP(sentence-transformers/clip-ViT-B-32)，衣物向量存 `backend/chroma_data/clothing_store.json`。
- 衣橱单品 `status`：`confirmed` 才进推荐/衣橱列表；批量上传用 `pending` 草稿。`wardrobe-analysis`/`shopping-list` 只统计 `confirmed`；`delete_clothing` 已加 `user_id` 鉴权。
- 场景推荐 `quick-recommend`：后端先 `_pick_outfit_items` 程序化精选一套（每品类一件、最多5件）再交给 AI 只写这一套，返回 `item_ids`；前端 `sceneItems` 优先用 `item_ids` 展示。
- 时间显示：后端存 UTC、返回不带 `Z`；前端统一按 UTC 解析转本地时间（已修 8 小时时差）。
- 衣橱风格筛选匹配 `style`+`occasion`+`tags`；季节筛选按单字模糊（“春”/“夏”匹配“春夏”）。
- 自主搭配审核结果不再后端生成“我的搭配”拼贴图；改由前端在审核结果里用衣橱卡片样式展示“搭配单品”（左侧图片 + 右侧名称 + 分类/颜色/季节标签）。
- **产品决策（2026-08-24）：用户端不提供「日程」入口、也不提供独立「穿搭日志」Tab**。保留「穿搭回顾」（按日期看当天穿了什么，来自 `wear_logs`）。采纳数据仍落 `adoptions` 表供运营端统计，但用户端无列表页。后端 `calendar_events` API + 每日 07:00 日程提醒定时任务**虽存在但因无前端入口实际不触发**。README 已据实改写，勿再声称这两个前端功能。
