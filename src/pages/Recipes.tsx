import { useAppStore } from '@/stores/useAppStore'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/format'
import { Plus, ChefHat, Scale } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Recipes() {
  const { recipes, getRecipeCost } = useAppStore()

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Fichas Técnicas</h1>
          <p className="text-slate-500 text-sm">
            Gerencie o rendimento e custo de produção das suas receitas.
          </p>
        </div>
        <Button className="shadow-md">
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
              <div className="h-40 overflow-hidden relative">
                <img
                  src={recipe.image}
                  alt={recipe.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                  <Badge className="bg-white/20 text-white backdrop-blur-md border-none">
                    {recipe.category}
                  </Badge>
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
                    <span className="font-bold text-lg text-primary price-ticker">
                      {formatCurrency(unitCost)}
                    </span>
                  </div>
                </div>

                <div className="mt-6">
                  <Link to="/pricing">
                    <Button
                      variant="outline"
                      className="w-full text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                    >
                      Precificar Produto
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
