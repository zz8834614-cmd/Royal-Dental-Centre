import { useMemo } from "react";
import { useI18n } from "@/lib/i18n";
import { Navbar } from "@/components/layout/Navbar";
import { WhatsAppButton } from "@/components/layout/WhatsAppButton";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useListServices, useListReviews, useListAnnouncements } from "@workspace/api-client-react";
import {
  Star, ArrowRight, Sparkles, Phone, Mail, MapPin, Clock,
  Brush, CircleDot, SmilePlus, Sun, Wrench, Syringe, Stethoscope, type LucideIcon,
  Shield, Award, Heart, Users,
} from "lucide-react";
import { DentalLogo } from "@/components/ui/DentalLogo";

function Logo3D() {
  return (
    <div className="logo3d-scene">
      <div className="logo3d-glow-ring" />
      <div className="logo3d-glow-ring logo3d-glow-ring-2" />
      <div className="logo3d-wrapper">
        <img src="/logo.png" alt="Royal Dental Centre" className="logo3d-img" />
        <div className="logo3d-shine" />
      </div>
      <div className="logo3d-shadow" />
      <div className="logo3d-sparkle logo3d-sp-1" />
      <div className="logo3d-sparkle logo3d-sp-2" />
      <div className="logo3d-sparkle logo3d-sp-3" />
      <div className="logo3d-sparkle logo3d-sp-4" />
    </div>
  );
}

const serviceIconMap: Record<string, LucideIcon> = {
  "Teeth Cleaning": Brush, "Dental Filling": CircleDot, "Orthodontics": SmilePlus,
  "Teeth Whitening": Sun, "Dental Implants": Wrench, "Root Canal": Syringe,
  "تنظيف الأسنان": Brush, "حشو الأسنان": CircleDot, "تقويم الأسنان": SmilePlus,
  "تبييض الأسنان": Sun, "زراعة الأسنان": Wrench, "علاج العصب": Syringe,
};

export default function Landing() {
  const { t, language } = useI18n();
  const { data: services } = useListServices();
  const { data: reviews } = useListReviews();
  const { data: announcements } = useListAnnouncements();
  const isAr = language === "ar";

  const particles = useMemo(() =>
    Array.from({ length: 15 }).map(() => ({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      animationDelay: `${Math.random() * 5}s`,
      animationDuration: `${3 + Math.random() * 4}s`,
    })), []);

  const stats = [
    { value: "15+", label: isAr ? "سنة خبرة" : "Years", icon: Award },
    { value: "5000+", label: isAr ? "مريض" : "Patients", icon: Users },
    { value: "20+", label: isAr ? "طبيب" : "Doctors", icon: Stethoscope },
    { value: "98%", label: isAr ? "رضا" : "Satisfaction", icon: Heart },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <section className="hero-section relative overflow-hidden min-h-[90vh] md:min-h-screen flex items-center">
          <div className="hero-bg-image" />
          <div className="hero-overlay" />
          <div className="hero-bg-animated" />
          <div className="hero-particles">
            {particles.map((p, i) => (
              <div key={i} className="particle" style={p} />
            ))}
          </div>

          <div className="container px-4 md:px-6 relative z-10 py-16 md:py-24">
            <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">
              <div className={`flex flex-col ${isAr ? "md:order-1" : ""}`}>
                <div className="hero-title-badge mb-6">
                  <Sparkles className="w-4 h-4" />
                  <span>{isAr ? "رعاية أسنان متميزة" : "Premium Dental Care"}</span>
                </div>

                <h1 className="text-4xl sm:text-5xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight leading-[1.1] mb-5">
                  <span className="block text-foreground">
                    {isAr ? "ابتسامتك" : "Your Smile,"}
                  </span>
                  <span className="block gold-gradient-text">
                    {isAr ? "تاجك الذهبي" : "Your Golden Crown"}
                  </span>
                </h1>

                <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-[520px] leading-relaxed mb-8">
                  {isAr
                    ? "اكتشف مستوى جديداً من العناية بأسنانك مع أحدث التقنيات وفريق من أفضل الأطباء المتخصصين."
                    : "Discover a new level of dental care with cutting-edge technology and a team of top specialists."}
                </p>

                <div className="flex flex-wrap gap-3 mb-10">
                  <Button size="lg" className="h-13 md:h-14 px-7 md:px-9 text-sm md:text-base rounded-2xl shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all group" asChild>
                    <Link href="/login">
                      {t("hero.book")}
                      <ArrowRight className={`w-4 h-4 ${isAr ? "mr-2 rotate-180" : "ml-2"} group-hover:translate-x-1 transition-transform`} />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" className="h-13 md:h-14 px-7 md:px-9 text-sm md:text-base rounded-2xl glass-button" asChild>
                    <Link href="/about">
                      {isAr ? "اعرف المزيد" : "Learn More"}
                    </Link>
                  </Button>
                </div>

                <div className="grid grid-cols-4 gap-3 md:gap-4">
                  {stats.map((stat, i) => {
                    const Icon = stat.icon;
                    return (
                      <div key={i} className="hero-stat-card">
                        <Icon className="w-4 h-4 text-primary mx-auto mb-1.5" />
                        <p className="text-lg sm:text-xl md:text-2xl font-bold gold-gradient-text">{stat.value}</p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className={`hidden md:block ${isAr ? "md:order-0" : ""}`}>
                <div className="hero-side-image aspect-[3/4] max-w-md mx-auto">
                  <img
                    src="https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=800&q=80"
                    alt={isAr ? "عيادة أسنان حديثة" : "Modern Dental Clinic"}
                    loading="eager"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24 relative overflow-hidden">
          <div className="absolute inset-0 services-bg" />
          <div className="container px-4 md:px-6 relative z-10">
            <div className="text-center mb-10 md:mb-16 space-y-3">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                {isAr ? "خدماتنا" : "Our Services"}
              </span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold">
                {isAr ? "خدمات طب الأسنان المتميزة" : "Premium Dental Services"}
              </h2>
              <p className="text-sm md:text-base text-muted-foreground max-w-[600px] mx-auto">
                {isAr
                  ? "نقدم مجموعة شاملة من خدمات طب الأسنان باستخدام أحدث التقنيات"
                  : "We offer a comprehensive range of dental services using the latest technologies"}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {services?.slice(0, 6).map((service, index) => {
                const serviceName = isAr ? (service.nameAr || service.name) : service.name;
                const ServiceIcon = serviceIconMap[serviceName] || serviceIconMap[service.name] || Stethoscope;
                return (
                  <div key={service.id} className="glass-card group" style={{ animationDelay: `${index * 0.1}s` }}>
                    <div className="p-5 md:p-7 space-y-4">
                      <div className="service-icon-3d">
                        <ServiceIcon className="w-6 h-6 md:w-7 md:h-7 text-primary" />
                      </div>
                      <h3 className="text-base md:text-lg font-bold group-hover:text-primary transition-colors">
                        {serviceName}
                      </h3>
                      <p className="text-muted-foreground leading-relaxed text-xs md:text-sm line-clamp-2">
                        {isAr ? (service.descriptionAr || service.description) : service.description}
                      </p>
                      {service.price && (
                        <p className="text-base md:text-lg font-bold gold-gradient-text">
                          {service.price} {isAr ? "د.ج" : "DZD"}
                        </p>
                      )}
                      <Button className="w-full rounded-xl h-10 text-sm group-hover:shadow-lg group-hover:shadow-primary/20 transition-all" asChild>
                        <Link href="/login">
                          {isAr ? "احجز الآن" : "Book Now"}
                          <ArrowRight className={`w-3.5 h-3.5 ${isAr ? "mr-1.5 rotate-180" : "ml-1.5"}`} />
                        </Link>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="py-12 md:py-20 relative overflow-hidden">
          <div className="container px-4 md:px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {[
                { icon: Shield, title: isAr ? "تعقيم كامل" : "Full Sterilization", desc: isAr ? "أعلى معايير النظافة والتعقيم" : "Highest hygiene standards", color: "from-emerald-500/15 to-emerald-500/5" },
                { icon: Award, title: isAr ? "أطباء معتمدون" : "Certified Doctors", desc: isAr ? "خبرة دولية معتمدة" : "International certified expertise", color: "from-blue-500/15 to-blue-500/5" },
                { icon: Heart, title: isAr ? "رعاية شاملة" : "Complete Care", desc: isAr ? "جميع خدمات طب الأسنان" : "All dental services", color: "from-rose-500/15 to-rose-500/5" },
                { icon: Clock, title: isAr ? "مواعيد مرنة" : "Flexible Hours", desc: isAr ? "نناسب جدولك الشخصي" : "Fits your personal schedule", color: "from-amber-500/15 to-amber-500/5" },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className="glass-card group" style={{ animationDelay: `${i * 0.1}s` }}>
                    <div className="p-5 md:p-7 text-center space-y-3">
                      <div className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center mx-auto border border-white/5`}>
                        <Icon className="w-6 h-6 md:w-7 md:h-7 text-primary" />
                      </div>
                      <h3 className="font-bold text-sm md:text-base group-hover:text-primary transition-colors">{item.title}</h3>
                      <p className="text-[11px] md:text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {announcements && announcements.length > 0 && (
          <section className="py-16 md:py-24 relative">
            <div className="container px-4 md:px-6">
              <div className="text-center mb-10 md:mb-16 space-y-3">
                <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                  {isAr ? "آخر الأخبار" : "Latest News"}
                </span>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold">
                  {isAr ? "أخبار وعروض العيادة" : "Clinic News & Offers"}
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {announcements.filter(a => a.isActive).map((announcement, index) => (
                  <div key={announcement.id} className="glass-card" style={{ animationDelay: `${index * 0.1}s` }}>
                    <div className="p-5 md:p-7 space-y-3">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary">
                        {announcement.type}
                      </span>
                      <h3 className="text-base md:text-lg font-bold">
                        {isAr ? (announcement.titleAr || announcement.title) : announcement.title}
                      </h3>
                      <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                        {isAr ? (announcement.contentAr || announcement.content) : announcement.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {reviews && reviews.length > 0 && (
          <section className="py-16 md:py-24 relative overflow-hidden">
            <div className="absolute inset-0 services-bg" />
            <div className="container px-4 md:px-6 relative z-10">
              <div className="text-center mb-10 md:mb-16 space-y-3">
                <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                  {isAr ? "آراء مرضانا" : "Patient Reviews"}
                </span>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold">
                  {isAr ? "ماذا يقول مرضانا" : "What Our Patients Say"}
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {reviews.slice(0, 3).map((review, index) => (
                  <div key={review.id} className="glass-card" style={{ animationDelay: `${index * 0.1}s` }}>
                    <div className="p-5 md:p-7 space-y-3">
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`w-4 h-4 ${i < review.rating ? "fill-primary text-primary" : "text-muted-foreground/30"}`} />
                        ))}
                      </div>
                      <p className="text-muted-foreground italic leading-relaxed text-xs md:text-sm">"{review.comment}"</p>
                      <div className="flex items-center gap-3 pt-2 border-t border-border/50">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-xs font-bold text-primary">
                            {review.patientName?.charAt(0) || "P"}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-xs">{review.patientName}</p>
                          {review.serviceName && (
                            <p className="text-[10px] text-muted-foreground">{review.serviceName}</p>
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

        <section className="py-16 md:py-24">
          <div className="container px-4 md:px-6">
            <div className="glass-card overflow-hidden">
              <div className="grid md:grid-cols-2">
                <div className="p-6 md:p-10 lg:p-14 space-y-6 bg-gradient-to-br from-primary/5 to-transparent">
                  <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold">
                    {isAr ? "هل أنت مستعد لابتسامة مثالية؟" : "Ready for a Perfect Smile?"}
                  </h2>
                  <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                    {isAr
                      ? "احجز موعدك اليوم واستمتع بأفضل رعاية لأسنانك مع فريقنا المتخصص."
                      : "Book your appointment today and enjoy the best dental care."}
                  </p>
                  <div className="space-y-3">
                    {[
                      { icon: Phone, label: isAr ? "اتصل بنا" : "Call Us", value: "0699 790 790" },
                      { icon: Mail, label: isAr ? "البريد" : "Email", value: "contact@royaldental.com" },
                      { icon: Clock, label: isAr ? "ساعات العمل" : "Hours", value: isAr ? "السبت - الخميس: 09:00 - 18:00" : "Sat - Thu: 9AM - 6PM" },
                      { icon: MapPin, label: isAr ? "العنوان" : "Address", value: isAr ? "وسط المدينة" : "City Center" },
                    ].map((item, i) => {
                      const Icon = item.icon;
                      return (
                        <div key={i} className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                            <Icon className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-foreground">{item.label}</p>
                            <p className="font-semibold text-sm" dir={item.icon === Phone ? "ltr" : undefined}>{item.value}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="p-6 md:p-10 lg:p-14 flex flex-col justify-center items-center text-center space-y-4 bg-gradient-to-br from-transparent to-primary/5">
                  <img src="/logo.png" alt="Royal Dental Centre" className="w-32 h-32 md:w-44 md:h-44 object-contain drop-shadow-lg" />
                  <h3 className="text-xl md:text-2xl font-bold gold-gradient-text">Royal Dental Centre</h3>
                  <p className="text-muted-foreground text-sm">
                    {isAr ? "ابتسامتك ثروتك" : "Your Smile is Your Treasure"}
                  </p>
                  <Button size="lg" className="h-12 px-8 text-sm rounded-2xl shadow-lg shadow-primary/25" asChild>
                    <Link href="/login">{t("hero.book")}</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-8 md:py-12 bg-card/50 backdrop-blur-sm">
        <div className="container px-4 md:px-6 text-center text-muted-foreground space-y-2">
          <div className="flex items-center justify-center gap-2 mb-2">
            <img src="/logo.png" alt="Royal Dental Centre" className="w-8 h-8 object-contain" />
            <span className="font-semibold text-foreground text-sm">Royal Dental Centre</span>
          </div>
          <p className="text-xs">© {new Date().getFullYear()} {isAr ? "جميع الحقوق محفوظة." : "All rights reserved."}</p>
        </div>
      </footer>
      <WhatsAppButton />
    </div>
  );
}
