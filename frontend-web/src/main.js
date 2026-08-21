import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import './styles/animations.css'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import App from './App.vue'
import router from './router'
import * as echarts from 'echarts'

// ===== 浅色图表主题：蓝色系统一色板，配置端/搭配师端 echarts.init(el,'wardrobe') 复用 =====
echarts.registerTheme('wardrobe', {
  color: ['#7aa8ff', '#5B8DEF', '#a9c6ff', '#3d6fd1', '#bcd2ff', '#8ab4f8'],
  backgroundColor: 'transparent',
  textStyle: { color: '#6B7A9C' },
  title: { textStyle: { color: '#2D3A5A' }, subtextStyle: { color: '#6B7A9C' } },
  legend: { textStyle: { color: '#6B7A9C' } },
  tooltip: {
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderColor: 'rgba(122,168,255,0.35)',
    textStyle: { color: '#2D3A5A' }
  },
  categoryAxis: {
    axisLine: { lineStyle: { color: '#d6e5ff' } },
    axisTick: { lineStyle: { color: '#d6e5ff' } },
    axisLabel: { color: '#6B7A9C' },
    splitLine: { show: false, lineStyle: { color: '#eef5ff' } }
  },
  valueAxis: {
    axisLine: { show: false },
    axisLabel: { color: '#6B7A9C' },
    splitLine: { lineStyle: { color: '#eef5ff' } }
  },
  graph: { itemStyle: { color: '#7aa8ff' } }
})

// 登录态使用 sessionStorage 存储（见 Login.vue / 各主页 logout）。
// sessionStorage 在关闭标签页 / 浏览器后自动清空，因此「重新运行项目、重新打开网页」
// 时会自动回到未登录状态；同一标签页内刷新/HMR 不会掉登录，方便调试。
// 这里顺手清掉历史遗留的 localStorage 登录态，避免旧数据干扰。
try {
  localStorage.removeItem('web_token')
  localStorage.removeItem('web_role')
  localStorage.removeItem('web_nickname')
} catch (e) {}

// ===== 全局 fetch 注入 Authorization（后端已强制鉴权 / 角色权限）=====
const __origFetch = window.fetch
window.fetch = function (input, init) {
  init = init || {}
  init.headers = init.headers || {}
  const token = sessionStorage.getItem('web_token')
  if (token && !init.headers.Authorization) {
    init.headers = { ...init.headers, Authorization: 'Bearer ' + token }
  }
  return __origFetch.call(this, input, init).then((resp) => {
    // 401/403 → 回到登录页（403 无权限时提示后跳转）
    if (resp.status === 401) {
      sessionStorage.removeItem('web_token')
      sessionStorage.removeItem('web_role')
      sessionStorage.removeItem('web_nickname')
      if (window.location.pathname !== '/login') window.location.hash = '#/login'
    }
    return resp
  })
}

const app = createApp(App)
app.use(router)
app.use(ElementPlus, { locale: zhCn })
// 全局注册 Element Plus 图标，方便在菜单/按钮里用 <component :is="'IconName'" /> 引用
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}
// 深色图表主题需在任何 echarts.init 调用之前注册（已在上面完成）
app.mount('#app')
