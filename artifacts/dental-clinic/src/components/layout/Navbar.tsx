import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DentalLogo } from "@/components/ui/DentalLogo";
import {
  Menu,
  X,
  Globe,
  Sun,
  Moon,
  LayoutDashboard,
  LogOut,
  Stethoscope,
  Info,
  Phone,
  Star,
  CalendarDays,
  Settings,
  Home,
  ChevronLeft,
  UserPlus,
  LogIn,
  Newspaper,
} from "lucide-react";

export function Navbar({ onMenuClick, onBook }: { onMenuClick?: () => void; onBook?: () => void }) {
  const { user, logout } = useAuth();
  const { language, setLanguage, t } = useI18n();
  const { theme, toggleTheme } = useTheme();
  const [location, navigate] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const menuBtnRef = useRef<HTMLButtonElement>(null);

  const closeMobile = useCallback(() => {
    setMobileOpen(false);
    menuBtnRef.current?.focus();
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
      setTimeout(() => drawerRef.current?.focus(), 100);
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  useEffect(() => {
    if (!mobileOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMobile();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [mobileOpen, closeMobile]);

  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  const navLinks = [
    { href: "/", label: t("nav.home"), icon: Home },
    { href: "/services", label: t("nav.services"), icon: Stethoscope },
    { href: "/news", label: t("nav.news"), icon: Newspaper },
    { href: "/about", label: t("nav.about"), icon: Info },
    { href: "/reviews", label: t("nav.reviews"), icon: Star },
    { href: "/contact", label: t("nav.contact"), icon: Phone },
  ];

  const isActive = (href: string) => location === href;

  return (
    <>
      <header className="sticky top-0 z-50 w-full navbar-glass">
        <div className="container flex h-14 md:h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            {onMenuClick ? (
              <Button variant="ghost" size="icon" className="md:hidden h-9 w-9" onClick={onMenuClick}>
                <Menu className="h-5 w-5" />
              </Button>
            ) : (
              <Button ref={menuBtnRef} variant="ghost" size="icon" className="md:hidden h-9 w-9" onClick={() => setMobileOpen(true)} aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            )}

            <Link href="/" className="flex items-center gap-2">
              <img src="/logo.png" alt="Royal Dental Centre" className="w-9 h-9 md:w-10 md:h-10 object-contain navbar-logo" />
            </Link>

            <nav className="hidden md:flex items-center gap-0.5 ms-2">
              {navLinks.map(link => (
                <Button
                  key={link.href}
                  variant="ghost"
                  size="sm"
                  className={`text-sm h-9 px-3 rounded-xl transition-all ${
                    isActive(link.href)
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  asChild
                >
                  <Link href={link.href}>{link.label}</Link>
                </Button>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-1.5">
            {!user && !onMenuClick && (
              <Button
                size="sm"
                className="hidden md:flex h-8 rounded-xl text-xs px-4 gap-1.5"
                onClick={onBook ?? (() => navigate("/login"))}
              >
                <CalendarDays className="h-3.5 w-3.5" />
                {t("hero.book")}
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="rounded-xl w-8 h-8 md:w-9 md:h-9"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLanguage(language === "en" ? "ar" : "en")}
              className="rounded-xl w-8 h-8 md:w-9 md:h-9"
            >
              <Globe className="h-4 w-4" />
            </Button>

            {user && (
              <Link href={`/${user.role}/dashboard`}>
                <Avatar className="h-8 w-8 md:h-9 md:w-9 cursor-pointer ring-2 ring-primary/20 hover:ring-primary/50 transition-all">
                  <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                    {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </Link>
            )}
          </div>
        </div>
      </header>

      {mobileOpen && (
      <div className="fixed inset-0 z-[100] md:hidden" role="dialog" aria-modal="true" aria-label="Navigation menu">
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={closeMobile}
        />

        <div ref={drawerRef} tabIndex={-1} className="absolute inset-y-0 start-0 w-[280px] bg-background/95 backdrop-blur-xl border-e border-border/50 shadow-2xl animate-in slide-in-from-left rtl:slide-in-from-right duration-300 flex flex-col outline-none">

          <div className="flex items-center justify-between p-4 border-b border-border/50">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="Royal Dental Centre" className="w-10 h-10 object-contain navbar-logo" />
              <span className="text-sm font-bold gold-gradient-text">Royal Dental</span>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl" onClick={closeMobile} aria-label="Close menu">
              <X className="h-5 w-5" />
            </Button>
          </div>

          {user && (
            <div className="p-4 border-b border-border/50">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 ring-2 ring-primary/30">
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{user.firstName} {user.lastName}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto py-2">
            <div className="px-3 py-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 px-3 mb-1">
                {t("nav.home")}
              </p>
            </div>
            {navLinks.map(link => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-3 mx-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                    isActive(link.href)
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-foreground/80 active:bg-muted"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {link.label}
                  {isActive(link.href) && (
                    <div className="ms-auto w-1.5 h-1.5 rounded-full bg-primary" />
                  )}
                </Link>
              );
            })}

            {user && (
              <>
                <div className="my-2 border-t border-border/50 mx-3" />
                <div className="px-3 py-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 px-3 mb-1">
                    {t("nav.management")}
                  </p>
                </div>
                <Link
                  href={`/${user.role}/dashboard`}
                  className="flex items-center gap-3 mx-3 px-3 py-2.5 rounded-xl text-sm text-foreground/80 active:bg-muted transition-all"
                >
                  <LayoutDashboard className="h-5 w-5" />
                  {t("nav.dashboard")}
                </Link>
                {(user.role === "admin" || user.role === "doctor") && (
                  <Link
                    href={`/${user.role}/services`}
                    className="flex items-center gap-3 mx-3 px-3 py-2.5 rounded-xl text-sm text-foreground/80 active:bg-muted transition-all"
                  >
                    <Settings className="h-5 w-5" />
                    {t("nav.management")}
                  </Link>
                )}
              </>
            )}
          </div>

          <div className="border-t border-border/50 p-3 space-y-2">
            {user ? (
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 text-destructive hover:text-destructive rounded-xl h-11"
                onClick={() => { logout(); setMobileOpen(false); }}
              >
                <LogOut className="h-5 w-5" />
                {t("nav.logout")}
              </Button>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" className="rounded-xl h-10 gap-2 text-sm" asChild>
                  <Link href="/login">
                    <LogIn className="h-4 w-4" />
                    {t("nav.login")}
                  </Link>
                </Button>
                <Button className="rounded-xl h-10 gap-2 text-sm" asChild>
                  <Link href="/register">
                    <UserPlus className="h-4 w-4" />
                    {t("nav.register")}
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
      )}
    </>
  );
}
