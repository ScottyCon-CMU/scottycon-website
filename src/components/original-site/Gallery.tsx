import { useLayoutEffect, useRef, useState } from 'react'
import type { KeyboardEvent, MouseEvent } from 'react'
import { Markup } from '../original-home/Markup'
import type { GalleryImage, SourceElement } from '../original-home/source'
import { projectGallery } from './gallery-model'
import { useOriginalHome } from '../original-home/context'
import { sizeGalleryImages } from './gallery-sizing'
import type { GalleryBounds } from './gallery-sizing'

export default function Gallery({ node, images, pro = false }: { node: SourceElement; images: GalleryImage[]; pro?: boolean }) {
  const [index, setIndex] = useState(0)
  const [zoomIndex, setZoomIndex] = useState(0)
  const [bounds, setBounds] = useState<GalleryBounds>({ width: 0, height: 0 })
  const root = useRef<HTMLElement>(null)
  const original = useOriginalHome()
  const artistAlley = original?.page.source.endsWith('/artistalley') ?? false
  const needsSizing = !pro && artistAlley
  const runtimeMobileGallery = !!(pro && original?.mobile && ['comp-mku9d2oa2', 'comp-mku9kqza', 'comp-lt88wqgo'].includes(node.attributes.id ?? ''))
  useLayoutEffect(() => {
    if (!runtimeMobileGallery) return
    const scroller = root.current?.querySelector<HTMLElement>('.gallery-horizontal-scroll')
    const item = root.current?.querySelector<HTMLElement>(`[data-hook="item-container"][data-idx="${index}"]`)
    if (!scroller || !item) return
    // Wix centers the selected hydrated slide and clamps at either end.
    // Keep the original item positions, including the neighboring sliver.
    scroller.scrollLeft = index === 0 ? 0 : item.offsetLeft + item.offsetWidth / 2 - scroller.clientWidth / 2
  }, [index, runtimeMobileGallery])
  useLayoutEffect(() => {
    const element = root.current
    if (!needsSizing || !element) return
    const measure = () => {
      const width = element.clientWidth, height = element.clientHeight
      setBounds(previous => previous.width === width && previous.height === height ? previous : { width, height })
    }
    measure()
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measure)
      return () => window.removeEventListener('resize', measure)
    }
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [needsSizing])
  const dialog = useRef<HTMLDialogElement>(null)
  const pointer = useRef<number | null>(null)
  const releaseScroll = useRef<((restore: boolean) => void) | null>(null)
  useLayoutEffect(() => () => { releaseScroll.current?.(false) }, [])
  const nextIndex = (value: number, direction: number) => pro ? Math.max(0, Math.min(images.length - 1, value + direction)) : (value + direction + images.length) % images.length
  const advance = (direction: number) => setIndex(value => nextIndex(value, direction))
  const current = images[zoomIndex]
  const zoom = (target: Element) => {
    const offset = pro ? Number(target.closest('[data-idx]')?.getAttribute('data-idx') ?? 0) : 0
    setZoomIndex(((runtimeMobileGallery ? 0 : index) + offset) % images.length)
    if (pro && !releaseScroll.current) {
      const y = window.scrollY
      document.body.classList.add('siteScrollingBlocked')
      releaseScroll.current = restore => {
        document.body.classList.remove('siteScrollingBlocked')
        releaseScroll.current = null
        if (restore) window.scrollTo(0, y)
      }
    }
    dialog.current?.showModal()
  }
  function click(event: MouseEvent<HTMLElement>) {
    const target = event.target as Element
    const thumbnail = target.closest('.thumbnailItem')
    if (thumbnail && root.current) {
      const selected = [...root.current.querySelectorAll('.thumbnailItem')].indexOf(thumbnail)
      if (selected >= 0) setIndex(selected)
    }
    else if (target.closest('[data-hook="nav-arrow-next"], [data-source-next]')) { event.preventDefault(); advance(1) }
    else if (target.closest('[data-hook="nav-arrow-prev"], [data-source-prev]')) { event.preventDefault(); advance(-1) }
    else if (target.closest('[data-testid="gallery-item-click-action-image-zoom"], [data-hook="item-action"], [data-hook="item-container"]')) zoom(target)
  }
  function keyboard(event: KeyboardEvent<HTMLElement>) {
    if (event.key === 'ArrowRight') { event.preventDefault(); advance(1) }
    if (event.key === 'ArrowLeft') { event.preventDefault(); advance(-1) }
    if (event.key === 'Enter' || event.key === ' ') {
      if ((event.target as Element).closest('[data-source-next]')) { event.preventDefault(); advance(1); return }
      if ((event.target as Element).closest('[data-source-prev]')) { event.preventDefault(); advance(-1); return }
    }
    if ((event.key === 'Enter' || event.key === ' ') && (event.target as Element).closest('[data-testid="gallery-item-click-action-image-zoom"], [data-hook="item-action"]')) {
      event.preventDefault(); zoom(event.target as Element)
    }
  }
  const projected = projectGallery(node, images, index, pro, pro, runtimeMobileGallery)
  return <>
    <Markup node={needsSizing ? sizeGalleryImages(projected, bounds) : projected} bypassGallery overrideProps={{
      ref: root,
      onClick: click, onKeyDown: keyboard,
      onPointerDown: (event: React.PointerEvent) => { pointer.current = event.clientX },
      onPointerUp: (event: React.PointerEvent) => { if (pointer.current !== null && Math.abs(event.clientX - pointer.current) > 40) advance(event.clientX < pointer.current ? 1 : -1); pointer.current = null },
    }} extraChildren={!pro && images.length > 1 ? <div className="yr08EU">
      <div role="button" tabIndex={0} className="Y0ItqY e1g7fc" data-source-prev aria-label="Previous image" />
      <div role="button" tabIndex={0} className="Y0ItqY vIDrnX" data-source-next aria-label="Next image" />
    </div> : null} />
    <dialog ref={dialog} onClose={() => releaseScroll.current?.(true)} className={`source-image-dialog${pro ? ' source-pro-image-dialog' : ''}${original?.mobile ? ' source-phone-image-dialog' : ''}`} onClick={event => { if (!pro || event.target === event.currentTarget) dialog.current?.close() }} onKeyDown={event => {
      if (event.key === 'ArrowRight') setZoomIndex(value => nextIndex(value, 1))
      if (event.key === 'ArrowLeft') setZoomIndex(value => nextIndex(value, -1))
    }} aria-label={current.title || current.alt || 'Image'}>
      <div className={pro ? 'source-pro-canvas' : undefined}><img src={`${import.meta.env.BASE_URL}${current.src.slice(1)}`} alt={current.alt ?? current.title} loading="lazy" onPointerDown={event => { pointer.current = event.clientX }} onPointerUp={event => { if (pro && pointer.current !== null && Math.abs(event.clientX - pointer.current) > 40) setZoomIndex(value => nextIndex(value, event.clientX < pointer.current! ? 1 : -1)); pointer.current = null }} /></div>
      {pro && <>
        <button type="button" className="source-pro-shrink" aria-label="Exit fullscreen" onClick={() => dialog.current?.close()} />
        <button type="button" className="source-pro-close" aria-label="Exit fullscreen" onClick={() => dialog.current?.close()} />
        {[-1, 1].map(direction => (direction < 0 ? zoomIndex > 0 : zoomIndex < images.length - 1) && <button type="button" key={direction} className={`source-pro-arrow ${direction < 0 ? 'source-pro-prev' : 'source-pro-next'}`} aria-label={direction < 0 ? 'Previous item' : 'Next item'} onClick={() => setZoomIndex(value => nextIndex(value, direction))}><svg fill="currentColor" width="15" height="27" viewBox="0 0 15 27"><path d="M.198 25.926l1.06 1.06 13.259-13.258L1.258.47.198 1.53l12.197 12.198z" /></svg></button>)}
      </>}
    </dialog>
  </>
}
