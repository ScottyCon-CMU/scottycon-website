import desktop from '../../data/original-home/desktop.json'
import mobile from '../../data/original-home/mobile.json'
import desktopCss from '../../data/original-home/desktop.css?raw'
import mobileCss from '../../data/original-home/mobile.css?raw'
import type { SourceTable } from '../original-site/Table'

export type SourceElement = { tag: string; attributes: Record<string, string | null>; children: SourceNode[] }
export type SourceNode = string | SourceElement | { slot: 'header' | 'content' | 'footer' }
export type SourcePage = {
  source: string; viewport: string; bodyClass: string; htmlStyle: string
  shell: SourceNode; header: SourceElement; content: SourceElement; footer: SourceElement
  title?: string
  galleries?: Record<string, GalleryImage[]>
  proGalleries?: Record<string, GalleryImage[]>
  tables?: Record<string, SourceTable>
}
export type GalleryImage = { src: string; displaySrc?: string; title: string; alt?: string; width?: number; height?: number; source_uri: string }
// Separate structures are intentional: Wix returns a distinct 320px mobile site,
// rather than deriving it from the desktop page with a guessed breakpoint.
export const pages = {
  desktop: { page: desktop as SourcePage, css: desktopCss },
  mobile: { page: mobile as SourcePage, css: mobileCss },
}
