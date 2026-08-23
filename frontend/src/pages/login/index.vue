<template>
  <view class="login">
    <!-- 背景紫色光晕 -->
    <view class="glow glow-1"></view>
    <view class="glow glow-2"></view>

    <!-- 账号被禁用提醒（显示 3 秒后淡出） -->
    <view class="ban-toast-wrap">
      <transition name="ban-fade">
        <view v-if="banToast" class="ban-toast">
          <svg class="ban-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="9"/>
            <line x1="5.6" y1="5.6" x2="18.4" y2="18.4"/>
          </svg>
          <text class="ban-tx">{{ banMsg }}</text>
        </view>
      </transition>
    </view>

    <!-- 底部波浪 -->
    <svg class="bottom-wave" viewBox="0 0 375 120" preserveAspectRatio="none" aria-hidden="true">
      <path
        d="M0,60
           C60,10 120,100 187,60
           C255,20 315,90 375,50
           L375,120 L0,120 Z"
        fill="#a9c6ff"
        opacity="0.28"
      />
      <path
        d="M0,80
           C70,40 130,110 187,80
           C245,50 305,100 375,70
           L375,120 L0,120 Z"
        fill="#b8d0ff"
        opacity="0.38"
      />
    </svg>

    <!-- 顶部登录/注册切换 -->
    <view class="top-switch">
      <text :class="['switch-tab', { active: mode === 'login' }]" @click="goLogin">登录</text>
      <text :class="['switch-tab', { active: mode === 'register' }]" @click="goRegister">注册</text>
    </view>

    <!-- 问候语 -->
    <view class="hero">
      <text class="hero-title">{{ mode === 'login' ? '欢迎回来' : '创建账号' }}</text>
      <text class="hero-sub">{{ mode === 'login' ? '登录以继续使用' : '开启你的穿搭之旅' }}</text>
    </view>

    <!-- 表单区：圆角胶囊输入框 -->
    <view :class="['form-card', mode === 'login' ? 'form-card-login' : '']">
      <transition name="form-fade" mode="out-in">
        <view v-if="mode === 'login'" key="login">
          <view class="field">
            <view class="input-wrap">
              <input class="inp" :value="username" @input="onUser" @confirm="onLogin" placeholder="请输入用户名" />
              <view class="input-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </view>
            </view>
          </view>

          <view class="field">
            <view class="input-wrap">
              <input class="inp" :type="showPwd ? 'text' : 'password'" :value="password" @input="onPwd" @confirm="onLogin" placeholder="请输入密码" />
              <view class="input-icon eye" @click="togglePwd">
                <transition name="eye-fade" mode="out-in">
                  <svg v-if="showPwd" key="open" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                  <svg v-else key="closed" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                </transition>
              </view>
            </view>
          </view>

          <view v-if="err" class="err">{{ err }}</view>
          <view class="login-opts">
            <text class="forgot" @click="onForgot">忘记密码？</text>
            <view class="remember" @click="toggleRemember">
              <view :class="['remember-box', remember ? 'on' : '']"></view>
              <text class="remember-text">记住密码</text>
            </view>
          </view>
          <view class="login-btn" @click="onLogin">{{ loading ? '登录中…' : '登 录' }}</view>
        </view>

        <view v-else key="register">
          <view class="field">
            <view class="input-wrap">
              <input class="inp" :value="username" @input="onUser" @confirm="onRegister" placeholder="请输入用户名" />
              <view class="input-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </view>
            </view>
          </view>

          <view class="field">
            <view class="input-wrap">
              <input class="inp" :value="nickname" @input="onNick" @confirm="onRegister" placeholder="请输入昵称（可选）" />
              <view class="input-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </view>
            </view>
          </view>

          <view class="field">
            <view class="input-wrap">
              <input class="inp" :type="showPwd ? 'text' : 'password'" :value="password" @input="onPwd" @confirm="onRegister" placeholder="请输入密码" />
              <view class="input-icon eye" @click="togglePwd">
                <transition name="eye-fade" mode="out-in">
                  <svg v-if="showPwd" key="open" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                  <svg v-else key="closed" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                </transition>
              </view>
            </view>
          </view>

          <view class="field">
            <view class="input-wrap">
              <input class="inp" type="password" :value="confirmPwd" @input="onConfirm" @confirm="onRegister" placeholder="请再次输入密码" />
              <view class="input-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </view>
            </view>
          </view>

          <view v-if="err" class="err">{{ err }}</view>
          <view class="login-btn" @click="onRegister">{{ loading ? '注册中…' : '注 册' }}</view>
        </view>
      </transition>

      <view class="switch-row">
        <text class="switch-text">{{ mode === 'login' ? '还没有账号？' : '已有账号？' }}</text>
        <text class="switch-link" @click="mode === 'login' ? goRegister() : goLogin()">
          {{ mode === 'login' ? '去注册' : '去登录' }}
        </text>
      </view>

      <view class="tip">演示账号：user / 123456</view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { post } from '../../utils/request'

const mode = ref('login')
const username = ref('')
const password = ref('')
const confirmPwd = ref('')
const nickname = ref('')
const err = ref('')
const loading = ref(false)
const showPwd = ref(false)
const remember = ref(false)
const banToast = ref(false)
const banMsg = ref('该账号已被禁用，请联系管理员')
let banTimer = null
function showBan(text) {
  banMsg.value = text || '该账号已被禁用，请联系管理员'
  banToast.value = true
  if (banTimer) clearTimeout(banTimer)
  banTimer = setTimeout(() => { banToast.value = false }, 3000)
}

function onUser(e) { username.value = e.detail.value }
function onPwd(e) { password.value = e.detail.value }
function onConfirm(e) { confirmPwd.value = e.detail.value }
function onNick(e) { nickname.value = e.detail.value }
function togglePwd() { showPwd.value = !showPwd.value }

function goRegister() { reset(); mode.value = 'register' }
function goLogin() { reset(); mode.value = 'login' }
function reset() {
  err.value = ''
  username.value = ''
  password.value = ''
  confirmPwd.value = ''
  nickname.value = ''
  showPwd.value = false
}

function onForgot() {
  uni.showToast({ title: '请联系管理员重置密码', icon: 'none' })
}

function toggleRemember() {
  remember.value = !remember.value
}

async function saveSession(d, uname) {
  uni.setStorageSync('token', d.token)
  uni.setStorageSync('role', d.role)
  uni.setStorageSync('nickname', d.nickname || username.value)
  uni.setStorageSync('username', uname || d.nickname || username.value)
  uni.setStorageSync('user_id', d.user_id)
  uni.redirectTo({ url: '/pages/user/index' })
}

async function onLogin() {
  if (loading.value) return
  err.value = ''
  const u = username.value.trim()
  const p = password.value
  if (!u || !p) {
    err.value = '请输入用户名和密码'
    return
  }
  loading.value = true
  try {
    const d = await post('/auth/login', { username: u, password: p })
    if (d.role !== 'user') {
      err.value = '该账号不是用户端账号，请用 user 账号登录'
      loading.value = false
      return
    }
    await saveSession(d, u)
  } catch (e) {
    const msg = e && e.data && e.data.detail ? e.data.detail : '登录失败，请检查后端'
    if (msg.indexOf('禁用') !== -1) {
      showBan()
      loading.value = false
      return
    }
    err.value = msg
    loading.value = false
  }
}

async function onRegister() {
  if (loading.value) return
  err.value = ''
  const u = username.value.trim()
  const p = password.value
  const cp = confirmPwd.value
  if (!u || !p) {
    err.value = '请输入用户名和密码'
    return
  }
  if (p !== cp) {
    err.value = '两次输入的密码不一致'
    return
  }
  loading.value = true
  try {
    const d = await post('/auth/register', {
      username: u,
      password: p,
      nickname: nickname.value.trim(),
    })
    await saveSession(d, u)
  } catch (e) {
    const msg = e && e.data && e.data.detail ? e.data.detail : '注册失败，请检查后端'
    err.value = msg
    loading.value = false
  }
}
</script>

<style scoped>
.login {
  min-height: 100vh;
  padding: 40px 28px 32px;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, #eef5ff 0%, #e1edff 50%, #d6e5ff 100%);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', Roboto, Helvetica, Arial, sans-serif;
}

/* 背景光晕 */
.glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(70px);
  pointer-events: none;
  z-index: 0;
}
.glow-1 {
  width: 200px; height: 200px;
  top: -30px; right: -50px;
  background: rgba(169, 198, 255, 0.24);
}
.glow-2 {
  width: 180px; height: 180px;
  top: 160px; left: -60px;
  background: rgba(184, 208, 255, 0.20);
}

/* 底部波浪 */
.bottom-wave {
  position: absolute;
  left: 0; right: 0;
  bottom: 0;
  width: 100%;
  height: 160px;
  z-index: 0;
  pointer-events: none;
}

/* 顶部切换 */
.top-switch {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 22px;
  margin-bottom: 28px;
}
.switch-tab {
  font-size: 14px;
  font-weight: 600;
  color: #9CA3AF;
  padding-bottom: 4px;
  position: relative;
  transition: color .25s ease;
}
.switch-tab.active {
  color: #2D3A5A;
}
.switch-tab.active::after {
  content: '';
  position: absolute;
  left: 0; right: 0; bottom: 0;
  height: 2px;
  border-radius: 2px;
  background: #8cb8ff;
  transition: all .25s cubic-bezier(.22, 1, .36, 1);
}

/* 问候语 */
.hero {
  position: relative;
  z-index: 2;
  margin-bottom: 24px;
}
.hero-title {
  display: block;
  font-size: 26px;
  font-weight: 700;
  color: #2D3A5A;
  margin-bottom: 5px;
}
.hero-sub {
  display: block;
  font-size: 13px;
  color: #9CA3AF;
}

/* 表单区：无白底，直接浮在浅色背景上 */
.form-card {
  position: relative;
  z-index: 2;
  width: 100%;
  max-width: 320px;
  margin: 0 auto;
}
/* 仅登录模式整体下移，注册模式保持不动 */
.form-card-login {
  margin-top: 56px;
}

/* 登录/注册切换过渡：淡入 + 轻微上滑 */
.form-fade-enter-active,
.form-fade-leave-active {
  transition: opacity .28s ease, transform .28s cubic-bezier(.22, 1, .36, 1);
}
.form-fade-enter-from {
  opacity: 0;
  transform: translateY(14px);
}
.form-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.field { margin-bottom: 16px; }
.input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}
.inp {
  width: 100%;
  height: 50px;
  border: none;
  border-radius: 999px;
  padding: 0 48px 0 18px;
  font-size: 14px;
  background: rgba(255, 255, 255, 0.95);
  color: #2D3A5A;
  box-shadow: 0 2px 8px rgba(31, 42, 68, 0.04), 0 0 0 1px rgba(0, 0, 0, 0.03);
  box-sizing: border-box;
  transition: all .2s ease;
}
.inp::placeholder { color: #B0B7C3; }
.inp:focus {
  box-shadow: 0 2px 12px rgba(140, 184, 255, 0.14), 0 0 0 1px rgba(140, 184, 255, 0.35);
  outline: none;
}
.input-icon {
  position: absolute;
  right: 16px;
  width: 20px;
  height: 20px;
  color: #B0B7C3;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}
.input-icon.eye { pointer-events: auto; transition: color .2s ease, transform .2s cubic-bezier(.34, 1.56, .64, 1); }
.input-icon.eye:active { transform: scale(.82); color: #7aa8ff; }
.input-icon svg { width: 18px; height: 18px; }
/* 密码可视眼睛切换动画：旋转 + 缩放 + 淡入淡出 */
.eye-fade-enter-active,
.eye-fade-leave-active {
  transition: opacity .16s ease, transform .26s cubic-bezier(.34, 1.56, .64, 1);
}
.eye-fade-enter-from {
  opacity: 0;
  transform: scale(.4) rotate(-70deg);
}
.eye-fade-leave-to {
  opacity: 0;
  transform: scale(.4) rotate(70deg);
}

.err {
  color: #E5484D;
  font-size: 12px;
  margin: -8px 0 12px;
  text-align: center;
}
.login-btn {
  height: 50px;
  line-height: 50px;
  text-align: center;
  /* 纯色浅蓝（去渐变），拟物双投影：右下深 + 左上亮 + 顶部高光 */
  background: #7aa8ff;
  color: #fff;
  border-radius: 999px;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 3px;
  margin-top: 8px;
  box-shadow:
    0 12px 26px rgba(122, 168, 255, .32),
    -3px -3px 8px rgba(255, 255, 255, .7),
    inset 0 1px 0 rgba(255, 255, 255, .28);
  transition: all .24s cubic-bezier(.22, 1, .36, 1);
  position: relative;
  overflow: hidden;
}
.login-btn::after {
  /* 顶部高光扫过动画（hover 时从左往右移动） */
  content: '';
  position: absolute;
  top: 0; left: -60%;
  width: 40%; height: 100%;
  background: linear-gradient(105deg, transparent, rgba(255, 255, 255, .35), transparent);
  transform: skewX(-20deg);
  transition: left .5s cubic-bezier(.22, 1, .36, 1);
}
.login-btn:hover::after { left: 120%; }
.login-btn:active {
  background: #6a98f5;
  box-shadow:
    inset 3px 3px 8px rgba(48, 49, 51, .14),
    inset -2px -2px 6px rgba(255, 255, 255, .3);
  transform: scale(.97);
}
/* 登录中：按钮微呼吸 + 文字稍隐 */
.login-btn[class*="loading"] { opacity: .88; }
.login-btn[class*="loading"]::after { display: none; }

.forgot {
  font-size: 12px;
  color: #8cb8ff;
  font-weight: 500;
}
.login-opts {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 4px 2px 14px;
}
.remember {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}
.remember-box {
  width: 16px;
  height: 16px;
  border-radius: 5px;
  border: 1.5px solid #c5d9ff;
  background: #fff;
  position: relative;
  transition: all .25s cubic-bezier(.34, 1.56, .64, 1);
}
.remember-box:active { transform: scale(.82); }
.remember-box.on {
  background: #8cb8ff;
  border-color: #8cb8ff;
}
.remember-box.on::after {
  content: '';
  position: absolute;
  left: 5px;
  top: 1.5px;
  width: 4px;
  height: 8px;
  border: solid #fff;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
  /* 打勾弹入动画 */
  animation: checkPop .3s cubic-bezier(.34, 1.56, .64, 1) both;
}
@keyframes checkPop {
  from { transform: rotate(45deg) scale(0); opacity: 0; }
  to   { transform: rotate(45deg) scale(1); opacity: 1; }
}
.remember-text {
  font-size: 12px;
  color: #6B7A9C;
}

.switch-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  margin-top: 18px;
}
.switch-text { font-size: 12px; color: #9CA3AF; }
.switch-link { font-size: 12px; font-weight: 700; color: #8cb8ff; }
.tip {
  font-size: 11px;
  color: #B0B7C3;
  text-align: center;
  margin-top: 14px;
}

/* 账号被禁用提醒：顶部居中浮层，显示 3 秒后淡出 */
.ban-toast-wrap {
  position: fixed;
  top: 64px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  z-index: 60;
  pointer-events: none;
}
.ban-toast {
  display: flex;
  align-items: center;
  gap: 7px;
  max-width: 84%;
  padding: 11px 18px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  color: #2D3A5A;
  font-size: 13px;
  font-weight: 500;
  line-height: 1.35;
  border: 1px solid rgba(45, 58, 90, 0.08);
  box-shadow: 0 8px 24px rgba(45, 58, 90, 0.12);
}
.ban-ic { width: 17px; height: 17px; flex: 0 0 17px; }
.ban-tx { flex: 1; }
/* 淡入 + 3 秒后淡出 */
.ban-fade-enter-active { transition: opacity .3s ease, transform .3s cubic-bezier(.22, 1, .36, 1); }
.ban-fade-leave-active { transition: opacity .6s ease, transform .6s ease; }
.ban-fade-enter-from { opacity: 0; transform: translateY(-12px); }
.ban-fade-leave-to { opacity: 0; transform: translateY(-12px); }
@media (prefers-reduced-motion: reduce) {
  .ban-fade-enter-active, .ban-fade-leave-active { transition: none; }
}
</style>
