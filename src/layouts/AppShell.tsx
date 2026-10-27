import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import SearchPalette from '../components/SearchPalette'
import ConnectModal from '../components/ConnectModal'

export default function AppShell() {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-shell__main">
        <Outlet />
      </div>
      <SearchPalette />
      <ConnectModal />
    </div>
  )
}
