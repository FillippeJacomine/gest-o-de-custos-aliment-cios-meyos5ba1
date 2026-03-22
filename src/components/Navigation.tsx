import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  ShoppingBasket,
  ChefHat,
  Calculator,
  Settings,
  BarChart3,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/ingredients', label: 'Insumos', icon: ShoppingBasket },
  { path: '/recipes', label: 'Receitas', icon: ChefHat },
  { path: '/pricing', label: 'Precificação', icon: Calculator },
  { path: '/reports', label: 'Relatórios', icon: BarChart3 },
]

export function Sidebar() {
  const location = useLocation()

  return (
    <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-slate-300 min-h-screen fixed left-0 top-0">
      <div className="p-6">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <ChefHat className="text-primary" />
          PreçoCerto
        </h1>
      </div>
      <nav className="flex-1 px-4 space-y-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path
          const Icon = item.icon
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors hover:text-white hover:bg-slate-800',
                isActive && 'bg-primary text-white hover:bg-primary/90',
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>
      <div className="p-4 border-t border-slate-800">
        <button className="flex items-center gap-3 px-4 py-3 w-full rounded-lg hover:bg-slate-800 transition-colors">
          <Settings className="h-5 w-5" />
          <span className="font-medium">Configurações</span>
        </button>
      </div>
    </aside>
  )
}

export function BottomNav() {
  const location = useLocation()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around p-2 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path
        const Icon = item.icon
        return (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              'flex flex-col items-center p-2 rounded-xl text-slate-500 transition-colors',
              isActive && 'text-primary',
            )}
          >
            <div className={cn('p-1.5 rounded-full transition-colors', isActive && 'bg-teal-50')}>
              <Icon className="h-6 w-6" />
            </div>
            <span className="text-[10px] font-medium mt-1">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
