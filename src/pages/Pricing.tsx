import { useState } from 'react'
import { useAppStore, PaymentTerminal } from '@/stores/useAppStore'
import { roundToPsychological } from '@/lib/pricing'
import { formatCurrency, formatPercent } from '@/lib/format'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Calculator, DollarSign, Settings, Percent, CreditCard, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

export default function Pricing() {
  const { recipes, getRecipeCost, fixedCosts, paymentTerminals, addPaymentTerminal } = useAppStore()
  const { toast } = useToast()

  const [selectedRecipeId, setSelectedRecipeId] = useState<string>(recipes[0]?.id || '')

  // Custom Calculator States
  const [margin, setMargin] = useState(25) // m
  const [appFee, setAppFee] = useState(12) // t_app
  const [discount, setDiscount] = useState(0) // d

  // Payment Terminals
  const [selectedTerminalId, setSelectedTerminalId] = useState<string>(
    paymentTerminals[0]?.id || '',
  )
  const [cardMode, setCardMode] = useState<'debit' | 'credit' | 'installments'>('credit')
  const [isTerminalDialogOpen, setIsTerminalDialogOpen] = useState(false)
  const [newTerminal, setNewTerminal] = useState<Partial<PaymentTerminal>>({
    debit: 1.5,
    credit: 3.5,
    installments: 5,
  })

  const [pkgCost, setPkgCost] = useState(1.5) // E
  const [fixedAppCost, setFixedAppCost] = useState(0) // F_app
  const [deliveryCost, setDeliveryCost] = useState(0) // F_delivery

  // Fixed Costs Allocation
  const [allocationType, setAllocationType] = useState<'value' | 'percent'>('percent')
  const [allocationVal, setAllocationVal] = useState(5)

  const recipe = recipes.find((r) => r.id === selectedRecipeId)
  const unitCost = recipe ? getRecipeCost(recipe) / recipe.yield : 0 // C

  const totalGlobalFixed = fixedCosts.rent + fixedCosts.energy + fixedCosts.gas + fixedCosts.labor
  const allocatedFixedCost =
    allocationType === 'percent' ? totalGlobalFixed * (allocationVal / 100) : allocationVal

  const terminal = paymentTerminals.find((t) => t.id === selectedTerminalId)
  const cardFee = terminal ? terminal[cardMode] : 2.5 // fallback

  // Markup Divisor Engine
  // P = (C + E + F_app + F_delivery + CustosFixosRateados) / (1 - (m + t_app + k_card + d))
  const totalDeductionsPct = (margin + appFee + cardFee + discount) / 100
  const divisor = 1 - totalDeductionsPct

  let suggestedPrice = 0
  if (divisor > 0) {
    suggestedPrice =
      (unitCost + pkgCost + fixedAppCost + deliveryCost + allocatedFixedCost) / divisor
  }

  const finalPrice = roundToPsychological(suggestedPrice)

  // Real Margin Check: (Price - Costs - Fees) / Price
  const totalMonetaryCosts = unitCost + pkgCost + fixedAppCost + deliveryCost + allocatedFixedCost
  const totalPercentageFeesValue = finalPrice * ((appFee + cardFee + discount) / 100)
  const netProfit = finalPrice - totalMonetaryCosts - totalPercentageFeesValue
  const realMargin = finalPrice > 0 ? (netProfit / finalPrice) * 100 : 0

  const handleSaveTerminal = () => {
    if (
      newTerminal.name &&
      newTerminal.debit !== undefined &&
      newTerminal.credit !== undefined &&
      newTerminal.installments !== undefined
    ) {
      addPaymentTerminal(newTerminal as Omit<PaymentTerminal, 'id'>)
      toast({ title: 'Máquina adicionada' })
      setIsTerminalDialogOpen(false)
      setNewTerminal({ debit: 1.5, credit: 3.5, installments: 5 })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
          <Calculator className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Calculadora de Precificação Inteligente
          </h1>
          <p className="text-slate-500 text-sm">
            Fórmula dinâmica integrando taxas de máquinas, app e rateio fixo.
          </p>
        </div>
      </div>

      <Card className="bg-indigo-50/50 border-indigo-100">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="w-full md:w-1/3">
            <Label className="text-indigo-900 mb-1 block">Selecione o Produto</Label>
            <Select value={selectedRecipeId} onValueChange={setSelectedRecipeId}>
              <SelectTrigger className="bg-white border-indigo-200">
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
          <div className="flex gap-6 w-full md:w-auto">
            <div>
              <p className="text-xs text-indigo-600 font-medium">Custo Unitário Base (C)</p>
              <p className="text-2xl font-bold text-indigo-900">{formatCurrency(unitCost)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Painel de Variáveis */}
        <div className="lg:col-span-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-3 border-b bg-slate-50/50">
                <CardTitle className="text-base flex items-center gap-2">
                  <Percent className="h-4 w-4" /> Variáveis Percentuais (%)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="space-y-1">
                  <Label className="text-emerald-700">Margem de Lucro Desejada (m)</Label>
                  <Input
                    type="number"
                    value={margin}
                    onChange={(e) => setMargin(Number(e.target.value))}
                    className="border-emerald-200 focus-visible:ring-emerald-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-slate-600">Taxa do App (t_app)</Label>
                    <Input
                      type="number"
                      value={appFee}
                      onChange={(e) => setAppFee(Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-amber-600">Desconto/Cupom (d)</Label>
                    <Input
                      type="number"
                      value={discount}
                      onChange={(e) => setDiscount(Number(e.target.value))}
                    />
                  </div>
                </div>

                <div className="space-y-1 border-t pt-4 mt-2">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-indigo-800 font-semibold flex items-center gap-1">
                      <CreditCard className="h-4 w-4" /> Terminal (k_card)
                    </Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs text-indigo-600 px-2"
                      onClick={() => setIsTerminalDialogOpen(true)}
                    >
                      Gerenciar
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Select value={selectedTerminalId} onValueChange={setSelectedTerminalId}>
                      <SelectTrigger className="bg-white border-indigo-100">
                        <SelectValue placeholder="Máquina..." />
                      </SelectTrigger>
                      <SelectContent>
                        {paymentTerminals.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={cardMode} onValueChange={(v: any) => setCardMode(v)}>
                      <SelectTrigger className="bg-white border-indigo-100">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="debit">Débito ({terminal?.debit}%)</SelectItem>
                        <SelectItem value="credit">Crédito 1x ({terminal?.credit}%)</SelectItem>
                        <SelectItem value="installments">
                          Parcelado ({terminal?.installments}%)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {terminal && (
                    <p className="text-xs text-slate-500 text-right mt-1">
                      Taxa aplicada: <span className="font-bold text-indigo-700">{cardFee}%</span>
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader className="pb-3 border-b bg-slate-50/50">
                  <CardTitle className="text-base flex items-center gap-2">
                    <DollarSign className="h-4 w-4" /> Variáveis Fixas (R$)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  <div className="space-y-1">
                    <Label className="text-slate-600">Embalagem (E)</Label>
                    <Input
                      type="number"
                      value={pkgCost}
                      onChange={(e) => setPkgCost(Number(e.target.value))}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-slate-600">Custo Fixo App</Label>
                      <Input
                        type="number"
                        value={fixedAppCost}
                        onChange={(e) => setFixedAppCost(Number(e.target.value))}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-slate-600">Custo Entrega</Label>
                      <Input
                        type="number"
                        value={deliveryCost}
                        onChange={(e) => setDeliveryCost(Number(e.target.value))}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-blue-100 bg-blue-50/30">
                <CardHeader className="pb-3 border-b bg-blue-50/50">
                  <CardTitle className="text-base flex items-center gap-2 text-blue-800">
                    <Settings className="h-4 w-4" /> Rateio de Custos Fixos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  <p className="text-xs text-slate-500">
                    Custo Fixo Total Global: {formatCurrency(totalGlobalFixed)}/mês
                  </p>
                  <div className="flex gap-2">
                    <Select
                      value={allocationType}
                      onValueChange={(v: 'value' | 'percent') => setAllocationType(v)}
                    >
                      <SelectTrigger className="w-[120px] bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percent">% do Total</SelectItem>
                        <SelectItem value="value">Valor Fixo</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      value={allocationVal}
                      onChange={(e) => setAllocationVal(Number(e.target.value))}
                      className="flex-1 bg-white"
                    />
                  </div>
                  <p className="text-sm font-medium text-blue-700 text-right">
                    Alocado: {formatCurrency(allocatedFixedCost)}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Resultado */}
        <div className="lg:col-span-4">
          <Card className="sticky top-24 overflow-hidden border-2 border-primary shadow-xl">
            <div className="bg-primary p-6 text-white text-center">
              <p className="text-primary-foreground/80 font-medium mb-2">Preço Sugerido Final</p>
              <div className="text-5xl font-black tracking-tight">{formatCurrency(finalPrice)}</div>
              {divisor <= 0 && (
                <p className="text-xs text-red-200 mt-2">Erro: Deduções excedem 100%</p>
              )}
            </div>
            <CardContent className="p-6 space-y-6">
              <div className="flex justify-between items-end border-b pb-4">
                <div>
                  <p className="text-sm text-slate-500">Lucro Líquido</p>
                  <p
                    className={`text-2xl font-bold ${netProfit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}
                  >
                    {formatCurrency(netProfit)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-500">Margem Real</p>
                  <p
                    className={`text-2xl font-bold ${realMargin >= margin ? 'text-emerald-600' : 'text-amber-500'}`}
                  >
                    {formatPercent(realMargin)}
                  </p>
                </div>
              </div>

              <div className="space-y-2 text-sm text-slate-600">
                <div className="flex justify-between">
                  <span>Custo Produto (C):</span> <span>{formatCurrency(unitCost)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Rateio Fixo + Extras:</span>{' '}
                  <span>
                    {formatCurrency(pkgCost + fixedAppCost + deliveryCost + allocatedFixedCost)}
                  </span>
                </div>
                <div className="flex justify-between text-red-500">
                  <span>Taxas ({totalDeductionsPct * 100 - margin}%):</span>{' '}
                  <span>-{formatCurrency(totalPercentageFeesValue)}</span>
                </div>
              </div>

              <div className="pt-4 border-t">
                <p className="text-[10px] text-slate-400 font-mono text-center leading-relaxed">
                  P = (Custo Base + Extras) / (1 - Deduções %)
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={isTerminalDialogOpen} onOpenChange={setIsTerminalDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Máquina / Terminal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome do Terminal</Label>
              <Input
                value={newTerminal.name || ''}
                onChange={(e) => setNewTerminal({ ...newTerminal, name: e.target.value })}
                placeholder="Ex: Stone Safra 2"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Débito (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={newTerminal.debit}
                  onChange={(e) =>
                    setNewTerminal({ ...newTerminal, debit: Number(e.target.value) })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Crédito 1x (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={newTerminal.credit}
                  onChange={(e) =>
                    setNewTerminal({ ...newTerminal, credit: Number(e.target.value) })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Parcelado (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={newTerminal.installments}
                  onChange={(e) =>
                    setNewTerminal({ ...newTerminal, installments: Number(e.target.value) })
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTerminalDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveTerminal}>Salvar Terminal</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
