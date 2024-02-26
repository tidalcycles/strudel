import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const posts = (await getCollection('blog')).filter((p) => !p.data.draft);
  const options = {
    title: 'Strudel Blog',
    description:
      'The Strudel Blog will keep you updated with the latest changes and things happening in the strudelsphere.',
    site: context.site,
    items: posts.map((post) => ({
      link: `/blog/#${post.slug}`,
      title: post.data.title,
      pubDate: post.data.date,
      description: post.data.description,
    })),
  };
  return rss(options);
}
