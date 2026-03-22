import { useState } from 'react'
import { useAppStore } from '@/stores/useAppStore'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCurrency, formatPercent } from '@/lib/format'
import { ChartContainer, ChartTooltipContent, ChartTooltip } from '@/components/ui/chart'
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus } from 'lucide-react'

export default function Reports() {
  const { recipes, sales, fixedCosts, getRecipeCost, updateFixedCosts, addSale } = useAppStore()
  const [costsForm, setCostsForm] = useState(fixedCosts)

  const salesData = recipes
    .map((r) => {
      const rSales = sales.filter((s) => s.recipeId === r.id)
      const vol = rSales.reduce((sum, s) => sum + s.quantity, 0)
      const rev = rSales.reduce((sum, s) => sum + s.revenue, 0)
      const cost = (getRecipeCost(r) * vol) / r.yield
      const profit = rev - cost
      const margin = rev > 0 ? (profit / rev) * 100 : 0
      return { ...r, vol, rev, cost, profit, margin }
    })
    .filter((r) => r.vol > 0)

  const avgVol = salesData.reduce((sum, r) => sum + r.vol, 0) / (salesData.length || 1)
  const avgMargin = salesData.reduce((sum, r) => sum + r.margin, 0) / (salesData.length || 1)

  const chartData = salesData.map((d) => ({
    name: d.name,
    vol: d.vol,
    margin: Number(d.margin.toFixed(1)),
    fill:
      d.margin > avgMargin
        ? d.vol > avgVol
          ? '#10b981'
          : '#f59e0b'
        : d.vol > avgVol
          ? '#3b82f6'
          : '#ef4444',
  }))

  const totalFixedCosts = Object.values(fixedCosts).reduce((a, b) => a + b, 0)
  const totalVolumeAll = salesData.reduce((sum, r) => sum + r.vol, 0)
  const fixedCostPerUnit = totalVolumeAll > 0 ? totalFixedCosts / totalVolumeAll : 0

  const handleSaveCosts = () => updateFixedCosts(costsForm)

  const handleSimulateSale = () => {
    addSale({ recipeId: recipes[0].id, channel: 'LOCAL', quantity: 20, revenue: 300 })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Relatórios de Desempenho</h1>
        <p className="text-slate-500 text-sm">
          Analise suas vendas, lucratividade e impacto de custos fixos.
        </p>
      </div>

      <Tabs defaultValue="matrix" className="space-y-4">
        <TabsList className="bg-white border">
          <TabsTrigger value="matrix">Matriz BCG</TabsTrigger>
          <TabsTrigger value="sales">Vendas Reais</TabsTrigger>
          <TabsTrigger value="costs">Custos Consolidados</TabsTrigger>
        </TabsList>

        <TabsContent value="matrix" className="space-y-4 animate-fade-in-up">
          <Card>
            <CardHeader>
              <CardTitle>Matriz de Lucratividade</CardTitle>
              <CardDescription>
                Classificação de produtos baseada no volume de vendas vs margem de lucro real.
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <ChartContainer
                config={{ margin: { label: 'Margem %' }, vol: { label: 'Volume un.' } }}
                className="h-full w-full"
              >
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    type="number"
                    dataKey="vol"
                    name="Volume"
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    type="number"
                    dataKey="margin"
                    name="Margem"
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <ChartTooltip
                    cursor={{ strokeDasharray: '3 3' }}
                    content={<ChartTooltipContent />}
                  />
                  <ReferenceLine x={avgVol} stroke="var(--color-border)" strokeDasharray="3 3" />
                  <ReferenceLine y={avgMargin} stroke="var(--color-border)" strokeDasharray="3 3" />
                  <Scatter name="Produtos" data={chartData} />
                </ScatterChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sales" className="space-y-4 animate-fade-in-up">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Desempenho por Produto</CardTitle>
                <CardDescription>Consolidado de todas as vendas registradas.</CardDescription>
              </div>
              <Button size="sm" variant="outline" onClick={handleSimulateSale}>
                <Plus className="h-4 w-4 mr-2" /> Simular Venda
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead className="text-right">Volume (un)</TableHead>
                    <TableHead className="text-right">Receita</TableHead>
                    <TableHead className="text-right">Custo Variável</TableHead>
                    <TableHead className="text-right">Lucro Bruto</TableHead>
                    <TableHead className="text-right">Margem Real</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salesData.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="font-medium">{d.name}</TableCell>
                      <TableCell className="text-right">{d.vol}</TableCell>
                      <TableCell className="text-right">{formatCurrency(d.rev)}</TableCell>
                      <TableCell className="text-right text-red-500">
                        {formatCurrency(d.cost)}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-emerald-600">
                        {formatCurrency(d.profit)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant="outline"
                          className={
                            d.margin >= 30
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }
                        >
                          {formatPercent(d.margin)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="costs" className="space-y-4 animate-fade-in-up">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Custos Fixos Mensais</CardTitle>
                <CardDescription>Insira as despesas operacionais da sua cozinha.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label>Aluguel</Label>
                  <Input
                    type="number"
                    value={costsForm.rent}
                    onChange={(e) => setCostsForm({ ...costsForm, rent: Number(e.target.value) })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Energia</Label>
                  <Input
                    type="number"
                    value={costsForm.energy}
                    onChange={(e) => setCostsForm({ ...costsForm, energy: Number(e.target.value) })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Gás</Label>
                  <Input
                    type="number"
                    value={costsForm.gas}
                    onChange={(e) => setCostsForm({ ...costsForm, gas: Number(e.target.value) })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Mão de Obra</Label>
                  <Input
                    type="number"
                    value={costsForm.labor}
                    onChange={(e) => setCostsForm({ ...costsForm, labor: Number(e.target.value) })}
                  />
                </div>
                <Button className="w-full mt-2" onClick={handleSaveCosts}>
                  Salvar Custos
                </Button>
              </CardContent>
            </Card>
            <Card className="bg-slate-50 border-slate-200">
              <CardHeader>
                <CardTitle className="text-slate-800">Impacto no Produto (Rateio)</CardTitle>
                <CardDescription>
                  Custo fixo diluído pelo volume de vendas atual ({totalVolumeAll} un).
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="text-sm text-slate-500 mb-1">Custo Fixo Total</div>
                  <div className="text-3xl font-bold text-slate-800">
                    {formatCurrency(totalFixedCosts)}
                  </div>
                </div>
                <div className="p-4 bg-white rounded-lg border border-indigo-100 shadow-sm">
                  <div className="text-sm text-indigo-600 font-medium mb-1">
                    Custo Fixo por Unidade Vendida
                  </div>
                  <div className="text-4xl font-black text-indigo-700">
                    {formatCurrency(fixedCostPerUnit)}
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    Para manter a saúde do negócio com o volume atual, cada produto vendido precisa
                    cobrir no mínimo este valor em lucro bruto.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
