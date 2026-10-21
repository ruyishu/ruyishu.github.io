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
	kind: 'tooluse' | 'mmrl' | 'rlvrdata';
	caption: string;
}

export interface ResultTable {
	title?: string;
	cols: string[];
	rows: string[][];
}

export interface ResumeBlock {
	text: string;
	figure?: ResumeFigure;
}

export interface ResumeExperience {
	org: string;
	role: string;
	period: string;
	needsInput?: boolean;
	bullets: string[];
	blocks?: ResumeBlock[];
	tags?: string[];
	figures?: ResumeFigure[];
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
		blocks: [
			{
				text: '负责多模态 RLVR 训练数据的构建：面向近百万条无标注图文 query，先按可验证性与图文相关性剔除开放题、主观题及图文弱相关样本；抽取 200 条人工校准 prompt 与采样参数（temperature / top-p），对齐筛选环节的 precision 与 recall 后固化配置。随后以 Pass@K 划分题目难度，交由 6 个 Think 模型按档位 rollout，并按难度设定答案一致率阈值（简单题 5/6、难题 3/6），据此生成参考答案弱标签。最终对 rollout 做答案 Acc 与 CoT 过程双层清洗，过滤重复推理、逻辑矛盾、过程错误而结果巧合以及无依据跳步，产出可直接用于后训练的数据集。',
				figure: {
					kind: 'rlvrdata',
					caption:
						'多模态 RLVR 数据流水线：近百万条无标图文 query 先过可验证性与图文相关性门控，200 题人工校准把 prompt 与采样参数的 precision / recall 对齐；再按 Pass@K 分难度，由 6 个 Think 模型分档 rollout，以 5/6 与 3/6 的答案一致率锁定参考答案；最后按答案 Acc 与 CoT 过程做双层清洗。',
				},
			},
			{
				text: '设计基于定位的额外奖励：模型在作答前先输出关键区域坐标（ROI），与标注框计算 IoU，并与可验证答案奖励加权构成 RLVR 训练信号（r = r_acc + λ·IoU）。针对招牌密集、需要区分相邻门店的高分辨率场景，把「框得准」转化为可优化的训练目标，降低模型仅凭文本先验作答的比例。',
				figure: {
					kind: 'mmrl',
					caption:
						'IoU 定位奖励（数值为示意）：面对招牌并排的街景，模型先输出关键区域 ROI，与标注框计算 IoU，和可验证答案奖励一起构成 RLVR 的训练信号；框到相邻的咖啡店时 IoU 很低，定位奖励随之下降。',
				},
			},
		],
		tags: ['Multimodal RLVR', 'Data Pipeline', 'Pass@K', 'LLM-as-Judge', 'IoU Localization Reward'],
		results: {
			title: '多模态 RLVR 评测结果',
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
		figures: [
			{
				kind: 'tooluse',
				caption:
					'统一工具 schema 并构造高质量语料，通过全量 SFT 完成能力注入，再以 GRPO 奖励约束名称、参数与调用顺序；失败样本按类型回流到下一轮数据。',
			},
		],
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
