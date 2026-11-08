import { useLayoutEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { OriginalHomeContext } from './context'
import { Markup } from './Markup'
import { pages } from './source'
import type { SourceElement, SourcePage } from './source'
import runtimeCss from './runtime.css?raw'

export default function HomeFrame({ header, content, footer, bundle }: { header: ReactNode; content: ReactNode; footer: ReactNode; bundle?: { page: SourcePage; css: string } }) {
  const [mobile] = useState(() => typeof navigator !== 'undefined' && /iPhone|iPod|Android.*Mobile|Windows Phone/i.test(navigator.userAgent))
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeMenu, setActiveMenu] = useState<SourceElement | null>(null)
  const { page, css } = bundle ?? pages[mobile ? 'mobile' : 'desktop']
  const { hash } = useLocation()
  useLayoutEffect(() => {
    const viewport = document.querySelector('meta[name="viewport"]')
    const oldViewport = viewport?.getAttribute('content')
    const oldBodyClass = document.body.className
    const oldTitle = document.title
    const oldHtmlStyle = document.documentElement.getAttribute('style')
    document.body.className = page.bodyClass
    document.documentElement.setAttribute('style', page.htmlStyle)
    viewport?.setAttribute('content', page.viewport)
    document.title = page.title ?? 'Home | CMU ScottyCon'
    return () => {
      document.body.className = oldBodyClass
      document.title = oldTitle
      if (oldHtmlStyle === null) document.documentElement.removeAttribute('style')
      else document.documentElement.setAttribute('style', oldHtmlStyle)
      if (oldViewport) viewport?.setAttribute('content', oldViewport)
    }
  }, [page])
  useLayoutEffect(() => {
    const frame = requestAnimationFrame(() => {
      if (!hash) { window.scrollTo(0, 0); return }
      let id: string
      try { id = decodeURIComponent(hash.slice(1)) } catch { return }
      document.getElementById(id)?.scrollIntoView()
    })
    return () => cancelAnimationFrame(frame)
  }, [page, bundle, hash])
  useLayoutEffect(() => {
    if (!menuOpen) return
    document.body.classList.add('blockSiteScrolling')
    document.getElementById('MENU_AS_CONTAINER')?.querySelector<HTMLElement>('a[href]')?.focus()
    return () => { document.body.classList.remove('blockSiteScrolling') }
  }, [menuOpen])
  useLayoutEffect(() => {
    if (!bundle || !mobile) return
    const button = document.getElementById('BACK_TO_TOP_BUTTON')
    const update = () => button?.classList.toggle('z7UpAt', window.scrollY > window.innerHeight)
    update()
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [bundle, mobile])
  useLayoutEffect(() => {
    if (!bundle) return
    const root = document.querySelector('.original-subpage')
    const animated = [...(root?.querySelectorAll<HTMLElement>('[id]') ?? [])].filter(element => {
      const style = getComputedStyle(element)
      return style.animationName !== 'none' && style.animationPlayState.includes('paused')
    })
    if (typeof IntersectionObserver === 'undefined') {
      animated.forEach(element => { element.style.animationPlayState = 'running' })
      return
    }
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { (entry.target as HTMLElement).style.animationPlayState = 'running'; observer.unobserve(entry.target) }
    }))
    animated.forEach(element => observer.observe(element))
    return () => observer.disconnect()
  }, [page, bundle])
  return <OriginalHomeContext value={{ page, mobile, menuOpen, setMenuOpen, activeMenu, setActiveMenu }}>
    <div className={bundle ? 'original-home original-subpage' : 'original-home'}>
      <style>{css + '\n' + runtimeCss}</style>
      <Markup node={page.shell} slots={{ header, content, footer }} />
    </div>
  </OriginalHomeContext>
}
