import { Markup } from '../components/original-home/Markup'
import { useOriginalHome } from '../components/original-home/context'

export default function OriginalPage() {
  const original = useOriginalHome()
  return original ? <Markup node={original.page.content} /> : null
}
