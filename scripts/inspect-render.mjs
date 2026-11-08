// Inspect React's own static HTML output without a Python or browser dependency.
// React escapes text/attribute entities; source style/script blocks are excluded.
const decode = value => value.replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (_, entity) => {
  if (entity[0] === '#') return String.fromCodePoint(parseInt(entity.slice(entity[1].toLowerCase() === 'x' ? 2 : 1), entity[1].toLowerCase() === 'x' ? 16 : 10))
  return { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" }[entity.toLowerCase()]
})

export function inspect(html) {
  const result = { text: '', links: [], images: [], ids: [] }
  const content = html.replace(/<(style|script|noscript)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '').replace(/<!--[\s\S]*?-->/g, '')
  for (const token of content.match(/<(?:[^>"']|"[^"]*"|'[^']*')*>|[^<]+/g) ?? []) {
    if (!token.startsWith('<')) { result.text += decode(token); continue }
    const name = token.match(/^<([\w-]+)/)?.[1]?.toLowerCase()
    if (!name) continue
    const attrs = Object.fromEntries([...token.matchAll(/\s([\w:-]+)(?:=(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)].map(m => [m[1].toLowerCase(), decode(m[2] ?? m[3] ?? m[4] ?? '')]))
    if (name === 'a' && 'href' in attrs) result.links.push(attrs.href)
    if (name === 'img') result.images.push(attrs)
    if ('id' in attrs) result.ids.push(attrs.id)
  }
  return result
}
