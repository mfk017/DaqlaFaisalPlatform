import os
import re

translations = {
    "اختر التصنيف...": "select_category",
    "اختر الفرع...": "select_branch",
    "اختر المرحلة...": "select_stage",
    "اختر الموظف...": "select_employee",
    "استقبال": "reception",
    "استقبال (Reception)": "reception_role",
    "استلام طلب جديد": "new_intake",
    "استلامات اليوم": "intakes_today",
    "استلم": "receive",
    "اسم العامل": "worker_name",
    "اسم العميل": "customer_name",
    "اسم الفرع الجديد...": "new_branch_name",
    "اسم المرحلة (مثال: القص، الخياطة)": "stage_name_example",
    "اسم المستخدم": "username",
    "الأولوية": "priority",
    "الإدارة": "management",
    "الاسم": "name",
    "الاسم الكامل": "full_name",
    "الاسم بالعربي (Label)": "name_arabic_label",
    "الاسم بالعربي (يظهر للمستخدمين)": "name_arabic_display",
    "البريد": "email",
    "البريد الإلكتروني": "email",
    "التخصص المطلوب (اختياري)": "required_specialty_optional",
    "التخصصات والأدوار": "specialties_roles",
    "التصنيف": "category",
    "التصنيفات": "categories",
    "التفاصيل": "details",
    "التقارير": "reports",
    "التقارير التحليلية": "analytical_reports",
    "الحالة": "status",
    "الحالة العامة": "general_status",
    "الخريطة الحرارية للمصنع (Heat Map)": "factory_heatmap",
    "الدور / التخصص": "role_specialty",
    "الدور المطلوب للاستلام": "required_role_receive",
    "الصلاحية": "permission",
    "الطلب": "order",
    "الطلبات": "orders",
    "الطلبات الحالية": "current_orders",
    "الطلبات الحالية المكلف بها": "assigned_current_orders",
    "الطلبات النشطة (قيد التنفيذ)": "active_orders_wip",
    "الطلبات في كل مرحلة (قيد التنفيذ)": "orders_per_stage_wip",
    "العربية": "arabic",
    "العملية الحالية": "current_operation",
    "العميل": "customer",
    "العودة لتسجيل الدخول": "back_to_login",
    "الفرع": "branch",
    "الفرع المطلوب التسليم إليه": "delivery_branch",
    "الفرع الموجه إليه": "target_branch",
    "الفروع": "branches",
    "الفواتير": "invoices",
    "اللغة": "language",
    "المرحلة الأولى": "first_stage",
    "المرحلة الحالية": "current_stage",
    "المرحلة": "stage",
    "المرفقات": "attachments",
    "المستخدمين": "users",
    "المصنع فارغ حالياً": "factory_empty_now",
    "المعرف (Name)": "id_name",
    "المعرف البرمجي (بالإنجليزي، بدون مسافات)": "id_code",
    "المهام المنجزة": "completed_tasks",
    "المهام المنجزة (اليوم)": "completed_tasks_today",
    "المهام المنجزة للموظفين (لا يتأثر بنطاق التاريخ، سجل كامل).": "employee_completed_tasks",
    "المهام الموكلة إلي": "tasks_assigned_to_me",
    "الموظف": "employee",
    "الموظف المسؤول": "responsible_employee",
    "الموظف المسؤول الحالي": "current_responsible_employee",
    "الموظف المستلم": "receiving_employee",
    "الموظف المطلوب": "required_employee",
    "الوقت المتوقع للإنجاز (بالساعات)": "expected_time_hours",
    "الوقت المتوقع": "expected_time",
    "الوقت المستغرق": "time_taken",
    "الوقت المستغرق في هذه المرحلة": "time_taken_in_stage",
    "بانتظار الموافقة": "pending_approval",
    "بمتوسط تأخير": "avg_delay",
    "بناء المسار": "build_workflow",
    "بيانات الطلب": "order_data",
    "تاريخ الإضافة": "added_date",
    "تاريخ التسليم المتوقع": "expected_delivery_date",
    "تاريخ التسليم المتوقع (اختياري)": "expected_delivery_date_optional",
    "تاريخ الطلب": "order_date",
    "تجاوز الوقت المتوقع!": "exceeded_expected_time",
    "تحديث": "refresh",
    "تحديث البيانات...": "updating_data",
    "تحديث تلقائي مستمر": "auto_refresh",
    "تحديد الصلاحية": "set_permission",
    "تسجيل الخروج": "logout",
    "تسجيل الدخول": "login",
    "تسليم نهائي": "final_delivery",
    "تسليم نهائي للطلب": "order_final_delivery",
    "تسليم": "delivery",
    "تصدير CSV": "export_csv",
    "تعديل سير العمل": "edit_workflow",
    "تغيير كلمة المرور": "change_password",
    "تفاصيل الطلب": "order_details",
    "تفعيل الوضع الداكن": "enable_dark_mode",
    "تفعيل الوضع الفاتح": "enable_light_mode",
    "تم إرسال رابط استعادة كلمة المرور إلى بريدك الإلكتروني": "password_reset_sent",
    "تم إرفاق": "attached",
    "تم إنجاز الطلب وتسليمه بالكامل.": "order_fully_completed",
    "تم تغيير كلمة المرور بنجاح. سيتم تحويلك لتسجيل الدخول...": "password_changed_success",
    "تمت إضافة ملاحظة / مرفق": "note_attached_added",
    "تنشيط": "activate",
    "توضح من أي مرحلة يتم رفض الطلبات في الغالب ضمن الفترة.": "shows_stage_rejection",
    "جاري": "in_progress",
    "جاري التحميل...": "loading",
    "جاري التنفيذ": "executing",
    "جودة": "quality",
    "حالة المسار": "workflow_status",
    "حجم العمل ووقت الإنجاز حسب التصنيف": "workload_by_category",
    "حجم العمل ووقت الإنجاز حسب الفرع": "workload_by_branch",
    "حسابك بانتظار موافقة الإدارة.": "account_pending_approval",
    "حسابك بانتظار موافقة الإدارة. يرجى الانتظار أو التواصل مع المشرف.": "account_pending_contact",
    "حفظ التعديلات": "save_changes",
    "خط الإنتاج": "production_line",
    "خطأ في تحميل البيانات": "error_loading_data",
    "خطأ في تحميل بيانات التقارير": "error_loading_reports",
    "خطوات المسار": "workflow_steps",
    "رابط الاستعادة غير صالح أو منتهي الصلاحية.": "invalid_reset_link",
    "رفض": "reject",
    "رقم الفاتورة": "invoice_number",
    "ساعة": "hour",
    "سجل الحركات (Timeline)": "timeline",
    "سجل الحركة المباشر": "live_timeline",
    "سجل الموظف": "employee_record",
    "شاشة الإنتاج (Live)": "live_production_board",
    "شاشة الإنتاج الحية": "live_production_board_2",
    "طبيعي": "normal",
    "طلب": "request",
    "طلب جديد": "new_request",
    "طلبات أنجزت اليوم": "orders_completed_today",
    "طلبات بانتظار فحص الجودة": "orders_pending_qc",
    "طلبات حالية بالانتظار": "current_pending_orders",
    "طلبات قيد التنفيذ": "orders_in_progress",
    "طلبات متأخرة جداً (تجاوزت الوقت المسموح بـ 50%+)": "very_late_orders",
    "طلبات مرفوضة (للتعديل)": "rejected_orders_for_edit",
    "طلبات مستعجلة": "urgent_orders",
    "طلبات منجزة دون رفض": "orders_completed_no_rejection",
    "طلب كلي": "total_orders",
    "عادي": "ordinary",
    "عام": "general",
    "عامل": "worker",
    "عامل (Worker)": "worker_role",
    "عدد الطلبات المتراكمة في كل مرحلة حالياً.": "orders_accumulated_stage",
    "عدد المراحل": "number_of_stages",
    "عرض كل الطلبات": "view_all_orders",
    "عمال (Workers) حسب التخصص:": "workers_by_specialty",
    "عمل رائع! صندوق المهام فارغ.": "great_job_empty",
    "غير معروف": "unknown",
    "غير مكتمل": "incomplete",
    "فات الموعد!": "overdue",
    "في مرحلة": "in_stage",
    "قائمة التخصصات والأدوار": "specialties_roles_list",
    "كل الأولويات": "all_priorities",
    "كلمة المرور": "password",
    "كلمة المرور الجديدة": "new_password",
    "لا توجد طلبات قيد التنفيذ": "no_orders_in_progress",
    "لا توجد طلبات مكلف بها حالياً.": "no_assigned_orders_now",
    "لا يوجد": "none",
    "لا يوجد بيانات للعمال.": "no_workers_data",
    "لا يوجد تخصصات مضافة": "no_specialties_added",
    "لا يوجد تصنيفات حالياً": "no_categories_now",
    "لا يوجد طلبات قيد التنفيذ حالياً.": "no_orders_in_progress_now",
    "لا يوجد طلبات مستعجلة حالياً": "no_urgent_orders_now",
    "لا يوجد طلبات مطابقة للفلتر المحدد": "no_orders_match_filter",
    "لا يوجد فروع حالياً": "no_branches_now",
    "لا يوجد مهام موكلة إليك حالياً": "no_tasks_assigned_now",
    "لديك حساب بالفعل؟ تسجيل الدخول": "already_have_account",
    "لم يتم إضافة أي مراحل بعد": "no_stages_added_yet",
    "لم يتم العثور على التصنيف": "category_not_found",
    "لم يقم هذا الموظف بأي نشاط حتى الآن.": "employee_no_activity_yet",
    "لوحة التحكم": "dashboard",
    "لوحة القيادة": "dashboard_alt",
    "لوحة الموظف:": "employee_dashboard",
    "ليس لديك حساب؟ إنشاء حساب": "no_account",
    "مؤرشف": "archived",
    "متأخر": "late",
    "متأخر بـ": "late_by",
    "متأخر!": "late_exclamation",
    "متوسط وقت الإنجاز": "avg_completion_time",
    "متوسط وقت الإنجاز لكل مرحلة": "avg_completion_time_stage",
    "مدير": "admin",
    "مدير (Admin)": "admin_role",
    "مراقب جودة (Quality)": "quality_inspector",
    "مرفوض": "rejected",
    "مرفوض للتعديل": "rejected_for_edit",
    "مرفوض/معاد": "rejected_returned",
    "مزدحم": "busy",
    "مزدحم (5+)": "busy_5",
    "مزدحم جداً": "very_busy",
    "مزدحم جداً (10+)": "very_busy_10",
    "مستخدم": "user",
    "مستعجل": "urgent",
    "مشرف": "supervisor",
    "مشرف (Supervisor)": "supervisor_role",
    "معاد للتعديل": "returned_for_edit",
    "معدل استلام الطلبات اليومي (Trend)": "daily_intake_rate",
    "معدل المرفوضات (Defect Rate)": "defect_rate",
    "مفتش جودة": "quality_inspector_role",
    "ملاحظة": "note",
    "ملغي": "cancelled",
    "من أصل": "out_of",
    "من إجمالي الطلبات تم رفضها مرة واحدة": "total_orders_rejected_once",
    "من الإنشاء إلى التسليم النهائي": "from_creation_to_delivery",
    "من": "from",
    "منجز": "completed",
    "موافق عليه": "approved",
    "نسبة الطلبات المتأخرة": "late_orders_percentage",
    "نسبة النجاح من أول مرة": "first_time_success_rate",
    "نسبة النجاح من أول مرة (FPY)": "fpy",
    "نسيت كلمة المرور؟": "forgot_password",
    "نشط": "active",
    "نشط الآن": "active_now",
    "نشط ومفعل": "active_and_enabled",
    "نظام المصنع": "app_name",
    "نظرة شاملة على أداء خط الإنتاج، وتتبع الاختناقات، ومعدلات الإنجاز والجودة.": "production_line_overview",
    "نوع المنتج (التصنيف)": "product_type",
    "هذه المرحلة للرقابة والجودة": "stage_is_for_quality",
    "هذه هي المرحلة النهائية (تسليم للفرع)": "stage_is_final",
    "يجب أن يحتوي المسار على الأقل على مرحلة جودة واحدة ومرحلة تسليم نهائية واحدة ليتم تفعيله.": "workflow_requirements",
    "يجب تحديد الموظف الذي سيبدأ العمل على هذا الطلب:": "must_select_starting_employee",
    "يحتاج إلى مرحلة جودة ومرحلة تسليم": "needs_quality_and_delivery",
    "يساعد في تحديد أبطأ الأقسام أو المراحل في المصنع.": "helps_identify_slowest",
    "🔥 مستعجل": "urgent_fire",
    "إضافة فرع": "add_branch",
    "إضافة تصنيف": "add_category",
    "إضافة تخصص": "add_specialty",
    "أرشفة": "archive",
    "إلغاء الأرشفة": "unarchive",
    "حذف": "delete",
    "حفظ": "save",
    "إلغاء": "cancel",
    "إجراءات": "actions",
    "إنشاء الحساب": "create_account",
    "إنشاء حساب": "sign_up"
}

def process_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Skip files that don't need translations
    if not re.search(r'[\u0600-\u06FF]', content):
        return

    # Check if we need to add the import
    has_use_translation = 'useTranslation' in content
    
    modified = content
    
    # Sort translations by length (longest first) to prevent partial matching (e.g. "طلب" matching inside "طلبات")
    sorted_translations = sorted(translations.items(), key=lambda x: len(x[0]), reverse=True)
    
    # 1. Replace exact strings wrapped in quotes: "..." or '...'
    for arabic, eng_key in sorted_translations:
        # Avoid double replacing
        if eng_key in modified:
            pass # We still need to replace Arabic
            
        # Match 'arabic', "arabic", `arabic` -> t('key')
        modified = modified.replace(f'"{arabic}"', f't("{eng_key}")')
        modified = modified.replace(f"'{arabic}'", f't("{eng_key}")')
        modified = modified.replace(f'`{arabic}`', f't("{eng_key}")')
        
        # Match JSX text >arabic< -> >{t("key")}<
        modified = modified.replace(f'>{arabic}<', f'>{{t("{eng_key}")}}<')
        # Match JSX text with spaces
        modified = modified.replace(f'> {arabic} <', f'> {{t("{eng_key}")}} <')
        # Match JSX text with leading space
        modified = modified.replace(f'> {arabic}<', f'> {{t("{eng_key}")}}<')
        # Match JSX text with trailing space
        modified = modified.replace(f'>{arabic} <', f'>{{t("{eng_key}")}} <')
        # Match JSX attribute title="arabic" -> title={t("eng_key")}
        modified = modified.replace(f'="{arabic}"', f'={{t("{eng_key}")}}')

    # Add imports and hook if modifications were made
    if modified != content:
        if not has_use_translation:
            if 'use client' in modified:
                modified = modified.replace('"use client";\n', '"use client";\nimport { useTranslation } from "@/components/layout/I18nProvider";\n')
            else:
                modified = 'import { useTranslation } from "@/components/layout/I18nProvider";\n' + modified
            
            # Inject hook into component function
            # Find export function Name() or export default function Name()
            func_match = re.search(r'export (?:default )?function [A-Za-z0-9_]+\s*\([^)]*\)\s*{', modified)
            if func_match:
                insert_pos = func_match.end()
                modified = modified[:insert_pos] + '\n  const { t } = useTranslation();\n' + modified[insert_pos:]

        with open(path, 'w', encoding='utf-8') as f:
            f.write(modified)
        print(f"Refactored {path}")

def main():
    target_dirs = ['src/components']
    for tdir in target_dirs:
        for root, _, files in os.walk(tdir):
            for file in files:
                if file.endswith('.tsx') or file.endswith('.ts'):
                    process_file(os.path.join(root, file))

if __name__ == '__main__':
    main()
