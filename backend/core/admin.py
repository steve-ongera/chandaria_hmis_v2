from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import (
    Consultation,
    ConsultationNote,
    ConsultationType,
    DiagnosisNote,
    ICD10Code,
    Medicine,
    Patient,
    Payment,
    Prescription,
    Triage,
    User,
    Visit,
    WalkInSale,
    WalkInSaleItem,
)


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ("username", "first_name", "last_name", "role", "is_active")
    list_filter = ("role", "is_active")
    fieldsets = UserAdmin.fieldsets + (
        ("Role Info", {"fields": ("role", "phone")}),
    )


@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    list_display = ("full_name", "phone", "id_number", "gender", "created_at")
    search_fields = ("first_name", "last_name", "phone", "id_number")


@admin.register(ConsultationType)
class ConsultationTypeAdmin(admin.ModelAdmin):
    list_display = ("name", "fee", "is_active")


@admin.register(ICD10Code)
class ICD10CodeAdmin(admin.ModelAdmin):
    list_display = ("code", "description")
    search_fields = ("code", "description")


@admin.register(DiagnosisNote)
class DiagnosisNoteAdmin(admin.ModelAdmin):
    list_display = ("title", "default_amount", "is_active")


@admin.register(Medicine)
class MedicineAdmin(admin.ModelAdmin):
    list_display = ("name", "unit", "unit_price", "stock_quantity", "reorder_level", "is_active")
    list_filter = ("unit", "is_active")
    search_fields = ("name",)


class TriageInline(admin.StackedInline):
    model = Triage
    extra = 0


@admin.register(Visit)
class VisitAdmin(admin.ModelAdmin):
    list_display = ("id", "patient", "consultation_type", "status", "created_at")
    list_filter = ("status", "consultation_type")
    search_fields = ("patient__first_name", "patient__last_name", "patient__phone")
    inlines = [TriageInline]


class ConsultationNoteInline(admin.TabularInline):
    model = ConsultationNote
    extra = 0


class PrescriptionInline(admin.TabularInline):
    model = Prescription
    extra = 0


@admin.register(Consultation)
class ConsultationAdmin(admin.ModelAdmin):
    list_display = ("id", "visit", "doctor", "started_at", "completed_at")
    inlines = [ConsultationNoteInline, PrescriptionInline]


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ("id", "visit", "amount", "method", "received_by", "created_at")
    list_filter = ("method",)


class WalkInSaleItemInline(admin.TabularInline):
    model = WalkInSaleItem
    extra = 0


@admin.register(WalkInSale)
class WalkInSaleAdmin(admin.ModelAdmin):
    list_display = ("id", "customer_name", "sold_by", "payment_method", "created_at")
    inlines = [WalkInSaleItemInline]