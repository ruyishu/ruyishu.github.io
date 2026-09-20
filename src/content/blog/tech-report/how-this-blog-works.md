---
title: '这个博客是怎么搭起来的'
description: 'Astro + GitHub Pages + GitHub Actions，零成本、零运维，写完 push 就上线。'
pubDate: '2026-09-20'
---

## 技术选型

静态站点生成器（SSG）里选了 **Astro**，理由很直接：

- 文章就是 `src/content/blog/` 下的 Markdown / MDX 文件，不需要数据库
- Content Collections 带 schema 校验，frontmatter 写错字段当场报错
- 默认不往浏览器发 JavaScript，首屏很轻

托管选 **GitHub Pages**，构建交给 **GitHub Actions**。整条链路不花钱，也不用维护服务器。

## 目录结构

```
src/content/blog/*.md      文章
src/consts.ts              站名、简介、作者
src/components/Header.astro 导航
astro.config.mjs           site 地址
.github/workflows/deploy.yml 自动部署
```

## 发布流程

```bash
# 1. 写文章（复制一份已有 md 改内容即可）
# 2. 本地预览
npm run dev
# 3. 推送
git add -A && git commit -m "post: 新文章" && git push
```

push 到 `main` 之后 Actions 会自动构建并部署，通常一两分钟。构建状态可以在仓库的 Actions 页面看。

## 还想要评论 / 自定义域名

- **评论**：Giscus 挂 GitHub Discussions，免费、无反垃圾，在文章页嵌一段 script 就行
- **自定义域名**：买一个域名，加 `public/CNAME`，在 Pages 设置里填上，证书 GitHub 自动签
- **访问统计**：用 GitHub Pages 的原生 API 拿浏览量，或挂 Umami
