import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import crypto from 'node:crypto'

async function files(directory) {
  return (await Promise.all((await fs.readdir(directory, { withFileTypes: true })).map(entry => {
    const file = path.join(directory, entry.name)
    return entry.isDirectory() ? files(file) : [file]
  }))).flat()
}
const manifest = JSON.parse(await fs.readFile('docs/asset-sources.json', 'utf8'))
const expected = new Set()
for (const asset of manifest.assets) {
  assert(/^\/original-(?:home|site)\/[^/]+$/.test(asset.file), `invalid asset path ${asset.file}`)
  assert(!expected.has(asset.file), `duplicate manifest entry ${asset.file}`)
  expected.add(asset.file)
  const bytes = await fs.readFile(path.join('public', asset.file))
  assert.equal(bytes.length, asset.bytes, asset.file)
  assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), asset.sha256, asset.file)
  assert(asset.sources.length, `missing provenance ${asset.file}`)
}
let references = 0
for (const file of await files('src')) {
  if (!/\.(?:tsx?|json|css|svg)$/.test(file)) continue
  const text = await fs.readFile(file, 'utf8')
  for (const [reference] of text.matchAll(/(?<![\w./-])\/original-(?:home|site)\/[\w.-]+/g)) {
    await fs.access(path.join('public', reference))
    assert(expected.has(reference), `unrecorded source asset ${reference} in ${file}`)
    references++
  }
}
for (const directory of ['public/original-home', 'public/original-site']) {
  for (const file of await files(directory)) assert(expected.has('/' + path.relative('public', file).split(path.sep).join('/')), `unrecorded public asset ${file}`)
}
for (const file of await files('docs')) {
  if (!file.endsWith('.md')) continue
  const text = await fs.readFile(file, 'utf8')
  for (const [, href] of text.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
    if (/^(?:https?:|mailto:|#)/.test(href)) continue
    await fs.access(path.resolve(path.dirname(file), href.split('#')[0]))
  }
}
console.log(`PASS ${manifest.assets.length} asset hashes and provenance records; ${references} source references; local documentation links`)
