import routes from '../../data/original-site/routes.json'

export const sourcePaths = new Set(['/', ...routes.map(route => route.path)])

export function localHref(href: string, source = 'https://www.scottycon.com/'): string {
  if (!href || /^(mailto:|tel:|data:|blob:|javascript:)/i.test(href)) return href
  let url: URL
  try { url = new URL(href, source) } catch { return href }
  if (!['www.scottycon.com', 'scottycon.com'].includes(url.hostname)) return href
  let pathname = url.pathname.replace(/\/$/, '') || '/'
  if (pathname === '/home') pathname = '/'
  if (!sourcePaths.has(pathname)) return href
  return `${import.meta.env.BASE_URL}#${pathname}${url.search}${url.hash}`
}

export function isFleaMarketItem(node: { tag: string; attributes: Record<string, string | null>; children: unknown[] }): boolean {
  if (node.tag !== 'li') return false
  const containsLink = (value: unknown): boolean => {
    if (!value || typeof value !== 'object') return false
    const n = value as typeof node
    return (n.tag === 'a' && /\/flea-market\/?(?:[?#]|$)/.test(n.attributes?.href ?? '')) || (n.children?.some(containsLink) ?? false)
  }
  return node.children.some(containsLink)
}
