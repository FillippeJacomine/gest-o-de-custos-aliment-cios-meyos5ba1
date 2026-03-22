import { useState } from 'react'
import { useAppStore, Recipe } from '@/stores/useAppStore'
import { calculatePrice, calculateProfit, roundToPsychological, PLANS } from '@/lib/pricing'
import { formatCurrency, formatPercent } from '@/lib/format'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Calculator, Store, Bike, Package } from 'lucide-react'

export default function Pricing() {
  const { recipes, getRecipeCost } = useAppStore()
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>(recipes[0]?.id || '')

  const [margin, setMargin] = useState(25) // 25% target margin
  const [fixedFees, setFixedFees] = useState(2.5) // Packaging etc
  const [discount, setDiscount] = useState(0) // Coupon
  const [usePsychological, setUsePsychological] = useState(true)

  const recipe = recipes.find((r) => r.id === selectedRecipeId)
  if (!recipe) return null

  const unitCost = getRecipeCost(recipe) / recipe.yield

  const renderPlanCard = (
    plan: (typeof PLANS)[keyof typeof PLANS],
    icon: React.ReactNode,
    colorClass: string,
  ) => {
    let rawPrice = calculatePrice(unitCost, fixedFees, margin, plan, discount)
    const finalPrice = usePsychological ? roundToPsychological(rawPrice) : rawPrice
    const profit = calculateProfit(finalPrice, unitCost, fixedFees, plan, discount)
    const actualMargin = (profit / finalPrice) * 100 || 0

    return (
      <Card className={`overflow-hidden border-t-4 ${colorClass}`}>
        <CardHeader className="pb-2 bg-slate-50/50">
          <CardTitle className="text-base flex items-center gap-2 text-slate-700">
            {icon} {plan.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <div>
            <p className="text-sm text-slate-500 mb-1">Preço Sugerido</p>
            <div className="text-3xl font-bold text-slate-800 price-ticker">
              {formatCurrency(finalPrice)}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm border-t pt-3">
            <div>
              <p className="text-slate-500">Lucro Líquido</p>
              <p
                className={`font-semibold price-ticker ${profit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}
              >
                {formatCurrency(profit)}
              </p>
            </div>
            <div>
              <p className="text-slate-500">Margem Real</p>
              <p
                className={`font-semibold ${actualMargin >= margin ? 'text-emerald-600' : 'text-amber-500'}`}
              >
                {formatPercent(actualMargin)}
              </p>
            </div>
          </div>

          <div className="text-xs text-slate-400 pt-2 border-t flex justify-between">
            <span>Taxa App: {plan.commission}%</span>
            <span>Taxa Pag: {plan.tax}%</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
          <Calculator className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Motor de Precificação</h1>
          <p className="text-slate-500 text-sm">
            Calcule o preço de venda ideal com a fórmula de Markup Divisor.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <Card>
            <CardContent className="p-5 space-y-6">
              <div className="space-y-2">
                <Label>Selecione o Produto</Label>
                <Select value={selectedRecipeId} onValueChange={setSelectedRecipeId}>
                  <SelectTrigger className="w-full bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {recipes.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                <p className="text-sm text-slate-500">Custo Unitário Base</p>
                <p className="text-xl font-bold text-slate-800">{formatCurrency(unitCost)}</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Margem Desejada</Label>
                    <span className="text-sm font-medium text-primary">{margin}%</span>
                  </div>
                  <Slider
                    value={[margin]}
                    onValueChange={(v) => setMargin(v[0])}
                    max={60}
                    step={1}
                    className="py-2"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Desconto / Cupom</Label>
                    <span className="text-sm font-medium text-amber-600">{discount}%</span>
                  </div>
                  <Slider
                    value={[discount]}
                    onValueChange={(v) => setDiscount(v[0])}
                    max={30}
                    step={1}
                    className="py-2"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Custos Fixos (Embalagem, etc)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                      R$
                    </span>
                    <input
                      type="number"
                      value={fixedFees}
                      onChange={(e) => setFixedFees(Number(e.target.value))}
                      className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm pl-9 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <Label htmlFor="rounding" className="cursor-pointer">
                    Preço Psicológico (X,90)
                  </Label>
                  <Switch
                    id="rounding"
                    checked={usePsychological}
                    onCheckedChange={setUsePsychological}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results Grid */}
        <div className="lg:col-span-8">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {renderPlanCard(
              PLANS.LOCAL,
              <Store className="h-5 w-5 text-emerald-500" />,
              'border-emerald-500',
            )}
            {renderPlanCard(
              PLANS.IFOOD_BASIC,
              <Package className="h-5 w-5 text-red-500" />,
              'border-red-500',
            )}
            {renderPlanCard(
              PLANS.IFOOD_DELIVERY,
              <Bike className="h-5 w-5 text-amber-500" />,
              'border-amber-500',
            )}
          </div>

          <Card className="mt-6 bg-indigo-50 border-indigo-100">
            <CardContent className="p-6">
              <h3 className="font-semibold text-indigo-900 mb-2">
                Entendendo o Cálculo (Markup Divisor)
              </h3>
              <p className="text-sm text-indigo-700 leading-relaxed">
                A fórmula utilizada garante que a margem desejada incida sobre o{' '}
                <strong>preço final de venda</strong>, e não sobre o custo. Se o custo subir, o
                preço é recalculado automaticamente para proteger sua margem.
                <br />
                <br />
                <code className="bg-indigo-100 px-2 py-1 rounded text-indigo-800 font-mono text-xs">
                  Preço = (Custo Produto + Custo Fixo) / (1 - (Margem% + TaxaApp% + TaxaPag% +
                  Desconto%))
                </code>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
