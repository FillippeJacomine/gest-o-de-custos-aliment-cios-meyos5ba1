import { useState, useEffect } from 'react'
import { useAppStore, Ingredient, OCRResultItem } from '@/stores/useAppStore'
import { formatCurrency, formatDate } from '@/lib/format'
import { exportToCSV } from '@/lib/export'
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from 'recharts'
import { ScanLine, Search, Loader2, LineChart as LineChartIcon, Download } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function Ingredients() {
  const { ingredients, simulateOCR, commitOCRData } = useAppStore()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState('')
  const [isScanning, setIsScanning] = useState(false)
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null)

  const [ocrResults, setOcrResults] = useState<OCRResultItem[]>([])
  const [isReviewOpen, setIsReviewOpen] = useState(false)
  const [ocrMapping, setOcrMapping] = useState<
    Record<string, { ingredientId: string; factor: number }>
  >({})

  const handleScan = async () => {
    setIsScanning(true)
    const results = await simulateOCR()
    setOcrResults(results)

    const initialMapping: Record<string, { ingredientId: string; factor: number }> = {}
    results.forEach((res) => {
      const match = ingredients.find((i) =>
        res.rawName.toLowerCase().includes(i.name.toLowerCase().split(' ')[0]),
      )
      if (match) {
        let factor = 1
        if (res.uom === 'un' && res.rawName.includes('5KG')) factor = 5
        initialMapping[res.id] = { ingredientId: match.id, factor }
      }
    })
    setOcrMapping(initialMapping)
    setIsScanning(false)
    setIsReviewOpen(true)
  }

  const handleCommitOCR = () => {
    const updates = ocrResults
      .map((res) => {
        const mapping = ocrMapping[res.id]
        if (mapping && mapping.ingredientId) {
          const newCost = res.unitPrice / (mapping.factor || 1)
          return { ingredientId: mapping.ingredientId, newCost }
        }
        return null
      })
      .filter(Boolean) as { ingredientId: string; newCost: number }[]

    commitOCRData(updates)
    setIsReviewOpen(false)
    toast({
      title: 'Custos Atualizados',
      description: `${updates.length} insumos foram atualizados com sucesso.`,
    })
  }

  const handleExport = () => {
    exportToCSV(
      'insumos',
      ['Nome', 'Categoria', 'Custo Atual', 'Unidade', 'Última Atualização'],
      ingredients.map((i) => [i.name, i.category, i.cost, i.unit, i.lastUpdated]),
    )
  }

  const filteredIngredients = ingredients.filter((i) =>
    i.name.toLowerCase().includes(searchTerm.toLowerCase()),
  )
  const chartData =
    selectedIngredient?.history.map((price, idx) => ({ month: `Mês ${idx + 1}`, price })) || []

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Insumos</h1>
          <p className="text-slate-500 text-sm">Gerencie seus ingredientes e custos base.</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={handleExport} className="w-full sm:w-auto shadow-sm">
            <Download className="mr-2 h-4 w-4" /> Exportar
          </Button>
          <Button onClick={handleScan} disabled={isScanning} className="w-full sm:w-auto shadow-md">
            {isScanning ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <ScanLine className="mr-2 h-4 w-4" />
            )}
            Escanear NF-e
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="p-4 border-b relative max-w-sm">
            <Search className="absolute left-7 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar ingrediente..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
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
                    className="cursor-pointer hover:bg-slate-50"
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
                    <TableCell className="text-right font-mono font-semibold text-slate-700">
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

      <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto w-[95vw] p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Revisão de Nota Fiscal (OCR)</DialogTitle>
            <DialogDescription>
              Vincule os itens lidos com seus insumos cadastrados e ajuste as conversões de unidade.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {ocrResults.map((res) => (
              <div key={res.id} className="p-4 border rounded-lg bg-slate-50 space-y-3">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                  <div>
                    <p className="font-semibold text-sm text-slate-800">{res.rawName}</p>
                    <p className="text-xs text-slate-500">
                      Lido: {res.qty} {res.uom} x {formatCurrency(res.unitPrice)} ={' '}
                      {formatCurrency(res.totalPrice)}
                    </p>
                  </div>
                  <Select
                    value={ocrMapping[res.id]?.ingredientId || ''}
                    onValueChange={(val) =>
                      setOcrMapping((prev) => ({
                        ...prev,
                        [res.id]: {
                          ...prev[res.id],
                          ingredientId: val,
                          factor: prev[res.id]?.factor || 1,
                        },
                      }))
                    }
                  >
                    <SelectTrigger className="w-full sm:w-[220px] bg-white">
                      <SelectValue placeholder="Vincular insumo" />
                    </SelectTrigger>
                    <SelectContent>
                      {ingredients.map((i) => (
                        <SelectItem key={i.id} value={i.id}>
                          {i.name} ({i.unit})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {ocrMapping[res.id]?.ingredientId && (
                  <div className="flex items-center gap-3 bg-white p-2 rounded border text-sm">
                    <span className="text-slate-500 whitespace-nowrap">Fator conv.:</span>
                    <Input
                      type="number"
                      className="w-20 h-8"
                      value={ocrMapping[res.id]?.factor || 1}
                      onChange={(e) =>
                        setOcrMapping((prev) => ({
                          ...prev,
                          [res.id]: { ...prev[res.id], factor: Number(e.target.value) },
                        }))
                      }
                    />
                    <span className="text-emerald-600 font-medium text-xs ml-auto">
                      Novo custo unit.:{' '}
                      {formatCurrency(res.unitPrice / (ocrMapping[res.id]?.factor || 1))}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReviewOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCommitOCR}>Atualizar Custos</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
