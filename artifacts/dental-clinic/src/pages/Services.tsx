import { Navbar } from "@/components/layout/Navbar";
import { WhatsAppButton } from "@/components/layout/WhatsAppButton";
import { useI18n } from "@/lib/i18n";
import { useListServices } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Brush, CircleDot, SmilePlus, Sun, Wrench, Syringe, Stethoscope } from "lucide-react";

const iconMap: Record<string, any> = {
  cleaning: Brush,
  filling: CircleDot,
  orthodontics: SmilePlus,
  whitening: Sun,
  implants: Wrench,
  "root canal": Syringe,
};

export default function ServicesPage() {
  const { t, language } = useI18n();
  const isAr = language === "ar";
  const { data: services } = useListServices();

  const hasServices = services && services.length > 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">{t("nav.services")}</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {t("services.pageDesc")}
          </p>
        </div>

        {!hasServices ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
              <Stethoscope className="h-10 w-10 text-primary/50" />
            </div>
            <h2 className="text-xl font-semibold mb-2">
              {isAr ? "لا توجد خدمات متاحة حالياً" : "No services available yet"}
            </h2>
            <p className="text-muted-foreground max-w-sm">
              {isAr
                ? "سيتم إضافة قائمة خدماتنا قريباً. تواصل معنا لمزيد من المعلومات."
                : "Our list of services will be added soon. Contact us for more information."}
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {services.map(service => {
              const IconComp = iconMap[service.name.toLowerCase()] || Stethoscope;
              return (
                <Card key={service.id} className="group hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/30">
                  <CardContent className="p-6">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                      <IconComp className="h-7 w-7 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{isAr ? (service.nameAr || service.name) : service.name}</h3>
                    <p className="text-muted-foreground text-sm mb-4">
                      {isAr ? (service.descriptionAr || service.description) : service.description}
                    </p>
                    <div className="flex items-center justify-between text-sm">
                      {service.price && (
                        <span className="font-semibold text-primary">{service.price} DZD</span>
                      )}
                      {service.duration && (
                        <span className="text-muted-foreground">{service.duration} min</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
      <WhatsAppButton />
    </div>
  );
}
