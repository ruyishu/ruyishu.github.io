---
title: '1117 Open-o3-Video：答案旁边写上「第几秒、哪个框」，让视频推理自带证据'
description: '现在的视频推理模型（Video-R1、VideoRFT）只会写一大段文字理由，你没法核对它到底看了哪一帧。Open-o3-Video 让 7B 模型在思考过程里…'
pubDate: '2026-11-17'
---

> 2026-11-17 · 每日读论文 #80 · 本周领域 <strong>多模态推理 / 感知</strong>（本周第 2 篇）· <strong>答案旁边写上「第几秒、哪个框」：让视频推理自带证据</strong> · 北大 + 字节跳动 · ICML 2026 Poster

## TL;DR

<strong>一句话：现在的视频推理模型（Video-R1、VideoRFT）只会写一大段文字理由，你没法核对它到底看了哪一帧。Open-o3-Video 让 7B 模型在思考过程里直接写出「物体 + 框坐标 + 第几秒」，比如「9.0 秒，那个男人在 \[249,60,395,252\]」，证据跟着推理一起出来，不调用任何外部工具，一次推理完成。</strong>

- <strong>做法</strong>：先造数据，再两阶段训。① 数据 STGR：用 Gemini 2.5 Pro 给视频标「问题 + 关键帧时间 + 物体框 + 引用这些框的思维链」，自己新标 5.9k 条，再拼上现成的时间定位、图像定位和通用视频问答数据，得到 SFT 用的 30k 和 RL 用的 36k；② SFT 冷启动学会输出格式；③ GSPO 强化，奖励 = 答对分 + 思考分（时间对不对 + 框准不准）+ 格式分
- <strong>两个奖励小技巧</strong>：时间奖励用高斯打分，宽度 σ 从 4 秒逐步收到 1 秒（前期给分松、后期严）；框的 IoU 只有在时间点离标注足够近时才计分（时间门控），防止在错误的时刻框对了一个显眼物体也拿分
- <strong>主结果（Qwen2.5-VL-7B 底座）</strong>：时空推理基准 V-STAR 上 mAM 19.3 → <strong>33.7</strong>，mLGM 22.4 → <strong>46.6</strong>，超过 GPT-4o（26.8 / 38.2）；VideoMME 62.4 → 63.6，长视频 50.8 → 54.9
- <strong>算力与仓库</strong>：<strong>单机 8×H100</strong>；SFT、RL、评测脚本，7B 权重，STGR 两份 json 都放了
- <strong>主要问题</strong>：① 两个奖励技巧各自只值 0.7–1.4 分，单次实验无方差；② 通用视频基准上和 VideoRFT / Video-R1 基本打平，有几列还更低；③ 「Where」那一列（框准不准）Chain2 只有 6.0；④ 公开代码里时间门控阈值是 1 秒且只挡「早报」不挡「晚报」，和论文写的 3 秒不一致；⑤ Figure 2 两个饼图的数据集名标反了

## 文献信息

| 字段 | 内容 |
|-|-|
| 标题 | Open-o3-Video: Grounded Video Reasoning with Explicit Spatio-Temporal Evidence |
| 作者（PDF / arXiv） | 11 人：Jiahao Meng、Xiangtai Li、Haochen Wang、Yue Tan、Tao Zhang、Lingdong Kong、Yunhai Tong、Anran Wang、Zhiyang Teng、Yujing Wang、Zhuochen Wang；通讯 Yunhai Tong（北大）、Xiangtai Li（字节） |
| 机构（PDF） | 北京大学、字节跳动、中科院自动化所、武汉大学、新加坡国立大学 |
| 作者（ICML 注册） | 同样 11 人、名字一致（注册写 Tan Yue，PDF 写 Yue Tan）。<strong>机构有出入</strong>：PDF 里 Jiahao Meng 标北大 + 字节，注册只写北大；Haochen Wang 标字节 + 中科院自动化所，注册只写自动化所；Tao Zhang 标字节 + 武大，注册机构为空；Lingdong Kong 标字节 + NUS，注册只写 NUS。照实记录，不调和 |
| 会议 | <strong>ICML 2026 Poster</strong>。一手证据：ICML 官方 icml-2026-orals-posters.json（6797 条）id 62140，decision 逐字 Accept (regular)，eventtype Poster，OpenReview jSSBKgH86z。阳性对照：同表 ZwZ（62952）、Video-OPD（63325）均为 Accept (regular)。arXiv abs 页没有 Comments 和 Journal-ref 字段；仓库 README 写 2026.05.01 被 ICML 2026 接收（非一手，仅佐证） |
| arXiv | 2510.20579（v1 2025-10-23，v2 2026-03-18） |
| 代码 | <a href="https://github.com/marinero4972/Open-o3-Video">marinero4972/Open-o3-Video</a>，Apache-2.0，164 star，最后推送 2026-10-14（发布 v2 的消息）。基于 R1-V / Video-R1 的 trl 式 trainer + DeepSpeed，不是 verl |
| 仓库有什么 | 有：SFT 脚本 run\_sft\_video.sh、RL 脚本 run\_grpo\_video.sh（文件名叫 grpo，trainer 里 gspo=True，按序列算重要性比）；奖励函数 reward\_func.py（σ 退火、时间门控、IoU 都在）；评测 eval/（V-STAR、VideoMME、VideoMMMU、WorldSense）和 vLLM 推理样例；<a href="https://huggingface.co/marinero4972/Open-o3-Video">7B 权重</a>；<a href="https://huggingface.co/datasets/marinero4972/Open-o3-Video">STGR 数据</a>（STGR-SFT.json、STGR-RL.json、自标视频 stgr.zip、VideoEspresso 关键帧） |
| 仓库缺什么 | 其余视频源（gqa、timerft、treevgr、tvg\_r1、videor1）要自己去原数据集下载拼目录；README 里的 Qwen3-VL-8B 结果没有对应脚本和权重；没有写训练时长；<strong>代码里的门控阈值和论文不一致</strong>（见第五节） |
| 底座与算力 | Qwen2.5-VL-7B，<strong>8×H100 单机</strong>；训练每个视频均匀取 16 帧，每帧不超过 128×28×28 像素，帧前加绝对时间戳 |
| 关键超参 | SFT：STGR-CoT-30k，1 epoch，lr 1e-6，每卡 batch 1，ZeRO-2。RL：STGR-RL-36k，1 epoch，lr 1e-6 余弦，每卡 batch 1，<strong>每题只采 4 条</strong>，KL 系数 0.04，clip 0.2，ZeRO-3，最长输出 768 token。σ 从 4 退火到 1（训练进度 3/4 之后固定 1），论文写门控阈值 τ=3 秒。评测 V-STAR 16 帧、其他基准 64 帧 |

## 一、先看例子（大白话：人们为什么纪念屈原）

论文 Figure 1：一段 77 秒的端午节动画，问「根据视频，人们纪念屈原的主要原因是什么？」A 因为爱吃粽子；B 因为他投汨罗江自尽；C 因为他给国家带来了和平与繁荣；D 因为他被流放。正确答案 C。

<strong>普通视频推理模型</strong>：Qwen2.5-VL-7B 直接答 B。Video-R1-7B 和 VideoRFT-7B 都写了一大段理由，提到「正直忠诚」「带来和平繁荣」，最后还是落到「投江是核心事件」选了 B。你看完理由也没法判断它们看到了哪一幕。

<strong>Open-o3-Video</strong> 的思考里夹着两条证据：

1. 「开头出现一个 <strong>男人 \[249,60,395,252\]，在 9.0 秒</strong>，被介绍为楚国伟大的爱国诗人」
2. 「人们向 <strong>这个男人 \[472,70,612,269\]，在 24.0 秒</strong> 鞠躬」

然后结论是「纪念他是因为他带来了和平与繁荣」，选 C。

关键在于：<strong>你可以拿着 9.0 秒和 24.0 秒去视频里核对</strong>，看那两个框是不是真框住了屈原。答错了也能看出是「看错了帧」还是「看对了但想错了」。这就是标题里 o3 的意思——像 OpenAI o3 看图时边推理边圈出区域，只是这里搬到了视频，还多了「第几秒」这一维。

![论文 Figure 1。左上：题目与视频截图；左下：Qwen2.5-VL-7B 和 Video-R1-7B 都选 B；右上：VideoRFT-7B 也选 B；右下：Open-o3-Video 在思考里写出 9.0 秒和 24.0 秒的人物框，最终选 C](/images/paper-reading/2026-11-17-open-o3-video/2026-11-17-d81-1.webp)

## 二、动机

- <strong>文字理由不可核对</strong>：Video-R1、VideoRFT 这类 RL 视频推理模型只输出文字，证据在哪一帧、哪个位置全靠猜
- <strong>已有定位工作只做一半</strong>：Time-R1、TVG-R1 只定位时间段；图像上的 DeepEyes、TreeBench 只框空间。视频里要同时回答「什么时候」和「在哪儿」
- <strong>数据是硬缺口</strong>：时间定位数据集只有时间段没有框；稠密描述数据有框但没有时间戳；几乎都没有把物体和时间写进思维链的标注。没有同步的时空标注，RL 就算不出可验证的奖励
- <strong>不想走 agent 路线</strong>：同期的 VITAL、Conan、LongVT 让模型反复调「截片段」工具；作者要单轮推理、不调工具，直接在输出里写证据
- <strong>训练难点：空间奖励塌缩</strong>。框的 IoU 只有在时间点对上时才有意义；训练早期时间总是报不准，空间奖励几乎全是 0，框的能力学不起来

## 三、方法

![论文 Figure 3。（a）冷启动：在 STGR-CoT-30k 上微调底座，学会在思考里写 物体-框-时间。（b）GSPO 强化：奖励 = 格式分 + 答对分 + 思考分。图中一个时间点 6.0 秒离标注 9.2 秒太远，时间分 0.3、门控后框分为 0；另一个 11.0 秒离 10.8 秒很近，时间分 0.9，框分按 IoU 计](/images/paper-reading/2026-11-17-open-o3-video/2026-11-17-d81-2.webp)

### 3.1 数据：STGR-CoT-30k 和 STGR-RL-36k

<strong>自己新标的 5.9k 条</strong>（3.9k 来自 ActivityNet、COIN、QVHighlight 等时间定位数据，2k 来自 PLM-Rdcap 稠密描述）：

1. <strong>Gemini 2.5 Pro 初标</strong>：每条给出一个围绕某个物体或人的问答对、1–5 个关键帧、每帧 1–3 个物体框，以及一段必须用 物体-框-时间 格式引用每个物体的思维链
2. <strong>框过滤</strong>：占画面 80% 以上的框直接扔；每个框裁出来问 Qwen2.5-VL-7B「这是不是 {物体名}？」，答 yes 才留
3. <strong>一致性检查</strong>：思维链里提到的每个时间和框都必须在关键帧标注里；每句话和它引用的区域再让 Qwen2.5-VL 判一遍语义是否对得上。PLM 那部分 3k 条标完只剩 2k

<strong>拼成两份训练集</strong>（正文 3.1 节的数字）：

| 类别 | SFT：STGR-CoT-30k | RL：STGR-RL-36k |
|-|-|-|
| 只有时间 | 4.1k（TVG-Coldstart） | 5.2k（Time-R1 2.3k + TVG-RL 2.9k） |
| 只有空间 | 5k（TreeVGR-SFT） | 5k（VisCoT） |
| 时空都有 | 5.9k（自标） | 10.9k（自标 5.9k + 过滤后的 VideoEspresso 5k） |
| 通用视频问答 | 15k（Video-R1-CoT） | 15k（Video-R1） |

![论文 Figure 2。左：标注流程，Gemini 2.5 Pro 初标、框过滤、一致性检查，产出 5.9k 条时空数据。右：两份训练集的构成饼图。注意饼图上的数据集名和正文对不上，上面标 STGR-CoT-30k 的饼其实是 RL 的配比，见第五节](/images/paper-reading/2026-11-17-open-o3-video/2026-11-17-d81-3.webp)

### 3.2 输出格式

思考里每提到一个物体，就写成 物体名 + 框 \[x1,y1,x2,y2\] + 在第几秒，然后在答案标签里给最终答案。不调用工具、不再看第二遍视频，一次生成完。

### 3.3 训练：SFT 冷启动 + GSPO

GSPO 和 GRPO 的区别：GRPO 每个 token 单独算新旧策略的概率比再裁剪；GSPO 把整条回答的对数概率比取平均，得到一个序列级比值，整条一起裁剪。作者的理由是奖励本来就是给整条回答的。

### 3.4 奖励：答对分 + 思考分 + 格式分

- <strong>答对分</strong>：选择题对就 1；开放问答用 ROUGE；空间定位题用框的 IoU；时间定位题用时间段 IoU
- <strong>格式分</strong>：思考和答案标签齐全、且物体-框-时间格式正确给 1.0；只有思考和答案标签给 0.5；否则 0
- <strong>思考分 = 时间分 + 空间分</strong>，下面展开

<strong>时间分（自适应时间邻近）</strong>：标注是一个时间段时，报的时间落在段内就算 1；标注是若干时间点时，每个报出的时间点 t 找最近的标注点，差 Δ 秒，得分 exp(−Δ² / 2σ²)，再对所有报出的点取平均。

用数字说一下 σ 为什么要退火。假设模型报 6.0 秒，标注是 9.2 秒，差 3.2 秒：

- 训练初期 σ=4：得分 exp(−10.24/32) ≈ <strong>0.73</strong>，虽然不准也有不少分，梯度不会断
- 训练后期 σ=1：得分 exp(−10.24/2) ≈ <strong>0.006</strong>，几乎没分，逼模型把时间报准
- 如果报 9.0 秒（差 0.2 秒），σ=1 时得分 exp(−0.02) ≈ 0.98

只用小 σ，早期全是 0 分学不动；只用大 σ，差 3 秒也有 0.7 分，奖励很快饱和、不再推动时间变准。所以 σ 从 4 线性降到 1，训练进度过 3/4 之后固定为 1。

<strong>空间分（时间门控）</strong>：对每个报出的时间点，找最近的标注帧；只有两者相差不超过 τ（论文写 3 秒）时，才算报出的框和该帧标注框的最大 IoU，否则这一点的空间分记 0。最后对所有时间点平均。目的是不让模型在错误时刻框中一个显眼的物体也拿分。

<strong>总奖励</strong> = 答对分 + 思考分 + 格式分，组内归一化后当 GSPO 的优势。

## 四、实验

### 4.1 主结果：V-STAR（论文 Table 1）

V-STAR 要求模型先答「是什么」，再给出「什么时候」（时间 IoU）和「在哪儿」（框 IoU）。Chain1 是「什么-何时-何地」的顺序，Chain2 是「什么-何地-何时」。mAM 和 mLGM 是两种综合分。

| 模型 | What 准确率 | When Chain1 | When Chain2 | Where Chain1 | Where Chain2 | mAM | mLGM |
|-|-|-|-|-|-|-|-|
| GPT-4o | 60.8 | 16.7 | 12.8 | 6.5 | 3.0 | 26.8 | 38.2 |
| Gemini-2-Flash | 53.0 | 24.5 | 23.8 | 4.6 | 2.2 | 26.9 | 35.6 |
| Sa2VA-8B（专做框） | 16.4 | 0.1 | 0.0 | <strong>32.3</strong> | <strong>37.5</strong> | 17.1 | 20.3 |
| Qwen2.5-VL-7B（底座） | 33.5 | 15.4 | 13.8 | 17.0 | 2.5 | 19.3 | 22.4 |
| Open-o3-Video-7B | <strong>61.0</strong> | <strong>24.5</strong> | <strong>24.0</strong> | 25.4 | 6.0 | <strong>33.7</strong> | <strong>46.6</strong> |

涨得最多的是 What 准确率那一列（+27.5），时间 IoU 两条链各 +9 到 +10。框那一列 Chain1 从 17.0 到 25.4，Chain2 只从 2.5 到 6.0，而专做分割定位的 Sa2VA-8B 在这两列是 32.3 / 37.5。综合分超过 GPT-4o，主要靠答对率和时间。

### 4.2 通用视频基准（论文 Table 2）

| 模型 | VideoMME | VideoMME 长 | WorldSense | VideoMMMU | LRR | TVGBench mIoU |
|-|-|-|-|-|-|-|
| Qwen2.5-VL-7B（底座） | 62.4 | 50.8 | 36.1 | 51.2 | 59.3 | 16.3 |
| VideoLLaMA3-7B | 60.6 | 48.7 | 37.3 | 46.5 | 59.8 | <strong>22.2</strong> |
| VideoRFT-7B | 59.8 | 50.7 | <strong>38.2</strong> | 51.1 | <strong>69.4</strong> | 14.3 |
| Video-R1-7B | 61.4 | 50.6 | 35.5 | <strong>52.4</strong> | 68.9 | 9.6 |
| Open-o3-Video-7B | <strong>63.6</strong> | <strong>54.9</strong> | 37.5 | 52.3 | <strong>69.4</strong> | 20.8 |

相对底座全部上涨，VideoMME 长视频 +4.1 最明显。但和同为 7B 的 RL 视频模型比：长视频推理 LRR 那一列 69.4 和 VideoRFT 完全一样；WorldSense 那一列 37.5 低于 VideoRFT 的 38.2；VideoMMMU 52.3 比 Video-R1 低 0.1；时间定位 TVGBench 20.8 低于 VideoLLaMA3 的 22.2。LRR 上相对底座的 +10.1，Video-R1 也有 +9.6，说明主要来自「做了视频 RL」，不是来自写证据。

### 4.3 关键消融（论文 Table 3、4、5、8、9）

| 设置（V-STAR） | mAM | mLGM |
|-|-|-|
| 底座 Qwen2.5-VL-7B | 19.3 | 22.4 |
| 只 SFT | 28.5 | 37.1 |
| 只 RL（GSPO） | 30.4 | 40.7 |
| SFT + GRPO | 32.8 | 45.3 |
| SFT + GSPO（完整） | <strong>33.7</strong> | <strong>46.6</strong> |
| 去掉 σ 退火（固定 σ=4） | 33.0 | 45.2 |
| 固定 σ=1 | 32.6 | 44.5 |
| 去掉时间门控 | 32.3 | 44.9 |
| 训练数据里不放任何时空数据 | 28.3 | 36.2 |
| 只加 VideoEspresso 时空数据 | 31.1 | 43.6 |

拆开 mAM 的 14.4 分：只 SFT 就拿到 9.2，只 RL 拿到 11.1；两者叠加再多 3 分左右。GSPO 比 GRPO 多 0.9；σ 退火值 0.7–1.1；门控值 1.4。数据那一行更说明问题：<strong>不放时空数据只有 28.3，放了自标数据到 33.7</strong>，5.4 分来自数据，比两个奖励技巧加起来还多。

### 4.4 其他分析

- <strong>写证据本身有没有用</strong>（Table 9）：去掉 SFT 里的时空证据、RL 里不给思考分，变成纯文字推理。VideoMME 62.3 → 63.6（+1.3），长视频 52.8 → 54.9（+2.1），WorldSense 37.1 → 37.5（+0.4）
- <strong>证据是不是真被用到</strong>（Table 6，VideoMME 随机 150 题，64 帧）：平均每题只写 1.15 个框、1.37 个时间点。把离预测时间点最近的两帧删掉，准确率 68.7 → 66.0（−2.7）；随机删同样多帧只掉 0.7
- <strong>测试时扩展</strong>（Table 13，采 8 条）：把每条回答里的框裁出来，让模型自己打 0/1/2 分当置信度加权投票。WorldSense：单条 37.5，多数投票 37.3，置信投票 38.5；VideoMMMU：52.3 / 53.1 / 54.1
- <strong>换 Qwen3-VL 底座</strong>（Table 10）：mAM 4B 31.9 → 34.6，8B 28.0 → 35.5，32B 33.9 → 37.9
- <strong>帧数</strong>（Table 12，LRR）：16 帧 69.2，64 帧 69.4，几乎不涨

## 五、Limitations

<strong>作者自述</strong>（附录 A.12）：更长、更复杂、物体更小的视频仍然难，因为这类高质量时空数据少；需要多步推理、不只是定位的问题仍难；没有用到音频和语音。

<strong>读出来的问题</strong>：

1. <strong>两个奖励技巧的贡献很小，且没方差</strong>：σ 退火 0.7、门控 1.4、GSPO 比 GRPO 0.9，全是单次实验，没有报方差，这个量级的差距可能就在随机波动里。真正的大头是自标数据（+5.4）和「做了 SFT + RL」这件事
2. <strong>通用视频能力基本没超过同类</strong>：Table 2 里 LRR 和 VideoRFT 打平，WorldSense、VideoMMMU、TVGBench 都有别的 7B 更高。论文写「达到或超过」没错，但「写证据让推理更强」的证据主要只在 V-STAR 这个本来就考定位的基准上
3. <strong>框还很不准</strong>：Where Chain2 只有 6.0，Sa2VA-8B 是 37.5。平均每题只写 1.15 个框，「证据」其实很稀疏。删证据帧掉 2.7 分 vs 随机删掉 0.7，只在 150 题上做了一次
4. <strong>代码和论文对不上（门控）</strong>：按公开 reward\_func.py 字面读，门控条件是「标注时间 − 预测时间 &lt; 1.0」，阈值 1 秒而论文写 3 秒，而且没取绝对值——预测时间比所有标注点都晚时条件永远成立。举例：标注 9.2 秒、预测 15.0 秒，9.2 − 15.0 = −5.8 &lt; 1，照样去算框的 IoU，论文说要挡掉的「晚报」并没有被挡住。复现论文数字前要先确认这一行
5. <strong>Figure 2 饼图标反了</strong>：标着 STGR-CoT-30k 的饼是 5.2k / 5k / 10.9k / 15k（加起来 36.1k），正是正文里 RL 集的配比；标着 STGR-RL-36k 的饼是 4.1k / 5k / 5.9k / 15k（30k），是 SFT 集。正文数字自洽，图的标签反了
6. <strong>Qwen3-VL 底座的数字奇怪</strong>：Table 10 里 Qwen3-VL-8B 底座 What 准确率 42.9，比 4B 的 59.6 还低 16.7 分，mAM 也是 8B（28.0）低于 4B（31.9）。8B 上 +14.6 mLGM 的大涨幅有一部分可能是底座评测偏低带来的
7. <strong>测试时扩展的数字前后不一</strong>：引言说置信投票比多数投票在 WorldSense 上 +1.2（38.5 vs 37.3，和表一致），附录 A.10 正文又写 +1.0。另外这一招要采 8 条再裁图打分，每题至少要 8 次生成再加 8 次打分，换来 1 分
8. <strong>数据靠闭源模型</strong>：5.9k 条核心标注由 Gemini 2.5 Pro 生成，再用 Qwen2.5-VL-7B 自己过滤；过滤器和被训的底座是同一个模型，可能把它本来就认得出的物体留下、认不出的扔掉
9. <strong>RL 组大小只有 4</strong>：公开脚本 num\_generations=4，组内归一化的优势方差会很大；论文没讨论这个设置

## 六、前文对照

| 前文 | 它怎么做 | 和 Open-o3-Video 的关系 |
|-|-|-|
| OmniAgent（11-16） | 长视频里模型一轮轮自己决定去看哪段画面、听哪段音频，看完写笔记 | 两条路线的对照：OmniAgent 多轮主动去取证据（agent 式），Open-o3-Video 单轮在固定 16 帧里指出证据。前者能处理小时级视频，后者推理快但看不到没抽到的帧，作者也把「更长视频」列为局限 |
| Video-OPD（11-03） | 视频时间定位用 on-policy 蒸馏代替 GRPO | 都在时间定位上做奖励。Video-OPD 用老师逐 token 打分换掉稀疏奖励，Open-o3-Video 用 σ 退火把稀疏的时间奖励变稠密——同一个问题的两种解法 |
| iVGR（10-14） | 不让模型把坐标写出来，把「往哪儿看」内化进文字推理 | 方向正好相反：iVGR 认为写坐标是负担，Open-o3-Video 认为写坐标是可核对的证据。Table 9 显示写证据在 VideoMME 上值 +1.3，可以和 iVGR 的结论放一起看 |
| VisualSwap（10-08） | 模型说「我再看看图」，把图偷换掉准确率最多掉 60% | 正好可以拿来检验本文：把 Open-o3-Video 报出的证据帧偷换掉，答案会不会变？本文只做了删帧（−2.7），还不够说明证据真的被用来推理 |
| ACTIVE-o3（08-27）/ POLIA（10-05） | 图像上主动挑区域放大 / 给每个视觉对象单独发优势 | 同属「把框放进推理」。Open-o3-Video 的空间分是整条回答平均，没有像 POLIA 那样按对象分配，框不准的那一个也拿同样的优势 |

## 七、启发与待跟进

- <strong>最便宜的起点</strong>：直接拿放出的 7B 权重和 STGR-RL.json，单机 8 卡只跑 RL 阶段，先把门控那一行改成取绝对值、阈值 3 秒，看 V-STAR 的 Where 列有没有变化；顺便多跑几个种子，确认 0.7–1.4 分的消融差距是否稳定
- <strong>组大小</strong>：num\_generations 从 4 提到 8，看时间 IoU 和框 IoU 哪个受益更多
- <strong>按证据分配信用</strong>：现在空间分是所有时间点平均后加到整条回答上。可以把每个 物体-框-时间 片段当作一个单元，对框准的片段 token 给正优势、框错的给负优势（POLIA 式），专治 Where Chain2 只有 6.0 的问题
- <strong>和 agent 路线结合</strong>：单轮只能在已抽到的 16 帧里指证据。让模型在发现「证据不够」时调一次截片段工具（作者的 v2 已经往这个方向走），可以和 OmniAgent 正面对比
- <strong>待查</strong>：v2 仓库（Qwen3-VL-4B、CS-GRPO）是否修了门控；V-STAR 题量和多次评测方差；Qwen3-VL-8B 底座 42.9 的评测设置

## 八、结论

Open-o3-Video 让 7B 视频模型在思考里直接写出「哪个物体、框在哪、第几秒」，靠的是 Gemini 标的 5.9k 条时空数据加上 SFT + GSPO，奖励里用 σ 退火和时间门控解决「时间不准、框就没分」的问题。V-STAR 上 mAM 从 19.3 涨到 33.7，超过 GPT-4o；单机 8 卡、数据权重脚本齐全，是做「可核对的视频推理」最顺手的 baseline。

需要打折看的地方：两个奖励技巧各自只值 1 分左右、没有方差，涨分大头来自数据；通用视频基准和 VideoRFT / Video-R1 基本打平；框的准度还远不如专门的定位模型；公开代码里的门控阈值和方向与论文不一致。

> 💡 <strong>今日一句</strong>：让模型把「第几秒、哪个框」写出来，最大的价值不是多涨几分，而是你终于能检查它是看错了还是想错了。
