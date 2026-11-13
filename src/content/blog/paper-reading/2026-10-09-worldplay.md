---
title: '1009 WorldPlay：实时交互世界模型的长期几何一致性'
description: '实时交互式世界模型有一个死结——要实时就得靠蒸馏，但复杂记忆会让蒸馏失效；要有记忆就得用复杂上下文，而复杂上下文恰恰是蒸馏最难处理的东西。WorldPlay 的…'
pubDate: '2026-10-09'
---

> 2026-10-09 · 文献阅读 #52 · 方向：<strong>世界模型（实时交互 / 长期几何一致性）</strong> · 腾讯混元 + HKUST / 北航 / 浙大 · ICML 2026 Poster

## TL;DR

<strong>一句话：实时交互式世界模型有一个死结——要实时就得靠蒸馏，但复杂记忆会让蒸馏失效；要有记忆就得用复杂上下文，而复杂上下文恰恰是蒸馏最难处理的东西。WorldPlay 的解法不是另起炉灶换记忆载体（那是 PERSIST 的路），而是两头都做：<strong>① 把记忆管好（双表示动作 + 时/空双域重构记忆 + 时间重构图）② 让蒸馏对齐记忆（Context Forcing）</strong>。结果是在 <strong>720p / 24 FPS</strong> 下同时拿下实时与长期一致性。</strong>

- <strong>最刺眼的一组数（Table 2，长期 ≥250 帧）</strong>：WorldPlay PSNR <strong>18.94</strong> / SSIM <strong>0.585</strong> vs 最好的 baseline Gen3C <strong>15.37 / 0.431</strong>；而无记忆的 Matrix-Game-2.0 只有 9.57 / 0.205、GameCraft 10.09 / 0.287
- <strong>3D 结构一致性（Table 3，MEt3R↓）</strong>：WorldPlay <strong>0.133</strong> vs Gen3C 0.187 / GameCraft 0.305 / Matrix-Game-2.0 0.367
- <strong>最有价值的一张消融（Table 6，长期）</strong>：把上下文的位置编码从标准 RoPE 换成 <strong>Reframed RoPE</strong>，PSNR <strong>14.03 → 16.27</strong>、SSIM 0.358 → 0.425、LPIPS 0.534 → 0.495 —— <strong>只改位置编码，就换来 +2.24 PSNR</strong>
- <strong>第二有价值的一张（Table 8 左）</strong>：蒸馏前 Student(AR, <strong>100 步</strong>) PSNR 16.27 → 蒸馏后 Final(<strong>4 步</strong>) <strong>18.94</strong>，几乎追平双向教师（100 步，19.31）→ <strong>用 1/25 的步数拿到（甚至超过）教师水平</strong>
- <strong>速度（Table 4，8×H800）</strong>：<strong>2.80 → 3.80（+流式解码，1.35×）→ 16.0（+DiT 并行量化，5.71×）→ 24.0 FPS（+VAE 量化，8.57×）</strong>；其中流式解码一行贡献最小，量化与并行才是主力
- <strong>WorldScore 横向（Table 9，2000 例）</strong>：平均分 <strong>79.74</strong> vs Voyager 77.62（最好 baseline）、WonderWorld 72.69、Gen-3 60.71
- <strong>用户研究（30 人、600 例成对偏好）</strong>：vs ViewCrafter <strong>92.1%</strong>、vs GameCraft 88.5%、vs Matrix-Game-2.0 78.4%、vs Gen3C 72.9%；<strong>vs 双向 Teacher 只有 48.1%</strong>（打平——好事，说明 4 步≈100 步）
- <strong>三个"白送"的应用</strong>：① <strong>3D 重建</strong>（接现成的重建模型出点云）② <strong>可提示事件</strong>（流式生成中途改文本，换天气、触发火灾）③ <strong>视频续写</strong>
- <strong>数据</strong>：约 <strong>320K</strong> clips——真实动态 Sekai 40K（12.5%）/ 真实 3D 场景 DL3DV 60K（18.75%）/ 合成 UE 渲染 50K（15.625%）/ <strong>游戏录制 170K（53.125%）</strong>
- <strong>训练三分段</strong>：①动作控制（双向 30K + AR 30K iter，61 帧）②记忆（序列到 160 latent = 637 帧）③Context Forcing（2K iter）
- <strong>代码开源</strong>：github.com/Tencent-Hunyuan/HY-WorldPlay（该 repo 现已升级为 <strong>HY-World 1.5</strong> 系统性框架，同时收纳了同团队的 <strong>WorldCompass</strong>）
- <strong>⚠️ 论文自述 4 条限制里最要紧的一条</strong>：<strong>基于 FOV 的记忆检索在严重遮挡下会失败</strong> —— 而这恰好是 PERSIST 那套 3D 状态的强项（见第六节）
- <strong>主题轮换</strong>：今日<strong>世界模型</strong>（按序列从多模态推理 / 感知（10/8 VisualSwap）切出；上次该主题是 9/28 PERSIST）

## 文献信息

| 字段 | 内容 |
|-|-|
| 标题 | WorldPlay: Towards Long-Term Geometric Consistency for Real-Time Interactive World Modeling（该工作已并入 <strong>HY-World 1.5</strong> 系统） |
| 作者 | Wenqiang Sun、Haiyu Zhang、Haoyuan Wang（<strong>共同一作</strong>）、Junta Wu、Zehan Wang、Zhenwei Wang、Yunhong Wang、<strong>Jun Zhang</strong>（通讯）、<strong>Tengfei Wang</strong>（通讯）、<strong>Chunchao Guo</strong>（通讯）（10 人） |
| 机构 | <strong>腾讯混元（Tencent Hunyuan）主导</strong> + <strong>香港科技大学（HKUST）</strong> + <strong>北京航空航天大学</strong> + <strong>浙江大学</strong> + 腾讯 Hunyuan3D（以论文页脚逐字为准；ICML 官方列表的逐作者字段与之一致） |
| 发布时间 | arXiv:2512.14614（v1 2025-12-16，v2 2026-06-09；正文 9 页，全文 23 页） |
| 会议 | <strong>ICML 2026 Poster</strong>（<strong>双源一手确认</strong>：① <strong>PDF 首页页脚逐字</strong>："Proceedings of the 43rd International Conference on Machine Learning, Seoul, South Korea. <strong>PMLR 306, 2026</strong>" ② <strong>ICML 官方 virtual 全量数据</strong> icml-2026-orals-posters.json 命中，count=6797 完整解析，eventtype=<strong>Poster</strong>，session="Poster Session 4"，room="HALL A"，poster #2411，<strong>decision 字段逐字 = "Accept (regular)"</strong>，paper\_url=OpenReview forum <strong>GfSwkDSr8J</strong>；<strong>阳性对照</strong>=同表命中 lib 已读的 PERSIST / VisualSwap（Oral+Poster 两条）/ GraphGPO / POLIA / BSBT / Forget-Me-Not 全部命中。<strong>⚠️ 注意：arXiv abs 页 Comments 字段只有项目页与代码链接，无任何录用标注</strong>） |
| 链接与代码 | <a href="https://arxiv.org/abs/2512.14614">arXiv:2512.14614</a> · 项目页 <a href="https://3d-models.hunyuan.tencent.com/world/">3d-models.hunyuan.tencent.com/world/</a> · 代码 <a href="https://github.com/Tencent-Hunyuan/HY-WorldPlay">github.com/Tencent-Hunyuan/HY-WorldPlay</a> · OpenReview forum GfSwkDSr8J |
| 性质 | <strong>系统 / 方法论文（三个组件 + 一整套推理期工程优化）</strong>；<strong>有独立 Limitations 章节</strong>（但只有 4 句，且很短）；lib 里第一篇把<strong>「蒸馏」</strong>用在视频世界模型上的论文 |
| 任务形式 | <strong>下一个 chunk（16 帧）预测</strong>；条件是「过去观测序列 + 历史动作 + 当前动作 + 文本或图像 prompt」。4 个 latent 组成一个 chunk，解码为 16 帧 |
| 数据 | 约 <strong>320K</strong> clips、四个来源（真实动态 / 真实 3D 场景 / 合成 UE / 游戏录制）；原始视频切成 <strong>30–40 秒</strong>片段；用 VLM 生成文本标注；无标注的用 <strong>VIPE</strong> 估相机位姿，并用 <strong>PMR（峰值/中位比值，阈值 5.0）</strong> 剔除位姿跳变；离散动作由连续位姿反推 |
| 训练与推理 | 骨架 = 预训练的 <strong>DiT 视频扩散模型</strong>（Wan / HunyuanVideo）；三分段训练；记忆配置 = <strong>时域 3 个 chunk + 空域 1 个 chunk</strong>，并把<strong>第一个 chunk 留作 attention sink</strong>；推理 <strong>4 步去噪 + KV cache</strong>，<strong>8×H800 上 720p / 24 FPS</strong> |
| 评测 | <strong>600 例测试</strong>（DL3DV + 游戏视频 + AI 生成图）；<strong>短期 = 61 帧</strong>、<strong>长期 = ≥250 帧</strong>（用自定义<strong>往返轨迹</strong>强制回访，指标在返程上算）；视觉 PSNR / SSIM / LPIPS + 动作精度 Rdist / Tdist（用 VIPE 反估相机位姿）；另有 <strong>MEt3R</strong>（3D 结构一致性）、VBench、<strong>WorldScore</strong>（2000 例）、30 人成对用户研究 |

## 一、先看例子（大白话：最难的不是"往前看"，是"回头再看看"）

> 💡 <strong>铺垫</strong>：交互式世界模型 = 一个能玩的游戏，但画面是 AI 实时画出来的。你按 W 它就往前推，按 A 就往左转。
>
> 那么衡量它好不好，就不看单帧画质，而看一个更狠的指标：<strong>你走回原地时，还认不认得那个地方。</strong>

> <strong>把这件事想成一个具体的动作：</strong>
>
> 你往前走，<strong>左边有一个消防栓，走出了屏幕</strong>。你继续走 20 步，然后<strong>转身走回来</strong>。
>
> <strong>问你：你走回来的时候，应该再看到那个消防栓，对吧？</strong>
>
> ——这就是所有交互式世界模型最难的地方。忘了它，你走回去会看到一片完全不同的街景：消防栓没了、房子换位置了、招牌上的字变了。

![▲ 论文 Figure 1（teaser）：五行分别是 a) 真实世界 b) 风格化世界 c) 第三人称 d) 3D 重建（含点云）e) 可提示事件（Smoke Spread 冒烟）。每行左侧是起始画面，右侧是沿键盘指令（W/A/S/D 标签）生成的帧序列，红框标出「回访同一位置」时是否保持了一致](/images/paper-reading/2026-10-09-worldplay/2026-10-09-d53-1.webp)

<strong>⚠️ 但 WorldPlay 比 PERSIST 多背了一个硬约束：<u>要实时</u>。</strong>

- <strong>24 FPS 意味着每帧只有约 41 毫秒</strong>——而扩散模型本来要几十步去噪才出一张图
- 所以它必须<strong>蒸馏</strong>（把几十步压到 4 步）。而<strong>难就难在这儿</strong>：论文的核心矛盾正是"记忆"和"蒸馏"打架

## 二、动机：速度与记忆的两难，卡点全在「蒸馏」上

- <strong>问题本身是个明确的取舍</strong>：交互式世界模型要同时做到<strong>实时生成（速度）</strong>与<strong>长期几何一致性（记忆）</strong>。论文开篇就说这是 fundamental challenge
- <strong>两类现有方法各偏一边</strong>： 
  - <strong>一类优先速度</strong>（Oasis / Genie 2 / Matrix-Game 等）：靠蒸馏拿到实时，但<strong>没有记忆机制</strong> → 场景一变就变，回头就崩
  - <strong>另一类优先一致性</strong>：用<strong>显式</strong>（3D 重建后渲染条件帧）或<strong>隐式</strong>（FOV 检索历史帧）的记忆 → 但<strong>复杂记忆让蒸馏变得非常难</strong>（见 3.4）
- <strong>论文用 Table 1 把这件事量化了</strong>：现有方法没有一个同时具备「实时 + 长期一致性 + 长时域 + 通用域」——WorldPlay 是唯一四项全勾的
- <strong>🔑 全文真正的立论（3.4 节那个"分布不匹配"）：</strong> 
  - 蒸馏需要一个<strong>双向 teacher</strong>（非因果、看得到整段），而标准双向 teacher 是在<strong>短视频上训的、天生没有记忆</strong>
  - 学生是<strong>因果自回归 + 有记忆</strong>的。于是：<strong>师生看到的"条件"根本不一样</strong>
  - 就算你给 teacher 也加上记忆，它的<strong>双向性</strong>仍然和学生的<strong>因果性</strong>不同 → <strong>条件分布 p(x|C) 对不齐 → 分布匹配（DMD）直接失效</strong>
  - 结论：<strong>不是"教师不够强"，而是"师生看到的上下文不一致"</strong>——这句话是整篇论文的钥匙

## 三、方法：三个组件 + 一整套实时工程

### 3.1 双动作表示：一个"尺度自适应"和一个"位置精确"，都要

| 只用哪一种 | 好处 | 硬伤 |
|-|-|-|
| <strong>离散按键（W/A/S/D）</strong> | 动作物理上自然、<strong>场景尺度自适应</strong>（大场景小场景都走得像样） | <strong>没法给记忆检索提供精确位置</strong>——你不知道"上次那个位置"到底是哪儿 |
| <strong>连续相机位姿 (R, T)</strong> | 空间位置精确，便于<strong>精确控制 + 记忆检索</strong> | 训练数据里<strong>场景尺度差异极大</strong> → 只用位姿<strong>训练不稳</strong> |
| <strong>两者都用（本文）</strong> | 离散键 → PE + 零初始化 MLP → 融进时间步嵌入 → 经 <strong>AdaLN</strong> 调制 DiT 各模块 | 连续位姿 → <strong>PRoPE</strong>（相对位置编码）注入 self-attention，把完整的相机视锥编码进去 |

### 3.2 重构式上下文记忆（Reconstituted Context Memory）——把重要旧帧"拉近"

先解决"记住哪些"，再解决"记住的东西还算不算数"。

- <strong>记忆分成两路（不是简单检索）</strong>： 
  - <strong>时域记忆 C<sup>T</sup></strong>：最近 <strong>3 个 chunk</strong>——保证短时动作流畅
  - <strong>空域记忆 C<sup>S</sup></strong>：从<strong>非相邻</strong>的历史帧里采样 <strong>1 个 chunk</strong>，采样依据是<strong>几何相关性</strong>（FOV 重叠 + 相机距离）——防止长序列上的几何漂移
  - 另加一个细节：<strong>把第一个 chunk 保留为 attention sink</strong>，进一步压制误差累积
- <strong>🔑 然后是最漂亮的一手——<u>时间重构图（Temporal Reframing）</u></strong>： 
  - <strong>问题</strong>：标准 RoPE 下，当前 chunk 和久远记忆之间的相对距离<strong>无界增长</strong>。这会带来两件事：① 超出训练时见过的插值范围 → <strong>外推伪影</strong> ② 距离越大，<strong>久远记忆对当前预测的影响力越弱</strong>（记忆被"稀释"）
  - <strong>做法</strong>：<strong>丢掉绝对时间下标，给所有上下文帧重新分配位置编码</strong>，让它们到当前 chunk 的相对距离<strong>固定且很小</strong>——不管它们实际上是 5 帧前还是 500 帧前
  - <strong>效果一句话</strong>：<strong>把"几何上很重要但很久以前"的那些帧，在时间轴上"拉到现在"</strong>，逼模型把它们当成刚发生的来处理

![▲ 论文 Figure 2：方法总览。给定一张图或一段文本描述一个世界，WorldPlay 做「下一个 chunk（16 帧）」预测，条件来自用户的动作。每一轮生成时，都从 Memory Cache 里动态「Reconstitute」出上下文记忆——红虚线框里的 C^S（空域）与 C^T（时域），并配合 Dual-Action 用户输入一起喂给自回归扩散 Transformer](/images/paper-reading/2026-10-09-worldplay/2026-10-09-d53-2.webp)

![▲ 论文 Figure 4：三种记忆机制的对比（红块=记忆，蓝块=当前 chunk，格子里的数字是 RoPE 里的时间下标）。(a) 全上下文——所有帧都留，但时间下标会无限增长。(b) 绝对下标——记忆虽然稀疏了，下标仍一路涨到 8。(c) 相对下标（本文）——把记忆帧的下标重新分配成 0/1/2/3/4 这些贴近当前的小值。这就是「时间重构图」的全部内容：只改位置编码，不改模型](/images/paper-reading/2026-10-09-worldplay/2026-10-09-d53-3.webp)

### 3.3 Context Forcing：让蒸馏"对齐记忆"

![▲ 论文 Figure 5：Context Forcing。Memory Cache 经 Retrieval / Update 进入 AR Diffusion Transformer 做「记忆增强的自 rollout」，产出的 chunk 送进两个「记忆增强的双向视频扩散」分别算 Real Score 与 Fake Score，再用 L_DMD 做分布匹配。关键是教师也拿到了与学生一致的记忆上下文](/images/paper-reading/2026-10-09-worldplay/2026-10-09-d53-4.webp)

<strong>做法（三步）：</strong>

- <strong>学生</strong>：memory-aware 自回归模型，<strong>self-rollout 4 个 chunk</strong>（条件在自己的记忆上下文上）
- <strong>教师</strong>：<strong>给双向扩散模型也加上记忆</strong>，而且——这是关键——<strong>把教师的上下文构造成"学生的记忆上下文"</strong>：把要生成的那段 x<sub>j:j+3</sub> <strong>从学生的记忆上下文里 mask 掉</strong>再交给教师。这样师生的条件分布就被拉到一起了
- <strong>渐进式蒸馏</strong>：逐步增加 self-rollout 的 latent 数，从短序列平滑过渡到长序列
- <strong>论文明确做了三个反面对照（Figure 8）</strong>：① teacher/student 上下文<strong>错位</strong> → <strong>直接崩</strong>（输出 collapse）② teacher <strong>没有记忆</strong> → 分布不匹配，长视频生成崩坏 ③ 用 <strong>self-rollout 的历史 chunk 当上下文</strong> → 会有 artifact（因为双向模型是用干净 chunk 训的）；换成<strong>从真实视频采样历史 chunk</strong>才最好

### 3.4 实时工程：从 2.80 FPS 到 24 FPS

- <strong>DiT 与 VAE 的混合并行</strong>：把序列并行和注意力并行结合起来，<strong>把每个 chunk 的 token 切到多卡上</strong>（而不是复制整个模型或只按时间维分片）
- <strong>流式部署 + 渐进式 VAE 解码</strong>：用 NVIDIA Triton，把帧<strong>分批解码并即时推流</strong>，让用户先看到画面、后续帧还在算
- <strong>量化 + 高效注意力</strong>：Sage Attention、float 量化、矩阵乘量化；注意力模块用 <strong>KV cache</strong> 消掉重复计算

## 四、实验

### 4.1 设置

- <strong>测试集 600 例</strong>：来自 DL3DV、游戏视频、AI 生成图，覆盖多种风格
- <strong>短期（61 帧）</strong>：直接用测试视频的相机轨迹当输入位姿，生成帧与真值比
- <strong>长期（≥250 帧）</strong>：用<strong>自定义的往返循环轨迹</strong>强制回访——模型沿轨迹生成一遍再原路返回，<strong>指标在返程上算</strong>（把返程生成的帧与初次经过时生成的帧对比）
- <strong>动作精度</strong>：拿真值位姿当输入生成视频，再用 <strong>VIPE 反估生成视频的相机位姿</strong>，算旋转距离 R<sub>dis</sub> 与平移距离 T<sub>dis</sub>

### 4.2 主结果（Table 2）

| 方法 | 实时 | 短期 PSNR | SSIM | LPIPS | 长期 PSNR | SSIM | LPIPS | Rdist | Tdist | 备注 |
|-|-|-|-|-|-|-|-|-|-|-|
| CameraCtrl | ✗ | 17.93 | 0.569 | 0.298 | 10.09 | 0.241 | 0.549 | 0.733 | 1.117 | 无记忆 |
| SEVA | ✗ | 19.84 | 0.598 | 0.313 | 10.51 | 0.301 | 0.517 | 0.721 | 1.893 | 无记忆 |
| ViewCrafter | ✗ | 19.91 | 0.617 | 0.327 | 9.32 | 0.277 | 0.661 | 1.573 | 3.051 | 无记忆 |
| <strong>Gen3C</strong> | ✗ | 21.68 | 0.635 | 0.278 | <strong>15.37</strong> | <strong>0.431</strong> | 0.483 | 0.357 | 0.979 | <strong>最强 baseline</strong>（显式 3D） |
| VMem | ✗ | 19.97 | 0.587 | 0.316 | 12.77 | 0.335 | 0.542 | 0.748 | 1.547 | 有记忆 |
| Matrix-Game-2.0 | ✔ | 17.26 | 0.505 | 0.383 | 9.57 | 0.205 | 0.631 | 2.125 | 2.742 | 实时但无记忆 |
| GameCraft | ✗ | 21.05 | 0.639 | 0.341 | 10.09 | 0.287 | 0.614 | 2.497 | 3.291 | 无记忆 |
| Ours（<strong>去</strong> Context Forcing） | ✗ | 21.27 | 0.669 | 0.261 | 16.27 | 0.425 | 0.495 | 0.611 | 0.991 | 消融 |
| <strong>Ours（full）</strong> | <strong>✔</strong> | <strong>21.92</strong> | <strong>0.702</strong> | <strong>0.247</strong> | <strong>18.94</strong> | <strong>0.585</strong> | <strong>0.371</strong> | <strong>0.332</strong> | <strong>0.797</strong> | <strong>实时 + 有记忆</strong> |

> 🎁 <strong>这张表要读出三件事：</strong>
>
> <strong>① 长期是分水岭</strong>：短期所有方法还都在 17–22 的区间里，一到长期就分成两拨——有记忆的（Gen3C 15.37、Ours 18.94）和没记忆的（9.3–10.5）。<strong>Matrix-Game-2.0 的短期只有 17.26、长期 9.57，但在 Table 1 里它也是"实时"派</strong>——说明<strong>实时派在长期上付出了代价</strong>。
>
> <strong>② WorldPlay 是唯一同时拿到实时和长期记忆的</strong>，而且在长期上把最强的显式 3D 方案 Gen3C 拉开 <strong>+3.57 PSNR / +0.154 SSIM</strong>。<strong>论文对此的解释是：显式 3D 方案受限于深度估计的准确度与对齐，长期会累积误差；而隐式重构记忆不依赖重建质量。</strong>
>
> <strong>③ Context Forcing 的贡献非常大</strong>：16.27 → <strong>18.94</strong>（+2.67 PSNR），而且这是在同一套记忆机制下只加蒸馏拿到的。

### 4.3 3D 结构一致性（Table 3，MEt3R↓）

| 方法 | MEt3R Score ↓ | 相对 Ours |
|-|-|-|
| Gen3C | 0.187 | 差 41% |
| GameCraft | 0.305 | 差 129% |
| Matrix-Game-2.0 | 0.367 | 差 176% |
| <strong>Ours（full）</strong> | <strong>0.133</strong> | — |

<strong>做法值得记一句</strong>：把<strong>初次轨迹的帧</strong>与<strong>返程重访轨迹上对应的帧</strong>配成对，喂给 MEt3R（一个借 DUSt3R 三维几何先验做多视图对应度量的模型）→ <strong>用外部 3D 先验给"自一致性"提供了一个准客观的锚</strong>，补上了往返自比"没有真值"的短板。

### 4.4 消融（四组）

| 动作表示（短期） | PSNR↑ | SSIM↑ | Rdist↓ | Tdist↓ |
|-|-|-|-|-|
| 只用离散键 | 21.47 | 0.661 | 0.103 | 0.615 |
| 只用连续位姿 | 21.93 | 0.665 | 0.038 | 0.287 |
| <strong>双表示（本文）</strong> | <strong>22.09</strong> | <strong>0.687</strong> | <strong>0.028</strong> | <strong>0.113</strong> |

| 位置编码（长期） | PSNR↑ | SSIM↑ | Rdist↓ | Tdist↓ |
|-|-|-|-|-|
| 标准 RoPE | 14.03 | 0.358 | 0.805 | 1.341 |
| <strong>Reframed RoPE（时间重构图）</strong> | <strong>16.27</strong> | <strong>0.425</strong> | <strong>0.611</strong> | <strong>0.991</strong> |

| Context Forcing（长期） | NFE | PSNR↑ | SSIM↑ | Tdist↓ |
|-|-|-|-|-|
| Student（AR，蒸馏前） | 100 | 16.27 | 0.425 | 0.991 |
| Teacher（双向） | 100 | 19.31 | 0.599 | 0.717 |
| <strong>Final（蒸馏后）</strong> | <strong>4</strong> | <strong>18.94</strong> | <strong>0.585</strong> | <strong>0.797</strong> |

<strong>记忆大小消融（Table 8 右，长期）</strong>：空域 3 / 时域 1 → 16.41 / 0.418 / Tdist 1.054；空域 1 / 时域 3 → <strong>16.27 / 0.425 / Tdist 0.991</strong>。论文的解释很实在：<strong>空域记忆调大反而会显著增加 teacher 的上下文长度</strong>（相邻 chunk 的空域记忆几乎不重叠，而时域记忆大量重叠）→ 既让 teacher 更难训，也让蒸馏更难做。<strong>所以最终选了"时域 3 + 空域 1"。</strong>

### 4.5 速度分解（Table 4，8×H800）

| DiT 并行+量化 | VAE 并行+量化 | 流式解码 | FPS | 加速比 |
|-|-|-|-|-|
| — | — | — | 2.80 | 1.00× |
| — | — | ✓ | 3.80 | 1.35× |
| ✓ | ✓ | — | 16.0 | 5.71× |
| <strong>✓</strong> | <strong>✓</strong> | <strong>✓</strong> | <strong>24.0</strong> | <strong>8.57×</strong> |

### 4.6 横向对比（WorldScore，2000 例）

| 方法 | WorldScore 平均↑ | 3D 一致性↑ | 内容对齐↑ | 主观质量↑ |
|-|-|-|-|-|
| <strong>Ours</strong> | <strong>79.74</strong> | 86.43 | 89.07 | <strong>73.16</strong> |
| Voyager | 77.62 | 81.56 | 85.99 | 71.09 |
| WonderWorld | 72.69 | 86.87 | 85.56 | 49.81 |
| WonderJourney | 63.75 | 80.60 | 79.03 | 66.56 |
| CogVideoX-I2V | 62.15 | 86.21 | 88.12 | 62.44 |
| Gen-3 | 60.71 | 68.31 | 87.09 | 63.85 |

### 4.7 用户研究与定性

- <strong>用户研究</strong>：<strong>600 例</strong>（300 来自 VBench / WorldScore + 300 自定义轨迹），<strong>30 位评审</strong>，成对偏好：vs ViewCrafter <strong>92.1%</strong>、vs GameCraft <strong>88.5%</strong>、vs Matrix-Game-2.0 <strong>78.4%</strong>、vs Gen3C <strong>72.9%</strong>、<strong>vs 双向 Teacher 48.1%</strong>
- <strong>定性（Figure 6）</strong>：5 行对比，红框标出<strong>回访同一位置</strong>时的差异——WorldPlay 能保持原物体/场景，而 Gen3C 会把石头山抹平、GameCraft 会把村庄变成草地、Matrix-Game-2.0 会把粉色建筑整片涂成紫色

![▲ 论文 Figure 6：与现有方法的定性对比。每行左侧是起始画面与红框标注的目标物，右侧是「Ours vs 某个 baseline」沿同一条指令序列生成的两条视频。注意每行最后一帧的红框——Ours 回访时目标物还在原处，Gen3C / GameCraft / Matrix-Game 2.0 则丢失或改变了它](/images/paper-reading/2026-10-09-worldplay/2026-10-09-d53-5.webp)

### 4.8 三个"白送"的应用

- <strong>3D 重建</strong>：因为长期几何一致，接一个前馈重建模型就能从生成的视频里出<strong>高质量点云</strong>
- <strong>可提示事件</strong>：自回归特性 + <strong>KV-recache</strong>（改文本时刷新缓存 KV，抹掉旧 prompt 的残留影响但保留运动与视觉线索）→ 流式生成中途<strong>改天气、触发火灾、插入新物体</strong>
- <strong>视频续写</strong>：给定一段初始视频，续写内容在运动、外观、光照上都保持一致

## 五、Limitations &amp; 批判性思考

### 论文自述的 4 条（写得很短）

- <strong>时长</strong>：目前只能生成约 <strong>30 秒</strong>的视频，扩到分钟 / 小时级仍是重大挑战
- <strong>误差累积</strong>：蒸馏只是缓解，<strong>自回归扩散训练中的误差累积根本没被根本解决</strong>
- <strong>动作类型有限</strong>：没有多 Agent 交互与复杂物理动力学
- <strong>🔑 检索机制的天花板</strong>：<strong>基于 FOV 的检索在遇到严重遮挡时可能无法准确定位记忆上下文</strong>

### 我读出来的额外问题

1. <strong>「长期」这个词在两篇论文里不是一个量级，跨论文比较会出错。</strong>WorldPlay 的长期是 <strong>≥250 帧</strong>，而且正文自述只能生成 <strong>\~30 秒</strong>；PERSIST 那边是在 <strong>600 帧 / 数千步</strong>上比的。<strong>两边都自称"长期一致性 SOTA"，但帧数差 2–3 倍——任何跨论文的"谁更一致"都要先对齐帧数与轨迹协议</strong>
2. <strong>Table 2 是一个混合口径的对照。</strong>baseline 里 Gen3C / ViewCrafter / VMem / GameCraft / SEVA / CameraCtrl 全部标 <strong>Real-time ✗</strong>，只有 Ours 和 Matrix-Game-2.0 是 ✔。也就是说，<strong>"Ours 最好"是"在实时者里比质量、在高质量者里比实时"的混合结论</strong>——严格说，<strong>没有任何一个 baseline 同时具备"实时 + 有记忆"</strong>，所以这个对照没有回答"同样实时的前提下，有记忆比没记忆好多少"（能回答这个的只有 vs Matrix-Game-2.0 一行，而那是 9.57 vs 18.94，确实很硬）
3. <strong>长期指标是自建协议且无真值参考。</strong>用自定义往返轨迹，<strong>把返程生成的帧与初次经过时生成的帧比</strong>——这测的是<strong>自一致性</strong>，不是正确性。一个"什么都不动"的退化模型也能拿到很高的自一致性。论文用 MEt3R（借三维先验）部分补了这个洞，但 <strong>MEt3R 本身也是无参考度量</strong>，而且它只覆盖"结构"，不覆盖"内容是否真的对"
4. <strong>Context Forcing 的对照混了两个变量。</strong>Table 8 左三行的 NFE 是 <strong>100 / 100 / 4</strong>：蒸馏后 <strong>4 步</strong>（18.94）比蒸馏前 <strong>100 步</strong>（16.27）<strong>更好</strong>。这在直觉上是反的（蒸馏一般会略掉点分），所以"18.94 vs 16.27"里同时混了"步数减少带来的收益"和"蒸馏本身的信息损失"。<strong>论文的叙事是"蒸馏同时提升质量和速度"，但缺一个"同 NFE 的对照"</strong>（例如 4 步的 student 直接跑是什么水平）
5. <strong>用户研究的区分度已经到顶了。</strong>只 <strong>30 人</strong>、成对偏好、<strong>无置信区间</strong>；而 <strong>vs 双向 Teacher 只有 48.1%</strong>——论文把这解读为"4 步达到甚至超过 100 步教师"，但也可以读成<strong>"用户已经分不出来更进一步的差异了"</strong>，即以人评为目标的话，继续优化的一致性收益快到头了
6. <strong>论文自述第 4 条（FOV 检索遇遮挡失败）是这篇最实质的边界</strong>，而且它<strong>恰好是 PERSIST 那条路线的强项</strong>（3D 状态不怕遮挡）。<strong>两条路线的弱点正好互补，但两篇都没做对方的场景</strong>——这是一个现成的组合方向（见第七节）
7. <strong>失败案例只有定性、没有定量。</strong>Figure 8 给了三种蒸馏失败的定性画面（上下文错位 → collapse；teacher 无记忆 → 不一致；self-rollout 上下文 → artifact），但<strong>没有统计"多大比例的轨迹会崩、崩在哪一步"</strong>。对一个以"稳定性"为卖点的工作来说，这是该补的
8. <strong>「可提示事件」是推理期 hack，不是训练出来的能力。</strong>它依赖 <strong>KV-recache</strong>（灵感来自 LongLive）——改 prompt 时刷新缓存。论文只说"有潜力"，<strong>没有定量评测事件触发的成功率，也没有和"从头重新生成"对比</strong>
9. <strong>数据构成严重倾斜，而"通用域"是核心卖点。</strong>游戏录制占 <strong>53.125%</strong>，真实动态只占 <strong>12.5%</strong>。报告的跨域泛化（真实 / 风格化 / 第三人称）<strong>可能在游戏域上被高估</strong>；论文没有做数据配比的消融
10. <strong>和 PERSIST 一样，全文没有一个 agent 任务。</strong>世界模型最大的动机是"给具身智能体一个可训练的仿真环境"，两篇都只在生成质量上评测。<strong>但 WorldPlay 比 PERSIST 更接近可做</strong>——因为它有 <strong>24 FPS 实时</strong>这个 PERSIST 明确说做不到的东西（PERSIST 自述"还做不到实时"）
11. <strong>Limitations 只写了 4 句</strong>，是 lib 里少见的"有章节但极短"；上面这 10 条得读者自己补

## 六、与前文对照

> 🔗 <strong>一句话定位</strong>：lib 的世界模型线此前问过"世界模型用来干什么"（WPT 训练时用、MindJourney 推理时用）、"怎么把它做小"（DeltaWorld）、"用什么目标训它"（RLVR-World）、"状态该长什么样"（PERSIST）。<strong>WorldPlay 第一次问的是"在必须实时的前提下，长期一致性该怎么做"——而它给出的答案是：不用换记忆载体，把记忆管好、把蒸馏和记忆对齐就行。</strong>

### 6.1 与 PERSIST（9/28 #46）——同一道题的两条对立路线（本篇最重要的对照）

| 维度 | PERSIST（9/28） | WorldPlay（本篇） |
|-|-|-|
| <strong>问题陈述</strong> | 交互式世界模型的长期一致性 | <strong>几乎一模一样</strong>：实时交互式世界模型的长期<strong>几何</strong>一致性 |
| <strong>诊断</strong> | 载体错了：像素帧只是世界的部分、冗余、视角相关的投影 | 卡点在蒸馏：<strong>复杂的记忆让蒸馏失效</strong>（师生条件分布对不齐） |
| <strong>解法</strong> | <strong>换记忆载体</strong>——维护一个持久的<strong>隐式 3D 状态</strong>，相机当检索键，几何投影当条件 | <strong>不换载体</strong>——把上下文<strong>重构</strong>好（时域+空域双路、<strong>时间重构图</strong>把旧帧"拉近"），再让<strong>蒸馏对齐记忆</strong> |
| <strong>是否需要真值 3D</strong> | <strong>训练期必须要有</strong>（只能用于能导出 3D 的仿真器） | <strong>不需要</strong>——隐式条件，纯像素训练（这是它最大的相对优势） |
| <strong>实时性</strong> | PERSIST-S 单帧 2672ms（<strong>论文自述做不到实时</strong>） | <strong>720p / 24 FPS</strong>（8×H800） |
| <strong>记忆成本</strong> | 固定（一个 48³ 方块），但<strong>覆盖范围有限</strong>——agent 走远就丢 | 随序列增长（Memory Cache），但用<strong>固定的时域 3 + 空域 1 chunk</strong>控制住每轮开销 |
| <strong>已知短板</strong> | 依赖真值 3D；范围有限 | <strong>严重遮挡下 FOV 检索会失败</strong>；只能 \~30 秒 |

<strong>三句话读完这对对照：</strong>

- <strong>① 它们是"同一道题的两种答案"</strong>：PERSIST 说"载体错了，换成 3D 状态"；WorldPlay 说"载体没错，是你没管好、也没让蒸馏对齐"。<strong>而且两篇都有硬结果支撑</strong>——PERSIST 在 600 帧 FVD 上、WorldPlay 在 250+ 帧往返一致性与 WorldScore 上
- <strong>② 两条路的代价正好互补</strong>：PERSIST 要真值 3D 才能训（适用面窄）但不怕遮挡；WorldPlay 只要像素（适用面宽）但怕遮挡。<strong>"用 3D 状态当记忆的骨架、用重构上下文补细节"是一个现成的混合方案，两篇都没做</strong>
- <strong>③ 一个反讽</strong>：PERSIST 那套 3D 状态机制最贵的一环是 <strong>3D VAE 训了 12 天（8×A100）</strong>；而 WorldPlay 完全绕开了 3D VAE，把工程全投在<strong>推理侧的并行与量化</strong>（换来 8.57× 加速）。<strong>同样是"为了长期一致性"，一个在训练期烧算力、一个在推理期烧工程。</strong>

### 6.2 与 lib 的"蒸馏"主线（HPD / EOPD / VGS / GNDPO / REOPOLD / OPSD / SDPO）——最可迁移的一条

- <strong>WorldPlay 是 lib 里第一次把"蒸馏"用在视频世界模型上</strong>，而且它描述的病与 OPD 主线<strong>同构</strong>：

> 🎁 <strong>「师生分布不匹配」在两条线上是完全同一个病：</strong>
>
> <strong>OPD 主线</strong>（HPD / EOPD / VGS / GNDPO / REOPOLD）：<strong>教师与学生看到的"上下文"是同一个输入，但信号尺度、熵、token 权重全在打架</strong> —— 所以那 7 篇一直在调"哪些 token、多大权重、什么符号"。
>
> <strong>WorldPlay</strong>：<strong>教师与学生连"看到的上下文"都不一样</strong>（teacher 无记忆 / 双向；student 有记忆 / 因果）—— 所以调权重没用，必须<strong>先把上下文对齐</strong>。
>
> <strong>对齐之后的效果</strong>：4 步的学生几乎追平 100 步的教师（18.94 vs 19.31）。<strong>这是一个可以直接搬到 OPD 的洞见：在调权重之前，先检查师生看到的条件是否一致。</strong>

- <strong>与 Self-Forcing / CausVid 的关系</strong>：论文明确接在 CausVid（把双向 teacher 蒸馏成因果 student）与 Self-Forcing（改 rollout 策略缓解 exposure bias）之后，<strong>补上的正是它们没处理的那一环——记忆</strong>
- <strong>与 PERSIST 的"分离训练"对照也很有意思</strong>：PERSIST 靠 <strong>diffusion forcing + 加 10% 噪声</strong>让三个组件分开训还能拼；WorldPlay 靠 <strong>Context Forcing + 上下文对齐</strong>让师生分布能匹配。<strong>两篇都在解决"训练/推理分布不一致"，一个在组件之间、一个在师生之间</strong>

### 6.3 与 lib 的"记忆"线——四种记忆形态全齐了

| 论文 | 记忆是什么 | 核心约束 |
|-|-|-|
| JitRL（9/24 #44） | <strong>外挂经验库</strong>（(状态, 动作, 回报) 条目） | 只增不减、<strong>无淘汰机制</strong> |
| PERSIST（9/28 #46） | <strong>持久隐式 3D 状态</strong>（48³ 体素网格） | 成本固定，但<strong>覆盖范围有限</strong> |
| Forget-Me-Not（9/29 #47） | <strong>回放缓冲</strong>（每任务留 M 个样本） | <strong>2% 就够</strong>，但一点不留就全忘 |
| <strong>WorldPlay（本篇）</strong> | <strong>重构式上下文</strong>（时域 3 + 空域 1 chunk，<strong>位置编码被重写</strong>） | 每轮开销固定，但<strong>依赖 FOV 检索、怕遮挡</strong> |

<strong>一个观察</strong>：这四篇恰好把"记忆"的四种形态占满了——<strong>离散条目 / 空间状态 / 样本缓冲 / 上下文窗口</strong>。而<strong>四种形态各自的约束，恰好都指向同一个未解问题：记忆该记多少、该丢什么</strong>。

### 6.4 与 DeltaWorld（9/2 #12）——"压哪里"比"压多少"重要

- DeltaWorld 的结论是<strong>只压"帧间变化"</strong>（delta token）能省 35× 参数 / 2000× 算力；PERSIST 的结论是<strong>3D 表示对空间压缩极鲁棒（最高 512×），真正关键的是"渲染分辨率"</strong>
- <strong>WorldPlay 给这条线添了第三笔，而且方向不同</strong>：它压的不是"空间"也不是"变化量"，而是<strong>"时间下标"</strong>——把久远记忆的时间下标重写成小值。<strong>这三次"压缩"的共同逻辑是：先把"哪些信息真的重要"识别出来，再只在那个维度上省。</strong>

### 6.5 与 WorldCompass —— 同一个团队的下一步（值得记一笔）

- 我在 ICML 官方列表里发现 <strong>WorldCompass: Reinforcement Learning for Long-Horizon World Models</strong>（同样 Accept regular、同样挂在 Hunyuan 的项目页），<strong>作者与 WorldPlay 高度重叠</strong>（Tengfei Wang / Haiyu Zhang / Junta Wu / Haoyuan Wang / Wenqiang Sun / Zhenwei Wang / Chunchao Guo 等）
- 它的做法是<strong>用 RL 后训练长时域世界模型</strong>（clip 级 rollout + 互补奖励），也正是 GitHub repo 里 HY-World 1.5 系统总览中的 <strong>"RL Post-Training"</strong> 那一格
- <strong>所以这两篇应该连起来读</strong>：WorldPlay 是"把架构与蒸馏做对"，WorldCompass 是"在此之上用 RL 继续推"。而且——<strong>WorldCompass 与 lib 里的 RLVR-World（9/10 #34）是同一个问题的两篇</strong>（RLVR-World 用 GRPO 后训练世界模型的转移预测）。<strong>「用 RL 后训练世界模型」这条线已经有两篇了，而且都是在 2025-2026 出现的</strong>

## 七、启发与待跟进

### 7.1 启发

1. <strong>「拉近距离」是比「扩大窗口」便宜得多的记忆技巧。</strong>与其让模型真的记住更多，不如<strong>改写位置编码、让重要的久远内容"看起来像刚发生的"</strong>。这个操作<strong>只改 PE、不改模型、不加参数</strong>，却换来 +2.24 PSNR。<strong>这条可以搬到任何"长上下文里某些旧内容很重要"的场景</strong>——包括 LLM 的长文检索、agent 的长程记忆
2. <strong>蒸馏失败时，先查"师生看到的条件是否一致"，再查"教师够不够强"。</strong>WorldPlay 的诊断顺序值得抄：它没有去调损失、没有去换更强的教师，而是发现<strong>两者的条件分布 p(x|C) 根本对不齐</strong>，然后<strong>把教师的上下文构造成学生的上下文</strong>。对齐之后，4 步学生≈100 步教师。<strong>这是对 lib OPD 主线直接可搬的洞见</strong>（那 7 篇都在调 token 权重，没人检查过师生条件是否一致）
3. <strong>两个中间量各有优点又各有硬伤时，别选，串起来用。</strong>离散键=动作自然但没位置；连续位姿=位置精确但训练不稳 → WorldPlay <strong>两个都用</strong>（离散进 AdaLN、连续进 attention 的相对位置编码）。消融显示双表示的 Tdist（0.113）比任一单独用（0.615 / 0.287）都好一个量级
4. <strong>"实时"不是后处理，它会反向决定方法设计。</strong>Table 4 显示从 2.80 到 24.0 FPS 需要三层工程（流式解码 1.35× → DiT 并行量化 5.71× → VAE 量化 8.57×）。<strong>很多"理论上一致性更好"的记忆方案，恰恰死在实时这根硬约束上</strong>——这也解释了为什么 PERSIST 那条路（3D VAE 要训 12 天、单帧 2672ms）在实时场景里推不动
5. <strong>把"可解析的"交给公式、把"不可解析的"交给网络</strong>——这条在 PERSIST 里是"几何投影 0.63ms"，在这里是"<strong>用 PRoPE 把相机几何写成相对位置编码</strong>，让网络专心学渲染"。<strong>同一个工程哲学在 lib 里第二次出现，值得当成一条方法论记下来</strong>
6. <strong>"长期一致性"需要一个跨论文统一的口径。</strong>这两篇都在各自的协议下自称长期最优，但一个 600 帧、一个 250+ 帧，一个用 FVD、一个用往返自一致 → <strong>在这个子领域里，"谁是 SOTA"目前是无法回答的</strong>（这正是可以做的填空）

### 7.2 待跟进（按性价比排序）

1. <strong>【最高性价比】把"上下文对齐"搬进 OPD。</strong>lib 的 OPD 主线（HPD / EOPD / VGS / GNDPO / REOPOLD / OPSD / SDPO）全在调"哪些 token 的权重"，<strong>没有一篇检查过师生看到的条件是否一致</strong>。最小实验：在 OPD 里显式对齐师生上下文（同一段 prefix、同一批检索结果、同一份特权信息），看 <strong>KL 的方差</strong>与最终指标是否改善。<strong>成本极低（改数据构造而非改损失），但可能解释掉一批"OPD 不work"的失败案例</strong>
2. <strong>做一套"任意世界模型都能跑"的长期一致性协议。</strong>要求：① 有真值参考（不只是自一致）② 覆盖往返与遮挡 ③ 报告<strong>生成时长 + FPS + 一致性</strong>三件套，让"实时派"和"一致派"能在同一张表里比。<strong>这是这个世界模型子领域目前最缺的公共基础设施</strong>
3. <strong>"3D 状态 + 重构上下文"的混合记忆。</strong>WorldPlay 自述 FOV 检索遇遮挡会失败，而 PERSIST 的 3D 状态不怕遮挡但覆盖有限 → <strong>用 3D 状态当记忆骨架、用重构上下文补高频细节</strong>，是一个两篇都没做、但零部件都齐的组合。<strong>而且它顺手能把 WorldPlay 的"必须实时"和 PERSIST 的"必须真值 3D"两个约束松一松</strong>
4. <strong>把它当环境训练 agent。</strong>WorldPlay 有 PERSIST 明确没有的东西——<strong>24 FPS 实时</strong>。"实时世界模型训练具身智能体"这条路，<strong>WorldPlay 比 PERSIST 更接近可做</strong>，而两篇都没做。最小版本：在生成的世界里跑一个 model-free RL agent（比如导航/开门），与在真 Luanti / 真游戏里跑对比
5. <strong>补数据配比的消融。</strong>游戏录制占 53%、真实动态只占 12.5%，而"通用域"是核心卖点 → 把配比重排成更均衡（或做真实域专项），看"通用"结论是否成立。<strong>这是低成本、但能直接质疑立论的实验</strong>
6. <strong>把"时间重构图"当通用技巧迁移。</strong>把"丢弃绝对时间下标 + 重分配位置编码"用到 LLM 的长上下文 / agent 长程记忆上（比如把很久之前的检索结果在相对位置上"拉近"），<strong>看它能否替代一部分窗口扩大的开销</strong>
7. <strong>补 Context Forcing 的同 NFE 对照。</strong>"4 步蒸馏后 18.94 &gt; 100 步蒸馏前 16.27"这个反直觉结论需要一个干净拆解：① 4 步的未蒸馏 student 是多少 ② 蒸馏在固定 NFE 下贡献多少。<strong>这是能直接做的小实验，也能验证"对齐上下文"到底贡献了多少</strong>
8. <strong>失败案例定量化。</strong>统计"上下文错位 / 教师无记忆 / self-rollout 上下文"三种失败模式各自在多长序列、多大比例的轨迹上出现——<strong>对一个以稳定性为卖点的工作来说，这是最该补的一块</strong>

## 八、今日阅读结论

> 🎁 <strong>今日一句</strong>：<strong>长期一致性有两条路——换掉记忆的载体（PERSIST），或者把记忆管好、把蒸馏和记忆对齐（WorldPlay）。而 WorldPlay 只改了一件事就拿到 +2.24 PSNR：<u>它不改模型，它改的是"久远的记忆在模型眼里看起来有多远"。</u></strong>

- <strong>这篇最可迁移的一条不是"记忆机制"，而是"先对齐条件、再调权重"这个诊断顺序。</strong>论文发现蒸馏失败的根因是<strong>师生的条件分布对不齐</strong>（一个有记忆一个没有），于是把教师的上下文构造成学生的上下文——对齐之后 4 步学生几乎追平 100 步教师。<strong>lib 的 OPD 主线一直在调 token 权重，恰恰没做过这一步检查</strong>
- <strong>它给出的最一般性命题</strong>：<strong>"距离"是可以被人为编辑的</strong>。绝对时间下标让久远记忆在 RoPE 里越飘越远、影响被稀释；把下标重写成小值，就把它"拉回现在"。<strong>这条对任何长上下文系统都成立，而且几乎不花钱</strong>
- <strong>它同时留下一根很硬的约束</strong>：<strong>实时</strong>。8×H800 上从 2.80 到 24.0 FPS 靠的是三层推理工程（并行 + 量化 + 流式解码），<strong>而 PERSIST 那条路（3D VAE 12 天、单帧 2672ms）在这根约束下推不动</strong>。两篇的代价结构刚好相反：<strong>一个在训练期烧算力，一个在推理期烧工程</strong>
- <strong>最诚实的评价</strong>：结果很硬（长期 PSNR 18.94 vs 最强 baseline 15.37、WorldScore 平均第一、30 人成对偏好全面领先、还做到了 24 FPS）；但 <strong>① "长期"的帧数比 PERSIST 小一个量级 ② 长期指标是无真值的自一致协议 ③ 论文自述的"FOV 检索怕遮挡"恰好是另一条路线的强项</strong>——<strong>三篇加起来才说明白"交互式世界模型"这道题目前的真实边界</strong>
- <strong>对项目的直接价值</strong>：① <strong>"先对齐师生条件"直接可搬到 OPD</strong>（最高性价比）② "时间重构图"是可迁移的长上下文技巧 ③ <strong>WorldPlay + WorldCompass + RLVR-World 三条线合起来说明"用 RL 后训练世界模型"正在成为一个新方向</strong>，值得作为小专题读完 ④ 它有 24 FPS 实时，<strong>是 lib 里目前最接近"能用来训练 agent"的世界模型</strong>

<strong>主题标签</strong>：世界模型（实时交互 / 长期几何一致性 / 蒸馏）（按轮换序列从多模态推理 / 感知（10/8 VisualSwap）切出；上次该主题是 9/28 PERSIST）
