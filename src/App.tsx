import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Activities from './pages/Activities'
import Home from './pages/Home'
import Info from './pages/Info'
import Maps from './pages/Maps'
import Registration from './pages/Registration'
import Sponsors from './pages/Sponsors'
import Vendors from './pages/Vendors'
import './App.css'

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="activities" element={<Activities />} />
          <Route path="info" element={<Info />} />
          <Route path="maps" element={<Maps />} />
          <Route path="registration" element={<Registration />} />
          <Route path="sponsors" element={<Sponsors />} />
          <Route path="vendors" element={<Vendors />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}

export default App
