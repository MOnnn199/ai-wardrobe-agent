import os

path = r'E:\ai-wardrobe-agent\frontend\src\views\user\Index.vue'

content = """<template>
  <div class="user-layout">
    <header class="header">
      <h1>AI 穿搭助手</h1>
      <div class="header-actions">
        <el-upload :show-file-list="false" :before-upload="handleImageChat" accept="image/*">
          <el-button size="small" plain><el-icon><PictureFilled /></el-icon> 传图搭配</el-button>
        </el-upload>
        <el-button size="small" plain @click="todayOutfit">今天穿什么</el-button>
        <el-button size="small" plain @click="fetchAnalysis(); showAnalysis=true">衣橱分析</el-button>
      </div>
    </header>
    <div class="body">
      <aside class="sidebar">
        <div class="sidebar-header">
          <h3>我的衣橱</h3>
          <el-button type="primary" size="small" @click="showUploadDialog=true">
            <el-icon><Upload /></el-icon> 拍照上传
          </el-button>
        </div>
        <div class="category-tabs">
          <el-tag v-for="c in catList" :key="c.k"
            :type="wardrobeCategory===c.k ? 'primary' : 'info'"
            size="small" style="cursor:pointer;margin:2px" @click="wardrobeCategory=c.k">{{ c.l }}</el-tag>
        </div>
        <div class="wardrobe-list">
          <div v-for="item in filteredWardrobe" :key="item.id" class="wardrobe-item" @click="pickItem(item)">
            <div class="item-thumb">
              <img v-if="item.image_url" :src="item.image_url" class="thumb-img" />
              <div v-else class="thumb-placeholder" :style="{background: item.color||'#ccc'}"></div>
            </div>
            <div class="item-info">
              <div class="item-name">{{ item.name }}</div>
              <div class="item-meta">{{ item.style }} {{ item.color }}</div>
            </div>
            <el-popconfirm title="确定删除？" @confirm="deleteItem(item.id)">
              <template #reference>
                <el-button text type="danger" size="small">x</el-button>
              </template>
            </el-popconfirm>
          </div>
          <el-empty v-if="filteredWardrobe.length===0" description="衣橱为空，点击右上角上传" :image-size="60" />
        </div>
        <div class="sidebar-section">
          <h3>对话历史</h3>
          <div v-for="conv in conversations" :key="conv.id" class="history-item" @click="loadHistory(conv)">
            <span class="history-text">{{ (conv.user_input||'').substring(0,15) }}..</span>
            <el-tag v-if="conv.score>=4" size="small" type="success">{{ conv.score }}</el-tag>
            <el-tag v-else-if="conv.score<=2&&conv.score>0" size="small" type="danger">{{ conv.score }}</el-tag>
          </div>
        </div>
      </aside>
      <main class="chat-area">
        <div class="messages" ref="msgRef">
          <div v-for="(m,i) in messages" :key="i" :class="'msg msg-'+m.role">
            <div class="msg-label">{{ m.role==='user'?'你':'AI 助手' }}</div>
            <div v-if="m.image" class="msg-image">
              <img :src="m.image" style="max-width:300px;max-height:200px;border-radius:8px" />
            </div>
            <div class="msg-content">{{ m.content }}</div>
            <div v-if="m.role==='agent'&&m.cid" class="msg-actions">
              <el-rate v-model="m.rating" :max="5" @change="rateMsg(m)" />
              <el-input v-if="m.showFb" v-model="m.feedback" size="small" placeholder="反馈意见" style="width:180px" />
            </div>
          </div>
          <div v-if="loading" class="msg msg-agent">
            <div class="msg-content"><el-icon class="is-loading"><Loading /></el-icon> 思考中...</div>
          </div>
        </div>
        <div class="input-area">
          <el-upload :show-file-list="false" :before-upload="handleImageChat" accept="image/*">
            <el-button :disabled="loading"><el-icon><PictureFilled /></el-icon></el-button>
          </el-upload>
          <el-input v-model="input" placeholder="描述穿搭需求，或点击左侧图片上传..." @keyup.enter="send" :disabled="loading" />
          <el-button type="primary" @click="send" :disabled="loading||!input">发送</el-button>
        </div>
      </main>
    </div>

    <!-- Upload Dialog -->
    <el-dialog v-model="showUploadDialog" title="上传衣物" width="500px">
      <el-upload
        drag
        :show-file-list="false"
        :before-upload="handleUploadImage"
        accept="image/*"
        style="margin-bottom:16px">
        <el-icon style="font-size:48px;color:#409eff"><Plus /></el-icon>
        <div style="margin-top:8px">点击或拖拽上传图片</div>
        <div style="font-size:12px;color:#999">支持 JPG/PNG，上传后自动识别标签</div>
      </el-upload>
      <div v-if="uploadPreview" class="upload-preview">
        <img :src="uploadPreview" style="max-width:100%;max-height:200px;border-radius:8px" />
      </div>
      <el-form v-if="uploadTags" :model="uploadForm" label-width="70px">
        <el-form-item label="名称"><el-input v-model="uploadForm.name" /></el-form-item>
        <el-form-item label="品类">
          <el-select v-model="uploadForm.category">
            <el-option label="上装" value="top" /><el-option label="下装" value="bottom" />
            <el-option label="鞋子" value="shoes" /><el-option label="配饰" value="accessory" />
          </el-select>
        </el-form-item>
        <el-form-item label="颜色"><el-input v-model="uploadForm.color" /></el-form-item>
        <el-form-item label="风格"><el-input v-model="uploadForm.style" /></el-form-item>
        <el-form-item label="季节"><el-input v-model="uploadForm.season" /></el-form-item>
      </el-form>
      <div v-if="uploadLoading" style="text-align:center;padding:20px">
        <el-icon class="is-loading" style="font-size:24px"><Loading /></el-icon>
        <p>AI 正在识别中...</p>
      </div>
      <template #footer>
        <el-button @click="showUploadDialog=false">取消</el-button>
        <el-button type="primary" :disabled="!uploadPreview" @click="confirmUpload">保存到衣橱</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showAnalysis" title="衣橱分析" width="550px">
      <div v-if="analysis">
        <el-descriptions :column="3" border>
          <el-descriptions-item label="总数">{{ analysis.total_items }}</el-descriptions-item>
          <el-descriptions-item label="闲置">{{ (analysis.unused_items||[]).length }}</el-descriptions-item>
          <el-descriptions-item label="重复">{{ (analysis.duplicate_warnings||[]).length }}</el-descriptions-item>
        </el-descriptions>
        <h4 style="margin-top:16px">分类分布</h4>
        <div v-for="(v,k) in analysis.category_distribution" :key="k" class="stat-row">
          <span>{{ k }}</span>
          <el-progress :percentage="Math.round(v/analysis.total_items*100)" :stroke-width="20" />
        </div>
        <h4 v-if="analysis.suggestions&&analysis.suggestions.length">建议</h4>
        <ul><li v-for="(s,i) in analysis.suggestions" :key="i">{{ s }}</li></ul>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { PictureFilled, Upload, Plus, Loading } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const input = ref('')
const messages = ref([])
const loading = ref(false)
const msgRef = ref(null)
const wardrobeCategory = ref('all')
const wardrobe = ref([])
const conversations = ref([])
const analysis = ref(null)
const showAnalysis = ref(false)
const showUploadDialog = ref(false)
const uploadPreview = ref('')
const uploadTags = ref(null)
const uploadLoading = ref(false)
const uploadForm = ref({ name: '', category: 'top', color: '', style: '', season: '' })
const uploadedFile = ref(null)

const catList = [
  {k:'all',l:'全部'},{k:'top',l:'上装'},{k:'bottom',l:'下装'},
  {k:'shoes',l:'鞋子'},{k:'accessory',l:'配饰'}
]

const filteredWardrobe = computed(() => {
  if (wardrobeCategory.value==='all') return wardrobe.value
  return wardrobe.value.filter(i=>i.category===wardrobeCategory.value)
})

async function fetchAll() {
  try { wardrobe.value = await (await fetch('/api/user/wardrobe')).json() } catch {}
  try { conversations.value = await (await fetch('/api/user/conversations')).json() } catch {}
}

async function handleUploadImage(file) {
  uploadLoading.value = true
  uploadPreview.value = URL.createObjectURL(file)
  uploadedFile.value = file

  const formData = new FormData()
  formData.append('file', file)
  try {
    const r = await fetch('/api/user/wardrobe/upload-and-tag', { method: 'POST', body: formData })
    const data = await r.json()
    if (data.tags) {
      uploadForm.value = {
        name: data.tags.name || file.name,
        category: data.tags.category || 'top',
        color: data.tags.color || '',
        style: data.tags.style || '',
        season: data.tags.season || ''
      }
      uploadTags.value = data.tags
      ElMessage.success('AI 已自动识别标签，请确认后保存')
    }
  } catch {
    ElMessage.warning('AI识别失败，请手动填写标签')
    uploadTags.value = { name: file.name }
  }
  uploadLoading.value = false
  return false
}

async function confirmUpload() {
  if (!uploadedFile.value) return
  const formData = new FormData()
  formData.append('file', uploadedFile.value)
  formData.append('user_id', '1')
  try {
    const r = await fetch('/api/user/wardrobe/upload-and-tag', { method: 'POST', body: formData })
    await r.json()
  } catch {
    // Fallback to manual save
    await fetch('/api/user/wardrobe', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(uploadForm.value)
    })
  }
  showUploadDialog.value = false
  uploadPreview.value = ''
  uploadTags.value = null
  uploadedFile.value = null
  uploadForm.value = { name: '', category: 'top', color: '', style: '', season: '' }
  fetchAll()
  ElMessage.success('已保存到衣橱')
}

async function handleImageChat(file) {
  loading.value = true
  const formData = new FormData()
  formData.append('file', file)
  try {
    const r = await fetch('/api/user/analyze-image', { method: 'POST', body: formData })
    const data = await r.json()
    messages.value.push({
      role: 'user',
      content: '帮我看看这张图片里的衣服怎么搭配',
      image: URL.createObjectURL(file)
    })
    const chatR = await fetch('/api/user/chat?user_input=' +
      encodeURIComponent('我上传了一张图片，请分析并推荐搭配。图片分析结果：' + (data.analysis||'')))
    const chatData = await chatR.json()
    messages.value.push({
      role: 'agent',
      content: chatData.response,
      cid: chatData.conversation_id,
      rating: 0, feedback: '', showFb: false
    })
    fetchAll()
  } catch {
    messages.value.push({ role: 'user', content: '上传了一张图片', image: URL.createObjectURL(file) })
    messages.value.push({ role: 'agent', content: '图片分析请求失败' })
  }
  loading.value = false
  return false
}

async function send() {
  if (!input.value||loading.value) return
  const text = input.value; input.value = ''
  messages.value.push({ role: 'user', content: text })
  loading.value = true
  try {
    const r = await fetch('/api/user/chat?user_input=' + encodeURIComponent(text))
    const d = await r.json()
    messages.value.push({
      role: 'agent', content: d.response,
      cid: d.conversation_id, rating: 0, feedback: '', showFb: false
    })
    fetchAll()
  } catch { messages.value.push({ role: 'agent', content: '请求失败' }) }
  loading.value = false
  nextTick(() => msgRef.value?.scrollTo({ top: 9999, behavior: 'smooth' }))
}

async function todayOutfit() {
  loading.value = true
  messages.value.push({ role: 'user', content: '今天穿什么？' })
  try {
    const d = await (await fetch('/api/user/today-outfit')).json()
    messages.value.push({ role: 'agent', content: d.recommendation, cid: d.conversation_id, rating: 0, showFb: false })
  } catch { messages.value.push({ role: 'agent', content: '请求失败' }) }
  loading.value = false
}

async function fetchAnalysis() {
  try { analysis.value = await (await fetch('/api/user/wardrobe-analysis')).json() } catch {}
}

async function rateMsg(m) {
  try {
    await fetch('/api/user/conversations/rate', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ conversation_id: m.cid, score: m.rating, feedback: m.feedback||'' })
    })
    ElMessage.success('评分已提交')
    m.showFb = m.rating <= 2
  } catch {}
}

function pickItem(item) {
  input.value = '我有一件' + (item.color||'') + item.name
}

async function deleteItem(id) {
  try { await fetch('/api/user/wardrobe/'+id, {method:'DELETE'}); fetchAll(); ElMessage.success('已删除') } catch {}
}

function loadHistory(conv) {
  messages.value.push({ role: 'user', content: conv.user_input })
  messages.value.push({ role: 'agent', content: conv.agent_response, cid: conv.id, rating: conv.score })
}

onMounted(fetchAll)
</script>

<style scoped>
.user-layout { flex:1; display:flex; flex-direction:column; background:#f5f7fa; }
.header { padding:12px 24px; background:linear-gradient(135deg,#409eff,#337ecc); color:white; display:flex; justify-content:space-between; align-items:center; }
.header h1 { font-size:18px; margin:0; }
.header-actions { display:flex; gap:8px; align-items:center; }
.body { display:flex; flex:1; overflow:hidden; }
.sidebar { width:280px; background:white; border-right:1px solid #e4e7ed; display:flex; flex-direction:column; overflow-y:auto; }
.sidebar-header { padding:12px 16px; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #eee; }
.sidebar-header h3 { margin:0; font-size:14px; }
.category-tabs { padding:8px 12px; }
.wardrobe-list { flex:1; overflow-y:auto; padding:8px 12px; }
.wardrobe-item { display:flex; align-items:center; padding:8px; border-radius:6px; cursor:pointer; gap:8px; }
.wardrobe-item:hover { background:#f0f5ff; }
.item-thumb { width:40px; height:40px; border-radius:6px; overflow:hidden; flex-shrink:0; }
.thumb-img { width:100%; height:100%; object-fit:cover; }
.thumb-placeholder { width:100%; height:100%; border-radius:6px; }
.item-info { flex:1; min-width:0; }
.item-name { font-size:13px; font-weight:500; }
.item-meta { font-size:11px; color:#999; }
.sidebar-section { border-top:1px solid #eee; padding:12px 16px; }
.sidebar-section h3 { font-size:14px; margin:0 0 8px; }
.history-item { padding:6px 8px; cursor:pointer; border-radius:4px; display:flex; justify-content:space-between; align-items:center; font-size:12px; }
.history-item:hover { background:#f0f5ff; }
.history-text { flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.chat-area { flex:1; display:flex; flex-direction:column; }
.messages { flex:1; overflow-y:auto; padding:16px 24px; }
.msg { max-width:750px; margin-bottom:16px; }
.msg-agent { margin-right:auto; }
.msg-user { margin-left:auto; text-align:right; }
.msg-label { font-size:12px; color:#999; margin-bottom:4px; }
.msg-image { margin-bottom:4px; }
.msg-content { padding:12px 16px; border-radius:12px; line-height:1.6; font-size:14px; white-space:pre-wrap; word-break:break-word; }
.msg-user .msg-content { background:#409eff; color:white; border-bottom-right-radius:4px; }
.msg-agent .msg-content { background:white; border:1px solid #e4e7ed; border-bottom-left-radius:4px; }
.msg-actions { margin-top:8px; display:flex; align-items:center; gap:8px; }
.input-area { padding:12px 24px 16px; background:white; border-top:1px solid #e4e7ed; display:flex; gap:8px; align-items:center; }
.upload-preview { text-align:center; margin-bottom:16px; }
.stat-row { display:flex; align-items:center; gap:8px; margin:8px 0; }
.stat-row span { width:60px; font-size:13px; }
</style>
"""

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print('User Index.vue rewritten with image features')