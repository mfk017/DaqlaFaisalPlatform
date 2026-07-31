// Simple i18n store for now
export const translations = {
  en: {
    app_name: 'Factory Workflow',
    dashboard: 'Dashboard',
    orders: 'Orders',
    invoices: 'Invoices',
    admin: 'Admin',
    users: 'Users',
    categories: 'Categories',
    branches: 'Branches',
    logout: 'Logout',
    pending_approval: 'Pending Approval',
    pending_approval_msg: 'Your account is waiting for administrator approval.',
    refresh: 'Refresh',
    email: 'Email',
    password: 'Password',
    sign_in: 'Sign In',
    sign_up: 'Sign Up',
    forgot_password: 'Forgot Password?',
    full_name: 'Full Name',
    username: 'Username',
    create_account: 'Create Account',
    already_have_account: 'Already have an account? Sign In',
    no_account: 'Don\'t have an account? Sign Up',
  },
  ar: {
    app_name: 'نظام المصنع',
    dashboard: 'لوحة التحكم',
    orders: 'الطلبات',
    invoices: 'الفواتير',
    admin: 'الإدارة',
    users: 'المستخدمين',
    categories: 'التصنيفات',
    branches: 'الفروع',
    logout: 'تسجيل الخروج',
    pending_approval: 'بانتظار الموافقة',
    pending_approval_msg: 'حسابك بانتظار موافقة الإدارة.',
    refresh: 'تحديث',
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    sign_in: 'تسجيل الدخول',
    sign_up: 'إنشاء حساب',
    forgot_password: 'نسيت كلمة المرور؟',
    full_name: 'الاسم الكامل',
    username: 'اسم المستخدم',
    create_account: 'إنشاء الحساب',
    already_have_account: 'لديك حساب بالفعل؟ تسجيل الدخول',
    no_account: 'ليس لديك حساب؟ إنشاء حساب',
  }
};

export type Lang = 'en' | 'ar';

export function getT(lang: Lang = 'ar') {
  return (key: keyof typeof translations['en']) => {
    return translations[lang][key] || translations['en'][key] || key;
  };
}
