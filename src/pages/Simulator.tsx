import { useState, useMemo } from 'react'
import { useAppStore, Recipe } from '@/stores/useAppStore'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatPercent } from '@/lib/format'
import { Lightbulb, TrendingUp, TrendingDown, ArrowRight, Play, Check } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function Simulator() {
  const { recipes, ingredients, sales, getRecipeCost, updateIngredientPrice } = useAppStore()
  const { toast } = useToast()

  // State for simulated ingredient costs
  const [simulatedCosts, setSimulatedCosts] = useState<Record<string, number>>({})
  const [selectedIngredientToAdd, setSelectedIngredientToAdd] = useState<string>('')

  const handleAddSimulation = () => {
    if (selectedIngredientToAdd && !simulatedCosts[selectedIngredientToAdd]) {
      const ing = ingredients.find((i) => i.id === selectedIngredientToAdd)
      if (ing) {
        setSimulatedCosts((prev) => ({ ...prev, [ing.id]: ing.cost }))
      }
    }
    setSelectedIngredientToAdd('')
  }

  const handleRemoveSimulation = (id: string) => {
    setSimulatedCosts((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }

  const handleApplyPercentage = (id: string, percent: number) => {
    const baseCost = ingredients.find((i) => i.id === id)?.cost || 0
    setSimulatedCosts((prev) => ({ ...prev, [id]: baseCost * (1 + percent / 100) }))
  }

  const applyToRealData = () => {
    Object.entries(simulatedCosts).forEach(([id, newCost]) => {
      updateIngredientPrice(id, newCost)
    })
    toast({
      title: 'Simulação Aplicada',
      description: 'Os novos custos foram salvos na base de dados oficial.',
    })
    setSimulatedCosts({})
  }

  const getSimulatedRecipeCost = (recipe: Recipe) => {
    let total = 0
    recipe.items.forEach((item) => {
      const ing = ingredients.find((i) => i.id === item.ingredientId)
      if (ing) {
        const costToUse = simulatedCosts[ing.id] !== undefined ? simulatedCosts[ing.id] : ing.cost
        total += costToUse * item.qty
      }
    })
    return total * (1 + recipe.wasteFactor / 100)
  }

  const getRecipeAvgPrice = (recipeId: string) => {
    const rSales = sales.filter((s) => s.recipeId === recipeId)
    const totalVol = rSales.reduce((acc, s) => acc + s.quantity, 0)
    const totalRev = rSales.reduce((acc, s) => acc + s.revenue, 0)
    return totalVol > 0 ? totalRev / totalVol : 0
  }

  const impactData = useMemo(() => {
    return recipes
      .map((recipe) => {
        const currentCost = getRecipeCost(recipe) / recipe.yield
        const simulatedCost = getSimulatedRecipeCost(recipe) / recipe.yield
        const avgPrice = getRecipeAvgPrice(recipe.id)

        const hasSales = avgPrice > 0
        const currentMargin = hasSales ? (avgPrice - currentCost) / avgPrice : 0
        const simulatedMargin = hasSales ? (avgPrice - simulatedCost) / avgPrice : 0

        // Suggested price to maintain the same margin: P = Cost / (1 - Margin)
        // We cap margin at 90% to avoid division by zero or negative divisor
        const safeMargin = Math.min(currentMargin, 0.9)
        const suggestedPrice = hasSales && simulatedCost > 0 ? simulatedCost / (1 - safeMargin) : 0

        return {
          recipe,
          currentCost,
          simulatedCost,
          costDiff: simulatedCost - currentCost,
          avgPrice,
          currentMargin,
          simulatedMargin,
          marginDiff: simulatedMargin - currentMargin,
          suggestedPrice,
          hasSales,
        }
      })
      .sort((a, b) => Math.abs(b.costDiff) - Math.abs(a.costDiff))
  }, [recipes, simulatedCosts, getRecipeCost, ingredients, sales])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600">
          <Lightbulb className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Simulador de Cenários (What If)</h1>
          <p className="text-slate-500 text-sm">
            Simule variações de preço nos insumos e veja o impacto instantâneo na sua margem.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Painel de Controle */}
        <Card className="lg:col-span-1 h-fit bg-slate-50 border-slate-200">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Variação de Insumos</CardTitle>
            <CardDescription>
              Adicione insumos para simular aumentos ou quedas de preço.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Select value={selectedIngredientToAdd} onValueChange={setSelectedIngredientToAdd}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Selecione um insumo..." />
                </SelectTrigger>
                <SelectContent>
                  {ingredients
                    .filter((i) => simulatedCosts[i.id] === undefined)
                    .map((i) => (
                      <SelectItem key={i.id} value={i.id}>
                        {i.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Button
                onClick={handleAddSimulation}
                disabled={!selectedIngredientToAdd}
                size="icon"
                className="shrink-0"
              >
                <Play className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-3 pt-2">
              {Object.entries(simulatedCosts).map(([id, simCost]) => {
                const ing = ingredients.find((i) => i.id === id)
                if (!ing) return null
                const diffPct = ((simCost - ing.cost) / ing.cost) * 100

                return (
                  <div key={id} className="p-3 bg-white rounded-lg border shadow-sm space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-sm text-slate-800">{ing.name}</p>
                        <p className="text-xs text-slate-500">
                          Atual: {formatCurrency(ing.cost)}/{ing.unit}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-red-500"
                        onClick={() => handleRemoveSimulation(id)}
                      >
                        Remover
                      </Button>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                          R$
                        </span>
                        <Input
                          type="number"
                          value={simCost}
                          onChange={(e) =>
                            setSimulatedCosts((p) => ({ ...p, [id]: Number(e.target.value) }))
                          }
                          className="h-8 pl-6 text-sm"
                        />
                      </div>
                      <Badge
                        variant={
                          diffPct > 0 ? 'destructive' : diffPct < 0 ? 'default' : 'secondary'
                        }
                        className="w-16 justify-center"
                      >
                        {diffPct > 0 ? '+' : ''}
                        {diffPct.toFixed(1)}%
                      </Badge>
                    </div>

                    <div className="flex gap-1 justify-between">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-6 text-xs px-2"
                        onClick={() => handleApplyPercentage(id, 10)}
                      >
                        +10%
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-6 text-xs px-2"
                        onClick={() => handleApplyPercentage(id, 20)}
                      >
                        +20%
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-6 text-xs px-2"
                        onClick={() => handleApplyPercentage(id, -10)}
                      >
                        -10%
                      </Button>
                    </div>
                  </div>
                )
              })}
              {Object.keys(simulatedCosts).length === 0 && (
                <div className="text-center p-6 border-2 border-dashed border-slate-200 rounded-lg text-slate-400 text-sm">
                  Nenhuma simulação ativa.
                </div>
              )}
            </div>

            {Object.keys(simulatedCosts).length > 0 && (
              <div className="pt-4 border-t mt-4">
                <Button className="w-full" onClick={applyToRealData}>
                  <Check className="mr-2 h-4 w-4" /> Aplicar Mudanças Oficiais
                </Button>
                <p className="text-[10px] text-center text-slate-500 mt-2">
                  Atenção: Isso alterará o custo oficial dos insumos.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabela de Impacto */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Impacto nas Receitas</CardTitle>
            <CardDescription>
              Comparativo de Margem Bruta baseado no preço médio de venda atual.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Receita</TableHead>
                  <TableHead className="text-right">Custo Un.</TableHead>
                  <TableHead className="text-right">Margem Atual</TableHead>
                  <TableHead className="text-right">Nova Margem</TableHead>
                  <TableHead className="text-right bg-amber-50">Preço Sugerido</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {impactData.map((data) => (
                  <TableRow key={data.recipe.id}>
                    <TableCell className="font-medium">
                      {data.recipe.name}
                      {!data.hasSales && (
                        <span className="block text-[10px] text-slate-400 font-normal mt-0.5">
                          Sem histórico de vendas
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-col items-end">
                        <span
                          className={
                            data.costDiff > 0
                              ? 'text-red-500 font-medium'
                              : data.costDiff < 0
                                ? 'text-emerald-600 font-medium'
                                : 'text-slate-700'
                          }
                        >
                          {formatCurrency(data.simulatedCost)}
                        </span>
                        {data.costDiff !== 0 && (
                          <span className="text-[10px] text-slate-500 flex items-center">
                            De {formatCurrency(data.currentCost)}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {data.hasSales ? formatPercent(data.currentMargin * 100) : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      {data.hasSales ? (
                        <div className="flex items-center justify-end gap-1">
                          {data.marginDiff < 0 ? (
                            <TrendingDown className="h-3 w-3 text-red-500" />
                          ) : data.marginDiff > 0 ? (
                            <TrendingUp className="h-3 w-3 text-emerald-500" />
                          ) : null}
                          <span
                            className={
                              data.marginDiff < 0
                                ? 'text-red-500 font-medium'
                                : data.marginDiff > 0
                                  ? 'text-emerald-600 font-medium'
                                  : ''
                            }
                          >
                            {formatPercent(data.simulatedMargin * 100)}
                          </span>
                        </div>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell className="text-right bg-amber-50/50">
                      {data.hasSales && data.costDiff !== 0 ? (
                        <div className="flex items-center justify-end gap-1.5 font-bold text-amber-700">
                          <ArrowRight className="h-3 w-3 text-amber-400" />
                          {formatCurrency(data.suggestedPrice)}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-sm">Manter</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
