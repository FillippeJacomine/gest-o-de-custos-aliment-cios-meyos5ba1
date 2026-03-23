import { useState } from 'react'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAppStore, PrepTask } from '@/stores/useAppStore'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CheckCircle2, Circle, Plus, ChefHat, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export default function Production() {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const { recipes, prepTasks, addPrepTask, completePrepTask } = useAppStore()
  const { toast } = useToast()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newTask, setNewTask] = useState<Partial<PrepTask>>({ quantity: 1 })

  const dateStr = date ? format(date, 'yyyy-MM-dd') : ''
  const dailyTasks = prepTasks.filter((t) => t.date === dateStr)

  const handleComplete = (id: string) => {
    completePrepTask(id)
    toast({
      title: 'Tarefa concluída',
      description: 'Ingredientes descontados do estoque com sucesso.',
    })
  }

  const handleAutoSuggest = () => {
    if (!dateStr) return
    if (dailyTasks.length > 0)
      return toast({
        title: 'Lista já existe',
        description: 'Você já possui tarefas agendadas para hoje.',
      })

    // Mock suggestion based on recipes
    const suggestions = recipes.slice(0, 3).map((r, idx) => ({
      recipeId: r.id,
      date: dateStr,
      quantity: (idx + 1) * 2,
      status: 'pending' as const,
    }))
    suggestions.forEach((s) => addPrepTask(s))
    toast({
      title: 'Fila gerada',
      description: 'Sugestões baseadas no histórico de vendas estimadas criadas.',
    })
  }

  const handleSaveTask = () => {
    if (newTask.recipeId && newTask.quantity && dateStr) {
      addPrepTask({
        recipeId: newTask.recipeId,
        quantity: newTask.quantity,
        date: dateStr,
        status: 'pending',
      })
      setIsDialogOpen(false)
      setNewTask({ quantity: 1 })
      toast({ title: 'Tarefa adicionada' })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <ChefHat className="h-6 w-6 text-indigo-500" /> Calendário de Produção
        </h1>
        <p className="text-slate-500 text-sm">
          Acompanhe suas tarefas diárias de preparo e deduza ingredientes automaticamente ao
          concluir.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-5 xl:col-span-4 h-fit">
          <CardContent className="p-4 flex justify-center">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md border shadow-sm w-fit bg-white"
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-7 xl:col-span-8">
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b gap-4">
            <div>
              <CardTitle className="text-lg">
                Fila de Preparo:{' '}
                <span className="text-indigo-600">
                  {date ? format(date, "dd 'de' MMMM", { locale: ptBR }) : ''}
                </span>
              </CardTitle>
              <CardDescription>{dailyTasks.length} tarefas agendadas para este dia</CardDescription>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={handleAutoSuggest}
                className="flex-1 sm:flex-none text-amber-600 border-amber-200 hover:bg-amber-50"
              >
                <Sparkles className="h-4 w-4 mr-2" /> Sugerir Fila
              </Button>
              <Button
                size="sm"
                onClick={() => setIsDialogOpen(true)}
                className="flex-1 sm:flex-none bg-indigo-600 hover:bg-indigo-700"
              >
                <Plus className="h-4 w-4 mr-2" /> Adicionar
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            {dailyTasks.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-lg text-slate-400 flex flex-col items-center">
                <ChefHat className="h-8 w-8 mb-2 opacity-50" />
                <p>Nenhuma tarefa programada para este dia.</p>
                <p className="text-xs mt-1">Use a sugestão automática ou adicione manualmente.</p>
              </div>
            ) : (
              dailyTasks.map((task) => {
                const recipe = recipes.find((r) => r.id === task.recipeId)
                const isCompleted = task.status === 'completed'
                return (
                  <div
                    key={task.id}
                    className={cn(
                      'flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 rounded-lg border gap-3 transition-all',
                      isCompleted
                        ? 'bg-slate-50 border-slate-200 opacity-70'
                        : 'bg-white border-slate-200 shadow-sm hover:border-indigo-200 hover:shadow-md',
                    )}
                  >
                    <div className="flex items-start sm:items-center gap-3">
                      <button
                        onClick={() => !isCompleted && handleComplete(task.id)}
                        disabled={isCompleted}
                        className={cn(
                          'transition-colors mt-0.5 sm:mt-0',
                          isCompleted
                            ? 'text-emerald-500 cursor-not-allowed'
                            : 'text-slate-300 hover:text-emerald-500',
                        )}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="h-6 w-6" />
                        ) : (
                          <Circle className="h-6 w-6" />
                        )}
                      </button>
                      <div>
                        <p
                          className={cn(
                            'font-medium',
                            isCompleted ? 'text-slate-500 line-through' : 'text-slate-800',
                          )}
                        >
                          Preparar: {recipe?.name}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Quantidade:{' '}
                          <span className="font-semibold text-slate-700">
                            {task.quantity} porções
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-end pl-9 sm:pl-0">
                      {isCompleted ? (
                        <Badge
                          variant="secondary"
                          className="bg-emerald-50 text-emerald-600 border-emerald-200"
                        >
                          Concluído
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-amber-600 border-amber-200 bg-amber-50"
                        >
                          Pendente
                        </Badge>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Adicionar Tarefa de Preparo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Receita / Preparo</Label>
              <Select
                value={newTask.recipeId}
                onValueChange={(v) => setNewTask({ ...newTask, recipeId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a receita..." />
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
            <div className="space-y-2">
              <Label>Quantidade a Preparar (Porções)</Label>
              <Input
                type="number"
                min="1"
                value={newTask.quantity}
                onChange={(e) => setNewTask({ ...newTask, quantity: Number(e.target.value) })}
              />
              <p className="text-[10px] text-slate-500">
                Esta quantidade multiplicará o consumo na dedução do estoque.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveTask}>Agendar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
