---
title: 'Markdown 渲染样例'
description: '留着当排版参考：代码块、表格、引用、图片、公式各自的呈现效果。'
pubDate: '2026-09-20'
---

## 代码块

```python
def fib(n: int) -> int:
    a, b = 0, 1
    for _ in range(n):
        a, b = b, a + b
    return a
```

行内代码用反引号：`npm run build`。

## 表格

| 项目 | 选型 | 说明 |
| --- | --- | --- |
| 框架 | Astro | 静态生成 |
| 托管 | GitHub Pages | 免费 |
| 部署 | Actions | push 即发布 |

## 引用与列表

> 引用块的样子。

- 无序列表项
- 另一项
  1. 嵌套有序列表
  2. 第二项

## 分隔线与链接

---

[外部链接](https://astro.build)、[站内链接](/about/)、**粗体**、*斜体*、~~删除线~~。

## 待补充能力

模板默认不含 LaTeX 公式和目录（TOC）。需要的话装 `remark-math` + `rehype-katex`，或用 `remark-toc`。
