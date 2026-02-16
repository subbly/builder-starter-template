---
name: cms-integration
description: This guide covers content management systems (CMS) integration with Subbly Next.js website. Supported CMS - Contentful. Use this guide when user asks to add a blog, CMS, or upload user files. 
---

# CMS integrations

This guide provides reference documentation for different CMS integration use cases. Include the relevant reference
files when
working on a specific feature.

User may request to add content not covered by Subbly.  
This may include, but not limited to:

- Adding a blog and a blog post pages
- Fetching custom content for static or dynamic pages
- Uploading user files (e.g. avatars, documents, etc)

## Supported CMS

- [Contentful](https://www.contentful.com)

## Contentful

### Creating a blog with Contentful CMS

Contentful provides a convenient and well-tested way to integrate a blog into a Next.js application.
Follow this reference to get instructions on how: 

- Create Contentful space and API keys
- Set Contentful environment variables
- Create content models for blog in Contentful
- Setup Contentful client
- Fetch blog posts
- Create a blog listing page
- Create a blog post page
- Render rich text
- Display related products in blog posts

### Uploading user files to Contentful CMS

Use Contentful when user asks to save custom files from customers.
Follow this reference to learn how to:

- Configure Contentful management client
- Create an API route for Contentful upload
- Use client-side Contentful upload
- Add Contentful upload component
- Use combined upload strategy

| Feature                       | Reference                                   |  
-------------------------------|---------------------------------------------|  
| Adding blog with Contentful   | references/adding-blog-with-contentful.md   |
| Uploading files to Contentful | references/uploading-files-to-contentful.md |
