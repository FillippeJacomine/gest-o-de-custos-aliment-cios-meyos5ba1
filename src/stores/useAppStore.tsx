import { createContext, useContext, useState, ReactNode, useMemo } from 'react'
import { getConversionFactor } from '@/lib/units'

export type SupplierPrice = {
  supplierId: string
  price: number
  date: string
}

export type Ingredient = {
  id: string
  name: string
  category: string
  unit: string
  cost: number
  history: number[]
  lastUpdated: string
  stock: number
  minStock: number
  wasteFactor: number
  supplierHistory: SupplierPrice[]
}

export type Supplier = {
  id: string
  name: string
  contact: string
  document: string
}

export type RecipeItem = { ingredientId: string; qty: number; unit?: string }
export type Recipe = {
  id: string
  name: string
  category: string
  yield: number
  wasteFactor: number
  image: string
  items: RecipeItem[]
}

export type OCRResultItem = {
  id: string
  rawName: string
  qty: number
  unitPrice: number
  totalPrice: number
  uom: string
}

export type Sale = {
  id: string
  recipeId: string
  channel: string
  quantity: number
  revenue: number
}

export type FixedCosts = {
  rent: number
  energy: number
  gas: number
  labor: number
}

export type PaymentTerminal = {
  id: string
  name: string
  debit: number
  credit: number
  installments: number
}

export type PrepTask = {
  id: string
  recipeId: string
  date: string
  quantity: number
  status: 'pending' | 'completed'
}

type StoreContextType = {
  ingredients: Ingredient[]
  recipes: Recipe[]
  sales: Sale[]
  fixedCosts: FixedCosts
  suppliers: Supplier[]
  paymentTerminals: PaymentTerminal[]
  prepTasks: PrepTask[]
  updateIngredientPrice: (id: string, newCost: number) => void
  updateIngredientStock: (id: string, adjustment: number) => void
  getRecipeCost: (recipe: Recipe) => number
  simulateOCR: () => Promise<OCRResultItem[]>
  commitOCRData: (updates: { ingredientId: string; newCost: number; addedStock: number }[]) => void
  addSale: (sale: Omit<Sale, 'id'>) => void
  updateFixedCosts: (costs: Partial<FixedCosts>) => void
  addSupplier: (s: Omit<Supplier, 'id'>) => void
  updateSupplier: (id: string, s: Partial<Supplier>) => void
  deleteSupplier: (id: string) => void
  addRecipe: (r: Omit<Recipe, 'id'>) => void
  updateRecipe: (id: string, r: Partial<Recipe>) => void
  deleteRecipe: (id: string) => void
  addPaymentTerminal: (p: Omit<PaymentTerminal, 'id'>) => void
  addPrepTask: (t: Omit<PrepTask, 'id'>) => void
  completePrepTask: (id: string) => void
}

const initialSuppliers: Supplier[] = [
  {
    id: '1',
    name: 'Atacadão Alimentos',
    contact: '(11) 99999-9999',
    document: '11.111.111/0001-11',
  },
  { id: '2', name: 'Distribuidora Z', contact: '(11) 88888-8888', document: '22.222.222/0001-22' },
]

const initialIngredients: Ingredient[] = [
  {
    id: '1',
    name: 'Farinha de Trigo',
    category: 'Secos',
    unit: 'kg',
    cost: 4.5,
    history: [3.8, 4.0, 4.2, 4.5, 4.5, 4.5],
    lastUpdated: '2023-10-25',
    stock: 8, // Below minStock for shopping list test
    minStock: 10,
    wasteFactor: 2,
    supplierHistory: [{ supplierId: '1', price: 4.5, date: '2023-10-25' }],
  },
  {
    id: '2',
    name: 'Açúcar Refinado',
    category: 'Secos',
    unit: 'kg',
    cost: 3.2,
    history: [3.0, 3.1, 3.2, 3.2, 3.1, 3.2],
    lastUpdated: '2023-10-20',
    stock: 15,
    minStock: 5,
    wasteFactor: 0,
    supplierHistory: [{ supplierId: '1', price: 3.2, date: '2023-10-20' }],
  },
  {
    id: '3',
    name: 'Chocolate 50%',
    category: 'Doces',
    unit: 'kg',
    cost: 35.0,
    history: [30, 31, 32, 34, 35, 35],
    lastUpdated: '2023-10-22',
    stock: 1.5, // Below minStock
    minStock: 2,
    wasteFactor: 5,
    supplierHistory: [{ supplierId: '2', price: 35.0, date: '2023-10-22' }],
  },
  {
    id: '4',
    name: 'Ovo Branco',
    category: 'Refrigerados',
    unit: 'un',
    cost: 0.8,
    history: [0.6, 0.65, 0.7, 0.75, 0.75, 0.8],
    lastUpdated: '2023-10-26',
    stock: 12,
    minStock: 30,
    wasteFactor: 12,
    supplierHistory: [],
  },
  {
    id: '5',
    name: 'Manteiga',
    category: 'Refrigerados',
    unit: 'kg',
    cost: 42.0,
    history: [38, 39, 40, 41, 42, 42],
    lastUpdated: '2023-10-26',
    stock: 4.5,
    minStock: 2,
    wasteFactor: 3,
    supplierHistory: [],
  },
  {
    id: '6',
    name: 'Cebola',
    category: 'Hortifruti',
    unit: 'kg',
    cost: 6.5,
    history: [5.0, 5.5, 6.0, 6.5],
    lastUpdated: '2023-10-26',
    stock: 5.0,
    minStock: 2,
    wasteFactor: 20,
    supplierHistory: [],
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
      { ingredientId: '1', qty: 200, unit: 'g' },
      { ingredientId: '2', qty: 300, unit: 'g' },
      { ingredientId: '3', qty: 400, unit: 'g' },
      { ingredientId: '4', qty: 4, unit: 'un' },
      { ingredientId: '5', qty: 200, unit: 'g' },
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
      { ingredientId: '1', qty: 300, unit: 'g' },
      { ingredientId: '2', qty: 250, unit: 'g' },
      { ingredientId: '4', qty: 3, unit: 'un' },
    ],
  },
]

const initialSales: Sale[] = [
  { id: 's1', recipeId: '1', channel: 'LOCAL', quantity: 150, revenue: 2250 },
  { id: 's2', recipeId: '1', channel: 'IFOOD_DELIVERY', quantity: 80, revenue: 1600 },
  { id: 's3', recipeId: '2', channel: 'LOCAL', quantity: 45, revenue: 540 },
  { id: 's4', recipeId: '2', channel: 'IFOOD_BASIC', quantity: 30, revenue: 420 },
]

const initialTerminals: PaymentTerminal[] = [
  { id: 't1', name: 'Stone Principal', debit: 1.25, credit: 3.1, installments: 4.5 },
  { id: 't2', name: 'Cielo Loja', debit: 1.5, credit: 3.8, installments: 5.0 },
]

const AppContext = createContext<StoreContextType | null>(null)

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [ingredients, setIngredients] = useState<Ingredient[]>(initialIngredients)
  const [recipes, setRecipes] = useState<Recipe[]>(initialRecipes)
  const [sales, setSales] = useState<Sale[]>(initialSales)
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers)
  const [paymentTerminals, setPaymentTerminals] = useState<PaymentTerminal[]>(initialTerminals)
  const [prepTasks, setPrepTasks] = useState<PrepTask[]>([])
  const [fixedCosts, setFixedCosts] = useState<FixedCosts>({
    rent: 1200,
    energy: 350,
    gas: 150,
    labor: 2000,
  })

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

  const updateIngredientStock = (id: string, adjustment: number) => {
    setIngredients((prev) =>
      prev.map((ing) =>
        ing.id === id ? { ...ing, stock: Math.max(0, ing.stock + adjustment) } : ing,
      ),
    )
  }

  const simulateOCR = async () => {
    return new Promise<OCRResultItem[]>((resolve) => {
      setTimeout(() => {
        resolve([
          {
            id: 'ocr1',
            rawName: 'CHOCOLATE 50% CACAU 1KG',
            qty: 2,
            unitPrice: 38.5,
            totalPrice: 77.0,
            uom: 'kg',
          },
          {
            id: 'ocr2',
            rawName: 'FARINHA DE TRIGO 5KG',
            qty: 1,
            unitPrice: 24.0,
            totalPrice: 24.0,
            uom: 'un',
          },
        ])
      }, 1500)
    })
  }

  const commitOCRData = (
    updates: { ingredientId: string; newCost: number; addedStock: number }[],
  ) => {
    setIngredients((prev) =>
      prev.map((ing) => {
        const update = updates.find((u) => u.ingredientId === ing.id)
        if (update) {
          return {
            ...ing,
            cost: update.newCost,
            stock: ing.stock + update.addedStock,
            lastUpdated: new Date().toISOString().split('T')[0],
            history: [...ing.history, update.newCost].slice(-6),
          }
        }
        return ing
      }),
    )
  }

  const getRecipeCost = useMemo(
    () => (recipe: Recipe) => {
      let total = 0
      recipe.items.forEach((item) => {
        const ing = ingredients.find((i) => i.id === item.ingredientId)
        if (ing) {
          const factor = getConversionFactor(ing.unit, item.unit || ing.unit)
          const effectiveCost = ing.cost * (1 + (ing.wasteFactor || 0) / 100)
          total += effectiveCost * item.qty * factor
        }
      })
      return total * (1 + (recipe.wasteFactor || 0) / 100)
    },
    [ingredients],
  )

  const addSale = (sale: Omit<Sale, 'id'>) => {
    const recipe = recipes.find((r) => r.id === sale.recipeId)
    if (recipe) {
      const yieldRatio = sale.quantity / recipe.yield
      setIngredients((prev) =>
        prev.map((ing) => {
          const item = recipe.items.find((i) => i.ingredientId === ing.id)
          if (item) {
            const factor = getConversionFactor(ing.unit, item.unit || ing.unit)
            const consumed = item.qty * factor * yieldRatio * (1 + recipe.wasteFactor / 100)
            return { ...ing, stock: Math.max(0, ing.stock - consumed) }
          }
          return ing
        }),
      )
    }
    setSales((prev) => [...prev, { ...sale, id: Math.random().toString(36).substring(2, 9) }])
  }

  const updateFixedCosts = (costs: Partial<FixedCosts>) => {
    setFixedCosts((prev) => ({ ...prev, ...costs }))
  }

  const addSupplier = (s: Omit<Supplier, 'id'>) => {
    setSuppliers((prev) => [...prev, { ...s, id: Math.random().toString(36).substring(2, 9) }])
  }

  const updateSupplier = (id: string, s: Partial<Supplier>) => {
    setSuppliers((prev) => prev.map((sup) => (sup.id === id ? { ...sup, ...s } : sup)))
  }

  const deleteSupplier = (id: string) => {
    setSuppliers((prev) => prev.filter((sup) => sup.id !== id))
  }

  const addRecipe = (r: Omit<Recipe, 'id'>) => {
    setRecipes((prev) => [...prev, { ...r, id: Math.random().toString(36).substring(2, 9) }])
  }

  const updateRecipe = (id: string, r: Partial<Recipe>) => {
    setRecipes((prev) => prev.map((rcp) => (rcp.id === id ? { ...rcp, ...r } : rcp)))
  }

  const deleteRecipe = (id: string) => {
    setRecipes((prev) => prev.filter((rcp) => rcp.id !== id))
  }

  const addPaymentTerminal = (p: Omit<PaymentTerminal, 'id'>) => {
    setPaymentTerminals((prev) => [
      ...prev,
      { ...p, id: Math.random().toString(36).substring(2, 9) },
    ])
  }

  const addPrepTask = (t: Omit<PrepTask, 'id'>) => {
    setPrepTasks((prev) => [...prev, { ...t, id: Math.random().toString(36).substring(2, 9) }])
  }

  const completePrepTask = (id: string) => {
    const task = prepTasks.find((t) => t.id === id)
    if (!task || task.status === 'completed') return

    setPrepTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status: 'completed' } : t)))

    const recipe = recipes.find((r) => r.id === task.recipeId)
    if (recipe) {
      const multiplier = task.quantity / recipe.yield
      setIngredients((prev) =>
        prev.map((ing) => {
          const item = recipe.items.find((i) => i.ingredientId === ing.id)
          if (item) {
            const factor = getConversionFactor(ing.unit, item.unit || ing.unit)
            const consumed = item.qty * factor * multiplier * (1 + recipe.wasteFactor / 100)
            return { ...ing, stock: Math.max(0, ing.stock - consumed) }
          }
          return ing
        }),
      )
    }
  }

  return (
    <AppContext.Provider
      value={{
        ingredients,
        recipes,
        sales,
        fixedCosts,
        suppliers,
        paymentTerminals,
        prepTasks,
        updateIngredientPrice,
        updateIngredientStock,
        getRecipeCost,
        simulateOCR,
        commitOCRData,
        addSale,
        updateFixedCosts,
        addSupplier,
        updateSupplier,
        deleteSupplier,
        addRecipe,
        updateRecipe,
        deleteRecipe,
        addPaymentTerminal,
        addPrepTask,
        completePrepTask,
      }}
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
