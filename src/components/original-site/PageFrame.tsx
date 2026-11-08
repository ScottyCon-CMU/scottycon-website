import { lazy, Suspense } from 'react'
import type { ComponentType, ReactNode } from 'react'
import HomeFrame from '../original-home/HomeFrame'
import type { SourcePage, GalleryImage } from '../original-home/source'
import galleryData from '../../data/original-site/galleries.json'
import proGalleryData from '../../data/original-site/pro-galleries.json'
import runtimeCss from './runtime.css?raw'
import tableData from '../../data/original-site/tables.json'
import type { SourceTable } from './Table'

type Slots = { header: ReactNode; content: ReactNode; footer: ReactNode }
const jsonModules = import.meta.glob<{ default: SourcePage }>(['../../data/original-site/*-desktop.json', '../../data/original-site/*-mobile.json'])
const cssModules = import.meta.glob<string>('../../data/original-site/*-*.css', { query: '?raw', import: 'default' })
const loaded: Record<string, ComponentType<Slots>> = {}
const galleries = galleryData as Record<string, Record<string, GalleryImage[]>>
const proGalleries = proGalleryData as Record<string, Record<string, GalleryImage[]>>

for (const [jsonKey, importer] of Object.entries(jsonModules)) {
  const match = jsonKey.match(/\/([^/]+)-(desktop|mobile)\.json$/)
  if (!match) continue
  const [, route, mode] = match
  const key = `${route}-${mode}`
  const cssKey = `../../data/original-site/${key}.css`
  loaded[key] = lazy(async () => {
      const [data, css] = await Promise.all([importer(), cssModules[cssKey]()])
      const metadataKey = `${route}/${mode}`
      const tables = Object.fromEntries(Object.entries(tableData).filter(([, table]) => table.route === route)) as Record<string, SourceTable>
      const page = { ...data.default, galleries: galleries[metadataKey], proGalleries: proGalleries[metadataKey], tables }
      const bundle = { page, css: css + '\n' + runtimeCss }
      return { default: (props: Slots) => <HomeFrame {...props} bundle={bundle} /> }
    })
}

export default function PageFrame({ pathname, ...slots }: Slots & { pathname: string }) {
  const mobile = /iPhone|iPod|Android.*Mobile|Windows Phone/i.test(navigator.userAgent)
  const key = `${pathname.slice(1)}-${mobile ? 'mobile' : 'desktop'}`
  const Page = loaded[key]
  return <Suspense fallback={null}><Page key={key} {...slots} /></Suspense>
}
