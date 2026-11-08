import { createContext, useContext } from 'react'
import type { SourceElement, SourcePage } from './source'

export type OriginalContext = {
  page: SourcePage
  mobile: boolean
  menuOpen: boolean
  setMenuOpen: (open: boolean) => void
  activeMenu: SourceElement | null
  setActiveMenu: (menu: SourceElement | null) => void
}
export const OriginalHomeContext = createContext<OriginalContext | null>(null)
export const useOriginalHome = () => useContext(OriginalHomeContext)
