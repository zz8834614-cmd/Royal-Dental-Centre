import { useListAnnouncements } from "@workspace/api-client-react";
import { useI18n } from "@/lib/i18n";
import { Navbar } from "@/components/layout/Navbar";
import { Newspaper, Tag, Megaphone, Info } from "lucide-react";
import { format } from "date-fns";

const typeIcon = (type: string) => {
  switch (type) {
    case "offer": return <Tag className="h-4 w-4" />;
    case "news": return <Newspaper className="h-4 w-4" />;
    case "alert": return <Info className="h-4 w-4" />;
    default: return <Megaphone className="h-4 w-4" />;
  }
};

const typeLabel = (type: string, isAr: boolean) => {
  const map: Record<string, { ar: string; en: string }> = {
    offer: { ar: "عرض", en: "Offer" },
    news: { ar: "خبر", en: "News" },
    alert: { ar: "تنبيه", en: "Alert" },
    announcement: { ar: "إعلان", en: "Announcement" },
  };
  return isAr ? (map[type]?.ar ?? type) : (map[type]?.en ?? type);
};

const typeColor = (type: string) => {
  switch (type) {
    case "offer": return "bg-green-500/10 text-green-600 border-green-500/20";
    case "news": return "bg-blue-500/10 text-blue-600 border-blue-500/20";
    case "alert": return "bg-red-500/10 text-red-600 border-red-500/20";
    default: return "bg-primary/10 text-primary border-primary/20";
  }
};

export default function NewsOffers() {
  const { language, t } = useI18n();
  const isAr = language === "ar";
  const { data: announcements } = useListAnnouncements();

  const active = announcements?.filter(a => a.isActive) ?? [];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="py-16 md:py-24">
        <div className="container px-4 max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 text-primary text-sm font-medium bg-primary/10 px-4 py-1.5 rounded-full mb-4">
              <Newspaper className="h-4 w-4" />
              {t("nav.news")}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              {isAr ? "آخر الأخبار والعروض" : "Latest News & Offers"}
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              {isAr
                ? "تابع آخر أخبار المركز وعروضنا الحصرية على خدمات طب الأسنان"
                : "Stay updated with the latest clinic news and our exclusive dental offers"}
            </p>
          </div>

          {active.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-4">
              <Newspaper className="h-16 w-16 opacity-20" />
              <p className="text-lg">
                {isAr ? "لا توجد أخبار أو عروض حالياً" : "No news or offers at the moment"}
              </p>
              <p className="text-sm opacity-70">
                {isAr ? "تابعنا للاطلاع على آخر العروض" : "Check back soon for updates"}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {active.map((item, index) => (
                <article
                  key={item.id}
                  className="glass-card p-6 md:p-8 rounded-2xl border border-border/50 hover:border-primary/30 transition-all duration-300"
                  style={{ animationDelay: `${index * 0.08}s` }}
                >
                  <div className="flex flex-col md:flex-row gap-6">
                    {item.imageUrl && (
                      <div className="md:w-48 md:shrink-0">
                        <img
                          src={item.imageUrl}
                          alt=""
                          className="w-full h-40 md:h-36 object-cover rounded-xl"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-3 flex-wrap">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border ${typeColor(item.type)}`}>
                          {typeIcon(item.type)}
                          {typeLabel(item.type, isAr)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(item.createdAt), "dd MMM yyyy")}
                        </span>
                      </div>

                      <h2 className="text-xl font-bold mb-2 leading-snug">
                        {isAr ? (item.titleAr || item.title) : item.title}
                      </h2>

                      <p className="text-muted-foreground leading-relaxed">
                        {isAr ? (item.contentAr || item.content) : item.content}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
