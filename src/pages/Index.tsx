import { useAppStore } from '@/stores/useAppStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatPercent } from '@/lib/format'
import {
  TrendingUp,
  AlertCircle,
  FileText,
  ArrowRight,
  Award,
  Box,
  ShoppingCart,
} from 'lucide-react'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'

export default function Index() {
  const { recipes, sales, ingredients, getRecipeCost } = useAppStore()

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

  // Consumo Dashboard Data
  const ingredientConsumption: Record<
    string,
    { name: string; value: number; vol: number; unit: string }
  > = {}
  ingredients.forEach((i) => {
    ingredientConsumption[i.id] = { name: i.name, value: 0, vol: 0, unit: i.unit }
  })

  sales.forEach((sale) => {
    const recipe = recipes.find((r) => r.id === sale.recipeId)
    if (recipe) {
      const multiplier = sale.quantity / recipe.yield
      recipe.items.forEach((item) => {
        if (ingredientConsumption[item.ingredientId]) {
          const ing = ingredients.find((i) => i.id === item.ingredientId)
          if (ing) {
            const qtyUsed = item.qty * multiplier * (1 + (ing.wasteFactor || 0) / 100)
            ingredientConsumption[item.ingredientId].vol += qtyUsed
            ingredientConsumption[item.ingredientId].value += qtyUsed * ing.cost
          }
        }
      })
    }
  })

  const topIngredients = Object.values(ingredientConsumption)
    .filter((i) => i.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 10)

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

  // Alertas
  const priceAlerts = ingredients.filter(
    (i) => i.history.length > 1 && i.cost > i.history[i.history.length - 2] * 1.1,
  ).length
  const stockAlerts = ingredients.filter((i) => i.stock <= i.minStock).length
  const wasteAlerts = ingredients.filter((i) => i.wasteFactor >= 15)

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
            <CardTitle className="text-sm font-medium text-slate-500">
              Alertas Operacionais
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">
              {priceAlerts + stockAlerts + wasteAlerts.length}
            </div>
            <div className="flex flex-wrap gap-1 mt-1">
              {priceAlerts > 0 && (
                <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded">
                  {priceAlerts} custos em alta
                </span>
              )}
              {wasteAlerts.length > 0 && (
                <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
                  {wasteAlerts.length} perdas altas
                </span>
              )}
              {priceAlerts === 0 && stockAlerts === 0 && wasteAlerts.length === 0 && (
                <span className="text-xs text-slate-500">Tudo normal</span>
              )}
            </div>
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
          className="bg-primary text-white animate-fade-in-up hover:shadow-md transition-shadow cursor-pointer relative overflow-hidden"
          style={{ animationDelay: '300ms' }}
        >
          <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 bg-white/10 rounded-full blur-xl"></div>
          <Link to="/simulator" className="block h-full relative z-10">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-white/90">Simular Cenários</CardTitle>
              <ArrowRight className="h-4 w-4 text-white" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-semibold mt-2 leading-tight">What If</div>
              <p className="text-xs text-white/80 mt-1">Antecipe aumentos de custo</p>
            </CardContent>
          </Link>
        </Card>
      </div>

      <div
        className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in-up"
        style={{ animationDelay: '400ms' }}
      >
        <Card className="lg:col-span-8">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-indigo-500" /> Dashboard de Consumo (Top 10
              Insumos)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topIngredients.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between border-b last:border-0 pb-3 last:pb-0"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-slate-300 w-4">{idx + 1}</span>
                    <div>
                      <p className="font-medium text-slate-800">{item.name}</p>
                      <p className="text-xs text-slate-500">
                        Volume consumido: {item.vol.toFixed(2)} {item.unit}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-red-500">{formatCurrency(item.value)}</p>
                  </div>
                </div>
              ))}
              {topIngredients.length === 0 && (
                <p className="text-sm text-slate-500 py-4 text-center">
                  Nenhum consumo registrado.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-4 space-y-6">
          <Card className="bg-amber-50 border-amber-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-amber-800 text-md flex items-center gap-2">
                <AlertCircle className="h-4 w-4" /> Alertas de Perda
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {wasteAlerts.map((w) => (
                  <div
                    key={w.id}
                    className="flex justify-between items-center bg-white p-2 rounded border border-amber-100 shadow-sm"
                  >
                    <span className="text-sm font-medium text-slate-700">{w.name}</span>
                    <Badge variant="destructive" className="bg-amber-500">
                      {w.wasteFactor}% Fator Perda
                    </Badge>
                  </div>
                ))}
                {wasteAlerts.length === 0 && (
                  <p className="text-xs text-amber-600/70 text-center">
                    Nenhum alerta de fator de perda elevado.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Award className="h-5 w-5 text-emerald-500" /> Top Lucratividade
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topProfit.map((item, idx) => (
                  <div key={item.id} className="flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-800 truncate pr-2">{item.name}</span>
                    <span className="font-semibold text-emerald-600">
                      +{formatCurrency(item.profit)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
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
