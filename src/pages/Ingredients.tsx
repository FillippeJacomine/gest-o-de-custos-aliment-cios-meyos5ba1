import { useState } from 'react'
import { useAppStore, Ingredient, OCRResultItem } from '@/stores/useAppStore'
import { formatCurrency, formatDate } from '@/lib/format'
import { exportToCSV } from '@/lib/export'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from 'recharts'
import {
  ScanLine,
  Search,
  Loader2,
  LineChart as LineChartIcon,
  Download,
  AlertTriangle,
  Plus,
  Minus,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

export default function Ingredients() {
  const { ingredients, suppliers, simulateOCR, commitOCRData, updateIngredientStock } =
    useAppStore()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState('')
  const [isScanning, setIsScanning] = useState(false)
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null)

  const [adjustStockDialog, setAdjustStockDialog] = useState<{
    open: boolean
    ingredient: Ingredient | null
  }>({
    open: false,
    ingredient: null,
  })
  const [stockAdjustment, setStockAdjustment] = useState<number>(0)

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
          const factor = mapping.factor || 1
          const newCost = res.unitPrice / factor
          const addedStock = res.qty * factor
          return { ingredientId: mapping.ingredientId, newCost, addedStock }
        }
        return null
      })
      .filter(Boolean) as { ingredientId: string; newCost: number; addedStock: number }[]

    commitOCRData(updates)
    setIsReviewOpen(false)
    toast({
      title: 'Custos e Estoque Atualizados',
      description: `${updates.length} insumos foram atualizados com sucesso via NF-e.`,
    })
  }

  const handleExport = () => {
    exportToCSV(
      'insumos',
      [
        'Nome',
        'Categoria',
        'Custo Atual',
        'Estoque',
        'Min Estoque',
        'Unidade',
        'Fator Perda',
        'Última Atualização',
      ],
      ingredients.map((i) => [
        i.name,
        i.category,
        i.cost,
        i.stock,
        i.minStock,
        i.unit,
        i.wasteFactor,
        i.lastUpdated,
      ]),
    )
  }

  const handleAdjustStock = () => {
    if (adjustStockDialog.ingredient && stockAdjustment !== 0) {
      updateIngredientStock(adjustStockDialog.ingredient.id, stockAdjustment)
      toast({
        title: 'Estoque Ajustado',
        description: `${adjustStockDialog.ingredient.name} atualizado com sucesso.`,
      })
      setAdjustStockDialog({ open: false, ingredient: null })
      setStockAdjustment(0)
    }
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
          <h1 className="text-2xl font-bold text-slate-800">Insumos & Estoque</h1>
          <p className="text-slate-500 text-sm">
            Gerencie seus ingredientes, custos e níveis de estoque.
          </p>
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
                <TableHead className="text-right">Perda</TableHead>
                <TableHead className="text-right">Estoque</TableHead>
                <TableHead className="text-center">Unidade</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredIngredients.map((ing) => {
                const isPriceAlert =
                  ing.history.length > 1 && ing.cost > ing.history[ing.history.length - 2] * 1.1
                const isStockAlert = ing.stock <= ing.minStock

                return (
                  <TableRow key={ing.id} className="hover:bg-slate-50">
                    <TableCell
                      className="font-medium cursor-pointer"
                      onClick={() => setSelectedIngredient(ing)}
                    >
                      <div className="flex items-center gap-2">
                        {ing.name}
                        {isPriceAlert && (
                          <Badge variant="destructive" className="text-[10px]">
                            Preço Alta
                          </Badge>
                        )}
                        {isStockAlert && (
                          <Badge
                            variant="outline"
                            className="text-[10px] text-amber-600 border-amber-300 bg-amber-50"
                          >
                            <AlertTriangle className="h-3 w-3 mr-1" /> Estoque Baixo
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-white">
                        {ing.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold text-slate-700">
                      {formatCurrency(ing.cost)}
                    </TableCell>
                    <TableCell className="text-right text-slate-500">{ing.wasteFactor}%</TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-col items-end">
                        <span
                          className={cn(
                            'font-mono font-bold',
                            isStockAlert ? 'text-amber-600' : 'text-slate-700',
                          )}
                        >
                          {ing.stock.toFixed(2)}
                        </span>
                        <span className="text-[10px] text-slate-400">Min: {ing.minStock}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center text-slate-500">{ing.unit}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-slate-400 hover:text-primary"
                          onClick={() => setSelectedIngredient(ing)}
                          title="Analisar"
                        >
                          <LineChartIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-slate-400 hover:text-emerald-600"
                          onClick={() => {
                            setAdjustStockDialog({ open: true, ingredient: ing })
                            setStockAdjustment(0)
                          }}
                          title="Ajustar Estoque"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Histórico Drawer */}
      <Drawer
        open={!!selectedIngredient}
        onOpenChange={(open) => !open && setSelectedIngredient(null)}
      >
        <DrawerContent className="h-[70vh]">
          <DrawerHeader>
            <DrawerTitle>Análise de Insumo: {selectedIngredient?.name}</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 h-full pb-10">
            <Tabs defaultValue="price" className="h-full flex flex-col">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="price">Histórico de Preço</TabsTrigger>
                <TabsTrigger value="suppliers">Fornecedores (Cotação)</TabsTrigger>
              </TabsList>

              <TabsContent value="price" className="flex-1 mt-4">
                <ChartContainer
                  config={{ price: { label: 'Preço', color: 'hsl(var(--primary))' } }}
                  className="h-full w-full min-h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={chartData}
                      margin={{ top: 20, right: 20, bottom: 20, left: 0 }}
                    >
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
              </TabsContent>

              <TabsContent value="suppliers" className="mt-4">
                <div className="space-y-4">
                  <div className="flex justify-between items-center bg-slate-50 p-3 rounded border">
                    <span className="text-sm font-medium text-slate-700">Preço Atual Base:</span>
                    <span className="text-lg font-bold text-primary">
                      {formatCurrency(selectedIngredient?.cost || 0)}/{selectedIngredient?.unit}
                    </span>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fornecedor</TableHead>
                        <TableHead>Data da Cotação</TableHead>
                        <TableHead className="text-right">Preço Unitário</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedIngredient?.supplierHistory.map((sh, i) => {
                        const sup = suppliers.find((s) => s.id === sh.supplierId)
                        return (
                          <TableRow key={i}>
                            <TableCell className="font-medium">
                              {sup?.name || 'Desconhecido'}
                            </TableCell>
                            <TableCell>{formatDate(sh.date)}</TableCell>
                            <TableCell className="text-right font-semibold text-slate-700">
                              {formatCurrency(sh.price)}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                      {(!selectedIngredient?.supplierHistory ||
                        selectedIngredient.supplierHistory.length === 0) && (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-slate-400 py-4">
                            Nenhum histórico registrado.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Ajuste de Estoque Dialog */}
      <Dialog
        open={adjustStockDialog.open}
        onOpenChange={(open) => !open && setAdjustStockDialog({ open: false, ingredient: null })}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Ajustar Estoque Manual</DialogTitle>
            <DialogDescription>
              {adjustStockDialog.ingredient?.name} (Estoque atual:{' '}
              {adjustStockDialog.ingredient?.stock.toFixed(2)} {adjustStockDialog.ingredient?.unit})
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Quantidade a Adicionar / Remover</Label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setStockAdjustment((s) => s - 1)}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  type="number"
                  value={stockAdjustment}
                  onChange={(e) => setStockAdjustment(Number(e.target.value))}
                  className="text-center font-mono text-lg"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setStockAdjustment((s) => s + 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-slate-500 text-center">
                Novo estoque será:{' '}
                {((adjustStockDialog.ingredient?.stock || 0) + stockAdjustment).toFixed(2)}{' '}
                {adjustStockDialog.ingredient?.unit}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAdjustStockDialog({ open: false, ingredient: null })}
            >
              Cancelar
            </Button>
            <Button onClick={handleAdjustStock} disabled={stockAdjustment === 0}>
              Salvar Ajuste
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* OCR Dialog */}
      <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto w-[95vw] p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Revisão de Nota Fiscal (OCR)</DialogTitle>
            <DialogDescription>
              Vincule os itens lidos com seus insumos cadastrados. O estoque será atualizado
              automaticamente.
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
                  <div className="flex flex-wrap items-center gap-3 bg-white p-2 rounded border text-sm">
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
                    <div className="flex flex-col items-end ml-auto gap-1">
                      <span className="text-emerald-600 font-medium text-xs">
                        Novo custo unit.:{' '}
                        {formatCurrency(res.unitPrice / (ocrMapping[res.id]?.factor || 1))}
                      </span>
                      <span className="text-blue-600 font-medium text-xs">
                        Estoque a somar: +{(res.qty * (ocrMapping[res.id]?.factor || 1)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReviewOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCommitOCR}>Confirmar Entrada</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
