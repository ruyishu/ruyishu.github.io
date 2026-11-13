---
title: '1112 ActGuide-RL：不会探的题别空转，把动作轨迹当提示塞进去'
description: '做搜索 agent 的强化学习时，一道题采 8 条轨迹如果全错，组内优势就是 0，这道题白采了。常见做法是先 SFT 冷启动，或者把全错组扔掉。ActGuide…'
pubDate: '2026-11-12'
---

> 2026-11-12 · 每日论文 #77 · 本周领域 <strong>推理 / Agentic</strong>，第 4 周第 4 篇：<strong>不会探的题别空转，把动作轨迹当提示塞进去</strong>。高德 AMAP · NeurIPS 2026 Poster

## TL;DR

<strong>一句话：做搜索 agent 的强化学习时，一道题采 8 条轨迹如果全错，组内优势就是 0，这道题白采了。常见做法是先 SFT 冷启动，或者把全错组扔掉。ActGuide-RL 不靠 SFT，而是把一条「只含工具名和参数、不含思维链」的动作清单按需塞进 prompt 当提示，让模型先走到能拿分的状态，再用混合策略把能力收回不带提示的模型。</strong>

- <strong>做法</strong>：每题先按普通 GRPO 采 8 条。全组都失败，才用二分搜索找最短的动作前缀，刚好能让某一条成功；然后带着这段提示再采 8 条，和原来的轨迹放在一起算优势。更新时，带提示的轨迹用「带提示的旧策略」做重要性比的分母，目标始终是不带提示的策略
- <strong>主结果（Qwen3-4B-Instruct）</strong>：相对零 RL，GAIA 25.24 → 35.92（+10.68），WebWalkerQA 12.06 → 39.85（+27.79），XBench 18.00 → 37.00（+19.00），BrowseComp-ZH 15.26 → 20.41（+5.15）。作者说和「先用 30B 专家做 SFT 再 RL」差不多
- <strong>消融</strong>：去掉自适应（固定提示长度）GAIA 掉到 27.18；再去掉「只在全组失败时才提示」掉到 24.27；去掉混合策略优化掉到 22.32，几乎退回零 RL
- <strong>⚠️ 先说几个坑</strong>：① 嘴上说用「日常人类交互里现成的动作」，实验里的提示其实是 Tongyi-DeepResearch-30B-A3B 拒绝采样抽出来的，还是要更强的专家；② 「和 SFT+RL 持平」并不均匀：WebWalker / XBench 赢很多，BrowseComp-ZH 是 20.41 对 26.30，反而输了；③ 附录第二个例子的第一条搜索词里已经写了答案 33；④ 仓库没放动作数据和权重，脚本默认 1k 条、论文写 2k；⑤ 奖励是对照标准答案的 LLM 评委，不是可验证执行；论文里评委还另占一台 8×H20

## 文献信息

| 字段 | 内容 |
|-|-|
| 标题 | Learning Agentic Policy from Action Guidance |
| 作者（PDF / arXiv） | 9 人：Yuxiang Ji（厦大 / 高德 AMAP，实习期间完成，共同一作）、Zengbin Wang（AMAP，共同一作）、Yong Wang（AMAP，项目负责人）、Shidong Yang、Ziyu Ma、Guanhua Chen（南方科技大学）、Zonghua Sun、Liaoni Wu、Xiangxiang Chu（AMAP） |
| 作者（NeurIPS 注册） | 也是 9 人，<strong>和 PDF 对不齐</strong>：Zengbin Wang 写成 BUPT；Shidong Yang 的注册名只剩 Yang、机构为空；Xiangxiang Chu 写成 DreamX of Alibaba；Yuxiang Ji 只写了厦大。照实记录，不调和 |
| 机构 | PDF 写三家：Xiamen University，AMAP, Alibaba Group，Southern University of Science and Technology |
| 会议 | <strong>NeurIPS 2026 Poster</strong>。一手证据：NeurIPS 官方 neurips-2026-orals-posters.json（9278 条）id 148912，decision 逐字 Accept (poster)，eventtype Poster，OpenReview uFfbpmnN58。阳性对照：同表 AgentBrew（148366）为 Accept (poster)，Knowing When to Ask（149224）为 Accept (spotlight)。arXiv abs 页没有 Comments / Journal-ref 字段，证明不了录用 |
| arXiv | 2605.12004（Submitted on 12 May 2026，目前 v1） |
| 代码 | 论文写 <a href="https://github.com/AMAP-ML/ActGuide-RL">AMAP-ML/ActGuide-RL</a>，GitHub 已重定向到 <a href="https://github.com/Yux1angJi/ActGuide-RL">Yux1angJi/ActGuide-RL</a>。Apache-2.0，15 star，最后推送 2026-05-13。README 写 Codebase released. (work in progress) |
| 仓库有什么 | 基于 verl。有普通 GRPO 脚本 train\_searchagent.sh，也有主方法脚本 train\_searchagent\_actguide.sh；配置 multiturn\_grpo\_actguide.yaml；数据预处理、DeepResearch 工具服务、评测脚本 |
| 仓库缺什么 | 没放训练后权重；没放论文用的 2,000 条 RL 数据和 30B 专家抽出的动作轨迹；脚本默认样本是 1k，和论文 2k 不一致；搜索要 Serper API key；奖励默认走本地 vLLM 评委服务 |
| 底座与算力 | 主实验 Qwen3-4B-Instruct-2507，另报了 Qwen2.5-3B / 2.5-7B / Qwen3-8B。训练：8×H20，1 机，AdamW，lr 1e-6，KL 系数 0.001，数据 2,000，64 step，batch 32，PPO mini-batch 16，每题 8 条，最大回复 40,960，观察 8,000，最多 30 轮，clip 0.2。论文写评委另占一台 8×H20。工具只有 web-search 和 web-visit，原始网页直接塞进上下文，没有额外摘要模型 |

## 一、先看例子（大白话：西伯克郡议会，以前是哪个党掌权？）

> 💡 <strong>题目（论文附录 D，训练数据里的例子）</strong>：在以某个伯克郡村子命名的选区第一次出现的那次选举之前，哪个政党最后一次整体控制 West Berkshire Council？那个村子和 1974 年 7 月 Kennet &amp; Avon Canal 修到 Hungerford Wharf 有关；那次选举打成平手，后来补选，保守党才拿到多数。

<strong>标准答案</strong>：自由民主党（The Liberal Democrats）。

<strong>普通零 RL 会卡在哪</strong>：这题要先查运河修复对应哪个村子，再查哪一年西伯克郡改了选区、哪一次选举打成平手。底座模型如果 8 次都没搜到关键页，组内全是 0 分，GRPO 的优势就是 0，这道题白跑了。

<strong>ActGuide-RL 怎么做</strong>：训练时在问题后面追加一段「参考动作轨迹」，只写工具名和参数，不写思考。这篇例子给了 12 步，前几步是：

- search「Kennet &amp; Avon Canal restored to Hungerford Wharf July 1974」
- search「West Berkshire Council election tied result by-elections Conservatives…」
- visit https://en.wikipedia.org/wiki/West\_Berkshire\_Council\_elections

提示里写明：轨迹可能不完整，你还得自己补工具调用。模型要自己写思考、自己决定跟不跟、跟到哪一步可以自己走。

<strong>这个例子说明的事</strong>：提示不是把整条思维链拿来做 SFT，只是给一张「先搜什么、再打开哪一页」的清单，把模型从过不去的区间拽到还能拿分的状态。

<strong>但例子本身也有毛病</strong>。同一附录的第二题，问题问的是无限棋盘上马走两步能到多少格，标准答案写成 33；可提示的第一条搜索词就是「knight moves two moves reachable squares infinite board 33」——<strong>答案已经写进搜索词里了</strong>。第三条例子里还出现了 grokipedia.com、eBay 商品页这种来源。所谓「现成动作数据」其实很脏，而且有的步骤已经把答案泄掉了。

## 二、动机

![论文 Figure 1。左：模型只能在自己够得着的 In-Region 拿分，Out-Region 被一道 Barrier 挡住；作者把动作数据画成一座桥。右上：简单题不给提示，Pass@K 也能随采样次数涨上去。右下：难题不给提示一直是 0，加上动作提示之后曲线才起来](/images/paper-reading/2026-11-12-actguide-rl/2026-11-12-d78-1.webp)

- <strong>Agentic RL 吃的是自己采到的分</strong>：一组轨迹里要有对有错，才能算出优势。全对或全错，优势就是 0
- <strong>到达性障碍（reachability barrier）</strong>：有些题不是「再多采几次就行」，而是模型从当前状态出发，怎么走都到不了给分的状态。论文把它叫 Out-Region。这时加大组大小也没用
- <strong>常见补救是 SFT 冷启动或课程学习</strong>：先用带思维链的示范把模型拉进能拿分的区间，再做 RL。代价是要高质量的完整轨迹，还容易伤到域外能力
- <strong>作者想用更轻的东西</strong>：任务构造、后台日志、GUI/CLI 操作里，经常已经有「做了哪些动作」，只是没有思考过程。与其补写思维链或直接模仿动作，不如把这些动作当成计划提示

<strong>我的看法</strong>：问题提得准，和本周 D-CORE 里「SFT 之后一组分数全挤在一起、优势为 0」是同一类事。但 Figure 1 把动作数据画成 GUI、游戏、日常点击，正文实验用的却是 30B 搜索专家抽出来的工具调用，叙事和实验不是同一批数据。

## 三、方法

![论文 Figure 2。左边是普通 agentic RL：组里只要有一条成功就正常更新，全失败就停在 Out-Region。右边是 ActGuide-RL：动作清单按前缀从短到长排，先找最短能成功的长度，再把带提示和不带提示的轨迹放在一起，用混合策略优化把能力收回不带提示的模型](/images/paper-reading/2026-11-12-actguide-rl/2026-11-12-d78-2.webp)

### 3.1 动作当成计划，不是当成必须复述的前缀

- 一条参考动作 g = (α1, …, αL)，只保留工具名和参数
- 直接拼进问题：Follow the partial action trajectory hint… Reference action trajectory hint: …
- 论文还试过两种更「硬」的注入：把动作当成助手已经生成的前缀，或把工具调用和返回值重放成多轮对话。附录 Table 7 里，计划式提示的 Reward@1 是 85.70，对话重放 80.10，助手前缀 74.50，不给提示 57.90。所以他们最终选了最轻的那种：放在用户问题里当参考，而不是逼模型复述

![论文 Figure 3。沿着带提示的轨迹，逐步截断后再让模型自己往下走，看 Pass@32。简单题很早就能自己拿到分；中等和困难题要走到 Barrier-Cross 之后，红色曲线才起来。蓝色柱是带提示和不带提示的 logit 差，障碍附近差得最凶](/images/paper-reading/2026-11-12-actguide-rl/2026-11-12-d78-3.webp)

作者的解读：提示不是在替模型做决定，而是把它带到一个「自己接着走也能得分」的状态。困难样本要更长的前缀才能过坎。

### 3.2 最小干预：只在全组失败时，用最短够用的前缀

- 提示越长，越容易过坎，但轨迹也越偏离当前策略，后面当 off-policy 数据就越危险
- 所以原则是：每道题只用刚刚够用的最短前缀
- 实现很简单。先不给提示采 8 条；只要有一条成功，这题就当普通 GRPO。8 条全失败，才对前缀长度做二分搜索，找到最短的 k\*，再带着 g\_k\* 采 8 条，和原来的失败组合并
- 推理时不给任何提示。训练时多出来的提示只是脚手架

### 3.3 混合策略优化：把带着提示学到的东西，写回不带提示的模型

- 带提示和不带提示是同一套参数，只是输入里多没多那段清单
- 优势还是组内相对优势。重要性比要分两种：不带提示的轨迹，分母是不带提示的旧策略；带提示的轨迹，分母是带提示的旧策略，分子始终是不带提示的当前策略。也就是说，更新目标一直是「测试时那个不看提示的模型」
- 他们故意不加 LUFFY、Guide 那类额外的比率整形，理由是最小干预已经把分布差控制住了

<strong>奖励</strong>：不是代码执行，是对照标准答案的 LLM 评委，模板来自 Tongyi-DeepResearch，只输出 CORRECT / INCORRECT，当 0/1 用。

## 四、实验

### 4.1 主结果（Table 1）

![论文 Table 1。四个底座上都报了零样本、普通 RL、ActGuide-RL。Qwen3-4B 上 ActGuide 相对普通 RL：GAIA 平均 +10.68，WebWalker +27.79，XBench +19.00，BrowseComp-ZH +5.15。Qwen2.5-7B 做普通 RL 时，GAIA 从 22.32 掉到 11.65；加上 ActGuide 才回到 25.24](/images/paper-reading/2026-11-12-actguide-rl/2026-11-12-d78-4.webp)

- 训练集：从 ASearcher 抽 2,000 题。动作提示由 Tongyi-DeepResearch-30B-A3B 拒绝采样，只留下正确轨迹里的工具调用
- 评测：GAIA 文本子集 103 题，WebWalkerQA 680 题，XBench 100 题，BrowseComp-ZH 289 题。另有 GPQA、TruthfulQA、IFEval 做域外
- 同底座的普通 RL，数据、步数、组大小都一样，只是没有动作提示
- Qwen3-4B 上提升最大，尤其是更难的 WebWalker 和 XBench。Qwen3-8B 也会涨，但幅度小一些（GAIA +4.85，XBench +11.00）
- 表里也列了 WebSailor-7B、ARPO-8B、WebThinker-32B-RL。ActGuide 的 4B/8B 并没有全面超过 WebThinker-32B（GAIA 48.5），不要把主表读成刷新搜索 agent 的 SOTA

### 4.2 和 SFT+RL 比（Table 2）

![论文 Table 2。同一底座上：零 RL、零 RL+ActGuide、SFT、SFT+RL、SFT+ActGuide。SFT 冷启动来自另一批、同样由 30B 专家采出来的 4,000 条完整轨迹（含思维链）](/images/paper-reading/2026-11-12-actguide-rl/2026-11-12-d78-5.webp)

- 作者的结论是：不加 SFT 的 ActGuide，已经和 SFT+RL「差不多」，而且不像 SFT 那样掉域外分（GPQA 35.45 → SFT 后 29.15，ActGuide 反而是 36.93）
- <strong>逐列看就没那么齐</strong>：ActGuide 在 WebWalker（39.85 对 SFT+RL 的 32.20）和 XBench（37.00 对 17.00）明显更好；BrowseComp-ZH 是 20.41 对 26.30，GAIA 是 35.92 对 36.89，这两列并不赢
- 一个奇怪的数字：SFT 之后再做普通 RL，XBench 从 25.00 掉到 17.00，加了 ActGuide 才回到 25.00。这说明他们这条 SFT+RL 基线本身不稳定，拿它说「持平」要打折扣

### 4.3 消融和其他分析

| 方法 | GAIA | WebWalker | XBench |
|-|-|-|-|
| ActGuide-RL | 35.92 | 39.85 | 37.00 |
| 去掉自适应（固定提示长度） | 27.18 | 35.00 | 34.00 |
| 再去掉「只在全组失败时才提示」 | 24.27 | 23.82 | 19.00 |
| 去掉混合策略优化 | 22.32 | 21.76 | 21.00 |

- 最小干预和混合策略都不是摆设：提示给少了过不去，给多了又偏；不把带提示的轨迹写回不带提示的策略，测试时就不会用
- Figure 7 还比了固定 0 / 25% / 50% / 100% 前缀，还是自适应最好
- 训练过程中，能提供有效信号的组占比，ActGuide 一直高于普通 RL（Figure 5）；交互轮数和回复长度也会逐渐变长。把测试时的轮数上限从 2 放到 32，GAIA 从 0.97 涨到 35.92，说明多出来的轮次不是空转
- 往动作里随机插入 10% 无关步骤，GAIA 反而从 35.92 涨到 39.81，XBench 从 37.00 涨到 38.00；到 20% 才明显下降。作者说「对噪声不敏感」，但没解释为什么 10% 还会涨
- 附录还做了 OPSD：不改变采样状态，只在同样的轨迹上，用「带提示的 logits」当老师。GAIA 36.89（略高于 ActGuide 的 35.92），但 WebWalker 只有 30.29、XBench 只有 26.00。作者的解释：OPSD 改变不了模型去哪些状态，过不了到达性障碍

## 五、Limitations

论文有独立的 Limitations（附录 E），写了三条：主实验只做了搜索 agent；只用了计划式提示，没试逐步注入；没有讨论动作数据该怎么系统收集和清洗。这三条都属实。

<strong>我另外读出来的问题：</strong>

- <strong>叙事和数据来源不一致</strong>：引言把动作数据说成日常人类交互、GUI/CLI 日志，实验用的是 30B 专家的工具调用。没有人类日志实验，「减少对 SFT 的依赖」只是换成了对更强专家的依赖——只不过专家轨迹被剪掉了思维链
- <strong>「和 SFT+RL 持平」过大</strong>：四列里两列赢、两列不赢；SFT+RL 自己在 XBench 上还掉点。公平说法是：在部分更难的搜索基准上，动作提示可以接近甚至超过这条 SFT+RL，不是全面替代
- <strong>提示质量成疑</strong>：附录例子把答案写进搜索词，还混进不可靠链接。没有人工检查动作轨迹的正确率，也没有「把答案从查询里抠掉」的对照
- <strong>奖励不是可验证的</strong>：有标准答案，却不用字符串匹配或规则，而是再上一个 LLM 评委。评委模型和规模没写清，论文还为它单开了 8 张卡
- <strong>仓库复现门槛</strong>：15 star，迁到个人账号，标着 work in progress；动作数据和权重都没放；训练脚本是 1k 不是 2k；搜索和评委都是外部服务
- <strong>和已有工作的边界</strong>：正文自己提到了 Guide（自适应提示）和 LUFFY（混合策略 off-policy）。核心差别是「只用动作、不用思维链，并且按最小干预来给」。这个差别成立，但不是全新框架，更像把提示从完整示范改成了动作清单
- <strong>评测规模</strong>：GAIA 只用 103 道文本题。Lv.3 从 0 到 16.66，按 12 题估算大概是多对了 2 道，波动会很大

## 六、前文对照

- <strong>11/10 D-CORE</strong>：也碰到「一组分数全一样、优势为 0」。D-CORE 的办法是用 token 熵顶上继续推；ActGuide 的办法是给动作提示，把全错组变成有对有错的组。一个改优势计算，一个改采样。可以并在一起做
- <strong>11/11 ArenaRL</strong>：开放任务没有标准答案，用两两对战排名。这篇其实是有标准答案的搜索题，却仍然用 LLM 评委判对错，评委方案更接近 ArenaRL，而不是 D-CORE 那种可验证工具奖励
- <strong>11/09 Context-Folding、更早的 OPSD / SDFT</strong>：附录把动作提示拿去当 OPSD 的老师，GAIA 还行，WebWalker / XBench 明显不如把提示用在采样上。这和「老师再好，学生自己走不到那个状态也没用」是同一句话

## 七、启发与待跟进

- 把「全错组扔掉」（DAPO 动态采样）和「全错组加动作提示再采」直接对比，这是最干净的对照，论文没做
- 动作清单不必来自 30B 专家：任务反推、环境日志、成功轨迹里剥掉思维链，都值得试。关键是别把答案写进搜索词
- 同一套脚手架可以接到工具调用、GUI、终端 agent 上，论文自己也说还没验证
- 仓库已经把普通 GRPO 和 ActGuide 写成两个脚本，改提示来源或改「何时启用提示」的门槛，都比较好接
- 评委如果能换成规则或执行校验，会比现在更干净

## 八、结论

ActGuide-RL 想解决的事很具体：agentic RL 在模型够不着奖励时会停摆，不必为此先做一轮贵的 SFT，可以把更便宜的动作清单当成按需提示，过了坎再把能力收回自己。在 Qwen3-4B 的搜索基准上，这个想法相对零 RL 的提升是清楚的，消融也指向「少给、按需给、还要写回不带提示的模型」。但「日常动作数据、不再依赖 SFT」说得比实验大，数据和权重也还没放出来。

<strong>今日一句</strong>：一组全错就别空转——把动作清单当最短提示塞进去，过了坎，再让模型自己走。
