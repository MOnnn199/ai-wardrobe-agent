import { reactive } from 'vue'

/**
 * 全局轻提示状态（单例）
 * 用于替代 uni.showToast 的黑色方块，统一成白色圆角卡片
 */
export const toastState = reactive({
  visible: false,
  text: '',
  type: 'success',   // success | error | loading | text
  key: 0
})

let timer = null

const ICON_MAP = { success: 'success', error: 'error', loading: 'loading', none: 'text' }

/**
 * 显示轻提示（用法与 uni.showToast 兼容）
 * showToast({ title: '已保存', icon: 'success' })
 * showToast('已保存')
 */
export function showToast(opts) {
  const o = typeof opts === 'string' ? { title: opts } : (opts || {})
  toastState.text = o.title || ''
  toastState.type = ICON_MAP[o.icon] || o.icon || 'success'
  if (toastState.type === 'none') toastState.type = 'text'
  toastState.key += 1
  toastState.visible = true
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => { toastState.visible = false }, o.duration || 1600)
}

export function hideToast() {
  if (timer) clearTimeout(timer)
  toastState.visible = false
}
