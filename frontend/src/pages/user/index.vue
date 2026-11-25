<template>
  <view class="page">
    <!-- 自定义顶部栏：天气 + 通知 -->
    <view class="topbar">
      <view class="tb-weather-pill" @click="openCityPicker">
        <icon-svg class="tw-ico" name="location"></icon-svg>
        <text class="tw-text">{{ weather.city || '定位' }} · {{ tempDisplay }} · {{ weather.description }}</text>
      </view>
      <view class="tb-right">
        <view class="notify-bell" @click="openNotifyDrawer">
          <icon-svg class="bell-ico" name="bell"></icon-svg>
          <text v-if="unreadCount>0" class="bell-badge">{{ unreadCount>99?'99+':unreadCount }}</text>
        </view>
      </view>
    </view>

    <!-- 主体内容 -->
    <scroll-view ref="mainScrollRef" class="main" scroll-y>
      <!-- ===== 1. 首页（社区风） ===== -->
      <view v-show="currentView==='today'" class="panel home-panel">
        <!-- 问候条 (学习自 小红书 / Instagram 首页头部) -->
        <view class="greet-strip">
          <view class="greet-text">
            <text class="greet-title">{{ greeting }}</text>
            <text class="greet-sub">今天想穿什么风格？让搭配师帮你搭</text>
          </view>
          <view class="greet-dot h5-breath"></view>
        </view>
    <!-- 分类快捷入口 -->
    <view class="cat-scroll">
          <view class="cat-list">
            <view v-for="c in homeCategories" :key="c.key" class="cat-tile" @click="onHomeCategory(c)">
              <view class="cat-icon-wrap" :style="{background:c.bg}">
                <icon-svg class="cat-icon" :name="c.icon"></icon-svg>
              </view>
              <text class="cat-label">{{ c.label }}</text>
            </view>
          </view>
        </view>

        <!-- 今日穿搭大卡片 -->
        <view class="hero-card">
          <!-- 有单品列表时：按分类展示大图 -->
          <view v-if="outfitGroups.length" class="hero-outfit">
            <view class="hero-outfit-head">
              <view>
                <text class="hero-title">今天穿什么</text>
                <text class="hero-sub">从衣橱智能挑选</text>
              </view>
            </view>
            <view v-for="g in outfitGroups" :key="g.key" class="hero-group">
              <view class="hero-group-head">
                <text class="hero-group-title">{{ g.label }}</text>
                <text class="hero-group-count">{{ g.items.length }}/{{ g.items.length }}</text>
              </view>
              <view class="hero-group-scroll">
                <view class="hero-group-list">
                  <view v-for="item in g.items" :key="item.id" class="hero-big-card" @click="openDetail(item)">
                    <view class="hero-big-img-wrap">
                      <image v-if="item.image_url" :src="item.image_url" mode="aspectFit" class="hero-big-img" />
                      <view v-else class="hero-big-ph" :style="{ background: getItemColorHex(item) }">{{ item.name[0] }}</view>
                    </view>
                    <text class="hero-big-name">{{ item.name }}</text>
                  </view>
                </view>
              </view>
            </view>
            <view class="hero-actions">
              <view class="hero-btn primary" @click.stop="loadHomeOutfit(true)">换一套</view>
              <view class="hero-btn cream" @click.stop="wearTodayOutfit">确认今日穿搭</view>
            </view>
          </view>

          <!-- 无单品时：整体图 / 空态 -->
          <view v-else class="hero-bg">
            <image v-if="homeOutfit && homeOutfit.image_url" :src="homeOutfit.image_url" mode="aspectFill" class="hero-img" />
            <view v-else class="hero-ph">
              <icon-svg class="hero-ph-ico" name="package-x"></icon-svg>
              <text class="hero-ph-txt">衣橱空空</text>
            </view>
          </view>
          <view v-if="!outfitGroups.length" class="hero-info">
            <text class="hero-title">{{ homeOutfit ? '今天穿什么' : '添加衣物开启推荐' }}</text>
            <text class="hero-sub">{{ homeOutfit ? '从衣橱智能挑选' : '上传几件常穿的衣服，AI 会每天帮你搭' }}</text>
            <view class="hero-actions">
              <view class="hero-btn primary" @click.stop="loadHomeOutfit(true)">换一套</view>
            </view>
          </view>
        </view>

        <!-- 搭配审核入口 -->
        <view class="section-head">
          <text class="section-title">搭配工具</text>
        </view>
        <view class="tool-list">
          <view class="tool-tile" @click="startSelfOutfit">
            <view class="tool-icon-wrap blue"><icon-svg name="check" :size="42"></icon-svg></view>
            <text class="tool-label">搭配审核</text>
          </view>
          <view class="tool-tile" @click="goWardrobe">
            <view class="tool-icon-wrap lav"><icon-svg name="shirt" :size="42"></icon-svg></view>
            <text class="tool-label">我的衣橱</text>
          </view>
        </view>

      </view>

      <!-- ===== 2. AI对话 ===== -->
      <view v-show="currentView==='chat'" class="panel">
        <view class="panel-head between">
          <view class="head-left">
            <icon-svg class="menu-btn" @click="openHistoryDrawer" name="menu"></icon-svg>
            <text class="panel-title">穿搭对话</text>
          </view>
          <view class="mini-btn" @click="goWardrobe">查看衣橱</view>
        </view>
        <view class="chat-box">
          <view v-for="(m,i) in messages" :key="i" :class="['msg','msg-'+m.role]">
            <view class="bubble">
              <text class="msg-label">{{ m.role==='user'?'你':'搭配师' }}</text>
              <view v-if="m.role==='user' && m.image" class="chat-user-img-wrap">
                <image :src="m.image" mode="widthFix" class="chat-user-img" @click="previewImage(m.image)" />
              </view>
              <rich-text v-if="m.role==='agent'" class="msg-text" :nodes="md2html(m.content)"></rich-text>
              <text v-else class="msg-text">{{ m.content }}</text>
            </view>
            <view v-if="m.role==='agent' && m.items && m.items.length" class="chat-outfit">
              <view v-for="g in groupChatItems(m.items)" :key="g.key" class="hero-group">
                <view class="hero-group-head">
                  <text class="hero-group-title">{{ g.label }}</text>
                  <text class="hero-group-count">{{ g.items.length }}/{{ g.items.length }}</text>
                </view>
                <view class="hero-group-scroll">
                  <view class="hero-group-list">
                    <view v-for="item in g.items" :key="item.id" class="hero-big-card" @click="openDetail(item)">
                      <view class="hero-big-img-wrap">
                        <image v-if="item.image_url" :src="item.image_url" mode="aspectFit" class="hero-big-img" />
                        <view v-else class="hero-big-ph" :style="{ background: getItemColorHex(item) }">{{ (item.name || '?')[0] }}</view>
                      </view>
                      <text class="hero-big-name">{{ item.name }}</text>
                    </view>
                  </view>
                </view>
              </view>
            </view>
            <image v-if="m.role==='agent' && m.image && !(m.items && m.items.length)" :src="m.image" mode="widthFix" class="chat-img" />
            <view v-if="m.role==='agent'&&m.cid" :class="['rate-row',{done:m.rating}]">
              <text class="rate-hint">{{ m.rating ? '感谢你的评分' : '这条回复有帮助吗？' }}</text>
              <view class="rate-stars">
                <text v-for="n in 5" :key="n" :class="['star',{active:n<=m.rating}]" @click="rateByIndex(i,n)">★</text>
              </view>
            </view>
          </view>
          <view v-if="chatLoading" class="msg msg-agent">
            <view class="bubble">
              <view class="ai-thinking-bubble">
                <text class="ai-thinking-label">正在思考…</text>
                <view class="ai-thinking-dots">
                  <view class="ai-dot"></view>
                  <view class="ai-dot"></view>
                  <view class="ai-dot"></view>
                </view>
              </view>
            </view>
          </view>
        </view>
        <view class="chat-input-wrap">
          <view v-if="pendingChatImage" class="chat-pending-img">
            <image :src="pendingChatImage" mode="aspectFill" class="chat-pending-thumb" />
            <icon-svg class="chat-pending-del" name="close" @click="clearPendingChatImage"></icon-svg>
          </view>
          <view class="chat-input">
            <view class="icon-btn" @click="chatChooseImage"><icon-svg name="camera"></icon-svg></view>
            <input class="chat-field" :value="chatInput" :placeholder="pendingChatImage ? '输入图片描述后点击发送...' : '描述你的需求，比如：明天开会，帮我推荐...'"
                   @input="onChatInput" @confirm="onChatConfirm" />
            <view class="send-btn" @click="onChatSend">发送</view>
          </view>
        </view>
      </view>

      <!-- ===== 3. 衣橱管理（DPSTAR 风格）==== -->
      <view v-show="currentView==='wardrobe'" class="panel wh-page">

        <!-- 衣橱头部：标题 + 件数 -->
        <view class="wh-page-head">
          <text class="wh-page-title">我的衣橱</text>
          <text class="wh-page-count">已收录 {{ wardrobe.length }} 件</text>
        </view>

        <!-- 搜索 -->
        <view class="wh-search-bar">
          <icon-svg class="wh-search-ico" name="search"></icon-svg>
          <input class="wh-search-input" v-model="wardrobeSearch" placeholder="搜索名称、描述..." />
        </view>

        <!-- 季节筛选 -->
        <view class="wh-filter-row">
          <text class="wh-filter-label">季节</text>
          <view class="wh-filter-scroll">
            <view v-for="s in seasonOptions" :key="s.k"
                  :class="['wh-filter-pill', { active: seasonFilter === s.k }]"
                  @click="seasonFilter = s.k">{{ s.l }}</view>
          </view>
        </view>

        <!-- 风格筛选 -->
        <view class="wh-filter-row">
          <text class="wh-filter-label">风格</text>
          <view class="wh-filter-scroll">
            <view v-for="s in styleOptions" :key="s.k"
                  :class="['wh-filter-pill', { active: styleFilter === s.k }]"
                  @click="styleFilter = s.k">{{ s.l }}</view>
          </view>
        </view>

        <!-- 录入入口 -->
        <view class="wh-upload-entry" @click="openUpload">
          <icon-svg class="wh-up-ico" name="camera"></icon-svg>
          <text class="wh-up-text">录入新的衣服（AI自动识别图片填资料）</text>
        </view>

        <!-- 分类区块：每个分类横向滚动大图卡片 -->
        <view v-for="g in groupedWardrobe" :key="g.key" class="wh-group">
          <view class="wh-group-head">
            <text class="wh-group-title">{{ g.label }}</text>
            <text class="wh-group-count">{{ g.items.length }}</text>
          </view>
          <view class="wh-group-scroll">
            <view class="wh-group-list">
              <view v-for="item in g.items" :key="item.id" class="wh-big-card" @click="openDetail(item)" @longpress="showCardMenu(item)">
                <view class="wh-big-img-wrap">
                  <view v-if="item.image_url" class="wh-big-img" :style="{ backgroundImage: `url(${item.image_url})` }"></view>
                  <view v-else class="wh-big-ph" :style="{ background: getItemColorHex(item) }">
                    <text class="wh-big-ph-txt">{{ item.name[0] }}</text>
                  </view>
                </view>
                <view class="wh-big-info">
                  <text class="wh-big-name">{{ item.name }}</text>
                  <view class="wh-big-del" @click.stop="deleteItem(item.id)"><icon-svg name="trash"></icon-svg></view>
                </view>
              </view>
            </view>
          </view>
        </view>

        <view v-if="groupedWardrobe.length === 0" class="wh-empty">
          <icon-svg class="wh-empty-ico" name="package-x"></icon-svg>
          <text class="wh-empty-text">没有匹配的衣物</text>
        </view>

                <!-- 穿搭回顾已移至个人中心（profile panel），此处不再渲染 -->
      </view>

      <!-- 衣物详情 / 编辑弹窗 -->
      <view v-if="showDetail" class="mask" @click="closeDetail">
        <view class="wh-detail" @click.stop>
          <view class="wh-dlg-head">
            <text></text>
            <text class="wh-dlg-title">衣服详情</text>
            <text class="wh-dlg-close" @click="closeDetail">×</text>
          </view>
          <scroll-view scroll-y class="wh-detail-scroll">
            <view class="wh-detail-img-wrap">
              <view v-if="detailItem.image_url" class="wh-detail-img" :style="{ backgroundImage: `url(${detailItem.image_url})` }"></view>
              <view v-else class="wh-detail-ph" :style="{ background: getItemColorHex(detailItem) }">
                <text class="wh-detail-ph-txt">{{ (detailItem.name || '?')[0] }}</text>
              </view>
            </view>

            <view v-if="!detailEditing" class="wh-detail-fields">
              <view class="wh-df"><text class="wh-df-k">名称</text><text class="wh-df-v">{{ detailItem.name }}</text></view>
              <view class="wh-df"><text class="wh-df-k">品类</text><text class="wh-df-v">{{ catMap[detailItem.category] || detailItem.category }}</text></view>
              <view class="wh-df"><text class="wh-df-k">颜色</text><text class="wh-df-v">{{ detailItem.color || '—' }}</text></view>
              <view class="wh-df"><text class="wh-df-k">风格</text><text class="wh-df-v">{{ detailItem.style || '—' }}</text></view>
              <view class="wh-df"><text class="wh-df-k">材质</text><text class="wh-df-v">{{ detailItem.material || '—' }}</text></view>
              <view class="wh-df"><text class="wh-df-k">图案</text><text class="wh-df-v">{{ detailItem.pattern || '—' }}</text></view>
              <view class="wh-df"><text class="wh-df-k">季节</text><text class="wh-df-v">{{ detailItem.season || '—' }}</text></view>
              <view class="wh-df"><text class="wh-df-k">购入日期</text><text class="wh-df-v">{{ fmtDate(detailItem.purchase_date) || '—' }}</text></view>
              <view class="wh-df"><text class="wh-df-k">穿着次数</text><text class="wh-df-v">{{ wearDates.length }} 件</text></view>
              <view class="wh-df"><text class="wh-df-k">最近穿着</text><text class="wh-df-v">{{ wearDates.length ? fmtDate(wearDates[0]) : '从未记录' }}</text></view>
              <view class="wh-df wh-df-col">
                <text class="wh-df-k">穿着记录</text>
                <view class="wh-wear-dates" v-if="wearDates.length">
                  <view v-for="(d,i) in wearDates" :key="i" class="wh-wear-chip">
                    <text>{{ d }}</text>
                    <text class="wh-wear-del" @click="deleteWearDate(d)">×</text>
                  </view>
                </view>
                <text class="wh-df-v" v-else>暂无记录</text>
              </view>
            </view>

            <!-- 标签（来自线上 tags 表） -->
            <view v-if="!detailEditing" class="wh-df wh-df-col">
              <text class="wh-df-k">标签<text class="wh-df-edit" @click="openTagManager">管理</text></text>
              <view class="wh-tag-list" v-if="detailTags.length">
                <text v-for="(t,i) in detailTags" :key="i" class="wh-tag-chip">{{ t }}</text>
              </view>
              <text class="wh-df-v" v-else>暂无标签</text>
            </view>

            <!-- 标记穿过（可回溯历史日期，用于校正闲置天数） -->
            <view v-if="!detailEditing && showMarkWorn" class="wh-mark-worn">
              <text class="wh-mw-label">记录穿着日期</text>
              <picker class="wh-mw-picker" mode="date" :value="markWornDate" @change="e => markWornDate = e.detail.value">
                <text class="wh-mw-pick-val">{{ markWornDate }}</text>
              </picker>
              <view class="wh-mw-actions">
                <view class="wh-mw-btn cancel" @click="showMarkWorn=false">取消</view>
                <view class="wh-mw-btn save" @click="doMarkWorn">记录穿过</view>
              </view>
            </view>


            <view v-else class="wh-dlg-form">
              <view class="wh-dlg-row">
                <view class="wh-dlg-field">
                  <text class="wh-dlg-label">单品名称</text>
                  <input class="wh-dlg-input" :value="detailForm.name" placeholder="例：白色宽松印花T恤" @input="e => onDetailFormInput(e, 'name')" />
                </view>
                <view class="wh-dlg-field">
                  <text class="wh-dlg-label">品类</text>
                  <picker class="wh-dlg-picker" :range="catLabels" @change="onDetailCatChange">
                    <text :class="['wh-dlg-pick-val', { placeholder: !detailForm.category }]">{{ catMap[detailForm.category] || '请选择' }}</text>
                  </picker>
                </view>
              </view>
              <view class="wh-dlg-row">
                <view class="wh-dlg-field">
                  <text class="wh-dlg-label">颜色</text>
                  <input class="wh-dlg-input" :value="detailForm.color" placeholder="例：白色" @input="e => onDetailFormInput(e, 'color')" />
                </view>
                <view class="wh-dlg-field">
                  <text class="wh-dlg-label">风格</text>
                  <input class="wh-dlg-input" :value="detailForm.style" placeholder="例：简约" @input="e => onDetailFormInput(e, 'style')" />
                </view>
              </view>
              <view class="wh-dlg-row">
                <view class="wh-dlg-field">
                  <text class="wh-dlg-label">材质</text>
                  <input class="wh-dlg-input" :value="detailForm.material" placeholder="例：棉" @input="e => onDetailFormInput(e, 'material')" />
                </view>
                <view class="wh-dlg-field">
                  <text class="wh-dlg-label">图案</text>
                  <input class="wh-dlg-input" :value="detailForm.pattern" placeholder="例：条纹" @input="e => onDetailFormInput(e, 'pattern')" />
                </view>
              </view>
              <view class="wh-dlg-row">
                <view class="wh-dlg-field">
                  <text class="wh-dlg-label">季节</text>
                  <input class="wh-dlg-input" :value="detailForm.season" placeholder="例：四季" @input="e => onDetailFormInput(e, 'season')" />
                </view>
                <view class="wh-dlg-field">
                  <text class="wh-dlg-label">购入日期</text>
                  <picker class="wh-dlg-picker" mode="date" :value="detailForm.purchase_date" @change="onDetailPurchaseDateChange">
                    <text :class="['wh-dlg-pick-val', { placeholder: !detailForm.purchase_date }]">{{ detailForm.purchase_date || '购入日期' }}</text>
                  </picker>
                </view>
              </view>
            </view>
          </scroll-view>

          <view class="wh-dlg-foot">
            <template v-if="!detailEditing">
              <view class="wh-dlg-btn ghost" @click="openMarkWorn"><icon-svg name="hanger"></icon-svg> 标记穿过</view>
              <view class="wh-dlg-btn warn" @click="openItemCorrection"><icon-svg name="warning"></icon-svg> 纠错</view>
              <view class="wh-dlg-btn cancel" @click="deleteItem(detailItem.id)"><icon-svg name="trash"></icon-svg> 删除</view>
              <view class="wh-dlg-btn save" @click="startEdit"><icon-svg name="edit"></icon-svg> 编辑</view>
            </template>
            <template v-else>
              <view class="wh-dlg-btn cancel" @click="cancelEdit">取消</view>
              <view class="wh-dlg-btn save" @click="saveDetail">保存</view>
            </template>
          </view>
        </view>
      </view>

      <!-- 传图能力已合并进「对话」：对话输入框左边的  按钮可发图让 AI 分析搭配 -->

      <!-- ===== 5.5 自主搭配 + AI 审核 ===== -->
      <view v-show="currentView==='outfit'" class="panel">
        <view class="panel-head between">
          <view class="head-left">
            <text class="back-btn" @click="switchView('today')">‹ 返回</text>
            <text class="panel-title">我的搭配</text>
          </view>
          <text class="panel-sub">从衣橱挑几件，让搭配师帮你审核</text>
        </view>

        <!-- 衣橱多选区 -->
        <view class="grid">
          <view v-for="item in wardrobe" :key="item.id"
                :class="['card', 'pick', { picked: isSelected(item.id) }]" @click="toggleSelect(item.id)">
            <view class="card-img">
              <image v-if="item.image_url" :src="item.image_url" mode="aspectFill" class="full-img" />
              <view v-else class="ph" :style="{background:item.color||'#EEF2FF'}"><text>{{ item.name[0] }}</text></view>
            </view>
            <view class="card-info">
              <text class="card-name">{{ item.name }}</text>
              <view class="tags">
                <text class="tag">{{ catMap[item.category] || item.category }}</text>
                <text class="tag ok">{{ item.color }}</text>
                <text v-if="item.season" class="tag">{{ item.season }}</text>
              </view>
            </view>
            <view v-if="isSelected(item.id)" class="pick-badge">✓</view>
          </view>
          <view v-if="wardrobe.length===0" class="empty"><text>衣橱空空，先去添加衣服</text></view>
        </view>

        <!-- 审核结果 -->
        <view v-if="reviewResult" class="review-card">
          <view class="review-top">
            <view class="score-ring" :style="{ background: outfitScoreRing }">
              <text class="score-num">{{ reviewResult.score != null ? reviewResult.score : '—' }}</text>
              <text class="score-cap">/10</text>
            </view>
            <view class="review-verdict">
              <text class="rv-label">审核结论</text>
              <text class="rv-tag" :style="{ background: outfitScoreColor }">{{ reviewResult.verdict || '已点评' }}</text>
            </view>
          </view>
          <image v-if="reviewResult.image_url" :src="reviewResult.image_url" mode="widthFix" class="review-img" />

          <!-- 本次审核的搭配单品 -->
          <view class="rv-block">
            <text class="rv-h"> 搭配单品</text>
            <view class="closet-items" style="padding: 0;">
              <view v-for="item in selectedReviewItems" :key="item.id" class="closet-item" @click="openDetail(item)">
                <view class="closet-item-img-wrap">
                  <view v-if="item.image_url" class="closet-item-img" :style="{ backgroundImage: `url(${item.image_url})` }"></view>
                  <view v-else class="closet-item-ph" :style="{ background: getItemColorHex(item) }">
                    <text class="closet-item-ph-txt">{{ (item.name || '?')[0] }}</text>
                  </view>
                </view>
                <view class="closet-item-body">
                  <text class="closet-item-name">{{ item.name || '未知衣物' }}</text>
                  <view class="closet-item-tags">
                    <text class="closet-item-tag cat">{{ catMap[item.category] || item.category || '—' }}</text>
                    <text v-if="item.color" class="closet-item-tag">{{ item.color }}</text>
                    <text v-if="item.season" class="closet-item-tag">{{ item.season }}</text>
                  </view>
                </view>
              </view>
            </view>
          </view>

          <view class="rv-block"><text class="rv-h"> 色彩协调</text><rich-text class="rv-c" :nodes="md2html(reviewResult.color_comment || reviewResult.raw)"></rich-text></view>
          <view class="rv-block"><text class="rv-h"> 季节合适度</text><rich-text class="rv-c" :nodes="md2html(reviewResult.season_comment)"></rich-text></view>
          <view class="rv-block"><text class="rv-h"> 场合得体性</text><rich-text class="rv-c" :nodes="md2html(reviewResult.occasion_comment)"></rich-text></view>
          <view class="rv-block"><text class="rv-h"> 完整性</text><rich-text class="rv-c" :nodes="md2html(reviewResult.completeness_comment)"></rich-text></view>
          <view v-if="reviewResult.suggestions && reviewResult.suggestions.length" class="rv-block">
            <text class="rv-h"> 改进建议</text>
            <text v-for="(s,i) in reviewResult.suggestions" :key="i" class="sug">{{ (i+1) }}. {{ s }}</text>
          </view>
        </view>

        <!-- 底部状态条：显示已选件数与审核状态）-->
        <view class="outfit-bar">
          <text class="ob-count">
            已选<text class="ob-num">{{ selectedIds.length }}</text> 件
            <text v-if="reviewLoading" class="ob-status"> · 审核中…</text>
            <text v-else-if="selectedIds.length < 2" class="ob-status"> · 再选一件即可审核</text>
          </text>
          <view class="ob-actions">
            <text v-if="selectedIds.length > 0" class="ob-clear" @click="clearSelection">清空</text>
            <view v-if="selectedIds.length > 0" class="ob-wear-btn" @click="confirmWearSelected">确认今日穿着</view>
          </view>
        </view>
      </view>

      <!-- ===== 我的套装独立 view（与 AI 搭配审核 outfit view 分离） ===== -->
      <view v-show="currentView==='closet'" class="panel closet-panel">
        <view class="panel-head closet-head">
          <view class="head-back" @click="switchView('profile')">
            <icon-svg name="chevron-left" :size="32"></icon-svg>
          </view>
          <text class="panel-title">我的套装</text>
          <view class="head-right-spacer"></view>
        </view>

        <view class="closet-section">
          <view class="closet-head-row">
            <text class="closet-title">已存套装</text>
            <text class="closet-count">{{ outfits.length }} 套</text>
            <view class="closet-add" @click="showOutfitForm = !showOutfitForm">{{ showOutfitForm ? '收起' : '＋ 新建' }}</view>
          </view>

          <!-- 新建表单 -->
          <view v-if="showOutfitForm" class="closet-create">
            <input class="closet-name-input" v-model="outfitForm.name" placeholder="套装名称，如：周一通勤装" />
            <scroll-view scroll-y class="closet-pick">
              <view class="closet-pick-grid">
                <view v-for="it in wardrobe" :key="it.id"
                      :class="['closet-pick-item', { sel: outfitForm.item_ids.includes(it.id) }]"
                      @click="toggleOutfitItem(it.id)">
                  <image v-if="it.image_url" :src="it.image_url" mode="aspectFill" class="closet-pi-img" />
                  <view v-else class="closet-pi-ph" :style="{ background: getItemColorHex(it) }">{{ (it.name || '?')[0] }}</view>
                  <view class="closet-pi-name">{{ it.name }}</view>
                  <view class="closet-pi-tick">{{ outfitForm.item_ids.includes(it.id) ? '✓' : '' }}</view>
                </view>
              </view>
            </scroll-view>
            <view class="closet-actions">
              <view class="wh-dlg-btn cancel" @click="showOutfitForm = false">取消</view>
              <view class="wh-dlg-btn save" @click="createOutfit">保存套装</view>
            </view>
          </view>

          <!-- 套装列表 -->
          <view v-if="outfits.length" class="closet-list">
            <view v-for="o in outfits" :key="o.id" class="closet-card">
              <view class="closet-card-head">
                <view class="closet-name-wrap">
                  <text class="closet-card-name">{{ o.name }}</text>
                  <text class="closet-card-count">{{ o.item_ids.length }} 件</text>
                </view>
                <view class="closet-del" @click.stop="deleteOutfit(o.id)"><icon-svg name="trash"></icon-svg></view>
              </view>
              <view class="closet-items">
                <view v-for="id in o.item_ids" :key="id" class="closet-item" @click="openDetail(wardrobeMap[id] || { id })">
                  <view class="closet-item-img-wrap">
                    <view v-if="wardrobeMap[id] && wardrobeMap[id].image_url" class="closet-item-img" :style="{ backgroundImage: `url(${wardrobeMap[id].image_url})` }"></view>
                    <view v-else class="closet-item-ph" :style="{ background: getItemColorHex(wardrobeMap[id]) }">
                      <text class="closet-item-ph-txt">{{ (wardrobeMap[id] && wardrobeMap[id].name ? wardrobeMap[id].name[0] : '?') }}</text>
                    </view>
                  </view>
                  <view class="closet-item-body">
                    <text class="closet-item-name">{{ (wardrobeMap[id] && wardrobeMap[id].name) || '未知衣物' }}</text>
                    <view class="closet-item-tags">
                      <text class="closet-item-tag cat">{{ (wardrobeMap[id] && catMap[wardrobeMap[id].category]) || (wardrobeMap[id] && wardrobeMap[id].category) || '—' }}</text>
                      <text v-if="wardrobeMap[id] && wardrobeMap[id].color" class="closet-item-tag">{{ wardrobeMap[id].color }}</text>
                      <text v-if="wardrobeMap[id] && wardrobeMap[id].season" class="closet-item-tag">{{ wardrobeMap[id].season }}</text>
                    </view>
                  </view>
                </view>
              </view>
            </view>
          </view>
          <view v-else class="closet-empty">
            <icon-svg class="closet-empty-ico" name="package-x"></icon-svg>
            <text class="closet-empty-text">还没有套装，点「＋ 新建」把常穿的组合存起来</text>
          </view>
        </view>
      </view>

      <!-- ===== 6. 衣橱分析 ===== -->
      <view v-show="currentView==='analysis'" class="panel analysis-panel">
        <view class="panel-head between">
          <text class="panel-title">衣橱分析</text>
          <view class="mini-btn" @click="fetchAnalysis">刷新</view>
        </view>
        <view v-if="analysis" class="card-box analysis-wrap">
          <!-- 购物建议（合并自购物清单）-->
          <view class="block" v-if="shoppingList&&shoppingList.suggestions&&shoppingList.suggestions.length">
            <text class="block-title">购物建议</text>
            <view v-for="(s,i) in shoppingList.suggestions" :key="i" class="card-box shop">
              <view class="shop-row">
                <text :class="['tag', tagClass(s.category)]">{{ catMap[s.category]||s.category }}</text>
                <text class="shop-reason">{{ s.reason }}</text>
              </view>
            </view>
          </view>
          <view class="block" v-else>
            <text class="block-title">购物建议</text>
            <text class="empty-tip">你的衣橱品类齐全，暂无购物建议</text>
          </view>

          <!-- 品类分布 -->
          <view class="block">
            <text class="block-title">品类分布</text>
            <view class="donut-row" v-if="categoryChart.items.length">
              <view class="donut" :style="{ background: categoryChart.gradient }">
                <view class="donut-hole">
                  <text class="donut-num">{{ categoryChart.total }}</text>
                  <text class="donut-unit">件</text>
                </view>
              </view>
              <view class="legend">
                <view v-for="it in categoryChart.items" :key="it.raw" class="legend-item">
                  <text class="legend-name">{{ it.name }}</text>
                  <view class="legend-track">
                    <view class="legend-fill" :style="{ width: it.pct + '%', background: it.color }"></view>
                  </view>
                  <text class="legend-val">{{ it.value }}·{{ it.pct }}%</text>
                </view>
              </view>
            </view>
            <text v-else class="empty-tip">暂无数据</text>
          </view>

          <!-- 季节分布 -->
          <view class="block" v-if="seasonChart.length">
            <text class="block-title">季节分布</text>
            <view class="stack-bar">
              <view v-for="s in seasonChart" :key="s.name" class="stack-seg" :style="{ width: s.pct + '%', background: s.color }"></view>
            </view>
            <view class="stack-legend">
              <view v-for="s in seasonChart" :key="s.name" class="stack-leg">
                <view class="legend-dot" :style="{ background: s.color }"></view>
                <text class="stack-leg-t">{{ s.name }} · {{ s.value }}</text>
              </view>
            </view>
          </view>

          <!-- 颜色分布 -->
          <view class="block" v-if="colorList.length">
            <text class="block-title">颜色分布</text>
            <view class="color-wrap">
              <view v-for="c in colorList" :key="c.name" class="color-chip">
                <view class="color-dot" :style="{ background: c.hex, borderColor: c.hex === '#F4F4F5' ? '#F4F4F5' : c.hex }"></view>
                <text class="color-name">{{ c.name }}</text>
                <text class="color-cnt">{{ c.value }}</text>
              </view>
            </view>
          </view>

          <!-- 闲置提醒 -->
          <view class="block">
            <text class="block-title">闲置提醒</text>
            <view v-if="analysis.unused_items&&analysis.unused_items.length" class="tag-list">
              <text v-for="item in analysis.unused_items" :key="item.id" class="tag warn">{{ item.name }}（超90天）</text>
            </view>
            <text v-else class="empty-tip">暂无闲置，保持得很好</text>
          </view>

          <!-- 重复购买 -->
          <view class="block">
            <text class="block-title">重复购买提醒</text>
            <view v-if="analysis.duplicate_warnings&&analysis.duplicate_warnings.length" class="tag-list">
              <text v-for="d in analysis.duplicate_warnings" :key="d.name" class="tag danger">{{ d.name }} × {{ d.count }}</text>
            </view>
            <text v-else class="empty-tip">无重复购买</text>
          </view>

          <!-- 智能建议 -->
          <view class="block" v-if="analysis.suggestions&&analysis.suggestions.length">
            <text class="block-title">智能建议</text>
            <view class="sug-list">
              <view v-for="(s,i) in analysis.suggestions" :key="i" class="sug-item">
                <text class="sug-bullet">•</text>
                <text class="sug-text">{{ s }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 对话历史已合并进对话界面的左侧抽屉，见底部 history-drawer -->

      <!-- ===== 个人中心：冷色渐变 hero + 三列数据 + 线性菜单（已精简：去 Level / 去 Top Up） ===== -->
      <view v-show="currentView==='profile'" class="panel profile-panel">
        <!-- 顶部 hero：浅蓝 → 米色 横线渐变 + 头像 -->
        <view class="me-hero">
          <view class="me-hero-bg"></view>
          <view class="me-hero-statusbar"></view>
          <view class="me-hero-content">
            <view class="me-hero-info">
              <text class="me-name-lg">{{ profile.nickname || '穿搭用户' }}</text>
            </view>
            <view class="me-avatar-lg">
              <image v-if="profile.avatar_url" :src="profile.avatar_url" mode="aspectFill" class="me-avatar-img" />
              <text v-else class="me-avatar-text">{{ profile.nickname ? profile.nickname[0] : 'U' }}</text>
            </view>
          </view>
        </view>

        <!-- 三列数据：衣橱 / 搭配 / 未读（彩色圆点） -->
        <view class="me-stats-card">
          <view class="me-stat me-stat-clickable" @click="goWardrobe">
            <view class="me-stat-row">
              <text class="me-stat-num">{{ wardrobe.length || 0 }}</text>
              <view class="me-stat-dot me-stat-blue"></view>
            </view>
            <view class="me-stat-label-row">
              <text class="me-stat-label">单品</text>
              <icon-svg class="me-stat-chev" name="chevron-right" :size="18"></icon-svg>
            </view>
          </view>
          <view class="me-stat-div"></view>
          <view class="me-stat me-stat-clickable" @click="switchView('closet')">
            <view class="me-stat-row">
              <text class="me-stat-num">{{ outfits.length || 0 }}</text>
              <view class="me-stat-dot me-stat-pink"></view>
            </view>
            <view class="me-stat-label-row">
              <text class="me-stat-label">搭配</text>
              <icon-svg class="me-stat-chev" name="chevron-right" :size="18"></icon-svg>
            </view>
          </view>
          <view class="me-stat-div"></view>
          <view class="me-stat me-stat-clickable" @click="switchView('notify')">
            <view class="me-stat-row">
              <text class="me-stat-num">{{ unreadCount || 0 }}</text>
              <view class="me-stat-dot me-stat-amber"></view>
            </view>
            <view class="me-stat-label-row">
              <text class="me-stat-label">未读</text>
              <icon-svg class="me-stat-chev" name="chevron-right" :size="18"></icon-svg>
            </view>
          </view>
        </view>

        <!-- 菜单：我的衣橱 / 我的套装 / 穿搭回顾 / 通知中心 / 身形资料 -->
        <view class="me-menu-card">
          <view class="me-menu-row" @click="goWardrobe">
            <icon-svg class="me-menu-ico" name="shirt" :size="22"></icon-svg>
            <text class="me-menu-label">我的衣橱</text>
            <text class="me-menu-chev">›</text>
          </view>
          <view class="me-menu-div"></view>
          <view class="me-menu-row" @click="switchView('closet')">
            <icon-svg class="me-menu-ico" name="layers" :size="22"></icon-svg>
            <text class="me-menu-label">我的套装</text>
            <text class="me-menu-chev">›</text>
          </view>
          <view class="me-menu-div"></view>
          <view class="me-menu-row" @click="switchView('lookback')">
            <icon-svg class="me-menu-ico" name="history" :size="22"></icon-svg>
            <text class="me-menu-label">穿搭回顾</text>
            <text class="me-menu-chev">›</text>
          </view>
          <view class="me-menu-div"></view>
          <view class="me-menu-row" @click="openProfileEdit">
            <icon-svg class="me-menu-ico" name="id-card" :size="22"></icon-svg>
            <text class="me-menu-label">身形资料</text>
            <text class="me-menu-chev">›</text>
          </view>
        </view>

        <!-- 退出登录（小字灰色辅助） -->
        <view class="me-logout-row" @click="logout">
          <text class="me-logout-text">退出登录</text>
        </view>
      </view>

      <!-- ===== 穿搭回顾独立面板：选某天看穿了什么 ===== -->
      <view v-show="currentView==='lookback'" class="panel lookback-panel">
        <view class="panel-head lookback-head">
          <view class="head-back" @click="switchView('profile')">
            <icon-svg name="chevron-left" :size="32"></icon-svg>
          </view>
          <text class="panel-title">穿搭回顾</text>
          <view class="head-right-spacer"></view>
        </view>
        <view class="lookback-card">
          <text class="lookback-tip">选一个日期，看看那天穿了什么</text>
          <picker class="lookback-picker" mode="date" :value="lookupDate" @change="onLookupDateChange">
            <text class="lookback-pick-val">{{ lookupDate || '选择日期' }}</text>
          </picker>
          <view v-if="dayItems.length" class="lookback-items">
            <view v-for="it in dayItems" :key="it.id" class="lookback-chip" @click="openDetail(it)">
              <text>{{ it.name }}</text>
            </view>
          </view>
          <text v-else-if="lookupDate" class="lookback-empty">这一天还没记录穿过任何衣服</text>
          <text v-else class="lookback-empty">先选个日期吧</text>
        </view>
      </view>

    </scroll-view>

    <!-- 通知抽屉（顶栏铃铛 / 底部通知 Tab 均打开此处，不再全屏） -->
    <view v-show="showNotifyDrawer" class="drawer-wrap">
      <view :class="['drawer-mask', { open: drawerNotifyOpened }]" @click="closeNotifyDrawer"></view>
      <view :class="['notify-drawer', { open: drawerNotifyOpened }]">
        <view class="drawer-head">
          <text class="drawer-title">通知中心</text>
          <view class="drawer-new" @click="markAllRead">全部已读</view>
        </view>
        <scroll-view class="drawer-list" scroll-y>
          <view v-for="n in notifications" :key="n.id" :class="['drawer-noti', {unread: !n.is_read}, 't-' + n.type]" @click="onNotiClick(n)">
            <view class="noti-top">
              <text :class="['noti-tag', 't-' + n.type]">{{ notiTypeLabel(n.type) }}</text>
              <text class="noti-time">{{ fmtShortTime(n.created_at) }}</text>
            </view>
            <text class="noti-title">{{ n.title }}</text>
            <text class="noti-content">{{ n.content }}</text>
            <image v-if="n.image_url" :src="n.image_url" mode="widthFix" class="noti-img" />
          </view>
          <view v-if="!notifyLoading && notifications.length===0" class="drawer-empty"><text>暂无通知</text></view>
        </scroll-view>
      </view>
    </view>

    <!-- 历史侧边抽屉（与对话合并：点  打开，点遮罩/抽屉外收起） -->
    <view v-show="showHistoryDrawer" class="drawer-wrap">
      <view :class="['drawer-mask', { open: drawerOpened }]" @click="closeHistoryDrawer"></view>
      <view :class="['history-drawer', { open: drawerOpened }]">
        <view class="drawer-head">
          <text class="drawer-title">对话历史</text>
          <view class="drawer-new" @click="newChat">＋ 新建</view>
        </view>
        <scroll-view class="drawer-list" scroll-y>
          <view v-for="conv in conversations" :key="conv.id" class="drawer-item">
            <view class="di-main" @click="openHistoryChatById(conv.id)">
              <text class="di-q">{{ firstQuestion(conv) }}<text v-if="conv.turn_count > 1" class="di-turn">{{ conv.turn_count }}轮对话</text></text>
              <text v-if="conv._time" class="di-time">{{ conv._time }} · 点击查看详情</text>
            </view>
            <view class="di-del" @click.stop="deleteConversation(conv.id)"><icon-svg name="trash"></icon-svg></view>
          </view>
          <view v-if="conversations.length === 0" class="drawer-empty"><text>暂无对话记录</text></view>
        </scroll-view>
      </view>
    </view>

    <!-- 底部导航 -->
    <view class="bottom-nav">
      <view v-for="item in navItems" :key="item.key"
            :class="['nav-item',{active: currentView===item.key}]" @click="switchView(item.key)">
        <view class="nav-ico-wrap">
          <icon-svg class="nav-icon" :name="item.icon"></icon-svg>
          <text v-if="item.key==='notify' && unreadCount>0" class="badge">{{ unreadCount>99?'99+':unreadCount }}</text>
        </view>
        <text class="nav-label">{{ item.label }}</text>
      </view>
    </view>

    <!-- 上传弹窗（DPSTAR 风格）-->
    <view v-if="showUpload" class="mask" @click="closeUpload">
      <view class="wh-upload-dialog" @click.stop>
        <!-- 头部 -->
        <view class="wh-dlg-head">
          <text class="wh-dlg-back" @click="closeUpload"><icon-svg name="chevron-left" :size="22"></icon-svg> 返回</text>
          <text class="wh-dlg-title">记录新的衣服</text>
          <text class="wh-dlg-close" @click="closeUpload">×</text>
        </view>

        <!-- 上传区（主按钮：图标在上文字在下） -->
        <view class="wh-dlg-up-area" @click="chooseWardrobeImage">
          <view class="wh-dlg-up-ico"><icon-svg name="camera" :size="48"></icon-svg></view>
          <text class="wh-dlg-up-txt">上传 / 替换照片</text>
        </view>

        <!-- 批量上传入口（次按钮：淡薰衣草系） -->
        <view class="wh-dlg-batch" @click="chooseBatchImages">
          <view class="wh-dlg-batch-ico"><icon-svg name="image" :size="28"></icon-svg></view>
          <text class="wh-dlg-batch-txt">批量上传照片（上限10张）</text>
        </view>

        <!-- 预览 + 表单 -->
        <view v-if="uploadPreview" class="wh-dlg-body">
          <!-- 当前单品图 -->
          <view class="wh-dlg-preview">
            <image :src="uploadPreview" mode="aspectFit" class="wh-dlg-preview-img" />
            <view v-if="uploadDetecting" class="wh-dlg-detect"><text>AI 自动识别中...</text></view>
          </view>
          <text class="wh-dlg-preview-tip">修改时会保留原图片，重新上传可替换。</text>

          <!-- 双列表单 -->
          <view v-if="uploadPreview && !uploadDetecting" class="wh-dlg-form">
            <view class="wh-dlg-row">
              <view class="wh-dlg-field">
                <text class="wh-dlg-label">单品名称</text>
                <input class="wh-dlg-input" :value="uploadForm.name" placeholder="例：白色宽松印花T恤"
                       @input="e => onFormInput(e, 'name')" />
              </view>
              <view class="wh-dlg-field">
                <text class="wh-dlg-label">品类</text>
                <picker class="wh-dlg-picker" :range="catLabels" @change="onCatChange">
                  <text :class="['wh-dlg-pick-val', { placeholder: !uploadForm.category }]">{{ catMap[uploadForm.category] || '请选择' }}</text>
                </picker>
              </view>
            </view>
            <view class="wh-dlg-row">
              <view class="wh-dlg-field">
                <text class="wh-dlg-label">颜色</text>
                <input class="wh-dlg-input" :value="uploadForm.color" placeholder="例：白色"
                       @input="e => onFormInput(e, 'color')" />
              </view>
              <view class="wh-dlg-field">
                <text class="wh-dlg-label">风格</text>
                <input class="wh-dlg-input" :value="uploadForm.style" placeholder="例：简约"
                       @input="e => onFormInput(e, 'style')" />
              </view>
            </view>
            <view class="wh-dlg-row">
              <view class="wh-dlg-field">
                <text class="wh-dlg-label">材质</text>
                <input class="wh-dlg-input" :value="uploadForm.material" placeholder="例：棉"
                       @input="e => onFormInput(e, 'material')" />
              </view>
              <view class="wh-dlg-field">
                <text class="wh-dlg-label">图案</text>
                <input class="wh-dlg-input" :value="uploadForm.pattern" placeholder="例：条纹/纯色"
                       @input="e => onFormInput(e, 'pattern')" />
              </view>
            </view>
            <view class="wh-dlg-row">
              <view class="wh-dlg-field">
                <text class="wh-dlg-label">季节</text>
                <input class="wh-dlg-input" :value="uploadForm.season" placeholder="例：四季"
                       @input="e => onFormInput(e, 'season')" />
              </view>
              <view class="wh-dlg-field">
                <text class="wh-dlg-label">购入日期</text>
                <picker class="wh-dlg-picker" mode="date" :value="purchaseDate" @change="onPurchaseDateChange">
                  <text :class="['wh-dlg-pick-val', { placeholder: !purchaseDate }]">{{ purchaseDate || '选择日期' }}</text>
                </picker>
              </view>
            </view>
          </view>

          <!-- 底部按钮 -->
          <view class="wh-dlg-foot">
            <view class="wh-dlg-btn cancel" @click="closeUpload">取消</view>
            <view class="wh-dlg-btn save" :class="{ disabled: !uploadPreview }" @click="confirmUpload">保存这件衣服</view>
          </view>
        </view>
      </view>
    </view>
  </view>

  <!-- 批量导入编辑弹窗 -->
  <view v-if="showBatchEdit" class="mask" @click="closeBatchEdit">
    <view class="wh-batch-dialog" @click.stop>
      <view class="wh-dlg-head">
        <text class="wh-dlg-title">批量确认（{{ batchEditIndex + 1 }} / {{ batchEditList.length }}）</text>
        <text class="wh-dlg-back" @click="closeBatchEdit">返回</text>
      </view>
      <view v-if="batchEditList[batchEditIndex]" class="wh-batch-body">
        <view class="wh-batch-img-wrap">
          <view class="wh-batch-img" :style="{ backgroundImage: `url(${batchEditList[batchEditIndex].image_url})` }"></view>
        </view>
        <view class="wh-dlg-form">
          <view class="wh-dlg-row">
            <view class="wh-dlg-field">
              <text class="wh-dlg-label">单品名称</text>
              <input class="wh-dlg-input" :value="batchEditList[batchEditIndex].name" placeholder="例：白色宽松印花T恤"
                     @input="e => onBatchFormInput(e, 'name')" />
            </view>
            <view class="wh-dlg-field">
              <text class="wh-dlg-label">品类</text>
              <picker class="wh-dlg-picker" :range="catLabels" @change="onBatchCatChange">
                <text :class="['wh-dlg-pick-val', { placeholder: !batchEditList[batchEditIndex].category }]">{{ catMap[batchEditList[batchEditIndex].category] || '请选择' }}</text>
              </picker>
            </view>
          </view>
          <view class="wh-dlg-row">
            <view class="wh-dlg-field">
              <text class="wh-dlg-label">颜色</text>
              <input class="wh-dlg-input" :value="batchEditList[batchEditIndex].color" placeholder="例：白色"
                     @input="e => onBatchFormInput(e, 'color')" />
            </view>
            <view class="wh-dlg-field">
              <text class="wh-dlg-label">风格</text>
              <input class="wh-dlg-input" :value="batchEditList[batchEditIndex].style" placeholder="例：简约"
                     @input="e => onBatchFormInput(e, 'style')" />
            </view>
          </view>
          <view class="wh-dlg-row">
            <view class="wh-dlg-field">
              <text class="wh-dlg-label">材质</text>
              <input class="wh-dlg-input" :value="batchEditList[batchEditIndex].material" placeholder="例：棉"
                     @input="e => onBatchFormInput(e, 'material')" />
            </view>
            <view class="wh-dlg-field">
              <text class="wh-dlg-label">图案</text>
              <input class="wh-dlg-input" :value="batchEditList[batchEditIndex].pattern" placeholder="例：纯色"
                     @input="e => onBatchFormInput(e, 'pattern')" />
            </view>
          </view>
          <view class="wh-dlg-row">
            <view class="wh-dlg-field">
              <text class="wh-dlg-label">季节</text>
              <input class="wh-dlg-input" :value="batchEditList[batchEditIndex].season" placeholder="例：四季"
                     @input="e => onBatchFormInput(e, 'season')" />
            </view>
            <view class="wh-dlg-field">
              <text class="wh-dlg-label">购入日期</text>
              <picker class="wh-dlg-picker" mode="date" :value="batchEditList[batchEditIndex].purchase_date" @change="onBatchPurchaseDateChange">
                <text :class="['wh-dlg-pick-val', { placeholder: !batchEditList[batchEditIndex].purchase_date }]">{{ batchEditList[batchEditIndex].purchase_date || '选择日期' }}</text>
              </picker>
            </view>
          </view>
        </view>
      </view>
      <view class="wh-batch-foot two-row">
        <view class="wh-batch-foot-row">
          <view class="wh-dlg-btn cancel flex1" :class="{ disabled: batchEditIndex === 0 }" @click="prevBatchItem">上一件</view>
          <view class="wh-dlg-btn save flex1" @click="skipBatchItem">跳过这件</view>
          <view class="wh-dlg-btn cancel flex1" :class="{ disabled: batchEditIndex === batchEditList.length - 1 }" @click="nextBatchItem">下一件</view>
        </view>
        <view class="wh-batch-foot-row">
          <view class="wh-dlg-btn primary flex1" @click="saveSingleBatchItem">保存这件</view>
          <view class="wh-dlg-btn primary flex1" @click="confirmBatchEdit">保存全部</view>
        </view>
      </view>
    </view>
  </view>

    <!-- 城市选择弹层（定位失败/不准时手动选，持久化记忆）-->
    <view v-if="cityPickerVisible" class="mask" @click="cityPickerVisible = false">
      <view class="city-picker" @click.stop>
        <view class="cp-head">
          <text class="cp-title">选择城市</text>
          <view class="cp-close" @click="cityPickerVisible = false"><icon-svg name="close"></icon-svg></view>
        </view>
        <text class="cp-tip">定位失败或城市不准？手动选择你的城市，下次自动记住</text>
        <scroll-view scroll-y class="cp-list">
          <view class="cp-grid">
            <view v-for="c in CITIES" :key="c.name" class="cp-item" :class="{ active: c.name === weather.city }" @click="selectCity(c)">{{ c.name }}</view>
            <view class="cp-item loc" @click="reLocate"><icon-svg name="location"></icon-svg> 重新定位</view>
          </view>
        </scroll-view>
      </view>
    </view>

    <!-- 单品纠错弹窗（用户上报 AI 识别错误）-->
    <view v-if="itemCorrVisible" class="mask" @click="itemCorrVisible = false">
      <view class="ic-dialog" @click.stop>
        <view class="ic-head">
          <text class="ic-title">纠错 · {{ itemCorrItem ? itemCorrItem.name : '' }}</text>
          <view class="ic-close" @click="itemCorrVisible = false"><icon-svg name="close"></icon-svg></view>
        </view>
        <view class="ic-body">
          <text class="ic-tip">AI 识别可能有误，勾选认错的字段并填写正确值，提交后由搭配师审核修正。</text>
          <view class="ic-fields">
            <view v-for="f in itemCorrFields" :key="f.k"
                  :class="['ic-chip', { on: itemCorrSel.includes(f.k) }]"
                  @click="toggleItemCorrField(f.k)">
              <text>{{ f.l }}</text>
            </view>
          </view>
          <view v-for="f in itemCorrFields.filter(x => itemCorrSel.includes(x.k))" :key="f.k" class="ic-row">
            <text class="ic-row-label">{{ f.l }}（正确值）</text>
            <input class="ic-input" :value="itemCorrVals[f.k]" :placeholder="f.ph"
                   @input="e => onItemCorrInput(e, f.k)" />
          </view>
          <view class="ic-row">
            <text class="ic-row-label">补充说明（选填）</text>
            <input class="ic-input" :value="itemCorrNote" placeholder="如：标签写的是连衣裙其实是上衣"
                   @input="onItemCorrNote" />
          </view>
        </view>
        <view class="ic-foot">
          <view class="wh-dlg-btn cancel" @click="itemCorrVisible = false">取消</view>
          <view class="wh-dlg-btn save" @click="submitItemCorrection">提交纠错</view>
        </view>
      </view>
    </view>

    <!-- 单品标签管理弹窗（用户从线上 tags 表给单品打标签）-->
    <view v-if="tagManagerVisible" class="mask" @click="tagManagerVisible = false">
      <view class="tm-dialog" @click.stop>
        <view class="ic-head">
          <text class="ic-title">管理标签 · {{ itemCorrItem ? itemCorrItem.name : (detailItem ? detailItem.name : '') }}</text>
          <view class="ic-close" @click="tagManagerVisible = false"><icon-svg name="close"></icon-svg></view>
        </view>
        <view class="tm-body">
          <text class="ic-tip">勾选标签，保存到这件衣服上（标签来自搭配师维护的标签库）。</text>
          <view v-if="allUserTags.length" class="ic-fields">
            <view v-for="t in allUserTags" :key="t.id"
                  :class="['ic-chip', { on: tagManagerSel.includes(t.name) }]"
                  @click="toggleUserTag(t.name)">
              <text>{{ t.name }}</text>
            </view>
          </view>
          <text v-else class="ic-tip">标签库还是空的，请先到搭配师端「标签管理」添加标签。</text>
        </view>
        <view class="ic-foot">
          <view class="wh-dlg-btn cancel" @click="tagManagerVisible = false">取消</view>
          <view class="wh-dlg-btn save" @click="saveItemTags">保存标签</view>
        </view>
      </view>
    </view>

    <!-- 个人资料编辑弹窗（供 get_user_profile 工具使用，让 AI 推荐贴合本人）-->
    <view v-if="profileEditVisible" class="mask" @click="profileEditVisible = false">
      <view class="pf-dialog" @click.stop>
        <view class="pf-head">
          <text class="pf-title">个人资料</text>
          <view class="pf-close" @click="profileEditVisible = false"><icon-svg name="close" :size="22"></icon-svg></view>
        </view>
        <text class="pf-sub">填写后，AI 推荐会参考你的身材、肤色与风格偏好；下方数值留空即不填。</text>
        <view class="pf-body">
          <view class="pf-row">
            <text class="pf-label">昵称</text>
            <input class="pf-input" v-model="profileForm.nickname" placeholder="如：小瓷" />
          </view>
          <view class="pf-row">
            <text class="pf-label">城市</text>
            <picker class="pf-input pf-city" mode="multiSelector"
                    :range="[cityProvinceNames, cityNamesAt, cityDistrictNames]"
                    :value="cityIndex"
                    @columnchange="onCityColumnChange">
              <text class="pf-city-text">{{ cityFullText || '请选择 省 / 市 / 区' }}</text>
            </picker>
          </view>

          <view class="pf-row pf-row-2">
            <view class="pf-col">
              <text class="pf-label">身高 (cm)</text>
              <input class="pf-input" type="text" v-model="profileForm.height" placeholder="如：172" />
            </view>
            <view class="pf-col">
              <text class="pf-label">体重 (kg)</text>
              <input class="pf-input" type="text" v-model="profileForm.weight" placeholder="如：65" />
            </view>
          </view>

          <view class="pf-row">
            <text class="pf-label">肤色</text>
            <view class="pf-chips">
              <view v-for="s in SKIN_TONES" :key="s" :class="['pf-chip', { on: profileForm.skin_tone === s }]"
                    @click="profileForm.skin_tone = s">{{ s }}</view>
            </view>
          </view>

          <view class="pf-row">
            <text class="pf-label">体型</text>
            <view class="pf-chips">
              <view v-for="b in BODY_TYPES" :key="b" :class="['pf-chip', { on: profileForm.body_type === b }]"
                    @click="profileForm.body_type = b">{{ b }}</view>
            </view>
          </view>

          <view class="pf-row">
            <text class="pf-label">风格偏好</text>
            <input class="pf-input" v-model="profileForm.style_preference" placeholder="如：简约通勤、休闲、甜美" />
          </view>
        </view>
        <view class="pf-foot">
          <view class="wh-dlg-btn cancel" @click="profileEditVisible = false">取消</view>
          <view class="wh-dlg-btn save" @click="saveProfile">保存</view>
        </view>
      </view>
    </view>

    <!-- ===== 场景推荐：放在 .page 顶层（避开 scroll-view 包含块），加载层不锁页、结果为紧凑居中卡片 ===== -->
    <!-- 加载层：fixed 视口居中 + pointer-events:none → 页面仍可滚动 -->
    <view v-if="sceneLoading" class="scene-loading-mask">
      <view class="scene-loading-card">
        <view class="scene-loading-spinner"></view>
        <text class="scene-loading-text">正在为您搭配，请稍候</text>
      </view>
    </view>

    <!-- 批量上传识别加载层（与场景推荐同风格） -->
    <view v-if="batchDetecting" class="scene-loading-mask">
      <view class="scene-loading-card">
        <view class="scene-loading-spinner"></view>
        <text class="scene-loading-text">{{ batchDetectText }}</text>
      </view>
    </view>

    <!-- 结果层：非交互式遮罩 + 居中紧凑卡片，背景可滚动，按钮用配对色（薰衣草）渐变 -->
    <view v-if="sceneResult">
      <view class="scene-backdrop" @click="sceneResult = null"></view>
      <view class="scene-mask">
        <view class="scene-dialog">
          <view class="wh-dlg-head">
            <text></text>
            <text class="wh-dlg-title">{{ sceneResult.sceneLabel }}推荐</text>
            <text class="wh-dlg-close" @click="sceneResult = null">×</text>
          </view>
          <view class="scene-dialog-scroll">
            <rich-text class="pre" :nodes="md2html(sceneResult.recommendation)"></rich-text>
            <view v-if="sceneItems.length" class="scene-item-list">
              <view v-for="it in sceneItems" :key="it.id" class="scene-item-card">
                <view class="scene-item-img-wrap">
                  <image v-if="it.image_url" :src="it.image_url" mode="aspectFill" class="scene-item-img" />
                  <icon-svg v-else name="hanger" class="scene-item-placeholder"></icon-svg>
                </view>
                <view class="scene-item-info">
                  <text class="scene-item-name">{{ it.name }}</text>
                  <view class="scene-item-tags">
                    <text class="scene-item-tag">{{ CAT_CN[it.category] || it.category }}</text>
                    <text class="scene-item-tag">{{ it.color }}</text>
                    <text class="scene-item-tag">{{ it.season }}</text>
                  </view>
                </view>
              </view>
            </view>
          </view>
          <view class="scene-dialog-foot">
            <view class="wh-dlg-btn cancel" @click="sceneResult = null">再看看</view>
            <view class="wh-dlg-btn primary" @click="adoptSceneResult">采纳这套</view>
          </view>
        </view>
      </view>
    </view>

    <!-- 全局轻提示：白色圆角卡片，替代系统黑色 toast -->
    <app-toast />
</template>

<script setup>
import { ref, computed, watch, onMounted, shallowRef, markRaw, nextTick } from 'vue'
import { get, post, del, put, upload } from '../../utils/request.js'
import IconSvg from '../../components/IconSvg.vue'
import AppToast from '../../components/AppToast.vue'
import { showToast } from '../../utils/toast.js'

const currentView = ref('today')

// 问候语 (按本机时间动态切换 — 小红书 / Instagram 首页风格)
const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 6)  return '凌晨好'
  if (h < 11) return '早上好'
  if (h < 14) return '中午好'
  if (h < 18) return '下午好'
  return '晚上好'
})
const chatInput = ref('')
const chatLoading = ref(false)
const messages = shallowRef([])
const currentConvId = ref(null)
const pendingChatImage = ref('')          // 本地预览 blob URL
const pendingChatImageUrl = ref('')       // 后端返回的真实图片地址（用于历史记录）
const pendingChatAnalysis = ref('')

const wardrobe = ref([])
const wardrobeFilter = ref('all')
const wardrobeSearch = ref('')
const seasonFilter = ref('all')
const styleFilter = ref('all')
const seasonOptions = [
  { k: 'all', l: '全部' }, { k: '春季', l: '春' },
  { k: '夏季', l: '夏' }, { k: '秋季', l: '秋' }, { k: '冬季', l: '冬' }
]
const styleOptions = [
  { k: 'all', l: '全部' }, { k: '休闲', l: '休闲' }, { k: '正式', l: '正式' },
  { k: '运动', l: '运动' }, { k: '商务', l: '商务' }, { k: '复古', l: '复古' },
  { k: '简约', l: '简约' }, { k: '日常', l: '日常' }
]
const conversations = ref([])
const showHistoryDrawer = ref(false)
const drawerOpened = ref(false)
const analysis = ref(null)
const shoppingList = ref(null)

const notifications = ref([])
const unreadCount = ref(0)
const notifyLoading = ref(false)
const showNotifyDrawer = ref(false)
const drawerNotifyOpened = ref(false)

const showUpload = ref(false)
const uploadPreview = ref('')
const uploadTags = ref(null)
const uploadDetecting = ref(false)
const uploadedFile = ref('')
const uploadedItemId = ref(null)
const purchaseDate = ref('')
const uploadForm = ref({ name: '', category: 'top', color: '', style: '', material: '', pattern: '', season: '' })

// 批量导入编辑
const showBatchEdit = ref(false)
const batchEditList = ref([])
const batchEditIndex = ref(0)
// 批量上传识别 loading（与场景推荐同风格）
const batchDetecting = ref(false)
const batchDetectText = ref('')

// 衣物详情 / 编辑
const showDetail = ref(false)
const detailItem = ref({})
const detailEditing = ref(false)
const detailForm = ref({ name: '', category: 'top', color: '', style: '', material: '', pattern: '', season: '', purchase_date: '' })
// 穿着记录（按日期的历史）
const wearDates = ref([])
const showMarkWorn = ref(false)
const markWornDate = ref('')
function todayStr() {
  const d = new Date()
  const p = n => String(n).padStart(2, '0')
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate())
}
// 穿搭回顾（反向：某天穿了哪些件）
const lookupDate = ref('')
const dayItems = ref([])
function onLookupDateChange(e) {
  lookupDate.value = e.detail.value
  fetchDayWear()
}
async function fetchDayWear() {
  if (!lookupDate.value) return
  try {
    const r = await get('/user/wardrobe/wear-by-date?date=' + lookupDate.value)
    dayItems.value = (r && r.items) || []
  } catch (e) {
    dayItems.value = []
  }
}

const weatherLoading = ref(false)
const weather = ref({ temperature: '--', description: '加载中…', city: '', windspeed: '--', located: false, lat: null, lon: null })
const homeLoading = ref(false)
const homeOutfit = ref(null)
const tempDisplay = computed(() => {
  const t = weather.value.temperature
  if (t === '--' || t === null || t === undefined) return '--'
  return t + '°'
})

const navItems = [
  { key: 'today', icon: 'home', label: '首页' },
  { key: 'chat', icon: 'chat', label: '对话' },
  { key: 'wardrobe', icon: 'shirt', label: '衣橱' },
  { key: 'analysis', icon: 'chart', label: '分析' },
  { key: 'profile', icon: 'user', label: '我的' },
]

const catList = [
  { k: 'all', l: '全部' }, { k: 'top', l: '上装' }, { k: 'outer', l: '外套' },
  { k: 'dress', l: '连衣裙' }, { k: 'bottom', l: '下装' },
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
const catMap = { top: '上装', bottom: '下装', shoes: '鞋子', accessory: '配饰', outer: '外套', dress: '连衣裙' }
const catKeys = ['top', 'bottom', 'shoes', 'accessory', 'outer', 'dress']
const catLabels = ['上装', '下装', '鞋子', '配饰', '外套', '连衣裙']

// 用户等级（基于衣橱单品数）
const LEVEL_THRESHOLDS = [0, 5, 15, 30, 50, 80, 120, 200]
const userLevel = computed(() => {
  const count = wardrobe.value.length
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (count >= LEVEL_THRESHOLDS[i]) return i + 1
  }
  return 1
})
const nextLevelThreshold = computed(() => {
  const idx = userLevel.value - 1
  return LEVEL_THRESHOLDS[Math.min(idx + 1, LEVEL_THRESHOLDS.length - 1)] || 200
})
const levelProgress = computed(() => {
  const cur = wardrobe.value.length
  const base = LEVEL_THRESHOLDS[userLevel.value - 1] || 0
  const target = nextLevelThreshold.value
  if (target <= base) return 100
  return Math.min(100, Math.round(((cur - base) / (target - base)) * 100))
})

// 简易 Markdown → rich-text HTML
function md2html(md) {
  if (!md) return ''
  let html = md
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  // 代码块
  html = html.replace(/```[\s\S]*?```/g, s => '<pre>' + s.slice(3, -3).replace(/^\n/, '') + '</pre>')
  // 表格（简单支持）
  const rows = html.split('\n').filter(l => l.trim().startsWith('|'))
  if (rows.length) {
    let tableHtml = '<table style="width:100%;border-collapse:separate;border-spacing:0;font-size:25rpx;margin:16rpx 0;border-radius:12rpx;overflow:hidden;box-shadow:0 2rpx 8rpx rgba(0,0,0,.05)">'
    rows.forEach((row, idx) => {
      if (row.replace(/\|/g, '').trim().replace(/[-\s]/g, '') === '') return
      const cells = row.split('|').map(c => c.trim()).filter(c => c !== '')
      const tag = idx === 0 ? 'th' : 'td'
      const bg = idx === 0 ? 'background:#F7F8FA;color:#18181B;font-weight:600' : 'background:#fff;color:#6B7280'
      tableHtml += '<tr>' + cells.map(c => `<${tag} style="border:1rpx solid #F4F4F5;padding:10rpx 14rpx;text-align:left;${bg}">${c}</${tag}>`).join('') + '</tr>'
    })
    tableHtml += '</table>'
    html = html.replace(rows.join('\n'), tableHtml)
  }
  // 标题
  const hbreak = 'word-break:break-word;overflow-wrap:break-word;white-space:normal'
  html = html.replace(/^###### (.*)$/gm, `<h6 style="font-size:26rpx;font-weight:600;margin:14rpx 0 8rpx;color:#18181B;${hbreak}">$1</h6>`)
  html = html.replace(/^##### (.*)$/gm, `<h5 style="font-size:27rpx;font-weight:600;margin:16rpx 0 10rpx;color:#18181B;${hbreak}">$1</h5>`)
  html = html.replace(/^#### (.*)$/gm, `<h4 style="font-size:28rpx;font-weight:600;margin:18rpx 0 10rpx;color:#18181B;${hbreak}">$1</h4>`)
  html = html.replace(/^### (.*)$/gm, `<h3 style="font-size:30rpx;font-weight:700;margin:20rpx 0 12rpx;color:#18181B;${hbreak}">$1</h3>`)
  html = html.replace(/^## (.*)$/gm, `<h2 style="font-size:34rpx;font-weight:700;margin:24rpx 0 14rpx;color:#18181B;border-bottom:1rpx solid #EEF2FF;padding-bottom:8rpx;${hbreak}">$1</h2>`)
  html = html.replace(/^# (.*)$/gm, `<h1 style="font-size:38rpx;font-weight:800;margin:28rpx 0 16rpx;color:#18181B;${hbreak}">$1</h1>`)
  // 引用
  html = html.replace(/^> (.*)$/gm, '<blockquote style="margin:12rpx 0;padding:12rpx 16rpx;background:#F7F8FA;border-left:6rpx solid #4F46E5;color:#6B7280;font-size:26rpx">$1</blockquote>')
  // 粗体/斜体
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong style="word-break:break-word;overflow-wrap:break-word;white-space:normal"><em>$1</em></strong>')
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong style="word-break:break-word;overflow-wrap:break-word;white-space:normal">$1</strong>')
  html = html.replace(/\*(.+?)\*/g, '<em style="word-break:break-word;overflow-wrap:break-word;white-space:normal">$1</em>')
  // 删除线
  html = html.replace(/~~(.+?)~~/g, '<del>$1</del>')
  // 行内代码
  html = html.replace(/`(.+?)`/g, '<code style="background:#F5F3FF;padding:2rpx 8rpx;border-radius:6rpx;color:#818CF8;font-size:24rpx">$1</code>')
  // 无序列表：用 div 模拟，彻底避开浏览器默认 marker 双圆点
  html = html.replace(/^(\s*)[-*+]\s*[·•∙⋅]?\s*(.*)$/gm, (m, sp, txt) => `<div class="md-li"><span class="md-dot">•</span>${txt}</div>`)
  // 有序列表：保留原序号，同样用 div 模拟
  html = html.replace(/^(\d+)\.\s*[·•∙⋅]?\s*(.*)$/gm, (m, num, txt) => `<div class="md-oli"><span class="md-num">${num}.</span>${txt}</div>`)
  // 把连续列表项包进统一容器（去掉内部换行，避免后续 split 拆开）
  html = html.replace(/(<div class="md-(li|oli)">[\s\S]*?<\/div>\n?)+/g, m => `<div class="md-list">${m.replace(/\n/g, '')}</div>`)
  // 分隔线
  html = html.replace(/^-{3,}$/gm, '<hr style="border:none;border-top:1rpx solid #F4F4F5;margin:20rpx 0">')
  // 链接
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color:#4F46E5">$1</a>')
  // 段落处理：先把列表块占位保护，避免被包进 <p>
  const lists = []
  html = html.replace(/<div class="md-(list|li|oli)">[\s\S]*?<\/div>/g, m => {
    lists.push(m)
    return `__MDLIST_${lists.length - 1}__`
  })
  const blocks = html.split('\n').map(l => l.trim()).filter(l => l !== '')
  html = blocks.map(b => {
    if (/^(__MDLIST_|<(h[1-6]|blockquote|pre|hr|table|div class="md-))/.test(b)) return b
    return `<p style="margin:12rpx 0;line-height:1.7">${b}</p>`
  }).join('')
  html = html.replace(/__MDLIST_(\d+)__/g, (m, i) => lists[+i])
  return html
}

// ===== 场景快捷推荐（FR-C4）====
const sceneList = ref([])
const sceneLoading = ref(false)
const mainScrollRef = ref(null)
function scrollMainToTop() {
  const r = mainScrollRef.value
  const el = r && r.$el ? r.$el : r
  if (el && typeof el.scrollTop !== 'undefined') el.scrollTop = 0
}
const sceneResult = ref(null)
const sceneIcons = {}

// 场景推荐命中的单品：优先使用后端返回的 item_ids， Fallback 从文案中匹配
const sceneItems = computed(() => {
  if (!sceneResult.value?.recommendation) return []
  const ids = sceneResult.value.item_ids || []
  if (ids && ids.length) {
    const map = new Map(wardrobe.value.map(it => [it.id, it]))
    return ids.map(id => map.get(id)).filter(Boolean)
  }
  // Fallback：按名称长度降序，避免短名被长名包含时误匹配
  const text = sceneResult.value.recommendation
  const matched = []
  const seen = new Set()
  const sorted = [...wardrobe.value].sort((a, b) => b.name.length - a.name.length)
  for (const it of sorted) {
    if (text.includes(it.name) && !seen.has(it.id)) {
      matched.push(it)
      seen.add(it.id)
    }
  }
  return matched.slice(0, 6)
})

// 首页分类快捷入口（纯色浅块：浅蓝 + 淡薰衣草交替，与三色系统一致）
const homeCategories = [
  { key: 'commute', label: '通勤', icon: 'briefcase', bg: '#EEF2FF', color: '#4F46E5' },
  { key: 'date', label: '约会', icon: 'heart', bg: '#EDE9FE', color: '#818CF8' },
  { key: 'sport', label: '运动', icon: 'activity', bg: '#F4F4F5', color: '#4F46E5' },
  { key: 'party', label: '聚会', icon: 'music', bg: '#F5F3FF', color: '#818CF8' },
  { key: 'travel', label: '旅行', icon: 'plane', bg: '#E5E7EB', color: '#4F46E5' },
  { key: 'interview', label: '面试', icon: 'graduation-cap', bg: '#DDD6FE', color: '#4F46E5' }
]
function onHomeCategory(c) {
  runScene(c.key, c.label)
}
function goChatWithPrompt() {
  chatInput.value = ''
  switchView('chat')
}

async function loadScenes() {
  try {
    const d = await get('/user/scenes')
    sceneList.value = d || []
  } catch (e) { sceneList.value = [] }
}
async function runScene(key, fallbackLabel) {
  sceneLoading.value = true
  try {
    const w = weather.value || {}
    const payload = { scene: key }
    if (w.city) payload.city = w.city
    if (w.lat != null) payload.lat = w.lat
    if (w.lon != null) payload.lon = w.lon
    const d = await Promise.race([
      post('/user/quick-recommend', payload),
      new Promise((_, rej) => setTimeout(() => rej(new Error('SCENE_TIMEOUT')), 30000))
    ])
    sceneResult.value = { ...d, sceneLabel: fallbackLabel || key, sceneKey: key }
  } catch (e) {
    showToast({ title: '推荐失败，请重试', icon: 'none' })
  }
  sceneLoading.value = false
}
async function adoptSceneResult() {
  if (!sceneResult.value) return
  try {
    const item_ids = sceneItems.value.map(it => it.id)
    // 穿搭日志功能已停用，采纳不再落库；保留「已采纳」提示作为交互反馈
    showToast({ title: '已采纳', icon: 'success' })
    sceneResult.value = null
  } catch (e) {
    showToast({ title: '采纳失败', icon: 'none' })
  }
}

// ===== 自定义套装（FR-C2）====
const outfits = ref([])
const showOutfitForm = ref(false)
const outfitForm = ref({ name: '', item_ids: [] })
async function loadOutfits() {
  try { outfits.value = await get('/user/outfits') } catch (e) { outfits.value = [] }
}
function toggleOutfitItem(id) {
  const ids = outfitForm.value.item_ids
  const idx = ids.indexOf(id)
  if (idx >= 0) ids.splice(idx, 1); else ids.push(id)
}
async function createOutfit() {
  if (!outfitForm.value.item_ids.length) { showToast({ title: '至少选 1 件衣物', icon: 'none' }); return }
  try {
    await post('/user/outfits', outfitForm.value)
    showOutfitForm.value = false
    outfitForm.value = { name: '我的套装', item_ids: [] }
    loadOutfits()
    showToast({ title: '套装已创建', icon: 'success' })
  } catch (e) { showToast({ title: '创建失败', icon: 'none' }) }
}
async function deleteOutfit(id) {
  try { await del('/user/outfits/' + id); loadOutfits() } catch (e) {}
}

// ===== 衣橱款式分析 / 利用率（基于 wear_count / last_worn）====
const wardrobeInsight = computed(() => {
  const w = wardrobe.value
  const total = w.length
  if (!total) return { utilRate: 0, idleCount: 0, topName: '—', topCount: 0, totalWorn: 0 }
  const now = new Date()
  const DAY = 86400000
  let active90 = 0, idle = 0, totalWorn = 0
  let top = { name: '—', count: -1 }
  w.forEach(i => {
    const wc = i.wear_count || 0
    totalWorn += wc
    if (wc > top.count) top = { name: i.name, count: wc }
    const lw = i.last_worn ? new Date(i.last_worn) : null
    if (lw) {
      const days = Math.floor((now - lw) / DAY)
      if (days <= 90) active90++
      if (days > 180) idle++
    } else {
      idle++ // 从未记录穿着 → 计入闲置
    }
  })
  return {
    utilRate: pct(active90, total),
    idleCount: idle,
    topName: top.name,
    topCount: top.count < 0 ? 0 : top.count,
    totalWorn
  }
})

const filteredWardrobe = computed(() => {
  if (wardrobeFilter.value === 'all') return wardrobe.value
  return wardrobe.value.filter(i => i.category === wardrobeFilter.value)
})

const groupedWardrobe = computed(() => {
  let list = wardrobe.value
  if (wardrobeSearch.value) {
    const q = wardrobeSearch.value.toLowerCase()
    list = list.filter(i => (i.name || '').toLowerCase().includes(q) || (i.description || '').toLowerCase().includes(q))
  }
  if (seasonFilter.value !== 'all') {
    const kw = seasonFilter.value.replace('季', '')
    list = list.filter(i => (i.season || '').includes(kw))
  }
  if (styleFilter.value !== 'all') {
    const kw = styleFilter.value
    list = list.filter(i =>
      (i.style || '').includes(kw) ||
      (i.occasion || '').includes(kw) ||
      parseTags(i).includes(kw)
    )
  }
  const groups = []
  for (const c of catList.filter(x => x.k !== 'all')) {
    const items = list.filter(i => i.category === c.k)
    if (items.length) groups.push({ key: c.k, label: c.l, items })
  }
  return groups
})

const outfitGroups = computed(() => {
  const items = homeOutfit.value?.items || []
  if (!items.length) return []
  const groups = []
  for (const c of catList.filter(x => x.k !== 'all')) {
    const arr = items.filter(i => i.category === c.k)
    if (arr.length) groups.push({ key: c.k, label: c.l, items: arr })
  }
  return groups
})

// 聊天里 AI 推荐单品：按品类分组（与首页「今天穿什么」同一套大图卡片样式）
function groupChatItems(items) {
  const groups = []
  const known = new Set()
  for (const c of catList.filter(x => x.k !== 'all')) {
    const arr = items.filter(i => i.category === c.k)
    if (arr.length) { groups.push({ key: c.k, label: c.l, items: arr }); known.add(c.k) }
  }
  // 兜底：catList 之外的品类（包袋/帽子等）归入「其他」，避免卡片被静默丢弃
  const rest = items.filter(i => !known.has(i.category))
  if (rest.length) groups.push({ key: '_other', label: '其他', items: rest })
  return groups
}

const wardrobeMap = computed(() => {
  const m = {}
  for (const it of wardrobe.value) m[it.id] = it
  return m
})

function pct(v, total) {
  if (!total) return 0
  return Math.round((v / total) * 100)
}

// ===== 分析页可视化 =====
const CAT_CN = { top: '上装', bottom: '下装', shoes: '鞋子', accessory: '配饰', outer: '外套', dress: '连衣裙', bag: '包袋', hat: '帽子' }
/* 品类分布：同色系靛蓝深浅阶（indigo 900→100），有品牌感且相邻品类仍可分辨 */
const INDIGO_SCALE = ['#312E81', '#4338CA', '#4F46E5', '#6366F1', '#818CF8', '#A5B4FC', '#C7D2FE', '#E0E7FF']
const PALETTE = INDIGO_SCALE
const SEASON_CN = { spring: '春', summer: '夏', autumn: '秋', winter: '冬', all: '四季',
  'spring-summer': '春夏', 'spring-autumn': '春秋', 'summer-autumn': '夏秋', 'autumn-winter': '秋冬' }
/* 季节分布：同一套靛蓝深浅阶；琥珀只留给"四季"做唯一强调 */
const SEASON_COLOR = { spring: '#4F46E5', summer: '#6366F1', autumn: '#818CF8', winter: '#A5B4FC', all: '#F59E0B' }
const SEASON_PALETTE = ['#4338CA', '#4F46E5', '#6366F1', '#818CF8', '#F59E0B', '#A5B4FC', '#C7D2FE', '#E0E7FF']
function seasonColorByKey(k) {
  if (SEASON_COLOR[k]) return SEASON_COLOR[k]
  let hash = 0
  for (let i = 0; i < k.length; i++) hash = ((hash * 31) + k.charCodeAt(i)) | 0
  return SEASON_PALETTE[Math.abs(hash) % SEASON_PALETTE.length]
}
const COLOR_HEX = {
  /* 白色系 */
  '白色': '#f5f5f5', '白色系': '#f5f5f5', '乳白': '#faf3e8', '米白': '#f5f0e1', '米白色': '#f5f0e1', '浅米白': '#faf3e8',
  /* 黑色系 */
  '黑色': '#2b2b2b', '黑色系': '#2b2b2b',
  /* 灰色系 */
  '灰色': '#9aa0a6', '灰色系': '#9aa0a6', '浅灰': '#c8c8c8', '浅灰色': '#c8c8c8', '深灰': '#5b5b5b',
  /* 红 / 橙 / 黄 / 绿 / 蓝 / 紫 / 粉 / 棕 / 米 */
  '红色': '#ef6f6c', '红色系': '#ef6f6c', '橙色': '#f6993a', '黄色': '#f6c244', '绿色': '#22c1a8',
  '蓝色': '#5b8def', '蓝色系': '#5b8def', '紫色': '#9b6dff', '粉色': '#f78fb3',
  '棕色': '#a0713f', '米色': '#e7d8bf', '浅米色': '#e7d8bf', '卡其': '#c2a878', '藏青': '#34406b'
}

const categoryChart = computed(() => {
  const d = analysis.value
  if (!d || !d.category_distribution) return { items: [], gradient: '#F4F4F5', total: 0 }
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
  if (!parts.length) parts.push('#F4F4F5 0% 100%')
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
    color: seasonColorByKey(k)
  }))
})

const colorList = computed(() => {
  const d = analysis.value
  if (!d || !d.color_distribution) return []
  return Object.entries(d.color_distribution).map(([k, v]) => ({
    name: k, value: v, hex: COLOR_HEX[k] || '#E5E7EB'
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
  if (s >= 80) return '#4338CA'
  if (s >= 60) return '#4F46E5'
  return '#C7D2FE'
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
function fmtShortTime(iso) {
  if (!iso) return ''
  const s = String(iso).trim()
  // 后端 created_at 为 UTC，但返回的 ISO 字符串不带 Z；无偏移时视为 UTC
  const hasTz = /Z$|[+-]\d{2}:?\d{2}$/.test(s)
  const d = new Date(hasTz ? s : s + 'Z')
  if (isNaN(d.getTime())) return String(iso)
  const p = n => String(n).padStart(2, '0')
  return p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes())
}
async function fetchConversations() {
  try {
    const list = await get('/user/conversations')
    conversations.value = (list || []).map(c => ({ ...c, _time: fmtShortTime(c.created_at) }))
  } catch (e) {}
}
async function fetchAnalysis() {
  try { analysis.value = await get('/user/wardrobe-analysis') } catch (e) {}
}
async function fetchShoppingList() {
  try { shoppingList.value = await get('/user/shopping-list') } catch (e) {}
}

// 当前登录用户的真实 id（注意：登录时写入 storage），没有则回退 1
function getUserId() {
  return uni.getStorageSync('user_id') || 1
}

// ===== 自主搭配（多选取件 + AI 审核）====
const selectedIds = ref([])
const selectedReviewItems = computed(() => {
  return selectedIds.value.map(id => wardrobeMap.value[id]).filter(Boolean)
})
const reviewLoading = ref(false)
const reviewResult = ref(null)
let reviewTimer = null

function isSelected(id) { return selectedIds.value.includes(id) }
function toggleSelect(id) {
  const i = selectedIds.value.indexOf(id)
  if (i >= 0) selectedIds.value.splice(i, 1)
  else selectedIds.value.push(id)
}
function clearSelection() {
  selectedIds.value = []
  reviewResult.value = null
}
watch(selectedIds, () => {
  if (reviewTimer) clearTimeout(reviewTimer)
  if (selectedIds.value.length >= 2) {
    reviewTimer = setTimeout(() => reviewOutfit(), 800)
  } else {
    reviewResult.value = null
  }
}, { deep: true })
const outfitScoreColor = computed(() => {
  const s = reviewResult.value && reviewResult.value.score
  if (!s) return '#9CA3AF'
  if (s >= 8) return '#4F46E5'
  if (s >= 6) return '#EF4444'
  return '#818CF8'
})
const outfitScoreRing = computed(() => {
  const s = reviewResult.value && reviewResult.value.score
  const pct = s ? Math.max(0, Math.min(100, s * 10)) : 0
  return `conic-gradient(${outfitScoreColor.value} ${pct}%, #F4F4F5 ${pct}%)`
})
async function reviewOutfit() {
  if (selectedIds.value.length < 2) {
    showToast({ title: '至少选择 2 件衣物', icon: 'none' })
    return
  }
  reviewLoading.value = true
  reviewResult.value = null
  try {
    const d = await post('/user/outfit-review', { ids: selectedIds.value })
    reviewResult.value = d
  } catch (e) {
    showToast({ title: '审核失败，请重试', icon: 'none' })
  }
  reviewLoading.value = false
}

async function confirmWearSelected() {
  if (!selectedIds.value.length) {
    showToast({ title: '请先选择衣物', icon: 'none' })
    return
  }
  try {
    await post('/user/wardrobe/mark-worn', { ids: selectedIds.value })
    showToast({ title: '已记录今天穿了的衣物', icon: 'success' })
    selectedIds.value = []
    reviewResult.value = null
    fetchWardrobe()
    fetchAnalysis()
  } catch (e) {
    showToast({ title: '记录失败，请重试', icon: 'none' })
  }
}

// ===== 搭配入口：二选一 =====
//  AI 帮你搭：预填一句需求并跳到对话页
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
  try { notifications.value = await get('/user/notifications') } catch (e) { console.log(e) }
}
async function fetchUnread() {
  try {
    const d = await get('/user/notifications/unread-count')
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
    showToast({ title: '已全部标记已读', icon: 'success' })
  } catch (e) {}
}
function openNotifyDrawer() {
  showNotifyDrawer.value = true
  drawerNotifyOpened.value = true
  fetchNotifications()
  fetchUnread()
  setTimeout(() => {
    if (notifications.value.some(n => !n.is_read)) {
      post('/user/notifications/read-all').then(() => {
        notifications.value.forEach(x => { x.is_read = true })
        unreadCount.value = 0
      }).catch(() => {})
    }
  }, 600)
}
function closeNotifyDrawer() {
  drawerNotifyOpened.value = false
  setTimeout(() => { showNotifyDrawer.value = false }, 280)
}

// ===== 图片选择（uni 原生，支持拍照/相册）====
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
  const rawQ = (typeof text === 'string' ? text : chatInput.value).trim()
  if ((!rawQ && !pendingChatImage.value) || chatLoading.value) return
  const hasImage = !!pendingChatImage.value
  const imageUrl = pendingChatImageUrl.value      // 后端真实图片地址
  const imageAnalysis = pendingChatAnalysis.value
  chatInput.value = ''
  pendingChatImage.value = ''
  pendingChatImageUrl.value = ''
  pendingChatAnalysis.value = ''
  messages.value.push(markRaw({ role: 'user', content: rawQ || '上传了一张图片', image: imageUrl || '' }))
  chatLoading.value = true
  try {
    const w = weather.value
    // 把原始问题、图片分析、图片地址分开传给后端；原始问题存入历史，图片分析仅作为 LLM 上下文
    let url = '/user/chat?user_input=' + encodeURIComponent(rawQ || '请分析这张图片并推荐搭配方案。')
    if (imageUrl) url += '&image_url=' + encodeURIComponent(imageUrl)
    if (imageAnalysis) url += '&image_analysis=' + encodeURIComponent(imageAnalysis)
    if (w.city) url += '&city=' + encodeURIComponent(w.city)
    if (w.lat != null) url += '&lat=' + w.lat
    if (w.lon != null) url += '&lon=' + w.lon
    if (currentConvId.value) url += '&conversation_id=' + currentConvId.value
    const d = await get(url)
    currentConvId.value = d.conversation_id
    messages.value.push(markRaw({ role: 'agent', content: d.response, cid: d.conversation_id, rating: 0, image: d.outfit_image || '', items: d.items || [] }))
    fetchConversations()
  } catch (e) {
    messages.value.push(markRaw({ role: 'agent', content: '请求失败，请检查后端' }))
  }
  chatLoading.value = false
}

function toFullMediaUrl(url) {
  if (!url) return ''
  if (/^https?:\/\//.test(url)) return url
  if (url.startsWith('//')) return 'http:' + url
  return 'http://localhost:8000' + url
}

async function chatChooseImage() {
  try {
    const path = await chooseImage()
    // H5 上 path 是 blob URL，<image :src> 可直接渲染；上传完不要用服务端的 image_url 覆盖它
    // ——后端 /uploads/temp/* 在 Vite dev 下没被代理，浏览器加载不到，反而会让预览消失
    pendingChatImage.value = path
    const d = await upload('/user/analyze-image', path)
    pendingChatAnalysis.value = d.analysis || ''
    pendingChatImageUrl.value = toFullMediaUrl(d.image_url || '')
    showToast({ title: '图片已上传，请输入你的问题', icon: 'none' })
  } catch (e) {
    pendingChatImage.value = ''
    pendingChatImageUrl.value = ''
    pendingChatAnalysis.value = ''
    showToast({ title: '图片分析失败', icon: 'none' })
  }
}

function clearPendingChatImage() {
  pendingChatImage.value = ''
  pendingChatImageUrl.value = ''
  pendingChatAnalysis.value = ''
}
function previewImage(url) {
  if (!url) return
  uni.previewImage({ urls: [url], current: url })
}

function rateByIndex(i, score) {
  const msg = messages.value[i]
  if (!msg || !msg.cid) return
  msg.rating = score
  messages.value = [...messages.value]
  try {
    post('/user/conversations/rate', { conversation_id: msg.cid, score })
    showToast({ title: '评分已提交', icon: 'success' })
  } catch (e) {}
}

const profile = ref({ nickname: '', username: '', role: '', avatar_url: '' })
function loadProfile() {
  // 先用本地缓存快速显示，再异步从后端拉取最新昵称覆盖
  profile.value = {
    nickname: uni.getStorageSync('nickname') || '',
    username: uni.getStorageSync('username') || '',
    role: uni.getStorageSync('role') || '',
    avatar_url: uni.getStorageSync('avatar_url') || ''
  }
  refreshProfile()
}
async function refreshProfile() {
  try {
    const me = await get('/auth/me')
    profile.value = {
      nickname: me.nickname || profile.value.nickname,
      username: me.username || profile.value.username,
      role: me.role || profile.value.role,
      avatar_url: me.avatar_url || me.avatar || profile.value.avatar_url || ''
    }
    // 同步回本地，保证其它页面/后续读取一致
    uni.setStorageSync('nickname', profile.value.nickname)
    uni.setStorageSync('username', profile.value.username)
    if (profile.value.avatar_url) uni.setStorageSync('avatar_url', profile.value.avatar_url)
  } catch (e) {
    // 拉取失败则维持本地缓存
  }
}

// 个人中心 — 三列数据徽标（服饰件数 + 搭配数 + 未读通知）

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
  if (key === 'notify') {
    openNotifyDrawer()
    return
  }
  currentView.value = key
  if (key === 'profile') {
    loadProfile()
  } else if (key === 'wardrobe') {
    loadOutfits()
  } else if (key === 'analysis') {
    fetchAnalysis()
  }
}
function setFilter(k) { wardrobeFilter.value = k }
function closeUpload() { showUpload.value = false }

// ===== 首页：定位天气 + 按天气从衣橱挑搭配）=====
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
  // 优先使用高德逆地理（国内稳定、可显示区县/县级市，需要 VITE_AMAP_KEY）
  const amapKey = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_AMAP_KEY) || ''
  if (amapKey) {
    const url = `https://restapi.amap.com/v3/geocode/regeo?key=${amapKey}&location=${lon},${lat}&extensions=base`
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), 4000)
    try {
      const r = await fetch(url, { signal: ctrl.signal })
      const j = await r.json()
      if (j && j.status === '1') {
        const a = (j.regeocode && j.regeocode.addressComponent) || {}
        // district: 区/县；city: 市；province: 省（保留汉字，后面会去掉"县"后缀）
        let name = a.district || a.city || a.province || null
        if (name && name.endsWith('县')) name = name.slice(0, -1)
        if (name) return name
      }
    } catch (e) {
      // 高德失败则降级 OSM
    } finally {
      clearTimeout(t)
    }
  }

  // 无 key / 高德失败：降级 OpenStreetMap Nominatim（在国内常被墙）
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&accept-language=zh&zoom=10`
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), 4000)
  try {
    const r = await fetch(url, { signal: ctrl.signal })
    if (!r.ok) return null
    const j = await r.json()
    const a = (j && j.address) || {}
    let name = a.city || a.town || a.village || a.county || a.state || a.province || null
    if (name && name.endsWith('县')) name = name.slice(0, -1)
    return name
  } catch (e) {
    return null
  } finally {
    clearTimeout(t)
  }
}
// IP 自动定位（兜底）：按客户端公网 IP 反查城市，无需 GPS 授权、手机/桌面均可。
// 优先高德 IP 定位 API（已有 VITE_AMAP_KEY），失败/返回空再回退搜狐 JSONP。
function ipLocate() {
  return new Promise((resolve) => {
    let done = false
    const finish = (v) => { if (!done) { done = true; resolve(v) } }
    const amapKey = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_AMAP_KEY) || ''

    // 通用兜底：搜狐 JSONP
    function fallbackSohu() {
      const s = document.createElement('script')
      const read = () => {
        try {
          const sn = window.returnCitySN
          finish(sn && sn.cname ? sn.cname : null)
        } catch (e) { finish(null) }
        try { delete window.returnCitySN } catch (e) {}
        if (s.parentNode) s.parentNode.removeChild(s)
      }
      s.onload = read
      s.onerror = () => { finish(null); if (s.parentNode) s.parentNode.removeChild(s) }
      s.src = 'https://pv.sohu.com/cityjson?ie=utf-8'
      document.body.appendChild(s)
      setTimeout(() => { finish(null); if (s.parentNode) s.parentNode.removeChild(s) }, 4000)
    }

    // 分支1：有高德 key 时走 REST API（CORS 友好）
    if (amapKey) {
      const ctrl = new AbortController()
      const t = setTimeout(() => { ctrl.abort(); fallbackSohu() }, 4000)
      fetch(`https://restapi.amap.com/v3/ip?key=${amapKey}&ip=`, { signal: ctrl.signal })
        .then(r => r.json())
        .then(j => {
          clearTimeout(t)
          if (j && j.status === '1' && (j.city || j.province)) finish(j.city || j.province)
          else fallbackSohu()
        })
        .catch(() => { clearTimeout(t); fallbackSohu() })
      return
    }

    // 无 key 直接搜狐
    fallbackSohu()
  })
}
// 把 IP 反查到的“广东省/广州市”之类，匹配到内置城市表的经纬度
function matchCity(raw) {
  if (!raw) return null
  const n = String(raw).replace(/[省市区]/g, '').trim()
  let hit = CITIES.find(c => c.name === n || c.name === raw)
  if (hit) return hit
  hit = CITIES.find(c => n.includes(c.name) || c.name.includes(n))
  return hit || null
}
// 注：已弃用"最近城市"近似（nearestCity/haversine）。自动定位改为纯 GPS 实时 + 逆地理，
// 不再把小城市贴到最近的大城市。城市表仅作手动选择器兜底保留。
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
// 主要城市经纬度（手动选择兜底；open-meteo 使用 WGS84 坐标）
const CITIES = [
  { name: '北京', lat: 39.9042, lon: 116.4074 },
  { name: '上海', lat: 31.2304, lon: 121.4737 },
  { name: '广州', lat: 23.1291, lon: 113.2644 },
  { name: '深圳', lat: 22.5431, lon: 114.0579 },
  { name: '成都', lat: 30.5728, lon: 104.0668 },
  { name: '杭州', lat: 30.2741, lon: 120.1551 },
  { name: '武汉', lat: 30.5928, lon: 114.3055 },
  { name: '西安', lat: 34.3416, lon: 108.9398 },
  { name: '南京', lat: 32.0603, lon: 118.7969 },
  { name: '重庆', lat: 29.5630, lon: 106.5516 },
  { name: '苏州', lat: 31.2989, lon: 120.5853 },
  { name: '天津', lat: 39.3434, lon: 117.3616 },
  { name: '长沙', lat: 28.2282, lon: 112.9388 },
  { name: '郑州', lat: 34.7466, lon: 113.6254 },
  { name: '青岛', lat: 36.0671, lon: 120.3826 },
  { name: '厦门', lat: 24.4798, lon: 118.0894 },
  { name: '昆明', lat: 25.0389, lon: 102.7183 },
  { name: '哈尔滨', lat: 45.8038, lon: 126.5349 },
  { name: '沈阳', lat: 41.8057, lon: 123.4315 },
  { name: '济南', lat: 36.6512, lon: 117.1201 },
  { name: '合肥', lat: 31.8206, lon: 117.2272 },
  { name: '福州', lat: 26.0745, lon: 119.2965 },
  { name: '南昌', lat: 28.6829, lon: 115.8579 },
  { name: '贵阳', lat: 26.6477, lon: 106.6302 },
  { name: '南宁', lat: 22.8170, lon: 108.3665 },
  { name: '兰州', lat: 36.0611, lon: 103.8343 },
  { name: '太原', lat: 37.8706, lon: 112.5489 },
  { name: '石家庄', lat: 38.0428, lon: 114.5149 },
  { name: '乌鲁木齐', lat: 43.8256, lon: 87.6168 },
  { name: '拉萨', lat: 29.6520, lon: 91.1721 },
  { name: '呼和浩特', lat: 40.8424, lon: 111.7492 },
  { name: '香港', lat: 22.3193, lon: 114.1694 },
  { name: '台北', lat: 25.0330, lon: 121.5654 },
  { name: '澳门', lat: 22.1987, lon: 113.5439 }
]
const cityPickerVisible = ref(false)
function openCityPicker() { cityPickerVisible.value = true }
// 用指定经纬度/城市刷新天气，并联动刷新首页搭配
async function applyLocation(lat, lon, city, located) {
  weather.value.city = city
  weather.value.located = located
  weather.value.lat = lat
  weather.value.lon = lon
  let wx = null
  try { wx = await fetchWeather(lat, lon) } catch (e) { wx = null }
  const cw = wx && wx.current_weather
  weather.value.temperature = cw ? cw.temperature : '--'
  weather.value.description = cw ? weatherText(cw.weathercode) : '天气获取失败'
  weather.value.windspeed = cw ? cw.windspeed : '--'
  loadHomeOutfit(false)
}
async function syncProfileLocation(city, lat, lon) {
  // 把前端实时定位同步回用户资料，让后端场景推荐/天气提醒能读到一致位置
  // 注意：只有拿到真实城市名才保存；"当前位置"等占位文案不写入 DB，避免污染管理端显示
  try {
    const payload = {}
    if (city && typeof city === 'string' && city.trim() && city !== '当前位置' && city !== '未知位置' && city !== '定位中') {
      payload.city = city.trim()
    }
    if (lat != null) payload.lat = lat
    if (lon != null) payload.lon = lon
    if (Object.keys(payload).length) await put('/user/profile', payload)
  } catch (e) {
    console.warn('[location] 同步用户资料失败', e)
  }
}
async function loadWeather() {
  weatherLoading.value = true
  // 优先尝试真实定位（带 4s 超时），失败/超时/被拒都不卡住
  let lat = null, lon = null, located = false, city = ''
  try {
    const loc = await Promise.race([
      getLocation(),
      new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 4000))
    ])
    lat = loc.latitude
    lon = loc.longitude
    located = true
  } catch (e) {
    // 定位被拒/超时/不可用：交给下方兜底逻辑
  }

  // GPS 成功：直接用真实坐标，城市名按逆地理如实反查，不再近似到最近大城市
  if (located) {
    let city = ''
    try { const geo = await reverseGeocode(lat, lon); if (geo) city = geo } catch (e) {}
    // 逆地理失败（网络受限）就显示"当前位置"，绝不退回错的福州/北京
    if (!city) city = '当前位置'
    // 仅当 GPS 成功时把真实坐标写入记忆，覆盖掉之前可能被 IP 污染的"福州"
    // 注意：用户曾在个人中心"身形资料"手动选过城市（user_city_manual）→ 保留手动值，
    //       GPS 只更新坐标，不覆盖 city 名，避免手动选的三级城市被覆盖成单级名
    try {
      const manual = uni.getStorageSync('user_city_manual')
      if (manual) {
        const prev = uni.getStorageSync('user_city')
        uni.setStorageSync('user_city', { city: (prev && prev.city) || city, lat, lon })
      } else {
        uni.setStorageSync('user_city', { city, lat, lon })
      }
    } catch (e) {}
    await applyLocation(lat, lon, city, true)
    syncProfileLocation(city, lat, lon)
    weatherLoading.value = false
    return
  }

  // 无 GPS 坐标：先用用户【手动选过】的城市，再用 IP 自动反查（仅临时，不污染记忆），最后才兜底北京
  try {
    const saved = uni.getStorageSync('user_city')
    if (saved && saved.city) {
      city = saved.city
      if (saved.lat != null) lat = saved.lat
      if (saved.lon != null) lon = saved.lon
    }
  } catch (e) {}
  // 注意：IP 反查结果不再写入 user_city，避免错误 IP 城市（如福州）污染记忆
  if (!city) {
    try {
      const ipc = await Promise.race([
        ipLocate(),
        new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 4000))
      ])
      const m = matchCity(ipc)
      if (m) { city = m.name; lat = m.lat; lon = m.lon }
    } catch (e) {}
  }
  // 仍无城市：最后一手兜底北京（UI 提示可点击修改）
  if (!city) {
    city = '北京'
    lat = lat ?? 39.9042
    lon = lon ?? 116.4074
  }
  await applyLocation(lat, lon, city, false)
  weatherLoading.value = false
}
async function selectCity(c) {
  cityPickerVisible.value = false
  try {
    uni.setStorageSync('user_city', { city: c.name, lat: c.lat, lon: c.lon })
    uni.setStorageSync('user_city_manual', true)
  } catch (e) {}
  await applyLocation(c.lat, c.lon, c.name, false)
  syncProfileLocation(c.name, c.lat, c.lon)
}
async function reLocate() {
  cityPickerVisible.value = false
  weatherLoading.value = true
  try {
    // 1. 先试 GPS（需要浏览器授权 + 安全上下文）
    let gpsLat = null, gpsLon = null, gpsOk = false
    try {
      const loc = await Promise.race([
        getLocation(),
        new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 8000))
      ])
      gpsLat = loc.latitude
      gpsLon = loc.longitude
      gpsOk = true
    } catch (gpsErr) {
      // GPS 失败（拒绝/超时/非 HTTPS）：交给下方 IP 兜底
    }

    // 2. 有 GPS 坐标：直接用真实坐标，城市名按逆地理如实反查，不再近似到最近大城市
    if (gpsOk) {
      let city = ''
      try { const geo = await reverseGeocode(gpsLat, gpsLon); if (geo) city = geo } catch (e) {}
      if (!city) city = '当前位置'
      // 仅当 GPS 成功时写入记忆，覆盖掉之前可能被 IP 污染的"福州"
      try { uni.setStorageSync('user_city', { city, lat: gpsLat, lon: gpsLon }) } catch (e) {}
      await applyLocation(gpsLat, gpsLon, city, true) // GPS 确实拿到了，located=true
      syncProfileLocation(city, gpsLat, gpsLon)
      showToast({ title: city === '当前位置' ? '已使用实时定位' : '已定位到：' + city, icon: 'none' })
      return
    }

    // 3. 无 GPS 坐标：走 IP 自动定位兜底（免授权、HTTP 可用）。结果仅临时使用，不写入记忆。
    const ipc = await Promise.race([
      ipLocate(),
      new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 4000))
    ])
    const m = matchCity(ipc)
    if (m) {
      await applyLocation(m.lat, m.lon, m.name, false)
      showToast({ title: '已定位到：' + m.name, icon: 'none' })
    } else {
      showToast({ title: '自动定位失败，请手动选择城市', icon: 'none' })
    }
  } catch (e) {
    showToast({ title: '定位失败，请手动选择城市', icon: 'none' })
  } finally {
    weatherLoading.value = false
  }
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

async function wearTodayOutfit() {
  const items = homeOutfit.value?.items || []
  const ids = items.map(it => it.id).filter(Boolean)
  if (!ids.length) {
    showToast({ title: '没有可标记的衣物', icon: 'none' })
    return
  }
  try {
    await post('/user/wardrobe/mark-worn', { ids })
    // 穿搭日志功能已停用，不再调用 /user/outfits/adopt（穿着记录由 mark-worn 完成，供穿搭回顾）
    showToast({ title: '已记录今天穿了这套', icon: 'success' })
    fetchWardrobe()
    fetchAnalysis()
  } catch (e) {
    showToast({ title: '记录失败，请重试', icon: 'none' })
  }
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
      showToast({ title: 'AI识别完成，请确认后保存', icon: 'none' })
    }
  } catch (e) {
    uploadTags.value = {}
    uploadForm.value = { name: '', category: 'top', color: '', style: '', material: '', pattern: '', season: '' }
    showToast({ title: 'AI识别失败，可手动填写', icon: 'none' })
  }
  uploadDetecting.value = false
}
// 批量上传（上限10张）：逐张过 AI 识图，进入批量编辑弹窗让用户确认
async function chooseBatchImages() {
  try {
    const res = await uni.chooseImage({ count: 10, sizeType: ['compressed'], sourceType: ['album', 'camera'] })
    const files = res.tempFilePaths
    if (!files || !files.length) return
    batchDetectText.value = `正在识别 ${files.length} 张...`
    batchDetecting.value = true
    const list = []
    let fail = 0
    for (const f of files) {
      try {
        const d = await upload('/user/wardrobe/upload-and-tag', f, 'file', { status: 'pending', purchase_date: new Date().toISOString().slice(0, 10) })
        const it = d.item || {}
        const t = d.tags || {}
        list.push({
          id: it.id,
          image_url: it.image_url || f,
          name: t.name || '衣物',
          category: t.category || 'top',
          color: t.color || '',
          style: t.style || '',
          material: t.material || '',
          pattern: t.pattern || '',
          season: t.season || '',
          purchase_date: new Date().toISOString().slice(0, 10),
          _saved: false
        })
      } catch (e) { fail++ }
    }
    if (list.length) {
      batchEditList.value = list
      batchEditIndex.value = 0
      showBatchEdit.value = true
    }
    if (fail) {
      showToast({ title: `${fail} 张识别失败`, icon: 'none' })
    }
  } catch (e) { /* 用户取消 */ }
  finally {
    batchDetecting.value = false
  }
}
function onPurchaseDateChange(e) {
  purchaseDate.value = e.detail.value
}
async function confirmUpload() {
  if (!uploadedItemId.value) {
    showToast({ title: '请先上传图片', icon: 'none' })
    return
  }
  try {
    await put('/user/wardrobe/' + uploadedItemId.value, {
      name: uploadForm.value.name,
      category: uploadForm.value.category,
      color: uploadForm.value.color,
      style: uploadForm.value.style,
      material: uploadForm.value.material,
      pattern: uploadForm.value.pattern,
      season: uploadForm.value.season,
      purchase_date: purchaseDate.value || null
    })
    showToast({ title: '已保存到衣橱', icon: 'success' })
  } catch (e) {
    showToast({ title: '保存失败', icon: 'none' })
  }
  showUpload.value = false
  resetUpload()
  fetchWardrobe()
  fetchShoppingList()
}
function resetUpload() {
  uploadPreview.value = ''; uploadTags.value = null; uploadedFile.value = ''
  uploadedItemId.value = null; purchaseDate.value = ''
  uploadForm.value = { name: '', category: 'top', color: '', style: '', season: '' }
}

// ===== 批量编辑 =====
// 将未保存的 pending 单品标记为 discarded，避免关闭弹窗后仍出现在衣橱
async function discardPendingItems(items) {
  const pending = (items || []).filter(it => it.id && !it._saved)
  for (const it of pending) {
    try { await put('/user/wardrobe/' + it.id, { status: 'discarded' }) } catch (e) {}
  }
}
function closeBatchEdit() {
  const remaining = batchEditList.value.slice()
  showBatchEdit.value = false
  batchEditList.value = []
  batchEditIndex.value = 0
  discardPendingItems(remaining)
}
function prevBatchItem() {
  let i = batchEditIndex.value - 1
  while (i >= 0 && batchEditList.value[i] && batchEditList.value[i]._saved) i--
  if (i >= 0) batchEditIndex.value = i
}
function nextBatchItem() {
  let i = batchEditIndex.value + 1
  while (i < batchEditList.value.length && batchEditList.value[i] && batchEditList.value[i]._saved) i++
  if (i < batchEditList.value.length) batchEditIndex.value = i
}
function onBatchFormInput(e, key) {
  const v = e && e.detail && typeof e.detail.value === 'string' ? e.detail.value : e && typeof e.target.value === 'string' ? e.target.value : String(e || '')
  if (batchEditList.value[batchEditIndex.value]) batchEditList.value[batchEditIndex.value][key] = v
}
function onBatchCatChange(e) {
  if (batchEditList.value[batchEditIndex.value]) batchEditList.value[batchEditIndex.value].category = catKeys[e.detail.value]
}
function onBatchPurchaseDateChange(e) {
  if (batchEditList.value[batchEditIndex.value]) batchEditList.value[batchEditIndex.value].purchase_date = e.detail.value
}
async function saveSingleBatchItem() {
  const it = batchEditList.value[batchEditIndex.value]
  if (!it) return
  try {
    await put('/user/wardrobe/' + it.id, {
      name: it.name || '衣物',
      category: it.category || 'top',
      color: it.color || '',
      style: it.style || '',
      material: it.material || '',
      pattern: it.pattern || '',
      season: it.season || '',
      purchase_date: it.purchase_date || null,
      status: 'confirmed'
    })
    it._saved = true
    showToast({ title: '已保存', icon: 'success' })
    const nextIdx = batchEditList.value.findIndex((x, i) => i > batchEditIndex.value && !x._saved)
    if (nextIdx !== -1) {
      batchEditIndex.value = nextIdx
    } else {
      const firstIdx = batchEditList.value.findIndex(x => !x._saved)
      if (firstIdx !== -1 && firstIdx !== batchEditIndex.value) {
        batchEditIndex.value = firstIdx
      } else {
        // 全部已保存
        showBatchEdit.value = false
        batchEditList.value = []
        batchEditIndex.value = 0
        fetchWardrobe()
        fetchShoppingList()
      }
    }
  } catch (e) {
    showToast({ title: '保存失败', icon: 'none' })
  }
}
async function skipBatchItem() {
  const it = batchEditList.value[batchEditIndex.value]
  if (it && it.id) {
    try { await put('/user/wardrobe/' + it.id, { status: 'discarded' }) } catch (e) {}
  }
  batchEditList.value.splice(batchEditIndex.value, 1)
  if (!batchEditList.value.length) {
    showBatchEdit.value = false
    batchEditIndex.value = 0
    return
  }
  if (batchEditIndex.value >= batchEditList.value.length) batchEditIndex.value = batchEditList.value.length - 1
}
async function confirmBatchEdit() {
  uni.showLoading({ title: '保存中...', mask: true })
  let success = 0, fail = 0
  for (const it of batchEditList.value) {
    if (it._saved) continue
    try {
      await put('/user/wardrobe/' + it.id, {
        name: it.name || '衣物',
        category: it.category || 'top',
        color: it.color || '',
        style: it.style || '',
        material: it.material || '',
        pattern: it.pattern || '',
        season: it.season || '',
        purchase_date: it.purchase_date || null,
        status: 'confirmed'
      })
      it._saved = true
      success++
    } catch (e) { fail++ }
  }
  uni.hideLoading()
  showBatchEdit.value = false
  const remaining = batchEditList.value.filter(it => !it._saved)
  batchEditList.value = []
  batchEditIndex.value = 0
  await discardPendingItems(remaining)
  fetchWardrobe()
  fetchShoppingList()
  showToast({ title: `成功保存 ${success} 件${fail ? `，失败 ${fail} 件` : ''}`, icon: success > 0 ? 'success' : 'none' })
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
  if (idle !== null) {
    if (idle === 0) parts.push('今天穿过')
    else if (idle === 1) parts.push('昨天穿过')
    else parts.push('已 ' + idle + '天没穿')
  } else if (owned !== null && owned > 90) parts.push('购入久未穿')
  parts.push('共穿 ' + (item.wear_count || 0) + ' 次')
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
async function markWorn(ids, wornDate) {
  try { await post('/user/wardrobe/mark-worn', { ids, worn_date: wornDate || undefined }) } catch (e) {}
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
        try { await del('/user/wardrobe/' + id); if (showDetail.value) showDetail.value = false; fetchWardrobe(); fetchShoppingList(); fetchAnalysis(); showToast({ title: '已删除', icon: 'success' }) } catch (e) {}
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
      else if (res.tapIndex === 1) openDetail(item, true)  // 编辑信息 → 打开详情并直接进入编辑
    }
  })
}
// ===== 衣物详情 / 编辑 =====
function fmtDate(s) {
  if (!s) return ''
  return String(s).slice(0, 10)
}
function openDetail(item, edit = false) {
  detailItem.value = JSON.parse(JSON.stringify(item))
  detailEditing.value = false
  showMarkWorn.value = false
  showDetail.value = true
  markWornDate.value = todayStr()
  fetchWearHistory(item.id)
  if (edit) startEdit()
}
async function fetchWearHistory(id) {
  try {
    const r = await get('/user/wardrobe/wear-history?item_id=' + id)
    wearDates.value = (r && r.dates) || []
  } catch (e) {
    wearDates.value = []
  }
}
function openMarkWorn() {
  markWornDate.value = todayStr()
  showMarkWorn.value = true
}

// ===== 单品纠错（用户端上报 AI 识别错误）=====
const itemCorrVisible = ref(false)
const itemCorrItem = ref(null)
const itemCorrSel = ref([])
const itemCorrVals = ref({})
const itemCorrNote = ref('')
const itemCorrFields = [
  { k: 'category', l: '品类', ph: '如：上衣 / 裤子' },
  { k: 'color', l: '颜色', ph: '如：白色' },
  { k: 'material', l: '材质', ph: '如：棉' },
  { k: 'pattern', l: '图案', ph: '如：条纹' },
  { k: 'style', l: '风格', ph: '如：简约' },
  { k: 'season', l: '季节', ph: '如：春夏' },
  { k: 'occasion', l: '场合', ph: '如：通勤' },
]
function openItemCorrection() {
  itemCorrItem.value = detailItem.value
  itemCorrSel.value = []
  itemCorrVals.value = {}
  itemCorrNote.value = ''
  itemCorrVisible.value = true
}
function toggleItemCorrField(k) {
  const i = itemCorrSel.value.indexOf(k)
  if (i >= 0) itemCorrSel.value.splice(i, 1)
  else itemCorrSel.value.push(k)
}
function onItemCorrInput(e, k) {
  const v = e && e.detail && typeof e.detail.value === 'string' ? e.detail.value : e && typeof e.target.value === 'string' ? e.target.value : String(e || '')
  itemCorrVals.value[k] = v
}
function onItemCorrNote(e) {
  const v = e && e.detail && typeof e.detail.value === 'string' ? e.detail.value : e && typeof e.target.value === 'string' ? e.target.value : String(e || '')
  itemCorrNote.value = v
}
async function submitItemCorrection() {
  if (!itemCorrItem.value) return
  if (!itemCorrSel.value.length) {
    showToast({ title: '请先勾选认错的字段', icon: 'none' })
    return
  }
  const correct_attrs = {}
  itemCorrSel.value.forEach(k => { if (itemCorrVals.value[k]) correct_attrs[k] = itemCorrVals.value[k] })
  if (!Object.keys(correct_attrs).length) {
    showToast({ title: '请填写至少一个正确值', icon: 'none' })
    return
  }
  try {
    await post('/user/item-corrections', {
      item_id: itemCorrItem.value.id,
      error_fields: itemCorrSel.value,
      correct_attrs,
      note: itemCorrNote.value || ''
    })
    itemCorrVisible.value = false
    showToast({ title: '已提交，待审核', icon: 'none', duration: 2000 })
  } catch (e) {
    const msg = e && e.data && e.data.detail ? e.data.detail : '提交失败，请重试'
    showToast({ title: String(msg).slice(0, 16), icon: 'none' })
  }
}

// ===== 单品标签管理（从线上 tags 表给单品打标签）=====
function parseTags(item) {
  if (!item || !item.tags) return []
  try { return JSON.parse(item.tags) } catch (e) { return [] }
}
const detailTags = computed(() => parseTags(detailItem.value))
const tagManagerVisible = ref(false)
const allUserTags = ref([])
const tagManagerSel = ref([])
function openTagManager() {
  tagManagerSel.value = parseTags(detailItem.value).slice()
  tagManagerVisible.value = true
  loadUserTags()
}
async function loadUserTags() {
  try { const r = await get('/user/tags'); allUserTags.value = r || [] } catch (e) { allUserTags.value = [] }
}
function toggleUserTag(name) {
  const i = tagManagerSel.value.indexOf(name)
  if (i >= 0) tagManagerSel.value.splice(i, 1)
  else tagManagerSel.value.push(name)
}
async function saveItemTags() {
  if (!detailItem.value) return
  try {
    const tagsStr = JSON.stringify(tagManagerSel.value)
    await put('/user/wardrobe/' + detailItem.value.id, { tags: tagsStr })
    detailItem.value.tags = tagsStr
    tagManagerVisible.value = false
    await fetchWardrobe()
    showToast({ title: '已保存标签', icon: 'success' })
  } catch (e) {
    showToast({ title: '保存失败', icon: 'none' })
  }
}

// ===== 个人资料编辑（身高/体重/肤色/体型/风格偏好，供 AI 推荐参考）=====
const profileEditVisible = ref(false)
const SKIN_TONES = ['暖黄', '冷白', '中性', '小麦色', '白皙']
const BODY_TYPES = ['矩形', '梨形', '苹果形', '沙漏形', '倒三角', '匀称']
const profileForm = ref({ nickname: '', city: '', height: '', weight: '', skin_tone: '', body_type: '', style_preference: '' })

/* ===== 三级联动省市区数据（精简版：常用省 + 主要市/区） ===== */
const CITY_REGION = [
  { name: '北京', cities: [{ name: '北京', districts: ['东城区', '西城区', '朝阳区', '海淀区', '丰台区'] }] },
  { name: '上海', cities: [{ name: '上海', districts: ['黄浦区', '徐汇区', '长宁区', '静安区', '浦东新区'] }] },
  { name: '广东', cities: [
    { name: '广州', districts: ['天河区', '越秀区', '海珠区', '番禺区', '白云区'] },
    { name: '深圳', districts: ['南山区', '福田区', '罗湖区', '宝安区', '龙岗区'] },
    { name: '东莞', districts: ['南城', '东城', '万江'] },
    { name: '佛山', districts: ['禅城区', '南海区', '顺德区'] }
  ] },
  { name: '福建', cities: [
    { name: '福州', districts: ['鼓楼区', '台江区', '仓山区'] },
    { name: '厦门', districts: ['思明区', '湖里区', '集美区'] },
    { name: '泉州', districts: ['丰泽区', '鲤城区', '晋江市', '德化县'] }
  ] },
  { name: '浙江', cities: [
    { name: '杭州', districts: ['西湖区', '上城区', '拱墅区'] },
    { name: '宁波', districts: ['海曙区', '江北区'] },
    { name: '温州', districts: ['鹿城区', '瓯海区'] }
  ] },
  { name: '江苏', cities: [
    { name: '南京', districts: ['鼓楼区', '玄武区'] },
    { name: '苏州', districts: ['姑苏区', '工业园区'] },
    { name: '无锡', districts: ['梁溪区', '滨湖区'] }
  ] },
  { name: '四川', cities: [
    { name: '成都', districts: ['锦江区', '青羊区', '武侯区'] },
    { name: '绵阳', districts: ['涪城区'] }
  ] },
  { name: '湖北', cities: [
    { name: '武汉', districts: ['江岸区', '江汉区', '武昌区'] }
  ] },
  { name: '湖南', cities: [
    { name: '长沙', districts: ['芙蓉区', '天心区', '岳麓区'] }
  ] },
  { name: '山东', cities: [
    { name: '济南', districts: ['历下区', '市中区'] },
    { name: '青岛', districts: ['市南区', '崂山区'] }
  ] }
]
const cityIndex = ref([0, 0, 0])
const cityProvinceNames = CITY_REGION.map(p => p.name)
const cityNamesAt = computed(() => CITY_REGION[cityIndex.value[0]]?.cities.map(c => c.name) || [])
const cityDistrictNames = computed(() => {
  const p = CITY_REGION[cityIndex.value[0]]
  const c = p?.cities[cityIndex.value[1]]
  return c?.districts || []
})
const cityFullText = computed(() => {
  const [pi, ci, di] = cityIndex.value
  const p = CITY_REGION[pi]
  const c = p?.cities[ci]
  const d = c?.districts[di]
  if (!p || !c) return ''
  return d ? `${p.name} / ${c.name} / ${d}` : `${p.name} / ${c.name}`
})
/* picker mode="multiSelector" 的 columnchange：切换列联动重置 */
function onCityColumnChange(e) {
  const { column, value } = e.detail
  const arr = [...cityIndex.value]
  if (column === 0) {
    arr[0] = value
    arr[1] = 0
    arr[2] = 0
  } else if (column === 1) {
    arr[1] = value
    arr[2] = 0
  } else {
    arr[2] = value
  }
  cityIndex.value = arr
  /* 同步到表单字段（保存"省/市/区"格式） */
  profileForm.value.city = cityFullText.value
  /* 选择即写本地缓存：退出登录不丢（不依赖点"保存"） */
  const clean = cityFullText.value.replace(/\s+/g, '')
  if (clean) {
    const hit = matchCity(clean)
    try {
      uni.setStorageSync('user_city', { city: clean, lat: hit ? hit.lat : null, lon: hit ? hit.lon : null })
      uni.setStorageSync('user_city_manual', true)
    } catch (e) {}
  }
}
/* 打开弹窗时如果有旧 city，尝试反解析回索引
   支持："福建 / 泉州 / 德化县" 完整串、"泉州"、"德化" 等单级名（全局模糊搜索） */
function parseCityToIndex(text) {
  if (!text) return [0, 0, 0]
  const parts = text.split(/[/、,，\s]+/).map(s => s.trim()).filter(Boolean)
  if (!parts.length) return [0, 0, 0]

  /* 1) 三段精确解析（省 / 市 / 区），完整串优先 */
  if (parts.length >= 2) {
    let pi = CITY_REGION.findIndex(p => p.name === parts[0])
    if (pi < 0) pi = CITY_REGION.findIndex(p => p.name.includes(parts[0]) || parts[0].includes(p.name))
    if (pi >= 0) {
      let ci = 0, di = 0
      ci = CITY_REGION[pi].cities.findIndex(c => c.name === parts[1])
      if (ci < 0) ci = CITY_REGION[pi].cities.findIndex(c => c.name.includes(parts[1]) || parts[1].includes(c.name))
      if (ci < 0) ci = 0
      if (parts[2]) {
        const idx = CITY_REGION[pi].cities[ci].districts.indexOf(parts[2])
        di = idx >= 0 ? idx : CITY_REGION[pi].cities[ci].districts.findIndex(d => d.includes(parts[2]) || parts[2].includes(d))
        if (di < 0) di = 0
      }
      return [pi, ci, di]
    }
  }

  /* 2) 单级全局模糊搜索：如"德化"在全部省的市/区里找 */
  const only = parts.join('')
  for (let pi = 0; pi < CITY_REGION.length; pi++) {
    const prov = CITY_REGION[pi]
    if (only === prov.name || prov.name.includes(only)) return [pi, 0, 0]
    for (let ci = 0; ci < prov.cities.length; ci++) {
      const c = prov.cities[ci]
      if (only === c.name || only.includes(c.name) || c.name.includes(only)) return [pi, ci, 0]
      for (let di = 0; di < c.districts.length; di++) {
        const d = c.districts[di]
        if (only === d || only.includes(d) || d.includes(only)) return [pi, ci, di]
      }
    }
  }

  /* 3) 仍匹配不上：兜底第一个省 */
  return [0, 0, 0]
}

function openProfileEdit() {
  profileEditVisible.value = true
  loadProfileForm()
}
async function loadProfileForm() {
  try {
    const p = await get('/user/profile')
    /* 城市持久化：优先本地"手动选过"的缓存（GPS 定位会把后端 city 覆盖成单级名，本地三级值更准确） */
    let city = p.city || ''
    try {
      const saved = uni.getStorageSync('user_city')
      const manual = uni.getStorageSync('user_city_manual')
      if (manual && saved && saved.city) city = saved.city
    } catch (e) {}
    profileForm.value = {
      nickname: p.nickname || '',
      city: city,
      height: p.height != null ? String(p.height) : '',
      weight: p.weight != null ? String(p.weight) : '',
      skin_tone: p.skin_tone || '',
      body_type: p.body_type || '',
      style_preference: p.style_preference || ''
    }
    /* 反解析旧 city 到 picker 三列索引 */
    cityIndex.value = parseCityToIndex(city)
  } catch (e) {
    // 拉取失败则保留默认空表单
  }
}
async function saveProfile() {
  try {
    const f = profileForm.value
    const payload = {
      nickname: f.nickname,
      city: f.city,
      height: f.height !== '' ? Number(f.height) : null,
      weight: f.weight !== '' ? Number(f.weight) : null,
      skin_tone: f.skin_tone,
      body_type: f.body_type,
      style_preference: f.style_preference
    }
    const r = await put('/user/profile', payload)
    // 同步昵称缓存，保持个人中心/顶部显示一致（优先用后端返回，回退用表单值）
    const newNick = (r && r.nickname) || f.nickname
    profile.value.nickname = newNick
    uni.setStorageSync('nickname', newNick)
    // 城市持久化：把用户选择的省/市/区写入本地 user_city 缓存 + 标记"手动选过"，
    // 退出登录后重新进入优先用手动城市，不被 GPS/IP 覆盖
    if (f.city && typeof f.city === 'string' && f.city.trim()) {
      const clean = f.city.replace(/\s+/g, '')
      const hit = matchCity(clean)
      try {
        uni.setStorageSync('user_city', {
          city: clean,
          lat: hit ? hit.lat : null,
          lon: hit ? hit.lon : null
        })
        uni.setStorageSync('user_city_manual', true)
      } catch (e) {}
      // 匹配到经纬度时立即联动天气，保证顶部天气栏同步显示
      if (hit && hit.lat != null) {
        applyLocation(hit.lat, hit.lon, clean, false)
        syncProfileLocation(clean, hit.lat, hit.lon)
      }
    }
    profileEditVisible.value = false
    showToast({ title: '已保存', icon: 'success' })
  } catch (e) {
    showToast({ title: '保存失败，请重试', icon: 'none' })
  }
}
async function doMarkWorn() {
  try {
    await markWorn([detailItem.value.id], markWornDate.value)
    showMarkWorn.value = false
    await fetchWearHistory(detailItem.value.id)
    await fetchWardrobe()  // 同步刷新衣橱，使卡片闲置天数实时更新
    const it = wardrobe.value.find(i => i.id === detailItem.value.id)
    if (it) {
      detailItem.value.last_worn = it.last_worn
      detailItem.value.wear_count = it.wear_count
    }
    showToast({ title: '已记录', icon: 'success' })
  } catch (e) {
    showToast({ title: '记录失败', icon: 'none' })
  }
}
async function deleteWearDate(dateStr) {
  const itemId = detailItem.value?.id
  if (!itemId || !dateStr) return
  uni.showModal({
    title: '删除记录',
    content: '确定删除 ' + dateStr + ' 的穿着记录吗？',
    confirmColor: '#EF4444',
    success: async (res) => {
      if (!res.confirm) return
      try {
        await post('/user/wardrobe/wear-history/delete', { item_id: itemId, worn_date: dateStr })
        await fetchWearHistory(itemId)
        await fetchWardrobe()
        showToast({ title: '已删除', icon: 'success' })
      } catch (e) {
        showToast({ title: '删除失败', icon: 'none' })
      }
    }
  })
}
function closeDetail() {
  showDetail.value = false
  detailEditing.value = false
}
function startEdit() {
  const d = detailItem.value
  detailForm.value = {
    name: d.name || '',
    category: d.category || 'top',
    color: d.color || '',
    style: d.style || '',
    season: d.season || '',
    purchase_date: fmtDate(d.purchase_date)
  }
  detailEditing.value = true
}
function cancelEdit() { detailEditing.value = false }
function onDetailFormInput(e, key) {
  const v = e && e.detail && typeof e.detail.value === 'string' ? e.detail.value : String(e || '')
  detailForm.value[key] = v
}
function onDetailCatChange(e) { detailForm.value.category = catKeys[e.detail.value] }
function onDetailPurchaseDateChange(e) { detailForm.value.purchase_date = e.detail.value }
async function saveDetail() {
  try {
    await put('/user/wardrobe/' + detailItem.value.id, {
      name: detailForm.value.name || '衣物',
      category: detailForm.value.category || 'top',
      color: detailForm.value.color || '',
      style: detailForm.value.style || '',
      material: detailForm.value.material || '',
      pattern: detailForm.value.pattern || '',
      season: detailForm.value.season || '',
      purchase_date: detailForm.value.purchase_date || null
    })
    const idx = wardrobe.value.findIndex(i => i.id === detailItem.value.id)
    if (idx >= 0) wardrobe.value[idx] = { ...wardrobe.value[idx], ...JSON.parse(JSON.stringify(detailForm.value)) }
    Object.assign(detailItem.value, JSON.parse(JSON.stringify(detailForm.value)))
    detailEditing.value = false
    fetchWardrobe()
    fetchShoppingList()
    showToast({ title: '已保存', icon: 'success' })
  } catch (e) {
    showToast({ title: '保存失败', icon: 'none' })
  }
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
  if (!item || !item.color) return '#e0e0e0'
  return COLOR_HEX_MAP[item.color] || COLOR_HEX_MAP[item.color.replace('系', '')] || '#e0e0e0'
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
  currentConvId.value = null
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
          showToast({ title: '已删除', icon: 'success' })
        } catch (e) {}
      }
    }
  })
}
function firstQuestion(conv) {
  // 列表只显示用户首问摘要；图片分析等长文本截断为一行
  let q = conv.user_input || ''
  q = q.replace(/^\[图片分析：\s*/, '')
  q = q.replace(/```[\s\S]*?```/g, '[图片分析]')
  q = q.replace(/\n/g, ' ').trim()
  if (conv.user_image_url) {
    q = q ? `[图片] ${q}` : '[图片]'
  }
  if (!q) return '（空对话）'
  return q.length > 26 ? q.slice(0, 26) + '…' : q
}

function openHistoryChatById(id) {
  const conv = conversations.value.find(c => c.id === id)
  if (!conv) return
  messages.value = []
  currentConvId.value = id
  const hist = Array.isArray(conv.history) ? conv.history : []
  if (hist.length) {
    // 旧对话的 agent 条目可能没有 items/outfit_image（字段是后来才落 history 的），用空值兜底
    hist.forEach(h => {
      const isAgent = h.role === 'agent'
      messages.value.push(markRaw({
        role: h.role,
        content: h.content,
        cid: isAgent ? id : null,
        rating: 0,
        image: isAgent ? (h.outfit_image || '') : (h.image_url || ''),
        items: isAgent ? (h.items || []) : []
      }))
    })
    // 对话级评分（conv.score）回填到最后一条 agent 消息，重进历史不丢已评状态
    for (let i = messages.value.length - 1; i >= 0; i--) {
      if (messages.value[i].role === 'agent') { messages.value[i].rating = conv.score || 0; break }
    }
  } else {
    messages.value.push(markRaw({ role: 'user', content: conv.user_input, image: conv.user_image_url || '' }))
    messages.value.push(markRaw({ role: 'agent', content: conv.agent_response || '（无回复）', cid: conv.id, rating: conv.score, items: [] }))
  }
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
  loadScenes()
  loadOutfits()
})
</script>

<style scoped>
.page { height: 100vh; display: flex; flex-direction: column; background: #F7F8FA; overflow: hidden; }

/* 主体 */
.main { flex: 1; overflow: hidden; width: 100%; min-width: 0; box-sizing: border-box; padding-bottom: 136rpx; }
.panel { padding: 24rpx; box-sizing: border-box; width: 100%; }
.panel-head { margin-bottom: 20rpx; position: relative; background: transparent; }
.panel.analysis-panel .panel-head { position: relative; }
.panel.analysis-panel .panel-title { font-weight: 700; font-size: 36rpx; letter-spacing: -.2rpx; }
.panel-head.between { display: flex; justify-content: space-between; align-items: center; }
.panel-title { font-size: 34rpx; font-weight: 600; }

/* 通用按钮 */
.mini-btn { padding: 10rpx 26rpx; background: #fff; border: 1rpx solid #E5E7EB; border-radius: 10rpx; font-size: 24rpx; color: #6B7280; box-shadow: 0 1rpx 2rpx rgba(16,24,40,.04); }
.mini-btn.primary { background: #4F46E5; color: #fff; border-color: #4F46E5; box-shadow: 0 2rpx 8rpx rgba(79,70,229,.22); }
.panel-head .mini-btn { background: #4F46E5; border: none; color: #fff; font-weight: 600; padding: 10rpx 28rpx; border-radius: 10rpx; box-shadow: 0 4rpx 12rpx rgba(79,70,229,.25); }
.big-btn { background: #4F46E5; color: #fff; font-size: 32rpx; text-align: center; padding: 36rpx; border-radius: 16rpx; }
.big-btn.loading { opacity: .7; }

/* 卡片 */
.card-box { background: #fff; border-radius: 20rpx; padding: 26rpx; margin-top: 20rpx; box-shadow: 0 4rpx 18rpx rgba(0,0,0,.05); }
.pre { font-size: 28rpx; line-height: 1.85; white-space: pre-wrap; word-break: break-word; color: #18181B; }
.outfit-img { width: 100%; max-width: 680rpx; margin-top: 20rpx; border-radius: 16rpx; display: block; }
.home-outfit-actions { display: flex; justify-content: center; margin-top: 22rpx; }

/* 场景推荐结果：单品卡片列表 */
.scene-item-list { margin-top: 24rpx; display: flex; flex-direction: column; gap: 18rpx; }
.scene-item-card { display: flex; align-items: center; gap: 22rpx; background: #FFFFFF; border: 1rpx solid #F7F8FA; border-radius: 20rpx; padding: 18rpx 20rpx; box-shadow: 0 4rpx 14rpx rgba(0,0,0,.04); }
.scene-item-img-wrap { width: 130rpx; height: 130rpx; border-radius: 16rpx; background: #fff; overflow: hidden; flex-shrink: 0; display: flex; align-items: center; justify-content: center; border: 1rpx solid #EEF2FF; }
.scene-item-img { width: 100%; height: 100%; display: block; }
.scene-item-placeholder { font-size: 52rpx; color: #C7D2FE; }
.scene-item-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 14rpx; }
.scene-item-name { font-size: 30rpx; font-weight: 600; color: #18181B; line-height: 1.35; }
.scene-item-tags { display: flex; flex-wrap: wrap; gap: 12rpx; }
.scene-item-tag { font-size: 24rpx; color: #6B7280; background: #fff; padding: 6rpx 16rpx; border-radius: 10rpx; border: 1rpx solid #F4F4F5; }
.home-outfit-actions .mini-btn.primary { background: linear-gradient(135deg, #4F46E5, #4F46E5); color: #fff; border: none; padding: 14rpx 32rpx; border-radius: 28rpx; font-weight: 600; box-shadow: 0 6rpx 18rpx rgba(48,49,51,.2); }

/* 首页 */
.weather-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border-radius: 24rpx;
  padding: 30rpx 32rpx;
  color: #18181B;
  margin-bottom: 24rpx;
  box-shadow: 0 8rpx 24rpx rgba(122, 168, 255, .10);
  border: 1rpx solid #EEF2FF;
}
.wx-weather { display: flex; flex-direction: column; }
.wx-temp { font-size: 64rpx; font-weight: 800; line-height: 1; color: #4F46E5; }
.wx-desc { font-size: 28rpx; margin-top: 12rpx; opacity: .95; }
.wx-meta { text-align: right; display: flex; flex-direction: column; gap: 10rpx; }
.wx-city { font-size: 28rpx; font-weight: 600; color: #18181B; }
.wx-city-edit { font-size: 22rpx; font-weight: 400; color: #9CA3AF; margin-left: 6rpx; text-decoration: underline; text-underline-offset: 4rpx; }
.wx-wind { font-size: 24rpx; color: #9CA3AF; }

/* 城市选择弹层 */
.city-picker { width: 82vw; max-width: 620rpx; max-height: 76vh; background: #fff; border-radius: 22rpx; display: flex; flex-direction: column; overflow: hidden; box-sizing: border-box; }
.cp-head { display: flex; align-items: center; justify-content: space-between; padding: 26rpx 28rpx; border-bottom: 1rpx solid #EEF2FF; box-sizing: border-box; }
.cp-title { font-size: 32rpx; font-weight: 700; color: #18181B; }
.cp-close { font-size: 34rpx; color: #9CA3AF; padding: 0 6rpx; }
.cp-tip { font-size: 23rpx; color: #9CA3AF; padding: 18rpx 28rpx 0; line-height: 1.5; box-sizing: border-box; }
.cp-list { flex: 1; min-height: 0; padding: 20rpx 20rpx 28rpx; box-sizing: border-box; }
.cp-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14rpx; }
.cp-item { min-width: 0; text-align: center; font-size: 25rpx; color: #18181B; background: #F7F8FA; border-radius: 12rpx; padding: 18rpx 4rpx; transition: all .15s; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; box-sizing: border-box; }
.cp-item.loc { display: flex; align-items: center; justify-content: center; gap: 6rpx; background: #EEF2FF; color: #4F46E5; font-weight: 600; }
.cp-item:active { opacity: .85; }
.cp-item.active { background: #4F46E5; color: #fff; font-weight: 600; }

/* 对话 */
.head-left { display: flex; align-items: center; }
.menu-btn { font-size: 40rpx; margin-right: 16rpx; padding: 4rpx 8rpx; color: #4F46E5; }
.chat-box { display: flex; flex-direction: column; }
.msg { margin-bottom: 24rpx; }
.msg-img { margin-bottom: 8rpx; }
.chat-img { max-width: 360rpx; border-radius: 12rpx; }
.bubble { max-width: 660rpx; }
.msg-label { font-size: 22rpx; color: #9CA3AF; margin-bottom: 6rpx; display: block; }
.msg-text { font-size: 28rpx; line-height: 1.7; padding: 18rpx 22rpx; border-radius: 16rpx; display: block; white-space: pre-wrap; word-break: break-word; overflow-wrap: break-word; max-width: 100%; box-sizing: border-box; }
.msg-user .msg-text { background: #4F46E5; color: #fff; border-bottom-right-radius: 4rpx; }
.msg-agent .msg-text { background: #F5F3FF; border: 1rpx solid #EDE9FE; border-bottom-left-radius: 4rpx; }
.chat-user-img-wrap { margin-bottom: 12rpx; border-radius: 16rpx; overflow: hidden; max-width: 420rpx; background: #F7F8FA; }
.chat-user-img { width: 100%; display: block; border-radius: 16rpx; }
/* AI 消息气泡里的富文本：让 md 加粗/标题/列表真正生效 */
:deep(.msg-text) p { margin: 8rpx 0; line-height: 1.7; word-break: break-word; overflow-wrap: break-word; white-space: pre-wrap; }
:deep(.msg-text) h1,
:deep(.msg-text) h2,
:deep(.msg-text) h3 { font-weight: 700; color: #18181B; margin: 16rpx 0 10rpx; line-height: 1.4; word-break: break-word; overflow-wrap: break-word; white-space: normal; }
:deep(.msg-text) h1 { font-size: 34rpx; }
:deep(.msg-text) h2 { font-size: 30rpx; }
:deep(.msg-text) h3 { font-size: 28rpx; }
:deep(.msg-text) strong { font-weight: 600; color: #4F46E5; word-break: break-word; overflow-wrap: break-word; white-space: normal; }
/* md2html 列表：用 div 模拟，避免浏览器默认 marker 双圆点 */
:deep(.msg-text) .md-list { margin: 10rpx 0; }
:deep(.msg-text) .md-li,
:deep(.msg-text) .md-oli { position: relative; padding-left: 30rpx; margin: 6rpx 0; word-break: break-word; overflow-wrap: break-word; white-space: normal; }
:deep(.msg-text) .md-dot,
:deep(.msg-text) .md-num { position: absolute; left: 0; top: 0; color: #4F46E5; font-weight: 700; font-size: 28rpx; line-height: 1.7; }
:deep(.msg-text) .md-num { color: #4F46E5; }
.rate-row { margin-top: 12rpx; width: fit-content; display: inline-flex; align-items: center; padding: 10rpx 22rpx; background: #FFFFFF; border: 1rpx solid #EEF2FF; border-radius: 999rpx; }
.rate-hint { font-size: 22rpx; color: #9CA3AF; margin-right: 14rpx; }
.rate-row.done { background: #EEF2FF; border-color: #C7D2FE; }
.rate-row.done .rate-hint { color: #4F46E5; font-weight: 600; }
.rate-stars { display: flex; align-items: center; }
.star { font-size: 30rpx; color: #D1D5DB; margin-right: 4rpx; transition: transform .15s ease, color .15s ease; }
.star.active { color: #F59E0B; }
.star:active { transform: scale(1.3); }
.loading-text { color: #9CA3AF; font-size: 28rpx; }

/* AI 思考冒泡动画 */
.ai-thinking-bubble { display: inline-flex; align-items: center; gap: 16rpx; background: #fff; border: 1rpx solid #F4F4F5; border-bottom-left-radius: 4rpx; border-radius: 16rpx; padding: 18rpx 22rpx; box-shadow: 0 2rpx 8rpx rgba(122,168,255,.06); }
.ai-thinking-label { font-size: 26rpx; color: #6B7280; }
.ai-thinking-dots { display: flex; align-items: center; gap: 8rpx; }
.ai-dot { width: 10rpx; height: 10rpx; border-radius: 50%; background: #4F46E5; animation: aiDotPulse 1.4s ease-in-out infinite; }
.ai-dot:nth-child(2) { animation-delay: 0.2s; }
.ai-dot:nth-child(3) { animation-delay: 0.4s; }
@keyframes aiDotPulse {
  0%, 100% { opacity: 0.3; transform: translateY(0); }
  50% { opacity: 1; transform: translateY(-8rpx); }
}

/* 对话中的推荐单品：白底大卡片容器 + 首页 hero 分组大图（复用 .hero-group/.hero-big-card） */
.chat-outfit { margin-top: 18rpx; max-width: 660rpx; background: #FFFFFF; border: 1rpx solid #F4F4F5; border-radius: 22rpx; padding: 20rpx 20rpx 8rpx; box-shadow: 0 4rpx 14rpx rgba(0,0,0,.04); }
.chat-outfit .hero-group:last-child { margin-bottom: 12rpx; }
.chat-outfit .hero-big-card { width: 220rpx; }
.chat-outfit .hero-big-img-wrap { width: 220rpx; height: 260rpx; }

.chat-input-wrap { background: #F7F8FA; border: 1rpx solid #EEF2FF; border-radius: 16rpx; padding: 12rpx; margin-top: 12rpx; box-shadow: inset 3rpx 3rpx 8rpx rgba(91,141,239,.10), inset -2rpx -2rpx 6rpx rgba(255,255,255,.9); }
.chat-input { display: flex; align-items: center; gap: 12rpx; }
.chat-pending-img { position: relative; display: inline-block; margin-bottom: 12rpx; }
.chat-pending-thumb { width: 120rpx; height: 120rpx; border-radius: 12rpx; object-fit: cover; }
.chat-pending-del { position: absolute; top: -10rpx; right: -10rpx; width: 36rpx; height: 36rpx; background: rgba(45,58,90,.7); color: #fff; border-radius: 50%; font-size: 20rpx; display: flex; align-items: center; justify-content: center; }
.icon-btn { font-size: 40rpx; padding: 0 12rpx; }
.chat-field { flex: 1; font-size: 28rpx; padding: 0 12rpx; }
.send-btn { background: linear-gradient(135deg, #F7F8FA, #EEF2FF); color: #4F46E5; font-size: 26rpx; padding: 14rpx 38rpx; border-radius: 36rpx; font-weight: 600; box-shadow: 6rpx 6rpx 14rpx rgba(91,141,239,.18), -4rpx -4rpx 10rpx rgba(255,255,255,.9), inset 0 1rpx 0 rgba(255,255,255,.6); transition: all .2s ease; }
.send-btn:active { box-shadow: inset 4rpx 4rpx 8rpx rgba(0,0,0,.08), inset -2rpx -2rpx 6rpx rgba(255,255,255,.8); transform: scale(0.96); color: #4b7fe0; }

/* 衣橱（旧版 chip/grid/card 保留给搭配多选用）*/
.filter-bar { white-space: nowrap; margin-bottom: 20rpx; }
.chip { display: inline-block; padding: 8rpx 22rpx; background: #fff; border: 1rpx solid #F4F4F5; border-radius: 30rpx; font-size: 24rpx; color: #6B7280; margin-right: 12rpx; }
.chip.active { background: #4F46E5; color: #fff; border-color: #4F46E5; }

/* ===== 衣橱：DPSTAR 风格 ===== */
.wh-page { padding-bottom: 20rpx; }

/* 顶部横幅 */
.wh-banner { position: relative; height: 220rpx; border-radius: 20rpx; overflow: hidden; margin-bottom: 24rpx; background: linear-gradient(135deg, #4F46E5, #4F46E5); }
.wh-banner-bg { position: absolute; inset: 0; opacity: .35; }
.wh-banner-img { width: 100%; height: 100%; object-fit: cover; }
.wh-banner-info { position: relative; z-index: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100%; padding: 28rpx; }
.wh-banner-title { font-size: 34rpx; font-weight: 700; color: #fff; letter-spacing: 2rpx; margin-bottom: 10rpx; }
.wh-banner-stats { font-size: 23rpx; color: rgba(255,255,255,.8); }

/* 款式分析 / 利用率 */
.wh-insight { display: flex; align-items: center; gap: 22rpx; background: #fff; border: 1rpx solid #F4F4F5; border-radius: 18rpx; padding: 24rpx 26rpx; margin-bottom: 24rpx; box-shadow: 0 2rpx 12rpx rgba(0,0,0,.04); }
.wi-ring { width: 132rpx; height: 132rpx; border-radius: 50%; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
.wi-ring-in { width: 100rpx; height: 100rpx; border-radius: 50%; background: #fff; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.wi-ring-num { font-size: 38rpx; font-weight: 700; color: #18181B; line-height: 1.1; }
.wi-ring-lbl { font-size: 20rpx; color: #9CA3AF; }
.wi-metrics { flex: 1; display: flex; justify-content: space-around; }
.wi-m { display: flex; flex-direction: column; align-items: center; }
.wi-m-num { font-size: 36rpx; font-weight: 700; color: #18181B; }
.wi-m-lbl { font-size: 20rpx; color: #9CA3AF; margin-top: 4rpx; }
.wi-top { display: flex; flex-direction: column; align-items: flex-end; max-width: 150rpx; }
.wi-top-lbl { font-size: 20rpx; color: #9CA3AF; margin-bottom: 6rpx; }
.wi-top-name { font-size: 24rpx; font-weight: 600; color: #18181B; text-align: right; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 150rpx; }

/* 录入入口 */
.wh-upload-entry { display: flex; align-items: center; gap: 14rpx; background: #fff; border: 2rpx dashed #E5E7EB; border-radius: 16rpx; padding: 26rpx 28rpx; margin-bottom: 24rpx; }
.wh-upload-entry:active { background: #F7F8FA; border-color: #9CA3AF; }
.wh-up-ico { font-size: 38rpx; }
.wh-up-text { font-size: 27rpx; color: #18181B; font-weight: 500; }

/* 衣橱页头部 */
.wh-page-head { display: flex; align-items: baseline; gap: 16rpx; margin-bottom: 24rpx; }
.wh-page-title { font-size: 40rpx; font-weight: 700; color: #18181B; }
.wh-page-count { font-size: 24rpx; color: #9CA3AF; }

/* 搜索栏 */
.wh-search-bar { display: flex; align-items: center; gap: 16rpx; background: #fff; border-radius: 32rpx; padding: 20rpx 26rpx; margin-bottom: 22rpx; box-shadow: 0 4rpx 16rpx rgba(122, 168, 255, .08); border: 1rpx solid #EEF2FF; }
.wh-search-ico { font-size: 30rpx; color: #9CA3AF; }
.wh-search-input { flex: 1; font-size: 26rpx; color: #18181B; }

/* 筛选行 */
.wh-filter-row { display: flex; align-items: center; gap: 16rpx; margin-bottom: 20rpx; }
.wh-filter-label { font-size: 24rpx; color: #9CA3AF; flex-shrink: 0; }
.wh-filter-scroll { flex: 1; white-space: nowrap; overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none; }
.wh-filter-pill { display: inline-block; padding: 10rpx 26rpx; background: #F7F8FA; border-radius: 30rpx; font-size: 25rpx; color: #6B7280; margin-right: 14rpx; transition: all .2s; }
.wh-filter-pill.active { background: #4F46E5; color: #fff; font-weight: 600; }

/* 旧品类筛选（保留兼容） */
.wh-cat-tabs { flex: 1; white-space: nowrap; }
.wh-cat-tab { display: inline-block; padding: 10rpx 26rpx; background: #F7F8FA; border-radius: 30rpx; font-size: 25rpx; color: #6B7280; margin-right: 14rpx; transition: all .2s; }
.wh-cat-tab.active { background: #4F46E5; color: #fff; font-weight: 600; }
.wh-cat-n { font-weight: 400; opacity: .75; font-size: 22rpx; }

/* 分类区块大图 */
.wh-group { margin-bottom: 32rpx; }
.wh-group-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18rpx; padding: 0 4rpx; }
.wh-group-title { font-size: 34rpx; font-weight: 700; color: #18181B; }
.wh-group-count { font-size: 24rpx; color: #9CA3AF; background: #F7F8FA; border-radius: 20rpx; padding: 4rpx 16rpx; }
.wh-group-scroll { width: 100%; white-space: nowrap; overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none; }
.wh-group-list { display: inline-flex; gap: 20rpx; padding-right: 24rpx; }
.wh-big-card { width: 220rpx; background: #fff; border-radius: 20rpx; overflow: hidden; box-shadow: 0 4rpx 16rpx rgba(0,0,0,.06); flex-shrink: 0; }
.wh-big-card:active { transform: scale(.98); }
.wh-big-img-wrap { width: 220rpx; height: 260rpx; background: #FFFFFF; display: flex; align-items: center; justify-content: center; overflow: hidden; }
.wh-big-img { width: 100%; height: 100%; background-size: contain; background-position: center center; background-repeat: no-repeat; }
.wh-big-ph { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 64rpx; color: rgba(255,255,255,.75); font-weight: 700; }
.wh-big-info { display: flex; align-items: center; justify-content: space-between; padding: 16rpx 18rpx; }
.wh-big-name { flex: 1; font-size: 25rpx; color: #18181B; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.wh-big-del { width: 42rpx; height: 42rpx; display: flex; align-items: center; justify-content: center; color: #EF4444; font-size: 28rpx; flex-shrink: 0; }

/* 卡片网格 */
.wh-grid { display: flex; flex-wrap: wrap; gap: 18rpx; }
.wh-card { width: calc(33.33% - 12rpx); background: #fff; border-radius: 14rpx; overflow: hidden; box-shadow: 0 2rpx 12rpx rgba(0,0,0,.06); position: relative; }
.wh-card-img-wrap { height: 220rpx; background: #F7F8FA; display: flex; align-items: center; justify-content: center; }
.wh-card-img { width: 100%; height: 100%; object-fit: contain; }
.wh-card-ph { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }
.wh-card-ph-txt { font-size: 48rpx; color: rgba(255,255,255,.7); font-weight: 700; }
.wh-card-name { display: block; text-align: center; font-size: 23rpx; color: #18181B; padding: 12rpx 8rpx 16rpx; line-height: 1.3; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.wh-card-del { position: absolute; top: 6rpx; right: 6rpx; width: 40rpx; height: 40rpx; background: rgba(0,0,0,.5); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 22rpx; line-height: 1; color: #fff; z-index: 2; }

/* 衣物详情弹窗 */
.wh-detail { width: 86vw; max-width: 640rpx; max-height: 84vh; background: #fff; border-radius: 20rpx; display: flex; flex-direction: column; overflow: hidden; }
.wh-detail-scroll { max-height: 64vh; }
.wh-detail-img-wrap { width: 100%; height: 360rpx; background: #F7F8FA; display: flex; align-items: center; justify-content: center; }
.wh-detail-img { width: 100%; height: 100%; background-size: contain; background-position: center center; background-repeat: no-repeat; }
.wh-detail-ph { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }
.wh-detail-ph-txt { font-size: 90rpx; color: rgba(255,255,255,.75); font-weight: 700; }
.wh-detail-fields { padding: 8rpx 28rpx 12rpx; }
.wh-df { display: flex; align-items: center; padding: 18rpx 0; border-bottom: 1rpx solid #f1e9dd; }
.wh-df-k { width: 170rpx; font-size: 26rpx; color: #9CA3AF; flex-shrink: 0; }
.wh-df-v { flex: 1; font-size: 28rpx; color: #18181B; word-break: break-all; }
.wh-df-col { align-items: flex-start; }
.wh-wear-dates { flex: 1; display: flex; flex-wrap: wrap; gap: 10rpx; }
.wh-wear-chip { display: inline-flex; align-items: center; gap: 6rpx; font-size: 23rpx; color: #4F46E5; background: #EEF2FF; border-radius: 8rpx; padding: 4rpx 8rpx 4rpx 12rpx; margin-right: 10rpx; margin-bottom: 8rpx; }
.wh-wear-del { color: #EF4444; font-size: 26rpx; padding: 0 4rpx; }

/* 标记穿过面板 */
.wh-mark-worn { margin-top: 18rpx; padding: 22rpx; background: #ffffff; border-radius: 14rpx; border: 1rpx solid #FFFFFF; }
.wh-mw-label { font-size: 26rpx; color: #6B7280; }
.wh-mw-picker { margin: 16rpx 0; height: 76rpx; line-height: 76rpx; background: #fff; border: 1rpx solid #F4F4F5; border-radius: 12rpx; padding: 0 20rpx; }
.wh-mw-pick-val { font-size: 28rpx; color: #18181B; }
.wh-mw-actions { display: flex; gap: 16rpx; }
.wh-mw-btn { flex: 1; height: 76rpx; line-height: 76rpx; text-align: center; border-radius: 12rpx; font-size: 28rpx; }
.wh-mw-btn.cancel { background: #F7F8FA; color: #6B7280; }
.wh-mw-btn.save { background: #4F46E5; color: #fff; }

/* 空状态 */
.wh-empty { width: 100%; display: flex; flex-direction: column; align-items: center; padding: 100rpx 0 40rpx; gap: 20rpx; }
.wh-empty-ico {
  font-size: 96rpx;
  color: #A5B4FC;
  opacity: .82;
  animation: whEmptyBreath 3s ease-in-out infinite;
}
@keyframes whEmptyBreath {
  0%, 100% { transform: scale(1); opacity: .82; }
  50%      { transform: scale(1.06); opacity: 1; }
}
.wh-empty-text { font-size: 27rpx; color: #9CA3AF; }
.grid { display: flex; flex-wrap: wrap; gap: 16rpx; }
.card { width: calc(50% - 8rpx); background: #fff; border-radius: 12rpx; overflow: hidden; border: 1rpx solid #EEF2FF; }
.card-img { height: 240rpx; background: #F4F4F5; display: flex; align-items: center; justify-content: center; }
.full-img { width: 100%; height: 100%; }
.ph { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 60rpx; color: #fff; }
.card-info { padding: 14rpx 16rpx; }
.card-name { font-size: 26rpx; font-weight: 500; display: block; margin-bottom: 8rpx; }
.card-meta { font-size: 20rpx; color: #9CA3AF; margin-top: 8rpx; display: block; }
.card-meta.idle { color: #EF4444; font-weight: 600; }
.tags { display: flex; flex-wrap: wrap; gap: 6rpx; }

/* 自主搭配 */
.panel-sub { font-size: 22rpx; color: #9CA3AF; margin-right: 12rpx; }
/* 工作台功能网格（DPSTAR 风格：圆角方块图标） */
.wb-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 28rpx 20rpx; padding: 8rpx 0; }
.wb-tile { display: flex; flex-direction: column; align-items: center; gap: 14rpx; position: relative; }
.wb-icon-wrap { width: 112rpx; height: 112rpx; border-radius: 28rpx; background: linear-gradient(135deg, #4F46E5, #4F46E5); display: flex; align-items: center; justify-content: center; transition: transform .15s; }

.wb-ico { font-size: 52rpx; line-height: 1; }
.wb-label { font-size: 25rpx; color: #18181B; font-weight: 500; white-space: nowrap; }
.wb-single { display: flex; align-items: center; gap: 24rpx; background: #fff; border-radius: 20rpx; padding: 24rpx 28rpx; box-shadow: 0 4rpx 16rpx rgba(0,0,0,.05); }
.wb-single:active { opacity: .85; }

/* 场景快捷推荐 */
.wb-scenes { background: #fff; border-radius: 20rpx; padding: 24rpx 24rpx 10rpx; margin-top: 24rpx; box-shadow: 0 4rpx 16rpx rgba(0,0,0,.05); }
.wb-scenes-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18rpx; }
.wb-scenes-title { font-size: 30rpx; font-weight: 700; color: #18181B; }
.wb-scenes-loading { font-size: 24rpx; color: #4F46E5; }
.scene-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 18rpx; }
.scene-chip { display: flex; align-items: center; gap: 18rpx; padding: 22rpx 20rpx; border-radius: 16rpx; color: #fff; position: relative; overflow: hidden; }
.scene-chip::before { content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(135deg, rgba(255,255,255,.12), rgba(255,255,255,0)); pointer-events: none; }

.scene-ico { font-size: 46rpx; line-height: 1; z-index: 1; }
.scene-label { font-size: 28rpx; font-weight: 600; z-index: 1; }
.scene-chip[data-key='commute'], .scene-chip:nth-child(1) { background: linear-gradient(135deg, #4F46E5, #4F46E5); }
.scene-chip[data-key='date'], .scene-chip:nth-child(2) { background: linear-gradient(135deg, #4F46E5, #4F46E5); }
.scene-chip[data-key='sport'], .scene-chip:nth-child(3) { background: linear-gradient(135deg, #4F46E5, #4F46E5); }
.scene-chip[data-key='wedding'], .scene-chip:nth-child(4) { background: linear-gradient(135deg, #4F46E5, #4F46E5); }
.scene-chip[data-key='party'], .scene-chip:nth-child(5) { background: linear-gradient(135deg, #4F46E5, #4F46E5); }
.scene-chip[data-key='travel'], .scene-chip:nth-child(6) { background: linear-gradient(135deg, #4F46E5, #4F46E5); }
.scene-chip[data-key='interview'], .scene-chip:nth-child(7) { background: linear-gradient(135deg, #4F46E5, #4F46E5); }
.wb-single-icon { width: 96rpx; height: 96rpx; border-radius: 24rpx; background: linear-gradient(135deg, #4F46E5, #4F46E5); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.wb-single-icon .wb-ico { font-size: 48rpx; }
.wb-single-text { flex: 1; display: flex; flex-direction: column; gap: 8rpx; }
.wb-single-title { font-size: 30rpx; color: #18181B; font-weight: 600; }
.wb-single-sub { font-size: 24rpx; color: #9CA3AF; }
.wb-single-arrow { font-size: 40rpx; color: #E5E7EB; }
.wb-badge { position: absolute; top: 0; right: 12rpx; min-width: 32rpx; height: 32rpx; line-height: 32rpx; text-align: center; background: #EF4444; color: #fff; font-size: 20rpx; border-radius: 16rpx; padding: 0 8rpx; box-shadow: 0 3rpx 8rpx rgba(255,158,142,.35); }
.back-btn { font-size: 30rpx; color: #4F46E5; margin-right: 16rpx; }
.card.pick { position: relative; transition: all .15s; }
.card.pick.picked { border-color: #4F46E5; box-shadow: 0 0 0 3rpx rgba(64,158,255,.25); }
.pick-badge { position: absolute; top: 10rpx; right: 10rpx; width: 40rpx; height: 40rpx; border-radius: 50%; background: #4F46E5; color: #fff; font-size: 24rpx; display: flex; align-items: center; justify-content: center; }
.outfit-bar { position: sticky; bottom: 0; display: flex; align-items: center; justify-content: space-between; background: #fff; border-top: 1rpx solid #F4F4F5; padding: 16rpx 20rpx; margin: 16rpx -24rpx -24rpx; }
.ob-count { font-size: 26rpx; color: #6B7280; }
.ob-num { color: #4F46E5; font-weight: 700; font-size: 30rpx; }
.ob-status { color: #9CA3AF; font-size: 24rpx; }
.ob-clear { font-size: 26rpx; color: #EF4444; padding: 8rpx 16rpx; }
.ob-actions { display: flex; align-items: center; gap: 12rpx; }
.ob-wear-btn { padding: 10rpx 22rpx; background: linear-gradient(135deg, #4F46E5, #4F46E5); color: #fff; border-radius: 14rpx; font-size: 24rpx; font-weight: 600; box-shadow: 4rpx 4rpx 10rpx rgba(91,141,239,.22); }
.home-outfit-actions { display: flex; justify-content: center; margin-top: 16rpx; }
.review-card { background: #fff; border: 1rpx solid #F4F4F5; border-radius: 16rpx; padding: 24rpx; margin-top: 20rpx; }
.review-top { display: flex; align-items: center; gap: 28rpx; }
.score-ring { width: 140rpx; height: 140rpx; border-radius: 50%; display: flex; align-items: center; justify-content: center; position: relative; flex-shrink: 0; }
.score-num { font-size: 52rpx; font-weight: 800; color: #18181B; }
.score-cap { font-size: 22rpx; color: #9CA3AF; margin-top: 16rpx; }
.review-verdict { display: flex; flex-direction: column; gap: 12rpx; }
.rv-label { font-size: 24rpx; color: #9CA3AF; }
.rv-tag { align-self: flex-start; padding: 8rpx 24rpx; border-radius: 30rpx; color: #fff; font-size: 28rpx; font-weight: 600; }
.review-img { width: 100%; margin: 20rpx 0; border-radius: 12rpx; }
.rv-block { margin-top: 18rpx; }
.rv-h { font-size: 26rpx; font-weight: 600; color: #18181B; display: block; margin-bottom: 6rpx; }
.rv-c { font-size: 25rpx; color: #6B7280; line-height: 1.7; white-space: pre-wrap; word-break: break-word; overflow-wrap: break-word; max-width: 100%; box-sizing: border-box; }
:deep(.rv-c) p { margin: 6rpx 0; line-height: 1.7; white-space: pre-wrap; word-break: break-word; overflow-wrap: break-word; }
:deep(.rv-c) strong { font-weight: 600; color: #4F46E5; word-break: break-word; overflow-wrap: break-word; white-space: normal; }
:deep(.rv-c) h3 { font-size: 26rpx; font-weight: 700; color: #18181B; margin: 12rpx 0 6rpx; word-break: break-word; overflow-wrap: break-word; white-space: normal; }
:deep(.rv-c) .md-list { margin: 8rpx 0; }
:deep(.rv-c) .md-li,
:deep(.rv-c) .md-oli { position: relative; padding-left: 28rpx; margin: 4rpx 0; word-break: break-word; overflow-wrap: break-word; white-space: normal; }
:deep(.rv-c) .md-dot,
:deep(.rv-c) .md-num { position: absolute; left: 0; top: 0; color: #4F46E5; font-weight: 700; }
:deep(.rv-c) .md-num { color: #4F46E5; }
.review-actions { margin-top: 20rpx; display: flex; justify-content: flex-end; }
.tag { font-size: 20rpx; padding: 4rpx 12rpx; background: #EEF2FF; color: #4F46E5; border-radius: 6rpx; margin-right: 6rpx; }
.tag.ok { background: #EEF2FF; color: #4F46E5; }
.tag.warn { background: #FEF3C7; color: #B45309; }
.tag.danger { background: #FEE2E2; color: #DC2626; }
.tag.info { background: #F4F4F5; color: #6B7280; }
.card-act { padding: 12rpx 16rpx; border-top: 1rpx solid #F4F4F5; display: flex; justify-content: flex-end; gap: 24rpx; }
.link { font-size: 24rpx; color: #4F46E5; }
.link.danger { color: #EF4444; }
.empty { text-align: center; color: #9CA3AF; font-size: 26rpx; padding: 60rpx 0; }
.empty-tip { color: #9CA3AF; font-size: 24rpx; display: block; margin: 8rpx 0; }
.sug { font-size: 26rpx; line-height: 1.8; display: block; color: #6B7280; }

/* 上传 */
.upload-area { border: 2rpx dashed #E5E7EB; border-radius: 16rpx; padding: 60rpx; text-align: center; background: #ffffff; }
.up-icon { font-size: 80rpx; color: #4F46E5; display: block; }
.up-tip { font-size: 28rpx; color: #6B7280; display: block; margin-top: 16rpx; }
.up-sub { font-size: 22rpx; color: #9CA3AF; display: block; margin-top: 8rpx; }
.upload-result { margin-top: 24rpx; text-align: center; }
.result-img { max-width: 400rpx; border-radius: 12rpx; }
.detecting { text-align: center; padding: 40rpx; color: #9CA3AF; font-size: 26rpx; }

/* 表单 */
.form { margin-top: 20rpx; background: #fff; border-radius: 12rpx; padding: 20rpx; }
.form-row { display: flex; align-items: center; padding: 14rpx 0; border-bottom: 1rpx solid #F4F4F5; }
.form-label { width: 120rpx; font-size: 26rpx; color: #6B7280; }
.form-input { flex: 1; font-size: 26rpx; padding: 8rpx 12rpx; background: #f8f8f8; border-radius: 8rpx; }
.form-picker { flex: 1; font-size: 26rpx; padding: 8rpx 12rpx; background: #f8f8f8; border-radius: 8rpx; }
.form-foot, .dialog-foot { display: flex; justify-content: flex-end; gap: 16rpx; margin-top: 24rpx; }

/* 分析（高级版）— 衣橱健康度卡已删除 */
.card-box.analysis-wrap { background: transparent; box-shadow: none; padding: 0; margin-top: 0; }

/* 每个数据区块：白底 + 细描边 + 克制阴影，区块之间用发丝线分隔 */
.block {
  margin-bottom: 24rpx; padding: 28rpx 26rpx;
  background: #fff; border: 1rpx solid #F4F4F5; border-radius: 16rpx;
  box-shadow: 0 1rpx 3rpx rgba(16,24,40,.04);
}
.block:last-child { margin-bottom: 0; }
.block-title { font-size: 28rpx; font-weight: 600; color: #18181B; display: block; margin-bottom: 20rpx; letter-spacing: .2rpx; }

/* 穿搭回顾面板 */
.wh-day-lookup { margin: 20rpx 0 8rpx; background: #fff; border-radius: 16rpx; padding: 20rpx 22rpx; box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.04); }
.wh-dl-head { display: flex; align-items: center; justify-content: space-between; }
.wh-dl-title { font-size: 27rpx; color: #18181B; font-weight: 600; }
.wh-dl-arrow { font-size: 25rpx; color: #9CA3AF; }
.wh-dl-body { margin-top: 18rpx; }
.wh-dl-picker { height: 76rpx; line-height: 76rpx; background: #F7F8FA; border: 1rpx solid #F4F4F5; border-radius: 12rpx; padding: 0 20rpx; margin-bottom: 16rpx; }
.wh-dl-pick-val { font-size: 28rpx; color: #18181B; }
.wh-dl-items { display: flex; flex-wrap: wrap; gap: 14rpx; }
.wh-dl-chip { background: #EEF2FF; color: #4F46E5; font-size: 25rpx; border-radius: 10rpx; padding: 12rpx 20rpx; }
.wh-dl-empty { font-size: 25rpx; color: #9CA3AF; }


/* 我的套装样式已迁至 closet-*（独立 view） */

.donut-row { display: flex; align-items: center; gap: 28rpx; }
.donut { width: 190rpx; height: 190rpx; border-radius: 50%; flex-shrink: 0; position: relative;
  box-shadow: 0 1rpx 4rpx rgba(16,24,40,.06); }
.donut-hole { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%);
  width: 130rpx; height: 130rpx; border-radius: 50%; background: #fff; display: flex; flex-direction: column;
  align-items: center; justify-content: center; }
.donut-num { font-size: 42rpx; font-weight: 800; color: #18181B; line-height: 1; }
.donut-unit { font-size: 20rpx; color: #6B7280; margin-top: 4rpx; }
.legend { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 16rpx; }
.legend-item { display: flex; align-items: center; gap: 10rpx; }
.legend-name { font-size: 25rpx; color: #18181B; flex-shrink: 0; }
/* 图例迷你占比条：让分布一眼可读，商业仪表盘常用做法 */
.legend-track { flex: 1; min-width: 48rpx; height: 8rpx; border-radius: 4rpx; background: #F4F4F5; overflow: hidden; }
.legend-fill { height: 100%; border-radius: 4rpx; }
.legend-val { font-size: 22rpx; color: #6B7280; flex-shrink: 0; font-variant-numeric: tabular-nums; }

.stack-bar { display: flex; height: 20rpx; border-radius: 4rpx; overflow: hidden; background: #F4F4F5; }
.stack-seg { height: 100%; }
.stack-legend { display: flex; flex-wrap: wrap; gap: 20rpx; margin-top: 16rpx; }
.stack-leg { display: flex; align-items: center; gap: 10rpx; }
.stack-leg-t { font-size: 24rpx; color: #6B7280; }
/* 季节 / 品类共用图例点：细描边白环，浅色块在卡片上也能看清 */
.legend-dot { width: 20rpx; height: 20rpx; border-radius: 50%; flex-shrink: 0; box-shadow: 0 0 0 2rpx #fff, 0 0 0 3rpx #F4F4F5; }

.color-wrap { display: flex; flex-wrap: wrap; gap: 16rpx; }
.color-chip {
  display: flex; align-items: center; gap: 10rpx;
  background: #fff; border: 1rpx solid #F4F4F5; border-radius: 10rpx;
  padding: 10rpx 18rpx;
}
.color-dot { width: 22rpx; height: 22rpx; border-radius: 50%; border: 1rpx solid #E5E7EB; }
.color-name { font-size: 24rpx; color: #18181B; }
.color-cnt { font-size: 22rpx; color: #9CA3AF; }

.tag-list { display: flex; flex-wrap: wrap; gap: 12rpx; }

.sug-list { display: flex; flex-direction: column; gap: 12rpx; }
.sug-item { display: flex; gap: 12rpx; background: #F7F8FA; border: 1rpx solid #F4F4F5; border-radius: 14rpx; padding: 18rpx 20rpx; }
.sug-bullet { color: #4F46E5; font-size: 24rpx; flex-shrink: 0; }
.sug-text { font-size: 25rpx; color: #374151; line-height: 1.6; flex: 1; }
.shop { display: flex; align-items: center; gap: 16rpx; }
.card-box.shop { background: #F7F8FA; border: 1rpx solid #F4F4F5; border-radius: 12rpx; box-shadow: none; margin-top: 12rpx; padding: 18rpx 20rpx; }
.shop-row { display: flex; align-items: center; flex-wrap: wrap; gap: 14rpx; }
.shop-reason { font-size: 27rpx; color: #18181B; line-height: 1.5; flex: 1; min-width: 0; }

/* 历史侧边抽屉 */
.drawer-wrap { position: fixed !important; top: 0; left: 0; right: 0; bottom: 0; z-index: 200; overflow: hidden; }
.history-drawer {
  position: absolute !important; top: 0; left: 0;
  width: 75vw; max-width: 560rpx; height: 100%;
  background: #fff;
  display: flex; flex-direction: column;
  transform: translateX(-100%);

  box-shadow: 6rpx 0 30rpx rgba(0,0,0,.15);
  box-sizing: border-box;
}
.history-drawer.open { transform: translateX(0); }
.drawer-mask { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,.35); }

/* 通知抽屉（右侧滑出）—— 风格对齐对话历史抽屉 */
.notify-drawer {
  position: absolute !important; top: 0; right: 0;
  width: 75vw; max-width: 560rpx; height: 100%;
  background: #fff;
  display: flex; flex-direction: column;
  transform: translateX(100%);
  box-shadow: -6rpx 0 30rpx rgba(0,0,0,.15);
  box-sizing: border-box;
}
.notify-drawer.open { transform: translateX(0); }
.drawer-noti {
  background: #F7F8FA;
  padding: 20rpx 22rpx;
  margin-bottom: 16rpx;
  border-radius: 12rpx;
  border: 1rpx solid #FFFFFF;
  width: 100%;
  box-sizing: border-box;
}
.drawer-noti.unread { background: #EEF2FF; border-color: #F4F4F5; }
.drawer-noti .noti-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10rpx; }
/* 通知中心：三色系统 + 拟物 + 组件级动效 */
.drawer-noti {
  background: #fff;
  border: 1rpx solid #F3F4F6;
  border-radius: 24rpx;
  padding: 22rpx 24rpx;
  margin-top: 18rpx;
  box-shadow: 0 4rpx 12rpx rgba(122, 168, 255, .06);
  transition: all .25s cubic-bezier(0.22, 1, 0.36, 1);
  position: relative;
  overflow: hidden;
}
/* 未读左侧色条：用对应 tag 色渐隐竖条（跟 tag 色一致） */
.drawer-noti::before {
  content: '';
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 8rpx;
  background: var(--noti-accent, #4F46E5);
  border-radius: 24rpx 0 0 24rpx;
  opacity: 0;
  transition: opacity .25s ease;
}
.drawer-noti.unread::before { opacity: 1; }
.drawer-noti.t-monthly_report { --noti-accent: #4F46E5; }
.drawer-noti.t-trend_push    { --noti-accent: #818CF8; }
.drawer-noti.t-default       { --noti-accent: #EF4444; }
.drawer-noti:active {
  transform: scale(.98);
  box-shadow: 0 2rpx 6rpx rgba(122, 168, 255, .08);
}

.noti-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10rpx; }
/* 标签 chip：拟物+色分化（默认珊瑚 / 月报浅蓝 / 热点淡薰衣草） */
.noti-tag {
  font-size: 20rpx;
  padding: 4rpx 14rpx;
  border-radius: 20rpx;
  color: #fff;
  background: #EF4444;            /* 默认：珊瑚 CTA */
  font-weight: 600;
  letter-spacing: .5rpx;
  box-shadow:
    inset 0 1rpx 0 rgba(255, 255, 255, .25),
    0 1rpx 2rpx rgba(0, 0, 0, .04);
  transition: filter .2s ease;
}
.noti-tag:active { filter: brightness(.92); }
/* 衣橱月报：浅蓝色系 */
.noti-tag.t-monthly_report {
  background: #4F46E5;
}
/* 穿搭热点：淡薰衣草系 */
.noti-tag.t-trend_push {
  background: #818CF8;
}
.noti-time { font-size: 20rpx; color: #9CA3AF; }
.noti-title {
  font-size: 29rpx;
  font-weight: 700;
  display: block;
  margin: 6rpx 0 10rpx;
  color: #18181B;
  letter-spacing: .3rpx;
}
.noti-content {
  font-size: 25rpx;
  line-height: 1.7;
  color: #6B7280;
  white-space: pre-wrap;
  word-break: break-word;
  display: block;
}
.noti-img {
  width: 100%;
  max-width: 600rpx;
  margin-top: 16rpx;
  border-radius: 12rpx;
}

/* drawer-head 标题 + "全部已读" 按钮：拟物珊瑚胶囊 */
.drawer-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28rpx 28rpx 24rpx;
  border-bottom: 1rpx solid #F3F4F6;
}
.drawer-title {
  font-size: 36rpx;
  font-weight: 800;
  color: #18181B;
  letter-spacing: 1rpx;
}
.drawer-new {
  padding: 12rpx 24rpx;
  background: #FEE2E2;
  color: #DC2626;
  border-radius: 28rpx;
  font-size: 24rpx;
  font-weight: 700;
  box-shadow:
    0 4rpx 12rpx rgba(255, 158, 142, .18),
    inset 0 1rpx 0 rgba(255, 255, 255, .6);
  transition: all .22s cubic-bezier(0.22, 1, 0.36, 1);
}
.drawer-new:active {
  background: #EF4444;
  color: #fff;
  transform: scale(.95);
  box-shadow: inset 3rpx 3rpx 8rpx rgba(48, 49, 51, .10);
}
.drawer-noti .noti-content { font-size: 24rpx; color: #6B7280; line-height: 1.5; display: block; }
.drawer-noti .noti-img { margin-top: 14rpx; border-radius: 12rpx; width: 100%; }

.drawer-list { flex: 1; height: 0; min-height: 0; width: 100%; padding: 16rpx 20rpx; box-sizing: border-box; }
.drawer-item { background: #F7F8FA; padding: 20rpx 22rpx; margin-bottom: 16rpx; border-radius: 12rpx; border: 1rpx solid #FFFFFF; width: 100%; box-sizing: border-box; display: flex; align-items: flex-start; }
.drawer-item:active { background: #EEF2FF; }
.di-main { flex: 1; min-width: 0; overflow: hidden; }
.di-del { padding: 4rpx 14rpx; margin-left: 12rpx; font-size: 34rpx; color: #E5E7EB; flex-shrink: 0; }
.di-del:active { color: #EF4444; }
.di-q { font-weight: 500; font-size: 28rpx; color: #18181B; display: block; margin-bottom: 8rpx; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%; }
.di-turn { display: inline-block; font-size: 20rpx; color: #4F46E5; background: #EEF2FF; padding: 2rpx 10rpx; border-radius: 10rpx; margin-left: 10rpx; font-weight: normal; vertical-align: middle; }
.di-a { display: none; }
.di-time { font-size: 22rpx; color: #9CA3AF; display: block; }
.drawer-empty { text-align: center; color: #9CA3AF; font-size: 26rpx; padding-top: 80rpx; }

/* 抽屉动效增强：mask 淡入、抽屉弹性滑出、列表项错落进入 */
.drawer-mask { opacity: 0; transition: opacity .28s ease; }
.drawer-mask.open { opacity: 1; }
.history-drawer, .notify-drawer { transition: transform .32s cubic-bezier(0.22, 1, 0.36, 1), box-shadow .32s ease; }
.history-drawer.open .drawer-head,
.notify-drawer.open .drawer-head { animation: drawerHeadIn .28s ease .1s both; }
.history-drawer.open .drawer-item { animation: drawerItemIn .3s cubic-bezier(0.22, 1, 0.36, 1) both; }
.notify-drawer.open .drawer-noti { animation: drawerNotiIn .3s cubic-bezier(0.22, 1, 0.36, 1) both; }
.history-drawer.open .drawer-item:nth-child(1),
.notify-drawer.open .drawer-noti:nth-child(1) { animation-delay: .06s; }
.history-drawer.open .drawer-item:nth-child(2),
.notify-drawer.open .drawer-noti:nth-child(2) { animation-delay: .12s; }
.history-drawer.open .drawer-item:nth-child(3),
.notify-drawer.open .drawer-noti:nth-child(3) { animation-delay: .18s; }
.history-drawer.open .drawer-item:nth-child(4),
.notify-drawer.open .drawer-noti:nth-child(4) { animation-delay: .24s; }
.history-drawer.open .drawer-item:nth-child(5),
.notify-drawer.open .drawer-noti:nth-child(5) { animation-delay: .30s; }
.history-drawer.open .drawer-item:nth-child(6),
.notify-drawer.open .drawer-noti:nth-child(6) { animation-delay: .36s; }
.history-drawer.open .drawer-item:nth-child(7),
.notify-drawer.open .drawer-noti:nth-child(7) { animation-delay: .42s; }
.history-drawer.open .drawer-item:nth-child(8),
.notify-drawer.open .drawer-noti:nth-child(8) { animation-delay: .48s; }
.history-drawer.open .drawer-item:nth-child(9),
.notify-drawer.open .drawer-noti:nth-child(9) { animation-delay: .54s; }
.history-drawer.open .drawer-item:nth-child(10),
.notify-drawer.open .drawer-noti:nth-child(10) { animation-delay: .60s; }
@keyframes drawerHeadIn { from { opacity: 0; transform: translateY(-16rpx); } to { opacity: 1; transform: translateY(0); } }
@keyframes drawerItemIn { from { opacity: 0; transform: translateX(-30rpx); } to { opacity: 1; transform: translateX(0); } }
@keyframes drawerNotiIn { from { opacity: 0; transform: translateX(30rpx); } to { opacity: 1; transform: translateX(0); } }

/* ===== 个人中心：冷色渐变 hero + 三列数据 + 3 行线性菜单（衣橱/套装/通知） ===== */

/* --- 全宽顶部区：纯色浅蓝（用户要求：不要渐变） --- */
.me-hero {
  position: relative; overflow: hidden;
  margin: -24rpx -24rpx 20rpx;
  padding: 0 40rpx 36rpx;
  border-radius: 0 0 40rpx 40rpx;
  background: #E8F2FB;
  animation: meHeroIn .5s cubic-bezier(0.22, 1, 0.36, 1) both;
}
@keyframes meHeroIn { from { opacity: 0; transform: translateY(20rpx); } to { opacity: 1; transform: translateY(0); } }
.me-hero-bg {
  position: absolute; top: -80rpx; left: -40rpx;
  width: 320rpx; height: 320rpx; border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 255, 255, .55), rgba(255, 255, 255, 0) 65%);
  animation: meHeroFloat 6s ease-in-out infinite;
}
@keyframes meHeroFloat { 0%, 100% { transform: translate(0, 0) scale(1); } 50% { transform: translate(-6rpx, 8rpx) scale(1.04); } }
.me-hero-statusbar { height: 140rpx; }
.me-hero-content { display: flex; align-items: center; justify-content: space-between; position: relative; z-index: 1; }

.me-hero-info { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.me-name-lg { font-size: 48rpx; font-weight: 700; color: #18181B; letter-spacing: 1rpx; }
.me-sub-lg { font-size: 25rpx; color: #9CA3AF; margin-top: 8rpx; font-style: italic; letter-spacing: .5rpx; }

.me-avatar-lg {
  width: 110rpx; height: 110rpx; border-radius: 50%;
  background: #fff; border: 4rpx solid #fff;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  box-shadow: 0 6rpx 20rpx rgba(0, 0, 0, .10);
  overflow: hidden;
}
.me-avatar-img { width: 100%; height: 100%; border-radius: 50%; }
.me-avatar-text { font-size: 46rpx; font-weight: 700; color: #4F46E5; }

/* 抽屉 / 卡片统一定位动画 keyframes */
@keyframes meSlideIn { from { opacity: 0; transform: translateY(16rpx); } to { opacity: 1; transform: translateY(0); } }

/* 黑色 Level 卡 与 My Wardrobe 白卡 已移除（按需求精简） */

/* --- 三列数据卡 --- */
.me-stats-card {
  margin-bottom: 20rpx; padding: 32rpx 28rpx;
  background: #fff; border-radius: 22rpx;
  display: flex; align-items: center; justify-content: space-between;
  box-shadow: 0 6rpx 18rpx rgba(0, 0, 0, .04);
  animation: meSlideIn .5s .18s cubic-bezier(0.22, 1, 0.36, 1) both;
}
.me-stat { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 6rpx; }
.me-stat-row { display: flex; align-items: center; gap: 10rpx; }
.me-stat-num { font-size: 40rpx; font-weight: 800; color: #18181B; }
.me-stat-dot { width: 18rpx; height: 18rpx; border-radius: 50%; flex-shrink: 0; }
.me-stat-blue   { background: #4F46E5; }   /* 蓝：衣橱单品 */
.me-stat-pink   { background: #818CF8; }   /* 粉：搭配方案 */
.me-stat-amber  { background: #F59E0B; }   /* 橙黄：未读通知 */
.me-stat-label { font-size: 24rpx; color: #9CA3AF; margin-top: 4rpx; }
.me-stat-div { width: 1rpx; height: 56rpx; background: #F3F4F6; }
.me-stat-clickable { padding: 4rpx 0; transition: opacity .15s ease; cursor: pointer; }
.me-stat-clickable:active { opacity: .55; }
.me-stat-label-row { display: flex; align-items: center; justify-content: center; gap: 4rpx; margin-top: 4rpx; }
.me-stat-chev { color: #D1D5DB; }

/* --- 菜单 4 行：纯线性图标（无彩色块，匹配参考图样式） --- */
.me-menu-card {
  background: #fff; border-radius: 22rpx; overflow: hidden;
  box-shadow: 0 6rpx 18rpx rgba(0, 0, 0, .04);
  margin-bottom: 24rpx;
  animation: meSlideIn .5s .24s cubic-bezier(0.22, 1, 0.36, 1) both;
}
.me-menu-row { display: flex; align-items: center; padding: 30rpx 28rpx; transition: background .15s ease; }
.me-menu-row:active { background: #F7F8FA; }
.me-menu-ico {
  width: 40rpx; height: 40rpx; display: flex; align-items: center; justify-content: center;
  margin-right: 20rpx; flex-shrink: 0; color: #18181B;
}
.me-menu-label { flex: 1; font-size: 30rpx; font-weight: 500; color: #18181B; }
.me-menu-badge {
  min-width: 36rpx; height: 36rpx; padding: 0 10rpx;
  background: #EF4444; color: #fff; font-size: 20rpx; line-height: 36rpx;
  text-align: center; border-radius: 18rpx; margin-right: 12rpx; font-weight: 700;
  animation: meBadgePulse 2s ease-in-out infinite;
}
@keyframes meBadgePulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.06); } }
.me-menu-chev { font-size: 34rpx; color: #D1D5DB; font-weight: 300; }
.me-menu-div { height: 1rpx; background: #F3F4F6; margin-left: 88rpx; }

/* ===== 通用面板头部：左返回 + 居中标题 ===== */
.head-back {
  display: flex; align-items: center; justify-content: center;
  width: 64rpx; height: 64rpx; color: #18181B;
  flex-shrink: 0; border-radius: 50%;
  transition: background .15s ease;
}
.head-back:active { background: #F7F8FA; opacity: .85; }
.head-right-spacer { width: 64rpx; flex-shrink: 0; }
/* 带返回箭头的面板头部统一用这一套：左返回 + 居中标题（右侧 spacer 用于配平居中）
   新增此类头部时必须同时引用本规则，否则返回箭头和标题会上下错行 */
.closet-head,
.lookback-head { display: flex; align-items: center; justify-content: space-between; }

/* ===== 我的套装独立面板 ===== */
.closet-panel { padding: 24rpx 24rpx 0; animation: h5FadeUp .4s ease both; }
.closet-section {
  margin: 20rpx 0 8rpx; background: #fff; border-radius: 22rpx;
  padding: 28rpx 28rpx; box-shadow: 0 6rpx 18rpx rgba(0, 0, 0, .04);
}
.closet-head-row { display: flex; align-items: center; gap: 14rpx; margin-bottom: 24rpx; }
.closet-title { font-size: 30rpx; font-weight: 700; color: #18181B; }
.closet-count { font-size: 23rpx; color: #9CA3AF; background: #F7F8FA; border-radius: 16rpx; padding: 4rpx 14rpx; }
.closet-add {
  margin-left: auto; font-size: 26rpx; color: #fff;
  background: #4F46E5; padding: 10rpx 24rpx; border-radius: 28rpx;
  font-weight: 600; transition: opacity .15s ease;
}
.closet-add:active { opacity: .85; }

.closet-create { background: #fff; border: 1rpx solid #F7F8FA; border-radius: 14rpx; padding: 20rpx; margin-bottom: 24rpx; }
.closet-name-input {
  width: 100%; height: 80rpx; line-height: 80rpx;
  background: #fff; border: 1rpx solid #F4F4F5; border-radius: 12rpx;
  padding: 0 22rpx; font-size: 27rpx; box-sizing: border-box; margin-bottom: 18rpx;
}
.closet-pick { max-height: 460rpx; }
.closet-pick-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14rpx; }
.closet-pick-item { position: relative; height: 132rpx; background: #fff; border: 2rpx solid #F4F4F5; border-radius: 12rpx; overflow: hidden; }
.closet-pick-item.sel { border-color: #4F46E5; }
.closet-pi-img { width: 100%; height: 100%; object-fit: cover; }
.closet-pi-ph { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 44rpx; color: #fff; font-weight: 700; }
.closet-pi-name {
  position: absolute; left: 0; right: 0; bottom: 0; font-size: 18rpx; color: #fff;
  background: linear-gradient(transparent, rgba(0, 0, 0, .55)); padding: 14rpx 6rpx 6rpx;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.closet-pi-tick {
  position: absolute; top: 6rpx; right: 6rpx; width: 34rpx; height: 34rpx; border-radius: 50%;
  background: #4F46E5; color: #fff; font-size: 20rpx; display: flex; align-items: center; justify-content: center;
}
.closet-actions { display: flex; gap: 16rpx; margin-top: 18rpx; }

.closet-list { display: flex; flex-direction: column; gap: 22rpx; }
.closet-card { background: #fff; border: 1rpx solid #F7F8FA; border-radius: 18rpx; overflow: hidden; box-shadow: 0 4rpx 14rpx rgba(0, 0, 0, .05); }
.closet-card-head { display: flex; align-items: center; justify-content: space-between; padding: 22rpx 24rpx; border-bottom: 1rpx solid #F7F8FA; }
.closet-name-wrap { display: flex; align-items: baseline; gap: 14rpx; min-width: 0; }
.closet-card-name { font-size: 30rpx; font-weight: 700; color: #18181B; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.closet-card-count { font-size: 23rpx; color: #9CA3AF; background: #F7F8FA; border-radius: 16rpx; padding: 4rpx 14rpx; flex-shrink: 0; }
.closet-del {
  width: 48rpx; height: 48rpx; display: flex; align-items: center; justify-content: center;
  color: #818CF8; background: #EDE9FE; border-radius: 50%; flex-shrink: 0;
}

.closet-items { display: flex; flex-direction: column; padding: 18rpx 22rpx; gap: 14rpx; }
.closet-item { display: flex; align-items: stretch; height: 150rpx; background: #FFFFFF; border-radius: 16rpx; overflow: hidden; }
.closet-item:active { opacity: .92; }
.closet-item-img-wrap { width: 130rpx; height: 100%; background: #F7F8FA; display: flex; align-items: center; justify-content: center; overflow: hidden; flex-shrink: 0; }
.closet-item-img { width: 100%; height: 100%; background-size: contain; background-position: center; background-repeat: no-repeat; }
.closet-item-ph { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }
.closet-item-ph-txt { font-size: 48rpx; color: rgba(255, 255, 255, .8); font-weight: 700; }
.closet-item-body { flex: 1; min-width: 0; display: flex; flex-direction: column; justify-content: center; gap: 12rpx; padding: 0 20rpx; }
.closet-item-name { font-size: 28rpx; color: #18181B; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.closet-item-tags { display: flex; flex-wrap: wrap; gap: 10rpx; }
.closet-item-tag { font-size: 22rpx; color: #6B7280; background: #fff; border-radius: 8rpx; padding: 4rpx 12rpx; }
.closet-item-tag.cat { color: #4F46E5; background: #EEF2FF; }

.closet-empty { display: flex; flex-direction: column; align-items: center; padding: 60rpx 20rpx 40rpx; gap: 14rpx; color: #9CA3AF; }
.closet-empty-ico { font-size: 80rpx; color: #A5B4FC; opacity: .82; animation: whEmptyBreath 3s ease-in-out infinite; }
.closet-empty-text { font-size: 25rpx; }
.lookback-card {
  margin: 20rpx 0 8rpx; background: #fff; border-radius: 22rpx;
  padding: 28rpx 28rpx; box-shadow: 0 6rpx 18rpx rgba(0, 0, 0, .04);
  animation: meSlideIn .4s cubic-bezier(0.22, 1, 0.36, 1) both;
}
.lookback-tip { display: block; font-size: 25rpx; color: #9CA3AF; margin-bottom: 18rpx; }
.lookback-picker {
  height: 88rpx; line-height: 88rpx;
  background: #F7F8FA; border: 1rpx solid #F4F4F5; border-radius: 14rpx;
  padding: 0 22rpx; margin-bottom: 20rpx;
  display: block;
}
.lookback-pick-val { font-size: 28rpx; color: #18181B; }
.lookback-items { display: flex; flex-wrap: wrap; gap: 14rpx; }
.lookback-chip {
  background: #EEF2FF; color: #4F46E5; font-size: 25rpx; border-radius: 12rpx;
  padding: 14rpx 22rpx; transition: transform .15s ease;
}
.lookback-chip:active { transform: scale(.96); }
.lookback-empty { display: block; font-size: 25rpx; color: #9CA3AF; padding: 8rpx 0; }

/* --- 退出登录（小字灰色辅助） --- */
.me-logout-row { text-align: center; padding: 24rpx 0 32rpx; }
.me-logout-row:active { opacity: .6; }
.me-logout-text { font-size: 26rpx; color: #B0B0B5; font-weight: 500; }

/* ===== 身形资料弹窗（沿用三色系统美化） ===== */
.pf-dialog {
  width: 86vw; max-width: 660rpx; box-sizing: border-box;
  background: #fff; border-radius: 28rpx; max-height: 86vh; overflow-y: auto;
  display: flex; flex-direction: column;
  box-shadow: 0 24rpx 60rpx rgba(45, 58, 90, .18);
  animation: pfDialogIn .32s cubic-bezier(0.22, 1, 0.36, 1) both;
}
@keyframes pfDialogIn { from { opacity: 0; transform: translateY(20rpx) scale(.96); } to { opacity: 1; transform: translateY(0) scale(1); } }
.pf-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 32rpx 32rpx 20rpx; position: relative;
}
.pf-head::after {
  content: ''; position: absolute; left: 32rpx; right: 32rpx; bottom: 0;
  height: 1rpx; background: #F3F4F6;
}
.pf-title { font-size: 32rpx; font-weight: 700; color: #18181B; letter-spacing: .5rpx; }
.pf-sub { display: block; font-size: 23rpx; color: #9CA3AF; margin: 8rpx 32rpx 24rpx; line-height: 1.6; }
.pf-close {
  width: 56rpx; height: 56rpx; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  background: #F3F4F6; color: #6B7280; transition: background .15s ease;
}
.pf-close:active { background: #EDE9FE; }
.pf-body { padding: 8rpx 32rpx 24rpx; box-sizing: border-box; }
.pf-row { margin: 24rpx 0; }
.pf-row-2 { display: flex; gap: 24rpx; }
.pf-col { flex: 1; min-width: 0; }
.pf-label { display: block; font-size: 25rpx; color: #18181B; margin-bottom: 14rpx; font-weight: 600; letter-spacing: .3rpx; }
.pf-input {
  width: 100%; box-sizing: border-box;
  background: #F3F4F6; border: none;
  border-radius: 16rpx; padding: 0 24rpx;
  height: 84rpx; min-height: 84rpx; line-height: 84rpx;
  font-size: 28rpx; color: #18181B;
  transition: background .15s ease, box-shadow .15s ease;
}
.pf-input:focus { background: #fff; box-shadow: 0 0 0 3rpx #4F46E5; outline: none; }
.pf-input::placeholder { color: #B0B0B5; }
/* 三级联动城市 picker（视觉与 input 一致） */
.pf-city {
  display: flex; align-items: center;
  height: 84rpx; line-height: 84rpx;
  background: #F3F4F6; border: none;
  border-radius: 16rpx; padding: 0 24rpx;
  font-size: 28rpx; color: #18181B;
  box-sizing: border-box; width: 100%;
}
.pf-city-text {
  flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.pf-city-text:empty::before {
  content: '请选择 省 / 市 / 区';
  color: #B0B0B5;
}
.pf-chips { display: flex; flex-wrap: wrap; gap: 14rpx; }
.pf-chip {
  padding: 14rpx 26rpx;
  background: #F3F4F6; border: none; border-radius: 28rpx;
  font-size: 24rpx; color: #6B7280;
  transition: all .2s cubic-bezier(0.22, 1, 0.36, 1);
}
.pf-chip:active { transform: scale(.96); }
.pf-chip.on { background: #4F46E5; color: #fff; box-shadow: 0 4rpx 10rpx rgba(122, 168, 255, .35); }

/* 弹窗底部：双色拟物按钮 */
.pf-foot {
  display: flex; gap: 16rpx;
  padding: 24rpx 32rpx 32rpx;
  border-top: 1rpx solid #F3F4F6;
}
.pf-foot .wh-dlg-btn {
  flex: 1; height: 88rpx; border-radius: 44rpx;
  display: flex; align-items: center; justify-content: center;
  font-size: 28rpx; font-weight: 700; letter-spacing: .5rpx;
  transition: all .2s cubic-bezier(0.22, 1, 0.36, 1);
}
.pf-foot .wh-dlg-btn:active { transform: scale(.97); }
.pf-foot .wh-dlg-btn.cancel {
  background: #EDE9FE; color: #818CF8;
  box-shadow: 0 4rpx 12rpx rgba(139, 122, 192, .18), -2rpx -2rpx 6rpx rgba(255, 255, 255, .9);
}
.pf-foot .wh-dlg-btn.cancel:active { background: #DDD6FE; box-shadow: inset 2rpx 2rpx 6rpx rgba(139, 122, 192, .18); }
.pf-foot .wh-dlg-btn.save {
  background: #4F46E5; color: #fff;
  box-shadow: 0 6rpx 16rpx rgba(122, 168, 255, .35), -2rpx -2rpx 6rpx rgba(255, 255, 255, .6);
}
.pf-foot .wh-dlg-btn.save:active { background: #4338CA; box-shadow: inset 2rpx 2rpx 6rpx rgba(48, 49, 51, .18); }

/* 底部导航：纯白悬浮胶囊 */
.bottom-nav {
  position: fixed;
  left: 60rpx;
  right: 60rpx;
  bottom: 32rpx;
  height: 96rpx;
  background: #fff;
  border: 1rpx solid #F7F8FA;
  border-radius: 48rpx;
  box-shadow: 0 14rpx 42rpx rgba(45,58,90,.12);
  display: flex;
  justify-content: space-around;
  z-index: 100;
}
.nav-item { display: flex; flex-direction: column; align-items: center; justify-content: center; flex: 1; height: 96rpx; color: #9CA3AF; border-radius: 48rpx; transition: all .25s cubic-bezier(.22,1,.36,1); position: relative; }
.nav-item.active {
  color: #4F46E5;
  transform: translateY(-4rpx);
}
.nav-item.active::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  background: #F7F8FA;
  z-index: -1;
}
.nav-icon { font-size: 40rpx; transition: transform .25s cubic-bezier(.22,1,.36,1); }
.nav-item.active .nav-icon { transform: scale(1.12); }
.nav-label { font-size: 20rpx; margin-top: 4rpx; font-weight: 500; }
.nav-ico-wrap { position: relative; }
.badge { position: absolute; top: -8rpx; right: -14rpx; min-width: 30rpx; height: 30rpx; padding: 0 6rpx; background: #EF4444; color: #fff; font-size: 18rpx; line-height: 30rpx; text-align: center; border-radius: 15rpx; box-shadow: 0 2rpx 8rpx rgba(245,108,108,.35); }

/* 自定义顶部栏：鸿蒙毛玻璃 */
.topbar { height: 110rpx; flex-shrink: 0; background: rgba(255,255,255,.55); backdrop-filter: blur(28rpx); -webkit-backdrop-filter: blur(28rpx); border-bottom: 1rpx solid rgba(255,255,255,.7); color: #18181B; display: flex; align-items: center; justify-content: space-between; padding: 0 28rpx; box-sizing: border-box; }
.tb-weather-pill { display: flex; align-items: center; gap: 10rpx; padding: 12rpx 22rpx; background: rgba(255,255,255,.78); border: 1rpx solid rgba(255,255,255,.85); border-radius: 32rpx; box-shadow: 0 4rpx 16rpx rgba(122,168,255,.10); backdrop-filter: blur(16rpx); -webkit-backdrop-filter: blur(16rpx); min-width: 0; max-width: 66vw; flex-shrink: 1; }
.tw-ico { font-size: 26rpx; color: #EF4444; flex-shrink: 0; }
.tw-text { font-size: 25rpx; color: #4A5A7A; font-weight: 500; min-width: 0; flex: 1; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.tb-right { display: flex; align-items: center; gap: 18rpx; flex-shrink: 0; }

/* 全局通知铃铛（顶部栏右侧，点击打开抽屉） */
.notify-bell { position: relative; width: 68rpx; height: 68rpx; background: rgba(255,255,255,.78); border: 1rpx solid rgba(255,255,255,.85); border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4rpx 16rpx rgba(122,168,255,.10); backdrop-filter: blur(16rpx); -webkit-backdrop-filter: blur(16rpx); }
.bell-ico { font-size: 34rpx; line-height: 1; }
.bell-badge { position: absolute; top: -6rpx; right: -6rpx; min-width: 30rpx; height: 30rpx; padding: 0 6rpx; background: #EF4444; color: #fff; font-size: 18rpx; line-height: 30rpx; text-align: center; border-radius: 15rpx; }

/* 通知中心（旧版样式已迁至上方块 #3400+ 精致版，此处清空避免覆盖） */

/* 弹窗 */
.mask { position: fixed; left: 0; top: 0; right: 0; bottom: 0; background: rgba(0,0,0,.55); display: flex; align-items: center; justify-content: center; z-index: 300; }
.dialog { width: 640rpx; background: #fff; border-radius: 16rpx; padding: 30rpx; max-height: 84vh; overflow-y: auto; }
.scene-mask { position: fixed; inset: 0; z-index: 250; display: flex; align-items: center; justify-content: center; padding: 24rpx; pointer-events: none; }
.scene-dialog { pointer-events: auto; position: relative; width: 86vw; max-width: 600rpx; max-height: 72vh; background: #fff; border-radius: 28rpx; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 24rpx 80rpx rgba(45,58,90,.22); animation: sceneDialogIn .32s cubic-bezier(0.22,1,0.36,1) both; }
.scene-dialog-scroll { flex: 1 1 auto; min-height: 0; max-height: calc(72vh - 140rpx); padding: 16rpx 24rpx; box-sizing: border-box; overflow-y: auto; }
.scene-dialog-scroll .pre { font-size: 28rpx; line-height: 1.85; color: #18181B; padding-top: 4rpx; }
.scene-dialog .wh-dlg-back { font-size: 44rpx; padding: 12rpx; }
.scene-dialog-scroll rich-text { word-break: break-word; }
.scene-dialog-scroll img, .scene-dialog-scroll image { max-width: 100%; border-radius: 12rpx; margin: 16rpx 0; }
.scene-dialog-foot {
  flex-shrink: 0; display: flex; gap: 20rpx;
  padding: 28rpx 28rpx calc(28rpx + env(safe-area-inset-bottom, 0));
  border-top: 1rpx solid #F3F4F6;
  background: #FAFBFC;
}
.scene-dialog-foot .wh-dlg-btn {
  flex: 1; height: 96rpx; line-height: 96rpx;
  border-radius: 48rpx; display: flex; align-items: center; justify-content: center;
  font-size: 32rpx; font-weight: 700; letter-spacing: 1rpx;
  transition: all .25s cubic-bezier(0.22, 1, 0.36, 1);
}
/* 取消 / 备选：薰衣草 + 紫字 + 拟物凸起 */
.scene-dialog-foot .wh-dlg-btn.cancel {
  background: #EDE9FE; color: #818CF8;
  box-shadow: 0 6rpx 16rpx rgba(139, 122, 192, 0.22), -2rpx -2rpx 6rpx rgba(255, 255, 255, 0.8);
}
.scene-dialog-foot .wh-dlg-btn.cancel:active {
  box-shadow: inset 3rpx 3rpx 8rpx rgba(139, 122, 192, 0.22), inset -2rpx -2rpx 6rpx rgba(255, 255, 255, 0.6);
  transform: scale(.97); background: #DDD6FE;
}
/* 主 / 采纳：纯蓝 + 白字 + 拟物凸起 */
.scene-dialog-foot .wh-dlg-btn.primary {
  background: #4F46E5; color: #fff;
  box-shadow: 0 8rpx 20rpx rgba(122, 168, 255, 0.42), -2rpx -2rpx 6rpx rgba(255, 255, 255, 0.6);
}
.scene-dialog-foot .wh-dlg-btn.primary:active {
  box-shadow: inset 3rpx 3rpx 8rpx rgba(48, 49, 51, 0.18), inset -2rpx -2rpx 6rpx rgba(255, 255, 255, 0.3);
  transform: scale(.97); background: #4338CA;
}
.dialog-title { font-size: 32rpx; font-weight: 600; display: block; margin-bottom: 20rpx; }
.dialog-img { max-height: 360rpx; border-radius: 12rpx; margin: 16rpx auto; display: block; }
.mini-btn.disabled { opacity: .5; }

/* ===== 上传弹窗 DPSTAR 风格 ===== */
/* ===== 录入新衣服弹窗：三色系统 + 拟物 + 组件级动效 ===== */
.wh-upload-dialog {
  width: 660rpx;
  background: #fff;
  border-radius: 32rpx;
  max-height: 88vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  box-shadow: 0 24rpx 60rpx rgba(45, 58, 90, .14);
  animation: whDlgIn .42s cubic-bezier(0.22, 1, 0.36, 1) both;
}
@keyframes whDlgIn {
  from { opacity: 0; transform: translateY(40rpx) scale(.96); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
/* 顶部栏：白底 + 标题居中 + 关闭 X */
.wh-dlg-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32rpx 28rpx 24rpx;
  border-bottom: 1rpx solid #F3F4F6;
  position: relative;
}
/* 顶部"返回"按钮：浅蓝胶囊 + 蓝字 + 左箭头，明显却不抢标题 */
.wh-dlg-back {
  display: inline-flex;
  align-items: center;
  gap: 6rpx;
  font-size: 26rpx;
  color: #4F46E5;
  font-weight: 600;
  padding: 10rpx 22rpx 10rpx 18rpx;
  border-radius: 30rpx;
  background: #EEF2FF;
  transition: all .22s cubic-bezier(0.22, 1, 0.36, 1);
}
.wh-dlg-back:active {
  background: #4F46E5;
  color: #fff;
  transform: scale(.95);
}
/* 关闭按钮（替换顶部右侧占位）：淡薰衣草胶囊 + 深紫字 + 旋转 90° 反馈 */
.wh-dlg-close {
  width: 56rpx;
  height: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #EDE9FE;
  color: #4F46E5;
  font-size: 32rpx;
  font-weight: 300;
  transition: all .28s cubic-bezier(0.22, 1, 0.36, 1);
}
.wh-dlg-close:active {
  background: #818CF8;
  color: #fff;
  transform: rotate(90deg) scale(.92);
}
/* 居中标题 */
.wh-dlg-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #18181B;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  letter-spacing: .5rpx;
}

/* 主按钮：浅蓝纯色 + 拟物双投影 + 图标圆形 chip + 上下结构 */
.wh-dlg-up-area {
  margin: 32rpx 28rpx 16rpx;
  background: #4F46E5;
  border-radius: 24rpx;
  padding: 36rpx 28rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
  color: #fff;
  box-shadow:
    0 10rpx 24rpx rgba(122, 168, 255, .38),
    -2rpx -2rpx 6rpx rgba(255, 255, 255, .35),
    inset 0 1rpx 0 rgba(255, 255, 255, .20);
  transition: all .25s cubic-bezier(0.22, 1, 0.36, 1);
}
.wh-dlg-up-area:active {
  box-shadow:
    inset 4rpx 4rpx 10rpx rgba(48, 49, 51, .16),
    inset -2rpx -2rpx 6rpx rgba(255, 255, 255, .25);
  transform: scale(.97);
  background: #4338CA;
}
.wh-dlg-up-ico {
  width: 88rpx;
  height: 88rpx;
  border-radius: 26rpx;
  background: rgba(255, 255, 255, .22);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  transition: transform .3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.wh-dlg-up-area:active .wh-dlg-up-ico {
  transform: scale(.9) rotate(-6deg);
}
.wh-dlg-up-txt {
  font-size: 30rpx;
  color: #fff;
  font-weight: 700;
  letter-spacing: 1rpx;
}

/* 次按钮：淡薰衣草虚线边框 + hover 填充 */
.wh-dlg-batch {
  margin: 0 28rpx 28rpx;
  border: 2rpx dashed #A5B4FC;
  border-radius: 24rpx;
  padding: 30rpx 22rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14rpx;
  background: #FAF7FE;
  color: #4F46E5;
  transition: all .25s cubic-bezier(0.22, 1, 0.36, 1);
}
.wh-dlg-batch:active {
  background: #EDE9FE;
  border-color: #818CF8;
  transform: scale(.98);
}
.wh-dlg-batch-ico {
  width: 52rpx;
  height: 52rpx;
  border-radius: 16rpx;
  background: #EDE9FE;
  color: #4F46E5;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform .3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.wh-dlg-batch:active .wh-dlg-batch-ico {
  transform: rotate(8deg) scale(1.08);
  background: #DDD6FE;
}
.wh-dlg-batch-txt {
  font-size: 27rpx;
  color: #4F46E5;
  font-weight: 600;
}
.wh-dlg-body { padding: 0 28rpx 28rpx; }
.wh-dlg-preview { background: #F7F8FA; border-radius: 14rpx; padding: 20rpx; display: flex; align-items: center; justify-content: center; position: relative; min-height: 280rpx; }
.wh-dlg-preview-img { max-width: 100%; max-height: 360rpx; border-radius: 10rpx; }
.wh-dlg-detect { position: absolute; inset: 0; background: rgba(255,255,255,.85); display: flex; align-items: center; justify-content: center; border-radius: 14rpx; font-size: 27rpx; color: #4F46E5; font-weight: 500; }
.wh-dlg-preview-tip { display: block; text-align: center; font-size: 23rpx; color: #E5E7EB; margin: 12rpx 0 20rpx; }
.wh-dlg-form { display: flex; flex-direction: column; gap: 0; }
.wh-dlg-row { display: flex; gap: 16rpx; margin-bottom: 0; }
.wh-dlg-field { flex: 1; }
.wh-dgl-label, .wh-dlg-label { font-size: 24rpx; color: #9CA3AF; margin-bottom: 8rpx; display: block; }
.wh-dlg-input { width: 100%; height: 68rpx; background: #F7F8FA; border: 1rpx solid #F4F4F5; border-radius: 10rpx; padding: 0 16rpx; font-size: 27rpx; box-sizing: border-box; }
.wh-dlg-picker { width: 100%; height: 68rpx; background: #F7F8FA; border: 1rpx solid #F4F4F5; border-radius: 10rpx; padding: 0 16rpx; font-size: 27rpx; box-sizing: border-box; display: flex; align-items: center; }
.wh-dlg-pick-val { font-size: 27rpx; color: #18181B; }
.wh-dlg-pick-val.placeholder { color: #E5E7EB; }
.wh-dlg-foot { display: flex; gap: 16rpx; margin-top: 28rpx; padding-top: 20rpx; border-top: 1rpx solid #EEF2FF; }
.wh-dlg-btn { flex: 1; height: 80rpx; line-height: 80rpx; text-align: center; border-radius: 12rpx; font-size: 29rpx; font-weight: 500; }
.wh-dlg-btn.cancel { background: #F7F8FA; color: #6B7280; }
.wh-dlg-btn.save { background: #4F46E5; color: #fff; }
.wh-dlg-btn.ghost { background: #EEF2FF; color: #4F46E5; }
.wh-dlg-btn.save.disabled { background: #E5E7EB; }
.wh-dlg-btn.primary { background: #4F46E5; color: #fff; }
.wh-dlg-btn.cancel.disabled { background: #F4F4F5; color: #E5E7EB; }

/* 批量编辑弹窗 */
.wh-batch-dialog { width: 660rpx; background: #fff; border-radius: 20rpx; max-height: 88vh; overflow-y: auto; display: flex; flex-direction: column; }
.wh-batch-body { padding: 24rpx 28rpx; }
.wh-batch-img-wrap { height: 320rpx; background: #F7F8FA; border-radius: 14rpx; display: flex; align-items: center; justify-content: center; margin-bottom: 20rpx; }
.wh-batch-img { width: 100%; height: 100%; background-size: contain; background-position: center center; background-repeat: no-repeat; }
.wh-batch-foot { display: flex; gap: 16rpx; padding: 20rpx 28rpx 28rpx; border-top: 1rpx solid #EEF2FF; }
.wh-batch-foot.two-row { flex-direction: column; gap: 14rpx; }
.wh-batch-foot-row { display: flex; gap: 14rpx; }
.wh-batch-foot-row .flex1 { flex: 1; }
.wh-dlg-btn.warn { background: #fdf0ed; color: #EF4444; }

/* 单品纠错弹窗 */
.ic-dialog { width: 660rpx; background: #fff; border-radius: 20rpx; max-height: 86vh; overflow-y: auto; display: flex; flex-direction: column; }
.ic-head { display: flex; align-items: center; justify-content: space-between; padding: 24rpx 28rpx; border-bottom: 1rpx solid #EEF2FF; }
.ic-title { font-size: 30rpx; font-weight: 600; color: #18181B; }
.ic-close { font-size: 30rpx; color: #9CA3AF; padding: 6rpx 10rpx; }
.ic-body { padding: 24rpx 28rpx; }
.ic-tip { display: block; font-size: 25rpx; color: #9CA3AF; line-height: 1.6; margin-bottom: 20rpx; }
.ic-fields { display: flex; flex-wrap: wrap; gap: 14rpx; margin-bottom: 8rpx; }
.ic-chip { padding: 12rpx 24rpx; background: #F7F8FA; border: 1rpx solid #F4F4F5; border-radius: 30rpx; font-size: 26rpx; color: #6B7280; }
.ic-chip.on { background: #EEF2FF; border-color: #4F46E5; color: #4F46E5; font-weight: 600; }
.ic-row { margin-top: 20rpx; }
.ic-row-label { display: block; font-size: 24rpx; color: #9CA3AF; margin-bottom: 8rpx; }
.ic-input { width: 100%; height: 68rpx; background: #F7F8FA; border: 1rpx solid #F4F4F5; border-radius: 10rpx; padding: 0 16rpx; font-size: 27rpx; box-sizing: border-box; }
.ic-foot { display: flex; gap: 16rpx; padding: 20rpx 28rpx 28rpx; border-top: 1rpx solid #EEF2FF; }

/* 标签展示 */
.wh-card-tags { display: flex; flex-wrap: wrap; gap: 6rpx; margin-top: 4rpx; }
.wh-card-tag { font-size: 19rpx; color: #4F46E5; background: #EEF2FF; border-radius: 6rpx; padding: 2rpx 8rpx; }
.wh-tag-list { display: flex; flex-wrap: wrap; gap: 10rpx; margin-top: 6rpx; }
.wh-tag-chip { font-size: 24rpx; color: #4F46E5; background: #EEF2FF; border-radius: 8rpx; padding: 6rpx 16rpx; }
.wh-df-edit { font-size: 22rpx; color: #4F46E5; margin-left: 12rpx; padding: 2rpx 8rpx; }
.wh-df-edit:active { opacity: .6; }
.tm-dialog { width: 660rpx; background: #fff; border-radius: 20rpx; max-height: 86vh; overflow-y: auto; display: flex; flex-direction: column; }
.tm-body { padding: 24rpx 28rpx; }

/* ===== 首页社区风新增/覆盖 ===== */
.home-panel { padding-top: 12rpx; position: relative; }
.scene-loading-mask { position: fixed; inset: 0; background: rgba(238,245,255,.45); backdrop-filter: blur(4rpx); z-index: 300; display: flex; align-items: center; justify-content: center; pointer-events: none; }
.scene-loading-card { background: #fff; border-radius: 24rpx; padding: 48rpx 56rpx; display: flex; flex-direction: column; align-items: center; gap: 22rpx; box-shadow: 0 16rpx 48rpx rgba(122,168,255,.18); }
.scene-loading-spinner { width: 60rpx; height: 60rpx; border: 5rpx solid #EDE9FE; border-top-color: #A5B4FC; border-radius: 50%; animation: sceneSpin 1s linear infinite; }
@keyframes sceneSpin { 0% { transform: rotate(0); } 100% { transform: rotate(360deg); } }
.scene-loading-text { font-size: 28rpx; color: #6B7280; }

/* 搜索栏 */
.home-search { display: flex; align-items: center; gap: 16rpx; background: #fff; border-radius: 32rpx; padding: 22rpx 28rpx; margin-bottom: 28rpx; box-shadow: 0 4rpx 16rpx rgba(122, 168, 255, .08); border: 1rpx solid #EEF2FF; }
.home-search .hs-ico { font-size: 32rpx; color: #9CA3AF; }
.hs-placeholder { font-size: 26rpx; color: #9CA3AF; }

/* 分类入口 */
.cat-scroll { width: 100%; white-space: nowrap; margin-bottom: 28rpx; overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none; }
.cat-list { display: inline-flex; gap: 22rpx; padding-right: 24rpx; }
.cat-scroll::-webkit-scrollbar, .hero-group-scroll::-webkit-scrollbar, .wh-filter-scroll::-webkit-scrollbar, .wh-group-scroll::-webkit-scrollbar { display: none; }
.cat-tile { display: inline-flex; flex-direction: column; align-items: center; gap: 14rpx; }
/* 立体分类入口图标：带外凸阴影 + 顶部高光 */
.cat-icon-wrap { width: 120rpx; height: 120rpx; border-radius: 28rpx; display: flex; align-items: center; justify-content: center; box-shadow: 6rpx 6rpx 16rpx rgba(91,141,239,.16), 4rpx 4rpx 12rpx rgba(139,122,192,.12), -4rpx -4rpx 10rpx rgba(255,255,255,.9), inset 0 2rpx 2rpx rgba(255,255,255,.6); position: relative; }
.cat-icon-wrap::after { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 50%; border-radius: 28rpx 28rpx 0 0; background: linear-gradient(180deg, rgba(255,255,255,.55), rgba(255,255,255,0)); pointer-events: none; }
.cat-icon-wrap:active { box-shadow: inset 4rpx 4rpx 10rpx rgba(91,141,239,.14), inset -3rpx -3rpx 8rpx rgba(255,255,255,.95); transform: scale(0.96); }
.cat-icon { font-size: 52rpx; color: inherit; }
.cat-label { font-size: 24rpx; color: #18181B; font-weight: 500; }

/* 今日穿搭大卡片 */
.hero-card { position: relative; border-radius: 32rpx; overflow: hidden; background: #fff; margin-bottom: 24rpx; box-shadow: 0 12rpx 32rpx rgba(122, 168, 255, .12); }
.hero-bg { width: 100%; height: 360rpx; background: #FFFFFF; display: flex; align-items: center; justify-content: center; }
.hero-img { width: 100%; height: 100%; }
.hero-ph { display: flex; flex-direction: column; align-items: center; gap: 12rpx; color: #E5E7EB; }
.hero-ph-ico {
  font-size: 96rpx;
  color: #A5B4FC;
  opacity: .82;
  animation: whEmptyBreath 3s ease-in-out infinite;
}
.hero-ph-txt { font-size: 28rpx; color: #9CA3AF; }
.hero-info { padding: 24rpx 28rpx 28rpx; }
.hero-tags { display: flex; flex-wrap: wrap; gap: 12rpx; margin-bottom: 18rpx; }
.hero-tags.compact { margin-bottom: 0; justify-content: flex-end; }
.hero-tag { font-size: 22rpx; color: #6B7280; background: #F7F8FA; border-radius: 20rpx; padding: 8rpx 18rpx; }
.hero-tag.temp { color: #4F46E5; background: #EEF2FF; font-weight: 600; }
.hero-tag.loc { display: inline-flex; align-items: center; gap: 6rpx; }
.hero-title { font-size: 34rpx; font-weight: 700; color: #18181B; display: block; margin-bottom: 8rpx; }
.hero-sub { font-size: 24rpx; color: #9CA3AF; display: block; margin-bottom: 22rpx; }
.hero-actions { display: flex; gap: 16rpx; }
/* 首页 hero 按钮：主按钮深蓝渐变白字，次按钮浅蓝底蓝字 */
.hero-btn { flex: 1; height: 72rpx; line-height: 72rpx; text-align: center; border-radius: 36rpx; font-size: 27rpx; font-weight: 600; transition: all .25s cubic-bezier(0.22, 1, 0.36, 1); }
/* 拟物主按钮：纯色蓝 + 双投影（右下深 + 左上亮，模拟凸起） */
.hero-btn.primary { background: #4F46E5; color: #fff; box-shadow: 0 8rpx 18rpx rgba(91, 141, 239, .35), -2rpx -2rpx 6rpx rgba(255, 255, 255, .5); }
.hero-btn.primary:active { box-shadow: inset 4rpx 4rpx 8rpx rgba(48, 49, 51, .18), inset -2rpx -2rpx 6rpx rgba(255, 255, 255, .2); transform: scale(0.97); background: #4338CA; }
/* 拟物次按钮：纯色浅蓝 + 灰/白双投影 */
.hero-btn.cream { background: #F7F8FA; color: #4F46E5; box-shadow: 0 8rpx 18rpx rgba(91, 141, 239, .12), -2rpx -2rpx 6rpx rgba(255, 255, 255, .9); }
.hero-btn.cream:active { box-shadow: inset 3rpx 3rpx 6rpx rgba(91, 141, 239, .12), inset -2rpx -2rpx 4rpx rgba(255, 255, 255, .9); transform: scale(0.97); background: #EEF2FF; }

/* 今日穿搭：分类大图展示 */
.hero-outfit { padding: 24rpx 24rpx 28rpx; }
.hero-outfit-head { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24rpx; }
.hero-outfit-head .hero-title { margin-bottom: 6rpx; }
.hero-group { margin-bottom: 28rpx; }
.hero-group-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16rpx; }
.hero-group-title { font-size: 30rpx; font-weight: 700; color: #18181B; }
.hero-group-count { font-size: 22rpx; color: #9CA3AF; background: #F7F8FA; border-radius: 18rpx; padding: 4rpx 14rpx; }
.hero-group-scroll { width: 100%; white-space: nowrap; overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none; }
.hero-group-list { display: inline-flex; gap: 20rpx; padding-right: 24rpx; }
.hero-big-card { width: 240rpx; background: #fff; border-radius: 22rpx; overflow: hidden; box-shadow: 0 4rpx 18rpx rgba(0,0,0,.06); flex-shrink: 0; }
.hero-big-card:active { transform: scale(.98); }
.hero-big-img-wrap { width: 240rpx; height: 280rpx; background: #FFFFFF; display: flex; align-items: center; justify-content: center; }
.hero-big-img { width: 100%; height: 100%; }
.hero-big-ph { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 72rpx; color: rgba(255,255,255,.75); font-weight: 700; }
.hero-big-name { display: block; padding: 16rpx 18rpx; font-size: 26rpx; color: #18181B; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.home-loading { background: #fff; border-radius: 20rpx; padding: 40rpx; text-align: center; margin-bottom: 24rpx; }
.home-text-card { margin-top: 0; margin-bottom: 24rpx; }

/* 区块标题 */
.section-head { display: flex; align-items: center; justify-content: space-between; margin: 32rpx 0 18rpx; }
.section-title { font-size: 32rpx; font-weight: 700; color: #18181B; }
.section-loading { font-size: 24rpx; color: #EF4444; }

/* 场景 pills */
.scene-list { display: flex; flex-wrap: wrap; gap: 16rpx; }
.scene-pill { padding: 14rpx 26rpx; background: #fff; border: 1rpx solid #EEF2FF; border-radius: 30rpx; }
.scene-pill-text { font-size: 25rpx; color: #6B7280; }

/* 工具入口 */
/* 工具入口（已重做：扁平单色块，去紫蓝渐变 + 强拟物投影） */
.tool-list { display: flex; gap: 20rpx; }
.tool-tile {
  flex: 1; display: flex; flex-direction: column; align-items: center; gap: 14rpx;
  background: #fff; border-radius: 24rpx; padding: 30rpx 0;
  border: 1rpx solid #F7F8FA;
  box-shadow: 0 4rpx 12rpx rgba(91, 141, 239, .06);
  transition: transform .15s ease, box-shadow .15s ease;
}
.tool-tile:active { transform: scale(.97); box-shadow: 0 2rpx 8rpx rgba(91, 141, 239, .10); }
.tool-icon-wrap {
  width: 88rpx; height: 88rpx; border-radius: 22rpx;
  display: flex; align-items: center; justify-content: center;
  font-size: 46rpx;
}
.tool-icon-wrap.blue { background: #EEF2FF; color: #4F46E5; }
.tool-icon-wrap.lav  { background: var(--lav-100, #EDE9FE); color: var(--lav-600, #818CF8); }
.tool-label { font-size: 26rpx; color: #18181B; font-weight: 500; }

/* =====================================================================
 * 问候条 (学习自 小红书 / Instagram 首页头部)
 * ===================================================================== */
.greet-strip {
  display: flex; align-items: center; justify-content: space-between;
  padding: 4rpx 8rpx 18rpx; margin-bottom: 6rpx;
  animation: h5FadeUp .4s cubic-bezier(0.22,1,0.36,1) both;
}
.greet-text { display: flex; flex-direction: column; gap: 6rpx; min-width: 0; }
.greet-title { font-size: 30rpx; font-weight: 600; color: #18181B; letter-spacing: .5rpx; }
.greet-sub   { font-size: 24rpx; color: #9CA3AF; }
.greet-dot {
  width: 14rpx; height: 14rpx; border-radius: 50%;
  background: var(--lav-400);
  flex-shrink: 0;
}

/* =====================================================================
 * 场景推荐 → 改为底部弹层 (学习自 小红书 / iOS 底部 sheet)
 * 仅追加 is-sheet 修饰，不影响其他 .mask / .scene-dialog 用法
 * ===================================================================== */
.scene-backdrop { position: fixed; inset: 0; z-index: 249; background: rgba(45, 58, 90, 0.28); backdrop-filter: blur(8rpx); animation: sceneBackdropIn .25s ease-out both; }
@keyframes sceneBackdropIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes sceneDialogIn { from { opacity: 0; transform: scale(0.92); } to { opacity: 1; transform: scale(1); } }
.scene-dialog-foot { padding-bottom: calc(16rpx + env(safe-area-inset-bottom, 0)); }

/* =====================================================================
 * 富文本排版 (AI 推荐内容) — 学习自 小红书笔记 / Notion
 * 让 md2html 出来的内容有清晰层级、舒适行距、关键词用品牌色点出
 * ===================================================================== */
.scene-dialog-scroll .pre,
.scene-dialog-scroll rich-text {
  font-size: 28rpx;
  line-height: 1.75;
  color: #18181B;
  display: block;
}
.scene-dialog-scroll rich-text p        { margin: 14rpx 0; color: #18181B; }
.scene-dialog-scroll rich-text h1,
.scene-dialog-scroll rich-text h2,
.scene-dialog-scroll rich-text h3 {
  font-size: 32rpx; font-weight: 600; color: #18181B;
  margin: 24rpx 0 12rpx; line-height: 1.4; letter-spacing: .3rpx;
}
.scene-dialog-scroll rich-text h1:first-child,
.scene-dialog-scroll rich-text h2:first-child,
.scene-dialog-scroll rich-text h3:first-child { margin-top: 4rpx; }
.scene-dialog-scroll rich-text strong,
.scene-dialog-scroll rich-text b        { font-weight: 600; color: #4F46E5; }
.scene-dialog-scroll rich-text em {
  font-style: normal; color: #818CF8;
  background: rgba(232, 222, 243, .5);
  padding: 0 6rpx; border-radius: 4rpx;
}
.scene-dialog-scroll rich-text .md-list  { margin: 12rpx 0; }
.scene-dialog-scroll rich-text .md-li,
.scene-dialog-scroll rich-text .md-oli    { position: relative; margin: 8rpx 0; padding-left: 28rpx; word-break: break-word; overflow-wrap: break-word; white-space: normal; }
.scene-dialog-scroll rich-text .md-dot,
.scene-dialog-scroll rich-text .md-num    { position: absolute; left: 0; top: 0; color: #C7D2FE; font-weight: 700; }
.scene-dialog-scroll rich-text .md-num    { color: #4F46E5; }
.scene-dialog-scroll rich-text blockquote {
  margin: 16rpx 0; padding: 12rpx 18rpx;
  background: #F7F8FA; border-left: 6rpx solid #C7D2FE;
  border-radius: 8rpx; color: #6B7280;
}
.scene-dialog-scroll rich-text code {
  font-size: 24rpx; background: #F5F3FF;
  padding: 2rpx 10rpx; border-radius: 6rpx;
  color: #818CF8; font-family: monospace;
}
.scene-dialog-scroll rich-text hr {
  border: none; border-top: 1rpx solid #EEF2FF; margin: 20rpx 0;
}
</style>
