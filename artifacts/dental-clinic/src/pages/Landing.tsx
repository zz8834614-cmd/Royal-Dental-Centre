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
        <section className="hero-section relative overflow-hidden min-h-[90vh] md:min-h-screen flex flex-col items-center justify-center">
          <div className="hero-bg-animated" />
          <div className="hero-particles">
            {particles.map((p, i) => (
              <div key={i} className="particle" style={p} />
            ))}
          </div>

          <div className="container px-4 md:px-6 relative z-10 flex flex-col items-center text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-badge mb-6">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-medium text-primary">
                {isAr ? "رعاية أسنان متميزة" : "Premium Dental Care"}
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold tracking-tight leading-[1.1] mb-4 md:mb-6">
              <span className="block text-foreground">
                {isAr ? "ابتسامتك" : "Your Smile,"}
              </span>
              <span className="block gold-gradient-text">
                {isAr ? "تاجك الذهبي" : "Your Golden Crown"}
              </span>
            </h1>

            <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-[600px] leading-relaxed mb-6 md:mb-8">
              {isAr
                ? "اكتشف مستوى جديداً من العناية بأسنانك مع أحدث التقنيات وفريق من أفضل الأطباء المتخصصين."
                : "Discover a new level of dental care with cutting-edge technology and a team of top specialists."}
            </p>

            <div className="flex flex-wrap gap-3 justify-center mb-8">
              <Button size="lg" className="h-12 md:h-14 px-6 md:px-8 text-sm md:text-base rounded-2xl shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all group" asChild>
                <Link href="/login">
                  {t("hero.book")}
                  <ArrowRight className={`w-4 h-4 ${isAr ? "mr-2 rotate-180" : "ml-2"} group-hover:translate-x-1 transition-transform`} />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="h-12 md:h-14 px-6 md:px-8 text-sm md:text-base rounded-2xl glass-button" asChild>
                <Link href="/about">
                  {isAr ? "اعرف المزيد" : "Learn More"}
                </Link>
              </Button>
            </div>

            {/* 3D Tooth below the text */}
            <div className="relative w-56 h-56 sm:w-64 sm:h-64 md:w-80 md:h-80 lg:w-96 lg:h-96 mb-6">
              <Logo3D />
            </div>

            <div className="grid grid-cols-4 gap-4 md:gap-8 w-full max-w-[600px]">
              {stats.map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <div key={i} className="text-center space-y-1">
                    <Icon className="w-4 h-4 text-primary mx-auto mb-1 hidden sm:block" />
                    <p className="text-xl sm:text-2xl md:text-3xl font-bold gold-gradient-text">{stat.value}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                );
              })}
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

        <section className="py-12 md:py-20">
          <div className="container px-4 md:px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: Shield, title: isAr ? "تعقيم كامل" : "Full Sterilization", desc: isAr ? "أعلى معايير النظافة" : "Highest hygiene standards" },
                { icon: Award, title: isAr ? "أطباء معتمدون" : "Certified Doctors", desc: isAr ? "خبرة عالمية" : "Global expertise" },
                { icon: Heart, title: isAr ? "رعاية شاملة" : "Complete Care", desc: isAr ? "كل الخدمات" : "All services" },
                { icon: Clock, title: isAr ? "مواعيد مرنة" : "Flexible Hours", desc: isAr ? "نناسب جدولك" : "Fits your schedule" },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className="text-center p-4 md:p-6 rounded-2xl bg-card/50 border border-border/30 hover:border-primary/20 transition-all">
                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                      <Icon className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-sm md:text-base mb-1">{item.title}</h3>
                    <p className="text-[10px] md:text-xs text-muted-foreground">{item.desc}</p>
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
