import { createHotContext as __vite__createHotContext } from "/@vite/client";import.meta.hot = __vite__createHotContext("/src/pages/user/index.vue");import "/node_modules/@dcloudio/uni-components/style/text.css";import { Text as __syscom_0 } from "/node_modules/@dcloudio/uni-h5/dist/uni-h5.es.js";import "/node_modules/@dcloudio/uni-components/style/view.css";import { View as __syscom_1 } from "/node_modules/@dcloudio/uni-h5/dist/uni-h5.es.js";import "/node_modules/@dcloudio/uni-components/style/image.css";import "/node_modules/@dcloudio/uni-components/style/resize-sensor.css";import { Image as __syscom_2 } from "/node_modules/@dcloudio/uni-h5/dist/uni-h5.es.js";import "/node_modules/@dcloudio/uni-components/style/input.css";import { Input as __syscom_3 } from "/node_modules/@dcloudio/uni-h5/dist/uni-h5.es.js";import "/node_modules/@dcloudio/uni-components/style/scroll-view.css";import "/node_modules/@dcloudio/uni-components/style/refresher.css";import { ScrollView as __syscom_4 } from "/node_modules/@dcloudio/uni-h5/dist/uni-h5.es.js";import "/node_modules/@dcloudio/uni-h5/style/picker.css";import "/node_modules/@dcloudio/uni-components/style/resize-sensor.css";import "/node_modules/@dcloudio/uni-components/style/picker-view.css";import "/node_modules/@dcloudio/uni-components/style/picker-view-column.css";import { Picker as __syscom_5 } from "/node_modules/@dcloudio/uni-h5/dist/uni-h5.es.js";import { ref, computed, onMounted, shallowRef, markRaw, nextTick } from "/node_modules/@dcloudio/uni-h5-vue/dist/vue.runtime.esm.js"
import { get, post, del, put, upload } from "/src/utils/request.js"


const _sfc_main = {
  __name: 'index',
  setup(__props, { expose: __expose }) {
  __expose();

const currentView = ref('today')
const chatInput = ref('')
const chatLoading = ref(false)
const messages = shallowRef([])

const wardrobe = ref([])
const wardrobeFilter = ref('all')
const conversations = ref([])
const showHistoryDrawer = ref(false)
const drawerOpened = ref(false)
const analysis = ref(null)
const shoppingList = ref(null)

const notifications = ref([])
const unreadCount = ref(0)
const notifyLoading = ref(false)

const showUpload = ref(false)
const uploadPreview = ref('')
const uploadTags = ref(null)
const uploadDetecting = ref(false)
const uploadedFile = ref('')
const uploadedItemId = ref(null)
const purchaseDate = ref('')
const uploadForm = ref({ name: '', category: 'top', color: '', style: '', season: '' })

const weatherLoading = ref(false)
const weather = ref({ temperature: '--', description: '加载中…', city: '', windspeed: '--', located: false })
const homeLoading = ref(false)
const homeOutfit = ref(null)
const tempDisplay = computed(() => {
  const t = weather.value.temperature
  if (t === '--' || t === null || t === undefined) return '--'
  return t + '°'
})

const navItems = [
  { key: 'today', icon: '🏠', label: '首页' },
  { key: 'chat', icon: '💬', label: '对话' },
  { key: 'wardrobe', icon: '👔', label: '衣橱' },
  { key: 'analysis', icon: '📊', label: '分析' },
  { key: 'shopping', icon: '🛒', label: '购物' },
  { key: 'profile', icon: '👤', label: '我的' },
]

const catList = [
  { k: 'all', l: '全部' }, { k: 'top', l: '上装' }, { k: 'bottom', l: '下装' },
  { k: 'shoes', l: '鞋子' }, { k: 'accessory', l: '配饰' }
]
// 品类筛选标签带动态计数
const catListWithCount = computed(() => {
  const w = wardrobe.value
  const total = w.length
  const counts = { all: total }
  w.forEach(i => { counts[i.category] = (counts[i.category] || 0) + 1 })
  return catList.map(c => ({ ...c, n: counts[c.k] || 0 }))
})
const catMap = { top: '上装', bottom: '下装', shoes: '鞋子', accessory: '配饰' }
const catKeys = ['top', 'bottom', 'shoes', 'accessory']
const catLabels = ['上装', '下装', '鞋子', '配饰']

const filteredWardrobe = computed(() => {
  if (wardrobeFilter.value === 'all') return wardrobe.value
  return wardrobe.value.filter(i => i.category === wardrobeFilter.value)
})

function pct(v, total) {
  if (!total) return 0
  return Math.round((v / total) * 100)
}

// ===== 分析页可视化 =====
const CAT_CN = { top: '上装', bottom: '下装', shoes: '鞋子', accessory: '配饰', outer: '外套', dress: '连衣裙', bag: '包袋', hat: '帽子' }
const PALETTE = ['#5b8def', '#22c1a8', '#f6a609', '#ef6f6c', '#9b6dff', '#3ec6e0', '#f78fb3', '#8ad08a']
const SEASON_CN = { spring: '春', summer: '夏', autumn: '秋', winter: '冬', all: '四季' }
const SEASON_COLOR = { spring: '#7ed6a5', summer: '#ffd166', autumn: '#f6a05a', winter: '#6ab7ff', all: '#b8a6e8' }
const COLOR_HEX = {
  '白色': '#f5f5f5', '白色系': '#f5f5f5', '黑色': '#2b2b2b', '黑色系': '#2b2b2b', '灰色': '#9aa0a6', '灰色系': '#9aa0a6',
  '红色': '#ef6f6c', '红色系': '#ef6f6c', '蓝色': '#5b8def', '蓝色系': '#5b8def', '绿色': '#22c1a8', '黄色': '#f6c244',
  '粉色': '#f78fb3', '紫色': '#9b6dff', '棕色': '#a0713f', '米色': '#e7d8bf', '卡其': '#c2a878', '橙色': '#f6993a', '藏青': '#34406b'
}

const categoryChart = computed(() => {
  const d = analysis.value
  if (!d || !d.category_distribution) return { items: [], gradient: '#ebeef5', total: 0 }
  const entries = Object.entries(d.category_distribution)
  const total = d.total_items || entries.reduce((s, [, v]) => s + v, 0)
  const items = entries.map(([k, v], idx) => ({
    raw: k,
    name: CAT_CN[k] || k,
    value: v,
    pct: total ? Math.round((v / total) * 100) : 0,
    color: PALETTE[idx % PALETTE.length]
  }))
  let acc = 0
  const parts = items.map(it => { const s = acc; acc += it.pct; return it.color + ' ' + s + '% ' + acc + '%' })
  if (!parts.length) parts.push('#ebeef5 0% 100%')
  return { items, gradient: 'conic-gradient(' + parts.join(',') + ')', total }
})

const seasonChart = computed(() => {
  const d = analysis.value
  if (!d || !d.season_distribution) return []
  const total = Object.values(d.season_distribution).reduce((s, v) => s + v, 0)
  return Object.entries(d.season_distribution).map(([k, v]) => ({
    name: SEASON_CN[k] || k,
    value: v,
    pct: total ? Math.round((v / total) * 100) : 0,
    color: SEASON_COLOR[k] || '#c0c4cc'
  }))
})

const colorList = computed(() => {
  const d = analysis.value
  if (!d || !d.color_distribution) return []
  return Object.entries(d.color_distribution).map(([k, v]) => ({
    name: k, value: v, hex: COLOR_HEX[k] || '#c0c4cc'
  }))
})

const wardrobeScore = computed(() => {
  const d = analysis.value
  if (!d || !d.total_items) return 0
  const total = d.total_items
  const unused = (d.unused_items || []).length
  const dupes = (d.duplicate_warnings || []).length
  const score = 100 - (unused / total) * 45 - (dupes / total) * 25
  return Math.max(0, Math.min(100, Math.round(score)))
})

const scoreColor = computed(() => {
  const s = wardrobeScore.value
  if (s >= 80) return '#22c1a8'
  if (s >= 60) return '#f6a609'
  return '#ef6f6c'
})

const scoreText = computed(() => {
  const s = wardrobeScore.value
  if (s >= 80) return '衣橱状态优秀'
  if (s >= 60) return '衣橱状态良好'
  return '衣橱需要整理'
})
function tagClass(c) {
  return c === 'top' ? '' : c === 'bottom' ? 'ok' : c === 'shoes' ? 'warn' : 'info'
}
function onCatChange(e) {
  uploadForm.value.category = catKeys[e.detail.value]
}

// ===== 数据加载 =====
async function fetchWardrobe() {
  try { wardrobe.value = await get('/user/wardrobe') } catch (e) { console.log(e) }
}
async function fetchConversations() {
  try { conversations.value = await get('/user/conversations') } catch (e) {}
}
async function fetchAnalysis() {
  try { analysis.value = await get('/user/wardrobe-analysis') } catch (e) {}
}
async function fetchShoppingList() {
  try { shoppingList.value = await get('/user/shopping-list') } catch (e) {}
}

// 当前登录用户的真实 id（注册/登录时写入 storage），没有则回退 1
function getUserId() {
  return uni.getStorageSync('user_id') || 1
}

// ===== 自主搭配（多选取衣 + AI 审核）=====
const selectedIds = ref([])
const reviewLoading = ref(false)
const reviewResult = ref(null)

function isSelected(id) { return selectedIds.value.includes(id) }
function toggleSelect(id) {
  const i = selectedIds.value.indexOf(id)
  if (i >= 0) selectedIds.value.splice(i, 1)
  else selectedIds.value.push(id)
  // 切换选择时清空上一次审核结果
  reviewResult.value = null
}
function clearSelection() {
  selectedIds.value = []
  reviewResult.value = null
}
const outfitScoreColor = computed(() => {
  const s = reviewResult.value && reviewResult.value.score
  if (!s) return '#909399'
  if (s >= 8) return '#67c23a'
  if (s >= 6) return '#e6a23c'
  return '#f56c6c'
})
const outfitScoreRing = computed(() => {
  const s = reviewResult.value && reviewResult.value.score
  const pct = s ? Math.max(0, Math.min(100, s * 10)) : 0
  return `conic-gradient(${outfitScoreColor.value} ${pct}%, #ebeef5 ${pct}%)`
})
async function reviewOutfit() {
  if (selectedIds.value.length < 2) {
    uni.showToast({ title: '至少选择 2 件衣物', icon: 'none' })
    return
  }
  reviewLoading.value = true
  reviewResult.value = null
  try {
    const d = await post('/user/outfit-review', { ids: selectedIds.value })
    reviewResult.value = d
  } catch (e) {
    uni.showToast({ title: '审核失败，请重试', icon: 'none' })
  }
  reviewLoading.value = false
}

// ===== 搭配入口：二选一 =====
// 让 AI 帮你搭：预填一句需求并跳到对话栏
function aiHelpOutfit() {
  chatInput.value = '帮我搭配一身合适的衣服'
  switchView('chat')
}
// 自己搭配 + AI 审核：进入多选界面
function startSelfOutfit() {
  switchView('outfit')
}

// ===== 通知中心 =====
async function fetchNotifications() {
  try { notifications.value = await get('/user/notifications?user_id=' + getUserId()) } catch (e) { console.log(e) }
}
async function fetchUnread() {
  try {
    const d = await get('/user/notifications/unread-count?user_id=' + getUserId())
    unreadCount.value = d.count || 0
  } catch (e) {}
}
function notiTypeLabel(t) {
  return ({
    monthly_report: '衣橱月报', trend_push: '穿搭热点', system: '系统'
  })[t] || '通知'
}
async function onNotiClick(n) {
  if (!n.is_read) {
    n.is_read = true
    unreadCount.value = Math.max(0, unreadCount.value - 1)
    try { await post('/user/notifications/' + n.id + '/read') } catch (e) {}
  }
}
async function markAllRead() {
  try {
    await post('/user/notifications/read-all')
    notifications.value.forEach(x => { x.is_read = true })
    unreadCount.value = 0
    uni.showToast({ title: '已全部标记已读', icon: 'success' })
  } catch (e) {}
}

// ===== 图片选择（uni 原生，支持拍照+相册）=====
function chooseImage() {
  return new Promise((resolve, reject) => {
    uni.chooseImage({
      count: 1,
      sourceType: ['album', 'camera'],
      success: (res) => resolve(res.tempFilePaths[0]),
      fail: (err) => reject(err)
    })
  })
}

// ===== 对话 =====
function onChatInput(e) {
  const v = e && e.detail && typeof e.detail.value === 'string' ? e.detail.value : e && typeof e.target.value === 'string' ? e.target.value : String(e || '')
  chatInput.value = v
}
function onChatConfirm() { sendChat() }
function onChatSend() { sendChat() }
function onFormInput(e, key) {
  const v = e && e.detail && typeof e.detail.value === 'string' ? e.detail.value : e && typeof e.target.value === 'string' ? e.target.value : String(e || '')
  uploadForm.value[key] = v
}

async function sendChat(text) {
  const q = (typeof text === 'string' ? text : chatInput.value).trim()
  if (!q || chatLoading.value) return
  chatInput.value = ''
  messages.value.push(markRaw({ role: 'user', content: q }))
  chatLoading.value = true
  try {
    const d = await get('/user/chat?user_input=' + encodeURIComponent(q))
    messages.value.push(markRaw({ role: 'agent', content: d.response, cid: d.conversation_id, rating: 0, image: d.outfit_image || '' }))
    fetchConversations()
  } catch (e) {
    messages.value.push(markRaw({ role: 'agent', content: '请求失败，请检查后端' }))
  }
  chatLoading.value = false
}

async function chatChooseImage() {
  try {
    const path = await chooseImage()
    const d = await upload('/user/analyze-image', path)
    messages.value.push(markRaw({ role: 'user', content: '上传了一张图片请分析搭配', image: path }))
    chatLoading.value = true
    const d2 = await get('/user/chat?user_input=' + encodeURIComponent('请分析这张图片并推荐搭配方案。识别结果：' + (d.analysis || '')))
    messages.value.push(markRaw({ role: 'agent', content: d2.response, cid: d2.conversation_id, rating: 0, image: d2.outfit_image || '' }))
    fetchConversations()
    chatLoading.value = false
  } catch (e) {
    uni.showToast({ title: '图片分析失败', icon: 'none' })
  }
}

function rateByIndex(i, score) {
  const msg = messages.value[i]
  if (!msg || !msg.cid) return
  msg.rating = score
  messages.value = [...messages.value]
  try {
    post('/user/conversations/rate', { conversation_id: msg.cid, score })
    uni.showToast({ title: '评分已提交', icon: 'success' })
  } catch (e) {}
}

const profile = ref({ nickname: '', username: '', role: '' })
function loadProfile() {
  // 先用本地缓存快速显示，再异步从后端拉取最新昵称覆盖
  profile.value = {
    nickname: uni.getStorageSync('nickname') || '',
    username: uni.getStorageSync('username') || '',
    role: uni.getStorageSync('role') || ''
  }
  refreshProfile()
}
async function refreshProfile() {
  try {
    const me = await get('/auth/me')
    profile.value = {
      nickname: me.nickname || profile.value.nickname,
      username: me.username || profile.value.username,
      role: me.role || profile.value.role
    }
    // 同步回本地，保证其它页面/后续读取一致
    uni.setStorageSync('nickname', profile.value.nickname)
    uni.setStorageSync('username', profile.value.username)
  } catch (e) {
    // 拉取失败则维持本地缓存
  }
}

function logout() {
  uni.removeStorageSync('token')
  uni.removeStorageSync('role')
  uni.removeStorageSync('nickname')
  uni.removeStorageSync('username')
  uni.removeStorageSync('user_id')
  uni.reLaunch({ url: '/pages/login/index' })
}

function goWardrobe() { currentView.value = 'wardrobe' }
function switchView(key) {
  currentView.value = key
  if (key === 'notify') {
    fetchNotifications()
    fetchUnread()
  } else if (key === 'profile') {
    loadProfile()
  }
}
function setFilter(k) { wardrobeFilter.value = k }
function closeUpload() { showUpload.value = false }

// ===== 首页：定位天气 + 按天气从衣橱挑搭配 =====
function getLocation() {
  return new Promise((resolve, reject) => {
    uni.getLocation({ type: 'wgs84', success: r => resolve(r), fail: e => reject(e) })
  })
}
async function fetchWeather(lat, lon) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`
  const r = await fetch(url)
  return await r.json()
}
async function reverseGeocode(lat, lon) {
  const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=zh`
  const r = await fetch(url)
  return await r.json()
}
function weatherText(code) {
  const m = {
    0: '晴', 1: '晴间多云', 2: '局部多云', 3: '阴',
    45: '雾', 48: '雾凇', 51: '毛毛雨', 53: '毛毛雨', 55: '毛毛雨',
    61: '小雨', 63: '中雨', 65: '大雨', 66: '冻雨', 67: '冻雨',
    71: '小雪', 73: '中雪', 75: '大雪', 77: '雪粒',
    80: '阵雨', 81: '阵雨', 82: '强阵雨', 85: '阵雪', 86: '阵雪',
    95: '雷阵雨', 96: '雷阵雨伴冰雹', 99: '雷阵雨伴冰雹'
  }
  return m[code] !== undefined ? m[code] : '未知'
}
async function loadWeather() {
  weatherLoading.value = true
  // 自动尝试定位（带 4s 超时），失败/超时/被拒都回退默认城市，绝不卡住
  let lat = 39.9042, lon = 116.4074, located = false, city = '北京'
  try {
    const loc = await Promise.race([
      getLocation(),
      new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 4000))
    ])
    lat = loc.latitude
    lon = loc.longitude
    located = true
  } catch (e) {
    // 定位被拒/超时/不可用：退回默认城市（北京）
  }
  let wx = null, geo = null
  try { wx = await fetchWeather(lat, lon) } catch (e) { wx = null }
  try { geo = await reverseGeocode(lat, lon) } catch (e) { geo = null }
  if (geo && (geo.city || geo.locality)) city = geo.city || geo.locality
  const cw = wx && wx.current_weather
  weather.value = {
    city, located,
    temperature: cw ? cw.temperature : '--',
    description: cw ? weatherText(cw.weathercode) : '天气获取失败',
    windspeed: cw ? cw.windspeed : '--'
  }
  weatherLoading.value = false
  // 天气拿到后，直接按天气从衣橱挑一套搭配
  loadHomeOutfit(false)
}
async function loadHomeOutfit(randomPick = false) {
  homeLoading.value = true
  try {
    const wx = weather.value
    const temp = (typeof wx.temperature === 'number') ? wx.temperature : null
    const w = (wx.description && wx.description !== '未知' && wx.description !== '天气获取失败') ? wx.description : ''
    const city = wx.city || ''
    let url = `/user/outfit-by-weather?user_id=${getUserId()}&random_pick=${randomPick ? 'true' : 'false'}`
    if (temp !== null) url += `&temp=${temp}`
    if (w) url += `&weather=${encodeURIComponent(w)}`
    if (city) url += `&city=${encodeURIComponent(city)}`
    const d = await get(url)
    homeOutfit.value = d
  } catch (e) {
    homeOutfit.value = { text: '搭配获取失败，请稍后重试', image_url: '', items: [] }
  }
  homeLoading.value = false
}

// ===== 衣橱上传 / 抠图 =====
function openUpload() { showUpload.value = true }
async function chooseWardrobeImage() {
  try {
    const path = await chooseImage()
    uploadPreview.value = path
    uploadedFile.value = path
    uploadDetecting.value = true
    const d = await upload('/user/wardrobe/upload-and-tag', path)
    uploadedItemId.value = d.item ? d.item.id : null
    if (d.duplicate_warning && d.duplicate_warning.length) {
      uni.showModal({
        title: '重复购买提醒',
        content: '衣橱里已经有类似的：' + d.duplicate_warning.join('、') + '。\n确认是否需要重复拥有？',
        showCancel: false
      })
    }
    if (d.tags) {
      uploadForm.value = {
        name: d.tags.name || '',
        category: d.tags.category || 'top',
        color: d.tags.color || '',
        style: d.tags.style || '',
        season: d.tags.season || ''
      }
      uploadTags.value = d.tags
      uni.showToast({ title: 'AI识别完成，请确认后保存', icon: 'none' })
    }
  } catch (e) {
    uploadTags.value = {}
    uploadForm.value = { name: '', category: 'top', color: '', style: '', season: '' }
    uni.showToast({ title: 'AI识别失败，可手动填写', icon: 'none' })
  }
  uploadDetecting.value = false
}
// 批量上传（上限10张）：逐张走 AI 识图 + 自动保存
async function chooseBatchImages() {
  try {
    const res = await uni.chooseImage({ count: 10, sizeType: ['compressed'], sourceType: ['album', 'camera'] })
    const files = res.tempFilePaths
    if (!files || !files.length) return
    uni.showLoading({ title: `正在识别 ${files.length} 张...`, mask: true })
    let success = 0, fail = 0
    for (const f of files) {
      try {
        const d = await upload('/user/wardrobe/upload-and-tag', f)
        // 用 AI 识别结果直接建物品（用户可在衣橱页后续编辑）
        await post('/user/wardrobe', {
          name: (d.tags && d.tags.name) || '衣物',
          category: (d.tags && d.tags.category) || 'top',
          color: (d.tags && d.tags.color) || '',
          style: (d.tags && d.tags.style) || '',
          season: (d.tags && d.tags.season) || '',
          image_url: d.image_url || '',
          purchase_date: new Date().toISOString().slice(0, 10)
        })
        success++
      } catch (e) { fail++ }
    }
    uni.hideLoading()
    fetchWardrobe()
    uni.showToast({ title: `成功录入 ${success} 件${fail ? `，失败 ${fail} 张` : ''}`, icon: success > 0 ? 'success' : 'none' })
    closeUpload()
  } catch (e) { /* 用户取消 */ }
}
function onPurchaseDateChange(e) {
  purchaseDate.value = e.detail.value
}
async function confirmUpload() {
  if (!uploadedItemId.value) {
    uni.showToast({ title: '请先上传图片', icon: 'none' })
    return
  }
  try {
    await put('/user/wardrobe/' + uploadedItemId.value, {
      name: uploadForm.value.name,
      category: uploadForm.value.category,
      color: uploadForm.value.color,
      style: uploadForm.value.style,
      season: uploadForm.value.season,
      purchase_date: purchaseDate.value || null
    })
    uni.showToast({ title: '已保存到衣橱', icon: 'success' })
  } catch (e) {
    uni.showToast({ title: '保存失败', icon: 'none' })
  }
  showUpload.value = false
  resetUpload()
  fetchWardrobe()
}
function resetUpload() {
  uploadPreview.value = ''; uploadTags.value = null; uploadedFile.value = ''
  uploadedItemId.value = null; purchaseDate.value = ''
  uploadForm.value = { name: '', category: 'top', color: '', style: '', season: '' }
}

// ===== 衣橱操作 =====
function itemMeta(item) {
  const today = new Date()
  const toDate = s => s ? new Date(s) : null
  const pd = toDate(item.purchase_date)
  const lw = toDate(item.last_worn)
  const owned = pd ? Math.floor((today - pd) / 86400000) : null
  const idle = lw ? Math.floor((today - lw) / 86400000) : null
  const parts = []
  if (owned !== null) parts.push('购入' + owned + '天')
  if (idle !== null) parts.push('已' + idle + '天没穿')
  else if (owned !== null && owned > 90) parts.push('购入久未穿')
  parts.push('穿' + (item.wear_count || 0) + '次')
  return parts.join(' · ')
}
function isIdle(item) {
  const today = new Date()
  const lw = item.last_worn ? new Date(item.last_worn) : null
  const pd = item.purchase_date ? new Date(item.purchase_date) : null
  if (lw) return Math.floor((today - lw) / 86400000) > 90
  if (pd) return Math.floor((today - pd) / 86400000) > 90
  return false
}
async function markWorn(ids) {
  try { await post('/user/wardrobe/mark-worn', { ids }) } catch (e) {}
}
function pickItem(id) {
  // 衣橱卡片的「搭配」：加入自主搭配选择并直接进入「自己搭 + AI 审核」界面
  if (!isSelected(id)) selectedIds.value.push(id)
  reviewResult.value = null
  currentView.value = 'outfit'
}
async function deleteItem(id) {
  uni.showModal({
    title: '确定删除?',
    success: async (r) => {
      if (r.confirm) {
        try { await del('/user/wardrobe/' + id); fetchWardrobe(); uni.showToast({ title: '已删除', icon: 'success' }) } catch (e) {}
      }
    }
  })
}
// 衣橱卡片长按操作菜单
function showCardMenu(item) {
  uni.showActionSheet({
    itemList: ['加入搭配审核', '编辑信息', '删除这件衣服'],
    success: (res) => {
      if (res.tapIndex === 0) pickItem(item.id)
      else if (res.tapIndex === 2) deleteItem(item.id)
      // tapIndex 1 = 编辑（暂用弹窗重新打开上传流程，后续可做独立编辑页）
      else if (res.tapIndex === 1) { uni.showToast({ title: '编辑功能开发中', icon: 'none' }) }
    }
  })
}
// 颜色名 → hex（用于无图卡片的占位色）
const COLOR_HEX_MAP = {
  '白色': '#f5f5f5', '白色系': '#f5f5f5', '米白': '#f5f0e1', '米色': '#f0e6d2',
  '黑色': '#2b2b2b', '黑色系': '#2b2b2b', '深灰': '#6b6b6b', '灰色': '#9aa0a6', '灰色系': '#9aa0a6', '浅灰': '#d4d4d4',
  '红色': '#ef6f6c', '红色系': '#ef6f6c', '酒红': '#8b2323', '玫红': '#e84a7d', '粉色': '#f78fb3', '粉色系': '#f78fb3',
  '蓝色': '#5b8def', '蓝色系': '#5b8def', '深蓝': '#1a3a6b', '浅蓝': '#87ceeb', '藏青': '#2c3e50',
  '绿色': '#22c1a8', '绿色系': '#22c1a8', '墨绿': '#2d5a3d', '军绿': '#556b2f', '橄榄': '#808000',
  '黄色': '#f6c244', '黄色系': '#f6c244', '橙色': '#f6a609', '橙色系': '#f6a609',
  '棕色': '#8b6914', '棕色系': '#8b6914', '驼色': '#c19a6b', '卡其': '#c3b091',
  '紫色': '#9b6dff', '紫色系': '#9b6dff', '薰衣草': '#b39ddb',
  '金色': '#ffd700', '银色': '#c0c0c0', '杏色': '#ffdead'
}
function getItemColorHex(item) {
  return COLOR_HEX_MAP[item.color] || COLOR_HEX_MAP[item.color?.replace('色','')] || '#e0e0e0'
}
async function openHistoryDrawer() {
  fetchConversations()
  showHistoryDrawer.value = true
  drawerOpened.value = false
  await nextTick()
  drawerOpened.value = true
}
function closeHistoryDrawer() {
  drawerOpened.value = false
  setTimeout(() => { showHistoryDrawer.value = false }, 280)
}
function newChat() {
  messages.value = []
  currentView.value = 'chat'
  closeHistoryDrawer()
}
async function deleteConversation(id) {
  uni.showModal({
    title: '删除对话',
    content: '确定删除这条对话记录吗？',
    success: async (r) => {
      if (r.confirm) {
        try {
          await del('/user/conversations/' + id)
          conversations.value = conversations.value.filter(c => c.id !== id)
          uni.showToast({ title: '已删除', icon: 'success' })
        } catch (e) {}
      }
    }
  })
}
function openHistoryChatById(id) {
  const conv = conversations.value.find(c => c.id === id)
  if (!conv) return
  messages.value = []
  messages.value.push(markRaw({ role: 'user', content: conv.user_input }))
  messages.value.push(markRaw({ role: 'agent', content: conv.agent_response, cid: conv.id, rating: conv.score }))
  currentView.value = 'chat'
  closeHistoryDrawer()
}

onMounted(() => {
  fetchWardrobe()
  fetchConversations()
  fetchAnalysis()
  fetchShoppingList()
  fetchNotifications()
  fetchUnread()
  loadProfile()
  loadWeather()
})

const __returned__ = { currentView, chatInput, chatLoading, messages, wardrobe, wardrobeFilter, conversations, showHistoryDrawer, drawerOpened, analysis, shoppingList, notifications, unreadCount, notifyLoading, showUpload, uploadPreview, uploadTags, uploadDetecting, uploadedFile, uploadedItemId, purchaseDate, uploadForm, weatherLoading, weather, homeLoading, homeOutfit, tempDisplay, navItems, catList, catListWithCount, catMap, catKeys, catLabels, filteredWardrobe, pct, CAT_CN, PALETTE, SEASON_CN, SEASON_COLOR, COLOR_HEX, categoryChart, seasonChart, colorList, wardrobeScore, scoreColor, scoreText, tagClass, onCatChange, fetchWardrobe, fetchConversations, fetchAnalysis, fetchShoppingList, getUserId, selectedIds, reviewLoading, reviewResult, isSelected, toggleSelect, clearSelection, outfitScoreColor, outfitScoreRing, reviewOutfit, aiHelpOutfit, startSelfOutfit, fetchNotifications, fetchUnread, notiTypeLabel, onNotiClick, markAllRead, chooseImage, onChatInput, onChatConfirm, onChatSend, onFormInput, sendChat, chatChooseImage, rateByIndex, profile, loadProfile, refreshProfile, logout, goWardrobe, switchView, setFilter, closeUpload, getLocation, fetchWeather, reverseGeocode, weatherText, loadWeather, loadHomeOutfit, openUpload, chooseWardrobeImage, chooseBatchImages, onPurchaseDateChange, confirmUpload, resetUpload, itemMeta, isIdle, markWorn, pickItem, deleteItem, showCardMenu, COLOR_HEX_MAP, getItemColorHex, openHistoryDrawer, closeHistoryDrawer, newChat, deleteConversation, openHistoryChatById, ref, computed, onMounted, shallowRef, markRaw, nextTick, get get() { return get }, get post() { return post }, get del() { return del }, get put() { return put }, get upload() { return upload } }
Object.defineProperty(__returned__, '__isScriptSetup', { enumerable: false, value: true })
return __returned__
}

}
import { createTextVNode as _createTextVNode, resolveComponent as _resolveComponent, withCtx as _withCtx, createVNode as _createVNode, toDisplayString as _toDisplayString, openBlock as _openBlock, createBlock as _createBlock, createCommentVNode as _createCommentVNode, vShow as _vShow, withDirectives as _withDirectives, renderList as _renderList, Fragment as _Fragment, createElementBlock as _createElementBlock, normalizeClass as _normalizeClass, normalizeStyle as _normalizeStyle, withModifiers as _withModifiers } from "/node_modules/@dcloudio/uni-h5-vue/dist/vue.runtime.esm.js"

function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  const _component_v_uni_text = __syscom_0
  const _component_v_uni_view = __syscom_1
  const _component_v_uni_image = __syscom_2
  const _component_v_uni_input = __syscom_3
  const _component_v_uni_scroll_view = __syscom_4
  const _component_v_uni_picker = __syscom_5

  return (_openBlock(), _createBlock(_component_v_uni_view, { class: "page" }, {
    default: _withCtx(() => [
      _createVNode(_component_v_uni_view, { class: "topbar" }, {
        default: _withCtx(() => [
          _createVNode(_component_v_uni_text, { class: "tb-title" }, {
            default: _withCtx(() => [
              _createTextVNode("AI 穿搭助手")
            ]),
            _: 1 /* STABLE */
          }),
          _createVNode(_component_v_uni_view, { class: "tb-right" }, {
            default: _withCtx(() => [
              _createVNode(_component_v_uni_view, {
                class: "notify-bell",
                onClick: _cache[0] || (_cache[0] = $event => ($setup.switchView('notify')))
              }, {
                default: _withCtx(() => [
                  _createVNode(_component_v_uni_text, { class: "bell-ico" }, {
                    default: _withCtx(() => [
                      _createTextVNode("🔔")
                    ]),
                    _: 1 /* STABLE */
                  }),
                  ($setup.unreadCount>0)
                    ? (_openBlock(), _createBlock(_component_v_uni_text, {
                        key: 0,
                        class: "bell-badge"
                      }, {
                        default: _withCtx(() => [
                          _createTextVNode(_toDisplayString($setup.unreadCount>99?'99+':$setup.unreadCount), 1 /* TEXT */)
                        ]),
                        _: 1 /* STABLE */
                      }))
                    : _createCommentVNode("v-if", true)
                ]),
                _: 1 /* STABLE */
              })
            ]),
            _: 1 /* STABLE */
          })
        ]),
        _: 1 /* STABLE */
      }),
      _createVNode(_component_v_uni_scroll_view, {
        class: "main",
        "scroll-y": ""
      }, {
        default: _withCtx(() => [
          _withDirectives(_createVNode(_component_v_uni_view, { class: "panel" }, {
            default: _withCtx(() => [
              _createVNode(_component_v_uni_view, { class: "weather-card" }, {
                default: _withCtx(() => [
                  _createVNode(_component_v_uni_view, { class: "wx-weather" }, {
                    default: _withCtx(() => [
                      _createVNode(_component_v_uni_text, { class: "wx-temp" }, {
                        default: _withCtx(() => [
                          _createTextVNode(_toDisplayString($setup.tempDisplay), 1 /* TEXT */)
                        ]),
                        _: 1 /* STABLE */
                      }),
                      _createVNode(_component_v_uni_text, { class: "wx-desc" }, {
                        default: _withCtx(() => [
                          _createTextVNode(_toDisplayString($setup.weather.description), 1 /* TEXT */)
                        ]),
                        _: 1 /* STABLE */
                      })
                    ]),
                    _: 1 /* STABLE */
                  }),
                  _createVNode(_component_v_uni_view, { class: "wx-meta" }, {
                    default: _withCtx(() => [
                      _createVNode(_component_v_uni_text, { class: "wx-city" }, {
                        default: _withCtx(() => [
                          _createTextVNode("📍 " + _toDisplayString($setup.weather.city) + _toDisplayString($setup.weather.located ? '' : '（默认）'), 1 /* TEXT */)
                        ]),
                        _: 1 /* STABLE */
                      }),
                      ($setup.weather.windspeed !== '--')
                        ? (_openBlock(), _createBlock(_component_v_uni_text, {
                            key: 0,
                            class: "wx-wind"
                          }, {
                            default: _withCtx(() => [
                              _createTextVNode("💨 " + _toDisplayString($setup.weather.windspeed) + " km/h", 1 /* TEXT */)
                            ]),
                            _: 1 /* STABLE */
                          }))
                        : _createCommentVNode("v-if", true)
                    ]),
                    _: 1 /* STABLE */
                  })
                ]),
                _: 1 /* STABLE */
              }),
              _createVNode(_component_v_uni_view, { class: "panel-head between" }, {
                default: _withCtx(() => [
                  _createVNode(_component_v_uni_text, { class: "panel-title" }, {
                    default: _withCtx(() => [
                      _createTextVNode("今日穿搭")
                    ]),
                    _: 1 /* STABLE */
                  }),
                  _createVNode(_component_v_uni_view, {
                    class: "mini-btn",
                    onClick: _cache[1] || (_cache[1] = $event => ($setup.loadHomeOutfit(true)))
                  }, {
                    default: _withCtx(() => [
                      _createTextVNode("换一套")
                    ]),
                    _: 1 /* STABLE */
                  })
                ]),
                _: 1 /* STABLE */
              }),
              ($setup.homeLoading)
                ? (_openBlock(), _createBlock(_component_v_uni_view, {
                    key: 0,
                    class: "card-box"
                  }, {
                    default: _withCtx(() => [
                      _createVNode(_component_v_uni_text, { class: "loading-text" }, {
                        default: _withCtx(() => [
                          _createTextVNode("正在为你搭配…")
                        ]),
                        _: 1 /* STABLE */
                      })
                    ]),
                    _: 1 /* STABLE */
                  }))
                : ($setup.homeOutfit)
                  ? (_openBlock(), _createBlock(_component_v_uni_view, {
                      key: 1,
                      class: "card-box"
                    }, {
                      default: _withCtx(() => [
                        _createVNode(_component_v_uni_text, { class: "pre" }, {
                          default: _withCtx(() => [
                            _createTextVNode(_toDisplayString($setup.homeOutfit.text), 1 /* TEXT */)
                          ]),
                          _: 1 /* STABLE */
                        }),
                        ($setup.homeOutfit.image_url)
                          ? (_openBlock(), _createBlock(_component_v_uni_image, {
                              key: 0,
                              src: $setup.homeOutfit.image_url,
                              mode: "widthFix",
                              class: "outfit-img"
                            }, null, 8 /* PROPS */, ["src"]))
                          : _createCommentVNode("v-if", true)
                      ]),
                      _: 1 /* STABLE */
                    }))
                  : (_openBlock(), _createBlock(_component_v_uni_view, {
                      key: 2,
                      class: "card-box"
                    }, {
                      default: _withCtx(() => [
                        _createVNode(_component_v_uni_text, { class: "pre" }, {
                          default: _withCtx(() => [
                            _createTextVNode("衣橱还没有衣物，去「衣橱」添加吧～")
                          ]),
                          _: 1 /* STABLE */
                        })
                      ]),
                      _: 1 /* STABLE */
                    })),
              _createVNode(_component_v_uni_view, {
                class: "panel-head",
                style: {"margin-top":"32rpx"}
              }, {
                default: _withCtx(() => [
                  _createVNode(_component_v_uni_text, { class: "panel-title" }, {
                    default: _withCtx(() => [
                      _createTextVNode("工作台")
                    ]),
                    _: 1 /* STABLE */
                  })
                ]),
                _: 1 /* STABLE */
              }),
              _createVNode(_component_v_uni_view, {
                class: "choice-card ai",
                onClick: $setup.aiHelpOutfit
              }, {
                default: _withCtx(() => [
                  _createVNode(_component_v_uni_text, { class: "choice-ico" }, {
                    default: _withCtx(() => [
                      _createTextVNode("🤖")
                    ]),
                    _: 1 /* STABLE */
                  }),
                  _createVNode(_component_v_uni_view, { class: "choice-body" }, {
                    default: _withCtx(() => [
                      _createVNode(_component_v_uni_text, { class: "choice-t" }, {
                        default: _withCtx(() => [
                          _createTextVNode("让 AI 帮我搭配")
                        ]),
                        _: 1 /* STABLE */
                      }),
                      _createVNode(_component_v_uni_text, { class: "choice-d" }, {
                        default: _withCtx(() => [
                          _createTextVNode("把需求告诉 AI，由它按天气 / 场合 / 衣橱给你出方案")
                        ]),
                        _: 1 /* STABLE */
                      })
                    ]),
                    _: 1 /* STABLE */
                  }),
                  _createVNode(_component_v_uni_text, { class: "choice-arrow" }, {
                    default: _withCtx(() => [
                      _createTextVNode("去对话 ›")
                    ]),
                    _: 1 /* STABLE */
                  })
                ]),
                _: 1 /* STABLE */
              }),
              _createVNode(_component_v_uni_view, {
                class: "choice-card self",
                onClick: $setup.startSelfOutfit
              }, {
                default: _withCtx(() => [
                  _createVNode(_component_v_uni_text, { class: "choice-ico" }, {
                    default: _withCtx(() => [
                      _createTextVNode("✋")
                    ]),
                    _: 1 /* STABLE */
                  }),
                  _createVNode(_component_v_uni_view, { class: "choice-body" }, {
                    default: _withCtx(() => [
                      _createVNode(_component_v_uni_text, { class: "choice-t" }, {
                        default: _withCtx(() => [
                          _createTextVNode("自己搭配 + AI 审核")
                        ]),
                        _: 1 /* STABLE */
                      }),
                      _createVNode(_component_v_uni_text, { class: "choice-d" }, {
                        default: _withCtx(() => [
                          _createTextVNode("从衣橱自选几件，让 AI 判断这套搭得合不合适")
                        ]),
                        _: 1 /* STABLE */
                      })
                    ]),
                    _: 1 /* STABLE */
                  }),
                  _createVNode(_component_v_uni_text, { class: "choice-arrow" }, {
                    default: _withCtx(() => [
                      _createTextVNode("开始 ›")
                    ]),
                    _: 1 /* STABLE */
                  })
                ]),
                _: 1 /* STABLE */
              }),
              _createVNode(_component_v_uni_view, { class: "quick-row" }, {
                default: _withCtx(() => [
                  _createVNode(_component_v_uni_view, {
                    class: "quick-tile",
                    onClick: _cache[2] || (_cache[2] = $event => ($setup.switchView('wardrobe')))
                  }, {
                    default: _withCtx(() => [
                      _createVNode(_component_v_uni_text, { class: "qt-ico" }, {
                        default: _withCtx(() => [
                          _createTextVNode("👔")
                        ]),
                        _: 1 /* STABLE */
                      }),
                      _createVNode(_component_v_uni_text, { class: "qt-label" }, {
                        default: _withCtx(() => [
                          _createTextVNode("衣橱")
                        ]),
                        _: 1 /* STABLE */
                      })
                    ]),
                    _: 1 /* STABLE */
                  }),
                  _createVNode(_component_v_uni_view, {
                    class: "quick-tile",
                    onClick: _cache[3] || (_cache[3] = $event => ($setup.switchView('analysis')))
                  }, {
                    default: _withCtx(() => [
                      _createVNode(_component_v_uni_text, { class: "qt-ico" }, {
                        default: _withCtx(() => [
                          _createTextVNode("📊")
                        ]),
                        _: 1 /* STABLE */
                      }),
                      _createVNode(_component_v_uni_text, { class: "qt-label" }, {
                        default: _withCtx(() => [
                          _createTextVNode("分析")
                        ]),
                        _: 1 /* STABLE */
                      })
                    ]),
                    _: 1 /* STABLE */
                  }),
                  _createVNode(_component_v_uni_view, {
                    class: "quick-tile",
                    onClick: _cache[4] || (_cache[4] = $event => ($setup.switchView('notify')))
                  }, {
                    default: _withCtx(() => [
                      _createVNode(_component_v_uni_text, { class: "qt-ico" }, {
                        default: _withCtx(() => [
                          _createTextVNode("🔔")
                        ]),
                        _: 1 /* STABLE */
                      }),
                      _createVNode(_component_v_uni_text, { class: "qt-label" }, {
                        default: _withCtx(() => [
                          _createTextVNode("通知")
                        ]),
                        _: 1 /* STABLE */
                      }),
                      ($setup.unreadCount>0)
                        ? (_openBlock(), _createBlock(_component_v_uni_text, {
                            key: 0,
                            class: "qt-badge"
                          }, {
                            default: _withCtx(() => [
                              _createTextVNode(_toDisplayString($setup.unreadCount>99?'99+':$setup.unreadCount), 1 /* TEXT */)
                            ]),
                            _: 1 /* STABLE */
                          }))
                        : _createCommentVNode("v-if", true)
                    ]),
                    _: 1 /* STABLE */
                  }),
                  _createVNode(_component_v_uni_view, {
                    class: "quick-tile",
                    onClick: _cache[5] || (_cache[5] = $event => ($setup.switchView('profile')))
                  }, {
                    default: _withCtx(() => [
                      _createVNode(_component_v_uni_text, { class: "qt-ico" }, {
                        default: _withCtx(() => [
                          _createTextVNode("👤")
                        ]),
                        _: 1 /* STABLE */
                      }),
                      _createVNode(_component_v_uni_text, { class: "qt-label" }, {
                        default: _withCtx(() => [
                          _createTextVNode("我的")
                        ]),
                        _: 1 /* STABLE */
                      })
                    ]),
                    _: 1 /* STABLE */
                  })
                ]),
                _: 1 /* STABLE */
              })
            ]),
            _: 1 /* STABLE */
          }, 512 /* NEED_PATCH */), [
            [_vShow, $setup.currentView==='today']
          ]),
          _withDirectives(_createVNode(_component_v_uni_view, { class: "panel" }, {
            default: _withCtx(() => [
              _createVNode(_component_v_uni_view, { class: "panel-head between" }, {
                default: _withCtx(() => [
                  _createVNode(_component_v_uni_view, { class: "head-left" }, {
                    default: _withCtx(() => [
                      _createVNode(_component_v_uni_text, {
                        class: "menu-btn",
                        onClick: $setup.openHistoryDrawer
                      }, {
                        default: _withCtx(() => [
                          _createTextVNode("☰")
                        ]),
                        _: 1 /* STABLE */
                      }),
                      _createVNode(_component_v_uni_text, { class: "panel-title" }, {
                        default: _withCtx(() => [
                          _createTextVNode("AI 穿搭对话")
                        ]),
                        _: 1 /* STABLE */
                      })
                    ]),
                    _: 1 /* STABLE */
                  }),
                  _createVNode(_component_v_uni_view, {
                    class: "mini-btn",
                    onClick: $setup.goWardrobe
                  }, {
                    default: _withCtx(() => [
                      _createTextVNode("查看衣橱")
                    ]),
                    _: 1 /* STABLE */
                  })
                ]),
                _: 1 /* STABLE */
              }),
              _createVNode(_component_v_uni_view, { class: "chat-box" }, {
                default: _withCtx(() => [
                  (_openBlock(true), _createElementBlock(_Fragment, null, _renderList($setup.messages, (m, i) => {
                    return (_openBlock(), _createBlock(_component_v_uni_view, {
                      key: i,
                      class: _normalizeClass(['msg','msg-'+m.role])
                    }, {
                      default: _withCtx(() => [
                        (m.image)
                          ? (_openBlock(), _createBlock(_component_v_uni_image, {
                              key: 0,
                              src: m.image,
                              mode: "widthFix",
                              class: "chat-img"
                            }, null, 8 /* PROPS */, ["src"]))
                          : _createCommentVNode("v-if", true),
                        _createVNode(_component_v_uni_view, { class: "bubble" }, {
                          default: _withCtx(() => [
                            _createVNode(_component_v_uni_text, { class: "msg-label" }, {
                              default: _withCtx(() => [
                                _createTextVNode(_toDisplayString(m.role==='user'?'你':'AI搭配师'), 1 /* TEXT */)
                              ]),
                              _: 2 /* DYNAMIC */
                            }, 1024 /* DYNAMIC_SLOTS */),
                            _createVNode(_component_v_uni_text, { class: "msg-text" }, {
                              default: _withCtx(() => [
                                _createTextVNode(_toDisplayString(m.content), 1 /* TEXT */)
                              ]),
                              _: 2 /* DYNAMIC */
                            }, 1024 /* DYNAMIC_SLOTS */)
                          ]),
                          _: 2 /* DYNAMIC */
                        }, 1024 /* DYNAMIC_SLOTS */),
                        (m.role==='agent'&&m.cid)
                          ? (_openBlock(), _createBlock(_component_v_uni_view, {
                              key: 1,
                              class: "rate-row"
                            }, {
                              default: _withCtx(() => [
                                (_openBlock(), _createElementBlock(_Fragment, null, _renderList(5, (n) => {
                                  return _createVNode(_component_v_uni_text, {
                                    key: n,
                                    class: _normalizeClass(['star',{active:n<=m.rating}]),
                                    onClick: $event => ($setup.rateByIndex(i,n))
                                  }, {
                                    default: _withCtx(() => [
                                      _createTextVNode("★")
                                    ]),
                                    _: 2 /* DYNAMIC */
                                  }, 1032 /* PROPS, DYNAMIC_SLOTS */, ["class", "onClick"])
                                }), 64 /* STABLE_FRAGMENT */))
                              ]),
                              _: 2 /* DYNAMIC */
                            }, 1024 /* DYNAMIC_SLOTS */))
                          : _createCommentVNode("v-if", true)
                      ]),
                      _: 2 /* DYNAMIC */
                    }, 1032 /* PROPS, DYNAMIC_SLOTS */, ["class"]))
                  }), 128 /* KEYED_FRAGMENT */)),
                  ($setup.chatLoading)
                    ? (_openBlock(), _createBlock(_component_v_uni_view, {
                        key: 0,
                        class: "msg msg-agent"
                      }, {
                        default: _withCtx(() => [
                          _createVNode(_component_v_uni_view, { class: "bubble" }, {
                            default: _withCtx(() => [
                              _createVNode(_component_v_uni_text, { class: "loading-text" }, {
                                default: _withCtx(() => [
                                  _createTextVNode("AI搭配师正在思考...")
                                ]),
                                _: 1 /* STABLE */
                              })
                            ]),
                            _: 1 /* STABLE */
                          })
                        ]),
                        _: 1 /* STABLE */
                      }))
                    : _createCommentVNode("v-if", true)
                ]),
                _: 1 /* STABLE */
              }),
              _createVNode(_component_v_uni_view, { class: "chat-input" }, {
                default: _withCtx(() => [
                  _createVNode(_component_v_uni_view, {
                    class: "icon-btn",
                    onClick: $setup.chatChooseImage
                  }, {
                    default: _withCtx(() => [
                      _createTextVNode("📷")
                    ]),
                    _: 1 /* STABLE */
                  }),
                  _createVNode(_component_v_uni_input, {
                    class: "chat-field",
                    value: $setup.chatInput,
                    placeholder: "描述你的需求，比如：明天开会，帮我推荐...",
                    onInput: $setup.onChatInput,
                    onConfirm: $setup.onChatConfirm
                  }, null, 8 /* PROPS */, ["value"]),
                  _createVNode(_component_v_uni_view, {
                    class: "send-btn",
                    onClick: $setup.onChatSend
                  }, {
                    default: _withCtx(() => [
                      _createTextVNode("发送")
                    ]),
                    _: 1 /* STABLE */
                  })
                ]),
                _: 1 /* STABLE */
              })
            ]),
            _: 1 /* STABLE */
          }, 512 /* NEED_PATCH */), [
            [_vShow, $setup.currentView==='chat']
          ]),
          _withDirectives(_createVNode(_component_v_uni_view, { class: "panel wh-page" }, {
            default: _withCtx(() => [
              _createVNode(_component_v_uni_view, { class: "wh-banner" }, {
                default: _withCtx(() => [
                  _createVNode(_component_v_uni_view, { class: "wh-banner-bg" }, {
                    default: _withCtx(() => [
                      ($setup.homeOutfit?.image_url)
                        ? (_openBlock(), _createBlock(_component_v_uni_image, {
                            key: 0,
                            src: $setup.homeOutfit.image_url,
                            mode: "aspectFill",
                            class: "wh-banner-img"
                          }, null, 8 /* PROPS */, ["src"]))
                        : _createCommentVNode("v-if", true)
                    ]),
                    _: 1 /* STABLE */
                  }),
                  _createVNode(_component_v_uni_view, { class: "wh-banner-info" }, {
                    default: _withCtx(() => [
                      _createVNode(_component_v_uni_text, { class: "wh-banner-title" }, {
                        default: _withCtx(() => [
                          _createTextVNode("数字衣柜 | AI衣柜")
                        ]),
                        _: 1 /* STABLE */
                      }),
                      _createVNode(_component_v_uni_text, { class: "wh-banner-stats" }, {
                        default: _withCtx(() => [
                          _createTextVNode("可存 500 件　|　已存 " + _toDisplayString($setup.wardrobe.length) + " 件　|　" + _toDisplayString($setup.profile.nickname || '用户'), 1 /* TEXT */)
                        ]),
                        _: 1 /* STABLE */
                      })
                    ]),
                    _: 1 /* STABLE */
                  })
                ]),
                _: 1 /* STABLE */
              }),
              _createVNode(_component_v_uni_view, {
                class: "wh-upload-entry",
                onClick: $setup.openUpload
              }, {
                default: _withCtx(() => [
                  _createVNode(_component_v_uni_text, { class: "wh-up-ico" }, {
                    default: _withCtx(() => [
                      _createTextVNode("📷")
                    ]),
                    _: 1 /* STABLE */
                  }),
                  _createVNode(_component_v_uni_text, { class: "wh-up-text" }, {
                    default: _withCtx(() => [
                      _createTextVNode("录入新的衣服（AI自动识别图片填资料）")
                    ]),
                    _: 1 /* STABLE */
                  })
                ]),
                _: 1 /* STABLE */
              }),
              _createVNode(_component_v_uni_view, { class: "wh-filter-row" }, {
                default: _withCtx(() => [
                  _createVNode(_component_v_uni_text, { class: "wh-filter-label" }, {
                    default: _withCtx(() => [
                      _createTextVNode("展示方式")
                    ]),
                    _: 1 /* STABLE */
                  }),
                  _createVNode(_component_v_uni_scroll_view, {
                    class: "wh-cat-tabs",
                    "scroll-x": "",
                    "show-scrollbar": false
                  }, {
                    default: _withCtx(() => [
                      (_openBlock(true), _createElementBlock(_Fragment, null, _renderList($setup.catListWithCount, (c) => {
                        return (_openBlock(), _createBlock(_component_v_uni_view, {
                          key: c.k,
                          class: _normalizeClass(['wh-cat-tab', { active: $setup.wardrobeFilter === c.k }]),
                          onClick: $event => ($setup.setFilter(c.k))
                        }, {
                          default: _withCtx(() => [
                            _createVNode(_component_v_uni_text, null, {
                              default: _withCtx(() => [
                                _createTextVNode(_toDisplayString(c.l), 1 /* TEXT */),
                                (c.n)
                                  ? (_openBlock(), _createBlock(_component_v_uni_text, {
                                      key: 0,
                                      class: "wh-cat-n"
                                    }, {
                                      default: _withCtx(() => [
                                        _createTextVNode(_toDisplayString(c.n), 1 /* TEXT */)
                                      ]),
                                      _: 2 /* DYNAMIC */
                                    }, 1024 /* DYNAMIC_SLOTS */))
                                  : _createCommentVNode("v-if", true)
                              ]),
                              _: 2 /* DYNAMIC */
                            }, 1024 /* DYNAMIC_SLOTS */)
                          ]),
                          _: 2 /* DYNAMIC */
                        }, 1032 /* PROPS, DYNAMIC_SLOTS */, ["class", "onClick"]))
                      }), 128 /* KEYED_FRAGMENT */))
                    ]),
                    _: 1 /* STABLE */
                  })
                ]),
                _: 1 /* STABLE */
              }),
              _createVNode(_component_v_uni_view, { class: "wh-grid" }, {
                default: _withCtx(() => [
                  (_openBlock(true), _createElementBlock(_Fragment, null, _renderList($setup.filteredWardrobe, (item) => {
                    return (_openBlock(), _createBlock(_component_v_uni_view, {
                      key: item.id,
                      class: "wh-card",
                      onLongpress: $event => ($setup.showCardMenu(item))
                    }, {
                      default: _withCtx(() => [
                        _createVNode(_component_v_uni_view, { class: "wh-card-img-wrap" }, {
                          default: _withCtx(() => [
                            (item.image_url)
                              ? (_openBlock(), _createBlock(_component_v_uni_image, {
                                  key: 0,
                                  src: item.image_url,
                                  mode: "aspectFill",
                                  class: "wh-card-img"
                                }, null, 8 /* PROPS */, ["src"]))
                              : (_openBlock(), _createBlock(_component_v_uni_view, {
                                  key: 1,
                                  class: "wh-card-ph",
                                  style: _normalizeStyle({ background: $setup.getItemColorHex(item) })
                                }, {
                                  default: _withCtx(() => [
                                    _createVNode(_component_v_uni_text, { class: "wh-card-ph-txt" }, {
                                      default: _withCtx(() => [
                                        _createTextVNode(_toDisplayString(item.name[0]), 1 /* TEXT */)
                                      ]),
                                      _: 2 /* DYNAMIC */
                                    }, 1024 /* DYNAMIC_SLOTS */)
                                  ]),
                                  _: 2 /* DYNAMIC */
                                }, 1032 /* PROPS, DYNAMIC_SLOTS */, ["style"]))
                          ]),
                          _: 2 /* DYNAMIC */
                        }, 1024 /* DYNAMIC_SLOTS */),
                        _createVNode(_component_v_uni_text, { class: "wh-card-name" }, {
                          default: _withCtx(() => [
                            _createTextVNode(_toDisplayString(item.name), 1 /* TEXT */)
                          ]),
                          _: 2 /* DYNAMIC */
                        }, 1024 /* DYNAMIC_SLOTS */)
                      ]),
                      _: 2 /* DYNAMIC */
                    }, 1032 /* PROPS, DYNAMIC_SLOTS */, ["onLongpress"]))
                  }), 128 /* KEYED_FRAGMENT */)),
                  ($setup.filteredWardrobe.length===0)
                    ? (_openBlock(), _createBlock(_component_v_uni_view, {
                        key: 0,
                        class: "wh-empty"
                      }, {
                        default: _withCtx(() => [
                          _createVNode(_component_v_uni_text, { class: "wh-empty-ico" }, {
                            default: _withCtx(() => [
                              _createTextVNode("👗")
                            ]),
                            _: 1 /* STABLE */
                          }),
                          _createVNode(_component_v_uni_text, { class: "wh-empty-text" }, {
                            default: _withCtx(() => [
                              _createTextVNode("衣橱空空，点击上方录入你的第一件衣服吧")
                            ]),
                            _: 1 /* STABLE */
                          })
                        ]),
                        _: 1 /* STABLE */
                      }))
                    : _createCommentVNode("v-if", true)
                ]),
                _: 1 /* STABLE */
              })
            ]),
            _: 1 /* STABLE */
          }, 512 /* NEED_PATCH */), [
            [_vShow, $setup.currentView==='wardrobe']
          ]),
          _withDirectives(_createVNode(_component_v_uni_view, { class: "panel" }, {
            default: _withCtx(() => [
              _createVNode(_component_v_uni_view, { class: "panel-head between" }, {
                default: _withCtx(() => [
                  _createVNode(_component_v_uni_view, { class: "head-left" }, {
                    default: _withCtx(() => [
                      _createVNode(_component_v_uni_text, {
                        class: "back-btn",
                        onClick: _cache[6] || (_cache[6] = $event => ($setup.switchView('today')))
                      }, {
                        default: _withCtx(() => [
                          _createTextVNode("‹ 返回")
                        ]),
                        _: 1 /* STABLE */
                      }),
                      _createVNode(_component_v_uni_text, { class: "panel-title" }, {
                        default: _withCtx(() => [
                          _createTextVNode("我的搭配")
                        ]),
                        _: 1 /* STABLE */
                      })
                    ]),
                    _: 1 /* STABLE */
                  }),
                  _createVNode(_component_v_uni_text, { class: "panel-sub" }, {
                    default: _withCtx(() => [
                      _createTextVNode("从衣橱挑几件，让 AI 帮你审核")
                    ]),
                    _: 1 /* STABLE */
                  })
                ]),
                _: 1 /* STABLE */
              }),
              _createVNode(_component_v_uni_view, { class: "grid" }, {
                default: _withCtx(() => [
                  (_openBlock(true), _createElementBlock(_Fragment, null, _renderList($setup.wardrobe, (item) => {
                    return (_openBlock(), _createBlock(_component_v_uni_view, {
                      key: item.id,
                      class: _normalizeClass(['card', 'pick', { picked: $setup.isSelected(item.id) }]),
                      onClick: $event => ($setup.toggleSelect(item.id))
                    }, {
                      default: _withCtx(() => [
                        _createVNode(_component_v_uni_view, { class: "card-img" }, {
                          default: _withCtx(() => [
                            (item.image_url)
                              ? (_openBlock(), _createBlock(_component_v_uni_image, {
                                  key: 0,
                                  src: item.image_url,
                                  mode: "aspectFill",
                                  class: "full-img"
                                }, null, 8 /* PROPS */, ["src"]))
                              : (_openBlock(), _createBlock(_component_v_uni_view, {
                                  key: 1,
                                  class: "ph",
                                  style: _normalizeStyle({background:item.color||'#eee'})
                                }, {
                                  default: _withCtx(() => [
                                    _createVNode(_component_v_uni_text, null, {
                                      default: _withCtx(() => [
                                        _createTextVNode(_toDisplayString(item.name[0]), 1 /* TEXT */)
                                      ]),
                                      _: 2 /* DYNAMIC */
                                    }, 1024 /* DYNAMIC_SLOTS */)
                                  ]),
                                  _: 2 /* DYNAMIC */
                                }, 1032 /* PROPS, DYNAMIC_SLOTS */, ["style"]))
                          ]),
                          _: 2 /* DYNAMIC */
                        }, 1024 /* DYNAMIC_SLOTS */),
                        _createVNode(_component_v_uni_view, { class: "card-info" }, {
                          default: _withCtx(() => [
                            _createVNode(_component_v_uni_text, { class: "card-name" }, {
                              default: _withCtx(() => [
                                _createTextVNode(_toDisplayString(item.name), 1 /* TEXT */)
                              ]),
                              _: 2 /* DYNAMIC */
                            }, 1024 /* DYNAMIC_SLOTS */),
                            _createVNode(_component_v_uni_view, { class: "tags" }, {
                              default: _withCtx(() => [
                                _createVNode(_component_v_uni_text, { class: "tag" }, {
                                  default: _withCtx(() => [
                                    _createTextVNode(_toDisplayString(item.category), 1 /* TEXT */)
                                  ]),
                                  _: 2 /* DYNAMIC */
                                }, 1024 /* DYNAMIC_SLOTS */),
                                _createVNode(_component_v_uni_text, { class: "tag ok" }, {
                                  default: _withCtx(() => [
                                    _createTextVNode(_toDisplayString(item.color), 1 /* TEXT */)
                                  ]),
                                  _: 2 /* DYNAMIC */
                                }, 1024 /* DYNAMIC_SLOTS */)
                              ]),
                              _: 2 /* DYNAMIC */
                            }, 1024 /* DYNAMIC_SLOTS */)
                          ]),
                          _: 2 /* DYNAMIC */
                        }, 1024 /* DYNAMIC_SLOTS */),
                        ($setup.isSelected(item.id))
                          ? (_openBlock(), _createBlock(_component_v_uni_view, {
                              key: 0,
                              class: "pick-badge"
                            }, {
                              default: _withCtx(() => [
                                _createTextVNode("✓")
                              ]),
                              _: 1 /* STABLE */
                            }))
                          : _createCommentVNode("v-if", true)
                      ]),
                      _: 2 /* DYNAMIC */
                    }, 1032 /* PROPS, DYNAMIC_SLOTS */, ["class", "onClick"]))
                  }), 128 /* KEYED_FRAGMENT */)),
                  ($setup.wardrobe.length===0)
                    ? (_openBlock(), _createBlock(_component_v_uni_view, {
                        key: 0,
                        class: "empty"
                      }, {
                        default: _withCtx(() => [
                          _createVNode(_component_v_uni_text, null, {
                            default: _withCtx(() => [
                              _createTextVNode("衣橱空空，先去添加衣物")
                            ]),
                            _: 1 /* STABLE */
                          })
                        ]),
                        _: 1 /* STABLE */
                      }))
                    : _createCommentVNode("v-if", true)
                ]),
                _: 1 /* STABLE */
              }),
              ($setup.reviewResult)
                ? (_openBlock(), _createBlock(_component_v_uni_view, {
                    key: 0,
                    class: "review-card"
                  }, {
                    default: _withCtx(() => [
                      _createVNode(_component_v_uni_view, { class: "review-top" }, {
                        default: _withCtx(() => [
                          _createVNode(_component_v_uni_view, {
                            class: "score-ring",
                            style: _normalizeStyle({ background: $setup.outfitScoreRing })
                          }, {
                            default: _withCtx(() => [
                              _createVNode(_component_v_uni_text, { class: "score-num" }, {
                                default: _withCtx(() => [
                                  _createTextVNode(_toDisplayString($setup.reviewResult.score != null ? $setup.reviewResult.score : '—'), 1 /* TEXT */)
                                ]),
                                _: 1 /* STABLE */
                              }),
                              _createVNode(_component_v_uni_text, { class: "score-cap" }, {
                                default: _withCtx(() => [
                                  _createTextVNode("/10")
                                ]),
                                _: 1 /* STABLE */
                              })
                            ]),
                            _: 1 /* STABLE */
                          }, 8 /* PROPS */, ["style"]),
                          _createVNode(_component_v_uni_view, { class: "review-verdict" }, {
                            default: _withCtx(() => [
                              _createVNode(_component_v_uni_text, { class: "rv-label" }, {
                                default: _withCtx(() => [
                                  _createTextVNode("AI 审核结论")
                                ]),
                                _: 1 /* STABLE */
                              }),
                              _createVNode(_component_v_uni_text, {
                                class: "rv-tag",
                                style: _normalizeStyle({ background: $setup.outfitScoreColor })
                              }, {
                                default: _withCtx(() => [
                                  _createTextVNode(_toDisplayString($setup.reviewResult.verdict || '已点评'), 1 /* TEXT */)
                                ]),
                                _: 1 /* STABLE */
                              }, 8 /* PROPS */, ["style"])
                            ]),
                            _: 1 /* STABLE */
                          })
                        ]),
                        _: 1 /* STABLE */
                      }),
                      ($setup.reviewResult.image_url)
                        ? (_openBlock(), _createBlock(_component_v_uni_image, {
                            key: 0,
                            src: $setup.reviewResult.image_url,
                            mode: "widthFix",
                            class: "review-img"
                          }, null, 8 /* PROPS */, ["src"]))
                        : _createCommentVNode("v-if", true),
                      _createVNode(_component_v_uni_view, { class: "rv-block" }, {
                        default: _withCtx(() => [
                          _createVNode(_component_v_uni_text, { class: "rv-h" }, {
                            default: _withCtx(() => [
                              _createTextVNode("🎨 色彩协调")
                            ]),
                            _: 1 /* STABLE */
                          }),
                          _createVNode(_component_v_uni_text, { class: "rv-c" }, {
                            default: _withCtx(() => [
                              _createTextVNode(_toDisplayString($setup.reviewResult.color_comment || $setup.reviewResult.raw), 1 /* TEXT */)
                            ]),
                            _: 1 /* STABLE */
                          })
                        ]),
                        _: 1 /* STABLE */
                      }),
                      _createVNode(_component_v_uni_view, { class: "rv-block" }, {
                        default: _withCtx(() => [
                          _createVNode(_component_v_uni_text, { class: "rv-h" }, {
                            default: _withCtx(() => [
                              _createTextVNode("🌤 季节合适度")
                            ]),
                            _: 1 /* STABLE */
                          }),
                          _createVNode(_component_v_uni_text, { class: "rv-c" }, {
                            default: _withCtx(() => [
                              _createTextVNode(_toDisplayString($setup.reviewResult.season_comment), 1 /* TEXT */)
                            ]),
                            _: 1 /* STABLE */
                          })
                        ]),
                        _: 1 /* STABLE */
                      }),
                      _createVNode(_component_v_uni_view, { class: "rv-block" }, {
                        default: _withCtx(() => [
                          _createVNode(_component_v_uni_text, { class: "rv-h" }, {
                            default: _withCtx(() => [
                              _createTextVNode("🎩 场合得体度")
                            ]),
                            _: 1 /* STABLE */
                          }),
                          _createVNode(_component_v_uni_text, { class: "rv-c" }, {
                            default: _withCtx(() => [
                              _createTextVNode(_toDisplayString($setup.reviewResult.occasion_comment), 1 /* TEXT */)
                            ]),
                            _: 1 /* STABLE */
                          })
                        ]),
                        _: 1 /* STABLE */
                      }),
                      _createVNode(_component_v_uni_view, { class: "rv-block" }, {
                        default: _withCtx(() => [
                          _createVNode(_component_v_uni_text, { class: "rv-h" }, {
                            default: _withCtx(() => [
                              _createTextVNode("🧩 完整度")
                            ]),
                            _: 1 /* STABLE */
                          }),
                          _createVNode(_component_v_uni_text, { class: "rv-c" }, {
                            default: _withCtx(() => [
                              _createTextVNode(_toDisplayString($setup.reviewResult.completeness_comment), 1 /* TEXT */)
                            ]),
                            _: 1 /* STABLE */
                          })
                        ]),
                        _: 1 /* STABLE */
                      }),
                      ($setup.reviewResult.suggestions && $setup.reviewResult.suggestions.length)
                        ? (_openBlock(), _createBlock(_component_v_uni_view, {
                            key: 1,
                            class: "rv-block"
                          }, {
                            default: _withCtx(() => [
                              _createVNode(_component_v_uni_text, { class: "rv-h" }, {
                                default: _withCtx(() => [
                                  _createTextVNode("💡 改进建议")
                                ]),
                                _: 1 /* STABLE */
                              }),
                              (_openBlock(true), _createElementBlock(_Fragment, null, _renderList($setup.reviewResult.suggestions, (s, i) => {
                                return (_openBlock(), _createBlock(_component_v_uni_text, {
                                  key: i,
                                  class: "sug"
                                }, {
                                  default: _withCtx(() => [
                                    _createTextVNode(_toDisplayString((i+1)) + ". " + _toDisplayString(s), 1 /* TEXT */)
                                  ]),
                                  _: 2 /* DYNAMIC */
                                }, 1024 /* DYNAMIC_SLOTS */))
                              }), 128 /* KEYED_FRAGMENT */))
                            ]),
                            _: 1 /* STABLE */
                          }))
                        : _createCommentVNode("v-if", true),
                      _createVNode(_component_v_uni_view, { class: "review-actions" }, {
                        default: _withCtx(() => [
                          _createVNode(_component_v_uni_view, {
                            class: "mini-btn",
                            onClick: $setup.clearSelection
                          }, {
                            default: _withCtx(() => [
                              _createTextVNode("重新搭配")
                            ]),
                            _: 1 /* STABLE */
                          })
                        ]),
                        _: 1 /* STABLE */
                      })
                    ]),
                    _: 1 /* STABLE */
                  }))
                : _createCommentVNode("v-if", true),
              _createVNode(_component_v_uni_view, { class: "outfit-bar" }, {
                default: _withCtx(() => [
                  _createVNode(_component_v_uni_text, { class: "ob-count" }, {
                    default: _withCtx(() => [
                      _createTextVNode("已选 "),
                      _createVNode(_component_v_uni_text, { class: "ob-num" }, {
                        default: _withCtx(() => [
                          _createTextVNode(_toDisplayString($setup.selectedIds.length), 1 /* TEXT */)
                        ]),
                        _: 1 /* STABLE */
                      }),
                      _createTextVNode(" 件")
                    ]),
                    _: 1 /* STABLE */
                  }),
                  _createVNode(_component_v_uni_view, {
                    class: _normalizeClass(["ob-btn", { disabled: $setup.selectedIds.length < 2 || $setup.reviewLoading }]),
                    onClick: $setup.reviewOutfit
                  }, {
                    default: _withCtx(() => [
                      ($setup.reviewLoading)
                        ? (_openBlock(), _createBlock(_component_v_uni_text, { key: 0 }, {
                            default: _withCtx(() => [
                              _createTextVNode("审核中...")
                            ]),
                            _: 1 /* STABLE */
                          }))
                        : (_openBlock(), _createBlock(_component_v_uni_text, { key: 1 }, {
                            default: _withCtx(() => [
                              _createTextVNode("AI 审核搭配")
                            ]),
                            _: 1 /* STABLE */
                          }))
                    ]),
                    _: 1 /* STABLE */
                  }, 8 /* PROPS */, ["class"])
                ]),
                _: 1 /* STABLE */
              })
            ]),
            _: 1 /* STABLE */
          }, 512 /* NEED_PATCH */), [
            [_vShow, $setup.currentView==='outfit']
          ]),
          _withDirectives(_createVNode(_component_v_uni_view, { class: "panel" }, {
            default: _withCtx(() => [
              _createVNode(_component_v_uni_view, { class: "panel-head between" }, {
                default: _withCtx(() => [
                  _createVNode(_component_v_uni_text, { class: "panel-title" }, {
                    default: _withCtx(() => [
                      _createTextVNode("衣橱分析")
                    ]),
                    _: 1 /* STABLE */
                  }),
                  _createVNode(_component_v_uni_view, {
                    class: "mini-btn",
                    onClick: $setup.fetchAnalysis
                  }, {
                    default: _withCtx(() => [
                      _createTextVNode("刷新")
                    ]),
                    _: 1 /* STABLE */
                  })
                ]),
                _: 1 /* STABLE */
              }),
              ($setup.analysis)
                ? (_openBlock(), _createBlock(_component_v_uni_view, {
                    key: 0,
                    class: "card-box analysis-wrap"
                  }, {
                    default: _withCtx(() => [
                      _createVNode(_component_v_uni_view, { class: "score-card" }, {
                        default: _withCtx(() => [
                          _createVNode(_component_v_uni_view, {
                            class: "score-ring",
                            style: _normalizeStyle({ background: 'conic-gradient(' + $setup.scoreColor + ' ' + $setup.wardrobeScore + '%, #eef0f3 ' + $setup.wardrobeScore + '%)' })
                          }, {
                            default: _withCtx(() => [
                              _createVNode(_component_v_uni_view, { class: "score-hole" }, {
                                default: _withCtx(() => [
                                  _createVNode(_component_v_uni_text, { class: "score-num" }, {
                                    default: _withCtx(() => [
                                      _createTextVNode(_toDisplayString($setup.wardrobeScore), 1 /* TEXT */)
                                    ]),
                                    _: 1 /* STABLE */
                                  }),
                                  _createVNode(_component_v_uni_text, { class: "score-unit" }, {
                                    default: _withCtx(() => [
                                      _createTextVNode("分")
                                    ]),
                                    _: 1 /* STABLE */
                                  })
                                ]),
                                _: 1 /* STABLE */
                              })
                            ]),
                            _: 1 /* STABLE */
                          }, 8 /* PROPS */, ["style"]),
                          _createVNode(_component_v_uni_view, { class: "score-info" }, {
                            default: _withCtx(() => [
                              _createVNode(_component_v_uni_text, { class: "score-title" }, {
                                default: _withCtx(() => [
                                  _createTextVNode(_toDisplayString($setup.scoreText), 1 /* TEXT */)
                                ]),
                                _: 1 /* STABLE */
                              }),
                              _createVNode(_component_v_uni_text, { class: "score-sub" }, {
                                default: _withCtx(() => [
                                  _createTextVNode("衣橱健康度评分")
                                ]),
                                _: 1 /* STABLE */
                              }),
                              _createVNode(_component_v_uni_view, { class: "score-metrics" }, {
                                default: _withCtx(() => [
                                  _createVNode(_component_v_uni_view, { class: "sm" }, {
                                    default: _withCtx(() => [
                                      _createVNode(_component_v_uni_text, { class: "sm-num" }, {
                                        default: _withCtx(() => [
                                          _createTextVNode(_toDisplayString($setup.analysis.total_items), 1 /* TEXT */)
                                        ]),
                                        _: 1 /* STABLE */
                                      }),
                                      _createVNode(_component_v_uni_text, { class: "sm-lab" }, {
                                        default: _withCtx(() => [
                                          _createTextVNode("衣物")
                                        ]),
                                        _: 1 /* STABLE */
                                      })
                                    ]),
                                    _: 1 /* STABLE */
                                  }),
                                  _createVNode(_component_v_uni_view, { class: "sm" }, {
                                    default: _withCtx(() => [
                                      _createVNode(_component_v_uni_text, { class: "sm-num warn" }, {
                                        default: _withCtx(() => [
                                          _createTextVNode(_toDisplayString(($setup.analysis.unused_items||[]).length), 1 /* TEXT */)
                                        ]),
                                        _: 1 /* STABLE */
                                      }),
                                      _createVNode(_component_v_uni_text, { class: "sm-lab" }, {
                                        default: _withCtx(() => [
                                          _createTextVNode("闲置")
                                        ]),
                                        _: 1 /* STABLE */
                                      })
                                    ]),
                                    _: 1 /* STABLE */
                                  }),
                                  _createVNode(_component_v_uni_view, { class: "sm" }, {
                                    default: _withCtx(() => [
                                      _createVNode(_component_v_uni_text, { class: "sm-num danger" }, {
                                        default: _withCtx(() => [
                                          _createTextVNode(_toDisplayString(($setup.analysis.duplicate_warnings||[]).length), 1 /* TEXT */)
                                        ]),
                                        _: 1 /* STABLE */
                                      }),
                                      _createVNode(_component_v_uni_text, { class: "sm-lab" }, {
                                        default: _withCtx(() => [
                                          _createTextVNode("重复")
                                        ]),
                                        _: 1 /* STABLE */
                                      })
                                    ]),
                                    _: 1 /* STABLE */
                                  })
                                ]),
                                _: 1 /* STABLE */
                              })
                            ]),
                            _: 1 /* STABLE */
                          })
                        ]),
                        _: 1 /* STABLE */
                      }),
                      _createVNode(_component_v_uni_view, { class: "block" }, {
                        default: _withCtx(() => [
                          _createVNode(_component_v_uni_text, { class: "block-title" }, {
                            default: _withCtx(() => [
                              _createTextVNode("品类分布")
                            ]),
                            _: 1 /* STABLE */
                          }),
                          ($setup.categoryChart.items.length)
                            ? (_openBlock(), _createBlock(_component_v_uni_view, {
                                key: 0,
                                class: "donut-row"
                              }, {
                                default: _withCtx(() => [
                                  _createVNode(_component_v_uni_view, {
                                    class: "donut",
                                    style: _normalizeStyle({ background: $setup.categoryChart.gradient })
                                  }, {
                                    default: _withCtx(() => [
                                      _createVNode(_component_v_uni_view, { class: "donut-hole" }, {
                                        default: _withCtx(() => [
                                          _createVNode(_component_v_uni_text, { class: "donut-num" }, {
                                            default: _withCtx(() => [
                                              _createTextVNode(_toDisplayString($setup.categoryChart.total), 1 /* TEXT */)
                                            ]),
                                            _: 1 /* STABLE */
                                          }),
                                          _createVNode(_component_v_uni_text, { class: "donut-unit" }, {
                                            default: _withCtx(() => [
                                              _createTextVNode("件")
                                            ]),
                                            _: 1 /* STABLE */
                                          })
                                        ]),
                                        _: 1 /* STABLE */
                                      })
                                    ]),
                                    _: 1 /* STABLE */
                                  }, 8 /* PROPS */, ["style"]),
                                  _createVNode(_component_v_uni_view, { class: "legend" }, {
                                    default: _withCtx(() => [
                                      (_openBlock(true), _createElementBlock(_Fragment, null, _renderList($setup.categoryChart.items, (it) => {
                                        return (_openBlock(), _createBlock(_component_v_uni_view, {
                                          key: it.raw,
                                          class: "legend-item"
                                        }, {
                                          default: _withCtx(() => [
                                            _createVNode(_component_v_uni_view, {
                                              class: "legend-dot",
                                              style: _normalizeStyle({ background: it.color })
                                            }, null, 8 /* PROPS */, ["style"]),
                                            _createVNode(_component_v_uni_text, { class: "legend-name" }, {
                                              default: _withCtx(() => [
                                                _createTextVNode(_toDisplayString(it.name), 1 /* TEXT */)
                                              ]),
                                              _: 2 /* DYNAMIC */
                                            }, 1024 /* DYNAMIC_SLOTS */),
                                            _createVNode(_component_v_uni_text, { class: "legend-val" }, {
                                              default: _withCtx(() => [
                                                _createTextVNode(_toDisplayString(it.value) + " · " + _toDisplayString(it.pct) + "%", 1 /* TEXT */)
                                              ]),
                                              _: 2 /* DYNAMIC */
                                            }, 1024 /* DYNAMIC_SLOTS */)
                                          ]),
                                          _: 2 /* DYNAMIC */
                                        }, 1024 /* DYNAMIC_SLOTS */))
                                      }), 128 /* KEYED_FRAGMENT */))
                                    ]),
                                    _: 1 /* STABLE */
                                  })
                                ]),
                                _: 1 /* STABLE */
                              }))
                            : (_openBlock(), _createBlock(_component_v_uni_text, {
                                key: 1,
                                class: "empty-tip"
                              }, {
                                default: _withCtx(() => [
                                  _createTextVNode("暂无数据")
                                ]),
                                _: 1 /* STABLE */
                              }))
                        ]),
                        _: 1 /* STABLE */
                      }),
                      ($setup.seasonChart.length)
                        ? (_openBlock(), _createBlock(_component_v_uni_view, {
                            key: 0,
                            class: "block"
                          }, {
                            default: _withCtx(() => [
                              _createVNode(_component_v_uni_text, { class: "block-title" }, {
                                default: _withCtx(() => [
                                  _createTextVNode("季节分布")
                                ]),
                                _: 1 /* STABLE */
                              }),
                              _createVNode(_component_v_uni_view, { class: "stack-bar" }, {
                                default: _withCtx(() => [
                                  (_openBlock(true), _createElementBlock(_Fragment, null, _renderList($setup.seasonChart, (s) => {
                                    return (_openBlock(), _createBlock(_component_v_uni_view, {
                                      key: s.name,
                                      class: "stack-seg",
                                      style: _normalizeStyle({ width: s.pct + '%', background: s.color })
                                    }, null, 8 /* PROPS */, ["style"]))
                                  }), 128 /* KEYED_FRAGMENT */))
                                ]),
                                _: 1 /* STABLE */
                              }),
                              _createVNode(_component_v_uni_view, { class: "stack-legend" }, {
                                default: _withCtx(() => [
                                  (_openBlock(true), _createElementBlock(_Fragment, null, _renderList($setup.seasonChart, (s) => {
                                    return (_openBlock(), _createBlock(_component_v_uni_view, {
                                      key: s.name,
                                      class: "stack-leg"
                                    }, {
                                      default: _withCtx(() => [
                                        _createVNode(_component_v_uni_view, {
                                          class: "legend-dot",
                                          style: _normalizeStyle({ background: s.color })
                                        }, null, 8 /* PROPS */, ["style"]),
                                        _createVNode(_component_v_uni_text, { class: "stack-leg-t" }, {
                                          default: _withCtx(() => [
                                            _createTextVNode(_toDisplayString(s.name) + " · " + _toDisplayString(s.value), 1 /* TEXT */)
                                          ]),
                                          _: 2 /* DYNAMIC */
                                        }, 1024 /* DYNAMIC_SLOTS */)
                                      ]),
                                      _: 2 /* DYNAMIC */
                                    }, 1024 /* DYNAMIC_SLOTS */))
                                  }), 128 /* KEYED_FRAGMENT */))
                                ]),
                                _: 1 /* STABLE */
                              })
                            ]),
                            _: 1 /* STABLE */
                          }))
                        : _createCommentVNode("v-if", true),
                      ($setup.colorList.length)
                        ? (_openBlock(), _createBlock(_component_v_uni_view, {
                            key: 1,
                            class: "block"
                          }, {
                            default: _withCtx(() => [
                              _createVNode(_component_v_uni_text, { class: "block-title" }, {
                                default: _withCtx(() => [
                                  _createTextVNode("颜色分布")
                                ]),
                                _: 1 /* STABLE */
                              }),
                              _createVNode(_component_v_uni_view, { class: "color-wrap" }, {
                                default: _withCtx(() => [
                                  (_openBlock(true), _createElementBlock(_Fragment, null, _renderList($setup.colorList, (c) => {
                                    return (_openBlock(), _createBlock(_component_v_uni_view, {
                                      key: c.name,
                                      class: "color-chip"
                                    }, {
                                      default: _withCtx(() => [
                                        _createVNode(_component_v_uni_view, {
                                          class: "color-dot",
                                          style: _normalizeStyle({ background: c.hex, borderColor: c.hex === '#f5f5f5' ? '#e4e7ed' : c.hex })
                                        }, null, 8 /* PROPS */, ["style"]),
                                        _createVNode(_component_v_uni_text, { class: "color-name" }, {
                                          default: _withCtx(() => [
                                            _createTextVNode(_toDisplayString(c.name), 1 /* TEXT */)
                                          ]),
                                          _: 2 /* DYNAMIC */
                                        }, 1024 /* DYNAMIC_SLOTS */),
                                        _createVNode(_component_v_uni_text, { class: "color-cnt" }, {
                                          default: _withCtx(() => [
                                            _createTextVNode(_toDisplayString(c.value), 1 /* TEXT */)
                                          ]),
                                          _: 2 /* DYNAMIC */
                                        }, 1024 /* DYNAMIC_SLOTS */)
                                      ]),
                                      _: 2 /* DYNAMIC */
                                    }, 1024 /* DYNAMIC_SLOTS */))
                                  }), 128 /* KEYED_FRAGMENT */))
                                ]),
                                _: 1 /* STABLE */
                              })
                            ]),
                            _: 1 /* STABLE */
                          }))
                        : _createCommentVNode("v-if", true),
                      _createVNode(_component_v_uni_view, { class: "block" }, {
                        default: _withCtx(() => [
                          _createVNode(_component_v_uni_text, { class: "block-title" }, {
                            default: _withCtx(() => [
                              _createTextVNode("闲置提醒")
                            ]),
                            _: 1 /* STABLE */
                          }),
                          ($setup.analysis.unused_items&&$setup.analysis.unused_items.length)
                            ? (_openBlock(), _createBlock(_component_v_uni_view, {
                                key: 0,
                                class: "tag-list"
                              }, {
                                default: _withCtx(() => [
                                  (_openBlock(true), _createElementBlock(_Fragment, null, _renderList($setup.analysis.unused_items, (item) => {
                                    return (_openBlock(), _createBlock(_component_v_uni_text, {
                                      key: item.id,
                                      class: "tag warn"
                                    }, {
                                      default: _withCtx(() => [
                                        _createTextVNode(_toDisplayString(item.name) + "（超90天）", 1 /* TEXT */)
                                      ]),
                                      _: 2 /* DYNAMIC */
                                    }, 1024 /* DYNAMIC_SLOTS */))
                                  }), 128 /* KEYED_FRAGMENT */))
                                ]),
                                _: 1 /* STABLE */
                              }))
                            : (_openBlock(), _createBlock(_component_v_uni_text, {
                                key: 1,
                                class: "empty-tip"
                              }, {
                                default: _withCtx(() => [
                                  _createTextVNode("暂无闲置，保持得很好")
                                ]),
                                _: 1 /* STABLE */
                              }))
                        ]),
                        _: 1 /* STABLE */
                      }),
                      _createVNode(_component_v_uni_view, { class: "block" }, {
                        default: _withCtx(() => [
                          _createVNode(_component_v_uni_text, { class: "block-title" }, {
                            default: _withCtx(() => [
                              _createTextVNode("重复购买提醒")
                            ]),
                            _: 1 /* STABLE */
                          }),
                          ($setup.analysis.duplicate_warnings&&$setup.analysis.duplicate_warnings.length)
                            ? (_openBlock(), _createBlock(_component_v_uni_view, {
                                key: 0,
                                class: "tag-list"
                              }, {
                                default: _withCtx(() => [
                                  (_openBlock(true), _createElementBlock(_Fragment, null, _renderList($setup.analysis.duplicate_warnings, (d) => {
                                    return (_openBlock(), _createBlock(_component_v_uni_text, {
                                      key: d.name,
                                      class: "tag danger"
                                    }, {
                                      default: _withCtx(() => [
                                        _createTextVNode(_toDisplayString(d.name) + " × " + _toDisplayString(d.count), 1 /* TEXT */)
                                      ]),
                                      _: 2 /* DYNAMIC */
                                    }, 1024 /* DYNAMIC_SLOTS */))
                                  }), 128 /* KEYED_FRAGMENT */))
                                ]),
                                _: 1 /* STABLE */
                              }))
                            : (_openBlock(), _createBlock(_component_v_uni_text, {
                                key: 1,
                                class: "empty-tip"
                              }, {
                                default: _withCtx(() => [
                                  _createTextVNode("无重复购买")
                                ]),
                                _: 1 /* STABLE */
                              }))
                        ]),
                        _: 1 /* STABLE */
                      }),
                      ($setup.analysis.suggestions&&$setup.analysis.suggestions.length)
                        ? (_openBlock(), _createBlock(_component_v_uni_view, {
                            key: 2,
                            class: "block"
                          }, {
                            default: _withCtx(() => [
                              _createVNode(_component_v_uni_text, { class: "block-title" }, {
                                default: _withCtx(() => [
                                  _createTextVNode("智能建议")
                                ]),
                                _: 1 /* STABLE */
                              }),
                              _createVNode(_component_v_uni_view, { class: "sug-list" }, {
                                default: _withCtx(() => [
                                  (_openBlock(true), _createElementBlock(_Fragment, null, _renderList($setup.analysis.suggestions, (s, i) => {
                                    return (_openBlock(), _createBlock(_component_v_uni_view, {
                                      key: i,
                                      class: "sug-item"
                                    }, {
                                      default: _withCtx(() => [
                                        _createVNode(_component_v_uni_text, { class: "sug-bullet" }, {
                                          default: _withCtx(() => [
                                            _createTextVNode("✦")
                                          ]),
                                          _: 1 /* STABLE */
                                        }),
                                        _createVNode(_component_v_uni_text, { class: "sug-text" }, {
                                          default: _withCtx(() => [
                                            _createTextVNode(_toDisplayString(s), 1 /* TEXT */)
                                          ]),
                                          _: 2 /* DYNAMIC */
                                        }, 1024 /* DYNAMIC_SLOTS */)
                                      ]),
                                      _: 2 /* DYNAMIC */
                                    }, 1024 /* DYNAMIC_SLOTS */))
                                  }), 128 /* KEYED_FRAGMENT */))
                                ]),
                                _: 1 /* STABLE */
                              })
                            ]),
                            _: 1 /* STABLE */
                          }))
                        : _createCommentVNode("v-if", true)
                    ]),
                    _: 1 /* STABLE */
                  }))
                : _createCommentVNode("v-if", true)
            ]),
            _: 1 /* STABLE */
          }, 512 /* NEED_PATCH */), [
            [_vShow, $setup.currentView==='analysis']
          ]),
          _withDirectives(_createVNode(_component_v_uni_view, { class: "panel" }, {
            default: _withCtx(() => [
              _createVNode(_component_v_uni_view, { class: "panel-head" }, {
                default: _withCtx(() => [
                  _createVNode(_component_v_uni_text, { class: "panel-title" }, {
                    default: _withCtx(() => [
                      _createTextVNode("购物清单")
                    ]),
                    _: 1 /* STABLE */
                  })
                ]),
                _: 1 /* STABLE */
              }),
              ($setup.shoppingList&&$setup.shoppingList.suggestions&&$setup.shoppingList.suggestions.length)
                ? (_openBlock(), _createBlock(_component_v_uni_view, { key: 0 }, {
                    default: _withCtx(() => [
                      (_openBlock(true), _createElementBlock(_Fragment, null, _renderList($setup.shoppingList.suggestions, (s, i) => {
                        return (_openBlock(), _createBlock(_component_v_uni_view, {
                          key: i,
                          class: "card-box shop"
                        }, {
                          default: _withCtx(() => [
                            _createVNode(_component_v_uni_text, {
                              class: _normalizeClass(['tag', $setup.tagClass(s.category)])
                            }, {
                              default: _withCtx(() => [
                                _createTextVNode(_toDisplayString($setup.catMap[s.category]||s.category), 1 /* TEXT */)
                              ]),
                              _: 2 /* DYNAMIC */
                            }, 1032 /* PROPS, DYNAMIC_SLOTS */, ["class"]),
                            _createVNode(_component_v_uni_text, { class: "shop-reason" }, {
                              default: _withCtx(() => [
                                _createTextVNode(_toDisplayString(s.reason), 1 /* TEXT */)
                              ]),
                              _: 2 /* DYNAMIC */
                            }, 1024 /* DYNAMIC_SLOTS */)
                          ]),
                          _: 2 /* DYNAMIC */
                        }, 1024 /* DYNAMIC_SLOTS */))
                      }), 128 /* KEYED_FRAGMENT */))
                    ]),
                    _: 1 /* STABLE */
                  }))
                : (_openBlock(), _createBlock(_component_v_uni_view, {
                    key: 1,
                    class: "empty"
                  }, {
                    default: _withCtx(() => [
                      _createVNode(_component_v_uni_text, null, {
                        default: _withCtx(() => [
                          _createTextVNode("你的衣橱品类齐全，暂无购物建议！")
                        ]),
                        _: 1 /* STABLE */
                      })
                    ]),
                    _: 1 /* STABLE */
                  }))
            ]),
            _: 1 /* STABLE */
          }, 512 /* NEED_PATCH */), [
            [_vShow, $setup.currentView==='shopping']
          ]),
          _withDirectives(_createVNode(_component_v_uni_view, { class: "panel" }, {
            default: _withCtx(() => [
              _createVNode(_component_v_uni_view, { class: "panel-head" }, {
                default: _withCtx(() => [
                  _createVNode(_component_v_uni_text, { class: "panel-title" }, {
                    default: _withCtx(() => [
                      _createTextVNode("个人中心")
                    ]),
                    _: 1 /* STABLE */
                  })
                ]),
                _: 1 /* STABLE */
              }),
              _createVNode(_component_v_uni_view, { class: "me-card" }, {
                default: _withCtx(() => [
                  _createVNode(_component_v_uni_view, { class: "me-avatar" }, {
                    default: _withCtx(() => [
                      _createTextVNode(_toDisplayString($setup.profile.nickname ? $setup.profile.nickname[0] : '👤'), 1 /* TEXT */)
                    ]),
                    _: 1 /* STABLE */
                  }),
                  _createVNode(_component_v_uni_view, { class: "me-info" }, {
                    default: _withCtx(() => [
                      _createVNode(_component_v_uni_text, { class: "me-name" }, {
                        default: _withCtx(() => [
                          _createTextVNode(_toDisplayString($setup.profile.nickname || '穿搭用户'), 1 /* TEXT */)
                        ]),
                        _: 1 /* STABLE */
                      }),
                      _createVNode(_component_v_uni_text, { class: "me-sub" }, {
                        default: _withCtx(() => [
                          _createTextVNode(_toDisplayString($setup.profile.username ? '账号：' + $setup.profile.username : 'AI 穿搭助手用户'), 1 /* TEXT */)
                        ]),
                        _: 1 /* STABLE */
                      })
                    ]),
                    _: 1 /* STABLE */
                  })
                ]),
                _: 1 /* STABLE */
              }),
              _createVNode(_component_v_uni_view, { class: "me-list" }, {
                default: _withCtx(() => [
                  _createVNode(_component_v_uni_view, {
                    class: "me-row",
                    onClick: $setup.goWardrobe
                  }, {
                    default: _withCtx(() => [
                      _createVNode(_component_v_uni_text, { class: "me-row-l" }, {
                        default: _withCtx(() => [
                          _createTextVNode("我的衣橱")
                        ]),
                        _: 1 /* STABLE */
                      }),
                      _createVNode(_component_v_uni_text, { class: "me-arrow" }, {
                        default: _withCtx(() => [
                          _createTextVNode("›")
                        ]),
                        _: 1 /* STABLE */
                      })
                    ]),
                    _: 1 /* STABLE */
                  }),
                  _createVNode(_component_v_uni_view, {
                    class: "me-row",
                    onClick: _cache[7] || (_cache[7] = $event => ($setup.switchView('notify')))
                  }, {
                    default: _withCtx(() => [
                      _createVNode(_component_v_uni_text, { class: "me-row-l" }, {
                        default: _withCtx(() => [
                          _createTextVNode("通知中心")
                        ]),
                        _: 1 /* STABLE */
                      }),
                      ($setup.unreadCount>0)
                        ? (_openBlock(), _createBlock(_component_v_uni_text, {
                            key: 0,
                            class: "me-badge"
                          }, {
                            default: _withCtx(() => [
                              _createTextVNode(_toDisplayString($setup.unreadCount>99?'99+':$setup.unreadCount), 1 /* TEXT */)
                            ]),
                            _: 1 /* STABLE */
                          }))
                        : _createCommentVNode("v-if", true),
                      _createVNode(_component_v_uni_text, { class: "me-arrow" }, {
                        default: _withCtx(() => [
                          _createTextVNode("›")
                        ]),
                        _: 1 /* STABLE */
                      })
                    ]),
                    _: 1 /* STABLE */
                  })
                ]),
                _: 1 /* STABLE */
              }),
              _createVNode(_component_v_uni_view, {
                class: "me-logout",
                onClick: $setup.logout
              }, {
                default: _withCtx(() => [
                  _createTextVNode("退出登录")
                ]),
                _: 1 /* STABLE */
              })
            ]),
            _: 1 /* STABLE */
          }, 512 /* NEED_PATCH */), [
            [_vShow, $setup.currentView==='profile']
          ]),
          _withDirectives(_createVNode(_component_v_uni_view, { class: "panel" }, {
            default: _withCtx(() => [
              _createVNode(_component_v_uni_view, { class: "panel-head between" }, {
                default: _withCtx(() => [
                  _createVNode(_component_v_uni_text, { class: "panel-title" }, {
                    default: _withCtx(() => [
                      _createTextVNode("通知中心")
                    ]),
                    _: 1 /* STABLE */
                  }),
                  _createVNode(_component_v_uni_view, {
                    class: "mini-btn",
                    onClick: $setup.markAllRead
                  }, {
                    default: _withCtx(() => [
                      _createTextVNode("全部已读")
                    ]),
                    _: 1 /* STABLE */
                  })
                ]),
                _: 1 /* STABLE */
              }),
              ($setup.notifyLoading)
                ? (_openBlock(), _createBlock(_component_v_uni_view, {
                    key: 0,
                    class: "card-box"
                  }, {
                    default: _withCtx(() => [
                      _createVNode(_component_v_uni_text, { class: "loading-text" }, {
                        default: _withCtx(() => [
                          _createTextVNode("加载中…")
                        ]),
                        _: 1 /* STABLE */
                      })
                    ]),
                    _: 1 /* STABLE */
                  }))
                : _createCommentVNode("v-if", true),
              (_openBlock(true), _createElementBlock(_Fragment, null, _renderList($setup.notifications, (n) => {
                return (_openBlock(), _createBlock(_component_v_uni_view, {
                  key: n.id,
                  class: _normalizeClass(['noti', {unread: !n.is_read}]),
                  onClick: $event => ($setup.onNotiClick(n))
                }, {
                  default: _withCtx(() => [
                    _createVNode(_component_v_uni_view, { class: "noti-top" }, {
                      default: _withCtx(() => [
                        _createVNode(_component_v_uni_text, {
                          class: _normalizeClass(['noti-tag', 't-' + n.type])
                        }, {
                          default: _withCtx(() => [
                            _createTextVNode(_toDisplayString($setup.notiTypeLabel(n.type)), 1 /* TEXT */)
                          ]),
                          _: 2 /* DYNAMIC */
                        }, 1032 /* PROPS, DYNAMIC_SLOTS */, ["class"]),
                        _createVNode(_component_v_uni_text, { class: "noti-time" }, {
                          default: _withCtx(() => [
                            _createTextVNode(_toDisplayString(n.created_at), 1 /* TEXT */)
                          ]),
                          _: 2 /* DYNAMIC */
                        }, 1024 /* DYNAMIC_SLOTS */)
                      ]),
                      _: 2 /* DYNAMIC */
                    }, 1024 /* DYNAMIC_SLOTS */),
                    _createVNode(_component_v_uni_text, { class: "noti-title" }, {
                      default: _withCtx(() => [
                        _createTextVNode(_toDisplayString(n.title), 1 /* TEXT */)
                      ]),
                      _: 2 /* DYNAMIC */
                    }, 1024 /* DYNAMIC_SLOTS */),
                    _createVNode(_component_v_uni_text, { class: "noti-content" }, {
                      default: _withCtx(() => [
                        _createTextVNode(_toDisplayString(n.content), 1 /* TEXT */)
                      ]),
                      _: 2 /* DYNAMIC */
                    }, 1024 /* DYNAMIC_SLOTS */),
                    (n.image_url)
                      ? (_openBlock(), _createBlock(_component_v_uni_image, {
                          key: 0,
                          src: n.image_url,
                          mode: "widthFix",
                          class: "noti-img"
                        }, null, 8 /* PROPS */, ["src"]))
                      : _createCommentVNode("v-if", true)
                  ]),
                  _: 2 /* DYNAMIC */
                }, 1032 /* PROPS, DYNAMIC_SLOTS */, ["class", "onClick"]))
              }), 128 /* KEYED_FRAGMENT */)),
              (!$setup.notifyLoading && $setup.notifications.length===0)
                ? (_openBlock(), _createBlock(_component_v_uni_view, {
                    key: 1,
                    class: "empty"
                  }, {
                    default: _withCtx(() => [
                      _createVNode(_component_v_uni_text, null, {
                        default: _withCtx(() => [
                          _createTextVNode("暂无通知")
                        ]),
                        _: 1 /* STABLE */
                      })
                    ]),
                    _: 1 /* STABLE */
                  }))
                : _createCommentVNode("v-if", true)
            ]),
            _: 1 /* STABLE */
          }, 512 /* NEED_PATCH */), [
            [_vShow, $setup.currentView==='notify']
          ])
        ]),
        _: 1 /* STABLE */
      }),
      _withDirectives(_createVNode(_component_v_uni_view, { class: "drawer-wrap" }, {
        default: _withCtx(() => [
          _createVNode(_component_v_uni_view, {
            class: "drawer-mask",
            onClick: $setup.closeHistoryDrawer
          }),
          _createVNode(_component_v_uni_view, {
            class: _normalizeClass(['history-drawer', { open: $setup.drawerOpened }])
          }, {
            default: _withCtx(() => [
              _createVNode(_component_v_uni_view, { class: "drawer-head" }, {
                default: _withCtx(() => [
                  _createVNode(_component_v_uni_text, { class: "drawer-title" }, {
                    default: _withCtx(() => [
                      _createTextVNode("对话历史")
                    ]),
                    _: 1 /* STABLE */
                  }),
                  _createVNode(_component_v_uni_view, {
                    class: "drawer-new",
                    onClick: $setup.newChat
                  }, {
                    default: _withCtx(() => [
                      _createTextVNode("＋ 新建")
                    ]),
                    _: 1 /* STABLE */
                  })
                ]),
                _: 1 /* STABLE */
              }),
              _createVNode(_component_v_uni_scroll_view, {
                class: "drawer-list",
                "scroll-y": ""
              }, {
                default: _withCtx(() => [
                  (_openBlock(true), _createElementBlock(_Fragment, null, _renderList($setup.conversations, (conv) => {
                    return (_openBlock(), _createBlock(_component_v_uni_view, {
                      key: conv.id,
                      class: "drawer-item"
                    }, {
                      default: _withCtx(() => [
                        _createVNode(_component_v_uni_view, {
                          class: "di-main",
                          onClick: $event => ($setup.openHistoryChatById(conv.id))
                        }, {
                          default: _withCtx(() => [
                            _createVNode(_component_v_uni_text, { class: "di-q" }, {
                              default: _withCtx(() => [
                                _createTextVNode(_toDisplayString(conv.user_input), 1 /* TEXT */)
                              ]),
                              _: 2 /* DYNAMIC */
                            }, 1024 /* DYNAMIC_SLOTS */),
                            _createVNode(_component_v_uni_text, { class: "di-a" }, {
                              default: _withCtx(() => [
                                _createTextVNode(_toDisplayString((conv.agent_response || '').substring(0, 60)), 1 /* TEXT */)
                              ]),
                              _: 2 /* DYNAMIC */
                            }, 1024 /* DYNAMIC_SLOTS */),
                            _createVNode(_component_v_uni_text, { class: "di-time" }, {
                              default: _withCtx(() => [
                                _createTextVNode(_toDisplayString(conv.created_at), 1 /* TEXT */)
                              ]),
                              _: 2 /* DYNAMIC */
                            }, 1024 /* DYNAMIC_SLOTS */)
                          ]),
                          _: 2 /* DYNAMIC */
                        }, 1032 /* PROPS, DYNAMIC_SLOTS */, ["onClick"]),
                        _createVNode(_component_v_uni_view, {
                          class: "di-del",
                          onClick: _withModifiers($event => ($setup.deleteConversation(conv.id)), ["stop"])
                        }, {
                          default: _withCtx(() => [
                            _createTextVNode("🗑")
                          ]),
                          _: 2 /* DYNAMIC */
                        }, 1032 /* PROPS, DYNAMIC_SLOTS */, ["onClick"])
                      ]),
                      _: 2 /* DYNAMIC */
                    }, 1024 /* DYNAMIC_SLOTS */))
                  }), 128 /* KEYED_FRAGMENT */)),
                  ($setup.conversations.length === 0)
                    ? (_openBlock(), _createBlock(_component_v_uni_view, {
                        key: 0,
                        class: "drawer-empty"
                      }, {
                        default: _withCtx(() => [
                          _createVNode(_component_v_uni_text, null, {
                            default: _withCtx(() => [
                              _createTextVNode("暂无对话记录")
                            ]),
                            _: 1 /* STABLE */
                          })
                        ]),
                        _: 1 /* STABLE */
                      }))
                    : _createCommentVNode("v-if", true)
                ]),
                _: 1 /* STABLE */
              })
            ]),
            _: 1 /* STABLE */
          }, 8 /* PROPS */, ["class"])
        ]),
        _: 1 /* STABLE */
      }, 512 /* NEED_PATCH */), [
        [_vShow, $setup.showHistoryDrawer]
      ]),
      _createVNode(_component_v_uni_scroll_view, {
        class: "bottom-nav",
        "scroll-x": ""
      }, {
        default: _withCtx(() => [
          (_openBlock(), _createElementBlock(_Fragment, null, _renderList($setup.navItems, (item) => {
            return _createVNode(_component_v_uni_view, {
              key: item.key,
              class: _normalizeClass(['nav-item',{active: $setup.currentView===item.key}]),
              onClick: $event => ($setup.switchView(item.key))
            }, {
              default: _withCtx(() => [
                _createVNode(_component_v_uni_view, { class: "nav-ico-wrap" }, {
                  default: _withCtx(() => [
                    _createVNode(_component_v_uni_text, { class: "nav-icon" }, {
                      default: _withCtx(() => [
                        _createTextVNode(_toDisplayString(item.icon), 1 /* TEXT */)
                      ]),
                      _: 2 /* DYNAMIC */
                    }, 1024 /* DYNAMIC_SLOTS */),
                    (item.key==='notify' && $setup.unreadCount>0)
                      ? (_openBlock(), _createBlock(_component_v_uni_text, {
                          key: 0,
                          class: "badge"
                        }, {
                          default: _withCtx(() => [
                            _createTextVNode(_toDisplayString($setup.unreadCount>99?'99+':$setup.unreadCount), 1 /* TEXT */)
                          ]),
                          _: 1 /* STABLE */
                        }))
                      : _createCommentVNode("v-if", true)
                  ]),
                  _: 2 /* DYNAMIC */
                }, 1024 /* DYNAMIC_SLOTS */),
                _createVNode(_component_v_uni_text, { class: "nav-label" }, {
                  default: _withCtx(() => [
                    _createTextVNode(_toDisplayString(item.label), 1 /* TEXT */)
                  ]),
                  _: 2 /* DYNAMIC */
                }, 1024 /* DYNAMIC_SLOTS */)
              ]),
              _: 2 /* DYNAMIC */
            }, 1032 /* PROPS, DYNAMIC_SLOTS */, ["class", "onClick"])
          }), 64 /* STABLE_FRAGMENT */))
        ]),
        _: 1 /* STABLE */
      }),
      ($setup.showUpload)
        ? (_openBlock(), _createBlock(_component_v_uni_view, {
            key: 0,
            class: "mask",
            onClick: $setup.closeUpload
          }, {
            default: _withCtx(() => [
              _createVNode(_component_v_uni_view, {
                class: "wh-upload-dialog",
                onClick: _cache[12] || (_cache[12] = _withModifiers(() => {}, ["stop"]))
              }, {
                default: _withCtx(() => [
                  _createVNode(_component_v_uni_view, { class: "wh-dlg-head" }, {
                    default: _withCtx(() => [
                      _createVNode(_component_v_uni_text, {
                        class: "wh-dlg-back",
                        onClick: $setup.closeUpload
                      }, {
                        default: _withCtx(() => [
                          _createTextVNode("返回")
                        ]),
                        _: 1 /* STABLE */
                      }),
                      _createVNode(_component_v_uni_text, { class: "wh-dlg-title" }, {
                        default: _withCtx(() => [
                          _createTextVNode("记录新的衣服")
                        ]),
                        _: 1 /* STABLE */
                      }),
                      _createVNode(_component_v_uni_text)
                    ]),
                    _: 1 /* STABLE */
                  }),
                  _createVNode(_component_v_uni_view, {
                    class: "wh-dlg-up-area",
                    onClick: $setup.chooseWardrobeImage
                  }, {
                    default: _withCtx(() => [
                      _createVNode(_component_v_uni_text, { class: "wh-dlg-up-ico" }, {
                        default: _withCtx(() => [
                          _createTextVNode("📷")
                        ]),
                        _: 1 /* STABLE */
                      }),
                      _createVNode(_component_v_uni_text, { class: "wh-dlg-up-txt" }, {
                        default: _withCtx(() => [
                          _createTextVNode("上传 / 替换照片")
                        ]),
                        _: 1 /* STABLE */
                      })
                    ]),
                    _: 1 /* STABLE */
                  }),
                  _createVNode(_component_v_uni_view, {
                    class: "wh-dlg-batch",
                    onClick: $setup.chooseBatchImages
                  }, {
                    default: _withCtx(() => [
                      _createVNode(_component_v_uni_text, { class: "wh-dlg-batch-ico" }, {
                        default: _withCtx(() => [
                          _createTextVNode("🖼️")
                        ]),
                        _: 1 /* STABLE */
                      }),
                      _createVNode(_component_v_uni_text, { class: "wh-dlg-batch-txt" }, {
                        default: _withCtx(() => [
                          _createTextVNode("批量上传照片（上限10张）")
                        ]),
                        _: 1 /* STABLE */
                      })
                    ]),
                    _: 1 /* STABLE */
                  }),
                  ($setup.uploadPreview)
                    ? (_openBlock(), _createBlock(_component_v_uni_view, {
                        key: 0,
                        class: "wh-dlg-body"
                      }, {
                        default: _withCtx(() => [
                          _createVNode(_component_v_uni_view, { class: "wh-dlg-preview" }, {
                            default: _withCtx(() => [
                              _createVNode(_component_v_uni_image, {
                                src: $setup.uploadPreview,
                                mode: "aspectFit",
                                class: "wh-dlg-preview-img"
                              }, null, 8 /* PROPS */, ["src"]),
                              ($setup.uploadDetecting)
                                ? (_openBlock(), _createBlock(_component_v_uni_view, {
                                    key: 0,
                                    class: "wh-dlg-detect"
                                  }, {
                                    default: _withCtx(() => [
                                      _createVNode(_component_v_uni_text, null, {
                                        default: _withCtx(() => [
                                          _createTextVNode("AI 自动识别中...")
                                        ]),
                                        _: 1 /* STABLE */
                                      })
                                    ]),
                                    _: 1 /* STABLE */
                                  }))
                                : _createCommentVNode("v-if", true)
                            ]),
                            _: 1 /* STABLE */
                          }),
                          _createVNode(_component_v_uni_text, { class: "wh-dlg-preview-tip" }, {
                            default: _withCtx(() => [
                              _createTextVNode("修改时会保留原图片，重新上传可替换。")
                            ]),
                            _: 1 /* STABLE */
                          }),
                          ($setup.uploadPreview && !$setup.uploadDetecting)
                            ? (_openBlock(), _createBlock(_component_v_uni_view, {
                                key: 0,
                                class: "wh-dlg-form"
                              }, {
                                default: _withCtx(() => [
                                  _createVNode(_component_v_uni_view, { class: "wh-dlg-row" }, {
                                    default: _withCtx(() => [
                                      _createVNode(_component_v_uni_view, { class: "wh-dlg-field" }, {
                                        default: _withCtx(() => [
                                          _createVNode(_component_v_uni_text, { class: "wh-dlg-label" }, {
                                            default: _withCtx(() => [
                                              _createTextVNode("单品名称")
                                            ]),
                                            _: 1 /* STABLE */
                                          }),
                                          _createVNode(_component_v_uni_input, {
                                            class: "wh-dlg-input",
                                            value: $setup.uploadForm.name,
                                            placeholder: "例：白色宽松印花T恤",
                                            onInput: _cache[8] || (_cache[8] = e => $setup.onFormInput(e, 'name'))
                                          }, null, 8 /* PROPS */, ["value"])
                                        ]),
                                        _: 1 /* STABLE */
                                      }),
                                      _createVNode(_component_v_uni_view, { class: "wh-dlg-field" }, {
                                        default: _withCtx(() => [
                                          _createVNode(_component_v_uni_text, { class: "wh-dlg-label" }, {
                                            default: _withCtx(() => [
                                              _createTextVNode("品类")
                                            ]),
                                            _: 1 /* STABLE */
                                          }),
                                          _createVNode(_component_v_uni_picker, {
                                            class: "wh-dlg-picker",
                                            range: $setup.catLabels,
                                            onChange: $setup.onCatChange
                                          }, {
                                            default: _withCtx(() => [
                                              _createVNode(_component_v_uni_text, {
                                                class: _normalizeClass(['wh-dlg-pick-val', { placeholder: !$setup.uploadForm.category }])
                                              }, {
                                                default: _withCtx(() => [
                                                  _createTextVNode(_toDisplayString($setup.catMap[$setup.uploadForm.category] || '请选择'), 1 /* TEXT */)
                                                ]),
                                                _: 1 /* STABLE */
                                              }, 8 /* PROPS */, ["class"])
                                            ]),
                                            _: 1 /* STABLE */
                                          })
                                        ]),
                                        _: 1 /* STABLE */
                                      })
                                    ]),
                                    _: 1 /* STABLE */
                                  }),
                                  _createVNode(_component_v_uni_view, { class: "wh-dlg-row" }, {
                                    default: _withCtx(() => [
                                      _createVNode(_component_v_uni_view, { class: "wh-dlg-field" }, {
                                        default: _withCtx(() => [
                                          _createVNode(_component_v_uni_text, { class: "wh-dlg-label" }, {
                                            default: _withCtx(() => [
                                              _createTextVNode("颜色")
                                            ]),
                                            _: 1 /* STABLE */
                                          }),
                                          _createVNode(_component_v_uni_input, {
                                            class: "wh-dlg-input",
                                            value: $setup.uploadForm.color,
                                            placeholder: "例：白色",
                                            onInput: _cache[9] || (_cache[9] = e => $setup.onFormInput(e, 'color'))
                                          }, null, 8 /* PROPS */, ["value"])
                                        ]),
                                        _: 1 /* STABLE */
                                      }),
                                      _createVNode(_component_v_uni_view, { class: "wh-dlg-field" }, {
                                        default: _withCtx(() => [
                                          _createVNode(_component_v_uni_text, { class: "wh-dlg-label" }, {
                                            default: _withCtx(() => [
                                              _createTextVNode("风格")
                                            ]),
                                            _: 1 /* STABLE */
                                          }),
                                          _createVNode(_component_v_uni_input, {
                                            class: "wh-dlg-input",
                                            value: $setup.uploadForm.style,
                                            placeholder: "例：简约",
                                            onInput: _cache[10] || (_cache[10] = e => $setup.onFormInput(e, 'style'))
                                          }, null, 8 /* PROPS */, ["value"])
                                        ]),
                                        _: 1 /* STABLE */
                                      })
                                    ]),
                                    _: 1 /* STABLE */
                                  }),
                                  _createVNode(_component_v_uni_view, { class: "wh-dlg-row" }, {
                                    default: _withCtx(() => [
                                      _createVNode(_component_v_uni_view, { class: "wh-dlg-field" }, {
                                        default: _withCtx(() => [
                                          _createVNode(_component_v_uni_text, { class: "wh-dgl-label" }, {
                                            default: _withCtx(() => [
                                              _createTextVNode("版型")
                                            ]),
                                            _: 1 /* STABLE */
                                          }),
                                          _createVNode(_component_v_uni_input, {
                                            class: "wh-dlg-input",
                                            value: $setup.uploadForm.season,
                                            placeholder: "例：四季",
                                            onInput: _cache[11] || (_cache[11] = e => $setup.onFormInput(e, 'season'))
                                          }, null, 8 /* PROPS */, ["value"])
                                        ]),
                                        _: 1 /* STABLE */
                                      }),
                                      _createVNode(_component_v_uni_view, { class: "wh-dlg-field" }, {
                                        default: _withCtx(() => [
                                          _createVNode(_component_v_uni_text, { class: "wh-dlg-label" }, {
                                            default: _withCtx(() => [
                                              _createTextVNode("季节")
                                            ]),
                                            _: 1 /* STABLE */
                                          }),
                                          _createVNode(_component_v_uni_picker, {
                                            class: "wh-dlg-picker",
                                            mode: "date",
                                            value: $setup.purchaseDate,
                                            onChange: $setup.onPurchaseDateChange
                                          }, {
                                            default: _withCtx(() => [
                                              _createVNode(_component_v_uni_text, {
                                                class: _normalizeClass(['wh-dlg-pick-val', { placeholder: !$setup.purchaseDate }])
                                              }, {
                                                default: _withCtx(() => [
                                                  _createTextVNode(_toDisplayString($setup.purchaseDate || '购入日期'), 1 /* TEXT */)
                                                ]),
                                                _: 1 /* STABLE */
                                              }, 8 /* PROPS */, ["class"])
                                            ]),
                                            _: 1 /* STABLE */
                                          }, 8 /* PROPS */, ["value"])
                                        ]),
                                        _: 1 /* STABLE */
                                      })
                                    ]),
                                    _: 1 /* STABLE */
                                  })
                                ]),
                                _: 1 /* STABLE */
                              }))
                            : _createCommentVNode("v-if", true),
                          _createVNode(_component_v_uni_view, { class: "wh-dlg-foot" }, {
                            default: _withCtx(() => [
                              _createVNode(_component_v_uni_view, {
                                class: "wh-dlg-btn cancel",
                                onClick: $setup.closeUpload
                              }, {
                                default: _withCtx(() => [
                                  _createTextVNode("取消")
                                ]),
                                _: 1 /* STABLE */
                              }),
                              _createVNode(_component_v_uni_view, {
                                class: _normalizeClass(["wh-dlg-btn save", { disabled: !$setup.uploadPreview }]),
                                onClick: $setup.confirmUpload
                              }, {
                                default: _withCtx(() => [
                                  _createTextVNode("保存这件衣服")
                                ]),
                                _: 1 /* STABLE */
                              }, 8 /* PROPS */, ["class"])
                            ]),
                            _: 1 /* STABLE */
                          })
                        ]),
                        _: 1 /* STABLE */
                      }))
                    : _createCommentVNode("v-if", true)
                ]),
                _: 1 /* STABLE */
              })
            ]),
            _: 1 /* STABLE */
          }))
        : _createCommentVNode("v-if", true)
    ]),
    _: 1 /* STABLE */
  }))
}

import "/src/pages/user/index.vue?vue&type=style&index=0&scoped=642c545b&lang.css"

_sfc_main.__hmrId = "642c545b"
typeof __VUE_HMR_RUNTIME__ !== 'undefined' && __VUE_HMR_RUNTIME__.createRecord(_sfc_main.__hmrId, _sfc_main)
import.meta.hot.on('file-changed', ({ file }) => {
  __VUE_HMR_RUNTIME__.CHANGED_FILE = file
})
import.meta.hot.accept(mod => {
  if (!mod) return
  const { default: updated, _rerender_only } = mod
  if (_rerender_only) {
    __VUE_HMR_RUNTIME__.rerender(updated.__hmrId, updated.render)
  } else {
    __VUE_HMR_RUNTIME__.reload(updated.__hmrId, updated)
  }
})
import _export_sfc from "/@id/__x00__plugin-vue:export-helper"
export default /*#__PURE__*/_export_sfc(_sfc_main, [['render',_sfc_render],['__scopeId',"data-v-642c545b"],['__file',"E:/ai-wardrobe-agent/frontend/src/pages/user/index.vue"]])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sInNvdXJjZXMiOlsiRTovYWktd2FyZHJvYmUtYWdlbnQvZnJvbnRlbmQvc3JjL3BhZ2VzL3VzZXIvaW5kZXgudnVlIl0sInNvdXJjZXNDb250ZW50IjpbIjx0ZW1wbGF0ZT5cclxuICA8dmlldyBjbGFzcz1cInBhZ2VcIj5cclxuICAgIDwhLS0g6Ieq5a6a5LmJ6aG26YOo5qCP77ya5qCH6aKYICsg5YWo5bGA6YCa55+l6ZOD6ZObIC0tPlxyXG4gICAgPHZpZXcgY2xhc3M9XCJ0b3BiYXJcIj5cclxuICAgICAgPHRleHQgY2xhc3M9XCJ0Yi10aXRsZVwiPkFJIOepv+aQreWKqeaJizwvdGV4dD5cclxuICAgICAgPHZpZXcgY2xhc3M9XCJ0Yi1yaWdodFwiPlxyXG4gICAgICAgIDx2aWV3IGNsYXNzPVwibm90aWZ5LWJlbGxcIiBAY2xpY2s9XCJzd2l0Y2hWaWV3KCdub3RpZnknKVwiPlxyXG4gICAgICAgICAgPHRleHQgY2xhc3M9XCJiZWxsLWljb1wiPvCflJQ8L3RleHQ+XHJcbiAgICAgICAgICA8dGV4dCB2LWlmPVwidW5yZWFkQ291bnQ+MFwiIGNsYXNzPVwiYmVsbC1iYWRnZVwiPnt7IHVucmVhZENvdW50Pjk5Pyc5OSsnOnVucmVhZENvdW50IH19PC90ZXh0PlxyXG4gICAgICAgIDwvdmlldz5cclxuICAgICAgPC92aWV3PlxyXG4gICAgPC92aWV3PlxyXG5cclxuICAgIDwhLS0g5Li75L2T5YaF5a65IC0tPlxyXG4gICAgPHNjcm9sbC12aWV3IGNsYXNzPVwibWFpblwiIHNjcm9sbC15PlxyXG4gICAgICA8IS0tID09PT09IDEuIOmmlumhtSA9PT09PSAtLT5cclxuICAgICAgPHZpZXcgdi1zaG93PVwiY3VycmVudFZpZXc9PT0ndG9kYXknXCIgY2xhc3M9XCJwYW5lbFwiPlxyXG4gICAgICAgIDwhLS0g5aSp5rCU5Y2h54mH77yI5a6a5L2N5ZCO5pi+56S677yJIC0tPlxyXG4gICAgICAgIDx2aWV3IGNsYXNzPVwid2VhdGhlci1jYXJkXCI+XHJcbiAgICAgICAgICA8dmlldyBjbGFzcz1cInd4LXdlYXRoZXJcIj5cclxuICAgICAgICAgICAgPHRleHQgY2xhc3M9XCJ3eC10ZW1wXCI+e3sgdGVtcERpc3BsYXkgfX08L3RleHQ+XHJcbiAgICAgICAgICAgIDx0ZXh0IGNsYXNzPVwid3gtZGVzY1wiPnt7IHdlYXRoZXIuZGVzY3JpcHRpb24gfX08L3RleHQ+XHJcbiAgICAgICAgICA8L3ZpZXc+XHJcbiAgICAgICAgICA8dmlldyBjbGFzcz1cInd4LW1ldGFcIj5cclxuICAgICAgICAgICAgPHRleHQgY2xhc3M9XCJ3eC1jaXR5XCI+8J+TjSB7eyB3ZWF0aGVyLmNpdHkgfX17eyB3ZWF0aGVyLmxvY2F0ZWQgPyAnJyA6ICfvvIjpu5jorqTvvIknIH19PC90ZXh0PlxyXG4gICAgICAgICAgICA8dGV4dCB2LWlmPVwid2VhdGhlci53aW5kc3BlZWQgIT09ICctLSdcIiBjbGFzcz1cInd4LXdpbmRcIj7wn5KoIHt7IHdlYXRoZXIud2luZHNwZWVkIH19IGttL2g8L3RleHQ+XHJcbiAgICAgICAgICA8L3ZpZXc+XHJcbiAgICAgICAgPC92aWV3PlxyXG5cclxuICAgICAgICA8IS0tIOS7iuaXpeepv+aQre+8muaMieWkqeawlOS7juiho+apseebtOaOpeaMkeS4gOWllyAtLT5cclxuICAgICAgICA8dmlldyBjbGFzcz1cInBhbmVsLWhlYWQgYmV0d2VlblwiPlxyXG4gICAgICAgICAgPHRleHQgY2xhc3M9XCJwYW5lbC10aXRsZVwiPuS7iuaXpeepv+aQrTwvdGV4dD5cclxuICAgICAgICAgIDx2aWV3IGNsYXNzPVwibWluaS1idG5cIiBAY2xpY2s9XCJsb2FkSG9tZU91dGZpdCh0cnVlKVwiPuaNouS4gOWllzwvdmlldz5cclxuICAgICAgICA8L3ZpZXc+XHJcbiAgICAgICAgPHZpZXcgdi1pZj1cImhvbWVMb2FkaW5nXCIgY2xhc3M9XCJjYXJkLWJveFwiPjx0ZXh0IGNsYXNzPVwibG9hZGluZy10ZXh0XCI+5q2j5Zyo5Li65L2g5pCt6YWN4oCmPC90ZXh0Pjwvdmlldz5cclxuICAgICAgICA8dmlldyB2LWVsc2UtaWY9XCJob21lT3V0Zml0XCIgY2xhc3M9XCJjYXJkLWJveFwiPlxyXG4gICAgICAgICAgPHRleHQgY2xhc3M9XCJwcmVcIj57eyBob21lT3V0Zml0LnRleHQgfX08L3RleHQ+XHJcbiAgICAgICAgICA8aW1hZ2Ugdi1pZj1cImhvbWVPdXRmaXQuaW1hZ2VfdXJsXCIgOnNyYz1cImhvbWVPdXRmaXQuaW1hZ2VfdXJsXCIgbW9kZT1cIndpZHRoRml4XCIgY2xhc3M9XCJvdXRmaXQtaW1nXCIgLz5cclxuICAgICAgICA8L3ZpZXc+XHJcbiAgICAgICAgPHZpZXcgdi1lbHNlIGNsYXNzPVwiY2FyZC1ib3hcIj48dGV4dCBjbGFzcz1cInByZVwiPuiho+apsei/mOayoeacieiho+eJqe+8jOWOu+OAjOiho+apseOAjea3u+WKoOWQp++9njwvdGV4dD48L3ZpZXc+XHJcblxyXG4gICAgICAgIDwhLS0g5bel5L2c5Y+w77ya5pCt6YWN5Lik56eN5YWl5Y+jICsg5b+r5o235Yqf6IO9IC0tPlxyXG4gICAgICAgIDx2aWV3IGNsYXNzPVwicGFuZWwtaGVhZFwiIHN0eWxlPVwibWFyZ2luLXRvcDozMnJweFwiPjx0ZXh0IGNsYXNzPVwicGFuZWwtdGl0bGVcIj7lt6XkvZzlj7A8L3RleHQ+PC92aWV3PlxyXG5cclxuICAgICAgICA8IS0tIOaQremFje+8mkFJIOW4ruS9oOaQrSAvIOiHquW3seaQreiuqSBBSSDlrqEgLS0+XHJcbiAgICAgICAgPHZpZXcgY2xhc3M9XCJjaG9pY2UtY2FyZCBhaVwiIEBjbGljaz1cImFpSGVscE91dGZpdFwiPlxyXG4gICAgICAgICAgPHRleHQgY2xhc3M9XCJjaG9pY2UtaWNvXCI+8J+kljwvdGV4dD5cclxuICAgICAgICAgIDx2aWV3IGNsYXNzPVwiY2hvaWNlLWJvZHlcIj5cclxuICAgICAgICAgICAgPHRleHQgY2xhc3M9XCJjaG9pY2UtdFwiPuiuqSBBSSDluK7miJHmkK3phY08L3RleHQ+XHJcbiAgICAgICAgICAgIDx0ZXh0IGNsYXNzPVwiY2hvaWNlLWRcIj7miorpnIDmsYLlkYror4kgQUnvvIznlLHlroPmjInlpKnmsJQgLyDlnLrlkIggLyDooaPmqbHnu5nkvaDlh7rmlrnmoYg8L3RleHQ+XHJcbiAgICAgICAgICA8L3ZpZXc+XHJcbiAgICAgICAgICA8dGV4dCBjbGFzcz1cImNob2ljZS1hcnJvd1wiPuWOu+WvueivnSDigLo8L3RleHQ+XHJcbiAgICAgICAgPC92aWV3PlxyXG4gICAgICAgIDx2aWV3IGNsYXNzPVwiY2hvaWNlLWNhcmQgc2VsZlwiIEBjbGljaz1cInN0YXJ0U2VsZk91dGZpdFwiPlxyXG4gICAgICAgICAgPHRleHQgY2xhc3M9XCJjaG9pY2UtaWNvXCI+4pyLPC90ZXh0PlxyXG4gICAgICAgICAgPHZpZXcgY2xhc3M9XCJjaG9pY2UtYm9keVwiPlxyXG4gICAgICAgICAgICA8dGV4dCBjbGFzcz1cImNob2ljZS10XCI+6Ieq5bex5pCt6YWNICsgQUkg5a6h5qC4PC90ZXh0PlxyXG4gICAgICAgICAgICA8dGV4dCBjbGFzcz1cImNob2ljZS1kXCI+5LuO6KGj5qmx6Ieq6YCJ5Yeg5Lu277yM6K6pIEFJIOWIpOaWrei/meWll+aQreW+l+WQiOS4jeWQiOmAgjwvdGV4dD5cclxuICAgICAgICAgIDwvdmlldz5cclxuICAgICAgICAgIDx0ZXh0IGNsYXNzPVwiY2hvaWNlLWFycm93XCI+5byA5aeLIOKAujwvdGV4dD5cclxuICAgICAgICA8L3ZpZXc+XHJcblxyXG4gICAgICAgIDwhLS0g5b+r5o235YWl5Y+jIC0tPlxyXG4gICAgICAgIDx2aWV3IGNsYXNzPVwicXVpY2stcm93XCI+XHJcbiAgICAgICAgICA8dmlldyBjbGFzcz1cInF1aWNrLXRpbGVcIiBAY2xpY2s9XCJzd2l0Y2hWaWV3KCd3YXJkcm9iZScpXCI+PHRleHQgY2xhc3M9XCJxdC1pY29cIj7wn5GUPC90ZXh0Pjx0ZXh0IGNsYXNzPVwicXQtbGFiZWxcIj7ooaPmqbE8L3RleHQ+PC92aWV3PlxyXG4gICAgICAgICAgPHZpZXcgY2xhc3M9XCJxdWljay10aWxlXCIgQGNsaWNrPVwic3dpdGNoVmlldygnYW5hbHlzaXMnKVwiPjx0ZXh0IGNsYXNzPVwicXQtaWNvXCI+8J+TijwvdGV4dD48dGV4dCBjbGFzcz1cInF0LWxhYmVsXCI+5YiG5p6QPC90ZXh0Pjwvdmlldz5cclxuICAgICAgICAgIDx2aWV3IGNsYXNzPVwicXVpY2stdGlsZVwiIEBjbGljaz1cInN3aXRjaFZpZXcoJ25vdGlmeScpXCI+XHJcbiAgICAgICAgICAgIDx0ZXh0IGNsYXNzPVwicXQtaWNvXCI+8J+UlDwvdGV4dD48dGV4dCBjbGFzcz1cInF0LWxhYmVsXCI+6YCa55+lPC90ZXh0PlxyXG4gICAgICAgICAgICA8dGV4dCB2LWlmPVwidW5yZWFkQ291bnQ+MFwiIGNsYXNzPVwicXQtYmFkZ2VcIj57eyB1bnJlYWRDb3VudD45OT8nOTkrJzp1bnJlYWRDb3VudCB9fTwvdGV4dD5cclxuICAgICAgICAgIDwvdmlldz5cclxuICAgICAgICAgIDx2aWV3IGNsYXNzPVwicXVpY2stdGlsZVwiIEBjbGljaz1cInN3aXRjaFZpZXcoJ3Byb2ZpbGUnKVwiPjx0ZXh0IGNsYXNzPVwicXQtaWNvXCI+8J+RpDwvdGV4dD48dGV4dCBjbGFzcz1cInF0LWxhYmVsXCI+5oiR55qEPC90ZXh0Pjwvdmlldz5cclxuICAgICAgICA8L3ZpZXc+XHJcbiAgICAgIDwvdmlldz5cclxuXHJcbiAgICAgIDwhLS0gPT09PT0gMi4gQUnlr7nor50gPT09PT0gLS0+XHJcbiAgICAgIDx2aWV3IHYtc2hvdz1cImN1cnJlbnRWaWV3PT09J2NoYXQnXCIgY2xhc3M9XCJwYW5lbFwiPlxyXG4gICAgICAgIDx2aWV3IGNsYXNzPVwicGFuZWwtaGVhZCBiZXR3ZWVuXCI+XHJcbiAgICAgICAgICA8dmlldyBjbGFzcz1cImhlYWQtbGVmdFwiPlxyXG4gICAgICAgICAgICA8dGV4dCBjbGFzcz1cIm1lbnUtYnRuXCIgQGNsaWNrPVwib3Blbkhpc3RvcnlEcmF3ZXJcIj7imLA8L3RleHQ+XHJcbiAgICAgICAgICAgIDx0ZXh0IGNsYXNzPVwicGFuZWwtdGl0bGVcIj5BSSDnqb/mkK3lr7nor508L3RleHQ+XHJcbiAgICAgICAgICA8L3ZpZXc+XHJcbiAgICAgICAgICA8dmlldyBjbGFzcz1cIm1pbmktYnRuXCIgQGNsaWNrPVwiZ29XYXJkcm9iZVwiPuafpeeci+iho+apsTwvdmlldz5cclxuICAgICAgICA8L3ZpZXc+XHJcbiAgICAgICAgPHZpZXcgY2xhc3M9XCJjaGF0LWJveFwiPlxyXG4gICAgICAgICAgPHZpZXcgdi1mb3I9XCIobSxpKSBpbiBtZXNzYWdlc1wiIDprZXk9XCJpXCIgOmNsYXNzPVwiWydtc2cnLCdtc2ctJyttLnJvbGVdXCI+XHJcbiAgICAgICAgICAgIDxpbWFnZSB2LWlmPVwibS5pbWFnZVwiIDpzcmM9XCJtLmltYWdlXCIgbW9kZT1cIndpZHRoRml4XCIgY2xhc3M9XCJjaGF0LWltZ1wiIC8+XHJcbiAgICAgICAgICAgIDx2aWV3IGNsYXNzPVwiYnViYmxlXCI+XHJcbiAgICAgICAgICAgICAgPHRleHQgY2xhc3M9XCJtc2ctbGFiZWxcIj57eyBtLnJvbGU9PT0ndXNlcic/J+S9oCc6J0FJ5pCt6YWN5biIJyB9fTwvdGV4dD5cclxuICAgICAgICAgICAgICA8dGV4dCBjbGFzcz1cIm1zZy10ZXh0XCI+e3sgbS5jb250ZW50IH19PC90ZXh0PlxyXG4gICAgICAgICAgICA8L3ZpZXc+XHJcbiAgICAgICAgICAgIDx2aWV3IHYtaWY9XCJtLnJvbGU9PT0nYWdlbnQnJiZtLmNpZFwiIGNsYXNzPVwicmF0ZS1yb3dcIj5cclxuICAgICAgICAgICAgICA8dGV4dCB2LWZvcj1cIm4gaW4gNVwiIDprZXk9XCJuXCIgOmNsYXNzPVwiWydzdGFyJyx7YWN0aXZlOm48PW0ucmF0aW5nfV1cIiBAY2xpY2s9XCJyYXRlQnlJbmRleChpLG4pXCI+4piFPC90ZXh0PlxyXG4gICAgICAgICAgICA8L3ZpZXc+XHJcbiAgICAgICAgICA8L3ZpZXc+XHJcbiAgICAgICAgICA8dmlldyB2LWlmPVwiY2hhdExvYWRpbmdcIiBjbGFzcz1cIm1zZyBtc2ctYWdlbnRcIj5cclxuICAgICAgICAgICAgPHZpZXcgY2xhc3M9XCJidWJibGVcIj48dGV4dCBjbGFzcz1cImxvYWRpbmctdGV4dFwiPkFJ5pCt6YWN5biI5q2j5Zyo5oCd6ICDLi4uPC90ZXh0Pjwvdmlldz5cclxuICAgICAgICAgIDwvdmlldz5cclxuICAgICAgICA8L3ZpZXc+XHJcbiAgICAgICAgPHZpZXcgY2xhc3M9XCJjaGF0LWlucHV0XCI+XHJcbiAgICAgICAgICA8dmlldyBjbGFzcz1cImljb24tYnRuXCIgQGNsaWNrPVwiY2hhdENob29zZUltYWdlXCI+8J+Ttzwvdmlldz5cclxuICAgICAgICAgIDxpbnB1dCBjbGFzcz1cImNoYXQtZmllbGRcIiA6dmFsdWU9XCJjaGF0SW5wdXRcIiBwbGFjZWhvbGRlcj1cIuaPj+i/sOS9oOeahOmcgOaxgu+8jOavlOWmgu+8muaYjuWkqeW8gOS8mu+8jOW4ruaIkeaOqOiNkC4uLlwiXHJcbiAgICAgICAgICAgICAgICAgQGlucHV0PVwib25DaGF0SW5wdXRcIiBAY29uZmlybT1cIm9uQ2hhdENvbmZpcm1cIiAvPlxyXG4gICAgICAgICAgPHZpZXcgY2xhc3M9XCJzZW5kLWJ0blwiIEBjbGljaz1cIm9uQ2hhdFNlbmRcIj7lj5HpgIE8L3ZpZXc+XHJcbiAgICAgICAgPC92aWV3PlxyXG4gICAgICA8L3ZpZXc+XHJcblxyXG4gICAgICA8IS0tID09PT09IDMuIOiho+apseeuoeeQhu+8iERQU1RBUiDpo47moLzvvIk9PT09PSAtLT5cclxuICAgICAgPHZpZXcgdi1zaG93PVwiY3VycmVudFZpZXc9PT0nd2FyZHJvYmUnXCIgY2xhc3M9XCJwYW5lbCB3aC1wYWdlXCI+XHJcblxyXG4gICAgICAgIDwhLS0g6aG26YOo5qiq5bmF77ya5pWw5a2X6KGj5p+cIC0tPlxyXG4gICAgICAgIDx2aWV3IGNsYXNzPVwid2gtYmFubmVyXCI+XHJcbiAgICAgICAgICA8dmlldyBjbGFzcz1cIndoLWJhbm5lci1iZ1wiPlxyXG4gICAgICAgICAgICA8aW1hZ2Ugdi1pZj1cImhvbWVPdXRmaXQ/LmltYWdlX3VybFwiIDpzcmM9XCJob21lT3V0Zml0LmltYWdlX3VybFwiIG1vZGU9XCJhc3BlY3RGaWxsXCIgY2xhc3M9XCJ3aC1iYW5uZXItaW1nXCIgLz5cclxuICAgICAgICAgIDwvdmlldz5cclxuICAgICAgICAgIDx2aWV3IGNsYXNzPVwid2gtYmFubmVyLWluZm9cIj5cclxuICAgICAgICAgICAgPHRleHQgY2xhc3M9XCJ3aC1iYW5uZXItdGl0bGVcIj7mlbDlrZfooaPmn5wgfCBBSeiho+afnDwvdGV4dD5cclxuICAgICAgICAgICAgPHRleHQgY2xhc3M9XCJ3aC1iYW5uZXItc3RhdHNcIj7lj6/lrZggNTAwIOS7tuOAgHzjgIDlt7LlrZgge3sgd2FyZHJvYmUubGVuZ3RoIH19IOS7tuOAgHzjgIB7eyBwcm9maWxlLm5pY2tuYW1lIHx8ICfnlKjmiLcnIH19PC90ZXh0PlxyXG4gICAgICAgICAgPC92aWV3PlxyXG4gICAgICAgIDwvdmlldz5cclxuXHJcbiAgICAgICAgPCEtLSDlvZXlhaXlhaXlj6MgLS0+XHJcbiAgICAgICAgPHZpZXcgY2xhc3M9XCJ3aC11cGxvYWQtZW50cnlcIiBAY2xpY2s9XCJvcGVuVXBsb2FkXCI+XHJcbiAgICAgICAgICA8dGV4dCBjbGFzcz1cIndoLXVwLWljb1wiPvCfk7c8L3RleHQ+XHJcbiAgICAgICAgICA8dGV4dCBjbGFzcz1cIndoLXVwLXRleHRcIj7lvZXlhaXmlrDnmoTooaPmnI3vvIhBSeiHquWKqOivhuWIq+WbvueJh+Whq+i1hOaWme+8iTwvdGV4dD5cclxuICAgICAgICA8L3ZpZXc+XHJcblxyXG4gICAgICAgIDwhLS0g5ZOB57G7562b6YCJ5qCH562+5qCP77yI5bim6K6h5pWw77yJIC0tPlxyXG4gICAgICAgIDx2aWV3IGNsYXNzPVwid2gtZmlsdGVyLXJvd1wiPlxyXG4gICAgICAgICAgPHRleHQgY2xhc3M9XCJ3aC1maWx0ZXItbGFiZWxcIj7lsZXnpLrmlrnlvI88L3RleHQ+XHJcbiAgICAgICAgICA8c2Nyb2xsLXZpZXcgY2xhc3M9XCJ3aC1jYXQtdGFic1wiIHNjcm9sbC14IDpzaG93LXNjcm9sbGJhcj1cImZhbHNlXCI+XHJcbiAgICAgICAgICAgIDx2aWV3IHYtZm9yPVwiYyBpbiBjYXRMaXN0V2l0aENvdW50XCIgOmtleT1cImMua1wiXHJcbiAgICAgICAgICAgICAgICAgIDpjbGFzcz1cIlsnd2gtY2F0LXRhYicsIHsgYWN0aXZlOiB3YXJkcm9iZUZpbHRlciA9PT0gYy5rIH1dXCJcclxuICAgICAgICAgICAgICAgICAgQGNsaWNrPVwic2V0RmlsdGVyKGMuaylcIj5cclxuICAgICAgICAgICAgICA8dGV4dD57eyBjLmwgfX08dGV4dCB2LWlmPVwiYy5uXCIgY2xhc3M9XCJ3aC1jYXQtblwiPiB7eyBjLm4gfX08L3RleHQ+PC90ZXh0PlxyXG4gICAgICAgICAgICA8L3ZpZXc+XHJcbiAgICAgICAgICA8L3Njcm9sbC12aWV3PlxyXG4gICAgICAgIDwvdmlldz5cclxuXHJcbiAgICAgICAgPCEtLSDooaPnianljaHniYfnvZHmoLwgLS0+XHJcbiAgICAgICAgPHZpZXcgY2xhc3M9XCJ3aC1ncmlkXCI+XHJcbiAgICAgICAgICA8dmlldyB2LWZvcj1cIml0ZW0gaW4gZmlsdGVyZWRXYXJkcm9iZVwiIDprZXk9XCJpdGVtLmlkXCIgY2xhc3M9XCJ3aC1jYXJkXCIgQGxvbmdwcmVzcz1cInNob3dDYXJkTWVudShpdGVtKVwiPlxyXG4gICAgICAgICAgICA8dmlldyBjbGFzcz1cIndoLWNhcmQtaW1nLXdyYXBcIj5cclxuICAgICAgICAgICAgICA8aW1hZ2Ugdi1pZj1cIml0ZW0uaW1hZ2VfdXJsXCIgOnNyYz1cIml0ZW0uaW1hZ2VfdXJsXCIgbW9kZT1cImFzcGVjdEZpbGxcIiBjbGFzcz1cIndoLWNhcmQtaW1nXCIgLz5cclxuICAgICAgICAgICAgICA8dmlldyB2LWVsc2UgY2xhc3M9XCJ3aC1jYXJkLXBoXCIgOnN0eWxlPVwieyBiYWNrZ3JvdW5kOiBnZXRJdGVtQ29sb3JIZXgoaXRlbSkgfVwiPlxyXG4gICAgICAgICAgICAgICAgPHRleHQgY2xhc3M9XCJ3aC1jYXJkLXBoLXR4dFwiPnt7IGl0ZW0ubmFtZVswXSB9fTwvdGV4dD5cclxuICAgICAgICAgICAgICA8L3ZpZXc+XHJcbiAgICAgICAgICAgIDwvdmlldz5cclxuICAgICAgICAgICAgPHRleHQgY2xhc3M9XCJ3aC1jYXJkLW5hbWVcIj57eyBpdGVtLm5hbWUgfX08L3RleHQ+XHJcbiAgICAgICAgICA8L3ZpZXc+XHJcbiAgICAgICAgICA8dmlldyB2LWlmPVwiZmlsdGVyZWRXYXJkcm9iZS5sZW5ndGg9PT0wXCIgY2xhc3M9XCJ3aC1lbXB0eVwiPlxyXG4gICAgICAgICAgICA8dGV4dCBjbGFzcz1cIndoLWVtcHR5LWljb1wiPvCfkZc8L3RleHQ+XHJcbiAgICAgICAgICAgIDx0ZXh0IGNsYXNzPVwid2gtZW1wdHktdGV4dFwiPuiho+apseepuuepuu+8jOeCueWHu+S4iuaWueW9leWFpeS9oOeahOesrOS4gOS7tuiho+acjeWQpzwvdGV4dD5cclxuICAgICAgICAgIDwvdmlldz5cclxuICAgICAgICA8L3ZpZXc+XHJcbiAgICAgIDwvdmlldz5cclxuXHJcbiAgICAgIDwhLS0g5Lyg5Zu+6IO95Yqb5bey5ZCI5bm26L+b44CM5a+56K+d44CN77ya5a+56K+d6L6T5YWl5qGG5bem6L6555qEIPCfk7cg5oyJ6ZKu5Y+v5Y+R5Zu+6K6pIEFJIOWIhuaekOaQremFjSAtLT5cclxuXHJcbiAgICAgIDwhLS0gPT09PT0gNS41IOiHquS4u+aQremFjSArIEFJIOWuoeaguCA9PT09PSAtLT5cclxuICAgICAgPHZpZXcgdi1zaG93PVwiY3VycmVudFZpZXc9PT0nb3V0Zml0J1wiIGNsYXNzPVwicGFuZWxcIj5cclxuICAgICAgICA8dmlldyBjbGFzcz1cInBhbmVsLWhlYWQgYmV0d2VlblwiPlxyXG4gICAgICAgICAgPHZpZXcgY2xhc3M9XCJoZWFkLWxlZnRcIj5cclxuICAgICAgICAgICAgPHRleHQgY2xhc3M9XCJiYWNrLWJ0blwiIEBjbGljaz1cInN3aXRjaFZpZXcoJ3RvZGF5JylcIj7igLkg6L+U5ZuePC90ZXh0PlxyXG4gICAgICAgICAgICA8dGV4dCBjbGFzcz1cInBhbmVsLXRpdGxlXCI+5oiR55qE5pCt6YWNPC90ZXh0PlxyXG4gICAgICAgICAgPC92aWV3PlxyXG4gICAgICAgICAgPHRleHQgY2xhc3M9XCJwYW5lbC1zdWJcIj7ku47ooaPmqbHmjJHlh6Dku7bvvIzorqkgQUkg5biu5L2g5a6h5qC4PC90ZXh0PlxyXG4gICAgICAgIDwvdmlldz5cclxuXHJcbiAgICAgICAgPCEtLSDooaPmqbHlpJrpgInljLogLS0+XHJcbiAgICAgICAgPHZpZXcgY2xhc3M9XCJncmlkXCI+XHJcbiAgICAgICAgICA8dmlldyB2LWZvcj1cIml0ZW0gaW4gd2FyZHJvYmVcIiA6a2V5PVwiaXRlbS5pZFwiXHJcbiAgICAgICAgICAgICAgICA6Y2xhc3M9XCJbJ2NhcmQnLCAncGljaycsIHsgcGlja2VkOiBpc1NlbGVjdGVkKGl0ZW0uaWQpIH1dXCIgQGNsaWNrPVwidG9nZ2xlU2VsZWN0KGl0ZW0uaWQpXCI+XHJcbiAgICAgICAgICAgIDx2aWV3IGNsYXNzPVwiY2FyZC1pbWdcIj5cclxuICAgICAgICAgICAgICA8aW1hZ2Ugdi1pZj1cIml0ZW0uaW1hZ2VfdXJsXCIgOnNyYz1cIml0ZW0uaW1hZ2VfdXJsXCIgbW9kZT1cImFzcGVjdEZpbGxcIiBjbGFzcz1cImZ1bGwtaW1nXCIgLz5cclxuICAgICAgICAgICAgICA8dmlldyB2LWVsc2UgY2xhc3M9XCJwaFwiIDpzdHlsZT1cIntiYWNrZ3JvdW5kOml0ZW0uY29sb3J8fCcjZWVlJ31cIj48dGV4dD57eyBpdGVtLm5hbWVbMF0gfX08L3RleHQ+PC92aWV3PlxyXG4gICAgICAgICAgICA8L3ZpZXc+XHJcbiAgICAgICAgICAgIDx2aWV3IGNsYXNzPVwiY2FyZC1pbmZvXCI+XHJcbiAgICAgICAgICAgICAgPHRleHQgY2xhc3M9XCJjYXJkLW5hbWVcIj57eyBpdGVtLm5hbWUgfX08L3RleHQ+XHJcbiAgICAgICAgICAgICAgPHZpZXcgY2xhc3M9XCJ0YWdzXCI+XHJcbiAgICAgICAgICAgICAgICA8dGV4dCBjbGFzcz1cInRhZ1wiPnt7IGl0ZW0uY2F0ZWdvcnkgfX08L3RleHQ+XHJcbiAgICAgICAgICAgICAgICA8dGV4dCBjbGFzcz1cInRhZyBva1wiPnt7IGl0ZW0uY29sb3IgfX08L3RleHQ+XHJcbiAgICAgICAgICAgICAgPC92aWV3PlxyXG4gICAgICAgICAgICA8L3ZpZXc+XHJcbiAgICAgICAgICAgIDx2aWV3IHYtaWY9XCJpc1NlbGVjdGVkKGl0ZW0uaWQpXCIgY2xhc3M9XCJwaWNrLWJhZGdlXCI+4pyTPC92aWV3PlxyXG4gICAgICAgICAgPC92aWV3PlxyXG4gICAgICAgICAgPHZpZXcgdi1pZj1cIndhcmRyb2JlLmxlbmd0aD09PTBcIiBjbGFzcz1cImVtcHR5XCI+PHRleHQ+6KGj5qmx56m656m677yM5YWI5Y675re75Yqg6KGj54mpPC90ZXh0Pjwvdmlldz5cclxuICAgICAgICA8L3ZpZXc+XHJcblxyXG4gICAgICAgIDwhLS0g5a6h5qC457uT5p6cIC0tPlxyXG4gICAgICAgIDx2aWV3IHYtaWY9XCJyZXZpZXdSZXN1bHRcIiBjbGFzcz1cInJldmlldy1jYXJkXCI+XHJcbiAgICAgICAgICA8dmlldyBjbGFzcz1cInJldmlldy10b3BcIj5cclxuICAgICAgICAgICAgPHZpZXcgY2xhc3M9XCJzY29yZS1yaW5nXCIgOnN0eWxlPVwieyBiYWNrZ3JvdW5kOiBvdXRmaXRTY29yZVJpbmcgfVwiPlxyXG4gICAgICAgICAgICAgIDx0ZXh0IGNsYXNzPVwic2NvcmUtbnVtXCI+e3sgcmV2aWV3UmVzdWx0LnNjb3JlICE9IG51bGwgPyByZXZpZXdSZXN1bHQuc2NvcmUgOiAn4oCUJyB9fTwvdGV4dD5cclxuICAgICAgICAgICAgICA8dGV4dCBjbGFzcz1cInNjb3JlLWNhcFwiPi8xMDwvdGV4dD5cclxuICAgICAgICAgICAgPC92aWV3PlxyXG4gICAgICAgICAgICA8dmlldyBjbGFzcz1cInJldmlldy12ZXJkaWN0XCI+XHJcbiAgICAgICAgICAgICAgPHRleHQgY2xhc3M9XCJydi1sYWJlbFwiPkFJIOWuoeaguOe7k+iuujwvdGV4dD5cclxuICAgICAgICAgICAgICA8dGV4dCBjbGFzcz1cInJ2LXRhZ1wiIDpzdHlsZT1cInsgYmFja2dyb3VuZDogb3V0Zml0U2NvcmVDb2xvciB9XCI+e3sgcmV2aWV3UmVzdWx0LnZlcmRpY3QgfHwgJ+W3sueCueivhCcgfX08L3RleHQ+XHJcbiAgICAgICAgICAgIDwvdmlldz5cclxuICAgICAgICAgIDwvdmlldz5cclxuICAgICAgICAgIDxpbWFnZSB2LWlmPVwicmV2aWV3UmVzdWx0LmltYWdlX3VybFwiIDpzcmM9XCJyZXZpZXdSZXN1bHQuaW1hZ2VfdXJsXCIgbW9kZT1cIndpZHRoRml4XCIgY2xhc3M9XCJyZXZpZXctaW1nXCIgLz5cclxuICAgICAgICAgIDx2aWV3IGNsYXNzPVwicnYtYmxvY2tcIj48dGV4dCBjbGFzcz1cInJ2LWhcIj7wn46oIOiJsuW9qeWNj+iwgzwvdGV4dD48dGV4dCBjbGFzcz1cInJ2LWNcIj57eyByZXZpZXdSZXN1bHQuY29sb3JfY29tbWVudCB8fCByZXZpZXdSZXN1bHQucmF3IH19PC90ZXh0Pjwvdmlldz5cclxuICAgICAgICAgIDx2aWV3IGNsYXNzPVwicnYtYmxvY2tcIj48dGV4dCBjbGFzcz1cInJ2LWhcIj7wn4ykIOWto+iKguWQiOmAguW6pjwvdGV4dD48dGV4dCBjbGFzcz1cInJ2LWNcIj57eyByZXZpZXdSZXN1bHQuc2Vhc29uX2NvbW1lbnQgfX08L3RleHQ+PC92aWV3PlxyXG4gICAgICAgICAgPHZpZXcgY2xhc3M9XCJydi1ibG9ja1wiPjx0ZXh0IGNsYXNzPVwicnYtaFwiPvCfjqkg5Zy65ZCI5b6X5L2T5bqmPC90ZXh0Pjx0ZXh0IGNsYXNzPVwicnYtY1wiPnt7IHJldmlld1Jlc3VsdC5vY2Nhc2lvbl9jb21tZW50IH19PC90ZXh0Pjwvdmlldz5cclxuICAgICAgICAgIDx2aWV3IGNsYXNzPVwicnYtYmxvY2tcIj48dGV4dCBjbGFzcz1cInJ2LWhcIj7wn6epIOWujOaVtOW6pjwvdGV4dD48dGV4dCBjbGFzcz1cInJ2LWNcIj57eyByZXZpZXdSZXN1bHQuY29tcGxldGVuZXNzX2NvbW1lbnQgfX08L3RleHQ+PC92aWV3PlxyXG4gICAgICAgICAgPHZpZXcgdi1pZj1cInJldmlld1Jlc3VsdC5zdWdnZXN0aW9ucyAmJiByZXZpZXdSZXN1bHQuc3VnZ2VzdGlvbnMubGVuZ3RoXCIgY2xhc3M9XCJydi1ibG9ja1wiPlxyXG4gICAgICAgICAgICA8dGV4dCBjbGFzcz1cInJ2LWhcIj7wn5KhIOaUuei/m+W7uuiurjwvdGV4dD5cclxuICAgICAgICAgICAgPHRleHQgdi1mb3I9XCIocyxpKSBpbiByZXZpZXdSZXN1bHQuc3VnZ2VzdGlvbnNcIiA6a2V5PVwiaVwiIGNsYXNzPVwic3VnXCI+e3sgKGkrMSkgfX0uIHt7IHMgfX08L3RleHQ+XHJcbiAgICAgICAgICA8L3ZpZXc+XHJcbiAgICAgICAgICA8dmlldyBjbGFzcz1cInJldmlldy1hY3Rpb25zXCI+XHJcbiAgICAgICAgICAgIDx2aWV3IGNsYXNzPVwibWluaS1idG5cIiBAY2xpY2s9XCJjbGVhclNlbGVjdGlvblwiPumHjeaWsOaQremFjTwvdmlldz5cclxuICAgICAgICAgIDwvdmlldz5cclxuICAgICAgICA8L3ZpZXc+XHJcblxyXG4gICAgICAgIDwhLS0g5bqV6YOo5pON5L2c5p2h77ya5bey6YCJ6K6h5pWwICsgQUkg5a6h5qC4IC0tPlxyXG4gICAgICAgIDx2aWV3IGNsYXNzPVwib3V0Zml0LWJhclwiPlxyXG4gICAgICAgICAgPHRleHQgY2xhc3M9XCJvYi1jb3VudFwiPuW3sumAiSA8dGV4dCBjbGFzcz1cIm9iLW51bVwiPnt7IHNlbGVjdGVkSWRzLmxlbmd0aCB9fTwvdGV4dD4g5Lu2PC90ZXh0PlxyXG4gICAgICAgICAgPHZpZXcgY2xhc3M9XCJvYi1idG5cIiA6Y2xhc3M9XCJ7IGRpc2FibGVkOiBzZWxlY3RlZElkcy5sZW5ndGggPCAyIHx8IHJldmlld0xvYWRpbmcgfVwiIEBjbGljaz1cInJldmlld091dGZpdFwiPlxyXG4gICAgICAgICAgICA8dGV4dCB2LWlmPVwicmV2aWV3TG9hZGluZ1wiPuWuoeaguOS4rS4uLjwvdGV4dD5cclxuICAgICAgICAgICAgPHRleHQgdi1lbHNlPkFJIOWuoeaguOaQremFjTwvdGV4dD5cclxuICAgICAgICAgIDwvdmlldz5cclxuICAgICAgICA8L3ZpZXc+XHJcbiAgICAgIDwvdmlldz5cclxuXHJcbiAgICAgIDwhLS0gPT09PT0gNi4g6KGj5qmx5YiG5p6QID09PT09IC0tPlxyXG4gICAgICA8dmlldyB2LXNob3c9XCJjdXJyZW50Vmlldz09PSdhbmFseXNpcydcIiBjbGFzcz1cInBhbmVsXCI+XHJcbiAgICAgICAgPHZpZXcgY2xhc3M9XCJwYW5lbC1oZWFkIGJldHdlZW5cIj5cclxuICAgICAgICAgIDx0ZXh0IGNsYXNzPVwicGFuZWwtdGl0bGVcIj7ooaPmqbHliIbmnpA8L3RleHQ+XHJcbiAgICAgICAgICA8dmlldyBjbGFzcz1cIm1pbmktYnRuXCIgQGNsaWNrPVwiZmV0Y2hBbmFseXNpc1wiPuWIt+aWsDwvdmlldz5cclxuICAgICAgICA8L3ZpZXc+XHJcbiAgICAgICAgPHZpZXcgdi1pZj1cImFuYWx5c2lzXCIgY2xhc3M9XCJjYXJkLWJveCBhbmFseXNpcy13cmFwXCI+XHJcbiAgICAgICAgICA8IS0tIOiho+apseWBpeW6t+W6piAtLT5cclxuICAgICAgICAgIDx2aWV3IGNsYXNzPVwic2NvcmUtY2FyZFwiPlxyXG4gICAgICAgICAgICA8dmlldyBjbGFzcz1cInNjb3JlLXJpbmdcIiA6c3R5bGU9XCJ7IGJhY2tncm91bmQ6ICdjb25pYy1ncmFkaWVudCgnICsgc2NvcmVDb2xvciArICcgJyArIHdhcmRyb2JlU2NvcmUgKyAnJSwgI2VlZjBmMyAnICsgd2FyZHJvYmVTY29yZSArICclKScgfVwiPlxyXG4gICAgICAgICAgICAgIDx2aWV3IGNsYXNzPVwic2NvcmUtaG9sZVwiPlxyXG4gICAgICAgICAgICAgICAgPHRleHQgY2xhc3M9XCJzY29yZS1udW1cIj57eyB3YXJkcm9iZVNjb3JlIH19PC90ZXh0PlxyXG4gICAgICAgICAgICAgICAgPHRleHQgY2xhc3M9XCJzY29yZS11bml0XCI+5YiGPC90ZXh0PlxyXG4gICAgICAgICAgICAgIDwvdmlldz5cclxuICAgICAgICAgICAgPC92aWV3PlxyXG4gICAgICAgICAgICA8dmlldyBjbGFzcz1cInNjb3JlLWluZm9cIj5cclxuICAgICAgICAgICAgICA8dGV4dCBjbGFzcz1cInNjb3JlLXRpdGxlXCI+e3sgc2NvcmVUZXh0IH19PC90ZXh0PlxyXG4gICAgICAgICAgICAgIDx0ZXh0IGNsYXNzPVwic2NvcmUtc3ViXCI+6KGj5qmx5YGl5bq35bqm6K+E5YiGPC90ZXh0PlxyXG4gICAgICAgICAgICAgIDx2aWV3IGNsYXNzPVwic2NvcmUtbWV0cmljc1wiPlxyXG4gICAgICAgICAgICAgICAgPHZpZXcgY2xhc3M9XCJzbVwiPjx0ZXh0IGNsYXNzPVwic20tbnVtXCI+e3sgYW5hbHlzaXMudG90YWxfaXRlbXMgfX08L3RleHQ+PHRleHQgY2xhc3M9XCJzbS1sYWJcIj7ooaPniak8L3RleHQ+PC92aWV3PlxyXG4gICAgICAgICAgICAgICAgPHZpZXcgY2xhc3M9XCJzbVwiPjx0ZXh0IGNsYXNzPVwic20tbnVtIHdhcm5cIj57eyAoYW5hbHlzaXMudW51c2VkX2l0ZW1zfHxbXSkubGVuZ3RoIH19PC90ZXh0Pjx0ZXh0IGNsYXNzPVwic20tbGFiXCI+6Zey572uPC90ZXh0Pjwvdmlldz5cclxuICAgICAgICAgICAgICAgIDx2aWV3IGNsYXNzPVwic21cIj48dGV4dCBjbGFzcz1cInNtLW51bSBkYW5nZXJcIj57eyAoYW5hbHlzaXMuZHVwbGljYXRlX3dhcm5pbmdzfHxbXSkubGVuZ3RoIH19PC90ZXh0Pjx0ZXh0IGNsYXNzPVwic20tbGFiXCI+6YeN5aSNPC90ZXh0Pjwvdmlldz5cclxuICAgICAgICAgICAgICA8L3ZpZXc+XHJcbiAgICAgICAgICAgIDwvdmlldz5cclxuICAgICAgICAgIDwvdmlldz5cclxuXHJcbiAgICAgICAgICA8IS0tIOWTgeexu+WIhuW4gyAtLT5cclxuICAgICAgICAgIDx2aWV3IGNsYXNzPVwiYmxvY2tcIj5cclxuICAgICAgICAgICAgPHRleHQgY2xhc3M9XCJibG9jay10aXRsZVwiPuWTgeexu+WIhuW4gzwvdGV4dD5cclxuICAgICAgICAgICAgPHZpZXcgY2xhc3M9XCJkb251dC1yb3dcIiB2LWlmPVwiY2F0ZWdvcnlDaGFydC5pdGVtcy5sZW5ndGhcIj5cclxuICAgICAgICAgICAgICA8dmlldyBjbGFzcz1cImRvbnV0XCIgOnN0eWxlPVwieyBiYWNrZ3JvdW5kOiBjYXRlZ29yeUNoYXJ0LmdyYWRpZW50IH1cIj5cclxuICAgICAgICAgICAgICAgIDx2aWV3IGNsYXNzPVwiZG9udXQtaG9sZVwiPlxyXG4gICAgICAgICAgICAgICAgICA8dGV4dCBjbGFzcz1cImRvbnV0LW51bVwiPnt7IGNhdGVnb3J5Q2hhcnQudG90YWwgfX08L3RleHQ+XHJcbiAgICAgICAgICAgICAgICAgIDx0ZXh0IGNsYXNzPVwiZG9udXQtdW5pdFwiPuS7tjwvdGV4dD5cclxuICAgICAgICAgICAgICAgIDwvdmlldz5cclxuICAgICAgICAgICAgICA8L3ZpZXc+XHJcbiAgICAgICAgICAgICAgPHZpZXcgY2xhc3M9XCJsZWdlbmRcIj5cclxuICAgICAgICAgICAgICAgIDx2aWV3IHYtZm9yPVwiaXQgaW4gY2F0ZWdvcnlDaGFydC5pdGVtc1wiIDprZXk9XCJpdC5yYXdcIiBjbGFzcz1cImxlZ2VuZC1pdGVtXCI+XHJcbiAgICAgICAgICAgICAgICAgIDx2aWV3IGNsYXNzPVwibGVnZW5kLWRvdFwiIDpzdHlsZT1cInsgYmFja2dyb3VuZDogaXQuY29sb3IgfVwiPjwvdmlldz5cclxuICAgICAgICAgICAgICAgICAgPHRleHQgY2xhc3M9XCJsZWdlbmQtbmFtZVwiPnt7IGl0Lm5hbWUgfX08L3RleHQ+XHJcbiAgICAgICAgICAgICAgICAgIDx0ZXh0IGNsYXNzPVwibGVnZW5kLXZhbFwiPnt7IGl0LnZhbHVlIH19IMK3IHt7IGl0LnBjdCB9fSU8L3RleHQ+XHJcbiAgICAgICAgICAgICAgICA8L3ZpZXc+XHJcbiAgICAgICAgICAgICAgPC92aWV3PlxyXG4gICAgICAgICAgICA8L3ZpZXc+XHJcbiAgICAgICAgICAgIDx0ZXh0IHYtZWxzZSBjbGFzcz1cImVtcHR5LXRpcFwiPuaaguaXoOaVsOaNrjwvdGV4dD5cclxuICAgICAgICAgIDwvdmlldz5cclxuXHJcbiAgICAgICAgICA8IS0tIOWto+iKguWIhuW4gyAtLT5cclxuICAgICAgICAgIDx2aWV3IGNsYXNzPVwiYmxvY2tcIiB2LWlmPVwic2Vhc29uQ2hhcnQubGVuZ3RoXCI+XHJcbiAgICAgICAgICAgIDx0ZXh0IGNsYXNzPVwiYmxvY2stdGl0bGVcIj7lraPoioLliIbluIM8L3RleHQ+XHJcbiAgICAgICAgICAgIDx2aWV3IGNsYXNzPVwic3RhY2stYmFyXCI+XHJcbiAgICAgICAgICAgICAgPHZpZXcgdi1mb3I9XCJzIGluIHNlYXNvbkNoYXJ0XCIgOmtleT1cInMubmFtZVwiIGNsYXNzPVwic3RhY2stc2VnXCIgOnN0eWxlPVwieyB3aWR0aDogcy5wY3QgKyAnJScsIGJhY2tncm91bmQ6IHMuY29sb3IgfVwiPjwvdmlldz5cclxuICAgICAgICAgICAgPC92aWV3PlxyXG4gICAgICAgICAgICA8dmlldyBjbGFzcz1cInN0YWNrLWxlZ2VuZFwiPlxyXG4gICAgICAgICAgICAgIDx2aWV3IHYtZm9yPVwicyBpbiBzZWFzb25DaGFydFwiIDprZXk9XCJzLm5hbWVcIiBjbGFzcz1cInN0YWNrLWxlZ1wiPlxyXG4gICAgICAgICAgICAgICAgPHZpZXcgY2xhc3M9XCJsZWdlbmQtZG90XCIgOnN0eWxlPVwieyBiYWNrZ3JvdW5kOiBzLmNvbG9yIH1cIj48L3ZpZXc+XHJcbiAgICAgICAgICAgICAgICA8dGV4dCBjbGFzcz1cInN0YWNrLWxlZy10XCI+e3sgcy5uYW1lIH19IMK3IHt7IHMudmFsdWUgfX08L3RleHQ+XHJcbiAgICAgICAgICAgICAgPC92aWV3PlxyXG4gICAgICAgICAgICA8L3ZpZXc+XHJcbiAgICAgICAgICA8L3ZpZXc+XHJcblxyXG4gICAgICAgICAgPCEtLSDpopzoibLliIbluIMgLS0+XHJcbiAgICAgICAgICA8dmlldyBjbGFzcz1cImJsb2NrXCIgdi1pZj1cImNvbG9yTGlzdC5sZW5ndGhcIj5cclxuICAgICAgICAgICAgPHRleHQgY2xhc3M9XCJibG9jay10aXRsZVwiPuminOiJsuWIhuW4gzwvdGV4dD5cclxuICAgICAgICAgICAgPHZpZXcgY2xhc3M9XCJjb2xvci13cmFwXCI+XHJcbiAgICAgICAgICAgICAgPHZpZXcgdi1mb3I9XCJjIGluIGNvbG9yTGlzdFwiIDprZXk9XCJjLm5hbWVcIiBjbGFzcz1cImNvbG9yLWNoaXBcIj5cclxuICAgICAgICAgICAgICAgIDx2aWV3IGNsYXNzPVwiY29sb3ItZG90XCIgOnN0eWxlPVwieyBiYWNrZ3JvdW5kOiBjLmhleCwgYm9yZGVyQ29sb3I6IGMuaGV4ID09PSAnI2Y1ZjVmNScgPyAnI2U0ZTdlZCcgOiBjLmhleCB9XCI+PC92aWV3PlxyXG4gICAgICAgICAgICAgICAgPHRleHQgY2xhc3M9XCJjb2xvci1uYW1lXCI+e3sgYy5uYW1lIH19PC90ZXh0PlxyXG4gICAgICAgICAgICAgICAgPHRleHQgY2xhc3M9XCJjb2xvci1jbnRcIj57eyBjLnZhbHVlIH19PC90ZXh0PlxyXG4gICAgICAgICAgICAgIDwvdmlldz5cclxuICAgICAgICAgICAgPC92aWV3PlxyXG4gICAgICAgICAgPC92aWV3PlxyXG5cclxuICAgICAgICAgIDwhLS0g6Zey572u5o+Q6YaSIC0tPlxyXG4gICAgICAgICAgPHZpZXcgY2xhc3M9XCJibG9ja1wiPlxyXG4gICAgICAgICAgICA8dGV4dCBjbGFzcz1cImJsb2NrLXRpdGxlXCI+6Zey572u5o+Q6YaSPC90ZXh0PlxyXG4gICAgICAgICAgICA8dmlldyB2LWlmPVwiYW5hbHlzaXMudW51c2VkX2l0ZW1zJiZhbmFseXNpcy51bnVzZWRfaXRlbXMubGVuZ3RoXCIgY2xhc3M9XCJ0YWctbGlzdFwiPlxyXG4gICAgICAgICAgICAgIDx0ZXh0IHYtZm9yPVwiaXRlbSBpbiBhbmFseXNpcy51bnVzZWRfaXRlbXNcIiA6a2V5PVwiaXRlbS5pZFwiIGNsYXNzPVwidGFnIHdhcm5cIj57eyBpdGVtLm5hbWUgfX3vvIjotoU5MOWkqe+8iTwvdGV4dD5cclxuICAgICAgICAgICAgPC92aWV3PlxyXG4gICAgICAgICAgICA8dGV4dCB2LWVsc2UgY2xhc3M9XCJlbXB0eS10aXBcIj7mmoLml6Dpl7Lnva7vvIzkv53mjIHlvpflvojlpb08L3RleHQ+XHJcbiAgICAgICAgICA8L3ZpZXc+XHJcblxyXG4gICAgICAgICAgPCEtLSDph43lpI3otK3kubAgLS0+XHJcbiAgICAgICAgICA8dmlldyBjbGFzcz1cImJsb2NrXCI+XHJcbiAgICAgICAgICAgIDx0ZXh0IGNsYXNzPVwiYmxvY2stdGl0bGVcIj7ph43lpI3otK3kubDmj5DphpI8L3RleHQ+XHJcbiAgICAgICAgICAgIDx2aWV3IHYtaWY9XCJhbmFseXNpcy5kdXBsaWNhdGVfd2FybmluZ3MmJmFuYWx5c2lzLmR1cGxpY2F0ZV93YXJuaW5ncy5sZW5ndGhcIiBjbGFzcz1cInRhZy1saXN0XCI+XHJcbiAgICAgICAgICAgICAgPHRleHQgdi1mb3I9XCJkIGluIGFuYWx5c2lzLmR1cGxpY2F0ZV93YXJuaW5nc1wiIDprZXk9XCJkLm5hbWVcIiBjbGFzcz1cInRhZyBkYW5nZXJcIj57eyBkLm5hbWUgfX0gw5cge3sgZC5jb3VudCB9fTwvdGV4dD5cclxuICAgICAgICAgICAgPC92aWV3PlxyXG4gICAgICAgICAgICA8dGV4dCB2LWVsc2UgY2xhc3M9XCJlbXB0eS10aXBcIj7ml6Dph43lpI3otK3kubA8L3RleHQ+XHJcbiAgICAgICAgICA8L3ZpZXc+XHJcblxyXG4gICAgICAgICAgPCEtLSDmmbrog73lu7rorq4gLS0+XHJcbiAgICAgICAgICA8dmlldyBjbGFzcz1cImJsb2NrXCIgdi1pZj1cImFuYWx5c2lzLnN1Z2dlc3Rpb25zJiZhbmFseXNpcy5zdWdnZXN0aW9ucy5sZW5ndGhcIj5cclxuICAgICAgICAgICAgPHRleHQgY2xhc3M9XCJibG9jay10aXRsZVwiPuaZuuiDveW7uuiurjwvdGV4dD5cclxuICAgICAgICAgICAgPHZpZXcgY2xhc3M9XCJzdWctbGlzdFwiPlxyXG4gICAgICAgICAgICAgIDx2aWV3IHYtZm9yPVwiKHMsaSkgaW4gYW5hbHlzaXMuc3VnZ2VzdGlvbnNcIiA6a2V5PVwiaVwiIGNsYXNzPVwic3VnLWl0ZW1cIj5cclxuICAgICAgICAgICAgICAgIDx0ZXh0IGNsYXNzPVwic3VnLWJ1bGxldFwiPuKcpjwvdGV4dD5cclxuICAgICAgICAgICAgICAgIDx0ZXh0IGNsYXNzPVwic3VnLXRleHRcIj57eyBzIH19PC90ZXh0PlxyXG4gICAgICAgICAgICAgIDwvdmlldz5cclxuICAgICAgICAgICAgPC92aWV3PlxyXG4gICAgICAgICAgPC92aWV3PlxyXG4gICAgICAgIDwvdmlldz5cclxuICAgICAgPC92aWV3PlxyXG5cclxuICAgICAgPCEtLSDlr7nor53ljoblj7Llt7LlkIjlubbov5vlr7nor53nlYzpnaLnmoTlt6bkvqfmir3lsYnvvIzop4HlupXpg6ggaGlzdG9yeS1kcmF3ZXIgLS0+XHJcblxyXG4gICAgICA8IS0tID09PT09IDguIOi0reeJqea4heWNlSA9PT09PSAtLT5cclxuICAgICAgPHZpZXcgdi1zaG93PVwiY3VycmVudFZpZXc9PT0nc2hvcHBpbmcnXCIgY2xhc3M9XCJwYW5lbFwiPlxyXG4gICAgICAgIDx2aWV3IGNsYXNzPVwicGFuZWwtaGVhZFwiPjx0ZXh0IGNsYXNzPVwicGFuZWwtdGl0bGVcIj7otK3nianmuIXljZU8L3RleHQ+PC92aWV3PlxyXG4gICAgICAgIDx2aWV3IHYtaWY9XCJzaG9wcGluZ0xpc3QmJnNob3BwaW5nTGlzdC5zdWdnZXN0aW9ucyYmc2hvcHBpbmdMaXN0LnN1Z2dlc3Rpb25zLmxlbmd0aFwiPlxyXG4gICAgICAgICAgPHZpZXcgdi1mb3I9XCIocyxpKSBpbiBzaG9wcGluZ0xpc3Quc3VnZ2VzdGlvbnNcIiA6a2V5PVwiaVwiIGNsYXNzPVwiY2FyZC1ib3ggc2hvcFwiPlxyXG4gICAgICAgICAgICA8dGV4dCA6Y2xhc3M9XCJbJ3RhZycsIHRhZ0NsYXNzKHMuY2F0ZWdvcnkpXVwiPnt7IGNhdE1hcFtzLmNhdGVnb3J5XXx8cy5jYXRlZ29yeSB9fTwvdGV4dD5cclxuICAgICAgICAgICAgPHRleHQgY2xhc3M9XCJzaG9wLXJlYXNvblwiPnt7IHMucmVhc29uIH19PC90ZXh0PlxyXG4gICAgICAgICAgPC92aWV3PlxyXG4gICAgICAgIDwvdmlldz5cclxuICAgICAgICA8dmlldyB2LWVsc2UgY2xhc3M9XCJlbXB0eVwiPjx0ZXh0PuS9oOeahOiho+apseWTgeexu+m9kOWFqO+8jOaaguaXoOi0reeJqeW7uuiuru+8gTwvdGV4dD48L3ZpZXc+XHJcbiAgICAgIDwvdmlldz5cclxuXHJcbiAgICAgIDwhLS0gPT09PT0gOS4g5Liq5Lq65Lit5b+DID09PT09IC0tPlxyXG4gICAgICA8dmlldyB2LXNob3c9XCJjdXJyZW50Vmlldz09PSdwcm9maWxlJ1wiIGNsYXNzPVwicGFuZWxcIj5cclxuICAgICAgICA8dmlldyBjbGFzcz1cInBhbmVsLWhlYWRcIj48dGV4dCBjbGFzcz1cInBhbmVsLXRpdGxlXCI+5Liq5Lq65Lit5b+DPC90ZXh0Pjwvdmlldz5cclxuICAgICAgICA8dmlldyBjbGFzcz1cIm1lLWNhcmRcIj5cclxuICAgICAgICAgIDx2aWV3IGNsYXNzPVwibWUtYXZhdGFyXCI+e3sgcHJvZmlsZS5uaWNrbmFtZSA/IHByb2ZpbGUubmlja25hbWVbMF0gOiAn8J+RpCcgfX08L3ZpZXc+XHJcbiAgICAgICAgICA8dmlldyBjbGFzcz1cIm1lLWluZm9cIj5cclxuICAgICAgICAgICAgPHRleHQgY2xhc3M9XCJtZS1uYW1lXCI+e3sgcHJvZmlsZS5uaWNrbmFtZSB8fCAn56m/5pCt55So5oi3JyB9fTwvdGV4dD5cclxuICAgICAgICAgICAgPHRleHQgY2xhc3M9XCJtZS1zdWJcIj57eyBwcm9maWxlLnVzZXJuYW1lID8gJ+i0puWPt++8micgKyBwcm9maWxlLnVzZXJuYW1lIDogJ0FJIOepv+aQreWKqeaJi+eUqOaItycgfX08L3RleHQ+XHJcbiAgICAgICAgICA8L3ZpZXc+XHJcbiAgICAgICAgPC92aWV3PlxyXG4gICAgICAgIDx2aWV3IGNsYXNzPVwibWUtbGlzdFwiPlxyXG4gICAgICAgICAgPHZpZXcgY2xhc3M9XCJtZS1yb3dcIiBAY2xpY2s9XCJnb1dhcmRyb2JlXCI+XHJcbiAgICAgICAgICAgIDx0ZXh0IGNsYXNzPVwibWUtcm93LWxcIj7miJHnmoTooaPmqbE8L3RleHQ+XHJcbiAgICAgICAgICAgIDx0ZXh0IGNsYXNzPVwibWUtYXJyb3dcIj7igLo8L3RleHQ+XHJcbiAgICAgICAgICA8L3ZpZXc+XHJcbiAgICAgICAgICA8dmlldyBjbGFzcz1cIm1lLXJvd1wiIEBjbGljaz1cInN3aXRjaFZpZXcoJ25vdGlmeScpXCI+XHJcbiAgICAgICAgICAgIDx0ZXh0IGNsYXNzPVwibWUtcm93LWxcIj7pgJrnn6XkuK3lv4M8L3RleHQ+XHJcbiAgICAgICAgICAgIDx0ZXh0IGNsYXNzPVwibWUtYmFkZ2VcIiB2LWlmPVwidW5yZWFkQ291bnQ+MFwiPnt7IHVucmVhZENvdW50Pjk5Pyc5OSsnOnVucmVhZENvdW50IH19PC90ZXh0PlxyXG4gICAgICAgICAgICA8dGV4dCBjbGFzcz1cIm1lLWFycm93XCI+4oC6PC90ZXh0PlxyXG4gICAgICAgICAgPC92aWV3PlxyXG4gICAgICAgIDwvdmlldz5cclxuICAgICAgICA8dmlldyBjbGFzcz1cIm1lLWxvZ291dFwiIEBjbGljaz1cImxvZ291dFwiPumAgOWHuueZu+W9lTwvdmlldz5cclxuICAgICAgPC92aWV3PlxyXG5cclxuICAgICAgPCEtLSA9PT09PSAxMC4g6YCa55+l5Lit5b+DID09PT09IC0tPlxyXG4gICAgICA8dmlldyB2LXNob3c9XCJjdXJyZW50Vmlldz09PSdub3RpZnknXCIgY2xhc3M9XCJwYW5lbFwiPlxyXG4gICAgICAgIDx2aWV3IGNsYXNzPVwicGFuZWwtaGVhZCBiZXR3ZWVuXCI+XHJcbiAgICAgICAgICA8dGV4dCBjbGFzcz1cInBhbmVsLXRpdGxlXCI+6YCa55+l5Lit5b+DPC90ZXh0PlxyXG4gICAgICAgICAgPHZpZXcgY2xhc3M9XCJtaW5pLWJ0blwiIEBjbGljaz1cIm1hcmtBbGxSZWFkXCI+5YWo6YOo5bey6K+7PC92aWV3PlxyXG4gICAgICAgIDwvdmlldz5cclxuICAgICAgICA8dmlldyB2LWlmPVwibm90aWZ5TG9hZGluZ1wiIGNsYXNzPVwiY2FyZC1ib3hcIj48dGV4dCBjbGFzcz1cImxvYWRpbmctdGV4dFwiPuWKoOi9veS4reKApjwvdGV4dD48L3ZpZXc+XHJcbiAgICAgICAgPHZpZXcgdi1mb3I9XCJuIGluIG5vdGlmaWNhdGlvbnNcIiA6a2V5PVwibi5pZFwiIDpjbGFzcz1cIlsnbm90aScsIHt1bnJlYWQ6ICFuLmlzX3JlYWR9XVwiIEBjbGljaz1cIm9uTm90aUNsaWNrKG4pXCI+XHJcbiAgICAgICAgICA8dmlldyBjbGFzcz1cIm5vdGktdG9wXCI+XHJcbiAgICAgICAgICAgIDx0ZXh0IDpjbGFzcz1cIlsnbm90aS10YWcnLCAndC0nICsgbi50eXBlXVwiPnt7IG5vdGlUeXBlTGFiZWwobi50eXBlKSB9fTwvdGV4dD5cclxuICAgICAgICAgICAgPHRleHQgY2xhc3M9XCJub3RpLXRpbWVcIj57eyBuLmNyZWF0ZWRfYXQgfX08L3RleHQ+XHJcbiAgICAgICAgICA8L3ZpZXc+XHJcbiAgICAgICAgICA8dGV4dCBjbGFzcz1cIm5vdGktdGl0bGVcIj57eyBuLnRpdGxlIH19PC90ZXh0PlxyXG4gICAgICAgICAgPHRleHQgY2xhc3M9XCJub3RpLWNvbnRlbnRcIj57eyBuLmNvbnRlbnQgfX08L3RleHQ+XHJcbiAgICAgICAgICA8aW1hZ2Ugdi1pZj1cIm4uaW1hZ2VfdXJsXCIgOnNyYz1cIm4uaW1hZ2VfdXJsXCIgbW9kZT1cIndpZHRoRml4XCIgY2xhc3M9XCJub3RpLWltZ1wiIC8+XHJcbiAgICAgICAgPC92aWV3PlxyXG4gICAgICAgIDx2aWV3IHYtaWY9XCIhbm90aWZ5TG9hZGluZyAmJiBub3RpZmljYXRpb25zLmxlbmd0aD09PTBcIiBjbGFzcz1cImVtcHR5XCI+PHRleHQ+5pqC5peg6YCa55+lPC90ZXh0Pjwvdmlldz5cclxuICAgICAgPC92aWV3PlxyXG4gICAgPC9zY3JvbGwtdmlldz5cclxuXHJcbiAgICA8IS0tIOWOhuWPsuS+p+i+ueaKveWxie+8iOS4juWvueivneWQiOW5tu+8mueCuSDimLAg5omT5byA77yM54K56YGu572pL+aKveWxieWkluaUtui1t++8iSAtLT5cclxuICAgIDx2aWV3IHYtc2hvdz1cInNob3dIaXN0b3J5RHJhd2VyXCIgY2xhc3M9XCJkcmF3ZXItd3JhcFwiPlxyXG4gICAgICA8dmlldyBjbGFzcz1cImRyYXdlci1tYXNrXCIgQGNsaWNrPVwiY2xvc2VIaXN0b3J5RHJhd2VyXCI+PC92aWV3PlxyXG4gICAgICA8dmlldyA6Y2xhc3M9XCJbJ2hpc3RvcnktZHJhd2VyJywgeyBvcGVuOiBkcmF3ZXJPcGVuZWQgfV1cIj5cclxuICAgICAgICA8dmlldyBjbGFzcz1cImRyYXdlci1oZWFkXCI+XHJcbiAgICAgICAgICA8dGV4dCBjbGFzcz1cImRyYXdlci10aXRsZVwiPuWvueivneWOhuWPsjwvdGV4dD5cclxuICAgICAgICAgIDx2aWV3IGNsYXNzPVwiZHJhd2VyLW5ld1wiIEBjbGljaz1cIm5ld0NoYXRcIj7vvIsg5paw5bu6PC92aWV3PlxyXG4gICAgICAgIDwvdmlldz5cclxuICAgICAgICA8c2Nyb2xsLXZpZXcgY2xhc3M9XCJkcmF3ZXItbGlzdFwiIHNjcm9sbC15PlxyXG4gICAgICAgICAgPHZpZXcgdi1mb3I9XCJjb252IGluIGNvbnZlcnNhdGlvbnNcIiA6a2V5PVwiY29udi5pZFwiIGNsYXNzPVwiZHJhd2VyLWl0ZW1cIj5cclxuICAgICAgICAgICAgPHZpZXcgY2xhc3M9XCJkaS1tYWluXCIgQGNsaWNrPVwib3Blbkhpc3RvcnlDaGF0QnlJZChjb252LmlkKVwiPlxyXG4gICAgICAgICAgICAgIDx0ZXh0IGNsYXNzPVwiZGktcVwiPnt7IGNvbnYudXNlcl9pbnB1dCB9fTwvdGV4dD5cclxuICAgICAgICAgICAgICA8dGV4dCBjbGFzcz1cImRpLWFcIj57eyAoY29udi5hZ2VudF9yZXNwb25zZSB8fCAnJykuc3Vic3RyaW5nKDAsIDYwKSB9fTwvdGV4dD5cclxuICAgICAgICAgICAgICA8dGV4dCBjbGFzcz1cImRpLXRpbWVcIj57eyBjb252LmNyZWF0ZWRfYXQgfX08L3RleHQ+XHJcbiAgICAgICAgICAgIDwvdmlldz5cclxuICAgICAgICAgICAgPHZpZXcgY2xhc3M9XCJkaS1kZWxcIiBAY2xpY2suc3RvcD1cImRlbGV0ZUNvbnZlcnNhdGlvbihjb252LmlkKVwiPvCfl5E8L3ZpZXc+XHJcbiAgICAgICAgICA8L3ZpZXc+XHJcbiAgICAgICAgICA8dmlldyB2LWlmPVwiY29udmVyc2F0aW9ucy5sZW5ndGggPT09IDBcIiBjbGFzcz1cImRyYXdlci1lbXB0eVwiPjx0ZXh0PuaaguaXoOWvueivneiusOW9lTwvdGV4dD48L3ZpZXc+XHJcbiAgICAgICAgPC9zY3JvbGwtdmlldz5cclxuICAgICAgPC92aWV3PlxyXG4gICAgPC92aWV3PlxyXG5cclxuICAgIDwhLS0g5bqV6YOo5a+86Iiq77yI5qiq5ZCR5rua5Yqo77yJIC0tPlxyXG4gICAgPHNjcm9sbC12aWV3IGNsYXNzPVwiYm90dG9tLW5hdlwiIHNjcm9sbC14PlxyXG4gICAgICA8dmlldyB2LWZvcj1cIml0ZW0gaW4gbmF2SXRlbXNcIiA6a2V5PVwiaXRlbS5rZXlcIlxyXG4gICAgICAgICAgICA6Y2xhc3M9XCJbJ25hdi1pdGVtJyx7YWN0aXZlOiBjdXJyZW50Vmlldz09PWl0ZW0ua2V5fV1cIiBAY2xpY2s9XCJzd2l0Y2hWaWV3KGl0ZW0ua2V5KVwiPlxyXG4gICAgICAgIDx2aWV3IGNsYXNzPVwibmF2LWljby13cmFwXCI+XHJcbiAgICAgICAgICA8dGV4dCBjbGFzcz1cIm5hdi1pY29uXCI+e3sgaXRlbS5pY29uIH19PC90ZXh0PlxyXG4gICAgICAgICAgPHRleHQgdi1pZj1cIml0ZW0ua2V5PT09J25vdGlmeScgJiYgdW5yZWFkQ291bnQ+MFwiIGNsYXNzPVwiYmFkZ2VcIj57eyB1bnJlYWRDb3VudD45OT8nOTkrJzp1bnJlYWRDb3VudCB9fTwvdGV4dD5cclxuICAgICAgICA8L3ZpZXc+XHJcbiAgICAgICAgPHRleHQgY2xhc3M9XCJuYXYtbGFiZWxcIj57eyBpdGVtLmxhYmVsIH19PC90ZXh0PlxyXG4gICAgICA8L3ZpZXc+XHJcbiAgICA8L3Njcm9sbC12aWV3PlxyXG5cclxuICAgIDwhLS0g5LiK5Lyg5by556qX77yIRFBTVEFSIOmjjuagvO+8iSAtLT5cclxuICAgIDx2aWV3IHYtaWY9XCJzaG93VXBsb2FkXCIgY2xhc3M9XCJtYXNrXCIgQGNsaWNrPVwiY2xvc2VVcGxvYWRcIj5cclxuICAgICAgPHZpZXcgY2xhc3M9XCJ3aC11cGxvYWQtZGlhbG9nXCIgQGNsaWNrLnN0b3A+XHJcbiAgICAgICAgPCEtLSDlpLTpg6ggLS0+XHJcbiAgICAgICAgPHZpZXcgY2xhc3M9XCJ3aC1kbGctaGVhZFwiPlxyXG4gICAgICAgICAgPHRleHQgY2xhc3M9XCJ3aC1kbGctYmFja1wiIEBjbGljaz1cImNsb3NlVXBsb2FkXCI+6L+U5ZuePC90ZXh0PlxyXG4gICAgICAgICAgPHRleHQgY2xhc3M9XCJ3aC1kbGctdGl0bGVcIj7orrDlvZXmlrDnmoTooaPmnI08L3RleHQ+XHJcbiAgICAgICAgICA8dGV4dD48L3RleHQ+XHJcbiAgICAgICAgPC92aWV3PlxyXG5cclxuICAgICAgICA8IS0tIOS4iuS8oOWMuiAtLT5cclxuICAgICAgICA8dmlldyBjbGFzcz1cIndoLWRsZy11cC1hcmVhXCIgQGNsaWNrPVwiY2hvb3NlV2FyZHJvYmVJbWFnZVwiPlxyXG4gICAgICAgICAgPHRleHQgY2xhc3M9XCJ3aC1kbGctdXAtaWNvXCI+8J+TtzwvdGV4dD5cclxuICAgICAgICAgIDx0ZXh0IGNsYXNzPVwid2gtZGxnLXVwLXR4dFwiPuS4iuS8oCAvIOabv+aNoueFp+eJhzwvdGV4dD5cclxuICAgICAgICA8L3ZpZXc+XHJcblxyXG4gICAgICAgIDwhLS0g5om56YeP5LiK5Lyg5YWl5Y+jIC0tPlxyXG4gICAgICAgIDx2aWV3IGNsYXNzPVwid2gtZGxnLWJhdGNoXCIgQGNsaWNrPVwiY2hvb3NlQmF0Y2hJbWFnZXNcIj5cclxuICAgICAgICAgIDx0ZXh0IGNsYXNzPVwid2gtZGxnLWJhdGNoLWljb1wiPvCflrzvuI88L3RleHQ+XHJcbiAgICAgICAgICA8dGV4dCBjbGFzcz1cIndoLWRsZy1iYXRjaC10eHRcIj7mibnph4/kuIrkvKDnhafniYfvvIjkuIrpmZAxMOW8oO+8iTwvdGV4dD5cclxuICAgICAgICA8L3ZpZXc+XHJcblxyXG4gICAgICAgIDwhLS0g6aKE6KeIICsg6KGo5Y2VIC0tPlxyXG4gICAgICAgIDx2aWV3IHYtaWY9XCJ1cGxvYWRQcmV2aWV3XCIgY2xhc3M9XCJ3aC1kbGctYm9keVwiPlxyXG4gICAgICAgICAgPCEtLSDlvZPliY3ljZXlk4Hlm74gLS0+XHJcbiAgICAgICAgICA8dmlldyBjbGFzcz1cIndoLWRsZy1wcmV2aWV3XCI+XHJcbiAgICAgICAgICAgIDxpbWFnZSA6c3JjPVwidXBsb2FkUHJldmlld1wiIG1vZGU9XCJhc3BlY3RGaXRcIiBjbGFzcz1cIndoLWRsZy1wcmV2aWV3LWltZ1wiIC8+XHJcbiAgICAgICAgICAgIDx2aWV3IHYtaWY9XCJ1cGxvYWREZXRlY3RpbmdcIiBjbGFzcz1cIndoLWRsZy1kZXRlY3RcIj48dGV4dD5BSSDoh6rliqjor4bliKvkuK0uLi48L3RleHQ+PC92aWV3PlxyXG4gICAgICAgICAgPC92aWV3PlxyXG4gICAgICAgICAgPHRleHQgY2xhc3M9XCJ3aC1kbGctcHJldmlldy10aXBcIj7kv67mlLnml7bkvJrkv53nlZnljp/lm77niYfvvIzph43mlrDkuIrkvKDlj6/mm7/mjaLjgII8L3RleHQ+XHJcblxyXG4gICAgICAgICAgPCEtLSDlj4zliJfooajljZUgLS0+XHJcbiAgICAgICAgICA8dmlldyB2LWlmPVwidXBsb2FkUHJldmlldyAmJiAhdXBsb2FkRGV0ZWN0aW5nXCIgY2xhc3M9XCJ3aC1kbGctZm9ybVwiPlxyXG4gICAgICAgICAgICA8dmlldyBjbGFzcz1cIndoLWRsZy1yb3dcIj5cclxuICAgICAgICAgICAgICA8dmlldyBjbGFzcz1cIndoLWRsZy1maWVsZFwiPlxyXG4gICAgICAgICAgICAgICAgPHRleHQgY2xhc3M9XCJ3aC1kbGctbGFiZWxcIj7ljZXlk4HlkI3np7A8L3RleHQ+XHJcbiAgICAgICAgICAgICAgICA8aW5wdXQgY2xhc3M9XCJ3aC1kbGctaW5wdXRcIiA6dmFsdWU9XCJ1cGxvYWRGb3JtLm5hbWVcIiBwbGFjZWhvbGRlcj1cIuS+i++8mueZveiJsuWuveadvuWNsOiKsVTmgaRcIlxyXG4gICAgICAgICAgICAgICAgICAgICAgIEBpbnB1dD1cImUgPT4gb25Gb3JtSW5wdXQoZSwgJ25hbWUnKVwiIC8+XHJcbiAgICAgICAgICAgICAgPC92aWV3PlxyXG4gICAgICAgICAgICAgIDx2aWV3IGNsYXNzPVwid2gtZGxnLWZpZWxkXCI+XHJcbiAgICAgICAgICAgICAgICA8dGV4dCBjbGFzcz1cIndoLWRsZy1sYWJlbFwiPuWTgeexuzwvdGV4dD5cclxuICAgICAgICAgICAgICAgIDxwaWNrZXIgY2xhc3M9XCJ3aC1kbGctcGlja2VyXCIgOnJhbmdlPVwiY2F0TGFiZWxzXCIgQGNoYW5nZT1cIm9uQ2F0Q2hhbmdlXCI+XHJcbiAgICAgICAgICAgICAgICAgIDx0ZXh0IDpjbGFzcz1cIlsnd2gtZGxnLXBpY2stdmFsJywgeyBwbGFjZWhvbGRlcjogIXVwbG9hZEZvcm0uY2F0ZWdvcnkgfV1cIj57eyBjYXRNYXBbdXBsb2FkRm9ybS5jYXRlZ29yeV0gfHwgJ+ivt+mAieaLqScgfX08L3RleHQ+XHJcbiAgICAgICAgICAgICAgICA8L3BpY2tlcj5cclxuICAgICAgICAgICAgICA8L3ZpZXc+XHJcbiAgICAgICAgICAgIDwvdmlldz5cclxuICAgICAgICAgICAgPHZpZXcgY2xhc3M9XCJ3aC1kbGctcm93XCI+XHJcbiAgICAgICAgICAgICAgPHZpZXcgY2xhc3M9XCJ3aC1kbGctZmllbGRcIj5cclxuICAgICAgICAgICAgICAgIDx0ZXh0IGNsYXNzPVwid2gtZGxnLWxhYmVsXCI+6aKc6ImyPC90ZXh0PlxyXG4gICAgICAgICAgICAgICAgPGlucHV0IGNsYXNzPVwid2gtZGxnLWlucHV0XCIgOnZhbHVlPVwidXBsb2FkRm9ybS5jb2xvclwiIHBsYWNlaG9sZGVyPVwi5L6L77ya55m96ImyXCJcclxuICAgICAgICAgICAgICAgICAgICAgICBAaW5wdXQ9XCJlID0+IG9uRm9ybUlucHV0KGUsICdjb2xvcicpXCIgLz5cclxuICAgICAgICAgICAgICA8L3ZpZXc+XHJcbiAgICAgICAgICAgICAgPHZpZXcgY2xhc3M9XCJ3aC1kbGctZmllbGRcIj5cclxuICAgICAgICAgICAgICAgIDx0ZXh0IGNsYXNzPVwid2gtZGxnLWxhYmVsXCI+6aOO5qC8PC90ZXh0PlxyXG4gICAgICAgICAgICAgICAgPGlucHV0IGNsYXNzPVwid2gtZGxnLWlucHV0XCIgOnZhbHVlPVwidXBsb2FkRm9ybS5zdHlsZVwiIHBsYWNlaG9sZGVyPVwi5L6L77ya566A57qmXCJcclxuICAgICAgICAgICAgICAgICAgICAgICBAaW5wdXQ9XCJlID0+IG9uRm9ybUlucHV0KGUsICdzdHlsZScpXCIgLz5cclxuICAgICAgICAgICAgICA8L3ZpZXc+XHJcbiAgICAgICAgICAgIDwvdmlldz5cclxuICAgICAgICAgICAgPHZpZXcgY2xhc3M9XCJ3aC1kbGctcm93XCI+XHJcbiAgICAgICAgICAgICAgPHZpZXcgY2xhc3M9XCJ3aC1kbGctZmllbGRcIj5cclxuICAgICAgICAgICAgICAgIDx0ZXh0IGNsYXNzPVwid2gtZGdsLWxhYmVsXCI+54mI5Z6LPC90ZXh0PlxyXG4gICAgICAgICAgICAgICAgPGlucHV0IGNsYXNzPVwid2gtZGxnLWlucHV0XCIgOnZhbHVlPVwidXBsb2FkRm9ybS5zZWFzb25cIiBwbGFjZWhvbGRlcj1cIuS+i++8muWbm+Wto1wiXHJcbiAgICAgICAgICAgICAgICAgICAgICAgQGlucHV0PVwiZSA9PiBvbkZvcm1JbnB1dChlLCAnc2Vhc29uJylcIiAvPlxyXG4gICAgICAgICAgICAgIDwvdmlldz5cclxuICAgICAgICAgICAgICA8dmlldyBjbGFzcz1cIndoLWRsZy1maWVsZFwiPlxyXG4gICAgICAgICAgICAgICAgPHRleHQgY2xhc3M9XCJ3aC1kbGctbGFiZWxcIj7lraPoioI8L3RleHQ+XHJcbiAgICAgICAgICAgICAgICA8cGlja2VyIGNsYXNzPVwid2gtZGxnLXBpY2tlclwiIG1vZGU9XCJkYXRlXCIgOnZhbHVlPVwicHVyY2hhc2VEYXRlXCIgQGNoYW5nZT1cIm9uUHVyY2hhc2VEYXRlQ2hhbmdlXCI+XHJcbiAgICAgICAgICAgICAgICAgIDx0ZXh0IDpjbGFzcz1cIlsnd2gtZGxnLXBpY2stdmFsJywgeyBwbGFjZWhvbGRlcjogIXB1cmNoYXNlRGF0ZSB9XVwiPnt7IHB1cmNoYXNlRGF0ZSB8fCAn6LSt5YWl5pel5pyfJyB9fTwvdGV4dD5cclxuICAgICAgICAgICAgICAgIDwvcGlja2VyPlxyXG4gICAgICAgICAgICAgIDwvdmlldz5cclxuICAgICAgICAgICAgPC92aWV3PlxyXG4gICAgICAgICAgPC92aWV3PlxyXG5cclxuICAgICAgICAgIDwhLS0g5bqV6YOo5oyJ6ZKuIC0tPlxyXG4gICAgICAgICAgPHZpZXcgY2xhc3M9XCJ3aC1kbGctZm9vdFwiPlxyXG4gICAgICAgICAgICA8dmlldyBjbGFzcz1cIndoLWRsZy1idG4gY2FuY2VsXCIgQGNsaWNrPVwiY2xvc2VVcGxvYWRcIj7lj5bmtog8L3ZpZXc+XHJcbiAgICAgICAgICAgIDx2aWV3IGNsYXNzPVwid2gtZGxnLWJ0biBzYXZlXCIgOmNsYXNzPVwieyBkaXNhYmxlZDogIXVwbG9hZFByZXZpZXcgfVwiIEBjbGljaz1cImNvbmZpcm1VcGxvYWRcIj7kv53lrZjov5nku7booaPmnI08L3ZpZXc+XHJcbiAgICAgICAgICA8L3ZpZXc+XHJcbiAgICAgICAgPC92aWV3PlxyXG4gICAgICA8L3ZpZXc+XHJcbiAgICA8L3ZpZXc+XHJcbiAgPC92aWV3PlxyXG48L3RlbXBsYXRlPlxyXG5cclxuPHNjcmlwdCBzZXR1cD5cclxuaW1wb3J0IHsgcmVmLCBjb21wdXRlZCwgb25Nb3VudGVkLCBzaGFsbG93UmVmLCBtYXJrUmF3LCBuZXh0VGljayB9IGZyb20gJ3Z1ZSdcclxuaW1wb3J0IHsgZ2V0LCBwb3N0LCBkZWwsIHB1dCwgdXBsb2FkIH0gZnJvbSAnLi4vLi4vdXRpbHMvcmVxdWVzdC5qcydcclxuXHJcbmNvbnN0IGN1cnJlbnRWaWV3ID0gcmVmKCd0b2RheScpXHJcbmNvbnN0IGNoYXRJbnB1dCA9IHJlZignJylcclxuY29uc3QgY2hhdExvYWRpbmcgPSByZWYoZmFsc2UpXHJcbmNvbnN0IG1lc3NhZ2VzID0gc2hhbGxvd1JlZihbXSlcclxuXHJcbmNvbnN0IHdhcmRyb2JlID0gcmVmKFtdKVxyXG5jb25zdCB3YXJkcm9iZUZpbHRlciA9IHJlZignYWxsJylcclxuY29uc3QgY29udmVyc2F0aW9ucyA9IHJlZihbXSlcclxuY29uc3Qgc2hvd0hpc3RvcnlEcmF3ZXIgPSByZWYoZmFsc2UpXHJcbmNvbnN0IGRyYXdlck9wZW5lZCA9IHJlZihmYWxzZSlcclxuY29uc3QgYW5hbHlzaXMgPSByZWYobnVsbClcclxuY29uc3Qgc2hvcHBpbmdMaXN0ID0gcmVmKG51bGwpXHJcblxyXG5jb25zdCBub3RpZmljYXRpb25zID0gcmVmKFtdKVxyXG5jb25zdCB1bnJlYWRDb3VudCA9IHJlZigwKVxyXG5jb25zdCBub3RpZnlMb2FkaW5nID0gcmVmKGZhbHNlKVxyXG5cclxuY29uc3Qgc2hvd1VwbG9hZCA9IHJlZihmYWxzZSlcclxuY29uc3QgdXBsb2FkUHJldmlldyA9IHJlZignJylcclxuY29uc3QgdXBsb2FkVGFncyA9IHJlZihudWxsKVxyXG5jb25zdCB1cGxvYWREZXRlY3RpbmcgPSByZWYoZmFsc2UpXHJcbmNvbnN0IHVwbG9hZGVkRmlsZSA9IHJlZignJylcclxuY29uc3QgdXBsb2FkZWRJdGVtSWQgPSByZWYobnVsbClcclxuY29uc3QgcHVyY2hhc2VEYXRlID0gcmVmKCcnKVxyXG5jb25zdCB1cGxvYWRGb3JtID0gcmVmKHsgbmFtZTogJycsIGNhdGVnb3J5OiAndG9wJywgY29sb3I6ICcnLCBzdHlsZTogJycsIHNlYXNvbjogJycgfSlcclxuXHJcbmNvbnN0IHdlYXRoZXJMb2FkaW5nID0gcmVmKGZhbHNlKVxyXG5jb25zdCB3ZWF0aGVyID0gcmVmKHsgdGVtcGVyYXR1cmU6ICctLScsIGRlc2NyaXB0aW9uOiAn5Yqg6L295Lit4oCmJywgY2l0eTogJycsIHdpbmRzcGVlZDogJy0tJywgbG9jYXRlZDogZmFsc2UgfSlcclxuY29uc3QgaG9tZUxvYWRpbmcgPSByZWYoZmFsc2UpXHJcbmNvbnN0IGhvbWVPdXRmaXQgPSByZWYobnVsbClcclxuY29uc3QgdGVtcERpc3BsYXkgPSBjb21wdXRlZCgoKSA9PiB7XHJcbiAgY29uc3QgdCA9IHdlYXRoZXIudmFsdWUudGVtcGVyYXR1cmVcclxuICBpZiAodCA9PT0gJy0tJyB8fCB0ID09PSBudWxsIHx8IHQgPT09IHVuZGVmaW5lZCkgcmV0dXJuICctLSdcclxuICByZXR1cm4gdCArICfCsCdcclxufSlcclxuXHJcbmNvbnN0IG5hdkl0ZW1zID0gW1xyXG4gIHsga2V5OiAndG9kYXknLCBpY29uOiAn8J+PoCcsIGxhYmVsOiAn6aaW6aG1JyB9LFxyXG4gIHsga2V5OiAnY2hhdCcsIGljb246ICfwn5KsJywgbGFiZWw6ICflr7nor50nIH0sXHJcbiAgeyBrZXk6ICd3YXJkcm9iZScsIGljb246ICfwn5GUJywgbGFiZWw6ICfooaPmqbEnIH0sXHJcbiAgeyBrZXk6ICdhbmFseXNpcycsIGljb246ICfwn5OKJywgbGFiZWw6ICfliIbmnpAnIH0sXHJcbiAgeyBrZXk6ICdzaG9wcGluZycsIGljb246ICfwn5uSJywgbGFiZWw6ICfotK3niaknIH0sXHJcbiAgeyBrZXk6ICdwcm9maWxlJywgaWNvbjogJ/CfkaQnLCBsYWJlbDogJ+aIkeeahCcgfSxcclxuXVxyXG5cclxuY29uc3QgY2F0TGlzdCA9IFtcclxuICB7IGs6ICdhbGwnLCBsOiAn5YWo6YOoJyB9LCB7IGs6ICd0b3AnLCBsOiAn5LiK6KOFJyB9LCB7IGs6ICdib3R0b20nLCBsOiAn5LiL6KOFJyB9LFxyXG4gIHsgazogJ3Nob2VzJywgbDogJ+mei+WtkCcgfSwgeyBrOiAnYWNjZXNzb3J5JywgbDogJ+mFjemlsCcgfVxyXG5dXHJcbi8vIOWTgeexu+etm+mAieagh+etvuW4puWKqOaAgeiuoeaVsFxyXG5jb25zdCBjYXRMaXN0V2l0aENvdW50ID0gY29tcHV0ZWQoKCkgPT4ge1xyXG4gIGNvbnN0IHcgPSB3YXJkcm9iZS52YWx1ZVxyXG4gIGNvbnN0IHRvdGFsID0gdy5sZW5ndGhcclxuICBjb25zdCBjb3VudHMgPSB7IGFsbDogdG90YWwgfVxyXG4gIHcuZm9yRWFjaChpID0+IHsgY291bnRzW2kuY2F0ZWdvcnldID0gKGNvdW50c1tpLmNhdGVnb3J5XSB8fCAwKSArIDEgfSlcclxuICByZXR1cm4gY2F0TGlzdC5tYXAoYyA9PiAoeyAuLi5jLCBuOiBjb3VudHNbYy5rXSB8fCAwIH0pKVxyXG59KVxyXG5jb25zdCBjYXRNYXAgPSB7IHRvcDogJ+S4iuijhScsIGJvdHRvbTogJ+S4i+ijhScsIHNob2VzOiAn6Z6L5a2QJywgYWNjZXNzb3J5OiAn6YWN6aWwJyB9XHJcbmNvbnN0IGNhdEtleXMgPSBbJ3RvcCcsICdib3R0b20nLCAnc2hvZXMnLCAnYWNjZXNzb3J5J11cclxuY29uc3QgY2F0TGFiZWxzID0gWyfkuIroo4UnLCAn5LiL6KOFJywgJ+mei+WtkCcsICfphY3ppbAnXVxyXG5cclxuY29uc3QgZmlsdGVyZWRXYXJkcm9iZSA9IGNvbXB1dGVkKCgpID0+IHtcclxuICBpZiAod2FyZHJvYmVGaWx0ZXIudmFsdWUgPT09ICdhbGwnKSByZXR1cm4gd2FyZHJvYmUudmFsdWVcclxuICByZXR1cm4gd2FyZHJvYmUudmFsdWUuZmlsdGVyKGkgPT4gaS5jYXRlZ29yeSA9PT0gd2FyZHJvYmVGaWx0ZXIudmFsdWUpXHJcbn0pXHJcblxyXG5mdW5jdGlvbiBwY3QodiwgdG90YWwpIHtcclxuICBpZiAoIXRvdGFsKSByZXR1cm4gMFxyXG4gIHJldHVybiBNYXRoLnJvdW5kKCh2IC8gdG90YWwpICogMTAwKVxyXG59XHJcblxyXG4vLyA9PT09PSDliIbmnpDpobXlj6/op4bljJYgPT09PT1cclxuY29uc3QgQ0FUX0NOID0geyB0b3A6ICfkuIroo4UnLCBib3R0b206ICfkuIvoo4UnLCBzaG9lczogJ+mei+WtkCcsIGFjY2Vzc29yeTogJ+mFjemlsCcsIG91dGVyOiAn5aSW5aWXJywgZHJlc3M6ICfov57ooaPoo5knLCBiYWc6ICfljIXooosnLCBoYXQ6ICfluL3lrZAnIH1cclxuY29uc3QgUEFMRVRURSA9IFsnIzViOGRlZicsICcjMjJjMWE4JywgJyNmNmE2MDknLCAnI2VmNmY2YycsICcjOWI2ZGZmJywgJyMzZWM2ZTAnLCAnI2Y3OGZiMycsICcjOGFkMDhhJ11cclxuY29uc3QgU0VBU09OX0NOID0geyBzcHJpbmc6ICfmmKUnLCBzdW1tZXI6ICflpI8nLCBhdXR1bW46ICfnp4snLCB3aW50ZXI6ICflhqwnLCBhbGw6ICflm5vlraMnIH1cclxuY29uc3QgU0VBU09OX0NPTE9SID0geyBzcHJpbmc6ICcjN2VkNmE1Jywgc3VtbWVyOiAnI2ZmZDE2NicsIGF1dHVtbjogJyNmNmEwNWEnLCB3aW50ZXI6ICcjNmFiN2ZmJywgYWxsOiAnI2I4YTZlOCcgfVxyXG5jb25zdCBDT0xPUl9IRVggPSB7XHJcbiAgJ+eZveiJsic6ICcjZjVmNWY1JywgJ+eZveiJsuezuyc6ICcjZjVmNWY1JywgJ+m7keiJsic6ICcjMmIyYjJiJywgJ+m7keiJsuezuyc6ICcjMmIyYjJiJywgJ+eBsOiJsic6ICcjOWFhMGE2JywgJ+eBsOiJsuezuyc6ICcjOWFhMGE2JyxcclxuICAn57qi6ImyJzogJyNlZjZmNmMnLCAn57qi6Imy57O7JzogJyNlZjZmNmMnLCAn6JOd6ImyJzogJyM1YjhkZWYnLCAn6JOd6Imy57O7JzogJyM1YjhkZWYnLCAn57u/6ImyJzogJyMyMmMxYTgnLCAn6buE6ImyJzogJyNmNmMyNDQnLFxyXG4gICfnsonoibInOiAnI2Y3OGZiMycsICfntKvoibInOiAnIzliNmRmZicsICfmo5XoibInOiAnI2EwNzEzZicsICfnsbPoibInOiAnI2U3ZDhiZicsICfljaHlhbYnOiAnI2MyYTg3OCcsICfmqZnoibInOiAnI2Y2OTkzYScsICfol4/pnZInOiAnIzM0NDA2YidcclxufVxyXG5cclxuY29uc3QgY2F0ZWdvcnlDaGFydCA9IGNvbXB1dGVkKCgpID0+IHtcclxuICBjb25zdCBkID0gYW5hbHlzaXMudmFsdWVcclxuICBpZiAoIWQgfHwgIWQuY2F0ZWdvcnlfZGlzdHJpYnV0aW9uKSByZXR1cm4geyBpdGVtczogW10sIGdyYWRpZW50OiAnI2ViZWVmNScsIHRvdGFsOiAwIH1cclxuICBjb25zdCBlbnRyaWVzID0gT2JqZWN0LmVudHJpZXMoZC5jYXRlZ29yeV9kaXN0cmlidXRpb24pXHJcbiAgY29uc3QgdG90YWwgPSBkLnRvdGFsX2l0ZW1zIHx8IGVudHJpZXMucmVkdWNlKChzLCBbLCB2XSkgPT4gcyArIHYsIDApXHJcbiAgY29uc3QgaXRlbXMgPSBlbnRyaWVzLm1hcCgoW2ssIHZdLCBpZHgpID0+ICh7XHJcbiAgICByYXc6IGssXHJcbiAgICBuYW1lOiBDQVRfQ05ba10gfHwgayxcclxuICAgIHZhbHVlOiB2LFxyXG4gICAgcGN0OiB0b3RhbCA/IE1hdGgucm91bmQoKHYgLyB0b3RhbCkgKiAxMDApIDogMCxcclxuICAgIGNvbG9yOiBQQUxFVFRFW2lkeCAlIFBBTEVUVEUubGVuZ3RoXVxyXG4gIH0pKVxyXG4gIGxldCBhY2MgPSAwXHJcbiAgY29uc3QgcGFydHMgPSBpdGVtcy5tYXAoaXQgPT4geyBjb25zdCBzID0gYWNjOyBhY2MgKz0gaXQucGN0OyByZXR1cm4gaXQuY29sb3IgKyAnICcgKyBzICsgJyUgJyArIGFjYyArICclJyB9KVxyXG4gIGlmICghcGFydHMubGVuZ3RoKSBwYXJ0cy5wdXNoKCcjZWJlZWY1IDAlIDEwMCUnKVxyXG4gIHJldHVybiB7IGl0ZW1zLCBncmFkaWVudDogJ2NvbmljLWdyYWRpZW50KCcgKyBwYXJ0cy5qb2luKCcsJykgKyAnKScsIHRvdGFsIH1cclxufSlcclxuXHJcbmNvbnN0IHNlYXNvbkNoYXJ0ID0gY29tcHV0ZWQoKCkgPT4ge1xyXG4gIGNvbnN0IGQgPSBhbmFseXNpcy52YWx1ZVxyXG4gIGlmICghZCB8fCAhZC5zZWFzb25fZGlzdHJpYnV0aW9uKSByZXR1cm4gW11cclxuICBjb25zdCB0b3RhbCA9IE9iamVjdC52YWx1ZXMoZC5zZWFzb25fZGlzdHJpYnV0aW9uKS5yZWR1Y2UoKHMsIHYpID0+IHMgKyB2LCAwKVxyXG4gIHJldHVybiBPYmplY3QuZW50cmllcyhkLnNlYXNvbl9kaXN0cmlidXRpb24pLm1hcCgoW2ssIHZdKSA9PiAoe1xyXG4gICAgbmFtZTogU0VBU09OX0NOW2tdIHx8IGssXHJcbiAgICB2YWx1ZTogdixcclxuICAgIHBjdDogdG90YWwgPyBNYXRoLnJvdW5kKCh2IC8gdG90YWwpICogMTAwKSA6IDAsXHJcbiAgICBjb2xvcjogU0VBU09OX0NPTE9SW2tdIHx8ICcjYzBjNGNjJ1xyXG4gIH0pKVxyXG59KVxyXG5cclxuY29uc3QgY29sb3JMaXN0ID0gY29tcHV0ZWQoKCkgPT4ge1xyXG4gIGNvbnN0IGQgPSBhbmFseXNpcy52YWx1ZVxyXG4gIGlmICghZCB8fCAhZC5jb2xvcl9kaXN0cmlidXRpb24pIHJldHVybiBbXVxyXG4gIHJldHVybiBPYmplY3QuZW50cmllcyhkLmNvbG9yX2Rpc3RyaWJ1dGlvbikubWFwKChbaywgdl0pID0+ICh7XHJcbiAgICBuYW1lOiBrLCB2YWx1ZTogdiwgaGV4OiBDT0xPUl9IRVhba10gfHwgJyNjMGM0Y2MnXHJcbiAgfSkpXHJcbn0pXHJcblxyXG5jb25zdCB3YXJkcm9iZVNjb3JlID0gY29tcHV0ZWQoKCkgPT4ge1xyXG4gIGNvbnN0IGQgPSBhbmFseXNpcy52YWx1ZVxyXG4gIGlmICghZCB8fCAhZC50b3RhbF9pdGVtcykgcmV0dXJuIDBcclxuICBjb25zdCB0b3RhbCA9IGQudG90YWxfaXRlbXNcclxuICBjb25zdCB1bnVzZWQgPSAoZC51bnVzZWRfaXRlbXMgfHwgW10pLmxlbmd0aFxyXG4gIGNvbnN0IGR1cGVzID0gKGQuZHVwbGljYXRlX3dhcm5pbmdzIHx8IFtdKS5sZW5ndGhcclxuICBjb25zdCBzY29yZSA9IDEwMCAtICh1bnVzZWQgLyB0b3RhbCkgKiA0NSAtIChkdXBlcyAvIHRvdGFsKSAqIDI1XHJcbiAgcmV0dXJuIE1hdGgubWF4KDAsIE1hdGgubWluKDEwMCwgTWF0aC5yb3VuZChzY29yZSkpKVxyXG59KVxyXG5cclxuY29uc3Qgc2NvcmVDb2xvciA9IGNvbXB1dGVkKCgpID0+IHtcclxuICBjb25zdCBzID0gd2FyZHJvYmVTY29yZS52YWx1ZVxyXG4gIGlmIChzID49IDgwKSByZXR1cm4gJyMyMmMxYTgnXHJcbiAgaWYgKHMgPj0gNjApIHJldHVybiAnI2Y2YTYwOSdcclxuICByZXR1cm4gJyNlZjZmNmMnXHJcbn0pXHJcblxyXG5jb25zdCBzY29yZVRleHQgPSBjb21wdXRlZCgoKSA9PiB7XHJcbiAgY29uc3QgcyA9IHdhcmRyb2JlU2NvcmUudmFsdWVcclxuICBpZiAocyA+PSA4MCkgcmV0dXJuICfooaPmqbHnirbmgIHkvJjnp4AnXHJcbiAgaWYgKHMgPj0gNjApIHJldHVybiAn6KGj5qmx54q25oCB6Imv5aW9J1xyXG4gIHJldHVybiAn6KGj5qmx6ZyA6KaB5pW055CGJ1xyXG59KVxyXG5mdW5jdGlvbiB0YWdDbGFzcyhjKSB7XHJcbiAgcmV0dXJuIGMgPT09ICd0b3AnID8gJycgOiBjID09PSAnYm90dG9tJyA/ICdvaycgOiBjID09PSAnc2hvZXMnID8gJ3dhcm4nIDogJ2luZm8nXHJcbn1cclxuZnVuY3Rpb24gb25DYXRDaGFuZ2UoZSkge1xyXG4gIHVwbG9hZEZvcm0udmFsdWUuY2F0ZWdvcnkgPSBjYXRLZXlzW2UuZGV0YWlsLnZhbHVlXVxyXG59XHJcblxyXG4vLyA9PT09PSDmlbDmja7liqDovb0gPT09PT1cclxuYXN5bmMgZnVuY3Rpb24gZmV0Y2hXYXJkcm9iZSgpIHtcclxuICB0cnkgeyB3YXJkcm9iZS52YWx1ZSA9IGF3YWl0IGdldCgnL3VzZXIvd2FyZHJvYmUnKSB9IGNhdGNoIChlKSB7IGNvbnNvbGUubG9nKGUpIH1cclxufVxyXG5hc3luYyBmdW5jdGlvbiBmZXRjaENvbnZlcnNhdGlvbnMoKSB7XHJcbiAgdHJ5IHsgY29udmVyc2F0aW9ucy52YWx1ZSA9IGF3YWl0IGdldCgnL3VzZXIvY29udmVyc2F0aW9ucycpIH0gY2F0Y2ggKGUpIHt9XHJcbn1cclxuYXN5bmMgZnVuY3Rpb24gZmV0Y2hBbmFseXNpcygpIHtcclxuICB0cnkgeyBhbmFseXNpcy52YWx1ZSA9IGF3YWl0IGdldCgnL3VzZXIvd2FyZHJvYmUtYW5hbHlzaXMnKSB9IGNhdGNoIChlKSB7fVxyXG59XHJcbmFzeW5jIGZ1bmN0aW9uIGZldGNoU2hvcHBpbmdMaXN0KCkge1xyXG4gIHRyeSB7IHNob3BwaW5nTGlzdC52YWx1ZSA9IGF3YWl0IGdldCgnL3VzZXIvc2hvcHBpbmctbGlzdCcpIH0gY2F0Y2ggKGUpIHt9XHJcbn1cclxuXHJcbi8vIOW9k+WJjeeZu+W9leeUqOaIt+eahOecn+WuniBpZO+8iOazqOWGjC/nmbvlvZXml7blhpnlhaUgc3RvcmFnZe+8ie+8jOayoeacieWImeWbnumAgCAxXHJcbmZ1bmN0aW9uIGdldFVzZXJJZCgpIHtcclxuICByZXR1cm4gdW5pLmdldFN0b3JhZ2VTeW5jKCd1c2VyX2lkJykgfHwgMVxyXG59XHJcblxyXG4vLyA9PT09PSDoh6rkuLvmkK3phY3vvIjlpJrpgInlj5booaMgKyBBSSDlrqHmoLjvvIk9PT09PVxyXG5jb25zdCBzZWxlY3RlZElkcyA9IHJlZihbXSlcclxuY29uc3QgcmV2aWV3TG9hZGluZyA9IHJlZihmYWxzZSlcclxuY29uc3QgcmV2aWV3UmVzdWx0ID0gcmVmKG51bGwpXHJcblxyXG5mdW5jdGlvbiBpc1NlbGVjdGVkKGlkKSB7IHJldHVybiBzZWxlY3RlZElkcy52YWx1ZS5pbmNsdWRlcyhpZCkgfVxyXG5mdW5jdGlvbiB0b2dnbGVTZWxlY3QoaWQpIHtcclxuICBjb25zdCBpID0gc2VsZWN0ZWRJZHMudmFsdWUuaW5kZXhPZihpZClcclxuICBpZiAoaSA+PSAwKSBzZWxlY3RlZElkcy52YWx1ZS5zcGxpY2UoaSwgMSlcclxuICBlbHNlIHNlbGVjdGVkSWRzLnZhbHVlLnB1c2goaWQpXHJcbiAgLy8g5YiH5o2i6YCJ5oup5pe25riF56m65LiK5LiA5qyh5a6h5qC457uT5p6cXHJcbiAgcmV2aWV3UmVzdWx0LnZhbHVlID0gbnVsbFxyXG59XHJcbmZ1bmN0aW9uIGNsZWFyU2VsZWN0aW9uKCkge1xyXG4gIHNlbGVjdGVkSWRzLnZhbHVlID0gW11cclxuICByZXZpZXdSZXN1bHQudmFsdWUgPSBudWxsXHJcbn1cclxuY29uc3Qgb3V0Zml0U2NvcmVDb2xvciA9IGNvbXB1dGVkKCgpID0+IHtcclxuICBjb25zdCBzID0gcmV2aWV3UmVzdWx0LnZhbHVlICYmIHJldmlld1Jlc3VsdC52YWx1ZS5zY29yZVxyXG4gIGlmICghcykgcmV0dXJuICcjOTA5Mzk5J1xyXG4gIGlmIChzID49IDgpIHJldHVybiAnIzY3YzIzYSdcclxuICBpZiAocyA+PSA2KSByZXR1cm4gJyNlNmEyM2MnXHJcbiAgcmV0dXJuICcjZjU2YzZjJ1xyXG59KVxyXG5jb25zdCBvdXRmaXRTY29yZVJpbmcgPSBjb21wdXRlZCgoKSA9PiB7XHJcbiAgY29uc3QgcyA9IHJldmlld1Jlc3VsdC52YWx1ZSAmJiByZXZpZXdSZXN1bHQudmFsdWUuc2NvcmVcclxuICBjb25zdCBwY3QgPSBzID8gTWF0aC5tYXgoMCwgTWF0aC5taW4oMTAwLCBzICogMTApKSA6IDBcclxuICByZXR1cm4gYGNvbmljLWdyYWRpZW50KCR7b3V0Zml0U2NvcmVDb2xvci52YWx1ZX0gJHtwY3R9JSwgI2ViZWVmNSAke3BjdH0lKWBcclxufSlcclxuYXN5bmMgZnVuY3Rpb24gcmV2aWV3T3V0Zml0KCkge1xyXG4gIGlmIChzZWxlY3RlZElkcy52YWx1ZS5sZW5ndGggPCAyKSB7XHJcbiAgICB1bmkuc2hvd1RvYXN0KHsgdGl0bGU6ICfoh7PlsJHpgInmi6kgMiDku7booaPniaknLCBpY29uOiAnbm9uZScgfSlcclxuICAgIHJldHVyblxyXG4gIH1cclxuICByZXZpZXdMb2FkaW5nLnZhbHVlID0gdHJ1ZVxyXG4gIHJldmlld1Jlc3VsdC52YWx1ZSA9IG51bGxcclxuICB0cnkge1xyXG4gICAgY29uc3QgZCA9IGF3YWl0IHBvc3QoJy91c2VyL291dGZpdC1yZXZpZXcnLCB7IGlkczogc2VsZWN0ZWRJZHMudmFsdWUgfSlcclxuICAgIHJldmlld1Jlc3VsdC52YWx1ZSA9IGRcclxuICB9IGNhdGNoIChlKSB7XHJcbiAgICB1bmkuc2hvd1RvYXN0KHsgdGl0bGU6ICflrqHmoLjlpLHotKXvvIzor7fph43or5UnLCBpY29uOiAnbm9uZScgfSlcclxuICB9XHJcbiAgcmV2aWV3TG9hZGluZy52YWx1ZSA9IGZhbHNlXHJcbn1cclxuXHJcbi8vID09PT09IOaQremFjeWFpeWPo++8muS6jOmAieS4gCA9PT09PVxyXG4vLyDorqkgQUkg5biu5L2g5pCt77ya6aKE5aGr5LiA5Y+l6ZyA5rGC5bm26Lez5Yiw5a+56K+d5qCPXHJcbmZ1bmN0aW9uIGFpSGVscE91dGZpdCgpIHtcclxuICBjaGF0SW5wdXQudmFsdWUgPSAn5biu5oiR5pCt6YWN5LiA6Lqr5ZCI6YCC55qE6KGj5pyNJ1xyXG4gIHN3aXRjaFZpZXcoJ2NoYXQnKVxyXG59XHJcbi8vIOiHquW3seaQremFjSArIEFJIOWuoeaguO+8mui/m+WFpeWkmumAieeVjOmdolxyXG5mdW5jdGlvbiBzdGFydFNlbGZPdXRmaXQoKSB7XHJcbiAgc3dpdGNoVmlldygnb3V0Zml0JylcclxufVxyXG5cclxuLy8gPT09PT0g6YCa55+l5Lit5b+DID09PT09XHJcbmFzeW5jIGZ1bmN0aW9uIGZldGNoTm90aWZpY2F0aW9ucygpIHtcclxuICB0cnkgeyBub3RpZmljYXRpb25zLnZhbHVlID0gYXdhaXQgZ2V0KCcvdXNlci9ub3RpZmljYXRpb25zP3VzZXJfaWQ9JyArIGdldFVzZXJJZCgpKSB9IGNhdGNoIChlKSB7IGNvbnNvbGUubG9nKGUpIH1cclxufVxyXG5hc3luYyBmdW5jdGlvbiBmZXRjaFVucmVhZCgpIHtcclxuICB0cnkge1xyXG4gICAgY29uc3QgZCA9IGF3YWl0IGdldCgnL3VzZXIvbm90aWZpY2F0aW9ucy91bnJlYWQtY291bnQ/dXNlcl9pZD0nICsgZ2V0VXNlcklkKCkpXHJcbiAgICB1bnJlYWRDb3VudC52YWx1ZSA9IGQuY291bnQgfHwgMFxyXG4gIH0gY2F0Y2ggKGUpIHt9XHJcbn1cclxuZnVuY3Rpb24gbm90aVR5cGVMYWJlbCh0KSB7XHJcbiAgcmV0dXJuICh7XHJcbiAgICBtb250aGx5X3JlcG9ydDogJ+iho+apseaciOaKpScsIHRyZW5kX3B1c2g6ICfnqb/mkK3ng63ngrknLCBzeXN0ZW06ICfns7vnu58nXHJcbiAgfSlbdF0gfHwgJ+mAmuefpSdcclxufVxyXG5hc3luYyBmdW5jdGlvbiBvbk5vdGlDbGljayhuKSB7XHJcbiAgaWYgKCFuLmlzX3JlYWQpIHtcclxuICAgIG4uaXNfcmVhZCA9IHRydWVcclxuICAgIHVucmVhZENvdW50LnZhbHVlID0gTWF0aC5tYXgoMCwgdW5yZWFkQ291bnQudmFsdWUgLSAxKVxyXG4gICAgdHJ5IHsgYXdhaXQgcG9zdCgnL3VzZXIvbm90aWZpY2F0aW9ucy8nICsgbi5pZCArICcvcmVhZCcpIH0gY2F0Y2ggKGUpIHt9XHJcbiAgfVxyXG59XHJcbmFzeW5jIGZ1bmN0aW9uIG1hcmtBbGxSZWFkKCkge1xyXG4gIHRyeSB7XHJcbiAgICBhd2FpdCBwb3N0KCcvdXNlci9ub3RpZmljYXRpb25zL3JlYWQtYWxsJylcclxuICAgIG5vdGlmaWNhdGlvbnMudmFsdWUuZm9yRWFjaCh4ID0+IHsgeC5pc19yZWFkID0gdHJ1ZSB9KVxyXG4gICAgdW5yZWFkQ291bnQudmFsdWUgPSAwXHJcbiAgICB1bmkuc2hvd1RvYXN0KHsgdGl0bGU6ICflt7Llhajpg6jmoIforrDlt7Lor7snLCBpY29uOiAnc3VjY2VzcycgfSlcclxuICB9IGNhdGNoIChlKSB7fVxyXG59XHJcblxyXG4vLyA9PT09PSDlm77niYfpgInmi6nvvIh1bmkg5Y6f55Sf77yM5pSv5oyB5ouN54WnK+ebuOWGjO+8iT09PT09XHJcbmZ1bmN0aW9uIGNob29zZUltYWdlKCkge1xyXG4gIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICB1bmkuY2hvb3NlSW1hZ2Uoe1xyXG4gICAgICBjb3VudDogMSxcclxuICAgICAgc291cmNlVHlwZTogWydhbGJ1bScsICdjYW1lcmEnXSxcclxuICAgICAgc3VjY2VzczogKHJlcykgPT4gcmVzb2x2ZShyZXMudGVtcEZpbGVQYXRoc1swXSksXHJcbiAgICAgIGZhaWw6IChlcnIpID0+IHJlamVjdChlcnIpXHJcbiAgICB9KVxyXG4gIH0pXHJcbn1cclxuXHJcbi8vID09PT09IOWvueivnSA9PT09PVxyXG5mdW5jdGlvbiBvbkNoYXRJbnB1dChlKSB7XHJcbiAgY29uc3QgdiA9IGUgJiYgZS5kZXRhaWwgJiYgdHlwZW9mIGUuZGV0YWlsLnZhbHVlID09PSAnc3RyaW5nJyA/IGUuZGV0YWlsLnZhbHVlIDogZSAmJiB0eXBlb2YgZS50YXJnZXQudmFsdWUgPT09ICdzdHJpbmcnID8gZS50YXJnZXQudmFsdWUgOiBTdHJpbmcoZSB8fCAnJylcclxuICBjaGF0SW5wdXQudmFsdWUgPSB2XHJcbn1cclxuZnVuY3Rpb24gb25DaGF0Q29uZmlybSgpIHsgc2VuZENoYXQoKSB9XHJcbmZ1bmN0aW9uIG9uQ2hhdFNlbmQoKSB7IHNlbmRDaGF0KCkgfVxyXG5mdW5jdGlvbiBvbkZvcm1JbnB1dChlLCBrZXkpIHtcclxuICBjb25zdCB2ID0gZSAmJiBlLmRldGFpbCAmJiB0eXBlb2YgZS5kZXRhaWwudmFsdWUgPT09ICdzdHJpbmcnID8gZS5kZXRhaWwudmFsdWUgOiBlICYmIHR5cGVvZiBlLnRhcmdldC52YWx1ZSA9PT0gJ3N0cmluZycgPyBlLnRhcmdldC52YWx1ZSA6IFN0cmluZyhlIHx8ICcnKVxyXG4gIHVwbG9hZEZvcm0udmFsdWVba2V5XSA9IHZcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gc2VuZENoYXQodGV4dCkge1xyXG4gIGNvbnN0IHEgPSAodHlwZW9mIHRleHQgPT09ICdzdHJpbmcnID8gdGV4dCA6IGNoYXRJbnB1dC52YWx1ZSkudHJpbSgpXHJcbiAgaWYgKCFxIHx8IGNoYXRMb2FkaW5nLnZhbHVlKSByZXR1cm5cclxuICBjaGF0SW5wdXQudmFsdWUgPSAnJ1xyXG4gIG1lc3NhZ2VzLnZhbHVlLnB1c2gobWFya1Jhdyh7IHJvbGU6ICd1c2VyJywgY29udGVudDogcSB9KSlcclxuICBjaGF0TG9hZGluZy52YWx1ZSA9IHRydWVcclxuICB0cnkge1xyXG4gICAgY29uc3QgZCA9IGF3YWl0IGdldCgnL3VzZXIvY2hhdD91c2VyX2lucHV0PScgKyBlbmNvZGVVUklDb21wb25lbnQocSkpXHJcbiAgICBtZXNzYWdlcy52YWx1ZS5wdXNoKG1hcmtSYXcoeyByb2xlOiAnYWdlbnQnLCBjb250ZW50OiBkLnJlc3BvbnNlLCBjaWQ6IGQuY29udmVyc2F0aW9uX2lkLCByYXRpbmc6IDAsIGltYWdlOiBkLm91dGZpdF9pbWFnZSB8fCAnJyB9KSlcclxuICAgIGZldGNoQ29udmVyc2F0aW9ucygpXHJcbiAgfSBjYXRjaCAoZSkge1xyXG4gICAgbWVzc2FnZXMudmFsdWUucHVzaChtYXJrUmF3KHsgcm9sZTogJ2FnZW50JywgY29udGVudDogJ+ivt+axguWksei0pe+8jOivt+ajgOafpeWQjuerrycgfSkpXHJcbiAgfVxyXG4gIGNoYXRMb2FkaW5nLnZhbHVlID0gZmFsc2VcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gY2hhdENob29zZUltYWdlKCkge1xyXG4gIHRyeSB7XHJcbiAgICBjb25zdCBwYXRoID0gYXdhaXQgY2hvb3NlSW1hZ2UoKVxyXG4gICAgY29uc3QgZCA9IGF3YWl0IHVwbG9hZCgnL3VzZXIvYW5hbHl6ZS1pbWFnZScsIHBhdGgpXHJcbiAgICBtZXNzYWdlcy52YWx1ZS5wdXNoKG1hcmtSYXcoeyByb2xlOiAndXNlcicsIGNvbnRlbnQ6ICfkuIrkvKDkuobkuIDlvKDlm77niYfor7fliIbmnpDmkK3phY0nLCBpbWFnZTogcGF0aCB9KSlcclxuICAgIGNoYXRMb2FkaW5nLnZhbHVlID0gdHJ1ZVxyXG4gICAgY29uc3QgZDIgPSBhd2FpdCBnZXQoJy91c2VyL2NoYXQ/dXNlcl9pbnB1dD0nICsgZW5jb2RlVVJJQ29tcG9uZW50KCfor7fliIbmnpDov5nlvKDlm77niYflubbmjqjojZDmkK3phY3mlrnmoYjjgILor4bliKvnu5PmnpzvvJonICsgKGQuYW5hbHlzaXMgfHwgJycpKSlcclxuICAgIG1lc3NhZ2VzLnZhbHVlLnB1c2gobWFya1Jhdyh7IHJvbGU6ICdhZ2VudCcsIGNvbnRlbnQ6IGQyLnJlc3BvbnNlLCBjaWQ6IGQyLmNvbnZlcnNhdGlvbl9pZCwgcmF0aW5nOiAwLCBpbWFnZTogZDIub3V0Zml0X2ltYWdlIHx8ICcnIH0pKVxyXG4gICAgZmV0Y2hDb252ZXJzYXRpb25zKClcclxuICAgIGNoYXRMb2FkaW5nLnZhbHVlID0gZmFsc2VcclxuICB9IGNhdGNoIChlKSB7XHJcbiAgICB1bmkuc2hvd1RvYXN0KHsgdGl0bGU6ICflm77niYfliIbmnpDlpLHotKUnLCBpY29uOiAnbm9uZScgfSlcclxuICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHJhdGVCeUluZGV4KGksIHNjb3JlKSB7XHJcbiAgY29uc3QgbXNnID0gbWVzc2FnZXMudmFsdWVbaV1cclxuICBpZiAoIW1zZyB8fCAhbXNnLmNpZCkgcmV0dXJuXHJcbiAgbXNnLnJhdGluZyA9IHNjb3JlXHJcbiAgbWVzc2FnZXMudmFsdWUgPSBbLi4ubWVzc2FnZXMudmFsdWVdXHJcbiAgdHJ5IHtcclxuICAgIHBvc3QoJy91c2VyL2NvbnZlcnNhdGlvbnMvcmF0ZScsIHsgY29udmVyc2F0aW9uX2lkOiBtc2cuY2lkLCBzY29yZSB9KVxyXG4gICAgdW5pLnNob3dUb2FzdCh7IHRpdGxlOiAn6K+E5YiG5bey5o+Q5LqkJywgaWNvbjogJ3N1Y2Nlc3MnIH0pXHJcbiAgfSBjYXRjaCAoZSkge31cclxufVxyXG5cclxuY29uc3QgcHJvZmlsZSA9IHJlZih7IG5pY2tuYW1lOiAnJywgdXNlcm5hbWU6ICcnLCByb2xlOiAnJyB9KVxyXG5mdW5jdGlvbiBsb2FkUHJvZmlsZSgpIHtcclxuICAvLyDlhYjnlKjmnKzlnLDnvJPlrZjlv6vpgJ/mmL7npLrvvIzlho3lvILmraXku47lkI7nq6/mi4nlj5bmnIDmlrDmmLXnp7Dopobnm5ZcclxuICBwcm9maWxlLnZhbHVlID0ge1xyXG4gICAgbmlja25hbWU6IHVuaS5nZXRTdG9yYWdlU3luYygnbmlja25hbWUnKSB8fCAnJyxcclxuICAgIHVzZXJuYW1lOiB1bmkuZ2V0U3RvcmFnZVN5bmMoJ3VzZXJuYW1lJykgfHwgJycsXHJcbiAgICByb2xlOiB1bmkuZ2V0U3RvcmFnZVN5bmMoJ3JvbGUnKSB8fCAnJ1xyXG4gIH1cclxuICByZWZyZXNoUHJvZmlsZSgpXHJcbn1cclxuYXN5bmMgZnVuY3Rpb24gcmVmcmVzaFByb2ZpbGUoKSB7XHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IG1lID0gYXdhaXQgZ2V0KCcvYXV0aC9tZScpXHJcbiAgICBwcm9maWxlLnZhbHVlID0ge1xyXG4gICAgICBuaWNrbmFtZTogbWUubmlja25hbWUgfHwgcHJvZmlsZS52YWx1ZS5uaWNrbmFtZSxcclxuICAgICAgdXNlcm5hbWU6IG1lLnVzZXJuYW1lIHx8IHByb2ZpbGUudmFsdWUudXNlcm5hbWUsXHJcbiAgICAgIHJvbGU6IG1lLnJvbGUgfHwgcHJvZmlsZS52YWx1ZS5yb2xlXHJcbiAgICB9XHJcbiAgICAvLyDlkIzmraXlm57mnKzlnLDvvIzkv53or4HlhbblroPpobXpnaIv5ZCO57ut6K+75Y+W5LiA6Ie0XHJcbiAgICB1bmkuc2V0U3RvcmFnZVN5bmMoJ25pY2tuYW1lJywgcHJvZmlsZS52YWx1ZS5uaWNrbmFtZSlcclxuICAgIHVuaS5zZXRTdG9yYWdlU3luYygndXNlcm5hbWUnLCBwcm9maWxlLnZhbHVlLnVzZXJuYW1lKVxyXG4gIH0gY2F0Y2ggKGUpIHtcclxuICAgIC8vIOaLieWPluWksei0peWImee7tOaMgeacrOWcsOe8k+WtmFxyXG4gIH1cclxufVxyXG5cclxuZnVuY3Rpb24gbG9nb3V0KCkge1xyXG4gIHVuaS5yZW1vdmVTdG9yYWdlU3luYygndG9rZW4nKVxyXG4gIHVuaS5yZW1vdmVTdG9yYWdlU3luYygncm9sZScpXHJcbiAgdW5pLnJlbW92ZVN0b3JhZ2VTeW5jKCduaWNrbmFtZScpXHJcbiAgdW5pLnJlbW92ZVN0b3JhZ2VTeW5jKCd1c2VybmFtZScpXHJcbiAgdW5pLnJlbW92ZVN0b3JhZ2VTeW5jKCd1c2VyX2lkJylcclxuICB1bmkucmVMYXVuY2goeyB1cmw6ICcvcGFnZXMvbG9naW4vaW5kZXgnIH0pXHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdvV2FyZHJvYmUoKSB7IGN1cnJlbnRWaWV3LnZhbHVlID0gJ3dhcmRyb2JlJyB9XHJcbmZ1bmN0aW9uIHN3aXRjaFZpZXcoa2V5KSB7XHJcbiAgY3VycmVudFZpZXcudmFsdWUgPSBrZXlcclxuICBpZiAoa2V5ID09PSAnbm90aWZ5Jykge1xyXG4gICAgZmV0Y2hOb3RpZmljYXRpb25zKClcclxuICAgIGZldGNoVW5yZWFkKClcclxuICB9IGVsc2UgaWYgKGtleSA9PT0gJ3Byb2ZpbGUnKSB7XHJcbiAgICBsb2FkUHJvZmlsZSgpXHJcbiAgfVxyXG59XHJcbmZ1bmN0aW9uIHNldEZpbHRlcihrKSB7IHdhcmRyb2JlRmlsdGVyLnZhbHVlID0gayB9XHJcbmZ1bmN0aW9uIGNsb3NlVXBsb2FkKCkgeyBzaG93VXBsb2FkLnZhbHVlID0gZmFsc2UgfVxyXG5cclxuLy8gPT09PT0g6aaW6aG177ya5a6a5L2N5aSp5rCUICsg5oyJ5aSp5rCU5LuO6KGj5qmx5oyR5pCt6YWNID09PT09XHJcbmZ1bmN0aW9uIGdldExvY2F0aW9uKCkge1xyXG4gIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICB1bmkuZ2V0TG9jYXRpb24oeyB0eXBlOiAnd2dzODQnLCBzdWNjZXNzOiByID0+IHJlc29sdmUociksIGZhaWw6IGUgPT4gcmVqZWN0KGUpIH0pXHJcbiAgfSlcclxufVxyXG5hc3luYyBmdW5jdGlvbiBmZXRjaFdlYXRoZXIobGF0LCBsb24pIHtcclxuICBjb25zdCB1cmwgPSBgaHR0cHM6Ly9hcGkub3Blbi1tZXRlby5jb20vdjEvZm9yZWNhc3Q/bGF0aXR1ZGU9JHtsYXR9JmxvbmdpdHVkZT0ke2xvbn0mY3VycmVudF93ZWF0aGVyPXRydWVgXHJcbiAgY29uc3QgciA9IGF3YWl0IGZldGNoKHVybClcclxuICByZXR1cm4gYXdhaXQgci5qc29uKClcclxufVxyXG5hc3luYyBmdW5jdGlvbiByZXZlcnNlR2VvY29kZShsYXQsIGxvbikge1xyXG4gIGNvbnN0IHVybCA9IGBodHRwczovL2FwaS5iaWdkYXRhY2xvdWQubmV0L2RhdGEvcmV2ZXJzZS1nZW9jb2RlLWNsaWVudD9sYXRpdHVkZT0ke2xhdH0mbG9uZ2l0dWRlPSR7bG9ufSZsb2NhbGl0eUxhbmd1YWdlPXpoYFxyXG4gIGNvbnN0IHIgPSBhd2FpdCBmZXRjaCh1cmwpXHJcbiAgcmV0dXJuIGF3YWl0IHIuanNvbigpXHJcbn1cclxuZnVuY3Rpb24gd2VhdGhlclRleHQoY29kZSkge1xyXG4gIGNvbnN0IG0gPSB7XHJcbiAgICAwOiAn5pm0JywgMTogJ+aZtOmXtOWkmuS6kScsIDI6ICflsYDpg6jlpJrkupEnLCAzOiAn6Zi0JyxcclxuICAgIDQ1OiAn6Zu+JywgNDg6ICfpm77lh4cnLCA1MTogJ+avm+avm+mbqCcsIDUzOiAn5q+b5q+b6ZuoJywgNTU6ICfmr5vmr5vpm6gnLFxyXG4gICAgNjE6ICflsI/pm6gnLCA2MzogJ+S4rembqCcsIDY1OiAn5aSn6ZuoJywgNjY6ICflhrvpm6gnLCA2NzogJ+WGu+mbqCcsXHJcbiAgICA3MTogJ+Wwj+mbqicsIDczOiAn5Lit6ZuqJywgNzU6ICflpKfpm6onLCA3NzogJ+mbqueykicsXHJcbiAgICA4MDogJ+mYtembqCcsIDgxOiAn6Zi16ZuoJywgODI6ICflvLrpmLXpm6gnLCA4NTogJ+mYtembqicsIDg2OiAn6Zi16ZuqJyxcclxuICAgIDk1OiAn6Zu36Zi16ZuoJywgOTY6ICfpm7fpmLXpm6jkvLTlhrDpm7knLCA5OTogJ+mbt+mYtembqOS8tOWGsOmbuSdcclxuICB9XHJcbiAgcmV0dXJuIG1bY29kZV0gIT09IHVuZGVmaW5lZCA/IG1bY29kZV0gOiAn5pyq55+lJ1xyXG59XHJcbmFzeW5jIGZ1bmN0aW9uIGxvYWRXZWF0aGVyKCkge1xyXG4gIHdlYXRoZXJMb2FkaW5nLnZhbHVlID0gdHJ1ZVxyXG4gIC8vIOiHquWKqOWwneivleWumuS9je+8iOW4piA0cyDotoXml7bvvInvvIzlpLHotKUv6LaF5pe2L+iiq+aLkumDveWbnumAgOm7mOiupOWfjuW4gu+8jOe7neS4jeWNoeS9j1xyXG4gIGxldCBsYXQgPSAzOS45MDQyLCBsb24gPSAxMTYuNDA3NCwgbG9jYXRlZCA9IGZhbHNlLCBjaXR5ID0gJ+WMl+S6rCdcclxuICB0cnkge1xyXG4gICAgY29uc3QgbG9jID0gYXdhaXQgUHJvbWlzZS5yYWNlKFtcclxuICAgICAgZ2V0TG9jYXRpb24oKSxcclxuICAgICAgbmV3IFByb21pc2UoKF8sIHJlaikgPT4gc2V0VGltZW91dCgoKSA9PiByZWoobmV3IEVycm9yKCd0aW1lb3V0JykpLCA0MDAwKSlcclxuICAgIF0pXHJcbiAgICBsYXQgPSBsb2MubGF0aXR1ZGVcclxuICAgIGxvbiA9IGxvYy5sb25naXR1ZGVcclxuICAgIGxvY2F0ZWQgPSB0cnVlXHJcbiAgfSBjYXRjaCAoZSkge1xyXG4gICAgLy8g5a6a5L2N6KKr5ouSL+i2heaXti/kuI3lj6/nlKjvvJrpgIDlm57pu5jorqTln47luILvvIjljJfkuqzvvIlcclxuICB9XHJcbiAgbGV0IHd4ID0gbnVsbCwgZ2VvID0gbnVsbFxyXG4gIHRyeSB7IHd4ID0gYXdhaXQgZmV0Y2hXZWF0aGVyKGxhdCwgbG9uKSB9IGNhdGNoIChlKSB7IHd4ID0gbnVsbCB9XHJcbiAgdHJ5IHsgZ2VvID0gYXdhaXQgcmV2ZXJzZUdlb2NvZGUobGF0LCBsb24pIH0gY2F0Y2ggKGUpIHsgZ2VvID0gbnVsbCB9XHJcbiAgaWYgKGdlbyAmJiAoZ2VvLmNpdHkgfHwgZ2VvLmxvY2FsaXR5KSkgY2l0eSA9IGdlby5jaXR5IHx8IGdlby5sb2NhbGl0eVxyXG4gIGNvbnN0IGN3ID0gd3ggJiYgd3guY3VycmVudF93ZWF0aGVyXHJcbiAgd2VhdGhlci52YWx1ZSA9IHtcclxuICAgIGNpdHksIGxvY2F0ZWQsXHJcbiAgICB0ZW1wZXJhdHVyZTogY3cgPyBjdy50ZW1wZXJhdHVyZSA6ICctLScsXHJcbiAgICBkZXNjcmlwdGlvbjogY3cgPyB3ZWF0aGVyVGV4dChjdy53ZWF0aGVyY29kZSkgOiAn5aSp5rCU6I635Y+W5aSx6LSlJyxcclxuICAgIHdpbmRzcGVlZDogY3cgPyBjdy53aW5kc3BlZWQgOiAnLS0nXHJcbiAgfVxyXG4gIHdlYXRoZXJMb2FkaW5nLnZhbHVlID0gZmFsc2VcclxuICAvLyDlpKnmsJTmi7/liLDlkI7vvIznm7TmjqXmjInlpKnmsJTku47ooaPmqbHmjJHkuIDlpZfmkK3phY1cclxuICBsb2FkSG9tZU91dGZpdChmYWxzZSlcclxufVxyXG5hc3luYyBmdW5jdGlvbiBsb2FkSG9tZU91dGZpdChyYW5kb21QaWNrID0gZmFsc2UpIHtcclxuICBob21lTG9hZGluZy52YWx1ZSA9IHRydWVcclxuICB0cnkge1xyXG4gICAgY29uc3Qgd3ggPSB3ZWF0aGVyLnZhbHVlXHJcbiAgICBjb25zdCB0ZW1wID0gKHR5cGVvZiB3eC50ZW1wZXJhdHVyZSA9PT0gJ251bWJlcicpID8gd3gudGVtcGVyYXR1cmUgOiBudWxsXHJcbiAgICBjb25zdCB3ID0gKHd4LmRlc2NyaXB0aW9uICYmIHd4LmRlc2NyaXB0aW9uICE9PSAn5pyq55+lJyAmJiB3eC5kZXNjcmlwdGlvbiAhPT0gJ+WkqeawlOiOt+WPluWksei0pScpID8gd3guZGVzY3JpcHRpb24gOiAnJ1xyXG4gICAgY29uc3QgY2l0eSA9IHd4LmNpdHkgfHwgJydcclxuICAgIGxldCB1cmwgPSBgL3VzZXIvb3V0Zml0LWJ5LXdlYXRoZXI/dXNlcl9pZD0ke2dldFVzZXJJZCgpfSZyYW5kb21fcGljaz0ke3JhbmRvbVBpY2sgPyAndHJ1ZScgOiAnZmFsc2UnfWBcclxuICAgIGlmICh0ZW1wICE9PSBudWxsKSB1cmwgKz0gYCZ0ZW1wPSR7dGVtcH1gXHJcbiAgICBpZiAodykgdXJsICs9IGAmd2VhdGhlcj0ke2VuY29kZVVSSUNvbXBvbmVudCh3KX1gXHJcbiAgICBpZiAoY2l0eSkgdXJsICs9IGAmY2l0eT0ke2VuY29kZVVSSUNvbXBvbmVudChjaXR5KX1gXHJcbiAgICBjb25zdCBkID0gYXdhaXQgZ2V0KHVybClcclxuICAgIGhvbWVPdXRmaXQudmFsdWUgPSBkXHJcbiAgfSBjYXRjaCAoZSkge1xyXG4gICAgaG9tZU91dGZpdC52YWx1ZSA9IHsgdGV4dDogJ+aQremFjeiOt+WPluWksei0pe+8jOivt+eojeWQjumHjeivlScsIGltYWdlX3VybDogJycsIGl0ZW1zOiBbXSB9XHJcbiAgfVxyXG4gIGhvbWVMb2FkaW5nLnZhbHVlID0gZmFsc2VcclxufVxyXG5cclxuLy8gPT09PT0g6KGj5qmx5LiK5LygIC8g5oqg5Zu+ID09PT09XHJcbmZ1bmN0aW9uIG9wZW5VcGxvYWQoKSB7IHNob3dVcGxvYWQudmFsdWUgPSB0cnVlIH1cclxuYXN5bmMgZnVuY3Rpb24gY2hvb3NlV2FyZHJvYmVJbWFnZSgpIHtcclxuICB0cnkge1xyXG4gICAgY29uc3QgcGF0aCA9IGF3YWl0IGNob29zZUltYWdlKClcclxuICAgIHVwbG9hZFByZXZpZXcudmFsdWUgPSBwYXRoXHJcbiAgICB1cGxvYWRlZEZpbGUudmFsdWUgPSBwYXRoXHJcbiAgICB1cGxvYWREZXRlY3RpbmcudmFsdWUgPSB0cnVlXHJcbiAgICBjb25zdCBkID0gYXdhaXQgdXBsb2FkKCcvdXNlci93YXJkcm9iZS91cGxvYWQtYW5kLXRhZycsIHBhdGgpXHJcbiAgICB1cGxvYWRlZEl0ZW1JZC52YWx1ZSA9IGQuaXRlbSA/IGQuaXRlbS5pZCA6IG51bGxcclxuICAgIGlmIChkLmR1cGxpY2F0ZV93YXJuaW5nICYmIGQuZHVwbGljYXRlX3dhcm5pbmcubGVuZ3RoKSB7XHJcbiAgICAgIHVuaS5zaG93TW9kYWwoe1xyXG4gICAgICAgIHRpdGxlOiAn6YeN5aSN6LSt5Lmw5o+Q6YaSJyxcclxuICAgICAgICBjb250ZW50OiAn6KGj5qmx6YeM5bey57uP5pyJ57G75Ly855qE77yaJyArIGQuZHVwbGljYXRlX3dhcm5pbmcuam9pbign44CBJykgKyAn44CCXFxu56Gu6K6k5piv5ZCm6ZyA6KaB6YeN5aSN5oul5pyJ77yfJyxcclxuICAgICAgICBzaG93Q2FuY2VsOiBmYWxzZVxyXG4gICAgICB9KVxyXG4gICAgfVxyXG4gICAgaWYgKGQudGFncykge1xyXG4gICAgICB1cGxvYWRGb3JtLnZhbHVlID0ge1xyXG4gICAgICAgIG5hbWU6IGQudGFncy5uYW1lIHx8ICcnLFxyXG4gICAgICAgIGNhdGVnb3J5OiBkLnRhZ3MuY2F0ZWdvcnkgfHwgJ3RvcCcsXHJcbiAgICAgICAgY29sb3I6IGQudGFncy5jb2xvciB8fCAnJyxcclxuICAgICAgICBzdHlsZTogZC50YWdzLnN0eWxlIHx8ICcnLFxyXG4gICAgICAgIHNlYXNvbjogZC50YWdzLnNlYXNvbiB8fCAnJ1xyXG4gICAgICB9XHJcbiAgICAgIHVwbG9hZFRhZ3MudmFsdWUgPSBkLnRhZ3NcclxuICAgICAgdW5pLnNob3dUb2FzdCh7IHRpdGxlOiAnQUnor4bliKvlrozmiJDvvIzor7fnoa7orqTlkI7kv53lrZgnLCBpY29uOiAnbm9uZScgfSlcclxuICAgIH1cclxuICB9IGNhdGNoIChlKSB7XHJcbiAgICB1cGxvYWRUYWdzLnZhbHVlID0ge31cclxuICAgIHVwbG9hZEZvcm0udmFsdWUgPSB7IG5hbWU6ICcnLCBjYXRlZ29yeTogJ3RvcCcsIGNvbG9yOiAnJywgc3R5bGU6ICcnLCBzZWFzb246ICcnIH1cclxuICAgIHVuaS5zaG93VG9hc3QoeyB0aXRsZTogJ0FJ6K+G5Yir5aSx6LSl77yM5Y+v5omL5Yqo5aGr5YaZJywgaWNvbjogJ25vbmUnIH0pXHJcbiAgfVxyXG4gIHVwbG9hZERldGVjdGluZy52YWx1ZSA9IGZhbHNlXHJcbn1cclxuLy8g5om56YeP5LiK5Lyg77yI5LiK6ZmQMTDlvKDvvInvvJrpgJDlvKDotbAgQUkg6K+G5Zu+ICsg6Ieq5Yqo5L+d5a2YXHJcbmFzeW5jIGZ1bmN0aW9uIGNob29zZUJhdGNoSW1hZ2VzKCkge1xyXG4gIHRyeSB7XHJcbiAgICBjb25zdCByZXMgPSBhd2FpdCB1bmkuY2hvb3NlSW1hZ2UoeyBjb3VudDogMTAsIHNpemVUeXBlOiBbJ2NvbXByZXNzZWQnXSwgc291cmNlVHlwZTogWydhbGJ1bScsICdjYW1lcmEnXSB9KVxyXG4gICAgY29uc3QgZmlsZXMgPSByZXMudGVtcEZpbGVQYXRoc1xyXG4gICAgaWYgKCFmaWxlcyB8fCAhZmlsZXMubGVuZ3RoKSByZXR1cm5cclxuICAgIHVuaS5zaG93TG9hZGluZyh7IHRpdGxlOiBg5q2j5Zyo6K+G5YirICR7ZmlsZXMubGVuZ3RofSDlvKAuLi5gLCBtYXNrOiB0cnVlIH0pXHJcbiAgICBsZXQgc3VjY2VzcyA9IDAsIGZhaWwgPSAwXHJcbiAgICBmb3IgKGNvbnN0IGYgb2YgZmlsZXMpIHtcclxuICAgICAgdHJ5IHtcclxuICAgICAgICBjb25zdCBkID0gYXdhaXQgdXBsb2FkKCcvdXNlci93YXJkcm9iZS91cGxvYWQtYW5kLXRhZycsIGYpXHJcbiAgICAgICAgLy8g55SoIEFJIOivhuWIq+e7k+aenOebtOaOpeW7uueJqeWTge+8iOeUqOaIt+WPr+WcqOiho+apsemhteWQjue7ree8lui+ke+8iVxyXG4gICAgICAgIGF3YWl0IHBvc3QoJy91c2VyL3dhcmRyb2JlJywge1xyXG4gICAgICAgICAgbmFtZTogKGQudGFncyAmJiBkLnRhZ3MubmFtZSkgfHwgJ+iho+eJqScsXHJcbiAgICAgICAgICBjYXRlZ29yeTogKGQudGFncyAmJiBkLnRhZ3MuY2F0ZWdvcnkpIHx8ICd0b3AnLFxyXG4gICAgICAgICAgY29sb3I6IChkLnRhZ3MgJiYgZC50YWdzLmNvbG9yKSB8fCAnJyxcclxuICAgICAgICAgIHN0eWxlOiAoZC50YWdzICYmIGQudGFncy5zdHlsZSkgfHwgJycsXHJcbiAgICAgICAgICBzZWFzb246IChkLnRhZ3MgJiYgZC50YWdzLnNlYXNvbikgfHwgJycsXHJcbiAgICAgICAgICBpbWFnZV91cmw6IGQuaW1hZ2VfdXJsIHx8ICcnLFxyXG4gICAgICAgICAgcHVyY2hhc2VfZGF0ZTogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLnNsaWNlKDAsIDEwKVxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgc3VjY2VzcysrXHJcbiAgICAgIH0gY2F0Y2ggKGUpIHsgZmFpbCsrIH1cclxuICAgIH1cclxuICAgIHVuaS5oaWRlTG9hZGluZygpXHJcbiAgICBmZXRjaFdhcmRyb2JlKClcclxuICAgIHVuaS5zaG93VG9hc3QoeyB0aXRsZTogYOaIkOWKn+W9leWFpSAke3N1Y2Nlc3N9IOS7tiR7ZmFpbCA/IGDvvIzlpLHotKUgJHtmYWlsfSDlvKBgIDogJyd9YCwgaWNvbjogc3VjY2VzcyA+IDAgPyAnc3VjY2VzcycgOiAnbm9uZScgfSlcclxuICAgIGNsb3NlVXBsb2FkKClcclxuICB9IGNhdGNoIChlKSB7IC8qIOeUqOaIt+WPlua2iCAqLyB9XHJcbn1cclxuZnVuY3Rpb24gb25QdXJjaGFzZURhdGVDaGFuZ2UoZSkge1xyXG4gIHB1cmNoYXNlRGF0ZS52YWx1ZSA9IGUuZGV0YWlsLnZhbHVlXHJcbn1cclxuYXN5bmMgZnVuY3Rpb24gY29uZmlybVVwbG9hZCgpIHtcclxuICBpZiAoIXVwbG9hZGVkSXRlbUlkLnZhbHVlKSB7XHJcbiAgICB1bmkuc2hvd1RvYXN0KHsgdGl0bGU6ICfor7flhYjkuIrkvKDlm77niYcnLCBpY29uOiAnbm9uZScgfSlcclxuICAgIHJldHVyblxyXG4gIH1cclxuICB0cnkge1xyXG4gICAgYXdhaXQgcHV0KCcvdXNlci93YXJkcm9iZS8nICsgdXBsb2FkZWRJdGVtSWQudmFsdWUsIHtcclxuICAgICAgbmFtZTogdXBsb2FkRm9ybS52YWx1ZS5uYW1lLFxyXG4gICAgICBjYXRlZ29yeTogdXBsb2FkRm9ybS52YWx1ZS5jYXRlZ29yeSxcclxuICAgICAgY29sb3I6IHVwbG9hZEZvcm0udmFsdWUuY29sb3IsXHJcbiAgICAgIHN0eWxlOiB1cGxvYWRGb3JtLnZhbHVlLnN0eWxlLFxyXG4gICAgICBzZWFzb246IHVwbG9hZEZvcm0udmFsdWUuc2Vhc29uLFxyXG4gICAgICBwdXJjaGFzZV9kYXRlOiBwdXJjaGFzZURhdGUudmFsdWUgfHwgbnVsbFxyXG4gICAgfSlcclxuICAgIHVuaS5zaG93VG9hc3QoeyB0aXRsZTogJ+W3suS/neWtmOWIsOiho+apsScsIGljb246ICdzdWNjZXNzJyB9KVxyXG4gIH0gY2F0Y2ggKGUpIHtcclxuICAgIHVuaS5zaG93VG9hc3QoeyB0aXRsZTogJ+S/neWtmOWksei0pScsIGljb246ICdub25lJyB9KVxyXG4gIH1cclxuICBzaG93VXBsb2FkLnZhbHVlID0gZmFsc2VcclxuICByZXNldFVwbG9hZCgpXHJcbiAgZmV0Y2hXYXJkcm9iZSgpXHJcbn1cclxuZnVuY3Rpb24gcmVzZXRVcGxvYWQoKSB7XHJcbiAgdXBsb2FkUHJldmlldy52YWx1ZSA9ICcnOyB1cGxvYWRUYWdzLnZhbHVlID0gbnVsbDsgdXBsb2FkZWRGaWxlLnZhbHVlID0gJydcclxuICB1cGxvYWRlZEl0ZW1JZC52YWx1ZSA9IG51bGw7IHB1cmNoYXNlRGF0ZS52YWx1ZSA9ICcnXHJcbiAgdXBsb2FkRm9ybS52YWx1ZSA9IHsgbmFtZTogJycsIGNhdGVnb3J5OiAndG9wJywgY29sb3I6ICcnLCBzdHlsZTogJycsIHNlYXNvbjogJycgfVxyXG59XHJcblxyXG4vLyA9PT09PSDooaPmqbHmk43kvZwgPT09PT1cclxuZnVuY3Rpb24gaXRlbU1ldGEoaXRlbSkge1xyXG4gIGNvbnN0IHRvZGF5ID0gbmV3IERhdGUoKVxyXG4gIGNvbnN0IHRvRGF0ZSA9IHMgPT4gcyA/IG5ldyBEYXRlKHMpIDogbnVsbFxyXG4gIGNvbnN0IHBkID0gdG9EYXRlKGl0ZW0ucHVyY2hhc2VfZGF0ZSlcclxuICBjb25zdCBsdyA9IHRvRGF0ZShpdGVtLmxhc3Rfd29ybilcclxuICBjb25zdCBvd25lZCA9IHBkID8gTWF0aC5mbG9vcigodG9kYXkgLSBwZCkgLyA4NjQwMDAwMCkgOiBudWxsXHJcbiAgY29uc3QgaWRsZSA9IGx3ID8gTWF0aC5mbG9vcigodG9kYXkgLSBsdykgLyA4NjQwMDAwMCkgOiBudWxsXHJcbiAgY29uc3QgcGFydHMgPSBbXVxyXG4gIGlmIChvd25lZCAhPT0gbnVsbCkgcGFydHMucHVzaCgn6LSt5YWlJyArIG93bmVkICsgJ+WkqScpXHJcbiAgaWYgKGlkbGUgIT09IG51bGwpIHBhcnRzLnB1c2goJ+W3sicgKyBpZGxlICsgJ+WkqeayoeepvycpXHJcbiAgZWxzZSBpZiAob3duZWQgIT09IG51bGwgJiYgb3duZWQgPiA5MCkgcGFydHMucHVzaCgn6LSt5YWl5LmF5pyq56m/JylcclxuICBwYXJ0cy5wdXNoKCfnqb8nICsgKGl0ZW0ud2Vhcl9jb3VudCB8fCAwKSArICfmrKEnKVxyXG4gIHJldHVybiBwYXJ0cy5qb2luKCcgwrcgJylcclxufVxyXG5mdW5jdGlvbiBpc0lkbGUoaXRlbSkge1xyXG4gIGNvbnN0IHRvZGF5ID0gbmV3IERhdGUoKVxyXG4gIGNvbnN0IGx3ID0gaXRlbS5sYXN0X3dvcm4gPyBuZXcgRGF0ZShpdGVtLmxhc3Rfd29ybikgOiBudWxsXHJcbiAgY29uc3QgcGQgPSBpdGVtLnB1cmNoYXNlX2RhdGUgPyBuZXcgRGF0ZShpdGVtLnB1cmNoYXNlX2RhdGUpIDogbnVsbFxyXG4gIGlmIChsdykgcmV0dXJuIE1hdGguZmxvb3IoKHRvZGF5IC0gbHcpIC8gODY0MDAwMDApID4gOTBcclxuICBpZiAocGQpIHJldHVybiBNYXRoLmZsb29yKCh0b2RheSAtIHBkKSAvIDg2NDAwMDAwKSA+IDkwXHJcbiAgcmV0dXJuIGZhbHNlXHJcbn1cclxuYXN5bmMgZnVuY3Rpb24gbWFya1dvcm4oaWRzKSB7XHJcbiAgdHJ5IHsgYXdhaXQgcG9zdCgnL3VzZXIvd2FyZHJvYmUvbWFyay13b3JuJywgeyBpZHMgfSkgfSBjYXRjaCAoZSkge31cclxufVxyXG5mdW5jdGlvbiBwaWNrSXRlbShpZCkge1xyXG4gIC8vIOiho+apseWNoeeJh+eahOOAjOaQremFjeOAje+8muWKoOWFpeiHquS4u+aQremFjemAieaLqeW5tuebtOaOpei/m+WFpeOAjOiHquW3seaQrSArIEFJIOWuoeaguOOAjeeVjOmdolxyXG4gIGlmICghaXNTZWxlY3RlZChpZCkpIHNlbGVjdGVkSWRzLnZhbHVlLnB1c2goaWQpXHJcbiAgcmV2aWV3UmVzdWx0LnZhbHVlID0gbnVsbFxyXG4gIGN1cnJlbnRWaWV3LnZhbHVlID0gJ291dGZpdCdcclxufVxyXG5hc3luYyBmdW5jdGlvbiBkZWxldGVJdGVtKGlkKSB7XHJcbiAgdW5pLnNob3dNb2RhbCh7XHJcbiAgICB0aXRsZTogJ+ehruWumuWIoOmZpD8nLFxyXG4gICAgc3VjY2VzczogYXN5bmMgKHIpID0+IHtcclxuICAgICAgaWYgKHIuY29uZmlybSkge1xyXG4gICAgICAgIHRyeSB7IGF3YWl0IGRlbCgnL3VzZXIvd2FyZHJvYmUvJyArIGlkKTsgZmV0Y2hXYXJkcm9iZSgpOyB1bmkuc2hvd1RvYXN0KHsgdGl0bGU6ICflt7LliKDpmaQnLCBpY29uOiAnc3VjY2VzcycgfSkgfSBjYXRjaCAoZSkge31cclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH0pXHJcbn1cclxuLy8g6KGj5qmx5Y2h54mH6ZW/5oyJ5pON5L2c6I+c5Y2VXHJcbmZ1bmN0aW9uIHNob3dDYXJkTWVudShpdGVtKSB7XHJcbiAgdW5pLnNob3dBY3Rpb25TaGVldCh7XHJcbiAgICBpdGVtTGlzdDogWyfliqDlhaXmkK3phY3lrqHmoLgnLCAn57yW6L6R5L+h5oGvJywgJ+WIoOmZpOi/meS7tuiho+acjSddLFxyXG4gICAgc3VjY2VzczogKHJlcykgPT4ge1xyXG4gICAgICBpZiAocmVzLnRhcEluZGV4ID09PSAwKSBwaWNrSXRlbShpdGVtLmlkKVxyXG4gICAgICBlbHNlIGlmIChyZXMudGFwSW5kZXggPT09IDIpIGRlbGV0ZUl0ZW0oaXRlbS5pZClcclxuICAgICAgLy8gdGFwSW5kZXggMSA9IOe8lui+ke+8iOaagueUqOW8ueeql+mHjeaWsOaJk+W8gOS4iuS8oOa1geeoi++8jOWQjue7reWPr+WBmueLrOeri+e8lui+kemhte+8iVxyXG4gICAgICBlbHNlIGlmIChyZXMudGFwSW5kZXggPT09IDEpIHsgdW5pLnNob3dUb2FzdCh7IHRpdGxlOiAn57yW6L6R5Yqf6IO95byA5Y+R5LitJywgaWNvbjogJ25vbmUnIH0pIH1cclxuICAgIH1cclxuICB9KVxyXG59XHJcbi8vIOminOiJsuWQjSDihpIgaGV477yI55So5LqO5peg5Zu+5Y2h54mH55qE5Y2g5L2N6Imy77yJXHJcbmNvbnN0IENPTE9SX0hFWF9NQVAgPSB7XHJcbiAgJ+eZveiJsic6ICcjZjVmNWY1JywgJ+eZveiJsuezuyc6ICcjZjVmNWY1JywgJ+exs+eZvSc6ICcjZjVmMGUxJywgJ+exs+iJsic6ICcjZjBlNmQyJyxcclxuICAn6buR6ImyJzogJyMyYjJiMmInLCAn6buR6Imy57O7JzogJyMyYjJiMmInLCAn5rex54GwJzogJyM2YjZiNmInLCAn54Gw6ImyJzogJyM5YWEwYTYnLCAn54Gw6Imy57O7JzogJyM5YWEwYTYnLCAn5rWF54GwJzogJyNkNGQ0ZDQnLFxyXG4gICfnuqLoibInOiAnI2VmNmY2YycsICfnuqLoibLns7snOiAnI2VmNmY2YycsICfphZLnuqInOiAnIzhiMjMyMycsICfnjqvnuqInOiAnI2U4NGE3ZCcsICfnsonoibInOiAnI2Y3OGZiMycsICfnsonoibLns7snOiAnI2Y3OGZiMycsXHJcbiAgJ+iTneiJsic6ICcjNWI4ZGVmJywgJ+iTneiJsuezuyc6ICcjNWI4ZGVmJywgJ+a3seiTnSc6ICcjMWEzYTZiJywgJ+a1heiTnSc6ICcjODdjZWViJywgJ+iXj+mdkic6ICcjMmMzZTUwJyxcclxuICAn57u/6ImyJzogJyMyMmMxYTgnLCAn57u/6Imy57O7JzogJyMyMmMxYTgnLCAn5aKo57u/JzogJyMyZDVhM2QnLCAn5Yab57u/JzogJyM1NTZiMmYnLCAn5qmE5qaEJzogJyM4MDgwMDAnLFxyXG4gICfpu4ToibInOiAnI2Y2YzI0NCcsICfpu4ToibLns7snOiAnI2Y2YzI0NCcsICfmqZnoibInOiAnI2Y2YTYwOScsICfmqZnoibLns7snOiAnI2Y2YTYwOScsXHJcbiAgJ+ajleiJsic6ICcjOGI2OTE0JywgJ+ajleiJsuezuyc6ICcjOGI2OTE0JywgJ+mpvOiJsic6ICcjYzE5YTZiJywgJ+WNoeWFtic6ICcjYzNiMDkxJyxcclxuICAn57Sr6ImyJzogJyM5YjZkZmYnLCAn57Sr6Imy57O7JzogJyM5YjZkZmYnLCAn6Jaw6KGj6I2JJzogJyNiMzlkZGInLFxyXG4gICfph5HoibInOiAnI2ZmZDcwMCcsICfpk7boibInOiAnI2MwYzBjMCcsICfmnY/oibInOiAnI2ZmZGVhZCdcclxufVxyXG5mdW5jdGlvbiBnZXRJdGVtQ29sb3JIZXgoaXRlbSkge1xyXG4gIHJldHVybiBDT0xPUl9IRVhfTUFQW2l0ZW0uY29sb3JdIHx8IENPTE9SX0hFWF9NQVBbaXRlbS5jb2xvcj8ucmVwbGFjZSgn6ImyJywnJyldIHx8ICcjZTBlMGUwJ1xyXG59XHJcbmFzeW5jIGZ1bmN0aW9uIG9wZW5IaXN0b3J5RHJhd2VyKCkge1xyXG4gIGZldGNoQ29udmVyc2F0aW9ucygpXHJcbiAgc2hvd0hpc3RvcnlEcmF3ZXIudmFsdWUgPSB0cnVlXHJcbiAgZHJhd2VyT3BlbmVkLnZhbHVlID0gZmFsc2VcclxuICBhd2FpdCBuZXh0VGljaygpXHJcbiAgZHJhd2VyT3BlbmVkLnZhbHVlID0gdHJ1ZVxyXG59XHJcbmZ1bmN0aW9uIGNsb3NlSGlzdG9yeURyYXdlcigpIHtcclxuICBkcmF3ZXJPcGVuZWQudmFsdWUgPSBmYWxzZVxyXG4gIHNldFRpbWVvdXQoKCkgPT4geyBzaG93SGlzdG9yeURyYXdlci52YWx1ZSA9IGZhbHNlIH0sIDI4MClcclxufVxyXG5mdW5jdGlvbiBuZXdDaGF0KCkge1xyXG4gIG1lc3NhZ2VzLnZhbHVlID0gW11cclxuICBjdXJyZW50Vmlldy52YWx1ZSA9ICdjaGF0J1xyXG4gIGNsb3NlSGlzdG9yeURyYXdlcigpXHJcbn1cclxuYXN5bmMgZnVuY3Rpb24gZGVsZXRlQ29udmVyc2F0aW9uKGlkKSB7XHJcbiAgdW5pLnNob3dNb2RhbCh7XHJcbiAgICB0aXRsZTogJ+WIoOmZpOWvueivnScsXHJcbiAgICBjb250ZW50OiAn56Gu5a6a5Yig6Zmk6L+Z5p2h5a+56K+d6K6w5b2V5ZCX77yfJyxcclxuICAgIHN1Y2Nlc3M6IGFzeW5jIChyKSA9PiB7XHJcbiAgICAgIGlmIChyLmNvbmZpcm0pIHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgYXdhaXQgZGVsKCcvdXNlci9jb252ZXJzYXRpb25zLycgKyBpZClcclxuICAgICAgICAgIGNvbnZlcnNhdGlvbnMudmFsdWUgPSBjb252ZXJzYXRpb25zLnZhbHVlLmZpbHRlcihjID0+IGMuaWQgIT09IGlkKVxyXG4gICAgICAgICAgdW5pLnNob3dUb2FzdCh7IHRpdGxlOiAn5bey5Yig6ZmkJywgaWNvbjogJ3N1Y2Nlc3MnIH0pXHJcbiAgICAgICAgfSBjYXRjaCAoZSkge31cclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH0pXHJcbn1cclxuZnVuY3Rpb24gb3Blbkhpc3RvcnlDaGF0QnlJZChpZCkge1xyXG4gIGNvbnN0IGNvbnYgPSBjb252ZXJzYXRpb25zLnZhbHVlLmZpbmQoYyA9PiBjLmlkID09PSBpZClcclxuICBpZiAoIWNvbnYpIHJldHVyblxyXG4gIG1lc3NhZ2VzLnZhbHVlID0gW11cclxuICBtZXNzYWdlcy52YWx1ZS5wdXNoKG1hcmtSYXcoeyByb2xlOiAndXNlcicsIGNvbnRlbnQ6IGNvbnYudXNlcl9pbnB1dCB9KSlcclxuICBtZXNzYWdlcy52YWx1ZS5wdXNoKG1hcmtSYXcoeyByb2xlOiAnYWdlbnQnLCBjb250ZW50OiBjb252LmFnZW50X3Jlc3BvbnNlLCBjaWQ6IGNvbnYuaWQsIHJhdGluZzogY29udi5zY29yZSB9KSlcclxuICBjdXJyZW50Vmlldy52YWx1ZSA9ICdjaGF0J1xyXG4gIGNsb3NlSGlzdG9yeURyYXdlcigpXHJcbn1cclxuXHJcbm9uTW91bnRlZCgoKSA9PiB7XHJcbiAgZmV0Y2hXYXJkcm9iZSgpXHJcbiAgZmV0Y2hDb252ZXJzYXRpb25zKClcclxuICBmZXRjaEFuYWx5c2lzKClcclxuICBmZXRjaFNob3BwaW5nTGlzdCgpXHJcbiAgZmV0Y2hOb3RpZmljYXRpb25zKClcclxuICBmZXRjaFVucmVhZCgpXHJcbiAgbG9hZFByb2ZpbGUoKVxyXG4gIGxvYWRXZWF0aGVyKClcclxufSlcclxuPC9zY3JpcHQ+XHJcblxyXG48c3R5bGUgc2NvcGVkPlxyXG4ucGFnZSB7IGhlaWdodDogMTAwdmg7IGRpc3BsYXk6IGZsZXg7IGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47IGJhY2tncm91bmQ6ICNmNWY3ZmE7IG92ZXJmbG93OiBoaWRkZW47IH1cclxuXHJcbi8qIOS4u+S9kyAqL1xyXG4ubWFpbiB7IGZsZXg6IDE7IG92ZXJmbG93OiBoaWRkZW47IHdpZHRoOiAxMDAlOyBtaW4td2lkdGg6IDA7IGJveC1zaXppbmc6IGJvcmRlci1ib3g7IH1cclxuLnBhbmVsIHsgcGFkZGluZzogMjRycHg7IGJveC1zaXppbmc6IGJvcmRlci1ib3g7IHdpZHRoOiAxMDAlOyB9XHJcbi5wYW5lbC1oZWFkIHsgbWFyZ2luLWJvdHRvbTogMjBycHg7IH1cclxuLnBhbmVsLWhlYWQuYmV0d2VlbiB7IGRpc3BsYXk6IGZsZXg7IGp1c3RpZnktY29udGVudDogc3BhY2UtYmV0d2VlbjsgYWxpZ24taXRlbXM6IGNlbnRlcjsgfVxyXG4ucGFuZWwtdGl0bGUgeyBmb250LXNpemU6IDM0cnB4OyBmb250LXdlaWdodDogNjAwOyB9XHJcblxyXG4vKiDpgJrnlKjmjInpkq4gKi9cclxuLm1pbmktYnRuIHsgcGFkZGluZzogMTBycHggMjJycHg7IGJhY2tncm91bmQ6ICNmZmY7IGJvcmRlcjogMXJweCBzb2xpZCAjZGNkZmU2OyBib3JkZXItcmFkaXVzOiA4cnB4OyBmb250LXNpemU6IDI0cnB4OyBjb2xvcjogIzYwNjI2NjsgfVxyXG4ubWluaS1idG4ucHJpbWFyeSB7IGJhY2tncm91bmQ6ICM0MDllZmY7IGNvbG9yOiAjZmZmOyBib3JkZXItY29sb3I6ICM0MDllZmY7IH1cclxuLmJpZy1idG4geyBiYWNrZ3JvdW5kOiAjNDA5ZWZmOyBjb2xvcjogI2ZmZjsgZm9udC1zaXplOiAzMnJweDsgdGV4dC1hbGlnbjogY2VudGVyOyBwYWRkaW5nOiAzNnJweDsgYm9yZGVyLXJhZGl1czogMTZycHg7IH1cclxuLmJpZy1idG4ubG9hZGluZyB7IG9wYWNpdHk6IC43OyB9XHJcblxyXG4vKiDljaHniYcgKi9cclxuLmNhcmQtYm94IHsgYmFja2dyb3VuZDogI2ZmZjsgYm9yZGVyOiAxcnB4IHNvbGlkICNlYmVlZjU7IGJvcmRlci1yYWRpdXM6IDE2cnB4OyBwYWRkaW5nOiAyNHJweDsgbWFyZ2luLXRvcDogMjBycHg7IH1cclxuLnByZSB7IGZvbnQtc2l6ZTogMjhycHg7IGxpbmUtaGVpZ2h0OiAxLjg7IHdoaXRlLXNwYWNlOiBwcmUtd3JhcDsgd29yZC1icmVhazogYnJlYWstd29yZDsgY29sb3I6ICMzMDMxMzM7IH1cclxuLm91dGZpdC1pbWcgeyB3aWR0aDogMTAwJTsgbWF4LXdpZHRoOiA2ODBycHg7IG1hcmdpbi10b3A6IDIwcnB4OyBib3JkZXItcmFkaXVzOiAxNnJweDsgZGlzcGxheTogYmxvY2s7IH1cclxuXHJcbi8qIOmmlumhtSAqL1xyXG4ud2VhdGhlci1jYXJkIHtcclxuICBkaXNwbGF5OiBmbGV4O1xyXG4gIGFsaWduLWl0ZW1zOiBjZW50ZXI7XHJcbiAganVzdGlmeS1jb250ZW50OiBzcGFjZS1iZXR3ZWVuO1xyXG4gIGJhY2tncm91bmQ6IGxpbmVhci1ncmFkaWVudCgxMzVkZWcsICM1YjljZjAsICM3NGMwZmMpO1xyXG4gIGJvcmRlci1yYWRpdXM6IDIwcnB4O1xyXG4gIHBhZGRpbmc6IDMycnB4IDM2cnB4O1xyXG4gIGNvbG9yOiAjZmZmO1xyXG4gIG1hcmdpbi1ib3R0b206IDI0cnB4O1xyXG4gIGJveC1zaGFkb3c6IDAgOHJweCAyNHJweCByZ2JhKDkxLCAxNTYsIDI0MCwgLjI1KTtcclxufVxyXG4ud3gtd2VhdGhlciB7IGRpc3BsYXk6IGZsZXg7IGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47IH1cclxuLnd4LXRlbXAgeyBmb250LXNpemU6IDcycnB4OyBmb250LXdlaWdodDogNzAwOyBsaW5lLWhlaWdodDogMTsgfVxyXG4ud3gtZGVzYyB7IGZvbnQtc2l6ZTogMjhycHg7IG1hcmdpbi10b3A6IDEwcnB4OyBvcGFjaXR5OiAuOTU7IH1cclxuLnd4LW1ldGEgeyB0ZXh0LWFsaWduOiByaWdodDsgZGlzcGxheTogZmxleDsgZmxleC1kaXJlY3Rpb246IGNvbHVtbjsgZ2FwOiA4cnB4OyB9XHJcbi53eC1jaXR5IHsgZm9udC1zaXplOiAyOHJweDsgZm9udC13ZWlnaHQ6IDUwMDsgfVxyXG4ud3gtd2luZCB7IGZvbnQtc2l6ZTogMjRycHg7IG9wYWNpdHk6IC45OyB9XHJcblxyXG4vKiDlr7nor50gKi9cclxuLmhlYWQtbGVmdCB7IGRpc3BsYXk6IGZsZXg7IGFsaWduLWl0ZW1zOiBjZW50ZXI7IH1cclxuLm1lbnUtYnRuIHsgZm9udC1zaXplOiA0MHJweDsgbWFyZ2luLXJpZ2h0OiAxNnJweDsgcGFkZGluZzogNHJweCA4cnB4OyBjb2xvcjogIzQwOWVmZjsgfVxyXG4uY2hhdC1ib3ggeyBkaXNwbGF5OiBmbGV4OyBmbGV4LWRpcmVjdGlvbjogY29sdW1uOyB9XHJcbi5tc2cgeyBtYXJnaW4tYm90dG9tOiAyNHJweDsgfVxyXG4ubXNnLWltZyB7IG1hcmdpbi1ib3R0b206IDhycHg7IH1cclxuLmNoYXQtaW1nIHsgbWF4LXdpZHRoOiAzNjBycHg7IGJvcmRlci1yYWRpdXM6IDEycnB4OyB9XHJcbi5idWJibGUgeyBtYXgtd2lkdGg6IDY2MHJweDsgfVxyXG4ubXNnLWxhYmVsIHsgZm9udC1zaXplOiAyMnJweDsgY29sb3I6ICM5OTk7IG1hcmdpbi1ib3R0b206IDZycHg7IGRpc3BsYXk6IGJsb2NrOyB9XHJcbi5tc2ctdGV4dCB7IGZvbnQtc2l6ZTogMjhycHg7IGxpbmUtaGVpZ2h0OiAxLjc7IHBhZGRpbmc6IDE4cnB4IDIycnB4OyBib3JkZXItcmFkaXVzOiAxNnJweDsgZGlzcGxheTogYmxvY2s7IHdoaXRlLXNwYWNlOiBwcmUtd3JhcDsgd29yZC1icmVhazogYnJlYWstd29yZDsgfVxyXG4ubXNnLXVzZXIgLm1zZy10ZXh0IHsgYmFja2dyb3VuZDogIzQwOWVmZjsgY29sb3I6ICNmZmY7IGJvcmRlci1ib3R0b20tcmlnaHQtcmFkaXVzOiA0cnB4OyB9XHJcbi5tc2ctYWdlbnQgLm1zZy10ZXh0IHsgYmFja2dyb3VuZDogI2ZmZjsgYm9yZGVyOiAxcnB4IHNvbGlkICNlNGU3ZWQ7IGJvcmRlci1ib3R0b20tbGVmdC1yYWRpdXM6IDRycHg7IH1cclxuLnJhdGUtcm93IHsgbWFyZ2luLXRvcDogOHJweDsgfVxyXG4uc3RhciB7IGZvbnQtc2l6ZTogMzJycHg7IGNvbG9yOiAjZGNkZmU2OyBtYXJnaW4tcmlnaHQ6IDZycHg7IH1cclxuLnN0YXIuYWN0aXZlIHsgY29sb3I6ICNmN2JhMmE7IH1cclxuLmxvYWRpbmctdGV4dCB7IGNvbG9yOiAjOTk5OyBmb250LXNpemU6IDI4cnB4OyB9XHJcbi5jaGF0LWlucHV0IHsgZGlzcGxheTogZmxleDsgYWxpZ24taXRlbXM6IGNlbnRlcjsgZ2FwOiAxMnJweDsgYmFja2dyb3VuZDogI2ZmZjsgYm9yZGVyOiAxcnB4IHNvbGlkICNlNGU3ZWQ7IGJvcmRlci1yYWRpdXM6IDEycnB4OyBwYWRkaW5nOiAxMnJweDsgbWFyZ2luLXRvcDogMTJycHg7IH1cclxuLmljb24tYnRuIHsgZm9udC1zaXplOiA0MHJweDsgcGFkZGluZzogMCAxMnJweDsgfVxyXG4uY2hhdC1maWVsZCB7IGZsZXg6IDE7IGZvbnQtc2l6ZTogMjhycHg7IHBhZGRpbmc6IDAgMTJycHg7IH1cclxuLnNlbmQtYnRuIHsgYmFja2dyb3VuZDogIzQwOWVmZjsgY29sb3I6ICNmZmY7IGZvbnQtc2l6ZTogMjZycHg7IHBhZGRpbmc6IDE0cnB4IDI4cnB4OyBib3JkZXItcmFkaXVzOiAxMHJweDsgfVxyXG5cclxuLyog6KGj5qmx77yI5pen54mIIGNoaXAvZ3JpZC9jYXJkIOS/neeVmee7meaQremFjeWkmumAieeUqO+8iSAqL1xyXG4uZmlsdGVyLWJhciB7IHdoaXRlLXNwYWNlOiBub3dyYXA7IG1hcmdpbi1ib3R0b206IDIwcnB4OyB9XHJcbi5jaGlwIHsgZGlzcGxheTogaW5saW5lLWJsb2NrOyBwYWRkaW5nOiA4cnB4IDIycnB4OyBiYWNrZ3JvdW5kOiAjZmZmOyBib3JkZXI6IDFycHggc29saWQgI2RjZGZlNjsgYm9yZGVyLXJhZGl1czogMzBycHg7IGZvbnQtc2l6ZTogMjRycHg7IGNvbG9yOiAjNjA2MjY2OyBtYXJnaW4tcmlnaHQ6IDEycnB4OyB9XHJcbi5jaGlwLmFjdGl2ZSB7IGJhY2tncm91bmQ6ICM0MDllZmY7IGNvbG9yOiAjZmZmOyBib3JkZXItY29sb3I6ICM0MDllZmY7IH1cclxuXHJcbi8qID09PT09IOiho+apsemhtSBEUFNUQVIg6aOO5qC8ID09PT09ICovXHJcbi53aC1wYWdlIHsgcGFkZGluZy1ib3R0b206IDIwcnB4OyB9XHJcblxyXG4vKiDpobbpg6jmqKrluYUgKi9cclxuLndoLWJhbm5lciB7IHBvc2l0aW9uOiByZWxhdGl2ZTsgaGVpZ2h0OiAyMjBycHg7IGJvcmRlci1yYWRpdXM6IDIwcnB4OyBvdmVyZmxvdzogaGlkZGVuOyBtYXJnaW4tYm90dG9tOiAyNHJweDsgYmFja2dyb3VuZDogbGluZWFyLWdyYWRpZW50KDEzNWRlZywgIzJjM2U1MCwgIzRhNmZhNSk7IH1cclxuLndoLWJhbm5lci1iZyB7IHBvc2l0aW9uOiBhYnNvbHV0ZTsgaW5zZXQ6IDA7IG9wYWNpdHk6IC4zNTsgfVxyXG4ud2gtYmFubmVyLWltZyB7IHdpZHRoOiAxMDAlOyBoZWlnaHQ6IDEwMCU7IG9iamVjdC1maXQ6IGNvdmVyOyB9XHJcbi53aC1iYW5uZXItaW5mbyB7IHBvc2l0aW9uOiByZWxhdGl2ZTsgei1pbmRleDogMTsgZGlzcGxheTogZmxleDsgZmxleC1kaXJlY3Rpb246IGNvbHVtbjsganVzdGlmeS1jb250ZW50OiBjZW50ZXI7IGFsaWduLWl0ZW1zOiBjZW50ZXI7IGhlaWdodDogMTAwJTsgcGFkZGluZzogMjhycHg7IH1cclxuLndoLWJhbm5lci10aXRsZSB7IGZvbnQtc2l6ZTogMzRycHg7IGZvbnQtd2VpZ2h0OiA3MDA7IGNvbG9yOiAjZmZmOyBsZXR0ZXItc3BhY2luZzogMnJweDsgbWFyZ2luLWJvdHRvbTogMTBycHg7IH1cclxuLndoLWJhbm5lci1zdGF0cyB7IGZvbnQtc2l6ZTogMjNycHg7IGNvbG9yOiByZ2JhKDI1NSwyNTUsMjU1LC44KTsgfVxyXG5cclxuLyog5b2V5YWl5YWl5Y+jICovXHJcbi53aC11cGxvYWQtZW50cnkgeyBkaXNwbGF5OiBmbGV4OyBhbGlnbi1pdGVtczogY2VudGVyOyBnYXA6IDE0cnB4OyBiYWNrZ3JvdW5kOiAjZmZmOyBib3JkZXI6IDJycHggZGFzaGVkICNjMGM0Y2M7IGJvcmRlci1yYWRpdXM6IDE2cnB4OyBwYWRkaW5nOiAyNnJweCAyOHJweDsgbWFyZ2luLWJvdHRvbTogMjRycHg7IH1cclxuLndoLXVwbG9hZC1lbnRyeTphY3RpdmUgeyBiYWNrZ3JvdW5kOiAjZjVmN2ZhOyBib3JkZXItY29sb3I6ICM5MDkzOTk7IH1cclxuLndoLXVwLWljbyB7IGZvbnQtc2l6ZTogMzhycHg7IH1cclxuLndoLXVwLXRleHQgeyBmb250LXNpemU6IDI3cnB4OyBjb2xvcjogIzMwMzEzMzsgZm9udC13ZWlnaHQ6IDUwMDsgfVxyXG5cclxuLyog5ZOB57G7562b6YCJ6KGMICovXHJcbi53aC1maWx0ZXItcm93IHsgZGlzcGxheTogZmxleDsgYWxpZ24taXRlbXM6IGNlbnRlcjsgZ2FwOiAxNnJweDsgbWFyZ2luLWJvdHRvbTogMjBycHg7IH1cclxuLndoLWZpbHRlci1sYWJlbCB7IGZvbnQtc2l6ZTogMjRycHg7IGNvbG9yOiAjOTA5Mzk5OyBmbGV4LXNocmluazogMDsgfVxyXG4ud2gtY2F0LXRhYnMgeyBmbGV4OiAxOyB3aGl0ZS1zcGFjZTogbm93cmFwOyB9XHJcbi53aC1jYXQtdGFiIHsgZGlzcGxheTogaW5saW5lLWJsb2NrOyBwYWRkaW5nOiAxMHJweCAyNnJweDsgYmFja2dyb3VuZDogI2Y1ZjdmYTsgYm9yZGVyLXJhZGl1czogMzBycHg7IGZvbnQtc2l6ZTogMjVycHg7IGNvbG9yOiAjNjA2MjY2OyBtYXJnaW4tcmlnaHQ6IDE0cnB4OyB0cmFuc2l0aW9uOiBhbGwgLjJzOyB9XHJcbi53aC1jYXQtdGFiLmFjdGl2ZSB7IGJhY2tncm91bmQ6ICMzMDMxMzM7IGNvbG9yOiAjZmZmOyBmb250LXdlaWdodDogNjAwOyB9XHJcbi53aC1jYXQtbiB7IGZvbnQtd2VpZ2h0OiA0MDA7IG9wYWNpdHk6IC43NTsgZm9udC1zaXplOiAyMnJweDsgfVxyXG5cclxuLyog5Y2h54mH572R5qC8ICovXHJcbi53aC1ncmlkIHsgZGlzcGxheTogZmxleDsgZmxleC13cmFwOiB3cmFwOyBnYXA6IDE4cnB4OyB9XHJcbi53aC1jYXJkIHsgd2lkdGg6IGNhbGMoMzMuMzMlIC0gMTJycHgpOyBiYWNrZ3JvdW5kOiAjZmZmOyBib3JkZXItcmFkaXVzOiAxNHJweDsgb3ZlcmZsb3c6IGhpZGRlbjsgYm94LXNoYWRvdzogMCAycnB4IDEycnB4IHJnYmEoMCwwLDAsLjA2KTsgfVxyXG4ud2gtY2FyZC1pbWctd3JhcCB7IGhlaWdodDogMjIwcnB4OyBiYWNrZ3JvdW5kOiAjZjdmOGZhOyBkaXNwbGF5OiBmbGV4OyBhbGlnbi1pdGVtczogY2VudGVyOyBqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjsgfVxyXG4ud2gtY2FyZC1pbWcgeyB3aWR0aDogMTAwJTsgaGVpZ2h0OiAxMDAlOyBvYmplY3QtZml0OiBjb3ZlcjsgfVxyXG4ud2gtY2FyZC1waCB7IHdpZHRoOiAxMDAlOyBoZWlnaHQ6IDEwMCU7IGRpc3BsYXk6IGZsZXg7IGFsaWduLWl0ZW1zOiBjZW50ZXI7IGp1c3RpZnktY29udGVudDogY2VudGVyOyB9XHJcbi53aC1jYXJkLXBoLXR4dCB7IGZvbnQtc2l6ZTogNDhycHg7IGNvbG9yOiByZ2JhKDI1NSwyNTUsMjU1LC43KTsgZm9udC13ZWlnaHQ6IDcwMDsgfVxyXG4ud2gtY2FyZC1uYW1lIHsgZGlzcGxheTogYmxvY2s7IHRleHQtYWxpZ246IGNlbnRlcjsgZm9udC1zaXplOiAyM3JweDsgY29sb3I6ICMzMDMxMzM7IHBhZGRpbmc6IDEycnB4IDhycHggMTZycHg7IGxpbmUtaGVpZ2h0OiAxLjM7IG92ZXJmbG93OiBoaWRkZW47IHRleHQtb3ZlcmZsb3c6IGVsbGlwc2lzOyB3aGl0ZS1zcGFjZTogbm93cmFwOyB9XHJcblxyXG4vKiDnqbrnirbmgIEgKi9cclxuLndoLWVtcHR5IHsgd2lkdGg6IDEwMCU7IGRpc3BsYXk6IGZsZXg7IGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47IGFsaWduLWl0ZW1zOiBjZW50ZXI7IHBhZGRpbmc6IDgwcnB4IDAgNDBycHg7IGdhcDogMTZycHg7IH1cclxuLndoLWVtcHR5LWljbyB7IGZvbnQtc2l6ZTogNzJycHg7IH1cclxuLndoLWVtcHR5LXRleHQgeyBmb250LXNpemU6IDI3cnB4OyBjb2xvcjogIzkwOTM5OTsgfVxyXG4uZ3JpZCB7IGRpc3BsYXk6IGZsZXg7IGZsZXgtd3JhcDogd3JhcDsgZ2FwOiAxNnJweDsgfVxyXG4uY2FyZCB7IHdpZHRoOiBjYWxjKDUwJSAtIDhycHgpOyBiYWNrZ3JvdW5kOiAjZmZmOyBib3JkZXItcmFkaXVzOiAxMnJweDsgb3ZlcmZsb3c6IGhpZGRlbjsgYm9yZGVyOiAxcnB4IHNvbGlkICNlZWU7IH1cclxuLmNhcmQtaW1nIHsgaGVpZ2h0OiAyNDBycHg7IGJhY2tncm91bmQ6ICNmNWY1ZjU7IGRpc3BsYXk6IGZsZXg7IGFsaWduLWl0ZW1zOiBjZW50ZXI7IGp1c3RpZnktY29udGVudDogY2VudGVyOyB9XHJcbi5mdWxsLWltZyB7IHdpZHRoOiAxMDAlOyBoZWlnaHQ6IDEwMCU7IH1cclxuLnBoIHsgd2lkdGg6IDEwMCU7IGhlaWdodDogMTAwJTsgZGlzcGxheTogZmxleDsgYWxpZ24taXRlbXM6IGNlbnRlcjsganVzdGlmeS1jb250ZW50OiBjZW50ZXI7IGZvbnQtc2l6ZTogNjBycHg7IGNvbG9yOiAjZmZmOyB9XHJcbi5jYXJkLWluZm8geyBwYWRkaW5nOiAxNHJweCAxNnJweDsgfVxyXG4uY2FyZC1uYW1lIHsgZm9udC1zaXplOiAyNnJweDsgZm9udC13ZWlnaHQ6IDUwMDsgZGlzcGxheTogYmxvY2s7IG1hcmdpbi1ib3R0b206IDhycHg7IH1cclxuLmNhcmQtbWV0YSB7IGZvbnQtc2l6ZTogMjBycHg7IGNvbG9yOiAjOTA5Mzk5OyBtYXJnaW4tdG9wOiA4cnB4OyBkaXNwbGF5OiBibG9jazsgfVxyXG4uY2FyZC1tZXRhLmlkbGUgeyBjb2xvcjogI2Y1NmM2YzsgZm9udC13ZWlnaHQ6IDYwMDsgfVxyXG4udGFncyB7IGRpc3BsYXk6IGZsZXg7IGZsZXgtd3JhcDogd3JhcDsgZ2FwOiA2cnB4OyB9XHJcblxyXG4vKiDoh6rkuLvmkK3phY0gKi9cclxuLnBhbmVsLXN1YiB7IGZvbnQtc2l6ZTogMjJycHg7IGNvbG9yOiAjOTA5Mzk5OyBtYXJnaW4tcmlnaHQ6IDEycnB4OyB9XHJcbi8qIOaQremFjeWFpeWPo++8muS6jOmAieS4gOWNoeeJhyAqL1xyXG4ub3V0Zml0LWNob2ljZSB7IG1hcmdpbi10b3A6IDhycHg7IH1cclxuLmNob2ljZS1jYXJkIHsgZGlzcGxheTogZmxleDsgYWxpZ24taXRlbXM6IGNlbnRlcjsgZ2FwOiAyMHJweDsgYmFja2dyb3VuZDogI2ZmZjsgYm9yZGVyOiAxcnB4IHNvbGlkICNlYmVlZjU7IGJvcmRlci1yYWRpdXM6IDE4cnB4OyBwYWRkaW5nOiAzMnJweCAyOHJweDsgbWFyZ2luLWJvdHRvbTogMjBycHg7IH1cclxuLmNob2ljZS1jYXJkLmFpIHsgYmFja2dyb3VuZDogbGluZWFyLWdyYWRpZW50KDEzNWRlZywjZWVmNGZmLCNlNmYwZmYpOyBib3JkZXItY29sb3I6ICNjZmUwZmY7IH1cclxuLmNob2ljZS1jYXJkLnNlbGYgeyBiYWNrZ3JvdW5kOiBsaW5lYXItZ3JhZGllbnQoMTM1ZGVnLCNmM2ZiZjUsI2VhZjdlZik7IGJvcmRlci1jb2xvcjogI2NkZWVkZTsgfVxyXG4uY2hvaWNlLWljbyB7IGZvbnQtc2l6ZTogNTZycHg7IGZsZXgtc2hyaW5rOiAwOyB9XHJcbi5jaG9pY2UtYm9keSB7IGZsZXg6IDE7IG1pbi13aWR0aDogMDsgZGlzcGxheTogZmxleDsgZmxleC1kaXJlY3Rpb246IGNvbHVtbjsgZ2FwOiA4cnB4OyB9XHJcbi5jaG9pY2UtdCB7IGZvbnQtc2l6ZTogMzBycHg7IGZvbnQtd2VpZ2h0OiA3MDA7IGNvbG9yOiAjMzAzMTMzOyB9XHJcbi5jaG9pY2UtZCB7IGZvbnQtc2l6ZTogMjRycHg7IGNvbG9yOiAjNjA2MjY2OyBsaW5lLWhlaWdodDogMS41OyB9XHJcbi5jaG9pY2UtYXJyb3cgeyBmb250LXNpemU6IDI2cnB4OyBjb2xvcjogIzQwOWVmZjsgZmxleC1zaHJpbms6IDA7IH1cclxuLmJhY2stYnRuIHsgZm9udC1zaXplOiAzMHJweDsgY29sb3I6ICM0MDllZmY7IG1hcmdpbi1yaWdodDogMTZycHg7IH1cclxuLyog5bel5L2c5Y+w5b+r5o235YWl5Y+jICovXHJcbi5xdWljay1yb3cgeyBkaXNwbGF5OiBmbGV4OyBnYXA6IDE4cnB4OyBtYXJnaW4tdG9wOiAyNHJweDsgfVxyXG4ucXVpY2stdGlsZSB7IHBvc2l0aW9uOiByZWxhdGl2ZTsgZmxleDogMTsgYmFja2dyb3VuZDogI2ZmZjsgYm9yZGVyOiAxcnB4IHNvbGlkICNlYmVlZjU7IGJvcmRlci1yYWRpdXM6IDE2cnB4OyBwYWRkaW5nOiAyNnJweCAwOyBkaXNwbGF5OiBmbGV4OyBmbGV4LWRpcmVjdGlvbjogY29sdW1uOyBhbGlnbi1pdGVtczogY2VudGVyOyBnYXA6IDEwcnB4OyB9XHJcbi5xdC1pY28geyBmb250LXNpemU6IDQ0cnB4OyB9XHJcbi5xdC1sYWJlbCB7IGZvbnQtc2l6ZTogMjRycHg7IGNvbG9yOiAjNjA2MjY2OyB9XHJcbi5xdC1iYWRnZSB7IHBvc2l0aW9uOiBhYnNvbHV0ZTsgdG9wOiAxMHJweDsgcmlnaHQ6IDE4cnB4OyBtaW4td2lkdGg6IDI4cnB4OyBoZWlnaHQ6IDI4cnB4OyBsaW5lLWhlaWdodDogMjhycHg7IHRleHQtYWxpZ246IGNlbnRlcjsgYmFja2dyb3VuZDogI2Y1NmM2YzsgY29sb3I6ICNmZmY7IGZvbnQtc2l6ZTogMjBycHg7IGJvcmRlci1yYWRpdXM6IDE0cnB4OyBwYWRkaW5nOiAwIDZycHg7IH1cclxuLmNhcmQucGljayB7IHBvc2l0aW9uOiByZWxhdGl2ZTsgdHJhbnNpdGlvbjogYWxsIC4xNXM7IH1cclxuLmNhcmQucGljay5waWNrZWQgeyBib3JkZXItY29sb3I6ICM0MDllZmY7IGJveC1zaGFkb3c6IDAgMCAwIDNycHggcmdiYSg2NCwxNTgsMjU1LC4yNSk7IH1cclxuLnBpY2stYmFkZ2UgeyBwb3NpdGlvbjogYWJzb2x1dGU7IHRvcDogMTBycHg7IHJpZ2h0OiAxMHJweDsgd2lkdGg6IDQwcnB4OyBoZWlnaHQ6IDQwcnB4OyBib3JkZXItcmFkaXVzOiA1MCU7IGJhY2tncm91bmQ6ICM0MDllZmY7IGNvbG9yOiAjZmZmOyBmb250LXNpemU6IDI0cnB4OyBkaXNwbGF5OiBmbGV4OyBhbGlnbi1pdGVtczogY2VudGVyOyBqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjsgfVxyXG4ub3V0Zml0LWJhciB7IHBvc2l0aW9uOiBzdGlja3k7IGJvdHRvbTogMDsgZGlzcGxheTogZmxleDsgYWxpZ24taXRlbXM6IGNlbnRlcjsganVzdGlmeS1jb250ZW50OiBzcGFjZS1iZXR3ZWVuOyBiYWNrZ3JvdW5kOiAjZmZmOyBib3JkZXItdG9wOiAxcnB4IHNvbGlkICNlNGU3ZWQ7IHBhZGRpbmc6IDE2cnB4IDIwcnB4OyBtYXJnaW46IDE2cnB4IC0yNHJweCAtMjRycHg7IH1cclxuLm9iLWNvdW50IHsgZm9udC1zaXplOiAyNnJweDsgY29sb3I6ICM2MDYyNjY7IH1cclxuLm9iLW51bSB7IGNvbG9yOiAjNDA5ZWZmOyBmb250LXdlaWdodDogNzAwOyBmb250LXNpemU6IDMwcnB4OyB9XHJcbi5vYi1idG4geyBwYWRkaW5nOiAxNnJweCA0MHJweDsgYmFja2dyb3VuZDogIzQwOWVmZjsgY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDQwcnB4OyBmb250LXNpemU6IDI4cnB4OyB9XHJcbi5vYi1idG4uZGlzYWJsZWQgeyBiYWNrZ3JvdW5kOiAjYzBjNGNjOyB9XHJcbi5yZXZpZXctY2FyZCB7IGJhY2tncm91bmQ6ICNmZmY7IGJvcmRlcjogMXJweCBzb2xpZCAjZWJlZWY1OyBib3JkZXItcmFkaXVzOiAxNnJweDsgcGFkZGluZzogMjRycHg7IG1hcmdpbi10b3A6IDIwcnB4OyB9XHJcbi5yZXZpZXctdG9wIHsgZGlzcGxheTogZmxleDsgYWxpZ24taXRlbXM6IGNlbnRlcjsgZ2FwOiAyOHJweDsgfVxyXG4uc2NvcmUtcmluZyB7IHdpZHRoOiAxNDBycHg7IGhlaWdodDogMTQwcnB4OyBib3JkZXItcmFkaXVzOiA1MCU7IGRpc3BsYXk6IGZsZXg7IGFsaWduLWl0ZW1zOiBjZW50ZXI7IGp1c3RpZnktY29udGVudDogY2VudGVyOyBwb3NpdGlvbjogcmVsYXRpdmU7IGZsZXgtc2hyaW5rOiAwOyB9XHJcbi5zY29yZS1udW0geyBmb250LXNpemU6IDUycnB4OyBmb250LXdlaWdodDogODAwOyBjb2xvcjogIzMwMzEzMzsgfVxyXG4uc2NvcmUtY2FwIHsgZm9udC1zaXplOiAyMnJweDsgY29sb3I6ICM5MDkzOTk7IG1hcmdpbi10b3A6IDE2cnB4OyB9XHJcbi5yZXZpZXctdmVyZGljdCB7IGRpc3BsYXk6IGZsZXg7IGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47IGdhcDogMTJycHg7IH1cclxuLnJ2LWxhYmVsIHsgZm9udC1zaXplOiAyNHJweDsgY29sb3I6ICM5MDkzOTk7IH1cclxuLnJ2LXRhZyB7IGFsaWduLXNlbGY6IGZsZXgtc3RhcnQ7IHBhZGRpbmc6IDhycHggMjRycHg7IGJvcmRlci1yYWRpdXM6IDMwcnB4OyBjb2xvcjogI2ZmZjsgZm9udC1zaXplOiAyOHJweDsgZm9udC13ZWlnaHQ6IDYwMDsgfVxyXG4ucmV2aWV3LWltZyB7IHdpZHRoOiAxMDAlOyBtYXJnaW46IDIwcnB4IDA7IGJvcmRlci1yYWRpdXM6IDEycnB4OyB9XHJcbi5ydi1ibG9jayB7IG1hcmdpbi10b3A6IDE4cnB4OyB9XHJcbi5ydi1oIHsgZm9udC1zaXplOiAyNnJweDsgZm9udC13ZWlnaHQ6IDYwMDsgY29sb3I6ICMzMDMxMzM7IGRpc3BsYXk6IGJsb2NrOyBtYXJnaW4tYm90dG9tOiA2cnB4OyB9XHJcbi5ydi1jIHsgZm9udC1zaXplOiAyNXJweDsgY29sb3I6ICM2MDYyNjY7IGxpbmUtaGVpZ2h0OiAxLjc7IHdoaXRlLXNwYWNlOiBwcmUtd3JhcDsgfVxyXG4ucmV2aWV3LWFjdGlvbnMgeyBtYXJnaW4tdG9wOiAyMHJweDsgZGlzcGxheTogZmxleDsganVzdGlmeS1jb250ZW50OiBmbGV4LWVuZDsgfVxyXG4udGFnIHsgZm9udC1zaXplOiAyMHJweDsgcGFkZGluZzogNHJweCAxMnJweDsgYmFja2dyb3VuZDogI2VjZjVmZjsgY29sb3I6ICM0MDllZmY7IGJvcmRlci1yYWRpdXM6IDZycHg7IG1hcmdpbi1yaWdodDogNnJweDsgfVxyXG4udGFnLm9rIHsgYmFja2dyb3VuZDogI2YwZjllYjsgY29sb3I6ICM2N2MyM2E7IH1cclxuLnRhZy53YXJuIHsgYmFja2dyb3VuZDogI2ZkZjZlYzsgY29sb3I6ICNlNmEyM2M7IH1cclxuLnRhZy5kYW5nZXIgeyBiYWNrZ3JvdW5kOiAjZmVmMGYwOyBjb2xvcjogI2Y1NmM2YzsgfVxyXG4udGFnLmluZm8geyBiYWNrZ3JvdW5kOiAjZjRmNGY1OyBjb2xvcjogIzkwOTM5OTsgfVxyXG4uY2FyZC1hY3QgeyBwYWRkaW5nOiAxMnJweCAxNnJweDsgYm9yZGVyLXRvcDogMXJweCBzb2xpZCAjZjVmNWY1OyBkaXNwbGF5OiBmbGV4OyBqdXN0aWZ5LWNvbnRlbnQ6IGZsZXgtZW5kOyBnYXA6IDI0cnB4OyB9XHJcbi5saW5rIHsgZm9udC1zaXplOiAyNHJweDsgY29sb3I6ICM0MDllZmY7IH1cclxuLmxpbmsuZGFuZ2VyIHsgY29sb3I6ICNmNTZjNmM7IH1cclxuLmVtcHR5IHsgdGV4dC1hbGlnbjogY2VudGVyOyBjb2xvcjogIzk5OTsgZm9udC1zaXplOiAyNnJweDsgcGFkZGluZzogNjBycHggMDsgfVxyXG4uZW1wdHktdGlwIHsgY29sb3I6ICM5OTk7IGZvbnQtc2l6ZTogMjRycHg7IGRpc3BsYXk6IGJsb2NrOyBtYXJnaW46IDhycHggMDsgfVxyXG4uc3VnIHsgZm9udC1zaXplOiAyNnJweDsgbGluZS1oZWlnaHQ6IDEuODsgZGlzcGxheTogYmxvY2s7IGNvbG9yOiAjNjA2MjY2OyB9XHJcblxyXG4vKiDkuIrkvKAgKi9cclxuLnVwbG9hZC1hcmVhIHsgYm9yZGVyOiAycnB4IGRhc2hlZCAjYzBjNGNjOyBib3JkZXItcmFkaXVzOiAxNnJweDsgcGFkZGluZzogNjBycHg7IHRleHQtYWxpZ246IGNlbnRlcjsgYmFja2dyb3VuZDogI2ZhZmFmYTsgfVxyXG4udXAtaWNvbiB7IGZvbnQtc2l6ZTogODBycHg7IGNvbG9yOiAjNDA5ZWZmOyBkaXNwbGF5OiBibG9jazsgfVxyXG4udXAtdGlwIHsgZm9udC1zaXplOiAyOHJweDsgY29sb3I6ICM2MDYyNjY7IGRpc3BsYXk6IGJsb2NrOyBtYXJnaW4tdG9wOiAxNnJweDsgfVxyXG4udXAtc3ViIHsgZm9udC1zaXplOiAyMnJweDsgY29sb3I6ICM5OTk7IGRpc3BsYXk6IGJsb2NrOyBtYXJnaW4tdG9wOiA4cnB4OyB9XHJcbi51cGxvYWQtcmVzdWx0IHsgbWFyZ2luLXRvcDogMjRycHg7IHRleHQtYWxpZ246IGNlbnRlcjsgfVxyXG4ucmVzdWx0LWltZyB7IG1heC13aWR0aDogNDAwcnB4OyBib3JkZXItcmFkaXVzOiAxMnJweDsgfVxyXG4uZGV0ZWN0aW5nIHsgdGV4dC1hbGlnbjogY2VudGVyOyBwYWRkaW5nOiA0MHJweDsgY29sb3I6ICM5OTk7IGZvbnQtc2l6ZTogMjZycHg7IH1cclxuXHJcbi8qIOihqOWNlSAqL1xyXG4uZm9ybSB7IG1hcmdpbi10b3A6IDIwcnB4OyBiYWNrZ3JvdW5kOiAjZmZmOyBib3JkZXItcmFkaXVzOiAxMnJweDsgcGFkZGluZzogMjBycHg7IH1cclxuLmZvcm0tcm93IHsgZGlzcGxheTogZmxleDsgYWxpZ24taXRlbXM6IGNlbnRlcjsgcGFkZGluZzogMTRycHggMDsgYm9yZGVyLWJvdHRvbTogMXJweCBzb2xpZCAjZjVmNWY1OyB9XHJcbi5mb3JtLWxhYmVsIHsgd2lkdGg6IDEyMHJweDsgZm9udC1zaXplOiAyNnJweDsgY29sb3I6ICM2MDYyNjY7IH1cclxuLmZvcm0taW5wdXQgeyBmbGV4OiAxOyBmb250LXNpemU6IDI2cnB4OyBwYWRkaW5nOiA4cnB4IDEycnB4OyBiYWNrZ3JvdW5kOiAjZjhmOGY4OyBib3JkZXItcmFkaXVzOiA4cnB4OyB9XHJcbi5mb3JtLXBpY2tlciB7IGZsZXg6IDE7IGZvbnQtc2l6ZTogMjZycHg7IHBhZGRpbmc6IDhycHggMTJycHg7IGJhY2tncm91bmQ6ICNmOGY4Zjg7IGJvcmRlci1yYWRpdXM6IDhycHg7IH1cclxuLmZvcm0tZm9vdCwgLmRpYWxvZy1mb290IHsgZGlzcGxheTogZmxleDsganVzdGlmeS1jb250ZW50OiBmbGV4LWVuZDsgZ2FwOiAxNnJweDsgbWFyZ2luLXRvcDogMjRycHg7IH1cclxuXHJcbi8qIOWIhuaekO+8iOmrmOe6p+eJiO+8iSAqL1xyXG4uYW5hbHlzaXMtd3JhcCB7IHBhZGRpbmc6IDRycHggMDsgfVxyXG4uc2NvcmUtY2FyZCB7IGRpc3BsYXk6IGZsZXg7IGFsaWduLWl0ZW1zOiBjZW50ZXI7IGdhcDogMjhycHg7IHBhZGRpbmc6IDI4cnB4OyBib3JkZXItcmFkaXVzOiAyMHJweDtcclxuICBiYWNrZ3JvdW5kOiBsaW5lYXItZ3JhZGllbnQoMTM1ZGVnLCAjZjdmOWZmIDAlLCAjZWVmM2ZmIDEwMCUpOyBtYXJnaW4tYm90dG9tOiAyNHJweDsgfVxyXG4uc2NvcmUtcmluZyB7IHdpZHRoOiAxNjBycHg7IGhlaWdodDogMTYwcnB4OyBib3JkZXItcmFkaXVzOiA1MCU7IGRpc3BsYXk6IGZsZXg7IGFsaWduLWl0ZW1zOiBjZW50ZXI7IGp1c3RpZnktY29udGVudDogY2VudGVyOyBmbGV4LXNocmluazogMDtcclxuICBib3gtc2hhZG93OiAwIDZycHggMThycHggcmdiYSg5MSwxNDEsMjM5LC4yNSk7IH1cclxuLnNjb3JlLWhvbGUgeyB3aWR0aDogMTIycnB4OyBoZWlnaHQ6IDEyMnJweDsgYm9yZGVyLXJhZGl1czogNTAlOyBiYWNrZ3JvdW5kOiAjZmZmOyBkaXNwbGF5OiBmbGV4OyBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xyXG4gIGFsaWduLWl0ZW1zOiBjZW50ZXI7IGp1c3RpZnktY29udGVudDogY2VudGVyOyB9XHJcbi5zY29yZS1udW0geyBmb250LXNpemU6IDUycnB4OyBmb250LXdlaWdodDogODAwOyBjb2xvcjogIzMwMzEzMzsgbGluZS1oZWlnaHQ6IDE7IH1cclxuLnNjb3JlLXVuaXQgeyBmb250LXNpemU6IDIycnB4OyBjb2xvcjogIzkwOTM5OTsgbWFyZ2luLXRvcDogMnJweDsgfVxyXG4uc2NvcmUtaW5mbyB7IGZsZXg6IDE7IG1pbi13aWR0aDogMDsgfVxyXG4uc2NvcmUtdGl0bGUgeyBmb250LXNpemU6IDMwcnB4OyBmb250LXdlaWdodDogNzAwOyBjb2xvcjogIzMwMzEzMzsgZGlzcGxheTogYmxvY2s7IH1cclxuLnNjb3JlLXN1YiB7IGZvbnQtc2l6ZTogMjJycHg7IGNvbG9yOiAjOTA5Mzk5OyBkaXNwbGF5OiBibG9jazsgbWFyZ2luOiA0cnB4IDAgMTZycHg7IH1cclxuLnNjb3JlLW1ldHJpY3MgeyBkaXNwbGF5OiBmbGV4OyBnYXA6IDEycnB4OyB9XHJcbi5zbSB7IGZsZXg6IDE7IGJhY2tncm91bmQ6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDE0cnB4OyBwYWRkaW5nOiAxNHJweCAwOyB0ZXh0LWFsaWduOiBjZW50ZXI7IH1cclxuLnNtLW51bSB7IGZvbnQtc2l6ZTogMzRycHg7IGZvbnQtd2VpZ2h0OiA3MDA7IGNvbG9yOiAjMzAzMTMzOyBkaXNwbGF5OiBibG9jazsgfVxyXG4uc20tbnVtLndhcm4geyBjb2xvcjogI2Y2YTYwOTsgfVxyXG4uc20tbnVtLmRhbmdlciB7IGNvbG9yOiAjZWY2ZjZjOyB9XHJcbi5zbS1sYWIgeyBmb250LXNpemU6IDIwcnB4OyBjb2xvcjogIzkwOTM5OTsgZGlzcGxheTogYmxvY2s7IG1hcmdpbi10b3A6IDJycHg7IH1cclxuXHJcbi5ibG9jayB7IG1hcmdpbi1ib3R0b206IDI4cnB4OyB9XHJcbi5ibG9jay10aXRsZSB7IGZvbnQtc2l6ZTogMjhycHg7IGZvbnQtd2VpZ2h0OiA3MDA7IGNvbG9yOiAjMzAzMTMzOyBkaXNwbGF5OiBibG9jazsgbWFyZ2luLWJvdHRvbTogMTZycHg7XHJcbiAgcGFkZGluZy1sZWZ0OiAxNnJweDsgYm9yZGVyLWxlZnQ6IDZycHggc29saWQgIzViOGRlZjsgfVxyXG5cclxuLmRvbnV0LXJvdyB7IGRpc3BsYXk6IGZsZXg7IGFsaWduLWl0ZW1zOiBjZW50ZXI7IGdhcDogMjhycHg7IH1cclxuLmRvbnV0IHsgd2lkdGg6IDIwMHJweDsgaGVpZ2h0OiAyMDBycHg7IGJvcmRlci1yYWRpdXM6IDUwJTsgZmxleC1zaHJpbms6IDA7IHBvc2l0aW9uOiByZWxhdGl2ZTtcclxuICBib3gtc2hhZG93OiAwIDZycHggMTZycHggcmdiYSgwLDAsMCwuMDgpOyB9XHJcbi5kb251dC1ob2xlIHsgcG9zaXRpb246IGFic29sdXRlOyB0b3A6IDUwJTsgbGVmdDogNTAlOyB0cmFuc2Zvcm06IHRyYW5zbGF0ZSgtNTAlLC01MCUpO1xyXG4gIHdpZHRoOiAxMzhycHg7IGhlaWdodDogMTM4cnB4OyBib3JkZXItcmFkaXVzOiA1MCU7IGJhY2tncm91bmQ6ICNmZmY7IGRpc3BsYXk6IGZsZXg7IGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XHJcbiAgYWxpZ24taXRlbXM6IGNlbnRlcjsganVzdGlmeS1jb250ZW50OiBjZW50ZXI7IH1cclxuLmRvbnV0LW51bSB7IGZvbnQtc2l6ZTogNDRycHg7IGZvbnQtd2VpZ2h0OiA4MDA7IGNvbG9yOiAjMzAzMTMzOyBsaW5lLWhlaWdodDogMTsgfVxyXG4uZG9udXQtdW5pdCB7IGZvbnQtc2l6ZTogMjJycHg7IGNvbG9yOiAjOTA5Mzk5OyB9XHJcbi5sZWdlbmQgeyBmbGV4OiAxOyBtaW4td2lkdGg6IDA7IGRpc3BsYXk6IGZsZXg7IGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47IGdhcDogMTRycHg7IH1cclxuLmxlZ2VuZC1pdGVtIHsgZGlzcGxheTogZmxleDsgYWxpZ24taXRlbXM6IGNlbnRlcjsgZ2FwOiAxMnJweDsgfVxyXG4ubGVnZW5kLWRvdCB7IHdpZHRoOiAxOHJweDsgaGVpZ2h0OiAxOHJweDsgYm9yZGVyLXJhZGl1czogNnJweDsgZmxleC1zaHJpbms6IDA7IH1cclxuLmxlZ2VuZC1uYW1lIHsgZm9udC1zaXplOiAyNnJweDsgY29sb3I6ICMzMDMxMzM7IGZsZXg6IDE7IH1cclxuLmxlZ2VuZC12YWwgeyBmb250LXNpemU6IDI0cnB4OyBjb2xvcjogIzkwOTM5OTsgfVxyXG5cclxuLnN0YWNrLWJhciB7IGRpc3BsYXk6IGZsZXg7IGhlaWdodDogMjhycHg7IGJvcmRlci1yYWRpdXM6IDE0cnB4OyBvdmVyZmxvdzogaGlkZGVuOyBiYWNrZ3JvdW5kOiAjZWJlZWY1OyB9XHJcbi5zdGFjay1zZWcgeyBoZWlnaHQ6IDEwMCU7IH1cclxuLnN0YWNrLWxlZ2VuZCB7IGRpc3BsYXk6IGZsZXg7IGZsZXgtd3JhcDogd3JhcDsgZ2FwOiAyMHJweDsgbWFyZ2luLXRvcDogMTRycHg7IH1cclxuLnN0YWNrLWxlZyB7IGRpc3BsYXk6IGZsZXg7IGFsaWduLWl0ZW1zOiBjZW50ZXI7IGdhcDogOHJweDsgfVxyXG4uc3RhY2stbGVnLXQgeyBmb250LXNpemU6IDI0cnB4OyBjb2xvcjogIzYwNjI2NjsgfVxyXG5cclxuLmNvbG9yLXdyYXAgeyBkaXNwbGF5OiBmbGV4OyBmbGV4LXdyYXA6IHdyYXA7IGdhcDogMTZycHg7IH1cclxuLmNvbG9yLWNoaXAgeyBkaXNwbGF5OiBmbGV4OyBhbGlnbi1pdGVtczogY2VudGVyOyBnYXA6IDhycHg7IGJhY2tncm91bmQ6ICNmN2Y4ZmE7IGJvcmRlci1yYWRpdXM6IDMwcnB4OyBwYWRkaW5nOiA4cnB4IDE4cnB4OyB9XHJcbi5jb2xvci1kb3QgeyB3aWR0aDogMjZycHg7IGhlaWdodDogMjZycHg7IGJvcmRlci1yYWRpdXM6IDUwJTsgYm9yZGVyOiAxcnB4IHNvbGlkICNlNGU3ZWQ7IH1cclxuLmNvbG9yLW5hbWUgeyBmb250LXNpemU6IDI0cnB4OyBjb2xvcjogIzMwMzEzMzsgfVxyXG4uY29sb3ItY250IHsgZm9udC1zaXplOiAyMnJweDsgY29sb3I6ICM5MDkzOTk7IH1cclxuXHJcbi50YWctbGlzdCB7IGRpc3BsYXk6IGZsZXg7IGZsZXgtd3JhcDogd3JhcDsgZ2FwOiAxMnJweDsgfVxyXG5cclxuLnN1Zy1saXN0IHsgZGlzcGxheTogZmxleDsgZmxleC1kaXJlY3Rpb246IGNvbHVtbjsgZ2FwOiAxMnJweDsgfVxyXG4uc3VnLWl0ZW0geyBkaXNwbGF5OiBmbGV4OyBnYXA6IDEycnB4OyBiYWNrZ3JvdW5kOiBsaW5lYXItZ3JhZGllbnQoMTM1ZGVnLCNmN2Y5ZmYsI2VlZjNmZik7IGJvcmRlci1yYWRpdXM6IDE0cnB4OyBwYWRkaW5nOiAxOHJweCAyMHJweDsgfVxyXG4uc3VnLWJ1bGxldCB7IGNvbG9yOiAjNWI4ZGVmOyBmb250LXNpemU6IDI0cnB4OyBmbGV4LXNocmluazogMDsgfVxyXG4uc3VnLXRleHQgeyBmb250LXNpemU6IDI1cnB4OyBjb2xvcjogIzQ1NGE1MjsgbGluZS1oZWlnaHQ6IDEuNjsgZmxleDogMTsgfVxyXG4uc2hvcCB7IGRpc3BsYXk6IGZsZXg7IGFsaWduLWl0ZW1zOiBjZW50ZXI7IGdhcDogMTZycHg7IH1cclxuLnNob3AtcmVhc29uIHsgZm9udC1zaXplOiAyNnJweDsgY29sb3I6ICM2MDYyNjY7IGZsZXg6IDE7IH1cclxuXHJcbi8qIOWOhuWPsuS+p+i+ueaKveWxiSAqL1xyXG4uZHJhd2VyLXdyYXAgeyBwb3NpdGlvbjogZml4ZWQgIWltcG9ydGFudDsgdG9wOiAwOyBsZWZ0OiAwOyByaWdodDogMDsgYm90dG9tOiAwOyB6LWluZGV4OiA2MDsgb3ZlcmZsb3c6IGhpZGRlbjsgfVxyXG4uaGlzdG9yeS1kcmF3ZXIge1xyXG4gIHBvc2l0aW9uOiBhYnNvbHV0ZSAhaW1wb3J0YW50OyB0b3A6IDA7IGxlZnQ6IDA7XHJcbiAgd2lkdGg6IDc1dnc7IG1heC13aWR0aDogNTYwcnB4OyBoZWlnaHQ6IDEwMCU7XHJcbiAgYmFja2dyb3VuZDogI2ZmZjtcclxuICBkaXNwbGF5OiBmbGV4OyBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xyXG4gIHRyYW5zZm9ybTogdHJhbnNsYXRlWCgtMTAwJSk7XHJcbiAgdHJhbnNpdGlvbjogdHJhbnNmb3JtIC4yOHMgZWFzZTtcclxuICBib3gtc2hhZG93OiA2cnB4IDAgMzBycHggcmdiYSgwLDAsMCwuMTUpO1xyXG4gIGJveC1zaXppbmc6IGJvcmRlci1ib3g7XHJcbn1cclxuLmhpc3RvcnktZHJhd2VyLm9wZW4geyB0cmFuc2Zvcm06IHRyYW5zbGF0ZVgoMCk7IH1cclxuLmRyYXdlci1tYXNrIHsgcG9zaXRpb246IGFic29sdXRlOyB0b3A6IDA7IGxlZnQ6IDA7IHJpZ2h0OiAwOyBib3R0b206IDA7IGJhY2tncm91bmQ6IHJnYmEoMCwwLDAsLjM1KTsgfVxyXG4uZHJhd2VyLWhlYWQgeyBkaXNwbGF5OiBmbGV4OyBhbGlnbi1pdGVtczogY2VudGVyOyBqdXN0aWZ5LWNvbnRlbnQ6IHNwYWNlLWJldHdlZW47IHBhZGRpbmc6IDI4cnB4IDI0cnB4OyBib3JkZXItYm90dG9tOiAxcnB4IHNvbGlkICNlYmVlZjU7IGZsZXgtc2hyaW5rOiAwOyB9XHJcbi5kcmF3ZXItdGl0bGUgeyBmb250LXNpemU6IDMycnB4OyBmb250LXdlaWdodDogNjAwOyBjb2xvcjogIzMwMzEzMzsgfVxyXG4uZHJhd2VyLW5ldyB7IGZvbnQtc2l6ZTogMjZycHg7IGNvbG9yOiAjNDA5ZWZmOyBwYWRkaW5nOiA4cnB4IDE2cnB4OyBiYWNrZ3JvdW5kOiAjZWNmNWZmOyBib3JkZXItcmFkaXVzOiAyMHJweDsgfVxyXG4uZHJhd2VyLWxpc3QgeyBmbGV4OiAxOyBoZWlnaHQ6IDA7IHdpZHRoOiAxMDAlOyBwYWRkaW5nOiAxNnJweCAyMHJweDsgYm94LXNpemluZzogYm9yZGVyLWJveDsgfVxyXG4uZHJhd2VyLWl0ZW0geyBiYWNrZ3JvdW5kOiAjZjdmOGZhOyBwYWRkaW5nOiAyMHJweCAyMnJweDsgbWFyZ2luLWJvdHRvbTogMTZycHg7IGJvcmRlci1yYWRpdXM6IDEycnB4OyBib3JkZXI6IDFycHggc29saWQgI2VlZjBmMzsgd2lkdGg6IDEwMCU7IGJveC1zaXppbmc6IGJvcmRlci1ib3g7IGRpc3BsYXk6IGZsZXg7IGFsaWduLWl0ZW1zOiBjZW50ZXI7IH1cclxuLmRyYXdlci1pdGVtOmFjdGl2ZSB7IGJhY2tncm91bmQ6ICNlZWY0ZmY7IH1cclxuLmRpLW1haW4geyBmbGV4OiAxOyBtaW4td2lkdGg6IDA7IH1cclxuLmRpLWRlbCB7IHBhZGRpbmc6IDhycHggMTRycHg7IG1hcmdpbi1sZWZ0OiAxMnJweDsgZm9udC1zaXplOiAzNHJweDsgY29sb3I6ICNjMGM0Y2M7IGFsaWduLXNlbGY6IGNlbnRlcjsgZmxleC1zaHJpbms6IDA7IH1cclxuLmRpLWRlbDphY3RpdmUgeyBjb2xvcjogI2Y1NmM2YzsgfVxyXG4uZGktcSB7IGZvbnQtd2VpZ2h0OiA1MDA7IGZvbnQtc2l6ZTogMjhycHg7IGNvbG9yOiAjMzAzMTMzOyBkaXNwbGF5OiBibG9jazsgbWFyZ2luLWJvdHRvbTogOHJweDsgd2hpdGUtc3BhY2U6IG5vd3JhcDsgb3ZlcmZsb3c6IGhpZGRlbjsgdGV4dC1vdmVyZmxvdzogZWxsaXBzaXM7IHdpZHRoOiAxMDAlOyB9XHJcbi5kaS1hIHsgZm9udC1zaXplOiAyNHJweDsgY29sb3I6ICM4ODg7IGRpc3BsYXk6IGJsb2NrOyBtYXJnaW4tYm90dG9tOiAxMHJweDsgd2hpdGUtc3BhY2U6IG5vd3JhcDsgb3ZlcmZsb3c6IGhpZGRlbjsgdGV4dC1vdmVyZmxvdzogZWxsaXBzaXM7IHdpZHRoOiAxMDAlOyB9XHJcbi5kaS10aW1lIHsgZm9udC1zaXplOiAyMnJweDsgY29sb3I6ICNhYWE7IGRpc3BsYXk6IGJsb2NrOyB9XHJcbi5kcmF3ZXItZW1wdHkgeyB0ZXh0LWFsaWduOiBjZW50ZXI7IGNvbG9yOiAjOTk5OyBmb250LXNpemU6IDI2cnB4OyBwYWRkaW5nLXRvcDogODBycHg7IH1cclxuXHJcbi8qIOS4quS6uuS4reW/gyAqL1xyXG4ubWUtY2FyZCB7IGRpc3BsYXk6IGZsZXg7IGFsaWduLWl0ZW1zOiBjZW50ZXI7IGJhY2tncm91bmQ6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDE2cnB4OyBwYWRkaW5nOiAzMnJweCAyOHJweDsgbWFyZ2luLWJvdHRvbTogMjBycHg7IH1cclxuLm1lLWF2YXRhciB7IHdpZHRoOiA5NnJweDsgaGVpZ2h0OiA5NnJweDsgYm9yZGVyLXJhZGl1czogNTAlOyBiYWNrZ3JvdW5kOiAjNDA5ZWZmOyBjb2xvcjogI2ZmZjsgZm9udC1zaXplOiA0NHJweDsgZGlzcGxheTogZmxleDsgYWxpZ24taXRlbXM6IGNlbnRlcjsganVzdGlmeS1jb250ZW50OiBjZW50ZXI7IG1hcmdpbi1yaWdodDogMjRycHg7IGZsZXgtc2hyaW5rOiAwOyB9XHJcbi5tZS1pbmZvIHsgZGlzcGxheTogZmxleDsgZmxleC1kaXJlY3Rpb246IGNvbHVtbjsgbWluLXdpZHRoOiAwOyB9XHJcbi5tZS1uYW1lIHsgZm9udC1zaXplOiAzNHJweDsgZm9udC13ZWlnaHQ6IDYwMDsgY29sb3I6ICMzMDMxMzM7IH1cclxuLm1lLXN1YiB7IGZvbnQtc2l6ZTogMjRycHg7IGNvbG9yOiAjOTA5Mzk5OyBtYXJnaW4tdG9wOiA4cnB4OyB9XHJcbi5tZS1saXN0IHsgYmFja2dyb3VuZDogI2ZmZjsgYm9yZGVyLXJhZGl1czogMTZycHg7IG92ZXJmbG93OiBoaWRkZW47IH1cclxuLm1lLXJvdyB7IGRpc3BsYXk6IGZsZXg7IGFsaWduLWl0ZW1zOiBjZW50ZXI7IHBhZGRpbmc6IDMwcnB4IDI4cnB4OyBib3JkZXItYm90dG9tOiAxcnB4IHNvbGlkICNmNWY1ZjU7IH1cclxuLm1lLXJvdzphY3RpdmUgeyBiYWNrZ3JvdW5kOiAjZjdmOGZhOyB9XHJcbi5tZS1yb3ctbCB7IGZsZXg6IDE7IGZvbnQtc2l6ZTogMzBycHg7IGNvbG9yOiAjMzAzMTMzOyB9XHJcbi5tZS1hcnJvdyB7IGZvbnQtc2l6ZTogNDBycHg7IGNvbG9yOiAjYzBjNGNjOyBtYXJnaW4tbGVmdDogMTJycHg7IH1cclxuLm1lLWJhZGdlIHsgbWluLXdpZHRoOiAzMnJweDsgaGVpZ2h0OiAzMnJweDsgcGFkZGluZzogMCA4cnB4OyBiYWNrZ3JvdW5kOiAjZjU2YzZjOyBjb2xvcjogI2ZmZjsgZm9udC1zaXplOiAyMHJweDsgbGluZS1oZWlnaHQ6IDMycnB4OyB0ZXh0LWFsaWduOiBjZW50ZXI7IGJvcmRlci1yYWRpdXM6IDE2cnB4OyBtYXJnaW4tbGVmdDogYXV0bzsgbWFyZ2luLXJpZ2h0OiAxMnJweDsgfVxyXG4ubWUtbG9nb3V0IHsgbWFyZ2luLXRvcDogNDBycHg7IGJhY2tncm91bmQ6ICNmZmY7IGNvbG9yOiAjZjU2YzZjOyB0ZXh0LWFsaWduOiBjZW50ZXI7IHBhZGRpbmc6IDMwcnB4OyBib3JkZXItcmFkaXVzOiAxNnJweDsgZm9udC1zaXplOiAzMHJweDsgYm9yZGVyOiAxcnB4IHNvbGlkICNmZGUyZTI7IH1cclxuLm1lLWxvZ291dDphY3RpdmUgeyBiYWNrZ3JvdW5kOiAjZmVmMGYwOyB9XHJcblxyXG4vKiDlupXpg6jlr7zoiKogKi9cclxuLmJvdHRvbS1uYXYgeyBoZWlnaHQ6IDEwMHJweDsgYmFja2dyb3VuZDogI2ZmZjsgYm9yZGVyLXRvcDogMXJweCBzb2xpZCAjZTRlN2VkOyB3aGl0ZS1zcGFjZTogbm93cmFwOyB9XHJcbi5uYXYtaXRlbSB7IGRpc3BsYXk6IGlubGluZS1mbGV4OyBmbGV4LWRpcmVjdGlvbjogY29sdW1uOyBhbGlnbi1pdGVtczogY2VudGVyOyBqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjsgd2lkdGg6IDE0MHJweDsgaGVpZ2h0OiAxMDBycHg7IGNvbG9yOiAjOTA5Mzk5OyB9XHJcbi5uYXYtaXRlbS5hY3RpdmUgeyBjb2xvcjogIzQwOWVmZjsgYmFja2dyb3VuZDogI2VjZjVmZjsgfVxyXG4ubmF2LWljb24geyBmb250LXNpemU6IDM4cnB4OyB9XHJcbi5uYXYtbGFiZWwgeyBmb250LXNpemU6IDIwcnB4OyBtYXJnaW4tdG9wOiA0cnB4OyB9XHJcbi5uYXYtaWNvLXdyYXAgeyBwb3NpdGlvbjogcmVsYXRpdmU7IH1cclxuLmJhZGdlIHsgcG9zaXRpb246IGFic29sdXRlOyB0b3A6IC04cnB4OyByaWdodDogLTE0cnB4OyBtaW4td2lkdGg6IDMwcnB4OyBoZWlnaHQ6IDMwcnB4OyBwYWRkaW5nOiAwIDZycHg7IGJhY2tncm91bmQ6ICNmNTZjNmM7IGNvbG9yOiAjZmZmOyBmb250LXNpemU6IDE4cnB4OyBsaW5lLWhlaWdodDogMzBycHg7IHRleHQtYWxpZ246IGNlbnRlcjsgYm9yZGVyLXJhZGl1czogMTVycHg7IH1cclxuXHJcbi8qIOiHquWumuS5iemhtumDqOagjyAqL1xyXG4udG9wYmFyIHsgaGVpZ2h0OiA4OHJweDsgZmxleC1zaHJpbms6IDA7IGJhY2tncm91bmQ6ICMxZDFlMWY7IGNvbG9yOiAjZmZmOyBkaXNwbGF5OiBmbGV4OyBhbGlnbi1pdGVtczogY2VudGVyOyBqdXN0aWZ5LWNvbnRlbnQ6IHNwYWNlLWJldHdlZW47IHBhZGRpbmc6IDAgMjJycHg7IGJveC1zaXppbmc6IGJvcmRlci1ib3g7IH1cclxuLnRiLXRpdGxlIHsgZm9udC1zaXplOiAzMnJweDsgZm9udC13ZWlnaHQ6IDYwMDsgfVxyXG4udGItcmlnaHQgeyBkaXNwbGF5OiBmbGV4OyBhbGlnbi1pdGVtczogY2VudGVyOyB9XHJcblxyXG4vKiDlhajlsYDpgJrnn6Xpk4Ppk5vvvIjpobbpg6jmoI/lj7PkvqfvvIzngrnlh7vov5vlhaXpgJrnn6XkuK3lv4PvvIkgKi9cclxuLm5vdGlmeS1iZWxsIHsgcG9zaXRpb246IHJlbGF0aXZlOyB3aWR0aDogNjRycHg7IGhlaWdodDogNjRycHg7IGJhY2tncm91bmQ6IHJnYmEoMjU1LDI1NSwyNTUsLjE2KTsgYm9yZGVyLXJhZGl1czogNTAlOyBkaXNwbGF5OiBmbGV4OyBhbGlnbi1pdGVtczogY2VudGVyOyBqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjsgfVxyXG4uYmVsbC1pY28geyBmb250LXNpemU6IDM0cnB4OyBsaW5lLWhlaWdodDogMTsgfVxyXG4uYmVsbC1iYWRnZSB7IHBvc2l0aW9uOiBhYnNvbHV0ZTsgdG9wOiAtNnJweDsgcmlnaHQ6IC02cnB4OyBtaW4td2lkdGg6IDMwcnB4OyBoZWlnaHQ6IDMwcnB4OyBwYWRkaW5nOiAwIDZycHg7IGJhY2tncm91bmQ6ICNmNTZjNmM7IGNvbG9yOiAjZmZmOyBmb250LXNpemU6IDE4cnB4OyBsaW5lLWhlaWdodDogMzBycHg7IHRleHQtYWxpZ246IGNlbnRlcjsgYm9yZGVyLXJhZGl1czogMTVycHg7IH1cclxuXHJcbi8qIOmAmuefpeS4reW/gyAqL1xyXG4ubm90aSB7IGJhY2tncm91bmQ6ICNmZmY7IGJvcmRlcjogMXJweCBzb2xpZCAjZWJlZWY1OyBib3JkZXItcmFkaXVzOiAxNHJweDsgcGFkZGluZzogMjBycHggMjJycHg7IG1hcmdpbi10b3A6IDE2cnB4OyB9XHJcbi5ub3RpLnVucmVhZCB7IGJvcmRlci1sZWZ0OiA2cnB4IHNvbGlkICM0MDllZmY7IH1cclxuLm5vdGktdG9wIHsgZGlzcGxheTogZmxleDsganVzdGlmeS1jb250ZW50OiBzcGFjZS1iZXR3ZWVuOyBhbGlnbi1pdGVtczogY2VudGVyOyBtYXJnaW4tYm90dG9tOiA4cnB4OyB9XHJcbi5ub3RpLXRhZyB7IGZvbnQtc2l6ZTogMjBycHg7IHBhZGRpbmc6IDRycHggMTRycHg7IGJvcmRlci1yYWRpdXM6IDIwcnB4OyBjb2xvcjogI2ZmZjsgYmFja2dyb3VuZDogIzkwOTM5OTsgfVxyXG4ubm90aS10YWcudC1tb250aGx5X3JlcG9ydCB7IGJhY2tncm91bmQ6ICM2N2MyM2E7IH1cclxuLm5vdGktdGFnLnQtdHJlbmRfcHVzaCB7IGJhY2tncm91bmQ6ICM5YjU5YjY7IH1cclxuLm5vdGktdGltZSB7IGZvbnQtc2l6ZTogMjBycHg7IGNvbG9yOiAjOTk5OyB9XHJcbi5ub3RpLXRpdGxlIHsgZm9udC1zaXplOiAyOHJweDsgZm9udC13ZWlnaHQ6IDYwMDsgZGlzcGxheTogYmxvY2s7IG1hcmdpbjogNHJweCAwIDhycHg7IGNvbG9yOiAjMzAzMTMzOyB9XHJcbi5ub3RpLWNvbnRlbnQgeyBmb250LXNpemU6IDI1cnB4OyBsaW5lLWhlaWdodDogMS43OyBjb2xvcjogIzYwNjI2Njsgd2hpdGUtc3BhY2U6IHByZS13cmFwOyB3b3JkLWJyZWFrOiBicmVhay13b3JkOyBkaXNwbGF5OiBibG9jazsgfVxyXG4ubm90aS1pbWcgeyB3aWR0aDogMTAwJTsgbWF4LXdpZHRoOiA2MDBycHg7IG1hcmdpbi10b3A6IDE2cnB4OyBib3JkZXItcmFkaXVzOiAxMnJweDsgfVxyXG5cclxuLyog5by556qXICovXHJcbi5tYXNrIHsgcG9zaXRpb246IGZpeGVkOyBsZWZ0OiAwOyB0b3A6IDA7IHJpZ2h0OiAwOyBib3R0b206IDA7IGJhY2tncm91bmQ6IHJnYmEoMCwwLDAsLjUpOyBkaXNwbGF5OiBmbGV4OyBhbGlnbi1pdGVtczogY2VudGVyOyBqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjsgei1pbmRleDogOTk7IH1cclxuLmRpYWxvZyB7IHdpZHRoOiA2NDBycHg7IGJhY2tncm91bmQ6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDE2cnB4OyBwYWRkaW5nOiAzMHJweDsgbWF4LWhlaWdodDogODR2aDsgb3ZlcmZsb3cteTogYXV0bzsgfVxyXG4uZGlhbG9nLXRpdGxlIHsgZm9udC1zaXplOiAzMnJweDsgZm9udC13ZWlnaHQ6IDYwMDsgZGlzcGxheTogYmxvY2s7IG1hcmdpbi1ib3R0b206IDIwcnB4OyB9XHJcbi5kaWFsb2ctaW1nIHsgbWF4LWhlaWdodDogMzYwcnB4OyBib3JkZXItcmFkaXVzOiAxMnJweDsgbWFyZ2luOiAxNnJweCBhdXRvOyBkaXNwbGF5OiBibG9jazsgfVxyXG4ubWluaS1idG4uZGlzYWJsZWQgeyBvcGFjaXR5OiAuNTsgfVxyXG5cclxuLyogPT09PT0g5LiK5Lyg5by556qXIERQU1RBUiDpo47moLwgPT09PT0gKi9cclxuLndoLXVwbG9hZC1kaWFsb2cgeyB3aWR0aDogNjYwcnB4OyBiYWNrZ3JvdW5kOiAjZmZmOyBib3JkZXItcmFkaXVzOiAyMHJweDsgbWF4LWhlaWdodDogODh2aDsgb3ZlcmZsb3cteTogYXV0bzsgZGlzcGxheTogZmxleDsgZmxleC1kaXJlY3Rpb246IGNvbHVtbjsgfVxyXG4ud2gtZGxnLWhlYWQgeyBkaXNwbGF5OiBmbGV4OyBhbGlnbi1pdGVtczogY2VudGVyOyBqdXN0aWZ5LWNvbnRlbnQ6IHNwYWNlLWJldHdlZW47IHBhZGRpbmc6IDI0cnB4IDI4cnB4OyBib3JkZXItYm90dG9tOiAxcnB4IHNvbGlkICNmMGYwZjA7IH1cclxuLndoLWRsZy1iYWNrIHsgZm9udC1zaXplOiAyOHJweDsgY29sb3I6ICM0MDllZmY7IH1cclxuLndoLWRsZy10aXRsZSB7IGZvbnQtc2l6ZTogMzJycHg7IGZvbnQtd2VpZ2h0OiA2MDA7IGNvbG9yOiAjMzAzMTMzOyB9XHJcbi53aC1kbGctdXAtYXJlYSB7IG1hcmdpbjogMjRycHggMjhycHggMTZycHg7IGJhY2tncm91bmQ6ICMzMDMxMzM7IGJvcmRlci1yYWRpdXM6IDEycnB4OyBwYWRkaW5nOiAyOHJweDsgZGlzcGxheTogZmxleDsgYWxpZ24taXRlbXM6IGNlbnRlcjsganVzdGlmeS1jb250ZW50OiBjZW50ZXI7IGdhcDogMTJycHg7IH1cclxuLndoLWRsZy11cC1hcmVhOmFjdGl2ZSB7IG9wYWNpdHk6IC44NTsgfVxyXG4ud2gtZGxnLXVwLWljbyB7IGZvbnQtc2l6ZTogMzRycHg7IH1cclxuLndoLWRsZy11cC10eHQgeyBmb250LXNpemU6IDI4cnB4OyBjb2xvcjogI2ZmZjsgZm9udC13ZWlnaHQ6IDUwMDsgfVxyXG4ud2gtZGxnLWJhdGNoIHsgbWFyZ2luOiAwIDI4cnB4IDIwcnB4OyBib3JkZXI6IDJycHggZGFzaGVkICNkY2RmZTY7IGJvcmRlci1yYWRpdXM6IDEycnB4OyBwYWRkaW5nOiAyMnJweDsgZGlzcGxheTogZmxleDsgYWxpZ24taXRlbXM6IGNlbnRlcjsganVzdGlmeS1jb250ZW50OiBjZW50ZXI7IGdhcDogMTBycHg7IH1cclxuLndoLWRsZy1iYXRjaDphY3RpdmUgeyBiYWNrZ3JvdW5kOiAjZjVmN2ZhOyB9XHJcbi53aC1kbGctYmF0Y2gtaWNvIHsgZm9udC1zaXplOiAzMHJweDsgfVxyXG4ud2gtZGxnLWJhdGNoLXR4dCB7IGZvbnQtc2l6ZTogMjZycHg7IGNvbG9yOiAjNjA2MjY2OyB9XHJcbi53aC1kbGctYm9keSB7IHBhZGRpbmc6IDAgMjhycHggMjhycHg7IH1cclxuLndoLWRsZy1wcmV2aWV3IHsgYmFja2dyb3VuZDogI2Y3ZjhmYTsgYm9yZGVyLXJhZGl1czogMTRycHg7IHBhZGRpbmc6IDIwcnB4OyBkaXNwbGF5OiBmbGV4OyBhbGlnbi1pdGVtczogY2VudGVyOyBqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjsgcG9zaXRpb246IHJlbGF0aXZlOyBtaW4taGVpZ2h0OiAyODBycHg7IH1cclxuLndoLWRsZy1wcmV2aWV3LWltZyB7IG1heC13aWR0aDogMTAwJTsgbWF4LWhlaWdodDogMzYwcnB4OyBib3JkZXItcmFkaXVzOiAxMHJweDsgfVxyXG4ud2gtZGxnLWRldGVjdCB7IHBvc2l0aW9uOiBhYnNvbHV0ZTsgaW5zZXQ6IDA7IGJhY2tncm91bmQ6IHJnYmEoMjU1LDI1NSwyNTUsLjg1KTsgZGlzcGxheTogZmxleDsgYWxpZ24taXRlbXM6IGNlbnRlcjsganVzdGlmeS1jb250ZW50OiBjZW50ZXI7IGJvcmRlci1yYWRpdXM6IDE0cnB4OyBmb250LXNpemU6IDI3cnB4OyBjb2xvcjogIzQwOWVmZjsgZm9udC13ZWlnaHQ6IDUwMDsgfVxyXG4ud2gtZGxnLXByZXZpZXctdGlwIHsgZGlzcGxheTogYmxvY2s7IHRleHQtYWxpZ246IGNlbnRlcjsgZm9udC1zaXplOiAyM3JweDsgY29sb3I6ICNjMGM0Y2M7IG1hcmdpbjogMTJycHggMCAyMHJweDsgfVxyXG4ud2gtZGxnLWZvcm0geyBkaXNwbGF5OiBmbGV4OyBmbGV4LWRpcmVjdGlvbjogY29sdW1uOyBnYXA6IDA7IH1cclxuLndoLWRsZy1yb3cgeyBkaXNwbGF5OiBmbGV4OyBnYXA6IDE2cnB4OyBtYXJnaW4tYm90dG9tOiAwOyB9XHJcbi53aC1kbGctZmllbGQgeyBmbGV4OiAxOyB9XHJcbi53aC1kZ2wtbGFiZWwsIC53aC1kbGctbGFiZWwgeyBmb250LXNpemU6IDI0cnB4OyBjb2xvcjogIzkwOTM5OTsgbWFyZ2luLWJvdHRvbTogOHJweDsgZGlzcGxheTogYmxvY2s7IH1cclxuLndoLWRsZy1pbnB1dCB7IHdpZHRoOiAxMDAlOyBoZWlnaHQ6IDY4cnB4OyBiYWNrZ3JvdW5kOiAjZjVmN2ZhOyBib3JkZXI6IDFycHggc29saWQgI2U0ZTdlZDsgYm9yZGVyLXJhZGl1czogMTBycHg7IHBhZGRpbmc6IDAgMTZycHg7IGZvbnQtc2l6ZTogMjdycHg7IGJveC1zaXppbmc6IGJvcmRlci1ib3g7IH1cclxuLndoLWRsZy1waWNrZXIgeyB3aWR0aDogMTAwJTsgaGVpZ2h0OiA2OHJweDsgYmFja2dyb3VuZDogI2Y1ZjdmYTsgYm9yZGVyOiAxcnB4IHNvbGlkICNlNGU3ZWQ7IGJvcmRlci1yYWRpdXM6IDEwcnB4OyBwYWRkaW5nOiAwIDE2cnB4OyBmb250LXNpemU6IDI3cnB4OyBib3gtc2l6aW5nOiBib3JkZXItYm94OyBkaXNwbGF5OiBmbGV4OyBhbGlnbi1pdGVtczogY2VudGVyOyB9XHJcbi53aC1kbGctcGljay12YWwgeyBmb250LXNpemU6IDI3cnB4OyBjb2xvcjogIzMwMzEzMzsgfVxyXG4ud2gtZGxnLXBpY2stdmFsLnBsYWNlaG9sZGVyIHsgY29sb3I6ICNjMGM0Y2M7IH1cclxuLndoLWRsZy1mb290IHsgZGlzcGxheTogZmxleDsgZ2FwOiAxNnJweDsgbWFyZ2luLXRvcDogMjhycHg7IHBhZGRpbmctdG9wOiAyMHJweDsgYm9yZGVyLXRvcDogMXJweCBzb2xpZCAjZjBmMGYwOyB9XHJcbi53aC1kbGctYnRuIHsgZmxleDogMTsgaGVpZ2h0OiA4MHJweDsgbGluZS1oZWlnaHQ6IDgwcnB4OyB0ZXh0LWFsaWduOiBjZW50ZXI7IGJvcmRlci1yYWRpdXM6IDEycnB4OyBmb250LXNpemU6IDI5cnB4OyBmb250LXdlaWdodDogNTAwOyB9XHJcbi53aC1kbGctYnRuLmNhbmNlbCB7IGJhY2tncm91bmQ6ICNmNWY3ZmE7IGNvbG9yOiAjNjA2MjY2OyB9XHJcbi53aC1kbGctYnRuLnNhdmUgeyBiYWNrZ3JvdW5kOiAjMzAzMTMzOyBjb2xvcjogI2ZmZjsgfVxyXG4ud2gtZGxnLWJ0bi5zYXZlLmRpc2FibGVkIHsgYmFja2dyb3VuZDogI2MwYzRjYzsgfVxyXG48L3N0eWxlPlxyXG4iXSwibWFwcGluZ3MiOiJBQXlmQSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUM5RSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNyRSxDQUFDOzs7Ozs7QUFIYSxDQUFDO0FBSWYsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDakMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzFCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDL0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ2hDLENBQUM7QUFDRCxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3pCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDbEMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDOUIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNyQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDaEMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDM0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUMvQixDQUFDO0FBQ0QsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDOUIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDM0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDakMsQ0FBQztBQUNELENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzlCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzlCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUM3QixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDbkMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzdCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ2pDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUM3QixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3hGLENBQUM7QUFDRCxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ2xDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUMzRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQy9CLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUM3QixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3JDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUN0QyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUMvRCxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDakIsQ0FBQyxDQUFDLENBQUM7QUFDSCxDQUFDO0FBQ0QsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNuQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUM3QyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDNUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDaEQsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDaEQsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDaEQsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQy9DLENBQUMsQ0FBQztBQUNGLENBQUM7QUFDRCxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNsQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDMUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUN2RCxDQUFDLENBQUM7QUFDRixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNmLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzNCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDekIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ2hDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDekUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzNELENBQUMsQ0FBQyxDQUFDO0FBQ0gsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUN6RSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDeEQsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUMzQyxDQUFDO0FBQ0QsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDMUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDNUQsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUN6RSxDQUFDLENBQUMsQ0FBQztBQUNILENBQUM7QUFDRCxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3pCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUN2QixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUN2QyxDQUFDLENBQUM7QUFDRixDQUFDO0FBQ0QsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUN0QixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDMUgsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDekcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDcEYsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3BILENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNwQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDM0csQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUMxRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUN4SCxDQUFDLENBQUM7QUFDRixDQUFDO0FBQ0QsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDdkMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDM0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDMUYsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUMxRCxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUN4RSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNoRCxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNaLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUMxQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDZCxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3BELENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUN6QyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNOLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNkLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDaEgsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDbkQsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUMvRSxDQUFDLENBQUMsQ0FBQztBQUNILENBQUM7QUFDRCxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3JDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzNCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDOUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ2hGLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ2xFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUM3QixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDZCxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3BELENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDeEMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDTixDQUFDLENBQUMsQ0FBQztBQUNILENBQUM7QUFDRCxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDbkMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDM0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDN0MsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ2pFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3RELENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ04sQ0FBQyxDQUFDLENBQUM7QUFDSCxDQUFDO0FBQ0QsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDdkMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDM0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNyQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUM5QixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDL0MsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNwRCxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ25FLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDdkQsQ0FBQyxDQUFDLENBQUM7QUFDSCxDQUFDO0FBQ0QsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDcEMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ2hDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNoQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDaEMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNuQixDQUFDLENBQUMsQ0FBQztBQUNILENBQUM7QUFDRCxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDbkMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ2hDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDL0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUMvQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNsQixDQUFDLENBQUMsQ0FBQztBQUNILENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUN2QixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNwRixDQUFDLENBQUM7QUFDRixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDMUIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDdEQsQ0FBQyxDQUFDO0FBQ0YsQ0FBQztBQUNELENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNwQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNqQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNwRixDQUFDLENBQUM7QUFDRixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDdEMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDOUUsQ0FBQyxDQUFDO0FBQ0YsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDakMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzdFLENBQUMsQ0FBQztBQUNGLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDckMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzdFLENBQUMsQ0FBQztBQUNGLENBQUM7QUFDRCxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUMxQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDdkIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzVDLENBQUMsQ0FBQztBQUNGLENBQUM7QUFDRCxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNqQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzVCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ2pDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDL0IsQ0FBQztBQUNELENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ2xFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDNUIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDMUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDN0MsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNsQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDcEIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUM1QixDQUFDLENBQUM7QUFDRixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzVCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDekIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUM1QixDQUFDLENBQUM7QUFDRixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUMxQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDM0QsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDM0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUMvQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQy9CLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDbkIsQ0FBQyxDQUFDLENBQUM7QUFDSCxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDekMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzNELENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3pELENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzlFLENBQUMsQ0FBQyxDQUFDO0FBQ0gsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ2hDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUN0QyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUN6RCxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDWCxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ0osQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzdCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDNUIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ1IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUM1RSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUMzQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ2hCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDdkQsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNKLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzlCLENBQUMsQ0FBQztBQUNGLENBQUM7QUFDRCxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUN4QixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3pCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUMxQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ2xDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3JCLENBQUMsQ0FBQztBQUNGLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUN2QixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDN0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3ZCLENBQUMsQ0FBQztBQUNGLENBQUM7QUFDRCxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDcEIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3RDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3JILENBQUMsQ0FBQztBQUNGLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDL0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ1IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ25GLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDckMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ2pCLENBQUMsQ0FBQztBQUNGLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDNUIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDWixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzdELENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDaEIsQ0FBQyxDQUFDO0FBQ0YsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ2hDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNwQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNyQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDM0QsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzdFLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDSixDQUFDLENBQUM7QUFDRixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQy9CLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNSLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUMvQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDM0QsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzFCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3pELENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNqQixDQUFDLENBQUM7QUFDRixDQUFDO0FBQ0QsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ25DLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDekIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzVDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDdEIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNoQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUN2QyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3ZELENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ2pDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDUCxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDLENBQUM7QUFDRixDQUFDO0FBQ0QsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDbEIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzFCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUM5SixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3RCLENBQUMsQ0FBQztBQUNGLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDeEMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNyQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQy9CLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUM5SixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzVCLENBQUMsQ0FBQztBQUNGLENBQUM7QUFDRCxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDaEMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3ZFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUN0QyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDdkIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUM3RCxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUMzQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDUixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDMUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3pJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDekIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNoQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUMzRSxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ0osQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUM1QixDQUFDLENBQUM7QUFDRixDQUFDO0FBQ0QsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ25DLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNSLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDckMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3hELENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUN6RixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDN0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDckgsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzVJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDekIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDOUIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNoQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDckQsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNKLENBQUMsQ0FBQztBQUNGLENBQUM7QUFDRCxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNqQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDaEMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUMvQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNyQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUN2QyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDUixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDMUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUN2RCxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDakIsQ0FBQyxDQUFDO0FBQ0YsQ0FBQztBQUNELENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUM5RCxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3pCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDL0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3BCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDcEQsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNwRCxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzNDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDSixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ25CLENBQUMsQ0FBQztBQUNGLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDbEMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ1IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNyQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3RCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDdkQsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUN2RCxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUMxQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNOLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzNCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUMzRCxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDM0QsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNoQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ25CLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDSixDQUFDLENBQUM7QUFDRixDQUFDO0FBQ0QsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3BCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ2pDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNoQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNwQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNwQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDbkMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUM5QyxDQUFDLENBQUM7QUFDRixDQUFDO0FBQ0QsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDekQsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDM0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzFCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUMxQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3pCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ2xCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDbEMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDbEIsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNKLENBQUMsQ0FBQztBQUNGLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ25ELENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDcEQsQ0FBQztBQUNELENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNuQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3pCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUM1QyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUN2RixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDLENBQUM7QUFDRixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3hDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDN0csQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzdCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3hCLENBQUMsQ0FBQztBQUNGLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzlILENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUM3QixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUN4QixDQUFDLENBQUM7QUFDRixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDN0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ2QsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDMUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3hELENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3RELENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUM1QyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3ZELENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDSixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNoRCxDQUFDLENBQUM7QUFDRixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQy9CLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzlCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ2xFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNSLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDckMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDckIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDakYsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNQLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUN2QixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUN4QixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ25CLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDaEIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDOUIsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNKLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDNUIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3BFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3hFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDekUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3RDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNwQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ25CLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzdDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUM5RCxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3hDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDSixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQy9CLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDekIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDeEIsQ0FBQyxDQUFDO0FBQ0YsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNwRCxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUMzQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDUixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDN0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDOUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDL0csQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUMvQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUM1RyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzlDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3RELENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3pELENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUM3QixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3pCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDaEIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzFFLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDSixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzVCLENBQUMsQ0FBQztBQUNGLENBQUM7QUFDRCxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3pCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNsRCxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUN2QyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDUixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3JDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDL0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDOUIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDakMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDbEUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3JELENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDN0QsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUN0QixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3pCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDbEYsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzFCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ1QsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDTixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNsQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUMzQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNqQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDNUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ25DLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNuQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNwQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDUixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDaEMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzlELENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ04sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNoQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDMUIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDdkYsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzNELENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDSixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDaEMsQ0FBQyxDQUFDO0FBQ0YsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ2hDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDckMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ1IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNoSCxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNwQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3hDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3hFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzlCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUM3QixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNaLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDbkUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDdkMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDdkMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNqRCxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzFELENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDakQsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNqRCxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNuRCxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3hDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQy9ELENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNYLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ2xCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUM3QixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNOLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDdEIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3BCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3hILENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ2xCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUM3QixDQUFDLENBQUM7QUFDRixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDbkMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3RDLENBQUMsQ0FBQztBQUNGLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ2pDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDL0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3JELENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNYLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDSixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDUixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzFELENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNuQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzNDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDckMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNyQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUN2QyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNoRCxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ1AsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3hELENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDaEIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDbkQsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNKLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzNCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDaEIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDbEIsQ0FBQyxDQUFDO0FBQ0YsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUN6QixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDN0UsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUN2RCxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3JGLENBQUMsQ0FBQztBQUNGLENBQUM7QUFDRCxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDcEIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzFCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzNCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzdDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDeEMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDcEMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNoRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUMvRCxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ25CLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNyRCxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3BELENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDN0QsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNqRCxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUMzQixDQUFDLENBQUM7QUFDRixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUN4QixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUMzQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDOUQsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUN0RSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzFELENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDMUQsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDZixDQUFDLENBQUM7QUFDRixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQy9CLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUN2RSxDQUFDLENBQUM7QUFDRixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUN4QixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDNUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ2xELENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDNUIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUMvQixDQUFDLENBQUM7QUFDRixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDaEMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDbEIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3BCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDNUIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3ZCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDbEksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ1IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDTixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDLENBQUM7QUFDRixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDZCxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUM5QixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUN4QixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDNUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDeEIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDaEQsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUN2RCxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ2pELENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUN6RixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNOLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNMLENBQUMsQ0FBQztBQUNGLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDekIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDeEIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3ZFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDMUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUMxRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3hGLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDeEYsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDeEUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3ZFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDdkQsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNwRCxDQUFDLENBQUM7QUFDRixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNqQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzlGLENBQUMsQ0FBQztBQUNGLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDckMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3ZCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ2pDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUM3QixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ25CLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDNUIsQ0FBQyxDQUFDO0FBQ0YsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ2hDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUM3QixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzdELENBQUMsQ0FBQztBQUNGLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3JCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDdEIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzdCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUN2QixDQUFDLENBQUM7QUFDRixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3hDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ2xCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDbkIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzdCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDNUIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3ZCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNkLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDakQsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzdFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUMzRCxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDdkIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ1IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDTixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDLENBQUM7QUFDRixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDbkMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUMxRCxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDcEIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUN0QixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUMzRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNsSCxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDN0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3ZCLENBQUMsQ0FBQztBQUNGLENBQUM7QUFDRCxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNsQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNsQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENB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