import { useAppStore } from '@/stores/useAppStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatPercent } from '@/lib/format'
import { TrendingUp, AlertCircle, FileText, ArrowRight, Award, Box } from 'lucide-react'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Link } from 'react-router-dom'

export default function Index() {
  const { recipes, sales, getRecipeCost } = useAppStore()

  const salesStats = recipes.map((r) => {
    const rSales = sales.filter((s) => s.recipeId === r.id)
    const totalVolume = rSales.reduce((sum, s) => sum + s.quantity, 0)
    const totalRevenue = rSales.reduce((sum, s) => sum + s.revenue, 0)
    const cost = (getRecipeCost(r) * totalVolume) / r.yield
    const profit = totalRevenue - cost
    const margin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0
    return { ...r, totalVolume, totalRevenue, profit, margin }
  })

  const topVolume = [...salesStats].sort((a, b) => b.totalVolume - a.totalVolume).slice(0, 5)
  const topProfit = [...salesStats].sort((a, b) => b.profit - a.profit).slice(0, 5)

  const chartData = recipes.map((r) => ({
    name: r.name,
    cost: getRecipeCost(r),
    price: getRecipeCost(r) * 2.5,
  }))

  const pieData = [
    { name: 'Loja Física', value: 45 },
    { name: 'iFood Entrega', value: 35 },
    { name: 'iFood Básico', value: 20 },
  ]
  const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--chart-3))']

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="animate-fade-in-up">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Margem Média</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">{formatPercent(28.5)}</div>
            <p className="text-xs text-emerald-600 mt-1">+2.1% desde o último mês</p>
          </CardContent>
        </Card>

        <Card className="animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Alertas de Custo</CardTitle>
            <AlertCircle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">2</div>
            <p className="text-xs text-amber-600 mt-1">Insumos subiram &gt; 10%</p>
          </CardContent>
        </Card>

        <Card className="animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Fichas Técnicas</CardTitle>
            <FileText className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">{recipes.length}</div>
            <p className="text-xs text-slate-500 mt-1">Receitas ativas</p>
          </CardContent>
        </Card>

        <Card
          className="bg-primary text-white animate-fade-in-up hover:shadow-md transition-shadow cursor-pointer"
          style={{ animationDelay: '300ms' }}
        >
          <Link to="/reports" className="block h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-white/80">Desempenho</CardTitle>
              <ArrowRight className="h-4 w-4 text-white" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-semibold mt-2">Ver Relatórios</div>
              <p className="text-xs text-white/80 mt-1">Matriz BCG e Custos</p>
            </CardContent>
          </Link>
        </Card>
      </div>

      <div
        className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in-up"
        style={{ animationDelay: '400ms' }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Box className="h-5 w-5 text-indigo-500" /> Top Volume de Vendas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topVolume.map((item, idx) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between border-b last:border-0 pb-3 last:pb-0"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-slate-300 w-4">{idx + 1}</span>
                    <div>
                      <p className="font-medium text-slate-800">{item.name}</p>
                      <p className="text-xs text-slate-500">{item.totalVolume} unid. vendidas</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-800">
                      {formatCurrency(item.totalRevenue)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Award className="h-5 w-5 text-emerald-500" /> Top Lucratividade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topProfit.map((item, idx) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between border-b last:border-0 pb-3 last:pb-0"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-slate-300 w-4">{idx + 1}</span>
                    <div>
                      <p className="font-medium text-slate-800">{item.name}</p>
                      <p className="text-xs text-emerald-600">
                        Margem: {formatPercent(item.margin)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-emerald-600">+{formatCurrency(item.profit)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div
        className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in-up"
        style={{ animationDelay: '500ms' }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Custo vs Preço (Base)</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ChartContainer
              config={{
                cost: { label: 'Custo', color: 'hsl(var(--destructive))' },
                price: { label: 'Preço Venda', color: 'hsl(var(--primary))' },
              }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis
                    fontSize={12}
                    tickFormatter={(v) => `R$${v}`}
                    tickLine={false}
                    axisLine={false}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="cost" fill="var(--color-cost)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="price" fill="var(--color-price)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Canais de Venda</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
            <ChartContainer config={{}} className="h-full w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
