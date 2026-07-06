/**
 * 使用手册全文搜索索引
 * - 客户端子串匹配
 * - 评分排序（标题 100 > 标题 50 > 内容 10）
 * - 关键词高亮（<mark>）
 */

export interface SearchEntry {
  doc: string           // 相对路径，如 admin/02-add-tenant.md
  title: string         // 一级标题
  content: string       // 纯文本内容（剥离 markdown）
  headings: string[]    // 所有标题文本
}

export interface SearchResult {
  doc: string
  title: string
  snippet: string       // 摘要（含匹配位置前后 50 字）
  score: number
}

let cachedIndex: SearchEntry[] | null = null

/**
 * 构建搜索索引（module 级缓存）
 * @param docs import.meta.glob 加载的 md 文件 map
 */
export function buildIndex(docs: Record<string, string>): SearchEntry[] {
  if (cachedIndex) return cachedIndex
  cachedIndex = Object.entries(docs).map(([path, raw]) => {
    const doc = path.replace(/^.*docs\/manual\//, '')
    const lines = raw.split('\n')
    const title = (lines.find(l => l.startsWith('#')) || '').replace(/^#+\s*/, '')
    const content = raw
      .replace(/```[\s\S]*?```/g, ' ')
      .replace(/`[^`]+`/g, ' ')
      .replace(/!\[[^\]]*\]\([^)]+\)/g, ' ')
      .replace(/\[[^\]]*\]\([^)]+\)/g, '$1')
      .replace(/[#>*_\-|`]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    const headings = lines
      .filter(l => /^#{1,6}\s/.test(l))
      .map(l => l.replace(/^#+\s*/, ''))
    return { doc, title, content, headings }
  })
  return cachedIndex
}

/**
 * 搜索
 */
export function search(query: string, index: SearchEntry[]): SearchResult[] {
  if (!query.trim()) return []
  const q = query.toLowerCase()
  const results: SearchResult[] = []
  for (const entry of index) {
    const titleMatch = entry.title.toLowerCase().includes(q)
    const headingMatch = entry.headings.some(h => h.toLowerCase().includes(q))
    const contentIdx = entry.content.toLowerCase().indexOf(q)
    if (titleMatch || headingMatch || contentIdx >= 0) {
      let score = 0
      if (titleMatch) score += 100
      if (headingMatch) score += 50
      if (contentIdx >= 0) score += 10
      const snippet = contentIdx >= 0
        ? entry.content.slice(Math.max(0, contentIdx - 50), contentIdx + q.length + 50)
        : entry.headings.find(h => h.toLowerCase().includes(q)) || entry.title
      results.push({ doc: entry.doc, title: entry.title, snippet, score })
    }
  }
  return results.sort((a, b) => b.score - a.score).slice(0, 20)
}

/**
 * 关键词高亮（返回 HTML 字符串，需用 v-html 渲染）
 */
export function highlight(text: string, query: string): string {
  if (!query) return escapeHtml(text)
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const re = new RegExp(escaped, 'gi')
  return escapeHtml(text).replace(re, '<mark>$&</mark>')
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
