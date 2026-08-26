# -*- coding: utf-8 -*-
"""生成《时尚穿搭与服装知识手册》PDF，用于知识库检索测试。"""
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, ListFlowable,
                                ListItem, PageBreak, Table, TableStyle)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.cidfonts import UnicodeCIDFont

# 注册内置中文字体（无需外部字体文件）
pdfmetrics.registerFont(UnicodeCIDFont('STSong-Light'))
FONT = 'STSong-Light'

NAVY = colors.HexColor('#2D3A5A')
SUB = colors.HexColor('#6B7A9C')
LAV = colors.HexColor('#8B7AC0')
LINE = colors.HexColor('#D6E5FF')

styles = getSampleStyleSheet()
def mk(name, **kw):
    kw.setdefault('fontName', FONT)
    return ParagraphStyle(name, **kw)

title_style    = mk('T', fontSize=24, leading=30, textColor=NAVY, alignment=TA_CENTER, spaceAfter=8)
subtitle_style = mk('ST', fontSize=13, leading=18, textColor=SUB, alignment=TA_CENTER, spaceAfter=4)
h1_style = mk('H1', fontSize=16, leading=22, textColor=NAVY, spaceBefore=14, spaceAfter=6)
h2_style = mk('H2', fontSize=12.5, leading=18, textColor=LAV, spaceBefore=8, spaceAfter=4)
body_style = mk('B', fontSize=10.5, leading=16.5, textColor=colors.HexColor('#22304a'), spaceAfter=6)
bullet_style = mk('BL', fontSize=10.5, leading=15.5, textColor=colors.HexColor('#22304a'))
note_style = mk('N', fontSize=9.5, leading=14, textColor=SUB, spaceBefore=4, spaceAfter=8)

story = []

def P(t, s=body_style): story.append(Paragraph(t, s))
def H1(t): story.append(Paragraph(t, h1_style))
def H2(t): story.append(Paragraph(t, h2_style))
def SP(h=6): story.append(Spacer(1, h))

def bullets(items, style=bullet_style):
    flow = [ListItem(Paragraph(i, style), leftIndent=6) for i in items]
    story.append(ListFlowable(flow, bulletType='bullet', start='•', leftIndent=14,
                              bulletColor=LAV, bulletFontSize=10))

# ---------------- 封面 ----------------
SP(60)
P('时尚穿搭与服装知识手册', title_style)
P('Fashion & Wardrobe Knowledge Handbook', subtitle_style)
SP(10)
P('—— 面向个人穿搭顾问与智能衣橱系统的知识库样例文档 ——', subtitle_style)
SP(40)
P('版本：v1.0　|　用途：知识库检索 / RAG 测试语料　|　编制：AI 衣橱', note_style)

story.append(PageBreak())

# ---------------- 目录 ----------------
H1('目录')
bullets([
    '一、色彩搭配基础（色轮、冷暖、四季色彩、配色方案）',
    '二、身形分类与版型选择（苹果 / 梨形 / 沙漏 / 矩形 / 倒三角）',
    '三、服装面料常识（天然纤维与化学纤维对照）',
    '四、场合着装规范（Dress Code）',
    '五、经典单品与胶囊衣橱',
    '六、体型修饰的视觉原理',
    '七、服饰清洗与保养',
    '八、常见穿搭误区（Q&A）',
    '九、常用术语表',
])

story.append(PageBreak())

# ---------------- 一、色彩 ----------------
H1('一、色彩搭配基础')
P('色彩是穿搭中最先被感知的元素。掌握色彩关系，能在不依赖身材修饰的情况下快速提升整体协调感。')

H2('1.1 色轮与色彩关系')
bullets([
    '三原色：红、黄、蓝，无法由其他颜色混合得到。',
    '二次色（间色）：两种原色等量混合 —— 橙（红+黄）、绿（黄+蓝）、紫（红+蓝）。',
    '三次色：原色与相邻间色混合，如红橙、黄绿、蓝紫等。',
    '邻近色：色轮上相邻 60° 以内的颜色，搭配稳妥柔和。',
    '互补色：色轮上相对 180° 的颜色（如蓝与橙），对比强烈、吸睛但有风险。',
])

H2('1.2 冷暖色划分')
P('颜色可粗略分为暖调与冷调。暖调（红、橙、黄、砖红、驼色、橄榄绿）衬托暖黄 / 小麦肤色；'
  '冷调（蓝、紫、玫红、银灰、藏青）衬托冷白肤色。中性色（黑、白、灰、米、卡其）几乎不挑肤色，'
  '是构建衣橱底色的首选。')

H2('1.3 四季色彩理论')
bullets([
    '春季型：暖且明亮，适合浅暖色（ peach、浅鹅黄、珊瑚粉）。',
    '夏季型：冷且柔和，适合灰调冷色（雾霾蓝、藕粉、灰紫）。',
    '秋季型：暖且沉稳，适合深暖色（驼色、砖红、橄榄绿、芥末黄）。',
    '冬季型：冷且鲜明，适合高对比冷色（正红、宝蓝、黑白、银灰）。',
])

H2('1.4 实用配色方案')
bullets([
    '单色搭配：同一颜色不同明度，显高显简约。',
    '同色系 / 邻近色：安全不出错，适合通勤。',
    '撞色（互补色）：小面积点睛，如藏青套装配橙红丝巾。',
    '上浅下深：视觉重心下移，显稳重；上深下浅则更轻盈。',
    '三色原则：全身颜色控制在三种以内（含中性色），避免杂乱。',
])

story.append(PageBreak())

# ---------------- 二、身形 ----------------
H1('二、身形分类与版型选择')
P('身形分类基于肩、胸、腰、臀的相对量感与比例。选择版型的目标不是改变身材，'
  '而是通过线条与重心引导视线，达到视觉平衡。')

H2('2.1 五大常见身形')
table_data = [
    ['身形', '特征', '穿搭重心'],
    ['苹果型', '腰腹有肉、四肢偏细、腰部不明显', '制造上半身视觉重心，V 领、高腰下装、遮腹不勒腰'],
    ['梨形', '臀腿偏宽、上半身单薄', '上亮下暗，强调肩颈，A 字 / 直筒下装平衡'],
    ['沙漏型', '胸腰臀比例明显、腰线清晰', '突出腰线，收腰连衣裙、贴合不紧绷'],
    ['矩形', '线条平直、腰线不明显', '层叠、腰带、廓形对比制造曲线'],
    ['倒三角', '肩背宽、下半身单薄', '弱化肩部，下装选阔腿 / 伞裙增加分量'],
]
t = Table(table_data, colWidths=[2.2*cm, 6.0*cm, 7.3*cm])
t.setStyle(TableStyle([
    ('FONTNAME', (0,0), (-1,-1), FONT),
    ('FONTSIZE', (0,0), (-1,-1), 9.5),
    ('BACKGROUND', (0,0), (-1,0), NAVY),
    ('TEXTCOLOR', (0,0), (-1,0), colors.white),
    ('TEXTCOLOR', (0,1), (-1,-1), colors.HexColor('#22304a')),
    ('GRID', (0,0), (-1,-1), 0.5, LINE),
    ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#f3f7ff')]),
    ('TOPPADDING', (0,0), (-1,-1), 5),
    ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ('LEFTPADDING', (0,0), (-1,-1), 6),
]))
story.append(t)
SP(8)
P('注：真实填写时以「个人中心」选定的 body_type 标签为准（取值：苹果 / 梨形 / 沙漏 / 矩形 / 倒三角）。'
  '若资料空缺，仅给出通用的「上紧下松、同色顺延显高」等中性原则，不强行归类。', note_style)

story.append(PageBreak())

# ---------------- 三、面料 ----------------
H1('三、服装面料常识')
P('面料决定服装的垂感、透气性、保暖性与打理难度。了解纤维特性有助于按季节与场合选衣。')

H2('3.1 天然纤维')
bullets([
    '棉：透气吸汗、亲肤，易皱、缩水，适合春夏日常。',
    '麻：凉爽挺括、透气佳，易皱，适合夏季。',
    '丝：光泽优雅、亲肤，娇贵需手洗 / 干洗。',
    '羊毛：保暖、回弹性好，易虫蛀，需防蛀与低温熨烫。',
])

H2('3.2 化学纤维')
bullets([
    '涤纶（聚酯纤维）：耐磨抗皱、快干，透气性一般，常与棉混纺。',
    '锦纶（尼龙）：强度高、轻，常用于外套与功能性衣物。',
    '氨纶（莱卡）：高弹性，少量加入提供 stretch，提升舒适度。',
    '莫代尔 / 天丝（莱赛尔）：再生纤维素纤维，柔软垂顺、亲肤，介于天然与化学之间。',
])

H2('3.3 混纺的意义')
P('多数成衣采用混纺：如棉 + 涤纶提升抗皱性，棉 + 氨纶增加弹性。看水洗标成分比例可判断衣物特性——'
  '排在前面的纤维占比最高。')

story.append(PageBreak())

# ---------------- 四、场合 ----------------
H1('四、场合着装规范（Dress Code）')
bullets([
    '正式 / 商务正装（Formal / Business）：西装套装、衬衫、皮鞋；女性可选套装裙或及膝连衣裙。',
    '商务休闲（Business Casual）：去掉领带，针织衫配西裤 / 及踝裙，保留整洁感。',
    '半正式（Semi-formal）：小礼服、品质连衣裙，介于正式与休闲之间。',
    '休闲（Casual）：牛仔、T 恤、运动鞋，注重合身与干净。',
    '主题 / 创意场合：在基调内加入个性单品，如亮色配饰、印花。',
])
P('通用原则：不确定着装尺度时，「略微偏正式」比「偏随意」更安全；'
  '配饰与鞋是决定精致度的关键，干净合身的衣物永远优先于品牌。', note_style)

story.append(PageBreak())

# ---------------- 五、胶囊衣橱 ----------------
H1('五、经典单品与胶囊衣橱')
H2('5.1 必备经典单品')
bullets([
    '白衬衫：可正式可休闲，搭配西裤或牛仔皆宜。',
    '小黑裙（LBD）：应对多数半正式场合的安全牌。',
    '西装外套：提升利落感，披在肩上也能造型。',
    '直筒 / 修身牛仔裤：耐穿、易搭。',
    '风衣 / 大衣：换季与通勤的体量感单品。',
    '中性色针织衫：叠穿核心。',
])
H2('5.2 胶囊衣橱概念')
P('胶囊衣橱指用少量（通常 30–40 件）可互相搭配的基础单品，组合出大量造型，减少决策成本与浪费。'
  '其要义是：以中性色为基底，加入 1–2 个强调色，保证每件单品至少能与三件其他单品搭配。')

story.append(PageBreak())

# ---------------- 六、视觉原理 ----------------
H1('六、体型修饰的视觉原理')
bullets([
    '强调与弱化：放大想展示的部位（亮色、图案、材质），收敛想隐藏的部位（深色、简洁）。',
    '比例分割：高腰线把腿部分视觉拉长；三分法（上 1/3、下 2/3）最常见。',
    '线条引导：竖线条（竖纹、开襟、长项链）延伸身形；横线条显宽。',
    '量感平衡：上身宽则下装增量感（阔腿），下身宽则上装增量感（垫肩、泡泡袖谨慎）。',
    '同色顺延：上下同色消除分割线，显高显瘦。',
])

story.append(PageBreak())

# ---------------- 七、保养 ----------------
H1('七、服饰清洗与保养')
bullets([
    '读懂水洗标：筒型温度代表机洗水温，三角代表漂白，正方形代表烘干，熨斗代表熨烫。',
    '分类洗涤：深浅分开、粗糙与细腻分开，拉链扣好防勾丝。',
    '羊毛 / 丝：冷水手洗或干洗，平铺阴干不变形。',
    '收纳：换季衣物洗净后防潮防蛀；羽绒、羊毛用透气袋，忌真空长期压缩。',
    '去渍原则：尽快处理、由外向内拍吸，避免摩擦扩大污渍圈。',
])

story.append(PageBreak())

# ---------------- 八、误区 Q&A ----------------
H1('八、常见穿搭误区（Q&A）')
qa = [
    ('Q1：胖就一定穿黑色显瘦？', '不一定。全身黑易显沉闷，关键在版型与比例；深色用于想收敛的部位即可，'
     '再用亮色点缀提气色。'),
    ('Q2：矮个子不能穿长款？', '可穿，但注意腰线（如系带、开襟）与鞋裤同色顺延，避免被衣服「吃掉」身高。'),
    ('Q3：梨形只能穿深色下装？', '下装可用深或中性色，但上半身用亮色 / 图案把视线引上去，比单纯藏更重要。'),
    ('Q4：正装必须全套黑？', '深蓝、灰、驼等同属正式色系，成套协调即可，不必局限于黑。'),
    ('Q5：流行就等于适合我？', '流行是参考而非命令，结合身形、肤色、场合做减法才是个人风格。'),
    ('Q6：紧身才显瘦？', '过度紧身反而暴露轮廓；微松、合身、有垂感的版型更修饰。'),
    ('Q7：配饰是可有可无？', '配饰决定精致度与风格走向，是低成本提升完成度的关键。'),
    ('Q8：买很多便宜衣服更划算？', '从胶囊衣橱视角，少量高品质基础款比大量低质款更省钱且耐看。'),
]
for q, a in qa:
    H2(q)
    P(a)

story.append(PageBreak())

# ---------------- 九、术语表 ----------------
H1('九、常用术语表')
glossary = [
    ['术语', '含义'],
    ['版型', '服装的剪裁与廓形，如直筒、收腰、O 型'],
    ['廓形（Silhouette）', '衣物在人身上的整体外轮廓'],
    ['胶囊衣橱', '少量可互换搭配的基础单品集合'],
    ['Dress Code', '场合对着装正式程度的要求'],
    ['撞色', '使用互补色形成强对比的搭配'],
    ['高腰线', '提高腰线位置以拉长下半身比例的穿法'],
    ['中性色', '黑、白、灰、米、卡其等百搭底色'],
    ['莫代尔 / 天丝', '柔软垂顺的再生纤维素纤维'],
]
tg = Table(glossary, colWidths=[4.5*cm, 11.0*cm])
tg.setStyle(TableStyle([
    ('FONTNAME', (0,0), (-1,-1), FONT),
    ('FONTSIZE', (0,0), (-1,-1), 9.5),
    ('BACKGROUND', (0,0), (-1,0), NAVY),
    ('TEXTCOLOR', (0,0), (-1,0), colors.white),
    ('TEXTCOLOR', (0,1), (-1,-1), colors.HexColor('#22304a')),
    ('GRID', (0,0), (-1,-1), 0.5, LINE),
    ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#f3f7ff')]),
    ('TOPPADDING', (0,0), (-1,-1), 5),
    ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ('LEFTPADDING', (0,0), (-1,-1), 6),
]))
story.append(tg)
SP(10)
P('—— 文档结束。本手册可作为穿搭知识库的检索语料，覆盖色彩、身形、面料、场合、保养等多主题，'
  '便于验证分段召回与问答准确性。——', note_style)

# ---------------- 输出 ----------------
def footer(canvas, doc):
    canvas.saveState()
    canvas.setFont(FONT, 8.5)
    canvas.setFillColor(SUB)
    canvas.drawString(2*cm, 1.1*cm, '时尚穿搭与服装知识手册 v1.0')
    canvas.drawRightString(A4[0]-2*cm, 1.1*cm, '第 %d 页' % doc.page)
    canvas.setStrokeColor(LINE)
    canvas.line(2*cm, 1.4*cm, A4[0]-2*cm, 1.4*cm)
    canvas.restoreState()

out = 'E:/ai-wardrobe-agent/时尚穿搭与服装知识手册.pdf'
doc = SimpleDocTemplate(out, pagesize=A4, leftMargin=2*cm, rightMargin=2*cm,
                        topMargin=1.8*cm, bottomMargin=1.8*cm,
                        title='时尚穿搭与服装知识手册', author='AI 衣橱')
doc.build(story, onFirstPage=footer, onLaterPages=footer)
print('PDF generated:', out)
