import { useI18n } from "@/lib/i18n";
import { Navbar } from "@/components/layout/Navbar";
import { WhatsAppButton } from "@/components/layout/WhatsAppButton";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Heart, Award, Users, Clock, Stethoscope } from "lucide-react";
import logoPath from "@assets/logo_dentaire_1776084221665.png";

const values = [
  { icon: Shield, en: "Trust & Safety", ar: "الثقة والأمان", descEn: "We prioritize patient safety with the highest sterilization standards and modern infection control protocols.", descAr: "نعطي الأولوية لسلامة المرضى بأعلى معايير التعقيم وبروتوكولات مكافحة العدوى الحديثة." },
  { icon: Heart, en: "Compassionate Care", ar: "رعاية رحيمة", descEn: "Every patient is treated with warmth, respect, and personalized attention to ensure comfort at every visit.", descAr: "يتم التعامل مع كل مريض بدفء واحترام واهتمام شخصي لضمان الراحة في كل زيارة." },
  { icon: Award, en: "Excellence", ar: "التميز", descEn: "Our team of specialists continuously pursues the latest advancements in dental science and technology.", descAr: "يسعى فريقنا من المتخصصين باستمرار لمتابعة أحدث التطورات في علوم وتكنولوجيا طب الأسنان." },
  { icon: Users, en: "Patient-Centered", ar: "التركيز على المريض", descEn: "We listen to our patients, understand their concerns, and tailor treatment plans to their unique needs.", descAr: "نستمع لمرضانا ونفهم مخاوفهم ونصمم خطط العلاج وفقاً لاحتياجاتهم الفريدة." },
  { icon: Clock, en: "Modern Technology", ar: "تكنولوجيا حديثة", descEn: "State-of-the-art equipment including digital X-rays, 3D imaging, and laser-assisted treatments.", descAr: "معدات حديثة تشمل الأشعة الرقمية والتصوير ثلاثي الأبعاد والعلاجات بمساعدة الليزر." },
  { icon: Stethoscope, en: "Comprehensive Services", ar: "خدمات شاملة", descEn: "From routine cleanings to complex implants and orthodontics, all your dental needs under one roof.", descAr: "من التنظيف الروتيني إلى الزراعات المعقدة وتقويم الأسنان، جميع احتياجاتك في مكان واحد." },
];

const teamMembers = [
  { name: "Dr. Ahmed Benali", nameAr: "د. أحمد بن علي", role: "Lead Dentist & Founder", roleAr: "طبيب أسنان رئيسي ومؤسس", descEn: "Over 15 years of experience in cosmetic and restorative dentistry.", descAr: "أكثر من 15 عاماً من الخبرة في طب الأسنان التجميلي والترميمي." },
  { name: "Dr. Leila Kaddour", nameAr: "د. ليلى قدور", role: "Orthodontist", roleAr: "أخصائية تقويم الأسنان", descEn: "Specialist in orthodontics and teeth alignment with modern techniques.", descAr: "أخصائية في تقويم الأسنان ومحاذاة الأسنان بالتقنيات الحديثة." },
  { name: "Dr. Youssef Hamdi", nameAr: "د. يوسف حمدي", role: "Oral Surgeon", roleAr: "جراح الفم", descEn: "Expert in dental implants and oral surgery procedures.", descAr: "خبير في زراعة الأسنان وإجراءات جراحة الفم." },
];

export default function AboutUs() {
  const { t, language } = useI18n();
  const isAr = language === "ar";

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative bg-gradient-to-b from-primary/10 to-background py-20 sm:py-28 overflow-hidden">
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-10 left-10 w-72 h-72 bg-primary rounded-full blur-3xl" />
            <div className="absolute bottom-10 right-10 w-96 h-96 bg-primary rounded-full blur-3xl" />
          </div>
          <div className="container px-4 md:px-6 relative z-10 flex flex-col items-center text-center space-y-6">
            <img src={logoPath} alt="Royal Dental Centre" className="h-28 w-28 object-contain" />
            <h1 className="text-4xl md:text-5xl font-bold tracking-tighter">
              {isAr ? "من نحن" : "About Us"}
            </h1>
            <p className="text-lg text-muted-foreground max-w-[700px] leading-relaxed">
              {isAr
                ? "مركز رويال لطب الأسنان هو وجهتكم الأولى للعناية بصحة الفم والأسنان. نقدم رعاية شاملة ومتميزة بأحدث التقنيات العالمية وبأيدي فريق متخصص من أفضل الأطباء."
                : "Royal Dental Centre is your premier destination for oral and dental health care. We provide comprehensive, premium care with the latest global technologies, delivered by a specialized team of top-tier dentists."}
            </p>
          </div>
        </section>

        {/* Mission & Vision */}
        <section className="py-16 container px-4 md:px-6">
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-8 space-y-4">
                <h3 className="text-2xl font-bold text-primary">
                  {isAr ? "رسالتنا" : "Our Mission"}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {isAr
                    ? "تقديم أعلى مستويات الرعاية الصحية لطب الأسنان في بيئة مريحة وآمنة، مع الالتزام بأحدث التقنيات والمعايير العالمية لضمان ابتسامة صحية وجميلة لكل مريض."
                    : "To provide the highest levels of dental healthcare in a comfortable and safe environment, committed to the latest technologies and global standards to ensure a healthy and beautiful smile for every patient."}
                </p>
              </CardContent>
            </Card>
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-8 space-y-4">
                <h3 className="text-2xl font-bold text-primary">
                  {isAr ? "رؤيتنا" : "Our Vision"}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {isAr
                    ? "أن نكون المركز الرائد والمرجع الأول لطب الأسنان في المنطقة، معروفين بالتميز والابتكار والاهتمام الفائق بصحة وراحة مرضانا."
                    : "To be the leading center and primary reference for dentistry in the region, renowned for excellence, innovation, and exceptional focus on our patients' health and comfort."}
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Values */}
        <section className="py-16 bg-muted/30">
          <div className="container px-4 md:px-6">
            <h2 className="text-3xl font-bold text-center mb-12">
              {isAr ? "قيمنا" : "Our Values"}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {values.map((value, i) => {
                const Icon = value.icon;
                return (
                  <Card key={i} className="group hover:border-primary/40 transition-colors">
                    <CardContent className="p-6 flex flex-col items-start gap-4">
                      <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <Icon className="h-6 w-6" />
                      </div>
                      <h3 className="text-lg font-semibold">{isAr ? value.ar : value.en}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {isAr ? value.descAr : value.descEn}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Team */}
        <section className="py-16 container px-4 md:px-6">
          <h2 className="text-3xl font-bold text-center mb-12">
            {isAr ? "فريقنا الطبي" : "Our Medical Team"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {teamMembers.map((member, i) => (
              <Card key={i} className="overflow-hidden text-center">
                <CardContent className="p-8 space-y-4">
                  <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    <Stethoscope className="h-10 w-10 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold">{isAr ? member.nameAr : member.name}</h3>
                  <p className="text-sm font-medium text-primary">{isAr ? member.roleAr : member.role}</p>
                  <p className="text-sm text-muted-foreground">{isAr ? member.descAr : member.descEn}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Working Hours & Contact */}
        <section className="py-16 bg-primary/5">
          <div className="container px-4 md:px-6">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <h2 className="text-3xl font-bold">{isAr ? "ساعات العمل" : "Working Hours"}</h2>
                <div className="space-y-3">
                  {[
                    { day: isAr ? "السبت - الخميس" : "Saturday - Thursday", hours: isAr ? "09:00 - 18:00" : "09:00 AM - 06:00 PM" },
                    { day: isAr ? "الجمعة" : "Friday", hours: isAr ? "مغلق" : "Closed" },
                  ].map((item, i) => (
                    <div key={i} className="flex justify-between items-center p-4 rounded-lg bg-background border">
                      <span className="font-medium">{item.day}</span>
                      <span className="text-muted-foreground">{item.hours}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-6">
                <h2 className="text-3xl font-bold">{isAr ? "تواصل معنا" : "Contact Us"}</h2>
                <div className="space-y-3">
                  <div className="p-4 rounded-lg bg-background border">
                    <p className="font-medium">{isAr ? "الهاتف" : "Phone"}</p>
                    <p className="text-muted-foreground" dir="ltr">+213 555 123 456</p>
                  </div>
                  <div className="p-4 rounded-lg bg-background border">
                    <p className="font-medium">{isAr ? "البريد الإلكتروني" : "Email"}</p>
                    <p className="text-muted-foreground">contact@royaldental.com</p>
                  </div>
                  <div className="p-4 rounded-lg bg-background border">
                    <p className="font-medium">{isAr ? "العنوان" : "Address"}</p>
                    <p className="text-muted-foreground">
                      {isAr ? "شارع الاستقلال، وسط المدينة" : "Independence Street, City Center"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-12 bg-muted/20">
        <div className="container px-4 md:px-6 text-center text-muted-foreground">
          <p>© {new Date().getFullYear()} Royal Dental Centre. {isAr ? "جميع الحقوق محفوظة." : "All rights reserved."}</p>
        </div>
      </footer>
      <WhatsAppButton />
    </div>
  );
}
