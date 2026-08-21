import os, base64

BASE = r'E:\ai-wardrobe-agent\frontend\src'

def w(relpath, content):
    full = os.path.join(BASE, relpath)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    with open(full, 'w', encoding='utf-8') as f:
        f.write(content)
    print('Wrote:', relpath)

# ===== User page =====
w('views/user/Index.vue', '''<template>
  <div class="user-layout">
    <header class="header">
      <h1>AI 穿搭助手</h1>
      <div>
        <el-button size="small" plain @click="todayOutfit">今天穿什么</el-button>
      </div>
    </header>
    <div class="body">
      <aside class="sidebar">
        <h3>我的衣橱 <el-button size="small" @click="showForm=true">+</el-button></h3>
        <div v-for="item in wardrobe" :key="item.id" class="item">
          <span>{{ item.name }} ({{ item.color }})</span>
          <el-button text type="danger" size="small" @click="del(item.id)">x</el-button>
        </div>
      </aside>
      <main class="chat">
        <div class="msgs">
          <div v-for="(m,i) in messages" :key="i" :class="'msg-'+m.role">
            <div>{{ m.content }}</div>
            <div v-if="m.role==='agent'&&m.cid" style="margin-top:4px">
              <el-rate v-model="m.rating" :max="5" @change="rateIt(m)" />
            </div>
          </div>
        </div>
        <div class="input-row">
          <el-input v-model="input" placeholder="描述你的需求..." @keyup.enter="send" />
          <el-button type="primary" @click="send">发送</el-button>
        </div>
      </main>
    </div>
    <el-dialog v-model="showForm" title="添加衣物" width="400px">
      <el-form :model="form" label-width="60px">
        <el-form-item label="名称"><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="品类">
          <el-select v-model="form.category">
            <el-option label="上装" value="top" />
            <el-option label="下装" value="bottom" />
            <el-option label="鞋子" value="shoes" />
            <el-option label="配饰" value="accessory" />
          </el-select>
        </el-form-item>
        <el-form-item label="颜色"><el-input v-model="form.color" /></el-form-item>
        <el-form-item label="风格"><el-input v-model="form.style" /></el-form-item>
        <el-form-item label="季节"><el-input v-model="form.season" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showForm=false">取消</el-button>
        <el-button type="primary" @click="saveItem">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

const input = ref('')
const messages = ref([])
const wardrobe = ref([])
const showForm = ref(false)
const form = ref({ name: '', category: 'top', color: '', style: '', season: '' })

async function loadWardrobe() {
  try { wardrobe.value = await (await fetch('/api/user/wardrobe')).json() } catch {}
}
async function send() {
  if (!input.value) return
  messages.value.push({ role: 'user', content: input.value })
  try {
    const d = await (await fetch('/api/user/chat?user_input=' + encodeURIComponent(input.value))).json()
    messages.value.push({ role: 'agent', content: d.response, cid: d.conversation_id, rating: 0 })
  } catch { messages.value.push({ role: 'agent', content: '请求失败' }) }
  input.value = ''
}
async function todayOutfit() {
  messages.value.push({ role: 'user', content: '今天穿什么？' })
  try {
    const d = await (await fetch('/api/user/today-outfit')).json()
    messages.value.push({ role: 'agent', content: d.recommendation, cid: d.conversation_id, rating: 0 })
  } catch {}
}
async function rateIt(m) {
  await fetch('/api/user/conversations/rate', { method: 'POST', headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ conversation_id: m.cid, score: m.rating }) })
  ElMessage.success('评分已提交')
}
async function del(id) {
  await fetch('/api/user/wardrobe/' + id, { method: 'DELETE' })
  loadWardrobe()
  ElMessage.success('已删除')
}
async function saveItem() {
  await fetch('/api/user/wardrobe', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(form.value) })
  showForm.value = false
  form.value = { name: '', category: 'top', color: '', style: '', season: '' }
  loadWardrobe()
  ElMessage.success('已添加')
}
onMounted(loadWardrobe)
</script>

<style scoped>
.user-layout { height:100vh; display:flex; flex-direction:column; background:#f5f7fa; }
.header { padding:12px 24px; background:#409eff; color:white; display:flex; justify-content:space-between; }
.body { display:flex; flex:1; }
.sidebar { width:240px; background:white; border-right:1px solid #ddd; padding:12px; overflow-y:auto; }
.item { display:flex; justify-content:space-between; padding:6px 0; font-size:13px; }
.chat { flex:1; display:flex; flex-direction:column; }
.msgs { flex:1; overflow-y:auto; padding:16px; }
.msg-user { text-align:right; margin:8px 0; }
.msg-agent { margin:8px 0; }
.input-row { display:flex; gap:8px; padding:12px 16px; border-top:1px solid #ddd; background:white; }
</style>
''')

print('All done')