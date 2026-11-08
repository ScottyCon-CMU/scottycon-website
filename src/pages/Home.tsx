import { useOriginalHome } from '../components/original-home/context'
import { Markup } from '../components/original-home/Markup'

function Home() {
  const original = useOriginalHome()
  return original ? <Markup node={original.page.content} /> : null
}

export default Home
