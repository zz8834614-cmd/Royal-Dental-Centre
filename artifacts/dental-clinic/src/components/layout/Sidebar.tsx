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
  Megaphone
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
    { href: "/patient/messages", label: t("nav.messages"), icon: MessageSquare },
    { href: "/patient/reviews", label: t("nav.reviews"), icon: Star },
  ];

  const doctorLinks = [
    { href: "/doctor/dashboard", label: t("nav.dashboard"), icon: LayoutDashboard },
    { href: "/doctor/patients", label: t("nav.patients"), icon: Users },
    { href: "/doctor/appointments", label: t("nav.appointments"), icon: CalendarDays },
    { href: "/doctor/prescriptions", label: t("nav.prescriptions"), icon: Pill },
    { href: "/doctor/medications", label: t("nav.medications"), icon: Database },
    { href: "/doctor/medical-records", label: t("nav.records"), icon: FileText },
    { href: "/doctor/messages", label: t("nav.messages"), icon: MessageSquare },
    { href: "/doctor/announcements", label: t("nav.announcements"), icon: Megaphone },
  ];

  const adminLinks = [
    { href: "/admin/dashboard", label: t("nav.dashboard"), icon: LayoutDashboard },
    { href: "/admin/appointments", label: t("nav.appointments"), icon: CalendarDays },
    { href: "/admin/messages", label: t("nav.messages"), icon: MessageSquare },
    { href: "/admin/announcements", label: t("nav.announcements"), icon: Megaphone },
  ];

  const links = 
    user.role === "patient" ? patientLinks :
    user.role === "doctor" ? doctorLinks :
    adminLinks;

  return (
    <div className="flex h-full w-64 flex-col border-r bg-sidebar text-sidebar-foreground">
      <div className="flex-1 overflow-auto py-4">
        <nav className="grid gap-1 px-2">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = location === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
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
