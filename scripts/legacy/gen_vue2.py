import os

BASE = r'E:\ai-wardrobe-agent\frontend\src'

def w(relpath, content):
    full = os.path.join(BASE, relpath)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    with open(full, 'w', encoding='utf-8') as f:
        f.write(content)
    print('Wrote:', relpath)

# === Stylist page ===
w('views/stylist/Index.vue', '''<template>
  <div class="layout">
    <header class="header" style="background:#67c23a"><h1>搭配师端</h1></header>
    <el-tabs v-model="tab" class="tabs">
      <el-tab-pane label="翻车案例" name="corrections">
        <el-table :data="corrections" style="width:100%">
          <el-table-column prop="id" label="ID" width="60" />
          <el-table-column prop="conversation_id" label="对话ID" width="80" />
          <el-table-column prop="error_type" label="错误类型" width="100" />
          <el-table-column prop="status" label="状态" width="80" />
          <el-table-column prop="created_at" label="时间" />
          <el-table-column label="操作">
            <template #default="{row}">
              <el-button size="small" @click="viewCorrection(row)">查看</el-button>
              <el-button size="small" type="primary" @click="editCorrection(row)">修正</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-dialog v-model="showCorrection" title="修正翻车案例" width="700px">
          <div v-if="currentConv">
            <h4>用户输入</h4>
            <p>{{ currentConv.conversation.user_input }}</p>
            <h4>原始回复</h4>
            <p>{{ currentConv.conversation.agent_response }}</p>
          </div>
          <el-form :model="correctionForm" label-width="80px" style="margin-top:16px">
            <el-form-item label="错误类型">
              <el-select v-model="correctionForm.error_type">
                <el-option label="风格" value="style" />
                <el-option label="场合" value="occasion" />
                <el-option label="颜色" value="color" />
                <el-option label="尺码" value="size" />
                <el-option label="其他" value="other" />
              </el-select>
            </el-form-item>
            <el-form-item label="正确答案">
              <el-input type="textarea" v-model="correctionForm.correct_response" :rows="6" />
            </el-form-item>
          </el-form>
          <template #footer>
            <el-button @click="showCorrection=false">取消</el-button>
            <el-button type="primary" @click="submitCorrection">提交</el-button>
          </template>
        </el-dialog>
      </el-tab-pane>
      <el-tab-pane label="知识库" name="knowledge">
        <div style="margin-bottom:12px">
          <el-upload :action="'/api/stylist/knowledge/upload'" :show-file-list="false" :on-success="loadKnowledge">
            <el-button type="primary">上传文件</el-button>
          </el-upload>
        </div>
        <el-table :data="knowledgeChunks" style="width:100%">
          <el-table-column prop="source" label="来源" width="150" />
          <el-table-column prop="text" label="内容" min-width="400">
            <template #default="{row}">{{ row.text.substring(0,100) }}...</template>
          </el-table-column>
          <el-table-column prop="created_at" label="上传时间" width="160" />
          <el-table-column label="操作" width="80">
            <template #default="{row}">
              <el-button text type="danger" size="small" @click="deleteChunk(row.chunk_id)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
      <el-tab-pane label="标签管理" name="tags">
        <div style="margin-bottom:12px">
          <el-input v-model="tagForm.name" placeholder="标签名" style="width:200px;margin-right:8px" />
          <el-button type="primary" @click="addTag">添加标签</el-button>
        </div>
        <el-tag v-for="tag in tags" :key="tag.id" closable @close="deleteTag(tag.id)" style="margin:4px">
          {{ tag.name }}
        </el-tag>
      </el-tab-pane>
      <el-tab-pane label="Few-Shot示例" name="fewshot">
        <el-button type="primary" @click="showFewShot=true" style="margin-bottom:12px">+ 添加示例</el-button>
        <el-table :data="fewShots" style="width:100%">
          <el-table-column prop="title" label="标题" width="150" />
          <el-table-column prop="user_input" label="用户输入" min-width="200" />
          <el-table-column prop="correct_response" label="正确答案" min-width="300" />
          <el-table-column label="操作" width="80">
            <template #default="{row}">
              <el-button text type="danger" size="small" @click="deleteFewShot(row.id)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-dialog v-model="showFewShot" title="添加Few-Shot示例" width="600px">
          <el-form :model="fewShotForm" label-width="80px">
            <el-form-item label="标题"><el-input v-model="fewShotForm.title" /></el-form-item>
            <el-form-item label="用户输入"><el-input type="textarea" v-model="fewShotForm.user_input" :rows="3" /></el-form-item>
            <el-form-item label="正确答案"><el-input type="textarea" v-model="fewShotForm.correct_response" :rows="5" /></el-form-item>
          </el-form>
          <template #footer>
            <el-button @click="showFewShot=false">取消</el-button>
            <el-button type="primary" @click="saveFewShot">保存</el-button>
          </template>
        </el-dialog>
      </el-tab-pane>
      <el-tab-pane label="知识缺口" name="gaps">
        <el-table :data="knowledgeGaps" style="width:100%">
          <el-table-column prop="topic" label="话题" min-width="300" />
          <el-table-column prop="frequency" label="频率" width="100" />
        </el-table>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

const tab = ref('corrections')
const corrections = ref([])
const knowledgeChunks = ref([])
const tags = ref([])
const fewShots = ref([])
const knowledgeGaps = ref([])
const showCorrection = ref(false)
const currentConv = ref(null)
const correctionForm = ref({ conversation_id: 0, error_type: '', correct_response: '' })
const showFewShot = ref(false)
const tagForm = ref({ name: '' })
const fewShotForm = ref({ title: '', user_input: '', correct_response: '' })

async function loadCorrections() {
  try { corrections.value = await (await fetch('/api/stylist/corrections')).json() } catch {}
}
async function loadKnowledge() {
  try { knowledgeChunks.value = await (await fetch('/api/stylist/knowledge/chunks')).json() } catch {}
}
async function loadTags() {
  try { tags.value = await (await fetch('/api/stylist/tags')).json() } catch {}
}
async function loadFewShots() {
  try { fewShots.value = await (await fetch('/api/stylist/few-shot-examples')).json() } catch {}
}
async function loadGaps() {
  try { const d = await (await fetch('/api/stylist/knowledge-gaps')).json(); knowledgeGaps.value = d.gaps || [] } catch {}
}

async function viewCorrection(row) {
  try {
    currentConv.value = await (await fetch('/api/stylist/conversations/' + row.conversation_id)).json()
    correctionForm.value = { conversation_id: row.conversation_id, error_type: row.error_type, correct_response: row.correct_response || '' }
    showCorrection.value = true
  } catch {}
}

async function editCorrection(row) {
  await viewCorrection(row)
}

async function submitCorrection() {
  try {
    const url = correctionForm.value.conversation_id ? '/api/stylist/corrections' : ''
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(correctionForm.value)
    })
    showCorrection.value = false
    loadCorrections()
    ElMessage.success('已提交')
  } catch {}
}

async function deleteChunk(id) {
  await fetch('/api/stylist/knowledge/chunks/' + id, { method: 'DELETE' })
  loadKnowledge()
  ElMessage.success('已删除')
}

async function addTag() {
  await fetch('/api/stylist/tags', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: tagForm.value.name }) })
  tagForm.value.name = ''
  loadTags()
  ElMessage.success('已添加')
}

async function deleteTag(id) {
  await fetch('/api/stylist/tags/' + id, { method: 'DELETE' })
  loadTags()
}

async function saveFewShot() {
  await fetch('/api/stylist/few-shot-examples', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(fewShotForm.value) })
  showFewShot.value = false
  fewShotForm.value = { title: '', user_input: '', correct_response: '' }
  loadFewShots()
  ElMessage.success('已添加')
}

async function deleteFewShot(id) {
  await fetch('/api/stylist/few-shot-examples/' + id, { method: 'DELETE' })
  loadFewShots()
}

onMounted(() => { loadCorrections(); loadKnowledge(); loadTags(); loadFewShots(); loadGaps() })
</script>

<style scoped>
.layout { height:100vh; display:flex; flex-direction:column; }
.header { padding:16px 24px; color:white; }
.header h1 { margin:0; font-size:18px; }
.tabs { flex:1; padding:16px 24px; overflow-y:auto; }
</style>
''')

print('Stylist done')

# === Config page ===
w('views/config/Index.vue', '''<template>
  <div class="layout">
    <header class="header" style="background:#e6a23c"><h1>配置端</h1></header>
    <el-tabs v-model="tab" class="tabs">
      <el-tab-pane label="Prompt管理" name="prompts">
        <el-button type="primary" @click="showPrompt=true" style="margin-bottom:12px">+ 新建Prompt</el-button>
        <el-table :data="prompts" style="width:100%">
          <el-table-column prop="name" label="名称" width="150" />
          <el-table-column prop="content" label="内容" min-width="300">
            <template #default="{row}">{{ row.content.substring(0,80) }}...</template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="80" />
          <el-table-column label="操作" width="160">
            <template #default="{row}">
              <el-button size="small" @click="editPrompt(row)">编辑</el-button>
              <el-button size="small" type="success" @click="deployPrompt(row.id)" v-if="row.status!=='online'">发布</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-dialog v-model="showPrompt" title="编辑Prompt" width="700px">
          <el-form :model="promptForm" label-width="60px">
            <el-form-item label="名称"><el-input v-model="promptForm.name" /></el-form-item>
            <el-form-item label="内容"><el-input type="textarea" v-model="promptForm.content" :rows="12" /></el-form-item>
          </el-form>
          <template #footer>
            <el-button @click="showPrompt=false">取消</el-button>
            <el-button type="primary" @click="savePrompt">保存</el-button>
          </template>
        </el-dialog>
      </el-tab-pane>
      <el-tab-pane label="模型配置" name="model">
        <el-form :model="modelConfig" label-width="120px">
          <el-form-item label="模型名称">
            <el-select v-model="modelConfig.model_name">
              <el-option label="DeepSeek Chat" value="deepseek-chat" />
              <el-option label="GPT-4o-mini (预留)" value="gpt-4o-mini" />
              <el-option label="通义千问 (预留)" value="qwen-plus" />
            </el-select>
          </el-form-item>
          <el-form-item label="Temperature">
            <el-slider v-model="modelConfig.temperature" :min="0" :max="2" :step="0.1" />
          </el-form-item>
          <el-form-item label="Top P">
            <el-slider v-model="modelConfig.top_p" :min="0" :max="1" :step="0.05" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="saveModelConfig">保存配置</el-button>
          </el-form-item>
        </el-form>
      </el-tab-pane>
      <el-tab-pane label="工具管理" name="tools">
        <el-table :data="tools" style="width:100%">
          <el-table-column prop="name" label="工具名" width="150" />
          <el-table-column prop="description" label="描述" />
          <el-table-column label="状态" width="80">
            <template #default="{row}">
              <el-switch v-model="row.enabled" @change="toggleTool(row)" />
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
      <el-tab-pane label="审批流水线" name="pipeline">
        <el-descriptions :column="4" border style="margin-bottom:16px">
          <el-descriptions-item label="待修">{{ pipeline.pending }}</el-descriptions-item>
          <el-descriptions-item label="已提交">{{ pipeline.fixed }}</el-descriptions-item>
          <el-descriptions-item label="已批准">{{ pipeline.approved }}</el-descriptions-item>
          <el-descriptions-item label="已上线">{{ pipeline.deployed }}</el-descriptions-item>
        </el-descriptions>
      </el-tab-pane>
      <el-tab-pane label="系统监控" name="monitor">
        <el-descriptions :column="2" border v-if="monitor">
          <el-descriptions-item label="状态">{{ monitor.status }}</el-descriptions-item>
          <el-descriptions-item label="当前模型">{{ monitor.current_model }}</el-descriptions-item>
          <el-descriptions-item label="工具总数">{{ monitor.total_tools }}</el-descriptions-item>
          <el-descriptions-item label="活跃工具">{{ (monitor.active_tools || []).join(', ') }}</el-descriptions-item>
        </el-descriptions>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

const tab = ref('prompts')
const prompts = ref([])
const showPrompt = ref(false)
const promptForm = ref({ name: '', content: '' })
const editingPromptId = ref(null)
const modelConfig = ref({ model_name: 'deepseek-chat', temperature: 0.7, top_p: 1.0 })
const tools = ref([])
const pipeline = ref({ pending: 0, fixed: 0, approved: 0, deployed: 0 })
const monitor = ref(null)

async function loadPrompts() {
  try { prompts.value = await (await fetch('/api/config/prompts')).json() } catch {}
}
async function loadModel() {
  try { modelConfig.value = await (await fetch('/api/config/model-config')).json() } catch {}
}
async function loadTools() {
  try { tools.value = await (await fetch('/api/config/tools')).json() } catch {}
}
async function loadPipeline() {
  try { pipeline.value = await (await fetch('/api/config/pipeline')).json() } catch {}
}
async function loadMonitor() {
  try { monitor.value = await (await fetch('/api/config/monitor')).json() } catch {}
}

function editPrompt(row) {
  promptForm.value = { name: row.name, content: row.content }
  editingPromptId.value = row.id
  showPrompt.value = true
}

async function savePrompt() {
  const method = editingPromptId.value ? 'PUT' : 'POST'
  const url = editingPromptId.value ? '/api/config/prompts/' + editingPromptId.value : '/api/config/prompts'
  await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(promptForm.value) })
  showPrompt.value = false
  promptForm.value = { name: '', content: '' }
  editingPromptId.value = null
  loadPrompts()
  ElMessage.success('已保存')
}

async function deployPrompt(id) {
  await fetch('/api/config/prompts/' + id + '/deploy', { method: 'POST' })
  loadPrompts()
  ElMessage.success('已上线')
}

async function saveModelConfig() {
  await fetch('/api/config/model-config', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(modelConfig.value) })
  ElMessage.success('配置已保存')
}

async function toggleTool(row) {
  await fetch('/api/config/tools/toggle', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tool_name: row.name, enabled: row.enabled }) })
}

onMounted(() => { loadPrompts(); loadModel(); loadTools(); loadPipeline(); loadMonitor() })
</script>

<style scoped>
.layout { height:100vh; display:flex; flex-direction:column; }
.header { padding:16px 24px; color:white; }
.header h1 { margin:0; font-size:18px; }
.tabs { flex:1; padding:16px 24px; overflow-y:auto; }
</style>
''')

print('Config done')
print('ALL DONE')