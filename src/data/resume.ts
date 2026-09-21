// 「关于」页（/about）的简历数据。
//
// ⚠️ 这是一个公开页面的数据源：不要写入真名、公司全称、内网地址、机器路径、
//    内部平台链接。写经历时用「行业 + 团队」描述，不用雇主品牌名。
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

export interface ResumeExperience {
	org: string;
	role: string;
	period: string;
	needsInput?: boolean;
	bullets: string[];
	tags?: string[];
}

export interface ResumeEducation {
	school: string;
	degree: string;
	period: string;
	needsInput?: boolean;
}

export const PROFILE = {
	name: '章坤',
	role: '大模型算法工程师',
	tagline: '训练优化 · 蒸馏 · 推理与评测',
	bio: [
		'做基础大模型的训练与后训练：从预训练配方、SFT/RL 到蒸馏与推理优化，也做模型能力边界的评测与数据分析。',
		'习惯把「一个有争议的说法」做成可复现的严格对照实验 —— 同架构、同参数、同数据、同超参，只留一个变量，然后把负结果也写出来。',
	],
	hint: '按 ↓ / 空格 逐页翻阅，或点右侧圆点跳转',
};

export const METRICS: ResumeMetric[] = [
	{ value: '90', label: '题自建评测题库（3 领域 × 21 个失效维度）' },
	{ value: '26', label: '个前沿模型纳入横向评测清单' },
	{ value: '−3.9%', label: '循环 Transformer 预训练终态 loss（同步数严格 A/B）' },
	{ value: '+20pp', label: '下游数学工具调用准确率（6/20 → 10/20）' },
	{ value: '43', label: '篇论文阅读与技术复盘笔记' },
];

export const EXPERIENCES: ResumeExperience[] = [
	{
		org: '平安科技 · 基础大模型团队',
		role: '基础大模型算法实习生',
		period: '',
		needsInput: true,
		bullets: [
			'待补充：在这段实习里你负责的具体方向、跑了什么实验、交付了什么。',
		],
		tags: ['基模训练', '待补充'],
	},
	{
		org: '百度 · 基础大模型团队',
		role: '基础大模型算法实习生',
		period: '',
		needsInput: true,
		bullets: [
			'待补充：同上 —— 方向、你的产出、可量化的结果。',
		],
		tags: ['基模训练', '待补充'],
	},
];

export const EDUCATION: ResumeEducation[] = [
	{ school: '清华大学', degree: '硕士', period: '', needsInput: true },
	{ school: '安徽大学', degree: '本科', period: '', needsInput: true },
];

export const PROJECTS: ResumeProject[] = [
	{
		slug: 'dllm',
		navLabel: 'dLLM 论文',
		kicker: '科研论文',
		title: '扩散语言模型（dLLM）方向的研究工作',
		subtitle: '待补充：论文题目、投稿状态、你负责的那部分贡献',
		needsInput: true,
		bullets: [
			'关注扩散式文本生成相对自回归生成在表达能力和训练效率上的取舍。',
			'待补充：实验设计、关键结果数字、是否成稿/投稿。',
		],
		tags: ['dLLM', '扩散语言模型', '文本生成'],
	},
	{
		slug: 'speedopd',
		navLabel: 'SpeedOPD',
		kicker: '研究项目',
		title: 'SpeedOPD：语速扰动下的音频大模型能力边界',
		subtitle:
			'把「语速」当成一个受控变量，测音频理解模型到底在哪一层失效，再验证蒸馏能不能补回来',
		metrics: [
			{ value: '8+', label: '个公开音频基准 × 5 档语速' },
			{ value: '+6.26pp', label: '1x vs 3x 的配对性能差（p=0.0013）' },
			{ value: '0', label: '种干预在 3x 上取得显著增益' },
		],
		bullets: [
			'保调变速构造 1x/1.25x/1.5x/2x/3x 五档受控条件，覆盖语音语义 QA、声景/音乐识别、短音频深度推理、长音频专家 MCQ 四类任务，全部用配对 McNemar + Holm 校正。',
			'定位出敏感度分层：识别类最脆（声景 −15~27pp）> 音乐推理 −8.0pp > 短音频深推理 −6.6pp > 长音频 MCQ −3.2pp（边际），而语音语义 QA 加速后反而 +10pp —— 取决于「声学内容本身是否随速度变化」。',
			'证伪了一条主流直觉：蒸馏的危害正比于施加剂量。把 KD 生效比例做成 0% / 5.1% / 82.5% 三个点，3x 准确率单调下降（79.35 / 79.12 / 77.03），门控最多只能让蒸馏失效、回到纯标签监督，救不回价值。',
			'同样证伪了自己的速率分解方案：token 级速率先验过不了 permutation 检验（72 个候选 token，p=0.2236），最高分 token 全是标点与虚词，于是主动中止该路线而不是硬凑结果。',
			'工程侧的纪律：GPU 硬份额预算、预注册门槛、代码指纹绑定实验身份、34 项单元测试，让每个臂都在同预算下可复现。',
		],
		tags: ['音频多模态', 'On-Policy Distillation', '显著性检验', '可控评测'],
	},
	{
		slug: 'loopllm',
		navLabel: 'loopllm',
		kicker: '开源项目',
		title: 'loopllm：把同一组层循环 4 遍，一次严格 A/B',
		subtitle:
			'「循环 Transformer 用更少参数换等效深度」是主流口径，我反过来问：深度不动、只多跑几遍，多花的那份算力买到性能了吗',
		metrics: [
			{ value: '−3.9%', label: '预训练终态 loss（1.6496 → 1.5853）' },
			{ value: '+20pp', label: '下游工具调用（6/20 → 10/20）' },
			{ value: '30', label: '行代码改动，权重共享 0 新增参数' },
			{ value: '3.5×', label: '每步训练耗时代价' },
		],
		bullets: [
			'以教学级全流程仓库 MiniMind 为基座，只加一个 n_loops 开关：同架构、同参数量（63.91M，权重共享）、同数据、同超参，唯一变量是「同一组层跑几遍」。',
			'同步数 39,695 步下 T=4 全程每步 loss 都更低，终态 1.5853 vs 1.6496；SFT 之后的下游数学工具调用从 6/20 提到 10/20；只用约 1/8 训练数据即追平上游官方全量权重。',
			'三个设计点都为了「循环不破坏原模型行为」：1/√T 的 LayerScale 式残差门控防残差膨胀、输入逐轮重注入防表示漂移、n_loops>1 时自动关闭 KV cache（也因此循环并不省显存 —— 我把这条代价写在 README 第一屏）。',
			'在 1B 档的循环模型与等参 dense 对照上观察到：dense 在约 740M token 处换 seed、换学习率后仍连续三次失稳，而循环版遇到同类梯度扰动后自愈并继续刷新最优 —— 这条证据我按「观察」表述，仍在补更多 token 预算做交叉验证。',
			'双语开源（Apache-2.0），沿上游改动按 §4(b) 做显式声明，仓库里不含任何公司内网信息。',
		],
		tags: ['循环/递归深度 Transformer', '预训练', '严格对照实验', '开源'],
		link: { label: 'github.com/ruyishu/loopllm', href: 'https://github.com/ruyishu/loopllm' },
	},
	{
		slug: 'bench',
		navLabel: '自建评测',
		kicker: '评测工程',
		title: '自建大模型能力边界评测：从失效维度反推题库',
		subtitle:
			'不追总榜分数，而是先定义「模型会怎么错」，再按失效维度造题、收集推理链、双层判分',
		metrics: [
			{ value: '90', label: '题（知识推理 / 数学 / 代码 各 30 题）' },
			{ value: '21', label: '个失效维度（弃答、抗反驳、前提错误谄媚…）' },
			{ value: '3', label: '次/题重复运行，保留完整推理链' },
		],
		bullets: [
			'题库按失效维度标注而非按知识点：弃答与不可回答、前提错误下的谄媚、多选完整性、逻辑不变性、上下文冲突反事实、抗反驳、长尾知识、时间基元、表面扰动、符号计算、病态问题、步骤有效性、长链深度、输出预测、边界与例外、并发异步、重构传播、规格歧义、复杂度性能、契约不变量等。',
			'每题 3 次重复运行并留存完整思维链、首 token 延迟、推理/输出 token 数与总耗时，把「答错」和「答得贵」分开看。',
			'判分走规则层 + LLM judge 双层：规则层做硬性事实与格式校验，judge 只管规则覆盖不到的语义；输出 strict / valid 两套口径，valid 会剔除选项未送达、配对题缺第二问这类口径不满足的样本，并把排除项逐条写进结果里审计。',
			'链路已跑通（首个模型 90 题 × 3 次：strict 68.9% / valid 80.3%），横向覆盖 26 个前沿模型的目标清单与采集规范已建立，正在推进。',
		],
		tags: ['基准设计', '规则+LLM 双层判分', '失败模式分析'],
	},
];

export const SKILLS: { group: string; items: string[] }[] = [
	{
		group: '训练与后训练',
		items: [
			'预训练配方与数据配比',
			'SFT / DPO / GRPO·RLVR',
			'On-Policy Distillation 与 Step Distillation',
			'LoRA 与参数高效微调',
			'蒸馏失效分析与门控',
		],
	},
	{
		group: '架构与训练效率',
		items: [
			'Transformer 变体（循环/递归深度）',
			'GQA / RoPE / SwiGLU / RMSNorm',
			'显存与吞吐调优、torch.compile',
			'单卡与多卡 DDP 训练编排',
			'训练稳定性与故障看门狗',
		],
	},
	{
		group: '推理与评测',
		items: ['工具调用与 Agentic RL', '推理链路与推理效率分析', '长上下文与深度推理', '自动化评测闭环'],
	},
	{
		group: '评测与实验方法',
		items: [
			'自建基准与失效维度标注',
			'规则 + LLM 双层判分',
			'配对显著性检验（McNemar / Holm）',
			'预注册与可复现实验协议',
			'样本回流与数据分析',
		],
	},
	{
		group: '工程与工具',
		items: ['Python', 'PyTorch', 'Transformers', 'vLLM', 'LangChain', 'TypeScript / Node', 'Git', 'Shell / tmux', '远端 GPU 集群编排'],
	},
];

export const LINKS: { label: string; value: string; href: string }[] = [
	{ label: 'GitHub', value: 'github.com/ruyishu', href: 'https://github.com/ruyishu' },
	{ label: '开源项目', value: 'github.com/ruyishu/loopllm', href: 'https://github.com/ruyishu/loopllm' },
	{ label: '技术博客', value: 'ruyishu.github.io', href: 'https://ruyishu.github.io/' },
	{ label: 'RSS 订阅', value: '/rss.xml', href: '/rss.xml' },
];
