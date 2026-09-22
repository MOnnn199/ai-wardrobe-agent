<template>
  <div class="login-wrap">
    <!-- clipPath：给右侧插画区切出 S 曲线左边界 -->
    <svg width="0" height="0" aria-hidden="true">
      <defs>
        <clipPath id="sCurve" clipPathUnits="objectBoundingBox">
          <path
            d="M0,0
               C0.30,0.14 0.0,0.34 0.14,0.50
               C0.30,0.66 0.02,0.86 0,1
               L1,1 L1,0 Z"
          />
        </clipPath>
      </defs>
    </svg>

    <!-- 左上角系统名 -->
    <div class="form-system">AI 衣橱智能体 · 运营控制台</div>

    <!-- 左侧：白色表单区（占满左半屏） -->
    <main class="form-side">
      <div class="form-content">
        <div class="form-head">
          <h2 class="form-title">{{ role === 'stylist' ? '搭配师端登录' : '配置端登录' }}</h2>
        </div>

        <el-form @submit.prevent="onLogin" class="form-body">
          <el-form-item class="role-row">
            <el-segmented v-model="role" :options="roleOptions" size="large" block />
          </el-form-item>

          <el-form-item>
            <el-input v-model="username" placeholder="请输入用户名" size="large" :prefix-icon="User" />
          </el-form-item>

          <el-form-item>
            <el-input
              v-model="password"
              :type="showPwd ? 'text' : 'password'"
              placeholder="请输入密码"
              size="large"
              :prefix-icon="Lock"
              @keyup.enter="onLogin"
            >
              <template #suffix>
                <div class="pwd-eye" @click="togglePwd">
                  <transition name="eye-swap" mode="out-in">
                    <el-icon v-if="showPwd" key="open" :size="18"><View /></el-icon>
                    <el-icon v-else key="closed" :size="18"><Hide /></el-icon>
                  </transition>
                </div>
              </template>
            </el-input>
          </el-form-item>

          <transition name="err-fade">
            <el-alert v-if="err" :title="err" type="error" show-icon :closable="false" class="form-err" />
          </transition>

          <el-button type="primary" class="login-btn" :loading="loading" size="large" @click="onLogin">
            登 录
          </el-button>
        </el-form>

        <div class="form-tip">
          演示账号：<b>{{ role === 'stylist' ? 'stylist' : 'admin' }}</b> / 123456
        </div>
      </div>
    </main>

    <!-- 右侧：浅蓝插画品牌区（S 曲线左边界，全屏） -->
    <aside class="brand-side">
      <div class="brand-content">
        <div class="brand-hero">
          <h1 class="brand-title">穿搭运营工作台</h1>
          <p class="brand-sub">让每一次推荐都更懂用户</p>
        </div>

        <div class="brand-illustration">
          <svg class="city-svg" viewBox="0 0 500 360" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="sky" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="#F7F8FA"/>
                <stop offset="100%" stop-color="#EEF2FF"/>
              </linearGradient>
              <linearGradient id="b1" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="#C7D2FE"/>
                <stop offset="100%" stop-color="#C7D2FE"/>
              </linearGradient>
              <linearGradient id="b2" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="#E5E7EB"/>
                <stop offset="100%" stop-color="#C7D2FE"/>
              </linearGradient>
              <linearGradient id="road" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#EEF2FF"/>
                <stop offset="100%" stop-color="#F4F4F5"/>
              </linearGradient>
            </defs>
            <rect x="0" y="0" width="500" height="360" fill="url(#sky)" rx="24"/>
            <ellipse cx="80" cy="70" rx="35" ry="18" fill="#fff" opacity="0.8"/>
            <ellipse cx="110" cy="62" rx="28" ry="16" fill="#fff" opacity="0.8"/>
            <ellipse cx="380" cy="55" rx="40" ry="20" fill="#fff" opacity="0.8"/>
            <ellipse cx="420" cy="48" rx="30" ry="15" fill="#fff" opacity="0.8"/>
            <path d="M40 280 L250 180 L460 280 L250 340 Z" fill="url(#road)"/>
            <path d="M40 280 L250 340 L250 180 Z" fill="#C7D2FE" opacity="0.4"/>
            <path d="M250 180 L250 340" stroke="#C7D2FE" stroke-width="3"/>
            <path d="M140 230 L360 230" stroke="#C7D2FE" stroke-width="2" stroke-dasharray="8 8"/>
            <g transform="translate(120, 140)">
              <path d="M0 110 L0 30 L40 10 L80 30 L80 110 Z" fill="url(#b1)"/>
              <rect x="10" y="40" width="12" height="12" fill="#fff" opacity="0.5"/>
              <rect x="32" y="40" width="12" height="12" fill="#fff" opacity="0.5"/>
              <rect x="54" y="40" width="12" height="12" fill="#fff" opacity="0.5"/>
              <rect x="10" y="70" width="12" height="12" fill="#fff" opacity="0.5"/>
              <rect x="32" y="70" width="12" height="12" fill="#fff" opacity="0.5"/>
              <rect x="54" y="70" width="12" height="12" fill="#fff" opacity="0.5"/>
            </g>
            <g transform="translate(210, 110)">
              <path d="M0 140 L0 20 L50 0 L100 20 L100 140 Z" fill="url(#b2)"/>
              <rect x="15" y="40" width="14" height="14" fill="#fff" opacity="0.5"/>
              <rect x="42" y="40" width="14" height="14" fill="#fff" opacity="0.5"/>
              <rect x="69" y="40" width="14" height="14" fill="#fff" opacity="0.5"/>
              <rect x="15" y="80" width="14" height="14" fill="#fff" opacity="0.5"/>
              <rect x="42" y="80" width="14" height="14" fill="#fff" opacity="0.5"/>
              <rect x="69" y="80" width="14" height="14" fill="#fff" opacity="0.5"/>
            </g>
            <g transform="translate(320, 150)">
              <path d="M0 100 L0 35 L30 15 L60 35 L60 100 Z" fill="url(#b1)"/>
              <rect x="10" y="45" width="10" height="10" fill="#fff" opacity="0.5"/>
              <rect x="28" y="45" width="10" height="10" fill="#fff" opacity="0.5"/>
              <rect x="44" y="45" width="10" height="10" fill="#fff" opacity="0.5"/>
            </g>
            <!-- 小人 -->
            <g transform="translate(145, 255)">
              <circle cx="0" cy="-14" r="5" fill="#18181B"/>
              <path d="M-6 -4 L6 -4 L4 18 L-4 18 Z" fill="#4F46E5"/>
              <path d="M-10 -2 L-6 -2 L-8 10 Z" fill="#18181B" opacity="0.5"/>
              <path d="M6 -2 L10 -2 L8 10 Z" fill="#18181B" opacity="0.5"/>
            </g>
            <g transform="translate(355, 275)">
              <circle cx="0" cy="-14" r="5" fill="#18181B"/>
              <path d="M-6 -4 L6 -4 L4 18 L-4 18 Z" fill="#7BD3A4"/>
              <path d="M-10 -2 L-6 -2 L-8 10 Z" fill="#18181B" opacity="0.5"/>
              <path d="M6 -2 L10 -2 L8 10 Z" fill="#18181B" opacity="0.5"/>
            </g>
            <circle cx="100" cy="265" r="10" fill="#7BD3A4"/>
            <circle cx="115" cy="258" r="8" fill="#62C994"/>
            <circle cx="390" cy="265" r="10" fill="#7BD3A4"/>
            <circle cx="405" cy="258" r="8" fill="#62C994"/>
            <circle cx="250" cy="150" r="6" fill="#fff" opacity="0.9"/>
            <circle cx="180" cy="200" r="5" fill="#fff" opacity="0.8"/>
            <circle cx="320" cy="210" r="5" fill="#fff" opacity="0.8"/>
            <path d="M250 150 L180 200" stroke="#fff" stroke-width="1.5" stroke-dasharray="4 4" opacity="0.7"/>
            <path d="M250 150 L320 210" stroke="#fff" stroke-width="1.5" stroke-dasharray="4 4" opacity="0.7"/>
          </svg>
        </div>
      </div>
    </aside>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { User, Lock, View, Hide } from '@element-plus/icons-vue'

const PREFIX = { stylist: 'stylist', admin: 'config' }
const roleOptions = [
  { label: '搭配师端', value: 'stylist' },
  { label: '配置端', value: 'admin' }
]

const router = useRouter()
const role = ref('stylist')
const username = ref('')
const password = ref('')
const showPwd = ref(false)
const err = ref('')
const loading = ref(false)

function togglePwd() { showPwd.value = !showPwd.value }

async function onLogin() {
  if (loading.value) return
  err.value = ''
  if (!username.value || !password.value) {
    err.value = '请输入用户名和密码'
    return
  }
  loading.value = true
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: username.value, password: password.value })
    })
    const data = await res.json()
    if (!res.ok) {
      err.value = data.detail || '登录失败'
      loading.value = false
      return
    }
    if (data.role !== role.value) {
      err.value =
        role.value === 'stylist'
          ? '该账号不是搭配师账号，请切换「搭配师端」身份登录'
          : '该账号不是配置端账号，请切换「配置端」身份登录'
      loading.value = false
      return
    }
    sessionStorage.setItem('web_token', data.token)
    sessionStorage.setItem('web_role', data.role)
    sessionStorage.setItem('web_nickname', data.nickname || username.value)
    router.replace('/' + PREFIX[role.value])
  } catch (e) {
    err.value = '登录失败，请检查后端是否运行'
    loading.value = false
  }
}
</script>

<style scoped>
/* ===== 运营端登录：全屏分栏，左白右图，S 曲线分隔（无外框） ===== */
.login-wrap {
  --text: #18181B;
  --text-2: #6B7280;
  --text-3: #9CA3AF;
  --accent: #6366F1;

  position: relative;
  min-height: 100vh;
  overflow: hidden;
  background: #ffffff;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', Roboto, Helvetica, Arial, sans-serif;
}

/* 左上角系统名 */
.form-system {
  position: absolute;
  top: 38px;
  left: 64px;
  z-index: 3;
  font-size: 15px;
  color: var(--accent);
  letter-spacing: 1px;
  font-weight: 700;
}

/* ===== 左侧：白色表单区（占满左半屏） ===== */
.form-side {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 56%;
  background: #ffffff;
  z-index: 1;
  display: flex;
  align-items: center;
}
.form-content {
  width: 100%;
  max-width: 480px;
  padding: 86px 64px 52px 80px;
  box-sizing: border-box;
}
.form-head { margin-bottom: 44px; }
.form-title { font-size: 28px; font-weight: 700; color: var(--text); margin: 0; }
.form-body { width: 100%; }

.form-body :deep(.el-form-item) { margin-bottom: 26px; }
.form-body :deep(.el-form-item__content) { line-height: 48px; }
.form-body :deep(.el-input__wrapper) {
  height: 48px;
  border-radius: 999px;
  background: #F7F8FA;
  box-shadow: inset 0 0 0 1px #F4F4F5;
  padding: 0 18px;
}
.form-body :deep(.el-input__inner) { font-size: 14px; color: var(--text); }
.form-body :deep(.el-input__wrapper.is-focus) { box-shadow: inset 0 0 0 1px var(--accent); background: #fff; }
.form-body :deep(.el-input__prefix) { color: #C7D2FE; }

/* 密码可视眼睛：圆形触控区 + 弹簧旋转切换动画 */
.pwd-eye {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  color: #C7D2FE;
  cursor: pointer;
  transition: background .2s ease, color .2s ease, transform .2s cubic-bezier(.34, 1.56, .64, 1);
}
.pwd-eye:hover { color: var(--accent); background: rgba(140, 184, 255, .12); }
.pwd-eye:active { transform: scale(.8); }
.eye-swap-enter-active,
.eye-swap-leave-active {
  transition: opacity .15s ease, transform .26s cubic-bezier(.34, 1.56, .64, 1);
}
.eye-swap-enter-from { opacity: 0; transform: scale(.3) rotate(-70deg); }
.eye-swap-leave-to   { opacity: 0; transform: scale(.3) rotate(70deg); }

/* 角色切换：胶囊圆角 */
.form-body :deep(.el-segmented) {
  --el-segmented-bg-color: #EEF2FF;
  --el-segmented-item-selected-bg-color: #fff;
  --el-segmented-item-selected-color: var(--accent);
  --el-segmented-item-color: var(--text-2);
  box-shadow: inset 0 0 0 1px #F4F4F5;
  border-radius: 999px;
  padding: 5px;
  width: 100%;
}
.form-body :deep(.el-segmented__group) {
  border-radius: 999px;
}
.form-body :deep(.el-segmented__item) {
  border-radius: 999px;
  padding: 8px 0;
}
.form-body :deep(.el-segmented__item.is-selected) {
  border-radius: 999px;
  font-weight: 700;
}
.form-body :deep(.el-segmented__item-selected) {
  border-radius: 999px !important;
  background: #ffffff;
  box-shadow: 0 2px 6px rgba(31, 42, 68, 0.08);
}

.role-row :deep(.el-form-item__content) { margin-left: 0 !important; }

.login-btn {
  width: 100%;
  height: 48px;
  margin-top: 8px;
  border: none;
  border-radius: 999px;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 2px;
  /* 纯色浅蓝（去渐变）+ 拟物双投影 */
  background: #4F46E5;
  box-shadow:
    0 12px 28px rgba(122, 168, 255, .32),
    -3px -3px 8px rgba(255, 255, 255, .7),
    inset 0 1px 0 rgba(255, 255, 255, .28);
  transition: all .24s cubic-bezier(.22, 1, .36, 1);
  position: relative;
  overflow: hidden;
}
/* 高光扫过（hover 时从左滑到右） */
.login-btn::after {
  content: '';
  position: absolute;
  top: 0; left: -60%;
  width: 40%; height: 100%;
  background: linear-gradient(105deg, transparent, rgba(255, 255, 255, .38), transparent);
  transform: skewX(-20deg);
  transition: left .55s cubic-bezier(.22, 1, .36, 1);
}
.login-btn:hover::after { left: 120%; }
.login-btn:hover {
  transform: translateY(-1px);
  box-shadow:
    0 16px 34px rgba(122, 168, 255, .42),
    -3px -3px 8px rgba(255, 255, 255, .7),
    inset 0 1px 0 rgba(255, 255, 255, .28);
}
.login-btn:active {
  background: #4338CA;
  transform: scale(.97);
  box-shadow:
    inset 3px 3px 8px rgba(48, 49, 51, .14),
    inset -2px -2px 6px rgba(255, 255, 255, .3);
}
/* loading 态：隐藏高光扫过 */
.login-btn.is-loading::after { display: none; }

.form-err { margin-bottom: 12px; }
.err-fade-enter-active, .err-fade-leave-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.err-fade-enter-from, .err-fade-leave-to { opacity: 0; transform: translateY(-4px); }

.form-tip { margin-top: 18px; font-size: 12px; color: var(--text-3); }
.form-tip b { color: var(--accent); }

/* ===== 右侧：浅蓝插画品牌区（S 曲线左边界，全屏） ===== */
.brand-side {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 56%;
  background: linear-gradient(180deg, #F7F8FA 0%, #F4F4F5 60%, #C7D2FE 100%);
  clip-path: url(#sCurve);
  z-index: 2;
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  padding: 58px 56px 44px 0;
  box-sizing: border-box;
}
.brand-content {
  position: relative;
  width: 100%;
  max-width: 620px;
  height: 100%;
  padding: 0 0 44px 78px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}
.brand-hero {
  position: relative;
  z-index: 2;
  margin: 0 0 14px;
  padding-top: 58px;
  text-shadow: 0 2px 12px rgba(238, 245, 255, 0.9);
}
.brand-title { font-size: 26px; line-height: 1.25; font-weight: 800; margin: 0 0 6px; letter-spacing: 0.3px; color: #18181B; }
.brand-sub { font-size: 13px; color: #6B7280; margin: 0; }
.brand-illustration {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  z-index: 1;
  display: flex; align-items: center; justify-content: center;
  pointer-events: none;
}
.city-svg {
  width: 100%;
  height: auto;
  max-width: 100%;
  transform: scale(1.32, 1.62);
  filter: drop-shadow(0 14px 34px rgba(91, 141, 239, 0.16));
}

/* 小屏：隐藏插画，表单占满 */
@media (max-width: 860px) {
  .form-system { left: 32px; top: 28px; font-size: 13px; }
  .brand-side { display: none; }
  .form-side { width: 100%; }
  .form-content { max-width: 460px; margin: 0 auto; padding: 76px 32px 40px; }
  .city-svg { transform: scale(1); }
}
</style>
