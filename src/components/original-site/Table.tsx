import { Fragment, useState } from 'react'
import { useOriginalHome } from '../original-home/context'
import { Markup } from '../original-home/Markup'
import type { SourceElement, SourceNode } from '../original-home/source'

export type SourceTable = { route: string; source: string; rows: string[][]; parameters: { radius: number; alignment: string; innerBorderWidth: number; outerBorderWidth: number; columnsOnOff: boolean; columns: number }; csv_sha256: string }

function withoutIframe(node: SourceElement): SourceElement {
  return { ...node, children: node.children.filter(child => typeof child === 'string' || !('tag' in child) || child.tag !== 'iframe').map((child: SourceNode) => typeof child === 'string' || 'slot' in child ? child : withoutIframe(child)) }
}

export default function Table({ node, data }: { node: SourceElement; data: SourceTable }) {
  const original = useOriginalHome()
  // The live mobile widget starts with its first record open and allows
  // multiple records to stay open. Keep its data in ordinary React markup.
  const [expanded, setExpanded] = useState<Set<number>>(() => new Set([0]))
  const [head, ...rows] = data.rows
  const count = data.parameters.columnsOnOff ? data.parameters.columns : head.length
  const headers = head.slice(0, count)
  const content = original?.mobile
    ? <table className="source-table-mobile"><thead><tr><th scope="col">{headers[0]}</th></tr></thead><tbody>{rows.map((row, index) => {
      const open = expanded.has(index)
      const detailId = `${node.attributes.id}-record-${index}`
      return <Fragment key={index}>
        <tr><td><button type="button" aria-expanded={open} aria-controls={detailId} onClick={() => setExpanded(previous => {
          const next = new Set(previous)
          if (next.has(index)) next.delete(index)
          else next.add(index)
          return next
        })}>{row[0]}{'\u00a0'}<span className="source-table-toggle" aria-hidden="true" data-expanded={open} /></button></td></tr>
        <tr id={detailId} className="source-table-detail-row" hidden={!open}><td><table className="source-table-details"><tbody>{headers.slice(1).map((label, cell) => <tr key={cell}><th scope="row">{label}</th><td>{row[cell + 1]}{'\u00a0'}</td></tr>)}</tbody></table></td></tr>
      </Fragment>
    })}</tbody></table>
    : <table><thead><tr>{headers.map((value, index) => <th key={index} scope="col">{value}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={index}>{headers.map((_, cell) => <td key={cell}>{row[cell]}{'\u00a0'}</td>)}</tr>)}</tbody></table>
  // mqeQ0 is Wix's pre-initialisation visibility gate. There is no Wix iframe
  // ready message in this React implementation to remove it automatically.
  return <Markup node={withoutIframe(node)} bypassTable overrideProps={{ style: { height: 'auto', visibility: 'inherit' } }} extraChildren={
    <div className="source-table" role="region" aria-label="Table Master" style={{ borderRadius: data.parameters.radius, textAlign: data.parameters.alignment === 'center' ? 'center' : undefined }}>{content}</div>
  } />
}
