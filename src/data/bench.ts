// Bench 页（/bench）的数据。
//
// ⚠️ 公开页面：只放可公开引用的第三方榜单数据，不要写入公司内部信息。
//
// 数据分两类，用 provenance 区分：
//   first-hand —— 从榜单页面直接抄录，字段与页面一致
//   snapshot   —— 经第三方（搜索引擎/聚合站）快照转抄，未逐条向官方源核对
// 两种都必须在页面上写明来源、数据截止日期和访问日期。

export interface BenchRow {
	rank: string;
	/** 名次可能范围，如 TapTap 的「1–2」 */
	rankNote?: string;
	model: string;
	org: string;
	/** 与 headers 一一对应 */
	values: string[];
}

export interface BenchTable {
	slug: string;
	name: string;
	org: string;
	url: string;
	/** 除「模型」之外的列，模型列固定第二列 */
	headers: string[];
	/** 数据截止日期，取榜单自己标注的日期 */
	asOf: string;
	/** 参评范围说明 */
	total?: string;
	/** 本页收录到第几名 */
	scope: string;
	provenance: 'first-hand' | 'snapshot';
	note?: string;
	rows: BenchRow[];
}

/** 访问/抄录日期，更新数据时一起改。 */
export const CRAWLED_AT = '2026-09-21';

export const BENCH_TABLES: BenchTable[] = [
	{
		slug: 'zhizhi',
		name: '致知 · 大模型智力长期追踪榜单（2026-09 月榜 · 推理）',
		org: 'Dolly Deng（llm2014）',
		url: 'https://llm2014.github.io/llm_benchmark/',
		headers: ['中位分数', '极限分数', '平均耗时(秒)', '测试成本(元)'],
		asOf: '2026-09（月榜）',
		total: '该数据集记录数 51',
		scope: '本页列前 20',
		provenance: 'first-hand',
		note: '个人性质的长期追踪评测：私有题库（约 28 题 / 270 用例）每月滚动更新，每题测 3 遍，极限分数取最高分、中位分数取 3 遍中位数（榜按中位分数排）。作者自述「不够权威、不够全面」，题目不公开，月度增减题目会带来约 ±3 分波动。原站与仓库均未声明许可条款或引用格式，此处仅作少量摘录并署名，版权归原作者所有。',
		rows: [
			{ rank: '1', model: 'GPT-6 Astra (xhigh)', org: 'OpenAI', values: ['88.75', '91.27', '241', '¥117.83'] },
			{ rank: '2', model: 'Fable 5.1 (xhigh ~Estimated)', org: 'Anthropic', values: ['81.33', '84.56', '481', '¥400.25'] },
			{ rank: '3', model: 'GPT-5.6 Sol (xhigh)', org: 'OpenAI', values: ['68.36', '78.90', '478', '¥81.17'] },
			{ rank: '4', model: 'Opus 5 (xhigh)', org: 'Anthropic', values: ['63.63', '71.20', '500', '¥144.26'] },
			{ rank: '5', model: 'Fable 5.1 (xhigh w/ refuse)', org: 'Anthropic', values: ['63.47', '66.70', '481', '¥400.25'] },
			{ rank: '6', model: 'Kimi-K3 (max)', org: 'Moonshot AI', values: ['61.86', '69.13', '1241', '¥113.42'] },
			{ rank: '7', model: 'DeepSeek V4.1 Flash (max)', org: 'DeepSeek', values: ['61.54', '68.74', '584', '¥19.25'] },
			{ rank: '8', model: 'Gemini 3.8 Flash (high)', org: 'Google', values: ['60.34', '68.08', '395', '¥28.50'] },
			{ rank: '9', model: 'Seed-2.1-pro 0915 (high)', org: 'ByteDance', values: ['58.28', '70.12', '1200', '¥36.86'] },
			{ rank: '10', model: 'GLM-5.3 (max)', org: 'Z.ai', values: ['57.52', '69.69', '1187', '¥50.46'] },
			{ rank: '11', model: 'Gemini 3.1 Pro (high)', org: 'Google', values: ['55.47', '67.50', '238', '¥55.39'] },
			{ rank: '12', model: 'GLM-5.3-Flash (max)', org: 'Z.ai', values: ['55.16', '64.06', '1025', '¥3.47'] },
			{ rank: '13', model: 'Muse Spark 1.3 (max)', org: 'Meta', values: ['54.40', '66.72', '439', '¥54.87'] },
			{ rank: '14', model: 'DeepSeek V4 Pro 0813 (max)', org: 'DeepSeek', values: ['53.70', '64.73', '1643', '¥45.89'] },
			{ rank: '15', model: 'Qwen3.8-Max (xhigh)', org: 'Alibaba', values: ['53.55', '59.80', '1419', '¥70.88'] },
			{ rank: '16', model: 'DeepSeek V4.1 Flash (high)', org: 'DeepSeek', values: ['52.09', '63.26', '640', '¥15.36'] },
			{ rank: '17', model: 'Grok 4.6 (high)', org: 'xAI', values: ['49.99', '64.54', '834', '¥42.32'] },
			{ rank: '18', model: 'Step 5 Preview (high)', org: 'StepFun', values: ['49.87', '62.80', '1224', '¥29.62'] },
			{ rank: '19', model: 'Qwen3.8-Flash (xhigh)', org: 'Alibaba', values: ['48.14', '59.09', '897', '¥4.74'] },
			{ rank: '20', model: 'GPT-5.6 Luna (xhigh)', org: 'OpenAI', values: ['44.29', '59.93', '308', '¥9.14'] },
		],
	},
	{
		slug: 'taptap-maker',
		name: 'TapTap Maker Benchmark · 总榜',
		org: 'TapTap（心动）',
		url: 'https://maker.taptap.cn/leaderboard/',
		headers: ['L2 通过率', '95% CI', '每题成本'],
		asOf: '2026-09-10',
		total: '版本 2026-09-10-v5-ds-v41-evolving · dataset v0.2.3',
		scope: '本页列前 20',
		provenance: 'first-hand',
		note: '游戏创作专项榜：agent 在真实引擎 UrhoX 上用 Lua 实现游戏功能，L2 引擎无头执行 + 确定性断言判分，判分回路里没有 LLM。名次下方的区间是 bootstrap 出的名次可能范围（1–2 表示点估计第 1，但第 1 到第 2 都与数据相容）；区间重叠就不该断言先后。每题成本按 1 USD = 7.2 CNY 折算。',
		rows: [
			{ rank: '1', rankNote: '1–2', model: 'claude-fable-5-1 (high)', org: 'Anthropic', values: ['90.5%', '80.5–95.4%', '¥25.20'] },
			{ rank: '2', rankNote: '2–5', model: 'claude-fable-5 (high)', org: 'Anthropic', values: ['89.0%', '88.4–89.8%', '¥31.82'] },
			{ rank: '3', rankNote: '1–6', model: 'gpt-6-astra (xhigh)', org: 'OpenAI', values: ['88.9%', '87.3–90.5%', '¥21.85'] },
			{ rank: '4', rankNote: '2–5', model: 'claude-opus-5 (xhigh)', org: 'Anthropic', values: ['88.9%', '78.4–95.4%', '¥48.72'] },
			{ rank: '5', rankNote: '5–8', model: 'muse-spark-1.3 (xhigh)', org: 'Meta', values: ['87.3%', '66.0–86.5%', '¥4.93'] },
			{ rank: '6', rankNote: '5–8', model: 'grok-4.6 (xhigh)', org: 'xAI', values: ['87.3%', '76.5–94.3%', '¥7.96'] },
			{ rank: '7', rankNote: '3–11', model: 'gemini-3.8-flash (high)', org: 'Google', values: ['86.8%', '84.1–88.9%', '¥5.35'] },
			{ rank: '8', rankNote: '2–11', model: 'gpt-5.6-sol (xhigh)', org: 'OpenAI', values: ['86.5%', '83.3–89.7%', '¥15.79'] },
			{ rank: '9', rankNote: '5–9', model: 'claude-opus-5 (high)', org: 'Anthropic', values: ['86.5%', '85.7–87.3%', '¥31.13'] },
			{ rank: '10', rankNote: '9–12', model: 'grok-4.6 (high)', org: 'xAI', values: ['84.1%', '72.7–92.1%', '¥6.12'] },
			{ rank: '11', rankNote: '9–15', model: 'glm-5.3 (max)', org: 'Z.ai', values: ['83.6%', '82.5–84.7%', '¥11.89'] },
			{ rank: '12', rankNote: '9–18', model: 'qwen3.8-max-0902 (xhigh)', org: 'Alibaba Qwen', values: ['83.3%', '81.8–84.9%', '¥8.44'] },
			{ rank: '13', rankNote: '11–17', model: 'claude-opus-4-8 (xhigh)', org: 'Anthropic', values: ['82.8%', '82.2–83.5%', '¥29.72'] },
			{ rank: '14', rankNote: '12–17', model: 'qwen3.8-max (xhigh)', org: 'Alibaba Qwen', values: ['82.5%', '70.0–90.1%', '¥10.04'] },
			{ rank: '15', rankNote: '12–17', model: 'deepseek-v4.1-flash (max)', org: 'DeepSeek', values: ['82.5%', '70.9–91.0%', '¥0.95'] },
			{ rank: '16', rankNote: '11–18', model: 'qwen3.8-flash (xhigh)', org: 'Alibaba Qwen', values: ['82.5%', '81.0–84.1%', '¥0.69'] },
			{ rank: '17', rankNote: '11–20', model: 'gpt-5.6-terra (xhigh)', org: 'OpenAI', values: ['81.8%', '80.2–83.3%', '¥4.54'] },
			{ rank: '18', rankNote: '13–20', model: 'glm-5.3-flash (max)', org: 'Z.ai', values: ['81.5%', '79.9–83.1%', '¥1.89'] },
			{ rank: '19', rankNote: '17–20', model: 'hy4-preview (high)', org: 'Tencent Hunyuan', values: ['81.0%', '69.1–89.8%', '¥3.70'] },
			{ rank: '20', rankNote: '17–24', model: 'kimi-k3', org: 'Moonshot AI', values: ['79.7%', '77.4–82.0%', '¥6.28'] },
		],
	},
	{
		slug: 'aa-intelligence',
		name: 'Intelligence Index · 模型总榜',
		org: 'Artificial Analysis',
		url: 'https://artificialanalysis.ai/leaderboards/models',
		headers: ['综合指数'],
		asOf: '2026-09-13',
		total: '共 268 个模型入榜',
		scope: '本页列前 20',
		provenance: 'first-hand',
		note: '汇总编程、数学、科学、推理、智能体等约 10 项标准化评测。同一模型的不同推理档位（max / xhigh / high / low）分开计分，所以会出现同名多行；原站标星号的分数为估算值。',
		rows: [
			{ rank: '1', model: 'Claude Fable 5.1 (max)', org: 'Anthropic', values: ['53'] },
			{ rank: '2', model: 'Claude Fable 5.1 (xhigh)', org: 'Anthropic', values: ['53'] },
			{ rank: '3', model: 'GPT-6 Astra (max)', org: 'OpenAI', values: ['53'] },
			{ rank: '4', model: 'GPT-6 Astra (xhigh)', org: 'OpenAI', values: ['52'] },
			{ rank: '5', model: 'Claude Fable 5.1 (high)', org: 'Anthropic', values: ['51'] },
			{ rank: '6', model: 'GPT-6 Astra (high)', org: 'OpenAI', values: ['51'] },
			{ rank: '7', model: 'Claude Opus 5 (max)', org: 'Anthropic', values: ['51'] },
			{ rank: '8', model: 'Claude Opus 5 (xhigh)', org: 'Anthropic', values: ['50'] },
			{ rank: '9', model: 'GPT-6 Astra (medium)', org: 'OpenAI', values: ['50'] },
			{ rank: '10', model: 'Claude Fable 5.1 (medium)', org: 'Anthropic', values: ['49'] },
			{ rank: '11', model: 'Claude Opus 5 (high)', org: 'Anthropic', values: ['48'] },
			{ rank: '12', model: 'Muse Spark 1.3 (max)', org: 'Meta', values: ['48'] },
			{ rank: '13', model: 'GPT-5.6 Sol (max)', org: 'OpenAI', values: ['47'] },
			{ rank: '14', model: 'Claude Fable 5.1 (low)', org: 'Anthropic', values: ['47'] },
			{ rank: '15', model: 'GPT-6 Astra (low)', org: 'OpenAI', values: ['46'] },
			{ rank: '16', model: 'Qwen3.8 Max (0902)', org: 'Alibaba', values: ['45'] },
			{ rank: '17', model: 'Muse Spark 1.3 (xhigh)', org: 'Meta', values: ['45'] },
			{ rank: '18', model: 'Claude Opus 5 (medium)', org: 'Anthropic', values: ['45'] },
			{ rank: '19', model: 'GLM-5.3 (max)', org: 'Z AI', values: ['45'] },
			{ rank: '20', model: 'Grok 4.6 (high)', org: 'SpaceXAI', values: ['44'] },
		],
	},
	{
		slug: 'lmarena-text',
		name: 'Text Arena · 文本生成总榜',
		org: 'LMArena',
		url: 'https://arena.ai/leaderboard/text',
		headers: ['Elo', '票数'],
		asOf: '2026-09-13',
		total: '共 402 个模型 / 8,146,274 票',
		scope: '本页列前 20',
		provenance: 'first-hand',
		note: '匿名随机两两对战、真人投票排序。Elo 后的 ± 是置信区间，区间重叠就不该断言先后；原站标注 Preliminary 的条目票数还不够稳。',
		rows: [
			{ rank: '1', model: 'claude-fable-5-high', org: 'Anthropic', values: ['1506 ±5', '30,057'] },
			{ rank: '2', model: 'claude-opus-4-6-high', org: 'Anthropic', values: ['1505 ±4', '71,993'] },
			{ rank: '3', model: 'claude-opus-4-7-high', org: 'Anthropic', values: ['1502 ±4', '60,002'] },
			{ rank: '4', model: 'muse-spark-1.2 (xHigh)', org: 'Meta', values: ['1500 ±11', '3,227'] },
			{ rank: '5', model: 'claude-fable-5.1-max', org: 'Anthropic', values: ['1498 ±8', '5,783'] },
			{ rank: '6', model: 'claude-opus-4-6', org: 'Anthropic', values: ['1497 ±3', '75,878'] },
			{ rank: '7', model: 'claude-opus-4-7', org: 'Anthropic', values: ['1494 ±4', '61,128'] },
			{ rank: '8', model: 'muse-spark-1.3-max', org: 'Meta', values: ['1493 ±9', '4,723'] },
			{ rank: '9', model: 'gemini-3.8-flash-high', org: 'Google', values: ['1493 ±9', '5,076'] },
			{ rank: '10', model: 'claude-opus-5-high', org: 'Anthropic', values: ['1493 ±4', '42,617'] },
			{ rank: '11', model: 'muse-spark-1.1', org: 'Meta', values: ['1493 ±5', '27,615'] },
			{ rank: '12', model: 'gemini-3.7-flash-high', org: 'Google', values: ['1490 ±8', '5,640'] },
			{ rank: '13', model: 'muse-spark', org: 'Meta', values: ['1488 ±6', '13,565'] },
			{ rank: '14', model: 'claude-opus-5-max', org: 'Anthropic', values: ['1487 ±5', '20,706'] },
			{ rank: '15', model: 'gemini-3.1-pro-preview', org: 'Google', values: ['1487 ±3', '106,951'] },
			{ rank: '16', model: 'gemini-3-pro', org: 'Google', values: ['1485 ±4', '40,654'] },
			{ rank: '17', model: 'kimi-k3-max', org: 'Moonshot', values: ['1485 ±5', '20,987'] },
			{ rank: '18', model: 'gpt-5.6-sol-xhigh', org: 'OpenAI', values: ['1483 ±5', '27,069'] },
			{ rank: '19', model: 'glm-5.3-max', org: 'Z.ai', values: ['1483 ±6', '10,960'] },
			{ rank: '20', model: 'gpt-5.5-high', org: 'OpenAI', values: ['1482 ±4', '64,924'] },
		],
	},
	{
		slug: 'openrouter-usage',
		name: '模型调用量排行',
		org: 'OpenRouter',
		url: 'https://openrouter.ai/rankings',
		headers: ['Token', '环比'],
		asOf: '2026-09-20',
		total: '仅统计经 OpenRouter 的调用',
		scope: '本页列前 10',
		provenance: 'first-hand',
		note: '这是「用得多」而不是「答得好」——官方自己强调该榜衡量 adoption 而非 quality，且只覆盖 OpenRouter 流量，不含厂商自有 API。',
		rows: [
			{ rank: '1', model: 'DeepSeek V4.1 Flash', org: 'deepseek', values: ['15.8T', '+219%'] },
			{ rank: '2', model: 'GLM 5.3 Flash', org: 'z-ai', values: ['14.1T', '+18%'] },
			{ rank: '3', model: 'Hy4 Preview', org: 'tencent', values: ['12.5T', '+26%'] },
			{ rank: '4', model: 'GPT-5.6-Luna', org: 'openai', values: ['9.72T', '+47%'] },
			{ rank: '5', model: 'DeepSeek V4 Flash 0731', org: 'deepseek', values: ['9.44T', '+18%'] },
			{ rank: '6', model: 'MiMo-V2.5', org: 'xiaomi', values: ['7.07T', '+9%'] },
			{ rank: '7', model: 'Hy3', org: 'tencent', values: ['4.78T', '+26%'] },
			{ rank: '8', model: 'Nemotron 3 Ultra 550B A55B (free)', org: 'nvidia', values: ['4.49T', '+26%'] },
			{ rank: '9', model: 'DeepSeek V4 Flash 0423', org: 'deepseek', values: ['3.77T', '+13%'] },
			{ rank: '10', model: 'GLM 5.3', org: 'z-ai', values: ['3T', '+19%'] },
		],
	},
	{
		slug: 'compassrank-llm',
		name: 'CompassRank · 大语言模型榜',
		org: '上海人工智能实验室（司南）',
		url: 'https://opencompass.org.cn/home',
		headers: ['总分'],
		asOf: '2026-08-24',
		total: '官方闭源评测集',
		scope: '本页列前 5',
		provenance: 'snapshot',
		note: '该站榜单为前端动态渲染，本页数据来自搜索引擎快照，未经官方源逐条核对。',
		rows: [
			{ rank: '1', model: 'Claude Opus 5 (high)', org: 'Anthropic', values: ['83.3'] },
			{ rank: '2', model: 'GPT-5.6-Sol (high)', org: 'OpenAI', values: ['80.8'] },
			{ rank: '3', model: 'Qwen3.8-Max', org: 'Alibaba', values: ['80.6'] },
			{ rank: '4', model: 'GPT-5.5 (high)', org: 'OpenAI', values: ['80.6'] },
			{ rank: '5', model: 'Gemini-3.7-Flash', org: 'Google', values: ['80.5'] },
		],
	},
];

export interface BenchLink {
	name: string;
	org: string;
	what: string;
	url: string;
}

/** 暂时没有稳定可得数据的榜单，只给入口和一句话说明。 */
export const BENCH_LINKS: BenchLink[] = [
	{
		name: 'SuperCLUE',
		org: 'CLUE 团队',
		what: '中文通用能力：数学推理、幻觉控制、科学推理、指令跟随、Agentic Coding 与任务规划。',
		url: 'https://www.superclueai.com/',
	},
	{
		name: 'FlagEval（天秤）',
		org: '北京智源研究院',
		what: '按「能力—任务—指标」三维框架评测，中英文主客观题都覆盖。',
		url: 'https://flageval.baai.ac.cn/',
	},
	{
		name: 'LiveBench',
		org: 'LiveBench',
		what: '定期换题的抗污染基准，题目取自新发布的比赛、论文与新闻。',
		url: 'https://livebench.ai/',
	},
	{
		name: 'SWE-bench Verified',
		org: 'SWE-bench 团队',
		what: '真实 GitHub issue 修复任务，500 条人工筛过的子集，看 agent 能不能改对真代码库。',
		url: 'https://www.swebench.com/',
	},
	{
		name: 'Open LLM Leaderboard',
		org: 'Hugging Face',
		what: '开源权重模型的统一基准（MMLU-Pro、GPQA、BBH 等）。',
		url: 'https://huggingface.co/spaces/open-llm-leaderboard/open_llm_leaderboard',
	},
	{
		name: '艾媒金榜 · 中国大模型评测实力榜',
		org: '艾媒咨询',
		what: '偏商业维度：企业基础实力、月活、产品性能、品牌影响力加权，是市场榜不是能力跑分。',
		url: 'https://www.iimedia.cn/',
	},
	{
		name: 'DataLearner AI 排行榜',
		org: 'DataLearner',
		what: '聚合 ARC-AGI-2、HLE、SWE-bench Verified 等单项排名，并把 AA 指数与 LMArena 并列展示。',
		url: 'https://www.datalearner.com/leaderboards',
	},
	{
		name: '猫目',
		org: 'maomu.com',
		what: '把 Arena Elo、Coding Elo、Vision、ArenaHard、MMLU 并成一张宽表。',
		url: 'https://maomu.com/rank/chatbot-arena',
	},
];
