import { Markup } from '../original-home/Markup'
import type { SourceElement } from '../original-home/source'
import { mapUrls } from './maps'
import type { SourceMap } from './maps'

export default function OfficialMap({ node, map }: { node: SourceElement; map: SourceMap }) {
  const urls = mapUrls(map)
  return <Markup node={node} bypassMap extraChildren={<>
    <iframe
      title={`Google Maps — ${map.title}`}
      src={urls.embed}
      loading="lazy"
      allowFullScreen
      referrerPolicy="strict-origin-when-cross-origin"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
    />
    <a href={urls.open} target="_blank" rel="noopener noreferrer"
      aria-label={`Open ${map.title} in Google Maps`}
      style={{ position: 'absolute', top: 8, left: 8, zIndex: 1, padding: '8px 10px',
        background: 'white', color: '#1a73e8', font: '13px Arial, sans-serif',
        borderRadius: 2, boxShadow: '0 1px 4px #0004', textDecoration: 'none' }}>
      Open in Google Maps
    </a>
  </>} />
}
