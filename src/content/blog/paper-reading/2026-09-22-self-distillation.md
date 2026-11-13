---
title: '0922 Self-Distillation：自蒸馏为什么既有用又有害'
description: '把"用自己生成的标签再训一遍"（自训练 = 自蒸馏）做多轮，会出现一条 U 型曲线——前几轮涨、后面跌。这篇论文在过参数化线性回归上把它彻底算清楚了：每一轮同时…'
pubDate: '2026-09-22'
---

> 2026-09-22 · 文献阅读 #42 · 方向：OPD（迭代自训练／自蒸馏）· <strong>lib 里第一篇 OPD 理论论文</strong> · ICML 2026

## TL;DR

<strong>一句话：把"用自己生成的标签再训一遍"（自训练 = 自蒸馏）做多轮，会出现一条 U 型曲线——前几轮涨、后面跌。这篇论文在过参数化线性回归上把它彻底算清楚了：每一轮同时发生两件方向相反的事，① 去噪（随机误差按 (1+τ)⁻ᵗ 指数衰减，最终趋于 0）② 信号遗忘（系统误差随迭代上升，t→∞ 时收敛到"什么都不学"的风险）。两个速率不匹配（噪声掉得快、信号忘得慢）→ 前期净赚、后期净亏 → U 型 + 最优早停。而且他们还给出了一个<strong>可证明一致、不需要验证集</strong>的停止准则 iGCV。</strong>

- <strong>核心分解</strong>：<strong>R\*\_t = B\*\_t + V\*\_t</strong>。B\*\_t（信号遗忘）随 t <strong>上升</strong>，t→∞ 时趋近"零模型"的风险 r²s；V\*\_t（去噪）随 t <strong>下降</strong>，且渐近趋 0
- <strong>为什么是 U 型（关键：速率不匹配）</strong>：噪声以 (1+τ)⁻ᵗ <strong>指数快速衰减</strong>，而信号遗忘的收缩因子 s/(s+τ) <strong>非常接近 1</strong>（遗忘很慢）→ 中间有一段"去噪占上风"的窗口。<strong>U 型只在各向异性（s&gt;1）时出现</strong>；各向同性（s=1）时两者同速，风险单调
- <strong>机制（最漂亮的一段）</strong>：ridgeless 更新可写成 β̂\_t = P\_t β̂\_{t−1}，P\_t 是<strong>到 X\_t 行空间的正交投影</strong>。大 s 时信号方向落在投影子空间里 → <strong>信号被保住</strong>；噪声近似各向同性、且各轮 X\_t 独立所以零空间互不相干 → <strong>反复投影把所有方向的噪声逐步剪掉</strong> ⇒ 一种<strong>隐式特征选择</strong>（保留持续的高方差方向，消灭临时随机朝向的成分）
- <strong>与 ridge 的本质差异</strong>：ridge 是<strong>全局收缩</strong>（一个 λ 缩所有方向），自训练是<strong>方向自适应、随迭代变化的滤波器</strong>。因此<strong>当信号很强（大 s）时，自训练能超过最优调参的 ridge</strong>（Figure 3b）——这解释了"为什么自蒸馏有时比加正则更好"
- <strong>可用的工具 iGCV</strong>：不需要真信号、<strong>不需要验证集</strong>，只依赖初始数据的残差 + 累积投影；<strong>Theorem 4.3 证明它一致</strong>（sup over λ 依概率收敛），而且<em>贴着</em>真实风险曲线走、能指出 U 型的最优点
- <strong>真实验证据</strong>：ResNet-50 + CIFAR-10。中等噪声（η=0.4）出现<strong>清晰 U 型：47.7% → 43.6%（t=2）→ 45.0%</strong>；高噪声（η=0.8）<strong>单调下降</strong>（去噪收益压过遗忘）；且<strong>所有样本量下都观察到 Weak-to-Strong 泛化</strong>
- <strong>算力</strong>：理论论文，实验只有合成仿真 + 附录里的 CIFAR-10/ResNet-50（K=4 轮），<strong>没有 LLM 实验</strong>——这是它最大的限度
- <strong>主题轮换</strong>：今日<strong>OPD</strong>（按序列从具身智能（9/21 ThinkAct）切回主线；上次 OPD 是 9/14 TMS）

## 文献信息

| 字段 | 内容 |
|-|-|
| 标题 | <strong>ICML 版</strong>：Why <strong>Self-Distillation</strong> Helps and Hurts: Denoising vs. Signal Forgetting<br><strong>arXiv 版</strong>：Why <strong>Self-Training</strong> Helps and Hurts: Denoising vs. Signal Forgetting（同一工作的两个标题） |
| 作者 | Mingqi Wu（吴明奇）、Archer Y. Yang、Qiang Sun（孙强） |
| 机构 | <strong>McGill University</strong> + <strong>Mila</strong>（Wu / Yang）· <strong>University of Toronto</strong> + <strong>MBZUAI</strong>（Sun） |
| 发布时间 | 2026-02-15（v1，29 页；正文 8 页） |
| 会议 | <strong>ICML 2026 Poster</strong>（<strong>四源一手确认</strong>：① ICML 官方 virtual 全量数据 icml-2026-orals-posters.json 命中，count=6797 完整解析，eventtype=Poster，session="Poster Session 1"，paper\_url=OpenReview forum VnA5q5jXVz ② <strong>Mila 官方新闻页</strong>《Plus de 80 articles affiliés à Mila à ICML 2026》把它列在<strong>主会（Conférence principale）</strong>名单里 ③ 作者 Qiang Sun 个人主页 2026-04 条目"…accepted to ICML 2026. Congratulations to Mingqi…" ④ OpenReview 作者主页标注 "ICML 2026 regular"；<strong>阳性对照</strong>=同一份官方列表命中 lib 已读的 EOPD(#22) 与 MIRL(#37)，均为 Poster。注：arXiv abs 页 Comments 字段只写 "8 pages main, 29 pages in total"，<strong>无录用标注</strong>） |
| 链接 | <a href="https://arxiv.org/abs/2602.14029">arXiv:2602.14029</a> · OpenReview forum <a href="https://openreview.net/forum?id=VnA5q5jXVz">VnA5q5jXVz</a> |
| 性质 | <strong>统计学习理论论文</strong>（高维渐近 / 确定性等价），无独立 Limitations 章节（有 Impact Statement） |
| 分析对象 | 过参数化线性回归下的<strong>迭代自训练</strong>：p, n → ∞，ρ := p/n &gt; 1 固定，有效正则 τ := ρ − 1 &gt; 0 |
| 实验 | 合成仿真（幂律协方差 Σ\_ii = 1/i，n=500，迭代 1..50，10 次试验，测试集 n\_test=10,000）+ 附录 A 的 <strong>ResNet-50 / CIFAR-10</strong>（K=4 轮，n=5000/7500/10000，噪声比 0.4/0.6/0.8） |
| 算力 | 论文未报告（合成仿真 + 单个 ResNet-50 / CIFAR-10 训练，属小规模实验） |

## 一、先看例子（大白话：抄自己的笔记，会把错字改掉，也会把细节磨掉）

> 💡 <strong>铺垫</strong>：自训练／自蒸馏的过程是这样的——
>
> ① 先在有噪声的数据上训一个模型（第 0 轮）
>
> ② 让这个模型去看<strong>一批新数据</strong>，给它们打<strong>自己的标签</strong>（伪标签）
>
> ③ 拿这些伪标签训一个新模型（第 1 轮）
>
> ④ 重复。
>
> <strong>关键：伪标签里没有"标签噪声"</strong>——噪声只存在于最初那批真实标签里。所以每一轮都在做一次"干净的转移"。

> <strong>把它想成"抄自己的笔记"：</strong>
>
> <strong>① 去噪（越抄越干净）</strong>：你第一遍抄的时候手抖写错了几个字。第二遍你是<strong>照着自己写的（已经擦掉错字的那版）</strong>抄——<strong>错字不会遗传下去</strong>。所以随机噪声每轮都在减少，而且是<strong>指数级</strong>的。
>
> <strong>② 信号遗忘（越抄越少）</strong>：但你每一轮抄的<strong>只是"你上一轮写下来的东西"</strong>。原始材料里那些<strong>你没抄到的细节，就永久丢了</strong>——因为它不在你的笔记里，也不在新数据里。
>
> <strong>③ 于是出现 U 型</strong>：
>
> 　<strong>前期</strong>：错字被快速清掉（去噪快），丢的细节还很少 → <strong>净赚，成绩涨</strong>
>
> 　<strong>后期</strong>：错字已经清干净了（去噪收益见顶），但细节还在持续丢 → <strong>净亏，成绩跌</strong>
>
> <strong>④ 所以存在一个最佳抄写轮数</strong> —— 而这篇论文不但证明了这一点，还给出了<strong>怎么算出这个轮数</strong>（不需要验证集）。

![▲ 论文 Figure 1（spiked 协方差模型，s=25）：(a) 迭代在过参数化区间大幅降低泛化误差（把双下降的尖峰压平）；(b) 误差 vs 迭代轮数——清晰可见 U 型，前期去噪、后期信号遗忘，与理论预测严丝合缝](/images/paper-reading/2026-09-22-self-distillation/2026-09-22-d43-1.webp)

## 二、动机：同一个递归，既是利器也是灾难

- <strong>一边是成功史</strong>：自训练在半监督学习里战绩辉煌（Scudder 1965 到 Noisy Student 2020），靠大量无标签数据刷 SOTA
- <strong>另一边是灾难</strong>：同一个递归会<strong>catastrophically 失败</strong>——著名的 <strong>model collapse</strong>：在自生成输出上反复训练会渐进崩坏，甚至遗忘原始数据分布（Shumailov 2023、Dohmatob 2024）
- <strong>实践中的缓解办法目前是"经验性的</strong>"：往每轮里掺真实数据（Gerstgrasser 2024）——<strong>但没有人说清"掺多少、迭代几轮"才是对的</strong>
- <strong>所以核心问题</strong>：<strong>什么时候迭代有助于泛化，什么时候有害？</strong>
- <strong>有用的直觉</strong>：每一步自训练都是一次<strong>有损的师生转移</strong>——学生只学到老师的预测，<strong>每轮必然丢信息</strong>；丢掉的成分里<strong>有些是噪声（该丢），有些是信号（不该丢）</strong>
- <strong>论文的定位</strong>：在一个可解析的设定（过参数化线性回归）里把这件事<strong>彻底算清</strong>——<strong>不是提出新方法，而是给出机制、最优停止点、和一个有证明的停止准则</strong>

## 三、方法

### 3.1 设定：Algorithm 1（迭代自训练）

- <strong>初始化</strong>：在有噪声的真实数据 D₀ = {X₀, Y₀} 上拟合 β̂₀（ridge 或 ridgeless）
- <strong>每一轮 t</strong>：<strong>新抽一批特征 X\_t</strong> → 令伪标签 <strong>Y\_t = X\_t β̂\_{t−1}</strong>（<strong>无噪声！</strong>）→ 在 (X\_t, Y\_t) 上拟合 β̂\_t
- <strong>师生视角</strong>：β̂\_{t−1} 是<strong>教师</strong>，β̂\_t 是<strong>学生</strong>；所以 Algorithm 1 = 自蒸馏
- <strong>高维渐近</strong>：p, n → ∞ 且 ρ := p/n &gt; 1 固定；有效正则 <strong>τ := ρ − 1 &gt; 0</strong>
- <strong>Assumption 3.1（单 spike 协方差模型）</strong>：Σ = (s−1)u₁u₁ᵀ + I\_p（<strong>spike 强度 s &gt; 1</strong>）；信号与 spike 对齐：β = r·u₁，r² = ‖β‖²

### 3.2 核心结果：风险分解（Theorem 3.2）

确定性极限风险 <strong>R\*\_t = B\*\_t + V\*\_t</strong>，两项分别对应两股相反的力：

| 成分 | 公式 | 含义 |
|-|-|-|
| <strong>系统误差 B\*\_t</strong><br>（信号遗忘） | B\*\_t = r²s · \[ 1 − ( s/(s+τ) )^(t+1) \]² | <strong>随 t 单调上升</strong>。它追踪"估计量在真实信号方向 u₁ 上投影的确定性衰减"；<strong>t → ∞ 时收敛到 r²s = 零模型（β̂=0）的风险</strong> ⇒ <strong>迭代过头会把初始数据里学到的信号彻底抹掉</strong> |
| <strong>随机误差 V\*\_t</strong><br>（去噪） | V\*\_t = V\*\_{t−1}/(1+τ) + τ r² s^(2t+1)/(s+τ)^(2t+2)<br>V\*\_0 = σ²/τ + τs/(s+τ)²·r² | <strong>随 t 单调下降</strong>。来自 ① 初始噪声 ② 每轮重新抽 X\_t 带来的新估计误差（学生把老师的预测投影到随机低秩子空间上，会注入新的估计误差） |

- <strong>Corollary 3.3（去噪确实有效）</strong>：<strong>V\*\_t → 0（t → ∞）</strong> —— 随机误差渐近消失
- <strong>一句话总账</strong>：<strong>每一轮都在"用增加系统误差的代价换取减少随机误差"</strong>

![▲ 论文 Figure 2：两股相反的力。(a) 系统误差 B*_t 随迭代上升（信号遗忘）；(b) 随机误差 V*_t 随迭代下降（去噪）。不同曲线对应不同宽高比 ρ](/images/paper-reading/2026-09-22-self-distillation/2026-09-22-d43-2.webp)

### 3.3 为什么是 U 型：速率不匹配

- <strong>无信号极限（r² = 0）</strong>：B\*\_t = 0，只剩纯去噪 V\*\_t = σ²/τ·(1+τ)^(−t)
- <strong>各向同性极限（s = 1）</strong>：B\*\_t 与 V\*\_t <strong>以相同速率收缩</strong> → 风险 R\*\_t 随 t <strong>单调</strong>（Figure 3a 的 s=1 那条平线）
- <strong>所以关键在于</strong>：<strong>U 型严格来自各向异性（s &gt; 1）</strong>，它制造了<strong>速率不匹配</strong>——
- <strong>噪声</strong>按 (1+τ)^(−t) <strong>快速指数衰减</strong>
- <strong>信号遗忘</strong>慢得多，因为收缩因子 <strong>s/(s+τ) 非常接近 1</strong>（s ≫ τ 时几乎不缩）。一阶展开给出 B\*\_t ≈ r²(t+1)²τ²/s → <strong>s 越大，遗忘越慢</strong>
- ⇒ <strong>中间存在一个"去噪占上风"的窗口</strong>，过了这个窗口信号遗忘反超 → <strong>U 型 + 最优早停</strong>

### 3.4 机制：反复随机投影 = 隐式特征选择

把 ridgeless 更新重写一下，机制就暴露了：

<strong>β̂\_t = (X\_tᵀX\_t)⁺X\_tᵀY\_t = (X\_tᵀX\_t)⁺X\_tᵀX\_t·β̂\_{t−1} =: P\_t β̂\_{t−1}</strong>

- <strong>P\_t 是到 X\_t 行空间（前 n\_t 个右奇异向量张成的空间）的正交投影</strong>
- <strong>只有过参数化 (p &gt; n\_t) 时才有非平凡动态</strong>：p ≤ n\_t 时 X\_tᵀX\_t 可逆、P\_t = I，<strong>迭代什么都不改变</strong>
- <strong>信号为什么被保住</strong>：s 大时，X\_t 的主奇异方向<strong>与 u₁ 对齐</strong> → P\_t u₁ ≈ u₁ → 信号基本落在投影子空间内，<strong>逐轮保留</strong>
- <strong>噪声为什么被削掉</strong>：噪声近似<strong>各向同性</strong>；每一步 P\_t 把落进它 <strong>(p − n\_t) 维零空间</strong>的噪声成分<strong>直接消灭</strong>；而各轮 X\_t 相互独立 ⇒ 零空间<strong>互不相干</strong> ⇒ <strong>反复投影把所有方向的噪声逐步剪掉</strong>
- <strong>二者合起来 = 隐式特征选择</strong>：<strong>保留"持续的、高方差的"方向，消灭"临时的、随机朝向的"成分</strong>
- <strong>这条机制同时解释了 weak-to-strong 泛化</strong>（Burns et al. 2024）：学生在老师给的标签上训练，可以<strong>一边去噪、一边保住老师可靠的信号方向</strong>

### 3.5 与 ridge 的本质差异（以及性能交叉）

- <strong>ridge</strong>：<strong>全局收缩</strong>——一个 λ 按经验特征值把<strong>所有方向</strong>一起缩
- <strong>自训练</strong>：<strong>方向自适应 + 随迭代变化</strong>的滤波器。定义 Q\_t := (Σ\_t + τ\_t I)⁻¹Σ\_t，累积 <strong>Q\_{t:0} = Q\_t … Q\_0</strong>，它实现的是"<strong>依赖迭代次数、数据自适应的低通滤波</strong>"（在协方差特征基下）。强 spike 方向上几乎不缩，各向同性子空间每轮按 ≈(1+τ)⁻¹ 收缩
- <strong>性能交叉（Figure 3b）</strong>：<strong>s 越大，迭代自训练越能超过"最优调参的 ridge"</strong> —— 因为自训练能在"不去缩信号"的前提下把噪声反复压掉，而全局正则方法仍要为噪声付信号收缩的代价
- <strong>多 spike 推广（Theorem 3.6）</strong>：不同特征方向被<strong>以不同速率过滤</strong>，强方向活得久、弱方向先被滤掉

![▲ 论文 Figure 3：(a) 不同 spike 强度 s 下的风险演化——s=1（各向同性）单调，s>1 出现 U 型，且 s 越大早期降得越低；(b) 性能交叉——随着信号变强，迭代自训练的最小误差反超最优调参的 ridge](/images/paper-reading/2026-09-22-self-distillation/2026-09-22-d43-3.webp)

### 3.6 实用工具：iterated GCV（iGCV）——不需要验证集的早停

- <strong>实际问题</strong>：<strong>既拿不到真信号、又不想留验证集</strong>，怎么同时选"停止时刻 t"和"正则强度 λ"？
- <strong>做法</strong>：定义杠杆相关的乘子 M\_t(λ)（含 tr(X₀A\_t(X₀ᵀX₀/n₀+λI)⁻¹X₀ᵀ)/n₀ 的修正项），iGCV 就是"<strong>修正后的初始数据残差</strong>"的均方：<strong>iGCV(t)(λ) = (1/n₀) Σᵢ \[ (yᵢ − xᵢᵀA\_tβ̂₀) + (yᵢ − xᵢᵀβ̂₀)·M\_t(λ) \]²</strong>，其中 A\_t = P\_t…P₁ 是累积投影
- <strong>Theorem 4.3（一致性与亮点）</strong>：iGCV <strong>一致</strong>地估计轨迹上的真实风险——对任意紧区间 λ∈I，<strong>sup\_λ |iGCV(t)(λ) − R(β̂\_t) − σ²| → 0（几乎必然）</strong>
- <strong>计算上很省</strong>：<strong>只依赖初始数据 D₀ 与累积投影 A\_t</strong>，不需要对每一轮重算全部数据
- <strong>Theorem 4.2（前置保证）</strong>：经验风险以概率 ≥ 1 − Cp·exp(−pε⁴/C) <strong>集中</strong>在确定性等价 R\*\_t 附近（有效噪声同理）⇒ <strong>可以把 R\*\_t 当成经验风险曲线的可靠代理</strong>

![▲ 论文 Figure 4：iGCV 的验证——实线是 iGCV 估计、marker 是经验测试风险。(a) 在不同宽高比下都紧贴真实风险；(b) 准确捕捉 U 型轨迹并指出最优早停点](/images/paper-reading/2026-09-22-self-distillation/2026-09-22-d43-4.webp)

## 四、实验

### 4.1 合成仿真：理论预测与仿真严丝合缝

- <strong>设定</strong>：x \~ N(0, Σ)，噪声 ε \~ N(0,1)；特征协方差用<strong>幂律衰减</strong> Σ\_ii = 1/i；信号 β <strong>稀疏</strong>，只在前 10 维为 1
- <strong>流程</strong>：① 在 n=500 个有噪样本上拟合 ridgeless β̂₀；② 第 t = 1..50 轮，每轮抽<strong>新特征</strong> X\_t（n=500）、生成伪标签 Y\_t = X\_t β̂\_{t−1}、用 OLS 拟合；③ 在独立的<strong>无噪测试集（n\_test = 10,000）</strong>上算 MSE；④ 10 次独立试验平均
- <strong>Figure 5a</strong>：<strong>迭代起到"隐式正则"的作用</strong>——把 <strong>double descent 的尖峰压平</strong>、在过参数化区间 (ρ &gt; 1) 降低误差（这与"ridge 用显式 λ 惩罚"形成对照）
- <strong>Figure 5b</strong>：即使在<strong>一般特征相关结构</strong>下，<strong>U 型轨迹依然存在</strong> → 去噪–遗忘的权衡不是单 spike 假设的产物

![▲ 论文 Figure 5：一般协方差仿真（Σ_ii = 1/i）。(a) 测试误差 vs 宽高比 ρ——迭代降低误差地板、抑制双下降尖峰；(b) 测试误差 vs 迭代轮数——U 型曲线表明去噪–遗忘权衡在一般特征相关下依然成立](/images/paper-reading/2026-09-22-self-distillation/2026-09-22-d43-5.webp)

### 4.2 真实验：ResNet-50 + CIFAR-10（附录 A）

- <strong>为什么做</strong>：作者<strong> conjecture</strong> 去噪–遗忘的动力学是<strong>普适现象</strong>，想验证它能超越线性假设
- <strong>怎么模拟"p/n &gt; 1 + 控制噪声"</strong>：把训练数据切<strong>互不重叠的子集</strong>，模拟有限样本、过参数化；并<strong>注入对称标签噪声</strong>（污染比例 η），造出一个"弱教师"
- <strong>迭代协议</strong>：t=0 的教师在有噪子集（大小 n）上训；之后每一轮<strong>当前模型给一批新子集打伪标签</strong>，<strong>新学生从零重训</strong>（不是微调！）；固定 K=4；报告干净 CIFAR-10 测试集上的错误率
- <strong>结果一（Figure 6a，噪声水平，n=10,000）</strong>： 
  - <strong>η = 0.4（中等噪声）→ 清晰 U 型：47.7% → 43.6%（t=2）→ 45.0%</strong> —— 先是去噪（V\*\_t↓），后是信号遗忘累积（B\*\_t↑）
  - <strong>η = 0.8（高噪声）→ 单调下降</strong>：初始模型极弱、随机误差占主导，<strong>早期去噪收益远大于遗忘代价</strong>（与速率不匹配分析一致）
- <strong>结果二（Figure 6b，样本量，η=0.6）</strong>： 
  - <strong>所有样本量下都观察到 Weak-to-Strong Generalization</strong>——迭代过程确实能从"有噪教师"里蒸馏出更好的模型
  - <strong>n 越大，下降越陡</strong>（n=10⁴ 最快）：理论解释是更大的 n 提升<strong>信号与噪声的谱分离度</strong>，让隐式投影更容易保住真信号、滤掉噪声
- <strong>论文的结论</strong>：随机去噪与系统遗忘之间的竞争，是<strong>"高维迭代学习的结构性属性，超越了线性情形"</strong>

![▲ 论文 Figure 6：CIFAR-10 + ResNet-50 的真实动力学。(a) 不同初始标签噪声 σ/η——中等噪声（0.4）出现 U 型，高噪声（0.8）转为单调下降的去噪期；(b) 不同训练集大小 n——所有规模都出现 Weak-to-Strong 泛化，且 n 越大下降越陡](/images/paper-reading/2026-09-22-self-distillation/2026-09-22-d43-6.webp)

## 五、Limitations &amp; 批判性思考

<strong>论文自述（写在 Conclusions and Discussion 里，全文没有独立 Limitations 章节）</strong>：

1. <strong>需要推广到"复用数据"与"过滤伪标签"</strong>（extensions to reused data and filtered pseudo-labels are necessary）——即承认当前 <strong>fresh covariates</strong> 假设与现实的差距，也要把实践中调平衡的经验性启发式形式化
2. <strong>必须研究非线性模型</strong>——才能判定"表征演化"到底是稳定了信号，还是加剧了漂移
3. <strong>与 ridge 的定理级比较留给未来工作</strong>——需要给出"作为 s 函数的 ridge 渐近调参规则"
4. 这些更丰富设定下"确定性等价"是否仍然存在，<strong>被明确称为 fundamental open problem</strong>

<strong>我的阅读（8 条）</strong>：

1. <strong>最重要的一条：完全没有 LLM 实验。</strong> 理论在过参数化线性回归上，真实验只有 ResNet-50/CIFAR-10（K=4 轮，放附录）。<strong>"对 OPD 的指导"只能靠类比，属于 conjecture 而非本文证据</strong>
2. <strong>伪标签严格无噪声</strong>（Y\_t = X\_t β̂\_{t−1} 是确定性的）→ 真实自蒸馏里学生/教师都有采样随机性，还有温度、top-p 等，模型偏理想
3. <strong>每轮用"全新独立特征"X\_t</strong> → 现实中 LLM 自训练通常<strong>复用同一批固定 prompt</strong>，这个假设与 LLM 场景明显不符（作者自己也把它列为待推广项）
4. <strong>U 型不是普适的</strong>：只在各向异性 (s&gt;1) 时出现；CIFAR 上也只是 η=0.4 才有 U 型、η=0.8 变单调 → <strong>现象强依赖"噪声/信号比"与"谱结构"</strong>
5. <strong>iGCV 对深度模型不直接可用</strong>：它需要"初始数据残差 + 累积投影 A\_t"，而 A\_t 的显式形式来自线性投影算子的乘积；非线性网络里这个概念要重新定义
6. <strong>没有分析"混合真实数据"</strong>（Gerstgrasser 2024 防 model collapse 的主流做法）在本文框架里的位置——而这恰是实践中最常用的缓解手段
7. <strong>CIFAR-10 实验细节偏少</strong>：K 固定为 4、无多种子误差棒、也没给学习率/训练轮数等完整配置
8. <strong>没有与 OPD 方法正面对撞</strong>：论文分析的是抽象的自训练/自蒸馏，没去比 RKL / FKL / 前向反向混合这些 <strong>LLM 领域实际在用的目标</strong> ⇒ 它是"地基"不是"方法"

## 六、与前文对照

| 编号 | 论文 | 核心机制 | 与本篇的关系 |
|-|-|-|-|
| 36 | <strong>TMS</strong>（9/14） | SFT 会遗忘、RL 不忘；把监督换成<strong>跨时间混合 10 个历史 checkpoint 的轨迹</strong> | <strong>最直接、也是最有价值的一组对照（本篇给了 TMS 的理论解释）</strong>：TMS 实测 <strong>Self-SFT（蒸自己初始）ARC-C 51.8 / Final-SFT（蒸收敛快照）45.2，都远低于 TMS 79.2</strong> —— <strong>朴素自蒸馏就是失败</strong>。本篇解释<strong>为什么</strong>：单个时刻的教师 = <strong>单个投影算子</strong>，反复迭代会累积信号遗忘、撞上 U 型的后半段；而 <strong>TMS 的"跨 10 个 checkpoint 混合"相当于引入多个不同投影 → 对冲遗忘</strong>。另外 TMS 的 <strong>PLD/验证 NLL 抬头</strong>是经验性早停信号，本篇的 <strong>iGCV 是有证明的早停准则</strong> —— 同一问题的两解 |
| 30 | <strong>RL-Cap</strong>（NeurIPS 2025 Oral） | RLVR 只做概率重排、不扩能力边界；<strong>蒸馏才扩界</strong> | <strong>本篇细化了 RL-Cap 的结论</strong>：RL-Cap 说"蒸馏能扩界"，本篇说<strong>"自蒸馏"这条子路线也不扩界</strong>——它的增益来自 <strong>去噪（=采样效率）</strong>，而<strong>过度迭代反而是"信号遗忘"、把 base 学到的东西擦掉</strong> ⇒ 与 RL-Cap 的"coverage 随训练收窄"<strong>同向</strong>。两篇合起来：<strong>只有"外部新信号"才扩界，任何"自己教自己"都封顶</strong> |
| 19 | <strong>OPSD</strong>（Self-Distilled Reasoner） | 单模型自蒸馏，靠<strong>特权信息</strong>（真答案轨迹）分裂师生 | <strong>本篇指出 OPSD 的增益来源应该被重新归因</strong>：自蒸馏循环<strong>自带天花板</strong>（信号遗忘），所以 OPSD 的收益应当主要来自"<strong>特权信息带来的新信号</strong>"，而不是"自蒸馏"这件事本身 —— 这是一个可以设计实验去分离的问题 |
| 22/21/24/23/20 | <strong>EOPD / GNDPO / HPD / REOLD / VGS</strong> | 全都在<strong>改 token 权重</strong>（教师熵门控 / z-score 归一化 / 前反向 KL 混合 / 奖励裁剪 / 视觉子空间投影） | <strong>本篇提供了一个完全正交的新轴</strong>：lib 里这 5 篇都在调"<strong>每个 token 学多少</strong>"，本篇讲的是"<strong>迭代多少轮、什么时候停</strong>" —— <strong>前者是横向加权、后者是纵向截断</strong>，两者可以叠加 |
| 38 | <strong>RAGEN-2</strong>（ICML 2026 Oral） | 用<strong>互信息</strong>实测"模板崩塌"，熵看不出来 | <strong>本篇的 B\*\_t（信号遗忘）是同一现象的解析版本</strong>：RAGEN-2 从<strong>信息论</strong>侧测到"输出越来越不依赖输入"，本篇从<strong>风险分解</strong>侧证明"估计量在真信号方向上的投影被迭代逐步抹掉"——一个实证度量、一个理论刻画 |
| <strong>42</strong> | <strong>本篇</strong> | <strong>迭代自训练的高维渐近分析：去噪 vs 信号遗忘 → U 型 + iGCV 早停</strong> | <strong>ICML 2026，McGill + Mila + U Toronto：lib 里第一篇 OPD 理论论文；ResNet-50/CIFAR-10 上验证 U 型（47.7%→43.6%→45.0%）与 weak-to-strong；证明自训练在强信号下可超越最优 ridge</strong> |

> 🔗 <strong>本篇在 lib 里的定位：第一块"地基"</strong>
>
> lib 的 OPD 主线（24+ 篇）<strong>清一色是方法或实证</strong>——调损失、调权重、调采样、调门控。<strong>本篇是第一篇给出"闭式风险递推 + 最优停止点 + 一致性保证"的理论工作</strong>。
>
> 它最有意思的地方是：<strong>它用数学解释了 lib 内部一个已经存在的负面结果</strong>——TMS 里"Self-SFT 51.8 / Final-SFT 45.2 都远低于 TMS 79.2"那个失败，正是本文 U 型曲线后半段的实证。
>
> <strong>一句话串起来</strong>：lib 里那些方法都在回答"<strong>学谁、学多少</strong>"，本篇回答的是"<strong>学几轮、什么时候停</strong>"。

## 七、启发与待跟进

> 💡 <strong>核心启发</strong>：
>
> 1\. <strong>自蒸馏/自训练必须早停——而且这不是玄学</strong>：存在闭式的 U 型风险曲线与最优停止点；<strong>更要紧的是它只在各向异性 (s&gt;1) 时出现</strong>，各向同性时是单调的、不用怕
>
> 2\. <strong>风险集中在"弱信号"上</strong>：遗忘因子 s/(s+τ) 在 s 大时≈1（几乎不遗忘），<strong>s 小（弱信号/难样本）时遗忘快</strong> ⇒ 实用推论：<strong>自蒸馏时最该保护的是弱信号样本</strong>。这个直觉与 lib 里 <strong>REOLD 的"学生熵 top β 分位才放梯度"</strong>、<strong>EOPD 的"教师熵门控"</strong> 是<u>同一种保护直觉的另一种证据</u>
>
> 3\. <strong>"多时刻教师混合"（TMS）在本文框架里有了理论依据</strong>：单个时刻的教师 = 单个投影算子，反复迭代必然累积遗忘；换/混多个时刻相当于改变有效投影序列
>
> 4\. <strong>"自蒸馏有时比加正则更好"有了定量解释</strong>：自训练做的是<strong>方向自适应滤波</strong>（强方向不缩、噪声方向反复压），ridge 是全局收缩；<strong>信号越强，自训练越可能反超最优 ridge</strong>（Figure 3b）
>
> 5\. <strong>iGCV 是一个可以立刻借鉴的工程件</strong>：<strong>不需要验证集</strong>就能选停止点与正则强度，而且有证明。它是 TMS 的 PLD 抬头信号"更硬的版本"

<strong>待跟进 checklist</strong>

- [ ] <strong>把 iGCV 搬成 OPD 的"零验证集早停"</strong>（最想做的一个）：只需要初始数据残差 + 累积投影的类比量。先在一维可控实验里验证，再上真实 OPD 训练；与 TMS 的 PLD 抬头做正面对照
- [ ] <strong>验证"弱信号样本是遗忘重灾区"</strong>：按损失/熵/奖励方差给样本分强弱，分桶观察自蒸馏的"涨/跌"是否如预测集中在弱信号桶（这是本文最可操作的一条推论）
- [ ] <strong>用 OPD 复现 U 型曲线</strong>：在多轮自蒸馏（学生→伪标签→新学生）上扫迭代轮数，看是否出现 U 型、最优轮数与理论预测是否同向
- [ ] <strong>分离 OPSD 的增益来源</strong>：自蒸馏循环本身 vs 特权信息带来的新信号 —— 设计一个"无特权信息"的自蒸馏对照组即可
- [ ] <strong>对照读 arXiv:2608.11829</strong>《Towards Understanding On-Policy Distillation through the Lens of Test-Time Scaling》：它提出 OPD 是"<strong>illusory distillation</strong>"（主要提升采样效率而非扩能力边界，pass@K 优势随 K 增大让给 base），<strong>结论与本篇高度呼应</strong>（去噪 ≠ 新能力），值得作为下一篇理论/分析候选
- [ ] <strong>混合真实数据的位置</strong>：把 Gerstgrasser 式的"每轮掺真实数据"放进本文框架，看它是否等价于"降低有效遗忘率"——这能解释实践中为什么掺数据有效
- [ ] <strong>非线性推广</strong>：作者把"表征演化是稳定信号还是加剧漂移"列为 open problem，这是最有可能产生后续论文的缺口

## 八、今日阅读结论

这一篇是 <strong>lib 里第一篇 OPD 理论论文</strong>，来自 McGill + Mila + 多伦多/MBZUAI（Mingqi Wu、Archer Y. Yang、Qiang Sun），<strong>ICML 2026 Poster</strong>。它研究的是"用自己生成的标签再训一遍"这个递归——也就是自训练／自蒸馏——为什么<strong>先涨后跌</strong>。在过参数化线性回归的高维渐近下，它把风险精确分解成两股相反的力：<strong>系统误差 B\*\_t（信号遗忘）随迭代上升</strong>，t→∞ 时趋近"什么都不学"的风险；<strong>随机误差 V\*\_t（去噪）随迭代下降</strong>，渐近趋 0。因为<strong>噪声按 (1+τ)⁻ᵗ 指数快速衰减、而信号遗忘的收缩因子 s/(s+τ) 近乎 1（遗忘很慢）</strong>，两者速率不匹配 → 前期净赚、后期净亏 → <strong>U 型曲线与最优早停</strong>。机制上，ridgeless 更新等于"<strong>反复投影到各轮新特征的行空间</strong>"：信号方向因与主奇异方向对齐而被保住，噪声因各向同性且零空间互不相干而被逐步剪掉 —— 这就是一种<strong>隐式特征选择</strong>，也顺带解释了 weak-to-strong 泛化；与 ridge 的全局收缩相比，它做的是<strong>方向自适应滤波</strong>，因此在<strong>强信号下可以反超最优调参的 ridge</strong>。最后给出 <strong>iGCV</strong>——一个<strong>不需要验证集、可证明一致</strong>的停止准则。实证上：合成仿真与理论严丝合缝，并压平了 double descent 尖峰；<strong>ResNet-50 + CIFAR-10 上，中等噪声（η=0.4）出现清晰 U 型 47.7%→43.6%→45.0%，高噪声转为单调下降，各种样本量下都观察到 weak-to-strong</strong>。<strong>要打的最大折扣</strong>：<strong>完全没有 LLM 实验</strong>，"对 OPD 的指导"只能靠类比。但它对 lib 的价值很特别：<strong>它用数学解释了 lib 内部已经存在的那个负面结果</strong>——TMS 里"Self-SFT 51.8 / Final-SFT 45.2 都远低于 TMS 79.2"的失败，正是这条 U 型曲线后半段的实证；而 TMS 的"跨时间混合 10 个 checkpoint"在本篇框架下恰好是"<strong>用多个不同投影对冲信号遗忘</strong>"。

> 🔗 <strong>今日一句</strong>：把模型"用自己生成的标签再训一遍"重复做，会画出一条 <strong>U 型曲线</strong>：<strong>前几轮在去噪、后几轮在丢信号</strong>。这篇 ICML 2026 的<strong>理论论文</strong>把它算清了——系统误差（信号遗忘）随迭代上升、最终收敛到"什么都不学"；随机误差（去噪）随迭代下降、渐近趋 0；两者<strong>速率不匹配</strong>（噪声指数掉、信号忘得慢），所以前面净赚、后面净亏。机制是"<strong>反复投影到各轮新特征的行空间</strong>"：信号方向被保住、噪声方向被逐步剪掉，本质上是一种<strong>隐式特征选择</strong>；也正因如此，<strong>强信号下它能反超最优 ridge</strong>。论文还给了 <strong>iGCV</strong>——<strong>不需要验证集、有证明的早停准则</strong>。真实验（ResNet-50/CIFAR-10）上，中等噪声出现 <strong>47.7%→43.6%→45.0%</strong> 的 U 型。而它对你 lib 最妙的一点是：<strong>TMS 里"朴素自蒸馏失败"那个负面结果，正好是这条曲线后半段的实证</strong>。论文：arXiv:2602.14029（<strong>ICML 2026</strong>）· 笔记挂在 lib 中 · 2026-09-22
