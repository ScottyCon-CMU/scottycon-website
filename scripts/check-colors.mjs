// Declaration checks only; these are not browser computed-style assertions.
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'

const read = file => fs.readFile(file, 'utf8')
const routes = JSON.parse(await read('src/data/original-site/routes.json'))
let modes = 0, references = 0
for (const slug of ['home', ...routes.map(r => r.path.slice(1))]) {
  for (const mode of ['desktop', 'mobile']) {
    const file = slug === 'home' ? `src/data/original-home/${mode}.css` : `src/data/original-site/${slug}-${mode}.css`
    const css = await read(file)
    const theme = new Map([...css.matchAll(/(--color_\d+)\s*:\s*([^;}]+)/g)].map(m => [m[1], m[2].trim()]))
    assert.equal(theme.size, 66, `${file}: theme color count`)
    for (const [name, value] of theme) assert(/^\d+\s*,\s*\d+\s*,\s*\d+$/.test(value), `${file}: ${name} must be an RGB tuple`)
    for (const [, name] of css.matchAll(/var\(\s*(--color_\d+)/g)) {
      assert(theme.has(name), `${file}: missing ${name}`)
      references++
    }
    modes++
  }
}
const starter = await read('src/index.css')
assert(starter.includes(':root:not(:has(.original-home))'), 'starter palette must remain isolated')
const runtime = await read('src/components/original-home/runtime.css')
assert(!/\.original-home\s+(?:h[1-6]|a)\b[^{}]*\{\s*color\s*:\s*inherit/.test(runtime), 'source text colors must not be globally replaced')
assert(!/color\s*:\s*black/.test(runtime), 'no black compatibility fallback')
const markup = await read('src/components/original-home/Markup.tsx')
assert(markup.includes('marginTop: 0, paddingTop: 7') && markup.includes('event.currentTarget.contains(event.relatedTarget)'), 'retain whole-menu pointer boundary')
const table = await read('src/components/original-site/runtime.css')
for (const color of ['#f39aca', '#332f2f', '#e6dddd', '#675f5f']) assert(table.includes(color), `missing original Table Master color ${color}`)
console.log(`PASS ${modes} source modes; ${references} theme references; RGB tuple format, theme isolation, schedule palette, and menu boundary. Browser rendering requires separate review.`)
