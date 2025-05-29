import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { FullSlug, SimpleSlug, resolveRelative } from "../util/path"
import { QuartzPluginData } from "../plugins/vfile"
import { byDateAndAlphabetical } from "./PageList"
import style from "./styles/recentNotes.scss"
import { Date, getDate } from "./Date"
import { GlobalConfiguration } from "../cfg"
import { i18n } from "../i18n"
import { classNames } from "../util/lang"

interface Options {
  title?: string
  limit: number
  linkToMore: SimpleSlug | false
  showTags: boolean
  filter: (f: QuartzPluginData) => boolean
  sort: (f1: QuartzPluginData, f2: QuartzPluginData) => number
}

const defaultOptions = (cfg: GlobalConfiguration): Options => ({
  title: "Recent Posts",
  limit: 5,
  linkToMore: false,
  showTags: true,
  filter: (f) => f.slug !== "index", // Exclude the index page itself
  sort: byDateAndAlphabetical(cfg),
})

export default ((userOpts?: Partial<Options>) => {
  const IndexRecentNotes: QuartzComponent = ({
    allFiles,
    fileData,
    displayClass,
    cfg,
  }: QuartzComponentProps) => {
    // Only show on index page
    if (fileData.slug !== "index") {
      return null
    }

    const opts = { ...defaultOptions(cfg), ...userOpts }
    
    // Always ensure index page is excluded, even if user provides custom filter
    const combinedFilter = (f: QuartzPluginData) => {
      // First apply the index exclusion
      if (f.slug === "index") return false
      // Then apply user filter if provided
      return opts.filter(f)
    }
    
    const pages = allFiles.filter(combinedFilter).sort(opts.sort)
    const remaining = Math.max(0, pages.length - opts.limit)
    
    return (
      <div class={classNames(displayClass, "recent-notes")}>
        <h3>{opts.title ?? i18n(cfg.locale).components.recentNotes.title}</h3>
        <ul class="recent-ul">
          {pages.slice(0, opts.limit).map((page) => {
            const title = page.frontmatter?.title ?? i18n(cfg.locale).propertyDefaults.title
            const tags = page.frontmatter?.tags ?? []
            const createdDate = page.dates?.created

            return (
              <li class="recent-li">
                <div class="section">
                  <div class="desc">
                    <h3>
                      <a href={resolveRelative(fileData.slug!, page.slug!)} class="internal">
                        {title}
                      </a>
                    </h3>
                  </div>
                  {createdDate && (
                    <p class="meta">
                      <Date date={createdDate} locale={cfg.locale} />
                    </p>
                  )}
                  {opts.showTags && (
                    <ul class="tags">
                      {tags.map((tag) => (
                        <li>
                          <a
                            class="internal tag-link"
                            href={resolveRelative(fileData.slug!, `tags/${tag}` as FullSlug)}
                          >
                            {tag}
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
        {opts.linkToMore && remaining > 0 && (
          <p>
            <a href={resolveRelative(fileData.slug!, opts.linkToMore)}>
              {i18n(cfg.locale).components.recentNotes.seeRemainingMore({ remaining })}
            </a>
          </p>
        )}
      </div>
    )
  }

  IndexRecentNotes.css = style
  return IndexRecentNotes
}) satisfies QuartzComponentConstructor 