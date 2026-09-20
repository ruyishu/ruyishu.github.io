import { getCollection, type CollectionEntry } from 'astro:content';
import { BLOG_CATEGORIES } from '../consts';

export type BlogPost = CollectionEntry<'blog'>;

export interface BlogGroup {
	category: { slug: string; label: string };
	posts: BlogPost[];
}

/** 文章分类取自它所在的文件夹：src/content/blog/<slug>/xxx.md */
export function categorySlugOf(post: BlogPost) {
	return post.id.split('/')[0];
}

/** 按 BLOG_CATEGORIES 的顺序归组，未配置文件夹里的文章兜底成「未分类」 */
export async function postsByCategory(): Promise<BlogGroup[]> {
	const posts = (await getCollection('blog')).sort(
		(a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf(),
	);

	const groups: BlogGroup[] = BLOG_CATEGORIES.map((category) => ({
		category: { slug: category.slug, label: category.label },
		posts: posts.filter((post) => categorySlugOf(post) === category.slug),
	}));

	const known = new Set<string>(BLOG_CATEGORIES.map((category) => category.slug));
	const uncategorized = posts.filter((post) => !known.has(categorySlugOf(post)));
	if (uncategorized.length > 0) {
		groups.push({ category: { slug: 'uncategorized', label: '未分类' }, posts: uncategorized });
	}

	return groups;
}
