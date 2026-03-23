import { useState } from 'react'
import { useAppStore, Recipe } from '@/stores/useAppStore'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatCurrency } from '@/lib/format'
import { printHTML } from '@/lib/export'
import { Plus, ChefHat, Scale, Printer, Tags, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useToast } from '@/hooks/use-toast'

export default function Recipes() {
  const { recipes, ingredients, getRecipeCost, addRecipe, updateRecipe, deleteRecipe } =
    useAppStore()
  const { toast } = useToast()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [recipeForm, setRecipeForm] = useState<Partial<Recipe>>({
    name: '',
    category: '',
    yield: 1,
    wasteFactor: 0,
    items: [],
  })

  const handlePrintRecipe = (recipe: Recipe) => {
    const totalCost = getRecipeCost(recipe)
    const unitCost = totalCost / recipe.yield

    const itemsHtml = recipe.items
      .map((item) => {
        const ing = ingredients.find((i) => i.id === item.ingredientId)
        const effectiveCost = (ing?.cost || 0) * (1 + (ing?.wasteFactor || 0) / 100)
        return `<tr>
        <td>${ing?.name}</td>
        <td>${item.qty} ${ing?.unit}</td>
        <td>${formatCurrency(effectiveCost)}</td>
        <td>${formatCurrency(effectiveCost * item.qty)}</td>
      </tr>`
      })
      .join('')

    const html = `
      <h1>${recipe.name}</h1>
      <div class="meta">
        <p><strong>Categoria:</strong> ${recipe.category}</p>
        <p><strong>Rendimento:</strong> ${recipe.yield} porções</p>
        <p><strong>Fator de Perda (Montagem):</strong> ${recipe.wasteFactor}%</p>
      </div>
      <h3>Custos</h3>
      <p><strong>Custo Total da Receita:</strong> ${formatCurrency(totalCost)}</p>
      <p><strong>Custo Unitário (por porção):</strong> ${formatCurrency(unitCost)}</p>
      <h3>Ingredientes</h3>
      <table>
        <thead><tr><th>Insumo</th><th>Quantidade</th><th>Custo Efetivo (c/ Perda)</th><th>Custo na Receita</th></tr></thead>
        <tbody>${itemsHtml}</tbody>
      </table>
    `
    printHTML(`Ficha Técnica - ${recipe.name}`, html)
  }

  const handlePrintLabel = (recipe: Recipe) => {
    const ingNames = recipe.items
      .map((i) => ingredients.find((ing) => ing.id === i.ingredientId)?.name)
      .filter(Boolean)
      .join(', ')
    const html = `
      <div style="width: 350px; border: 2px dashed #000; padding: 20px; font-family: Arial, sans-serif; border-radius: 12px; margin: 20px;">
        <h2 style="margin: 0 0 15px 0; text-align: center; text-transform: uppercase;">${recipe.name}</h2>
        <p style="font-size: 14px; margin: 5px 0;"><strong>Ingredientes:</strong> ${ingNames}</p>
        <p style="font-size: 14px; margin: 5px 0;"><strong>Alergênicos:</strong> Contém glúten/lactose (Verificar).</p>
        <div style="margin-top: 15px; border-top: 1px solid #ccc; padding-top: 10px; display: flex; justify-content: space-between;">
           <p style="font-size: 13px; margin: 0;"><strong>Fab:</strong> ${new Date().toLocaleDateString('pt-BR')}</p>
           <p style="font-size: 13px; margin: 0;"><strong>Val:</strong> ___/___/___</p>
        </div>
      </div>
    `
    printHTML(`Etiqueta - ${recipe.name}`, html)
  }

  const handleEdit = (recipe: Recipe) => {
    setRecipeForm(JSON.parse(JSON.stringify(recipe)))
    setIsDialogOpen(true)
  }

  const handleCreate = () => {
    setRecipeForm({
      name: '',
      category: 'Bolos',
      yield: 1,
      wasteFactor: 0,
      items: [],
      image: 'https://img.usecurling.com/p/200/200?q=cake',
    })
    setIsDialogOpen(true)
  }

  const handleSaveForm = () => {
    if (!recipeForm.name || !recipeForm.yield)
      return toast({ title: 'Preencha os campos obrigatórios', variant: 'destructive' })

    if (recipeForm.id) {
      updateRecipe(recipeForm.id, recipeForm as Recipe)
      toast({ title: 'Receita atualizada' })
    } else {
      addRecipe(recipeForm as Omit<Recipe, 'id'>)
      toast({ title: 'Receita criada' })
    }
    setIsDialogOpen(false)
  }

  const getDynamicCost = () => {
    let total = 0
    recipeForm.items?.forEach((item) => {
      const ing = ingredients.find((i) => i.id === item.ingredientId)
      if (ing) total += ing.cost * (1 + (ing.wasteFactor || 0) / 100) * item.qty
    })
    return total * (1 + (recipeForm.wasteFactor || 0) / 100)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Gestão Avançada de Receitas</h1>
          <p className="text-slate-500 text-sm">
            Crie, edite e imprima suas Fichas Técnicas e Etiquetas.
          </p>
        </div>
        <Button className="shadow-md" onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" /> Nova Receita
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recipes.map((recipe) => {
          const totalCost = getRecipeCost(recipe)
          const unitCost = totalCost / recipe.yield

          return (
            <Card
              key={recipe.id}
              className="overflow-hidden hover:shadow-lg transition-all group animate-fade-in-up"
            >
              <div
                className="h-40 overflow-hidden relative group/img cursor-pointer"
                onClick={() => handleEdit(recipe)}
              >
                <img
                  src={recipe.image}
                  alt={recipe.name}
                  className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-4">
                  <Badge className="bg-white/20 text-white backdrop-blur-md border-none w-fit mb-2">
                    {recipe.category}
                  </Badge>
                  <p className="text-white text-xs opacity-0 group-hover/img:opacity-100 transition-opacity">
                    Clique para editar
                  </p>
                </div>
                <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover/img:opacity-100 transition-opacity">
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8 rounded-full shadow-lg"
                    onClick={(e) => {
                      e.stopPropagation()
                      handlePrintLabel(recipe)
                    }}
                    title="Imprimir Etiqueta"
                  >
                    <Tags className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8 rounded-full shadow-lg"
                    onClick={(e) => {
                      e.stopPropagation()
                      handlePrintRecipe(recipe)
                    }}
                    title="Ficha Técnica"
                  >
                    <Printer className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardContent className="p-5">
                <h3 className="font-bold text-lg text-slate-800 mb-4">{recipe.name}</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm items-center border-b pb-2">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <ChefHat className="h-4 w-4" /> Custo Total
                    </span>
                    <span className="font-medium text-slate-700">{formatCurrency(totalCost)}</span>
                  </div>
                  <div className="flex justify-between text-sm items-center border-b pb-2">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <Scale className="h-4 w-4" /> Rendimento
                    </span>
                    <span className="font-medium text-slate-700">{recipe.yield} porções</span>
                  </div>
                  <div className="flex justify-between text-sm items-center pt-1">
                    <span className="text-slate-700 font-medium">Custo Unitário</span>
                    <span className="font-bold text-lg text-primary">
                      {formatCurrency(unitCost)}
                    </span>
                  </div>
                </div>
                <div className="mt-6 flex gap-2">
                  <Link to="/pricing" className="flex-1">
                    <Button
                      variant="outline"
                      className="w-full text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                    >
                      Precificar
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    className="text-red-500 hover:bg-red-50"
                    onClick={() => deleteRecipe(recipe.id)}
                    title="Excluir"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{recipeForm.id ? 'Editar Receita' : 'Nova Receita'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nome da Receita</Label>
                <Input
                  value={recipeForm.name}
                  onChange={(e) => setRecipeForm({ ...recipeForm, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Rendimento (Porções)</Label>
                  <Input
                    type="number"
                    value={recipeForm.yield}
                    onChange={(e) =>
                      setRecipeForm({ ...recipeForm, yield: Number(e.target.value) })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Perda na Produção (%)</Label>
                  <Input
                    type="number"
                    value={recipeForm.wasteFactor}
                    onChange={(e) =>
                      setRecipeForm({ ...recipeForm, wasteFactor: Number(e.target.value) })
                    }
                  />
                </div>
              </div>

              <div className="pt-4 border-t">
                <h4 className="font-medium text-slate-800 mb-2">Ingredientes</h4>
                <div className="space-y-2">
                  {recipeForm.items?.map((item, idx) => (
                    <div key={idx} className="flex gap-2 items-center bg-slate-50 p-2 rounded">
                      <Select
                        value={item.ingredientId}
                        onValueChange={(v) => {
                          const newItems = [...(recipeForm.items || [])]
                          newItems[idx].ingredientId = v
                          setRecipeForm({ ...recipeForm, items: newItems })
                        }}
                      >
                        <SelectTrigger className="flex-1 bg-white h-8 text-xs">
                          <SelectValue placeholder="Insumo" />
                        </SelectTrigger>
                        <SelectContent>
                          {ingredients.map((i) => (
                            <SelectItem key={i.id} value={i.id}>
                              {i.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        className="w-20 h-8 text-xs"
                        value={item.qty}
                        onChange={(e) => {
                          const newItems = [...(recipeForm.items || [])]
                          newItems[idx].qty = Number(e.target.value)
                          setRecipeForm({ ...recipeForm, items: newItems })
                        }}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500"
                        onClick={() => {
                          setRecipeForm({
                            ...recipeForm,
                            items: recipeForm.items?.filter((_, i) => i !== idx),
                          })
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => {
                      setRecipeForm({
                        ...recipeForm,
                        items: [
                          ...(recipeForm.items || []),
                          { ingredientId: ingredients[0].id, qty: 1 },
                        ],
                      })
                    }}
                  >
                    + Adicionar Insumo
                  </Button>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg border flex flex-col justify-between">
              <div>
                <h4 className="font-medium text-slate-800 mb-4 border-b pb-2">
                  Resumo de Custos (Tempo Real)
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Custo dos Insumos (c/ perdas)</span>
                    <span className="font-medium">
                      {formatCurrency(getDynamicCost() / (1 + (recipeForm.wasteFactor || 0) / 100))}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">
                      Perda de Montagem ({recipeForm.wasteFactor}%)
                    </span>
                    <span className="font-medium text-red-500">
                      +
                      {formatCurrency(
                        getDynamicCost() -
                          getDynamicCost() / (1 + (recipeForm.wasteFactor || 0) / 100),
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-base font-bold border-t pt-2 mt-2">
                    <span>Custo Total:</span>
                    <span>{formatCurrency(getDynamicCost())}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg border-2 border-indigo-100 shadow-sm mt-6 text-center">
                <p className="text-xs text-indigo-600 font-semibold mb-1">CUSTO UNITÁRIO FINAL</p>
                <p className="text-3xl font-black text-indigo-700">
                  {formatCurrency(getDynamicCost() / (recipeForm.yield || 1))}
                </p>
                <p className="text-[10px] text-slate-400 mt-1">porção</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveForm}>Salvar Receita</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
