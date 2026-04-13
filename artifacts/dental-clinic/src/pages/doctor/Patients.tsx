import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/lib/auth";
import { useListPatients, useListMedicalRecords } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Search, User as UserIcon, Calendar, Phone, Mail, Activity } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { format } from "date-fns";

export default function DoctorPatients() {
  const [search, setSearch] = useState("");
  const { data: patients } = useListPatients({ search });
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);

  const selectedPatient = patients?.find(p => p.id === selectedPatientId);
  const { data: records } = useListMedicalRecords(
    { patientId: selectedPatientId! },
    { query: { enabled: !!selectedPatientId } }
  );

  return (
    <DashboardLayout allowedRoles={["doctor"]}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-3xl font-bold tracking-tight">Patients Directory</h1>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search patients..."
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {patients?.length === 0 ? (
            <div className="col-span-full py-10 text-center text-muted-foreground">
              No patients found
            </div>
          ) : (
            patients?.map(patient => (
              <Card 
                key={patient.id} 
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => setSelectedPatientId(patient.id)}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <UserIcon className="h-5 w-5 text-primary" />
                    </div>
                    {patient.firstName} {patient.lastName}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      {patient.phone || "No phone"}
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Last visit: {patient.lastVisit ? format(new Date(patient.lastVisit), "MMM d, yyyy") : "Never"}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <Dialog open={!!selectedPatientId} onOpenChange={(open) => !open && setSelectedPatientId(null)}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            {selectedPatient && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-2xl">{selectedPatient.firstName} {selectedPatient.lastName}</DialogTitle>
                  <DialogDescription>Patient Profile</DialogDescription>
                </DialogHeader>

                <div className="grid md:grid-cols-2 gap-6 mt-4">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <UserIcon className="h-5 w-5" /> Contact Info
                    </h3>
                    <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
                      <div className="flex gap-2"><Mail className="h-4 w-4" /> {selectedPatient.email}</div>
                      <div className="flex gap-2"><Phone className="h-4 w-4" /> {selectedPatient.phone || "N/A"}</div>
                      <div className="flex gap-2"><Calendar className="h-4 w-4" /> DOB: {selectedPatient.dateOfBirth || "N/A"}</div>
                    </div>

                    <h3 className="font-semibold text-lg flex items-center gap-2 mt-6">
                      <Activity className="h-5 w-5" /> Medical Details
                    </h3>
                    <div className="bg-muted p-4 rounded-lg space-y-4 text-sm">
                      <div>
                        <span className="font-semibold block mb-1">Medical History:</span>
                        <p>{selectedPatient.medicalHistory || "None recorded"}</p>
                      </div>
                      <div>
                        <span className="font-semibold block mb-1">Allergies:</span>
                        <p className="text-destructive font-medium">{selectedPatient.allergies || "None known"}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Past Medical Records</h3>
                    <div className="space-y-3">
                      {!records || records.length === 0 ? (
                        <p className="text-muted-foreground text-sm italic">No records found</p>
                      ) : (
                        records.map(record => (
                          <div key={record.id} className="border p-3 rounded-lg bg-card text-sm">
                            <div className="flex justify-between font-semibold mb-2">
                              <span>{format(new Date(record.createdAt), "MMM d, yyyy")}</span>
                              <span>Dr. {record.doctorName}</span>
                            </div>
                            <div className="space-y-1">
                              <p><span className="font-medium">Diagnosis:</span> {record.diagnosis}</p>
                              <p><span className="font-medium">Treatment:</span> {record.treatment}</p>
                              {record.toothNumber && <p><span className="font-medium">Tooth:</span> {record.toothNumber}</p>}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
