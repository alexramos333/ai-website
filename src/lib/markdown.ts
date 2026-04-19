// Markdown-to-HTML conversion for the blog article generation pipeline.
// Uses unified/remark/rehype to produce clean semantic HTML compatible
// with the Tailwind "prose" container used on blog pages.

import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeSlug from "rehype-slug";
import rehypeStringify from "rehype-stringify";

/** Convert Markdown to clean semantic HTML with auto-generated heading IDs. */
export async function markdownToHtml(markdown: string): Promise<string> {
  const result = await unified()
    .use(remarkParse)
    .use(remarkGfm) // tables, strikethrough, autolinks, task lists
    .use(remarkRehype, { allowDangerousHtml: true }) // preserve raw HTML in Markdown
    .use(rehypeSlug) // auto-generate id attributes on h1-h6
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(markdown);

  return String(result);
}
