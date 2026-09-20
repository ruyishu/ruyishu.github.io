---
title: 'MiniCPM5-2B 深度调研：2B 端侧「通用智能体」的全栈开源解剖'
description: '在手机、PC、车机这类资源受限设备上，尝试把「通用 Agent」这件事跑起来。'
pubDate: '2026-09-08'
---

**调研日期：2026-09-08 · 体裁：深度技术报告 · 信源：以 GitHub / Hugging Face 官方仓库、模型卡、数据集卡、论文摘要与主流媒体报道交叉核实（口径差异处理见文末）**

# 一句话结论

面壁智能与 OpenBMB 于 2026-09-07 正式发布并**全栈开源** MiniCPM5-2B：一枚总参数 2.52B（非嵌入 1.98B）的标准 LlamaForCausalLM 稠密模型，原生 128K 上下文，Apache-2.0 协议。它不只是一枚「模型」：官方同时把**中间检查点（Base / Midtrain / SFT / 最终版）**、**UltraData 系列训练数据**（预训练语料、代码语料、Agent SFT、可验证 RL 数据）、**训练配方（Recipe）**、**RL 工程框架 Meshy** 与 **critic 强化学习算法 JustRL II** 一并开放，做到「权重 + 数据 + 训练基建」的真·全栈开源，这在 2B 级端侧模型里几乎是头一回。

在能力上，官方内部评测 34 项基准平均 53.9 分，超过同对比组里所有更大的 4B 级参考模型（最高 51.1）；第三方 Artificial Analysis 综合智能指数发布时达 23 分，位居 4B 以下开源模型第一（高于 Gemma 4 12B 与 Qwen3.5 9B 的 22 分），Agentic Index 20 分断层领先同量级（同级多在 2\~9 分）。训练上最值得注意的是后训练管线 **SFT（400B tokens 深度思考数据）→ 多领域 RL teachers（16 个专家，含 5 个智能体专家）→ OPD（在线策略蒸馏回单模型）**，RL + OPD 让推理与通用能力平均提升 10.96 分、智能体能力平均提升 6.96 分。

> 本文是「极其详细」版的深度调研：先给事件与背景，再拆模型规格、评测、训练配方、数据账本、RL 基建、生态矩阵，最后给出开源成色评估与客观局限。正文中的图为官方仓库原图（来自 OpenBMB/MiniCPM 与 OpenBMB/Meshy），表格数据均转录自官方模型卡。

# 发布速览与时间线

MiniCPM5 是面壁智能（ModelBest）与 OpenBMB 开源社区维护的端侧（on-device）稠密语言模型系列，主打「小参数、强能力、易部署」。MiniCPM5-2B 是该系列继 MiniCPM5-1B（2026-05 发布）之后的第二款模型，定位面向本地助手、编码智能体、工具调用工作流与偏好紧凑模型的推理场景——一句话：在手机、PC、车机这类资源受限设备上，尝试把「通用 Agent」这件事跑起来。

## 官方时间线（GitHub Changelog 与 HF 版本日期核实）

| 时间 | 事件 |
|-|-|
| 2026-02-08 | UltraData 平台上线，提出 L0–L4 分层数据管理框架（配套论文 arXiv 2602.09003，2026-02-09 提交） |
| 2026-05-19 / 05-25 | MiniCPM5-1B 发布（系列首款，同日发布配套部署/微调 Agent Skills） |
| 2026-05-28 | UltraData-SFT-2605（1B 核心 SFT 数据，1500 万+ 样本）发布 |
| 2026-07-10 前后 | UltraX 精炼预训练语料方案论文/代码/数据/模型开源（UltraX 精炼语料：5 个语料各约 20B tokens；精炼器模型为 0.6B 级 UltraX-0.6B-Preview） |
| 2026-09-07 | **MiniCPM5-2B 正式开源**；同日发布 UltraData-Code、UltraData-SFT-Agent-2609、UltraData-RL-2609 等数据，以及 RL 框架 Meshy（GitHub 仓库当天开放） |
| 2026-09-08 | 中文科技/财经媒体集中报道：「2B 参数打赢 12B 模型」「端侧智能体可行性获初步验证」（界面新闻、时代周报/新浪财经、网易科技等） |

## 一句话解读这次开源的位置

把「开源」拆开看，MiniCPM5-2B 的这次动作至少包含五层：第一层是**权重全格式**（BF16、GGUF、MLX、GPTQ + 投机解码草稿模型 DSpark），第二层是**过程检查点**（Base → Midtrain → SFT → 最终），第三层是**训练数据**（UltraData 家族，从原始网页语料到 RL 样本），第四层是**训练方法与工程**（Recipe、Meshy 框架、JustRL II 算法、OPD 蒸馏方案），第五层是**生态接入**（9 大主流推理后端 + FlagOS 九类芯片适配 + 4 个微调框架 + Cursor/Claude Code 可用的 Agent Skills）。

行业通常只做第一层（权重）；做满五层的开源极少。值得注意的一个诚实边界：官方仓库里**没有独立的评测（eval）代码仓库或 eval/ 目录**，评测以「模型卡全量榜单数值（内部复现）+ AA 等第三方复测 + † 标注的官方分数」形式公开——「eval 全开源」的说法需要按此口径理解，详见本文第六节的核实结论。

# 模型规格与技术解读

## 官方规格

| 属性 | MiniCPM5-2B |
|-|-|
| 架构 | 标准 LlamaForCausalLM（无需自定义 kernel、无需 fork 模型代码） |
| 类型 | Causal Language Model（稠密 Dense Transformer） |
| 总参数量 | 2,516,756,480（约 2.52B） |
| 非嵌入参数量 | 1,981,982,720（约 1.98B） |
| 层数 | 42 |
| 注意力头（GQA） | 16 Q / 2 KV |
| 上下文长度 | 131,072（128K，原生） |
| 建议采样参数 | temperature=1.0，top_p=0.95 |
| 思考模式切换 | 通过 tokenizer.apply_chat_template 的 enable_thinking 开关控制（官方 Python 示例默认开启） |
| 许可证 | Apache-2.0（权重 + 仓库代码） |
| 语言 | 英语、中文（模型卡标签） |

## 三个技术要点解读

**① 标准 LlamaForCausalLM 是「生态即推理引擎」。**MiniCPM5-2B 刻意不搞私有架构：vLLM、SGLang、llama.cpp、Ollama、MLX、Transformers 都能零改动直载，官方部署矩阵覆盖 9 个后端，社区甚至无需等任何一家先适配——这是端侧模型快速铺开的决定性设计。对比可见：官方明确要求 transformers≥5.6、vllm≥0.21、sglang[srt]≥0.5.16 即代表其直接对齐各家最新主线。

**② GQA 与 128K 原生上下文。**16 Q / 2 KV 的低 KV 头设计显著压缩长上下文下的显存与带宽开销，配合 42 层深而窄的网络（非嵌入仅 1.98B），是「2B 级能把长上下文与 Agent 工作流做扎实」的结构基础。长上下文是官方评测里优势最大的域之一（如 NoLiMa 68.1 vs 同级最高 17.1、AA-LCR 59.0 vs 同级最高 28.7）。

**③ 「快速对话 / 深度思考」同一权重双模式。**官方样例用 enable_thinking=True 让模型输出先推理后回答；MiniCPM5-1B 的文档进一步说明 Think 模式建议 temperature=0.9、No-Think 模式 0.7，供端侧按任务与功耗预算动态选择——对手机/PC 上「闲聊快回、任务深想」的分场景体验很关键。

## 与 MiniCPM5-1B 的关系

MiniCPM5-2B 是 1B 配方在参数规模上的直接放大（README 原文：scales up the same training recipe）。两者共享同一套 UltraData 数据管理框架、同样的「SFT → RL → OPD」后训练三步走，以及同款 Base/SFT/中间检查点开放节奏；1B 的后训练细节公开得更早（200B tokens deep-thinking SFT + 200B tokens hybrid-thinking SFT，Reasoning RL 基于 DAPO-Math-17k、参考 JustRL 的 lock-step GRPO 超参并采用两阶段长度调度），2B 则把 deep-thinking SFT 的量提到 400B tokens，并把 RL 阶段升级为 JustRL II 的 critic 方案 + 更大规模的专家矩阵（详见训练配方一节）。

# 能力评测：34 项基准 + 第三方复测

## 官方内部评测总览

面壁在模型卡与 README 中把 MiniCPM5-2B 与同量级强开源模型做了一组严格对比：2B 级对手为 **LFM2.5-2.6B、Qwen3.5-2B、Gemma-4-E2B-it**；另列出更大的参考模型 **Qwen3.5-4B、granite-4.2-3B、Nemotron-3-Nano-4B、Gemma-4-E4B-it、LFM2.5-8B-A1B**。口径上，除标注 † 的分数来自 Artificial Analysis 官方发布外，其余为面壁内部复现；行内最优用加粗与颜色标注（蓝色 = 含 4B 级在内的全场最佳，黑色 = 2B 级组内最佳）。

结论一句话：**对比组内平均 53.9 分，2B 级开源 SOTA，且同时超过组内所有更大的 4B 级参考模型（最高 51.1）。**官方自己总结其优势最突出在五个域：代码推理、数学推理、长上下文理解、工具使用与多个 agentic 任务。下图是官方发布的「分域能力雷达图」——注意它只绘制了最具代表性的四个模型（MiniCPM5-2B、Qwen3.5-4B、granite-4.2-3B、LFM2.5-2.6B），九个轴分别是 Code Reasoning、Math Reasoning、Instruction Following、General Knowledge、Long Context、Tool Use、Coding Agent、Search Agent、General Agent，轴最大值为 100%：

![这是MiniCPM5-2B等四个模型的分域能力雷达图，对比覆盖Code Reasoning、Math Reasoning、Instruction Following等九个领域的表现，各领域轴最大值为100%。其中MiniCPM5-2B以蓝色标识，平均得分53.9，在Code Reasoning领域达到满分100%，Long Context、Tool Use等领域也处于领先位置。Qwen3.5-4B以红色标识，平均得分51.1，在Search Agent、Coding Agent领域表现突出。granite-4.2-3B以绿色标识，平均得分42.7，在Instruction Following领域得分接近满分。LFM2.5-2.6B以橙色标识，平均得分33.2，整体在各领域的表现均弱于另外三个模型。](/images/tech-report/minicpm5-2b-deep-dive/MiniCPM5-2B-深度调研-2B--1.png)

**图 1 · MiniCPM5-2B 分域能力雷达图（来源：OpenBMB/MiniCPM 仓库 assets/minicpm5_2b_public_leaderboard_radar_en.png）**

雷达图视觉上很直观：MiniCPM5-2B（蓝色）几乎在所有轴上都压住 Qwen3.5-4B（红色，avg 51.1）之外的所有对手，在 Math Reasoning 一轴接近满分；granite-4.2-3B（绿色，avg 42.7）仅在 Instruction Following 一轴反超蓝色；LFM2.5-2.6B（金色，avg 33.2）基本整体落在最内圈。也就是说，2B 相对 4B 的「反超」不是单项运气，而是域级全线压制。

## 全量对比榜单

官方另发布了一张完整的公开榜单对比图，覆盖全部 9 个模型 × 34 项基准，并带行内最优加粗与 † 标注（蓝色圆点 = 全场最佳，黑色圆点 = 2B 组最佳；† = 分数来自 AA 官方发布，其余为面壁内部复现）。原图如下，其后附与模型卡一致的逐项数值表（便于检索与引用）：

![图片展示了MiniCPM5-2B与基线模型在28个类别和48个类别模型上的评估结果。其中，MiniCPM5-2B在28个类别模型中平均得分为53.9，各项能力如代码推理、数学推理等均有具体得分；在48个类别模型中，平均得分为32.1。各模型在不同类别下的得分也呈现出来，如MiniCPM5-2B在Code Reasoning类别中得分为69.1，在Math Reasoning类别中得分为86.5等。该图与上下文紧密相关，直观呈现了MiniCPM5-2B在基准测试中的表现。](/images/tech-report/minicpm5-2b-deep-dive/MiniCPM5-2B-深度调研-2B--2.png)

**图 2 · MiniCPM5-2B 公开榜单对比（来源：assets/minicpm5_2b_public_leaderboard_en.png）**

下表与官方模型卡逐格一致。两处读数口径：AIME 2025 / AIME 2026 双年都做到 86.5，同级对手普遍在 30\~45；LCB-Pro (Medium) 上全场仅 MiniCPM5-2B 突破 0（17.5）；SWE-bench Verified 46.4 是全场唯一上双位数的 2B（比 4B 参考组最好的 36.8 还高近 10 分）。

| Benchmark | MiniCPM5-2B | LFM2.5-2.6B | Qwen3.5-2B | Gemma-4-E2B-it | Qwen3.5-4B | granite-4.2-3B | Nemotron-3-Nano-4B | Gemma-4-E4B-it | LFM2.5-8B-A1B |
|-|-|-|-|-|-|-|-|-|-|
| **Average** | **53.9** | 33.2 | 28.0 | 24.6 | 51.1 | 42.7 | 32.6 | 31.2 | 28.4 |
| Code Reasoning — LiveCodeBench v6 | **69.1** | 42.1 | 20.2 | 42.9 | 56.4 | 58.9 | 50.7 | 53.9 | 39.8 |
| Code Reasoning — LCB-Pro 25Q2 (Easy) | **68.0** | 30.9 | 10.3 | 27.1 | 58.3 | 54.6 | 51.6 | 45.8 | 27.8 |
| Code Reasoning — LCB-Pro 25Q2 (Medium) | **17.5** | 0.0 | 0.0 | 0.0 | 7.0 | 5.3 | 5.3 | 1.8 | 0.0 |
| Code Reasoning — OJBench | **32.5** | 11.2 | 2.6 | 11.6 | 24.8 | 21.8 | 20.0 | 19.0 | 8.2 |
| Code Reasoning — SciCode (wbg) | **26.3†** | 14.2† | 2.8† | 20.9† | 16.1† | 24.9† | 16.4† | 24.4† | 7.8† |
| Math Reasoning — AIME 2025 | **86.5** | 41.9 | 29.6 | 31.7 | 78.8 | 79.4 | 56.3 | 37.1 | 46.0 |
| Math Reasoning — AIME 2026 | **86.5** | 45.2 | 29.0 | 39.8 | 82.7 | 83.5 | 62.1 | 45.0 | 56.7 |
| Math Reasoning — HMMT Feb 2026 | 63.8 | 33.7 | 20.5 | 17.8 | **64.0** | 60.8 | 51.3 | 30.1 | 38.5 |
| Math Reasoning — MATH-500 | 94.6 | 89.6 | 85.8 | 85.4 | **99.0** | 97.0 | 91.6 | 88.2 | 93.2 |
| Instruction Following — IFBench | 66.3 | 59.0 | 46.0 | 25.7 | 59.0 | **73.0** | 58.3 | 28.3 | 51.0 |
| Instruction Following — IFEval | 86.7 | **93.4** | 77.5 | 31.4 | 90.2 | **93.7** | 88.0 | 44.4 | 90.8 |
| Instruction Following — Multi-IF | 71.8 | **76.8** | 57.1 | 40.3 | 73.6 | 75.9 | 65.9 | 45.9 | 71.4 |
| General Knowledge — MMLU-Pro | 70.8 | 65.2 | 64.3 | 56.0 | **78.0** | 65.8 | 65.7 | 68.3 | 63.1 |
| General Knowledge — MMLU-Redux | 84.7 | 80.0 | 80.0 | 71.8 | **88.7** | 78.9 | 79.8 | 83.7 | 80.0 |
| General Knowledge — HLE | **8.9†** | 6.2† | 2.6† | 4.8† | **9.9†** | 6.6† | 4.9† | 3.8† | 6.9† |
| General Knowledge — GPQA-Diamond | **70.2†** | 55.8† | 45.6† | 43.3† | **77.1†** | 55.9† | 51.3† | 57.6† | 51.3† |
| General Knowledge — SuperGPQA | 40.8 | 26.2 | 38.6 | 30.3 | **52.8** | 39.9 | 37.8 | 38.7 | 34.5 |
| Long Context — AA-LCR | **59.0†** | 5.3† | 28.7† | 17.0† | **61.0†** | 24.3† | 17.3† | 33.0† | 0.0† |
| Long Context — NoLiMa | **68.1** | 0.7 | 17.1 | 3.9 | 43.5 | 5.1 | 1.1 | 2.3 | 0.5 |
| Long Context — LongBenchPro | 44.8 | 23.7 | 8.2 | 42.2 | **58.4** | 34.8 | 27.9 | 53.5 | 19.6 |
| Long Context — LongBench v2 | 43.7 | 30.3 | 24.9 | 33.2 | **47.3** | 36.0 | 32.0 | 42.7 | 30.4 |
| Tool Use — τ³-Bench Banking | **20.8†** | 7.2† | 2.1 | 3.9 | 6.8† | 5.6† | 1.2 | 4.1 | 3.4 |
| Tool Use — τ²-Bench Telecom | **97.1** | 90.4 | 69.0† | 20.8† | 92.1† | 40.9 | 28.1† | 20.8† | 16.1† |
| Tool Use — BFCL v4 | **66.6** | 61.1 | 43.6 | 36.6 | 56.8 | 52.2 | 43.7 | 47.0 | 49.2 |
| Coding Agent — SWE-bench Verified | **46.4** | 6.0 | 5.0 | 2.0 | 33.6 | 36.8 | 3.0 | 15.0 | 0.4 |
| Coding Agent — SWE-bench Pro | 14.4 | 0.6 | 0.8 | 0.0 | **28.2** | 12.3 | 0.1 | 3.3 | 0.4 |
| Coding Agent — Terminal-Bench v2.1 | 8.6† | 4.5† | 3.0† | 0.4† | **25.8†** | 13.9† | 3.8† | 1.9† | 1.9 |
| Search Agent — BrowseComp-ZH | **43.5** | 9.8 | 18.2 | 4.7 | 39.6 | 21.1 | 3.3 | 7.0 | 13.2 |
| Search Agent — BrowseComp Top100 | **39.7** | 13.7 | 19.3 | 6.0 | 33.3 | 19.0 | 4.7 | 6.3 | 9.7 |
| Search Agent — GAIA Text-103 | **88.7** | 49.5 | 47.9 | 30.1 | 78.6 | 57.3 | 26.5 | 39.5 | 41.1 |
| General Agent — GDPval-AA v2 | **19.6†** | 4.5 | 0.0 | 0.0 | 11.7 | 0.0† | 0.0 | 0.0 | 0.0 |
| General Agent — Claw-Gym | 59.2 | 19.3 | 25.5 | 31.3 | 51.6 | **60.0** | 33.7 | 37.9 | 2.7 |
| General Agent — WildClaw | **23.9** | 10.2 | 9.2 | 8.9 | 17.0 | 20.0 | 8.9 | 14.3 | 4.5 |
| General Agent — QwenClaw | **42.9** | 19.3 | 18.2 | 14.5 | 37.1 | 36.4 | 16.8 | 16.7 | 4.5 |

表注：蓝色加粗 = 该行全场（含 4B 级）最佳；黑色加粗 = 2B 级组内最佳；标 † 的分数来自官方 Artificial Analysis 发布，其余为面壁内部复现（MiniCPM5-2B 所在列为蓝色列）。数据源：openbmb/MiniCPM5-2B 模型卡。

## 第三方复测：Artificial Analysis

中文媒体与面壁官方宣发口径引用 Artificial Analysis（AA）的数据：发布时（AA 智能指数 v4.1.1）MiniCPM5-2B 综合智能指数 **23 分，位列 4B 以下开源模型第一**，并超过参数量为其近 6 倍的 Gemma 4 12B（22 分）与 Qwen3.5 9B（22 分），处于 AA 的「参数量—智能表现」帕累托前沿——这是「2B 打赢 12B」说法的原始出处，本质是**智能密度**叙事。在 AA 的 Agentic Index（智能体指数）上它拿到 **20 分**，而同量级（2\~4B）开源模型普遍只有 2\~9 分；AA 语境下其优势项包括 GDPval-AA v2（媒体报道 Elo ≈ 891，人类基线 1000；另有检索口径 831）与 τ³-Banking（约 21% 通过率，模型卡记为 20.8†）。AA 还观测到它完成标准评测任务平均仅消耗约 21K 输出 token（约 14K 思考 + 7K 回答），token 效率显著优于需要 26K\~34K+ 的 8B/9B 模型——对端侧的功耗与延迟是实打实的利好。

**口径提醒（重要）。**AA 的指数本身在持续重标定：第三方检索显示，在其后的指数版本（v4.2 / v4.3 重标定后）MiniCPM5-2B 的综合指数约为 15（或 14，视版本聚合），**仍居 sub-4B 开源模型第一**，但绝对值与 v4.1.1 的 23 分不同——引用 AA 分数时务必带上指数版本号，不同文章里的 23 / 20 / 15 并不矛盾，只是榜单版本不同。本文正文的「23 分」与「Agentic 20 分」为面壁官方与中文媒体发布的当时口径。

## 能力剖面：最强五域与诚实短板

把 34 项基准按域摊开看，MiniCPM5-2B 的能力剖面相当「偏科式优秀」：数学与代码推理、长上下文、工具调用与智能体任务全维度领先（AIME 双年 86.5、SWE-bench Verified 46.4、GAIA Text-103 88.7、τ²-Bench Telecom 97.1 都是碾压级数字）；纯知识类（MMLU-Pro 70.8 vs Qwen3.5-4B 78.0）与部分指令遵循项（IFEval 86.7 vs granite-4.2-3B 93.7、LFM2.5-2.6B 93.4）则不是组内第一，说明小参数在「知识面宽」与「严格格式跟随」上仍有天花板。

三处值得一提的剩余短板：其一，**HLE 8.9†**——极限长尾世界知识仍是所有小模型的软肋，2B 尤甚；其二，**LCB-Pro (Medium) 17.5** 与 **Terminal-Bench v2.1 8.6**、**SWE-bench Pro 14.4**——中高难度竞题编程与真实终端/仓库级工程任务还做不扎实（后者 4B 参考组最高 25.8/28.2）；其三，**纯文本定位**——MiniCPM5-2B 不含原生多模态（音视频理解），需要多模态能力的场景要与 MiniCPM-V 等配合。整体上，官方「2B 级开源 SOTA + 追平 4B」的表述在数据上站得住，但「≈4B 综合、个别项不及部分 4B」的细节也请读者看全表后自行裁量。

# 训练配方：从基座到 2B 端侧智能体

MiniCPM5-2B 的训练是 **UltraData 分层数据管理**（arXiv 2602.09003 提出的 L0–L4 框架）的一次「全栈实践」：先做基座训练（稳定训练 + 衰减训练）建立核心语言能力与训练稳定性，再做中期训练（mid-training）强化目标任务能力并适配目标数据分布，最后进入后训练三步走（SFT → RL → OPD）。官方用一张训练配方图把它画得很清楚，发布模型（MiniCPM5-2B）与过程检查点（-Base / -Midtrain / -SFT）一一对应，任何人都能按图复现：

![这张图是MiniCPM5-2B的训练配方图，清晰展示了模型从基座到2B端侧智能体的完整训练流程，与官方发布的过程检查点一一对应，可用于复现模型。训练流程分为预训练（Pre-Training）、监督微调（SFT）、强化学习与在线策略蒸馏（RL+OPD）三个阶段，预训练阶段包含Stable Training、不同时长的长短衰减训练，最终得到MiniCPM5-2B-Base；之后分为Mid-Training的不同阶段，形成MiniCPM5-2B-Midtrain，再开展Deep Thinking SFT得到MiniCPM5-2B-SFT。SFT阶段的内容作为学生，搭配Reasoning Task RL、General Task RL、Agentic RL三类教师强化对应能力，经过在线策略蒸馏（OPD）后，最终生成MiniCPM5-2B。](/images/tech-report/minicpm5-2b-deep-dive/MiniCPM5-2B-深度调研-2B--3.jpg)

**图 3 · MiniCPM5-2B 训练配方（来源：OpenBMB/MiniCPM 仓库 assets/minicpm5_2b_training_recipe.jpg）**

按官方训练配方图转录的完整流程（文字部分均已在图内核实）：

- **Pre-Training（基座）：**Stable Training → Short Decay（4K 上下文）→ Long Decay（上下文 32K → 128K → 512K 递增）→ 产出 MiniCPM5-2B-Base。
- **Mid-Training（中期）：**Base 进入虚线框内两步：Mid-Training (32K) 用 600B tokens → Mid-Training (128K) 用 400B tokens → 产出 MiniCPM5-2B-Midtrain。
- **SFT：**Midtrain 经过 Deep Thinking SFT（400B tokens 深度思考数据）→ 产出 MiniCPM5-2B-SFT。
- **RL + OPD（后训练收尾）：**SFT 分别进入三个并行 RL 方向——Reasoning Task RL（增强推理能力）、General Task RL（广谱能力）、Agentic RL（增强智能体能力），产出 Teachers 专家矩阵；SFT 同时作为 Student 进入 Online Policy Distillation（OPD），把 teachers 蒸馏回单一发布模型 MiniCPM5-2B。

把图里的 token 量加起来可以看到一个惊人的事实：仅图上标出的 Mid-training（600B + 400B）与 Deep Thinking SFT（400B）就已超过 1.4T tokens 的高质量精选数据——对一个「2B 非嵌入参数 1.98B」的模型，这是「小模型、大数据」路线的极致体现，也正是它能在推理/代码/长上下文上越级挑战 4B 的数据底气。

## RL + OPD：后训练的关键一步

官方把 RL + OPD 称为 MiniCPM5-2B 后训练的 key part。RL 阶段采用基于 critic 的算法（即下文 JustRL II 的技术文档所述方案），显著改善小模型长思维链 RL 的训练稳定性并带来跨域提升；OPD 则把 RL 阶段训出的 **16 个领域专家模型（含 5 个智能体专家）**合并回一个发布模型。官方公布的增益数字：在下列基准上，RL + OPD 使推理与通用能力平均提升 **↑10.96 分**，智能体能力平均提升 **↑6.96 分**。官方增益图如下：

![图片展示了RL + OPD带来的分数增益情况，分为推理与通用能力（Reasoning & General Capabilities）和智能体能力（Agent Capabilities）两部分。其中，推理与通用能力部分以蓝色条形图呈现，标注了增益分数；智能体能力部分以紫色条形图呈现，同样标注了增益分数。该图与上下文紧密相关，直观呈现了官方公布的增益数字，即在特定基准上，RL + OPD使推理与通用能力平均提升↑10.96分，智能体能力平均提升↑6.96分。](/images/tech-report/minicpm5-2b-deep-dive/MiniCPM5-2B-深度调研-2B--4.png)

**图 4 · RL + OPD 带来的分数增益（来源：assets/minicpm5_2b_rl_opd_score_gains.png）**

这张水平堆叠条形图分上下两组：上半「Reasoning & General Capabilities」（含 HLE、GPQA-Diamond、SuperGPQA、LiveCodeBench、LCB-Pro、SciCode、IFBench、IFEval、AIME 2025/2026、HMMT、NoLiMa、LongBenchPro、LongBench v2），下半「Agent Capabilities」（SWE-bench Verified、Terminal-Bench、τ³-Banking、τ²-Telecom、BFCL v4、BrowseComp-ZH/Top100、GAIA Text-103、GDPval-AA v2、Claw-Gym、WildClaw、QwenClaw）；蓝色为 SFT 基线（面壁内部评测），紫色为 RL + OPD 带来的增益，SFT 基线数字与增益之总和基本等于发布版榜单值（例如 AIME 2025：66.46 → 86.5，SWE-bench Verified：29 → 46.4，LCB-Pro Easy：45.36 → 68.0，GPQA-Diamond：48.53 → 70.2，GAIA Text-103：79.29 → 88.7，IFBench：50.67 → 66.3，HMMT：52.06 → 63.8）。图注说明 SFT 分数全部来自内部评测；GDPval-AA v2 一行同时报告 J&A 官方结果与内部结果，以反映与内部 SFT 基线的可比增益。

两处细节值得单独指出：其一，HLE（8.9）与 Terminal-Bench 基本看不到紫色增益条——数据与算法对这类「极限长尾」任务的作用有限，靠的是底子，这呼应了前文短板分析；其二，NoLiMa 一行的分数超出 100 刻度（属归一化口径下的特殊量纲，榜单表中对应 68.1），阅读该图时需注意纵轴不是统一百分比。

## JustRL II：把 2B 的小模型推到 128K 推理

RL 阶段使用的算法是 JustRL II（官方文档标题：Scaling Small LLMs to 128K Reasoning with a Critic）。其要解决的痛点是端侧小模型做长思维链（long-CoT）强化学习时常见的两类问题：**「越训越差」**（训练不稳定、长度塌缩）与 **GRPO 类无 critic 算法的粗粒度信用分配**。JustRL II 的答案是把一个 **critic（评论家）**引入 RL 环路，实现 **token 级（词元级）信用分配**，并配合 **长度自适应优势估计**——在 UltraData-RL-2609 数据集卡中官方给出了可复现证据：约 300 步 RL 内 AIME 2025 从 61 提升到 81，而最终消费该数据集的 MiniCPM5-2B 发布版把 AIME 2025 推到 86。技术上它与 JustRL（v1，arXiv 2512.16649 的 lock-step GRPO 配方）一脉相承：JustRL v1 的核心是超参复现即可让 1.5B 模型在 DAPO-Math-17k 上跑出强结果；MiniCPM5-1B 正是用的这条路线，2B 则升级为带 critic 的 JustRL II。

# 数据即资产：UltraData 开源账本

这次开源真正「重」的部分是数据。MiniCPM5-2B 的预训练、中期训练、SFT 与 RL 各阶段使用的语料几乎全部以 UltraData 家族名义发布在 Hugging Face 上，绝大多数同日（2026-09-07）上线，且都走 Apache-2.0 + 上游许可证叠加的授权模型。理解这批数据要先理解它的组织哲学：UltraData 论文（Data Science and Technology Towards AGI Part I: Tiered Data Management，arXiv 2602.09003，THU 系作者阵容）提出一个贯穿 LLM 训练全生命周期的 **L0–L4 五级数据分层框架**：L0 = 原始未整理资源（raw uncurated resources），L1 = 标准化清洗后的自然数据，L2 = 按学习目标精选（selected）的语料，L3 = 任务导向精炼（refined）数据，L4 = 有组织、可验证的知识（organized and verifiable knowledge，如 RL 可验证样本）。该框架强调「数据-模型共同进化」：模型自身参与数据管理（质量评分、内容编辑、合成），层级感知的数据利用能显著改善训练效率与模型性能（论文 16 页、3 图、7 表）。

## MiniCPM5-2B 相关数据集全家族

| 数据集 | 规模（官方） | 定位 / 对应训练阶段 |
|-|-|-|
| Ultra-FineWeb / -L1 / -L3 | en ≈1T + zh ≈120B tokens（L2）；L3：en 400B+ / zh 200B+ | 通用网页预训练语料（L2 精选层；MiniCPM5 系列核心预训练 web 数据） |
| UltraX-Preview（UltraX-FineWeb / -RedPajama-V2 / -AICC / -Ultra-FineWeb / -FineWeb-ProX-Doc） | 5 × ≈20B tokens；487GB；1.14 亿行 | 程序化编辑精炼的英文预训练语料（含质量过滤的 Ultra-FineWeb 精炼版） |
| UltraData-Code（-L2 / -L3） | L2 ≈400B tokens（2.67 亿行）；L3 ≈150B tokens（8120 万行）；共 1.22TB | L0–L3 分层代码数据管理，11 种语言，预训练 + 任务导向合成代码练习 |
| UltraData-Math | — | 数学语料（预训练/领域强化） |
| UltraData-SFT-2605 | 15,036,178 条（319GB） | 核心领域 SFT：Deep Thinking 6.49M + Non-thinking 8.55M（Math/Code/Knowledge/中文通用/IF/多语言） |
| UltraData-SFT-Agent-2609 | 483,661 条轨迹（宣称约 500K；54.2GB） | Agent SFT：通用 Agent / 工具调用 / 代码 Agent / 搜索 Agent 四方向 |
| UltraData-RL-2609 | 85,995 条（188GB） | 可验证 RL 数据：Math 37.7% / Code 27.5% / Long-Context 21.0% / Knowledge 13.8%；JustRL II 训练语料 |

下面分三组细读，重点看「质量是怎么控出来的」——这是这批数据比规模数字更值钱的部分。

## 第一组：预训练与代码语料（Ultra-FineWeb / UltraX / UltraData-Code）

**Ultra-FineWeb** 是 UltraData 框架 L2 精选层的通用网页语料：英文约 1T tokens、中文约 120B tokens（总计约 12.9 亿行 / 10.2TB）。它来自对 FineWeb 与 Chinese FineWeb 的高质量过滤，核心是「高效验证式过滤」——先用轻量 fastText 分类器低成本评估每条数据对训练的影响、再基于高质量种子优化正负样本，减少人工主观。同族还包括 L1（1T+ tokens，基础清洗去重）与 L3（英文 400B+ / 中文 200B+，Q&A 对生成与多风格改写）。官方卡片明确它是 MiniCPM5（以及 MiniCPM4）系列的核心预训练网页数据集。

**UltraX-Preview** 是另一条独立的预训练数据技术线：**不端到端重写，而是用轻量精炼模型预测「结构化编辑操作」再确定性执行**。操作空间只有 5 个函数：keep_all()、remove_all()、remove_lines(start,end)、replace_str(line,old,new)、add_line(base,sub_idx,content)，配套 LAM 行对齐映射与 DCR 动态上下文替换保证大规模执行的稳健。本次开源 5 个英文语料库（FineWeb / RedPajama-V2 / AICC / Ultra-FineWeb / FineWeb-ProX-Doc）各约 20B tokens。官方用 1B MiniCPM 模型每语料 20B tokens 从头预训练验证：五个语料平均最强，赢得 34/50 个「任务-语料」对，相对 Raw 平均 +2.00%、相对 ProX-C +1.53%；FineWeb 上 16B tokens（45.49）即超过 Raw/ProX-C 的 20B tokens（45.08/45.05）——精炼数据的「浓度」直接兑换训练效率。UltraX 论文 arXiv 2607.08646，配套精炼模型 openbmb/UltraX-0.6B-Preview，代码仓 github.com/openbmb/UltraX。

**UltraData-Code** 是代码域完整的 L0–L3 落地：L0 归档约 1.92 亿个公共 GitHub 仓库默认分支；L1 大规模清洗、格式规范化、MinHash-LSH 近重复去重；L2 用语言自适应选择框架（Qwen3-Embedding-0.6B 复用语义嵌入的角色/相关度/质量评分）从 L1 选出 ≈400B tokens 算法高密度代码（UltraData-Code-L2，11 种语言：cpp/cs/go/java/js/php/py/r/rb/rust/sh）；L3 再经「结构化合成协议」把每个算法实现转成编程练习（独立生成 task/analysis/solution/test 候选，保留计算意图），约 150B tokens（UltraData-Code-L3）。官方受控消融（10B-token / 1B 模型继续预训练）：L2 相对 L1 在 EvalPlus +7.80、MultiPL-E +5.13；L2 + L3 混合相对 L2-only 在 100B 扩展下 EvalPlus 57.06（+10.11）、MultiPL-E 39.54（+12.39）——这正是 MiniCPM5-2B 代码能力（SWE-bench 46.4）的数据来源之一。

## 第二组：SFT 数据（UltraData-SFT-2605 + UltraData-SFT-Agent-2609）

**UltraData-SFT-2605**（2026-05-28 首发，对应 MiniCPM5-1B 核心 SFT；2B 的 deep-thinking SFT 继续引用该家族）：最终发布 1503.6 万条 = Deep Thinking 648.8 万 + Non-thinking 854.8 万，覆盖 Math（549.9 万）、Code（578.8 万）、Knowledge（130.0 万）、Chinese-general（100.0 万）、IF（40.0 万）及多语言切片；六步管理流水线含「答案质量过滤」（深度思考数据要确认推理过程真的有助于学习分解与中间验证，而非空洞思考文本）与「单条数据验证」（70% 候选 + 30% 指令跟随做快速 SFT，预算上限 20B tokens、默认 3 epochs，逐个数据类找最优 epoch）。注意其访问需登录并同意共享联系信息。

**UltraData-SFT-Agent-2609** 是本次为 2B 新造的「端侧智能体」SFT 数据：483,661 条多轮轨迹，分布在四个方向——General-Agent 31.1 万条（64.3%，技能检索与调用、Office/文件工作流）、Tool-Use 8.28 万条（17.1%，函数调用、数据库、金融工作流、多轮工具）、Code-Agent 6.99 万条（14.5%，软件工程、跨环境 bug 修复）、Search-Agent 2 万条（4.1%，中英搜索、多跳问答、检索规划）。构建是六步流水线（任务准备 → 重写扩展 → 环境配置 → 跨 harness 采样 → 结果验证 → 轨迹组织），质量控制的亮点是 **turn 级掩码**：低质量/冗余轮次可从 SFT loss 中排除而不必丢弃整条轨迹——这是「Agent 轨迹贵、要物尽其用」的工程化答案。

## 第三组：RL 数据（UltraData-RL-2609）

UltraData-RL-2609 是 JustRL II 的训练语料，也是模型卡明说的 MiniCPM5-2B 核心 RL 数据集：85,995 条可验证奖励样本——Math 32,412（37.7%）、Code 23,665（27.5%）、Long-Context 18,046（21.0%，长文档多跳 QA，上下文内嵌在 query）、Knowledge 11,872（13.8%）。它最值钱的设计是六阶段构建里的「**可验证性优先**」：先过滤到只有「答案唯一、可自动检查」的任务，再做**奖励可靠性检查**（数学/知识由多个独立模型重解、按多模型共识重新标注，无共识即丢弃；代码在沙箱跑测试用例并交叉验证测试本身），然后做**难度校准**（在 RL 初始化检查点上多次 rollout 估计经验通过率：通过率 1 的移除、可学习的保留、通过率 0 但标签有效则保留并配在线动态采样权重），最后格式化与去污。数据源全部为公开数据集：Math = DAPO-Math-17k ∪ DeepScaleR-Preview ∪ DeepMath-103K；Knowledge = OpenScienceReasoning-2；Long-Context = HotpotQA / Qasper / MuSiQue + 内部合成；Code = OpenCodeReasoning / OpenCodeReasoning-2 / HardTests。

一条清晰的「可复现链路」就此闭合：想复现 MiniCPM5-2B 的人可以从这 8.6 万条 RL 样本出发，用官方开源的 JustRL II 设置与 Meshy 框架训出自己的 teachers，再用 OPD 蒸馏——这正是「全栈开源」与「只开权重」的本质差别。

# RL 工程与算法开源：Meshy × JustRL II × OPD

「全栈开源」里最能体现诚意的，是把**训练工程的骨架**也交出来。面壁同日（2026-09-07）开源了自研 RL 引擎 **Meshy**（github.com/OpenBMB/Meshy，Apache-2.0）。Meshy 的定位一句话：**面向 LLM 的、基于服务、数据驱动的异步强化学习引擎——没有中央控制器，没有 Ray**，底层基于 SGLang（推理/采样）与 torchtitan（分布式训练）。传统 RL 框架（如基于 Ray 的架构）里「driver 广播 RPC、转发每个 tensor」的中央协调模式被彻底拿掉：Inference、Rollout、Training、Teacher 都是对等的独立服务，彼此通过一个 TransferQueue（传输队列）交互——队列里的三条通道 Samples（样本）、Gate（门控信号）、GPU token（GPU 所有权令牌）同时承担数据面与控制面，「列就绪（column readiness）」是唯一的控制信号，服务之间不直接握手。训练节奏（同步 on-policy / 有界 off-policy / 全异步）只是同一个框架上的一个旋钮：通过调整 rollout 的 pacing window 切换，没有独立的同步/异步代码路径。官方架构图如下：

![这张图是Meshy架构图，展示了该RL框架的核心交互架构。架构以SPMD Ignitor作为顶层协调者，架构内包含Rollout Service、Inference Service、Training Service、Teacher Service四类对等的独立服务，每类服务内均有TQWorker，分别对应不同的引擎组件。这些服务间通过TransferQueue进行交互，队列设有Samples、Gate、GPU token三条通道，同时承载数据面与控制面功能。图中用不同颜色的线条区分了samples、gate信号、GPU token、权重、HTTP等各类交互信号，还标注了列就绪（readiness）作为唯一控制信号，无需服务间直接握手，实现了传统RL框架中央协调模式的革新。](/images/tech-report/minicpm5-2b-deep-dive/MiniCPM5-2B-深度调研-2B--5.png)

**图 5 · Meshy 架构图（来源：OpenBMB/Meshy 仓库 assets/architecture.png）**

按官方架构图转录：上层是 Recipe（配方定义）与 SPMD Ignitor（仅在启动阶段分发 ignite / 收集 ready，运行期去中心化）；中排四个对等服务——Rollout Service（CPU 调度 + GPU 推理，内含 SGLangClient / Dataset / Reward Fn）、Inference Service（SGLangEngine，GPU）、Training Service（TitanEngine，GPU，经 CKPT Engine 保存/加载权重）、Teacher Service（SpmdEngine，GPU）；右下「+ your role」表示用户可自由加入自定义服务。底部 TransferQueue 的蓝/橙/绿三色分别代表样本、门控、GPU 令牌三类异步数据流，轨迹日志由 Rollout 落盘。

从工程角度，Meshy 的差异化设计有三：其一，**部署拓扑是纯函数**——每台机器以 SPMD 风格本地推导完整拓扑，无需服务发现，错误配方启动即暴露；其二，**GPU 所有权用令牌流转**，任意数量的服务可以自由 colocate 共享同一批卡（推理与训练以不同方式切分同一批卡也支持，非对称 colocation）；其三，**轻量可调试**——每个服务一个日志、保留完整 traceback，服务停滞会以「未消费列堆积」的形式暴露。仓库自带多个可直接跑的 recipes：从最小示例 grpo_gsm8k（Qwen3-1.7B，1 卡）、justrl 系列（R1-Distill-Qwen-1.5B on DAPO-Math-17k，8 卡 colocate / 16 卡 disaggregate 三档节奏）到 math_grpo_minicpm5 系列（MiniCPM5 家族，支持 **128K 上下文、上下文并行、动态批处理、1024 in-flight 请求**的自定义优势塑形配方）。同一套「service + data-driven」设计从 1 卡可跑到多机，正是为「小模型长思维链 RL 要试很多组超参」这种科研场景设计的。

## 算法与方法的可复现闭环

与之配套的算法/方法文档全部公开：JustRL II 的技术文档在官方 Notion 页（Scaling Small LLMs to 128K Reasoning with a Critic）；OPD 的学术源头是 Thinking Machines 的 On-Policy Distillation 博客与论文（Rethinking On-Policy Distillation，arXiv 2604.13016），其具体做法官方描述为：在每个响应位置计算**学生与教师 logits 在全词表上的反向 KL 散度作为优势估计**，替代原基于验证器的优势；蒸馏数据直接复用各 RL teacher 的训练 prompts，无需额外构造语料；MiniCPM5-1B 的配方说明还公开了推理 RL 用 DAPO-Math-17k、两阶段长度调度的细节。HF MiniCPM5 collection 里另有一枚 **openbmb/JustRL-II-base-model**，说明 critic/RL 研究的基座也在开源清单内。

## 「训练与评测代码开源」核实结论

| 开源类别 | 已开源内容 | 核实备注 |
|-|-|-|
| 模型权重 | BF16 最终版 + Base/Midtrain/SFT 中间检查点 + DSpark 草稿 + GGUF/MLX/GPTQ | HF 与 ModelScope 双平台；HF MiniCPM5 collection 共 23 项 |
| 训练数据 | Ultra-FineWeb(L1/L2/L3)、UltraX-Preview、UltraData-Code(L2/L3)、UltraData-Math、UltraData-SFT-2605、-SFT-Agent-2609、-RL-2609 | Apache-2.0 + 上游许可证叠加；SFT-2605 需登录申请访问 |
| 训练代码/框架 | Meshy RL 引擎（含 recipes）、UltraX 精炼框架与分类器、MiniCPM 仓库 finetune/quantize 等目录 | Meshy/UltraX 独立 GitHub 仓库，Apache-2.0 |
| 训练配方与方法 | 训练配方图 + 阶段级 token 量、UltraData 论文、JustRL II 文档、OPD 方案、JustRL-II-base-model | 超参级细节（LR/batch/步数）官方未给全，1B 部分更细 |
| 评测（eval） | 模型卡 34 项基准全量数值（内部复现 + †AA 官方分） | **未发现独立评测代码仓或 eval/ 目录**（MiniCPM 仓库根目录 15 项无 eval）；「eval 全开源」需按「评测结果全公开 + 社区可自行复现公开基准」口径理解，若指评测 harness 代码，目前未见官方发布 |
| 部署与微调 | 9 个部署 Cookbook + 9 类芯片 FlagOS 版本 + 4 个微调框架 Cookbook + Agent Skills | 见下一节生态矩阵 |

这条核实结论很重要，也给「全方位开源」的传播话术划一条精确的线：**数据、权重、中间检查点、RL 框架、算法文档是真开源；评测是「结果全公开」，独立评测代码尚未见到官方仓库。**

# 生态与落地矩阵：不是「能跑」，是「到处能跑」

标准 LlamaForCausalLM 架构的回报体现在生态端：MiniCPM5-2B 发布即覆盖主流推理引擎、量化格式、微调框架与国产芯片，官方 README 按「Backend / 格式用途 / Cookbook / Agent Skill」四列给全了每一条接入路径，部署与微调还有给 Cursor / Claude Code 等编码智能体用的 SKILL.md（skills/minicpm5-deploy-\* 与 minicpm5-finetune-\*）。

## 模型产物全家桶

| 产物 | 用途 | 形态 |
|-|-|-|
| MiniCPM5-2B | 最终发布模型（RL + OPD 后训练） | BF16，HF / ModelScope |
| MiniCPM5-2B-Base / -Midtrain / -SFT | 训练中间检查点，按图复现的锚点 | BF16 |
| MiniCPM5-2B-GGUF | llama.cpp / Ollama / LM Studio / ArcLight 端侧 CPU+GPU | GGUF（HF 上另有 19 个第三方量化） |
| MiniCPM5-2B-MLX | Apple Silicon 本地推理 | MLX / 4bit |
| MiniCPM5-2B-GPTQ | GPU 量化推理 | GPTQ / 4bit |
| MiniCPM5-2B-DSpark | 投机解码草稿模型（约 0.3B），加速同时保持目标模型输出不变 | 配合 SGLang DSPARK 算法 |
| FlagRelease/MiniCPM5-2B-\*-FlagOS | 9 类芯片的统一多芯片部署版 | 见下节芯片表 |

## 推理后端矩阵（官方 Cookbook）

| 后端 | 用途 | 版本要求 / 说明 |
|-|-|-|
| Transformers | 本地 Python 推理（GPU + CPU） | transformers≥5.6；enable_thinking 开关在 apply_chat_template |
| vLLM | OpenAI 兼容服务 | vllm≥0.21；vllm serve openbmb/MiniCPM5-2B |
| SGLang | OpenAI 兼容服务；**工具调用推荐后端** | sglang[srt]≥0.5.16；--tool-call-parser minicpm5 |
| llama.cpp | GGUF 本地推理 | CPU / GPU |
| Ollama | 端侧本地运行 | GGUF |
| LM Studio | Mac 桌面应用 + OpenAI server | GGUF |
| MLX | Apple Silicon 本地推理 | MLX / 4bit |
| ArcLight | 端侧 CPU、桌面与服务器 | GGUF |
| vLLM Ascend | 昇腾 NPU 上的 OpenAI 兼容服务 | — |

## FlagOS：9 类芯片「一次开发、处处部署」

FlagOS（智源联合发起的「模型—系统—芯片」统一开源软件栈）让 MiniCPM5-2B 在极短时间内适配了 9 类 AI 芯片，均以 FlagRelease/MiniCPM5-2B-<芯片>-FlagOS 发布：**Nvidia、Hygon（海光）、Metax（沐曦）、Iluvatar（天数智芯）、Zhenwu、Mthreads（摩尔线程）、Kunlunxin（昆仑芯）、Ascend（昇腾）、ARM-v9**（对应中文芯片名以官方 FlagOS 页面为准）。加速路径为 FlagGems 算子库（pip install flag-gems==4.2.1rc0 + triton==3.5.1，vLLM 内 flag_gems.enable()）+ vllm-plugin-FL 多芯片后端插件。这对端侧模型的意义是结构性的：同一套权重从手机 ARM 到国产 AI 加速卡都能跑，模型厂商、芯片厂商与开发者三方的适配成本同时下降。

## 工具调用、投机解码与微调

工具调用走 XML 风格输出：MiniCPM5-2B 直接吐 XML 格式的 function call，SGLang 内置 minicpm5 parser 会把它转成 OpenAI 兼容的 tool_calls（--tool-call-parser minicpm5 或 auto），这正是 SGLang 被官方指定为工具调用推荐后端的原因；模型卡里 τ³-Bench Banking 20.8、BFCL v4 66.6、GAIA Text-103 88.7 等成绩都建立在「XML 工具调用 + SGLang」链路上。投机解码则用 DSpark 草稿模型：SGLang 启动加 --speculative-algorithm DSPARK --speculative-draft-model-path openbmb/MiniCPM5-2B-DSpark --speculative-dspark-block-size 7，即可在保持输出不变的前提下加速解码。微调侧官方给了 TRL+PEFT（LoRA/SFT）、LLaMA-Factory、ms-swift、unsloth 四套 Cookbook（1B 另有 xtuner），社区生态里 HF 上已挂出 4 个 fine-tune 与 19 个第三方量化衍生。

## 演示与周边

官方提供了 HF Space 在线 Demo（openbmb/MiniCPM5-2B-Demo），社区已出现 WebGPU 端侧运行版（ProCreations/minicpm5-2b-webgpu）等尝试；MiniCPM5-1B 时代驱动过「桌面宠物」项目（github.com/OpenBMB/MiniCPM-Desk-Pet），2B 的功耗升级后这类本地陪伴/助手形态会更顺。模型卡还提示相关论文链接（MiniCPM Tech Report 2506.07900、UltraData 2602.09003）与中文 MiniCPM Wiki。

# 开源成色评估、局限与观察

## 「真·全栈开源」成色几何

把官方动作和可验证事实对齐后，我的判断是：**这是目前 2B 级端侧模型里开源深度最接近「可复现训练」的一次发布，但离「完全复现」仍有三个缺口**。其一，基座/中期训练只给了语料与层级框架，没有像 1B 那样公开更多配方细节（官方对 2B 未公布学习率、batch、步数等超参；RL-2609 卡片也声明在线动态采样权重未存为字段）；其二，SFT 数据（2605）需登录申请、数据集再分发被严格限制（禁止未授权镜像/转售），「开源」更接近「开放研究访问」而非自由再发布；其三，评测 harness 代码未见单独开源（见前文核实表）。反过来看，权重多格式 + 中间检查点 + 1.4T+ tokens 量级的分层语料 + 可验证 RL 数据 + 无 Ray 的 RL 引擎 + critic 算法文档，这套组合让「从数据到模型」的主链路在物料上基本齐全，学术复现价值远超普通权重开源。

## 局限与风险清单（写给想直接用的人）

- **能力天花板**：极限长尾知识（HLE 8.9）与仓库级复杂工程任务（SWE-bench Pro 14.4、Terminal-Bench v2.1 8.6）仍明显弱于大参数模型；纯文本定位，多模态需另配。
- **评测口径**：模型卡分数大部分为面壁内部复现，† 项来自 AA 官方；AA 指数版本间不可直接横比（v4.1.1 的 23 vs 新版重标定后约 15）。
- **许可叠加**：Apache-2.0 只覆盖模型/仓库与 UltraData 项目自身，各数据集的上游语料分别携带 MIT / CC BY 4.0 / CC BY-SA 4.0 等条款，商用前需逐一核查；禁止未授权再分发与镜像。
- **数据时效**：Agent 轨迹冻结在采样时点，工具/API/网页/依赖可能已过时；静态轨迹无法本地重放（不含环境与采样代码）。
- **端侧实践**：128K 上下文在手机端受显存/带宽限制需量力（GGUF 量化 + 分段处理是常规解）；长思维链模式功耗明显高于直答模式，建议按任务开关 enable_thinking。

## 「2B 打赢 12B」之辨

这个标题的严谨版本是：在 Artificial Analysis 智能指数（发布时 v4.1.1）上，MiniCPM5-2B 的 23 分高于 Gemma 4 12B 与 Qwen3.5 9B 的 22 分——这是**按「每单位参数产出的智能」计价的胜利**（帕累托前沿意义上的智能密度），不是「2B 全面碾压 12B」。在同一张 AA 榜单上，12B 的知识面与部分能力上限仍然更高；而 MiniCPM5-2B 的真正意义在于：**当任务被裁剪为端侧智能体（工具调用 + 多跳检索 + 短链推理）时，2B 的绝对能力已经越过「可用线」**，而它的部署成本（内存、功耗、隐私、时延）比 12B 低一个量级。2B 打赢 12B 的本质是「把模型做到刚好够用，然后让部署半径决定胜负」。

## 几个值得跟进的观察

第一，**OPD + 专家矩阵成为小模型后训练的「标准答案」候选**：16 个 RL 专家（5 个 agentic）蒸馏回单模型、增益均值近 11 分，这套「分而治之、再收敛」与 Thinking Machines 的 OPD 路线呼应，MiniCPM5-2B 是公开规模最大的 OPD 落地案例之一。第二，**UltraData 分层体系正在把「数据工程」产品化**：L0–L4 框架 + UltraX 程序化编辑 + 代码数据合成 + 可验证 RL 数据清洗，几乎每一层都独立成文成仓，MiniCPM5-2B 只是这条数据流水线的一个下游样例。第三，**国产芯片适配的「时间常数」在缩短**：发布当天就有 9 类芯片版本（FlagOS），配合标准 Llama 架构与无 fork 推理，端侧模型「一次训练、多芯片分发」的产业闭环正在成型。第四，RL 数据与框架的「可验证」路线（verifiable reward + critic + token 级信用分配）很可能成为 2026 下半年小模型后训练的主流叙事，值得持续跟踪 JustRL II 的正式论文与 2B 系列后继（例如更大参数的 MiniCPM5-4B？官方未披露路线图，仅指 2B 为 series 的第二枚 checkpoint）。

# 参考资料与信源

## 官方代码与权重

[OpenBMB/MiniCPM（GitHub 主仓库，MiniCPM5-2B 章节与图片）](https://github.com/OpenBMB/MiniCPM) · [中文 README](https://github.com/OpenBMB/MiniCPM/blob/main/README-cn.md) · [openbmb/MiniCPM5-2B（模型卡）](https://huggingface.co/openbmb/MiniCPM5-2B) · [ModelScope 镜像](https://www.modelscope.cn/models/OpenBMB/MiniCPM5-2B) · [HF MiniCPM5 Collection（23 项）](https://huggingface.co/collections/openbmb/minicpm5) · [OpenBMB/Meshy（RL 引擎）](https://github.com/OpenBMB/Meshy) · [OpenBMB/UltraX（数据精炼框架）](https://github.com/openbmb/UltraX) · [MiniCPM-Desk-Pet](https://github.com/OpenBMB/MiniCPM-Desk-Pet) · [MiniCPM-V](https://github.com/OpenBMB/MiniCPM-V)

## 开源数据（Hugging Face 数据集卡）

[Ultra-FineWeb](https://huggingface.co/datasets/openbmb/Ultra-FineWeb) · [Ultra-FineWeb-L3](https://huggingface.co/datasets/openbmb/Ultra-FineWeb-L3) · [UltraX-Preview](https://huggingface.co/datasets/openbmb/UltraX-Preview) · [UltraData-Code](https://huggingface.co/datasets/openbmb/UltraData-Code) · [UltraData-Math](https://huggingface.co/datasets/openbmb/UltraData-Math) · [UltraData-SFT-2605](https://huggingface.co/datasets/openbmb/UltraData-SFT-2605) · [UltraData-SFT-Agent-2609](https://huggingface.co/datasets/openbmb/UltraData-SFT-Agent-2609) · [UltraData-RL-2609](https://huggingface.co/datasets/openbmb/UltraData-RL-2609) · [UltraData-Code-L2-Classifier](https://huggingface.co/openbmb/UltraData-Code-L2-Classifier) · [UltraX-0.6B-Preview](https://huggingface.co/openbmb/UltraX-0.6B-Preview) · [JustRL-II-base-model](https://huggingface.co/openbmb/JustRL-II-base-model)

## 论文与技术文档

[UltraData：Data Science and Technology Towards AGI Part I — Tiered Data Management（arXiv 2602.09003）](https://arxiv.org/abs/2602.09003)（另可读 [HTML 全文](https://arxiv.org/html/2602.09003v1)） · [MiniCPM Tech Report（2506.07900）](https://arxiv.org/pdf/2506.07900) · [JustRL: Scaling a 1.5B LLM with a Simple RL Recipe（2512.16649）](https://arxiv.org/pdf/2512.16649) · [Rethinking On-Policy Distillation（2604.13016）](https://arxiv.org/pdf/2604.13016) · [UltraX：Refining Pre-Training Data at Scale with Adaptive Programmatic Editing（2607.08646）](https://arxiv.org/abs/2607.08646) · [JustRL II 技术文档（Notion，官方）](https://panhaoxuan.notion.site/justrl-ii-scaling-small-llms-to-128k-reasoning-with-a-critic) · [Thinking Machines Lab：On-Policy Distillation](https://thinkingmachines.ai/blog/on-policy-distillation/) · [InfLLM-V2（长上下文背景）](https://arxiv.org/abs/2509.24663) · [MiniCPM Wiki（中文）](https://modelbest.feishu.cn/wiki/UtWxwcERfiRIpIkBOjuc3h9tn1D) · [UltraData 平台](https://ultradata.openbmb.cn/)

## 第三方榜单与部署生态

[Artificial Analysis（AA 榜单，MiniCPM5-2B 模型页见 artificialanalysis.ai/models/openbmb-minicpm5-2b）](https://artificialanalysis.ai) · [FlagOS](https://flagos.io) · [FlagGems](https://github.com/flagos-ai/FlagGems) · [vllm-plugin-FL](https://github.com/flagos-ai/vllm-plugin-FL) · [MiniCPM5-2B 在线 Demo](https://huggingface.co/spaces/openbmb/MiniCPM5-2B-Demo) · [社区 WebGPU 版 Demo](https://huggingface.co/spaces/ProCreations/minicpm5-2b-webgpu)

## 主流媒体（2026-09-07 / 09-08 报道）

界面新闻（面壁智能开源 MiniCPM5-2B）、时代周报 / 新浪财经（面壁智能开源 MiniCPM5-2B，端侧智能体可行性获初步验证）、新浪财经（2B 参数打赢 12B 模型）、网易科技 / 新智元（AA 榜单与 Meshy、JustRL 详解）。媒体报道用于 AA 指数口径（23 / 20 分）、智能密度对比（Gemma 4 12B 与 Qwen3.5 9B 均为 22 分）与 token 效率（约 21K 输出 token）等非官方仓库信息，均已在正文标注。

## 方法说明与口径差异处理

本文以官方一手来源（GitHub README 与仓库图片、Hugging Face 模型卡与数据集卡、论文摘要页、Meshy 仓库）为主，逐一核对数值后成稿；正文 4 张 MiniCPM5-2B 图与 1 张 Meshy 架构图均为官方仓库原图，图表内文字经图像核对转录。三处口径差异已按来源分别标注：①AA 智能指数的版本差异（v4.1.1=23 vs 新版重标定≈15，均居 sub-4B 开源第一）；②GDPval-AA v2 的数值体系差异（模型卡 19.6† vs 媒体 Elo≈891/831，属不同计分口径）；③「2B 打赢 12B」为媒体对 AA 智能密度的解读而非官方结论。未能直接核实的两处：JustRL II Notion 文档与 AA 模型页为动态页面，抓取受限，相关细节取自数据集卡、模型卡与媒体报道的交叉引用。文中所有分数、tokens、参数量等数字均可回溯到上述链接。

> 全文完。数据截至 2026-09-08；模型与数据仍在快速迭代，引用时请以各官方仓库最新版本为准。