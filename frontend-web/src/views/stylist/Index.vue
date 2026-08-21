<template>
  <SidebarLayout v-model:active="active" :menus="menus" brand="搭配师端" role="stylist">
    <template #notifications>
      <div class="noti-task-list">
        <div v-for="(t, i) in taskList" :key="i" class="noti-task-item" @click="taskChecks[i] = !taskChecks[i]">
          <span class="noti-task-dot" :style="{ background: t.done ? '#c5d9ff' : '#7aa8ff', boxShadow: t.done ? 'none' : '0 0 0 3px rgba(122,168,255,0.15)' }"></span>
          <span class="noti-task-text" :class="{ done: t.done }">{{ t.label }}</span>
          <el-checkbox v-model="taskChecks[i]" class="noti-task-check" @click.stop />
        </div>
      </div>
    </template>

    <!-- ===== 概览 Dashboard ===== -->
    <div v-if="active === 'dashboard'" class="page dashboard">
      <div class="dash-header">
        <div>
          <h1 class="dash-title">{{ greeting }}，{{ nickname || '搭配师' }}！</h1>
          <p class="dash-sub">今日用户穿搭反馈与知识维护工作台。</p>
        </div>
        <div class="dash-actions">
          <el-button @click="reloadAll"><el-icon><Refresh /></el-icon> 刷新数据</el-button>
          <el-button type="primary" @click="active = 'corrections'"><el-icon><Plus /></el-icon> 处理翻车案例</el-button>
        </div>
      </div>

      <div class="quick-cards">
        <div class="q-card" @click="active = 'corrections'">
          <div class="q-icon" style="background:#FFE9E2;color:#D66A60"><el-icon :size="22"><Warning /></el-icon></div>
          <div class="q-title">翻车案例</div>
          <div class="q-desc">{{ correctionsTotal }} 条待处理 · 平均评分 {{ stats.avg_score || 0 }}</div>
        </div>
        <div class="q-card" @click="active = 'knowledge'">
          <div class="q-icon" style="background:#e1edff;color:#5B8DEF"><el-icon :size="22"><Files /></el-icon></div>
          <div class="q-title">知识库</div>
          <div class="q-desc">{{ knowledgeTotal }} 条文档片段</div>
        </div>
        <div class="q-card" @click="active = 'tags'">
          <div class="q-icon" style="background:#E8DEF3;color:#8B7AC0"><el-icon :size="22"><Collection /></el-icon></div>
          <div class="q-title">标签管理</div>
          <div class="q-desc">{{ tags.length }} 个标签</div>
        </div>
        <div class="q-card add" @click="active = 'fewshot'">
          <div class="q-icon" style="background:#D4C0E8;color:#5D4F80"><el-icon :size="22"><MagicStick /></el-icon></div>
          <div class="q-title">添加 Few-Shot</div>
          <div class="q-desc">{{ fewShotsTotal }} 条 · 点击添加</div>
        </div>
      </div>

      <!-- ===== 数据看板（原独立页面整合到概览） ===== -->
      <div class="dash-analytics">
        <div class="sec-title"><span class="bar"></span><h2>数据看板</h2><span class="sub">翻车率、评分与趋势</span></div>
        <div class="metric-row">
          <div class="metric-card"><div class="m-label">总对话</div><div class="m-value">{{ stats.total }}</div></div>
          <div class="metric-card"><div class="m-label">平均评分</div><div class="m-value">{{ stats.avg_score }}</div></div>
          <div class="metric-card danger"><div class="m-label">翻车案例</div><div class="m-value">{{ stats.failed }}</div></div>
          <div class="metric-card ok"><div class="m-label">已修正</div><div class="m-value">{{ stats.fixed }}</div></div>
        </div>
        <div class="card">
          <div class="card-title">评分分布 · 错误分布 · 7 日趋势</div>
          <div class="chart-grid">
            <div ref="rateChart" class="chart-box"></div>
            <div ref="errChart" class="chart-box"></div>
            <div ref="trendChart" class="chart-box chart-wide"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- ===== 翻车案例 ===== -->
    <div v-if="active === 'corrections'" class="page">
      <div class="sec-title"><span class="bar"></span><h2>翻车案例</h2><span class="sub">用户低分对话，待搭配师修正</span></div>
      <div class="card">
        <el-table :data="corrections" style="width:100%" :key="`cor-${correctionsPage}-${correctionsPageSize}`">
          <el-table-column prop="id" label="对话ID" width="90" />
          <el-table-column label="用户评分" width="90">
            <template #default="{row}">
              <span :style="{ color: row.score <= 2 ? '#f87171' : '#4ade80', fontWeight: '600' }">{{ row.score }} 分</span>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="90">
            <template #default="{row}">{{ statusText(row.status) }}</template>
          </el-table-column>
          <el-table-column label="时间" min-width="180">
            <template #default="{row}">{{ formatDateTime(row.created_at) }}</template>
          </el-table-column>
          <el-table-column label="操作" min-width="160">
            <template #default="{row}">
              <el-button size="small" @click="viewCorrection(row)">查看</el-button>
              <el-button size="small" type="primary" @click="editCorrection(row)">修正</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-pagination v-if="correctionsTotal > 0" v-model:current-page="correctionsPage" v-model:page-size="correctionsPageSize"
          :total="correctionsTotal" layout="total, prev, pager, next" class="stylist-pagination"
          @current-change="loadCorrections" @size-change="onCorrectionsSizeChange" />
      </div>
      <el-dialog v-model="showCorrection" title="修正翻车案例" width="620px" class="correction-dialog" :close-on-click-modal="false">
        <div v-if="currentConv">
          <h4>用户输入</h4>
          <p>{{ currentConv.conversation.user_input }}</p>
          <h4>原始回复</h4>
          <p>{{ currentConv.conversation.agent_response }}</p>
        </div>
        <el-form :model="correctionForm" label-width="80px" style="margin-top:16px">
          <el-form-item label="错误类型">
            <el-select v-model="correctionForm.error_type" placeholder="请选择错误类型">
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
    </div>

    <!-- ===== 知识库 ===== -->
    <div v-if="active === 'knowledge'" class="page">
      <div class="sec-title"><span class="bar"></span><h2>知识库</h2><span class="sub">上传穿搭规则 / 风格指南用于 RAG 检索</span></div>
      <div class="card">
        <div class="toolbar">
          <el-upload :action="'/api/stylist/knowledge/upload'" accept=".txt,.md,.pdf" :show-file-list="false" :on-success="onKnowledgeUploadSuccess" :on-error="handleUploadError"
            :headers="uploadHeaders" :on-progress="onKnowledgeUploadProgress">
            <el-button type="primary" :disabled="knowledgeUploading">上传文件</el-button>
          </el-upload>
        </div>
        <div v-if="knowledgeUploading" class="kb-progress-wrap">
          <div class="kb-progress-bar">
            <div class="kb-progress-fill" :style="{ width: knowledgeProgress + '%' }"></div>
          </div>
          <div class="kb-progress-text">{{ knowledgeProgress }}%</div>
        </div>
        <el-table :data="knowledgeChunks" style="width:100%" :key="`kb-${knowledgePage}-${knowledgePageSize}`">
          <el-table-column prop="source" label="来源" min-width="150" />
          <el-table-column prop="text" label="内容" min-width="400">
            <template #default="{row}">{{ (row.text || '').substring(0,100) }}...</template>
          </el-table-column>
          <el-table-column prop="created_at" label="上传时间" min-width="160" :formatter="(row)=>formatDateTime(row.created_at)" />
          <el-table-column label="操作" width="80">
            <template #default="{row}">
              <el-button text type="danger" size="small" @click="deleteChunk(row.chunk_id)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-pagination v-if="knowledgeTotal > 0" v-model:current-page="knowledgePage" v-model:page-size="knowledgePageSize"
          :total="knowledgeTotal" layout="total, prev, pager, next" class="stylist-pagination"
          @current-change="loadKnowledge" @size-change="onKnowledgeSizeChange" />
      </div>
    </div>

    <!-- ===== 标签管理 ===== -->
    <div v-if="active === 'tags'" class="page">
      <div class="sec-title"><span class="bar"></span><h2>标签管理</h2><span class="sub">维护线上标签库，供用户与 AI 使用</span></div>
      <div class="card">
        <div class="toolbar">
          <el-input v-model="tagForm.name" placeholder="标签名" style="width:180px" />
          <el-select v-model="tagForm.category" placeholder="分类" clearable style="width:140px">
            <el-option v-for="c in TAG_CATEGORIES" :key="c" :label="c" :value="c" />
          </el-select>
          <el-color-picker v-model="tagForm.color" />
          <el-button type="primary" @click="addTag">添加标签</el-button>
        </div>
        <div v-for="c in TAG_CATEGORIES" :key="c" class="tag-group">
          <div class="tag-group-title">{{ c }}</div>
          <el-tag v-for="tag in tags.filter(t=>t.category===c)" :key="tag.id" closable
                  :color="tag.color || ''"
                  :style="tag.color ? { color:'#fff', borderColor: tag.color } : {}"
                  @close="deleteTag(tag.id)" class="tag-chip">
            {{ tag.name }}
          </el-tag>
          <span v-if="!tags.filter(t=>t.category===c).length" class="tag-empty">（空）</span>
        </div>
        <div class="tag-group">
          <div class="tag-group-title">未分类</div>
          <el-tag v-for="tag in tags.filter(t=>!t.category)" :key="tag.id" closable
                  @close="deleteTag(tag.id)" class="tag-chip">{{ tag.name }}</el-tag>
        </div>
      </div>
    </div>

    <!-- ===== Few-Shot 示例 ===== -->
    <div v-if="active === 'fewshot'" class="page">
      <div class="sec-title"><span class="bar"></span><h2>Few-Shot 示例</h2><span class="sub">高质量问答范例，提升 AI 输出质量</span></div>
      <div class="card">
        <div class="toolbar">
          <el-button type="primary" @click="showFewShot=true">+ 添加示例</el-button>
        </div>
        <el-table :data="fewShots" style="width:100%" :key="`fs-${fewShotsPage}-${fewShotsPageSize}`">
          <el-table-column prop="title" label="标题" min-width="150" />
          <el-table-column prop="user_input" label="用户输入" min-width="200" />
          <el-table-column prop="correct_response" label="正确答案" min-width="300" />
          <el-table-column label="操作" width="80">
            <template #default="{row}">
              <el-button text type="danger" size="small" @click="deleteFewShot(row.id)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-pagination v-if="fewShotsTotal > 0" v-model:current-page="fewShotsPage" v-model:page-size="fewShotsPageSize"
          :total="fewShotsTotal" layout="total, prev, pager, next" class="stylist-pagination"
          @current-change="loadFewShots" @size-change="onFewShotsSizeChange" />
      </div>
      <el-dialog v-model="showFewShot" title="添加 Few-Shot 示例" width="600px">
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
    </div>

    <!-- ===== 知识缺口 ===== -->
    <div v-if="active === 'gaps'" class="page">
      <div class="sec-title"><span class="bar"></span><h2>知识缺口</h2><span class="sub">AI 高频答不好、需要补知识的话题</span></div>
      <div class="card">
        <div class="toolbar">
          <el-select v-model="gapFilter" placeholder="全部状态" clearable style="width:160px">
            <el-option label="待补充" value="open" />
            <el-option label="已处理" value="handled" />
            <el-option label="已忽略" value="ignored" />
          </el-select>
          <span class="gap-stat">共 {{ knowledgeGaps.length }} 个话题 · 待补充 {{ openGapCount }} 个</span>
        </div>
        <el-table :data="filteredGaps" style="width:100%">
          <el-table-column prop="topic" label="话题" min-width="240" show-overflow-tooltip />
          <el-table-column prop="frequency" label="频率" width="80" />
          <el-table-column label="状态" width="110">
            <template #default="{row}">
              <el-tag :type="row.status === 'open' ? 'warning' : row.status === 'handled' ? 'success' : 'info'" size="small">
                {{ GAP_STATUS_NAME[row.status] || '待补充' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="包含的具体问题" min-width="300">
            <template #default="{row}">
              <ul style="margin:0;padding-left:18px">
                <li v-for="(q, i) in (row.example_inputs || []).slice(0, 4)" :key="i" style="margin:3px 0;line-height:1.5">{{ q }}</li>
                <li v-if="(row.example_inputs || []).length > 4" style="color:var(--text-3);margin:3px 0">…等 {{ row.example_inputs.length }} 条</li>
              </ul>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="240" fixed="right">
            <template #default="{row}">
              <el-button size="small" type="primary" @click="openGapFewShot(row)">转 Few-Shot</el-button>
              <el-dropdown trigger="click" @command="c => setGapStatus(row, c)">
                <el-button size="small">标记<el-icon class="el-icon--right"><ArrowDown /></el-icon></el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="open">待补充</el-dropdown-item>
                    <el-dropdown-item command="handled">已处理</el-dropdown-item>
                    <el-dropdown-item command="ignored">已忽略</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <!-- ===== 单品纠错 ===== -->
    <div v-if="active === 'itemcorrections'" class="page">
      <div class="sec-title"><span class="bar"></span><h2>单品纠错</h2><span class="sub">修正 AI 识别错误的衣橱单品</span></div>
      <el-alert type="info" :closable="false" style="margin-bottom:14px"
        title="对 AI 识别错误的衣橱单品进行人工修正（类别/颜色/材质等），修正记录形成反馈数据集。" />
      <div class="card">
        <el-table :data="itemCorrections" style="width:100%" :key="`ic-${itemCorrectionsPage}-${itemCorrectionsPageSize}`">
          <el-table-column prop="id" label="ID" width="60" />
          <el-table-column prop="item_name" label="单品" min-width="150" />
          <el-table-column prop="error_fields" label="错误字段" min-width="140">
            <template #default="{row}">{{ (row.error_fields || []).join('、') }}</template>
          </el-table-column>
          <el-table-column prop="correct_attrs" label="修正为" min-width="220">
            <template #default="{row}">
              <el-tag v-for="(v, k) in (row.correct_attrs || {})" :key="k" size="small" style="margin:2px">{{ k }}: {{ v }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="90">
            <template #default="{row}">
              <el-tag :type="row.status==='applied' ? 'success' : row.status==='rejected' ? 'danger' : 'warning'">{{ ITEM_STATUS_NAME[row.status] || row.status }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="180">
            <template #default="{row}">
              <template v-if="row.status==='pending'">
                <el-tooltip content="将修正属性写回衣橱单品"><el-button size="small" type="success" @click="applyItemCorrection(row)">应用</el-button></el-tooltip>
                <el-tooltip content="放弃本次修正，保持单品原属性"><el-button size="small" type="danger" plain @click="rejectItemCorrection(row)">驳回</el-button></el-tooltip>
              </template>
              <span v-else-if="row.status==='rejected'" class="op-note">已驳回，不会应用</span>
              <span v-else-if="row.status==='applied'" class="op-note">已应用，单品已更新</span>
            </template>
          </el-table-column>
        </el-table>
        <el-pagination v-if="itemCorrectionsTotal > 0" v-model:current-page="itemCorrectionsPage" v-model:page-size="itemCorrectionsPageSize"
          :total="itemCorrectionsTotal" layout="total, prev, pager, next" class="stylist-pagination"
          @current-change="loadItemCorrections" @size-change="onItemCorrectionsSizeChange" />
      </div>
    </div>

    <!-- 兜底：未匹配任何菜单时避免白屏 -->
    <div v-if="!menus.map(m => m.key).includes(active)" class="page empty-page">
      <div class="card" style="text-align:center;padding:80px 20px">
        <el-icon :size="56" style="color:var(--text-3);margin-bottom:16px"><Connection /></el-icon>
        <h2 style="margin:0 0 8px;font-size:18px;color:var(--text)">未选择功能模块</h2>
        <p style="margin:0;color:var(--text-2);font-size:14px">请点击左侧菜单进入搭配师工作台</p>
      </div>
    </div>
  </SidebarLayout>
</template>

<script setup>
import { ref, onMounted, watch, nextTick, computed } from 'vue'
import * as echarts from 'echarts'
import { ElMessage } from 'element-plus'
import SidebarLayout from '@/components/SidebarLayout.vue'

const STATUS_TEXT = { pending: '待处理', fixed: '已修正', approved: '已审核', deployed: '已发布' }
const ITEM_STATUS_NAME = { pending: '待处理', applied: '已应用', rejected: '已驳回' }
function statusText(s) {
  return STATUS_TEXT[s] || s || '待处理'
}
/* 把 ISO 时间戳格式化成"YYYY-MM-DD HH:mm:ss"（普通人易读） */
function formatDateTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  const p = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

const menus = [
  { key: 'dashboard', label: '概览', icon: 'Histogram' },
  { key: 'corrections', label: '翻车案例', icon: 'Warning' },
  { key: 'knowledge', label: '知识库', icon: 'Files' },
  { key: 'tags', label: '标签管理', icon: 'Collection' },
  { key: 'fewshot', label: 'Few-Shot', icon: 'ChatDotRound' },
  { key: 'gaps', label: '知识缺口', icon: 'DocumentAdd' },
  { key: 'itemcorrections', label: '单品纠错', icon: 'ShoppingBag' }
]
const active = ref('dashboard')

const taskChecks = ref([false, false, false, false])
const taskList = computed(() => [
  { label: '审阅新增翻车案例', done: taskChecks.value[0] },
  { label: '补充知识库文档', done: taskChecks.value[1] },
  { label: `查看知识缺口${knowledgeGaps.value.length ? `（${knowledgeGaps.value.length} 个）` : ''}`, done: taskChecks.value[2] },
  { label: '维护 Few-Shot 范例', done: taskChecks.value[3] }
])
const nickname = sessionStorage.getItem('web_nickname') || ''

const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 12) return '早上好'
  if (h < 18) return '下午好'
  return '晚上好'
})
const corrections = ref([])
const correctionsTotal = ref(0)
const correctionsPage = ref(1)
const correctionsPageSize = ref(10)
const knowledgeChunks = ref([])
const knowledgeTotal = ref(0)
const knowledgePage = ref(1)
const knowledgePageSize = ref(10)
const tags = ref([])
const fewShots = ref([])
const fewShotsTotal = ref(0)
const fewShotsPage = ref(1)
const fewShotsPageSize = ref(10)
const knowledgeGaps = ref([])
const gapFilter = ref('')
const GAP_STATUS_NAME = { open: '待补充', handled: '已处理', ignored: '已忽略' }
const filteredGaps = computed(() => {
  if (!gapFilter.value) return knowledgeGaps.value
  return knowledgeGaps.value.filter(g => g.status === gapFilter.value)
})
const openGapCount = computed(() => knowledgeGaps.value.filter(g => g.status === 'open').length)
const stats = ref({ total: 0, avg_score: 0, failed: 0, fixed: 0, rating_dist: {}, error_dist: {}, trend_7d: [] })
const rateChart = ref(null)
const errChart = ref(null)
const trendChart = ref(null)
const showCorrection = ref(false)
const currentConv = ref(null)
const correctionForm = ref({ conversation_id: 0, error_type: '', correct_response: '' })
const showFewShot = ref(false)
const tagForm = ref({ name: '', category: '', color: '' })
const fewShotForm = ref({ title: '', user_input: '', correct_response: '' })
const uploadHeaders = { Authorization: 'Bearer ' + (sessionStorage.getItem('web_token') || '') }
const knowledgeUploading = ref(false)
const knowledgeProgress = ref(0)

// ===== 单品纠错 =====
const itemCorrections = ref([])
const itemCorrectionsTotal = ref(0)
const itemCorrectionsPage = ref(1)
const itemCorrectionsPageSize = ref(10)

async function loadItemCorrections() {
  try {
    const d = await (await fetch(`/api/stylist/item-corrections?page=${itemCorrectionsPage.value}&page_size=${itemCorrectionsPageSize.value}`)).json()
    if (Array.isArray(d)) {
      itemCorrectionsTotal.value = d.length
      itemCorrections.value = slicePage(d, itemCorrectionsPage.value, itemCorrectionsPageSize.value)
    } else {
      itemCorrections.value = d.list || []
      itemCorrectionsTotal.value = d.total || 0
    }
  } catch {}
}
function onItemCorrectionsSizeChange() { itemCorrectionsPage.value = 1; loadItemCorrections() }
async function applyItemCorrection(row) {
  await fetch('/api/stylist/item-corrections/' + row.id + '/apply', { method: 'POST' })
  ElMessage.success('已应用修正')
  loadItemCorrections()
}
async function rejectItemCorrection(row) {
  await fetch('/api/stylist/item-corrections/' + row.id + '/reject', { method: 'POST' })
  loadItemCorrections()
}

function slicePage(arr, page, pageSize) {
  const start = (page - 1) * pageSize
  return arr.slice(start, start + pageSize)
}
async function loadCorrections() {
  try {
    const d = await (await fetch(`/api/stylist/conversations?status=pending&page=${correctionsPage.value}&page_size=${correctionsPageSize.value}`)).json()
    if (Array.isArray(d)) {
      correctionsTotal.value = d.length
      corrections.value = slicePage(d, correctionsPage.value, correctionsPageSize.value)
    } else {
      corrections.value = d.list || []
      correctionsTotal.value = d.total || 0
    }
  } catch {}
}
function onCorrectionsSizeChange() { correctionsPage.value = 1; loadCorrections() }
async function loadKnowledge() {
  try {
    const d = await (await fetch(`/api/stylist/knowledge/chunks?page=${knowledgePage.value}&page_size=${knowledgePageSize.value}`)).json()
    if (Array.isArray(d)) {
      knowledgeTotal.value = d.length
      knowledgeChunks.value = slicePage(d, knowledgePage.value, knowledgePageSize.value)
    } else {
      knowledgeChunks.value = d.list || []
      knowledgeTotal.value = d.total || 0
    }
  } catch {}
}
function onKnowledgeSizeChange() { knowledgePage.value = 1; loadKnowledge() }
function onKnowledgeUploadProgress(evt) {
  knowledgeUploading.value = true
  knowledgeProgress.value = Math.min(99, Math.round((evt.percent || 0)))
}
function onKnowledgeUploadSuccess() {
  knowledgeProgress.value = 100
  setTimeout(() => {
    knowledgeUploading.value = false
    knowledgeProgress.value = 0
    loadKnowledge()
  }, 400)
}
function handleUploadError(err) {
  knowledgeUploading.value = false
  knowledgeProgress.value = 0
  ElMessage.error('上传失败：' + (err?.message || '服务端处理异常，请检查文件格式或稍后重试'))
}
async function loadTags() {
  try { tags.value = await (await fetch('/api/stylist/tags')).json() } catch {}
}
async function loadFewShots() {
  try {
    const d = await (await fetch(`/api/stylist/few-shot-examples?page=${fewShotsPage.value}&page_size=${fewShotsPageSize.value}`)).json()
    if (Array.isArray(d)) {
      fewShotsTotal.value = d.length
      fewShots.value = slicePage(d, fewShotsPage.value, fewShotsPageSize.value)
    } else {
      fewShots.value = d.list || []
      fewShotsTotal.value = d.total || 0
    }
  } catch {}
}
function onFewShotsSizeChange() { fewShotsPage.value = 1; loadFewShots() }
async function loadGaps() {
  try { const d = await (await fetch('/api/stylist/knowledge-gaps')).json(); knowledgeGaps.value = d.gaps || [] } catch {}
}

async function loadStats() {
  try {
    stats.value = await (await fetch('/api/stylist/stats')).json()
    // 数据异步回来后再渲染图表（图表非响应式，必须主动重绘）
    nextTick(() => renderDashboard())
  } catch (e) {
    console.error('[stylist] 加载统计失败', e)
  }
}

function renderDashboard() {
  const rateEl = rateChart.value, errEl = errChart.value, trendEl = trendChart.value
  if (rateEl) {
    const c = echarts.getInstanceByDom(rateEl) || echarts.init(rateEl, 'wardrobe')
    const d = stats.value.rating_dist || {}
    c.setOption({
      tooltip: { trigger: 'item' },
      legend: { bottom: 0 },
      series: [{
        type: 'pie', radius: ['40%', '65%'], center: ['50%', '45%'], label: { show: false },
        data: [
          { name: '1分', value: d['1'] || 0 }, { name: '2分', value: d['2'] || 0 },
          { name: '3分', value: d['3'] || 0 }, { name: '4分', value: d['4'] || 0 },
          { name: '5分', value: d['5'] || 0 }
        ]
      }]
    })
  }
  if (errEl) {
    const c = echarts.getInstanceByDom(errEl) || echarts.init(errEl, 'wardrobe')
    const d = stats.value.error_dist || {}
    c.setOption({
      tooltip: { trigger: 'axis' },
      grid: { left: 40, right: 20, top: 20, bottom: 30 },
      xAxis: { type: 'category', data: ['风格', '场合', '颜色', '尺码', '其他'] },
      yAxis: { type: 'value', minInterval: 1 },
      series: [{ type: 'bar', data: [d.style || 0, d.occasion || 0, d.color || 0, d.size || 0, d.other || 0], barWidth: '45%', itemStyle: { color: '#a9c6ff', borderRadius: [6, 6, 0, 0] } }]
    })
  }
  if (trendEl) {
    const c = echarts.getInstanceByDom(trendEl) || echarts.init(trendEl, 'wardrobe')
    const t = stats.value.trend_7d || []
    c.setOption({
      tooltip: { trigger: 'axis' },
      grid: { left: 40, right: 20, top: 20, bottom: 30 },
      xAxis: { type: 'category', data: t.map(x => x.date) },
      yAxis: { type: 'value', minInterval: 1 },
      series: [{ type: 'line', smooth: true, data: t.map(x => x.count), itemStyle: { color: '#7aa8ff' }, areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(122,168,255,0.25)' }, { offset: 1, color: 'rgba(122,168,255,0)' }] } } }]
    })
  }
}

watch(active, (n) => {
  if (n === 'dashboard') { nextTick(() => renderDashboard()) }
})

// stats 数据变更时（含首次异步返回）兜底重绘图表，避免「没数据」
watch(stats, () => {
  if (active.value === 'dashboard') { nextTick(() => renderDashboard()) }
})

function reloadAll() {
  loadCorrections(); loadKnowledge(); loadTags(); loadFewShots(); loadGaps(); loadStats(); loadItemCorrections()
  ElMessage.success('数据已刷新')
}

async function viewCorrection(row) {
  try {
    const d = await (await fetch('/api/stylist/conversations/' + row.id)).json()
    currentConv.value = d
    const corr = d.correction
    correctionForm.value = {
      conversation_id: row.id,
      error_type: (corr && corr.error_type) || '',
      correct_response: (corr && corr.correct_response) || ''
    }
    showCorrection.value = true
  } catch {}
}

async function editCorrection(row) {
  await viewCorrection(row)
}

async function submitCorrection() {
  try {
    const resp = await fetch('/api/stylist/corrections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(correctionForm.value)
    })
    if (!resp.ok) throw new Error('HTTP ' + resp.status)
    showCorrection.value = false
    loadCorrections()
    ElMessage.success('已提交修正，案例已进入审核队列')
  } catch (e) {
    ElMessage.error('提交失败：' + (e.message || '服务端异常') + '（请确认后端 8000 是否已用新代码重启）')
  }
}

async function deleteChunk(id) {
  await fetch('/api/stylist/knowledge/chunks/' + id, { method: 'DELETE' })
  loadKnowledge()
  ElMessage.success('已删除')
}

async function addTag() {
  if (!tagForm.value.name) { ElMessage.warning('请输入标签名'); return }
  await fetch('/api/stylist/tags', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: tagForm.value.name, category: tagForm.value.category, color: tagForm.value.color })
  })
  tagForm.value = { name: '', category: '', color: '' }
  loadTags()
  ElMessage.success('已添加')
}

const TAG_CATEGORIES = ['风格', '颜色', '季节', '场合', '材质', '图案']
const PRESET_TAGS = [
  { category: '风格', name: '简约' }, { category: '风格', name: '复古' }, { category: '风格', name: '法式' },
  { category: '风格', name: '韩系' }, { category: '风格', name: '运动' }, { category: '风格', name: '通勤' },
  { category: '风格', name: '甜美' }, { category: '风格', name: '中性' }, { category: '风格', name: '街头' },
  { category: '风格', name: 'Old Money' },
  { category: '颜色', name: '白色' }, { category: '颜色', name: '黑色' }, { category: '颜色', name: '灰色' },
  { category: '颜色', name: '米色' }, { category: '颜色', name: '蓝色' }, { category: '颜色', name: '红色' },
  { category: '颜色', name: '绿色' }, { category: '颜色', name: '黄色' }, { category: '颜色', name: '粉色' },
  { category: '颜色', name: '卡其' },
  { category: '季节', name: '春夏' }, { category: '季节', name: '秋冬' }, { category: '季节', name: '四季' },
  { category: '场合', name: '正式' }, { category: '场合', name: '休闲' }, { category: '场合', name: '运动' },
  { category: '场合', name: '通勤' }, { category: '场合', name: '约会' }, { category: '场合', name: '旅行' },
  { category: '材质', name: '棉' }, { category: '材质', name: '麻' }, { category: '材质', name: '丝' },
  { category: '材质', name: '牛仔' }, { category: '材质', name: '针织' }, { category: '材质', name: '聚酯' },
  { category: '材质', name: '皮革' },
  { category: '图案', name: '纯色' }, { category: '图案', name: '条纹' }, { category: '图案', name: '格纹' },
  { category: '图案', name: '碎花' }, { category: '图案', name: '波点' },
]
async function addPresetTags() {
  const existing = new Set(tags.value.map(t => t.name))
  let added = 0
  for (const t of PRESET_TAGS) {
    if (existing.has(t.name)) continue
    try {
      await fetch('/api/stylist/tags', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(t)
      })
      added++
    } catch (e) {}
  }
  loadTags()
  ElMessage.success(added ? `已预置 ${added} 个常用标签` : '常用标签已存在')
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
  // 缺口一键转 Few-Shot 提交后，自动把该缺口标记为「已处理」，形成闭环
  if (pendingGapAfterFewShot.value) {
    const row = pendingGapAfterFewShot.value
    pendingGapAfterFewShot.value = null
    try {
      await fetch('/api/stylist/knowledge-gaps/' + row.topic_key + '/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: row.topic, status: 'handled', note: '已转 Few-Shot 范例' })
      })
      row.status = 'handled'
    } catch (e) {}
  }
}

async function deleteFewShot(id) {
  await fetch('/api/stylist/few-shot-examples/' + id, { method: 'DELETE' })
  loadFewShots()
}

// ===== 知识缺口：状态闭环 + 一键转 Few-Shot =====
async function setGapStatus(row, status) {
  try {
    await fetch('/api/stylist/knowledge-gaps/' + row.topic_key + '/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic: row.topic, status, note: row.gap_note || '' })
    })
    row.status = status
    ElMessage.success(status === 'handled' ? '已标记为处理完成' : status === 'ignored' ? '已忽略该缺口' : '已重置为待补充')
  } catch (e) {
    ElMessage.error('状态更新失败：' + (e.message || '服务端异常'))
  }
}

const pendingGapAfterFewShot = ref(null)
function openGapFewShot(row) {
  // 把缺口代表问题预填进 Few-Shot 弹窗，搭配师补答案即沉淀范例
  fewShotForm.value = {
    title: '缺口补充 · ' + (row.topic ? row.topic.slice(0, 20) : '话题'),
    user_input: (row.example_inputs && row.example_inputs[0]) || row.topic || '',
    correct_response: ''
  }
  showFewShot.value = true
  pendingGapAfterFewShot.value = row
}

onMounted(() => {
  loadCorrections(); loadKnowledge(); loadTags(); loadFewShots(); loadGaps(); loadStats(); loadItemCorrections()
  nextTick(() => renderDashboard())
})
</script>

<style scoped>
/* ===== 通用页面 ===== */
.page {
  animation: pageReveal 0.26s cubic-bezier(0.22, 1, 0.36, 1) both;
}
@keyframes pageReveal {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: none; }
}
@media (prefers-reduced-motion: reduce) {
  .page { animation: none; }
}

.empty-page { justify-content: center; align-items: center; }

.sec-title { display: flex; align-items: center; gap: 10px; margin: 2px 0 18px; }
.sec-title .bar { width: 4px; height: 18px; border-radius: 3px; background: var(--accent); }
.sec-title h2 { font-size: 18px; margin: 0; color: var(--text); font-weight: 700; }
.sec-title .sub { font-size: 13px; color: var(--text-3); }

.card {
  background: #fff;
  border-radius: var(--radius-lg, 16px);
  padding: 22px;
  box-shadow: var(--shadow);
  margin-bottom: 20px;
}
.card-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.card-title { font-size: 15px; font-weight: 700; color: var(--text); }
.card-sub { font-size: 12px; color: var(--text-3); font-weight: 400; }
.card:last-child { margin-bottom: 0; }

.toolbar { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 16px; align-items: center; }
.gap-stat { font-size: 13px; color: var(--text-3); margin-left: 4px; }
.kb-progress-wrap { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
.kb-progress-bar { flex: 1; height: 10px; background: #eef5ff; border-radius: 5px; overflow: hidden; }
.kb-progress-fill { height: 100%; background: #7aa8ff; border-radius: 5px; transition: width 0.2s linear; }
.kb-progress-text { font-size: 13px; color: #6B7A9C; font-variant-numeric: tabular-nums; min-width: 36px; text-align: right; }

/* 标签管理 */
.tag-group { margin-bottom: 14px; }
.tag-group-title { font-size: 13px; color: var(--text-2); margin: 6px 0; font-weight: 600; }
.tag-chip { margin: 4px; }
.tag-empty { color: var(--text-3); font-size: 12px; }

/* ===== 概览 Dashboard ===== */
.dash-header { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 24px; gap: 16px; flex-wrap: wrap; }
.dash-title { font-size: 28px; font-weight: 800; color: var(--text); margin: 0 0 6px; line-height: 1.2; }
.dash-sub { font-size: 14px; color: var(--text-3); margin: 0; }
.dash-actions { display: flex; gap: 10px; }

.quick-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 18px; margin-bottom: 24px; }
.q-card {
  background: #fff;
  border-radius: var(--radius-lg, 16px);
  padding: 20px;
  box-shadow: var(--shadow);
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.q-card:hover { transform: translateY(-2px); box-shadow: 0 14px 36px rgba(108, 93, 211, 0.12); }
.q-card.add { display: flex; flex-direction: column; align-items: flex-start; min-height: 110px; }
.q-icon { width: 46px; height: 46px; border-radius: 14px; display: flex; align-items: center; justify-content: center; margin-bottom: 12px; }
.q-title { font-size: 15px; font-weight: 700; color: var(--text); margin-bottom: 4px; }
.q-desc { font-size: 12px; color: var(--text-3); line-height: 1.4; }

.metric-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
.metric-row.compact { margin-bottom: 0; }
.metric-card { background: #FDFBF7; border-radius: 12px; padding: 16px; }
.metric-card.danger { background: #FFE9E2; }
.metric-card.danger .m-value { color: #D66A60; }
.metric-card.ok { background: #DCFCE7; }
.metric-card.ok .m-value { color: #15803D; }
.m-label { font-size: 12px; color: var(--text-3); margin-bottom: 4px; }
.m-value { font-size: 22px; font-weight: 700; color: var(--text); }

/* 数据看板 */
.dash-analytics { margin-top: 28px; }
.dash-analytics .sec-title { margin-bottom: 18px; }
.dash-analytics .metric-row { margin-bottom: 20px; }
.chart-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.chart-box { width: 100%; height: 280px; }
.chart-wide { grid-column: 1 / 3; }

/* 弹窗滚动：修正翻车案例 / Few-Shot 内容多时显示不全 */
/* 关键：overlay 允许整体滚动兜底，dialog 本身限制在视口内，body 固定高度并独立滚动 */
:deep(.el-overlay-dialog) { display: flex; align-items: flex-start; justify-content: center; padding: 24px 0; overflow: auto; }
:deep(.correction-dialog) { min-height: 40vh; max-height: 72vh !important; margin-top: 0 !important; display: flex; flex-direction: column; overflow: hidden; }
:deep(.correction-dialog .el-dialog__body) { flex: 1; min-height: 0; max-height: calc(72vh - 132px); overflow-y: auto; overscroll-behavior: contain; padding: 20px 24px; }
:deep(.el-dialog__body h4) { margin: 0 0 8px; font-size: 14px; color: var(--text-2); font-weight: 600; }
:deep(.el-dialog__body h4:not(:first-of-type)) { margin-top: 16px; }
:deep(.el-dialog__body p) { margin: 0; padding: 12px 14px; background: #FDFBF7; border-radius: 10px; font-size: 14px; line-height: 1.7; color: var(--text); word-break: break-word; }
.op-note { font-size: 13px; color: var(--text-3); }

/* 列表翻页器：与运营端一致，右对齐、与表格留间距 */
.stylist-pagination { margin-top: 18px; justify-content: flex-end; }
:deep(.stylist-pagination .el-pagination__total) { color: var(--text-3); font-size: 13px; }
:deep(.stylist-pagination .btn-prev),
:deep(.stylist-pagination .btn-next),
:deep(.stylist-pagination .el-pager li) {
  background: #fff;
  border-radius: 999px;
  font-weight: 600;
  color: var(--text-2);
}
:deep(.stylist-pagination .el-pager li.is-active) {
  background: var(--accent);
  color: #fff;
}
@media (max-height: 700px) {
  :deep(.correction-dialog) { max-height: calc(100vh - 48px) !important; }
  :deep(.correction-dialog .el-dialog__body) { max-height: calc(100vh - 48px - 128px); }
}

@media (max-width: 1100px) {
  .quick-cards { grid-template-columns: repeat(2, 1fr); }
  .metric-row { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 640px) {
  .quick-cards { grid-template-columns: 1fr; }
  .dash-header { flex-direction: column; align-items: flex-start; }
  .metric-row { grid-template-columns: 1fr; }
  .chart-grid { grid-template-columns: 1fr; }
  .chart-wide { grid-column: 1 / 2; }
}
</style>
