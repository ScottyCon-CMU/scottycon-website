import { Outlet, useLocation } from 'react-router-dom'
import NavBar from './Navbar'
import Footer from './Footer'
import HomeFrame from './original-home/HomeFrame'
import PageFrame from './original-site/PageFrame'
import { sourcePaths } from './original-site/links'

function Layout() {
  const { pathname } = useLocation()
  const path = pathname.toLowerCase().replace(/\/+$/, '') || '/'
  if (path === '/') return <HomeFrame header={<NavBar />} content={<Outlet />} footer={<Footer />} />
  if (!sourcePaths.has(path)) return <Outlet />
  return <PageFrame pathname={path} header={<NavBar />} content={<Outlet />} footer={<Footer />} />
}

export default Layout
