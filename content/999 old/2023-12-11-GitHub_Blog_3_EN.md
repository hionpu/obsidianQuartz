---
title: Setting Up a GitHub Blog (3) - Upload a Post
tags:
  - "#github"
  - blog
  - chirpy
categories:
  - "[GitHub, jekyll]"
createdAt: 2023-12-11 15:54
lastmod: 2023-12-11 15:54
lang: en
permalink: /posts/github_blog_3
pin: true
math: true
mermaid: true
---
# Series Post Links
(1) [Creating a Repository and Testing the Page](https://hionpu.com/posts/github_blog_1) 

(2) [Applying the Chirpy Theme](https://hionpu.com/posts/github_blog_2)

<font size = "5">(3) Upload a Post</font >

(4) [Implementing Multilingual Support](https://hionpu.com/posts/github_blog_4) 

(5) [Creating a Sitemap](https://hionpu.com/posts/github_blog_5) 

# 1. Format and Location for Post Filenames
To post an article, use the format

> 2023-12-11-title-of-post.md

for the Markdown file, and place these .md files in the \_post folder.

When Jekyll builds, it compiles all .md files stored in the blog root folder/\_posts (including those in folders within \_posts) into .html files and places them in the \_site folder. The .html files in the \_site folder become the pages visible when deployed (or on localhost:4000). However, the filenames and subpaths in the \_site folder do not exactly match those in \_posts, as they are influenced by the `permalink:` property in \_config.yml, which is a global setting. This can be overridden in the .md file by specifying `permalink: path` under properties. This aspect is particularly important when using the polyglot plugin for Jekyll to support multiple languages, which requires specifying a permalink for each post. For now, we will leave it as is.

# 2. Write a Post
When clicking on an uploaded post to read it, the right panel displays recent updates, tags, and **table of contents**. Chirpy theme automatically generates this table of contents from headers like \# during the Jekyll build. I've used tocbot for some customization in this area, but more on that later. It's important to note that headers are recognized, and a table of contents is generated.

More crucial is writing the properties section of the Markdown file. Let's explain using the properties from the previous post's .md file as an example.

```shell
---
title: Setting Up a GitHub Blog (1) - Creating a Repository and Checking the Test Page
date: 2023-12-04 15:22
lastmod: 2023-12-07 15:56
tags:
  - "#github"
  - "#blog"
  - "#jekyll"
  - "#polyglot"
categories:
  - "[GitHub, jekyll]"
lang: en
permalink: /posts/Github_blog_1
pin: true
math: true
mermaid: true
---
```

- `title:` is the title displayed on the blog.
- `date:` is the creation date in the format YYYY-MM-DD HH:MM.
- `lastmod:` is the most recent modification date, which is convenient for sitemap creation. If it feels tedious, just keep it the same as the creation date.
- `tags:` are used for categorization. Chirpy theme sorts posts by tags in the TAGS tab.
- `categories:` similar to tags, also used for categorization in chirpy, akin to folders.
- `lang:` necessary for multilingual support. Pages are created for each language listed in the \_config.yml's `language` attribute.
- `permalink:` overrides the global `permalink` setting from \_config.yml.
- `pin:`, `math:`, `mermaid:` provide additional features. In chirpy theme, posts typically have these set to `true`.

Now, copy and paste the below template, filling in each attribute. I use [Obsidian](https://obsidian.md/) as a markdown editor. Using &#123;&#123;date&#125;&#125; &#123;&#123;time&#125;&#125; in the template inputs the timestamp at the time of writing.

``` shell
---
title: 
tags: 
categories: 
createdAt: {% raw %}{{ date }} {{ time }}{% endraw %}
lastmod: {% raw %}{{ date }} {{ time }}{% endraw %}
lang: ko
permalink: /posts/
pin: true
math: true
mermaid: true
---
```

# 3. Save the file in \_posts, Push, Build, and Deploy
As mentioned earlier, put the .md file in the local root folder/\_posts, then build and check it locally first.
```shell
bundle exec jekyll serve
```
Go to localhost:4000 to confirm, and if the post displays correctly, push it, then check the automatically built and deployed page.

# Next Article
(4) [Implementing Multilingual Support](https://hionpu.com/posts/github_blog_4) 
