<template>
  <div class="user-layout">
    <!-- Sidebar Navigation -->
    <aside class="sidebar">
      <div class="sidebar-title">AI 穿搭助手</div>
      <div class="nav-list">
        <div v-for="item in navItems" :key="item.key"
          :class="['nav-item', { active: currentView === item.key }]"
          @click="currentView = item.key">
          <span class="nav-icon">{{ item.icon }}</span>
          <span class="nav-label">{{ item.label }}</span>
          <el-tag v-if="item.badge" size="small" type="danger" class="nav-badge">{{ item.badge }}</el-tag>
        </div>
      </div>
    </aside>

    <!-- Main Content Area -->
    <main class="main-area">
      <!-- ===== 1. AI对话 ===== -->
      <div v-if="currentView === 'chat'" class="view-panel">
        <div class="panel-header">
          <h2>AI 穿搭对话</h2>
          <el-button size="small" @click="currentView = 'wardrobe'">查看衣橱</el-button>
        </div>
        <div class="chat-container">
          <div class="messages" ref="msgRef">
            <div v-for="(m,i) in messages" :key="i" :class="'msg msg-'+m.role">
              <div v-if="m.image" class="msg-image"><img :src="m.image" class="chat-img" /></div>
              <div class="msg-bubble">
                <div class="msg-label">{{ m.role==='user'?'你':'AI搭配师' }}</div>
                <div class="msg-text">{{ m.content }}</div>
              </div>
              <div v-if="m.role==='agent'&&m.cid" class="msg-rate">
                <el-rate v-model="m.rating" :max="5" @change="rateMsg(m)" />
                <span v-if="m.rating<=2" class="rate-hint">点个赞或给反馈帮我们改进</span>
              </div>
            </div>
            <div v-if="chatLoading" class="msg msg-agent">
              <div class="msg-bubble"><el-icon class="is-loading"><Loading /></el-icon> AI搭配师正在思考...</div>
            </div>
          </div>
          <div class="chat-input">
            <el-upload :show-file-list="false" :before-upload="chatUploadImage" accept="image/*">
              <el-button :disabled="chatLoading" title="上传图片搭配"><el-icon><Camera /></el-icon></el-button>
            </el-upload>
            <el-input v-model="chatInput" placeholder="描述你的需求，比如：明天参加会议，帮我推荐..." @keyup.enter="sendChat" :disabled="chatLoading" />
            <el-button type="primary" @click="sendChat" :disabled="chatLoading||!chatInput">发送</el-button>
          </div>
        </div>
      </div>

      <!-- ===== 2. 衣橱管理 ===== -->
      <div v-if="currentView === 'wardrobe'" class="view-panel">
        <div class="panel-header">
          <h2>我的衣橱</h2>
          <div class="header-actions">
            <el-button type="primary" size="small" @click="showUpload=true">
              <el-icon><Upload /></el-icon> 拍照/上传
            </el-button>
          </div>
        </div>
        <div class="wardrobe-content">
          <div class="filter-bar">
            <el-tag v-for="c in catList" :key="c.k"
              :type="wardrobeFilter===c.k?'primary':'info'"
              size="small" style="cursor:pointer;margin:2px" @click="wardrobeFilter=c.k">{{ c.l }}</el-tag>
          </div>
          <div class="wardrobe-grid">
            <div v-for="item in filteredWardrobe" :key="item.id" class="wardrobe-card">
              <div class="card-img">
                <img v-if="item.image_url" :src="item.image_url" />
                <div v-else class="card-placeholder" :style="{background:item.color||'#eee'}">
                  <span>{{ item.name[0] }}</span>
                </div>
              </div>
              <div class="card-info">
                <div class="card-name">{{ item.name }}</div>
                <div class="card-tags">
                  <el-tag size="small">{{ item.category }}</el-tag>
                  <el-tag size="small" type="success">{{ item.color }}</el-tag>
                  <el-tag v-if="item.style" size="small" type="warning">{{ item.style }}</el-tag>
                </div>
              </div>
              <div class="card-actions">
                <el-button text size="small" @click="pickItem(item)">搭配</el-button>
                <el-popconfirm title="确定删除?" @confirm="deleteItem(item.id)">
                  <template #reference><el-button text type="danger" size="small">删除</el-button></template>
                </el-popconfirm>
              </div>
            </div>
            <el-empty v-if="filteredWardrobe.length===0" description="衣橱空空，点击右上角上传" />
          </div>
        </div>
      </div>

      <!-- ===== 3. 拍照/抠图上传 ===== -->
      <div v-if="currentView === 'upload'" class="view-panel">
        <div class="panel-header"><h2>拍照 / 抠图上传</h2></div>
        <div class="upload-content">
          <div class="upload-area">
            <el-upload drag :show-file-list="false" :before-upload="handleUploadImage" accept="image/*">
              <el-icon style="font-size:48px;color:#409eff"><Plus /></el-icon>
              <div style="margin-top:12px;font-size:15px">点击或拖拽图片到此处</div>
              <div style="font-size:12px;color:#999;margin-top:4px">支持 JPG / PNG，上传后自动抠图识别</div>
            </el-upload>
          </div>
          <div v-if="uploadPreview" class="upload-result">
            <div class="result-row">
              <div class="result-img">
                <img :src="uploadPreview" />
              </div>
              <div class="result-form">
                <div v-if="uploadDetecting" class="detecting">
                  <el-icon class="is-loading"><Loading /></el-icon> AI 正在识别中...
                </div>
                <el-form v-else :model="uploadForm" label-width="70px">
                  <el-form-item label="名称"><el-input v-model="uploadForm.name" /></el-form-item>
                  <el-form-item label="品类">
                    <el-select v-model="uploadForm.category">
                      <el-option label="上装" value="top" /><el-option label="下装" value="bottom" />
                      <el-option label="鞋子" value="shoes" /><el-option label="配饰" value="accessory" />
                    </el-select>
                  </el-form-item>
                  <el-form-item label="颜色"><el-input v-model="uploadForm.color" placeholder="AI已识别" /></el-form-item>
                  <el-form-item label="风格"><el-input v-model="uploadForm.style" placeholder="AI已识别" /></el-form-item>
                  <el-form-item label="季节"><el-input v-model="uploadForm.season" placeholder="AI已识别" /></el-form-item>
                  <el-form-item>
                    <el-button type="primary" @click="confirmUpload">保存到衣橱</el-button>
                    <el-button @click="resetUpload">重新上传</el-button>
                  </el-form-item>
                </el-form>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 传图能力已合并进「对话」：对话输入框左侧的相机按钮可发图让 AI 分析搭配 -->

      <!-- ===== 5. 今天穿什么 ===== -->
      <div v-if="currentView === 'today'" class="view-panel">
        <div class="panel-header"><h2>今天穿什么</h2></div>
        <div class="today-content">
          <div class="today-hero">
            <el-button type="primary" size="large" @click="getTodayOutfit" :loading="todayLoading" style="font-size:18px;padding:20px 40px">
              🎯 给我推荐今日穿搭
            </el-button>
          </div>
          <div v-if="todayResult" class="today-result">
            <div class="today-text">{{ todayResult }}</div>
          </div>
        </div>
      </div>

      <!-- ===== 6. 衣橱分析 ===== -->
      <div v-if="currentView === 'analysis'" class="view-panel">
        <div class="panel-header">
          <h2>衣橱分析</h2>
          <el-button size="small" @click="fetchAnalysis">刷新</el-button>
        </div>
        <div v-if="analysis" class="analysis-content">
          <el-descriptions :column="3" border>
            <el-descriptions-item label="衣物总数">{{ analysis.total_items }}</el-descriptions-item>
            <el-descriptions-item label="闲置">{{ (analysis.unused_items||[]).length }}</el-descriptions-item>
            <el-descriptions-item label="重复">{{ (analysis.duplicate_warnings||[]).length }}</el-descriptions-item>
          </el-descriptions>
          <h4 style="margin:16px 0 8px">分类分布</h4>
          <div v-for="(v,k) in analysis.category_distribution" :key="k" class="stat-row">
            <span class="stat-label">{{ k }}</span>
            <el-progress :percentage="Math.round(v/analysis.total_items*100)" :stroke-width="22" />
          </div>
          <h4 style="margin:16px 0 8px">闲置提醒</h4>
          <div v-if="analysis.unused_items&&analysis.unused_items.length">
            <el-tag v-for="item in analysis.unused_items" :key="item.id" style="margin:4px" type="warning">
              {{ item.name }}（超过90天未用）
            </el-tag>
          </div>
          <el-empty v-else description="暂无闲置" :image-size="40" />
          <h4 style="margin:16px 0 8px">重复购买提醒</h4>
          <div v-if="analysis.duplicate_warnings&&analysis.duplicate_warnings.length">
            <el-tag v-for="d in analysis.duplicate_warnings" :key="d.name" style="margin:4px" type="danger">
              {{ d.name }} × {{ d.count }}
            </el-tag>
          </div>
          <el-empty v-else description="无重复购买" :image-size="40" />
          <h4 v-if="analysis.suggestions&&analysis.suggestions.length" style="margin:16px 0 8px">建议</h4>
          <ul><li v-for="(s,i) in analysis.suggestions" :key="i">{{ s }}</li></ul>
        </div>
      </div>

      <!-- ===== 7. 对话历史 ===== -->
      <div v-if="currentView === 'history'" class="view-panel">
        <div class="panel-header"><h2>对话历史</h2></div>
        <div class="history-content">
          <div v-for="conv in conversations" :key="conv.id" class="history-card" @click="openHistoryChat(conv)">
            <div class="history-q">{{ conv.user_input }}</div>
            <div class="history-a">{{ (conv.agent_response||'').substring(0,80) }}...</div>
            <div class="history-meta">
              <el-tag v-if="conv.score>=4" size="small" type="success">{{ conv.score }}分</el-tag>
              <el-tag v-else-if="conv.score<=2&&conv.score>0" size="small" type="danger">{{ conv.score }}分</el-tag>
              <span style="font-size:12px;color:#999">{{ fmtLocalTime(conv.created_at) }}</span>
            </div>
          </div>
          <el-empty v-if="conversations.length===0" description="暂无对话记录" />
        </div>
      </div>

      <!-- ===== 8. 购物清单 ===== -->
      <div v-if="currentView === 'shopping'" class="view-panel">
        <div class="panel-header"><h2>购物清单</h2></div>
        <div class="shop-content">
          <div v-if="shoppingList&&shoppingList.suggestions&&shoppingList.suggestions.length">
            <div v-for="(s,i) in shoppingList.suggestions" :key="i" class="shop-card">
              <el-tag :type="s.category==='top'?'primary':s.category==='bottom'?'success':s.category==='shoes'?'warning':'info'" size="large">
                {{ {top:'上装',bottom:'下装',shoes:'鞋子',accessory:'配饰'}[s.category]||s.category }}
              </el-tag>
              <span style="margin-left:12px">{{ s.reason }}</span>
            </div>
          </div>
          <el-empty v-else description="你的衣橱品类齐全，暂无购物建议！" />
        </div>
      </div>
    </main>

    <!-- Upload Dialog (for wardrobe page) -->
    <el-dialog v-model="showUpload" title="上传衣物" width="520px">
      <el-upload drag :show-file-list="false" :before-upload="handleUploadImage" accept="image/*">
        <el-icon style="font-size:48px;color:#409eff"><Plus /></el-icon>
        <div style="margin-top:8px">点击或拖拽上传</div>
      </el-upload>
      <div v-if="uploadPreview" style="text-align:center;margin:12px 0">
        <img :src="uploadPreview" style="max-height:200px;border-radius:8px" />
      </div>
      <div v-if="uploadDetecting" class="detecting">
        <el-icon class="is-loading"><Loading /></el-icon> AI 自动识别中...
      </div>
      <el-form v-if="uploadTags" :model="uploadForm" label-width="70px">
        <el-form-item label="名称"><el-input v-model="uploadForm.name" /></el-form-item>
        <el-form-item label="品类"><el-select v-model="uploadForm.category">
          <el-option label="上装" value="top" /><el-option label="下装" value="bottom" />
          <el-option label="鞋子" value="shoes" /><el-option label="配饰" value="accessory" />
        </el-select></el-form-item>
        <el-form-item label="颜色"><el-input v-model="uploadForm.color" /></el-form-item>
        <el-form-item label="风格"><el-input v-model="uploadForm.style" /></el-form-item>
        <el-form-item label="季节"><el-input v-model="uploadForm.season" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showUpload=false">取消</el-button>
        <el-button type="primary" :disabled="!uploadPreview" @click="confirmUpload">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { Loading, Camera, Upload, Plus, PictureFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { get } from '@/utils/request'

const currentView = ref('today')
const chatInput = ref('')
const chatLoading = ref(false)
const messages = ref([])
const msgRef = ref(null)

const wardrobe = ref([])
const wardrobeFilter = ref('all')
const conversations = ref([])

const analysis = ref(null)
const shoppingList = ref(null)

const showUpload = ref(false)
const uploadPreview = ref('')
const uploadTags = ref(null)
const uploadDetecting = ref(false)
const uploadedFile = ref(null)
const uploadForm = ref({ name: '', category: 'top', color: '', style: '', season: '' })

const todayLoading = ref(false)
const todayResult = ref('')

const navItems = [
  { key: 'today', icon: '🎯', label: '今天穿什么' },
  { key: 'chat', icon: '💬', label: 'AI对话' },
  { key: 'wardrobe', icon: '👔', label: '衣橱管理' },
  { key: 'upload', icon: '📸', label: '拍照上传' },
  { key: 'analysis', icon: '📊', label: '衣橱分析' },
  { key: 'history', icon: '📖', label: '对话历史' },
  { key: 'shopping', icon: '🛒', label: '购物清单' },
]

const catList = [
  { k:'all', l:'全部' }, { k:'top', l:'上装' }, { k:'outer', l:'外套' },
  { k:'dress', l:'连衣裙' }, { k:'bottom', l:'下装' },
  { k:'shoes', l:'鞋子' }, { k:'accessory', l:'配饰' }
]

const filteredWardrobe = computed(() => {
  if (wardrobeFilter.value==='all') return wardrobe.value
  return wardrobe.value.filter(i=>i.category===wardrobeFilter.value)
})

// ===== Data Loading =====
async function fetchWardrobe() {
  try { wardrobe.value = await (await fetch('/api/user/wardrobe')).json() } catch {}
}
async function fetchConversations() {
  try { conversations.value = await get('/user/conversations') } catch {}
}

// 后端 created_at 为 UTC，但返回的 ISO 字符串不带 Z；转成浏览器本地时间显示
function fmtLocalTime(s) {
  if (!s) return ''
  const iso = String(s).trim()
  // 无偏移则视为 UTC
  const hasTz = /Z$|[+-]\d{2}:?\d{2}$/.test(iso)
  const d = new Date(hasTz ? iso : iso + 'Z')
  if (isNaN(d.getTime())) return s
  const p = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}
async function fetchAnalysis() {
  try { analysis.value = await (await fetch('/api/user/wardrobe-analysis')).json() } catch {}
}
async function fetchShoppingList() {
  try { shoppingList.value = await (await fetch('/api/user/shopping-list')).json() } catch {}
}

// ===== Chat =====
async function sendChat() {
  if (!chatInput.value||chatLoading.value) return
  const text = chatInput.value; chatInput.value = ''
  messages.value.push({ role: 'user', content: text })
  chatLoading.value = true
  try {
    const r = await fetch('/api/user/chat?user_input=' + encodeURIComponent(text))
    const d = await r.json()
    messages.value.push({ role: 'agent', content: d.response, cid: d.conversation_id, rating: 0 })
    fetchConversations()
  } catch { messages.value.push({ role: 'agent', content: '请求失败，请检查后端' }) }
  chatLoading.value = false
  nextTick(() => msgRef.value?.scrollTo({ top: 9999, behavior: 'smooth' }))
}

async function chatUploadImage(file) {
  const formData = new FormData(); formData.append('file', file)
  try {
    const r = await fetch('/api/user/analyze-image', { method: 'POST', body: formData })
    const d = await r.json()
    messages.value.push({ role: 'user', content: '上传了一张图片请分析搭配', image: URL.createObjectURL(file) })
    chatLoading.value = true
    const r2 = await fetch('/api/user/chat?user_input=' + encodeURIComponent('请分析这张图片并推荐搭配方案。识别结果：'+(d.analysis||'')))
    const d2 = await r2.json()
    messages.value.push({ role: 'agent', content: d2.response, cid: d2.conversation_id, rating: 0 })
    fetchConversations()
    chatLoading.value = false
  } catch { ElMessage.error('图片分析失败') }
  return false
}

async function rateMsg(m) {
  try {
    await fetch('/api/user/conversations/rate', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ conversation_id: m.cid, score: m.rating })
    })
    ElMessage.success('评分已提交')
  } catch {}
}

// ===== Today Outfit =====
async function getTodayOutfit() {
  todayLoading.value = true
  try {
    const r = await fetch('/api/user/today-outfit')
    const d = await r.json()
    todayResult.value = d.recommendation
    fetchConversations()
  } catch { todayResult.value = '请求失败，请稍后重试' }
  todayLoading.value = false
}

// ===== Upload =====
async function handleUploadImage(file) {
  uploadPreview.value = URL.createObjectURL(file)
  uploadedFile.value = file
  uploadDetecting.value = true
  const formData = new FormData(); formData.append('file', file)
  try {
    const r = await fetch('/api/user/wardrobe/upload-and-tag', { method: 'POST', body: formData })
    const d = await r.json()
    if (d.tags) {
      uploadForm.value = {
        name: d.tags.name || file.name,
        category: d.tags.category || 'top',
        color: d.tags.color || '',
        style: d.tags.style || '',
        season: d.tags.season || ''
      }
      uploadTags.value = d.tags
      ElMessage.success('AI识别完成，请确认后保存')
    }
  } catch { ElMessage.warning('AI识别失败，请手动填写') }
  uploadDetecting.value = false
  return false
}

async function confirmUpload() {
  if (!uploadedFile.value) return
  const formData = new FormData(); formData.append('file', uploadedFile.value)
  try {
    await fetch('/api/user/wardrobe/upload-and-tag', { method: 'POST', body: formData })
  } catch {
    await fetch('/api/user/wardrobe', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({
      ...uploadForm.value, image_url: uploadPreview.value
    }) })
  }
  showUpload.value = false
  resetUpload()
  fetchWardrobe()
  fetchShoppingList()
  ElMessage.success('已保存到衣橱')
}

function resetUpload() {
  uploadPreview.value = ''; uploadTags.value = null; uploadedFile.value = null
  uploadForm.value = { name: '', category: 'top', color: '', style: '', season: '' }
}

// ===== Wardrobe Item Actions =====
function pickItem(item) {
  currentView.value = 'chat'
  chatInput.value = '我有一件' + (item.color||'') + item.name + '，帮我搭配一下'
}

async function deleteItem(id) {
  try { await fetch('/api/user/wardrobe/'+id, {method:'DELETE'}); fetchWardrobe(); fetchShoppingList(); ElMessage.success('已删除') } catch {}
}

function openHistoryChat(conv) {
  currentView.value = 'chat'
  messages.value.push({ role: 'user', content: conv.user_input })
  messages.value.push({ role: 'agent', content: conv.agent_response, cid: conv.id, rating: conv.score })
}

onMounted(() => {
  fetchWardrobe()
  fetchConversations()
  fetchAnalysis()
  fetchShoppingList()
})
</script>

<style scoped>
.user-layout { flex:1; display:flex; background:#f5f7fa; height:100%; }

/* Sidebar */
.sidebar { width:200px; background:white; border-right:1px solid #e4e7ed; display:flex; flex-direction:column; overflow-y:auto; }
.sidebar-title { padding:16px; font-size:16px; font-weight:600; border-bottom:1px solid #eee; }
.nav-list { padding:8px 0; }
.nav-item { display:flex; align-items:center; padding:10px 16px; cursor:pointer; font-size:14px; position:relative; }
.nav-item:hover { background:#f0f5ff; }
.nav-item.active { background:#ecf5ff; color:#409eff; font-weight:500; }
.nav-icon { margin-right:8px; font-size:16px; }
.nav-label { flex:1; }
.nav-badge { position:absolute; right:12px; }

/* Main Area */
.main-area { flex:1; overflow-y:auto; padding:0; }
.view-panel { padding:24px; max-width:1000px; }
.panel-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; }
.panel-header h2 { margin:0; font-size:18px; }

/* Chat */
.chat-container { display:flex; flex-direction:column; height:calc(100vh - 140px); }
.messages { flex:1; overflow-y:auto; margin-bottom:12px; }
.msg { margin-bottom:16px; }
.msg-image { margin-bottom:4px; }
.chat-img { max-width:300px; max-height:200px; border-radius:8px; }
.msg-bubble { max-width:650px; }
.msg-label { font-size:12px; color:#999; margin-bottom:4px; }
.msg-text { padding:12px 16px; border-radius:12px; line-height:1.6; font-size:14px; white-space:pre-wrap; word-break:break-word; }
.msg-user .msg-text { background:#409eff; color:white; border-bottom-right-radius:4px; }
.msg-agent .msg-text { background:white; border:1px solid #e4e7ed; border-bottom-left-radius:4px; }
.msg-rate { margin-top:6px; display:flex; align-items:center; gap:8px; }
.rate-hint { font-size:11px; color:#999; }
.chat-input { display:flex; gap:8px; padding:12px; background:white; border:1px solid #e4e7ed; border-radius:8px; }

/* Wardrobe Grid */
.wardrobe-content { }
.filter-bar { margin-bottom:12px; }
.wardrobe-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(240px,1fr)); gap:12px; }
.wardrobe-card { background:white; border-radius:8px; overflow:hidden; border:1px solid #eee; }
.card-img { height:180px; overflow:hidden; background:#f7f8fa; display:flex; align-items:center; justify-content:center; }
.card-img img { max-width:100%; max-height:100%; object-fit:contain; }
.card-placeholder { width:100%; height:100%; display:flex; align-items:center; justify-content:center; font-size:36px; color:white; }
.card-info { padding:8px 12px; }
.card-name { font-size:14px; font-weight:500; margin-bottom:4px; }
.card-tags { display:flex; gap:4px; flex-wrap:wrap; }
.card-actions { padding:8px 12px; border-top:1px solid #f5f5f5; display:flex; justify-content:flex-end; gap:8px; }

/* Upload */
.upload-content { max-width:800px; }
.upload-area { margin-bottom:24px; }
.upload-result { }
.result-row { display:flex; gap:24px; }
.result-img { width:200px; flex-shrink:0; }
.result-img img { width:100%; border-radius:8px; }
.result-form { flex:1; }
.detecting { text-align:center; padding:40px; color:#999; }

/* Today */
.today-hero { text-align:center; padding:60px 0; }
.today-result { background:white; padding:24px; border-radius:12px; border:1px solid #e4e7ed; line-height:1.8; white-space:pre-wrap; }

/* History */
.history-card { background:white; padding:12px 16px; margin-bottom:8px; border-radius:8px; cursor:pointer; border:1px solid #eee; }
.history-card:hover { border-color:#409eff; }
.history-q { font-weight:500; margin-bottom:4px; }
.history-a { font-size:13px; color:#666; margin-bottom:4px; }
.history-meta { display:flex; justify-content:space-between; align-items:center; }

/* Shopping */
.shop-card { background:white; padding:16px; margin-bottom:8px; border-radius:8px; border:1px solid #eee; }

/* Analysis */
.stat-row { display:flex; align-items:center; gap:12px; margin:8px 0; }
.stat-label { width:60px; font-size:13px; }
.header-actions { display:flex; gap:8px; }
</style>
