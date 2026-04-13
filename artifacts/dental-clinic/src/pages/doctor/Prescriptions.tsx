import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useListPrescriptions, useListMedications, useCreatePrescription, useListPatients } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Trash2, Pill, Printer } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function DoctorPrescriptions() {
  const { data: prescriptions, refetch } = useListPrescriptions();
  const { data: patients } = useListPatients();
  const [medSearch, setMedSearch] = useState("");
  const { data: medications } = useListMedications({ search: medSearch });
  const createPrescription = useCreatePrescription();
  const { toast } = useToast();

  const [isCreating, setIsCreating] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<{
    medicationName: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
  }[]>([]);

  const handleAddMedication = (medName: string) => {
    setItems([...items, { medicationName: medName, dosage: "", frequency: "", duration: "", instructions: "" }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleUpdateItem = (index: number, field: string, value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleSubmit = async () => {
    if (!selectedPatientId || items.length === 0) {
      toast({ title: "Validation Error", description: "Select patient and add at least one medication", variant: "destructive" });
      return;
    }

    try {
      await createPrescription.mutateAsync({
        data: {
          patientId: Number(selectedPatientId),
          items,
          notes
        }
      });
      toast({ title: "Prescription created" });
      setIsCreating(false);
      setSelectedPatientId("");
      setNotes("");
      setItems([]);
      refetch();
    } catch (error: any) {
      toast({ title: "Failed to create", description: error.message, variant: "destructive" });
    }
  };

  return (
    <DashboardLayout allowedRoles={["doctor"]}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-3xl font-bold tracking-tight">Prescriptions</h1>
          
          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" /> New Prescription</Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Smart Prescription</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6 pt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Patient</label>
                  <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Search patient..." />
                    </SelectTrigger>
                    <SelectContent>
                      {patients?.map(p => (
                        <SelectItem key={p.id} value={p.id.toString()}>
                          {p.firstName} {p.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="border rounded-lg p-4 bg-muted/30">
                  <div className="flex gap-2 items-center mb-4">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Search medications to add..." 
                      value={medSearch}
                      onChange={(e) => setMedSearch(e.target.value)}
                    />
                  </div>
                  {medSearch && medications && (
                    <div className="flex flex-wrap gap-2 mb-4 max-h-32 overflow-y-auto">
                      {medications.map(med => (
                        <Badge key={med.id} variant="secondary" className="cursor-pointer hover:bg-primary hover:text-primary-foreground" onClick={() => handleAddMedication(med.name)}>
                          + {med.name} ({med.strength})
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="space-y-4">
                    {items.map((item, idx) => (
                      <Card key={idx}>
                        <CardContent className="p-4 flex gap-4">
                          <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-2">
                            <div className="col-span-2 md:col-span-4 font-bold text-primary flex items-center gap-2">
                              <Pill className="h-4 w-4" /> {item.medicationName}
                            </div>
                            <Input placeholder="Dosage (e.g. 500mg)" value={item.dosage} onChange={e => handleUpdateItem(idx, "dosage", e.target.value)} />
                            <Input placeholder="Frequency (e.g. 2x/day)" value={item.frequency} onChange={e => handleUpdateItem(idx, "frequency", e.target.value)} />
                            <Input placeholder="Duration (e.g. 5 days)" value={item.duration} onChange={e => handleUpdateItem(idx, "duration", e.target.value)} />
                            <Input placeholder="Instructions (Optional)" value={item.instructions} onChange={e => handleUpdateItem(idx, "instructions", e.target.value)} />
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(idx)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Doctor's Notes</label>
                  <Textarea placeholder="Any additional notes..." value={notes} onChange={(e) => setNotes(e.target.value)} />
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSubmit} disabled={createPrescription.isPending}>
                    {createPrescription.isPending ? "Saving..." : "Save Prescription"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {prescriptions?.map(prescription => (
            <Card key={prescription.id}>
              <CardHeader className="pb-2 flex flex-row items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{prescription.patientName}</CardTitle>
                  <CardDescription>{format(new Date(prescription.createdAt), "MMM d, yyyy h:mm a")}</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => window.print()}>
                  <Printer className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm mt-2">
                  {prescription.items.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2 border-b last:border-0 pb-2 last:pb-0">
                      <Pill className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                      <div>
                        <span className="font-bold">{item.medicationName}</span>
                        <div className="text-muted-foreground">
                          {item.dosage} • {item.frequency} • {item.duration}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}

// Re-export Badge since we use it in line 96 without importing from ui/badge
import { Badge } from "@/components/ui/badge";
