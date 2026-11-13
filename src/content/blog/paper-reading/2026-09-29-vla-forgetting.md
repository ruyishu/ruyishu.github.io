---
title: '0929 VLA 持续学习：预训练 VLA 没那么容易忘'
description: '整个持续学习领域几十年的共识——"学新任务会灾难性遗忘旧任务，必须靠大回放缓冲或复杂正则"——是在「从头训的小模型」上得出的。这篇把前提换成「3B 预训练 VL…'
pubDate: '2026-09-29'
---

> 2026-09-29 · 文献阅读 #47 · 方向：具身智能 · <strong>持续学习 / 灾难性遗忘</strong> · ICML 2026 <strong>Oral</strong>

## TL;DR

<strong>一句话：整个持续学习领域几十年的共识——"学新任务会灾难性遗忘旧任务，必须靠大回放缓冲或复杂正则"——是在「从头训的小模型」上得出的。这篇把前提换成「3B 预训练 VLA」做实证，结论反了：预训练 VLA 出奇地抗遗忘，简单的经验回放（ER）在 2% 的数据量下就能做到零遗忘，甚至出现正向后向迁移。更关键的是第三个发现——<strong>看起来被忘掉的技能其实还留在表征里</strong>，只需不到 10% 的原来训练步数就能恢复到峰值。</strong>

- <strong>最刺眼的对照（Figure 1 混淆矩阵）</strong>：GR00T N1.5 学完 10 个任务后，第 0 个任务的分数仍稳在 <strong>0.90–1.00</strong>（整片深蓝）；从头训的 BC-Transformer 同一位置掉到 0.40–0.57，中间大片浅黄/空白
- <strong>平均指标（Table 1，回放缓冲 = 1000 样本 / 20%）</strong>：GR00T <strong>SR 0.919 / NBT 0.027</strong>、Pi0 <strong>0.768 / −0.016</strong>（<strong>NBT 为负 = 正向后向迁移，学新任务让旧任务变好</strong>）；对比 BC-Diffusion Policy 0.696 / 0.127、BC-Transformer 0.585 / <strong>0.245</strong>、BC-ViT 0.508 / 0.193
- <strong>但"抗遗忘"有一个不能省的前提</strong>：<strong>不复用旧数据就照样忘光</strong>——Sequential 的 NBT <strong>0.696–0.758</strong>、EWC 0.728–0.766（Table 2）。所以标题里的 resistant <strong>必须读成"配上一点点经验回放之后"</strong>
- <strong>低回放数据区间差距最大</strong>：缓冲 2%（每任务 100 样本）时 VLA 的 NBT 还在 0.1–0.2，而三个 BC 基线已恶化到 0.4–0.5（<strong>2–4 倍的遗忘</strong>）；非预训练模型要超过 20% 的回放数据才追平
- <strong>全文最关键的洞察："忘了"其实是"取不出来"</strong>：组件交换显示 <strong>VL 主干是遗忘的主要来源</strong>，但旧任务的 VL 知识还在——用 Task k+1 的 VL 主干重新学 Task k，<strong>Pi0 只需原训练步数的 6.2%–10.5% 就恢复峰值</strong>，而 BC-Transformer 要 <strong>33%–187%</strong>（Table 4）
- <strong>论文自己揭穿了一个度量陷阱（很好的方法论）</strong>：<strong>低 NBT 有两种来源</strong>——真的记住了，或者<strong>根本没学会新任务（plasticity 不足）</strong>。它们用 KT（所有任务成功率之和）曲线交叉验证，指出"从头训的 Pi0"负 NBT 其实是<strong>学不动</strong>伪装出来的
- <strong>⚠️ 但有两处必须打折看</strong>：① 核心对照<strong>不是同条件</strong>——两个 VLA 是 <strong>3B 且大部分组件冻结/LoRA</strong>，三个 BC 基线是 <strong>15–26M 全参数全量微调</strong>（附表 Table 8）② 论文自己的 Table 10 显示<strong>光把规模做大（完全不预训练）也能把 NBT 从 0.1100 压到 −0.0520</strong>
- <strong>主题轮换</strong>：今日<strong>具身智能（VLA / 持续学习）</strong>（按序列从世界模型（9/28 PERSIST）切出；上次该主题是 9/21 ThinkAct）

## 文献信息

| 字段 | 内容 |
|-|-|
| 标题 | Pretrained Vision-Language-Action Models are Surprisingly Resistant to Forgetting in Continual Learning（项目页代号 <strong>forget-me-not</strong>） |
| 作者 | Huihan Liu（通讯）、Changyeon Kim、Bo Liu、Minghuan Liu、<strong>Yuke Zhu</strong>（5 人） |
| 机构 | <strong>The University of Texas at Austin</strong>（第 1、4、5 作者）+ <strong>KAIST</strong>（第 2 作者）+ <strong>Microsoft Superintelligence</strong>（第 3 作者） |
| 发布时间 | arXiv:2603.03818（v1 2026-03-04，v2 2026-03-17；全文 21 页，正文 9 页） |
| 会议 | <strong>ICML 2026 Oral</strong>（一手确认：<strong>ICML 官方 virtual 全量数据</strong> icml-2026-orals-posters.json 命中，count=6797 完整解析，<strong>同时命中两条</strong>——eventtype=<strong>Oral</strong>（session "Oral 4B Robotics: Vision-Language-Action Models"，<strong>该 session 全场仅 4 篇</strong>）与 eventtype=<strong>Poster</strong>（Poster Session 5），paper\_url=OpenReview forum <strong>VzdSHEab4G</strong>；<strong>阳性对照</strong>=同表命中 lib 已读的 EOPD / HPD / MoCA（Oral+Poster 两条）/ Self-Distillation / VLM-CapCurriculum / JitRL / PERSIST 全部命中。⚠️ 注意：<strong>arXiv abs 页 Comments 字段只写了 "Project website: this https URL"，没有任何录用标注</strong>——本篇的录用结论<strong>完全依赖官方列表</strong>） |
| 链接与代码 | <a href="https://arxiv.org/abs/2603.03818">arXiv:2603.03818</a> · 项目页 <a href="https://continual-vlas.github.io/forget-me-not/">continual-vlas.github.io/forget-me-not</a>（含代码与更多实验）· OpenReview forum VzdSHEab4G |
| 性质 | <strong>实证研究 / 发现型论文（empirical study，无新算法）</strong>；<strong>⚠️ 全文没有 Limitations 章节，也没有 Impact Statement</strong>（仅两处提到 limitation，都是在说 NBT 这个指标本身的缺陷） |
| 基准与任务 | <strong>LIBERO</strong>（机器人操作终身学习基准），四个 suite：<strong>LIBERO-Spatial / LIBERO-Object / LIBERO-Goal / LIBERO-10</strong>；<strong>所有实验使用同一任务顺序</strong>；训练数据用 Kim et al. (2024) 的 <strong>filtered</strong> 版本 |
| 被比较的模型 | 两个预训练 VLA：<strong>Pi0</strong>（3B，PaliGemma 骨干 + flow matching 动作头）与 <strong>GR00T N1.5</strong>（3B）——两者架构、参数量、预训练数据都不同，用来证明结论不是某个架构的偶然；三个非预训练小模型：<strong>BC-Transformer</strong>（约 15M）、<strong>BC-ViT</strong>（约 15M）、<strong>BC-Diffusion Policy</strong>（约 26M） |
| 训练设置 | 每个 suite 单独训一个模型，任务之间<strong>权重接力</strong>；ER = 当前任务数据 + 固定回放缓冲（每任务 M 个样本，整轮重复使用）；VLA <strong>每任务固定 10,000 梯度步</strong>，BC 基线<strong>每任务 50 epochs</strong>；学习率 pi0 2.5e-5 / GR00T 1e-4 / BC 1e-4；batch size 8 / 16 / 16 / 16 / 16；AdamW + cosine decay |
| 关键微调策略（见批判①） | pi0 = Vision 全参数微调 + <strong>Language / Action 只用 LoRA</strong>；GR00T = <strong>Vision 与 Language 全部冻结</strong> + Action 全参数微调；三个 BC 基线 = <strong>Full FT（全部参数）</strong> |

## 一、先看例子（大白话：忘记其实是"一时想不起来"）

> 💡 <strong>铺垫</strong>：机器人策略要在真实世界里"越用越会"——今天学会开抽屉，明天学会拧瓶盖，<strong>但学拧瓶盖不能把开抽屉忘了</strong>。这就是持续学习，也叫稳定性（不忘）与可塑性（能学新）的平衡。
>
> 几十年来这个领域的做法都是在<strong>从头训的小模型</strong>上研究的，结论是"遗忘很严重，必须用大回放缓冲或复杂正则"。<strong>这篇把前提换成了 3B 的预训练 VLA，然后结论反了。</strong>

> <strong>把这件事想成两个人学新菜谱：</strong>
>
> <strong>旧的做法研究的是"一张小抄"。</strong>这张小抄只够写三道菜。你学第四道的时候，得把整张小抄重写一遍——<strong>前三道就被涂掉了</strong>。这就是灾难性遗忘。
>
> <strong>预训练 VLA 更像"一个读过很多书的大厨"。</strong>他会做的菜本来就多，学新菜主要是把已有的手法<strong>重新配置</strong>，而不是从零重写。
>
> <strong>论文发现的第一件事：这个大厨不容易忘。</strong>而且忘得少<strong>不是因为他学得慢</strong>——他学新菜的速度反而更快。
>
> <strong>论文发现的第二件事（更有意思）：他"忘掉"的菜，其实还在手上。</strong>你让他复习一下，几分钟就能重新做出来。<strong>那不是"忘了"，是"一时想不起来"。</strong>
>
> <strong>但论文也留了一个不显眼的前提：得给他一本"旧菜谱的快照"（也就是回放一点点旧数据）。不给的话，他照样全忘。</strong>

![▲ 论文 Figure 1（也是项目页 teaser）：持续学习的「混淆矩阵」对比。上排是预训练 VLA（GR00T N1.5），下排是从头训的小策略（BC-Transformer）；横轴是任务序号 j，纵轴是 checkpoint 序号 i（学完第 i 个任务），每格是「学完任务 i 之后在任务 j 上的成功率」。上排整片深蓝说明旧任务基本不掉，下排大量浅黄与空白说明旧任务崩塌](/images/paper-reading/2026-09-29-vla-forgetting/2026-09-29-d48-1.webp)

## 二、动机：几十年的共识是在不同的前提上得出的

- <strong>问题本身很老</strong>：持续学习要求机器人在学新技能的同时保留旧行为，也就是平衡 <strong>plasticity（可塑性）</strong> 与 <strong>stability（稳定性）</strong>。天真的顺序微调在经典设定下几乎必然导致<strong>灾难性遗忘</strong>
- <strong>但过去的证据几乎全部来自一类模型</strong>：<strong>从头训、或只做了有限预训练的小策略模型</strong>。在这类设定下，遗忘是 pervasive（普遍且严重）的，所以业界习惯性地要求<strong>大回放缓冲</strong>或<strong>精心设计的正则</strong>
- <strong>预训练 VLA 的工作方式在原理上就不同</strong>：它们在大规模多模态数据 + 机器人轨迹上预训练过，因此<strong>更少依赖任务特定的参数更新，而是靠复用与重配置已有表征</strong>
- <strong>于是有了这篇的核心问题</strong>：<strong>大预训练 VLA 在持续学习中的动力学是否不同？如果不同，不同在哪？</strong>
- <strong>论文给出的三个发现（它自己列的）</strong>： 
  - <strong>① 预训练 VLA 显著抗遗忘</strong>：简单 ER 往往就能做到零遗忘，甚至出现<strong>正向后向迁移</strong>（只用回放数据就让旧任务变好）——<strong>这种动力学在小模型上从没见过</strong>
  - <strong>② 预训练起的是关键作用</strong>：小回放数据下尤其能抑制遗忘，<strong>同时还能保持强的正向学习能力</strong>（没有落到"低遗忘是因为学不动"的退化解）
  - <strong>③ VLA 保留了"看似被忘掉"的知识</strong>：性能下降不等于知识被覆盖，少量微调就能重新表达出来

## 三、方法（这是一篇实证研究，方法 = 实验设计）

### 3.1 形式化与两个指标（外加一个方法论上的补丁）

- <strong>任务建模</strong>：有限时域 MDP，K 个任务顺序学，用<strong>单一任务条件策略</strong>；本工作用<strong>模仿学习</strong>（每个任务有专家示范）
- <strong>指标 1：SR</strong>——平均任务成功率
- <strong>指标 2：NBT（Negative Backward Transfer）</strong>——把"学完任务 k 时的分数"与"之后各步的分数"作差再跨任务平均。<strong>正值 = 有遗忘（越低越好），接近 0 = 不遗忘，负值 = 正向后向迁移</strong>
- <strong>论文加的一个方法论补丁（很值得记）</strong>：<strong>低 NBT 有两种完全不同的来源</strong>——① 真的把知识保住了 ② <strong>根本没学会新任务（可塑性不足）</strong>。只看 NBT 会把两者混为一谈。所以它额外用 <strong>KT（Knowledge Transfer，所有任务成功率之和）</strong> 曲线来交叉验证：<strong>KT 斜率越高说明真的在积累知识</strong>，斜率低则说明"低遗忘"是假的

### 3.2 三个实验设计（Figure 6）

![▲ 论文 Figure 6：三个实验设计。(a) 基线流水线：连续学 Task k-1、k、k+1，每个 checkpoint 评测所有已学任务；(b) 组件交换：把 Task k+1 的 VL 主干与 Task k 的动作头互换，看哪一边掉分更多，从而判断遗忘发生在哪个模块；(c) 恢复实验：用 Task k+1 之后的 VL 主干重新学 Task k，如果比第一次学更快，说明知识仍然保留](/images/paper-reading/2026-09-29-vla-forgetting/2026-09-29-d48-2.webp)

- <strong>(a) 基线流水线</strong>：顺序学 Task k−1 → k → k+1，在每个 checkpoint 评测所有已学任务（这正是 Figure 1 那张混淆矩阵的由来）
- <strong>(b) 组件交换</strong>：VLA 可以看成「VL 主干 + 动作头」。把 <strong>Task k+1 训练后的 VL 主干</strong>与 <strong>Task k 的动作头</strong>拼起来测 Task k；再反过来拼一次。<strong>哪一边掉分更多，遗忘就在哪一边</strong>
- <strong>(c) 恢复实验</strong>：拿 Task k+1 之后得到的 VL 主干去<strong>重新学 Task k</strong>，测"达到峰值需要多少步"。<strong>如果比第一次学更快（第一次是从 Task k−1 的主干开始的），说明旧知识仍然部分保留；如果一样快或更慢，说明已经被完全覆写</strong>

## 四、实验

### 4.1 主结果：预训练 VLA 抗遗忘（Table 1，回放 20%）

| 方法 | Spatial SR | Spatial NBT | Object SR | Object NBT | Goal SR | Goal NBT | 平均 NBT |
|-|-|-|-|-|-|-|-|
| <strong>GR00T（3B 预训练 VLA）</strong> | <strong>0.940</strong> | <strong>0.007</strong> | <strong>0.975</strong> | 0.019 | <strong>0.943</strong> | 0.023 | <strong>0.027</strong> |
| <strong>Pi0（3B 预训练 VLA）</strong> | 0.879 | 0.019 | 0.897 | <strong>−0.011</strong> | 0.732 | <strong>−0.005</strong> | <strong>−0.016</strong> |
| BC-Diffusion Policy（约 26M） | 0.663 | 0.050 | 0.847 | 0.025 | 0.809 | 0.230 | 0.127 |
| BC-Transformer（约 15M） | 0.659 | <strong>0.299</strong> | 0.595 | 0.132 | 0.709 | <strong>0.356</strong> | <strong>0.245</strong> |
| BC-ViT（约 15M） | 0.513 | 0.171 | 0.543 | 0.077 | 0.661 | 0.319 | 0.193 |

- <strong>两个 VLA 的 NBT 在多处为负</strong>（Pi0 的 Object −0.011 / Goal −0.005 / LIBERO-10 −0.068）→ <strong>正向后向迁移</strong>：学新任务让旧任务变好了。<strong>论文明确指出这挑战了经典的稳定性-可塑性取舍</strong>
- <strong>而且 VLA 的成功率也更高</strong>（GR00T 平均 0.919 vs BC-Transformer 0.585）→ <strong>低遗忘不是靠"不动"换来的</strong>
- <strong>换架构也成立</strong>：Pi0 与 GR00T 在架构、参数量、预训练配方上都不同，趋势一致 → 说明这是<strong>预训练 VLA 的普遍性质，不是某个架构或数据配方的偶然</strong>

### 4.2 抗遗忘的代价：必须有回放（Table 2）

| 模型 / 方法 | Object SR | Object NBT | LIBERO-10 SR | LIBERO-10 NBT |
|-|-|-|-|-|
| Pi0 · Sequential（不复用旧数据） | 0.910 | <strong>0.696</strong> | 0.644 | <strong>0.562</strong> |
| Pi0 · EWC（正则，不复用旧数据） | 0.910 | 0.608 | 0.622 | 0.543 |
| <strong>Pi0 · ER（回放）</strong> | 0.898 | <strong>−0.007</strong> | 0.586 | <strong>−0.070</strong> |
| GR00T · Sequential | 0.964 | <strong>0.752</strong> | 0.852 | <strong>0.758</strong> |
| GR00T · EWC | 0.826 | 0.766 | 0.816 | 0.728 |
| <strong>GR00T · ER</strong> | 0.962 | <strong>0.004</strong> | 0.836 | 0.082 |

- <strong>这是全文最重要的一张"打脸表"</strong>：<strong>3B 的预训练 VLA 一旦不复用旧数据，NBT 照样飙到 0.696–0.758</strong>——和从小模型上得到的"灾难性遗忘"结论没有区别
- EWC 这类<strong>经典正则几乎没用</strong>（0.543–0.766），而 ER（显式重访旧数据，哪怕只有一点）直接把它压到 0 附近
- <strong>所以"抗遗忘"这个说法的准确形式是</strong>：<strong>预训练 VLA + 一点点经验回放 = 近乎零遗忘</strong>；缺了后半句就不成立

### 4.3 越缺数据，预训练越关键

![▲ 论文 Figure 2：不同回放缓冲规模下的 NBT（越低越不遗忘）。横轴是缓冲占总数据的比例（0.2% / 2% / 20%），四个子图对应四个 LIBERO suite，最右是平均值。预训练 VLA（Pi0、GR00T）整体低得多，而且在 2% 这一档与非预训练基线的差距最大](/images/paper-reading/2026-09-29-vla-forgetting/2026-09-29-d48-3.webp)

- <strong>缓冲 2%（每任务 100 样本）</strong>：Pi0 与 GR00T 的 NBT 还在 <strong>0.1–0.2</strong>，而三个 BC 基线恶化到 <strong>0.4–0.5</strong>——<strong>落后 2–4 倍</strong>；非预训练模型要超过 <strong>20%</strong> 的回放数据才能追到同一水平
- <strong>⚠️ 论文自己承认的一个度量缺陷</strong>：缓冲小到 <strong>0.2%</strong> 时，绝对 NBT 上的差距反而不明显——<strong>因为那时所有策略都近乎完全遗忘，绝对 NBT 被各自的初始成功率主导，而不是"真实抗遗忘能力"</strong>。论文做了归一化的 NBT 变体放在附录 A.2，并在正文明确标注了这一点

![▲ 论文 Figure 4：NBT 与回放缓冲规模的 Pareto 前沿。蓝线是完整预训练的 Pi0（VL + Action）、绿线是只加载 PaliGemma 主干未做机器人数据预训练、橙线是从头训的 Pi0 架构、灰线是 BC-Transformer。回放缓冲越小，预训练与非预训练之间的差距越大](/images/paper-reading/2026-09-29-vla-forgetting/2026-09-29-d48-4.webp)

### 4.4 预训练到底改变了什么（Table 3 + Figure 5）：一个非常漂亮的"排除法"

为隔离"预训练"这一个变量，论文固定架构、只改初始化，比较三个变体：<strong>VL + Action</strong>（完整预训练）／<strong>from VL</strong>（只加载 PaliGemma 主干，无机器人数据预训练）／<strong>from scratch</strong>（同架构完全从头训）。

| Pi0 初始化（回放 1000） | 平均 SR↑ | 平均 NBT↓ | 怎么看 |
|-|-|-|-|
| <strong>from VL + Action（完整预训练）</strong> | 0.863 | <strong>−0.032</strong> | 学得好 + 不遗忘 |
| from VL（只有 VLM 主干） | <strong>0.899</strong> | 0.016 | 学得最好 + 几乎不遗忘 |
| from scratch（完全从头） | <strong>0.655</strong> | <strong>−0.039</strong> | <strong>NBT 也低，但 SR 低得多 → 低遗忘是假象</strong> |
| BC-Transformer | 0.678 | 0.191 | 真正的"又忘又学不好" |

- <strong>这是全文方法论上最漂亮的一步</strong>：from scratch 的 NBT（−0.039）看起来比完整预训练还好，<strong>但它的 SR 只有 0.655</strong>——<strong>低遗忘来自"学不动"而非"记得住"</strong>
- <strong>Figure 5 的 KT 曲线证实了这一点</strong>：完整预训练与 from VL 的 KT 稳步上升（真的在积累知识），而 from scratch 的 KT 增长明显更慢
- <strong>结论</strong>：预训练同时改善<strong>正向迁移与后向迁移</strong>，<strong>避开了稳定性-可塑性的取舍</strong>——这才是它真正不同于小模型的地方

### 4.5 关键洞察："忘了"其实是"取不出来"

<strong>组件交换实验（在 buffer = 0.2% 这个高遗忘区间做）给出三个观察：</strong>

![▲ 论文 Figure 7：把遗忘定位到模块的组件交换实验。每组四根柱依次是「Task k 的 VL + Task k 的动作头」（原模型）、「Task k+1 的 VL + Task k 的动作头」、「Task k 的 VL + Task k+1 的动作头」、「全部换成 k+1」。换掉 VL 主干掉分最多，说明 VL 主干是遗忘的主要来源](/images/paper-reading/2026-09-29-vla-forgetting/2026-09-29-d48-5.webp)

- <strong>① 知识是分模块的</strong>：换掉任一部分都比原模型差、但比完全更新后的模型好 → <strong>遗忘不是整体性的，而是分别发生在不同模块上</strong>
- <strong>② VL 主干是遗忘的主要来源</strong>：换掉 VL(k+1) 的掉分明显大于换掉 Action(k+1) → <strong>动作相关信息跨任务比较一致，而 VL 主干的更新会改变底层表征，造成与已学动作映射之间的错配</strong>
- <strong>③ 遗忘程度与任务多样性相关</strong>：LIBERO-10（视觉背景变化最大）换 VL(k+1) 掉得最多；LIBERO-Object（都是类似的 pick-and-place）换 Action(k+1) 几乎不掉

<strong>恢复实验（Table 4）——全文最有力的一张表：</strong>

| 基准 | Pi0（恢复步数 / 原始步数）↓ | BC-Transformer ↓ |
|-|-|-|
| LIBERO-Spatial | <strong>0.066</strong> | 1.36 |
| LIBERO-10 | <strong>0.105</strong> | 1.87 |
| LIBERO-Object | <strong>0.067</strong> | 1.80 |
| LIBERO-Goal | <strong>0.062</strong> | 0.33 |

- <strong>Pi0 在所有四个基准上都能用不到 10% 的原始训练步数恢复到峰值</strong>（0.062–0.105）
- <strong>BC-Transformer 需要 33%–187%</strong>——基本等于<strong>从头再学一遍</strong>，说明它的旧知识是真的被覆写了
- <strong>所以两边的"遗忘"性质完全不同</strong>：预训练 VLA 是<strong>"暂时取不出来"（表征保留、检索路径变了）</strong>；从头训的模型才是<strong>"知识被覆盖"</strong>。论文 <strong>Figure 8</strong> 的曲线把这件事画得很清楚：Pi0 的微调曲线在前几个百分点的训练步内就冲到 1.0，BC-Transformer 的微调曲线基本贴着"第一次学"的曲线走

![▲ 论文 Figure 8：恢复速度对比。黄线是重新微调学回该任务的成功率曲线，黑线是第一次学（Learn First Time）的曲线，两者都归一化到各自峰值。Pi0（上排）的微调曲线在前几个百分点的训练步内就冲到 1.0，远快于第一次学；BC-Transformer（下排）的微调曲线基本跟着第一次学的曲线走](/images/paper-reading/2026-09-29-vla-forgetting/2026-09-29-d48-6.webp)

## 五、Limitations &amp; 批判性思考

> ⚠️ <strong>先说一件事实</strong>：<strong>这篇论文没有 Limitations 章节，也没有 Impact Statement</strong>。全文只有两处提到 limitation，都是在讨论 NBT 这个指标本身的缺陷。对一篇 ICML Oral 来说，这是明显的缺失——下面的问题都得由读者自己补出来。

### 我读出来的问题（按严重程度排序）

- <strong>① 最严重：核心对照混了至少四个变量，"预训练"的功劳被高估了</strong>。按附表 Table 8，被当作"抗遗忘的证据"的两个 VLA 是 <strong>3B 参数</strong>、且 <strong>pi0 只有 Language/Action 用 LoRA、GR00T 直接把 Vision + Language 冻结</strong>；而三个 BC 基线是 <strong>15–26M（小 100–200 倍）且全参数全量微调</strong>。也就是说，差异可能来自 <strong>规模</strong>、<strong>实际更新的参数量占比</strong>、<strong>架构</strong>，而不只是预训练。<strong>而论文自己的 Table 10 恰好说明规模本身就能降 NBT</strong>：17M + ResNet(0.5M vision) 的 NBT 是 <strong>0.1100</strong> → 17M + SigLIP-B/16(80M) <strong>0.0628</strong> → 17M + So400M(400M) <strong>0.0264</strong> → 250M + So400M <strong>−0.0520</strong>——<strong>全部是从头训、没有任何机器人数据预训练</strong>。只把视觉骨干从 0.5M 换到 400M，NBT 就掉了 4 倍；再把 LLM+动作头从 17M 换到 250M，NBT 直接变负。<strong>这是全文最值得质疑的一点：结论可能是"大模型 + 少改参数改变了持续学习动力学"，而不是"预训练改变了它"</strong>
- <strong>② "抗遗忘"的适用区间被标题式说法压缩了</strong>：附表 Table 5 显示，<strong>LIBERO-10 上回放只有 10 个样本时，Pi0 的 NBT 是 0.529、GR00T 是 0.766</strong>——<strong>同一批"抗遗忘"的模型，在小回放 + 最难的 suite 上照样忘掉一半</strong>。标题里的 surprisingly resistant 在具体区间里必须打折读
- <strong>③ 没有 Limitations 章节</strong>，也没有讨论"这套对照是否公平"、"结论能否推广到 LIBERO 之外"、"有没有真机验证"
- <strong>④ 只有仿真、没有真机</strong>：全部结论基于 LIBERO（仿真、固定任务顺序、有限 seed）。真实部署里的分布漂移、以及持续学习最经典的自变量之一——<strong>任务顺序敏感性</strong>——都没有测
- <strong>⑤ "知识仍然保留"的判据存在竞争解释</strong>：用 Task k+1 的主干重学 Task k 更快，也可以解释为"<strong>这个主干本身是个更好的通用初始化（更会学）</strong>"，而不是"保留了 Task k 的特定知识"。<strong>区分这两者需要一个对照：用 Task k+1 的主干去学一个全新的、之前没见过的任务</strong>——如果也更快，那"知识保留"的解释就不成立。这个实验缺了，而它恰恰是全文第三个发现的地基
- <strong>⑥ "正向后向迁移"的显著性没有被单独讨论</strong>：很多负 NBT 幅度很小（如 −0.00013、−0.005、−0.011），而表里给的标准差是 ±0.010–0.035 量级——<strong>部分负值落在噪声范围内</strong>。论文把"正向后向迁移"当成一个挑战经典取舍的发现来陈述，但没有给出统计检验
- <strong>⑦ NBT 的度量缺陷被承认但没有被解决</strong>：论文做得很好的一点是指出"低 NBT 也可能来自学不动"，但<strong>主表用的仍是标准 NBT</strong>，归一化版本只放在附录
- <strong>⑧ 回放数据的来源被淡化</strong>：ER 用的是<strong>之前任务的专家示范</strong>。真实部署里用户手里通常只有自己产生的 (suboptimal) rollout 而不是专家示范。<strong>用次优回放数据时"2% 就够"是否还成立，论文没测</strong>——而这决定了这套方案在真实场景里能不能落地
- <strong>⑨ 恢复的成本没有完整计入</strong>：即便"只需 6%–10% 的步数恢复"，前提是<strong>你得知道哪个技能掉了、并且重新准备好那个任务的数据</strong>。真实部署里"检测到遗忘"往往比"恢复它"更贵，论文没有讨论这个成本

## 六、与前文对照

> 🔗 <strong>一句话定位：这篇是 lib 里「训练会伤害已有能力」这条主线的第一个反例——但它给的不是"训练不伤害能力"，而是"当模型足够大且被预训练过时，一点点回放就足以把伤害压到零"。</strong>

### 6.1 与 lib 的"遗忘 / 训练伤害"主线（最重要的对照）

- 这条线在 lib 里已经串了很久：<strong>Self-Training 的 U 型曲线（9/22）</strong>——"自训练同时带来信号遗忘与去噪，风险呈 U 型"；<strong>MoCA（9/23）</strong>——"奖励撒错地方会把正确的感知习惯一起 unlearn 掉"；<strong>JitRL（9/24）</strong>——"干脆不更新参数，彻底绕开遗忘"；<strong>VLM-CapCurriculum（9/25）</strong>——"只训推理会有感知税，MMStar 反降 1.6%"
- <strong>这篇给的是"适用域"，不是"反驳"</strong>：上面那些伤害，在<strong>小模型 / 从头训 / 全参数微调</strong>的设定下成立；换到<strong>大预训练模型 + 少量回放</strong>，伤害可以被压到零。<strong>顺着这条线读，lib 的"遗忘"叙事从"训练总会伤害能力"升级成了"训练伤害能力的量级由一个以前没被当成自变量的东西决定：模型规模 × 预训练程度 × 实际更新参数的比例"</strong>
- <strong>与 JitRL 的对照最有意思</strong>：JitRL 的答案是"<strong>根本不更新参数</strong>"（非参数化，把经验存进外挂记忆库）；这篇的答案是"<strong>更新参数也行，只要模型够大 + 回放一点点</strong>"。<strong>两条方向完全相反的路线，在同一个问题上都成立</strong>——决定走哪条路的，是"模型规模与预训练程度"这第三个维度
- <strong>与 Self-Training U 型曲线（9/22）的接口（一个现成的好实验）</strong>：那篇说自训练风险呈 U 型、需要早停；这篇说大模型的下行段被"预训练 + 回放"压平了。<strong>合起来就是一个可验证的假设：U 型的深度是模型规模的函数</strong>——这个实验没人做过

### 6.2 与"该记什么、记多少"这条线

- 就在这个月里，"记忆"这件事在 lib 里出现了三次：<strong>JitRL 的外挂经验库</strong>（只增不减、无淘汰机制）、<strong>PERSIST 的持久 3D 状态</strong>（成本固定但范围有限）、<strong>这篇的回放缓冲</strong>（能不能更小）
- <strong>这篇给出了最实用的那个数字：对预训练 VLA，2% 的回放数据就够</strong>。这比 JitRL 的"全量经验库"便宜得多，也比 PERSIST 的"恒定 3D 状态"简单得多——<strong>三篇合起来正好构成"记忆成本"的三个量级</strong>
- <strong>与 TMS（跨时间 checkpoint 混标签）的对照</strong>：TMS 也是"把旧数据掺回来"，但掺在<strong>同一次训练的时序上</strong>；这篇掺在<strong>任务序列上</strong>——<strong>同一种"重访"直觉的两种时间尺度</strong>

### 6.3 "没有 Limitations 章节"这件事本身值得记

- 一个月内 lib 已经遇到两次：<strong>MoCA（9/23，全文既无 Limitations 也无 Conclusion）</strong> 和 <strong>本篇</strong>。而且这两篇都是 <strong>ICML 2026 的 Oral / Spotlight 级</strong>论文
- <strong>这是一个值得注意的观察</strong>：顶会高评级论文里"没有 Limitations 章节"并不罕见，<strong>评审似乎不把它当硬性扣分项</strong>。对我们读论文的意义是：<strong>看到一篇漂亮的 Oral，不要默认它的边界条件已经被作者交代清楚了——边界往往得自己推</strong>

### 6.4 与 VLM-CapCurriculum（9/25）的呼应：都在把"伤害"拆到模块级

- 那篇用<strong>能力隔离</strong>（先练感知再练推理，避免互相伤害）来<strong>预防</strong>；这篇用<strong>组件交换</strong>（VL 主干 vs 动作头）来<strong>诊断</strong>伤害发生在哪个模块
- <strong>两篇思路同源：把"伤害"从整体指标拆到模块级别</strong>——一个用来预防、一个用来定位。而本篇的结论（<strong>VL 主干才是遗忘主源、动作头跨任务更一致</strong>）如果成立，那么 VLM-CapCurriculum 的"能力排课"思路在 VLA 持续学习上可能有直接对应：<strong>要不要也把"VL 表征"和"动作映射"分开更新？</strong>

### 6.5 lib 的"分锅家族"又多了一个成员

- 此前的分锅维度：<strong>BSBT 模态轴</strong>（视觉 vs 语言）、<strong>PCD 因果阶段轴</strong>、<strong>GiGPO 时间步轴</strong>、<strong>MIRL 生成阶段轴</strong>、<strong>InstructVLA 参数子集轴</strong>、<strong>MoCA 模态轴 + 奖励路由</strong>
- <strong>本篇补上"模块轴"</strong>（VL 主干 vs 动作头），而且它的手段是<strong>组件交换</strong>——不需要重训、只要能拿到不同 stage 的 checkpoint 就能做，<strong>是这整个家族里最便宜的一种归因方式</strong>

## 七、启发与待跟进

> 💡 <strong>今天最该带走的一条</strong>：不是"训练会不会伤害已有能力"，而是<strong>"伤害的量级由一个你以前没当成自变量的东西决定：模型规模 × 预训练程度 × 你实际更新了多少参数"</strong>。这篇论文真正的贡献，是把一个几十年的共识放进了新语境里，然后发现它不成立了。

### 方法启发（可迁移）

- <strong>① "低遗忘"必须配"没学不动"一起报</strong>：论文用 KT 曲线交叉验证，指出 from-scratch 的负 NBT 是"学不动"伪装的。<strong>这个方法论警觉值得直接抄</strong>——任何"我们的方法更稳 / 退化更少 / 遗忘更轻"的结论，都要先检查<strong>"是不是因为根本没动"</strong>。（这和 RAGEN-2 的"熵看不出问题、MI 才看得见"是同一类警觉）
- <strong>② 组件交换是极便宜的归因工具</strong>：不用重训，只要把不同 stage 的模块拼起来各测一遍，就能定位伤害发生在哪。<strong>任何"多模块系统里到底谁出问题"的场景都能搬</strong>
- <strong>③ "恢复速度"是一个被忽视的评价维度</strong>：大家只报最终分数，这篇报"恢复到峰值需要多少步"（<strong>0.066 vs 1.36，差 20 倍</strong>）。<strong>只看最终分数会得出"两者都忘了"的错误结论；看恢复速度才知道一个是"取不出来"、一个是真的被覆盖</strong>。这个维度可以搬到任何"遗忘 / 退化"类问题上
- <strong>④ 反直觉结论的价值来自"把公认前提换掉"</strong>：持续学习研究了几十年，前提一直是从头训的小模型。这篇只是把前提换成"大预训练模型"，结论就反了。<strong>这是一个很好的选题思路：去找那些"共识形成时所用的模型规模 / 训练范式"已经过时的领域，重做一遍</strong>

### 待跟进（按性价比排序）

- <strong>① 【最高性价比】补一个干净的"规模 vs 预训练"对照</strong>：同架构、同可训练参数比例，只改"是否预训练"。这是把这篇的归因从"预训练"剥离到"规模 / 可训练参数比例"的关键实验。<strong>LIBERO 是仿真、代码与数据都开源，2 卡 L20 量级完全可做</strong>
- <strong>② "知识保留" vs "更好初始化"的分离实验</strong>：用 Task k+1 的主干去学一个<strong>全新的、之前没见过的任务</strong>。如果也更快，那第三个发现的解释就不成立。<strong>这是全文逻辑最脆的一环，也是最容易做的反驳实验</strong>
- <strong>③ 把 U 型曲线的深度做成模型规模的函数</strong>（接 Self-Training 9/22）：小模型 vs 大模型 × 有/无回放，看自训练的 U 型是变浅还是消失
- <strong>④ 测任务顺序敏感性</strong>：固定顺序是这个领域的经典弱假设，换几个顺序看结论稳不稳
- <strong>⑤ 测回放数据质量的依赖</strong>：把专家示范换成"用户自己的次优 rollout"，看 2% 这个阈值还成不成立——<strong>这直接决定方法在真实部署里能不能用</strong>
- <strong>⑥ 遗忘检测的成本值得单独研究</strong>：真实部署里"知道哪个技能掉了"可能比"恢复它"更贵
- <strong>⑦ 把同年同题的三篇放在一起读完</strong>：本篇 + <strong>Simple Recipe Works: VLAs are Natural Continual Learners with RL</strong>（arXiv 2603.11653）+ <strong>RL's Razor: Why Online RL Forgets Less</strong>。<strong>这一小组工作正在共同改写"机器人持续学习需要复杂算法"这个共识</strong>，值得作为一个小专题——而且它们的共同结论（"简单方法就够了"）与 lib 里 OPD 主线一直在加复杂度的方向形成有趣的张力

## 八、今日阅读结论

> 🎁 <strong>今日一句</strong>：<strong>"训练会伤害已有能力"不是一条普适规律，而是一个随「模型规模 × 预训练程度 × 实际更新参数的比例」变化的量；当模型足够大且被预训练过，一点点回放就能把伤害压到零——而"看起来忘掉"的技能，大多只是暂时取不出来。</strong>

- <strong>第一个贡献：把几十年的共识放进了新语境。</strong>"必须用大回放 / 复杂正则"是在从头训的小模型上得出的；换成 3B 预训练 VLA + 2% 回放，结论就反了，甚至出现正向后向迁移
- <strong>第二个贡献：把"遗忘"从指标层面拆到模块层面。</strong>VL 主干是主要遗忘源、动作头跨任务更一致；而换了 VL 主干后重新学旧任务只需 <strong>6%–10%</strong> 的步数 → <strong>旧知识还在表征里</strong>，忘的是"检索路径"而不是"知识本身"
- <strong>第三个贡献是方法论上的</strong>：明确区分"低遗忘"的两种来源（真记得 vs 学不动），并用 KT 曲线验证；还主动指出 NBT 在小缓冲下会被初始成功率主导
- <strong>最诚实的评价</strong>：结论有力、实验面很广（两种 VLA × 四个 suite × 三种回放规模 × 三层预训练 × 组件交换 × 恢复实验），<strong>但核心对照混了"规模"与"可训练参数比例"两个变量，而论文自己的附表已经暗示规模本身就能把 NBT 压到负数</strong>。如果这个混淆成立，那么结论的准确形式是"<strong>大模型 + 少改参数改变了持续学习动力学</strong>"，而不只是预训练 VLA——<strong>这个区别很重要，因为前者意味着任何大模型都适用</strong>
- <strong>对项目的直接价值</strong>：① "低遗忘必须配 KT 一起报"可以直接搬 ② 组件交换是最便宜的归因工具，且补上了 lib"分锅家族"的模块轴 ③ "恢复速度"作为评价维度值得引入 ④ 本篇与同年同题的另外两篇（RL 持续学习）值得作为小专题读完

<strong>主题标签</strong>：具身智能（VLA / 持续学习）（按轮换序列从世界模型（9/28 PERSIST）切出；上次该主题是 9/21 ThinkAct）
