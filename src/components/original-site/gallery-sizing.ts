import type { SourceNode } from '../original-home/source'

export type GalleryBounds = { width: number; height: number }

/** Match Wix gallery-image-sizer's measured, centered aspect-fit frame.
 * The source grid centers its first child; inherit keeps ghost layers hidden.
 */
export function sizeGalleryImages(node: SourceNode, bounds: GalleryBounds): SourceNode {
  if (typeof node === 'string' || 'slot' in node) return node
  const children = node.children.map(child => sizeGalleryImages(child, bounds))
  if (node.tag !== 'gallery-image-sizer') return { ...node, children }
  const width = Number(node.attributes['data-image-width'])
  const height = Number(node.attributes['data-image-height'])
  if (!(width > 0 && height > 0 && bounds.width > 0 && bounds.height > 0)) return { ...node, children }
  const scale = Math.min(bounds.width / width, bounds.height / height)
  const first = children[0]
  if (first && typeof first !== 'string' && 'tag' in first) {
    children[0] = { ...first, attributes: { ...first.attributes,
      style: `${first.attributes.style ?? ''};width:${width * scale}px;height:${height * scale}px`,
    } }
  }
  return { ...node, children, attributes: { ...node.attributes,
    style: `${node.attributes.style ?? ''};visibility:inherit`,
  } }
}
