import { createContext, useContext, useState, ReactNode, useMemo } from 'react'

export type Ingredient = {
  id: string
  name: string
  category: string
  unit: string
  cost: number
  history: number[]
  lastUpdated: string
}
export type RecipeItem = { ingredientId: string; qty: number }
export type Recipe = {
  id: string
  name: string
  category: string
  yield: number
  wasteFactor: number
  image: string
  items: RecipeItem[]
}

type StoreContextType = {
  ingredients: Ingredient[]
  recipes: Recipe[]
  updateIngredientPrice: (id: string, newCost: number) => void
  getRecipeCost: (recipe: Recipe) => number
  simulateOCR: () => Promise<void>
}

const initialIngredients: Ingredient[] = [
  {
    id: '1',
    name: 'Farinha de Trigo',
    category: 'Secos',
    unit: 'kg',
    cost: 4.5,
    history: [3.8, 4.0, 4.2, 4.5, 4.5, 4.5],
    lastUpdated: '2023-10-25',
  },
  {
    id: '2',
    name: 'Açúcar Refinado',
    category: 'Secos',
    unit: 'kg',
    cost: 3.2,
    history: [3.0, 3.1, 3.2, 3.2, 3.1, 3.2],
    lastUpdated: '2023-10-20',
  },
  {
    id: '3',
    name: 'Chocolate 50%',
    category: 'Doces',
    unit: 'kg',
    cost: 35.0,
    history: [30, 31, 32, 34, 35, 35],
    lastUpdated: '2023-10-22',
  },
  {
    id: '4',
    name: 'Ovo Branco',
    category: 'Refrigerados',
    unit: 'un',
    cost: 0.8,
    history: [0.6, 0.65, 0.7, 0.75, 0.75, 0.8],
    lastUpdated: '2023-10-26',
  },
  {
    id: '5',
    name: 'Manteiga',
    category: 'Refrigerados',
    unit: 'kg',
    cost: 42.0,
    history: [38, 39, 40, 41, 42, 42],
    lastUpdated: '2023-10-26',
  },
]

const initialRecipes: Recipe[] = [
  {
    id: '1',
    name: 'Brownie Tradicional',
    category: 'Sobremesas',
    yield: 12,
    wasteFactor: 5,
    image: 'https://img.usecurling.com/p/200/200?q=brownie',
    items: [
      { ingredientId: '1', qty: 0.2 },
      { ingredientId: '2', qty: 0.3 },
      { ingredientId: '3', qty: 0.4 },
      { ingredientId: '4', qty: 4 },
      { ingredientId: '5', qty: 0.2 },
    ],
  },
  {
    id: '2',
    name: 'Bolo de Cenoura',
    category: 'Bolos',
    yield: 10,
    wasteFactor: 2,
    image: 'https://img.usecurling.com/p/200/200?q=carrot%20cake',
    items: [
      { ingredientId: '1', qty: 0.3 },
      { ingredientId: '2', qty: 0.25 },
      { ingredientId: '4', qty: 3 },
    ],
  },
]

const AppContext = createContext<StoreContextType | null>(null)

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [ingredients, setIngredients] = useState<Ingredient[]>(initialIngredients)
  const [recipes] = useState<Recipe[]>(initialRecipes)

  const updateIngredientPrice = (id: string, newCost: number) => {
    setIngredients((prev) =>
      prev.map((ing) => {
        if (ing.id === id) {
          return {
            ...ing,
            cost: newCost,
            lastUpdated: new Date().toISOString().split('T')[0],
            history: [...ing.history.slice(1), newCost],
          }
        }
        return ing
      }),
    )
  }

  const simulateOCR = async () => {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        updateIngredientPrice('3', 38.5) // Simulate Chocolate price increase
        updateIngredientPrice('1', 4.8) // Simulate Flour price increase
        resolve()
      }, 1500)
    })
  }

  const getRecipeCost = useMemo(
    () => (recipe: Recipe) => {
      let total = 0
      recipe.items.forEach((item) => {
        const ing = ingredients.find((i) => i.id === item.ingredientId)
        if (ing) total += ing.cost * item.qty
      })
      return total * (1 + recipe.wasteFactor / 100)
    },
    [ingredients],
  )

  return (
    <AppContext.Provider
      value={{ ingredients, recipes, updateIngredientPrice, getRecipeCost, simulateOCR }}
    >
      {children}
    </AppContext.Provider>
  )
}

export const useAppStore = () => {
  const context = useContext(AppContext)
  if (!context) throw new Error('useAppStore must be used within AppProvider')
  return context
}
