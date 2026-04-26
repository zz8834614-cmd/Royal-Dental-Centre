import { useMemo, useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n";
import { Navbar } from "@/components/layout/Navbar";
import { WhatsAppButton } from "@/components/layout/WhatsAppButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Link, useLocation } from "wouter";
import { useListServices, useListReviews, useListAnnouncements } from "@workspace/api-client-react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { getStoredToken } from "@/lib/auth";
import {
  Star, ArrowRight, Sparkles, Phone, Mail, MapPin, Clock,
  Brush, CircleDot, SmilePlus, Sun, Wrench, Syringe, Stethoscope, type LucideIcon,
  Shield, Award, Heart, Users, CalendarCheck,
} from "lucide-react";
import { DentalLogo } from "@/components/ui/DentalLogo";

const TIME_SLOTS = [
  "09:00","09:30","10:00","10:30","11:00","11:30",
  "12:00","12:30","14:00","14:30","15:00","15:30",
  "16:00","16:30","17:00","17:30",
];

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
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { data: services } = useListServices();
  const { data: reviews } = useListReviews();
  const { data: announcements } = useListAnnouncements();
  const { data: teamDoctors = [] } = useQuery<{ id: number; firstName: string; lastName: string; role: string; speciality?: string | null; bio?: string | null }[]>({
    queryKey: ["/api/team"],
    queryFn: () => fetch("/api/team").then(r => r.json()),
    staleTime: 60_000,
  });
  const isAr = language === "ar";
  const { toast } = useToast();

  const [showBooking, setShowBooking] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingDone, setBookingDone] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    firstName: "", lastName: "", phone: "",
    serviceId: "", date: "", time: "", notes: "",
  });

  const openBookingForUser = (serviceId?: string) => {
    setBookingForm({
      firstName: user?.firstName ?? "",
      lastName: user?.lastName ?? "",
      phone: (user as any)?.phone ?? "",
      serviceId: serviceId ?? "",
      date: "", time: "", notes: "",
    });
    setBookingDone(false);
    setShowBooking(true);
  };

  useEffect(() => {
    if (user && sessionStorage.getItem("openBook") === "1") {
      sessionStorage.removeItem("openBook");
      openBookingForUser();
    }
  }, [user]);

  const openBooking = (serviceId?: string) => {
    if (!user) {
      sessionStorage.setItem("pendingBook", "1");
      navigate("/login");
      return;
    }
    openBookingForUser(serviceId);
  };

  const handleBooking = async () => {
    const { firstName, lastName, phone, serviceId, date, time } = bookingForm;
    if (!serviceId || !date || !time) {
      toast({ title: isAr ? "يرجى ملء جميع الحقول المطلوبة" : "Please fill all required fields", variant: "destructive" });
      return;
    }
    if (user && (!firstName || !lastName)) {
      toast({ title: isAr ? "يرجى ملء جميع الحقول المطلوبة" : "Please fill all required fields", variant: "destructive" });
      return;
    }
    if (!user && (!firstName || !lastName || !phone)) {
      toast({ title: isAr ? "يرجى ملء جميع الحقول المطلوبة" : "Please fill all required fields", variant: "destructive" });
      return;
    }
    setBookingLoading(true);
    try {
      const token = getStoredToken();
      const endpoint = user ? "/api/appointments/book" : "/api/appointments/public";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "x-user-id": token } : {}),
        },
        body: JSON.stringify(user
          ? { serviceId: bookingForm.serviceId, date: bookingForm.date, time: bookingForm.time, notes: bookingForm.notes }
          : bookingForm
        ),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed");
      }
      setBookingDone(true);
    } catch (e: any) {
      toast({ title: isAr ? "خطأ في الحجز" : "Booking error", description: e.message, variant: "destructive" });
    } finally {
      setBookingLoading(false);
    }
  };

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
      <Navbar onBook={() => openBooking()} />
      <main className="flex-1">
        <section className="hero-section relative overflow-hidden min-h-[90vh] md:min-h-screen flex flex-col items-center justify-center">
          {/* Background mosaic of dental clinic images */}
          <div className="hero-bg-mosaic">
            <img className="hero-bg-mosaic-img" src="https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=600&q=70&fit=crop" alt="" loading="eager" />
            <img className="hero-bg-mosaic-img" src="https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=600&q=70&fit=crop" alt="" loading="eager" />
            <img className="hero-bg-mosaic-img" src="https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=600&q=70&fit=crop" alt="" loading="eager" />
            <img className="hero-bg-mosaic-img" src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=600&q=70&fit=crop" alt="" loading="eager" />
            <img className="hero-bg-mosaic-img" src="https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=600&q=70&fit=crop" alt="" loading="eager" />
            <img className="hero-bg-mosaic-img" src="https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=600&q=70&fit=crop" alt="" loading="eager" />
          </div>
          <div className="hero-bg-mosaic-overlay" />
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

            <h1 className="mb-4 md:mb-6">
              {isAr ? (
                <>
                  <span className="block hero-calligraphy-line text-foreground text-5xl sm:text-6xl md:text-7xl lg:text-8xl">
                    اِبْتِسَامَتُكَ
                  </span>
                  <span className="block hero-calligraphy-gold text-5xl sm:text-6xl md:text-7xl lg:text-8xl mt-1">
                    تَاجُكَ الذَّهَبِيُّ
                  </span>
                  <div className="hero-title-divider mt-4">
                    <span className="hero-title-divider-ornament">✦</span>
                    <span className="hero-title-divider-ornament">❖</span>
                    <span className="hero-title-divider-ornament">✦</span>
                  </div>
                </>
              ) : (
                <>
                  <span className="block text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold tracking-tight leading-[1.1] text-foreground">
                    Your Smile,
                  </span>
                  <span className="block text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold tracking-tight leading-[1.1] gold-gradient-text">
                    Your Golden Crown
                  </span>
                </>
              )}
            </h1>

            <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-[600px] leading-relaxed mb-6 md:mb-8">
              {isAr
                ? "اكتشف مستوى جديداً من العناية بأسنانك مع أحدث التقنيات وفريق من أفضل الأطباء المتخصصين."
                : "Discover a new level of dental care with cutting-edge technology and a team of top specialists."}
            </p>

            <div className="flex flex-wrap gap-3 justify-center mb-8">
              <Button size="lg" className="h-12 md:h-14 px-6 md:px-8 text-sm md:text-base rounded-2xl shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all group" onClick={() => openBooking()}>
                {t("hero.book")}
                <ArrowRight className={`w-4 h-4 ${isAr ? "mr-2 rotate-180" : "ml-2"} group-hover:translate-x-1 transition-transform`} />
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
                    {service.imageUrl && (
                      <div className="w-full h-40 overflow-hidden rounded-t-2xl">
                        <img src={service.imageUrl} alt={serviceName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onError={e => (e.currentTarget.parentElement!.style.display = "none")} />
                      </div>
                    )}
                    <div className="p-5 md:p-7 space-y-4">
                      {!service.imageUrl && (
                        <div className="service-icon-3d">
                          <ServiceIcon className="w-6 h-6 md:w-7 md:h-7 text-primary" />
                        </div>
                      )}
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
                      <Button className="w-full rounded-xl h-10 text-sm group-hover:shadow-lg group-hover:shadow-primary/20 transition-all" onClick={() => openBooking(String(service.id))}>
                        {isAr ? "احجز الآن" : "Book Now"}
                        <ArrowRight className={`w-3.5 h-3.5 ${isAr ? "mr-1.5 rotate-180" : "ml-1.5"}`} />
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

        {teamDoctors.length > 0 && (
          <section className="py-16 md:py-24 relative">
            <div className="container px-4 md:px-6">
              <div className="text-center mb-10 md:mb-16 space-y-3">
                <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                  {isAr ? "فريقنا الطبي" : "Our Medical Team"}
                </span>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold">
                  {isAr ? "أطباؤنا المتخصصون" : "Meet Our Specialists"}
                </h2>
                <p className="text-sm md:text-base text-muted-foreground max-w-[600px] mx-auto">
                  {isAr
                    ? "نخبة من الأطباء المتخصصين لضمان أفضل رعاية لأسنانك"
                    : "An elite team of specialists to ensure the best dental care"}
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {teamDoctors.map((doctor, index) => (
                  <div key={doctor.id} className="glass-card group text-center" style={{ animationDelay: `${index * 0.1}s` }}>
                    <div className="p-6 md:p-8 space-y-4">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto border-2 border-primary/20 shadow-lg">
                        <span className="text-2xl font-bold text-primary">
                          {doctor.firstName.charAt(0)}{doctor.lastName.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold group-hover:text-primary transition-colors">
                          {isAr ? "د." : "Dr."} {doctor.firstName} {doctor.lastName}
                        </h3>
                        {doctor.speciality && (
                          <p className="text-sm font-medium text-primary/80 mt-1">{doctor.speciality}</p>
                        )}
                      </div>
                      {doctor.bio && (
                        <p className="text-xs md:text-sm text-muted-foreground leading-relaxed line-clamp-3">
                          {doctor.bio}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

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
                  <Button size="lg" className="h-12 px-8 text-sm rounded-2xl shadow-lg shadow-primary/25" onClick={() => openBooking()}>
                    {t("hero.book")}
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

      {/* Booking Dialog */}
      <Dialog open={showBooking} onOpenChange={open => { if (!open) { setShowBooking(false); setBookingDone(false); } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" dir={isAr ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <CalendarCheck className="h-5 w-5 text-primary" />
              {isAr ? "حجز موعد" : "Book an Appointment"}
            </DialogTitle>
          </DialogHeader>

          {bookingDone ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-green-500/10 flex items-center justify-center">
                <CalendarCheck className="h-8 w-8 text-green-500" />
              </div>
              <h3 className="text-xl font-bold text-green-600">
                {isAr ? "تم الحجز بنجاح!" : "Appointment Booked!"}
              </h3>
              <p className="text-muted-foreground text-sm">
                {isAr
                  ? "تم استلام طلبك. سيتصل بك فريقنا لتأكيد الموعد."
                  : "Your request has been received. Our team will contact you to confirm."}
              </p>
              <Button onClick={() => { setShowBooking(false); setBookingDone(false); }}>
                {isAr ? "حسناً" : "Done"}
              </Button>
            </div>
          ) : (
            <>
              <div className="grid gap-4 py-2">
                {user ? (
                  <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-primary/5 border">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                      {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{user.firstName} {user.lastName}</p>
                      <p className="text-xs text-muted-foreground">{(user as any).phone || user.email}</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">{isAr ? "الاسم *" : "First Name *"}</Label>
                        <Input
                          value={bookingForm.firstName}
                          onChange={e => setBookingForm(f => ({ ...f, firstName: e.target.value }))}
                          placeholder={isAr ? "محمد" : "John"}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">{isAr ? "اللقب *" : "Last Name *"}</Label>
                        <Input
                          value={bookingForm.lastName}
                          onChange={e => setBookingForm(f => ({ ...f, lastName: e.target.value }))}
                          placeholder={isAr ? "بن علي" : "Doe"}
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">{isAr ? "رقم الهاتف *" : "Phone Number *"}</Label>
                      <Input
                        dir="ltr"
                        value={bookingForm.phone}
                        onChange={e => setBookingForm(f => ({ ...f, phone: e.target.value }))}
                        placeholder="+213 5XX XXX XXX"
                      />
                    </div>
                  </>
                )}

                <div className="space-y-1">
                  <Label className="text-xs">{isAr ? "الخدمة *" : "Service *"}</Label>
                  <Select value={bookingForm.serviceId} onValueChange={val => setBookingForm(f => ({ ...f, serviceId: val }))}>
                    <SelectTrigger>
                      <SelectValue placeholder={isAr ? "اختر الخدمة" : "Select service"} />
                    </SelectTrigger>
                    <SelectContent>
                      {(services ?? []).map((s: any) => (
                        <SelectItem key={s.id} value={String(s.id)}>
                          {isAr ? (s.nameAr || s.name) : s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">{isAr ? "التاريخ *" : "Date *"}</Label>
                    <Input
                      type="date"
                      dir="ltr"
                      min={new Date().toISOString().split("T")[0]}
                      value={bookingForm.date}
                      onChange={e => setBookingForm(f => ({ ...f, date: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">{isAr ? "الوقت *" : "Time *"}</Label>
                    <Select value={bookingForm.time} onValueChange={val => setBookingForm(f => ({ ...f, time: val }))}>
                      <SelectTrigger>
                        <SelectValue placeholder={isAr ? "الوقت" : "Time"} />
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_SLOTS.map(slot => (
                          <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">{isAr ? "ملاحظات" : "Notes"}</Label>
                  <Textarea
                    value={bookingForm.notes}
                    onChange={e => setBookingForm(f => ({ ...f, notes: e.target.value }))}
                    placeholder={isAr ? "أي معلومات إضافية..." : "Any additional information..."}
                    rows={3}
                  />
                </div>
              </div>

              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setShowBooking(false)}>
                  {isAr ? "إلغاء" : "Cancel"}
                </Button>
                <Button onClick={handleBooking} disabled={bookingLoading} className="gap-1">
                  <CalendarCheck className="h-4 w-4" />
                  {bookingLoading
                    ? (isAr ? "جارٍ الحجز..." : "Booking...")
                    : (isAr ? "تأكيد الحجز" : "Confirm Booking")}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
