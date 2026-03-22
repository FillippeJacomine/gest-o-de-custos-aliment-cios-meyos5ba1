import { useAppStore } from '@/stores/useAppStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatPercent } from '@/lib/format'
import { TrendingUp, AlertCircle, FileText, ArrowRight } from 'lucide-react'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Link } from 'react-router-dom'

export default function Index() {
  const { recipes, getRecipeCost } = useAppStore()

  // Mock calculations for dashboard
  const avgMargin = 28.5
  const costAlerts = 2

  const chartData = recipes.map((r) => ({
    name: r.name,
    cost: getRecipeCost(r),
    price: getRecipeCost(r) * 2.5, // Mock price
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
        <Card className="animate-fade-in-up" style={{ animationDelay: '0ms' }}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Margem Média</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">{formatPercent(avgMargin)}</div>
            <p className="text-xs text-emerald-600 mt-1">+2.1% desde o último mês</p>
          </CardContent>
        </Card>

        <Card className="animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Alertas de Custo</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">{costAlerts}</div>
            <p className="text-xs text-red-600 mt-1">Insumos subiram &gt; 10%</p>
          </CardContent>
        </Card>

        <Card className="animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Fichas Técnicas</CardTitle>
            <FileText className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">{recipes.length}</div>
            <p className="text-xs text-slate-500 mt-1">Receitas cadastradas</p>
          </CardContent>
        </Card>

        <Card
          className="bg-primary text-white animate-fade-in-up hover:shadow-md transition-shadow cursor-pointer"
          style={{ animationDelay: '300ms' }}
        >
          <Link to="/pricing" className="block h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-white/80">Ação Rápida</CardTitle>
              <ArrowRight className="h-4 w-4 text-white" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-semibold mt-2">Simular Preços</div>
              <p className="text-xs text-white/80 mt-1">Ajuste para o iFood</p>
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
            <CardTitle className="text-lg">Custo vs Preço (Top Receitas)</CardTitle>
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
            <CardTitle className="text-lg">Distribuição de Vendas por Canal</CardTitle>
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
