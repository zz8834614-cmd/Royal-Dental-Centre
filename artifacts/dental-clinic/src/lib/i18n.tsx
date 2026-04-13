import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Language = "en" | "ar";

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isRtl: boolean;
}

const translations: Record<string, Record<string, string>> = {
  en: {
    "app.name": "Royal Dental Centre",
    "nav.home": "Home",
    "nav.about": "About Us",
    "nav.services": "Services",
    "nav.contact": "Contact",
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
    "nav.manageServices": "Manage Services",
    "nav.manageTeam": "Team Management",
    "nav.settings": "Settings",
    "nav.workingHours": "Working Hours",
    "nav.clinic": "The Clinic",
    "nav.management": "Management",
    "nav.logout": "Logout",
    "hero.title": "Premium Dental Care",
    "hero.subtitle": "Experience regal care with our expert team.",
    "hero.book": "Book Appointment Now",
    "auth.loginSuccess": "Logged in successfully",
    "auth.loginFailed": "Login failed",
    "auth.checkCredentials": "Please check your credentials",
    "auth.registerSuccess": "Registered successfully",
    "auth.registerFailed": "Registration failed",
    "auth.checkDetails": "Please check your details",
    "auth.logoutSuccess": "Logged out successfully",
    "auth.logoutFailed": "Logout failed",
    "auth.welcomeBack": "Welcome back",
    "auth.enterCredentials": "Enter your email and password to login",
    "auth.email": "Email",
    "auth.password": "Password",
    "auth.loggingIn": "Logging in...",
    "auth.noAccount": "Don't have an account?",
    "auth.haveAccount": "Already have an account?",
    "auth.createAccount": "Create Account",
    "auth.createAccountDesc": "Enter your details to create a new account",
    "auth.firstName": "First Name",
    "auth.lastName": "Last Name",
    "auth.phone": "Phone",
    "auth.registering": "Registering...",
    "admin.services": "Services Management",
    "admin.addService": "Add Service",
    "admin.editService": "Edit Service",
    "admin.serviceName": "Service Name",
    "admin.serviceNameAr": "Service Name (Arabic)",
    "admin.description": "Description",
    "admin.descriptionAr": "Description (Arabic)",
    "admin.price": "Price (DZD)",
    "admin.duration": "Duration (minutes)",
    "admin.save": "Save",
    "admin.cancel": "Cancel",
    "admin.delete": "Delete",
    "admin.edit": "Edit",
    "admin.actions": "Actions",
    "admin.team": "Team Management",
    "admin.addMember": "Add Team Member",
    "admin.role": "Role",
    "admin.doctor": "Doctor",
    "admin.admin": "Admin",
    "admin.patient": "Patient",
    "admin.addAnnouncement": "Add Announcement",
    "admin.newAnnouncement": "New Announcement",
    "admin.title": "Title",
    "admin.titleAr": "Title (Arabic)",
    "admin.content": "Content",
    "admin.contentAr": "Content (Arabic)",
    "admin.type": "Type",
    "admin.typeNews": "News",
    "admin.typeOffer": "Offer",
    "admin.typeUpdate": "Update",
    "admin.active": "Active",
    "admin.inactive": "Inactive",
    "admin.savedSuccess": "Saved successfully",
    "admin.deletedSuccess": "Deleted successfully",
    "admin.addedSuccess": "Added successfully",
    "admin.roleUpdated": "Role updated successfully",
    "admin.error": "Error occurred",
    "admin.medicalTeam": "Medical & Admin Team",
    "admin.patientsSection": "Patients",
    "services.pageDesc": "We offer a comprehensive range of dental services with the latest technology",
    "reviews.pageDesc": "Our patients' feedback reflects the quality of our services",
    "reviews.noReviews": "No reviews yet",
    "contact.pageDesc": "We're here to help. Reach out to us anytime",
    "contact.phone": "Phone",
    "contact.email": "Email",
    "contact.address": "Address",
    "contact.addressValue": "Algiers, Algeria",
    "contact.workingHours": "Working Hours",
    "contact.workingHoursValue": "Sat - Thu: 8:00 AM - 6:00 PM",
    "contact.whatsapp": "Chat on WhatsApp",
  },
  ar: {
    "app.name": "مركز رويال لطب الأسنان",
    "nav.home": "الرئيسية",
    "nav.about": "من نحن",
    "nav.services": "الخدمات",
    "nav.contact": "اتصل بنا",
    "nav.login": "تسجيل الدخول",
    "nav.register": "تسجيل جديد",
    "nav.dashboard": "لوحة التحكم",
    "nav.appointments": "المواعيد",
    "nav.records": "السجلات الطبية",
    "nav.prescriptions": "الوصفات الطبية",
    "nav.messages": "الرسائل",
    "nav.reviews": "التقييمات",
    "nav.patients": "المرضى",
    "nav.medications": "الأدوية",
    "nav.announcements": "الإعلانات",
    "nav.manageServices": "إدارة الخدمات",
    "nav.manageTeam": "إدارة الفريق",
    "nav.settings": "الإعدادات",
    "nav.workingHours": "أوقات العمل",
    "nav.clinic": "العيادة",
    "nav.management": "الإدارة",
    "nav.logout": "تسجيل الخروج",
    "hero.title": "رعاية أسنان متميزة",
    "hero.subtitle": "استمتع برعاية ملكية مع فريقنا الخبير.",
    "hero.book": "احجز موعدك الآن",
    "auth.loginSuccess": "تم تسجيل الدخول بنجاح",
    "auth.loginFailed": "فشل تسجيل الدخول",
    "auth.checkCredentials": "يرجى التحقق من بياناتك",
    "auth.registerSuccess": "تم التسجيل بنجاح",
    "auth.registerFailed": "فشل التسجيل",
    "auth.checkDetails": "يرجى التحقق من التفاصيل",
    "auth.logoutSuccess": "تم تسجيل الخروج بنجاح",
    "auth.logoutFailed": "فشل تسجيل الخروج",
    "auth.welcomeBack": "مرحباً بعودتك",
    "auth.enterCredentials": "أدخل بريدك الإلكتروني وكلمة المرور",
    "auth.email": "البريد الإلكتروني",
    "auth.password": "كلمة المرور",
    "auth.loggingIn": "جاري تسجيل الدخول...",
    "auth.noAccount": "ليس لديك حساب؟",
    "auth.haveAccount": "لديك حساب بالفعل؟",
    "auth.createAccount": "إنشاء حساب جديد",
    "auth.createAccountDesc": "أدخل بياناتك لإنشاء حساب جديد",
    "auth.firstName": "الاسم الأول",
    "auth.lastName": "اسم العائلة",
    "auth.phone": "رقم الهاتف",
    "auth.registering": "جاري التسجيل...",
    "admin.services": "إدارة الخدمات",
    "admin.addService": "إضافة خدمة",
    "admin.editService": "تعديل الخدمة",
    "admin.serviceName": "اسم الخدمة",
    "admin.serviceNameAr": "اسم الخدمة (عربي)",
    "admin.description": "الوصف",
    "admin.descriptionAr": "الوصف (عربي)",
    "admin.price": "السعر (د.ج)",
    "admin.duration": "المدة (دقائق)",
    "admin.save": "حفظ",
    "admin.cancel": "إلغاء",
    "admin.delete": "حذف",
    "admin.edit": "تعديل",
    "admin.actions": "الإجراءات",
    "admin.team": "إدارة الفريق",
    "admin.addMember": "إضافة عضو",
    "admin.role": "الدور",
    "admin.doctor": "طبيب",
    "admin.admin": "مسؤول",
    "admin.patient": "مريض",
    "admin.addAnnouncement": "إضافة إعلان",
    "admin.newAnnouncement": "إعلان جديد",
    "admin.title": "العنوان",
    "admin.titleAr": "العنوان (عربي)",
    "admin.content": "المحتوى",
    "admin.contentAr": "المحتوى (عربي)",
    "admin.type": "النوع",
    "admin.typeNews": "أخبار",
    "admin.typeOffer": "عروض",
    "admin.typeUpdate": "تحديث",
    "admin.active": "نشط",
    "admin.inactive": "غير نشط",
    "admin.savedSuccess": "تم الحفظ بنجاح",
    "admin.deletedSuccess": "تم الحذف بنجاح",
    "admin.addedSuccess": "تم الإضافة بنجاح",
    "admin.roleUpdated": "تم تحديث الدور بنجاح",
    "admin.error": "حدث خطأ",
    "admin.medicalTeam": "الفريق الطبي والإداري",
    "admin.patientsSection": "المرضى",
    "services.pageDesc": "نقدم مجموعة شاملة من خدمات طب الأسنان بأحدث التقنيات",
    "reviews.pageDesc": "آراء مرضانا تعكس جودة خدماتنا",
    "reviews.noReviews": "لا توجد تقييمات بعد",
    "contact.pageDesc": "نحن هنا لمساعدتك. تواصل معنا في أي وقت",
    "contact.phone": "الهاتف",
    "contact.email": "البريد",
    "contact.address": "العنوان",
    "contact.addressValue": "الجزائر العاصمة، الجزائر",
    "contact.workingHours": "ساعات العمل",
    "contact.workingHoursValue": "السبت - الخميس: 8:00 - 18:00",
    "contact.whatsapp": "تواصل عبر واتساب",
  }
};

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem("language");
    return (saved as Language) || "ar";
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
    return translations[language]?.[key] || translations["en"]?.[key] || key;
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
