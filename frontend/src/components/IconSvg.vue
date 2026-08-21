<template>
  <view class="icon-svg" :style="boxStyle">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" :stroke-width="strokeWidth"
         stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path v-for="(d, i) in paths" :key="i" :d="d" />
    </svg>
  </view>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  name: { type: String, required: true },
  size: { type: [Number, String], default: '1em' },
  strokeWidth: { type: [Number, String], default: 1.8 },
  color: { type: String, default: '' }
})

// 线性图标路径（Feather / Lucide 风格，24x24 视图，单色描边）
const ICONS = {
  home: ['M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z', 'M9 22V12h6v10'],
  chat: ['M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z'],
  user: ['M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2', 'M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8'],
  chart: ['M18 20V10', 'M12 20V4', 'M6 20v-6'],
  bell: ['M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9', 'M13.73 21a2 2 0 0 1-3.46 0'],
  location: ['M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z', 'M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6'],
  close: ['M18 6 6 18', 'M6 6l12 12'],
  menu: ['M3 12h18', 'M3 6h18', 'M3 18h18'],
  camera: ['M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z', 'M12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8'],
  trash: ['M3 6h18', 'M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2', 'M10 11v6', 'M14 11v6'],
  hanger: ['M12 4a2 2 0 1 0 0-4 2 2 0 0 0 0 4', 'M12 4 3 11a1 1 0 0 0 .6 1.9h16.8A1 1 0 0 0 21 11z'],
  calendar: ['M3 4h18v18H3z', 'M16 2v4', 'M8 2v4', 'M3 10h18'],
  warning: ['M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z', 'M12 9v4', 'M12 17h.01'],
  edit: ['M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z'],
  image: ['M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z', 'M8.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3', 'M21 15l-5-5L5 21'],
  upload: ['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4', 'M17 8l-5-5-5 5', 'M12 3v12'],
  check: ['M20 6 9 17l-5-5'],
  spark: ['M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z', 'M19 14l.8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8z'],
  search: ['M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z', 'm21 21-4.35-4.35'],
  'chevron-left': ['M15 18l-6-6 6-6'],
  'chevron-right': ['M9 18l6-6-6-6'],
  heart: ['M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z'],
  /* 衣物（lucide shirt）：我的衣橱 / 底部 tab 衣橱 */
  shirt: ['M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a1 1 0 0 0-.62.92V21a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V4.38a1 1 0 0 0-.62-.92z'],
  /* 套装层叠（lucide layers）：我的套装 */
  layers: ['M12.83 2.17a2 2 0 0 0-1.66 0L2.6 6.95a1 1 0 0 0 0 1.7l8.58 4.78a2 2 0 0 0 1.66 0l8.58-4.78a1 1 0 0 0 0-1.7z', 'M6.08 9.94l-3.5 1.95a1 1 0 0 0 0 1.7l8.58 4.78a2 2 0 0 0 1.66 0l8.58-4.78a1 1 0 0 0 0-1.7L16 9.94a2 2 0 0 0-1.66 0z'],
  /* 回顾历史（lucide history）：穿搭回顾 */
  history: ['M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8', 'M3 3v5h5', 'M12 7v5l4 2'],
  /* 个人资料卡（lucide id-card）：身形资料 */
  'id-card': ['M16 10h6', 'M16 14h6', 'M3 6h10v12H3z', 'M7 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4z', 'M7 14a3 3 0 0 0-3 3v1h6v-1a3 3 0 0 0-3-3z'],
  /* 衣柜（lucide closet）：备用 */
  closet: ['M3 6a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v2', 'M3 6v14a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V6', 'M3 6h18v2H3z', 'M17 14a1 1 0 1 0 0-2 1 1 0 0 0 0 2z'],
  /* 空包裹 ×——衣橱"暂无匹配"（lucide package-x），跟 hanger/shirt 视觉系列完全不同 */
  'package-x': ['M16.5 9.4 7.55 4.24', 'M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z', 'm12 14 4-4', 'm8 14 4-4'],
  /* 公文包（lucide briefcase）：通勤 */
  briefcase: ['M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16', 'M3 20a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6H3v14z'],
  /* 心电图（lucide activity）：运动 */
  activity: ['M22 12h-4l-3 9L9 3l-3 9H2'],
  /* 音乐（lucide music）：聚会 */
  music: ['M9 18V5l12-2v13', 'M9 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4z', 'M21 16a2 2 0 1 0 0-4 2 2 0 0 0 0 4z'],
  /* 飞机（lucide plane）：旅行 */
  plane: ['M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z'],
  /* 学士帽（lucide graduation-cap）：面试 */
  'graduation-cap': ['M22 10 12 5 2 10l10 5 10-5z', 'M6 12v5c3 3 9 3 12 0v-5']
}

const paths = computed(() => ICONS[props.name] || [])
const boxStyle = computed(() => {
  const sz = typeof props.size === 'number' ? props.size + 'rpx' : props.size
  return {
    width: sz,
    height: sz,
    color: props.color || 'inherit',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: 1,
    flexShrink: 0
  }
})
</script>

<style scoped>
.icon-svg { display: inline-flex; }
.icon-svg svg { width: 100%; height: 100%; display: block; }
</style>
