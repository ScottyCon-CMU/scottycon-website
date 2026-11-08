import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
const manifest = JSON.parse(await fs.readFile('docs/asset-sources.json', 'utf8')).assets.filter(asset => asset.file.startsWith('/original-home/'))
function expand(node, page) {
  if (typeof node === 'string') return node
  if ('slot' in node) return expand(page[node.slot], page)
  return { ...node, children: node.children.map(child => expand(child, page)) }
}
function text(node) { return typeof node === 'string' ? node : node.children.map(text).join('') }
function nodes(node) { return typeof node === 'string' ? [] : [node, ...node.children.flatMap(nodes)] }
try {
  const { pages } = await server.ssrLoadModule('/src/components/original-home/source.ts')
  const { Markup } = await server.ssrLoadModule('/src/components/original-home/Markup.tsx')
  const { OriginalHomeContext } = await server.ssrLoadModule('/src/components/original-home/context.ts')
  const { localHref } = await server.ssrLoadModule('/src/components/original-site/links.ts')
  const audit = JSON.parse(await fs.readFile('scripts/fixtures/home-capture-audit.json', 'utf8'))
  const runtimeCss = await fs.readFile('src/components/original-home/runtime.css', 'utf8')
  assert(runtimeCss.includes('grid-template-rows: 0px repeat(4, min-content) 1fr'))
  assert(runtimeCss.includes('grid-template-rows: 0px repeat(3, min-content) 1fr'))
  const heroAnimationRule = runtimeCss.match(/@media \(prefers-reduced-motion: no-preference\)\s*\{([^}]+\})/s)?.[1]
  assert(heroAnimationRule?.includes('animation-play-state: running;'))
  for (const id of ['comp-kgyv85sr', 'comp-kgyv85t01', 'comp-kgyvb9r6']) assert(heroAnimationRule.includes(`#${id}`))
  for (const mode of ['desktop', 'mobile']) {
    const { page, css } = pages[mode]
    const source = expand(page.shell, page)
    const all = nodes(source)
    const links = all.filter(n => n.tag === 'a').map(n => n.attributes.href).filter(Boolean)
    assert.deepEqual(links, audit[mode].anchor_targets)
    assert.equal(text(source).length, audit[mode].text_characters)
    assert(links.includes('https://www.scottycon.com/flea-market'))
    assert(text(source).includes('Phoebe Chan jioned us at ScottyCon 2026!'))
    assert(text(source).includes('Subscribe to our Newsletter'))
    assert(text(source).includes('Load More'))
    assert(all.some(n => n.tag === 'img' && n.attributes.src.includes('230917-cover')))
    for (const n of all.filter(n => n.tag === 'img')) {
      assert(n.attributes.src, `Unresolved image: ${JSON.stringify(n.attributes)}`)
      await fs.access(path.join('public', n.attributes.src))
    }
    assert(css.includes('quicksand') && css.includes('din-next-w01-light'))
    const value = { page, mobile: mode === 'mobile', menuOpen: false, setMenuOpen() {}, activeMenu: null, setActiveMenu() {} }
    const html = renderToStaticMarkup(createElement(OriginalHomeContext, { value }, createElement(Markup, { node: page.shell, slots: Object.fromEntries(['header','content','footer'].map(slot => [slot, createElement(Markup, { node: page[slot] })])) })))
    assert(!html.includes('<script'))
    assert(!html.includes('id="comp-lfczpz75"'), `${mode}: removed banner section still rendered`)
    assert(!html.includes('230917-cover'), `${mode}: removed banner image still rendered`)
    assert(!html.includes('Flea Market'), `${mode}: removed navigation label still rendered`)
    assert(!html.includes('/flea-market'), `${mode}: removed navigation link still rendered`)
    assert(html.includes(`href="${localHref('https://www.scottycon.com/faq')}"`))
    assert(html.includes('ScottyCon 2027'))
    assert(html.includes('Jared L. Cohon University Center'))
    if (mode === 'desktop') {
      assert(html.includes('March 27, 2027 @ Cohon University Center'))
      assert(html.includes('27 March 2027'))
      assert(html.includes('11AM - 9PM'))
      for (const id of ['comp-kgyv85sr', 'comp-kgyv85t01', 'comp-kgyvb9r6']) {
        assert(css.includes(`#${id}:not([data-motion-enter="done"])`))
      }
      assert(css.includes('backwards 1 paused'))
      assert(css.includes('0% { opacity: 0; animation-timing-function: step-end; }'))
    }
    console.log(`PASS ${mode}: source capture intact; banner and Flea Market menu removed; local links; hero text/animation retained`)
  }
  for (const item of manifest) {
    const file = path.join('public', item.file)
    const bytes = await fs.readFile(file)
    assert(bytes.length > 100, `Missing/empty resource: ${file}`)
    if (item.file.endsWith('.woff2')) assert.equal(bytes.toString('ascii', 0, 4), 'wOF2')
  }
  console.log(`PASS ${manifest.length} local resources; no extra dependencies or Wix scripts`)
} finally { await server.close() }
