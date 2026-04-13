import { useI18n } from "@/lib/i18n";
import { Navbar } from "@/components/layout/Navbar";
import { WhatsAppButton } from "@/components/layout/WhatsAppButton";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useListServices, useListReviews, useListAnnouncements } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Star } from "lucide-react";

export default function Landing() {
  const { t, language } = useI18n();
  const { data: services } = useListServices();
  const { data: reviews } = useListReviews();
  const { data: announcements } = useListAnnouncements();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-primary/5 py-24 sm:py-32">
          <div className="container px-4 md:px-6 flex flex-col items-center text-center space-y-8">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tighter text-foreground">
              {t("hero.title")}
            </h1>
            <p className="text-xl text-muted-foreground max-w-[600px]">
              {t("hero.subtitle")}
            </p>
            <Button size="lg" className="h-12 px-8 text-lg" asChild>
              <Link href="/login">{t("hero.book")}</Link>
            </Button>
          </div>
        </section>

        {/* Services */}
        <section className="py-20 container px-4 md:px-6">
          <h2 className="text-3xl font-bold text-center mb-12">Our Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {services?.slice(0, 6).map(service => (
              <Card key={service.id}>
                <CardHeader>
                  <CardTitle>{language === 'ar' ? service.nameAr : service.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    {language === 'ar' ? service.descriptionAr : service.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Announcements */}
        {announcements && announcements.length > 0 && (
          <section className="py-20 bg-muted/50">
            <div className="container px-4 md:px-6">
              <h2 className="text-3xl font-bold text-center mb-12">Clinic News & Offers</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {announcements.filter(a => a.isActive).map(announcement => (
                  <Card key={announcement.id}>
                    <CardHeader>
                      <CardTitle>{language === 'ar' ? announcement.titleAr : announcement.title}</CardTitle>
                      <CardDescription className="uppercase font-semibold tracking-wider text-xs text-primary">
                        {announcement.type}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        {language === 'ar' ? announcement.contentAr : announcement.content}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Reviews */}
        {reviews && reviews.length > 0 && (
          <section className="py-20 container px-4 md:px-6">
            <h2 className="text-3xl font-bold text-center mb-12">Patient Reviews</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {reviews.slice(0, 3).map(review => (
                <Card key={review.id}>
                  <CardHeader>
                    <div className="flex items-center gap-1 mb-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-4 h-4 ${i < review.rating ? "fill-primary text-primary" : "text-muted"}`} 
                        />
                      ))}
                    </div>
                    <CardTitle className="text-base">{review.patientName}</CardTitle>
                    {review.serviceName && (
                      <CardDescription>{review.serviceName}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm italic text-muted-foreground">"{review.comment}"</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}
      </main>
      <footer className="border-t py-12 bg-muted/20">
        <div className="container px-4 md:px-6 text-center text-muted-foreground">
          <p>© {new Date().getFullYear()} Royal Dental Centre. All rights reserved.</p>
        </div>
      </footer>
      <WhatsAppButton />
    </div>
  );
}
