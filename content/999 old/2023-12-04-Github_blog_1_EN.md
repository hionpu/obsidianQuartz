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
permalink: /posts/github_blog_1
pin: true
math: true
mermaid: true
---

# Introduction

In the past few days, I've created a blog on GitHub Pages. Initially, I considered using Tistory or Google Blogspot for my blog, but I was captivated by the strange idea of wanting to support multiple languages, which led me to GitHub Pages.

Tistory/Blogspot does have multilingual support plugins, but they are either of low quality, difficult to modify translations, or paid, which I didn't like.

There were times during the process when I encountered errors with no information available for resolution, and I thought about just using Tistory. However, I persevered and finally succeeded by persistently consulting GPT. I proceeded in the following steps, and since I used the Chirpy theme, this might not be helpful for those using other themes.

# Series Post Links

<font size = "5">(1) Create a Repository and Check the Test Page</font>

(2) [Applying the Chirpy Theme](https://hionpu.com/posts/github_blog_2)

(3) [How to Upload Posts](https://hionpu.com/posts/github_blog_3) 

(4) [Make the blog supports multiple languages](https://hionpu.com/posts/github_blog_4) 

(5) [Creating a Sitemap](https://hionpu.com/posts/github_blog_5) 



# 1. Create a Repository


![image](https://github.com/hionpu/hionpu.github.io/assets/111286364/cb721c89-9865-4fbc-ae40-ebfbb0e12479)
The green 'New' button on the right side of the GitHub Repositories tab.

![image](https://github.com/hionpu/hionpu.github.io/assets/111286364/dd573081-6fca-4e49-91d1-b1695488f991)
Select yourself as the owner and enter in the format _<your_GitHub_account>.github.io_ (I already created mine, so the red message below shows it already exists).


![image](https://github.com/hionpu/hionpu.github.io/assets/111286364/76025c67-7d43-4735-9913-b57b0985ab2b)
Check 'Public' and 'Add a README file', then click the green 'Create Repository' button below.

# 2. Clone to Your Local Machine

![image](https://github.com/hionpu/hionpu.github.io/assets/111286364/a229797f-8ae0-460c-ac42-61edcccc0a2d)
n the newly created Repository, click the green <> Code button on the right to find the Https address of your Repository (also visible in the address bar). Copy this and move to the location where you want to clone in a terminal like git bash, then

```
git clone [copied address]
```

After cloning to your local machine, you will find a folder with the name of the Repository you just created. Enter this folder in the terminal and create a temporary test index file:

```
cd username.github.io
echo "Hello World" > index.html
```

# 3. Push 'index.html' and Check

```
git add *
git commit -m "Beginning of my git blog"
git push -u origin main
```

Now, if you go to https://[your account name].github.io, you can see the content written in the index.

Next, we will apply a theme.


# Next Article

(2) [Applying the Chirpy Theme](https://hionpu.com/posts/github_blog_2)

