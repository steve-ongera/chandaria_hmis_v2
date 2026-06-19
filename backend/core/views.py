from datetime import timedelta

from django.db.models import Count, Sum, F
from django.db.models.functions import TruncDate
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView

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
)
from .permissions import IsAdmin, IsAdminOrReadOnlyForStaff, IsDoctor, IsNurse
from .serializers import (
    ConsultationNoteSerializer,
    ConsultationSerializer,
    ConsultationTypeSerializer,
    CustomTokenObtainPairSerializer,
    DiagnosisNoteSerializer,
    ICD10CodeSerializer,
    MedicineSerializer,
    MeSerializer,
    PatientSerializer,
    PaymentSerializer,
    PrescriptionSerializer,
    TriageSerializer,
    UserSerializer,
    VisitDetailSerializer,
    VisitListSerializer,
    WalkInSaleSerializer,
)


# =============================================================================
# AUTH
# =============================================================================
class LoginView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(MeSerializer(request.user).data)


# =============================================================================
# ADMIN: USERS
# =============================================================================
class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by("first_name")
    serializer_class = UserSerializer
    permission_classes = [IsAdmin]
    filterset_fields = ["role", "is_active"]
    search_fields = ["first_name", "last_name", "username", "email"]


# =============================================================================
# LOOKUP / CATALOGUE (Admin full CRUD, staff read-only)
# =============================================================================
class ConsultationTypeViewSet(viewsets.ModelViewSet):
    queryset = ConsultationType.objects.all()
    serializer_class = ConsultationTypeSerializer
    permission_classes = [IsAdminOrReadOnlyForStaff]
    filterset_fields = ["is_active"]
    search_fields = ["name"]


class ICD10CodeViewSet(viewsets.ModelViewSet):
    queryset = ICD10Code.objects.all()
    serializer_class = ICD10CodeSerializer
    permission_classes = [IsAdminOrReadOnlyForStaff]
    search_fields = ["code", "description"]


class DiagnosisNoteViewSet(viewsets.ModelViewSet):
    queryset = DiagnosisNote.objects.all()
    serializer_class = DiagnosisNoteSerializer
    permission_classes = [IsAdminOrReadOnlyForStaff]
    filterset_fields = ["is_active"]
    search_fields = ["title"]


class MedicineViewSet(viewsets.ModelViewSet):
    queryset = Medicine.objects.all()
    serializer_class = MedicineSerializer
    permission_classes = [IsAdminOrReadOnlyForStaff]
    filterset_fields = ["is_active", "unit"]
    search_fields = ["name"]

    @action(detail=False, methods=["get"], permission_classes=[IsAuthenticated])
    def low_stock(self, request):
        items = self.get_queryset().filter(stock_quantity__lte=F("reorder_level"), is_active=True)
        return Response(MedicineSerializer(items, many=True).data)


# =============================================================================
# PATIENT (Nurse: full access; Doctor: read-only via consultation flow)
# =============================================================================
class PatientViewSet(viewsets.ModelViewSet):
    queryset = Patient.objects.all()
    serializer_class = PatientSerializer
    permission_classes = [IsAuthenticated]
    search_fields = ["first_name", "last_name", "phone", "id_number"]

    def get_permissions(self):
        if self.request.method not in ("GET", "HEAD", "OPTIONS"):
            return [IsNurse()]
        return [IsAuthenticated()]


# =============================================================================
# VISIT (the central workflow object)
# =============================================================================
class VisitViewSet(viewsets.ModelViewSet):
    queryset = Visit.objects.select_related("patient", "consultation_type", "created_by")
    permission_classes = [IsAuthenticated]
    filterset_fields = ["status", "patient"]
    search_fields = ["patient__first_name", "patient__last_name", "patient__phone"]

    def get_serializer_class(self):
        if self.action in ("retrieve",):
            return VisitDetailSerializer
        return VisitListSerializer

    def get_permissions(self):
        if self.request.method not in ("GET", "HEAD", "OPTIONS"):
            return [IsNurse()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=False, methods=["get"], permission_classes=[IsAuthenticated])
    def queue(self, request):
        """Doctor's live consultation queue: visits that are triaged/queued."""
        visits = self.get_queryset().filter(status=Visit.Status.QUEUED).order_by("created_at")
        return Response(VisitListSerializer(visits, many=True).data)

    @action(detail=False, methods=["get"], permission_classes=[IsAuthenticated])
    def billing_ready(self, request):
        """Nurse billing desk: visits completed by doctor, awaiting payment/dispensing."""
        visits = self.get_queryset().filter(status=Visit.Status.COMPLETED).order_by("-created_at")
        return Response(VisitListSerializer(visits, many=True).data)


# =============================================================================
# TRIAGE (Nurse only — also flips visit status to QUEUED)
# =============================================================================
class TriageViewSet(viewsets.ModelViewSet):
    queryset = Triage.objects.select_related("visit", "recorded_by")
    serializer_class = TriageSerializer
    permission_classes = [IsNurse]

    def perform_create(self, serializer):
        triage = serializer.save(recorded_by=self.request.user)
        visit = triage.visit
        visit.status = Visit.Status.QUEUED
        visit.save(update_fields=["status"])


# =============================================================================
# CONSULTATION (Doctor only)
# =============================================================================
class ConsultationViewSet(viewsets.ModelViewSet):
    queryset = Consultation.objects.select_related("visit__patient", "doctor").prefetch_related(
        "icd10_codes", "service_notes", "prescriptions"
    )
    serializer_class = ConsultationSerializer
    permission_classes = [IsDoctor]

    def perform_create(self, serializer):
        consultation = serializer.save(doctor=self.request.user)
        visit = consultation.visit
        visit.status = Visit.Status.IN_CONSULTATION
        visit.save(update_fields=["status"])

    @action(detail=True, methods=["post"])
    def complete(self, request, pk=None):
        """Doctor finishes consultation -> visit goes back to nurse desk for billing."""
        consultation = self.get_object()
        consultation.mark_completed()
        visit = consultation.visit
        visit.status = Visit.Status.COMPLETED
        visit.save(update_fields=["status"])
        return Response(ConsultationSerializer(consultation).data)


class ConsultationNoteViewSet(viewsets.ModelViewSet):
    queryset = ConsultationNote.objects.select_related("diagnosis_note", "consultation")
    serializer_class = ConsultationNoteSerializer
    permission_classes = [IsDoctor]


class PrescriptionViewSet(viewsets.ModelViewSet):
    queryset = Prescription.objects.select_related("medicine", "consultation")
    serializer_class = PrescriptionSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.request.method not in ("GET", "HEAD", "OPTIONS"):
            # Doctors create prescriptions; nurses update them (dispense)
            return [IsAuthenticated()]
        return [IsAuthenticated()]

    @action(detail=True, methods=["post"], permission_classes=[IsNurse])
    def dispense(self, request, pk=None):
        """Nurse dispenses a prescribed medicine, decrementing stock."""
        prescription = self.get_object()
        if prescription.dispensed:
            return Response({"detail": "Already dispensed."}, status=status.HTTP_400_BAD_REQUEST)
        medicine = prescription.medicine
        if medicine.stock_quantity < prescription.quantity:
            return Response(
                {"detail": f"Insufficient stock for {medicine.name}."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        medicine.stock_quantity -= prescription.quantity
        medicine.save(update_fields=["stock_quantity"])
        prescription.dispensed = True
        prescription.dispensed_at = timezone.now()
        prescription.save(update_fields=["dispensed", "dispensed_at"])
        return Response(PrescriptionSerializer(prescription).data)


# =============================================================================
# PAYMENT (Nurse only)
# =============================================================================
class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.select_related("visit", "received_by")
    serializer_class = PaymentSerializer
    permission_classes = [IsNurse]
    filterset_fields = ["visit", "method"]

    def perform_create(self, serializer):
        serializer.save(received_by=self.request.user)


# =============================================================================
# WALK-IN SALE (Nurse only)
# =============================================================================
class WalkInSaleViewSet(viewsets.ModelViewSet):
    queryset = WalkInSale.objects.prefetch_related("items__medicine").select_related("sold_by")
    serializer_class = WalkInSaleSerializer
    permission_classes = [IsNurse]

    def perform_create(self, serializer):
        serializer.save(sold_by=self.request.user)


# =============================================================================
# ANALYTICS (dashboards & graphs)
# =============================================================================
class AdminAnalyticsView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        days = int(request.query_params.get("days", 14))
        since = timezone.now() - timedelta(days=days)

        # Revenue over time (payments + walk-in sales)
        payments_by_day = (
            Payment.objects.filter(created_at__gte=since)
            .annotate(day=TruncDate("created_at"))
            .values("day")
            .annotate(total=Sum("amount"))
            .order_by("day")
        )
        revenue_series = [
            {"date": str(row["day"]), "revenue": float(row["total"] or 0)} for row in payments_by_day
        ]

        # Visits over time
        visits_by_day = (
            Visit.objects.filter(created_at__gte=since)
            .annotate(day=TruncDate("created_at"))
            .values("day")
            .annotate(total=Count("id"))
            .order_by("day")
        )
        visits_series = [{"date": str(row["day"]), "visits": row["total"]} for row in visits_by_day]

        # Revenue breakdown by consultation type
        revenue_by_type = (
            Visit.objects.filter(created_at__gte=since, status=Visit.Status.COMPLETED)
            .values("consultation_type__name")
            .annotate(total=Sum("consultation_type__fee"), count=Count("id"))
            .order_by("-total")
        )
        revenue_by_type_series = [
            {"name": row["consultation_type__name"] or "Unknown", "value": float(row["total"] or 0), "count": row["count"]}
            for row in revenue_by_type
        ]

        # Top medicines dispensed
        top_medicines = (
            Prescription.objects.filter(dispensed=True, dispensed_at__gte=since)
            .values("medicine__name")
            .annotate(total_qty=Sum("quantity"))
            .order_by("-total_qty")[:8]
        )
        top_medicines_series = [
            {"name": row["medicine__name"], "quantity": row["total_qty"]} for row in top_medicines
        ]

        # Low stock alerts
        low_stock = Medicine.objects.filter(stock_quantity__lte=F("reorder_level"), is_active=True)
        low_stock_series = MedicineSerializer(low_stock, many=True).data

        total_revenue = sum(r["revenue"] for r in revenue_series)
        total_visits = Visit.objects.filter(created_at__gte=since).count()
        total_patients = Patient.objects.count()
        total_low_stock = low_stock.count()

        return Response({
            "summary": {
                "total_revenue": total_revenue,
                "total_visits": total_visits,
                "total_patients": total_patients,
                "low_stock_count": total_low_stock,
            },
            "revenue_series": revenue_series,
            "visits_series": visits_series,
            "revenue_by_type": revenue_by_type_series,
            "top_medicines": top_medicines_series,
            "low_stock": low_stock_series,
        })


class DoctorAnalyticsView(APIView):
    permission_classes = [IsDoctor]

    def get(self, request):
        days = int(request.query_params.get("days", 14))
        since = timezone.now() - timedelta(days=days)
        doctor = request.user

        consultations = Consultation.objects.filter(doctor=doctor, started_at__gte=since)

        consultations_by_day = (
            consultations.filter(completed_at__isnull=False)
            .annotate(day=TruncDate("completed_at"))
            .values("day")
            .annotate(total=Count("id"))
            .order_by("day")
        )
        consultations_series = [
            {"date": str(row["day"]), "consultations": row["total"]} for row in consultations_by_day
        ]

        top_diagnoses = (
            ICD10Code.objects.filter(consultations__in=consultations)
            .annotate(count=Count("consultations"))
            .order_by("-count")
            .values("code", "description", "count")[:8]
        )
        top_diagnoses_series = [
            {"name": f"{row['code']}", "description": row["description"], "count": row["count"]}
            for row in top_diagnoses
        ]

        total_completed = consultations.filter(completed_at__isnull=False).count()
        total_in_progress = consultations.filter(completed_at__isnull=True).count()
        queue_count = Visit.objects.filter(status=Visit.Status.QUEUED).count()

        return Response({
            "summary": {
                "total_completed": total_completed,
                "total_in_progress": total_in_progress,
                "queue_count": queue_count,
            },
            "consultations_series": consultations_series,
            "top_diagnoses": top_diagnoses_series,
        })


class NurseAnalyticsView(APIView):
    permission_classes = [IsNurse]

    def get(self, request):
        days = int(request.query_params.get("days", 14))
        since = timezone.now() - timedelta(days=days)
        today_start = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)

        visits_today = Visit.objects.filter(created_at__gte=today_start).count()
        triages_today = Triage.objects.filter(recorded_at__gte=today_start).count()
        payments_today = Payment.objects.filter(created_at__gte=today_start).aggregate(
            total=Sum("amount")
        )["total"] or 0
        walkin_today = WalkInSale.objects.filter(created_at__gte=today_start).count()

        visits_by_day = (
            Visit.objects.filter(created_at__gte=since)
            .annotate(day=TruncDate("created_at"))
            .values("day")
            .annotate(total=Count("id"))
            .order_by("day")
        )
        visits_series = [{"date": str(row["day"]), "visits": row["total"]} for row in visits_by_day]

        payments_by_method = (
            Payment.objects.filter(created_at__gte=since)
            .values("method")
            .annotate(total=Sum("amount"))
            .order_by("-total")
        )
        payments_by_method_series = [
            {"name": row["method"], "value": float(row["total"] or 0)} for row in payments_by_method
        ]

        return Response({
            "summary": {
                "visits_today": visits_today,
                "triages_today": triages_today,
                "payments_today": float(payments_today),
                "walkin_sales_today": walkin_today,
            },
            "visits_series": visits_series,
            "payments_by_method": payments_by_method_series,
        })