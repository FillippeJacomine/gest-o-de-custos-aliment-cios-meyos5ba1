import { Search, Bell, User } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useLocation } from 'react-router-dom'

const routeNames: Record<string, string> = {
  '/': 'Dashboard Resumo',
  '/ingredients': 'Gestão de Insumos',
  '/recipes': 'Fichas Técnicas',
  '/pricing': 'Precificação Omnichannel',
}

export function Header() {
  const location = useLocation()
  const title = routeNames[location.pathname] || 'Aplicação'

  return (
    <header className="bg-white border-b sticky top-0 z-40 px-4 md:px-8 py-4 flex items-center justify-between">
      <h2 className="text-xl font-bold text-slate-800 hidden md:block">{title}</h2>

      {/* Mobile Title */}
      <div className="md:hidden flex items-center gap-2">
        <h2 className="text-lg font-bold text-slate-800">{title}</h2>
      </div>

      <div className="flex items-center gap-4 flex-1 justify-end md:flex-none">
        <div className="relative hidden md:block w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar insumo ou receita..."
            className="pl-9 bg-slate-50 border-slate-200"
          />
        </div>
        <button className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors rounded-full hover:bg-slate-100">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
        <button className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-medium border border-indigo-200">
          <User className="h-4 w-4" />
        </button>
      </div>
    </header>
  )
}
