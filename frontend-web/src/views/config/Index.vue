<template>
  <SidebarLayout v-model:active="active" :menus="menus" brand="配置端" role="admin">
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
          <h1 class="dash-title">{{ greeting }}，{{ nickname || '管理员' }}！</h1>
          <p class="dash-sub">这里是 AI 衣橱运营控制台，管理 Prompt、模型、审批与数据洞察。</p>
        </div>
        <div class="dash-actions">
          <el-button @click="reloadAll"><el-icon><Refresh /></el-icon> 刷新数据</el-button>
          <el-button type="primary" @click="active = 'prompts'"><el-icon><Plus /></el-icon> 新建 Prompt</el-button>
        </div>
      </div>

      <div class="quick-cards">
        <div class="q-card" @click="active = 'prompts'">
          <div class="q-icon" style="background:#e1edff;color:#7aa8ff"><el-icon :size="22"><Document /></el-icon></div>
          <div class="q-title">Prompt 管理</div>
          <div class="q-desc">{{ promptsTotal }} 个版本 · {{ prompts.filter(p=>p.status==='online').length }} 个线上</div>
        </div>
        <div class="q-card" @click="active = 'pipeline'">
          <div class="q-icon" style="background:#E8DEF3;color:#8B7AC0"><el-icon :size="22"><Operation /></el-icon></div>
          <div class="q-title">审批流水线</div>
          <div class="q-desc">{{ pipeline.pending }} 待修正 · {{ pipeline.fixed }} 已修正</div>
        </div>
        <div class="q-card" @click="active = 'users'">
          <div class="q-icon" style="background:#FFF0ED;color:#FF9E8E"><el-icon :size="22"><User /></el-icon></div>
          <div class="q-title">用户管理</div>
          <div class="q-desc">{{ usersTotal }} 用户 · {{ users.filter(u=>u.is_active).length }} 活跃</div>
        </div>
      </div>

      <div class="dash-grid">
        <div class="dash-col left">
          <div class="card">
            <div class="card-head">
              <span class="card-title">运行健康</span>
              <el-tag size="small" :type="monitor?.status==='ok' ? 'success' : 'warning'">{{ monitor?.status==='ok' ? '正常' : '需关注' }}</el-tag>
            </div>
            <div class="health-list">
              <div class="health-li"><span>当前模型</span><b>{{ monitor?.current_model || '—' }}</b></div>
              <div class="health-li"><span>工具启用</span><b>{{ (monitor?.active_tools || []).length }} / {{ monitor?.total_tools || 0 }}</b></div>
              <div class="health-li"><span>活跃工具</span>
                <div class="tool-tags">
                  <el-tag v-for="t in (monitor?.active_tools || []).slice(0,5)" :key="t" size="small" effect="plain">{{ t }}</el-tag>
                  <span v-if="!(monitor?.active_tools || []).length" class="empty-tip">暂无</span>
                </div>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-head"><span class="card-title">待审核纠错</span><el-button text type="primary" size="small" @click="active='pipeline'">查看全部</el-button></div>
            <div v-if="pipelineCorrections.length" class="noti-list">
              <div v-for="row in pipelineCorrections.slice(0,4)" :key="row.id" class="noti-item">
                <div class="noti-dot" :class="row.status"></div>
                <div class="noti-body">
                  <div class="noti-title">{{ ERROR_TYPE_NAME[row.error_type] || '其他' }} · {{ (row.user_input || '无关联对话').slice(0,26) }}</div>
                  <div class="noti-text">{{ (row.correct_response || '').slice(0,50) }}...</div>
                </div>
                <el-button text :type="row.status==='approved'?'success':'primary'" size="small" @click="reviewCorrection(row, row.status==='approved'?'deploy':'approve')">{{ row.status==='approved'?'发布':'批准' }}</el-button>
              </div>
            </div>
            <el-empty v-else description="当前没有待审核的纠错案例" :image-size="60" />
          </div>

        </div>

        <div class="dash-col right">
          <div class="card calendar-card">
            <el-calendar v-model="calDate" class="dash-calendar" />
          </div>
        </div>
      </div>

      <!-- ===== 效能驾驶舱 + 数据仪表盘（整合进概览） ===== -->
      <div class="dash-analytics">
        <section class="analytics-section">
          <div class="sec-title"><span class="bar"></span><h2>效能驾驶舱</h2><span class="sub">AI 成本、调用与运行健康</span></div>
          <div class="kpi-row kpi-stack">
            <div class="kpi-card"><div class="kpi-label">本月成本</div><div class="kpi-val">¥{{ (cost.month?.cost || 0).toFixed(4) }}</div></div>
            <div class="kpi-card"><div class="kpi-label">本月 Token</div><div class="kpi-val">{{ (cost.month?.tokens_in || 0) + (cost.month?.tokens_out || 0) }}</div></div>
            <div class="kpi-card"><div class="kpi-label">本月调用</div><div class="kpi-val">{{ cost.month?.calls || 0 }}</div></div>
            <div class="kpi-card"><div class="kpi-label">今日成本</div><div class="kpi-val">¥{{ (cost.today?.cost || 0).toFixed(4) }}</div></div>
          </div>
          <div class="card">
            <div class="card-head"><span class="card-title">近 30 天成本 / 调用趋势</span></div>
            <div ref="costChart" class="chart-box"></div>
          </div>
          <div class="card">
            <div class="card-head"><span class="card-title">AI 表现概览</span></div>
            <el-descriptions :column="3" border v-if="stylistStats">
              <el-descriptions-item label="推荐总数">{{ stylistStats.total }}</el-descriptions-item>
              <el-descriptions-item label="平均评分">{{ stylistStats.avg_score }}</el-descriptions-item>
              <el-descriptions-item label="失败数">{{ stylistStats.failed }}</el-descriptions-item>
              <el-descriptions-item label="已修正">{{ stylistStats.fixed }}</el-descriptions-item>
              <el-descriptions-item label="LLM 调用(本月)">{{ cost.month?.calls || 0 }}</el-descriptions-item>
              <el-descriptions-item label="图片处理(本月)">{{ (cost.by_type?.image?.calls) || 0 }}</el-descriptions-item>
            </el-descriptions>
            <el-empty v-else description="暂无数据" />
          </div>
        </section>

        <section class="analytics-section">
          <div class="sec-title"><span class="bar"></span><h2>数据仪表盘</h2><span class="sub">全站运营指标</span></div>
          <div class="kpi-row kpi-stack">
            <div class="kpi-card"><div class="kpi-label">用户数</div><div class="kpi-val">{{ dash.total_users || 0 }}</div></div>
            <div class="kpi-card"><div class="kpi-label">推荐次数</div><div class="kpi-val">{{ dash.total_recommendations || 0 }}</div></div>
            <div class="kpi-card"><div class="kpi-label">采纳数</div><div class="kpi-val">{{ dash.total_adoptions || 0 }}</div></div>
            <div class="kpi-card"><div class="kpi-label">采纳率</div><div class="kpi-val">{{ ((dash.adoption_rate || 0) * 100).toFixed(1) }}%</div></div>
          </div>
          <div class="card">
            <div class="card-head"><span class="card-title">近 7 日推荐量</span></div>
            <div ref="dashChart" class="chart-box"></div>
          </div>
          <div class="card">
            <div class="card-head"><span class="card-title">采纳来源分布</span></div>
            <div ref="dashPie" class="chart-box" style="height:240px"></div>
          </div>
        </section>
      </div>
    </div>

    <!-- ===== Prompt 管理 ===== -->
    <div v-if="active === 'prompts'" class="page">
      <div class="sec-title"><span class="bar"></span><h2>Prompt 管理</h2><span class="sub">管理 AI 的提示词版本，发布即生效</span></div>
      <div class="card">
        <div class="toolbar">
          <el-button type="primary" @click="showPrompt = true">+ 新建 Prompt</el-button>
        </div>
        <el-table :data="promptsPageData" style="width:100%" :key="`pm-${promptsPage}-${promptsPageSize}`">
          <el-table-column prop="name" label="名称" width="150" />
          <el-table-column prop="content" label="内容" min-width="300">
            <template #default="{row}">{{ (row.content || '').substring(0,80) }}...</template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="90">
            <template #default="{row}">
              <el-tag :type="row.status==='online'?'success':row.status==='history'?'info':''" size="small">{{ PROMPT_STATUS_NAME[row.status] || row.status }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="160">
            <template #default="{row}">
              <el-button size="small" @click="editPrompt(row)">编辑</el-button>
              <el-button size="small" type="success" @click="deployPrompt(row.id)" v-if="row.status!=='online'">发布</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-pagination v-model:current-page="promptsPage" v-model:page-size="promptsPageSize" :total="promptsTotal"
          layout="total, prev, pager, next" class="config-pagination" />
      </div>
      <el-dialog v-model="showPrompt" title="编辑 Prompt" width="700px">
        <el-form :model="promptForm" label-width="60px">
          <el-form-item label="名称"><el-input v-model="promptForm.name" /></el-form-item>
          <el-form-item label="内容"><el-input type="textarea" v-model="promptForm.content" :rows="12" /></el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="showPrompt=false">取消</el-button>
          <el-button type="primary" @click="savePrompt">保存</el-button>
        </template>
      </el-dialog>
    </div>

    <!-- ===== 模型配置 ===== -->
    <div v-if="active === 'model'" class="page">
      <div class="sec-title"><span class="bar"></span><h2>模型配置</h2><span class="sub">调整底层大模型与生成参数</span></div>
      <div class="card" style="max-width:640px">
        <el-form :model="modelConfig" label-width="140px">
          <el-form-item label="对话模型">
            <el-select v-model="modelConfig.model_name" style="width:100%">
              <el-option-group label="DeepSeek">
                <el-option label="DeepSeek Chat" value="deepseek-chat" />
              </el-option-group>
              <el-option-group label="智谱 AI（GLM）">
                <el-option label="GLM-4-Flash（免费）" value="glm-4-flash" />
                <el-option label="GLM-4-Plus" value="glm-4-plus" />
                <el-option label="GLM-4-Air" value="glm-4-air" />
                <el-option label="GLM-4-FlashX" value="glm-4-flashx" />
              </el-option-group>
              <el-option-group label="通义千问（Qwen）">
                <el-option label="Qwen-Plus（均衡）" value="qwen-plus" />
                <el-option label="Qwen-Turbo（快速）" value="qwen-turbo" />
                <el-option label="Qwen-Max（最强）" value="qwen-max" />
              </el-option-group>
              <el-option-group label="预留">
                <el-option label="GPT-4o-mini (预留)" value="gpt-4o-mini" />
              </el-option-group>
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
      </div>
    </div>

    <!-- ===== 工具管理 ===== -->
    <div v-if="active === 'tools'" class="page">
      <div class="sec-title"><span class="bar"></span><h2>工具管理</h2><span class="sub">控制 AI 智能体可调用的能力（开关持久化）</span></div>
      <div class="card">
        <el-table :data="toolsPageData" style="width:100%" :key="`tl-${toolsPage}-${toolsPageSize}`">
          <el-table-column prop="name" label="工具名" width="180" />
          <el-table-column prop="description" label="描述" />
          <el-table-column label="状态" width="90">
            <template #default="{row}">
              <el-switch v-model="row.enabled" @change="toggleTool(row)" />
            </template>
          </el-table-column>
        </el-table>
        <el-pagination v-if="toolsTotal > 0" v-model:current-page="toolsPage" v-model:page-size="toolsPageSize" :total="toolsTotal"
          layout="total, prev, pager, next" class="config-pagination" />
      </div>
    </div>

    <!-- ===== 审批流水线 ===== -->
    <div v-if="active === 'pipeline'" class="page pipeline-page">
      <div class="sec-title"><span class="bar"></span><h2>审批流水线</h2><span class="sub">纠错案例从待修正到上线的流转</span></div>
      <div class="card pipeline-flow-card">
        <div class="pipeline-status-bar">
          <div class="flow-step" :class="{ active: pipelineActive >= 0 }">
            <div class="flow-badge">{{ pipeline.pending }}</div>
            <div class="flow-title">待修正</div>
            <div class="flow-sub">待处理</div>
          </div>
          <div class="flow-line" :class="{ active: pipelineActive >= 1 }"></div>
          <div class="flow-step" :class="{ active: pipelineActive >= 1 }">
            <div class="flow-badge">{{ pipeline.fixed }}</div>
            <div class="flow-title">已修正</div>
            <div class="flow-sub">已提交</div>
          </div>
          <div class="flow-line" :class="{ active: pipelineActive >= 2 }"></div>
          <div class="flow-step" :class="{ active: pipelineActive >= 2 }">
            <div class="flow-badge">{{ pipeline.approved }}</div>
            <div class="flow-title">已批准</div>
            <div class="flow-sub">待上线</div>
          </div>
          <div class="flow-line" :class="{ active: pipelineActive >= 3 }"></div>
          <div class="flow-step" :class="{ active: pipelineActive >= 3 }">
            <div class="flow-badge">{{ pipeline.deployed }}</div>
            <div class="flow-title">已上线</div>
            <div class="flow-sub">已生效</div>
          </div>
        </div>
        <div class="pipeline-bottleneck">当前瓶颈：<b>{{ bottleneckLabel }}</b> · 总计 {{ pipelineTotal }} 条</div>
        <div v-if="pipelineTotal > 0" ref="pipelineChart" class="chart-box pipeline-funnel"></div>
        <div v-else class="pipeline-empty">
          <el-icon :size="56" color="#c5d9ff"><DataLine /></el-icon>
          <div class="pe-title">暂无流转数据</div>
          <div class="pe-sub">纠错案例进入流水线后，这里会自动生成漏斗图</div>
        </div>

        <el-divider content-position="left">
          <span style="font-weight:600;color:var(--text)">待审核纠错（已修正 · 待批准）</span>
        </el-divider>
        <el-table :data="pipelinePageData" style="width:100%" v-loading="reviewLoading" :key="`pl-${pipelineCorrectionsPage}-${pipelineCorrectionsPageSize}`"
                  v-if="pipelineCorrections.length">
          <el-table-column prop="id" label="ID" width="60" />
          <el-table-column prop="error_type" label="类型" width="92">
            <template #default="{row}"><el-tag size="small" effect="plain">{{ ERROR_TYPE_NAME[row.error_type] || '其他' }}</el-tag></template>
          </el-table-column>
          <el-table-column label="用户原问" min-width="190" show-overflow-tooltip>
            <template #default="{row}">{{ row.user_input || '（无关联对话）' }}</template>
          </el-table-column>
          <el-table-column label="修正答案" min-width="240">
            <template #default="{row}">
              <el-popover trigger="hover" placement="top" :width="380" popper-class="corr-pop">
                <div style="white-space:pre-wrap;max-height:320px;overflow:auto;font-size:13px;line-height:1.6">{{ row.correct_response }}</div>
                <template #reference><span class="corr-ans">{{ row.correct_response }}</span></template>
              </el-popover>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="86">
            <template #default="{row}">
              <el-tag :type="row.status==='deployed'?'success':row.status==='fixed'?'warning':'info'" size="small">{{ CORRECTION_STATUS_NAME[row.status] || row.status }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200">
            <template #default="{row}">
              <template v-if="row.status==='fixed' || (row.status==='pending' && row.correct_response)">
                <el-button size="small" type="primary" @click="reviewCorrection(row,'approve')">批准</el-button>
                <el-button size="small" type="danger" plain @click="reviewCorrection(row,'reject')">驳回</el-button>
              </template>
              <template v-else-if="row.status==='approved'">
                <el-button size="small" type="success" @click="reviewCorrection(row,'deploy')">发布</el-button>
                <el-button size="small" type="danger" plain @click="reviewCorrection(row,'reject')">驳回</el-button>
              </template>
              <el-tag v-else size="small" type="info">已处理</el-tag>
            </template>
          </el-table-column>
        </el-table>
        <el-empty v-else description="当前没有待审核的纠错案例" />
        <el-pagination v-if="pipelineCorrectionsTotal > 0" v-model:current-page="pipelineCorrectionsPage" v-model:page-size="pipelineCorrectionsPageSize" :total="pipelineCorrectionsTotal"
          layout="total, prev, pager, next" class="config-pagination" />
      </div>
    </div>


    <!-- ===== 用户管理 ===== -->
    <div v-if="active === 'users'" class="page">
      <div class="sec-title"><span class="bar"></span><h2>用户管理</h2><span class="sub">查看用户、衣橱与启用状态</span></div>
      <div class="card">
        <div class="toolbar">
          <el-input v-model="userSearch" placeholder="搜索用户名 / 昵称" clearable style="width:240px" @keyup.enter="loadUsers" />
          <el-select v-model="userRoleFilter" placeholder="角色" clearable style="width:140px">
            <el-option label="全部" value="" />
            <el-option label="用户" value="user" />
            <el-option label="搭配师" value="stylist" />
            <el-option label="管理员" value="admin" />
          </el-select>
          <el-button type="primary" @click="loadUsers">查询</el-button>
        </div>
        <el-table :data="usersPageData" style="width:100%" :key="`us-${usersPage}-${usersPageSize}`">
          <el-table-column prop="id" label="ID" width="70" />
          <el-table-column prop="username" label="用户名" min-width="140" />
          <el-table-column prop="nickname" label="昵称" min-width="140" />
          <el-table-column prop="role" label="角色" width="90" />
          <el-table-column prop="last_login_city" label="上次登录地点" min-width="120">
            <template #default="{row}">
              <span>{{ row.last_login_city || '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="created_at" label="注册时间" min-width="180" :formatter="(row)=>formatDateTime(row.created_at)" />
          <el-table-column label="状态" width="90">
            <template #default="{row}">
              <el-tag :type="row.is_active ? 'success' : 'danger'">{{ row.is_active ? '正常' : '禁用' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200">
            <template #default="{row}">
              <el-button size="small" @click="viewUserWardrobe(row)">衣橱</el-button>
              <el-button v-if="row.is_active" size="small" type="danger" plain @click="toggleUser(row, false)">禁用</el-button>
              <el-button v-else size="small" type="primary" @click="toggleUser(row, true)">恢复</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-pagination v-model:current-page="usersPage" v-model:page-size="usersPageSize" :total="usersTotal"
          layout="total, prev, pager, next" class="config-pagination" />
      </div>
      <el-drawer v-model="userWardrobeDrawer" :title="'用户衣橱 #' + currentUserWardrobe.user_id" size="45%" :append-to-body="true">
        <el-table :data="currentUserWardrobe.items || []" style="width:100%">
          <el-table-column prop="id" label="ID" width="60" />
          <el-table-column prop="name" label="名称" width="140" />
          <el-table-column prop="category" label="品类" width="90" />
          <el-table-column prop="color" label="颜色" width="90" />
          <el-table-column prop="wear_count" label="穿着" width="70" />
        </el-table>
      </el-drawer>
    </div>

    <!-- ===== AI 推理轨迹 ===== -->
    <div v-if="active === 'traces'" class="page traces-page">
      <div class="sec-title" style="margin-bottom:14px"><span class="bar"></span><h2>AI 推理轨迹</h2><span class="sub">每一次推荐的完整推理步骤</span></div>
      <el-alert type="info" :closable="false" style="margin-bottom:10px;padding:8px 12px"
        title="这里记录每一次 AI 推荐的完整推理步骤（输入 / 工具调用 / 输出），让 AI 不再黑箱，便于排查“踩”的原因。" />
      <div class="card trace-card">
        <el-table :data="tracesPageData" style="width:100%" @row-click="openTrace" class="trace-table" size="small" :key="`tr-${tracesPage}-${tracesPageSize}`">
          <el-table-column label="时间" min-width="170">
            <template #default="{row}">{{ formatDateTime(row.started_at) }}</template>
          </el-table-column>
          <el-table-column label="类型" min-width="140">
            <template #default="{row}"><el-tag size="small" effect="plain">{{ TRACE_TYPE_NAME[row.trace_type] || row.trace_type }}</el-tag></template>
          </el-table-column>
          <el-table-column label="步数" width="70" align="center">
            <template #default="{row}">{{ row.steps }}</template>
          </el-table-column>
          <el-table-column label="耗时" width="100">
            <template #default="{row}">
              <span :style="{ color: (row.total_ms||0) > 5000 ? 'var(--red)' : 'var(--green)', fontWeight: 600 }">{{ row.total_ms }} ms</span>
            </template>
          </el-table-column>
          <el-table-column prop="user_id" label="用户" width="70" />
          <el-table-column label="操作" width="90">
            <template #default><el-button size="small" type="primary" plain>查看</el-button></template>
          </el-table-column>
        </el-table>
        <el-pagination v-model:current-page="tracesPage" v-model:page-size="tracesPageSize" :total="tracesTotal"
          layout="total, prev, pager, next" class="config-pagination" />
        <el-drawer v-model="traceDrawer" title="推理轨迹明细" size="60%" :lock-scroll="false" :append-to-body="false" modal-class="trace-modal">
          <div v-if="traceSteps.length" class="trace-timeline">
            <div v-for="s in traceSteps" :key="s.step_index" class="tl-item">
              <div class="tl-rail"><div class="tl-dot" :class="'tl-' + (s.step_type || 'step')"></div></div>
              <div class="tl-card">
                <div class="tl-head">
                  <span class="tl-badge" :class="'badge-' + (s.step_type||'step')">{{ STEP_TYPE_NAME[s.step_type] || s.step_type }}</span>
                  <span v-if="s.tool_name" class="tl-tool">🔧 {{ s.tool_name }}</span>
                  <span class="tl-ms"><span v-if="s.step_index!==undefined">#{{ s.step_index }} · </span>{{ s.duration_ms }} ms</span>
                </div>
                <div v-if="s.input_params" class="tl-block"><div class="trace-label">输入</div><pre class="trace-pre">{{ s.input_params }}</pre></div>
                <div v-if="s.output_result" class="tl-block"><div class="trace-label">工具 / 中间输出</div><pre class="trace-pre">{{ s.output_result }}</pre></div>
                <div v-if="s.llm_response" class="tl-block"><div class="trace-label">LLM 返回</div><pre class="trace-pre">{{ s.llm_response }}</pre></div>
              </div>
            </div>
          </div>
          <el-empty v-else description="暂无步骤" />
        </el-drawer>
      </div>
    </div>

    <!-- 兜底：未匹配任何菜单时避免白屏 -->
    <div v-if="!menus.map(m => m.key).includes(active)" class="page empty-page">
      <div class="card" style="text-align:center;padding:80px 20px">
        <el-icon :size="56" style="color:var(--text-3);margin-bottom:16px"><Connection /></el-icon>
        <h2 style="margin:0 0 8px;font-size:18px;color:var(--text)">未选择功能模块</h2>
        <p style="margin:0;color:var(--text-2);font-size:14px">请点击左侧菜单进入对应配置页面</p>
      </div>
    </div>
  </SidebarLayout>
</template>

<script setup>
import { ref, onMounted, watch, nextTick, computed } from 'vue'
import * as echarts from 'echarts'
import { ElMessage } from 'element-plus'
import SidebarLayout from '@/components/SidebarLayout.vue'

const ERROR_TYPE_NAME = { style: '风格', occasion: '场合', color: '颜色', size: '尺码', other: '其他' }
const CORRECTION_STATUS_NAME = { pending: '待修正', fixed: '已修正', approved: '已批准', deployed: '已上线', rejected: '已驳回' }
const PROMPT_STATUS_NAME = { draft: '草稿', online: '线上', history: '历史' }

const menus = [
  { key: 'dashboard', label: '概览', icon: 'Histogram' },
  { key: 'prompts', label: 'Prompt 管理', icon: 'Document' },
  { key: 'model', label: '模型配置', icon: 'Setting' },
  { key: 'tools', label: '工具管理', icon: 'Tools' },
  { key: 'pipeline', label: '审批流水线', icon: 'Operation' },
  { key: 'users', label: '用户管理', icon: 'User' },
  { key: 'traces', label: 'AI 推理轨迹', icon: 'Connection' }
]
const active = ref('dashboard')

const taskChecks = ref([false, false, false, false])
const taskList = computed(() => [
  { label: '检查模型配置与工具开关', done: taskChecks.value[0] },
  { label: '审批已修正的纠错案例', done: taskChecks.value[1] },
  { label: `查看昨日成本与调用趋势${pipeline.value.pending > 0 ? `（${pipeline.value.pending} 条待处理）` : ''}`, done: taskChecks.value[2] },
  { label: '导出本周运营数据', done: taskChecks.value[3] }
])
const calDate = ref(new Date())
const nickname = sessionStorage.getItem('web_nickname') || ''

const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 12) return '早上好'
  if (h < 18) return '下午好'
  return '晚上好'
})

const prompts = ref([])
const promptsTotal = ref(0)
const promptsPage = ref(1)
const promptsPageSize = ref(10)
const showPrompt = ref(false)
const promptForm = ref({ name: '', content: '' })
const editingPromptId = ref(null)
const modelConfig = ref({ model_name: 'deepseek-chat', temperature: 0.7, top_p: 1.0 })
const tools = ref([])
const toolsPage = ref(1)
const toolsPageSize = ref(8)
const toolsTotal = ref(0)
const toolsPageData = computed(() => {
  const start = (toolsPage.value - 1) * toolsPageSize.value
  return tools.value.slice(start, start + toolsPageSize.value)
})
const pipeline = ref({ pending: 0, fixed: 0, approved: 0, deployed: 0 })
const pipelineChart = ref(null)
const pipelineActive = computed(() => {
  const arr = [pipeline.value.pending, pipeline.value.fixed, pipeline.value.approved, pipeline.value.deployed]
  for (let i = 0; i < arr.length; i++) { if (arr[i] === 0) return i }
  return 4
})
const bottleneckLabel = computed(() => {
  const stages = ['待修正', '已修正', '已批准', '已上线']
  const arr = [pipeline.value.pending, pipeline.value.fixed, pipeline.value.approved, pipeline.value.deployed]
  for (let i = 0; i < arr.length; i++) { if (arr[i] === 0) return stages[i] }
  return '已全部上线'
})
const pipelineTotal = computed(() => pipeline.value.pending + pipeline.value.fixed + pipeline.value.approved + pipeline.value.deployed)
const monitor = ref(null)

async function loadPrompts() {
  try {
    const d = await (await fetch('/api/config/prompts?page=1&page_size=1000')).json()
    prompts.value = d.prompts || []
    promptsTotal.value = d.total || 0
  } catch {}
}
const promptsPageData = computed(() => {
  const start = (promptsPage.value - 1) * promptsPageSize.value
  return prompts.value.slice(start, start + promptsPageSize.value)
})
async function loadModel() {
  try { modelConfig.value = await (await fetch('/api/config/model-config')).json() } catch {}
}
async function loadTools() {
  try {
    tools.value = await (await fetch('/api/config/tools')).json()
    toolsTotal.value = tools.value.length
  } catch {}
}
async function loadPipeline() {
  try { pipeline.value = await (await fetch('/api/config/pipeline')).json() } catch {}
}
const pipelineCorrections = ref([])
const pipelineCorrectionsTotal = ref(0)
const pipelineCorrectionsPage = ref(1)
const pipelineCorrectionsPageSize = ref(10)
const reviewLoading = ref(false)
async function loadPipelineCorrections() {
  reviewLoading.value = true
  try {
    const d = await (await fetch('/api/config/pipeline/corrections?status=review&page=1&page_size=1000')).json()
    pipelineCorrections.value = d.corrections || []
    pipelineCorrectionsTotal.value = d.total || 0
  } catch {}
  finally { reviewLoading.value = false }
}
const pipelinePageData = computed(() => {
  const start = (pipelineCorrectionsPage.value - 1) * pipelineCorrectionsPageSize.value
  return pipelineCorrections.value.slice(start, start + pipelineCorrectionsPageSize.value)
})
async function reviewCorrection(row, action) {
  await fetch('/api/config/pipeline/approve', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ correction_id: row.id, action })
  })
  const msg = { approve: '已批准，等待发布', deploy: '已发布并同步进 AI 范例库', reject: '已驳回，退回待修正' }[action]
  ElMessage.success(msg || '操作成功')
  loadPipelineCorrections()
  loadPipeline()
}

function renderPipelineChart() {
  const el = pipelineChart.value
  if (!el || pipelineTotal.value === 0) return
  const chart = echarts.getInstanceByDom(el) || echarts.init(el, 'wardrobe')
  const stages = ['待修正', '已修正', '已批准', '已上线']
  const values = [
    pipeline.value.pending,
    pipeline.value.fixed,
    pipeline.value.approved,
    pipeline.value.deployed
  ]
  const colors = ['#7aa8ff', '#a9c6ff', '#FF9E8E', '#5B8DEF']
  chart.setOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, formatter: '{b}: {c} 条' },
    grid: { left: '2%', right: '2%', bottom: '2%', top: '12%', containLabel: true },
    xAxis: {
      type: 'category',
      data: stages,
      axisLine: { lineStyle: { color: '#d6e5ff' } },
      axisTick: { show: false },
      axisLabel: { color: '#6B7A9C', fontSize: 13 }
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: '#eef5ff', type: 'dashed' } },
      axisLabel: { color: '#8A9ABA' }
    },
    series: [{
      type: 'bar',
      barWidth: '42%',
      data: values.map((v, i) => ({
        value: v,
        itemStyle: { color: colors[i], borderRadius: [10, 10, 0, 0] }
      })),
      label: { show: true, position: 'top', color: '#2D3A5A', fontSize: 13, fontWeight: 700 },
      itemStyle: { borderRadius: [10, 10, 0, 0] }
    }]
  }, true)
  chart.resize()
}

watch(active, (n) => {
  if (n === 'pipeline') { nextTick(() => { renderPipelineChart(); loadPipelineCorrections() }) }
  if (n === 'dashboard') {
    nextTick(() => {
      renderCostChart()
      renderDashboardCharts()
    })
  }
})

function reloadAll() {
  loadPrompts(); loadModel(); loadTools(); loadPipeline(); loadMonitor()
  loadCostStats(); loadStylistStats(); loadTraces()
  loadDashboard(); loadUsers(); loadPipelineCorrections()
  ElMessage.success('数据已刷新')
}
function focusAnalytics() {
  active.value = 'dashboard'
  nextTick(() => {
    const el = document.querySelector('.dash-analytics')
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
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

/* 保存时按模型名自动推断供应商：glm-* → 智谱，qwen-* → 通义，其余 → DeepSeek；保存后回显实际生效的模型 */
async function saveModelConfig() {
  const n = modelConfig.value.model_name
  const provider = n.startsWith('glm-') ? 'zhipu' : (n.startsWith('qwen-') ? 'tongyi' : 'deepseek')
  const payload = { ...modelConfig.value, provider }
  try {
    const r = await fetch('/api/config/model-config', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    const saved = await r.json()
    const name = { deepseek: 'DeepSeek', zhipu: '智谱 AI（GLM）', tongyi: '通义千问（Qwen）' }[saved.provider] || saved.provider
    ElMessage.success(`已切换至 ${name} · ${saved.model_name}，立即生效`)
  } catch (e) {
    ElMessage.error('保存失败，请确认后端已重启加载新代码')
  }
}

async function toggleTool(row) {
  await fetch('/api/config/tools/toggle', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tool_name: row.name, enabled: row.enabled }) })
}

// ===== 效能驾驶舱 + 推理轨迹 =====
const cost = ref({ today: {}, week: {}, month: {}, daily: [], by_type: {} })
const costChart = ref(null)
const stylistStats = ref(null)
const traces = ref([])
const tracesTotal = ref(0)
const tracesPage = ref(1)
const tracesPageSize = ref(10)
const traceDrawer = ref(false)
const traceSteps = ref([])
const TRACE_TYPE_NAME = { chat: '对话推荐', today: '今日推荐', scene: '场景推荐', outfit_review: '自主搭配审核', manual: '手动搭配', quick: '快速推荐' }
const STEP_TYPE_NAME = { input: '输入', thought: '思考', tool_call: '工具调用', llm_response: 'LLM 返回', output: '输出', step: '步骤' }
/* 把 ISO 时间戳格式化成"YYYY-MM-DD HH:mm:ss"（普通人易读） */
function formatDateTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  const p = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

async function loadCostStats() {
  try { cost.value = await (await fetch('/api/config/cost-stats')).json() } catch {}
  nextTick(renderCostChart)
}
async function loadStylistStats() {
  try { stylistStats.value = await (await fetch('/api/stylist/stats')).json() } catch {}
}
async function loadTraces() {
  try {
    const d = await (await fetch('/api/config/traces?page=1&page_size=1000')).json()
    traces.value = d.traces || []
    tracesTotal.value = d.total || 0
  } catch {}
}
const tracesPageData = computed(() => {
  const start = (tracesPage.value - 1) * tracesPageSize.value
  return traces.value.slice(start, start + tracesPageSize.value)
})
async function openTrace(row) {
  try {
    traceSteps.value = await (await fetch('/api/config/traces/' + encodeURIComponent(row.session_id))).json()
  } catch {}
  traceDrawer.value = true
}
function renderCostChart() {
  const el = costChart.value
  if (!el) return
  const chart = echarts.getInstanceByDom(el) || echarts.init(el, 'wardrobe')
  const daily = cost.value.daily || []
  chart.setOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
    legend: { data: ['成本(元)', '调用次数'], top: 0 },
    grid: { left: 10, right: 10, top: 44, bottom: 64, containLabel: true },
    xAxis: { type: 'category', data: daily.map(d => (d.date || '').slice(5)), axisLabel: { rotate: 45, hideOverlap: true, fontSize: 11 } },
    yAxis: [
      { type: 'value', name: '成本(元)', nameTextStyle: { fontSize: 11 }, axisLabel: { formatter: v => v.toFixed(3) } },
      { type: 'value', name: '调用次数', nameTextStyle: { fontSize: 11 }, splitLine: { show: false } }
    ],
    series: [
      { name: '成本(元)', type: 'line', smooth: true, yAxisIndex: 0, data: daily.map(d => d.cost), areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(122,168,255,0.25)' }, { offset: 1, color: 'rgba(122,168,255,0)' }] } }, itemStyle: { color: '#7aa8ff' } },
      { name: '调用次数', type: 'bar', yAxisIndex: 1, data: daily.map(d => d.calls), itemStyle: { color: '#a9c6ff', borderRadius: [4, 4, 0, 0] } }
    ]
  })
  chart.resize()
}

// ===== 数据仪表盘 + 用户管理 =====
const dash = ref({})
const dashChart = ref(null)
const dashPie = ref(null)
const users = ref([])
const usersTotal = ref(0)
const usersPage = ref(1)
const usersPageSize = ref(10)
const userSearch = ref('')
const userRoleFilter = ref('')
const userWardrobeDrawer = ref(false)
const currentUserWardrobe = ref({})

async function loadDashboard() {
  try {
    dash.value = await (await fetch('/api/admin/dashboard')).json()
    nextTick(renderDashboardCharts)
  } catch (e) {}
}
function renderDashboardCharts() {
  const c1 = dashChart.value
  if (c1) {
    const chart = echarts.getInstanceByDom(c1) || echarts.init(c1)
    chart.setOption({
      tooltip: { trigger: 'axis' },
      grid: { left: 10, right: 20, top: 30, bottom: 30, containLabel: true },
      xAxis: { type: 'category', data: (dash.value.daily_recommendations || []).map(d => (d.date || '').slice(5)), axisLabel: { interval: 'auto', hideOverlap: true } },
      yAxis: { type: 'value', minInterval: 1 },
      series: [{ type: 'bar', data: (dash.value.daily_recommendations || []).map(d => d.count), itemStyle: { color: '#7aa8ff', borderRadius: [6, 6, 0, 0] } }]
    })
    chart.resize()
  }
  const c2 = dashPie.value
  if (c2) {
    const pie = echarts.getInstanceByDom(c2) || echarts.init(c2)
    const src = dash.value.adoption_by_source || {}
    const SOURCE_NAME = { today: '今日推荐', chat: '对话推荐', scene: '场景推荐', manual: '手动搭配' }
    const entries = Object.entries(src)
    pie.setOption({
      color: ['#7aa8ff', '#8B7AC0', '#FF9E8E', '#5B8DEF', '#B19CD9'],
      tooltip: { trigger: 'item', formatter: p => `${p.name}: ${p.value} (${p.percent}%)` },
      legend: { bottom: 0, type: 'scroll' },
      graphic: entries.length ? [] : [{ type: 'text', left: 'center', top: 'middle', style: { text: '暂无采纳数据', fill: '#66708a', fontSize: 14 } }],
      series: [{
        type: 'pie', radius: ['35%', '65%'], center: ['50%', '45%'],
        avoidLabelOverlap: true,
        label: { formatter: '{b}\n{d}%', color: '#2D3A5A' },
        labelLine: { length: 12, length2: 14, lineStyle: { color: '#d6e5ff' } },
        data: entries.map(([k, v]) => ({ name: SOURCE_NAME[k] || k, value: v }))
      }]
    })
    pie.resize()
  }
}
async function loadUsers() {
  try {
    const q = ['page=1', 'page_size=1000']
    if (userSearch.value) q.push('search=' + encodeURIComponent(userSearch.value))
    if (userRoleFilter.value) q.push('role=' + encodeURIComponent(userRoleFilter.value))
    const d = await (await fetch('/api/admin/users?' + q.join('&'))).json()
    users.value = d.users || []
    usersTotal.value = d.total || 0
  } catch (e) {}
}
const usersPageData = computed(() => {
  const start = (usersPage.value - 1) * usersPageSize.value
  return users.value.slice(start, start + usersPageSize.value)
})
async function toggleUser(row, enable) {
  await fetch('/api/admin/users/disable', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: row.id, disable: !enable }) })
  ElMessage.success(enable ? '已恢复' : '已禁用')
  loadUsers()
}
async function viewUserWardrobe(row) {
  try {
    currentUserWardrobe.value = await (await fetch('/api/admin/users/' + row.id + '/wardrobe')).json()
    userWardrobeDrawer.value = true
  } catch (e) {}
}

function resizeAllCharts() {
  ;[pipelineChart.value, costChart.value, dashChart.value, dashPie.value].forEach(el => {
    if (!el) return
    const c = echarts.getInstanceByDom(el)
    if (c) c.resize()
  })
}

onMounted(() => {
  loadPrompts(); loadModel(); loadTools(); loadPipeline(); loadMonitor()
  loadCostStats(); loadStylistStats(); loadTraces()
  loadDashboard(); loadUsers(); loadPipelineCorrections()
  window.addEventListener('resize', resizeAllCharts)
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

.toolbar { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 16px; }

.chart-box { width: 100%; height: 300px; }

/* 审批流水线 */
.pipeline-page .card { margin-bottom: 18px; }
.pipeline-flow-card { padding: 28px; }
.pipeline-status-bar { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 16px; }
.flow-step { flex: 1; text-align: center; opacity: .55; transition: opacity .2s ease; }
.flow-step.active { opacity: 1; }
.flow-badge { width: 48px; height: 48px; border-radius: 50%; background: #eef5ff; color: #7aa8ff; font-size: 18px; font-weight: 800; display: flex; align-items: center; justify-content: center; margin: 0 auto 10px; border: 2px solid #d6e5ff; }
.flow-step.active .flow-badge { background: #7aa8ff; color: #fff; border-color: transparent; box-shadow: 0 8px 20px rgba(122,168,255,.28); }
.flow-title { font-size: 14px; font-weight: 700; color: var(--text); margin-bottom: 2px; }
.flow-sub { font-size: 12px; color: var(--text-3); }
.flow-line { flex: 1; height: 2px; background: #e1edff; border-radius: 2px; max-width: 90px; }
.flow-line.active { background: #7aa8ff; }
.pipeline-bottleneck { text-align: center; font-size: 13px; color: var(--text-2); margin-bottom: 14px; }
.pipeline-bottleneck b { color: var(--text); font-weight: 700; }
.pipeline-funnel { height: 260px; }
.pipeline-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 44px 20px; background: #FDFBF7; border-radius: 16px; border: 1px dashed #d6e5ff; margin-bottom: 16px; }
.pipeline-empty .pe-title { font-size: 15px; font-weight: 700; color: var(--text); margin: 14px 0 6px; }
.pipeline-empty .pe-sub { font-size: 13px; color: var(--text-3); line-height: 1.5; }
.corr-ans {
  display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical;
  overflow: hidden; font-size: 13px; color: var(--text-2); cursor: pointer;
  line-height: 1.5; max-height: 3em;
}

/* ===== 概览 Dashboard ===== */
.dash-header { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 24px; gap: 16px; flex-wrap: wrap; }
.dash-title { font-size: 28px; font-weight: 800; color: var(--text); margin: 0 0 6px; line-height: 1.2; }
.dash-sub { font-size: 14px; color: var(--text-3); margin: 0; }
.dash-actions { display: flex; gap: 10px; }

.quick-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; margin-bottom: 24px; }
.q-card {
  background: #fff;
  border-radius: var(--radius-lg, 16px);
  padding: 20px;
  box-shadow: var(--shadow);
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.q-card:hover { transform: translateY(-2px); box-shadow: 0 14px 36px rgba(122, 168, 255, 0.12); }
.q-icon { width: 46px; height: 46px; border-radius: 14px; display: flex; align-items: center; justify-content: center; margin-bottom: 12px; }
.q-title { font-size: 15px; font-weight: 700; color: var(--text); margin-bottom: 4px; }
.q-desc { font-size: 12px; color: var(--text-3); line-height: 1.4; }

.dash-grid { display: grid; grid-template-columns: 1.4fr 1fr; gap: 20px; margin-bottom: 24px; }
.dash-analytics { display: flex; flex-direction: column; gap: 28px; margin-top: 28px; }
.analytics-section { display: flex; flex-direction: column; gap: 20px; }
.analytics-section > .sec-title { margin-bottom: 0; }
.analytics-section > .kpi-row { margin-bottom: 0; }
.analytics-section .card { margin-bottom: 0; }
.dash-col { display: flex; flex-direction: column; gap: 20px; }
.dash-col.left > .card, .dash-col.right > .card { margin-bottom: 0; }
.kpi-stack { grid-template-columns: 1fr; }
.kpi-stack .kpi-card { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; }

.health-list { display: flex; flex-direction: column; gap: 16px; }
.health-li { display: flex; align-items: center; justify-content: space-between; gap: 12px; font-size: 13px; color: var(--text-2); flex-wrap: wrap; }
.health-li b { font-size: 15px; color: var(--text); font-weight: 700; }
.health-li .tool-tags { display: flex; gap: 6px; flex-wrap: wrap; }
.empty-tip { color: var(--text-3); font-size: 12px; }

.noti-list { display: flex; flex-direction: column; gap: 12px; }
.noti-item { display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 12px; background: #FDFBF7; transition: background 0.15s ease; }
.noti-item:hover { background: #e1edff; }
.noti-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--text-3); flex-shrink: 0; }
.noti-dot.pending { background: var(--red); }
.noti-dot.fixed { background: var(--orange); }
.noti-dot.approved { background: var(--green); }
.noti-body { flex: 1; min-width: 0; }
.noti-title { font-size: 13px; font-weight: 600; color: var(--text); margin-bottom: 3px; }
.noti-text { font-size: 12px; color: var(--text-3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.task-list { display: flex; flex-direction: column; gap: 12px; }
.task-item { display: flex; align-items: center; gap: 10px; font-size: 13px; color: var(--text); cursor: pointer; }
.task-item span { transition: color 0.2s ease; }
.task-item span.done { color: var(--text-3); text-decoration: line-through; }

.calendar-card { padding-bottom: 12px; }
.dash-calendar :deep(.el-calendar__header) { border-bottom: none; padding-bottom: 4px; }
.dash-calendar :deep(.el-calendar__title) { font-weight: 700; color: var(--text); }
.dash-calendar :deep(.el-calendar-day) { height: 42px; line-height: 42px; font-size: 12px; border-radius: 8px; }
.dash-calendar :deep(.el-calendar-table thead th) { color: var(--text-3); font-size: 12px; }

/* 运行健康 / KPI / 表格 / 时间线 */
.health-card { display: flex; gap: 40px; align-items: center; flex-wrap: wrap; }
.health-item { display: flex; flex-direction: column; gap: 8px; }
.health-label { font-size: 12px; color: var(--text-2); }
.health-val { font-size: 18px; color: var(--text); font-weight: 600; }
.health-tools { display: flex; gap: 6px; flex-wrap: wrap; max-width: 360px; }
.health-tool { margin: 0; }

.kpi-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 16px; margin-bottom: 20px; }
.kpi-card { background: #fff; border-radius: var(--radius-lg, 16px); padding: 18px 20px; box-shadow: var(--shadow); }
.kpi-card.blue { background: #e1edff; }
.kpi-card.blue .kpi-val { color: #7aa8ff; }
.kpi-label { font-size: 13px; color: var(--text-3); margin-bottom: 8px; }
.kpi-val { font-size: 24px; font-weight: 700; color: var(--text); }

.traces-page .sec-title { margin-bottom: 14px; }
.trace-card { padding: 16px; position: relative; }
/* Drawer 嵌套在 trace-card 内，遮罩只覆盖整个表格卡片，不覆盖整个界面 */
.trace-card .trace-modal { position: absolute !important; inset: 0 !important; border-radius: 12px; }
/* 分页器与表格行高撑开 */
.config-pagination { margin-top: 18px; justify-content: flex-end; }
.trace-table { cursor: pointer; }
.trace-table :deep(.el-table__cell) { padding: 14px 0; }
:deep(.el-table__row) { height: 56px; }
:deep(.el-table .cell) { padding: 0 12px; }
.trace-label { font-size: 12px; color: var(--text-2); margin: 6px 0 2px; }
.trace-pre { background: #FDFBF7; border-radius: 10px; padding: 10px 12px; white-space: pre-wrap; word-break: break-all; font-size: 12px; max-height: 240px; overflow: auto; margin: 0; color: var(--text-2); }

.trace-timeline { padding: 4px 0; }
.tl-item { display: flex; gap: 12px; }
.tl-rail { display: flex; flex-direction: column; align-items: center; width: 14px; flex-shrink: 0; }
.tl-dot { width: 12px; height: 12px; border-radius: 50%; background: var(--accent); margin-top: 6px; box-shadow: 0 0 0 3px var(--accent-light); z-index: 1; }
.tl-dot.tl-input { background: var(--text-3); box-shadow: 0 0 0 3px rgba(155,163,181,0.18); }
.tl-dot.tl-thought { background: var(--orange); box-shadow: 0 0 0 3px rgba(245,158,11,0.18); }
.tl-dot.tl-tool_call { background: var(--green); box-shadow: 0 0 0 3px rgba(34,197,94,0.18); }
.tl-dot.tl-llm_response { background: var(--accent); box-shadow: 0 0 0 3px var(--accent-light); }
.tl-dot.tl-output { background: var(--blue); box-shadow: 0 0 0 3px rgba(59,130,246,0.18); }
.tl-rail::after { content: ''; flex: 1; width: 2px; background: #e1edff; margin-top: 4px; }
.tl-item:last-child .tl-rail::after { display: none; }
.tl-card { flex: 1; background: #fff; border: 1px solid #e1edff; border-radius: 12px; padding: 14px 16px; margin-bottom: 16px; box-shadow: var(--shadow-sm); }
.tl-head { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 8px; }
.tl-badge { font-size: 12px; font-weight: 600; padding: 2px 10px; border-radius: 20px; background: var(--accent-light); color: var(--accent); }
.badge-input { background: #e1edff; color: var(--text-2); }
.badge-thought { background: var(--coral-light, #FFE9E2); color: var(--coral-ink, #D66A60); }
.badge-tool_call { background: #DCFCE7; color: #15803D; }
.badge-llm_response { background: var(--accent-light); color: var(--accent); }
.badge-output { background: var(--lav-100, #E8DEF3); color: var(--lav-800, #5D4F80); }
.tl-tool { font-size: 12px; color: var(--green); }
.tl-ms { font-size: 12px; color: var(--text-3); margin-left: auto; }
.tl-block { margin-top: 8px; }

@media (max-width: 1100px) {
  .quick-cards { grid-template-columns: repeat(2, 1fr); }
  .dash-grid { grid-template-columns: 1fr; }
}
@media (max-width: 640px) {
  .quick-cards { grid-template-columns: 1fr; }
  .dash-header { flex-direction: column; align-items: flex-start; }
  .pipeline-status-bar { flex-wrap: wrap; }
  .flow-line { display: none; }
}
</style>
