<template>
  <div class="sl">
    <!-- 左侧图标导航（浅蓝胶囊形浮动侧边栏） -->
    <aside class="sl-aside">
      <div class="sl-brand" @click="goHome">
        <div class="sl-brand-logo">
          <el-icon :size="22"><Grid /></el-icon>
        </div>
      </div>
      <div class="sl-menu">
        <div
          v-for="m in menus"
          :key="m.key"
          :class="['sl-menu-item', { active: active === m.key }]"
          :title="m.label"
          @click="onSelect(m.key)"
        >
          <el-icon :size="22"><component :is="m.icon" /></el-icon>
          <span v-if="m.badge && typeof m.badge === 'number'" class="menu-badge">{{ m.badge > 99 ? '99+' : m.badge }}</span>
          <span v-else-if="m.badge" class="menu-tag">{{ m.badge }}</span>
        </div>
      </div>
      <div class="sl-foot" @click="onLogout" title="退出登录">
        <el-icon :size="20"><SwitchButton /></el-icon>
      </div>
    </aside>

    <div class="sl-body">
      <!-- 顶部栏：搜索 + 操作 + 用户 -->
      <header class="sl-header">
        <div class="sl-search">
          <el-icon :size="16"><Search /></el-icon>
          <input v-model="searchText" type="text" placeholder="搜索或输入命令..." @keyup.enter="onSearch" />
        </div>
        <div class="sl-header-actions">
          <el-popover placement="bottom-end" :width="300" trigger="click" popper-class="noti-popover" :show-arrow="false">
            <template #reference>
              <div class="sl-icon-btn" title="通知">
                <el-icon :size="18"><Bell /></el-icon>
                <span v-if="totalBadge" class="header-badge">{{ totalBadge > 99 ? '99+' : totalBadge }}</span>
              </div>
            </template>
            <div class="noti-pop">
              <div class="noti-pop-head">
                <span class="noti-pop-title">通知与待办</span>
                <span class="noti-pop-sub">{{ today }}</span>
              </div>
              <div class="noti-pop-body">
                <slot name="notifications">
                  <div class="noti-empty">
                    <el-icon :size="40" color="#c5d9ff"><Bell /></el-icon>
                    <p>暂无新通知</p>
                  </div>
                </slot>
              </div>
            </div>
          </el-popover>
          <el-dropdown trigger="click">
            <div class="sl-user">
              <el-avatar :size="36" class="sl-avatar">{{ userInitial }}</el-avatar>
              <div class="sl-user-info">
                <div class="sl-user-name">{{ nickname || roleName }}</div>
                <div class="sl-user-role">{{ roleLabel }}</div>
              </div>
              <el-icon :size="14"><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="onLogout">
                  <el-icon><SwitchButton /></el-icon> 退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </header>

      <main class="sl-content">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  Grid, SwitchButton, Search, Bell, ArrowDown
} from '@element-plus/icons-vue'

const props = defineProps({
  active: { type: String, required: true },
  menus: { type: Array, required: true },
  brand: { type: String, default: '管理控制台' },
  role: { type: String, default: 'admin' }
})
const emit = defineEmits(['update:active', 'export', 'add'])
const router = useRouter()
const searchText = ref('')

const nickname = sessionStorage.getItem('web_nickname') || ''
const userInitial = computed(() => (nickname || props.role || 'U').slice(0, 1).toUpperCase())
const roleName = computed(() => (props.role === 'admin' ? '管理员' : '搭配师'))
const roleLabel = computed(() => props.brand || roleName.value)
const totalBadge = computed(() => props.menus.reduce((s, m) => s + (m.badge || 0), 0))
const today = computed(() => {
  const d = new Date()
  const week = ['日', '一', '二', '三', '四', '五', '六']
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 星期${week[d.getDay()]}`
})

function onSelect(key) {
  emit('update:active', key)
}
function goHome() {
  emit('update:active', 'dashboard')
}
function onSearch() {
  // 搜索事件可透传给父组件，目前仅做视觉占位
  emit('search', searchText.value)
}
function onExport() {
  emit('export')
}
function onAdd() {
  emit('add')
}
function onLogout() {
  sessionStorage.removeItem('web_token')
  sessionStorage.removeItem('web_role')
  sessionStorage.removeItem('web_nickname')
  router.replace('/login')
}
</script>

<style scoped>
/* ===== 新设计语言：仿照截图的紫蓝仪表板风 ===== */
.sl {
  --bg: #eef5ff;
  --bg-2: #e1edff;
  --panel: #FFFFFF;
  --panel-2: #FDFBF7;
  --text: #2D3A5A;
  --text-2: #6B7A9C;
  --text-3: #8A9ABA;
  --accent: #7aa8ff;
  --accent-2: #a9c6ff;
  --accent-light: #e1edff;
  /* 淡薰衣草（与 H5 三色系统对齐：浅蓝 + 淡薰衣草 + 珊瑚） */
  --lav-50: #F4EFFA;
  --lav-100: #E8DEF3;
  --lav-200: #D4C0E8;
  --lav-400: #B19CD9;
  --lav-600: #8B7AC0;
  --lav-800: #5D4F80;
  /* 珊瑚 CTA */
  --coral: #FF9E8E;
  --coral-light: #FFE9E2;
  --coral-ink: #D66A60;
  --green: #22C55E;
  --orange: #FF9E8E;
  --red: #EF4444;
  --blue: #5B8DEF;
  --shadow: 0 10px 30px rgba(122, 168, 255, 0.08);
  --shadow-sm: 0 4px 12px rgba(122, 168, 255, 0.06);
  --radius-xl: 22px;
  --radius-lg: 16px;
  --radius-md: 12px;

  display: flex;
  height: 100vh;
  width: 100%;
  overflow: hidden;
  background: var(--bg);
  color: var(--text);
  padding: 14px 14px 14px 12px;
  box-sizing: border-box;
  gap: 14px;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter",
    "Helvetica Neue", "PingFang SC", "HarmonyOS Sans SC", "MiSans",
    "Source Han Sans SC", "Microsoft YaHei", "微软雅黑",
    "Segoe UI", Roboto, "Noto Sans SC", Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
  position: relative;
}
/* 主面板容器外层柔光（与花瓣侧栏呼应） */
.sl::before {
  content: '';
  position: absolute;
  left: 50rpx; top: 30%;
  width: 320rpx; height: 320rpx;
  background: radial-gradient(circle, rgba(177, 156, 217, 0.18), rgba(177, 156, 217, 0) 70%);
  filter: blur(50rpx);
  pointer-events: none;
  z-index: 0;
}

/* ===== 左侧浅蓝胶囊形浮动侧边栏（恢复原版） ===== */
.sl-aside {
  width: 82px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 0 18px;
  background: linear-gradient(180deg, #7aa8ff 0%, #a9c6ff 100%);
  border-radius: 30px;
  box-shadow: 8px 8px 26px rgba(122, 168, 255, 0.25);
  position: relative;
  z-index: 10;
}
.sl-aside::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 20% 8%, rgba(255, 255, 255, 0.18) 0%, transparent 42%),
              radial-gradient(circle at 85% 92%, rgba(255, 255, 255, 0.10) 0%, transparent 34%);
  pointer-events: none;
  border-radius: 30px;
}
.sl-brand { margin-bottom: 28px; cursor: pointer; position: relative; z-index: 1; }
.sl-brand-logo {
  width: 48px;
  height: 48px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #7aa8ff;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
  transition: transform .25s var(--ease-out, cubic-bezier(0.22, 1, 0.36, 1));
}
.sl-brand-logo:hover { transform: rotate(-8deg) scale(1.05); }

.sl-menu {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  align-items: center;
  overflow-y: auto;
  position: relative;
  z-index: 1;
}
.sl-menu-item {
  width: 52px;
  height: 52px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.72);
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.22, 1, 0.36, 1);
  position: relative;
}
.sl-menu-item:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.14);
}
.sl-menu-item.active {
  color: #7aa8ff;
  background: #fff;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
  transform: scale(1.05);
}
.menu-badge {
  position: absolute;
  top: 8px;
  right: 6px;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 9px;
  background: #EF4444;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  line-height: 18px;
  text-align: center;
  border: 2px solid #fff;
  box-shadow: 0 2px 6px rgba(239, 68, 68, 0.32);
}
/* NEW / 文字徽章（珊瑚色，与数字徽章同位置不同背景色） */
.menu-tag {
  position: absolute;
  top: 6px;
  right: 4px;
  padding: 0 6px;
  height: 18px;
  border-radius: 9px;
  background: var(--coral, #FF9E8E);
  color: #fff;
  font-size: 9px;
  font-weight: 800;
  line-height: 18px;
  text-align: center;
  border: 2px solid #fff;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.16);
  letter-spacing: .5rpx;
}

.sl-foot {
  width: 48px;
  height: 48px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.72);
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 10px;
  position: relative;
  z-index: 1;
}
.sl-foot:hover { color: #fff; background: rgba(255, 255, 255, 0.14); }

/* ===== 右侧主体 ===== */
.sl-body { flex: 1; display: flex; flex-direction: column; min-width: 0; }

/* ===== 顶部栏 ===== */
.sl-header {
  height: 76px;
  background: var(--panel);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 28px;
  margin: 0;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  flex-shrink: 0;
}
.sl-search {
  width: 320px;
  height: 42px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 16px;
  background: var(--bg);
  border-radius: 21px;
  color: var(--text-3);
}
.sl-search input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  color: var(--text);
  font-size: 14px;
}
.sl-search input::placeholder { color: var(--text-3); }

.sl-header-actions { display: flex; align-items: center; gap: 14px; }
.sl-action-btn { border-radius: 999px; font-weight: 600; }
.sl-action-btn.ghost {
  background: var(--panel-2);
  border: 1px solid #d6e5ff;
  color: var(--text-2);
}
.sl-action-btn.ghost:hover { border-color: #c5d9ff; color: var(--text); }
.sl-action-btn.primary {
  background: var(--accent);
  border-color: var(--accent);
  box-shadow: 0 6px 16px rgba(122, 168, 255, 0.28);
}
.sl-action-btn.primary:hover { background: #5B8DEF; border-color: #5B8DEF; }

.sl-icon-btn {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-2);
  background: var(--panel-2);
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}
.sl-icon-btn:hover { background: var(--bg); color: var(--text); }
.header-badge {
  position: absolute;
  top: -2px;
  right: -2px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--red);
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  line-height: 16px;
  text-align: center;
  border: 2px solid #fff;
}

.noti-pop { padding: 4px; }
.noti-pop-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  padding: 4px 6px 10px;
  border-bottom: 1px solid #e1edff;
}
.noti-pop-title { font-size: 15px; font-weight: 700; color: var(--text); }
.noti-pop-sub { font-size: 12px; color: var(--text-3); }
.noti-pop-body { max-height: 360px; overflow-y: auto; padding: 0 4px; }
.noti-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 0;
  color: var(--text-3);
  font-size: 13px;
  gap: 8px;
}

/* 通知任务列表默认样式 */
.noti-task-list { display: flex; flex-direction: column; gap: 8px; }
.noti-task-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 12px;
  min-height: 48px;
  border-radius: 12px;
  cursor: pointer;
  background: #FDFBF7;
  transition: background 0.15s ease;
  box-sizing: border-box;
}
.noti-task-item:hover { background: #eef5ff; }
.noti-task-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #7aa8ff;
  flex-shrink: 0;
  box-shadow: 0 0 0 4px rgba(122,168,255,0.12);
}
.noti-task-text {
  flex: 1;
  min-width: 0;
  font-size: 14px;
  color: var(--text);
  line-height: 1.4;
  transition: color 0.2s ease;
}
.noti-task-text.done { color: var(--text-3); text-decoration: line-through; }
.noti-task-check { flex-shrink: 0; margin: 0; padding: 0; }
.noti-task-check :deep(.el-checkbox__inner) { width: 18px; height: 18px; border-radius: 5px; }
.noti-task-check :deep(.el-checkbox__input) { vertical-align: middle; }

.sl-user {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 5px 6px 5px 6px;
  border-radius: 14px;
  cursor: pointer;
  transition: background 0.2s ease;
}
.sl-user:hover { background: var(--panel-2); }
.sl-avatar {
  background: linear-gradient(135deg, #7aa8ff, #a9c6ff);
  color: #fff;
  font-weight: 700;
  font-size: 14px;
}
.sl-user-info { line-height: 1.2; }
.sl-user-name { font-size: 13px; font-weight: 700; color: var(--text); }
.sl-user-role { font-size: 11px; color: var(--text-3); margin-top: 1px; }

.sl-content { flex: 1; overflow-y: auto; padding: 24px 28px 30px 24px; }
</style>

<style>
/* ===== Element Plus 全局覆盖：适配新紫蓝主题 ===== */
.sl .el-card {
  background: #fff !important;
  border: none !important;
  border-radius: 16px !important;
  box-shadow: 0 10px 30px rgba(122, 168, 255, 0.08) !important;
  color: var(--text);
}
.sl .el-card__header { border-bottom: 1px solid #e1edff; color: var(--text); font-weight: 700; }

.sl .el-button--primary {
  --el-button-bg-color: #7aa8ff;
  --el-button-border-color: #7aa8ff;
  --el-button-text-color: #fff;
  --el-button-hover-bg-color: #5B8DEF;
  --el-button-hover-border-color: #5B8DEF;
  --el-button-hover-text-color: #fff;
  --el-button-active-bg-color: #4A7DE4;
  --el-button-active-border-color: #4A7DE4;
  --el-button-active-text-color: #fff;
}
.sl .el-button--primary span,
.sl .el-button--primary .el-icon { color: #fff !important; }
.sl .el-button--success {
  --el-button-bg-color: #22C55E;
  --el-button-border-color: #22C55E;
  --el-button-hover-bg-color: #16A34A;
  --el-button-hover-border-color: #16A34A;
}
.sl .el-tag--primary { --el-tag-bg-color: #e1edff; --el-tag-text-color: #7aa8ff; --el-tag-border-color: #d6e5ff; }
.sl .el-tag--success { --el-tag-bg-color: #DCFCE7; --el-tag-text-color: #16A34A; --el-tag-border-color: #BBF7D0; }
.sl .el-tag--warning { --el-tag-bg-color: #FFF0ED; --el-tag-text-color: #D66A60; --el-tag-border-color: #FFE4DE; }
.sl .el-tag--danger { --el-tag-bg-color: #FEE2E2; --el-tag-text-color: #DC2626; --el-tag-border-color: #FECACA; }
.sl .el-tag--info { --el-tag-bg-color: #eef5ff; --el-tag-text-color: #4A5568; --el-tag-border-color: #d6e5ff; }

.sl .el-table,
.sl .el-table__expanded-cell { background: transparent !important; color: var(--text); }
.sl .el-table tr, .sl .el-table th.el-table__cell { background: transparent !important; }
.sl .el-table td.el-table__cell, .sl .el-table th.el-table__cell.is-leaf { border-bottom: 1px solid #e1edff !important; }
.sl .el-table--enable-row-hover .el-table__body tr:hover > td.el-table__cell { background: #FDFBF7 !important; }
.sl .el-table .cell { color: var(--text); }
.sl .el-table th.el-table__cell .cell { color: var(--text-2); font-weight: 600; }

.sl .el-input__wrapper, .sl .el-textarea__inner {
  background: #FDFBF7 !important;
  box-shadow: 0 0 0 1px #d6e5ff inset !important;
  border-radius: 10px !important;
  color: var(--text) !important;
}
.sl .el-input__wrapper.is-focus { box-shadow: 0 0 0 1px #7aa8ff inset !important; }
.sl .el-input__inner, .sl .el-textarea__inner { color: var(--text) !important; }
.sl .el-form-item__label { color: var(--text-2); font-weight: 500; }

.sl .el-dialog { background: #fff !important; border-radius: 18px !important; box-shadow: 0 24px 60px rgba(45, 58, 90, 0.18) !important; }
.sl .el-dialog__title { color: var(--text) !important; font-weight: 700; }
.sl .el-dialog__body { color: var(--text); }

.sl .el-drawer { background: #fff !important; color: var(--text); }
.sl .el-drawer__header { color: var(--text) !important; border-bottom: 1px solid #e1edff; margin-bottom: 0; padding-bottom: 16px; font-weight: 700; }
.sl .el-drawer__body { color: var(--text); }

.sl .el-dropdown-menu { background: #fff; border: 1px solid #e1edff; box-shadow: 0 10px 30px rgba(122, 168, 255, 0.1); border-radius: 12px; }
.sl .el-dropdown-menu__item { color: var(--text-2); border-radius: 8px; margin: 2px 6px; }
.sl .el-dropdown-menu__item:hover { background: #eef5ff; color: var(--text); }

.sl .el-alert { background: #eef5ff !important; border: 1px solid #d6e5ff !important; color: var(--text-2) !important; }
.sl .el-alert .el-alert__title, .sl .el-alert .el-alert__description { color: var(--text-2) !important; }

.sl .el-divider { border-color: #e1edff; }
.sl .el-pagination { color: var(--text-2); }

/* 页面容器 */
.sl .page { flex: 1 0 auto; min-height: 0; display: flex; flex-direction: column; }

/* 表格翻页错落入场（搭配师端知识库/标签表 — 用 :key 重新挂载触发） */
.el-table__body-wrapper tbody tr {
  animation: wbFadeUp .35s var(--ease-out) both;
}
.el-table__body-wrapper tbody tr:nth-child(1) { animation-delay: .02s; }
.el-table__body-wrapper tbody tr:nth-child(2) { animation-delay: .06s; }
.el-table__body-wrapper tbody tr:nth-child(3) { animation-delay: .10s; }
.el-table__body-wrapper tbody tr:nth-child(4) { animation-delay: .14s; }
.el-table__body-wrapper tbody tr:nth-child(5) { animation-delay: .18s; }
.el-table__body-wrapper tbody tr:nth-child(n+6) { animation-delay: .22s; }

/* 通知 popover 样式（挂载到 body） */
.noti-popover {
  padding: 0 !important;
  border-radius: 16px !important;
  border: 1px solid #e1edff !important;
  box-shadow: 0 20px 50px rgba(122, 168, 255, 0.14) !important;
}
.noti-popover .el-popover__title { display: none; }
</style>
