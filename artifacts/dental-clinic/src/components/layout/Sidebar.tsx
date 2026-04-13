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
} from "lucide-react";

export function Sidebar() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [location] = useLocation();

  if (!user) return null;

  const patientLinks = [
    { href: "/patient/dashboard", label: t("nav.dashboard"), icon: LayoutDashboard },
    { href: "/patient/appointments", label: t("nav.appointments"), icon: CalendarDays },
    { href: "/patient/records", label: t("nav.records"), icon: FileText },
    { href: "/patient/prescriptions", label: t("nav.prescriptions"), icon: Pill },
    { href: "/patient/reviews", label: t("nav.reviews"), icon: Star },
  ];

  const doctorLinks = [
    { href: "/doctor/dashboard", label: t("nav.dashboard"), icon: LayoutDashboard },
    { href: "/doctor/patients", label: t("nav.patients"), icon: Users },
    { href: "/doctor/appointments", label: t("nav.appointments"), icon: CalendarDays },
    { href: "/doctor/prescriptions", label: t("nav.prescriptions"), icon: Pill },
    { href: "/doctor/services", label: t("nav.services"), icon: Stethoscope },
  ];

  const adminLinks = [
    { href: "/admin/dashboard", label: t("nav.dashboard"), icon: LayoutDashboard },
    { href: "/admin/services", label: t("admin.services"), icon: Stethoscope },
    { href: "/admin/team", label: t("admin.team"), icon: Users },
    { href: "/admin/appointments", label: t("nav.appointments"), icon: CalendarDays },
    { href: "/admin/announcements", label: t("nav.announcements"), icon: Megaphone },
  ];

  const links = 
    user.role === "patient" ? patientLinks :
    user.role === "doctor" ? doctorLinks :
    adminLinks;

  return (
    <div className="flex h-full w-64 flex-col border-e bg-sidebar text-sidebar-foreground">
      <div className="p-4 border-b border-sidebar-border">
        <p className="text-sm font-semibold text-sidebar-foreground">{t("nav.management")}</p>
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
    </div>
  );
}
