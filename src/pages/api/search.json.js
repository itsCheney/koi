import { getCollection } from 'astro:content';
import { filterPosts } from '@/utils/misc';

export async function GET() {
	const posts = filterPosts(await getCollection('blog'), {
		filterDraft: true,
		filterUnlisted: true,
	});

	const searchData = posts.map((post) => ({
		title: post.data.title,
		description: post.data.description,
		slug: post.slug,
		pubDate: post.data.pubDate,
		tags: post.data.tags || [],
	}));

	return new Response(JSON.stringify(searchData), {
		status: 200,
		headers: {
			'Content-Type': 'application/json',
		},
	});
}
