import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  CalendarDays, 
  FileText, 
  Pill, 
  MessageSquare, 
  Star,
  Users,
  Database,
  Megaphone,
  Stethoscope,
  Settings,
  Clock,
  LogOut,
  User,
  ListOrdered,
  DollarSign,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function Sidebar() {
  const { user, logout } = useAuth();
  const { t, language } = useI18n();
  const [location] = useLocation();

  if (!user) return null;

  const patientLinks = [
    { href: "/patient/dashboard", label: t("nav.dashboard"), icon: LayoutDashboard },
    { href: "/patient/appointments", label: t("nav.appointments"), icon: CalendarDays },
    { href: "/patient/records", label: t("nav.records"), icon: FileText },
    { href: "/patient/prescriptions", label: t("nav.prescriptions"), icon: Pill },
    { href: "/patient/chat", label: t("nav.messages"), icon: MessageSquare },
    { href: "/patient/reviews", label: t("nav.reviews"), icon: Star },
    { href: "/patient/profile", label: language === "ar" ? "الملف الشخصي" : "Profile", icon: User },
  ];

  const doctorLinks = [
    { href: "/doctor/dashboard", label: t("nav.dashboard"), icon: LayoutDashboard },
    { href: "/doctor/patients", label: t("nav.patients"), icon: Users },
    { href: "/doctor/appointments", label: t("nav.appointments"), icon: CalendarDays },
    { href: "/doctor/prescriptions", label: t("nav.prescriptions"), icon: Pill },
    { href: "/doctor/medications", label: t("nav.medications"), icon: Database },
    { href: "/doctor/services", label: t("nav.services"), icon: Stethoscope },
    { href: "/doctor/chat", label: t("nav.messages"), icon: MessageSquare },
    { href: "/doctor/profile", label: language === "ar" ? "الملف الشخصي" : "Profile", icon: User },
  ];

  const adminLinks = [
    { href: "/admin/dashboard", label: t("nav.dashboard"), icon: LayoutDashboard },
    { href: "/admin/patients", label: t("nav.patients"), icon: Users },
    { href: "/admin/services", label: t("admin.services"), icon: Stethoscope },
    { href: "/admin/team", label: t("admin.team"), icon: Users },
    { href: "/admin/appointments", label: t("nav.appointments"), icon: CalendarDays },
    { href: "/admin/prescriptions", label: language === "ar" ? "الوصفات" : "Prescriptions", icon: Pill },
    { href: "/admin/announcements", label: t("nav.announcements"), icon: Megaphone },
    { href: "/admin/finance", label: language === "ar" ? "المحاسبة" : "Finance", icon: DollarSign },
    { href: "/admin/chat", label: t("nav.messages"), icon: MessageSquare },
    { href: "/admin/settings", label: t("nav.settings"), icon: Settings },
    { href: "/admin/profile", label: language === "ar" ? "الملف الشخصي" : "Profile", icon: User },
  ];

  const receptionistLinks = [
    { href: "/receptionist/dashboard", label: t("nav.dashboard"), icon: LayoutDashboard },
    { href: "/receptionist/queue", label: language === "ar" ? "قائمة الانتظار" : "Queue", icon: ListOrdered },
    { href: "/receptionist/billing", label: language === "ar" ? "الفوترة والمدفوعات" : "Billing", icon: Wallet },
    { href: "/receptionist/profile", label: language === "ar" ? "الملف الشخصي" : "Profile", icon: User },
  ];

  const links = 
    user.role === "patient" ? patientLinks :
    user.role === "doctor" ? doctorLinks :
    user.role === "receptionist" ? receptionistLinks :
    adminLinks;

  return (
    <div className="flex h-full w-64 flex-col border-e bg-sidebar text-sidebar-foreground">
      <div className="p-4 border-b border-sidebar-border">
        <p className="text-sm font-semibold text-sidebar-foreground">{user.firstName} {user.lastName}</p>
        <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
      </div>
      <div className="flex-1 overflow-auto py-3">
        <nav className="grid gap-1 px-2">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = location === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/80"
                )}
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="p-3 border-t border-sidebar-border">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-sm font-medium text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={logout}
        >
          <LogOut className="h-4 w-4" />
          {language === "ar" ? "تسجيل الخروج" : "Logout"}
        </Button>
      </div>
    </div>
  );
}
