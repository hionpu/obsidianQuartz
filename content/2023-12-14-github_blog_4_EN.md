---
title: "Setting Up a GitHub Blog (4) - Supporting Multiple Languages with Polyglot"
tags:
  - blog
  - chirpy
  - "#polyglot"
  - "#multilanguage"
categories:
  - "[GitHub, jekyll]"
createdAt: 2023-12-14 13:36
lastmod: 2023-12-14 13:36
lang: en
permalink: /posts/github_blog_4
pin: true
math: true
mermaid: true
---

## Series Post Links
(1) [Creating a Repository and Testing the Page](https://hionpu.com/posts/github_blog_1)

(2) [Applying the Chirpy Theme](https://hionpu.com/posts/github_blog_2)

(3) [Uploading Posts](https://hionpu.com/posts/github_blog_3)

<font size = "5">(4) Supporting Multiple Languages</font>

(5) [Creating a Sitemap](https://hionpu.com/posts/github_blog_5)

# 1. Introduction
I decided to support multiple languages on my blog because it's not too difficult to upload English posts after getting them translated by GPT and doing some proofreading myself, aiming to attract English-speaking visitors. From my perspective, supporting multiple languages means:

1. Being searchable in search engines in the respective language.
2. Or, even if the page appears in Korean in search results, being able to change the language with a language switch button.

Additionally, it would be better if:

- Each page could be managed with a permalink within the same site.

After some research, I found that using the Jekyll plugin called polyglot could meet these conditions.

# 2. Installing the Polyglot Plugin
## 2-1. Installing the Plugin 
In the Shell, go to `my_blog_root_directory/` and install the plugin with:
```shell
gem install jekyll-polyglot
```

## 2-2. Modifying `_config.yml`
After installation, open `_config.yml` and add `- jekyll-polyglot` under the `plugins:` tab like this:
```shell
plugins:
  - jekyll-polyglot
```
Also, change the language settings by finding the `languages:` tab and modifying it as follows:
```
languages: ["en", "ko"] # Languages you want to support
default_lang: "ko" # Default language of the content
exclude_from_localization: ['javascript', 'images', 'css', 'sitemap.xml'] # Folders to exclude from multilingual functionality
parallel_localization: false # Not very significant
```
For languages other than Korean and English, you can add them by referring to the 639-1 codes from [List of ISO 639-1 codes - Wikipedia](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes).

# 3. Modifying `.md` Files
As mentioned earlier, for multilingual support, you need to set `permalink:` for each post in `_config.yml`. This is what we will do here. In the property of the `.md` file you are uploading in the `yyyy-mm-dd-title` format, add:
```shell
lang: [language of the page]
permalink: [URL of the page]
```
For example, the URL of this post I am writing now, based on the default language (`ko` in `_config.yml`), is `hionpu.com/posts/github_blog_4`. Since it supports relative paths, you can write it as:

```
---
    ...

lang: ko
permalink: /posts/github_blog_4

    ...
---

```

For English, just change the `lang:` part to `en`. Then, when Jekyll builds, the Korean page will be at `hionpu.com/posts/github_blog_4`, and the English page will be at `hionpu.com/en/posts/github_blog_4`.

Now, let's build and see. If the build is successful and pages for each language are displayed correctly locally, it's a success. However, I encountered an error.

<a name = "four"></a>
# 4. Polyglot Dependency Issue
![image](https://github.com/hionpu/hionpu.github.io/assets/111286364/c9f5de67-c2b2-45e1-9bfd-00c92524ac97)
An error like the one above occurred.

(Text)
>Dependency Error: Yikes! It looks like you don't have jekyll-polyglot or one of its dependencies installed. In order to use Jekyll as currently configured, you'll need to install this gem. If you've run Jekyll with `bundle exec`, ensure that you have included the jekyll-polyglot gem in your Gemfile as well. The full error message from Ruby is: 'cannot load such file -- jekyll-polyglot' If you run into trouble, you can find helpful resources at https://jekyllrb.com/help/!
>
C:/Users/user/.local/share/gem/ruby/3.2.0/gems/jekyll-4.3.2/lib/jekyll/external.rb:70:in `rescue in block in require_with_graceful_fail': jekyll-polyglot (Jekyll::Errors::MissingDependencyException)

It seemed to be a dependency issue with polyglot.

I tried updating the gem, bundle, and polyglot, but the issue persisted. So, I asked GPT about the error as is, and it suggested modifying the Gemfile. I opened the Gemfile in an editor and added:
```
gem "jekyll-polyglot"
```
This resolved the specific error, but another error occurred.

![image](https://github.com/hionpu/hionpu.github.io/assets/111286364/2118171b-7556-43b8-86b9-6ac2236cfc2b)

(Text)
> C:/Users/user/.local/share/gem/ruby/3.2.0/gems/jekyll-polyglot-1.7.0/lib/jekyll/polyglot/patches/jekyll/site.rb:215:in `relative_url_regex': target of repeat operator is not specified: /href="?\/((?:(?!*.gem)(?!*.gemspec)(?!docs)(?!tools)(?!README.md)(?!LICENSE)(?!rollup.config.js)(?!package*.json)(?!.sass-cache)(?!.jekyll-cache)(?!gemfiles)(?!Gemfile)(?!Gemfile.lock)(?!node_modules)(?!vendor\/bundle\/)(?!vendor\/cache\/)(?!vendor\/gems\/)(?!vendor\/ruby\/)(?!javascript)(?!images)(?!css)(?!ja\/)(?!ko\/)(?!en\/)[^,'"\s\/?.]+\.?)*(?:\/[^\]\[)("'\s]*)?)"/ (RegexpError)

The error was related to regular expressions, and when I opened the <font color = "red">site.rb</font> file in an editor and went to the specified line (215), I found a function containing a regular expression like this:

```
def relative_url_regex(disabled = false)
  regex = ''
  unless

 disabled
    @exclude.each do |x|
      regex += "(?!#{x})"
    end
    @languages.each do |x|
      regex += "(?!#{x}\/)"
    end
  end
  start = disabled ? 'ferh' : 'href'
  %r{#{start}="?#{@baseurl}/((?:#{regex}[^,'"\s/?.]+\.?)*(?:/[^\]\[)("'\s]*)?)"}
end
```

The error was occurring in this part.

Since I didn't want to learn regular expressions just to solve this and asked GPT for help, it instructed me to modify it to:

```
def relative_url_regex(disabled = false)
  regex = ''
  unless disabled
    @exclude.each do |x|
      escaped_x = Regexp.escape(x)
      regex += "(?!#{escaped_x})"
    end
    @languages.each do |x|
      escaped_x = Regexp.escape(x)
      regex += "(?!#{escaped_x}\/)"
    end
  end
  start = disabled ? 'ferh' : 'href'
  %r{#{start}="?#{@baseurl}/((?:#{regex}[^,'"\s/?.]+\.?)*(?:/[^\]\[)("'\s]*)?)"}
end
```

The change was:
```
regex += "(?!#{x})"
```
and
```
regex += "(?!#{x}\/)"
```
to
```
escaped_x = Regexp.escape(x)
regex += "(?!#{escaped_x})"
```

Using `Regexp.escape()` to replace `x` with `escaped_x`.

The cause of the error, according to GPT, could be the complexity of regular expressions and failure to reflect changes in versions. However, I remember the post I referred to for applying polyglot was written around August 2023, so was there a change in just a few months?

Anyway, after applying the above changes, the build was successful, and both Korean and English content were displayed correctly in one post.

If your blog is built locally in `_site` and then pushed and deployed remotely, this method should work. However, the Chirpy theme builds separately on the remote via GitHub Action and deploys the created `_site`, so this method does not apply.

# 5. If Errors Occur in GitHub Build

## 5-1. Cause
Chirpy, which builds and deploys via GitHub Action, still throws the same error during the build process in the Action tab, even if you follow the method mentioned above.

As just mentioned, even if you modify locally, the GitHub Action build refers to the `Gemfile` pushed locally and loads the plugin into the Ubuntu virtual machine, so the changes made locally are not reflected. So, what should be done?

## 5-2. Setting Up to Use the Modified Plugin in the Ubuntu Virtual Environment

In [4. Polyglot Dependency Issue](#four), we added polyglot to the Gemfile. Plugins added this way seem to use the Git repository of that plugin by default. If you modify the polyglot plugin part of the Gemfile to:

```shell
gem 'jekyll-polyglot', git: 'https://github.com/hionpu/polyglot', branch: 'master'
```
Now, the polyglot plugin will refer to the `master` branch of the `https://github.com/hionpu/polyglot` repository. This means you now have your own polyglot repository, which you can clone ⟶ modify ⟶ push to use your own polyglot plugin even when building remotely.

Of course, you can copy and paste the above Gemfile modification to use my (the author's) modified polyglot. Alternatively, you can fork the original repository of the polyglot plugin at:

> [untra/polyglot: :abc: Multilingual and i18n support tool for Jekyll Blogs (github.com)](https://github.com/untra/polyglot/tree/master)
{: .prompt-info}

Then clone it locally, make your modifications, and set it to refer to that repository.

After completing all the above steps, run:
```shell
bundle
```
Then push your blog and check if the build and deployment are successful.

> If another error occurs, please leave a comment. I will try my best to respond.
{: .prompt-info}

# Next Article
(5) [Creating a Sitemap](https://hionpu.com/posts/github_blog_5)

---