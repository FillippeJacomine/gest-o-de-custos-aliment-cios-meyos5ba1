import { useState } from 'react'
import { useAppStore, Supplier } from '@/stores/useAppStore'
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Plus, Edit, Trash, Search, Truck } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function Suppliers() {
  const { suppliers, addSupplier, updateSupplier, deleteSupplier } = useAppStore()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Partial<Supplier> | null>(null)

  const filteredSuppliers = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.document.includes(searchTerm),
  )

  const handleOpenDialog = (supplier?: Supplier) => {
    setEditingSupplier(supplier ? { ...supplier } : { name: '', contact: '', document: '' })
    setIsDialogOpen(true)
  }

  const handleSave = () => {
    if (editingSupplier?.name && editingSupplier.contact) {
      if (editingSupplier.id) {
        updateSupplier(editingSupplier.id, editingSupplier)
        toast({ title: 'Fornecedor atualizado' })
      } else {
        addSupplier(editingSupplier as Omit<Supplier, 'id'>)
        toast({ title: 'Fornecedor cadastrado' })
      }
      setIsDialogOpen(false)
    }
  }

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este fornecedor?')) {
      deleteSupplier(id)
      toast({ title: 'Fornecedor excluído', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Truck className="h-6 w-6 text-indigo-500" /> Gestão de Fornecedores
          </h1>
          <p className="text-slate-500 text-sm">
            Cadastre seus parceiros comerciais e monitore históricos de preços.
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="shadow-md">
          <Plus className="mr-2 h-4 w-4" /> Novo Fornecedor
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="p-4 border-b relative max-w-sm">
            <Search className="absolute left-7 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar fornecedor..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead>Nome Fantasia</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>CNPJ / CPF</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSuppliers.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium text-slate-700">{s.name}</TableCell>
                  <TableCell>{s.contact}</TableCell>
                  <TableCell>{s.document}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(s)}>
                      <Edit className="h-4 w-4 text-blue-500" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(s.id)}>
                      <Trash className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredSuppliers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-6 text-slate-400">
                    Nenhum fornecedor encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingSupplier?.id ? 'Editar Fornecedor' : 'Novo Fornecedor'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome Fantasia</Label>
              <Input
                value={editingSupplier?.name || ''}
                onChange={(e) => setEditingSupplier({ ...editingSupplier, name: e.target.value })}
                placeholder="Ex: Atacadão Alimentos"
              />
            </div>
            <div className="space-y-2">
              <Label>Contato (Telefone/Email)</Label>
              <Input
                value={editingSupplier?.contact || ''}
                onChange={(e) =>
                  setEditingSupplier({ ...editingSupplier, contact: e.target.value })
                }
                placeholder="Ex: (11) 90000-0000"
              />
            </div>
            <div className="space-y-2">
              <Label>CNPJ / CPF</Label>
              <Input
                value={editingSupplier?.document || ''}
                onChange={(e) =>
                  setEditingSupplier({ ...editingSupplier, document: e.target.value })
                }
                placeholder="00.000.000/0001-00"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
