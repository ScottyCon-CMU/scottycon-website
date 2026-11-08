import type { GalleryImage, SourceElement, SourceNode } from '../original-home/source'

/** Retain the source template and change only the active slide's media/state. */
export function projectGallery(node: SourceNode, images: GalleryImage[], index: number, pro: boolean, localPictures = false, preservePositions = false): SourceNode {
  if ((index === 0 && !localPictures) || typeof node === 'string' || 'slot' in node) return node
  const current = images[index]
  const attrs = { ...node.attributes }
  if (pro && attrs['data-hook'] === 'nav-arrow-next' && index === images.length - 1) attrs.style = `${attrs.style ?? ''};display:none`
  if (pro && attrs.class?.split(' ').includes('thumbnailItem')) {
    const thumbnail = images.findIndex(image => attrs.style?.includes(image.source_uri))
    attrs.class = attrs.class.replace(/\bpro-gallery-highlight\b/g, '').trim() + (thumbnail === index ? ' pro-gallery-highlight' : '')
  }
  if (node.tag === 'img') {
    const offset = pro ? Number(attrs['data-idx'] ?? 0) : 0
    const image = images[((preservePositions ? 0 : index) + offset) % images.length]
    attrs.src = pro ? image.displaySrc ?? image.src : image.src
    attrs.alt = pro ? image.alt ?? image.title : image.title
  }
  if (attrs['data-testid'] === 'gallery-item-click-action-image-zoom') attrs['aria-label'] = current.title
  if (node.tag === 'gallery-image-sizer') {
    if (current.width) attrs['data-image-width'] = String(current.width)
    if (current.height) attrs['data-image-height'] = String(current.height)
  }
  let children = node.children.map(child => projectGallery(child, images, index, pro, localPictures, preservePositions))
  if (localPictures && node.tag === 'picture') {
    const imageNode = node.children.find(child => typeof child !== 'string' && 'tag' in child && child.tag === 'img') as SourceElement | undefined
    const offset = Number(imageNode?.attributes['data-idx'] ?? 0)
    const image = images[((preservePositions ? 0 : index) + offset) % images.length]
    children = children.map(child => {
      if (typeof child === 'string' || 'slot' in child || child.tag !== 'source') return child
      const attributes: SourceElement['attributes'] = { ...child.attributes, srcset: image.displaySrc ?? image.src }
      // The next official asset may have a different format. Let the browser
      // use its actual Content-Type instead of the initial slide's type hint.
      delete attributes.type
      return { ...child, attributes }
    })
  }
  if (pro && index > 0) children = children.flatMap(child => {
    if (typeof child === 'string' || 'slot' in child || child.attributes['data-hook'] !== 'nav-arrow-next') return [child]
    const previous = { ...child, attributes: { ...child.attributes,
      'data-hook': 'nav-arrow-prev', 'aria-label': 'Previous Item',
      style: `${(child.attributes.style ?? '').replace(/right:[^;]+/, 'left:23px').replace(/;display:none/g, '')};transform:scaleX(-1)`,
    } }
    return [previous, child]
  })
  if (attrs['data-testid'] === 'gallery-item-title') children = [current.title]
  if (attrs['data-testid'] === 'gallery-counter') children = [`${index + 1}/${images.length}`]
  return { ...node, attributes: attrs, children }
}

export function findSourceNode(node: SourceNode, predicate: (n: SourceElement) => boolean): SourceElement | undefined {
  if (typeof node === 'string' || 'slot' in node) return undefined
  if (predicate(node)) return node
  for (const child of node.children) {
    const match = findSourceNode(child, predicate)
    if (match) return match
  }
}
