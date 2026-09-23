// 「关于」页（/about）的简历数据。
//
// ⚠️ 这是一个公开页面的数据源。用户明确要求写真实姓名与实习单位（章坤 / 平安科技 / 百度）。
//    但仍不要写入内网地址、机器路径、内部平台链接或未公开的项目代号。
//
// 带 needsInput: true 的条目会在页面上显示「待补充」标记，发布前需要补齐。

export interface ResumeMetric {
	value: string;
	label: string;
}

export interface ResumeProject {
	slug: string;
	navLabel: string;
	kicker: string;
	title: string;
	subtitle: string;
	period?: string;
	needsInput?: boolean;
	metrics?: ResumeMetric[];
	bullets: string[];
	paperDraft?: {
		motivation: string[];
		method: { name: string; detail: string }[];
		objective: string;
		results: { cols: string[]; rows: string[][] };
	};
	tags: string[];
	link?: { label: string; href: string };
}

export interface ResumeFigure {
	kind: 'tooluse' | 'mmrl';
	caption: string;
}

/** 结果表。示意数值必须在标题中明确标为非实测。 */
export interface ResultTable {
	title?: string;
	cols: string[];
	rows: string[][];
}

export interface ResumeExperience {
	org: string;
	role: string;
	period: string;
	needsInput?: boolean;
	bullets: string[];
	tags?: string[];
	figure?: ResumeFigure;
	results?: ResultTable;
}

export interface ResumeEducation {
	school: string;
	degree: string;
	period: string;
	needsInput?: boolean;
}

export const PROFILE = {
	name: '章坤',
	role: '多模态大模型算法工程师',
	tagline: '多模态 · RL / RLVR · On-Policy Distillation · 评测',
	bio: [
		'围绕多模态模型的训练与评测，关注 RL / RLVR 数据与训练 pipeline、On-Policy Distillation，以及从失败样本出发定位模型能力边界。',
	],
};

export const EXPERIENCES: ResumeExperience[] = [
	{
		org: '百度深圳科技有限公司 · 文心多模态团队',
		role: '多模态大模型算法工程师（实习）',
		period: '2025.06 – 2025.10',
		bullets: [
			'日常工作聚焦多模态 RLVR 训练数据 pipeline：从任务拆分、样本清洗与格式统一，到可验证信号构造、质量筛选和训练集迭代。',
			'针对模型依赖文本先验、没有真正使用图像证据的问题，构造原图与遮图反事实双分支：复用同一条 rollout，在共享 policy 下分别计算 token logits，并以两种视觉条件的 KL 散度形成 implicit perception objective。',
			'将视觉感知目标直接并入 RLVR optimization objective，在保持可验证答案奖励的同时强化视觉依赖；训练后按 benchmark 与各自 best model 对比，判断图文理解和推理能力是否真实改善。',
		],
		tags: ['Multimodal RLVR', 'Data Pipeline', 'Data Curation', 'Failure Analysis', 'Evaluation'],
		figure: {
			kind: 'mmrl',
			caption:
				'基于遮图反事实的视觉感知优化。先由原图分支生成 rollout，再在共享 policy 下复用同一 token 序列，对比原图与遮图条件下的 logits 分布；最大化两者的 KL 感知差异，并与可验证答案奖励共同进入 RLVR objective，从而抑制语言先验捷径、强化视觉证据依赖。',
		},
		results: {
			title: '多模态 RLVR 阶段对照（示意数据，非实测）',
			cols: ['模型 / 训练阶段', 'MathVista', 'MathVision', 'MathVerse', 'LogicVista', 'Like56', 'STEM200'],
			rows: [
				['Qwen2.5-VL-7B-Instruct', '68.2', '25.1', '41.1', '45.6', '63.0', '54.0'],
				['+ 标准 GRPO', '74.0', '31.8', '46.0', '51.0', '69.3', '61.1'],
				['+ 视觉感知增强', '76.6', '35.4', '48.9', '53.8', '72.5', '63.5'],
			],
		},
	},
	{
		org: '平安科技有限公司 · 基础大模型团队',
		role: '大模型算法工程师（实习）',
		period: '2024.12 – 2025.05',
		bullets: [
			'负责自研 7B 模型「玲珑心」的 Tool Use 能力建设，从 0 到 1 构建金融与通用双域工具语料，并建立 Pingan-700 内部评测集。',
			'通过全量 SFT 让模型从自然语言生成转向结构化工具调用，覆盖工具选择、参数填充、多步调用与格式校验。',
			'基于 GRPO 设计工具名称、参数正确性、调用顺序与工具使用率等多维奖励，配合 T-Eval、BFCL 和内部基准形成训练评测闭环。',
		],
		tags: ['Tool Calling', 'Full-parameter SFT', 'GRPO', 'TRL / OpenRLHF', 'Evaluation'],
		figure: {
			kind: 'tooluse',
			caption:
				'统一工具 schema 并构造高质量语料，通过全量 SFT 完成能力注入，再以 GRPO 奖励约束名称、参数与调用顺序；失败样本按类型回流到下一轮数据。',
		},
		results: {
			title: '工具调用基准对照（示意数据，非实测）',
			cols: ['模型 / 训练阶段', 'T-Eval', 'BFCL-v2', 'Pingan-700'],
			rows: [
				['Qwen2.5-7B-Instruct', '76.6', '65.8', '63.0'],
				['玲珑心 7B · Base', '24.8', '22.9', '25.1'],
				['玲珑心 7B · 全量 SFT', '73.4', '62.5', '60.7'],
				['玲珑心 7B · SFT + GRPO', '76.3', '65.5', '63.4'],
			],
		},
	},
	{
		org: '阔跃生物科技有限公司',
		role: '生物大模型算法工程师（实习）',
		period: '2024.05 – 2024.11',
		bullets: [
			'参与 Atrazine 降解酶的生物动力学改造与高通量筛选，清洗 Km、Kcat、Ki、SwissProt 等蛋白质与酶动力学数据。',
			'基于 ESM-1b 与 LoRA 构建 esm_enzyme_sft 判别模型，学习底物与酶之间的催化关系和亲和力表征。',
			'在 7000 万条 UniRef50 序列上推理，先筛出 1579 条候选，再结合 dlkcat、catapro 收敛到 Top 10；湿实验验证候选酶活性显著优于野生型。',
		],
		tags: ['AI4S', 'Protein Language Model', 'ESM-1b', 'LoRA', 'High-throughput Screening'],
	},
];

export const EDUCATION: ResumeEducation[] = [
	{ school: '清华大学', degree: '硕士' },
	{ school: '安徽大学', degree: '本科' },
];

export const PROJECTS: ResumeProject[] = [
	{
		slug: 'speedopd',
		navLabel: 'SpeedOPD',
		kicker: '研究方案 · 本地草稿',
		title: 'SpeedOPD: Audio-Adaptive On-Policy Distillation under Playback-Rate Shifts',
		subtitle:
			'从真实的音频变速失效观察出发，设计面向音频的自适应 On-Policy Distillation；结果表中的 SpeedOPD 数值仅为本地排版示意，待原始记录核实。',
		metrics: [
			{ value: '−18.0pp', label: 'TAU 场景分类：1×→3× · 两组复现实测均值' },
			{ value: '−15.0pp', label: 'GTZAN 音乐分类：1×→3× · 单组探索性观察' },
		],
		bullets: [],
		paperDraft: {
			motivation: [
				'真实观察：Qwen2.5-Omni-7B 在 TAU 声景分类上由 1× 的 66.5% 降至 3× 的 48.5%（−18.0pp，两组 seed、每组 200 条）；在 GTZAN 音乐分类上由 100.0% 降至 85.0%（−15.0pp，单组 60 条）。TAU 的高速退化经过复现；GTZAN 目前只是探索性观察，多重校正后未达显著性，不能当作同等强度的证据。',
				'因此研究问题是：如何在压缩音频输入的同时识别易受变速损伤的样本，并只在有效位置使用原速率教师信号，避免普通全量蒸馏把难样本与无关 token 混在一起。',
			],
			method: [
				{
					name: 'A · 语义有效的跨速率配对',
					detail: '从同一原始音频构造保调变速视图，并保留样本 ID、问题及任务类别。先审查答案是否随速率改变：语义不变的识别与问答样本沿用标签；涉及节奏、时长或事件速度的题目重标或剔除。训练按任务类别与速率分层采样，避免容易的语音 QA 淹没声景、音乐等脆弱任务。',
				},
				{
					name: 'B · 跨速率 On-Policy 教师监督',
					detail: '学生在变速音频上生成自己的回答轨迹；冻结的教师读取对应 1× 原音频，并沿学生已生成的同一文本前缀计算下一 token 分布。教师提供相对清晰的音频参照，监督仍落在学生实际访问的状态，而不是要求学生模仿一条另外生成的教师答案。',
				},
				{
					name: 'C · 音频感知的自适应路由',
					detail: '样本级只强化“标签跨速率有效、教师在 1× 上可信、学生对变速视图存在可修复落差”的案例；位置级参考教师—学生候选 token 的重叠程度，只在可学习的位置施加较强蒸馏。重叠过低时先回退到答案监督预热，不按原始 KL 大小盲目加权；可识别的最终答案位置优先于标点和虚词。',
				},
				{
					name: 'D · 训练目标与速率课程',
					detail: '联合优化变速视图的答案监督、经门控加权的跨速率教师—学生分布对齐，以及 1× 原速率的能力保持项。课程从 1.25× / 1.5× 逐步扩展到 2× / 3×，每一阶段都与同预算的纯标签训练、普通全量 OPD 比较；门控和课程分别做消融。',
				},
			],
			objective: 'L = L_answer(变速音频) + λ(i,t) · KL[教师(1×原音频, 学生前缀) ‖ 学生(r×音频, 同一前缀)] + μ · L_keep(1×)。其中 λ(i,t) 由样本有效性、教师可靠性及 token 可学习性决定；式子是拟议目标，尚非已运行配方。',
			results: {
				cols: ['模型 / 评测速率', 'TAU ASC · Acc (%)', 'GTZAN · Acc (%)'],
				rows: [
					['Teacher · Omni-7B · 1×', '66.5', '100.0'],
					['Qwen2.5-Omni-7B · 3×', '48.5', '85.0'],
					['Qwen2.5-Omni-3B · 1×', '66.0', '—'],
					['Qwen2.5-Omni-3B · 3×', '40.0', '—'],
					['SpeedOPD · 7B · 3×（示意，非实测）', '66.0', '100.0'],
				],
			},
		},
		tags: ['Audio-Language Models', 'Adaptive OPD', 'Cross-Rate Distillation', 'Robustness Evaluation'],
	},
	{
		slug: 'loopllm',
		navLabel: 'loopllm',
		kicker: '开源项目',
		title: 'loopllm：让 MiniMind 的 8 层循环运行 4 遍',
		subtitle:
			'一个只改循环次数的 A/B 实验：同模型、同数据，比较训练损失、工具调用与算力代价。',
		bullets: [],
		tags: ['循环/递归深度 Transformer', '严格 A/B', '预训练与 SFT', '数学 ToolUse', '开源'],
		link: { label: 'github.com/ruyishu/loopllm', href: 'https://github.com/ruyishu/loopllm' },
	},
	{
		slug: 'bench',
		navLabel: '模型榜单',
		kicker: '数据来源',
		title: '模型能力榜单',
		subtitle: '',
		bullets: [],
		tags: [],
	},
];

export const LINKS: { label: string; value: string; href: string }[] = [
	{ label: '主邮箱', value: 'kunzhang19970209@gmail.com', href: 'mailto:kunzhang19970209@gmail.com' },
	{ label: '备用邮箱', value: '3217415916@qq.com', href: 'mailto:3217415916@qq.com' },
	{ label: '电话', value: '17719496672', href: 'tel:17719496672' },
	{ label: 'GitHub', value: 'github.com/ruyishu', href: 'https://github.com/ruyishu' },
];
