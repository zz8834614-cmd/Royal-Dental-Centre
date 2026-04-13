import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Language = "en" | "ar";

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isRtl: boolean;
}

const translations = {
  en: {
    "app.name": "Royal Dental Centre",
    "nav.home": "Home",
    "nav.login": "Login",
    "nav.register": "Register",
    "nav.dashboard": "Dashboard",
    "nav.appointments": "Appointments",
    "nav.records": "Medical Records",
    "nav.prescriptions": "Prescriptions",
    "nav.messages": "Messages",
    "nav.reviews": "Reviews",
    "nav.patients": "Patients",
    "nav.medications": "Medications",
    "nav.announcements": "Announcements",
    "hero.title": "Premium Dental Care",
    "hero.subtitle": "Experience regal care with our expert team.",
    "hero.book": "Book Appointment Now",
  },
  ar: {
    "app.name": "مركز رويال لطب الأسنان",
    "nav.home": "الرئيسية",
    "nav.login": "تسجيل الدخول",
    "nav.register": "تسجيل",
    "nav.dashboard": "لوحة القيادة",
    "nav.appointments": "المواعيد",
    "nav.records": "السجلات الطبية",
    "nav.prescriptions": "الوصفات الطبية",
    "nav.messages": "الرسائل",
    "nav.reviews": "التقييمات",
    "nav.patients": "المرضى",
    "nav.medications": "الأدوية",
    "nav.announcements": "الإعلانات",
    "hero.title": "رعاية أسنان متميزة",
    "hero.subtitle": "استمتع برعاية ملكية مع فريقنا الخبير.",
    "hero.book": "احجز موعدك الآن",
  }
};

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem("language");
    return (saved as Language) || "en";
  });

  useEffect(() => {
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("language", lang);
  };

  const t = (key: string) => {
    return translations[language][key as keyof typeof translations["en"]] || key;
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t, isRtl: language === "ar" }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}
