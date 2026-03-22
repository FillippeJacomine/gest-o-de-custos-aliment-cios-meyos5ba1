import { Outlet } from 'react-router-dom'
import { Sidebar, BottomNav } from './Navigation'
import { Header } from './Header'

export default function Layout() {
  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col md:ml-64 pb-20 md:pb-0">
        <Header />
        <main className="flex-1 p-4 md:p-8 animate-fade-in">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
      <BottomNav />
    </div>
  )
}
