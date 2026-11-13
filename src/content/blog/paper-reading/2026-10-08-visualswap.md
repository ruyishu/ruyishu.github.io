---
title: '1008 VisualSwap：VLM 说再看一遍，其实没看'
description: 'VLM 在推理里经常写一句"等等，我再检查一下图"，我们一直把它当成一个可信的核验动作。这篇论文做的事极简单也极狠——趁它说这句话的时候，把图偷偷换掉。结果是：…'
pubDate: '2026-10-08'
---

> 2026-10-08 · 文献阅读 #51 · 方向：<strong>多模态推理 / 感知</strong> · <strong>自反思的真实性 / 视觉再检查探针</strong> · ICML 2026 Oral（Spotlight）

## TL;DR

<strong>一句话：VLM 在推理里经常写一句"等等，我再检查一下图"，我们一直把它当成一个可信的核验动作。这篇论文做的事极简单也极狠——<strong>趁它说这句话的时候，把图偷偷换掉</strong>。结果是：模型<strong>根本没再看</strong>，它继续顺着第一张图的记忆往下推。<strong>准确率最多掉 60%</strong>。更反直觉的是 <strong>thinking 模型比 instruct 模型脆弱近 3 倍</strong>，而且<strong>模型越大越惨</strong>。关键在于：<strong>这不是能力问题，是控制问题</strong>——只要用户明确说一句"再看一眼图"，准确率几乎完全恢复。</strong>

- <strong>最刺眼的一组数（Table 2）</strong>：<strong>Qwen3-VL-235B-A22B-Thinking 88.8 → 34.1（∆ = 54.6）</strong>；<strong>ERNIE-4.5-VL-28B-A3B-Thinking 79.9 → 19.6（∆ = 60.3，全文最大）</strong>
- <strong>thinking vs instruct 的近 3 倍</strong>：<strong>Qwen3-VL-32B Instruct 79.6 → 61.8（∆ = 17.9）</strong> vs <strong>Thinking 84.9 → 36.6（∆ = 48.3）</strong>；ERNIE 也是同一形态（34.3 vs 60.3）
- <strong>规模不救，反而更糟</strong>：<strong>Qwen3-VL-8B-Thinking ∆ = 39.4</strong> vs <strong>Qwen3-VL-235B-A22B-Thinking ∆ = 54.6</strong>——参数多两个数量级，掉得更狠
- <strong>方法骨架（VISUALSWAP，两阶段）</strong>：① Stage 1 用图 I<sub>a</sub> + 问题 Q 生成推理链 <strong>R<sub>a</sub> = M(I<sub>a</sub>, Q)</strong>（这条链里天然会带"让我再看看图"）② Stage 2 <strong>把图换成视觉上高度相似、但答案不同的 I<sub>b</sub></strong>，把反思 prompt P 接到 R<sub>a</sub> 后面<strong>继续生成</strong>：<strong>R<sub>b</sub> = M(I<sub>b</sub>, Q, R<sub>a</sub> ⊕ P)</strong>，看模型能不能察觉图变了
- <strong>⚠️ 一个必须点明、否则容易误读的实现细节</strong>：swap 是<strong>完整 re-prefill</strong>（把 I<sub>b</sub> 的视觉 token 从头重新编码一遍），<strong>不是 KV-cache 或 hidden-state 干预</strong>——<strong>模型手里握着新图的完整信息，还是不看</strong>。这是全文立论能站住的地基
- <strong>基准 VS-BENCH</strong>=800 对图（<strong>MathVista / MathVerse / MathVision / MMMU-Pro 各 200</strong>），I<sub>a</sub> 用 <strong>Nano Banana Pro</strong> 做人机协同生成；成对相似度 <strong>CLIP 0.95 / SSIM 0.86 / LPIPS 0.14</strong>；<strong>5 名志愿者识别关键差异成功率 100%</strong>；<strong>强制 I<sub>a</sub> 与 I<sub>b</sub> 分辨率相同</strong>（否则视觉 token 数不同会引入混杂）
- <strong>机制（注意力）</strong>：定义为图像 token 上的平均注意力 <strong>S<sup>(l)</sup><sub>vis</sub>(t)</strong>。取 prompt 前后各 100 个 token 平均——<strong>Probe（自反思）只涨 ∆ = 1.07，Multi-turn（用户指令）涨 ∆ = 2.21（超过两倍）</strong>；8B-Thinking 上是 2.44 vs 4.70
- <strong>最漂亮的一条因果证据</strong>：把图像 token 的注意力<strong>整体乘 2</strong>（训练-free、不改一个参数）→ <strong>8B-Thinking 36.6 → 54.8（+18.2）</strong>、8B-Instruct 46.6 → 54.5（+7.9）→ <strong>直接证明"是不看，不是看不了"</strong>
- <strong>用户指令几乎完全消除失明</strong>：235B-Thinking <strong>34.1 → 85.4（+51.3）</strong>，几乎追上它自己的 baseline 88.8
- <strong>上下文越长越糟（单调）</strong>：保留 R<sub>a</sub> 从 0% → 100%，235B-Thinking <strong>88.8 → 34.1（∆ = 54.7）</strong>；同样是 Thinking 掉得更陡
- <strong>排除了四个替代解释</strong>：① <strong>不是 I<sub>b</sub> 更难</strong>——单看 I<sub>a</sub> vs 单看 I<sub>b</sub> 的 baseline 差只有 <strong>0.1%\~6.3%</strong>，而 probe 掉 20%\~55% ② <strong>不是 prompt 措辞</strong>——10 个 paraphrase 变体 σ ≤ 1.1（235B-Thinking 36.5 ± 4.9） ③ <strong>不是人为注入的分布外产物</strong>——反思语句在自然推理里出现率 <strong>87%\~97%</strong>，且在<strong>自然触发点</strong>换图只会更差（8B-Instruct 46.6 → 34.9） ④ <strong>不是"看不出差别"</strong>——人 100% 能分辨
- <strong>分层分析（Table 16）</strong>：<strong>一开始答对的 675 例里，447 例（66.2%）换图后翻错</strong>；一开始答错的持续错例里，<strong>235B-Thinking 有 72/80（90%）犯的是同一个错</strong>（instruct 更均衡：8B 是 95 vs 90）——<strong>说明它是在复读自己的旧轨迹，而不是重新处理新图</strong>
- <strong>极端对照（Table 17）</strong>：把 I<sub>a</sub> 换成<strong>完全不相关</strong>的图，Probe 下 235B-Thinking 只有 <strong>35.6%</strong> 察觉（Multi-turn 98.3%）——<strong>近三分之二的回答仍然按原图往下写</strong>
- <strong>五个干预的分解（Table 15，全文第二漂亮的设计）</strong>：无意义随机串 → <strong>全部 0.0（彻底崩）</strong>；只给系统 token → 37.9（≈自然语言 34.1，<strong>说明结构标记本身没用</strong>）；高困惑度但语义有意义 → 47.8（<strong>能部分打断 thinking 的惯性</strong>）；只有 <strong>Multi-turn（轮次边界 + 语义内容）</strong>才能到 85.4 → <strong>两个因素都必要、缺一不可</strong>
- <strong>论文自己承认的一个暴露面</strong>：Probe 与注意力分析都<strong>必须能往 assistant 响应内部插内容</strong>，而<strong>闭源 API 做不到</strong>（只能控制 user turn），所以<strong>全文只对 Gemini 3 Flash Preview 跑了 Multi-turn</strong>（86.1 vs base 88.5）
- <strong>⚠️ 没有 Limitations 章节</strong>（Conclusion 之后直接是致谢、Impact Statement、References；全文 "limitation" 只出现在正文叙述里）
- <strong>代码与数据开源</strong>：项目页 visualswap.github.io（含全部原图）· github.com/visualswap/visualswap
- <strong>主题轮换</strong>：今日<strong>多模态推理 / 感知</strong>（按序列从推理 / agentic（10/6 GraphGPO）切出；上次该主题是 9/25 VLM-CapCurriculum）

## 文献信息

| 字段 | 内容 |
|-|-|
| 标题 | Are VLMs Seeing or Just Saying? Uncovering the Illusion of Visual Re-examination（框架名 <strong>VISUALSWAP</strong>，基准名 <strong>VS-BENCH</strong>） |
| 作者 | <strong>Chufan Shi</strong>、<strong>Cheng Yang</strong>（<strong>共同一作</strong>）、Yaokang Wu、Linghao Jin、Bo Shui、Taylor Berg-Kirkpatrick、<strong>Xuezhe Ma</strong>（7 人，通讯 Chufan Shi） |
| 机构 | <strong>University of Southern California（USC）</strong> + <strong>University of California San Diego（UCSD）</strong> + <strong>Carnegie Mellon University（CMU）</strong> + <strong>University of Illinois Urbana-Champaign（UIUC）</strong>（以论文页脚逐字为准；<strong>⚠️ 一处不一致要记一笔</strong>：ICML 官方列表里 Yaokang Wu 的 institution 字段写的是 <strong>Tiktok</strong>，而论文页脚归为 CMU——两处对不上，本笔记以论文为准） |
| 发布时间 | arXiv:2605.15864（v1 2026-05-15，v2 2026-05-26，27 页含附录） |
| 会议 | <strong>ICML 2026 Oral（Accept spotlight）</strong>（<strong>双源一手确认</strong>：① <strong>arXiv abs 页 Comments 字段逐字</strong>："ICML 2026 Oral" ② <strong>ICML 官方 virtual 全量数据</strong> icml-2026-orals-posters.json 命中，count=6797 完整解析，<strong>decision 字段逐字 = "Accept (spotlight)"</strong>，<strong>eventtype = Oral</strong>（session="Oral 1F Vision-Language Models &amp; Video"，room=AUDITORIUM，2026-07-06）且同时有 <strong>Poster Session 2 #3607</strong> 一条，paper\_url=OpenReview forum <strong>DdU1o2ZvWi</strong>；项目页也标注 "ICML 2026 · Oral"；<strong>阳性对照</strong>=同表命中 lib 已读的 BSBT/MoCA、CFPO、GraphGPO、POLIA、VLM-CapCurriculum、MM-Snowball、OPSD 全部命中） |
| 链接与代码 | <a href="https://arxiv.org/abs/2605.15864">arXiv:2605.15864</a> · 项目页 <a href="https://visualswap.github.io/">visualswap.github.io</a> · 代码 <a href="https://github.com/visualswap/visualswap">github.com/visualswap/visualswap</a> · OpenReview forum DdU1o2ZvWi |
| 性质 | <strong>诊断 / 探针论文（诊断框架 + 基准 + 机制分析 + 一个 proof-of-concept 干预）</strong>；<strong>⚠️ 没有 Limitations 章节</strong>；lib 里第一篇把<strong>「模型的自陈话语」本身</strong>当自变量来证伪的论文 |
| 被评模型 | <strong>15 个全部开源</strong>（因为 Probe 需要往 assistant 响应内部插内容，闭源 API 做不到）：Qwen3-VL-8B / 32B / 30B-A3B / 235B-A22B（每个都有 <strong>Instruct 与 Thinking 两个变体</strong>）、Kimi-VL-A3B、ERNIE-4.5-VL-28B-A3B（各 Instruct + Thinking）、Qwen2.5-VL-7B-Instruct、OpenVLThinker-7B、VL-Rethinker-7B。<strong>闭源只补了一个</strong>：Gemini 3 Flash Preview（仅 Multi-turn） |
| 基准构造 | 四源各取 200 对 = <strong>800 对 (I<sub>a</sub>, I<sub>b</sub>)</strong>；<strong>MathVerse 特意取 Vision-Dominant 子集</strong>（平面/立体几何，图不可替代）；<strong>MMMU-Pro 特意取"排除纯文本可解"的样本</strong>（确保真的要看图）；I<sub>a</sub> 由标注者先定"答案关键视觉元素"与修改意图，再用 <strong>Nano Banana Pro</strong> 生成并迭代精修 |
| 推理与判分设置 | 框架 <strong>vLLM</strong>，硬件 <strong>NVIDIA H200</strong>；采样温度 <strong>τ = 0.1</strong>（作者说明理由：更高温度引入随机性干扰测量，更低如贪心解码会让 thinking 模型陷入重复退化循环）；Qwen3-VL 系列做 <strong>10 次独立采样</strong>，准确率标准差 <strong>&lt; 0.02</strong>；答案抽取用 <strong>VLMEvalKit</strong>；<strong>LLM-as-a-Judge 刻意不用 GPT-4o-mini 而用 Qwen3-VL-235B-A22B-Instruct</strong> |

## 一、先看例子（大白话：学生说"我再看一遍题"，其实根本没看）

> 💡 <strong>铺垫</strong>：现在的 reasoning VLM 靠"长链 CoT + 自反思"做测试时扩展。自反思写在 VLM 身上时，它的前提是<strong>视觉再检查（visual re-examination）</strong>——你得真的把注意力重新放回图像上，才能发现"我前面写的那句话和图对不上"。
>
> 问题是：模型写"让我再看看图"，和它<strong>真的</strong>再看图，是两件可以分开的事。

> <strong>把这件事想成考试：</strong>
>
> 监考老师对所有学生说：<strong>"做完检查一遍。"</strong>
>
> <strong>学生甲</strong>答："好的，我检查了。"——然后他把刚才写的答案<strong>又背了一遍</strong>，一个字没改。<strong>但他从没重新读过题。</strong>
>
> <strong>学生乙</strong>答："好的。"——他真的回去把题目重读了一遍，发现第一行看错了，于是改答案。
>
> <strong>两个人都说了"我检查了"。差别只在：他们到底有没有再看题。</strong>
>
> <strong>VISUALSWAP 就是"趁他说检查的那一秒，把题面换掉"。</strong>如果他把题目重读了，他就会发现题目变了；如果他只是在复读自己的答案，他完全察觉不到。

![▲ 论文 Figure 1（teaser）：给定图 Ia 与问题 Q，模型生成推理链 Ra，里面自然写了「Wait, let me check the figure again」。然后三条分支：上行是标准推理（答案 A1，正确）；中行是 VISUALSWAP——把 Ia 换成 Ib 后继续生成，模型写「Yes! The answer is right...」，答案与原来一样（本来应该变），标注✗ Just saying；下行是理想模型——它注意到图变了，给出与新图一致的答案 A3，标注✓ Actually seeing](/images/paper-reading/2026-10-08-visualswap/2026-10-08-d52-1.webp)

<strong>论文自己举的完整例子——一道几何题（Figure 1 的题面）：</strong>

- <strong>图 I<sub>a</sub></strong>：三角形 ABC，∠A = 80°、∠B = 60°，DE ∥ BC，求 ∠CED 的度数。选项 A:40° B:60° C:120° <strong>D:140°</strong>
- <strong>模型推理链 R<sub>a</sub></strong>：∠C = 180° − (80° + 60°) = 40° → ∠AED = ∠C = 40°（同位角）→ ∠CED = 180° − 40° = <strong>140°</strong>。答案 <strong>D: 140°</strong>（<strong>正确</strong>）。链尾写："Wait, let me check the figure again."
- <strong>换图</strong>：把 I<sub>a</sub> 换成 I<sub>b</sub>——<strong>视觉上几乎一模一样，但 60° 变成了 50°</strong>，于是正确答案变成 <strong>C: 120°</strong>
- <strong>模型继续生成</strong>：<strong>"Yes! The answer is right..."</strong>——它照抄自己刚才的推导，仍然答 <strong>D: 140°</strong>。✗ <strong>Just saying</strong>（只是说了）
- <strong>而真正会看的模型</strong>给出 <strong>A<sub>3</sub>: C: 120°</strong>。✓ <strong>Actually seeing</strong>（真的看了）
- <strong>🔑 这里最要命的一点</strong>：<strong>这两张图单独拿出来，模型都能做对</strong>。能力明明在，可一旦前面有了它自己写的推理链，它就不看了

![▲ 论文 Figure 5（附录 A 的错误案例）：模型在图 Ia 上（角 1 = 60°）完整推导出角 2 = 60°、答案 B，并在链尾写「Wait, let me check the figure again.」换图成 Ib（角 1 = 50°）后，模型继续写「The problem says angle 1 is 60° ... So angle 2 = 60°. Final Answer: B」——它把 60° 这个旧读数照抄了下来，角标✗](/images/paper-reading/2026-10-08-visualswap/2026-10-08-d52-2.webp)

![▲ 论文 Figure 9（附录 A 的成功案例，作为上图的对照）：同一类几何题，图 Ia 标 60°、换成 Ib 标 50°。这次模型在换图后明确写「The problem says angle 1 is 50°, not 60°. I misread the angle.」并重新推导出 130°，角标✓。说明这个能力是存在的，只是经常被自回归生成压住](/images/paper-reading/2026-10-08-visualswap/2026-10-08-d52-3.webp)

## 二、动机：为什么"自查"这件事值得被单独怀疑

- <strong>背景</strong>：把 LLM 的推理技巧搬到 VLM 上之后，VLM 也能吐出很长的推理链、也会自反思（self-reflection）。这一整套的吸引力在于<strong>测试时扩展</strong>——想得久就更准
- <strong>但 VLM 的自反思有一个语言模型没有的前提</strong>：它必须做<strong>视觉再检查</strong>——确认自己写下的内容仍然和输入图像一致，顺便压掉感知幻觉
- <strong>于是出现一个从未被认真测过的问题</strong>：模型写"Wait, let me check the figure again"时，它是<strong>真的重新看了图</strong>，还是只是<strong>复现了一个学到的语言模式</strong>？
- <strong>为什么这个问题很严重（论文 Impact Statement 自己点出的）</strong>：在医疗诊断、自动驾驶这类安全攸关场景里，<strong>用户会把"模型声称我已核验"当成可信证据</strong>——而如果核验是假的，这就是一种<strong>带有欺骗性的幻觉</strong>
- <strong>论文的方法论选择很关键</strong>：它<strong>不去测"模型答得对不对"</strong>，而是<strong>去测"当输入被破坏时，模型能不能察觉"</strong>。这一步把"有没有看"从一个无法观测的内部状态，变成一个<strong>可判定的外部行为</strong>
- <strong>而且它顺手解决了归因问题</strong>：如果模型答错了，你没法说清是"没看"还是"想错"；但如果<strong>图被换掉了，而你答的还是旧图的答案</strong>，那就是铁证——<strong>你在用旧图的记忆答题</strong>

## 三、方法：VISUALSWAP 两阶段 + VS-BENCH 800 对图

### 3.1 问题形式化

- 每个评测实例是一个三元组 <strong>T = (I<sub>a</sub>, I<sub>b</sub>, Q)</strong>：I<sub>a</sub> 原图、I<sub>b</sub> 替换图
- <strong>对的约束（这是全部设计的关键）</strong>：两图<strong>高层视觉相似</strong>（布局、风格、构图、整体语境都像），但<strong>在决定答案的细粒度细节上不同</strong>，从而 <strong>A<sub>a</sub> ≠ A<sub>b</sub></strong>
- <strong>为什么两个条件缺一不可</strong>：不够像 → 浅层视觉处理就能发现图变了，测不出"有没有真的再检查"；不够不同 → 答案没变，无从判定

### 3.2 两阶段协议（全文的核心机关）

> <strong>Stage 1 · 标准推理</strong>：<strong>R<sub>a</sub> = M(I<sub>a</sub>, Q)</strong>——模型对原图生成推理链 R<sub>a</sub>，它落在 I<sub>a</sub> 的视觉内容上，并给出初始答案。
>
> <strong>Stage 2 · 再检查探针</strong>：<strong>R<sub>b</sub> = M(I<sub>b</sub>, Q, R<sub>a</sub> ⊕ P)</strong>——把反思 prompt P（如 "Wait, let me check the image again"）接到 R<sub>a</sub> 后面，<strong>同时把图换成 I<sub>b</sub></strong>，让模型继续生成。

- <strong>对"有效再检查"的判据</strong>：模型必须<strong>察觉到当前视觉输入 I<sub>b</sub> 与先前推理 R<sub>a</sub> 之间的矛盾</strong>，并据此修正回答

<strong>三种设置的 token 级差别——这是全文最值得偷的一手（附录 F 逐字给出）：</strong>

| 设置 | token 级输入序列 |
|-|-|
| <strong>Standard</strong> | \[User Start\] <strong>I<sub>a</sub></strong> Q \[User End\] → 输出 R<sub>a</sub> |
| <strong>Probe</strong> | \[User Start\] <strong>I<sub>b</sub></strong> Q \[User End\] \[Response Start\] <strong>R<sub>a</sub> P</strong> → 输出 R<sub>b</sub>（<strong>R<sub>a</sub> 与 R<sub>b</sub> 共用同一个 assistant 响应，是连续生成、没有关掉响应</strong>） |
| <strong>Multi-turn</strong> | \[User Start\] <strong>I<sub>b</sub></strong> Q \[User End\] \[Response Start\] R<sub>a</sub> <strong>\[Response End\]</strong> \[User Start\] <strong>U</strong> \[User End\] → 输出 R<sub>b</sub>（<strong>R<sub>a</sub> 被闭合，U 是新的用户轮</strong>） |

- <strong>三种设置拿到的图（I<sub>b</sub>）与文本（R<sub>a</sub> + 要求再检查）几乎完全一样，唯一差的是「轮次边界放在哪」</strong> → <strong>这是一个极干净的隔离实验</strong>：Probe vs Multi-turn 的差别被归因到"轮次结构"，而不是内容
- <strong>⚠️ 顺带一个必须强调的实现细节（决定整篇论文能不能立住）</strong>：<strong>所有 swap 都是"用新图完整 re-prefill 整个上下文"，不是 hidden-state 干预、也不是 KV-cache 操作</strong>。也就是说换图时模型<strong>从头重新计算了新图的视觉表示，并在继续生成时拥有新图的完整访问权</strong>——<strong>它看得到，就是不看</strong>

### 3.3 三个指标

- <strong>Acc<sub>base</sub></strong>：<strong>直接对 I<sub>b</sub> 单轮推理</strong>的准确率——"正常条件下模型对这张图本来能考多少分"
- <strong>Acc<sub>probe</sub></strong>：VISUALSWAP 下最终答案的准确率——能否顶住 R<sub>a</sub> 的干扰、把新图 I<sub>b</sub> 的答案 A<sub>b</sub> 答出来
- <strong>∆ = Acc<sub>base</sub> − Acc<sub>probe</sub></strong>：<strong>再检查缺失的程度</strong>。∆ ≫ 0 说明模型<strong>没能把当前视觉证据纳入修正</strong>，而是被先前推理的语言模式锚住了

### 3.4 VS-BENCH 的构造

- <strong>四条来源各 200 对 = 800 对</strong>：<strong>MathVista</strong>（图表/函数图等，要求把视觉感知与文本逻辑结合）、<strong>MathVerse</strong>（<strong>特意取 Vision-Dominant 子集</strong>——平面与立体几何这类图不可替代的题，目的就是压制"靠文本捷径答题"）、<strong>MathVision</strong>（真实竞赛题，覆盖 16 个学科，含拓扑/图论等此前少见的领域）、<strong>MMMU-Pro</strong>（<strong>特意取"已排除纯文本可解"的样本</strong>，确保真的需要看图）
- <strong>标注流程（human-in-the-loop）</strong>：① 标注者先指出<strong>决定答案的视觉元素</strong>，并写出"要改成什么才能得到不同答案 A<sub>a</sub> 且问题仍然成立" ② 用 <strong>Nano Banana Pro</strong> 生成候选 I<sub>a</sub> ③ 标注者迭代反馈精修，直到达标
- <strong>一个容易被忽略但很重要的控制</strong>：<strong>强制 I<sub>a</sub> 与 I<sub>b</sub> 分辨率完全相同</strong>——因为分辨率不同会改变编码后的视觉 token 数量，可能引入与"再检查能力"无关的伪性能波动
- <strong>质量验证</strong>：三指标（CLIP 语义对齐 / SSIM 结构一致 / LPIPS 感知距离）→ <strong>平均 CLIP 0.95、SSIM 0.86、LPIPS 0.14</strong>（分源：MathVista 0.95/0.88/0.12、MathVerse 0.97/0.94/0.06、MathVision 0.95/0.86/0.17、MMMU-Pro 0.94/0.75/0.19）→ <strong>视觉相似但语义有别的"表面易混、答案明确"</strong>

## 四、实验

### 4.1 主结果：15 个模型，全部崩（Table 2）

下表把论文 Table 2 按"平均"重排（∆ = Acc<sub>base</sub> − Acc<sub>probe</sub>，单位 %）。注意<strong>四个基准的 ∆ 列</strong>才是原始数据，平均三列是跨四基准的均值。

| 模型 | 变体 | 平均 Base | 平均 Probe | 平均 ∆ | MathVista ∆ | MathVerse ∆ | MathVision ∆ | MMMU-Pro ∆ |
|-|-|-|-|-|-|-|-|-|
| Qwen3-VL-8B | Instruct | 69.1 | 46.6 | 22.5 | 27.5 | 26.5 | 18.5 | 17.5 |
| Qwen3-VL-8B | <strong>Thinking</strong> | 76.0 | 36.6 | <strong>39.4</strong> | 48.0 | 53.5 | 29.0 | 27.0 |
| Qwen3-VL-32B | Instruct | 79.6 | 61.8 | 17.9 | 28.5 | 13.5 | 16.5 | 13.0 |
| Qwen3-VL-32B | <strong>Thinking</strong> | 84.9 | 36.6 | <strong>48.3</strong> | 61.5 | 65.5 | 35.0 | 31.0 |
| Qwen3-VL-30B-A3B | Instruct | 70.5 | 49.6 | 20.9 | 35.0 | 15.0 | 19.5 | 14.0 |
| Qwen3-VL-30B-A3B | <strong>Thinking</strong> | 81.1 | 26.6 | <strong>54.5</strong> | 70.5 | 79.5 | 38.0 | 30.0 |
| Qwen3-VL-235B-A22B | Instruct | 81.1 | 61.3 | 19.9 | 26.5 | 20.0 | 22.0 | 11.0 |
| Qwen3-VL-235B-A22B | <strong>Thinking</strong> | <strong>88.8</strong> | <strong>34.1</strong> | <strong>54.6</strong> | 64.0 | 74.0 | 43.0 | 37.5 |
| ERNIE-4.5-VL-28B-A3B | Instruct | 63.3 | 29.0 | 34.3 | 43.0 | 39.5 | 15.0 | 39.5 |
| ERNIE-4.5-VL-28B-A3B | <strong>Thinking</strong> | 79.9 | 19.6 | <strong>60.3</strong> | 71.0 | 78.0 | 33.0 | 59.0 |
| Kimi-VL-A3B | Instruct | 48.4 | 21.4 | 27.0 | 44.0 | 27.5 | 9.0 | 27.5 |
| Kimi-VL-A3B | Thinking | 69.8 | 27.4 | 42.4 | 59.0 | 50.0 | 26.5 | 34.0 |
| Qwen2.5-VL-7B | Instruct | 48.6 | 29.4 | 19.3 | 35.0 | 13.5 | 10.0 | 18.5 |
| OpenVLThinker-7B | Thinking | 50.4 | 28.6 | 21.8 | 35.0 | 16.0 | 9.5 | 26.5 |
| VL-Rethinker-7B | Thinking | 56.8 | 27.5 | 29.3 | 46.0 | 34.0 | 5.0 | 32.0 |

> 🎁 <strong>三条反直觉结论（论文 4.2 节原话的三条）</strong>：
>
> <strong>① 所有模型都发现不了图被换</strong>——模型被明确提示"check the figure again"，却继续按原图在场一样推理；<strong>反思前缀没有触发真正的视觉重新接地</strong>，模型锚在先前推理轨迹上，给出的答案与 I<sub>a</sub> 一致而非与 I<sub>b</sub> 一致。
>
> <strong>② thinking 模型失败得更严重</strong>——所有模型族里 Thinking 变体的 ∆ 都显著大于 Instruct 对手。Qwen3-VL-32B：Instruct 17.9 vs Thinking 48.3，<strong>近 3 倍</strong>。论文的解读：<strong>更长的推理链造成了更强的文本惯性，后续生成无法克服</strong>——thinking 模型是为"细致推理"设计的，但这项能力<strong>反而加剧了再检查失败</strong>。
>
> <strong>③ 规模不救</strong>——8B-Thinking（39.4）→ 235B-A22B-Thinking（54.6），参数多了两个数量级，<strong>掉得更狠</strong>；30B-A3B-Thinking 也高达 54.5。<strong>容量提升改善的是 baseline 准确率，但解决不了连续解码中再检查的根本限制。</strong>

### 4.2 讨论一：先把"是不是 I<sub>b</sub> 本身更难"这个坑填掉（Table 3）

- <strong>潜在混淆</strong>：也许替换图 I<sub>b</sub> 天生比原图 I<sub>a</sub> 难，那 ∆ 反映的是"题变难了"而不是"再检查失败"
- <strong>做法</strong>：让所有模型在<strong>没有任何注入上下文</strong>的条件下，分别对 I<sub>a</sub> 和 I<sub>b</sub> 做标准单轮推理
- <strong>结果</strong>：Base(I<sub>a</sub>) 与 Base(I<sub>b</sub>) 的差只有 <strong>0.1%\~6.3%</strong>（如 235B-Thinking 在 MathVista 上 93.5 vs 91.0），而 probe 设定下掉 20%\~55% → <strong>替换图完全在模型能力范围之内</strong>
- <strong>论文的结论句很到位</strong>：<strong>"视觉理解能力是存在的；失败的是在连续生成过程中调用这项能力的能力。"</strong>同一个模型，单独问 I<sub>b</sub> 能答对，被要求核验自己换图后的推理时却灾难性失败

### 4.3 讨论二：用户说一句话，失明几乎完全消失（Table 4）

| 模型 | Base | Probe | Multi-turn |
|-|-|-|-|
| Qwen3-VL-8B-Instruct | 69.1 | 46.6 | 58.2 |
| Qwen3-VL-8B-Thinking | 76.0 | 36.6 | 67.5 |
| Qwen3-VL-235B-A22B-Instruct | 81.1 | 61.3 | 77.9 |
| <strong>Qwen3-VL-235B-A22B-Thinking</strong> | <strong>88.8</strong> | <strong>34.1</strong> | <strong>85.4（+51.3）</strong> |

- <strong>最大的模型恢复得最戏剧</strong>：235B-Thinking 从 34.1 回到 <strong>85.4（+51.3）</strong>，几乎追平它自己的 88.8
- <strong>这直接确认了一个关键判断</strong>：模型<strong>在长推理之后仍然保有识别视觉变化的强潜在能力</strong>。它<strong>没能自己命令自己"再看一眼"</strong>，但<strong>外部显式指令能把这个能力解锁</strong>——<strong>信息是可及的，只是需要人来触发</strong>
- 论文进一步把"到底是哪个因素在起作用"拆开测（见 4.6）

### 4.4 讨论三：机制——注意力解释了全部差距（Table 5 / Figure 2、3）

> <strong>视觉注意力分数</strong>：<strong>S<sup>(l)</sup><sub>vis</sub>(t) = (1/H) · Σ<sub>h=1..H</sub> Σ<sub>v∈V</sub> A<sup>(l,h)</sup><sub>t,v</sub></strong>
>
> 即：在第 l 层、解码第 t 步时，<strong>所有注意力头分配到图像 token 上的平均注意力权重</strong>。H = 头数，V = 图像 token 下标集合，A 是注意力概率。<strong>论文取中间层（8B 用 18–21 层，235B 用 49–52 层）</strong>——语义整合通常发生在这些层。

- <strong>定性（Figure 2/3）</strong>：在 Probe 设定下，"检查"阶段的注意力<strong>始终保持在低位</strong>；Multi-turn 在用户指令之后注意力<strong>显著抬升</strong>
- <strong>定量（Table 5，抽 100 个样本，取干预点前后各 100 个 token 的平均）</strong>： 
  - <strong>Qwen3-VL-235B-Thinking（Layer 55）</strong>：Probe 只涨 <strong>∆ = 1.07</strong>；Multi-turn 涨 <strong>∆ = 2.21</strong>——<strong>超过两倍</strong>
  - <strong>Qwen3-VL-8B-Thinking</strong>：<strong>1.67 → 5.64（∆ = 3.97）</strong> vs Multi-turn <strong>1.80 → 6.49（∆ = 4.70）</strong>
  - <strong>Qwen3-VL-8B-Instruct</strong>：Probe 2.19 → 6.46（∆ = 4.27）vs Multi-turn 2.44 → 6.77（∆ = 4.33）——<strong>instruct 两者差距小，thinking 差距大</strong>，与主结果完全对应
- <strong>论文给的机制表述（很准）</strong>：性能差距<strong>不是视觉能力缺失</strong>（被逼时模型能去看图），而是<strong>自主注意力控制的失败（a failure of autonomous attentional control）</strong>。在 Thinking 模型上尤其尖锐：<strong>随着思维链变长，模型与视觉 token 越来越脱耦，转而依赖自己生成文本的强先验。于是"检查"这个动作只是浅层的——它在模拟"再检查"的语言形式，而没有神经层面的执行。</strong>只有显式的外部打断能穿透这层文本屏障

![▲ 论文 Figure 2 与 Figure 3 合并看：8 个面板（上排 Qwen3-VL-8B 的 Instruct 层 18-21，下排同模型的 Thinking 层 18-21）。蓝线是 Baseline、红线是 Probe、绿线是 Multi-turn。基线注意力在解码开头很高、随后衰减；在干预点（Instruct 约 2700 步、Thinking 约 5800 步）红线与绿线一起跳起，但绿线明显更高。同一形态在 235B（层 54-57）上复现](/images/paper-reading/2026-10-08-visualswap/2026-10-08-d52-4.webp)

### 4.5 讨论四：上下文越长越糟（Figure 4）

- <strong>做法</strong>：在换图之前，把初始推理链 R<sub>a</sub> 按 <strong>0% / 25% / 50% / 75% / 100%</strong> 的比例保留
- <strong>结果：所有模型单调下降</strong>，且 Thinking 明显更陡：<strong>235B-Thinking 从 88.8%（0% 上下文）一路掉到 34.1%（100% 上下文），∆ = 54.7</strong>
- <strong>论文的解读</strong>：更长的推理链造成更强的<strong>上下文惯性</strong>，逐步把模型与视觉输入解耦
- <strong>但这个压制是可逆的</strong>：Multi-turn 即使给<strong>完整上下文历史</strong>也能恢复到 85.4 → <strong>连续解码把模型困在自己的轨迹里，但底层视觉能力通过外部干预仍然完好</strong>

![▲ 论文 Figure 4：Probe 准确率随保留推理上下文比例（0.00 到 1.00）的变化。四条曲线全部单调下降；235B-A22B-Thinking（红色菱形）从 88.8 掉到 34.1 最陡，8B-Instruct（蓝色圆点）从 69.1 掉到 46.6 最平缓](/images/paper-reading/2026-10-08-visualswap/2026-10-08-d52-5.webp)

### 4.6 讨论五：五个干预的分解——到底是什么在起作用（Table 15）

这是全文<strong>第二漂亮的设计</strong>：把 Multi-turn 之所以有效拆成三种可能（① 统计上反常所以打断了文本轨迹 ② 引入了特殊结构标记 ③ 轮次边界 + 语义内容的组合），然后逐一检验。

| 设定 | 8B Instruct | 8B Thinking | 235B Instruct | 235B Thinking |
|-|-|-|-|-|
| Probe（自然语言） | 46.6 | 36.6 | 61.3 | 34.1 |
| Probe（高困惑度，有意义） | 48.4 | 43.3 | 63.1 | <strong>47.8</strong> |
| Probe（高困惑度，无意义随机串） | <strong>0.0</strong> | <strong>0.0</strong> | <strong>0.0</strong> | <strong>0.0</strong> |
| Probe（只给系统 token） | 48.6 | 33.3 | 64.0 | 37.9 |
| <strong>Multi-turn（自然语言）</strong> | <strong>58.2</strong> | <strong>67.5</strong> | <strong>77.9</strong> | <strong>85.4</strong> |

- <strong>① 高困惑度但语义有意义</strong>：显著改善 Thinking（235B：34.1 → <strong>47.8</strong>），对 Instruct 几乎无效 → <strong>反常但语义合法的上下文能部分打断 Thinking 更强的文本惯性</strong>（例子："\[VERIFICATION REQUIRED\] Image hash mismatch. Manual re-inspection mandated."）
- <strong>② 无意义随机串 → 全部 0.0（彻底崩溃）</strong>：说明<strong>单纯的统计意外不够，语义内容不可缺</strong>（例子："aF8#kLqP2ˆzX!c\$vB5\*nN1@mM0%hH&amp;tT9(rR"）
- <strong>③ 只给系统 token → 37.9，与自然语言 probe 的 34.1 几乎无差别</strong>：<strong>排除了"结构标记本身能重新引导视觉注意力"这个假设</strong>
- <strong>三条合起来的结论</strong>：<strong>没有任何一个 Probe 式干预能接近 Multi-turn。用户指令的有效性来自"轮次边界 + 语义内容"的组合，而不是其中任何一个单独因素。</strong>

### 4.7 讨论六：探针本身是不是人造产物？两个角度都排除了

- <strong>反思语句在自然推理里出现率达 87%\~97%</strong>（8B-Instruct 87.1 / 8B-Thinking 93.0 / 235B-Instruct 90.9 / 235B-Thinking 96.9）——<strong>说明探针作用在模型自己就会产出的语言模式上，是分布内的</strong>
- <strong>更严格的一测</strong>：对"自然生成了反思触发词"的样本，<strong>在那个自然反思点换图</strong>（而不是人为追加标准 prompt）→ 准确率<strong>等于或低于</strong>标准探针（8B-Instruct 46.6 → 34.9；235B-Instruct 61.3 → 53.1；Thinking 两个都在 35 左右）→ <strong>失败不是"追加 prompt 造成分布不匹配"的产物</strong>
- <strong>prompt 措辞的稳健性（Table 6）</strong>：10 个语义等价但用词不同的反思 prompt，<strong>σ ≤ 1.1</strong>（235B-Thinking 甚至只有 36.5 ± 4.9）→ <strong>不是措辞敏感问题，而是连续解码范式的结构性限制</strong>

### 4.8 讨论七：放大注意力就能救回来——最直接的因果证据（Table 9）

- <strong>做法（极简、训练-free）</strong>：在 Probe 设定下生成 R<sub>b</sub> 时，把<strong>分配给图像 token 的注意力权重整体乘 2×</strong>，跨所有层与头统一施加；其他一切不变
- <strong>结果</strong>：<strong>8B-Instruct 46.6 → 54.5（+7.9）</strong>；<strong>8B-Thinking 36.6 → 54.8（+18.2）</strong>
- <strong>为什么这条很重要</strong>：它<strong>直接因果地证明</strong>了"失败来自视觉注意力不足，而不是能力丧失"——<strong>在不改任何参数、不做任何训练的前提下，逼模型"看"，就能部分恢复接地</strong>。Thinking 变体收益不成比例地大，进一步印证"thinking 模型在长推理下注意力脱耦更严重"
- <strong>作者自己的定位</strong>：这是一个 <strong>proof-of-concept</strong>，把进一步探索留给了未来——<strong>比如把多轮视觉核验数据加进 SFT/RL 流程</strong>（明确训练模型去检测"先前推理"与"更新后的视觉输入"之间的不一致），<strong>或者把视觉注意力强度当作辅助奖励信号</strong>去鼓励真正的重新接地

### 4.9 分层分析与极端对照（Table 16 / 17）

- <strong>一开始就答对的样本（Table 16 左）</strong>：<strong>235B-Thinking 的 675 例里有 447 例（66.2%）换图后翻错</strong>；8B-Thinking 是 606 例里翻 374 例（61.7%）→ <strong>退化源于"对可解题目的再检查失败"，而不是"把原有错误传播下去"</strong>
- <strong>一开始就答错的样本（Table 16 右）</strong>：把持续出错的案例分成"犯同一个错"与"犯了新错"。<strong>235B-Thinking 在 80 例持续错误里有 72 例（90%）犯的是同一个错</strong>，只有 8 例是新错；<strong>而 Instruct 更均衡</strong>（8B-Instruct：95 同错 vs 90 新错）→ <strong>thinking 模型锚在先前推理上，而不是重新处理新图</strong>
- <strong>极端对照（Table 17）</strong>：把 I<sub>a</sub> 换成<strong>完全不同类别、不同领域的无关图</strong>，指标换成 <strong>detection rate</strong>（模型是否明确察觉图变了并因此拒答/修正）→ <strong>Probe 下 235B-Thinking 只有 35.6%</strong>（8B-Thinking 53.1；Instruct 约 70），而 <strong>Multi-turn 下 235B-Thinking 达 98.3%</strong> → <strong>即便换了张毫不相干的图，近三分之二的回答仍然按"原图还在"来写</strong>
- <strong>论文自己的一个老实提醒</strong>：这里的 detection rate <strong>不能直接与 Table 4 的任务准确率比</strong>——任务准确率要求模型<strong>既注意到新图又答对题</strong>，而 detection rate 只要求<strong>注意到</strong>。Multi-turn 接近满分只说明"显式指令让察觉一张完全无关的图变得很容易"，<strong>并不代表模型在这种条件下也能产出正确的任务级答案</strong>

### 4.10 闭源侧：只能测一半（Table 18）

- <strong>为什么闭源测不了 Probe</strong>：Probe 需要把 P 插进 assistant 响应内部（\[Response Start\] R<sub>a</sub> P），<strong>API 用户只能控制 user turn 里的内容</strong>；而且 5.3 的注意力分析需要<strong>内部注意力权重</strong>，闭源模型不暴露；Gemini 这类还<strong>隐藏原始推理链、只返回 thought summary</strong>，连 R<sub>a</sub> 都只能近似构造
- <strong>能测的那一半</strong>：<strong>Gemini 3 Flash Preview，Multi-turn 86.1 vs Base 88.5</strong>——<strong>恢复效应在闭源模型上同样成立</strong>
- <strong>论文的限定很诚实</strong>：这只确认了"Multi-turn 恢复"这一端可泛化；<strong>更关键的现象——自生成反思无法触发真正的视觉重新接地——在不允许响应中途干预的 API 上根本无法测</strong>

## 五、Limitations &amp; 批判性思考

> ⚠️ <strong>⚠️ 这篇论文没有 Limitations 章节</strong>——结构是 1 引言 / 2 VISUALSWAP / 3 VS-BENCH / 4 实验 / 5 讨论 / 6 相关工作 / 7 结论，然后是致谢、Impact Statement、References、附录 A–K。全文出现 "limitation" 六次，全部是正文里的普通用词（如"这是 CoT 机制的一个根本限制"），<strong>没有一处是方法自述边界</strong>。附录 K 承认了闭源限制，但没有系统性列边界。以下 10 条是我读出来的。

1. <strong>最要紧的一条：全文最核心的证据有一半无法在商业模型上验证。</strong>Probe 与注意力分析都要求"能往 assistant 响应内部插内容"，而 GPT / Gemini / Claude 的 API 都不允许。结果是：<strong>论文对最重要的那些模型，只验证了"用户说一句就能恢复"这一半（容易的那一半），而那句最锋利的话——"模型说它看了其实没看"——恰恰是没能在这类模型上测的那一半。</strong>论文自己承认了，但影响被低估了：读者很容易把"Qwen3-VL/ERNIE/Kimi 上成立"直接推广到"所有 VLM"
2. <strong>存在一个更朴素的替代解释没被彻底排除：训练分布效应。</strong>论文用 Table 15 的五个干预把"轮次边界 + 语义内容"钉得相当漂亮，但 Probe 与 Multi-turn 还有一个差别是<strong>分布内 vs 分布外</strong>：训练数据里，"新 user turn + 新图"是<strong>常规多轮模式</strong>（模型见过无数次），而"assistant 响应内的自反思恰好伴随图被换"几乎<strong>从不出现</strong>。所以模型可能只是<strong>按训练分布行事</strong>——分布内就按常规处理新图，分布外就顺着旧轨迹续写。<strong>论文的 High-PPL meaningful 条件接近这个对照但不等价</strong>（它是"反常但仍在同一响应内"）。<strong>缺一个更强的对照：一个训练里从没见过、但语义完全等价的新格式</strong>
3. <strong>没有 Limitations 章节</strong>——作为一篇结论极强的诊断论文（"current CoT paradigms prioritize textual coherence over visual intake"），这个缺位更显眼
4. <strong>VS-BENCH 的 I<sub>a</sub> 是生成出来的，不是原生图像。</strong>标注流程用 <strong>Nano Banana Pro</strong> 生成 I<sub>a</sub>，I<sub>b</sub> 才是原始 benchmark 的图。也就是说：<strong>Probe 里模型看到的像素（I<sub>b</sub>）是"真的"，而它被告知的旧记忆（R<sub>a</sub>）建立在"生成的"图上。</strong>生成图可能带有与 I<sub>b</sub> 不同的合成伪影/光照/线条粗细——论文只做了<strong>分辨率对齐</strong>这一项控制，<strong>没有做"生成伪影可检测性"实验</strong>（例如把 I<sub>a</sub> 与 I<sub>b</sub> 都换成同源的编辑图，或者放一组"仅改变无关细节"的负对照）
5. <strong>判分用的是 LLM-as-a-Judge，而且 judge 与被评模型同族。</strong>答案抽取用 VLMEvalKit，judge 用 <strong>Qwen3-VL-235B-A22B-Instruct</strong>（论文明确说"刻意不用 GPT-4o-mini"）。而 15 个被评模型里<strong>有 8 个是 Qwen3-VL 系列</strong>——<strong>同族偏好风险没有被讨论，也没有换裁判做稳健性检查</strong>。lib 里"裁判可靠性"这条线已经是第四次成为软肋（MindJourney 的 self-scoring → MoCA 的 self-judge → VLM-CapCurriculum 的归因裁判 → 本篇的 judge）
6. <strong>题目类型高度集中，外推未验证。</strong>800 对图全部来自四个<strong>数学/科学推理</strong>基准，而且成对差异被刻意设计成"<strong>单点、可定位</strong>"（60°→50°、某根柱子变短、紫色方块换成青色）。这类题的"答案关键视觉元素"是<strong>一个数字或一个物体</strong>。<strong>对"整场景语义变化"的情形完全没有测</strong>——多轮对话历史里的一张图、视频的一帧、文档的一页、GUI 截图的一个按钮。而恰恰这些场景才是"自反思不看"最危险的地方（多轮视觉 agent）
7. <strong>∆ 的口径混入了一个小项。</strong>∆ = Acc<sub>base</sub> − Acc<sub>probe</sub>，而 Acc<sub>base</sub> 用的是对 I<sub>b</sub> 的准确率。如果模型本来对 I<sub>b</sub> 就比对 I<sub>a</sub> 差（Table 11 里最大到 12.0，平均层面 0.1\~6.3），这部分会混进 ∆。论文用"Ia vs Ib 差可忽略"来论证，但<strong>没有把 ∆ 按"初始是否正确"重算成与 Table 16 分层分析一致的口径</strong>——而分层分析里那个 66.2% 的翻错率，其实才是更干净的指标
8. <strong>2× 注意力放缩只做到 proof-of-concept。</strong>作者自己说"leave further exploration to future work"。但它同时是一个很强的暗示：<strong>也许正确的修法根本不在训练侧，而在解码期的注意力干预</strong>。论文没有测放缩倍数（1.5×? 3×?）、没测"只放缩特定层/特定头"、也没测它有没有副作用（会不会引入对无关区域的过度关注）
9. <strong>完全没有训练侧方案。</strong>全文是纯诊断 + 一个推理期 hack。结论只提了两句方向："把多轮视觉核验数据加进 SFT/RL，明确训练模型检测先前推理与更新视觉输入的不一致"，以及"用视觉注意力强度当辅助奖励"。<strong>这正好是可做的空位</strong>（见第七节）
10. <strong>"文本惯性"这个核心机制没有被测闭环。</strong>论文把原因归为"模型转而依赖自己生成文本的强先验"，但<strong>只测了图像 token 的注意力，没有测对 R<sub>a</sub> 文本 token 的注意力是否同步上升</strong>，也没有测 R<sub>a</sub> 的困惑度、自一致性、内部注意力占比。也就是说：<strong>"视觉注意力掉下去了"被证明了，"文本注意力吸走了它"只是推测。</strong>把这半句补上，机制才是完整的

## 六、与前文对照

> 🔗 <strong>一句话定位</strong>：lib 的"感知 vs 推理"这条线此前一直在问"<strong>怎么让模型看得更准</strong>"（造诊断 / 造信号 / 造任务 / 改奖励 / 改数据顺序）；<strong>本篇第一次把问题换成"模型声称自己在看的时候，它到底看了没有"</strong>——从"提升感知"换到"<strong>证伪感知的自陈</strong>"。而且它给出的答案，恰好把上一条主线上最刺眼的那个现象解释掉了。

### 6.1 与 VLM-CapCurriculum（9/25 #45）——最直接，是同一根问题的上下半段

- <strong>CapCurriculum 的立论</strong>：86.9% 的错答源于<strong>视觉感知失败</strong>而非推理失败；而且它的 teaser 标语就是<strong>"Re-checking does not correct perception"（想得更久救不了一次看错）</strong>，配图是模型反复重看却读出同一个错读数
- <strong>本篇给这个现象补上了机制</strong>：CapCurriculum 观察到的"重看没用"，在本篇里被进一步下沉为——<strong>模型根本没有"重看"这个动作</strong>。它的自反思不抬高图像 token 注意力（∆ = 1.07），文章写得再像在核验，视觉通道没被打开
- <strong>两篇合起来是一条完整的因果链</strong>：<strong>CapCurriculum：看错 &gt; 想错（错在哪一步）→ 本篇：连"再看"这个动作本身都是语言表演（为什么改不了）</strong>
- <strong>而且两篇的处方指向同一个方向：要救感知只能从外部施加。</strong>CapCurriculum 的办法<strong>在数据侧</strong>（把纯感知样本隔离出来、按"感知→文本推理→视觉推理"排课）；本篇的办法<strong>在交互侧</strong>（用户显式指令 / 注意力放大）。<strong>一个改喂什么，一个改什么时候打断</strong>——两者正交、可叠加
- <strong>一个共同的软肋也重合了</strong>：CapCurriculum 的 86.9% 是 LLM judge 归因的，本篇的答案抽取与 detection 也是 LLM judge（且同族）。<strong>"裁判可靠性"在 lib 这条线上反复出现</strong>

### 6.2 与 CFPO（9/7 #31）——同一思想的两种实现：一个自内向外、一个自外向内

- <strong>CFPO</strong>：在<strong>注意力层</strong>做反事实干预——把证据区的 value 换成非信息先验（<strong>do(Z = Z<sub>cf</sub>)</strong>，即"闭眼重答"），用 <strong>Δcf = log π(睁眼) − log π(闭眼)</strong> 量化"视觉证据的净信息增益"，揪出"没看图就答对"的捷径
- <strong>本篇</strong>：在<strong>输入层</strong>做反事实干预——把图本身换掉，看模型察觉不察觉
- <strong>两篇是同一种方法论的两种实现</strong>：<strong>都是"干预式探针"</strong>——问的不是"模型答对了吗"，而是"<strong>如果把某个东西拿掉/换掉，模型的表现会不会变</strong>"。CFPO 改的是<strong>内部表示</strong>，本篇改的是<strong>外部输入</strong>
- <strong>可以合成一个二维探针矩阵</strong>：（内部干预 / 外部干预）×（有没有图 / 图是什么）→ <strong>CFPO 覆盖"内部掐断视觉通路"，本篇覆盖"外部替换视觉输入"，两者缺一都是盲区</strong>
- <strong>并且 CFPO 的 Δcf 正好可以用来解释本篇的注意力 Δ 为什么重要</strong>：Δcf 测的是"视觉证据对输出的净贡献"，而本篇测的是"视觉注意力有没有被调度起来"。<strong>一个是结果侧的量、一个是过程侧的量</strong>——把两者拼起来就能回答"注意力掉下去 → 视觉贡献也掉下去"这条链

### 6.3 与 BSBT / MoCA（8/31 #26）——都把"看没看"变成可判定信号

- <strong>BSBT 的诊断工具是 PV 盲测</strong>：用一个纯文本的 Qwen2.5-14B <strong>蒙上眼</strong>，只靠推理链里的感知文本答题；答对就说明"感知文本已经足够"，于是 R<sub>P</sub> = 1（还和人类 κ = 0.707）。<strong>它测的是"感知信息在文本里有没有被完整写出"</strong>
- <strong>本篇测的是"模型有没有真的去读像素"</strong>——更靠前的一环
- <strong>两篇共享一个核心观察</strong>：<strong>模型倾向于用文本替代视觉</strong>。BSBT 里表现为"感知文本足够时纯文本模型也能答对"；本篇里表现为"图像被换掉，模型仍按旧文本继续写"
- <strong>两篇合起来可以定位失效层次</strong>：本篇在第 0 层（有没有看像素）→ BSBT 在第 1 层（看到的有没有说清）→ CapCurriculum 在第 2 层（看到的有没有被推理正确使用）。<strong>三级探针，可以串成一条诊断流水线</strong>

### 6.4 与 MM-Snowball（9/9 #33）——同一种病的两个时间尺度

- <strong>MM-Snowball</strong>：多轮对话里的<strong>幻觉滚雪球</strong>——早期感知错误被当事实写进历史，随后跨轮放大（E‖ε<sub>k+1</sub>‖ &gt; E‖ε<sub>k</sub>‖），模型逐轮忽视视觉接地、依赖被污染的文本历史。指标 VFR（视觉衰减率）与 SRS（雪球抵抗）
- <strong>本篇</strong>：<strong>同一次生成内部</strong>的文本惯性——R<sub>a</sub> 污染 R<sub>b</sub>，而且保留比例越高污染越重（0% → 100% 单调下降）
- <strong>两篇是同一种病的两个时间尺度</strong>：<strong>MM-Snowball 是跨轮污染（轮与轮之间），本篇是轮内污染（同一个响应内部）</strong>。而本篇的 Figure 4 恰好把两个尺度连起来——<strong>"上下文保留比例"就是"污染剂量"的连续旋钮</strong>
- <strong>可以合做一个二维鲁棒性画像</strong>：横轴=轮内污染（本篇的 ∆ 或 Figure 4 的斜率），纵轴=跨轮污染（MM-Snowball 的 VFR/SRS）→ <strong>一个"抗文本惯性"的模型应该在两个方向都平</strong>
- MM-Snowball 也做了一个"视觉修正"阶段（第四阶段），本篇说明那个"修正"很可能也是假的

### 6.5 与 ViCrit（9/17 #42）——lib"给感知造监督"第三条路线上的第二个样本

- <strong>我在 #42 里总结过 lib 的三条路线</strong>：<strong>造诊断</strong>（BSBT 的盲测 R<sub>P</sub>）/ <strong>造信号</strong>（MIRL 的 MI、CFPO 的反事实 Δcf、PAPO 的掩码 KL）/ <strong>造任务</strong>（ViCrit——把"看图准不准"改造成"找出被注入的那处假描述"，判分退化为字符串相等）
- <strong>本篇属于第三条路线的第二个样本</strong>，而且改造得更彻底：<strong>ViCrit 把"感知"改造成可验证任务；本篇把"有没有再去看"改造成可验证行为</strong>。ViCrit 的判分靠"揪出错误片段"，本篇的判分靠"对比 Acc<sub>base</sub> 与 Acc<sub>probe</sub>"——<strong>后者甚至不需要标注</strong>
- <strong>套路完全一样：task reshaping</strong>——一个原本无法判定的能力（"看懂了没"、"真的看了没"），被重构成一个有唯一答案的可判定问题
- <strong>而且两篇都明确地把"感知"与"推理"分离开</strong>：ViCrit 证明 RL 在 ViCrit 任务上学到的是"怎么看"而不是"背物体"（数学/抽象图只占训练数据的 7%，却在 MathVision +4.9）；本篇则证明"看"这个动作本身可以被单独证伪

### 6.6 与 JitRL（9/24 #44）——都是免训练的测试时干预，而且本篇构成了一个警告

- <strong>JitRL</strong>：训练-free 的测试时策略优化——用记忆库 M = {(s,a,G)} 算 Q̂/V̂ 优势，直接改进 logits 再重出。它的整个前提是"<strong>推理期可以在不改参数的情况下把策略掰好</strong>"
- <strong>本篇的 2× 注意力放缩也是纯推理期干预</strong>（训练-free、不改参数）→ <strong>"测试时干预"这条线从"改 logits"扩展到了"改注意力"</strong>：JitRL 干预的是<strong>输出分布</strong>，本篇干预的是<strong>输入的注意力分配</strong>，一个在尾巴、一个在源头
- <strong>但更重要的是本篇对 JitRL 这一类方法构成一个警告</strong>：如果模型<strong>在解码过程中根本没在看图</strong>（图像 token 注意力 ∆ = 1.07），那么<strong>只在输出侧改 logits 分布，未必能把视觉证据拉回来</strong>——因为问题不在"选哪个动作的概率"，而在"证据压根没进到决策里"
- <strong>反过来，本篇也给了 JitRL 一条升级路径</strong>：把"图像 token 的注意力强度"作为一个<strong>可观测的内部状态</strong>纳入 JitRL 的记忆/优势估计——现在 JitRL 的状态只有 (s, a, G)，<strong>如果加上"这一步有没有看证据"，就能区分"因为没看而失败"和"看了但选错"</strong>
- <strong>两篇的共同气质</strong>：都极其便宜（JitRL 只要 API + 记忆库，本篇只要 800 对图 + 两次推理），都不训练，都把一个"看起来不可观测的东西"变成了可计算的量

### 6.7 与 GraphGPO（10/6 #50）——都在拆穿"看起来对的东西"

- <strong>GraphGPO</strong>：拆穿"轨迹级归因"——实测成功轨迹里 65.3% 的步其实没推进任务、失败轨迹里 22.0% 在推进，所以"这条轨迹成了"这个信号本身是错的依据
- <strong>本篇</strong>：拆穿"自反思话语"——模型说"我再看看图"，实测图像 token 注意力几乎没动，所以这个"看起来在核验的步骤"是假的
- <strong>两篇共享的方法论气质：先找一个所有人都默认可信的信号，然后去测它到底可不可信。</strong>GraphGPO 用"图上到目标的距离"替代轨迹结果；本篇用"换掉图看反应"替代自陈
- <strong>而且两篇的结论可以接起来</strong>：GraphGPO 需要"能正确判定每个状态离目标多远"，而如果 agent 是 VLM 且它在自反思时根本没看屏幕，那么<strong>它走过的状态可能本身就是幻觉出来的</strong>——<strong>GraphGPO 的图会建在一个错误的状态空间上</strong>。这是一个真实的组合风险

### 6.8 与 lib 的 OPD 主线（EOPD / HPD / VGS / GNDPO / REOPOLD / OPSD / SDPO）——最大的机会

- <strong>本篇是零训练、零教师、零蒸馏的纯诊断论文</strong>（结论里明确说"未来可把多轮视觉核验数据加进 SFT/RL"）
- <strong>而 OPD 主线一直在解的问题恰恰是"怎么把教师信号打准、打到哪些 token 上"</strong>：EOPD 在教师高熵处切前向 KL、HPD 在 prefill 阶段 token 级重加权、VGS 把梯度显式掰向视觉子空间、GNDPO 做 batch 级 z-score 治离群 token、REOPOLD 把 OPD 当策略优化做裁剪与动态采样
- <strong>本篇的 5.7 节自己给出了一个 OPD 主线从没用过的信号：视觉注意力强度。</strong>原话是"using visual attention strength as an auxiliary reward signal to encourage genuine re-grounding during reflection"
- <strong>这是 lib 里目前没人占的位置</strong>：<strong>以前所有方法都在改"权重"（哪些 token 的 KL 加权多少），没有一篇用"注意力分配"当监督对象</strong>。而本篇已经证明：<strong>这个量既解释现象、又预测失效、还能被人工干预并直接改变结果（2× → +18.2）</strong>

## 七、启发与待跟进

### 7.1 启发

1. <strong>"把宣称变成行为"是一类高产且可复用的研究套路。</strong>不问"模型说它做了什么"，而问"<strong>如果它真做了，世界上某个可观测的量必须满足什么条件</strong>"，然后<strong>人为破坏那个条件</strong>。这是把自陈（self-report）变成可证伪命题的通用方法，几乎可以无脑搬运到任何领域：模型说"我检索了"→ 把检索结果换掉；说"我调用了工具"→ 把工具返回值改掉；说"我读了这份文档"→ 把文档换一页。<strong>每个领域都可能有一篇"Are X Just Saying?"</strong>
2. <strong>本文最漂亮的一手是"只改轮次边界"这个隔离实验。</strong>Probe 与 Multi-turn 的 token 序列差别只有 \[Response End\]\[User Start\] 的位置，图与文本内容全同——<strong>用极小的实现差异换来了极干净的因果归因</strong>，再配 Table 15 的五路分解把"结构标记 vs 语义内容 vs 统计意外"逐一排除。<strong>做诊断类论文时这是最值得偷的设计</strong>
3. <strong>"不是能力问题、是控制问题"这个二分非常有力量</strong>，而且论文用三条<strong>互相独立</strong>的证据把它钉死：① 单独看 I<sub>b</sub> 会做（能力在，Table 3）② 2× 注意力就能恢复（通道在，Table 9）③ 用户说一句就恢复（可被调度，Table 4）。<strong>"能力存在但调度不出来"是一个值得系统搜索的失效类别</strong>——它比"能力不够"更有希望被工程解决，因为通道还在
4. <strong>注意力是一条被严重低估的可观测诊断线。</strong>本篇只用一个量（图像 token 的平均注意力）同时做到了三件事：（a）<strong>解释</strong>现象（∆ 1.07 vs 2.21）（b）<strong>证明因果</strong>（2× 放缩 → +18.2）（c）<strong>预警</strong>（随上下文长度单调下降）。<strong>lib 里目前没有一篇以注意力为自变量</strong>
5. <strong>"一格旋钮"式的干预非常适合做 pilot。</strong>2× 注意力放缩：改动极小（一行代码级别）、效果可量（+18.2）、方向明确（不是"换个架构试试"，而是"如果机制成立，效果必然出现"）。<strong>这种"机制预测 → 最小干预验证 → 显著变化"的闭环，是做低成本论文的正确姿势</strong>
6. <strong>负面结论也能撑起一篇 Oral。</strong>这篇论文没有任何新模型、没有训练、没有任何 benchmark 上的 SOTA——它只是<strong>把一件所有人都默认成立的事情证伪了</strong>，而且证得干净（15 个模型、四源基准、四个替代解释逐一排除）。<strong>选题时"推翻一个默认假设"比"再涨一个点"更值钱</strong>
7. <strong>对做评测的人的直接启示：现有的 VLM benchmark 可能系统性高估了真实能力。</strong>因为它们的题目都只看"最终答案对不对"——而本篇说明<strong>模型相当一部分的正确答案，是在它以为自己还在看旧图的情况下给出的</strong>。把 Acc<sub>probe</sub> 加进常规评测几乎零成本，信息量却很大

### 7.2 待跟进（按性价比排序）

1. <strong>【最高性价比】把"视觉注意力强度"变成 OPD / RL 的监督信号。</strong>论文明确留白（5.7 节原话）。具体做法：在 R<sub>a</sub> → R<sub>b</sub> 的干预点上取图像 token 的平均注意力 S<sub>vis</sub>，作为一个<strong>逐位置的辅助奖励</strong>（或 OPD 里给视觉接地 token 的 KL 加权系数），目标是"让自反思时的注意力向 multi-turn 时的注意力靠拢"。<strong>数据几乎免费</strong>（VS-BENCH 800 对）、<strong>信号可判定</strong>（注意力是内部可读的标量）、<strong>且 lib 的 OPD 主线全在改权重、没人用过注意力</strong>
2. <strong>给闭源模型找一个不依赖"响应内插内容"的 Probe。</strong>现在 API 只能控制 user turn，所以最锋利的那一半测不了。可能的替代实现：用 <strong>tool-call / 结构化输出 / 多个 system 消息切分 / 连续两次 user turn（第一次带图、第二次只带新图）</strong>来构造一个"仍在同一段推理中"但 API 可表达的等价探针。<strong>谁先做出来，谁就能把结论覆盖到 GPT/Gemini/Claude</strong>——这是本篇最大的空白
3. <strong>把"文本惯性"测闭环。</strong>补测：① 对 R<sub>a</sub> 文本 token 的注意力随上下文长度如何变化 ② R<sub>a</sub> 的困惑度 / 自一致性 / 内部注意力占比 ③ 图像注意力下降的幅度与文本注意力上升的幅度是否此消彼长。<strong>把"视觉注意力掉下去"与"文本注意力吸走它"这两半连上，机制才算完整</strong>
4. <strong>跨模态外推 Swap。</strong>把"图像交换"推广到<strong>视频帧 / 文档页 / 多图输入 / GUI 截图 / 多轮对话历史里的图</strong>。动机很直接：<strong>多轮视觉 agent 与 GUI agent 里"自反思不看屏"的代价比数学题大得多</strong>（答错一道题 vs 点错一个按钮），而这恰恰是当前最热的应用场景。而且本篇的题目类型是"单点可定位的差异"，换成场景级差异后难度与结论是否成立，是完全开放的
5. <strong>与 MM-Snowball 合成一个"抗文本惯性"二维指标。</strong>横轴=轮内污染（本篇 Figure 4 的斜率或 ∆），纵轴=跨轮污染（MM-Snowball 的 VFR / SRS）。<strong>一个真正抗惯性的模型应该在两个方向都平</strong>；而现有模型很可能是"轮内就崩了，所以根本轮不到跨轮"
6. <strong>核对一个具体的口径重叠。</strong>把 ∆ 按"初始是否正确"重新分层，与 Table 16 的 66.2% 对齐成一个统一指标（现在的 ∆ 混入了 Ia/Ib 之间的 baseline 差异）。<strong>这是低成本、可直接做的小事</strong>，但能让"退化来自可解题目"这个结论更硬
7. <strong>把 VS-BENCH 当"诚实度"探针用在自己关心的模型上。</strong>800 对图、判分只需对比 Acc<sub>base</sub> 与 Acc<sub>probe</sub>，<strong>成本极低，但信息量远大于再测一遍准确率</strong>。建议纳入日常模型评测的固定项

## 八、今日阅读结论

> 🎁 <strong>今日一句</strong>：模型在推理里写的那句"我再看看图"，我们一直把它当成一个可信的核验动作；这篇论文趁它说这句话的时候把图偷偷换掉，证明它<strong>常常只是一句学到的台词</strong>——<strong>Qwen3-VL-235B 的 thinking 变体从 88.8 掉到 34.1，而它手里握着新图重新编码后的完整视觉表示</strong>。
>
> <strong>而这篇最锋利的地方不在"掉得多"，在于它把这件事定性得非常准：这不是能力问题，是控制问题。</strong>三条独立证据都指向同一处——单看新图它会做（能力在）、把图像注意力乘 2 就恢复一半（通道在）、用户说一句就几乎全部恢复（可被调度）。<strong>能力一直在，只是连续解码时，模型更愿意相信自己刚写完的那段话。</strong>

<strong>一个补充判断，也是我认为这篇最值得被记住的地方</strong>：它没有提出任何新模型、没有训练、没有任何 SOTA。<strong>它只是把一件所有人都默认成立的事情证伪了，而且证得很干净</strong>——15 个模型、四源基准、四个替代解释逐一排除、外加一个训练-free 的因果干预。而且它顺手把 lib 上一环（9/25 VLM-CapCurriculum 的"re-checking does not correct perception"）的机制往下沉了一层：<strong>不是重看没用，是它压根没重看。</strong>
