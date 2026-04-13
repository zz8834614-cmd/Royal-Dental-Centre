import { useMemo, type ReactNode } from "react";
import { useI18n } from "@/lib/i18n";
import { Navbar } from "@/components/layout/Navbar";
import { WhatsAppButton } from "@/components/layout/WhatsAppButton";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useListServices, useListReviews, useListAnnouncements } from "@workspace/api-client-react";
import {
  Star, ArrowRight, Sparkles, Phone, Mail, MapPin, Clock,
  Brush, CircleDot, SmilePlus, Sun, Wrench, Syringe, Stethoscope, Scissors, ShieldCheck, type LucideIcon
} from "lucide-react";
import logoPath from "@assets/logo_dentaire_1776084221665.png";

function Tooth3D() {
  return (
    <div className="tooth-3d-container">
      <svg viewBox="0 0 200 260" className="w-full h-full drop-shadow-[0_0_40px_rgba(218,165,32,0.4)]">
        <defs>
          <linearGradient id="toothGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="40%" stopColor="#f0f0f0" />
            <stop offset="100%" stopColor="#e0e0e0" />
          </linearGradient>
          <linearGradient id="goldShine" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(218,165,32,0)" />
            <stop offset="50%" stopColor="rgba(218,165,32,0.6)" />
            <stop offset="100%" stopColor="rgba(218,165,32,0)" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <radialGradient id="crownGold" cx="50%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#FFD700" />
            <stop offset="50%" stopColor="#DAA520" />
            <stop offset="100%" stopColor="#B8860B" />
          </radialGradient>
        </defs>
        <g className="tooth-float">
          <path d="M60 80 C60 40, 80 20, 100 15 C120 20, 140 40, 140 80 L145 140 C145 160, 135 180, 125 200 C120 210, 115 230, 110 240 C107 245, 103 245, 100 240 L100 240 C97 245, 93 245, 90 240 C85 230, 80 210, 75 200 C65 180, 55 160, 55 140 Z" fill="url(#toothGrad)" stroke="#ddd" strokeWidth="1" />
          <path d="M75 75 C75 55, 85 35, 100 30 C100 30, 85 50, 85 75 C85 90, 80 100, 75 110 Z" fill="white" opacity="0.5" />
          <path d="M60 80 C60 40, 80 20, 100 15 C120 20, 140 40, 140 80" fill="none" stroke="url(#goldShine)" strokeWidth="2" className="gold-shine-path" />
          <circle cx="40" cy="15" r="12" fill="url(#crownGold)" filter="url(#glow)" />
          <circle cx="100" cy="2" r="14" fill="url(#crownGold)" filter="url(#glow)" />
          <circle cx="160" cy="15" r="12" fill="url(#crownGold)" filter="url(#glow)" />
          <polygon points="40,3 44,15 36,15" fill="#FFD700" />
          <polygon points="100,-12 105,2 95,2" fill="#FFD700" />
          <polygon points="160,3 164,15 156,15" fill="#FFD700" />
        </g>
        <circle cx="50" cy="60" r="3" fill="rgba(218,165,32,0.3)" className="sparkle-1" />
        <circle cx="155" cy="50" r="2" fill="rgba(218,165,32,0.4)" className="sparkle-2" />
        <circle cx="45" cy="120" r="2.5" fill="rgba(218,165,32,0.3)" className="sparkle-3" />
        <circle cx="160" cy="130" r="2" fill="rgba(218,165,32,0.35)" className="sparkle-1" />
      </svg>
    </div>
  );
}

const serviceIconMap: Record<string, LucideIcon> = {
  "Teeth Cleaning": Brush,
  "Dental Filling": CircleDot,
  "Orthodontics": SmilePlus,
  "Teeth Whitening": Sun,
  "Dental Implants": Wrench,
  "Root Canal": Syringe,
  "تنظيف الأسنان": Brush,
  "حشو الأسنان": CircleDot,
  "تقويم الأسنان": SmilePlus,
  "تبييض الأسنان": Sun,
  "زراعة الأسنان": Wrench,
  "علاج العصب": Syringe,
};

export default function Landing() {
  const { t, language } = useI18n();
  const { data: services } = useListServices();
  const { data: reviews } = useListReviews();
  const { data: announcements } = useListAnnouncements();
  const isAr = language === "ar";

  const particles = useMemo(() =>
    Array.from({ length: 20 }).map(() => ({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      animationDelay: `${Math.random() * 5}s`,
      animationDuration: `${3 + Math.random() * 4}s`,
    })), []);

  return (
    <div className="min-h-screen flex flex-col bg-background transition-colors duration-500">
      <Navbar />
      <main className="flex-1">
        {/* ========== 3D HERO SECTION ========== */}
        <section className="hero-section relative overflow-hidden min-h-[90vh] flex items-center">
          <div className="hero-bg-animated" />
          <div className="hero-particles">
            {particles.map((p, i) => (
              <div key={i} className="particle" style={p} />
            ))}
          </div>

          <div className="container px-4 md:px-6 relative z-10">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className={`space-y-8 ${isAr ? "text-right" : "text-left"}`}>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-badge">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-primary">
                    {isAr ? "رعاية أسنان متميزة" : "Premium Dental Care"}
                  </span>
                </div>

                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-tight">
                  <span className="block text-foreground">
                    {isAr ? "ابتسامتك" : "Your Smile,"}
                  </span>
                  <span className="block gold-gradient-text">
                    {isAr ? "تاجك الذهبي" : "Your Golden Crown"}
                  </span>
                </h1>

                <p className="text-lg md:text-xl text-muted-foreground max-w-[500px] leading-relaxed">
                  {isAr
                    ? "اكتشف مستوى جديداً من العناية بأسنانك مع أحدث التقنيات ثلاثية الأبعاد وفريق من أفضل الأطباء المتخصصين."
                    : "Discover a new level of dental care with cutting-edge 3D technology and a team of top specialized dentists."}
                </p>

                <div className="flex flex-wrap gap-4">
                  <Button size="lg" className="h-14 px-8 text-lg rounded-2xl shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all duration-300 group" asChild>
                    <Link href="/login">
                      {t("hero.book")}
                      <ArrowRight className={`w-5 h-5 ${isAr ? "mr-2 rotate-180" : "ml-2"} group-hover:translate-x-1 transition-transform`} />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" className="h-14 px-8 text-lg rounded-2xl glass-button" asChild>
                    <Link href="/about">
                      {isAr ? "اعرف المزيد" : "Learn More"}
                    </Link>
                  </Button>
                </div>

                <div className="flex items-center gap-8 pt-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold gold-gradient-text">15+</p>
                    <p className="text-sm text-muted-foreground">{isAr ? "سنة خبرة" : "Years Experience"}</p>
                  </div>
                  <div className="w-px h-12 bg-border" />
                  <div className="text-center">
                    <p className="text-3xl font-bold gold-gradient-text">5000+</p>
                    <p className="text-sm text-muted-foreground">{isAr ? "مريض سعيد" : "Happy Patients"}</p>
                  </div>
                  <div className="w-px h-12 bg-border" />
                  <div className="text-center">
                    <p className="text-3xl font-bold gold-gradient-text">20+</p>
                    <p className="text-sm text-muted-foreground">{isAr ? "طبيب متخصص" : "Specialists"}</p>
                  </div>
                </div>
              </div>

              <div className="hidden lg:flex justify-center items-center">
                <div className="relative w-80 h-96">
                  <div className="absolute inset-0 rounded-full bg-primary/10 blur-3xl animate-pulse" />
                  <Tooth3D />
                  <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-48 h-6 bg-primary/10 rounded-full blur-xl" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========== SERVICES SECTION (Glass Cards) ========== */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 services-bg" />
          <div className="container px-4 md:px-6 relative z-10">
            <div className="text-center mb-16 space-y-4">
              <span className="inline-block px-4 py-1.5 rounded-full text-sm font-medium bg-primary/10 text-primary">
                {isAr ? "خدماتنا" : "Our Services"}
              </span>
              <h2 className="text-4xl md:text-5xl font-bold">
                {isAr ? "خدمات طب الأسنان المتميزة" : "Premium Dental Services"}
              </h2>
              <p className="text-lg text-muted-foreground max-w-[600px] mx-auto">
                {isAr
                  ? "نقدم مجموعة شاملة من خدمات طب الأسنان باستخدام أحدث التقنيات"
                  : "We offer a comprehensive range of dental services using the latest technologies"}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {services?.slice(0, 6).map((service, index) => {
                const serviceName = isAr ? (service.nameAr || service.name) : service.name;
                const ServiceIcon = serviceIconMap[serviceName] || serviceIconMap[service.name] || Stethoscope;
                return (
                  <div key={service.id} className="glass-card group" style={{ animationDelay: `${index * 0.1}s` }}>
                    <div className="p-8 space-y-5">
                      <div className="service-icon-3d">
                        <ServiceIcon className="w-8 h-8 text-primary" />
                      </div>
                      <h3 className="text-xl font-bold group-hover:text-primary transition-colors">
                        {serviceName}
                      </h3>
                      <p className="text-muted-foreground leading-relaxed text-sm">
                        {isAr ? (service.descriptionAr || service.description) : service.description}
                      </p>
                      {service.price && (
                        <p className="text-lg font-bold gold-gradient-text">
                          {service.price} {isAr ? "د.ج" : "DZD"}
                        </p>
                      )}
                      <Button className="w-full rounded-xl group-hover:shadow-lg group-hover:shadow-primary/20 transition-all" asChild>
                        <Link href="/login">
                          {isAr ? "احجز الآن" : "Book Now"}
                          <ArrowRight className={`w-4 h-4 ${isAr ? "mr-2 rotate-180" : "ml-2"}`} />
                        </Link>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ========== ANNOUNCEMENTS ========== */}
        {announcements && announcements.length > 0 && (
          <section className="py-24 relative">
            <div className="container px-4 md:px-6">
              <div className="text-center mb-16 space-y-4">
                <span className="inline-block px-4 py-1.5 rounded-full text-sm font-medium bg-primary/10 text-primary">
                  {isAr ? "آخر الأخبار" : "Latest News"}
                </span>
                <h2 className="text-4xl md:text-5xl font-bold">
                  {isAr ? "أخبار وعروض العيادة" : "Clinic News & Offers"}
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {announcements.filter(a => a.isActive).map((announcement, index) => (
                  <div key={announcement.id} className="glass-card" style={{ animationDelay: `${index * 0.1}s` }}>
                    <div className="p-8 space-y-4">
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-primary/10 text-primary">
                        {announcement.type}
                      </span>
                      <h3 className="text-xl font-bold">
                        {isAr ? (announcement.titleAr || announcement.title) : announcement.title}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {isAr ? (announcement.contentAr || announcement.content) : announcement.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ========== REVIEWS ========== */}
        {reviews && reviews.length > 0 && (
          <section className="py-24 relative overflow-hidden">
            <div className="absolute inset-0 services-bg" />
            <div className="container px-4 md:px-6 relative z-10">
              <div className="text-center mb-16 space-y-4">
                <span className="inline-block px-4 py-1.5 rounded-full text-sm font-medium bg-primary/10 text-primary">
                  {isAr ? "آراء مرضانا" : "Patient Reviews"}
                </span>
                <h2 className="text-4xl md:text-5xl font-bold">
                  {isAr ? "ماذا يقول مرضانا" : "What Our Patients Say"}
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {reviews.slice(0, 3).map((review, index) => (
                  <div key={review.id} className="glass-card" style={{ animationDelay: `${index * 0.1}s` }}>
                    <div className="p-8 space-y-4">
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`w-5 h-5 ${i < review.rating ? "fill-primary text-primary" : "text-muted-foreground/30"}`} />
                        ))}
                      </div>
                      <p className="text-muted-foreground italic leading-relaxed">"{review.comment}"</p>
                      <div className="flex items-center gap-3 pt-2 border-t border-border/50">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-bold text-primary">
                            {review.patientName?.charAt(0) || "P"}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{review.patientName}</p>
                          {review.serviceName && (
                            <p className="text-xs text-muted-foreground">{review.serviceName}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ========== CONTACT / CTA ========== */}
        <section className="py-24">
          <div className="container px-4 md:px-6">
            <div className="glass-card overflow-hidden">
              <div className="grid md:grid-cols-2">
                <div className="p-10 md:p-14 space-y-8 bg-gradient-to-br from-primary/5 to-transparent">
                  <h2 className="text-3xl md:text-4xl font-bold">
                    {isAr ? "هل أنت مستعد لابتسامة مثالية؟" : "Ready for a Perfect Smile?"}
                  </h2>
                  <p className="text-muted-foreground text-lg leading-relaxed">
                    {isAr
                      ? "احجز موعدك اليوم واستمتع بأفضل رعاية لأسنانك مع فريقنا المتخصص."
                      : "Book your appointment today and enjoy the best dental care with our specialized team."}
                  </p>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Phone className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">{isAr ? "اتصل بنا" : "Call Us"}</p>
                        <p className="font-semibold" dir="ltr">0699 790 790</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Mail className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">{isAr ? "البريد الإلكتروني" : "Email"}</p>
                        <p className="font-semibold">contact@royaldental.com</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Clock className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">{isAr ? "ساعات العمل" : "Working Hours"}</p>
                        <p className="font-semibold">{isAr ? "السبت - الخميس: 09:00 - 18:00" : "Sat - Thu: 9AM - 6PM"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">{isAr ? "العنوان" : "Address"}</p>
                        <p className="font-semibold">{isAr ? "شارع الاستقلال، وسط المدينة" : "Independence Street, City Center"}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-10 md:p-14 flex flex-col justify-center items-center text-center space-y-6 bg-gradient-to-br from-transparent to-primary/5">
                  <img src={logoPath} alt="Royal Dental Centre" className="w-32 h-32 object-contain" />
                  <h3 className="text-2xl font-bold gold-gradient-text">Royal Dental Centre</h3>
                  <p className="text-muted-foreground">
                    {isAr ? "ابتسامتك ثروتك" : "Your Smile is Your Treasure"}
                  </p>
                  <Button size="lg" className="h-14 px-10 text-lg rounded-2xl shadow-lg shadow-primary/25" asChild>
                    <Link href="/login">
                      {t("hero.book")}
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-12 bg-card/50 backdrop-blur-sm">
        <div className="container px-4 md:px-6 text-center text-muted-foreground space-y-2">
          <p className="font-semibold text-foreground">Royal Dental Centre | مركز رويال لطب الأسنان</p>
          <p className="text-sm">© {new Date().getFullYear()} {isAr ? "جميع الحقوق محفوظة." : "All rights reserved."}</p>
        </div>
      </footer>
      <WhatsAppButton />
    </div>
  );
}
