// 「关于」页（/about）的简历数据。
//
// ⚠️ 这是一个公开页面的数据源。用户明确要求写真实姓名与任职单位（章坤 / 携程 / 百度 / 平安科技）。
//    但仍不要写入内网地址、机器路径、内部平台链接或未公开的项目代号。
//    在投论文（双盲评审）只写动机、方法与结果，不写作者、单位与投稿编号；拟投稿工作（CCoT）只写问题与结果，不写任何方法线索。
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
	caption?: string;
	cols: string[];
	rows: string[][];
	/** 需要强调的行（下标，从 0 开始）；不填时默认强调最后一行。 */
	highlight?: number[];
}

export interface ResumeBlock {
	text: string;
	figure?: ResumeFigure;
}

export interface ResumeExperience {
	slug: string;
	navLabel: string;
	org: string;
	role: string;
	period: string;
	needsInput?: boolean;
	/** 一句话概括这段经历的主线 */
	summary?: string;
	bullets: string[];
	blocks?: ResumeBlock[];
	/** 方法示意图（SVG），narrowSrc 为窄屏版本 */
	diagram?: { src: string; narrowSrc?: string; width: number; height: number; alt: string; caption: string };
	/** 定性评测结果（不含具体分数）：指标卡 + 表 + 结论 */
	evaluation?: { title: string; metrics?: ResumeMetric[]; table: ResultTable; conclusion: string };
	tags?: string[];
	figures?: ResumeFigure[];
	results?: ResultTable;
}

export interface ResumeEducation {
	school: string;
	degree: string;
	period?: string;
	needsInput?: boolean;
}

export const PROFILE = {
	name: '章坤',
	role: '大模型算法工程师 · 模型后训练',
	tagline: 'SFT · RL / RLVR · On-Policy Distillation · Benchmark 评测',
	availability: ['工作地点不限', '面试通过后两周内可到岗'],
	bio: [
		'专注大模型后训练：从 SFT 冷启动、RL / RLVR 到 On-Policy Distillation，并以可复现的 Benchmark 评测驱动迭代。做过数据分析 Agent 的 Harness、后训练与评测闭环，多模态 RLVR 中的视觉定位奖励设计，以及 7B 模型的 Tool Use 能力建设。',
	],
};

export const SKILLS: { label: string; items: string[] }[] = [
	{ label: '训练方法', items: ['SFT', 'RL（GRPO / RLVR）', 'OPD（On-Policy Distillation）', 'Benchmark 评测'] },
	{ label: '框架与工具', items: ['verl', 'vLLM', 'LLaMA-Factory', 'Git'] },
];

export const EXPERIENCES: ResumeExperience[] = [
	{
		slug: 'ctrip',
		navLabel: '携程',
		org: '携程 · DataCopilot',
		role: '大模型算法工程师',
		period: '2026.07 – 至今',
		summary:
			'Harness 提供统一的多轮交互环境（本身不训练），目前接入 4 个模型；其中主要搭配训练的策略模型是我们自研后训练的 Qwen3.8-27B：在 Harness 中 rollout，轨迹经筛选后做 SFT 冷启动与 RLVR，再在同一 Harness 配置下用 4 个评测集做 Benchmark 与回归。',
		diagram: {
			src: '/images/about/ctrip-datacopilot-posttrain.svg',
			narrowSrc: '/images/about/ctrip-datacopilot-posttrain-narrow.svg',
			width: 1240,
			height: 600,
			alt: 'DataCopilot 后训练闭环：策略模型 Qwen3.8-27B（自研后训练）与 Harness（Memory 检索、Skills 加载、多轮工具调用、轨迹记录）多轮交互，产出百万级候选轨迹；经分层采样、去重与执行校验后，验证通过的轨迹用于 SFT 冷启动，再以可自动验算任务的结果正确性奖励做 RLVR（GRPO）更新策略模型，下一轮仍经同一 Harness rollout；新版本与 DeepSeek、Qwen3.8-Max、Kiro-Opus-5.5 在一致的 Harness 配置下，用 4L-SkillBench、Router-Bench、Data-Ana-Bench 与 Memory 评测做 Benchmark 与回归，失败样本回流。',
			caption:
				'Method · DataCopilot 后训练闭环。① Harness 管理 Memory、Skills、多轮工具调用并记录轨迹，只提供环境、不参与训练；② 策略模型 Qwen3.8-27B 的 rollout 轨迹经分层采样、去重与执行校验，先做 SFT 冷启动，再以结果正确性奖励做 RLVR（GRPO），更新后仍通过同一 Harness 采样；③ 在一致的 Harness 配置下对接入的 4 个模型做 4 项 Benchmark 与回归，失败环节回流到下一轮训练。',
		},
		bullets: [
			'Harness 建设：负责数据分析 Agent 的运行框架，管理 Memory 检索、Skills 加载与多轮工具调用，记录每轮调用参数和返回结果，为轨迹采样、执行回放与评测提供统一环境。',
			'模型后训练：负责 Agent 策略模型 Qwen3.8-27B 的后训练，优化工具选择、参数生成和基于工具返回的多轮分析；对百万级候选轨迹做分层采样、去重与执行校验，以验证通过的轨迹做 SFT，以可自动验算的任务和结果正确性奖励做 RLVR。',
			'Benchmark 与回归：搭建 4 个评测集（4L-SkillBench、Router-Bench、Data-Ana-Bench、Memory 评测），在一致的 Harness 配置下对比 DeepSeek、Qwen3.8-Max、Kiro-Opus-5.5 与自研 Qwen3.8-27B，跟踪任务完成率、结果正确性与工具调用有效性，并通过执行轨迹定位失败环节。',
		],
		evaluation: {
			title: '评测结果',
			metrics: [{ value: '≈ −5 pt', label: 'Qwen3.8-27B（后训练）vs GLM-5.3 / DeepSeek，各项评测差距' }],
			table: {
				cols: ['评测集', '评测内容'],
				rows: [
					['4L-SkillBench', 'Skill 效果'],
					['Router-Bench', '不同专家路由'],
					['Data-Ana-Bench', '数据分析全局结果'],
					['Memory 评测', 'Memory 效果'],
				],
			},
			conclusion: '专门后训练后，Qwen3.8-27B 在各项评测上贴近 GLM-5.3 与 DeepSeek，差距约 5 个点（具体数值不便公开）。',
		},
		tags: ['Agent Harness', 'Qwen3.8-27B', '多轮 Rollout', 'SFT 冷启动', 'RLVR / GRPO', 'Benchmark 与回归'],
	},
	{
		slug: 'baidu',
		navLabel: '百度文心',
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
		slug: 'pingan',
		navLabel: '平安科技',
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
];

export const EDUCATION: ResumeEducation[] = [
	{ school: '清华大学', degree: '硕士', period: '2023.09 – 2026.06' },
	{ school: '安徽大学', degree: '学士', period: '2015.09 – 2019.06' },
];

// ---------- 论文 / 研究（统一按「Motivation 图 → Method 图 → Results 表」排版） ----------

export interface StudyFigure {
	src: string;
	width: number;
	height: number;
	alt: string;
	caption: string;
}

export interface ResearchStudy {
	slug: string;
	navLabel: string;
	venue: string;
	title: string;
	subtitle: string;
	motivation: { text: string[]; figure?: StudyFigure };
	method?: { text: string[]; figure?: StudyFigure };
	results: { text?: string[]; metrics?: ResumeMetric[]; tables: ResultTable[]; notes?: string[] };
	tags: string[];
}

export const RESEARCH: ResearchStudy[] = [
	{
		slug: 'fsd',
		navLabel: 'FSD',
		venue: '在投 CVPR 2027',
		title: 'Crops as Evidence: Feasible-Set Distillation for Visual Document Agents',
		subtitle:
			'视觉文档 Agent 通过裁剪动作获取细粒度证据。用 On-Policy Distillation 学习裁剪坐标时，只在「可接受裁剪集合」的边界上保留教师纠正，集合内部的偏好不再强求一致。',
		motivation: {
			text: [
				'高分辨率文档和信息图把小字、密集表格和局部关系挤在一页上。Agent 先看低分辨率概览，再裁剪可能含答案的区域继续推理。用 OPD 把大模型「先裁剪、再阅读」的行为蒸馏给小模型很自然：每次裁剪都会改变下一步观测，学生需要在自己走到的历史上被监督。',
				'但标准 OPD 对坐标字符串做逐 token 的 reverse KL，相当于把教师的框当作唯一目标。裁剪是取证动作而不是检测标签：不同坐标可以保留同一处证据（a）；而证据不全的碎片（b）或放得过大、细节被稀释的视图（c）则不可接受。逐 token 匹配把「可行 / 不可行」的有用边界与「可行裁剪之间」的无关偏好混在了一起。',
			],
			figure: {
				src: '/images/about/fsd-motivation.webp',
				width: 2000,
				height: 945,
				alt: '论文 Figure 1：三组示例分别说明裁剪坐标可以不同但证据相同、证据必须完整保留、细节必须保持可读；底部结论为在可接受集合内放松匹配，集合外保留纠正。',
				caption:
					'Figure 1 · 有用的裁剪动作构成一个受约束的等价集合。(a) 紧凑框与带字段名的宽框都有效；(b) 丢掉必要上下文的碎片落在集合外；(c) 过度放大的视图稀释了细节。由此得到监督原则：集合内放松偏好，集合外保留纠正。',
			},
		},
		method: {
			text: [
				'可接受集合：以冻结 8B 教师给出的参考框 b_T 为锚，按覆盖率与空间范围（面积上限）定义可接受裁剪集合 A(b_T)。',
				'精确前缀可行性判定：学生逐位写出框坐标；在当前前缀下，一个精确的几何 oracle 判断哪些下一个 token 仍存在落入 A(b_T) 的补全，得到可行集合 F(h_t)。',
				'Geo-QKL：把可行 token 合并为一个结果，只匹配可行集合的总概率质量，并对每个不可行 token 单独保留惩罚，从而恰好去掉集合内部的条件 KL；其余文本 token 仍用标准 reverse KL。训练只用学生自采样轨迹，不需要真值答案或标注框，也不引入新的可学习模块。',
			],
			figure: {
				src: '/images/about/fsd-method.webp',
				width: 2000,
				height: 857,
				alt: 'FSD 方法图：1. 证据保留的裁剪集合；2. 精确前缀可行性 oracle 将下一位数字分为可行与不可行；3. Geo-QKL 商空间目标，合并可行 token 的概率质量并逐个惩罚不可行 token。',
				caption:
					'Method · FSD 三步：教师参考框定义证据保留的可接受集合 → 精确 oracle 给出当前前缀下的可行 token 集合 → Geo-QKL 合并可行质量、逐个惩罚不可行 token。',
			},
		},
		results: {
			text: [
				'Qwen3-VL-8B 教师蒸馏到 2B 学生，所有模型都从同一 0.25 MP 概览出发、最多 3 次 1 MP 裁剪；蒸馏方法在同一无标注数据池上训练 256 步。',
			],
			metrics: [
				{ value: '+3.6', label: 'DocVQA ANLS，较 matched-view OPD' },
				{ value: '+4.5–4.9', label: 'InfographicVQA ANLS，较 matched-view OPD' },
				{ value: '−51%', label: '裁剪次数最多减少' },
				{ value: '82.9 / 75.4', label: '2B 学生 DocVQA ANLS / EM，超过 8B 教师' },
			],
			tables: [
				{
					caption: '论文 Table 1：held-out DocVQA 与 InfographicVQA 主结果（ANLS / EM，%；Crops 为每题平均裁剪次数，越少越好）',
					cols: ['方法', 'DocVQA ANLS / EM', 'Crops', 'InfoVQA ANLS / EM', 'Crops'],
					rows: [
						['教师 Qwen3-VL-8B', '81.99 / 73.00', '1.19', '65.75 / 60.37', '1.27'],
						['学生 2B（蒸馏前）', '68.31 / 56.60', '1.80', '34.47 / 28.28', '2.43'],
						['ViCrop（免训练裁剪）', '66.59 / 52.80', '1.00', '35.12 / 27.71', '1.00'],
						['RAFT', '78.97 / 70.00', '1.39', '52.32 / 45.97', '2.11'],
						['NTL', '78.99 / 70.80', '1.31', '49.56 / 42.99', '1.96'],
						['OPD（Reverse KL）', '79.55 / 70.40', '1.00', '48.97 / 42.55', '2.00'],
						['GKD', '79.97 / 70.40', '1.27', '49.91 / 43.69', '1.78'],
						['TRT-adapted', '80.44 / 72.20', '1.29', '51.44 / 45.09', '1.90'],
						['FSD（ours）', '82.90 / 75.40', '1.19', '55.31 / 49.08', '1.64'],
					],
				},
			],
			notes: [
				'消融（论文 Table 2）：同样 256 步下，matched-view OPD 为 79.26 / 70.80，FSD 为 82.90 / 75.40；四组配对种子中，FSD 在 16 次 ANLS 比较里胜出 15 次，16 次 EM 比较全部胜出。',
			],
		},
		tags: ['On-Policy Distillation', 'Visual Document Agent', 'Crop Action', 'Geo-QKL', '8B → 2B'],
	},
	{
		slug: 'spinvl',
		navLabel: 'SpinVL',
		venue: '在投 CVPR 2027',
		title: 'SpinVL: Turning Frozen Text LLMs into Vision-Language Models with Zero Visual Tokens in the Backbone',
		subtitle:
			'不外挂视觉塔、深层主干不放任何视觉 token：在完全冻结的纯文本 LLM 上用双层正交旋转读图，再用在线策略蒸馏 VL-OPD 修正自回归生成，纯文本能力逐位不变。',
		motivation: {
			text: [
				'Token 拼接式 VLM（如 LLaVA）把图像变成成百上千个视觉 token 送进 LLM 的每一层：注意力开销随分辨率快速膨胀（4096 patches 时 1.7B 学生单次前向约 9.85 TFLOPs），而一旦更新主干，原有的纯文本推理能力也会受损。',
				'参数旋转类方法（如 ROSE）不往主干塞视觉 token，但仍依赖沉重的外部视觉塔，且只用离线 teacher forcing 训练，自回归生成时存在 exposure bias；内置编码器类方法（如 VoRA）去掉了视觉塔，但视觉 token 仍全程留在主干里，而且把前 K 层改动并入主干后 GSM8K 会从 70.4% 崩到 0.0%。',
			],
			figure: {
				src: '/images/about/spinvl-motivation.webp',
				width: 1800,
				height: 811,
				alt: '前向 TFLOPs 与端到端延迟随视觉 patch 数变化的曲线：LLaVA 增长最快，SpinVL-Free 在 4096 patches 处 FLOPs 降低 74.2%（2.54 vs 9.85 TFLOPs），延迟 99.4 ms vs 123.4 ms。',
				caption:
					'Motivation · 计算量与延迟随图像分辨率的变化。全量视觉 token 的 LLaVA 开销增长最快；SpinVL-Free 在第 4 层后丢弃图像 token，4096 patches 时 FLOPs 降低 74.2%，高分辨率下延迟反超。',
			},
		},
		method: {
			text: [
				'Step 1 · 双层正交旋转：学生自己的前 K=4 层充当内置视觉编码器，对线性投影施加静态 Cayley 旋转与逐通道缩放（仅 2.4M 参数）；第 4 层之后丢弃所有图像 token，再由多频或空间锚点查询驱动的动态块对角旋转去调制深层冻结层。',
				'模态解耦：纯文本推理不触发视觉旋转，与原始 LLM 逐位一致。',
				'Step 2 · VL-OPD：学生对图文问题自行 rollout，冻结教师 Qwen3-VL-8B 在学生轨迹上逐 token 计算 forward KL 进行监督，消除离线训练带来的 exposure bias。',
			],
			figure: {
				src: '/images/about/spinvl-method.webp',
				width: 2048,
				height: 1152,
				alt: 'SpinVL 架构图：(a) 双层正交旋转，前 4 层做视觉编码并丢弃图像 token，LayerVRMG 生成动态旋转调制冻结的纯文本主干；(b) 在线策略蒸馏，学生 rollout，冻结教师 Qwen3-VL-8B 计算 token 级 forward KL。',
				caption:
					'Method · (a) Step 1 双层正交旋转（SpinVL-Free）：浅层读图、深层零视觉 token；(b) Step 2 在线策略蒸馏 VL-OPD。全程只训练旋转生成器与前端，文本主干冻结。',
			},
		},
		results: {
			text: [
				'同一冻结学生（Qwen3-1.7B，另含 0.6B 无塔版本）、同训练数据、同步数、同 392×392 评测协议下比较。',
			],
			metrics: [
				{ value: '70.4%', label: 'GSM8K 纯文本能力逐位保持（合并前端则降至 0.0%）' },
				{ value: '44.37 vs 41.35', label: '感知 + 抗幻觉（MC2），对比 LLaVA 基线' },
				{ value: '+9.9', label: 'VL-OPD 带来的自由生成提升（最高）' },
				{ value: '−74.2% / −19.5%', label: '高分辨率下 FLOPs / 延迟' },
			],
			tables: [
				{
					caption:
						'论文 Table 1 节选：主结果（%）。Tok. 为深层主干中的视觉 token 数；FLOPs 为 4096 patches 下的相对前向计算量（1.00× = 9.85 TFLOPs）；MC2 = MMStar 与 HallusionBench 均值，Core3 再加 MathVista；GSM8K 为合并前端改动后的纯文本保持',
					cols: ['方法', '视觉塔', 'Tok.', 'FLOPs', 'MMStar', 'Hallu.', 'MathV.', 'MC2', 'Core3', 'GSM8K'],
					rows: [
						['教师 Qwen3-VL-8B', '8B ViT', 'all', '3.80×', '65.80', '72.45', '63.20', '69.13', '67.15', '—'],
						['LLaVA-Proj（全量 token）', '8B ViT', 'all', '1.00×', '29.60', '53.10', '24.90', '41.35', '35.87', '70.4'],
						['ROSE（单频旋转）', '8B ViT', '0', '0.69×', '25.60', '54.36', '19.70', '39.98', '33.22', '70.4'],
						['SpinVL-Tower（hyb）', '8B ViT', '0', '0.69×', '30.60', '58.15', '18.50', '44.37', '35.75', '70.4'],
						['SpinVL-Tower（mf + VL-OPD）', '8B ViT', '0', '0.69×', '26.80', '57.41', '23.50', '42.11', '35.90', '70.4'],
						['VoRA（内置 LoRA K=4，合并）', '—', '0', '0.26×', '23.73', '49.95', '18.50', '36.84', '30.73', '0.0'],
						['SpinVL-Free（hyb，离线 CE）', '—', '0', '0.26×', '27.60', '54.57', '19.10', '41.09', '33.76', '70.4'],
						['SpinVL-Free + VL-OPD（0.6B）', '—', '0', '0.11×', '27.53', '57.83', '18.60', '42.68', '34.66', '—'],
						['SpinVL-Free + VL-OPD（1.7B）', '—', '0', '0.26×', '29.20', '56.15', '19.50', '42.68', '34.95', '70.4'],
					],
					highlight: [3, 4, 8],
				},
				{
					caption: '论文 Table 6：不同图像分辨率下的计算量与延迟（1.7B，文本长度 64，独占 GPU；TFLOPs / ms）',
					cols: ['Patches', 'SpinVL', 'ROSE', 'LLaVA'],
					rows: [
						['256', '0.30 / 65.8', '0.47 / 58.2', '0.66 / 25.7'],
						['1024', '0.67 / 69.8', '1.45 / 63.8', '2.18 / 33.7'],
						['2304', '1.37 / 80.4', '3.40 / 86.0', '5.07 / 66.9'],
						['4096', '2.54 / 99.4', '6.82 / 126.1', '9.85 / 123.4'],
					],
				},
			],
		},
		tags: ['Vision-Language Model', 'Frozen LLM', 'Orthogonal Rotation', 'VL-OPD', 'Efficiency'],
	},
	{
		slug: 'ccot',
		navLabel: 'CCoT',
		venue: '拟投 ACL',
		title: 'CCoT：针对推理模型的过度思考',
		subtitle: '投稿前只展示问题与评测结果。',
		motivation: {
			text: ['针对推理模型的过度思考（Overthinking）问题，减少冗长输出。以 Qwen3.8-27B 为基座对比评测。'],
		},
		results: {
			metrics: [
				{ value: '+6.3', label: '四项平均准确率提升（百分点），81.2% → 87.5%' },
				{ value: '−26.5%', label: '平均输出长度，12,323 → 9,062 tokens' },
			],
			tables: [
				{
					caption: 'Qwen3.8-27B 基座 vs. CCoT',
					cols: ['评测集', '准确率（基座 → CCoT）', '增幅（百分点）', '平均输出（tokens）', '输出减少（tokens）'],
					rows: [
						['AIME 2025', '77.5% → 85.0%', '+7.5', '15,888 → 12,884', '3,004（18.9%）'],
						['AIME 2024', '84.2% → 91.7%', '+7.5', '15,244 → 11,567', '3,677（24.1%）'],
						['GPQA-Diamond', '79.0% → 83.6%', '+4.6', '13,279 → 9,715', '3,564（26.8%）'],
						['MMLU-Pro', '84.0% → 89.7%', '+5.7', '4,880 → 2,082', '2,798（57.3%）'],
						['四项平均', '81.2% → 87.5%', '+6.3', '12,323 → 9,062', '3,261（26.5%）'],
					],
				},
			],
		},
		tags: ['Reasoning Model', 'Overthinking', 'AIME', 'GPQA-Diamond', 'MMLU-Pro'],
	},
];

export const PROJECTS: ResumeProject[] = [
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
