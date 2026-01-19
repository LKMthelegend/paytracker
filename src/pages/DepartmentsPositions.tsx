import { useState, useEffect } from "react";
import { useDepartments, useAddDepartment, useUpdateDepartment, useDeleteDepartment } from "@/hooks/useDepartments";
import { usePositions, useAddPosition, useUpdatePosition, useDeletePosition } from "@/hooks/usePositions";
import { Department, Position } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit2, Trash2, Building2, Briefcase } from "lucide-react";

export default function DepartmentsAndPositions() {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Initialize after component mount
    setIsInitialized(true);
  }, []);

  const { data: departments = [], isLoading: depsLoading } = useDepartments();
  const { data: positions = [], isLoading: posLoading } = usePositions();
  
  const addDepartment = useAddDepartment();
  const updateDepartment = useUpdateDepartment();
  const deleteDepartment = useDeleteDepartment();
  
  const addPosition = useAddPosition();
  const updatePosition = useUpdatePosition();
  const deletePosition = useDeletePosition();

  // Department form states
  const [deptFormOpen, setDeptFormOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [deptForm, setDeptForm] = useState({ name: "", description: "" });
  const [deptToDelete, setDeptToDelete] = useState<Department | null>(null);

  // Position form states
  const [posFormOpen, setPosFormOpen] = useState(false);
  const [editingPos, setEditingPos] = useState<Position | null>(null);
  const [posForm, setPosForm] = useState({ name: "", department: "", description: "" });
  const [posToDelete, setPosToDelete] = useState<Position | null>(null);

  // Department handlers
  const handleAddDept = () => {
    setEditingDept(null);
    setDeptForm({ name: "", description: "" });
    setDeptFormOpen(true);
  };

  const handleEditDept = (dept: Department) => {
    setEditingDept(dept);
    setDeptForm({ name: dept.name, description: dept.description || "" });
    setDeptFormOpen(true);
  };

  const handleSaveDept = async () => {
    if (!deptForm.name.trim()) return;
    
    if (editingDept) {
      await updateDepartment.mutateAsync({
        id: editingDept.id,
        name: deptForm.name,
        description: deptForm.description || undefined,
      });
    } else {
      await addDepartment.mutateAsync({
        name: deptForm.name,
        description: deptForm.description || undefined,
      });
    }
    setDeptFormOpen(false);
  };

  // Position handlers
  const handleAddPos = () => {
    setEditingPos(null);
    setPosForm({ name: "", department: "", description: "" });
    setPosFormOpen(true);
  };

  const handleEditPos = (pos: Position) => {
    setEditingPos(pos);
    setPosForm({ name: pos.name, department: pos.department, description: pos.description || "" });
    setPosFormOpen(true);
  };

  const handleSavePos = async () => {
    if (!posForm.name.trim() || !posForm.department.trim()) return;
    
    if (editingPos) {
      await updatePosition.mutateAsync({
        id: editingPos.id,
        name: posForm.name,
        department: posForm.department,
        description: posForm.description || undefined,
      });
    } else {
      await addPosition.mutateAsync({
        name: posForm.name,
        department: posForm.department,
        description: posForm.description || undefined,
      });
    }
    setPosFormOpen(false);
  };

  const getPositionsCountForDept = (deptId: string) => {
    return positions.filter(p => p.department === deptId).length;
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Gestion des Départements et Postes</h1>
        <p className="text-muted-foreground mt-2">
          Gérez les départements et les postes de votre organisation
        </p>
      </div>

      <Tabs defaultValue="departments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="departments" className="flex gap-2">
            <Building2 className="w-4 h-4" />
            Départements
          </TabsTrigger>
          <TabsTrigger value="positions" className="flex gap-2">
            <Briefcase className="w-4 h-4" />
            Postes
          </TabsTrigger>
        </TabsList>

        {/* Departments Tab */}
        <TabsContent value="departments" className="space-y-4">
          <Button onClick={handleAddDept} className="gap-2">
            <Plus className="w-4 h-4" />
            Ajouter un département
          </Button>

          {depsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
          ) : departments.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Aucun département créé. Commencez par ajouter un département.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {departments.map(dept => (
                <Card key={dept.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{dept.name}</CardTitle>
                        <CardDescription>{dept.description}</CardDescription>
                      </div>
                      <Badge variant="secondary">
                        {getPositionsCountForDept(dept.id)} postes
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditDept(dept)}
                        className="flex-1 gap-1"
                      >
                        <Edit2 className="w-4 h-4" />
                        Modifier
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeptToDelete(dept)}
                        className="flex-1 gap-1 text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                        Supprimer
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Positions Tab */}
        <TabsContent value="positions" className="space-y-4">
          <Button onClick={handleAddPos} className="gap-2">
            <Plus className="w-4 h-4" />
            Ajouter un poste
          </Button>

          {posLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : positions.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Aucun poste créé. Commencez par ajouter un poste.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {positions.map(pos => {
                const dept = departments.find(d => d.id === pos.department);
                return (
                  <Card key={pos.id} className="hover:shadow-sm transition-shadow">
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{pos.name}</h3>
                            <Badge variant="outline">{dept?.name}</Badge>
                          </div>
                          {pos.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {pos.description}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditPos(pos)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setPosToDelete(pos)}
                            className="text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Department Form Dialog */}
      <Dialog open={deptFormOpen} onOpenChange={setDeptFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingDept ? "Modifier le département" : "Ajouter un département"}
            </DialogTitle>
            <DialogDescription>
              Entrez les informations du département
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nom *</label>
              <Input
                value={deptForm.name}
                onChange={e => setDeptForm({ ...deptForm, name: e.target.value })}
                placeholder="Ex: Ressources Humaines"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={deptForm.description}
                onChange={e => setDeptForm({ ...deptForm, description: e.target.value })}
                placeholder="Description du département..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeptFormOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleSaveDept}
              disabled={addDepartment.isPending || updateDepartment.isPending}
            >
              {addDepartment.isPending || updateDepartment.isPending ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Position Form Dialog */}
      <Dialog open={posFormOpen} onOpenChange={setPosFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingPos ? "Modifier le poste" : "Ajouter un poste"}
            </DialogTitle>
            <DialogDescription>
              Entrez les informations du poste
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nom du poste *</label>
              <Input
                value={posForm.name}
                onChange={e => setPosForm({ ...posForm, name: e.target.value })}
                placeholder="Ex: Manager RH"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Département *</label>
              <Select value={posForm.department} onValueChange={value => setPosForm({ ...posForm, department: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un département" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map(dept => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={posForm.description}
                onChange={e => setPosForm({ ...posForm, description: e.target.value })}
                placeholder="Description du poste..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPosFormOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleSavePos}
              disabled={addPosition.isPending || updatePosition.isPending}
            >
              {addPosition.isPending || updatePosition.isPending ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Department Dialog */}
      <AlertDialog open={!!deptToDelete} onOpenChange={() => setDeptToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le département</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer "{deptToDelete?.name}" ?
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deptToDelete) {
                  deleteDepartment.mutateAsync(deptToDelete.id);
                  setDeptToDelete(null);
                }
              }}
              className="bg-destructive text-destructive-foreground"
            >
              Supprimer
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Position Dialog */}
      <AlertDialog open={!!posToDelete} onOpenChange={() => setPosToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le poste</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer "{posToDelete?.name}" ?
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (posToDelete) {
                  deletePosition.mutateAsync(posToDelete.id);
                  setPosToDelete(null);
                }
              }}
              className="bg-destructive text-destructive-foreground"
            >
              Supprimer
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
