import { useOriginalHome } from './original-home/context'
import { Markup } from './original-home/Markup'

function Footer() {
  const original = useOriginalHome()
  if (original) return <Markup node={original.page.footer} />
  return (
    <footer className="footer">
      {/* TODO: add contact info and social links */}
      <p>&copy; ScottyCon. All rights reserved.</p>
    </footer>
  )
}

export default Footer
