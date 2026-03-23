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
import { exportToCSV, printHTML } from '@/lib/export'
import { ChartContainer, ChartTooltipContent, ChartTooltip } from '@/components/ui/chart'
import {
  ScatterChart,
  Scatter,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Download, FileText } from 'lucide-react'

export default function Reports() {
  const { recipes, sales, fixedCosts, ingredients, getRecipeCost } = useAppStore()

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

  // Channel Profitability
  const channelComparison = ['LOCAL', 'IFOOD_BASIC', 'IFOOD_DELIVERY'].map((ch) => {
    const s = sales.filter((x) => x.channel === ch)
    const vol = s.reduce((a, b) => a + b.quantity, 0)
    const rev = s.reduce((a, b) => a + b.revenue, 0)
    const cost = s.reduce((a, b) => {
      const r = recipes.find((rc) => rc.id === b.recipeId)
      return a + (r ? (getRecipeCost(r) * b.quantity) / r.yield : 0)
    }, 0)
    const feePct = ch === 'IFOOD_DELIVERY' ? 0.23 : ch === 'IFOOD_BASIC' ? 0.12 : 0.025
    const netProfit = rev - cost - rev * feePct
    return { name: ch, vol, rev, netProfit }
  })

  // Inventory Value
  const totalInventoryValue = ingredients.reduce((sum, i) => sum + i.stock * i.cost, 0)

  const handleExportCSV = () => {
    exportToCSV(
      'relatorio-vendas',
      ['Produto', 'Volume', 'Receita', 'Custo Variável', 'Lucro Bruto', 'Margem'],
      salesData.map((d) => [d.name, d.vol, d.rev, d.cost, d.profit, d.margin]),
    )
  }

  const handleExportPDF = () => {
    const rows = channelComparison
      .map(
        (c) =>
          `<tr><td>${c.name}</td><td>${c.vol}</td><td>${formatCurrency(c.rev)}</td><td>${formatCurrency(c.netProfit)}</td></tr>`,
      )
      .join('')
    const html = `
      <div style="font-family: sans-serif;">
        <h1 style="color: #1e293b;">Relatório Gerencial - Análise de Canais</h1>
        <p><strong>Valor Total em Estoque:</strong> ${formatCurrency(totalInventoryValue)}</p>
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <thead style="background: #f1f5f9; text-align: left;">
            <tr><th style="padding: 10px;">Canal</th><th style="padding: 10px;">Volume</th><th style="padding: 10px;">Receita</th><th style="padding: 10px;">Lucro Líquido</th></tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `
    printHTML('Relatório Gerencial', html)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Relatórios Avançados</h1>
          <p className="text-slate-500 text-sm">
            Visão estratégica das suas vendas, canais e patrimônio.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-2" /> Excel / CSV
          </Button>
          <Button variant="default" onClick={handleExportPDF}>
            <FileText className="h-4 w-4 mr-2" /> Exportar PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
          <CardContent className="p-6">
            <p className="text-indigo-100 text-sm font-medium mb-1">
              Valor do Estoque (Patrimônio)
            </p>
            <h3 className="text-3xl font-bold">{formatCurrency(totalInventoryValue)}</h3>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-slate-500 text-sm font-medium mb-1">Receita Bruta Total</p>
            <h3 className="text-3xl font-bold text-slate-800">
              {formatCurrency(salesData.reduce((a, b) => a + b.rev, 0))}
            </h3>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-slate-500 text-sm font-medium mb-1">Volume Total</p>
            <h3 className="text-3xl font-bold text-slate-800">
              {salesData.reduce((a, b) => a + b.vol, 0)} un
            </h3>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="channels" className="space-y-4">
        <TabsList className="bg-white border">
          <TabsTrigger value="channels">Análise de Canais</TabsTrigger>
          <TabsTrigger value="matrix">Matriz BCG</TabsTrigger>
          <TabsTrigger value="sales">Vendas Reais</TabsTrigger>
        </TabsList>

        <TabsContent value="channels" className="space-y-4 animate-fade-in-up">
          <Card>
            <CardHeader>
              <CardTitle>Lucratividade por Canal de Venda</CardTitle>
              <CardDescription>
                Comparativo de Receita vs Lucro Líquido (após taxas presumidas do canal).
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <ChartContainer
                config={{
                  rev: { label: 'Receita', color: 'hsl(var(--secondary))' },
                  netProfit: { label: 'Lucro Líquido', color: 'hsl(var(--primary))' },
                }}
                className="h-full w-full"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={channelComparison}
                    margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} />
                    <YAxis tickFormatter={(v) => `R$${v}`} tickLine={false} axisLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="rev" fill="var(--color-rev)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="netProfit" fill="var(--color-netProfit)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

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
                    <TableHead className="text-right">Margem Bruta</TableHead>
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
      </Tabs>
    </div>
  )
}
