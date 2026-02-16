# Adding blog with contentful

This guide covers setting up a blog using Contentful CMS with your Subbly Next.js application.

## Prerequisites

- A Contentful account
- Contentful Space ID and Access Token
- Next.js application with Subbly integration

## Contentful Setup

### 1. Create a Contentful Space

1. Log in to [Contentful](https://www.contentful.com/)
2. Create a new space or use an existing one
3. Note your **Space ID** from Settings > General

### 2. Create API Keys

1. Go to Settings > API keys
2. Create a new API key
3. Note the **Content Delivery API - access token**
4. Optionally note the **Content Preview API - access token** for draft previews

### 3. Environment Variables

```env
# .env
CONTENTFUL_SPACE_ID=your Space ID
CONTENTFUL_ACCESS_TOKEN=Content Delivery API token
CONTENTFUL_PREVIEW_ACCESS_TOKEN=Content Preview API token # Optional 
CONTENTFUL_PREVIEW_SECRET=any URL friendly value of your choice # Optional
```

## Content Model

### Blog Post Content Type

Create a content type called `blogPost` with these fields:

| Field Name   | Field ID     | Type              | Required |
|-------------|--------------|-------------------|----------|
| Title       | `title`      | Short text        | Yes      |
| Slug        | `slug`       | Short text        | Yes      |
| Excerpt     | `excerpt`    | Short text        | No       |
| Content     | `content`    | Rich text         | Yes      |
| Featured Image | `featuredImage` | Media (Single) | No       |
| Author      | `author`     | Short text        | No       |
| Published Date | `publishedDate` | Date & time   | Yes      |
| Tags        | `tags`       | Short text (List) | No       |

### Author Content Type (Optional)

| Field Name | Field ID  | Type           | Required |
|-----------|-----------|----------------|----------|
| Name      | `name`    | Short text     | Yes      |
| Bio       | `bio`     | Long text      | No       |
| Avatar    | `avatar`  | Media (Single) | No       |

## Contentful Client Setup

### Install Dependencies

```bash
npm install contentful @contentful/rich-text-react-renderer @contentful/rich-text-types
```

### Create Client

```typescript
// lib/contentful/index.ts
import { createClient } from 'contentful'

if (!process.env.CONTENTFUL_SPACE_ID) {
  throw new Error('CONTENTFUL_SPACE_ID is not set')
}

if (!process.env.CONTENTFUL_ACCESS_TOKEN) {
  throw new Error('CONTENTFUL_ACCESS_TOKEN is not set')
}

export const contentfulClient = createClient({
  space: process.env.CONTENTFUL_SPACE_ID,
  accessToken: process.env.CONTENTFUL_ACCESS_TOKEN,
})

// Optional: Preview client for draft content
export const contentfulPreviewClient = process.env.CONTENTFUL_PREVIEW_TOKEN
  ? createClient({
      space: process.env.CONTENTFUL_SPACE_ID,
      accessToken: process.env.CONTENTFUL_PREVIEW_TOKEN,
      host: 'preview.contentful.com',
    })
  : null
```

### TypeScript Types

```typescript
// lib/contentful/types.ts
import type { Asset, Entry, EntrySkeletonType } from 'contentful'
import type { Document } from '@contentful/rich-text-types'

export interface BlogPostFields {
  title: string
  slug: string
  excerpt?: string
  content: Document
  featuredImage?: Asset
  author?: string
  publishedDate: string
  tags?: string[]
}

export type BlogPostSkeleton = EntrySkeletonType<BlogPostFields, 'blogPost'>
export type BlogPost = Entry<BlogPostSkeleton, undefined, string>

export interface AuthorFields {
  name: string
  bio?: string
  avatar?: Asset
}

export type AuthorSkeleton = EntrySkeletonType<AuthorFields, 'author'>
export type Author = Entry<AuthorSkeleton, undefined, string>
```

## Fetching Blog Posts

### API Functions

```typescript
// lib/contentful/api.ts
import { contentfulClient } from './index'
import type { BlogPostSkeleton, BlogPost } from './types'

export async function getBlogPosts(options?: {
  limit?: number
  skip?: number
  tag?: string
}): Promise<{ posts: BlogPost[]; total: number }> {
  const { limit = 10, skip = 0, tag } = options || {}

  const query: Record<string, unknown> = {
    content_type: 'blogPost',
    order: ['-fields.publishedDate'],
    limit,
    skip,
  }

  if (tag) {
    query['fields.tags[in]'] = tag
  }

  const response = await contentfulClient.getEntries<BlogPostSkeleton>(query)

  return {
    posts: response.items,
    total: response.total,
  }
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  const response = await contentfulClient.getEntries<BlogPostSkeleton>({
    content_type: 'blogPost',
    'fields.slug': slug,
    limit: 1,
  })

  return response.items[0] || null
}

export async function getAllBlogSlugs(): Promise<string[]> {
  const response = await contentfulClient.getEntries<BlogPostSkeleton>({
    content_type: 'blogPost',
    select: ['fields.slug'],
    limit: 1000,
  })

  return response.items.map(item => item.fields.slug)
}

export async function getBlogTags(): Promise<string[]> {
  const response = await contentfulClient.getEntries<BlogPostSkeleton>({
    content_type: 'blogPost',
    select: ['fields.tags'],
    limit: 1000,
  })

  const allTags = response.items.flatMap(item => item.fields.tags || [])
  return [...new Set(allTags)]
}
```

## Blog List Page

```tsx
// app/blog/page.tsx
import Link from 'next/link'
import Image from 'next/image'
import { getBlogPosts } from '@/lib/contentful/api'

export const revalidate = 60

export const metadata = {
  title: 'Blog | Your Store',
  description: 'Latest news and articles',
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; tag?: string }>
}) {
  const params = await searchParams
  const page = Number(params.page) || 1
  const tag = params.tag
  const limit = 9
  const skip = (page - 1) * limit

  const { posts, total } = await getBlogPosts({ limit, skip, tag })
  const totalPages = Math.ceil(total / limit)

  return (
    <div>
      <h1>Blog</h1>

      {tag && (
        <div>
          <span>Filtered by: {tag}</span>
          <Link href="/blog">Clear filter</Link>
        </div>
      )}

      <div className="grid grid-cols-3 gap-6">
        {posts.map(post => (
          <article key={post.sys.id}>
            {post.fields.featuredImage && (
              <Link href={`/blog/${post.fields.slug}`}>
                <Image
                  src={`https:${post.fields.featuredImage.fields.file?.url}`}
                  alt={post.fields.title}
                  width={400}
                  height={250}
                  className="rounded"
                />
              </Link>
            )}
            <h2>
              <Link href={`/blog/${post.fields.slug}`}>
                {post.fields.title}
              </Link>
            </h2>
            <p>{post.fields.excerpt}</p>
            <time dateTime={post.fields.publishedDate}>
              {new Date(post.fields.publishedDate).toLocaleDateString()}
            </time>
            {post.fields.tags && (
              <div>
                {post.fields.tags.map(tag => (
                  <Link key={tag} href={`/blog?tag=${tag}`}>
                    {tag}
                  </Link>
                ))}
              </div>
            )}
          </article>
        ))}
      </div>

      {/* Pagination */}
      <nav>
        {page > 1 && (
          <Link href={`/blog?page=${page - 1}${tag ? `&tag=${tag}` : ''}`}>
            Previous
          </Link>
        )}
        <span>Page {page} of {totalPages}</span>
        {page < totalPages && (
          <Link href={`/blog?page=${page + 1}${tag ? `&tag=${tag}` : ''}`}>
            Next
          </Link>
        )}
      </nav>
    </div>
  )
}
```

## Blog Post Page

```tsx
// app/blog/[slug]/page.tsx
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { getBlogPostBySlug, getAllBlogSlugs } from '@/lib/contentful/api'
import { RichText } from '@/components/rich-text'
import type { Metadata } from 'next'

export const revalidate = 60

export async function generateStaticParams() {
  const slugs = await getAllBlogSlugs()
  return slugs.map(slug => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const post = await getBlogPostBySlug(slug)

  if (!post) {
    return { title: 'Post Not Found' }
  }

  return {
    title: `${post.fields.title} | Blog`,
    description: post.fields.excerpt,
    openGraph: {
      title: post.fields.title,
      description: post.fields.excerpt,
      images: post.fields.featuredImage
        ? [`https:${post.fields.featuredImage.fields.file?.url}`]
        : [],
      type: 'article',
      publishedTime: post.fields.publishedDate,
    },
  }
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = await getBlogPostBySlug(slug)

  if (!post) {
    notFound()
  }

  return (
    <article>
      <header>
        <h1>{post.fields.title}</h1>
        <time dateTime={post.fields.publishedDate}>
          {new Date(post.fields.publishedDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </time>
        {post.fields.author && <p>By {post.fields.author}</p>}
      </header>

      {post.fields.featuredImage && (
        <Image
          src={`https:${post.fields.featuredImage.fields.file?.url}`}
          alt={post.fields.title}
          width={1200}
          height={600}
          priority
        />
      )}

      <RichText content={post.fields.content} />

      {post.fields.tags && (
        <footer>
          <h3>Tags</h3>
          <div>
            {post.fields.tags.map(tag => (
              <a key={tag} href={`/blog?tag=${tag}`}>
                {tag}
              </a>
            ))}
          </div>
        </footer>
      )}
    </article>
  )
}
```

## Rich Text Rendering

### Rich Text Component

```tsx
// components/rich-text.tsx
import { documentToReactComponents, Options } from '@contentful/rich-text-react-renderer'
import { BLOCKS, INLINES, Document } from '@contentful/rich-text-types'
import Image from 'next/image'
import Link from 'next/link'

const options: Options = {
  renderNode: {
    [BLOCKS.PARAGRAPH]: (node, children) => (
      <p className="mb-4">{children}</p>
    ),

    [BLOCKS.HEADING_1]: (node, children) => (
      <h1 className="text-3xl font-bold mb-4">{children}</h1>
    ),

    [BLOCKS.HEADING_2]: (node, children) => (
      <h2 className="text-2xl font-bold mb-3">{children}</h2>
    ),

    [BLOCKS.HEADING_3]: (node, children) => (
      <h3 className="text-xl font-bold mb-2">{children}</h3>
    ),

    [BLOCKS.UL_LIST]: (node, children) => (
      <ul className="list-disc pl-6 mb-4">{children}</ul>
    ),

    [BLOCKS.OL_LIST]: (node, children) => (
      <ol className="list-decimal pl-6 mb-4">{children}</ol>
    ),

    [BLOCKS.LIST_ITEM]: (node, children) => (
      <li className="mb-1">{children}</li>
    ),

    [BLOCKS.QUOTE]: (node, children) => (
      <blockquote className="border-l-4 border-gray-300 pl-4 italic my-4">
        {children}
      </blockquote>
    ),

    [BLOCKS.HR]: () => <hr className="my-8" />,

    [BLOCKS.EMBEDDED_ASSET]: (node) => {
      const { file, title } = node.data.target.fields
      const url = file?.url
      const contentType = file?.contentType

      if (!url) return null

      if (contentType?.startsWith('image/')) {
        return (
          <figure className="my-6">
            <Image
              src={`https:${url}`}
              alt={title || ''}
              width={800}
              height={400}
              className="rounded"
            />
            {title && (
              <figcaption className="text-center text-sm text-gray-600 mt-2">
                {title}
              </figcaption>
            )}
          </figure>
        )
      }

      // Handle other asset types (video, etc.)
      return null
    },

    [INLINES.HYPERLINK]: (node, children) => {
      const { uri } = node.data
      const isExternal = uri.startsWith('http')

      if (isExternal) {
        return (
          <a
            href={uri}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            {children}
          </a>
        )
      }

      return (
        <Link href={uri} className="text-blue-600 hover:underline">
          {children}
        </Link>
      )
    },
  },
}

export function RichText({ content }: { content: Document }) {
  return (
    <div className="prose max-w-none">
      {documentToReactComponents(content, options)}
    </div>
  )
}
```

## Image Optimization

### Contentful Image Loader

```typescript
// lib/contentful/image-loader.ts
export function contentfulLoader({
  src,
  width,
  quality,
}: {
  src: string
  width: number
  quality?: number
}) {
  const url = new URL(src)
  url.searchParams.set('w', String(width))
  url.searchParams.set('q', String(quality || 75))
  url.searchParams.set('fm', 'webp')
  return url.toString()
}
```

### Next.js Config

```typescript
// next.config.js
module.exports = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.ctfassets.net',
      },
    ],
  },
}
```

## Related Products in Blog Posts

Link blog posts to Subbly products:

```tsx
// app/blog/[slug]/page.tsx
import { subblyApi } from '@/lib/subbly'
import { ProductCard } from '@/components/product-card'

export default async function BlogPostPage({ params }) {
  const { slug } = await params
  const post = await getBlogPostBySlug(slug)

  // Get related products based on tags
  const productTags = post?.fields.tags?.filter(tag =>
    tag.startsWith('product:')
  ).map(tag => tag.replace('product:', ''))

  let relatedProducts = []
  if (productTags?.length) {
    const response = await subblyApi.product.list({
      tags: productTags,
      perPage: 3,
    })
    relatedProducts = response.data
  }

  return (
    <article>
      {/* Blog content */}
      <RichText content={post.fields.content} />

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section>
          <h2>Related Products</h2>
          <div className="grid grid-cols-3 gap-4">
            {relatedProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}
    </article>
  )
}
```