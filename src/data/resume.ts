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
	tags: string[];
	link?: { label: string; href: string };
}

export interface ResumeFigure {
	kind: 'tooluse' | 'mmrl';
	caption: string;
}

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
			'参与多模态 RLVR 数据筛选与训练集迭代，围绕任务定义、图文清洗、可验证标签、难度诊断和数据配比组织训练数据，并通过失败样本分析定位质量问题。',
			'针对模型难以定位问题相关视觉证据的瓶颈，构建“先定位关键区域、再基于区域证据回答”的训练过程，使模型在作答前显式识别应关注的位置。',
			'在可验证答案奖励之外，引入预测区域与参考区域的 IoU（交并比）定位奖励，将“找对位置”与“答对问题”共同纳入 RLVR 优化；通过多模态基准评测观察定位监督对理解与推理表现的影响。',
		],
		tags: ['Multimodal RLVR', 'Data Curation', 'Visual Grounding', 'IoU Reward', 'Evaluation'],
		figure: {
			kind: 'mmrl',
			caption:
				'问题驱动的视觉定位：模型先预测关键区域，再生成答案；训练时以区域 IoU 奖励和可验证答案奖励共同优化策略。',
		},
		results: {
			title: '多模态 RLVR 评测结果',
			cols: ['模型 / 训练阶段', 'MathVista', 'MathVision', 'MathVerse', 'LogicVista', 'Like56', 'STEM200'],
			rows: [
				['Qwen2.5-VL-7B-Instruct', '68.2', '25.1', '41.1', '45.6', '63.0', '54.0'],
				['+ 标准 GRPO', '74.0', '31.8', '46.0', '51.0', '69.3', '61.1'],
				['+ IoU 定位奖励', '76.6', '35.4', '48.9', '53.8', '72.5', '63.5'],
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
			title: '工具调用评测结果',
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
		slug: 'coordopd',
		navLabel: 'Coord-OPD',
		kicker: '研究项目',
		title: 'Coord-OPD：几何感知的区域定位蒸馏',
		subtitle:
			'在标准 On-Policy Distillation 上叠加 ROI loss，将区域几何关系引入坐标 token 的训练，提升高分辨率视觉问答中的证据定位能力。',
		bullets: [],
		tags: ['On-Policy Distillation', 'ROI Loss', 'Visual Grounding', 'High-resolution VQA'],
	},
	{
		slug: 'loopllm',
		navLabel: 'loopllm',
		kicker: '开源项目',
		title: 'loopllm：共享权重循环深度的实验研究',
		subtitle:
			'基于 MiniMind，在近似固定参数规模下研究循环计算深度对训练目标与数学工具调用表现的影响，并分析相应的计算开销。',
		bullets: [],
		tags: ['循环/递归深度 Transformer', '受控对照', '预训练与 SFT', '数学 ToolUse', '开源'],
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
