import { Navbar } from "@/components/layout/Navbar";
import { WhatsAppButton } from "@/components/layout/WhatsAppButton";
import { useI18n } from "@/lib/i18n";
import { useListReviews } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";
import { format } from "date-fns";

export default function ReviewsPage() {
  const { t, language } = useI18n();
  const isAr = language === "ar";
  const { data: reviews } = useListReviews();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">{t("nav.reviews")}</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {t("reviews.pageDesc")}
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {reviews?.map(review => (
            <Card key={review.id} className="hover:shadow-lg transition-all">
              <CardContent className="p-6">
                <div className="flex gap-1 mb-3">
                  {[1,2,3,4,5].map(star => (
                    <Star key={star} className={`h-4 w-4 ${star <= review.rating ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground"}`} />
                  ))}
                </div>
                {review.comment && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{review.comment}</p>
                )}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{review.patientName || t("admin.patient")}</span>
                  {review.createdAt && <span>{format(new Date(review.createdAt), "MMM d, yyyy")}</span>}
                </div>
              </CardContent>
            </Card>
          ))}
          {(!reviews || reviews.length === 0) && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              {t("reviews.noReviews")}
            </div>
          )}
        </div>
      </main>
      <WhatsAppButton />
    </div>
  );
}
