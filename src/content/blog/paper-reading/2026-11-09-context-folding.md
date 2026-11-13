---
title: '1109 Context-Folding：开分支干脏活，干完只留一句总结'
description: '长任务 agent（深度搜索、修代码）最大的瓶颈是上下文越堆越长。这篇给 agent 两个新工具：branch（开一个子分支去做一件小事）和 return（做完…'
pubDate: '2026-11-09'
---

> 2026-11-09 · 每日读论文 #74 · 本周领域 <strong>推理 / Agentic</strong>（第 4 周第 1 篇）· <strong>让 agent 自己开分支去干费 token 的活，干完把过程折叠掉、只留一句总结</strong> · ByteDance Seed + CMU + Stanford · ICML 2026 Poster

## TL;DR

<strong>一句话：长任务 agent（深度搜索、修代码）最大的瓶颈是上下文越堆越长。这篇给 agent 两个新工具：branch（开一个子分支去做一件小事）和 return（做完返回主线，只带回一段总结，分支里的搜索结果、网页正文、命令输出全部从上下文里删掉）。再用 RL（FoldGRPO）教它什么时候该开分支、分支里别跑题。</strong>

- <strong>名字</strong>：机制叫 Context Folding（上下文折叠），训练算法叫 <strong>FoldGRPO</strong> = GRPO + 折叠后的上下文 + 三条 token 级过程惩罚（主线太长罚、分支跑题罚、工具调用失败罚）
- <strong>主结果（Seed-OSS-36B，单个上下文 32K，最多 10 个分支）</strong>：BrowseComp-Plus pass@1 从 <strong>0.420 → 0.620</strong>，SWE-Bench Verified 从 <strong>0.492 → 0.580</strong>。对照：327K 长上下文 ReAct 加 GRPO 是 <strong>0.540 / 0.574</strong>，摘要式管理加 GRPO 是 <strong>0.527 / 0.550</strong>
- <strong>压缩效果</strong>：训完后主线平均只有 <strong>7,752</strong> token（BrowseComp-Plus）和 <strong>8,885</strong> token（SWE），论文案例里 4 个分支把 <strong>107K</strong> 的完整上下文压到 <strong>6.5K</strong>
- <strong>外推</strong>：把多道简单题拼成一道大题，训练时最多 10 个分支，拼 50 道题时它平均开了 <strong>32.6</strong> 个分支，准确率明显高于 1M 上下文的 ReAct
- <strong>⚠️ 先说几个坑</strong>：① 正文说 FoldGRPO 比普通 GRPO 在 BrowseComp 上 <strong>+7.7</strong>，但它自己 Table 1 是 0.620 − 0.567 = <strong>+5.3</strong>；② SWE 上对 327K ReAct+GRPO 只多 <strong>0.6</strong> 个点（500 题里约 3 题，贪心单次）；③ 仓库是<strong>重写版</strong>，README 自己说可能和论文用的代码不一样，过程奖励的实现和论文描述也有出入（见第五节）；④ 主实验是 36B，没写用了多少卡

## 文献信息

| 字段 | 内容 |
|-|-|
| 标题 | Scaling Long-Horizon LLM Agent via Context-Folding（ICML 官方列表题目是 Scaling Long-Horizon Agent via Context Folding，少了 LLM 两个字） |
| 作者 | Weiwei Sun、Miao Lu（共同一作）、Zhan Ling、Kang Liu、Xuesong Yao、Yiming Yang、Jiecao Chen（通讯 Weiwei Sun、Jiecao Chen）。7 人顺序 PDF 和 ICML 官方列表一致；<strong>唯一差别</strong>：ICML 列表把第二作者写成 Lu Miao，PDF 和 arXiv 写 Miao Lu，应是姓名顺序录入不同，照实记录 |
| 机构 | PDF 首页：ByteDance Seed、CMU、Stanford，并注明前两位作者的工作是在 ByteDance Seed 完成的。ICML 官方注册：Sun 和 Yiming Yang 写 CMU，Miao Lu 写 Stanford，Zhan Ling 写 UC San Diego，Kang Liu、Xuesong Yao、Jiecao Chen 写 ByteDance。<strong>Zhan Ling 两处不一致</strong>（PDF 署 ByteDance Seed，注册是 UCSD），照实写 |
| 发布时间 | arXiv:2510.11967，<strong>只有 v1</strong>（2025-10-13），PDF 日期 2025-10-15，共 22 页，正文约 11 页。<strong>camera-ready 没有上传到 arXiv</strong>，下面的数字都来自 v1 |
| 会议 | <strong>ICML 2026 Poster（Accept regular）</strong>。一手来源 ① <strong>ICML 官方 virtual 全量数据</strong>（count=6797）命中，id <strong>61950</strong>，eventtype=Poster，decision 逐字 Accept (regular)，session 逐字 Poster Session 1，poster\_position #3408，paper\_url 指向 OpenReview forum <strong>lNRgWoGfYg</strong>；阳性对照 SCoRe（64717）、RAGEN-2（71062，spotlight）同表命中 ② arXiv abs 页<strong>没有 Comments 也没有 Journal-ref 字段</strong>，所以 arXiv 本身证明不了录用。OpenReview 本次没有直接复核 |
| 链接与代码 | <a href="https://arxiv.org/abs/2510.11967">arXiv:2510.11967</a> · <a href="https://github.com/sunnweiwei/FoldAgent">代码 sunnweiwei/FoldAgent</a> · <a href="https://context-folding.github.io/">项目页</a> · <a href="https://icml.cc/virtual/2026/poster/61950">ICML 页面</a> |
| 仓库完整度 | <strong>能跑起来，但不是论文原版</strong>：<strong>202 star / 14 fork，Apache-2.0</strong>，7 个 open issue，创建于 2025-10-09，最后推送 2026-05-19（北京时间 02:44）。<strong>有</strong>：基于 verl agent\_loop 的 FoldGRPO 实现（adv\_estimator=foldgrpo）、fold\_agent.py（分支与折叠逻辑、过程奖励）、BrowseComp-Plus 本地检索服务（Qwen3-Embedding-8B）、Qwen3-8B 训练脚本 train\_bc\_qwen3\_8b.sh、BrowseComp 和 SWE-Bench 评测脚本（SWE 跑在 Modal 云沙箱上）、ReAct 和摘要 agent 两个基线。<strong>缺</strong>：① README 原话说这是 open-source re-implementation，may differ from the code we used to train the model in our paper ② <strong>没有任何权重</strong>（HF 上按作者搜不到）③ 训练数据放在 Google Drive ④ 只有 BrowseComp 的训练脚本，<strong>SWE 训练配方没放</strong>（论文的 740 条 SWE 训练题也没给）⑤ 打分和分支跑题判定都要调 OpenAI 接口 ⑥ 2026-05 才修了 issue #10 的 process\_reward\_mask 赋值错误，之前拉的代码过程奖励可能不对 |
| 性质 | <strong>agent 框架 + RL 训练配方</strong>，不改模型结构，只加两个工具和一个上下文管理器。任何「多轮工具调用 + 最终可验证」的任务原则上都能套。<strong>⚠️ 本篇没有独立 Limitations</strong>，只在结论里提了「多层折叠」这一个未来方向 |
| 底座 | 论文：<strong>Seed-OSS-36B-Instruct</strong>（字节开源 36B）。仓库示例：<strong>Qwen3-8B</strong>。分支跑题判定用 <strong>GPT-5-nano</strong>，BrowseComp-Plus 对错用官方 LLM 判官 |
| 训练配置 | 论文：verl，rollout batch <strong>32</strong>、每题 <strong>8</strong> 条、PPO batch <strong>128</strong>、lr <strong>1e-6</strong>、不加 KL、clip 上界 <strong>0.28</strong> 下界 <strong>0.2</strong>，异步 rollout 最多落后 <strong>5</strong> 步，训 <strong>50 步（约 2 epoch）</strong>，单上下文 <strong>32,768</strong>、最多 <strong>10</strong> 个分支（理论总量 327,680），推理贪心解码。<strong>论文没写用多少张卡</strong>。仓库 Qwen3-8B 脚本：1 机 8 卡、vLLM TP=8、参数和优化器都 offload、训 <strong>100</strong> 步、每轮最多生成 2,048 token、主线最多 100 轮；检索服务建议放在另一台机器上 |
| 数据与评测 | BrowseComp-Plus：作者自己把这个基准切成 <strong>680 训练 / 150 测试</strong>，测试集按 ReAct 跑 8 次的成绩分成易、中、难各 50 题；工具是 search 和 open\_page，网页截到 4,096 token。SWE：测试用 SWE-Bench Verified 全部 500 题；训练用 SWE-Gym 和 SWE-Rebench 的子集，挑基线 8 次里成功率在 0 到 87.5% 之间的 <strong>740</strong> 题。<strong>都是单次贪心结果，没有方差</strong> |

## 一、先看例子（大白话：查一篇论文，主线只看到 6.5K token）

> 🧪 <strong>题目（论文 Figure 7，BrowseComp-Plus）</strong>：找一篇 2023 年 6 月之前发表的出版物，讲文化传统、科学过程和烹饪创新，三个作者，其中一个是西孟加拉邦的助理教授，另一个有博士学位。答案：The Fundamentals of Bread Making: The Science of Bread。

<strong>普通 ReAct 的做法</strong>：每次 search 返回 10 条结果，每条带 512 token 摘要，每次 open\_page 再塞进 4,096 token 正文，全部堆在同一个上下文里。这道题前后一共读了 <strong>107,008</strong> token，32K 的窗口早就爆了；就算给 327K，模型也要在一大堆旧网页里找线索。

<strong>Context Folding 的做法</strong>（主线视角）：

1. <strong>branch：找符合主题和作者条件的出版物</strong>。分支里搜了 5 次、打开 1 个教师主页，return 回来一句：找到一本 Value-Added Products with Bioactive Compounds from Fruit……
2. <strong>branch：核对作者人数和博士身份</strong>。又搜了 5 次，return：确认 Rahel Suchintita Das 是西孟加拉邦的助理教授……
3. <strong>branch：确认 Das 的博士学位和合作者</strong>。搜了 5 次，return：<strong>没找到确定证据</strong>。这个分支失败了，但失败过程也被折叠掉，主线只记住「这条路不通」
4. <strong>branch：扩大范围找三作者出版物</strong>。搜 2 次、开 1 页，return：找到一篇全部满足条件的
5. 主线 finish，答对

主线自始至终只看到「4 个分支各自的任务描述 + 4 段返回总结」，<strong>一共约 6,524 token</strong>。中间那些搜索结果和网页正文用完就扔。要点是：<strong>扔掉的时机由 agent 自己决定，正好卡在一个子任务做完的时候</strong>，不像摘要式方法那样在上下文满了的那一刻硬切。

![项目页 / 论文 Figure 1。左：深度搜索，黄色是开分支的那一轮，蓝色框里的搜索和浏览都在分支里完成，返回后只留下一句结论。右：修代码，找文件、grep、改代码都放进分支，主线只保留我理解了问题和我改好了这类总结](/images/paper-reading/2026-11-09-context-folding/2026-11-09-d75-1.webp)

## 二、动机

- <strong>长任务的上下文是线性增长的</strong>：ReAct 把每一轮思考、工具调用、工具输出全部往后拼。BrowseComp 一道难题动辄十几次搜索、几十个网页，SWE 一道题几十次 bash，上下文很快到十万量级。后果两个：模型在超长上下文里找信息能力下降，注意力和 KV cache 开销也越来越大
- <strong>已有两条路都不理想</strong>：<strong>摘要式</strong>（MemAgent、ReSum，以及同一批作者前一篇的 RL 摘要方法）是上下文满了就触发一次总结，相当于在思路正走到一半时被打断。<strong>多 agent 式</strong>（Anthropic 的多 agent 研究系统等）要人先设计好分工流程，换个任务就要重写，也很难端到端训练
- <strong>作者的判断</strong>：上下文管理应该是 agent 自己学会的一项本事，而不是外部写死的规则。所以把「开分支 / 返回」做成普通工具，让 RL 去教

## 三、方法

![项目页 / 论文 Figure 2。左（a）：主线遇到子任务就 branch，子任务里正常调用工具，return 后回到主线，主线只多一条返回消息。右（b）：FoldGRPO 每题采 G 条树状轨迹，按折叠后的上下文计算概率，最终奖励 R 加上过程奖励 Q 一起算优势](/images/paper-reading/2026-11-09-context-folding/2026-11-09-d75-2.webp)

### 3.1 两个工具和一个折叠器

- <strong>branch(description, prompt)</strong>：description 是 3 到 5 个词的子任务名字，prompt 是给分支的详细指令。调用后进入分支
- <strong>return(message)</strong>：子任务做完时调用，message 写结果。调用后把分支里从 branch 之后到 return 之前的所有轮次<strong>从上下文里删掉</strong>，主线只追加一条模板消息，内容就是 message
- <strong>两种状态</strong>：主线负责规划和拆任务，<strong>不鼓励在主线里做费 token 的工具调用</strong>；分支负责执行，<strong>分支里不能再开分支</strong>，避免嵌套
- <strong>推理时很省</strong>：所有分支和主线共享同一段前缀。return 时直接把 KV cache 回滚到开分支之前的位置，再接上返回消息，不用重新算前缀
- <strong>和多 agent 的区别</strong>：子 agent 不是预先定义的，是主线临时创建的；所有 agent 共享前缀；主线和分支是交替执行，不是并行

### 3.2 FoldGRPO：GRPO 的两处改动

- <strong>改动一：按折叠后的上下文算概率</strong>。每个 token 的条件概率用的是折叠后的历史，而不是完整历史。实现上不是把整条轨迹拼成一个序列，而是<strong>主线和每个分支各存一条独立的因果序列</strong>（论文附录 A.1），所以不能直接套进原版 verl，要改训练框架
- <strong>改动二：token 级过程奖励 Q 加进优势</strong>。优势 = (clip(R + Q, 0, 1) − 组内 R 的均值) / 组内 R 的标准差，R 是最终对错（0 或 1）。三条惩罚见下面的编号列表

1. <strong>主线太长罚</strong>：主线长度超过上下文上限的 <strong>50%</strong> 时，主线里除了开分支那几轮之外的所有 token，Q = <strong>−1</strong>。逼它把费 token 的事挪到分支里
2. <strong>分支跑题罚</strong>：每个分支结束后，让 <strong>GPT-5-nano</strong> 看分支的任务指令和返回消息，判断它有没有做了任务以外的事。跑题就给整个分支 Q = <strong>−0.2</strong>
3. <strong>工具调用失败罚</strong>：工具调用报错的那一轮，Q = <strong>−1</strong>

- <strong>两个不起眼但重要的工程细节</strong>：① <strong>异步 rollout</strong>：长任务的 rollout 时间差异很大，主进程完成 95% 的题就开始训练，剩下 5% 交给一个单独进程跑完、下一步再用，最多落后 5 步，作者说没看到掉点 ② <strong>系统提示词</strong>：BrowseComp 的提示词是参照 Claude Deep Research 改的，Seed-OSS-36B 用它能到 <strong>0.478</strong>，用 BrowseComp-Plus 默认提示词只有约 <strong>0.08</strong>

## 四、实验

### 4.1 主结果（论文 Table 1，BrowseComp-Plus 150 题，SWE-Bench Verified 500 题）

| 方法（底座 Seed-OSS-36B） | 上下文 | BC-Plus | BC 工具调用 | SWE-V | SWE 工具调用 |
|-|-|-|-|-|-|
| ReAct 32K | 32K | 0.286 | 3.8 | 0.436 | 25.8 |
| ReAct 32K + GRPO | 32K | 0.446 | 5.5 | 0.480 | 27.8 |
| ReAct 327K | 327K | 0.478 | 10.8 | 0.552 | 49.5 |
| ReAct 327K + GRPO | 327K | 0.540 | 10.2 | 0.574 | 55.4 |
| 摘要 agent | 32K × 10 | 0.386 | 17.4 | 0.488 | 77.0 |
| 摘要 agent + GRPO | 32K × 10 | 0.527 | 18.0 | 0.550 | 74.9 |
| 折叠 agent（不训练） | 32K × 10 | 0.420 | 12.9 | 0.492 | 72.8 |
| 折叠 agent + 普通 GRPO | 32K × 10 | 0.567 | 16.0 | 0.564 | 79.5 |
| <strong>折叠 agent + FoldGRPO</strong> | 32K × 10 | <strong>0.620</strong> | 19.2 | <strong>0.580</strong> | 96.5 |
| 参照：GPT-5（ReAct） | 327K | 0.793 | 14.2 | 0.718 | 42.6 |
| 参照：DeepSeek-V3.1（ReAct） | 327K | 0.613 | 10.6 | 0.610 | 53.2 |

<strong>怎么读这张表</strong>：

- <strong>不训练时</strong>，折叠 agent（0.420）已经比 32K ReAct（0.286）和摘要 agent（0.386）好，但不如 327K ReAct（0.478）
- <strong>RL 带来的增量最大</strong>：BC-Plus 列 0.420 → 0.620，SWE 列 0.492 → 0.580
- <strong>FoldGRPO 对普通 GRPO 的增量</strong>（同为折叠 agent）：BC-Plus 列 <strong>+5.3</strong>（0.567 → 0.620），SWE 列 <strong>+1.6</strong>（0.564 → 0.580）
- <strong>和最强同底座基线（327K ReAct + GRPO）比</strong>：BC-Plus 列 +8.0，SWE 列只有 <strong>+0.6</strong>
- BC-Plus 上 0.620 略高于 DeepSeek-V3.1 的 0.613，但离 GPT-5 的 0.793 还差 17 个点；SWE 上 0.580 低于 V3.1 的 0.610

### 4.2 关键消融：FoldGRPO 到底改变了什么行为（论文 Table 2）

| 折叠 agent | BC 完成率 | BC 主线长 | BC 不跑题 | BC 分支数 | SWE 完成率 | SWE 主线长 | SWE 不跑题 | SWE 分支数 |
|-|-|-|-|-|-|-|-|-|
| 不训练 | 0.806 | 12,195 | 0.774 | 3.51 | 0.781 | 47,475 | 0.473 | 3.05 |
| + 普通 GRPO | 0.738 | 22,285 | 0.762 | 3.88 | 0.612 | 48,908 | 0.419 | 3.80 |
| <strong>+ FoldGRPO</strong> | <strong>0.935</strong> | <strong>7,752</strong> | <strong>0.895</strong> | 4.98 | <strong>0.962</strong> | <strong>8,885</strong> | <strong>0.754</strong> | 5.90 |

- <strong>普通 GRPO 会把行为训坏</strong>：主线反而变长（BC 12,195 → 22,285），在上下文用完前完成任务的比例下降（SWE 0.781 → 0.612），分支更容易跑题。也就是说只用最终对错奖励时，模型学会了「在主线里多干活」，而不是「把活挪到分支里」
- <strong>FoldGRPO 把这些拉回来</strong>：SWE 主线从 47,475 压到 8,885，完成率 0.962。这是这篇最有说服力的一张表，因为它直接对应了三条惩罚的设计目的
- <strong>但这是整体消融</strong>：只比了「三条惩罚全加」和「全不加」，<strong>没有单独去掉某一条</strong>的结果，所以不知道哪一条最重要，跑题判定那条要不要调 GPT-5-nano 也无从判断

### 4.3 长度和难度外推（论文 Figure 5）

![论文 Figure 5。左：横轴是最大总长度（千 token），分支数从 0 加到 16，折叠 agent 始终高于 ReAct，过了 320K 基本不再涨。右：把 1 到 50 道简单题拼成一道大题，ReAct 上下文给到 1M，题越多折叠 agent 优势越大](/images/paper-reading/2026-11-09-context-folding/2026-11-09-d75-3.webp)

- <strong>左图</strong>：两种方法都在约 256K 到 320K 之后饱和，作者解释是大部分题在这个长度内已经做完了
- <strong>右图</strong>：拼 50 道题时，折叠 agent 训完约 <strong>0.69</strong>，ReAct 训完约 <strong>0.38</strong>（这两个数是我从图上读的，论文没给表）。训练时最多 10 个分支，这里平均用了 <strong>32.6</strong> 个，说明分支数可以外推

### 4.4 其他数字

- <strong>难度分组（Figure 3）</strong>：RL 在易、中、难三组都涨，中、难两组涨得更多；难题上训练过程中单题响应总长从约 <strong>100K</strong> 涨到 <strong>160K</strong> 以上
- <strong>训练速度（Figure 8）</strong>：327K ReAct 每步 rollout 时间是折叠 agent 的 <strong>1.52 倍</strong>，每个训练步是 <strong>1.43 倍</strong>。注意论文自己说 rollout 时间只统计了主线
- <strong>并行分支</strong>：试了同时开多个分支，BC-Plus <strong>0.6133</strong>，和单分支 0.620 差不多；平均开 2.3 个并行分支，读的网页更多（110 对 80），但没变准。作者猜是 BrowseComp 的题偏深度优先

## 五、Limitations

### 5.1 论文自述

⚠️ <strong>本篇没有独立 Limitations</strong>。结论里只提了一句未来方向：多层折叠（折叠后的内容还能再折叠）。并行分支那一节承认在 BrowseComp 上没带来提升。

### 5.2 我读出的问题

1. <strong>数字打架</strong>：4.1 节正文说 FoldGRPO 比普通 GRPO 在 BrowseComp 上 <strong>+7.7%</strong>，SWE 上 +1.6%。SWE 对得上（0.580 − 0.564），BrowseComp 按 Table 1 是 0.620 − 0.567 = <strong>+5.3</strong>，换成相对提升也是 9.3%，都不是 7.7。可能是正文和表格来自不同版本的实验，camera-ready 没上 arXiv，没法核对改没改
2. <strong>SWE 上的「超过长上下文基线」很勉强</strong>：0.580 对 0.574，500 题里差 3 题，贪心单次、没有方差。摘要写 matches or outperforms，SWE 这一列只能说打平
3. <strong>「省」的说法要打折</strong>：省的是<strong>单次调用看到的上下文长度</strong>，不是总花费。SWE 上 FoldGRPO 平均 <strong>96.5</strong> 次工具调用，327K ReAct 只有 55.4；难题上单题总 token 训完反而从 100K 涨到 160K 以上。训练速度那张图又只统计主线时间。论文没给一张「每题总生成 token / 总 GPU 时间」的对比表
4. <strong>代码和论文描述对不上</strong>：我看了仓库的 fold\_agent.py，① 过程奖励<strong>只在最终答对时才施加</strong>（这和论文公式里 clip(R+Q, 0, 1) 的效果一致：R=0 时负的 Q 被截成 0，等于惩罚对失败轨迹不起作用，但论文没把这一点说出来）② 分支不跑题时<strong>额外给 +0.2</strong>，论文只写了跑题 −0.2、其余为 0 ③ 如果整条轨迹<strong>一个分支都没开</strong>，主线所有 token 记 −1，等于强迫它开分支，论文没提。加上 README 自己说是重写版，用这份代码复现论文数字要做好对不上的准备
5. <strong>评测集是作者自己切的</strong>：BrowseComp-Plus 830 题被切成 680 训练、150 测试，同分布训练再同分布测试；难度分档用的又是同一个底座 ReAct 跑 8 次的结果。和别家在完整 BrowseComp 上报的数没法直接比
6. <strong>提示词的作用远大于方法本身</strong>：同一个 36B 模型，换一套仿 Claude Deep Research 的提示词就从约 0.08 到 0.478。表里 GPT-5 等大模型用的是不是同一套提示词，论文没写清楚
7. <strong>依赖闭源接口</strong>：分支跑题判定用 GPT-5-nano，BrowseComp 对错也是 LLM 判官。跑题判定的误判率没有分析，判官松紧会直接影响 −0.2 这条惩罚的效果
8. <strong>缺单项消融和小模型结果</strong>：三条惩罚只有全开 / 全关对比；论文只在 36B 上做，仓库给了 Qwen3-8B 脚本但<strong>没有 8B 的结果数字</strong>，单机 8 卡能复现到什么程度不知道
9. <strong>基线来自同一个团队</strong>：摘要 agent 基线和同一批作者前一篇 RL 摘要方法（arXiv 2510.06727）是一类，参考文献里也列了。用自家前作当被超越的对象本身没问题，但这条基线是不是调到了最好，外人没法判断

## 六、前文对照

- <strong>HiPER（10-30）</strong>：那篇让 agent 显式写出「我现在在做哪个子目标」，再按子目标做层级信用分配。Context Folding 也有「子任务」这个概念，但用途不同：HiPER 用子任务来<strong>分功劳</strong>，这篇用子任务来<strong>扔上下文</strong>。对比落到「子任务边界拿来干什么」这一列
- <strong>SCoRe（11-06）</strong>：上周最后一篇，深搜任务用 Qwen3-8B、搜索只看摘要片段、最多 8 轮，所以根本没遇到上下文爆炸的问题。这篇的 BrowseComp-Plus 要打开网页、动辄十几次搜索，正好是 SCoRe 没覆盖的长任务场景
- <strong>RAGEN-2（09-16）、EAPO（10-15）</strong>：都在处理多轮 agent RL 训歪的问题。RAGEN-2 发现模板化崩塌、用奖励方差过滤；EAPO 把探索和决策拆开训。这篇 Table 2 里普通 GRPO 让主线变长、完成率下降，也是一种「只给结果奖励就训歪」的例子，解决办法是加针对性的过程惩罚
- <strong>NPR（11-05）</strong>：那篇教模型「分头想」，并行推理再汇总。这篇试过并行分支，结论是在 BrowseComp 上没用。两篇放在一起看：<strong>并行有没有用取决于任务是宽搜还是深挖</strong>
- <strong>GiGPO（09-08）、GraphGPO（10-06）</strong>：都在改优势怎么算。FoldGRPO 的优势公式几乎没改，只是把过程惩罚加到奖励上再截断，改动主要在「上下文怎么构造」，属于另一条线

## 七、启发与待跟进

- <strong>值得当 baseline 吗</strong>：<strong>思路值得</strong>，「让 agent 自己决定什么时候扔上下文」是长任务 agent 的一个通用部件，Apache-2.0、有 Qwen3-8B 的单机 8 卡脚本、带 ReAct 和摘要两个基线，搭起来比大多数 agent 论文容易。<strong>但要自己补</strong>：没有权重、没有 8B 的参考数字、SWE 训练配方缺失、判官要走 OpenAI 接口
- <strong>最想验证的</strong>：① 用仓库在 Qwen3-8B 上跑一遍，看 FoldGRPO 对普通 GRPO 的增量在小模型上还在不在 ② 三条惩罚逐条去掉，尤其是 GPT-5-nano 跑题判定那条，看能不能换成规则（比如按返回消息和任务指令的相似度）③ 补一张「每题总 token 和总时间」对比表，把「省」说清楚 ④ 在宽搜任务（WideSearch）上测并行分支，作者自己也这么建议
- <strong>本周接着读 ④ 推理 / Agentic</strong>：可以顺着长任务 agent 往下看，比如同在 ICML 2026 的 ACON（微软，上下文压缩）、RE-TRAC（微软，深搜轨迹压缩），和这篇放在一起比较三种管理上下文的思路；选之前照例查重和核仓库

## 八、结论

<strong>这篇的价值是把「上下文管理」从外部规则变成了 agent 自己调用的两个工具，再用三条很直白的过程惩罚把这个行为训出来。</strong>最扎实的证据是 Table 2：只用结果奖励时，模型反而把主线越写越长；加上惩罚后，主线压到 8K 左右、完成率到 0.93 以上。但「超过长上下文基线」在 SWE 上只是打平，正文和表格的 FoldGRPO 增量对不上，总花费没算账，仓库是重写版且奖励实现和论文有出入。拿来当长任务 agent 的起点不错，拿来引用具体数字要小心。

> 💡 <strong>今日一句：</strong>与其给 agent 一个更大的记事本，不如教它做完一件事就把草稿撕掉、只抄下结论；但撕得省不省，要看总账，不能只看桌上剩几张纸。
