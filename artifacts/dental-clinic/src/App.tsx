import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { AuthProvider } from "@/lib/auth";
import { I18nProvider } from "@/lib/i18n";
import { ThemeProvider } from "@/lib/theme";

import Landing from "@/pages/Landing";
import AboutUs from "@/pages/AboutUs";
import ServicesPage from "@/pages/Services";
import ReviewsPage from "@/pages/Reviews";
import ContactPage from "@/pages/Contact";
import NewsOffers from "@/pages/NewsOffers";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Profile from "@/pages/Profile";
import Chat from "@/pages/Chat";

import PatientDashboard from "@/pages/patient/Dashboard";
import PatientAppointments from "@/pages/patient/Appointments";
import PatientRecords from "@/pages/patient/Records";
import PatientPrescriptions from "@/pages/patient/Prescriptions";
import PatientReviews from "@/pages/patient/Reviews";

import DoctorDashboard from "@/pages/doctor/Dashboard";
import DoctorPatients from "@/pages/doctor/Patients";
import DoctorAppointments from "@/pages/doctor/Appointments";
import DoctorPrescriptions from "@/pages/doctor/Prescriptions";
import DoctorMedications from "@/pages/doctor/Medications";
import DoctorFinance from "@/pages/doctor/Finance";

import AdminDashboard from "@/pages/admin/Dashboard";
import AdminServices from "@/pages/admin/Services";
import AdminTeam from "@/pages/admin/Team";
import AdminAnnouncements from "@/pages/admin/Announcements";
import AdminPatients from "@/pages/admin/Patients";
import AdminSettings from "@/pages/admin/Settings";
import AdminPrescriptions from "@/pages/admin/Prescriptions";
import AdminFinance from "@/pages/admin/Finance";

import ReceptionistDashboard from "@/pages/receptionist/Dashboard";
import ReceptionistQueue from "@/pages/receptionist/Queue";
import ReceptionistBilling from "@/pages/receptionist/Billing";
import ReceptionistPatients from "@/pages/receptionist/Patients";
import ReceptionistSchedule from "@/pages/receptionist/Schedule";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,
      refetchOnWindowFocus: true,
      retry: 1,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/services" component={ServicesPage} />
      <Route path="/news" component={NewsOffers} />
      <Route path="/about" component={AboutUs} />
      <Route path="/reviews" component={ReviewsPage} />
      <Route path="/contact" component={ContactPage} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      
      <Route path="/patient/dashboard" component={PatientDashboard} />
      <Route path="/patient/appointments" component={PatientAppointments} />
      <Route path="/patient/records" component={PatientRecords} />
      <Route path="/patient/prescriptions" component={PatientPrescriptions} />
      <Route path="/patient/reviews" component={PatientReviews} />
      <Route path="/patient/profile" component={Profile} />
      <Route path="/patient/chat" component={Chat} />
      
      <Route path="/doctor/dashboard" component={DoctorDashboard} />
      <Route path="/doctor/patients" component={DoctorPatients} />
      <Route path="/doctor/appointments" component={DoctorAppointments} />
      <Route path="/doctor/prescriptions" component={DoctorPrescriptions} />
      <Route path="/doctor/medications" component={DoctorMedications} />
      <Route path="/doctor/services" component={AdminServices} />
      <Route path="/doctor/finance" component={DoctorFinance} />
      <Route path="/doctor/profile" component={Profile} />
      <Route path="/doctor/chat" component={Chat} />
      
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route path="/admin/services" component={AdminServices} />
      <Route path="/admin/team" component={AdminTeam} />
      <Route path="/admin/announcements" component={AdminAnnouncements} />
      <Route path="/admin/appointments" component={DoctorAppointments} />
      <Route path="/admin/patients" component={AdminPatients} />
      <Route path="/admin/prescriptions" component={AdminPrescriptions} />
      <Route path="/admin/settings" component={AdminSettings} />
      <Route path="/admin/finance" component={AdminFinance} />
      <Route path="/admin/profile" component={Profile} />
      <Route path="/admin/chat" component={Chat} />
      
      <Route path="/receptionist/dashboard" component={ReceptionistDashboard} />
      <Route path="/receptionist/queue" component={ReceptionistQueue} />
      <Route path="/receptionist/patients" component={ReceptionistPatients} />
      <Route path="/receptionist/schedule" component={ReceptionistSchedule} />
      <Route path="/receptionist/billing" component={ReceptionistBilling} />
      <Route path="/receptionist/chat" component={Chat} />
      <Route path="/receptionist/profile" component={Profile} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <ThemeProvider>
            <I18nProvider>
              <AuthProvider>
                <Router />
              </AuthProvider>
            </I18nProvider>
          </ThemeProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
