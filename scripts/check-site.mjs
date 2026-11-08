import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import crypto from 'node:crypto'
import { inspect } from './inspect-render.mjs'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'

const readJson = async file => JSON.parse(await fs.readFile(file, 'utf8'))
const routes = await readJson('src/data/original-site/routes.json')
const galleries = await readJson('src/data/original-site/galleries.json')
const proGalleries = await readJson('src/data/original-site/pro-galleries.json')
const tables = await readJson('src/data/original-site/tables.json')
const audit = await readJson('scripts/fixtures/site-capture-audit.json')
const assets = await readJson('docs/asset-sources.json').then(manifest => manifest.assets)
const allPaths = new Set(['/', ...routes.map(route => route.path)])
assert.equal(routes.length, 18)
assert(!allPaths.has('/flea-market'))
function walk(n) { return typeof n === 'string' || 'slot' in n ? [] : [n, ...n.children.flatMap(walk)] }
function text(n) { return typeof n === 'string' ? n : n.children.map(text).join('') }
function expand(n, page) {
  if (typeof n === 'string') return n
  if ('slot' in n) return expand(page[n.slot], page)
  return { ...n, children: n.children.map(child => expand(child, page)) }
}
function tableText(table, mobile) {
  const [head,...rows] = table.rows
  const headers = table.parameters.columnsOnOff ? head.slice(0, table.parameters.columns) : head
  // Table Master adds a nonbreaking space after each body cell, including
  // cells moved into mobile details. The CSV itself remains untouched.
  return mobile ? headers[0] + rows.map(row => row[0] + '\u00a0' + headers.slice(1).map((label,i) => label + (row[i+1] ?? '') + '\u00a0').join('')).join('') : headers.join('') + rows.map(row => row.slice(0,headers.length).map(cell => cell + '\u00a0').join('')).join('')
}
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
try {
  const { Markup } = await server.ssrLoadModule('/src/components/original-home/Markup.tsx')
  const { OriginalHomeContext } = await server.ssrLoadModule('/src/components/original-home/context.ts')
  const { localHref, isFleaMarketItem } = await server.ssrLoadModule('/src/components/original-site/links.ts')
  const { projectGallery, findSourceNode } = await server.ssrLoadModule('/src/components/original-site/gallery-model.ts')
  const { sourceMaps, mapUrls } = await server.ssrLoadModule('/src/components/original-site/maps.ts')
  function expected(n, page, mobile) {
    if (typeof n === 'string') return n
    if (isFleaMarketItem(n) || n.attributes.id === 'comp-lfczpz75') return null
    const attributes = { ...n.attributes }
    if (attributes.href) attributes.href = localHref(attributes.href, page.source)
    const children = n.children.map(child => expected(child,page,mobile)).filter(c => c !== null)
    const table = page.tables?.[attributes.id]
    if (table) children.push(tableText(table,mobile))
    const map = page.source.endsWith('/maps') && sourceMaps[attributes.id]
    if (map) children.push({ tag:'a', attributes:{href:mapUrls(map).open}, children:['Open in Google Maps'] })
    return { ...n, attributes, children }
  }
  const rendered = new Map()
  let linkCount = 0, imageCount = 0, slideCount = 0
  for (const route of routes) for (const mode of ['desktop','mobile']) {
    const slug = route.path.slice(1), key = `${slug}/${mode}`
    const base = await readJson(`src/data/original-site/${slug}-${mode}.json`)
    const page = { ...base, galleries: galleries[key], proGalleries: proGalleries[key], tables: Object.fromEntries(Object.entries(tables).filter(([,v]) => v.route === slug)) }
    const raw = expand(page.shell,page)
    assert.equal(crypto.createHash('sha256').update(text(raw)).digest('hex'), audit[key].text_sha256, key)
    assert.deepEqual(walk(raw).filter(n => n.tag === 'a' && n.attributes.href).map(n => n.attributes.href), audit[key].anchors.filter(Boolean), key)
    const value = { page, mobile: mode === 'mobile', menuOpen: false, setMenuOpen() {}, activeMenu: null, setActiveMenu() {} }
    const html = renderToStaticMarkup(createElement(OriginalHomeContext, { value }, createElement(Markup, { node: page.shell, slots: Object.fromEntries(['header','content','footer'].map(slot => [slot,createElement(Markup,{ node:page[slot] })])) })))
    const result = inspect(html), target = expected(raw,page,mode === 'mobile')
    assert.equal(result.text,text(target), `${key}: rendered text changed`)
    assert.deepEqual(result.links,walk(target).filter(n => n.tag === 'a' && n.attributes.href).map(n => n.attributes.href), `${key}: link targets/order changed`)
    assert(!html.includes('<script') && !result.text.includes('Lorem ipsum'), key)
    assert(!result.text.includes('Flea Market'), key)
    for (const image of result.images) {
      assert(image.src, `${key}: unresolved lazy image`)
      if (image.src.startsWith('/')) await fs.access(path.join('public',image.src))
      imageCount++
    }
    for (const [id,images] of Object.entries({ ...page.galleries, ...page.proGalleries })) {
      const template = findSourceNode(page.content,n => n.attributes.id === id)
      assert(template, `${key}: gallery source element missing ${id}`)
      for (let index=0;index<images.length;index++) {
        await fs.access(path.join('public',images[index].src))
        const projected = projectGallery(template,images,index,Boolean(page.proGalleries?.[id]))
        const display = page.proGalleries?.[id] ? images[index].displaySrc ?? images[index].src : images[index].src
        assert(walk(projected).some(n => n.tag === 'img' && n.attributes.src === display),`${key}: inaccessible slide ${id}/${index}`)
        slideCount++
      }
    }
    rendered.set(`${mode}:${route.path}`,result)
    linkCount += result.links.length
    console.log(`PASS ${key}: exact source text + real tables; source-order links; local images; complete gallery access`)
  }
  for (const [key,result] of rendered) for (const href of result.links) {
    if (!href.startsWith('/#/')) continue
    const [pathnameAndQuery,anchor] = href.slice(2).split('#')
    const pathname = pathnameAndQuery.split('?')[0]
    assert(allPaths.has(pathname),`${key}: missing route ${href}`)
    if (anchor && pathname !== '/') {
      const mode = key.split(':')[0], target = rendered.get(`${mode}:${pathname}`)
      assert(target.ids.includes(decodeURIComponent(anchor)),`${key}: missing anchor ${href}`)
    }
  }
  for (const asset of assets) {
    const bytes = await fs.readFile(path.join('public',asset.file))
    assert(bytes.length>100,asset.file)
    if (asset.file.endsWith('.woff2')) assert.equal(bytes.toString('ascii',0,4),'wOF2')
    if (asset.file.endsWith('.png')) assert.equal(bytes.toString('hex',0,8),'89504e470d0a1a0a')
    if (/\.jpe?g$/i.test(asset.file)) assert.equal(bytes.toString('hex',0,2),'ffd8')
    if (asset.file.endsWith('.webp')) assert.equal(bytes.toString('ascii',8,12),'WEBP')
  }
  for (const [id,table] of Object.entries(tables)) {
    const csv = await fs.readFile(`public/original-site/${id}.csv`)
    assert.equal(crypto.createHash('sha256').update(csv).digest('hex'),table.csv_sha256)
  }
  const current = galleries['artistalley/desktop']
  assert.equal(Object.keys(current).length,57)
  assert.equal(Object.values(current).reduce((n,items) => n+items.length,0),62)
  assert.equal(Object.values(current).filter(items => items.length === 2).length,5)
  const registry = await fs.readFile('src/App.tsx','utf8')
  assert(registry.includes('sourceRoutes.map') && !registry.includes('path="flea-market"'))
  console.log(`PASS 18 routes / 36 source modes; ${linkCount} links; ${imageCount} image elements; ${slideCount} gallery entries; ${assets.length} resource signatures; 3 real CSV hashes; 57 artist tables / 62 entries`)
} finally { await server.close() }
