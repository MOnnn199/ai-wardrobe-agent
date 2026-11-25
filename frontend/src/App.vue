<script>
export default {
  onLaunch() {
    const token = uni.getStorageSync('token')
    if (token) {
      uni.reLaunch({ url: '/pages/user/index' })
    }
  },
  onShow() {
    console.log('AI 穿搭助手 App Show')
  }
}
</script>

<style>
/* 全局样式
 * 字体系统（对齐 Apple / Linear / 小红书 的"高级感"实践）：
 * - 系统字体栈：iOS/macOS 苹方 → 华为 HarmonyOS Sans → 小米 MiSans → 思源黑体 → Windows 微软雅黑兜底
 * - 数字/英文优先 SF Pro / Inter，让统计数据排版更精致
 * - tabular-nums：数字等宽对齐（价格/分数/日期不跳动）
 * - font-smoothing：macOS 抗锯齿，观感更细
 */
page {
  background: #F7F8FA;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue",
    "PingFang SC", "HarmonyOS Sans SC", "MiSans", "Source Han Sans SC",
    "Microsoft YaHei", "微软雅黑", "Segoe UI", Roboto, "Noto Sans SC", sans-serif;
  color: #18181B;
  box-sizing: border-box;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
  font-feature-settings: "palt" on;
  /* 数字等宽：日期/分数/统计数字全局对齐，汉字不受影响 */
  font-variant-numeric: tabular-nums;
}
/* 数字等宽工具类：金额 / 分数 / 日期 / 统计数字排版更齐 */
.num,
.num-text {
  font-variant-numeric: tabular-nums;
  font-feature-settings: "tnum" on;
  letter-spacing: 0;
}
/* 现代标题：收紧字距，更接近设计工具排版 */
.title-tight {
  letter-spacing: -0.01em;
}
view,
text,
button,
input,
textarea,
image {
  box-sizing: border-box;
}

/* =====================================================================
 * 全局动效（学习项目风格：淡入上移 + 弹出 + 按压回弹）
 * 配色沿用浅蓝奶油色系：主蓝 #4F46E5 / 强调珊瑚 #EF4444 / 墨蓝 #18181B
 * ===================================================================== */
@keyframes h5FadeUp {
  from { opacity: 0; transform: translateY(16rpx); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes h5Pop {
  from { opacity: 0; transform: scale(0.96); }
  to   { opacity: 1; transform: scale(1); }
}
@keyframes h5Mask {
  from { opacity: 0; }
  to   { opacity: 1; }
}

/* 工具类 */
.fade-up { animation: h5FadeUp .4s ease both; }

/* 各主面板首次进入时淡入上移 */
.page .panel { animation: h5FadeUp .4s ease both; }

/* 首页：大卡片 / 分类磁贴 / 搭配工具 错落弹出 */
.home-panel .hero-card { animation: h5FadeUp .45s ease both; }
.home-panel .cat-tile { animation: h5Pop .4s ease both; }
.home-panel .tool-tile { animation: h5Pop .45s ease both; }
.home-panel .tool-tile:nth-child(1) { animation-delay: .06s; }
.home-panel .tool-tile:nth-child(2) { animation-delay: .12s; }

/* 聊天消息逐条淡入 */
.chat-box .msg { animation: h5FadeUp .3s ease both; }

/* 弹窗：遮罩淡入 + 卡片弹出 */
.mask { animation: h5Mask .25s ease both; }
.scene-dialog { animation: h5Pop .3s cubic-bezier(.2, .9, .4, 1.1) both; }

/* 按压回弹反馈（桌面 H5 预览可见；触摸端多数浏览器亦支持 :active） */
.hero-btn,
.tool-tile,
.cat-tile,
.send-btn,
.mini-btn,
.wh-dlg-btn,
.notify-bell,
.tb-weather-pill {
  transition: transform .15s ease, box-shadow .15s ease;
}
.hero-btn:active,
.tool-tile:active,
.cat-tile:active,
.send-btn:active,
.mini-btn:active,
.wh-dlg-btn:active,
.notify-bell:active,
.tb-weather-pill:active {
  transform: scale(.96);
}

/* =====================================================================
 * 2026 色系扩展：淡薰衣草 (副强调 / 收藏 / 高级感)
 * 与原有浅蓝 + 珊瑚形成三色和谐 (灵感来自 Depop / SSENSE)
 * ===================================================================== */
page {
  --lav-50:  #F5F3FF;
  --lav-100: #EDE9FE;
  --lav-200: #DDD6FE;
  --lav-400: #A5B4FC;
  --lav-600: #818CF8;
  --lav-800: #4F46E5;
}
.lav-bg     { background: var(--lav-100); }
.lav-text   { color: var(--lav-600); }
.lav-border { border-color: var(--lav-200); }
.lav-badge  {
  display: inline-block; padding: 4rpx 14rpx; font-size: 22rpx; font-weight: 600;
  background: var(--lav-100); color: var(--lav-600); border-radius: 16rpx;
  border: 1rpx solid var(--lav-200);
  letter-spacing: .5rpx;
}

/* =====================================================================
 * 新关键帧 — 学习自 Apple / Emil Kowalski / 小红书 / Linear
 * 原则: 仅动 transform + opacity
 *   入场 cubic-bezier(0.22, 1, 0.36, 1)
 *   移动 cubic-bezier(0.25, 1, 0.5, 1)
 *   弹簧 cubic-bezier(0.34, 1.56, 0.64, 1)
 * ===================================================================== */
@keyframes h5SheetUp {
  from { transform: translateY(100%); }
  to   { transform: translateY(0); }
}
@keyframes h5Shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
@keyframes h5BellShake {
  0%,100% { transform: rotate(0); }
  20%     { transform: rotate(-15deg); }
  40%     { transform: rotate(12deg); }
  60%     { transform: rotate(-8deg); }
  80%     { transform: rotate(4deg); }
}
@keyframes h5Breath {
  0%,100% { opacity: .75; }
  50%     { opacity: 1; }
}

/* 骨架屏 shimmer (学习自 Linear / Notion) */
.h5-skel {
  background: linear-gradient(90deg, #F7F8FA 0%, #FAFAFB 50%, #F7F8FA 100%);
  background-size: 200% 100%;
  animation: h5Shimmer 1.4s linear infinite;
  border-radius: 12rpx;
}

/* 底部弹层拖拽把手 (学习自 iOS / 小红书) */
.sheet-handle {
  width: 72rpx; height: 8rpx; border-radius: 4rpx;
  background: #F4F4F5; margin: 16rpx 0 8rpx;
  align-self: center;
  flex-shrink: 0;
}

/* 通知呼吸点 (小红书风格 - 新消息提示) */
.h5-breath     { animation: h5Breath 2.2s ease-in-out infinite; }
.h5-bell-shake { animation: h5BellShake .6s ease both; transform-origin: 50% 10%; }

/* =====================================================================
 * 无障碍 — 尊重用户的 prefers-reduced-motion 偏好
 * ===================================================================== */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
</style>
