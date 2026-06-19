from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

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


# =============================================================================
# AUTH / USER
# =============================================================================
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Extends the default JWT serializer to embed role + name in the response."""

    def validate(self, attrs):
        data = super().validate(attrs)
        data["user"] = {
            "id": self.user.id,
            "username": self.user.username,
            "first_name": self.user.first_name,
            "last_name": self.user.last_name,
            "role": self.user.role,
        }
        return data


class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, validators=[validate_password])

    class Meta:
        model = User
        fields = [
            "id", "username", "first_name", "last_name", "email",
            "phone", "role", "is_active", "password", "date_joined",
        ]
        read_only_fields = ["date_joined"]

    def create(self, validated_data):
        password = validated_data.pop("password", None)
        user = User(**validated_data)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance


class MeSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "first_name", "last_name", "email", "phone", "role"]


# =============================================================================
# LOOKUP / CATALOGUE
# =============================================================================
class ConsultationTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConsultationType
        fields = ["id", "name", "fee", "is_active"]


class ICD10CodeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ICD10Code
        fields = ["id", "code", "description"]


class DiagnosisNoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = DiagnosisNote
        fields = ["id", "title", "default_amount", "is_active"]


class MedicineSerializer(serializers.ModelSerializer):
    is_low_stock = serializers.BooleanField(read_only=True)

    class Meta:
        model = Medicine
        fields = [
            "id", "name", "unit", "unit_price", "stock_quantity",
            "reorder_level", "is_active", "is_low_stock", "created_at",
        ]


# =============================================================================
# PATIENT
# =============================================================================
class PatientSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)

    class Meta:
        model = Patient
        fields = [
            "id", "first_name", "last_name", "full_name", "phone", "id_number",
            "date_of_birth", "gender", "address", "next_of_kin_name",
            "next_of_kin_phone", "created_at", "updated_at",
        ]


# =============================================================================
# TRIAGE
# =============================================================================
class TriageSerializer(serializers.ModelSerializer):
    recorded_by_name = serializers.CharField(source="recorded_by.get_full_name", read_only=True)

    class Meta:
        model = Triage
        fields = [
            "id", "visit", "blood_pressure", "temperature", "pulse", "weight",
            "height", "notes", "recorded_by", "recorded_by_name", "recorded_at",
        ]
        read_only_fields = ["recorded_by"]


# =============================================================================
# CONSULTATION NOTE / PRESCRIPTION
# =============================================================================
class ConsultationNoteSerializer(serializers.ModelSerializer):
    title = serializers.CharField(read_only=True)

    class Meta:
        model = ConsultationNote
        fields = ["id", "consultation", "diagnosis_note", "custom_title", "amount", "title"]


class PrescriptionSerializer(serializers.ModelSerializer):
    medicine_name = serializers.CharField(source="medicine.name", read_only=True)
    medicine_unit = serializers.CharField(source="medicine.get_unit_display", read_only=True)
    line_total = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = Prescription
        fields = [
            "id", "consultation", "medicine", "medicine_name", "medicine_unit",
            "quantity", "dosage_instructions", "dispensed", "dispensed_at", "line_total",
        ]


# =============================================================================
# CONSULTATION
# =============================================================================
class ConsultationSerializer(serializers.ModelSerializer):
    doctor_name = serializers.CharField(source="doctor.get_full_name", read_only=True)
    icd10_codes_detail = ICD10CodeSerializer(source="icd10_codes", many=True, read_only=True)
    service_notes = ConsultationNoteSerializer(many=True, read_only=True)
    prescriptions = PrescriptionSerializer(many=True, read_only=True)
    patient_name = serializers.CharField(source="visit.patient.full_name", read_only=True)

    class Meta:
        model = Consultation
        fields = [
            "id", "visit", "patient_name", "doctor", "doctor_name", "icd10_codes",
            "icd10_codes_detail", "clinical_notes", "started_at", "completed_at",
            "service_notes", "prescriptions",
        ]
        read_only_fields = ["doctor"]


# =============================================================================
# VISIT (with nested read-only details for queue/billing views)
# =============================================================================
class VisitListSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source="patient.full_name", read_only=True)
    patient_phone = serializers.CharField(source="patient.phone", read_only=True)
    consultation_type_name = serializers.CharField(source="consultation_type.name", read_only=True)
    consultation_fee = serializers.DecimalField(
        source="consultation_type.fee", max_digits=10, decimal_places=2, read_only=True
    )
    has_triage = serializers.SerializerMethodField()

    class Meta:
        model = Visit
        fields = [
            "id", "patient", "patient_name", "patient_phone", "consultation_type",
            "consultation_type_name", "consultation_fee", "status", "created_by",
            "created_at", "updated_at", "has_triage",
        ]
        read_only_fields = ["created_by"]

    def get_has_triage(self, obj):
        return hasattr(obj, "triage")


class VisitDetailSerializer(VisitListSerializer):
    triage = TriageSerializer(read_only=True)
    consultation = ConsultationSerializer(read_only=True)
    patient_detail = PatientSerializer(source="patient", read_only=True)

    class Meta(VisitListSerializer.Meta):
        fields = VisitListSerializer.Meta.fields + ["triage", "consultation", "patient_detail"]


# =============================================================================
# PAYMENT
# =============================================================================
class PaymentSerializer(serializers.ModelSerializer):
    received_by_name = serializers.CharField(source="received_by.get_full_name", read_only=True)

    class Meta:
        model = Payment
        fields = [
            "id", "visit", "amount", "method", "reference",
            "received_by", "received_by_name", "created_at",
        ]
        read_only_fields = ["received_by"]


# =============================================================================
# WALK-IN SALE
# =============================================================================
class WalkInSaleItemSerializer(serializers.ModelSerializer):
    medicine_name = serializers.CharField(source="medicine.name", read_only=True)
    line_total = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = WalkInSaleItem
        fields = ["id", "sale", "medicine", "medicine_name", "quantity", "unit_price", "line_total"]
        read_only_fields = ["unit_price"]


class WalkInSaleSerializer(serializers.ModelSerializer):
    items = WalkInSaleItemSerializer(many=True)
    sold_by_name = serializers.CharField(source="sold_by.get_full_name", read_only=True)
    total = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = WalkInSale
        fields = [
            "id", "customer_name", "sold_by", "sold_by_name", "payment_method",
            "payment_reference", "created_at", "items", "total",
        ]
        read_only_fields = ["sold_by"]

    def create(self, validated_data):
        items_data = validated_data.pop("items")
        sale = WalkInSale.objects.create(**validated_data)
        for item in items_data:
            medicine = item["medicine"]
            quantity = item["quantity"]
            if medicine.stock_quantity < quantity:
                raise serializers.ValidationError(
                    f"Insufficient stock for {medicine.name}. Available: {medicine.stock_quantity}"
                )
            WalkInSaleItem.objects.create(
                sale=sale,
                medicine=medicine,
                quantity=quantity,
                unit_price=medicine.unit_price,
            )
            medicine.stock_quantity -= quantity
            medicine.save(update_fields=["stock_quantity"])
        return sale