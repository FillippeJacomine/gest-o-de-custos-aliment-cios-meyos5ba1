import { useState } from 'react'
import { useAppStore, Ingredient } from '@/stores/useAppStore'
import { formatCurrency, formatDate } from '@/lib/format'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { ScanLine, Search, Loader2, LineChart as LineChartIcon } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from 'recharts'

export default function Ingredients() {
  const { ingredients, simulateOCR } = useAppStore()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState('')
  const [isScanning, setIsScanning] = useState(false)
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null)

  const handleScan = async () => {
    setIsScanning(true)
    await simulateOCR()
    setIsScanning(false)
    toast({
      title: 'Nota Fiscal Processada',
      description: 'Preços de Chocolate e Farinha foram atualizados!',
      variant: 'default',
    })
  }

  const filteredIngredients = ingredients.filter((i) =>
    i.name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const chartData =
    selectedIngredient?.history.map((price, idx) => ({
      month: `Mês ${idx + 1}`,
      price,
    })) || []

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Insumos</h1>
          <p className="text-slate-500 text-sm">Gerencie seus ingredientes e custos base.</p>
        </div>
        <Button
          onClick={handleScan}
          disabled={isScanning}
          className="w-full sm:w-auto shadow-md hover:shadow-lg transition-all"
        >
          {isScanning ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <ScanLine className="mr-2 h-4 w-4" />
          )}
          Escanear Nota (OCR)
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="p-4 border-b">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar ingrediente..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead>Nome</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-right">Custo Atual</TableHead>
                <TableHead className="text-center">Unidade</TableHead>
                <TableHead className="text-right">Última Atualização</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredIngredients.map((ing) => {
                const isAlert =
                  ing.history.length > 1 && ing.cost > ing.history[ing.history.length - 2] * 1.1
                return (
                  <TableRow
                    key={ing.id}
                    className="cursor-pointer transition-colors hover:bg-slate-50"
                    onClick={() => setSelectedIngredient(ing)}
                  >
                    <TableCell className="font-medium">
                      {ing.name}
                      {isAlert && (
                        <Badge variant="destructive" className="ml-2 text-[10px]">
                          Alta
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-white">
                        {ing.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono price-ticker font-semibold text-slate-700">
                      {formatCurrency(ing.cost)}
                    </TableCell>
                    <TableCell className="text-center text-slate-500">{ing.unit}</TableCell>
                    <TableCell className="text-right text-slate-500 text-sm">
                      {formatDate(ing.lastUpdated)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-slate-400 hover:text-primary"
                      >
                        <LineChartIcon className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Drawer
        open={!!selectedIngredient}
        onOpenChange={(open) => !open && setSelectedIngredient(null)}
      >
        <DrawerContent className="h-[60vh]">
          <DrawerHeader>
            <DrawerTitle>Histórico de Preço: {selectedIngredient?.name}</DrawerTitle>
          </DrawerHeader>
          <div className="p-4 h-full pb-10">
            <ChartContainer
              config={{ price: { label: 'Preço', color: 'hsl(var(--primary))' } }}
              className="h-full w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                  <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis
                    fontSize={12}
                    tickFormatter={(v) => `R$${v}`}
                    tickLine={false}
                    axisLine={false}
                    domain={['auto', 'auto']}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="price"
                    stroke="var(--color-price)"
                    strokeWidth={3}
                    dot={{ r: 4, strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  )
}
