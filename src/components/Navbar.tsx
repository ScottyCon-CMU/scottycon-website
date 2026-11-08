import { NavLink } from 'react-router-dom'
import { useOriginalHome } from './original-home/context'
import { Markup } from './original-home/Markup'

const links = [
  { to: '/', label: 'Home' },
  { to: '/activities', label: 'Activities' },
  { to: '/info', label: 'Info' },
  { to: '/maps', label: 'Maps' },
  { to: '/registration', label: 'Registration' },
  { to: '/sponsors', label: 'Sponsors' },
  { to: '/vendors', label: 'Vendors' },
]

function NavBar() {
  const original = useOriginalHome()
  if (original) return <Markup node={original.page.header} />
  return (
    <header className="navbar">
      <nav>
        <ul>
          {links.map((link) => (
            <li key={link.to}>
              <NavLink to={link.to} end>
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  )
}

export default NavBar
