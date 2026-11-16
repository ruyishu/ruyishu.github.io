---
title: '1116 OmniAgent：长视频别全看，让模型自己挑哪段画面、哪段声音'
description: '现在的视频模型看 2 小时的视频，是先均匀抽几百帧一股脑塞进去再回答。OmniAgent 反过来：模型先只拿到问题和视频时长，然后自己一轮一轮决定「去看哪一段的…'
pubDate: '2026-11-16'
---

> 2026-11-16 · 每日读论文 #79 · 本周领域 <strong>多模态推理 / 感知</strong>（第 1 周第 1 篇）· <strong>长视频别一口气看完：让模型自己挑画面、挑声音</strong> · 港中文 + 上交 + 阿里 Qwen 团队 · ICML 2026 Poster

## TL;DR

<strong>一句话：现在的视频模型看 2 小时的视频，是先均匀抽几百帧一股脑塞进去再回答。OmniAgent 反过来：模型先只拿到问题和视频时长，然后自己一轮一轮决定「去看哪一段的几帧」「去听哪一段音频」「去看带声音的哪个片段」，每轮看完写一段文字笔记，原始画面和音频随即扔掉，笔记攒够了再作答。</strong>

- <strong>做法</strong>：两阶段。① Agentic SFT：让 Gemini-3.0-Pro 在同一个视频环境里探索、每题采多条轨迹，留下答对的，再让 GPT-4o 给每步推理打 1–5 分、低于 3 分的扔掉，得到 58K 条轨迹，微调 Qwen2.5-Omni-7B；② Agentic RL：在 GRPO 基础上提出 TAURA，把整条轨迹的优势按「这一轮的平均 token 熵 ÷ 全组平均熵」放大或缩小，让犹豫最大的那几轮拿到更多的奖励或惩罚
- <strong>主结果（7B）</strong>：相对底座 Qwen2.5-Omni-7B，LVBench 43.0 → <strong>50.5</strong>，VideoMME-Long 54.8 → 59.6，VSI-Bench 35.5 → 48.4，OmniVideoBench 29.3 → 37.1；时间定位 LongVALE IoU 5.7 → <strong>39.1</strong>。LVBench 上平均只看 203 帧，超过看 768 帧的 Qwen2.5-VL-72B（47.3）
- <strong>算力</strong>：SFT 16×A100，RL 150 步 <strong>64×A100</strong>，超出单机 8 卡
- <strong>仓库</strong>：环境、RL 训练脚本（TAURA / GRPO 两套）、评测、SFT 配方、SFT-7B 和 RL-7B 两个权重都在；<strong>58K 条 SFT 轨迹没放</strong>
- <strong>主要问题</strong>：① TAURA 比普通 GRPO 只多 0.2–1.2 个点，大头来自用 Gemini 合成的 SFT 数据；② 单次实验、无方差；③ RL 卡数 64，单机复现没有现成配置；④ 推理每题 66.8 秒，比底座单次前向的 34.8 秒慢近一倍；⑤ 「熵高 = 关键一步」的证据由 Gemini-2.5-Pro 标注，且就在评测集 VideoMME 上做；⑥ 没有独立 Limitations 章节

## 文献信息

| 字段 | 内容 |
|-|-|
| 标题 | Native Active Perception as Reasoning for Omni-Modal Understanding（系统叫 OmniAgent，RL 算法叫 TAURA） |
| 作者（PDF / arXiv） | 11 人：Zhenghao Xing、Ruiyang Xu、Yuxuan Wang（共同一作）、Jinzheng He、Ziyang Ma、Qize Yang、Yunfei Chu、Jin Xu、Junyang Lin、Chi-Wing Fu、Pheng-Ann Heng；通讯 Jin Xu、Pheng-Ann Heng。前两位一作和 Ziyang Ma 注明是在 Qwen 团队实习期间完成 |
| 机构（PDF） | 香港中文大学、上海交通大学、阿里巴巴 Qwen 团队、南洋理工大学 |
| 作者（ICML 注册） | 同样 11 人、名字一致。<strong>机构有出入</strong>：Jinzheng He 注册写 Zhejiang University（PDF 写 Qwen 团队）；Yuxuan Wang、Qize Yang、Yunfei Chu、Junyang Lin 注册只写 Alibaba Group；Ziyang Ma 注册写 SJTU/NTU/SII。照实记录，不调和 |
| 会议 | <strong>ICML 2026 Poster</strong>。一手证据两条：① arXiv abs 页 Comments 逐字为 Accepted at ICML 2026. Code and models: this https URL；② ICML 官方 icml-2026-orals-posters.json（6797 条）id 66448，decision 逐字 Accept (regular)，eventtype Poster，OpenReview 3dLPVNhFZh。阳性对照：同表 ZwZ（62952）、Video-OPD（63325）均为 Accept (regular) |
| arXiv | 2606.19341（v1 2026-06-17，v2 2026-07-17） |
| 代码 | <a href="https://github.com/HarryHsing/OmniAgent">HarryHsing/OmniAgent</a>，Apache-2.0，90 star，最后推送 2026-09-18。基于 verl + verl-agent 改造。README 写 2026-09 已并入 Qwen3.8-Omni-Flash |
| 仓库有什么 | 有：gym 式视频环境 agent\_system/（reset / step，动作 get\_frames / get\_audio / get\_clip / answer）；RL 训练脚本 train\_TAURA.sh 和 train\_GRPO.sh；SFT 配方 recipe/sft\_agent\_final.yaml；轨迹合成、过滤、导出脚本 inference/；单样本推理、批量评测、web demo；<a href="https://huggingface.co/harryhsing/OmniAgent-SFT-7B">SFT-7B</a> 和 <a href="https://huggingface.co/harryhsing/OmniAgent-RL-7B">RL-7B</a> 两个权重 |
| 仓库缺什么 | <strong>58K 条 SFT 轨迹没放</strong>：配方里 5 个数据路径都是 /path/to 占位，data/ 只有 example\_train\_sft / example\_train\_rl / example\_eval 三个格式样例。重做要自己调 Gemini 合成、GPT-4o 审核（闭源 API 花钱）。RL 训练题（SFT 阶段没采到正确轨迹的难题）也没单独放出。README 只给 64×A100 的训练建议，没有单机 8 卡配置 |
| 底座与算力 | Qwen2.5-Omni-7B（冻结视觉、音频编码器，全参微调 LLM）。SFT 16×A100；RL 64×A100；推理 1×A100 |
| 关键超参 | SFT：58K 轨迹、2 epoch、lr 1e-5、batch 64、K（最大轮数）随时长取 5–32。RL：150 步、组大小 8、lr 1e-6 恒定、clip 下 0.2 / 上 0.3（DAPO 式 token 级 loss）、global batch 256、无 KL 无熵正则、K 取 5–10、RL 视频限 300 秒以内；上下文 64K，单帧最多 768 个视觉 token。脚本里 train\_data\_size=32、max\_steps=22（和论文 K∈\[5,10\] 不一致，脚本启用了动态步数 USE\_DYNAMIC\_STEP） |

## 一、先看例子（大白话：140 分钟的发布会录像里，穿绿裙子的主持人叫什么）

论文附录 Figure 6 的题目：一段约 140 分钟的 Cisco 发布会录像，问「穿绿裙子的主持人叫什么？」四个选项 Steve Multer / Petek Ergul / Nish Parkar / Carrie Palin。

<strong>普通做法</strong>：在 140 分钟里均匀抽 200 来帧（约每 40 秒一帧）塞给模型。主持人的名字只在某个画面下方的字幕条里出现几秒，大概率根本没被抽到；就算抽到了，也被几百张无关帧淹没。

<strong>OmniAgent 的做法</strong>（论文给的真实轨迹，省略了中间几轮）：

1. 先在整段视频里粗扫几轮，发现开头像是演播室片段，没看到绿裙子，也没看到名牌
2. 笔记：「演播室一男一女两位主持人……开场的 200 秒没细看」。动作：get\_frames(0, 200, 50)，在前 200 秒抽 50 帧
3. 笔记：「8.16 秒和 175.51 秒有个穿绿裙子的女主持人，站在两位男主持人旁边」。动作：get\_audio(8, 18)，去听开场有没有报名字
4. 听到的只是预告片配乐。动作：get\_audio(18, 48)，接着听正式开场
5. 又绕了几轮（比如去 170 秒、424 秒附近找她重复出现的地方），最后决定：get\_frames(48, 160, 30)，在开场后找字幕条
6. 笔记：「55.72 秒有字幕条写着 Nish Parkar，正好在绿裙子主持人下方」。动作：answer(C)

关键在两点：<strong>看什么是模型自己按问题决定的</strong>（先找人、再听名字、听不到就转去找字幕）；<strong>每轮看完只留一段文字</strong>，前一轮的画面和音频被清掉，所以上下文长度跟着「看了几轮」走，而不是跟着「视频多长」走。

![论文 Figure 6 顶部：问题与视频缩略。约 140 分钟的发布会录像，问穿绿裙子的主持人叫什么，正确答案 C（Nish Parkar）。OmniAgent 最终在 55.72 秒的字幕条里找到名字](/images/paper-reading/2026-11-16-omniagent/2026-11-16-d80-1.webp)

## 二、动机

作者把现有长视频方法分成三类，各有毛病：

- <strong>被动「全看」</strong>（Qwen2.5-VL、LongVU 等）：不管问题难易都均匀抽帧，计算量随时长涨；帧抽多了还会互相干扰。论文 Table 4 里一个佐证：在静态问答上做普通 SFT，LVBench 反而从 43.0 掉到 41.6
- <strong>LLM 当调度员、调外部工具</strong>（VideoAgent 一类，调字幕、ASR、检索、跟踪）：感知被外包给别的模块，看到什么全靠工具转述，梯度也传不回感知
- <strong>把「看图时放大」搬到视频</strong>（Zoom-Zero、LongVT、VITAL 等）：通常要先全局扫一遍（比如 Zoom-Zero 固定先吃 256 帧）或者一直留着一大堆帧，上下文成本还是跟视频长度挂钩

OmniAgent 的主张：环境只负责「切」——按要求给出帧、音频或片段；<strong>所有看、听、想、决定都由同一个 omni 模型完成</strong>，并且每轮把看到的东西压成文字笔记，原始媒体用完即扔。

RL 这一步的动机是「优势同质化」：GRPO 给整条轨迹一个分，十几轮里每一轮拿到的都一样，「决定转去找字幕」这种关键一轮和「再抽几帧确认」这种例行一轮被一视同仁。

## 三、方法

![论文 Figure 1。左：初始只给问题 Q 和视频元信息（时长 2448.59 秒、FPS 29.97、有音轨）。中：每轮模型读取持久记忆，生成 观察 O / 思考 T / 动作 A 三段；环境执行动作取回新的画面或音频，上一轮的原始媒体被清掉。右：一轮实例，观察写下 1315–1330 秒 10 帧里看到男人在酒店吃蟹，思考认为需要听音频判断蟹是抓的、买的还是别人送的，动作是 get_audio(1315, 1330)](/images/paper-reading/2026-11-16-omniagent/2026-11-16-d80-2.webp)

### 3.1 观察-思考-行动（OTA）循环

- <strong>初始状态</strong>：只有问题和元信息（时长、帧率、有没有音轨），一帧都不给
- <strong>每轮输出三段</strong>：观察 O（把上一轮拿到的画面 / 音频写成文字，比如「1315–1330 秒，10 帧：一个男人在酒店房间吃蟹腿，没看到其他家人」）、思考 T（还缺什么证据）、动作 A
- <strong>4 种动作</strong>：get\_frames(起, 止, 帧数) 在区间内均匀抽帧；get\_audio(起, 止) 取音频；get\_clip(起, 止) 取带声音的连续片段；answer(答案) 结束
- <strong>记忆整理</strong>：观察写完后，上一轮的原始媒体从上下文里删掉，只留文字。所以模型任何时候手里最多只有「一轮的原始媒体 + 全部文字笔记」
- <strong>最大轮数 K</strong> 随视频时长变：SFT 时 5–32 轮，RL 时 5–10 轮

### 3.2 Agentic SFT：用 Gemini 在环境里探索，造 58K 条轨迹

1. <strong>数据源</strong>：5 个训练集——LongVideo-Reason、Video-Holmes、VSI-Train-10k、LongVALE、MultiHop-EgoQA，题型是选择题、数值题、时间定位
2. <strong>合成</strong>：给 Gemini-3.0-Pro 同一套指令模板，在同一个环境里每题跑 best-of-N。允许它先出错（比如时间戳越界），看到环境报错后自己改——这些「出错-改正」的轨迹也保留，让学生学会读报错
3. <strong>两道过滤</strong>：① 结果对：选择题、数值题必须完全答对，时间定位 IoU ≥ 0.5，尺寸估计 MRA ≥ 0.5；② 推理合理：GPT-4o 检查每一步思考是否能由已有笔记推出来，1–5 分，低于 3 分整条扔掉，用来过滤「蒙对的」
4. <strong>训练</strong>：冻结视觉和音频编码器，全参微调 LLM，2 epoch

### 3.3 Agentic RL：TAURA（按每轮的熵给优势加权）

<strong>奖励</strong>：选择题 / 数值题答对 1 分、答错 0 分；时间定位给 IoU；尺寸估计给 MRA。没有格式分、没有过程分。

<strong>先算普通 GRPO 优势</strong>：一组 8 条轨迹，A\_i = (R\_i − 组内平均) ÷ 组内标准差。

<strong>再按轮加权</strong>：设第 i 条轨迹第 k 轮所有 token 的平均熵为 H\_ik，全组所有轮的平均熵为 H̄（把 8 条轨迹的所有轮放在一起平均）。这一轮所有 token 的优势改成 A\_i × H\_ik ÷ H̄。

用数字说一下：假设一条轨迹答对了，A\_i = +1.0，全组平均熵 0.80。

- 某一轮在犹豫「该听音频还是去找字幕」，平均熵 0.93，权重 0.93 ÷ 0.80 ≈ 1.16，这一轮 token 的优势变成 +1.16
- 另一轮只是「再抽几帧确认一下」，熵 0.70，权重 0.875，优势变成 +0.875
- 如果整条答错，A\_i = −1.0，那犹豫的那一轮被罚得更重（−1.16）

因为是除以全组平均，组内权重的期望是 1，整体梯度量级不变，只是在轮之间重新分配。作者强调这里是<strong>连续加权、按轮</strong>，不是像「只训高熵 token」那样按 token 二值屏蔽——屏蔽 token 会打碎 O/T/A 的结构，整轮屏蔽又会切断上下文。

其他设置照 DAPO：token 级 loss、clip-higher（下 0.2 / 上 0.3），不加 KL、不加熵正则。RL 只用 SFT 阶段 best-of-N 没采到正确轨迹的难题，且视频都在 300 秒以内。

<strong>熵为什么能代表「关键一轮」</strong>：附录 C 让 Gemini-2.5-Pro 在 VideoMME 上答对的轨迹里挑出「最关键的分岔一步」，统计发现 79.2% 的分岔步平均熵高于整条轨迹均值。

## 四、实验

### 4.1 主结果

10 个基准，三类：视频理解、音视频联合、时间定位。下表只摘和底座的对比（论文 Table 1–3）：

| 基准 | 视频时长 | Qwen2.5-Omni-7B | OmniAgent-7B | 涨幅 |
|-|-|-|-|-|
| VideoMME 全部 | 1–60 分钟 | 64.8 | 67.8 | +3.0 |
| VideoMME 长视频 | 30–60 分钟 | 54.8 | 59.6 | +4.8 |
| VSI-Bench | 约 97 秒 | 35.5 | 48.4 | +12.9 |
| MLVU | 3–120 分钟 | 65.2 | 71.1 | +5.9 |
| Minerva | 2–90 分钟 | 33.4 | 41.4 | +8.0 |
| LVBench | 约 68 分钟 | 43.0 | 50.5 | +7.5 |
| DailyOmni（音视频） | 43 秒 | 60.1 | 64.8 | +4.7 |
| WorldSense（音视频） | 141 秒 | 45.4 | 47.2 | +1.8 |
| OmniVideoBench（音视频） | 384 秒 | 29.3 | 37.1 | +7.8 |
| LongVALE（定位 IoU） | 233 秒 | 5.7 | 39.1 | +33.4 |
| VUE-TR 视觉+音频（IoU） | 约 18 分钟 | 3.5 | 36.5 | +33.0 |

和别的 7B 比：LVBench 50.5 高于 Zoom-Zero 45.7、LongVT 41.3、Qwen2.5-VL-7B 45.3，也高于 Qwen2.5-VL-72B 的 47.3。但 VideoMME 长视频那一列，59.6 只比 LongVU 的 59.5 高 0.1；MLVU 那一列 71.1 只比 Zoom-Zero 的 70.8 高 0.3。闭源方面，Gemini-2.5-Pro 在 LVBench 是 67.4、Minerva 66.2，差距依然很大。

![论文 Figure 3，LVBench 准确率 vs 平均帧数。OmniAgent-7B 用约 203 帧得 50.5；Qwen2.5-VL-72B 用 768 帧得 47.3；Zoom-Zero-7B 约 390 帧得 45.7；Qwen2.5-Omni-7B 约 130 帧得 43.0。菱形是 agent 类，圆点是被动模型，圆点大小代表参数量](/images/paper-reading/2026-11-16-omniagent/2026-11-16-d80-3.webp)

### 4.2 关键消融：涨分到底从哪来

![论文 Table 4（上）与 Figure 2（下）。上：从底座到普通 SFT、Agentic SFT、再到 GRPO 和 TAURA 的逐级结果。下：VideoMME 长视频上把最大轮数 K 从 6 放到 52，准确率 53.4 到 59.6，实际平均轮数 5.0 到 11.7 后停住](/images/paper-reading/2026-11-16-omniagent/2026-11-16-d80-4.webp)

| 阶段 | VideoMME 长 | LVBench | MLVU | OmniVideo | DailyOmni |
|-|-|-|-|-|-|
| 底座 | 54.8 | 43.0 | 65.2 | 29.3 | 60.1 |
| + 普通 SFT（静态问答） | 56.0 | 41.6 | 67.1 | 33.8 | 61.7 |
| + Agentic SFT | 57.3 | 48.7 | 69.9 | 35.2 | 63.3 |
| SFT 后 + 普通 GRPO | 59.4 | 49.8 | 69.9 | 35.3 | 62.2 |
| SFT 后 + TAURA | <strong>59.6</strong> | <strong>50.5</strong> | <strong>71.1</strong> | <strong>37.1</strong> | <strong>64.8</strong> |

拆开看 LVBench 的 7.5 分：Agentic SFT 贡献 5.7（43.0 → 48.7），普通 GRPO 再加 1.1，TAURA 比 GRPO 再加 0.7。VideoMME 长视频那一列 TAURA 比 GRPO 只多 0.2。TAURA 最明显的是 DailyOmni（GRPO 62.2，比 SFT 还掉 1.1；TAURA 64.8）和 OmniVideo（35.3 → 37.1）。

### 4.3 其他分析

- <strong>测试时扩展</strong>（Figure 2）：VideoMME 长视频上 K 从 6 到 52，准确率 53.4 → 54.9 → 56.2 → 57.9 → 57.8 → 59.6，实际平均轮数 5.0 → 11.7 后基本不涨。注意 RL 时 K 只开到 10，推理时开到 52 还能涨
- <strong>时长分析</strong>（Table 5，LVBench）：视频从 20–40 分钟到 120–140 分钟，平均轮数 8.5 → 12.5，准确率 53.7 / 52.1 / 45.3 / 48.0 / 53.2 / 50.8，没有随时长单调下降（60–80 分钟这档最低 45.3）
- <strong>速度</strong>（附录 Table 7，LVBench 100 题）：两者都约 200 帧：OmniAgent 每题 66.8 秒、准确率 51.0；Qwen2.5-VL-72B 75.1 秒、47.0（要 4 张 A100）；LongVT 67.6 秒、42.0；底座 Qwen2.5-Omni 单次前向 34.8 秒、41.0

## 五、Limitations

<strong>⚠️ 本篇没有独立 Limitations 章节。</strong>结论段只有一句：多轮交互带来延迟，未来考虑并行探索。

<strong>读出来的问题</strong>：

1. <strong>标题卖 TAURA，涨分主要靠 SFT 数据</strong>：LVBench 7.5 分里 5.7 分来自 Agentic SFT，TAURA 比普通 GRPO 只多 0.7；VideoMME 长视频只多 0.2。而 SFT 数据是 Gemini-3.0-Pro 探索出来、GPT-4o 审过的，本质上是把闭源模型的主动观看能力蒸馏进 7B
2. <strong>单次实验、没有方差</strong>：0.2–1.2 分的差距在视频基准上很容易落在随机波动里，论文没有多种子、没有置信区间
3. <strong>算力不友好</strong>：RL 用 64×A100、SFT 用 16×A100。仓库脚本能按卡数自动缩 batch，但没有任何单机 8 卡的结果或配置，单机复现效果未知
4. <strong>数据没放全</strong>：58K 条 SFT 轨迹不公开，配方里全是占位路径。想从头复现，要么花钱调 Gemini 重新合成，要么只能从放出的 SFT-7B 权重起步
5. <strong>「熵高 = 关键一步」的证据偏弱</strong>：分岔步是 Gemini-2.5-Pro 标的，只挑答对的轨迹，而且就在评测集 VideoMME 上做；79.2% 高于均值也意味着约 1/5 的关键步熵并不高
6. <strong>帧数前后对不上</strong>：Figure 3 把底座 Qwen2.5-Omni-7B 画在约 130 帧处，附录 Table 7 却写底座用 201 帧、OmniAgent 用 201.6 帧。如果按 Table 7，同样约 200 帧下底座 41.0、OmniAgent 51.0，反而是比 Figure 3 更有力的证据，但两处数字需要作者澄清
7. <strong>SOTA 措辞偏满</strong>：VideoMME 长视频比 LongVU 高 0.1、MLVU 比 Zoom-Zero 高 0.3，基本是持平
8. <strong>速度代价</strong>：66.8 秒对底座 34.8 秒，慢近一倍；作者把它和 72B 比显得快，但部署时真正的对手是同尺寸的单次前向
9. <strong>超参文档对不上</strong>：论文说 RL 时最大轮数 5–10，公开脚本 max\_steps=22 加动态步数；读者照脚本跑未必等于论文设置

## 六、前文对照

| 前文 | 它怎么做 | 和 OmniAgent 的关系 |
|-|-|-|
| ACTIVE-o3（08-27） | 纯 GRPO 训练 MLLM 在图像上主动挑区域放大看 | 同是「主动感知」。ACTIVE-o3 在单张图的空间上挑区域，OmniAgent 在长视频的时间轴上挑片段，还多了「听」这个动作 |
| ZwZ（11-02） | 把放大看的能力蒸馏进权重，推理时不用工具，一次前向 | 方向正好相反：ZwZ 想去掉多轮工具调用省时间，OmniAgent 认为长视频必须多轮看。两篇放在一起能看出：图像可以内化，小时级视频目前还内化不了 |
| Video-OPD（11-03） | 视频时间定位用 on-policy 蒸馏代替 GRPO | 都做视频时间定位。OmniAgent 在 LongVALE 上 IoU 从 5.7 涨到 39.1，靠的是一轮轮缩小区间；Video-OPD 是单次输出。也都离不开强老师——OmniAgent 的老师在 SFT 数据里 |
| Context-Folding（11-09） | agent 开分支干细活，回来只留一句总结 | 同一招「用完即压缩」：Context-Folding 压缩工具调用历史，OmniAgent 把每轮的原始画面和音频压成文字笔记后丢掉 |
| HiPER（10-30）/ GiGPO（09-08） | 多轮 agent 的步级信用分配：层级子任务 / 按相同状态再分组 | TAURA 是同一问题的最便宜解法：不需要额外 rollout，也不需要状态匹配，只用每轮已有的熵加权。代价是熵只是「犹豫」的代理，不等于「这一步做对了」 |

## 七、启发与待跟进

- <strong>最便宜的起点</strong>：直接拿放出的 OmniAgent-SFT-7B 权重，在单机 8 卡上用 train\_GRPO.sh / train\_TAURA.sh 各跑一遍（batch 按卡数缩小、视频限 300 秒），先确认 TAURA 比 GRPO 的差距在小 batch、多种子下是否还在
- <strong>换掉熵这个代理</strong>：TAURA 只看「犹豫程度」。可以试按「这一轮拿回来的证据有没有改变答案分布」来加权（比如答案选项概率在这一轮前后的 KL），更接近「这一步有没有用」
- <strong>补对照</strong>：普通 SFT 用同样 58K 条题目但不带轨迹；看 Agentic SFT 的 5.7 分里多少来自「多轮格式」、多少来自 Gemini 的探索质量
- <strong>迁移到图像</strong>：把 get\_frames 换成「放大某块区域」，OTA + 笔记压缩 + TAURA 能直接搬到高分辨率图像和文档问答，和 ZwZ / DoF 那条线做对比
- <strong>待查</strong>：Qwen3.8-Omni-Flash 里具体用了哪部分；有没有第三方复现；单机 8 卡的实际效果

## 八、结论

OmniAgent 把长视频理解改成了「先只看问题，再一轮一轮按需去看、去听，每轮写笔记、扔原片」。7B 模型在 LVBench 上从 43.0 涨到 50.5，平均只看 203 帧就超过看 768 帧的 72B；时间定位 IoU 从个位数涨到 39。Qwen 团队出品、已进产品，环境和 RL 脚本、两个权重都在，适合拿来当长视频 agent 的 baseline。

需要打折看的地方：标题里的 TAURA 只比普通 GRPO 多 0.2–1.2 分，大头是 Gemini 合成的 SFT 数据，而这批数据没放出来；RL 要 64 张 A100；推理比底座慢近一倍；单次实验、没有方差。

> 💡 <strong>今日一句</strong>：长视频的瓶颈常常不在想得不够深，而在没看到那几秒——先学会去哪儿看，比把所有帧塞进去更管用。
