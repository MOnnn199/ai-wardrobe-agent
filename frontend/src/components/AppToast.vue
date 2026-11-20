<template>
  <view v-if="toastState.visible" :key="toastState.key" class="app-toast">
    <view :class="['at-card', toastState.type === 'text' && 'at-card-text']">
      <view v-if="toastState.type === 'success'" class="at-ico at-ico-ok">
        <icon-svg name="check" size="36rpx" :stroke-width="2.6" color="#4F46E5"></icon-svg>
      </view>
      <view v-else-if="toastState.type === 'error'" class="at-ico at-ico-err">
        <icon-svg name="warning" size="32rpx" :stroke-width="2.2" color="#EF4444"></icon-svg>
      </view>
      <view v-else-if="toastState.type === 'loading'" class="at-ring"></view>
      <text class="at-text">{{ toastState.text }}</text>
    </view>
  </view>
</template>

<script setup>
import { toastState } from '../utils/toast.js'
import IconSvg from './IconSvg.vue'
</script>

<style scoped>
/* 白色圆角卡片 + 柔光阴影，替代 uni.showToast 的深灰方块 */
.app-toast {
  position: fixed;
  top: 0; right: 0; bottom: 0; left: 0;
  z-index: 99999;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}
.at-card {
  min-width: 220rpx;
  max-width: 72vw;
  box-sizing: border-box;
  padding: 36rpx 44rpx 32rpx;
  background: #FFFFFF;
  border-radius: 28rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 24rpx 64rpx rgba(17, 24, 39, 0.16), 0 2rpx 8rpx rgba(17, 24, 39, 0.04);
  animation: atIn 0.28s cubic-bezier(0.22, 1, 0.36, 1) both;
}
.at-ico {
  width: 84rpx;
  height: 84rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20rpx;
}
.at-ico-ok { background: #EEF2FF; }
.at-ico-err { background: #FEF2F2; }
/* 纯文字提示：收紧留白，避免空卡片显得呆板 */
.at-card-text {
  min-width: 180rpx;
  padding: 26rpx 40rpx;
}
.at-ring {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  margin-bottom: 22rpx;
  border: 5rpx solid #E0E7FF;
  border-top-color: #6366F1;
  animation: atSpin 0.8s linear infinite;
}
.at-text {
  font-size: 28rpx;
  line-height: 1.5;
  color: #18181B;
  font-weight: 500;
  text-align: center;
  word-break: break-word;
}
@keyframes atIn {
  from { opacity: 0; transform: scale(0.94) translateY(12rpx); }
  to   { opacity: 1; transform: none; }
}
@keyframes atSpin {
  to { transform: rotate(360deg); }
}
@media (prefers-reduced-motion: reduce) {
  .at-card { animation-duration: 0.01s; }
  .at-ring { animation-duration: 2s; }
}
</style>
