import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import OriginalPage from './pages/OriginalPage'
import sourceRoutes from './data/original-site/routes.json'
import './App.css'

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          {sourceRoutes.map(route => <Route key={route.path} path={route.path.slice(1)} element={<OriginalPage />} />)}
          <Route path="home" element={<Navigate to="/" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}

export default App
