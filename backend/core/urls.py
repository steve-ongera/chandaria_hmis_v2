from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    AdminAnalyticsView,
    ConsultationNoteViewSet,
    ConsultationTypeViewSet,
    ConsultationViewSet,
    DiagnosisNoteViewSet,
    DoctorAnalyticsView,
    ICD10CodeViewSet,
    LoginView,
    MedicineViewSet,
    MeView,
    NurseAnalyticsView,
    PatientViewSet,
    PaymentViewSet,
    PrescriptionViewSet,
    TriageViewSet,
    UserViewSet,
    VisitViewSet,
    WalkInSaleViewSet,
)

router = DefaultRouter()
router.register("users", UserViewSet, basename="user")
router.register("consultation-types", ConsultationTypeViewSet, basename="consultationtype")
router.register("icd10-codes", ICD10CodeViewSet, basename="icd10code")
router.register("diagnosis-notes", DiagnosisNoteViewSet, basename="diagnosisnote")
router.register("medicines", MedicineViewSet, basename="medicine")
router.register("patients", PatientViewSet, basename="patient")
router.register("visits", VisitViewSet, basename="visit")
router.register("triages", TriageViewSet, basename="triage")
router.register("consultations", ConsultationViewSet, basename="consultation")
router.register("consultation-notes", ConsultationNoteViewSet, basename="consultationnote")
router.register("prescriptions", PrescriptionViewSet, basename="prescription")
router.register("payments", PaymentViewSet, basename="payment")
router.register("walkin-sales", WalkInSaleViewSet, basename="walkinsale")

urlpatterns = [
    # Auth
    path("auth/login/", LoginView.as_view(), name="token_obtain_pair"),
    path("auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("auth/me/", MeView.as_view(), name="me"),

    # Analytics
    path("analytics/admin/", AdminAnalyticsView.as_view(), name="analytics-admin"),
    path("analytics/doctor/", DoctorAnalyticsView.as_view(), name="analytics-doctor"),
    path("analytics/nurse/", NurseAnalyticsView.as_view(), name="analytics-nurse"),

    # Router-based CRUD
    path("", include(router.urls)),
]