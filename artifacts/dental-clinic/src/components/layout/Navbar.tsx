import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Menu, Globe, User as UserIcon } from "lucide-react";
import logoPath from "@assets/logo_dentaire_1776084221665.png";

export function Navbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const { user, logout } = useAuth();
  const { language, setLanguage, t } = useI18n();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-4">
          {onMenuClick && (
            <Button variant="ghost" size="icon" className="md:hidden" onClick={onMenuClick}>
              <Menu className="h-5 w-5" />
            </Button>
          )}
          <Link href="/" className="flex items-center gap-2">
            <img src={logoPath} alt="Royal Dental Centre" className="h-8 w-8 object-contain" />
            <span className="hidden font-bold sm:inline-block text-primary">
              {t("app.name")}
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/">{t("nav.home")}</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/about">{t("nav.about")}</Link>
            </Button>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLanguage(language === "en" ? "ar" : "en")}
            className="flex items-center gap-2"
          >
            <Globe className="h-4 w-4" />
            <span>{language === "en" ? "العربية" : "English"}</span>
          </Button>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{user.firstName.charAt(0)}{user.lastName.charAt(0)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium">{user.firstName} {user.lastName}</p>
                    <p className="w-[200px] truncate text-sm text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </div>
                <DropdownMenuItem asChild>
                  <Link href={`/${user.role}/dashboard`}>
                    {t("nav.dashboard")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => logout()}>
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" asChild>
                <Link href="/login">{t("nav.login")}</Link>
              </Button>
              <Button asChild>
                <Link href="/register">{t("nav.register")}</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
