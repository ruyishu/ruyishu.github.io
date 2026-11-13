---
title: '0925 CapCurriculum：先学会看，再学着想'
description: 'VLM 做视觉题做错，86.9% 不是因为"想错"，而是因为"看错"——而且看错之后，想得再久也救不回来。本文的解法不是改损失、不是改奖励、甚至不是改模型，而是…'
pubDate: '2026-09-25'
---

> 2026-09-25 · 文献阅读 #45 · 方向：多模态推理 / 感知 · <strong>能力维度课程（capability curriculum）vs 难度维度课程</strong> · ICML 2026 Poster

## TL;DR

<strong>一句话：VLM 做视觉题做错，86.9% 不是因为"想错"，而是因为"看错"——而且看错之后，想得再久也救不回来。本文的解法不是改损失、不是改奖励、甚至不是改模型，而是<strong>把训练数据重新排一遍课</strong>：把后训练拆成「视觉感知 → 文本推理 → 视觉推理」三段分开训，并证明这个"能力维度"的课程与传统的"难度维度"课程<strong>正交、且可以相加</strong>。</strong>

- <strong>最反直觉的归因数字</strong>：用 Claude-Haiku-4.5 对 Qwen3-VL-8B 在 3 个视觉数学数据集上的错答逐条归因，<strong>86.9% 的错答源于视觉感知失败</strong>，而非推理失败
- <strong>看错之后的"努力"是白费</strong>：一旦感知错了，后续长链推理不会纠正它，只会基于错误前提"自圆其说"；<strong>反复重新看图，读出来的还是同一个错误读数</strong>
- <strong>只训推理会有"感知税"（perceptual tax）</strong>：不给感知数据，Qwen2.5-VL-7B 的 <strong>MMStar 反降 1.6%</strong>；补上感知数据后 RWQA 反而涨（7B +3.0% / 8B +3.6%）
- <strong>顺序不能反（最刺眼的一组数）</strong>：1→2→3（感知→文本推理→视觉推理）最好；<strong>倒过来 3→2→1，视觉数学均值从 42.26 掉到 37.70（比 base 的 37.03 还差），Overall 从 59.75 掉到 55.93（低于 base 的 56.68）</strong>
- <strong>感知要用 RLVR 学，不能用 caption SFT 学</strong>：同一个 Stage 1，RLVR vs SFT 的 Overall 是 <strong>59.75 vs 56.35</strong>（7B）、65.77 vs 65.14（8B）——<strong>SFT 版甚至不如不训</strong>
- <strong>两个课程维度正交可叠加（全文最漂亮的一张表）</strong>：Qwen3-VL-8B 上 Merged 58.56 → 只用能力维度 60.53 → 只用难度维度 60.36 → <strong>两者叠加 62.99</strong>
- <strong>结果 = 更准 + 更短</strong>：Qwen3-VL-8B Overall <strong>62.19 → 65.77</strong>（Merged 是 64.67）；同时推理链<strong>短 20.8%</strong>（测试集上也短 6.6%–12.6%）——<strong>"看得清，就不需要想那么多"</strong>
- <strong>四个骨干全涨</strong>：相对各自 Merged，Qwen3-VL-8B +3.37 / Qwen2.5-VL-7B +1.62 / InternVL3-8B +3.77 / InternVL3.5-8B +0.95；三次运行平均在 15 个基准里赢 14 个（8B）
- <strong>主题轮换</strong>：今日<strong>多模态推理 / 感知</strong>（按序列从推理 / agentic（9/24 JitRL）切出；上次该主题是 9/17 ViCrit）

## 文献信息

| 字段 | 内容 |
|-|-|
| 标题 | From Seeing to Thinking: Decoupling Perception and Reasoning Improves Post-Training of Vision-Language Models（项目名 <strong>VLM-CapCurriculum</strong>） |
| 作者 | Juncheng Wu、Hardy Chen、Haoqin Tu、Xianfeng Tang、Freda Shi、Hui Liu、Hanqing Lu、<strong>Cihang Xie</strong>、<strong>Yuyin Zhou</strong>（9 人） |
| 机构 | <strong>UC Santa Cruz</strong>（Juncheng Wu / Hardy Chen / Haoqin Tu / Cihang Xie）+ <strong>Amazon</strong>（Xianfeng Tang / Hui Liu / Hanqing Lu）+ <strong>Vector Institute</strong>（Freda Shi）+ <strong>Johns Hopkins University</strong>（Yuyin Zhou）（<strong>机构以 ICML 官方列表的逐作者字段为准</strong>） |
| 发布时间 | arXiv:2605.20177（19 页） |
| 会议 | <strong>ICML 2026 Poster</strong>（<strong>双源一手确认</strong>：① <strong>ICML 官方 virtual 全量数据</strong> icml-2026-orals-posters.json 命中，count=6797 完整解析，eventtype=<strong>Poster</strong>，session="Poster Session 5"，paper\_url=OpenReview forum <strong>r7uOjvZdzO</strong>；<strong>阳性对照</strong>=同表命中 lib 已读的 EOPD / HPD / MoCA（同时命中 Oral 与 Poster 两条）/ Self-Distillation ② OpenReview forum 页显式 <strong>Decision: Accept (regular)</strong>，venue 字段 "ICML 2026 regular"。<strong>arXiv abs 页 Comments 字段无录用标注</strong>） |
| 链接与代码 | <a href="https://arxiv.org/abs/2605.20177">arXiv:2605.20177</a> · 项目页 <a href="https://ucsc-vlaa.github.io/VLM-CapCurriculum/">ucsc-vlaa.github.io/VLM-CapCurriculum</a>（<strong>代码 / 模型 / 数据均开源，VLAA 实验室出品</strong>） |
| 性质 | <strong>方法 / 训练流程论文（数据合成 + 课程设计）</strong>；<strong>有独立 Limitations 章节</strong>；<strong>lib 里第一篇以"训练数据排课顺序"为唯一自变量的论文</strong> |
| 骨干与基线 | 主骨干 <strong>Qwen3-VL-8B-Instruct</strong> 与 <strong>Qwen2.5-VL-7B-Instruct</strong>；泛化性另测 <strong>InternVL3-8B</strong> / <strong>InternVL3.5-8B</strong>；对比的开源推理 VLM 基线：GThinker / MMR1 / OpenVLThinker / R1-OneVision-RL / WeThink（7B 档）、OneThinker-8B（8B 档） |
| 数据来源 | 感知 = <strong>DOCCI</strong>（15K 细粒度图文对，自建感知 QA）；文本推理 = <strong>ORZ-Math-13k</strong>；视觉推理 = 沿用前作构建方式。<strong>三份数据互不重叠</strong> |
| 训练设置 | 框架 <strong>EasyR1</strong>，算法 <strong>GRPO</strong>（组大小 G=5，奖励 R = r\_acc + r\_format，KL 正则），max response 2048；<strong>8 × NVIDIA H200</strong>；三段步数 <strong>90 / 375 / 465</strong>（合计 930），相应 <strong>Merged baseline 也训 930 步</strong>（总步数对齐） |
| 评测基准 | <strong>视觉数学</strong>：MathVista MINI（MVista）、MathVision MINI（MVision）、MathVerse Vision-Intensive / Vision-Only（MVerse VI / VO）、WeMath（部分表含 DynaMath、CV-Bench、V\*Bench）；<strong>感知</strong>：A-OKVQA、RealWorldQA（RWQA）、MMStar、POPE（部分表含 Hallusion、BLINK、VisOnlyQA、VStarBench）；统一用 <strong>VLMEvalKit</strong> 评测，裁判模型为 <strong>Claude-Haiku-4.5</strong> |

## 一、先看例子（大白话：不是想不出来，是根本没看清）

> 💡 <strong>铺垫</strong>：现在训 VLM 的主流做法是"长链 CoT + RLVR"——把视觉题、几何题、图表题、视觉数学全部混在一起训，指望它"想得更久就更准"。
>
> 这篇论文做的事很简单：<strong>先把错答一条条拆开看，到底错在哪一步。</strong>结论是——<strong>绝大多数错在第一步"看"。</strong>

> <strong>把这件事想成"考试看错题"：</strong>
>
> <strong>① 看错题干。</strong>图里明明写着 AP = 5、AC = 3，模型读成了"AP ≠ AC"，自己跟自己矛盾。
>
> <strong>② 于是它开始"努力"。</strong>写很长的推理、反复检查、重新看图——<strong>但重新看图读出来的还是同一个错读数。</strong>
>
> <strong>③ 最后交白卷或交错答案。</strong>推理链越长，只是在错误前提上堆了更多字。
>
> <strong>反过来，看对了的情况：</strong>三步就出答案，推理链短得惊人。

![▲ 论文 Figure 1（teaser）：上方 Case A —— 看错了图（把 AP=5、AC=3 读成 AP 不等于 AC，自相矛盾），于是开始长链推理、反复重看图，但重看得到的是同一个错误读数，最终无有效结论；下方 Case B —— 看对了，三步就出答案 BD=2。论文的标语就是这一句：Re-checking does not correct perception](/images/paper-reading/2026-09-25-capcurriculum/2026-09-25-d46-1.webp)

<strong>这不是个例，而是被量化过的：</strong>

- 作者用 <strong>Claude-Haiku-4.5</strong> 对 <strong>Qwen3-VL-8B</strong> 在 <strong>3 个视觉数学数据集</strong>上的<strong>全部错答</strong>做逐步归因（判断"第一个视觉感知步骤是否就错了"）
- 结果：<strong>86.9% 的错答源于视觉感知错误</strong>，而不是后续推理错误
- 这也解释了项目页上那句标语：<strong>"Longer thinking cannot fix incorrect perception"（想得更久救不了看错）</strong>

![▲ 论文 Figure 4：同一道几何题上 Merged 与 Staged 的真实输出对比。Merged 把图中 73 归给了 60 度角（感知错误），随后反复重算、重看图，仍然沿用一个错误读数，推理链拖得很长；Staged 一眼看对（73 对着 65 度角），几步就收敛到正确答案 B。这就是全部差别：一个在想，一个在看](/images/paper-reading/2026-09-25-capcurriculum/2026-09-25-d46-2.webp)

## 二、动机：想得再久，也救不了一次看错

- <strong>根问题</strong>：主流 VLM 后训练（长链 CoT + RLVR）默认"推理能力是瓶颈"——所以数据集越混越大、推理链越训越长
- <strong>但证据指向另一个瓶颈</strong>：错答归因显示 <strong>86.9% 错在感知</strong>。一旦感知错了，后续推理<strong>不会纠正它</strong>，而是基于错误前提持续放大错误
- <strong>更糟的是"只训推理"会主动损害感知</strong>：这叫 <strong>perceptual tax（感知税）</strong>——论文实测 Qwen2.5-VL-7B 只做推理-only 后训练，<strong>MMStar 反降 1.6%</strong>（而同期 MVerse VI +10.2%、WeMath +6.0% 涨得很欢）
- <strong>所以论文把问题重新定义</strong>：感知不是"推理的副产品"，而是<strong>必须单独用专门数据训练的一等能力</strong>，并且应当作为<strong>脚手架（scaffold）先砌稳</strong>，再往上叠推理
- <strong>这个重新定义直接推出一个被忽略的自变量</strong>：既然能力有先后依赖，那么<strong>训练数据的"能力顺序"本身就是一个可调维度</strong>——这就是全文的立论（capability-dimension curriculum）

![▲ 论文 Figure 3：三个配置的对比（Baseline 灰 / Reasoning-only 红 / Perception+Reasoning 绿）在 Qwen2.5-VL-7B 与 Qwen3-VL-8B 上。只训推理（红）能把视觉数学顶上去，但感知指标 MMStar 会掉（感知税）；补上感知数据（绿）后，视觉数学继续抬升、感知指标也恢复到 base 以上。每张图最右侧的 AVG 组柱最能说明问题](/images/paper-reading/2026-09-25-capcurriculum/2026-09-25-d46-3.webp)

## 三、方法：造数据 → 筛数据 → 排课

### 3.1 三步走总览

![▲ 论文 Figure 2：方法总览。(a) 感知 QA 生成：把 DOCCI 的细粒度 caption 喂给 LLM，让它出只考细节或空间关系的问题；(b) 感知难度过滤：同一个问题分别只给图、只给 caption 去问基座 VLM，只在给图答错、给 caption 答对时保留该样本；(c) 三段式训练：视觉感知 → 文本推理 → 视觉推理](/images/paper-reading/2026-09-25-capcurriculum/2026-09-25-d46-4.webp)

### 3.2 第 1 步 · 感知数据合成（自己造一个"看得清"的训练集）

- <strong>原料</strong>：<strong>DOCCI</strong> 数据集——15K 张图，每张配<strong>极细粒度的自然语言描述</strong>（这是关键：caption 里已经写明了"画面里到底有什么"）
- <strong>做法</strong>：对每个图文对 (I, C)，用 <strong>Qwen2.5-72B</strong> 从 caption 生成感知向问答对：<strong>(Q, A) = f\_gen(C)</strong>，要求问题必须<strong>明确 grounded 在图像细节或空间关系上</strong>，且答案直接取生成结果（不需要人工标注）
- <strong>为什么能这样造</strong>：caption 是"标准答案的自白书"——既然 caption 里写了"河面上有七盏路灯的倒影"，那"河面上倒影了几盏路灯"就是一个答案确定、且纯考视觉细节的问题

### 3.3 第 2 步 · 感知难度过滤（全文最关键的一步设计）

<strong>核心问题：怎么保证一条样本"错是因为没看清"，而不是"错是因为想不出"？</strong>

- <strong>双重推理路径对照</strong>：对每个生成的问题 Q，用基座 VLM f\_θ 跑两条路——<strong>Â\_img = f\_θ(I, Q)</strong>（只给图）和 <strong>Â\_cap = f\_θ(C, Q)</strong>（只给 caption）
- <strong>保留条件</strong>（严格二值）：<strong>Â\_img ≠ A 且 Â\_cap = A</strong> —— 只看图答错，但看 caption 就能答对
- <strong>这一条件恰好排除了两种污染</strong>：① 如果连 caption 都答不对，说明这题需要推理能力，不只是感知 ② 如果给图就能答对，说明基座的感知在这条上没问题、训它没有增益
- <strong>为了更稳，用两个模型做双重过滤</strong>：<strong>Qwen2.5-VL-7B</strong> 与 <strong>Qwen2.5-VL-32B</strong> 都要满足上式，才进入 D\_perc
- <strong>所以 D\_perc 里的样本定义就是</strong>："信息在 caption 里明明有，但模型自己看图看不见"——<strong>纯粹是感知缺陷，不含推理难度</strong>

![▲ 论文 Figure 6：合成出的视觉感知数据长这样。问题只考看清——河面上倒影的街灯有几盏、GUEST 里哪个字母是后来补漆的；答案严格来自 caption（图中下划线句被标成答案来源），而基座模型只看图时会答错。这正是被过滤条件保留下来的样本形态](/images/paper-reading/2026-09-25-capcurriculum/2026-09-25-d46-5.webp)

### 3.4 第 3 步 · 三段式 GRPO（排课本身）

- <strong>三份互不重叠的数据</strong>：D\_perc（自建感知）/ D\_text（ORZ-Math-13k 文本数学推理）/ D\_vis（视觉推理，沿用前作构建）
- <strong>训练顺序</strong>：<strong>D\_perc → D\_text → D\_vis</strong>（记为 <strong>1→2→3</strong>，即 Figure 2(c) 的"从看到想"）
- <strong>三段用完全相同的超参与 epoch 数</strong>：步数 90 / 375 / 465，唯一变的就是"什么时候喂哪份数据"
- <strong>算法仍是标准 GRPO</strong>：组内标准化优势 <strong>A\_i = (R(x,y\_i) − μ\_R) / (σ\_R + ε)</strong>，奖励 <strong>R = r\_acc + r\_format</strong>，带 KL 正则的裁剪目标——<strong>没有改损失、没有改奖励、没有加模块</strong>
- <strong>Merged 对照怎么做的（公平性的关键）</strong>：把三份数据<strong>并起来打乱</strong>，<strong>同样的超参、同样的总步数 930 步</strong>联合训——这正是当前常见做法，也是唯一严格可比的 baseline
- <strong>一个需要留意的实现细节</strong>：三段式训练里视觉编码器在 Stage 2 冻结、Stage 1/3 解冻（论文称 "Mixed"，也是主表配置）；而 Merged baseline <strong>全程冻结视觉编码器</strong>（论文说这是跟随推理向后训练的常见实践）

## 四、实验

### 4.1 主结果一：同骨干下 三段式 vs 混合式

<strong>这是全文最干净的一组对照——同样的数据、同样的总步数、同样的超参，只改"喂的顺序"。</strong>

| 骨干 / 训练方式 | MVista | MVision | MVerse VI | WeMath | 视觉数学均值 | Overall |
|-|-|-|-|-|-|-|
| Qwen2.5-VL-7B Base | 68.50 | 22.37 | 26.40 | 30.86 | 37.03 | 56.68 |
| Qwen2.5-VL-7B Merged | 70.00 | 20.39 | 35.15 | 37.43 | 40.74 | 58.34 |
| <strong>Qwen2.5-VL-7B Staged</strong> | <strong>71.20</strong> | 21.71 | <strong>37.82</strong> | <strong>38.29</strong> | <strong>42.26</strong> | <strong>59.75</strong> |
| Qwen3-VL-8B Base | 72.40 | 26.32 | 31.09 | 50.86 | 45.17 | 62.19 |
| Qwen3-VL-8B Merged | 73.80 | 28.95 | 40.36 | 55.43 | 49.64 | 64.67 |
| <strong>Qwen3-VL-8B Staged</strong> | <strong>75.90</strong> | 28.62 | <strong>43.78</strong> | <strong>56.10</strong> | <strong>51.10</strong> | <strong>65.77</strong> |

- 两个骨干上 Staged 都全面优于 Merged，<strong>Overall 分别 +1.41（7B）与 +1.10（8B）</strong>
- <strong>Merged 的感知分反而会掉</strong>：Qwen2.5-VL-7B 的感知均值 <strong>76.33 → 75.95（Merged）→ 77.24（Staged）</strong>；Qwen3-VL-8B <strong>79.21 → 79.71 → 80.44</strong> —— 混训确实存在"顾此失彼"
- 同一个 Merged 模型在 <strong>MVision 上甚至从 22.37 掉到 20.39</strong>（7B），而 Staged 拉回 21.71；这类"最依赖看清细节"的基准正是感知数据的靶心

### 4.2 主结果二：与开源推理 VLM 横向比

| 模型 | 视觉数学均值 | 感知均值 | Overall | WeMath | MMStar | RWQA |
|-|-|-|-|-|-|-|
| Qwen2.5-VL-7B（base） | 37.03 | 76.33 | 56.68 | 30.86 | 64.40 | 67.45 |
| GThinker-7B | 41.17 | 77.38 | 59.27 | 35.15 | 64.60 | 69.80 |
| WeThink-7B | 43.37 | 76.94 | 60.16 | 46.57 | 64.67 | 69.54 |
| <strong>Qwen2.5-VL-7B（Staged）</strong> | <strong>42.26</strong> | <strong>77.24</strong> | <strong>59.75</strong> | 38.29 | 64.07 | 70.46 |
| Qwen3-VL-8B（base） | 45.17 | 79.21 | 62.19 | 50.86 | 70.00 | 70.85 |
| OneThinker-8B | 51.10 | 78.64 | 64.87 | 54.57 | 70.20 | 71.50 |
| <strong>Qwen3-VL-8B（Staged）</strong> | <strong>51.10</strong> | <strong>80.44</strong> | <strong>65.77</strong> | <strong>56.10</strong> | <strong>73.07</strong> | <strong>74.51</strong> |

- <strong>8B 档两个指标同时最高</strong>：视觉数学 51.10 与 OneThinker-8B 打平，但<strong>感知均值 80.44 明显领先（79.21 base / 78.64 OneThinker）</strong>，Overall 65.77 超过 OneThinker 的 64.87
- <strong>论文对 WeMath +5.2%、RealWorldQA +3.7% 的宣称，就是上表 Staged vs base 的那两格</strong>（50.86→56.10；70.85→74.51）
- <strong>7B 档的定位更微妙</strong>：视觉数学（42.26）<strong>低于 WeThink-7B（43.37）</strong>，靠感知（77.24，该档最高）和 Overall 才拉到接近；<strong>要看清这篇的强项是"不偏科"，不是单项屠榜</strong>

### 4.3 顺序（Table 3）：1→2→3 最好，而倒过来会掉到 base 以下

| 骨干 / 阶段顺序 | 视觉数学均值 | 感知均值 | Overall |
|-|-|-|-|
| Qwen2.5-VL-7B Base | 37.03 | 76.33 | 56.68 |
| 1→2→3（感知优先） | <strong>42.26</strong> | <strong>77.24</strong> | <strong>59.75</strong> |
| 2→1→3（先文本推理） | 42.91 | 76.30 | 59.61 |
| <strong>3→2→1（感知垫最后）</strong> | <strong>37.70</strong> | 74.17 | <strong>55.93</strong> |
| Qwen3-VL-8B Base | 45.17 | 79.21 | 62.19 |
| 1→2→3（感知优先） | <strong>51.10</strong> | 80.44 | 65.77 |
| 2→1→3（先文本推理） | 50.75 | <strong>80.86</strong> | <strong>65.80</strong> |
| <strong>3→2→1（感知垫最后）</strong> | 50.03 | 79.55 | 64.79 |

- <strong>7B 上把感知放到最后（3→2→1）是灾难</strong>：视觉数学 <strong>42.26 → 37.70</strong>（<strong>比 base 的 37.03 只高 0.67</strong>），Overall <strong>59.75 → 55.93</strong>，<strong>直接低于 base 的 56.68</strong>——训了 930 步还倒退
- 论文的解释：<strong>感知梯度是低噪声的，但一旦先在推理上建立了"长链 + 自我说服"的行为模式，后到的感知梯度就被这个行为覆盖掉了</strong>
- <strong>一个好细节</strong>：<strong>2→1→3 与 1→2→3 几乎打平</strong>（7B 的视觉数学 42.91 vs 42.26；8B 的 Overall 65.80 vs 65.77）→ 说明起决定作用的是<strong>"感知必须早于视觉推理"</strong>，而"感知 vs 文本推理谁先"没那么要紧

### 4.4 感知要用 RLVR 学，不能用 caption SFT 学（Table 4）

| 模型 / Stage 1 训练方式 | 视觉数学均值 | 感知均值 | Overall | WeMath |
|-|-|-|-|-|
| Qwen2.5-VL-7B · RLVR | <strong>42.26</strong> | <strong>77.24</strong> | <strong>59.75</strong> | <strong>38.29</strong> |
| Qwen2.5-VL-7B · SFT | 37.03 | 75.67 | 56.35 | 30.10 |
| Qwen3-VL-8B · RLVR | 51.10 | <strong>80.44</strong> | <strong>65.77</strong> | 56.10 |
| Qwen3-VL-8B · SFT | 51.08 | 79.21 | 65.14 | 54.48 |

- <strong>7B 上最刺眼</strong>：用 caption SFT 训感知，视觉数学均值 <strong>37.03——正好等于 base</strong>，总体 56.35 <strong>还不如不训（base 56.68）</strong>；而换 RLVR 是 42.26 / 59.75
- 论文给的机制解释：caption SFT 是"模仿描述"，<strong>而 RLVR 会显式惩罚"没有视觉依据的解读（unsupported or hallucinated visual interpretations）"</strong>——所以 RL 给了更强、更对准 ground 的感知信号
- <strong>但 8B 上两者差距小得多</strong>（65.77 vs 65.14，MVision 上 SFT 甚至更高 32.24 vs 28.62）→ <strong>"RLVR 一定优于 SFT"这个结论在不同骨干上的强度并不一致</strong>

### 4.5 两个课程维度正交且可叠加（Table 5，全文最漂亮的一张）

| Qwen3-VL-8B / 课程设置 | WeMath | DynaMath | RWQA | V\*Bench | AVG |
|-|-|-|-|-|-|
| None（Merged，无课程） | 55.43 | 54.15 | 75.56 | 80.63 | 58.56 |
| Capability（只按能力排课，即本文） | 56.10 | 61.14 | 74.51 | 83.77 | 60.53 |
| Difficulty（只按难度排课） | 54.10 | 67.07 | 72.68 | 83.77 | 60.36 |
| <strong>Capability + Difficulty（两者叠加）</strong> | <strong>57.43</strong> | 67.49 | <strong>75.82</strong> | <strong>84.29</strong> | <strong>62.99</strong> |

- <strong>三个配置单独都能赢 Merged</strong>（60.53 / 60.36 vs 58.56），<strong>叠加后 62.99，比任一单独课程再高 2 分以上</strong>
- <strong>结论</strong>：能力维度与难度维度是<strong>处理训练优化的两个正交面</strong>，可以组合出加法收益——这是本文最可迁移的一般性命题
- <strong>细节</strong>：难度维度单独用最利好 DynaMath（54.15 → 67.07），能力维度单独用最利好 V\*Bench（80.63 → 83.77），<strong>叠加后几乎所有格子都是最好</strong>

### 4.6 阶段消融（Table 7）：一个会被反复引用的反例

| Qwen3-VL-8B / 训练阶段 | MVista | MVision | WeMath | AVG |
|-|-|-|-|-|
| Base Model | 72.40 | 26.32 | 50.86 | 66.07 |
| 只有 Stage 3（视觉推理） | 73.90 | 26.64 | 56.10 | 67.33 |
| Stage 2→3（文本推理 + 视觉推理） | 73.80 | 27.30 | 56.10 | 67.55 |
| <strong>Stage 1→3（感知 + 视觉推理）</strong> | 73.90 | <strong>29.28</strong> | <strong>58.76</strong> | <strong>68.27</strong> |
| Stage 1→2→3（完整三段） | <strong>75.90</strong> | 28.62 | 56.10 | 68.22 |

- <strong>加感知（Stage 1）带来最大的一跳</strong>：MVision 26.64 → 29.28、WeMath 56.10 → 58.76，AVG 67.33 → 68.27
- <strong>加文本推理（Stage 2）几乎没用</strong>：67.33 → 67.55（论文原话："推理向的改进在感知还弱时基本饱和"）
- <strong>⚠️ 值得记一笔的异常</strong>：<strong>Stage 1→3（跳过文本推理）的 AVG 68.27 反而略高于完整三段 68.22</strong>——论文没有解释这个现象，但它实际上<strong>削弱了"必须三阶段"的论证</strong>：看上去只要保证"感知先行"就够了（另见 4.3 里 2→1→3 与 1→2→3 打平）

### 4.7 泛化性、稳健性与"更短"

- <strong>四个骨干全涨（Table 10，扩展基准）</strong>：InternVL3.5-8B 52.76 → <strong>53.71</strong>；InternVL3-8B 41.94 → <strong>45.71</strong>；Qwen2.5-VL-7B 50.30 → <strong>51.92</strong>；Qwen3-VL-8B 58.77 → <strong>62.14</strong>。<strong>增益在 base 更弱的骨干上更大</strong>（InternVL3-8B base 只有 29.69，涨得最猛）
- <strong>三次运行平均（Table 11）</strong>：Qwen3-VL-8B Staged <strong>65.82 vs Merged 63.03（+2.79）</strong>，15 个基准赢 <strong>14 个</strong>；Qwen2.5-VL-7B Staged <strong>57.37 vs Merged 55.78（+1.59）</strong>，赢 <strong>12 个</strong>。少数 Merged 领先的格子差距都在 0.6% 以内
- <strong>"看得清就不需要想那么多"（Table 12 + Figure 5）</strong>：Staged 的推理链比 Merged <strong>短 20.8%</strong>；四个视觉数学测试集上分别短 <strong>6.6% / 7.4% / 12.6% / 8.4%</strong>，且<strong>准确率更高</strong>
- <strong>视觉编码器冻结策略（Table 8）差异很小</strong>：Qwen3-VL-8B Staged 在 Mixed / All Freeze / All Open 下分别是 68.22 / 68.63 / 68.42 → <strong>说明主要增益来自"数据 + 顺序"，而不是"编码器解冻"</strong>（这条也部分回应了 3.4 里提到的公平性疑虑）

![▲ 论文 Figure 5：训练过程中平均响应长度随步数变化（虚线分隔三个阶段）。三段式训练在 Stage 3（视觉推理）阶段把长度压到 440 左右并稳住；混合训练全程停在 550 到 600 且不回落。这就是看得清就不需要反复重看图的行为证据](/images/paper-reading/2026-09-25-capcurriculum/2026-09-25-d46-6.webp)

## 五、Limitations &amp; 批判性思考

### 论文自述的 3 条限制

- <strong>规模</strong>：全部实验都在 <strong>7–8B</strong>，32B+ 未验证
- <strong>数据依赖</strong>：感知管线依赖<strong>细粒度 caption 资源</strong>，没有这类资源的领域（医学影像、遥感等通常只有标签）适用性受限
- <strong>粒度</strong>：三段分解未必是"最细的能力切分"，更细的阶段划分是有趣的方向

### 我读出来的额外问题

- <strong>① 86.9% 这个核心动机数字本身是 LLM 判的</strong>（Claude-Haiku-4.5），<strong>没有人类标注核验、也没有换裁判模型做稳健性检查</strong>。它是全篇立论的基石，却只以"motivating evidence"出现——这是最该补的实验
- <strong>② "感知必须早于视觉推理"的结论稳，但"必须三阶段"的结论不稳</strong>：Table 7 里 Stage 1→3（68.27）≥ Stage 1→2→3（68.22），Table 3 里 2→1→3 ≈ 1→2→3。<strong>把这三条放在一起，论文实际证明的是"感知要先行"，而不是"三段式配方本身有必要"</strong>——正文的叙述比数据更强
- <strong>③ 训练预算的分配没有被扫描</strong>：90 / 375 / 465 步是人为设定（"每段同 epoch"），没有做"多给感知多少步最划算"的实验。这类配方的关键超参恰好没消融
- <strong>④ 主表对照里 Merged baseline 全程冻结视觉编码器、Staged 在 Stage 1/3 解冻</strong>。虽然论文称这是跟随惯例、且 Table 8 显示冻结策略影响不大（≤0.4），但严格意义上<strong>主表仍混入了一个实现差异变量</strong>
- <strong>⑤ 过滤条件过于二值</strong>："给图错 + 给 caption 对"只做了保留/丢弃，<strong>没有难度分级</strong>。而"caption 对了但图错得离谱"与"图错得很勉强"是两种样本，混在一起训可能浪费了信息（这正是 4.5 里"难度维度"可以接管的地方，但论文没在感知数据内部做这件事）
- <strong>⑥ 绝对增益偏小、且在噪声边缘</strong>：主表 8B 是 +1.10，7B 是 +1.41；三次运行平均才把差距拉到 +2.79 / +1.59。<strong>单个基准上（MVision 上 Staged 28.62 vs Merged 28.95、WeMath 7B 上 38.29 vs 37.43）其实互有胜负</strong>
- <strong>⑦ 评测面偏窄</strong>：只有 4 个视觉数学 + 4 个感知基准，<strong>没有通用 VQA、视频、文档理解</strong>；也没有测"感知数据变多会不会把通用能力带偏"这类遗忘风险——而"训练会伤害已有能力"正是 lib 里反复出现的主题
- <strong>⑧ 推理链变短的解释是相关性而非因果</strong>：论文说"看得清就不需要想那么多"，但"链变短"与"感知变好"是在同一训练里同时发生的，<strong>没有做"固定链长"的对照</strong>来排除"只是被 RL 压短了"

## 六、与前文对照

> 🔗 <strong>一句话定位：lib 里"感知 vs 推理"这条线此前都在"改损失 / 改奖励"，本篇第一次把自变量换成了「数据喂进去的顺序」——而它恰好证明了顺序比配方更关键。</strong>

### 6.1 与 ViCrit（9/17）——同一根问题的两种解法：一个改任务，一个改顺序

- <strong>ViCrit</strong> 发现的是：把推理链里的一句视觉描述改错，模型看不出来（"看着像在看，其实没在看"）→ 它的解法是 <strong>造任务</strong>：造一个视觉事实判别任务，把"看得出错"当奖励来训感知
- <strong>本篇</strong>发现的是：86.9% 的错答错在第一步 → 它的解法是 <strong>排课</strong>：先单独练感知、再练推理
- <strong>两篇都在说同一句话</strong>："感知需要单独监督"。差别在<strong>监督从哪来</strong>：ViCrit 用"造一个任务"，本篇用"筛一批数据"
- <strong>最有价值的对照读法</strong>：ViCrit 的过滤条件是"模型能不能发现描述被改错"，本篇是"给图错、给 caption 对"——<strong>两者都是"用 caption 当视觉事实的 oracle"</strong>，本质同源，可以互相对照设计更严的筛选器

### 6.2 与 MoCA（9/23）——同源不同药：一个在同一批数据内分锅，一个在数据层面隔离

- <strong>MoCA</strong> 用 <strong>PV（把模型说出的感知文本喂给一个蒙眼推理器）</strong> 给感知单独发奖励，并用它<strong>路由 GRPO 的优势</strong>（Bad Thinking 保护感知 token / Bad Seeing 加重惩罚）
- <strong>本篇</strong>不在同一批数据里分锅，而是<strong>直接把"纯感知样本"筛出来单独训</strong>——<strong>用数据的隔离替代了奖励的隔离</strong>
- <strong>两者是"感知 credit assignment"的两条正交路线</strong>：MoCA 在<strong>样本内</strong>区分"看错"与"想错"；本篇在<strong>样本间</strong>只留下"必然看错"的样本。<strong>可以组合</strong>：先用本篇的方式造 D\_perc，再用 MoCA 的 PV 在 D\_vis 上路由优势
- <strong>一个反讽</strong>：MoCA 的 w/o SVV 消融证明"高方差 LLM judge 会被模型钻空子"；而本篇的立论数字 86.9% <strong>也是 LLM judge 给的</strong>，只是不做训练信号所以没有 hacking 风险——<strong>裁判可靠性在这条线上已经是第三次成为软肋</strong>

### 6.3 与"探针家族"（PAPO 8/18 / CFPO / BSBT）——本篇是第四个探针，但用法最工程

- <strong>PAPO</strong>（输入层随机掩码图像）→ <strong>CFPO</strong>（隐空间反事实干预）→ <strong>MoCA</strong>（文本层蒙眼推理器）：探针位置依次外移，且都<strong>把探针输出当训练信号</strong>
- <strong>本篇的"双层推理路径对照"（f\_θ(I,Q) vs f\_θ(C,Q)）是第四个探针</strong>，但用法完全不同：<strong>它只用来筛数据，不进损失、不进奖励、不加模块</strong>
- <strong>工程含义很实际</strong>：这是四个探针里<strong>落地成本最低的一个</strong>——不需要改训练代码，只需要在造数据阶段跑两遍推理做过滤

### 6.4 与 OPD 主线（本文写作的核心对照，也是最大的机会）

- <strong>最本质的差异</strong>：本篇是 <strong>100% 的 RLVR</strong>（奖励 = 准确率 + 格式），<strong>完全没有教师模型、没有蒸馏</strong>。而 lib 的 OPD 主线（HPD / EOPD / VGS / GNDPO / REOPOLD / OPSD）一直在问"怎么把教师信号打准"
- <strong>本篇恰好补上了 OPD 缺的一环：数据侧的能力隔离。</strong>lib 里的 VGS 用<strong>显式掰弯梯度子空间</strong>的方式解决"OPD 的视觉接地梯度被语言先验淹没"；而本篇的思路是——<strong>如果 D\_perc 里每一条样本都保证"错在看不见"，那么朴素 OPD 的逐 token KL 就会自动集中在视觉接地的 token 上</strong>，不需要任何梯度手术
- <strong>与 EOPD / HPD 的接口</strong>：EOPD 在教师高熵处切前向 KL，HPD 在 prefill 阶段做 token 级重加权——两者都在调"哪些 token 的蒸馏权重"，<strong>而本篇调的是"喂哪些样本"</strong>。样本选择与 token 加权<strong>是两个可以叠乘的旋钮</strong>，目前 lib 里没有论文同时扭过
- <strong>与 TMS（跨时间 checkpoint 混标签）</strong>：TMS 在<strong>时间维度</strong>上调数据分布，本篇在<strong>能力维度</strong>上调数据顺序——两者都说明<strong>数据分布的时序结构是被长期忽略的自由度</strong>，可以合起来做"时空二维课程"

### 6.5 与 Self-Distillation（9/22"U 型曲线"）

- 9/22 那篇的结论是"自训练同时带来信号遗忘与去噪，风险呈 U 型，需要早停"
- <strong>本篇提供了一个"按能力分阶段早停"的具体场景</strong>：Table 7 显示 Stage 2（文本推理）几乎无增益（67.33 → 67.55），而 4.5 显示难度维度单独用反而拖低 WeMath（55.43 → 54.10）——<strong>某些阶段就是"训了不如不训"</strong>，这正好是 U 型曲线在课程学习里的落点

## 七、启发与待跟进

> 💡 <strong>今天最该带走的一条</strong>：当大家都在改损失、改奖励、加模块的时候，<strong>这篇论文只改了一个东西——数据的顺序</strong>，然后拿到了 +2.79（三次运行平均）和一个"推理链短 20.8%"的额外收益。<strong>"数据排课"是被严重低估的自由度。</strong>

### 方法启发（可迁移）

- <strong>① 以"错误归因"作为找题目的起点，成本低、故事清楚</strong>：这篇的完整故事线 = 先量化"错在哪"（86.9%）→ 据此重设训练流程。这套路数只需要一个强 LLM 当裁判 + 一批错答，<strong>算力门槛极低</strong>，非常适合作为论文起步动作
- <strong>② "双路径对照"是最便宜的探针</strong>：同一问题问两遍（给图 / 给文本描述），只在"一条错一条对"时保留样本。<strong>不改损失、不改奖励、不进模型，纯数据工程</strong>——这个模式可以直接搬到任何"有 privileged 文本"的场景（表格→文本、视频→字幕、3D→描述）
- <strong>③ "能力维度正交于难度维度"是可复用的一般命题</strong>：任何多能力后训练都可以问一句"能不能既按能力排课、又按难度排课"
- <strong>④ "更准 + 更短"是一个被低估的卖点</strong>：这篇顺手证明"感知变好会让推理链自然变短"。<strong>如果在自己项目里也能观察到"效果涨 + 长度降"，那是一条比单纯涨点更硬的证据</strong>（毕竟涨点可能只是噪声）

### 待跟进（按性价比排序）

- <strong>① 【最高性价比】把"感知数据隔离"搬进 OPD</strong>：用本篇的过滤方式造 D\_perc（图错 caption 对），跑 OPD（教师如 Qwen3-VL-32B），与"同数据 + RLVR"直接对撞。若 OPD 更强，则说明<strong>"稀疏的结果奖励 vs 稠密的教师 KL"在纯感知任务上谁会赢</strong>——这个问题 lib 里没人回答过
- <strong>② 检验"感知先行"是否真的足够</strong>：补齐 Table 7 那个反常格（Stage 1→3 的 68.27 vs 完整三段 68.22），做多种子确认。<strong>如果成立，这篇论文的配方可以从"三段"简化成"两段 + 感知优先"，结论反而更强</strong>
- <strong>③ 把二值过滤升级成难度分级</strong>：现在是"图错 caption 对就留"，可以改成按"错得有多离谱"（如用 caption 与图的 grounding 距离）分档，再叠上难度课程（Table 5 已有框架）
- <strong>④ 在 3B 规模复现并压到 2×L20 可承受</strong>：Qwen2.5-VL-3B + 本篇配方，数据合成阶段甚至可用 API 完成（过滤只需推理不需训练）——<strong>这是本机算力条件下最现实的一条复现路线</strong>
- <strong>⑤ 换裁判模型重算 86.9%</strong>：用不同家族/不同规模的 judge 各算一遍，看这个基石数字稳不稳。稳则立论更硬，不稳则是现成的"质疑点+改进点"
- <strong>⑥ 与 MoCA 的 PV 正面对撞</strong>：<strong>数据过滤（本篇）vs 奖励门控（MoCA）</strong>，同骨干同数据的总账对比。这是一个干净的"两条路线谁更值"的实验
- <strong>⑦ 感知 vs 推理的分离是否跨模态成立</strong>：音频（听错 vs 推错）、视频（时序看错）、文档图（表格读数错）——如果 86.9% 这个比例在不同模态上稳定出现，那就是一篇更强的"普适结论"论文

## 八、今日阅读结论

> 🎁 <strong>今日一句</strong>：<strong>在问"为什么它想不出来"之前，先确认它是不是"根本没看清"——而解决"没看清"最便宜的办法，可能既不是改损失、也不是改奖励，而是把数据重新排一遍课。</strong>

- <strong>这篇论文的"轻"是它的最大优势</strong>：没有新损失、没有新模块、没有理论——只有三个动作：<strong>造数据（caption→QA）、筛数据（图错 caption 对）、排数据（感知→文本推理→视觉推理）</strong>。整篇的可复制性极高
- <strong>它给出的最有价值的一般性命题</strong>：<strong>能力维度</strong>是独立于<strong>难度维度</strong>的第二个课程轴，两者正交可加（58.56 → 60.53 / 60.36 → <strong>62.99</strong>）
- <strong>它同时给出一个警告</strong>：顺序错了不只是"没收益"，而是<strong>倒退到不如 base</strong>（7B 上 3→2→1 训 930 步后 Overall 55.93 &lt; base 56.68）——<strong>后训练的"排课"是一个高风险的旋钮</strong>
- <strong>它最动人（也最需要被验证）的一句</strong>：<strong>"看得清，就不需要想那么多"</strong>——准确率更高的同时推理链短 20.8%。如果这条在别的场景也成立，"推理链变短"本身就可以是目标
- <strong>对我项目的直接价值</strong>：① 本篇的<strong>双路径过滤</strong>是零成本可搬的数据工程手段 ② <strong>D\_perc + OPD</strong> 是本篇与 lib OPD 主线的天然交叉点，也是目前看最值得动手的一个小实验 ③ <strong>在 3B 规模 + 2 卡 L20 上，这篇是全 lib 里最容易吃到第一口肉的之一</strong>

<strong>主题标签</strong>：多模态推理 / 感知（按轮换序列从推理 / agentic（9/24 JitRL）切出；上次该主题是 9/17 ViCrit）
