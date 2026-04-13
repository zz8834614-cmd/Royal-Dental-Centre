import { Navbar } from "@/components/layout/Navbar";
import { WhatsAppButton } from "@/components/layout/WhatsAppButton";
import { useI18n } from "@/lib/i18n";
import { Card, CardContent } from "@/components/ui/card";
import { Phone, Mail, MapPin, Clock, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ContactPage() {
  const { t } = useI18n();

  const contactInfo = [
    { icon: Phone, label: t("contact.phone"), value: "+213 699 790 790", dir: "ltr" as const },
    { icon: Mail, label: t("contact.email"), value: "info@royaldental.dz", dir: "ltr" as const },
    { icon: MapPin, label: t("contact.address"), value: t("contact.addressValue") },
    { icon: Clock, label: t("contact.workingHours"), value: t("contact.workingHoursValue") },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">{t("nav.contact")}</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {t("contact.pageDesc")}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
          {contactInfo.map((item, i) => {
            const Icon = item.icon;
            return (
              <Card key={i} className="hover:shadow-lg transition-all">
                <CardContent className="p-6 flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{item.label}</h3>
                    <p className="text-muted-foreground text-sm" dir={item.dir}>{item.value}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <Button
            size="lg"
            className="bg-green-600 hover:bg-green-700 gap-2"
            onClick={() => window.open("https://wa.me/213699790790", "_blank")}
          >
            <MessageCircle className="h-5 w-5" />
            {t("contact.whatsapp")}
          </Button>
        </div>
      </main>
      <WhatsAppButton />
    </div>
  );
}
