import { createElement, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { useOriginalHome } from './context'
import type { SourceElement, SourceNode } from './source'
import { isFleaMarketItem, localHref } from '../original-site/links'
import Gallery from '../original-site/Gallery'
import Table from '../original-site/Table'
import OfficialMap from '../original-site/OfficialMap'
import { sourceMaps } from '../original-site/maps'
import { sourceTiles } from '../original-site/backgrounds'

const attributeNames: Record<string, string> = {
  class: 'className', for: 'htmlFor', tabindex: 'tabIndex', viewbox: 'viewBox',
  preserveaspectratio: 'preserveAspectRatio', gradientunits: 'gradientUnits',
  gradienttransform: 'gradientTransform', textlength: 'textLength',
  maxlength: 'maxLength', minlength: 'minLength', readonly: 'readOnly',
  autofocus: 'autoFocus', autocomplete: 'autoComplete', srcset: 'srcSet',
  usemap: 'useMap', frameborder: 'frameBorder', allowfullscreen: 'allowFullScreen',
  crossorigin: 'crossOrigin', fetchpriority: 'fetchPriority', referrerpolicy: 'referrerPolicy',
  'xlink:href': 'xlinkHref', 'xmlns:xlink': 'xmlnsXlink', 'xml:space': 'xmlSpace',
}
const booleanAttributes = new Set(['hidden', 'disabled', 'required', 'multiple', 'checked', 'selected', 'inert', 'readonly', 'autofocus', 'allowfullscreen'])
const camelCase = (name: string) => name.replace(/^-ms-/, 'ms-').replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase())

function parseStyle(text: string): CSSProperties {
  const result: Record<string, string> = {}
  let quote = '', depth = 0, start = 0
  function declaration(end: number) {
    const part = text.slice(start, end), colon = part.indexOf(':')
    if (colon < 0) return
    const key = part.slice(0, colon).trim()
    result[key.startsWith('--') ? key : camelCase(key)] = part.slice(colon + 1).trim()
  }
  for (let i = 0; i <= text.length; i++) {
    const char = text[i]
    if (quote) { if (char === quote && text[i - 1] !== '\\') quote = '' }
    else if (char === '"' || char === "'") quote = char
    else if (char === '(') depth++
    else if (char === ')') depth--
    else if ((!depth && char === ';') || i === text.length) { declaration(i); start = i + 1 }
  }
  return result
}

function properties(node: SourceElement): Record<string, unknown> {
  const props: Record<string, unknown> = {}
  const custom = node.tag.includes('-')
  for (const [name, value] of Object.entries(node.attributes)) {
    if (/^on/i.test(name)) continue
    // Wix emits an empty runtime stylesheet placeholder inside the feed.
    // It is not a visitor link and must not request the current HTML as CSS.
    if (node.tag === 'link' && name === 'href' && value === '') continue
    if (name === 'style') { props.style = parseStyle(value ?? ''); continue }
    let key = custom ? name : (attributeNames[name] ?? (name.startsWith('data-') || name.startsWith('aria-') ? name : camelCase(name)))
    if (name === 'value' && ['input', 'textarea'].includes(node.tag)) key = 'defaultValue'
    if (name === 'checked') key = 'defaultChecked'
    props[key] = booleanAttributes.has(name) ? true : value ?? ''
    if (name === 'src' && (value?.startsWith('/original-home/') || value?.startsWith('/original-site/'))) props[key] = `${import.meta.env.BASE_URL}${value.slice(1)}`
  }
  return props
}

function tabbable(node: SourceNode): SourceNode {
  if (typeof node === 'string' || 'slot' in node) return node
  return { ...node, attributes: node.tag === 'a' ? { ...node.attributes, tabindex: '0' } : node.attributes, children: node.children.map(tabbable) }
}

export function Markup({ node, slots, bypassGallery = false, bypassTable = false, bypassMap = false, overrideProps, extraChildren }: { node: SourceNode; slots?: Partial<Record<'header' | 'content' | 'footer', ReactNode>>; bypassGallery?: boolean; bypassTable?: boolean; bypassMap?: boolean; overrideProps?: Record<string, unknown>; extraChildren?: ReactNode }): ReactNode {
  const context = useOriginalHome()
  if (typeof node === 'string') return node
  if ('slot' in node) return slots?.[node.slot] ?? null
  // Remove the complete campaign section, not just its image. The original
  // snapshot remains intact as source evidence; dedicated menu items are
  // independently removed below under the latest navigation instruction.
  if (node.attributes.id === 'comp-lfczpz75') return null
  if (isFleaMarketItem(node)) return null
  if (!bypassMap && context?.page.source.endsWith('/maps')) {
    const map = sourceMaps[node.attributes.id as keyof typeof sourceMaps]
    if (map) return <OfficialMap node={node} map={map} />
  }
  if (!bypassTable && node.attributes.id && context?.page.tables?.[node.attributes.id]) return <Table node={node} data={context.page.tables[node.attributes.id]} />
  if (!bypassGallery && node.attributes.id) {
    const images = context?.page.galleries?.[node.attributes.id]
    const proImages = context?.page.proGalleries?.[node.attributes.id]
    if (images?.length) return <Gallery node={node} images={images} />
    if (proImages?.length) return <Gallery node={node} images={proImages} pro />
  }
  if (node.tag === 'li' && (node.attributes.id?.startsWith('comp-iqimi3rl') || node.attributes.class?.includes('wixui-vertical-menu__item')) && node.children.some(child => typeof child !== 'string' && 'tag' in child && child.tag === 'ul')) {
    return <MenuItem node={node} />
  }
  const props = properties(node)
  if (context?.page.tables && node.tag === 'wix-bg-image' && node.attributes['data-tiled-image-info']) {
    const info = JSON.parse(node.attributes['data-tiled-image-info']) as { imageData: { uri: string } }
    const tile = sourceTiles[info.imageData.uri]
    if (tile) props.style = { ...props.style as CSSProperties, backgroundImage: `url("${import.meta.env.BASE_URL}original-site/${tile}")`, backgroundSize: 'auto' }
  }
  if (typeof props.href === 'string') props.href = localHref(props.href, context?.page.source)
  const id = node.attributes.id
  let children: ReactNode[] = node.children.map((child, index) => <Markup key={index} node={child} slots={slots} />)
  // Wix marks mobile page backgrounds as viewport-height media. The captured
  // img's inline height:100% otherwise stretches it over the whole document.
  if (context?.mobile && context.page.tables && id?.startsWith('img_pageBackground_')) {
    children = node.children.map((child, index) => typeof child !== 'string' && 'tag' in child && child.tag === 'img'
      ? <Markup key={index} node={child} overrideProps={{ style: { ...parseStyle(child.attributes.style ?? ''), height: 'calc(100vh + 80px)', position: 'absolute', top: 0 } }} />
      : <Markup key={index} node={child} />)
  }

  if (id === 'comp-iqimi3rl') {
    props['data-num-items'] = '5'
    props.style = { ...props.style as CSSProperties, overflow: 'visible' }
    // The trigger row, transparent bridge and floating submenu are descendants
    // of this one boundary. Moving between them must never close the menu.
    const closeOutside = (event: React.MouseEvent<HTMLElement> | React.FocusEvent<HTMLElement>) => {
      if (!(event.relatedTarget instanceof Node) || !event.currentTarget.contains(event.relatedTarget)) context?.setActiveMenu(null)
    }
    props.onMouseLeave = closeOutside
    props.onBlur = closeOutside
    props.onKeyDown = (event: React.KeyboardEvent) => {
      if (event.key !== 'Escape') return
      const trigger = context?.activeMenu?.attributes.id
      if (trigger) document.getElementById(trigger)?.querySelector<HTMLElement>('[role="button"], button')?.focus()
      context?.setActiveMenu(null)
    }
  }
  if (node.tag === 'li' && /^comp-iqimi3rl\d+$/.test(id ?? '')) {
    // Dropdown triggers are handled by MenuItem above. Home/Sponsors must
    // clear an earlier dropdown when reached with either mouse or keyboard.
    props.onMouseEnter = () => context?.setActiveMenu(null)
    props.onFocus = () => context?.setActiveMenu(null)
  }
  if (id === 'comp-iqimi3rl__more__') props.style = { ...props.style as CSSProperties, display: 'none' }
  if (id === 'comp-iqimi3rldropWrapper') {
    const active = context?.activeMenu
    const menu = active?.children.find(child => typeof child !== 'string' && 'tag' in child && child.tag === 'ul') as SourceElement | undefined
    const element = active && typeof document !== 'undefined' ? document.getElementById(active.attributes.id ?? '') : null
    props['data-dropdown-shown'] = active ? 'true' : 'false'
    // Source CSS uses margin-top:7px. Padding keeps the visible list at the
    // exact same position while making that gap part of the hover boundary.
    props.style = { visibility: active ? 'visible' : 'hidden', left: (element?.offsetLeft ?? 0) + (element?.offsetWidth ?? 0) / 2, transform: 'translateX(-50%)', top: '100%', minWidth: element?.offsetWidth ?? 0, marginTop: 0, paddingTop: 7 }
    if (menu) children = [<ul key="submenu" className="RZaALk wixui-dropdown-menu__submenu">{menu.children.map((child, index) => <Markup key={index} node={tabbable(child)} />)}</ul>]
  }
  if (id === 'MENU_AS_CONTAINER_TOGGLE') {
    const toggle = () => context?.setMenuOpen(!context.menuOpen)
    props.onClick = toggle
    props.onKeyDown = (event: React.KeyboardEvent) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); toggle() } }
    props['aria-expanded'] = context?.menuOpen ?? false
    props['aria-controls'] = 'MENU_AS_CONTAINER'
    props['aria-label'] = context?.menuOpen ? 'Close navigation menu' : 'Open navigation menu'
    if (context?.menuOpen) {
      props.className = `${props.className} d0L2ow`
      const openedIcon = (child: SourceNode): SourceNode => {
        if (typeof child === 'string' || 'slot' in child) return child
        let className = child.attributes.class ?? ''
        if (className.split(' ').includes('vlJDcR')) className += ' d0L2ow'
        if (className.split(' ').includes('pp3XSB')) className += ' sqDofR'
        return { ...child, attributes: { ...child.attributes, class: className }, children: child.children.map(openedIcon) }
      }
      children = node.children.map((child, index) => <Markup key={index} node={openedIcon(child)} />)
    }
  }
  if (id === 'BACK_TO_TOP_BUTTON' && context?.page.tables) {
    const backToTop = () => window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
    props.role = 'button'
    props.tabIndex = 0
    props['aria-label'] = 'Back to top'
    props.onClick = backToTop
    props.onKeyDown = (event: React.KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); backToTop() }
    }
  }
  if (id === 'MENU_AS_CONTAINER') {
    props.onClick = (event: React.MouseEvent<HTMLElement>) => { if ((event.target as Element).closest('a[href]')) context?.setMenuOpen(false) }
    if (context?.menuOpen) {
      delete props['data-undisplayed']
      props.className = `${props.className} I_VSKP`
      props.style = { ...props.style as CSSProperties, visibility: 'visible', display: 'block' }
    } else props.style = { ...props.style as CSSProperties, display: 'none' }
    props.onKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
      if (event.key === 'Escape') { context?.setMenuOpen(false); document.getElementById('MENU_AS_CONTAINER_TOGGLE')?.focus() }
      if (event.key === 'Tab') {
        const items = [...event.currentTarget.querySelectorAll<HTMLElement>('a[href], button, [tabindex="0"]')].filter(item => item.getClientRects().length)
        const first = items[0], last = items.at(-1)
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
      }
    }
  }
  if (id === 'overlay-MENU_AS_CONTAINER') {
    props.onClick = () => context?.setMenuOpen(false)
    if (context?.menuOpen) props.style = { ...props.style as CSSProperties, opacity: 1, visibility: 'inherit' }
  } else if (/close.*menu|menu.*close/i.test(node.attributes['aria-label'] ?? '')) props.onClick = () => context?.setMenuOpen(false)
  if (node.tag === 'form') {
    // The captured Wix form has no portable action. Never send an email address
    // to a guessed API or display a fabricated success state.
    props.onSubmit = (event: React.SubmitEvent) => event.preventDefault()
  }
  return createElement(node.tag, { ...props, ...overrideProps }, ...children, ...(extraChildren ? [extraChildren] : []))
}

function MenuItem({ node }: { node: SourceElement }) {
  const context = useOriginalHome()
  const [expanded, setExpanded] = useState(() => node.attributes.class?.split(' ').includes('rErQ82') ?? false)
  const props = properties(node)
  const desktop = node.attributes.id?.startsWith('comp-iqimi3rl')
  if (desktop) {
    if (context?.activeMenu === node) props['data-state'] = `${node.attributes['data-state']} over`
    props.onMouseEnter = () => context?.setActiveMenu(node)
    props.onFocus = () => context?.setActiveMenu(node)
    props.onKeyDown = (event: React.KeyboardEvent) => { if (event.key === 'Escape') context?.setActiveMenu(null) }
  } else {
    props.className = String(props.className ?? '').replace(/\brErQ82\b/g, '').trim()
    if (expanded) props.className = `${props.className} rErQ82`
    props.onClick = (event: React.MouseEvent<HTMLElement>) => {
      if ((event.target as Element).closest('button[data-testid="expandablemenu-toggle"]')) setExpanded(!expanded)
    }
  }
  function toggleState(child: SourceNode): SourceNode {
    if (typeof child === 'string' || 'slot' in child) return child
    return { ...child, attributes: child.tag === 'button' ? { ...child.attributes, 'aria-expanded': String(expanded) } : child.attributes, children: child.children.map(toggleState) }
  }
  const children = node.children.map((child, index) => {
    if (typeof child !== 'string' && 'tag' in child) {
      if (child.tag === 'ul') {
        const attrs = { ...child.attributes, style: desktop || !expanded ? 'display:none' : '', 'aria-hidden': String(desktop || !expanded) }
        return <Markup key={index} node={{ ...child, attributes: attrs }} />
      }
      if (child.tag === 'button') return createElement('button', { ...properties(child), key: index, 'aria-expanded': expanded, onClick: () => desktop ? context?.setActiveMenu(context.activeMenu === node ? null : node) : setExpanded(!expanded) }, ...child.children.map((n, i) => <Markup key={i} node={n} />))
      if (child.attributes.role === 'button' && desktop) return createElement(child.tag, { ...properties(child), key: index, 'aria-expanded': context?.activeMenu === node, onClick: () => context?.setActiveMenu(context.activeMenu === node ? null : node), onKeyDown: (event: React.KeyboardEvent) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); context?.setActiveMenu(node) } } }, ...child.children.map((n, i) => <Markup key={i} node={n} />))
    }
    return <Markup key={index} node={desktop ? child : toggleState(child)} />
  })
  return createElement(node.tag, props, ...children)
}
