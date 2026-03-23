import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import Layout from '@/components/Layout'
import Index from '@/pages/Index'
import Ingredients from '@/pages/Ingredients'
import Suppliers from '@/pages/Suppliers'
import Recipes from '@/pages/Recipes'
import Production from '@/pages/Production'
import Pricing from '@/pages/Pricing'
import Reports from '@/pages/Reports'
import Simulator from '@/pages/Simulator'
import NotFound from '@/pages/NotFound'
import { AppProvider } from '@/stores/useAppStore'

const App = () => (
  <BrowserRouter future={{ v7_startTransition: false, v7_relativeSplatPath: false }}>
    <AppProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Index />} />
            <Route path="/ingredients" element={<Ingredients />} />
            <Route path="/suppliers" element={<Suppliers />} />
            <Route path="/recipes" element={<Recipes />} />
            <Route path="/production" element={<Production />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/simulator" element={<Simulator />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </AppProvider>
  </BrowserRouter>
)

export default App
