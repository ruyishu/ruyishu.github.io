---
title: 'agent rl 复盘'
description: '前 o1 核心成员（LoRA 一作）Edward J. Hu 所在的 Mercor Research 联合 Berkeley Sky Computing Lab / Anyscal…'
pubDate: '2026-09-03'
---

> 前 o1 核心成员（LoRA 一作）Edward J. Hu 所在的 Mercor Research 联合 Berkeley Sky Computing Lab / Anyscale 的 SkyRL 团队，于 2026 年 9 月初开源了一份面向**知识工作（knowledge work）Agent** 的 397B 级强化学习完整配方：《Training frontier knowledge work agents: A 397B RL training guide with SkyRL》。本文是对该工作全套资料（博客、训练脚本、权重、评测 traces）的通读笔记与复盘。

---

## 0. TL;DR（先给结论）

- **是谁**：LoRA 一作、μP/μTransfer 共同提出者、前 OpenAI o1 推理模型研究员 **Edward J. Hu**（现 Mercor Head of AI Modeling），与 Mercor Research + SkyRL 团队。
- **开源了什么**：端到端可复现的 Agent RL 训练配方 —— GitHub 仓库（import-only、零 fork）、两套模型权重（Qwen3.5-397B-A17B-Mercor、Qwen3.6-35B-A3B-Mercor）、两套评测 traces，配套技术博客。
- **做了什么**：用强化学习（DPPO + prompt_mean，无 SFT 热启动）在 1,928 个专家构建的知识工作任务（管理咨询 / 投行 / 公司法）上后训练开源大模型。
- **结果**：Qwen3.5-397B-A17B 在 held-out APEX-Agents 480 任务上 Pass@1 从 16.11% 提升到 27.29%（相对 +70%）；Qwen3.6-35B-A3B 后训练后在同一基准上超越 Opus 4.5；增益可跨 harness 迁移，通用推理（GPQA / HLE）无回退。
- **最大的元结论**：对 agent RL 而言，**"算法" 不是第一杠杆**。最好的单个算法 knob 只值 +3.9 分，而"高质量数据 + 可靠环境 + 稳定工程"的完整配方把两个模型整体推高了 10-12 分。工程上把 100k+ token 的长程 trajectory 稳定地送进 trainer，比 loss 函数本身难得多、也重要得多。

**官方结果原图（引自原文 Figure 1 / 2）**：

![Figure 1：Pass@1 训练前后对比曲线](/images/misc/agent-rl-retro/agent-rl-复盘-1.png)

*官方 Figure 1：Pass@1（横轴 = 训练步数；蓝 = Qwen3.6-35B-A3B，橙 = Qwen3.5-397B-A17B；灰色虚线 = 无步数轴的参考模型：Grok 4.5 High 29.4% / Post-trained GLM-4.7 355B 23.0% / Opus 4.5 High 20.7%）*

![Figure 2：按领域分组的 base vs post-trained Pass@1](/images/misc/agent-rl-retro/agent-rl-复盘-2.png)

*官方 Figure 2：按领域（Law / Consulting / IB）的 base vs post-trained Pass@1。35B：Law 12.9→23.7、Consulting 13.3→18.5、IB 15.6→25.8；397B：Law 18.8→25.0、Consulting 12.9→27.7、IB 16.7→29.2（浅色 = base，深色 = post-trained）*

---

## 1. 人物与来龙去脉

### 1.1 Edward J. Hu 是谁

- **LoRA 一作 / 发明人**：2021 年《LoRA: Low-Rank Adaptation of Large Language Models》（微软研究院时期），彻底改变大模型微调的经济性。
- **μP / μTransfer 共同提出者**：与 Greg Yang 等人共同提出最大学习率迁移（hyperparameter transfer）理论，是"小模型调参、大模型训练"这一套现代超参实践的基础。
- **前 OpenAI 研究员**：曾参与 o1 系列推理模型的研发（公开履历口径：OpenAI research scientist，focus on reasoning models）。
- **现职**：Mercor **Head of AI Modeling**，带队做 post-training / RL / agentic 系统研发，哲学是把"数据与训练配方"本身当产品。

### 1.2 三方团队

| 团队 | 角色 |
|-|-|
| **Mercor Research** | 提供 APEX-Agents 数据/评测、Harbor agent 循环（Archipelago）、实验主体 |
| **SkyRL**（Berkeley Sky Computing Lab × Anyscale） | 开源 RL 训练框架：全异步训练循环、vLLM 推理引擎、NCCL in-flight 权重同步、Tinker 兼容后端 |
| **Harbor**（Terminal-Bench 团队） | 容器化 agent 评估与 rollouts：跨 Modal / Daytona 跑 trial、管理任务目录与 verifier 生命周期 |

### 1.3 系列前情（这是第三篇）

- **1 月**：证明 *不到 1,000 个专家标注任务*就能让开源权重模型在 APEX-Agents 上得分**近乎翻倍**（《expert data drives model performance》）。
- **2 月**：数据扩到约 2,000 个案例，用 GLM-4.7 355B post-training 出 "Applied Compute: Small"，拿下**公司法领域第一、总榜第四**。
- **9 月（本篇）**：把前两篇的专有 RL 技术栈**移植到公开 SkyRL 上**，扩到 397B，开源代码 / 权重 / traces。目标非常明确：让"复现"成为可能。

> 作者列的完整名单：Charlie Ruan、Sumanth Hegde、Eric Tang、Tyler Griggs、Jungyeon Park、Maanas Baraya、Philipp Moritz、Michael Haines、Edward J. Hu 等。审阅：Nathan Lambert、Lifan Yuan、Kourosh Hakhamaneshi、Hamish Ivison。Anyscale 协助搭集群。

---

## 2. 他们想解决什么问题

### 2.1 为什么是"知识工作"而不是 coding

- 开源社区已经把 **coding agent** 的 RL 训练做到 27B-32B 规模且有竞争力。
- 但**知识工作 agent**（像分析师、律师、投行助理那样，跨文档 / 表格 / 邮件 / 幻灯片完成长程任务）几乎没有公开研究，卡在两个地方：

  1. **现实环境构建成本高**：需要一整套模拟公司（几十个 PDF、电子表格、幻灯片 + 聊天/邮件服务器 + MCP 工具）。
  2. **长程 rollout 训练成本高**：一条 trajectory 动辄 2k-128k token，试错昂贵。

### 2.2 APEX-Agents 基准长什么样

- **Worlds + Tasks**：每个任务存在于一个"世界"里 —— 一家模拟公司；多个任务共享同一个 world。Agent 通过 **MCP 工具或代码执行**干活。
- **480 个评测任务全部公开**（Hugging Face），覆盖管理咨询、投资银行、公司法等专业服务场景。
- **训练数据（APEX-Agents OTS）**：1,928 个专家创建的任务，与公开基准同构，但 worlds 与 prompts **完全不与公开 benchmark 重叠（无污染）**。
- **评分机制**：Harbor 在沙箱内跑 verifier；verifier 由 LLM judge 依据 rubrics（verifiers.json）逐条打分，**每条标准的得分 = 该 trajectory 的 reward 分量**，随轨迹流回 trainer。部分任务靠**对比前后文档快照（file diff）**判分。

### 2.3 数据形态（版权原因不能开源数据，但格式完全公开）

HF 数据集 = parquet shards，每行一个任务，两列：`path`（任务目录名）+ `task_binary`（gzip 压缩的 tar 归档）。解包后是标准 Harbor 任务目录：

```text
mercor-409-mk-01-c87181e6/
├── instruction.md            # agent 看到的 prompt
├── task.toml                 # harbor 任务配置：超时、verifier env、资源
├── archipelago.json          # 配方元数据（world id、ecr_image、所需 env keys）
├── environment/Dockerfile    # 占位符：真实环境是预构建的 ECR 镜像
└── tests/                    # verifier（绝不对 agent 挂载）
    ├── test.sh               # agent 结束后在沙箱内运行
    ├── grade.py              # 产出 reward
    ├── verifiers.json        # LLM 判定标准（对 agent 隐藏）
    ├── golden_responses.json # 参考答案
    └── runner/               # 内置评分 runner（archipelago 固定 commit）
```

---

## 3. 配方全景（先看地图，再进细节）

作者把整套方法论按**降低风险**的顺序展开，第 1-3 步基本不烧大算力：

```text
Step 1  环境、harness 与 token 核算   → 把"非模型错误"清零
Step 2  RL 系统调优（吞吐/并发/正确性） → 让 trainer 永不空等、训练不出错
Step 3  过拟合运行（de-risk）          → 32 任务先证明"可学习"
Step 4  35B 算法消融                   → 在 Qwen3.6-35B-A3B 上选配置
Step 5  397B hero run                  → 把配方放大到 Qwen3.5-397B-A17B
Step 6  评估与泛化                     → APEX / Terminal-Bench / GPQA / HLE
```

全局设置：**RL without SFT warmup**（不做 SFT 热启动，因为 RL 才是 post-training 里最难做对的部分）；训练上下文 **160k**、评估上下文 **256k**，两边都不做 compaction；loss 直接用 rollout logprobs，无需额外的 forward pass。

---

## 4. Step 1：环境与 harness —— 先把"不该模型背的锅"摘干净

这是全文最容易被低估、却最值钱的一节。

- 用**未训练模型**先评估：Qwen3.6-35B-A3B 在初始 harness 下 mean reward = **22.74%**。
- 修完 harness 缺陷后**零训练**就提升到 **28.69%** —— 大约等于"在坏 harness 上白训一个 epoch"的效果。

**抓到的具体 harness bug：**

| Bug | 后果 | 修法 |
|-|-|-|
| 沙箱缺 Python 包 | agent 浪费大量 turn 探测环境 | 预装全套解析库（pandas/openpyxl/pdfplumber/python-pptx 等） |
| PowerPoint MCP 工具成功也返回 None | agent 无法确认结果、反复尝试 | patch（slides_output_validation_fix.py） |
| PDF reader 把 2D 布局压成 1D 文本 | 图表/多列表格被读乱 | 引导模型改用 pdfplumber 重新提取 |
| 工具调用解析偶尔失败 | 整条 roll 报废 | 让 agent 重试而非直接判失败 |
| 工具结果无上限 | context 被灌爆 | 截断到固定 token/字符预算 |

其他工程性改进：**context nudge**（context 剩余约 20% 时提示模型"收尾"——按百分比而非绝对 token 触发，同时吸收 train/eval context 长度差异）；工具调用失败重试。

> 教训：**harness 缺陷会让模型学会"绕开你的 harness"而不是完成任务**——它在用探索预算替你调试环境。任何 RL 之前，先用预期并发把全训练集过一遍评估，把非模型错误率压到接近 0，不要指望训练时用 mask 兜底。

---

## 5. Step 2：RL 系统调优 —— 工程量最大的一步

### 5.1 组件架构

- 推理与训练**分离**：vLLM 做推理引擎，Megatron 做训练后端，训练中通过 **NCCL in-flight 权重同步**把新权重实时同步给推理引擎（全异步训练的前提）。
- 每个 rollout trial 是一个独立的 Ray task；Harbor 管理生命周期：`env start → agent.run() → verify → teardown`。

![Figure 3：一次 RL trial 中各组件的分布（架构图）](/images/misc/agent-rl-retro/agent-rl-复盘-3.png)

*官方 Figure 3："What runs where" —— 一次 RL trial：左 = HF 数据集里的 Harbor 任务目录；中 = Ray GPU 集群上的 SkyRL（全异步训练循环、vLLM 引擎、in-flight NCCL 权重同步），每个 trial 一个 Ray task；右 = 每个 trial 的 Modal 沙箱（从 ECR 镜像启动、暴露 MCP 服务器、agent 结束后在沙箱内跑 verifier）*

### 5.2 调优顺序与关键指标

1. **先调 Megatron knobs**：用 dummy 脚本扫参（并行度 TP/EP/PP/CP、CPU offloading 粒度、`max_tokens_per_microbatch`）。**动态 micro-batching** 对 trainer 吞吐至关重要。
2. **再分集群**：给定算力下先固定训练 GPU 数，把剩余尽量给 rollout，目标让 trainer **从不等待生成** —— 观察 SkyRL 面板 `timing/wait_for_generation_buffer` 恒为 0。

   - 35B run：inference:train = **12:4**；397B run：**12:8**。
3. **Rollout 并发度 = min(系统上限, 算法上限)**：

   - 系统上限：KV cache 总 token 数 ÷ 平均 trajectory 长度（长程任务里通常是瓶颈；靠 CPU KV offload 或更高 TP/PP/EP 提升）。
   - 算法上限：异步下对 staleness 的容忍度 = `(max_staleness_steps + 1) × mini_batch_size × n_samples_per_prompt`，本工作 = (3+1) × 16 × 16 = **1024**。
   - 实际由系统上限决定：35B 并发 **550**、397B 并发 **300**，都远低于 1024。
4. **train-inference 一致性校验**：跑几步后比较 trainer 与推理引擎的 logprob，**均值差 < 0.03 通常健康**。这一步真的抓到了 bug：vLLM CPU offloading + GDN 模型 + in-flight 权重更新组合下的正确性问题。

![Figure 4：trainer 与推理引擎的 logprob 差异](/images/misc/agent-rl-retro/agent-rl-复盘-4.png)

*官方 Figure 4：trainer 与推理引擎的 mean logprob 差，低于 0.03 通常是健康信号*

### 5.3 稳定性清单（全部是血泪）

- **所有东西都加 timeout**：下载、MCP 交互、容器 teardown。
- **LLM judge 要限流**：几百并发 rollout 下 judge API 疯狂限流，需要多个 key round-robin + backoff 重试。
- **MCP client 按进程隔离**：几百个 agent loop 共享一个 Python 进程会导致持续 MCP 断连；每个 agent loop 独立 Ray task。
- **错误分类**：fail-the-trial vs retry，利用 Harbor 内置容错。
- 尝试过但无帮助的：adaptive length penalty、overlong filtering、reset KV cache（后面消融里量化）。

---

## 6. Step 3：过拟合运行（de-risk）

先证明"任务本身可学习"，再上大规模：

- 取 **32 个任务**子集（离线评估中 reward 方差非零的那些）；
- **batch size 32、每个 prompt 8 个样本、同步训练** —— 每一步等于一个 epoch；
- 跑不通就回到 Step 1 找原因（大概率是环境/harness）。

**重要发现**：靠**文件 diff** 评分的任务比只评最终回复的任务**难学得多**；排查发现是评分逻辑的问题 —— 改用第三方文件 diff 工具后提取保真度提升，任务立刻变得可学习。这一条对任何做"带产物 agent"评测的人都通用。

![Figure 5：32 任务过拟合运行的 reward 曲线](/images/misc/agent-rl-retro/agent-rl-复盘-5.png)

*官方 Figure 5：32 任务上的过拟合运行 —— 几步之内就该看到学习信号*

---

## 7. Step 4：35B 算法消融 —— 全表 + 解读

消融全部在 Qwen3.6-35B-A3B 上做，**每个 arm 都评 epoch-1 checkpoint**，对 held-out 480 任务**跑 3 遍**取 mean ± std。所有 arm 共享同一 harness。表按 Mean Reward 排序（完整 14 行，来自仓库 `assets/full_ablation_table.md`）：

| Run | Loss agg | IS variant | Prompt nudge | OLF | ALP (assist/env) | Mean Reward (%) | Pass@1(%) | Avg turns | Avg tokens | Tokens/turn | Tool succ (%) |
|-|-|-|-|-|-|-|-|-|-|-|-|
| 4. prompt_mean | prompt_mean | / | / | / | / | 32.54 ± 1.19 | 16.74 ± 0.79 | 32.12 | 95,792 | 837.8 | 95.88 |
| 10. DPPO+prompt_mean+nudge | prompt_mean | DPPO | True | / | / | 31.81 ± 0.81 | 16.11 ± 0.43 | 35.99 | 101,441 | 775.3 | 97.74 |
| 5. Nudge | / | / | True | / | / | 31.64 ± 0.68 | 15.69 ± 1.18 | 38.31 | 96,297 | 685.8 | 97.31 |
| 13. +ALP 0.25/0.1 | prompt_mean | DPPO | True | / | 0.25/0.1 | 31.60 ± 1.54 | 15.07 ± 1.27 | 44.96 | 110,082 | 761.2 | 98.41 |
| 12. +ALP 0.1/0.1 | prompt_mean | DPPO | True | / | 0.1/0.1 | 30.93 ± 0.22 | 16.18 ± 1.18 | 43.77 | 95,546 | 549.8 | 97.78 |
| 9. prompt_mean+ALP | prompt_mean | / | / | / | 0.25/0.25 | 30.85 ± 0.99 | 16.11 ± 0.79 | 35.80 | 88,535 | 620.3 | 97.90 |
| 2. ResetKV | / | / | / | / | / | 30.57 ± 1.75 | 14.86 ± 1.22 | 25.19 | 86,522 | 852.4 | 98.40 |
| 11. DPPO+prompt_mean+nudge+OLF | prompt_mean | DPPO | True | True | / | 30.30 ± 0.50 | 14.72 ± 0.43 | 32.25 | 103,034 | 794.1 | 94.60 |
| 7. DPPO+ALP+OLF | / | DPPO | / | True | 0.25/0.25 | 30.00 ± 1.20 | 15.49 ± 0.87 | 25.77 | 95,683 | 844.3 | 96.34 |
| 3. DPPO (ep1) | / | DPPO | / | / | / | 29.03 ± 0.45 | 13.96 ± 0.21 | 32.40 | 87,124 | 587.5 | 97.16 |
| 1. Baseline (ep1) | token_mean | rollout_is | False | False | False | 28.69 ± 0.80 | 13.12 ± 1.63 | 21.21 | 77,462 | 834.0 | 98.37 |
| 6. DPPO+ALP | / | DPPO | / | / | 0.25/0.25 | 28.12 ± 0.75 | 13.26 ± 0.48 | 24.99 | 83,829 | 765.2 | 97.53 |
| 8. DPPO+ALP+nudge | / | DPPO | True | / | 0.25/0.25 | 27.24 ± 0.59 | 13.26 ± 0.52 | 25.20 | 83,999 | 813.8 | 97.51 |
| Untrained | — | — | — | — | — | 22.74 ± 1.04 | 9.10 ± 1.26 | 16.80 | 87,703 | 882.9 | 96.60 |

（"/" = 同 Baseline：token_mean、GLM-5 loss、无 nudge/OLF/ALP；ResetKV = 每次权重同步清 prefix cache。表中仅报均值，std 见原文。）

**官方 Table 1 原图**（含 3 次 pass 各自的 context 超限计数列，比上表多一列信息）：

![官方 Table 1：算法消融全表](/images/misc/agent-rl-retro/agent-rl-复盘-6.png)

> 口径提醒：官方几处"base"数字并不完全一致——Step 1 说修好 harness 后**未训练模型**在最终 harness 上是 28.69%（该值与 Table 2 的 35B base 行一致）；而本消融表末尾的 `Untrained` 行是 22.74%（对应早期未修 harness 的 22.74% 口径）。官方没有专门解释这个差异，**各表内部做相对比较即可，不要跨表拼绝对值**。

### 7.1 逐个 knob 的结论

**(a) Loss 聚合方式：prompt_mean 值 +3.9 分。** trajectory 长度从 2k 到 128k token 差异巨大，`token_mean`（所有 token 等权，多数开源框架的实现）会让**长 rollout 主导梯度**；`sequence_mean`（每序列等权，原始 GRPO）也不行。`prompt_mean`（每 rollout group 等权、组内 token 等权，DAPO 目标写法，后被 ScaleRL 强调）消除长度偏差，比 token_mean 基线高 3.9 分（run 4 vs run 1）。**做长程 agent RL 的人，这几乎是最该抄的一行配置。**

**(b) 策略损失：DPPO vs GLM-5 loss，epoch 1 时在噪声内持平，但行为显著不同。**

- 两者都直接用 rollout logprobs 算 loss、校正 train-inference mismatch 与异步陈旧性，**省掉传统 off-policy 方法需要的额外 forward pass**（在 100k-token 轨迹上省下的算力可观）。
- **DPPO**（binary TV divergence 近似，mask 掉 train/infer logprob 分歧过大的 token）对分数的增益 epoch-1 时在噪声内（run 3 vs run 1），但**行为上把模型推向更多、更短的 turn**（21→32；assistant token/turn 834→588），工具调用成功率也更高。
- hero 配置里还是选了 **DPPO**，理由是行为信号 + 稳定性，而非单点分数。

**(c) Context nudge（训练期 +3.0 分）。** 剩余 20% context 时提示收尾 → 更少 rollout 撑爆 context、更少整条 reward 清零，每 batch 有效信号变多。评估时**不带** nudge，所以这是纯训练期收益。

**(d) 无效/负面方法。**

- **Overlong filtering（OLF）**：把超长 rollout 从 loss 里 mask 掉 → 反而 **−1.5 分**（run 11 vs run 10），与 Composer 2 的观察一致。原因是训练 160k/评估 256k 差距不大且都不用 compaction，预期收益本来就小。
- **Adaptive length penalty（ALP）**：所有尝试的设置下**中性到负面**（表里 6/8/9/12/13 行都低于对应无 ALP 对照）。
- **Reset KV cache**：每次权重同步清 prefix cache → 无效。

### 7.2 读表的纪律（方法论本身也值得学）

1. 480 任务单遍评估噪声 **±1-3 分** → 所有数字都取 3 遍均值，**1 分以内视为打平**。
2. 除了 reward，还要看行为：turn 多、每 turn token 少、工具调用成功率高 = "审慎的多步工作"而非漫谈（对比 run 10 与 run 4：分数在噪声内，但行为完全不同）。

---

## 8. Step 5：hero run 与 397B 扩展

最终配置：**DPPO（binary TV，delta=0.15）+ prompt_mean + context nudge**，不加长度惩罚、不加课程学习。

### 8.1 结果

- **Qwen3.6-35B-A3B**：后训练后 APEX-Agents 480 上**超越 Opus 4.5**。
- **Qwen3.5-397B-A17B**：Pass@1 **16.11% → 27.29%（相对 +70%）**，hero 配方跨规模成立。
- 按领域：35B 在公司法增益最大，397B 在管理咨询增益最大（官方 Figure 2 的具体数字见 §0）。
- 官方 Figure 1 曲线显示：约 260 个训练步后 397B 达 27.29%（起点 16.11%）、35B 达约 22.7%；同时期参考线为 Grok 4.5 High 29.4%、Post-trained GLM-4.7 355B 23.0%、Opus 4.5 High 20.7%。

### 8.2 两套 hero 运行的硬件与超参（来自官方脚本，可直接抄）

| 配置项 | 35B run | 397B run |
|-|-|-|
| 基座 | Qwen/Qwen3.6-35B-A3B（GDN hybrid） | Qwen/Qwen3.5-397B-A17B |
| 硬件 | 14 节点 H100（inference:train = 12:4） | 20 节点 × 8×H200（inference:train = 12:8） |
| 推理引擎 | 10 × vLLM，TP=8 | 12 × vLLM，TP=8 |
| 训练并行 | Megatron TP8/EP8/CP1/PP1 | Megatron TP4/PP4/CP2/EP16（64 路模型并行），DP=1 |
| 上下文 | train 160k / eval 256k | 同左 |
| GPU mem util | 0.85（GDN hybrid 只用 GPU KV，不能 offload） | 0.93（依赖 KV offload；OOM 则降到 0.84） |
| 并发（rollout） | 550 | 300 |
| 限速 | 3 trajectories/s | 同左 |
| staleness | 3 步 | 同左 |
| 并行生成 workers | 64 = mini_batch(16) × (staleness+1)(4) | 同左 |
| 训练轮数 / ckpt | epochs 3；ckpt 每 5 单位、保留 5；eval 每 20 | 同左（ckpt 走 S3，必须） |
| 检查点 | 本地磁盘 | S3（无 NFS，节点本地盘不可合并） |

两套 run 共用的算法与优化器参数（397B 脚本原文）：

```text
POLICY_LOSS_TYPE    = dppo            # DPPO: binary TV divergence
DPPO_DELTA_LOW/HIGH = 0.15 / 0.15     # TV 阈值
EPS_CLIP_LOW/HIGH   = 0.5 / 4         # GLM-5 论文风格 clips
LOSS_REDUCTION      = prompt_mean
ADVANTAGE_ESTIMATOR = grpo
USE_KL_LOSS         = false           # 不开 KL 损失
ZERO_VARIANCE_FILTER= true (tol=1e-6)
GRPO_NORM_BY_STD    = false
TEMPERATURE         = 1.0
LR                  = 1e-6
ADAM_BETAS          = [0.9, 0.98]
WEIGHT_DECAY        = 0.01
MAX_GRAD_NORM       = 1.0
OPTIMIZER_OFFLOAD   = true (fraction 1.0, overlap d2h/h2d)
TRAIN_BATCH_SIZE    = 16
POLICY_MINI_BATCH   = 16
N_SAMPLES_PER_PROMPT= 16
MAX_TOKENS_PER_MICROBATCH = 160000
USE_SAMPLE_PACKING  = true
MAX_STALENESS_STEPS = 3
```

### 8.3 agent 侧细节（很长知识，全部来自脚本注释）

- 每轮 LLM 最大输出 **40k-50k token**、单次 LLM 调用超时 1800s、agent 总超时 3600s、工具结果截断 **42,000 字符**、TITO budget 警告比例 0.2。
- **默认 extra prompt** 是调参结论的浓缩，几乎每条都对应一次踩坑：

  - agent 是 **text-only**，明确禁用 `*_read_image` 类工具，不得猜图；
  - 算东西必须走 `code_execution_code_exec`，且显式写 `code` 参数；
  - Excel 场景：`excel_read_tab` 只返回计算值不返回公式 → 要用 `openpyxl.load_workbook(..., data_only=False)` 读公式串；
  - PDF 场景：`pdfs_read_pdf_pages` 会压平 2D 布局 → 用 `pdfplumber` 的 `extract_tables()/extract_text(layout=True)` 重提；
  - 沙箱预装 pandas/numpy/openpyxl/python-pptx/pdfplumber/pymupdf/pillow/tesseract 等；`pip install` 因 HOME 只读不可用。
- vLLM 侧：`enable_auto_tool_choice=true`、`tool_call_parser=qwen3_xml`、`reasoning_parser=qwen3`、router 策略 `sticky_least_loaded`、async engine。

### 8.4 冒烟测试（想复现的人先跑这个）

```bash
bash scripts/run_1gpu_colocated_smoke.sh   # 默认 Qwen3.5-0.8B，2×2 batch，2 steps，已验证
```

---

## 9. Step 6：评估与泛化

### 9.1 跨 harness 迁移（APEX-Agents：Archipelago → OpenCode）

- 训练 harness 是 Mercor 的 Archipelago（MCP 服务器 + 沙箱）；迁移目标是 **OpenCode**：完全**不暴露 MCP**，只有 bash/glob/read/grep/write/edit/todowrite 代码与文件工具。
- 结论：**增益大体上跨 harness 迁移**，尽管两者差异很大；**35B 迁移得比 397B 好**。
- 解释：Qwen3.6-35B-A3B（基座接受过更重的 agentic post-training）训练中学会了**更多依赖代码执行**、少依赖 MCP 服务器，所以到新 harness 更稳；397B 则保持用 MCP 习惯。
- 含义：post-trained 开源模型是**可复用资产**，不是焊死在某个 scaffold 上的结果——这对"开源权重 + 自选框架"的用户是关键背书。

**官方 Table 2 数值（从官方表格图片逐格读出）**：

| 模型 | APEX-Agents @ Archipelago（MeanReward / Pass@1） | APEX-Agents @ OpenCode（MeanReward / Pass@1） |
|-|-|-|
| Qwen3.6-35B-A3B | 28.69% ± 1.2 / 13.97% ± 1.46 | 26.22% ± 1.5 / 12.50% ± 1.04 |
| Qwen3.6-35B-A3B-Mercor | 38.69% ± 0.49 / 22.71% ± 0.95 | 37.93% ± 0.91 / 22.15% ± 0.87 |
| **Difference** | **+10.00 / +8.74 pt** | **+11.71 / +9.65 pt** |
| Qwen3.5-397B-A17B | 31.29% ± 1.98 / 16.11% ± 1.48 | 28.92% ± 2.2 / 15.07% ± 2.29 |
| Qwen3.5-397B-A17B-Mercor | 43.18% ± 0.93 / 27.29% ± 1.04 | 37.62% ± 0.37 / 21.94% ± 0.12 |
| **Difference** | **+11.89 / +11.18 pt** | **+8.7 / +6.87 pt** |

注意读表：397B 换到 OpenCode 后提升明显缩水（+8.7 vs +11.89），而 35B 几乎无损迁移（+11.71 vs +10.00）——这就是上面"35B 迁移更好"的量化依据。

![官方 Table 2：Archipelago vs OpenCode 双 harness 结果](/images/misc/agent-rl-retro/agent-rl-复盘-7.png)

![Figure 6：工具调用中代码执行 vs MCP 的占比曲线](/images/misc/agent-rl-retro/agent-rl-复盘-8.png)

*官方 Figure 6：工具调用里代码执行（vs MCP）的占比 —— Qwen3.6-35B-A3B 训练中越来越依赖代码执行，Qwen3.5-397B-A17B 始终偏爱 MCP*

### 9.2 迁移到新数据集 + 新 harness：Terminal-Bench 2.1

- 用 Terminus（terminus-2）harness，每任务最多 1000 步、沙箱 3 小时超时、3 遍评估。
- 基线与 artificial-analysis 报告一致：Qwen3.6-35B-A3B = **44.57%**，Qwen3.5-397B-A17B = **50.56%**。

**官方 Table 3 数值（从官方表格图片逐格读出）**：

| 模型 | Terminal-Bench 2.1（3 遍均值） | 提升 |
|-|-|-|
| Qwen3.6-35B-A3B | 44.57% ± 2.85 | — |
| Qwen3.6-35B-A3B-Mercor | 50.94% ± 3.04 | +6.37 pt |
| Qwen3.5-397B-A17B | 50.56% ± 2.66 | — |
| Qwen3.5-397B-A17B-Mercor | 55.43% ± 2.83 | +4.87 pt |

![官方 Table 3：Terminal-Bench 2.1 前后对比](/images/misc/agent-rl-retro/agent-rl-复盘-9.png)

- 换了数据集又换了 harness，增益依然在（35B +6.37 pt、397B +4.87 pt）：学到的是可迁移的 agentic 能力而非任务记忆；小模型依旧迁移更强，与其偏好代码执行一致。

### 9.3 通用能力不退化（HLE / GPQA）

- 前后差异全部落在误差棒内 → 解读为**无回退**（不是提升，但要的就是这个：+70% 的 agent 能力不该拿通用推理来换）。

**官方 Table 4 数值（从官方表格图片逐格读出）**：

| 模型 | HLE（single-turn） | GPQA |
|-|-|-|
| Qwen3.6-35B-A3B | 21.07% ± 0.60 | 84.51% ± 2.04 |
| Qwen3.6-35B-A3B-Mercor | 21.95% ± 0.80 | 84.51% ± 2.49 |
| Difference | +0.88 pt | +0 pt |
| Qwen3.5-397B-A17B | 28.93% ± 0.67 | 87.54% ± 1.05 |
| Qwen3.5-397B-A17B-Mercor | 29.72% ± 0.18 | 88.55% ± 1.27 |
| Difference | +0.79 pt | +1.01 pt |

![官方 Table 4：HLE 与 GPQA 前后对比](/images/misc/agent-rl-retro/agent-rl-复盘-10.png)

### 9.4 学习曲线形态（防误读）

- 两个规模的 Pass@1 / Pass@16 在**早期都先下降再上升**。官方解释：异步 RL 的动力学 —— 较容易的任务先被完成并吃到梯度，难度上升导致均分先掉。看到曲线先跌别慌。

![Pass@1 学习曲线（reward/avg_perfect_mean_at_1）](/images/misc/agent-rl-retro/agent-rl-复盘-11.png)

*官方曲线 1：reward/avg_perfect_mean_at_1（正文所说的 Pass@1 曲线）*

![Pass@16 学习曲线（reward/avg_perfect_at_16）](/images/misc/agent-rl-retro/agent-rl-复盘-12.png)

*官方曲线 2：reward/avg_perfect_at_16（正文所说的 Pass@16 曲线）*

![policy entropy 学习曲线](/images/misc/agent-rl-retro/agent-rl-复盘-13.png)

*官方曲线 3：policy/policy_entropy。三张图均为蓝色 = 35B run、橙色 = 397B run，曲线早期都先降后升 —— 异步 RL 下较简单任务先完成所致（图中指标名为 W&B 面板原始名称）*

---

## 10. 工程架构与代码仓库盘点（拿来即用）

### 10.1 TITO（Token-in-Token-out）—— 本文最容易被忽略的"隐形 MVP"

问题：推理引擎输出的文本若被**重新 tokenize** 再喂 trainer，会产生两类静默错位：

1. LLM 实际生成的内容 ≠ trainer 以为生成的内容；
2. 多轮场景：第 N 轮输出的 token IDs ≠ 第 N+1 轮输入里的同一段 token IDs。

作者给的玩具例子：词表是 `0: <`、`1: search`、`2: <search`、`3: >`，LLM 生成 `0,1,3`；若把字符串 `<search>` 交给 trainer 重新 tokenize，可能变成 `2,3` —— 训练直接 off-policy，还很难察觉。

三条实现路径：

1. **让 harness 用 /completions 替代 /chat/completions**（string-in-string-out → token-in-token-out）：控制最强、工程最重，**本文采用**；
2. 让 /chat/completions 返回 token IDs（如 vLLM return_token_ids）：省力，但解决不了多轮错位 (2)；
3. RL 框架提供 proxy 翻译 + 内部记账：最方便，SkyRL **即将内置**（issue #1959）。

> 启示：**凡是在做长程多轮 agent RL 的，请立刻自查你的 loss 里到底用的哪个 tokenizer 的 ID。** 重新 tokenize 一次的代价不是性能，是正确性。

### 10.2 仓库结构（Mercor-Intelligence/ApexAgents-SkyRL-Recipe）

```text
apex_agents_skyrl_recipe/
├── entrypoints/main_tito_harbor_fully_async.py   # 入口
├── tito_harbor_generator.py                      # SkyRL GeneratorInterface 实现
├── agents/archipelago.py                         # ArchipelagoAgent（TITO）
├── agents/llm.py / slides_output_validation_fix.py / metrics_helper.py
├── harbor_trial_config/archipelago_tito.yaml     # trial 配置
├── scripts/run_1gpu_colocated_smoke.sh           # 冒烟
├── scripts/run_qwen36_35b_fully_async.sh         # 35B hero
├── scripts/run_qwen35_397b_fully_async.sh        # 397B hero
├── scripts/run_eval.sh                           # 评估入口
└── assets/full_ablation_table.md                 # 完整消融表
```

**刻意克制**：SkyRL 0.3.0（editable checkout，commit b8a5caaa）+ harbor[modal] 0.21.0 全是 pip 依赖，**零 fork**；自写代码只有上述几个文件。pyproject 里锁死了 GPU 栈的包源（Astral wheels、pytorch-cu128、vllm-cu129），并明确警告：**SkyRL 不能从 PyPI 装**（会去拉 sdist 的 GPU 栈然后构建失败），必须走 path 依赖。

### 10.3 运行需要什么（环境变量）

```text
WANDB_API_KEY / HF_TOKEN
MODAL_TOKEN_ID / MODAL_TOKEN_SECRET / MODAL_ENVIRONMENT   # 沙箱
FMP_API_KEY / TERRAPIN_API_KEY                            # 部分任务的外部数据
MERCOR_DOCUMENT_API / MERCOR_DOCUMENT_API_KEY             # 快照类评分
GOOGLE_API_KEY                                            # LLM judge（Gemini）
```

ECR 凭据走 Modal secret（如 aws-ecr-oidc）。397B 需要 **S3 检查点**（s5cmd 必须在所有节点 PATH 上）。

### 10.4 权重与评测 traces（Hugging Face）

| 资产 | 位置 |
|-|-|
| 模型集合（2 权重 + 2 traces 数据集） | huggingface.co/collections/mercor/apexagents-skyrl-recipe |
| Qwen3.5-397B-A17B-Mercor | huggingface.co/mercor/Qwen3.5-397B-A17B-Mercor |
| Qwen3.6-35B-A3B-Mercor | huggingface.co/mercor/Qwen3.6-35B-A3B-Mercor |
| APEX-Agents 480 评测 traces | huggingface.co/datasets/mercor/ApexAgentsRecipe-ApexAgents480-EvalTraces |
| Terminal-Bench 2.1 评测 traces | huggingface.co/datasets/mercor/ApexAgentsRecipe-TBench2_1-EvalTraces |

---

## 11. 避坑清单（官方经验，全文最干的 16 条）

1. RL 之前先把环境、harness、token 记账做对：失败的 trajectory 既烧 GPU 又污染 reward。
2. harness 缺陷会让模型学会绕开 harness，烧掉本该花在任务上的探索预算。
3. 一切加 timeout：下载、MCP 交互、容器 teardown。
4. LLM judge 必须限流：多 key round-robin + backoff（数百并发就会触发）。
5. MCP client 按进程/Ray task 隔离，否则持续断连。
6. 错误分类 fail-the-trial vs retry，善用 Harbor 内置容错。
7. 以预期 RL 并发（300-600）先全量评估训练集，把非模型错误率压到接近 0；别依赖训练时 mask。
8. 读 trace 找 harness bug 慢但有效；用 coding agent 自动分析 trace、按 per-tool 失败率定位。
9. **TITO**：绝不重新 tokenize 推理输出（见 §10.1）。
10. 长程 agentic RL 默认全异步 + in-flight 权重更新，减少掉队者拖累。
11. 并发上限取 min(系统 KV 上限, 算法 staleness 上限)，算法上限公式见 §5.2。
12. 跑几步就做 train/inference logprob 对比（差 <0.03 健康）。
13. 先做 32 任务过拟合验证"可学习"；file-diff 类评分难过拟合，先查评分逻辑。
14. 评估纪律：3 遍取均值（±1-3 噪声）、1 分内算打平；看行为不看单点 reward。
15. 长程任务用 prompt_mean 聚合，别用 token_mean。
16. 你最好的单个算法 knob 也就 +3.9 分——瓶颈在数据与环境，不在 loss。

---

## 12. 我的复盘（几点独立判断）

1. **"配方"的重心已经位移**：开源社区里 RL 的 loss 公式早已卷到头（GRPO/DPPO/DAPO 满天飞），这篇工作真正值钱的部分是它把**环境工程、token 记账、异步并发、评测纪律**当成了一等公民——官方自己的量化（knob ≤ +3.9 vs 配方整体 +10-12）就是证据。Agent RL 的护城河从"算法"变成了"能把 100k token 轨迹正确稳定送进 trainer 的系统能力 + 高质量任务数据"。
2. **prompt_mean 是性价比最高的一行改动**：在 trajectory 长度方差两个数量级的场景里，聚合方式直接决定梯度由谁主导。任何开源 RL 框架的默认值（token_mean）在长程 agent 场景下都应该被质疑。
3. **无 SFT 热启动值得注意**：业界不少人默认"先 SFT 再 RL"，他们直接从基座做 RL 也出了结果。SFT warmup 也许只是 RLHF 时代的惯性，未必是 agentic RL 的必要条件（当然 35B 基座本身已做过 agentic post-training，这个前提不能忽略）。
4. **DPPO 这类"行为正则"类方法的价值被低估**：epoch-1 分数在噪声内，但行为信号（更多更短 turn、更高工具成功率）和稳定性指向长期更健康的训练。评估只看最终分数的团队会错过这类收益。
5. **对复现者最友好的部分**：数据格式、完整脚本、冒烟测试、traces 全公开；缺的只有训练数据本体（版权）和 300-800 张 H200/H100 的预算。想在自己数据上跑的团队，官方路线是"照抄格式做数据 → 先跑 1 GPU 冒烟 → 再上全异步"。
6. **局限也诚实说**：数据未开源导致严格复现不可能；博客正文的 Table 2/3/4 只以图片形式存在、正文文字没有逐格数字（本文已用图像识别逐格转成 Markdown 表格，读数可能有 ±0.1 量级误差）；消融表（Table 1）全文随仓库公开；消融评的是 epoch-1 checkpoint，最终权重与 epoch-1 之间还有距离；staleness、reward 归一化等细节仍有不少没有展开的灰色地带。
7. **一句话总结这篇工作的历史位置**：它把"agent RL 怎么做"从口头传说变成了**可下载、可运行、可对照**的工程配方——300B+ 开源 MoE 也能做知识工作 agent 的 RL 后训练这件事本身，是 2026 年开源阵营缩小与前沿模型差距的重要一步。

---

## 13. 资源清单（全部一手来源）

- 官方博客：Mercor × SkyRL，《Training frontier knowledge work agents: A 397B RL training guide with SkyRL》（2026-09-01）—— [https://www.mercor.com/blog/training-frontier-knowledge-work-agents-a-397b-rl-training-guide-with-skyrl](https://www.mercor.com/blog/training-frontier-knowledge-work-agents-a-397b-rl-training-guide-with-skyrl)
- 训练代码：https://github.com/Mercor-Intelligence/ApexAgents-SkyRL-Recipe
- HF 集合（权重 + traces）：https://huggingface.co/collections/mercor/apexagents-skyrl-recipe
- SkyRL（0.3.0 @ b8a5caaa）：https://github.com/NovaSky-AI/SkyRL
- SkyRL 全上下文训练 dummy 脚本：github.com/NovaSky-AI/SkyRL/tree/main/examples/train_scripts/full_context
- Harbor / Terminal-Bench：https://github.com/Terminal-Bench-Team（Harbor 为 terminal-bench 团队产物）
- Archipelago agent：https://github.com/Mercor-Intelligence/archipelago
- 系列前两篇：expert-data-drives-model-performance / scaling-data-apex-agents（Mercor blog）
- 相关论文线索：APEX-Agents (arXiv 2601.14242)；DPPO (arXiv 2602.04879)；GLM-5 (arXiv 2602.15763)；DAPO (arXiv 2503.14476)；ScaleRL (arXiv 2510.13786)；Dr. GRPO (arXiv 2503.20783)；原始 GRPO (arXiv 2402.03300)；ALP (arXiv 2506.05256)；"RL gains 绑 harness" (arXiv 2607.24653)；Tmax (arXiv 2606.23321)；Composer 2 (arXiv 2603.24477)；vLLM Agent Lightning 博客。

> 整理时间：2026-09-03。以上所有数字均来自官方博客、GitHub 仓库与 Hugging Face 模型/数据集卡原文。