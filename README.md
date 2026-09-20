# 如意鼠 Blog

个人博客。[Astro](https://astro.build) 生成静态站点，托管在 GitHub Pages，push 到 `main` 由 GitHub Actions 自动构建发布。

线上地址：<https://ruyishu.github.io/>

## 日常写作

```bash
npm install        # 首次
npm run dev        # 本地预览，http://localhost:4321
```

新增一篇文章：在 `src/content/blog/<分类>/` 下建一个 `.md` 文件。文件名就是 URL：`tech-report/foo-bar.md` → `/blog/tech-report/foo-bar/`。

文章分类是**按文件夹**定的，四个方向：

| 文件夹 | 侧边栏显示 | 放什么 |
| --- | --- | --- |
| `tech-report/` | 技术报告 | 系统设计、算法实验、工程实践 |
| `papers/` | 热门论文 | 论文精读与复现笔记 |
| `trends/` | 前沿热点 | 动态跟踪、方向判断 |
| `misc/` | 杂项 | 其他 |

分类清单在 `src/consts.ts` 的 `BLOG_CATEGORIES`。加一条配置 + 建同名文件夹就是一个新分类，工作台侧边栏和 `/blog` 归档页都从这份配置生成，不用改页面。放在 `src/content/blog/` 根目录或未配置文件夹里的文章会归到「未分类」，不会被漏掉。

```markdown
---
title: '文章标题'
description: '摘要，会出现在首页列表和 RSS 里'
pubDate: '2026-09-20'
heroImage: '../../assets/xxx.jpg'   # 可选，封面图
---

正文支持 Markdown / MDX。
```

`pubDate` 请用 `YYYY-MM-DD` 这种 ISO 格式。写成 `Sep 20 2026` 会按构建机的时区解析，在 RSS 里可能整体错一天。

frontmatter 字段由 `src/content.config.ts` 的 schema 校验，写错字段或漏写必填项，构建时直接报错。

## 发布

```bash
git add -A
git commit -m "post: 文章标题"
git push
```

推完到仓库的 **Actions** 标签页看构建进度，一两分钟后线上生效。

## 改什么在哪里

| 需求 | 文件 |
| --- | --- |
| 站名、简介、作者 | `src/consts.ts` |
| 博客分类（侧边栏子项、归档分组） | `src/consts.ts` 的 `BLOG_CATEGORIES` |
| 工作台各板块内容 | `src/pages/workbench.astro` |
| 导航菜单、社交图标 | `src/components/Header.astro` |
| 页脚 | `src/components/Footer.astro` |
| 「关于」页 | `src/pages/about.astro` |
| 文章页版式 | `src/layouts/BlogPost.astro` |
| 全站配色、字号 | `src/styles/global.css` |
| 站点 URL | `astro.config.mjs` 的 `site` |
| 标签页图标 | `public/favicon.svg`、`public/favicon.ico` |

## 自动生成的东西

- RSS：`/rss.xml`
- Sitemap：`/sitemap-index.xml`

两者由已装好的 `@astrojs/rss` 和 `@astrojs/sitemap` 生成，不用手动维护。

## 以后想加

- **评论**：[Giscus](https://giscus.app/) 挂 GitHub Discussions，免费。在 `src/layouts/BlogPost.astro` 正文后面嵌一段它生成的 script 即可，需要在仓库设置里开启 Discussions。
- **自定义域名**：域名解析到 Pages 后，在 `public/` 放一个只含域名的 `CNAME` 文件，再到仓库 Settings → Pages 填域名，HTTPS 证书 GitHub 自动签发。改完记得同步 `astro.config.mjs` 的 `site`。
- **数学公式**：装 `remark-math` + `rehype-katex`，在 `astro.config.mjs` 的 `markdown.rehypePlugins` 里注册。
- **暗色模式 / 换主题**：现成模板可参考 [astro.build/themes](https://astro.build/themes/)。
