// Place any global data in this file.
// You can import this data from anywhere in your site by using the `import` keyword.

export const SITE_TITLE = '如意鼠 Blog';
export const SITE_DESCRIPTION = '大模型算法工程师 · 模型训练、推理效率与评测分析';
export const SITE_AUTHOR = '如意鼠';

// 首页 subnav 里的 Bench 入口。指向博主自建的综合榜单静态前端页面。
// 页面做好后把地址换到这里即可（可以是在本仓库里，也可以是外部链接）。
export const BENCH_URL = '/bench';

// 工作台默认是否直接展示内容。false 先显示遮挡层，由浏览器本地开关切换。
// 这只是显示偏好，不是访问控制——工作台内容始终存在于生成的 HTML 里。
export const WORKBENCH_PUBLIC_DEFAULT = false;

// 按需放出的页面。true = 正常输出，false = 页面只输出「暂无权限」，
// 正文完全不写进生成的 HTML（是构建期决定，不是前端隐藏，抓源码也拿不到）。
// 改这里请用 `npm run gate <页面> on|off`，改完必须重新构建并 push 才生效。
export const PAGE_ACCESS = {
	workbench: true,
	about: true,
} as const;

export type GatedPage = keyof typeof PAGE_ACCESS;

export const isPageOpen = (page: GatedPage) => PAGE_ACCESS[page];

// 博客分类：一个分类 = src/content/blog/<slug>/ 一个文件夹 + 侧边栏一个子项。
// 新增分类只需在这里加一条，再把文章放进同名文件夹，侧边栏与归档页会自动跟上。
// 注：热门论文＝追踪值得关注的论文；论文阅读＝自己读过并做了笔记的论文，两者不要混。
export const BLOG_CATEGORIES = [
	{ slug: 'tech-report', label: '技术报告' },
	{ slug: 'hot-papers', label: '热门论文' },
	{ slug: 'paper-reading', label: '论文阅读' },
	{ slug: 'trends', label: '前沿热点' },
	{ slug: 'misc', label: '杂项' },
] as const;

