---
title: '1127 RewardBudget：每道题只发 1 分奖励，答对的人越多每人分得越少：不靠拉熵也能推迟 RL 早熟'
description: 'GRPO 一类方法训一阵就进平台期，大家常归咎于「熵塌了」。这篇说光把熵拉高没用，问题出在每次更新把奖励差放大得太狠。办法很简单：每道题只发 1 分奖励，答对的…'
pubDate: '2026-11-27'
---

> 2026-11-27 · 每日读论文 #88 · 本周领域 <strong>RL / 后训练</strong>（本周第 5 篇）· <strong>每道题只发 1 分奖励：答对的人越多，每人分得越少</strong> · 阿里 Qwen 事业部 + 剑桥 · NeurIPS 2026 Poster

## TL;DR

<strong>一句话：GRPO 一类方法训一阵就进平台期，大家常归咎于「熵塌了」。这篇说光把熵拉高没用，问题出在每次更新把奖励差放大得太狠。办法很简单：每道题只发 1 分奖励，答对的几条回答平分，答错的固定扣 1/8。二元奖励下，这就等于 Dr.GRPO 的优势再除以本组答对的条数 k。难题（只对 1 条）照常狠推，简单题（对了 6、7 条）自动少推。</strong>

- <strong>改动在哪</strong>：只改优势估计。组内先减最低分得到差值 g\_i，再归一化成 R\_i = g\_i / Σg，最后减组内均值 A\_i = R\_i − 1/G；全对或全错的组跳过。不除标准差，熵也不管
- <strong>主结果（Table 2，Qwen3-8B，论文写的是 8 次采样平均）</strong>：GRPO 平均 59.87 → <strong>66.53</strong>（+6.66），AMC23 / AIME24 / AIME25 各 +10.00；DAPO 61.94 → 66.60（+4.66）；Dr.GRPO 60.10 → 63.31（+3.21）。Llama3.2-3B-Instruct（pass@8）6 个基线平均 +2.90～+5.80
- <strong>卖点</strong>：叠在 GRPO / Dr.GRPO / GSPO / DAPO / ClipCov / KLCov 六个方法上，12 组对比里平均分全涨；加了 RB 以后训练熵大多反而更低，作者据此说涨分不是靠保熵
- <strong>仓库</strong>：Qwen-Applications/RewardBudget（0 star，Apache-2.0），verl fork，adv\_estimator=reward\_budget 一个开关；有训练、评测、数据处理脚本。没有权重，没有论文里两个底座的配置，也没有 6 个基线加 RB 的组合脚本
- <strong>主要问题</strong>：① 最干净的对照（Dr.GRPO vs Dr.GRPO+RB，二元奖励下两者只差一个 1/k）涨得最少，+3.21，MATH500 还掉 0.20；「+10」都出在 GRPO 那一行，而那一行同时去掉了除以标准差；② 没有「整体缩小步长」的对照，分不清功劳是「按题分配」还是「更新整体变温和」；③ Table 2 的 Qwen3-8B 数字全落在「单次作答」的整数格点上，和「8 次平均」的说法对不上（我推的）；④ 单 seed、AIME 一题就是 3.33 分；⑤ 仓库评测温度、MATH500 判分方式、数据切分都和论文写的不一致

## 文献信息

| 字段 | 内容 |
|-|-|
| 标题 | Reward Budgeting Reduces Premature Convergence in Reinforcement Learning for LLM Reasoning（方法名 Reward Budgeting，简称 RB） |
| 作者（PDF / arXiv） | 4 人：Mengni Jia、Mengyu Zhou†（通讯，zhoumengyu.zmy@alibaba-inc.com）、Xiaoxi Jiang、Guanjun Jiang |
| 机构（PDF） | 1 阿里巴巴 Qwen Business Unit：Mengyu Zhou、Xiaoxi Jiang、Guanjun Jiang；2 剑桥大学：Mengni Jia |
| 作者（NeurIPS 注册） | 同样 4 人、顺序一致：Mengni Jia（University of Cambridge）、Mengyu Zhou（Alibaba）、xiaoxi jiang（Alibaba Group）、Guanjun Jiang（Alibaba Group）。和 PDF 一致 |
| 录用 | <strong>NeurIPS 2026 Poster</strong>。一手来源：① arXiv abs 页 Comments 字段逐字「Accepted to NeurIPS 2026」；② NeurIPS 官方全量表 neurips-2026-orals-posters.json（9278 条）id 152882，decision 逐字「Accept (poster)」，eventtype「Poster」，session「Sydney Poster Session 5」，OpenReview PgTu2nTEh7；阳性对照：本周 11-24 读过的 AntiSD（149938）、11-19 的 MARS（153810）、11-13 的 StraTA（152317）同表均为「Accept (poster)」 |
| arXiv | 2611.05942（v1 2026-11-04，v3 2026-11-06），cs.LG，24 页（正文 11 页，其余是证明、实验细节、回归分析、局限） |
| 仓库 | <a href="https://github.com/Qwen-Applications/RewardBudget">github.com/Qwen-Applications/RewardBudget</a>，0 star，Apache-2.0，2026-05-27 建库，最后推送 2026-11-09（我拉的 HEAD f084a43）。整份 verl 0.7.0.dev fork，README 标题写 \[NeurIPS2026\] |
| 仓库里有 | verl/trainer/ppo/core\_algos.py 的 compute\_reward\_budget\_outcome\_advantage（约 60 行）；recipe/RewardBudget/scripts/train/run\_reward\_budget.sh（1 节点 8 卡，batch 32，N=8，回复 8192，lr 1e-6，KL 关，seq-mean-token-mean，10 epoch）；scripts/evaluate/run\_eval.sh + evaluation.py（pass@1 / pass@k，带 OpenAI 兼容接口的 LLM 评委）；DAPO-Math-17k 和 AMC23 / AIME24 / AIME25 / MATH500 / OlympiadBench 的数据处理脚本；boxed 精确匹配奖励 reward.py |
| 仓库里没有 | 任何权重；论文用的 Qwen3-8B、Llama3.2-3B-Instruct 配置（脚本默认 Qwen2.5-7B-Instruct，论文里没这个模型）；6 个基线加 RB 的组合脚本（只有「无 KL + RB」一种）；算力说明。κ\_eff 统计代码放在 recipe/flowrl/flowrl\_actor.py 里；仓库还夹带一个和本文无关的 PowerS 目录（哈佛的 Reasoning with Sampling 代码） |
| 底座与超参 | Qwen3-8B、Llama3.2-3B-Instruct。训练数据 DAPO-Math-17K 过滤（答案为整数、题目 ≤1024 token、回答 ≤8192 token）后取 10k 训练 / 1k 验证。每题 8 条采样、温度 1.0，32 题一次更新（全在策略），AdamW wd 0.1，lr 1e-6 常数无 warmup；GRPO 保留 KL 0.001，其它基线沿用各自的 KL 设置。每 5 步用贪心解码测一次验证集，训到验证集平台为止。评测 8 次采样、温度 0.7、上限 8192；AMC/AIME 精确匹配，MATH500 和 OlympiadBench 用 Qwen3-235B-Instruct 当评委。框架 verl。论文只说「各方法硬件相同」，没写卡数和时长 |

## 一、先看例子（大白话：奖励按题发，不按人头发）

一道题采 8 条回答，答对得 1 分、答错 0 分。下面的数字直接按公式算，和论文 Table 1 一致。

- <strong>难题，只对了 1 条（k=1）</strong>：Dr.GRPO 给对的 +0.88、错的 −0.13；RB 也是 +0.88 / −0.13，<strong>两者完全一样</strong>。GRPO 再除以标准差，变成 +2.65 / −0.38
- <strong>中等题，对了 4 条（k=4）</strong>：Dr.GRPO +0.50 / −0.50；RB 把 1 分分给 4 个人，每人 0.25，减去均值 0.125，变成 +0.13 / −0.13，<strong>只有 Dr.GRPO 的四分之一</strong>
- <strong>简单题，对了 7 条（k=7）</strong>：Dr.GRPO +0.13 / −0.88；RB +0.02 / −0.13；GRPO 则给唯一那条错的 −2.65。GRPO 在「几乎全对」的题上推得最狠，RB 在这种题上几乎不推
- <strong>一条规律</strong>：二元奖励下，RB 的优势正好等于 Dr.GRPO 的优势除以 k（对的 (1 − k/8)/k = 1/k − 1/8，错的 −(k/8)/k = −1/8）。错的永远扣 1/8，对的分到的越来越少。论文没直接这么说，但 Table 1 每一行都对得上

![论文 Table 1：G=8 时不同答对条数 k 下，RB、Dr.GRPO、GRPO 给对 / 错回答的优势和对应的锐化系数 κ（β=0.001）。RB 的 κ=1/(βk)，随 k 变大而变小](/images/paper-reading/2026-11-27-rewardbudget/2026-11-27-d89-1.webp)

看表最后一列：GRPO 的 κ 在 k=1 和 k=7 两头最大（3024），中间最小；Dr.GRPO 恒为 1000；RB 从 1000 一路降到 143。作者想要的就是 RB 这种「题越容易，推得越轻」。

## 二、动机

- <strong>现象</strong>：RL 训数学推理，前期涨得快，然后进入平台期。常见解释是「熵塌了」，于是出现了一大批保熵、控熵的方法（ClipCov、KLCov、熵正则等）
- <strong>作者的反问</strong>：熵是原因，还是只是一个伴随的指标？他们在 Qwen3-8B 上做了一个干预实验：前 500 步分别「loss 里加 0.01×熵」「奖励里加 0.01×熵」，之后都切回普通 GRPO 再训 500 步。熵确实被拉高了，但切回之后两条曲线都只是回到 GRPO 的水平，没有更高的平台（Figure 2）
- <strong>平均曲线会骗人</strong>：「熵降、准确率停」这张经典图通常是很多次运行平均出来的（他们自己 12 次 Llama 运行，引用的工作 11 次）。单看每次运行，熵的走势差别很大，平均把这些差别抹平了
- <strong>换个角度</strong>：带 KL 的 RL 目标的最优解是 π\* ∝ π\_ref·exp(R/β)，好坏两个回答的概率比被放大 exp((r⁺ − r⁻)/β) 倍。作者把 κ = (r⁺ − r⁻)/β 叫锐化系数，认为问题在 κ 太大、更新太猛

![论文 Figure 2：熵干预实验（Qwen3-8B）。左：训练熵；右：验证集准确率。前 500 步各用各的设置，之后统一切回 GRPO。两个加熵版本在 500 步后追上 GRPO，但没有超过](/images/paper-reading/2026-11-27-rewardbudget/2026-11-27-d89-2.webp)

右图值得多看一眼：干预期间两个加熵版本的验证准确率远低于 GRPO（奖励里加熵那条在 0.40 附近，GRPO 已到 0.68）。所以这张图说明的是「这么加熵有害，撤掉后能恢复」，不太能说明「调好的保熵方法也没用」。

## 三、方法

### 3.1 锐化系数 κ 和 κ\_eff

- <strong>κ</strong>：理想目标里的放大系数。β=0.001、r⁺=1、r⁻=0 时 κ=1000，好坏回答的概率比被乘上 e^1000
- <strong>κ\_eff</strong>：实际算法有优势归一化、裁剪，不一定照着理想目标走。作者定义一次更新后「最高优势回答」和「最低优势回答」的序列对数概率变化之差为 κ\_eff，每道题取一对，按题平均，作为一次更新到底有多猛的诊断量
- <strong>不同优势构造的 κ</strong>：Dr.GRPO（A = r − r̄）κ=1/β；GRPO、GSPO、DAPO、ClipCov、KLCov（A = (r − r̄)/σ）κ=1/(βσ)，在 k=1 和 k=G−1 两头最大；RB κ=1/(βk)
- <strong>控制实验（Figure 3）</strong>：Dr.GRPO 下把 (r⁺ − r⁻, β) 设成 (5, 0.001)、(2, 0.001)、(1, 0.005)，κ = 5000、2000、200。κ 越大越早进平台，但 κ 小的最终准确率也更低。结论是不能简单把 κ 全局调小，要「该推的推、不该推的少推」

### 3.2 Reward Budgeting（Algorithm 1）

- 每道题采 G 条回答，奖励 r\_i
- 减去组内最低分：g\_i = r\_i − min\_j r\_j
- 全部 g\_i = 0（全对或全错）就跳过这道题
- 否则把 1 分按 g 比例分下去：R\_i = g\_i / Σ\_j g\_j，总和恰好是 1
- 减组内均值：A\_i = R\_i − (1/G)·Σ\_j R\_j = R\_i − 1/G，整条回答所有 token 用同一个 A\_i

代码实现和这五步一致（core\_algos.py 里 Σg ≤ 1e-6 时优势置 0），没有除标准差，也没有别的隐藏项。

### 3.3 理论解释

- <strong>二元奖励、独立在策略采样</strong>：附录 A.3 证明，不考虑裁剪时 RB 的期望更新恰好是 J = E\_p\[f\_{G−1}(p\_correct)\] 的梯度，f\_{G−1}(x) = Σ\_{m=1}^{G−1} (1 − (1 − x)^m)/m。这个函数在 0 附近近似线性，越往上越平，即「已经常常答对的题，再多答对一次收益递减」。G=8 时是精确的
- <strong>一般奖励</strong>：附录 A.5 给出 G 很大时的渐近解释，目标近似 E\_p\[log(E\[R|p\] − a(p))\]，a(p) 是奖励下确界。这只是渐近说法，不是有限 G 的精确目标
- <strong>局部替代</strong>：固定一组样本时，Σ R\_i·log π(o\_i) 等于把策略拟合到一个「按预算加权的经验分布」上，相当于每步最小化一个 KL

### 3.4 去掉参考模型 KL（4.2 节）

作者认为 π\* ∝ π\_ref·exp(A/β) 永远被 π\_ref 拴着，训多久都摆脱不了初始模型的影响，所以讨论了去掉 KL、只保留重要性比裁剪的版本。主表里 GRPO 仍保留 KL 0.001，去 KL 的效果单独放在 Table 3 消融里。

## 四、实验

### 4.1 主结果（Table 2）

![论文 Table 2：6 个 RL 方法加 RB 前后的成绩。上半 Qwen3-8B（论文写 8 次采样平均），下半 Llama3.2-3B-Instruct（pass@8）；+RB 行是相对各自基线的变化](/images/paper-reading/2026-11-27-rewardbudget/2026-11-27-d89-3.webp)

Qwen3-8B 部分，按「基线 → 加 RB」整理：

| 方法 | AMC23 | AIME24 | AIME25 | MATH500 | 平均 |
|-|-|-|-|-|-|
| GRPO | 82.50 → 92.50 | 26.67 → 36.67 | 43.33 → 53.33 | 95.60 → 96.80 | 59.87 → <strong>66.53</strong> |
| Dr.GRPO | 82.50 → 87.50 | 30.00 → 36.67 | 43.33 → 46.67 | 97.20 → 97.00 | 60.10 → 63.31 |
| GSPO | 90.00 → 95.00 | 26.67 → 33.33 | 36.67 → 43.33 | 96.80 → 97.80 | 59.44 → 63.65 |
| DAPO | 87.50 → 95.00 | 36.67 → 43.33 | 40.00 → 46.67 | 96.40 → 98.00 | 61.94 → 66.60 |
| ClipCov | 85.00 → 87.50 | 26.67 → 36.67 | 33.33 → 40.00 | 96.60 → 98.00 | 57.98 → 62.35 |
| KLCov | 82.50 → 87.50 | 33.33 → 43.33 | 43.33 → 50.00 | 96.80 → 97.60 | 61.11 → 66.03 |

- <strong>保熵方法不稳</strong>：Qwen3-8B 上 DAPO 61.94 反而高于它的两个保熵变体 ClipCov 57.98、KLCov 61.11；Llama 上 KLCov 25.12 略高于 DAPO 23.95，ClipCov 23.26 略低。RB 则 12 组平均分全涨
- <strong>Llama3.2-3B-Instruct（pass@8）</strong>：平均涨幅 GRPO +4.11、Dr.GRPO +5.80、GSPO +4.01、DAPO +2.90、ClipCov +4.77、KLCov +4.82。摘要里「AMC23 最高 +12.50」出在 Llama 的 GRPO（7.50 → 20.00）、Dr.GRPO、ClipCov 三格；AMC23 一题 2.5 分，+12.50 就是 5 道题
- <strong>Dr.GRPO 本身就在第一梯队</strong>：作者的解释是它的 κ 比除以 σ 的方法温和，这和 RB 的思路一致

### 4.2 消融：KL 和 RB（Table 3，Qwen3-8B GRPO）

| KL | RB | AMC23 | AIME24 | AIME25 | MATH500 | Olympiad | 平均 |
|-|-|-|-|-|-|-|-|
| ✓ | × | 82.50 | 26.67 | 43.33 | 95.60 | 51.27 | 59.87 |
| ✓ | ✓ | 92.50 | 36.67 | 53.33 | 96.80 | 53.39 | <strong>66.53</strong> |
| × | × | 85.00 | 30.00 | 40.00 | 96.00 | 50.35 | 60.27 |
| × | ✓ | 95.00 | 36.67 | 46.67 | 97.00 | 52.89 | 65.65 |

只去 KL：59.87 → 60.27，有涨有跌；加 RB：有 KL 时 +6.66，无 KL 时 +5.38，五个测试集都涨。作者据此说功劳主要在 RB，不在去 KL。仓库给的训练脚本对应的是最后一行（无 KL + RB）。

### 4.3 训练动态（Figure 5）

![论文 Figure 5：Qwen3-8B 加 RB 后。左：各方法加 RB 后的训练熵减去原版的熵，大多在 0 以下；右：五个方法加 RB 后的 κ_eff 曲线和平均验证准确率（黑线）](/images/paper-reading/2026-11-27-rewardbudget/2026-11-27-d89-4.webp)

- <strong>熵反而更低</strong>：除 Dr.GRPO 前 450 步外，加 RB 后熵都比原版低。作者据此说 RB 涨分不是靠保熵
- <strong>κ\_eff 更平稳</strong>：作者说和 Figure 4b 的原版相比，加 RB 后 κ\_eff 抖动明显更小。但右图里 κ\_eff 是随训练一路上升的（从 0 附近到 0.5～1.25），下一节会说这一点

## 五、Limitations

论文附录 D 有单独的 Limitations：只做了以二元奖励为主的可验证推理任务，一般奖励的分析要额外的正则条件，对有噪声的、学出来的、开放式奖励没有结论；每个主配置只有 1 个训练 seed、G 固定为 8，没有扫组大小；成绩是点估计，8 次评测采样只反映解码随机性，不反映训练随机性；有限步的干预和回归分析不能证明 κ 是唯一的因果中介。

### 5.1 我读出来的问题

- <strong>最干净的对照涨得最少</strong>：二元奖励下 RB = Dr.GRPO 的优势 ÷ k，所以「Dr.GRPO vs Dr.GRPO+RB」是唯一只差 RB 本身的对照，结果是 +3.21，MATH500 −0.20，AIME25 +3.33（一道题）。摘要里的「+10」都出在 GRPO 那一行，而 GRPO → RB 同时改了两件事：去掉除以 σ，再加上 1/k。前者单独值多少，论文没拆
- <strong>缺「整体变温和」的对照</strong>：k ≥ 2 时 RB 的优势总量比 Dr.GRPO 小（每组优势绝对值之和从 2k(G−k)/G 变成 2(G−k)/G），lr 又固定 1e-6，相当于大部分题的步长被调小了。Figure 3 自己就说明更新力度会改变训练轨迹。缺一个「Dr.GRPO 把优势统一缩小到 RB 的平均水平」或「降 lr」的对照，分不清功劳在「按题分配」还是「整体推得轻」
- <strong>数字落在单次作答的格点上</strong>：论文说 Qwen3-8B 报的是 8 次采样的平均准确率。AIME 每套 30 题，8 次平均的最小刻度是 1/240（0.42 分），可 Table 2 里 Qwen3-8B 的 AIME 数字全是 1/30 的整数倍（26.67 = 8 题，43.33 = 13 题），AMC23 全是 1/40 的整数倍（82.50 = 33 题），MATH500 是 1/500 的整数倍，Olympiad 一列也都是 1/236 的整数倍。12 个 AIME 格子若真是 8 次平均，碰巧全落在 1/30 格点上的概率约 (1/8)^12。这是我从数字反推的，更像单次作答或贪心解码。若是单次，AIME 上 +10 分就是 3 道题，噪声很大
- <strong>单 seed + 小测试集 + 按验证集停</strong>：作者自己承认每个配置只跑 1 次；每个方法「训到验证集平台为止」，训练步数各不相同；没有方差
- <strong>验证集上看不出大差距</strong>：Figure 2 里纯 GRPO 在同一个 1k 验证集（贪心）上 600 步后约 0.70～0.73；Figure 5b 里加 RB 的五个方法平均最高约 0.73。两张图口径不同（一个是单方法，一个是五方法平均），不能直接相减，但至少看不出测试集上那种 5～7 分的差距。大涨主要出现在 30、40 题的小测试集上
- <strong>κ\_eff 曲线和理论直觉方向相反</strong>：理论上 RB 的 κ = 1/(βk)，题目越做越容易、k 越来越大，推力应该越来越小。但 Figure 5b 里加 RB 后的 κ\_eff 是一路上升的。论文只说抖动更小，没有解释为什么上升
- <strong>熵干预实验偏弱</strong>：只试了 0.01 一个系数，而且干预期间验证准确率比 GRPO 低一大截（0.40 vs 0.68），这是一个有害的干预。用它说明「拉熵不够」不太有力；ClipCov、KLCov 的对比更有说服力，但它们在 Table 2 里也有涨有跌
- <strong>Llama 基线偏弱</strong>：Llama 的 GRPO 在 AMC23 上 pass@8 只有 7.50，比同表 Dr.GRPO 的 30.00 低四倍，像是没训好的基线，+12.50 的最大涨幅有一格就出在这里
- <strong>仓库与论文不一致</strong>：① 评测脚本 K &gt; 1 时默认温度 1.0，论文写 0.7；② evaluation.py 把 math500 列在本地字符串匹配名单里，论文说 MATH500 用 Qwen3-235B 当评委；③ 数据处理脚本用 seed 42 随机切分，论文写「前 10k 训练、接下来 1k 验证」；④ 训练脚本默认 Qwen2.5-7B-Instruct、KL 关，论文两个底座、6 个基线的配置都没有；⑤ κ\_eff 代码放在 recipe/flowrl 里，还夹带无关的 PowerS 目录

## 六、前文对照

| 前文 | 它做了什么 | 和 RB 的关系 |
|-|-|-|
| 11-26 OTB | 每个 token 一个基线，按累计不确定度给组内回答加权，降方差 | OTB 改「基线」、在 token 维度；RB 改「每道题发多少奖励」、在题目维度。两者都是 verl 里的一个 adv\_estimator，原理正交，但要叠加得自己写一个合并版（先按 RB 重分奖励，再用 OTB 算逐 token 基线） |
| 11-25 ResRL | 罚错误回答时，按和正确回答的相似度少罚共享步骤 | ResRL 在错误回答内部按 token 区分轻重；RB 对错误回答一律扣 1/G，不分 token。两者都觉得 GRPO 对错误回答罚得太粗 |
| 11-23 DPPO | 按概率实际变化量定信任域，替代 PPO 比值裁剪 | DPPO 管「每步能挪多远」，RB 管「每道题推多大力」，都在控制更新力度，一个在策略侧、一个在优势侧，可以叠加 |
| 11-24 AntiSD | 看过答案的自己当老师，逐 token 加 PMI 信号 | AntiSD 要多一次特权前向，RB 零额外开销。RB 只改序列级优势，不提供 token 级信号 |
| 10-26 GDPO | 多奖励 RL 里先各自归一化再相加 | 都在说「除以 σ 的组内归一化会扭曲信号」。GDPO 讲多奖励之间的扭曲，RB 讲 σ 在 k=1、k=G−1 两头把推力放大 |
| 10-28 RLVE | 环境按模型水平自动调题目难度 | RLVE 换题，RB 不换题、按难度调每道题的权重。RB 跳过全对 / 全错组，和 DAPO 的动态采样效果类似 |
| 09-04 RL-Cap | RLVR 让 pass@1 涨，但 pass@k 能力边界没涨 | RB 号称推迟「过早锐化」。Llama 的 pass@8 有涨，算一点旁证；但 Qwen3-8B 只报了平均准确率，没有 pass@k 曲线，回答不了 RL-Cap 的问题 |

## 七、启发与待跟进

- <strong>最值得带走的</strong>：二元奖励下，「每道题发一份固定预算」= Dr.GRPO 优势 ÷ 答对条数 k。一行改动，让简单题自动少推，期望目标变成一个边际递减的凹函数
- <strong>想复现</strong>：拉 Qwen-Applications/RewardBudget，先跑 dapo\_math\_17k.py 生成数据，再用 run\_reward\_budget.sh（单机 8 卡），MODEL\_PATH 换成 Qwen3-8B；对齐论文主表要自己加 KL 0.001（GRPO 行）或改成 Dr.GRPO / DAPO 配置。评测记得把 GEN\_TEMPERATURE 设成 0.7，MATH500 要不要走 LLM 评委自己决定
- <strong>待查</strong>：Dr.GRPO 把优势统一缩小（或降 lr）能追回多少；Table 2 到底是单次还是 8 次平均；换 3 个 seed 后 Dr.GRPO+RB 的 +3.21 还在不在；G=16、32 时 1/k 的效果
- <strong>能往下做的</strong>：① 把「预算」从每题 1 分改成按难度可学的预算；② 推广到 rubric、过程奖励这类非二元奖励，验证附录 A.5 的 log-mean 说法；③ 和 OTB / DPPO 叠加，看「题目维度降权」和「token 维度降方差」能否互补；④ 补 pass@k 曲线，正面回答「推迟锐化」有没有扩大能力边界

## 八、结论

RB 的做法是：每道题只发 1 分奖励，答对的几条平分，答错的固定扣 1/G。二元奖励下它正好是 Dr.GRPO 的优势再除以答对条数，难题照推、容易题少推，期望目标是一个边际递减的凹函数。在 Qwen3-8B 和 Llama3.2-3B-Instruct 上，它叠到 6 个 RL 方法上 12 组平均分全涨，Qwen3-8B GRPO 从 59.87 到 66.53，而且不靠拉高熵。仓库是阿里 Qwen 团队放的 verl fork，一个 adv\_estimator 开关就能用，训练、评测、数据脚本齐全，算本周最容易上手的一篇。

需要打折看的地方：只差 1/k 的干净对照（Dr.GRPO）只涨 3.21；缺「整体缩小步长」对照；Qwen3-8B 的数字看起来像单次作答，AIME 一题 3.33 分；单 seed；验证集上看不出大差距；κ\_eff 曲线方向和理论直觉相反；仓库的评测温度、判分、数据切分都和论文不一致。拿来当 baseline 前，先补一个 Dr.GRPO 缩步长对照和多 seed。

> 💡 <strong>今日一句</strong>：奖励按题发、不按人头发，等于 Dr.GRPO 再除以答对条数，一行就能改；但最干净的那组对照只涨 3 分，先补「整体推轻一点」的对照，再信它是按题分配的功劳。
