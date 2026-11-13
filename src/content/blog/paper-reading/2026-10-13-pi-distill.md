---
title: '1013 π-Distill：只用「动作」当特权信息蒸馏前沿模型'
description: '蒸馏前沿模型有个现实障碍——像 GPT / Claude 这类闭源模型会把思维链（CoT）藏起来，只暴露「调了什么工具、传了什么参数」。而业界标准做法（SFT …'
pubDate: '2026-10-13'
---

> 2026-10-13 · 文献阅读 #54 · 方向：<strong>OPD（on-policy distillation）</strong> · <strong>只用「动作」当特权信息蒸馏前沿模型</strong> · ServiceNow + Mila · ICML 2026 Poster

## TL;DR

<strong>一句话：蒸馏前沿模型有个现实障碍——像 GPT / Claude 这类闭源模型会把<strong>思维链（CoT）藏起来</strong>，只暴露「调了什么工具、传了什么参数」。而业界标准做法（SFT on CoT + RL）恰恰依赖 CoT，于是整条标准蒸馏流水线失效。π-Distill 的做法是：<strong>让同一个模型分饰两角——一个「看过特权信息的教师」，一个「没看过的学生」，共享参数、联合训练</strong>，从而在<strong>只看得到动作</strong>的前提下完成蒸馏。</strong>

- <strong>最刺眼的一组数（Table 1，Qwen3-8B）</strong>：TravelPlanner 上 <strong>π-Distill(α=1) 44.1% vs 业界标准 SFT w/ CoT + RL 32.3%</strong>（<strong>+11.8</strong>）；τ-Bench Retail 上 π-Distill(α=0) <strong>31.1% vs 29.1%</strong>
- <strong>论文原话的结论</strong>：<strong>"the absence of these proprietary traces is not a limiting factor"</strong>——<strong>不给你 CoT 也没关系</strong>，我们照样能蒸馏，<strong>甚至超过「假设有完整 CoT」的业界标准</strong>
- <strong>效率上还有一个白送的好处</strong>：SFT + RL 要<strong>扫多个 SFT checkpoint</strong> 才能找到峰值，而 π-Distill <strong>只需要一个训练阶段</strong>
- <strong>最反直觉的一条（Figure 4，OOD）</strong>：<strong>纯 RL 在所有 OOD 评测上都比 base 模型更差</strong>（RL 会退化）；而 <strong>π-Distill 在所有情况下都不退化</strong>，OPSD 在强模型上也不退化
- <strong>规模效应是反着来的</strong>：Qwen3-<strong>4B</strong> 上 SFT w/ CoT + RL 还占优（26.4），到 Qwen3-<strong>8B</strong> 就被 π-Distill / OPSD 反超 → 论文的解读是 <strong>"模型越强，越该走 on-policy"</strong>
- <strong>三种特权信息（信息密度递减）</strong>：① <strong>工具调用 + 参数</strong>（完整动作序列） ② <strong>只有工具名</strong>（参数要自己推） ③ <strong>自生成提示</strong>（让模型把前沿轨迹总结成一句话）——<strong>最优配置随 α 和 PI 属性而变，没有一种永远最好</strong>
- <strong>α 的三个取值</strong>：<strong>α=0</strong>（只训学生，要 KL 低 + 效用为正）· <strong>α=0.5</strong>（联合训练，<strong>16 个场景里 7 个最好、只有 1 次最差，最稳</strong>）· <strong>α=1</strong>（只训教师，KL 大就退化，KL 太小会<strong>崩塌</strong>）
- <strong>⚠️ 一个必须点明的命名碰撞</strong>：lib 8/19 读过的 <strong>"OPSD（Self-Distilled Reasoner）"</strong>和<strong>本篇提出的 "OPSD"</strong>是<strong>两个不同的东西</strong>。本篇自己在脚注里说，命名是跟随<strong>并发工作</strong>（Shenfeld 2026 / Zhao 2026 / Hübotter 2026），而<strong>它专门刻画了 OPSD 会失败的情形</strong>——这是它相对并发工作的增量
- <strong>⚠️ 论文有独立 Limitations 章节（3 条）</strong>：① 所有 PI 都来自前沿模型轨迹，<strong>没有前沿模型也没有真值答案时怎么获得 PI，未解</strong> ② 实验只到 <strong>≤8B</strong> ③ §7 的分析是<strong>观察性研究，没有系统控制变量</strong>
- <strong>主题轮换</strong>：今日<strong>OPD</strong>（按序列从具身智能（10/12 SOMA）切回；上次该主题是 9/30 SDPO）

## 文献信息

| 字段 | 内容 |
|-|-|
| 标题 | Privileged Information Distillation for Language Models（主方法名 <strong>π-Distill</strong>，另提出 <strong>OPSD</strong>） |
| 作者 | Emiliano Penaloza、Dheeraj Vattikonda、Nicolas Gontier、Alexandre Lacoste、Laurent Charlin、Massimo Caccia（6 人，通讯 Emiliano Penaloza） |
| 机构 | <strong>ServiceNow</strong>（第 1、4、6 作者）+ <strong>Mila Quebec</strong> + <strong>Université de Montréal</strong> + <strong>McGill University</strong> + <strong>HEC Montréal</strong>（以论文页脚逐字为准；ICML 官方列表的逐作者字段与之一致） |
| 发布时间 | arXiv:2602.04942（v1 2026-02-04，v3 2026-02-16；全文 42 页） |
| 会议 | <strong>ICML 2026 Poster（Accept regular）</strong>（一手确认：<strong>ICML 官方 virtual 全量数据</strong> icml-2026-orals-posters.json 命中，count=6797 完整解析，eventtype=<strong>Poster</strong>，session="Poster Session 4"，room="HALL A"，poster <strong>#1908</strong>，topic="Deep Learning→Large Language Models"，<strong>decision 字段逐字 = "Accept (regular)"</strong>，paper\_url=OpenReview forum ebZcMQImhG；<strong>阳性对照</strong>=同表命中 lib 已读的 SDPO / VGS / OPSD(Self-Distilled Reasoner) / TMS / SOMA 全部命中。<strong>⚠️ 另需如实说明：该篇 arXiv abs 页 Comments 字段<strong>没有</strong>任何录用标注（只写了一句与论文无关的话）；OpenReview 论坛页被反爬拦截，且 api2.openreview.net 在本机对所有 forum id（含已知存在的 SOMA / WorldPlay / SDPO / GraphGPO）均返回 0 条 → 判定为该接口在本地环境的限制，不是 ID 不存在。因此本篇录用结论依据的是官方全量列表这一个一手来源</strong>） |
| 链接与代码 | <a href="https://arxiv.org/abs/2602.04942">arXiv:2602.04942</a> · OpenReview forum ebZcMQImhG · <strong>无独立项目页</strong>（论文未给出代码仓库链接） |
| 性质 | <strong>算法论文（两个目标函数 + 大量分析）</strong>；<strong>有独立 Limitations 章节</strong>（在 §10）；lib 里第一篇把 OPD 用在<strong>多轮工具调用（multi-turn tool-calling）</strong>上的论文 |
| 任务与基准 | <strong>训练域</strong>：τ-Bench retail（500 训练任务）、Travel Planner（45 训练任务）；<strong>域内评测</strong>：τ-Bench retail 115 留出任务、Travel Planner 180 留出任务；<strong>域外（OOD）</strong>：τ-Bench airline（50 任务）+ <strong>GEM QA 工具套件</strong>（7 个环境：2Wiki / PopQA / TriviaQA / HotpotQA / Bamboogle / NaturalQuestions / Musique） |
| 特权信息来源 | 从 <strong>DeepSeek-chat-v3.1</strong> 挖轨迹（<strong>选它是因为开源、能拿到它的推理 token</strong>，从而可以构造"假设有完整 CoT"的对照）。采集 <strong>15,885 条</strong> τ-Bench retail 成功轨迹 + <strong>1,986 条</strong> Travel Planner 成功轨迹；每个任务选<strong>步数最少</strong>的那条成功轨迹来构造 PI；最终覆盖 Travel Planner 全部 <strong>45</strong> 个任务、τ-Bench <strong>300/500</strong> 个任务 |
| 骨干与基线 | 骨干 <strong>Qwen3-4B / Qwen3-8B</strong> + <strong>R1-Distill-Llama-8B</strong>（跨家族）；基线 = ① 标准 RL ② SFT on 专家轨迹（<strong>带 / 不带 CoT</strong>）③ <strong>SFT + RL</strong>；全部 RL 用 <strong>GRPO</strong>（Eq.1，并按 Yu 2025 / Liu 2025 的建议去掉了对 base 模型的 KL 惩罚） |
| 训练设置 | <strong>2×H100</strong>，上下文上限 <strong>25k</strong> token；对超过 <strong>15k</strong> token 的轨迹加<strong>长度惩罚</strong>；对 PI 里被反复引用的高频 token（如 "hint"）加<strong>频率惩罚</strong>；<strong>3 个随机种子</strong>取平均；模型评分为<strong>连续 3 个 checkpoint 的最优滑动平均</strong>（同时看性能与稳定性） |

## 一、先看例子（大白话：只给你看他的一双手，不给你看他的脑子）

> 💡 <strong>铺垫</strong>：想学一个很强的闭源 agent，最强做法是把它"怎么想 + 怎么做"都学过来——<strong>拿它的思维链做 SFT，再上 RL</strong>，这是业界标准。
>
> <strong>但闭源厂商把思维链藏了。</strong>你只能看到它调用了哪些工具、传了什么参数，看不到它为什么这么调。

> <strong>把这件事想成"只看到手，看不到脑"：</strong>
>
> 你能看到专家：先调 <strong>id\_by\_email("joe@gmail.com")</strong> 拿到用户 id，再调 <strong>get\_order(id=3)</strong> 取订单——<strong>这两步就是全部你能看到的</strong>。
>
> 你看不到的是它心里那句"<strong>得先拿 email 换 id，不然 get\_order 没法调</strong>"。
>
> <strong>问题是</strong>：标准蒸馏流水线要的恰恰是那句"心里话"。没有它，SFT 退化、RL 拿不到有效信号。
>
> <strong>π-Distill 的思路</strong>：既然只能看到动作，那就<strong>把动作本身当成"特权信息"</strong>——训练时让模型偷看"专家当时调了什么"，同时逼它在<strong>推理时看不到这份信息</strong>的情况下也能做对。

![▲ 论文 Figure 3：从前沿模型轨迹里提取特权信息。左栏是采到的原始轨迹，其中「Frontier Model Thinking」被灰掉划掉——那就是被闭源厂商遮蔽的思维链。右栏是从中提炼出的三种特权信息（信息密度递减）：① Tool Calls & Arguments（工具调用+参数，最完整）② Tool Calls（只有函数名，参数要自己推）③ Self-Generated（让模型把整条轨迹总结成一句话提示）](/images/paper-reading/2026-10-13-pi-distill/2026-10-13-d55-1.webp)

## 二、动机：真正的难题不是"学"，是"迁移"

- <strong>特权信息（Privileged Information, PI）为什么有用</strong>：<strong>训练时给模型额外信息，能让它做到本来做不到的事</strong>——对 RL 尤其关键，因为 RL 的学习依赖于"模型能不能先成功一次"（成功轨迹本身稀缺）。PI 相当于帮模型<strong>自助起步（bootstrap）</strong>
- <strong>🔑 但核心难题是迁移</strong>：<strong>训练时用 PI 学到的能力，怎么迁移到一个推理时没有 PI 的策略上？</strong>这才是全文要解的问题
- <strong>论文点出三个具体障碍</strong>： 
  - <strong>① base 模型不会自动用 PI</strong>——它<strong>必须先学会怎么用</strong>，才能从中获益（论文 §7 用实验证明了这一点）
  - <strong>② 顺序流水线问题很多</strong>：直观做法是"先训一个带 PI 的策略，再把它蒸馏到不带 PI 的策略"，但——<strong>不知道该蒸哪个 checkpoint</strong>、<strong>从它的轨迹学习是 off-policy 且不稳定</strong>、<strong>分两次训很不经济</strong>。论文早期实验确认这条路性能次优
  - <strong>③ 分布漂移</strong>：<strong>条件在 PI 上会让采样分布大幅偏离无条件分布</strong>，这让迁移显著变难
- <strong>于是 π-Distill 的立论</strong>：既然顺序流水线有这么多毛病，那就<strong>把教师和学生放在同一个共享参数的模型里、联合训练</strong>——让模型<strong>一边学会用 PI，一边学会没有 PI 也能做</strong>

![▲ 论文 Figure 1：π-Distill 框架。(1) 从前沿 agent 采集成功轨迹（它只暴露动作、隐藏 CoT）；(2) 把轨迹转成训练时的特权信息 I，喂给带 PI 条件的教师 πT(o|s,I)；(3) 带 PI 的教师与不带 PI 的学生共享参数、联合训练，最终得到一个测试时不需要 PI 的策略](/images/paper-reading/2026-10-13-pi-distill/2026-10-13-d55-2.webp)

## 三、方法：一个模型，两个角色，两个目标

### 3.1 形式化设定

- <strong>多轮 agentic 交互建模成 MDP</strong>：策略 π<sub>θ</sub>(o | s) 与环境交互；s 是<strong>不断累积的交互上下文</strong>（初始 prompt + 模型历史输出 + 环境所有回复）
- <strong>一条输出 o = (z, a)</strong>：<strong>z 是推理 token、a 是动作 token</strong>；π<sub>θ</sub>(o|s) = Π π<sub>θ</sub>(z<sub>i</sub>, a<sub>i</sub> | s<sub>&lt;i</sub>)
- <strong>优化器</strong>：GRPO（组相对优势 + 裁剪重要性采样），并<strong>去掉了对 base 模型的 KL 惩罚</strong>（论文引近期工作说该惩罚会拖累性能）

### 3.2 π-Distill：共享参数的双角色

用<strong>同一个参数 θ</strong> 同时当两个角色：<strong>教师 π<sup>T</sup><sub>θ</sub>(o|s,I)</strong>（带特权信息 I）和<strong>学生 π<sup>S</sup><sub>θ</sub>(o|s)</strong>（不带）。两个目标同时训：

> <strong>教师目标（Eq.2）</strong>：J<sub>Teacher</sub>(θ) = E<sub>o\~π<sup>T</sup></sub>\[R(o,s)\] − β·D<sub>KL</sub>( π<sup>T</sup><sub>θ</sub>(o|s,I) ‖ sg(π<sup>S</sup><sub>θ</sub>(o|s)) )
>
> <strong>学生目标（Eq.3）</strong>：J<sub>Student</sub>(θ) = E<sub>o\~π<sup>T</sup></sub>\[ (π<sup>S</sup><sub>θ</sub>(o|s) / sg(π<sup>T</sup><sub>θ</sub>(o|s,I))) · R(o,s) \] − β·D<sub>KL</sub>( sg(π<sup>T</sup><sub>θ</sub>(o|s,I)) ‖ π<sup>S</sup><sub>θ</sub>(o|s) )
>
> <strong>合成（Eq.4）</strong>：J<sub>π-Distill</sub>(θ) = α·J<sub>Teacher</sub>(θ) + (1−α)·J<sub>Student</sub>(θ)

- <strong>教师目标的两个作用</strong>：① 让它<strong>拟合学生熟悉的、高奖励的模式</strong>（这样从它的轨迹学起来更容易）② <strong>共享参数本身就在促进知识迁移</strong>，哪怕学生没被直接训练
- <strong>学生目标在做什么</strong>：<strong>从教师采样轨迹，但更新的是学生</strong>——教学生不用 PI 也能复现教师的高奖励行为
- <strong>α 的三个取值（这是全文最实用的一个旋钮）</strong>： 
  - <strong>α = 1</strong>：只优化教师（学生靠共享参数顺带获益）
  - <strong>α = 0</strong>：只让学生学教师当前的行为
  - <strong>α = 0.5</strong>：联合优化——<strong>共享参数把"用 PI"的表示迁移给学生，学生更新又保证这些表示在没有 PI 时依然有效</strong>
- <strong>与 Variational EM 的联系</strong>：可以看作近似后验 π<sup>T</sup> 逼近目标分布 π\* —— <strong>E 步改进 π<sup>T</sup>，M 步把它蒸馏进 π<sup>S</sup></strong>。传统做法是顺序/交替、用两个模型；<strong>这篇的贡献是把它改成"共享参数 + 同时训"</strong>

### 3.3 OPSD：on-policy 的替代方案

> <strong>J<sub>OPSD</sub>(θ) = E<sub>o\~π<sup>S</sup><sub>θ</sub>(o|s)</sub>\[R(o,s)\] − β·D<sub>KL</sub>( π<sup>S</sup><sub>θ</sub>(o|s) ‖ sg(π<sup>T</sup><sub>θ</sub>(o|s,I)) )</strong>

- <strong>和 π-Distill 的关键差别</strong>：这里的期望是<strong>在学生策略 π<sup>S</sup> 上取的（on-policy）</strong>，而 π-Distill 是<strong>在教师轨迹上取的（off-policy）</strong>
- <strong>反向 KL 在这里的角色</strong>：<strong>一个稠密的 per-token 奖励</strong>，衡量学生与教师有多接近
- <strong>论文自己在脚注里承认命名是跟随并发工作</strong>（Shenfeld 2026 / Zhao 2026 / Hübotter 2026 提出了同一目标，分别用于持续学习、真值答案、反思自反馈）——<strong>而本篇的增量是：把 OPSD 用在"没有真值的 PI 迁移"上，并刻画了它会失败的情形</strong>

## 四、实验

### 4.1 主结果（Table 1）

<strong>Qwen3-8B（三列分别是 Travel Planner / τ-Bench Retail / τ-Bench Airline OOD，单位 %）：</strong>

| 方法 | Travel Planner | τ-Bench Retail | τ-Bench Airline（OOD） |
|-|-|-|-|
| <em>DeepSeek V3.1 Chat-671B（前沿模型，参照上限）</em> | <em>45.0</em> | <em>51.3</em> | <em>40.0</em> |
| Base | 23.6 | 3.35 | 6.40 |
| RL（无 PI） | 27.5 | 23.9 | 6.67 |
| SFT w/o CoT + RL | 31.3 | 23.5 | 6.00 |
| <strong>SFT w/ CoT + RL（业界标准，假设有完整 CoT）</strong> | <strong>32.3</strong> | <strong>29.1</strong> | <strong>8.00</strong> |
| OPSD | 37.5 | 27.3 | <strong>14.0</strong> |
| π-Distill（α=0，只训学生） | 40.7 | <strong>31.1</strong> | 12.0 |
| π-Distill（α=0.5，联合） | 41.1 | 30.6 | 7.33 |
| <strong>π-Distill（α=1，只训教师）</strong> | <strong>44.1</strong> | 29.7 | 9.33 |

![▲ 论文 Figure 2：Qwen3-8B 在 Travel Planner 与 τ-Bench retail 上的结果。虚线左侧的 SFT w/ CoT + RL 是业界标准，虚线表示它不构成必须超越的对象（因为其他方法都不依赖前沿模型的 CoT）。可以看到 π-Distill 的各变体与 OPSD 全面超过它](/images/paper-reading/2026-10-13-pi-distill/2026-10-13-d55-3.webp)

- <strong>Qwen3-8B 上，π-Distill 不论 α 取什么都超过了业界标准</strong>；最好情况下的提升是 Travel Planner <strong>+11.8</strong>、τ-Bench retail <strong>+2.08</strong>、airline <strong>+6.00</strong>
- <strong>Qwen3-4B 上，α=0 能超过 SFT + RL w/ CoT</strong>（28.5 vs 26.4），其他 α 接近
- <strong>α 没有"永远最好"的值</strong>，最优 α 随设定而变（§7 专门分析）
- <strong>论文特意说明这个对比的强度</strong>：<strong>SFT w/ CoT + RL 是"软上界"</strong>——它<strong>假设能拿到完整 CoT</strong>，而我们的方法<strong>拿不到</strong>，却仍然超过它
- <strong>R1-Distill-Llama-8B 上也有意义</strong>：该模型<strong>即便条件在 PI 上也生不出正确轨迹</strong>，所以先给它做了 SFT w/ CoT 暖启动——结果 <strong>π-Distill 在被 SFT 过含 PI 数据之后依然有用</strong>（α=0 时 Retail 18.6 vs SFT+RL 16.3）

### 4.2 域外泛化（Figure 4，GEM 工具套件 7 个环境）

- <strong>π-Distill 各变体一致超过 base 和标准 RL</strong>；OPSD 在更强的模型（8B）上同样成立
- <strong>与 SFT w/ CoT + RL 的对比随模型规模反转</strong>：<strong>4B 上 SFT+RL 仍是最强</strong>（OPSD 明显退化）；<strong>8B 上 π-Distill(α=0/0.5) 与 OPSD 显著超过它</strong>
- <strong>🔑 最反直觉的一条</strong>：<strong>纯 RL 在所有评测上都比 base 模型更差</strong>（退化）；而 <strong>π-Distill 在所有情况下避免了退化</strong>，OPSD 在强模型上也能避免
- <strong>论文的两条 takeaway</strong>：① <strong>Scaling Benefits for Stronger Reasoners</strong>——模型能力越强，"更 on-policy"越有利 ② <strong>Prevention of RL Degradation</strong>——标准 RL 一路掉分，π-Distill 一路不掉

### 4.3 分析：到底什么在起作用（§7，Figure 5 / 6 / 7）

![▲ 论文 Figure 5：PI 类型与算法对性能的影响。上排 τ-Bench、下排 Travel Planner，横轴是初始的师生 KL 散度，散点是最终得分；下方柱状是 PI 效用 Δ。三个关键观察：(1) 初始 KL 越大，最终性能一般越差 (2) 联合训练（α=0.5，三角）最稳 (3) 只训学生需要低 KL + 正效用；只训教师在 KL 大时退化、KL 极小时则因策略崩塌而失效](/images/paper-reading/2026-10-13-pi-distill/2026-10-13-d55-4.webp)

- <strong>论文提出两个决定性因素</strong>：① <strong>条件/无条件两个 base 策略之间的散度</strong>（π-Distill 用 D<sub>KL</sub>(π<sup>T</sup><sub>base</sub>‖π<sup>S</sup><sub>base</sub>)，OPSD 用反向）② <strong>特权信号的效用</strong> Δ = score(π<sup>T</sup><sub>base</sub>) − score(π<sup>S</sup><sub>base</sub>)
- <strong>α=1（只训教师）的失败模式很有意思</strong>：用"只有工具名"当 PI 时它反而变差——<strong>追到根因是 KL 在训练早期就崩塌到接近 0，教师和学生互相塌成一样（π<sup>T</sup>≈π<sup>S</sup>），于是教师学会了"忽略 PI"</strong>（Figure 7）。他们还试过改用 π<sub>base</sub> 算 KL，结果更差
- <strong>α=0.5（联合）是最稳的</strong>：<strong>16 个场景里 7 个最好，只有 1 次最差</strong>，有效避开了另外两种设置的失败模式。论文建议<strong>在缺少多种 PI、或没预算扫 α 时直接用 0.5</strong>
- <strong>α=0（只训学生）的规律很干净</strong>：<strong>低 KL 是成功的强预测因子</strong>（分布漂移小 → 从条件轨迹学习更容易）；而 <strong>PI 效用的角色也很大</strong>——Travel Planner + Qwen3-8B 上 α=0 明显掉分，就是因为那份 PI <strong>效用为负（Δ&lt;0）</strong>，反而在伤害性能
- <strong>一个漂亮的旁证</strong>：<strong>低 KL 时"只训学生"能把知识反向传回教师</strong>——虽然教师没被直接训练，但它从共享参数里学会怎么用 PI 了（Qwen3-8B + Travel Planner + 只用工具调用那组，初始 Δ&lt;0 但最终好转）

![▲ 论文 Figure 7：只训教师（α=1）时 πT 与 πS 之间的 KL 随训练步数变化（τ-Bench，PI 为「只有工具名」）。可以看到即便 β=0，KL 也在早期迅速掉到接近 0——教师和学生塌成同一个，于是教师学会了忽略 PI，性能连 RL 基线都不如](/images/paper-reading/2026-10-13-pi-distill/2026-10-13-d55-5.webp)

### 4.4 训练细节里两个值得记的工程处理

- <strong>长度惩罚</strong>：轨迹经常超过 25k 上下文上限，于是对<strong>超过 15k token</strong> 的轨迹加惩罚
- <strong>高频 token 惩罚</strong>：训练中观察到<strong>少数引用 PI 的 token（比如 "hint"）KL 异常高</strong>，于是对这类 token 的出现频率加惩罚——不过论文说实践中它<strong>对最终性能影响很小</strong>

## 五、Limitations &amp; 批判性思考

### 论文自述的 3 条

- <strong>PI 的来源被限定了</strong>：所有 PI 都是从<strong>前沿模型轨迹</strong>变换来的。<strong>"既没有前沿模型动作、也没有真值答案时，怎么高效拿到有用的 PI"是个未解方向</strong>（并发工作 Hübotter 2026 从自我反思里挖 PI 是一个尝试）
- <strong>规模只到 8B</strong>，进一步 scaling 才能看出更多关键因素
- <strong>§7 的分析是观察性研究</strong>：<strong>没有系统控制所有变量</strong>，只是观察不同配置的性质。<strong>一个系统控制变量的研究能帮助规避失败情形</strong>

### 我读出来的额外问题

1. <strong>① "只用动作就能超过用完整 CoT"这个结论，建立在一个必须点明的前提上——PI 是从 DeepSeek-chat-v3.1 挖的，而那是开源模型，它的 CoT 是拿得到的。</strong>论文用这个"能拿到 CoT"的性质来构造"假设有完整 CoT"的软上界对照，逻辑上说得通；但<strong>在实际面对 GPT / Claude 这类真闭源模型时，你连"动作轨迹"的采集都要靠调用它们的 API，成本、可重复性、许可都是另一回事</strong>——论文没有讨论这部分工程现实
2. <strong>② "跳过 transfer\_to\_human\_agents 工具"这个改动值得警惕。</strong>论文在 τ-Bench 上<strong>移除了转人工工具，原因是"它持续导致 reward hacking"</strong>。<strong>那这个"reward hacking"是环境的漏洞还是策略的真实失败？移除之后，模型学到的行为是否还能迁移到有该工具的真实客服场景？</strong>论文没有讨论——而这类"为了让训练跑通而改环境"的操作，恰恰可能让结论在真实部署时失效
3. <strong>③ Travel Planner 的奖励也被改过。</strong>原文说原仓库的 rubric 评估"优先检查 easy 约束再检查 hard 约束"，<strong>导致策略崩塌到不受欢迎的行为</strong>，于是他们<strong>把奖励解耦（easy 约束直接绑到对应的 hard 约束）</strong>。<strong>改了奖励函数之后报告的数字，和原基准上的数字是不可比的</strong>——这本身合理，但论文没有给"改前 vs 改后"的对照，读者无法判断这个改动对结论的影响有多大
4. <strong>④ 无一例外依赖"前沿模型轨迹"，而这正是最脆的一环。</strong>整篇的价值主张是"不给你 CoT 也能蒸馏"，但<strong>它仍然需要你能大规模采集前沿模型的成功轨迹</strong>——这在很多场景下同样是被禁止的（很多厂商的服务条款明确禁止用输出去训练竞品）。<strong>论文只在 Limitations 里提了"没有前沿模型时怎么办"，没提"不允许用但能拿到"这一档</strong>
5. <strong>⑤ 三个 α 的结论"没有永远最好的值"削弱了它的可操作性。</strong>论文说 α=0.5 "最稳、建议默认用"，但同一个 §7 又说"更细的 α 调优大概能在多数场景拿到最优"——<strong>那到底该不该花预算扫 α？论文把这个问题留给 future work，等于把超参选择的负担推给了使用者</strong>
6. <strong>⑥ OPSD 命名与 lib 已读的 OPSD 冲突，读者极易混淆。</strong>论文自己在脚注里说明是跟随三篇并发工作，但<strong>三篇并发工作用的是"同一目标"，而 lib 8/19 读的 "Self-Distilled Reasoner" 那篇用的"OPSD"是本篇引用的 Zhao 2026</strong>——也就是说：<strong>本篇的 OPSD ≠ lib 已读的 OPSD（前者是 RL + 反向 KL 惩罚，后者是逐 token 前向 KL 蒸馏）</strong>。论文对此没有任何澄清，这在实际引用时会踩坑
7. <strong>⑦ 效率优势的举证不够硬。</strong>论文主张"π-Distill 只需一个训练阶段，比 SFT+RL 省"，但<strong>没有给出实际的墙钟时间或算力对照表</strong>——"省一个阶段"是结构上的省，具体省多少没有数字
8. <strong>⑧ 只训 3 个种子、且分数取"连续 3 个 checkpoint 的最优滑动平均"。</strong>这个评分方式<strong>同时掺入了性能和稳定性两个维度，但会让"波动大但峰值高"的配置被系统性压低</strong>——对 π-Distill（论文说它更稳）是有利的口径。论文没有报告"单个最佳 checkpoint"的口径做交叉验证

## 六、与前文对照

> 🔗 <strong>一句话定位</strong>：lib 的 OPD 主线此前几乎全在<strong>单轮推理</strong>上（数学 / 科学题，SDPO / OPSD / HPD / EOPD / VGS …）。<strong>π-Distill 是 lib 里第一篇把 OPD 系统性地用到"多轮工具调用"上的论文</strong>，而且它把"特权信息"这个轴逼到了一个极端——<strong>特权信息里连推理过程都没有，只剩动作</strong>。

### 6.1 与 OPSD（8/19，Self-Distilled Reasoner）——命名碰撞 + 方法差别

| 维度 | OPSD（lib #19，8/19） | OPSD（本篇） |
|-|-|-|
| <strong>出处</strong> | Zhao et al. 2026，"Self-Distilled Reasoner" | 本篇（Penaloza et al. 2026），与 Zhao 2026 是<strong>并发独立提出</strong> |
| <strong>特权信息</strong> | <strong>标准答案 y\*</strong>（有真值） | <strong>前沿模型的动作轨迹</strong>（<strong>没有真值</strong>，也没有 CoT） |
| <strong>目标形式</strong> | 学生自己 rollout + <strong>逐 token 前向 KL 蒸馏</strong>（+ 逐 token 点式裁剪） | 学生自己 rollout（on-policy）+ <strong>RL 奖励 − β·反向 KL 惩罚</strong> |
| <strong>场景</strong> | 单轮推理（数学） | <strong>多轮工具调用 agentic</strong> |
| <strong>本篇的增量</strong> | —— | <strong>专门刻画了 OPSD 会失败的情形</strong>（强依赖 PI 的信息丰富度，KL 过大时正效用也会被压过） |

<strong>所以两篇虽然同名 OPSD，但严格说不是一回事。以后在 lib 里提到 OPSD 必须标清是哪一篇的定义。</strong>

### 6.2 与 SDPO（9/30）——同一"特权信息"家族的两个不同特例

- <strong>SDPO 的特权信息 = 环境反馈</strong>（报错、失败测试、同组成功解）；<strong>π-Distill 的特权信息 = 前沿模型的动作轨迹</strong>——<strong>两者都不是"标准答案"</strong>，都在解"没有真值时怎么蒸馏"
- <strong>两者的教师都是"同一个模型 + 特权上下文"</strong>（共享参数）——<strong>这个骨架两篇完全一致</strong>
- <strong>差别在目标函数</strong>：SDPO 的梯度等价于"logit 级策略梯度"（优势是师生对数比）；π-Distill 是<strong>显式的双目标（教师项 + 学生项）加权</strong>，且教师也有独立的 RL 目标
- <strong>一个有意思的对照</strong>：SDPO 靠"师生打分对象完全一致"（学生的答案被 prefill）来保证对齐；<strong>π-Distill 恰恰相反——师生看的是不同的输入（一个有 PI、一个没有），它靠"联合训练 + β 惩罚"来强行压住分布漂移</strong>

### 6.3 与 WorldPlay（10/9）——"师生条件不一致"的同一诊断，两种极端解法

- WorldPlay 的核心发现是：<strong>蒸馏失败不是因为教师太弱，而是师生看到的条件不一致</strong>（教师无记忆 vs 学生有记忆）→ 解法是<strong>把教师的上下文改造成学生的上下文（Context Forcing）</strong>
- π-Distill 面对的是<strong>同一个诊断的另一个极端</strong>：<strong>这里师生本来就是同一个模型，唯一差别就是"教师多看了 PI"</strong>——而它<strong>不能</strong>用 WorldPlay 的办法（把 PI 也给学生），因为<strong>PI 在推理时根本不存在</strong>
- <strong>所以它换了方向</strong>：不是"让师生看一样的东西"，而是<strong>"训练时允许不一致，但用一个可调的 β 惩罚把漂移控制住"</strong>——<strong>这是同一个问题在"条件差异无法消除"时的另一种解法</strong>，与 WorldPlay 互补

### 6.4 与 RL-Cap（9/04）/ Forget-Me-Not（9/29）——两个已知结论的再次印证

- <strong>RL-Cap</strong> 的结论是"RLVR 只重排概率、不扩能力边界，只有蒸馏能扩"——<strong>π-Distill 正是把蒸馏做成了 RL 的替代路径</strong>（它甚至在 Table 1 里显示纯 RL 远不如蒸馏）
- <strong>Forget-Me-Not / RL's Razor</strong> 的结论是"on-policy 更不容易遗忘"——<strong>本篇 Figure 4 又给了一条独立证据</strong>：<strong>纯 RL 在所有 OOD 评测上都退化，而 π-Distill 全都不退化</strong>。这条规律在 lib 里已经是第三次出现了

## 七、启发与待跟进

> 💡 <strong>今天最该带走的一条</strong>：<strong>"特权信息"不必是答案，也不必是推理过程——它可以是"别人当时做了什么"。</strong>只要有一个比你强的系统留下过可观测的行为痕迹，这份痕迹就能当教师的额外输入。<strong>这把"能从谁身上学"的范围一下子扩大了</strong>：从"必须有真值"→"必须能看到 CoT"→<strong>"只要能观测到行为"</strong>。

### 方法启发（可迁移）

- <strong>① "训练时给额外信息、推理时不给"是一个独立于蒸馏的设计维度。</strong>把特权信息和"教师是谁"解耦之后，<strong>你能自由组合</strong>：真值答案、环境反馈、专家动作、检索结果、工具返回值……<strong>凡是训练时能拿到、推理时拿不到的东西，都是候选特权信息</strong>
- <strong>② "共享参数"是把 off-policy 蒸馏救回来的关键一手。</strong>顺序流水线（先训带 PI 的、再蒸到不带 PI 的）的三个毛病——不知蒸哪个 checkpoint、off-policy 不稳、两次训练不经济——<strong>用一个共享参数的模型 + 联合目标一次性解决</strong>。这个套路可以搬到任何"两阶段训练"的场景
- <strong>③ 一个可调的 β 惩罚，作用是"压住条件差异带来的分布漂移"。</strong>当师生条件<strong>无法</strong>对齐时（推理时 PI 不存在），<strong>那就别指望对齐，改成显式惩罚漂移 + 让教师也拟合学生熟悉的模式</strong>
- <strong>④ 教师也有独立的 RL 目标，这一手值得注意。</strong>通常教师是冻结的；这里<strong>教师一边被 RL 提升、一边被 KL 拉住靠近学生</strong>——它同时在做两件相反的事，但效果是"教师的高奖励模式恰好是学生学得动的模式"
- <strong>⑤ 命名碰撞是一个真实的工程风险。</strong>同一年里三篇并发工作提出同一目标、都叫 "OPSD"，<strong>最后在引用和对比时会付出代价</strong>——做自己的方法时，命名前先查重是一件值得花时间的事

### 待跟进（按性价比排序）

- <strong>① 【最贴合主线】把"特权信息"这个概念在 lib 的 OPD 主线上做一次统一盘点。</strong>现在 lib 里已有四种特权信息：<strong>真值答案</strong>（OPSD 8/19）、<strong>环境反馈</strong>（SDPO 9/30）、<strong>动作轨迹</strong>（本篇）、以及 HPD/EOPD 那种"外部强教师本身"。<strong>把"特权信息类型 × 目标函数 × 场景"做成一张矩阵，能直接看出哪些格子还空着</strong>——目测"特权信息 = 工具/检索返回值"和"特权信息 = 另一个 agent 的轨迹"这两格是空的
- <strong>② 复现"纯 RL 在 OOD 上退化"这个现象。</strong>本篇 + Forget-Me-Not + RL's Razor 三条独立证据都指向"on-policy / 蒸馏比纯 RL 更不遗忘"。<strong>但在多轮工具调用场景上这条从未被专门研究过</strong>——为什么 RL 会退化？是熵塌缩、还是动作分布收窄？这是一个很干净的诊断题目
- <strong>③ 把"联合训练 + β 惩罚"搬到 WorldPlay 那类"条件无法对齐"的蒸馏上。</strong>WorldPlay 用"改造教师上下文"解决了条件不一致；<strong>但视频世界模型里也有无法改造的情形</strong>（比如教师的双向性没法给学生）——<strong>"显式惩罚漂移 + 让教师拟合学生熟悉的模式"是现成的第二方案</strong>
- <strong>④ 检查 τ-Bench 移除 transfer\_to\_human\_agents 的影响。</strong>论文说它导致 reward hacking 所以删了。<strong>一个便宜的复核：保留该工具但给它的调用加正确性约束，看策略学到的东西是否不一样</strong>
- <strong>⑤ 三种 PI（工具+参数 / 仅工具名 / 自生成提示）在多轮 agent 上的"信息密度–效用"曲线值得单独做。</strong>论文的结论是"最优 PI 随 α 变"，但<strong>没有回答"PI 里最少要保留什么信息才够"</strong>——这对实际部署很关键（采集 PI 是有成本的）
- <strong>⑥ 规模外推。</strong>论文自述只到 8B，而它的核心叙事之一是"模型越强越该走 on-policy"。<strong>这条叙事本身就是一个需要验证的假设</strong>，值得在 32B 档上复核
- <strong>⑦ 这个方向已经有成串的并发/跟进工作，值得作为专题读完</strong>：这篇（π-Distill）+ <strong>Rethinking Privileged Information in OPSD</strong>（arXiv 2608.18271，质疑 OPSD 的收益到底来自"学到参考"还是"恢复 base 已有行为"）+ <strong>FA-OPD</strong>（ICML 2026，把 OPD 用到具身控制，Flow Matching 教师）+ <strong>V-Zero</strong>（用区域裁剪门控 OPD）+ <strong>FP-OPD</strong>（只蒸学生能表示的部分）

## 八、今日阅读结论

> 🎁 <strong>今日一句</strong>：<strong>闭源模型不给你看它的思维链，这件事没有想象中致命——它做过的动作本身就是一份可用的"特权信息"，只要让同一个模型一边偷看这份信息当老师、一边在没有它的条件下当学生，蒸馏照样成立，甚至能超过那些假设拿到完整思维链的做法。</strong>

- <strong>这篇最本质的贡献是把"特权信息"的定义推到不需要答案、也不需要推理过程——只需要可观测的行为。</strong>这把"能从谁身上学"的门槛降了一个量级
- <strong>第二个贡献是给出了"何时用哪种 α"的经验规律</strong>：<strong>低 KL + 正效用 → α=0 最省；条件不明或没预算调参 → α=0.5 最稳；α=1 要小心 KL 崩塌</strong>——这是一份很实用的操作手册
- <strong>第三个贡献是一条反常识的实证</strong>：<strong>纯 RL 在所有 OOD 评测上都比 base 更差</strong>，而蒸馏方法全都不退化。这和 lib 里"on-policy 比 off-policy 更安全"那条线是同一个方向的第三次印证
- <strong>最诚实的评价</strong>：结果硬（8B 上超过"假设有 CoT"的业界标准 11.8 个点，且只需一个训练阶段），分析扎实（三种 PI × 三个 α × 三个模型 × 域内+域外），还诚实标了 OPSD 的失败情形；<strong>但——① 整篇仍然依赖"能大规模采集前沿模型轨迹"这个前提 ② 为了跑通，改了 τ-Bench 的工具集和 Travel Planner 的奖励函数，两个改动的对照都没给 ③ 效率优势只有结构论证、没有时间数字 ④ 只到 8B</strong>
- <strong>对项目的直接价值</strong>：① <strong>"特权信息可以只是行为"这条把 OPD 的适用面显著放宽了</strong>，是一个可以立刻借用的视角 ② <strong>共享参数 + 联合训练</strong>这套骨架能把任何"两阶段训练"压成一段 ③ <strong>"纯 RL 在多轮 agent 上会退化"是一个还没人专门研究的干净题目</strong>，而它在 lib 里已经有三条独立证据支持

<strong>主题标签</strong>：OPD（on-policy distillation / 特权信息蒸馏）（按轮换序列从具身智能（10/12 SOMA）切回；上次该主题是 9/30 SDPO）
