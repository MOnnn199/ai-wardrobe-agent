<template>
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
.layout { flex:1; display:flex; flex-direction:column; }
.header { padding:16px 24px; color:white; }
.header h1 { margin:0; font-size:18px; }
.tabs { flex:1; padding:16px 24px; overflow-y:auto; }
</style>
