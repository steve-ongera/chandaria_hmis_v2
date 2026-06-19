from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone


# =============================================================================
# USER / ROLES
# =============================================================================
class User(AbstractUser):
    class Role(models.TextChoices):
        ADMIN = "ADMIN", "Admin"
        DOCTOR = "DOCTOR", "Doctor"
        NURSE = "NURSE", "Nurse"

    role = models.CharField(max_length=10, choices=Role.choices, default=Role.NURSE)
    phone = models.CharField(max_length=20, blank=True)

    def __str__(self):
        return f"{self.get_full_name() or self.username} ({self.role})"


# =============================================================================
# PATIENT
# =============================================================================
class Patient(models.Model):
    class Gender(models.TextChoices):
        MALE = "M", "Male"
        FEMALE = "F", "Female"
        OTHER = "O", "Other"

    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    phone = models.CharField(max_length=20, db_index=True)
    id_number = models.CharField(max_length=30, blank=True, db_index=True)
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=1, choices=Gender.choices, default=Gender.OTHER)
    address = models.CharField(max_length=255, blank=True)
    next_of_kin_name = models.CharField(max_length=150, blank=True)
    next_of_kin_phone = models.CharField(max_length=20, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.first_name} {self.last_name}"

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"


# =============================================================================
# CONSULTATION TYPE (configurable pricing, admin managed)
# =============================================================================
class ConsultationType(models.Model):
    name = models.CharField(max_length=100, unique=True)  # General, Specialist, Antenatal...
    fee = models.DecimalField(max_digits=10, decimal_places=2)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} (KES {self.fee})"


# =============================================================================
# ICD-10 CODES
# =============================================================================
class ICD10Code(models.Model):
    code = models.CharField(max_length=10, unique=True, db_index=True)
    description = models.CharField(max_length=255)

    class Meta:
        ordering = ["code"]
        verbose_name = "ICD-10 Code"
        verbose_name_plural = "ICD-10 Codes"

    def __str__(self):
        return f"{self.code} - {self.description}"


# =============================================================================
# DIAGNOSIS / SERVICE NOTES (common service catalogue, admin managed)
# =============================================================================
class DiagnosisNote(models.Model):
    title = models.CharField(max_length=150)  # e.g. "Wound Dressing"
    default_amount = models.DecimalField(max_digits=10, decimal_places=2)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["title"]

    def __str__(self):
        return f"{self.title} (KES {self.default_amount})"


# =============================================================================
# MEDICINE (admin managed, stock tracked)
# =============================================================================
class Medicine(models.Model):
    class Unit(models.TextChoices):
        TABLET = "TABLET", "Tablet"
        STRIP = "STRIP", "Strip"
        BOTTLE = "BOTTLE", "Bottle"
        VIAL = "VIAL", "Vial"
        TUBE = "TUBE", "Tube"
        OTHER = "OTHER", "Other"

    name = models.CharField(max_length=150)
    unit = models.CharField(max_length=10, choices=Unit.choices, default=Unit.TABLET)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    stock_quantity = models.PositiveIntegerField(default=0)
    reorder_level = models.PositiveIntegerField(default=10)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} ({self.get_unit_display()})"

    @property
    def is_low_stock(self):
        return self.stock_quantity <= self.reorder_level


# =============================================================================
# VISIT
# =============================================================================
class Visit(models.Model):
    class Status(models.TextChoices):
        REGISTERED = "REGISTERED", "Registered"
        TRIAGED = "TRIAGED", "Triaged"
        QUEUED = "QUEUED", "Queued"
        IN_CONSULTATION = "IN_CONSULTATION", "In Consultation"
        COMPLETED = "COMPLETED", "Completed"

    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name="visits")
    consultation_type = models.ForeignKey(
        ConsultationType, on_delete=models.PROTECT, related_name="visits"
    )
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.REGISTERED)
    created_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, related_name="visits_registered"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Visit #{self.id} - {self.patient.full_name} ({self.status})"


# =============================================================================
# TRIAGE
# =============================================================================
class Triage(models.Model):
    visit = models.OneToOneField(Visit, on_delete=models.CASCADE, related_name="triage")
    blood_pressure = models.CharField(max_length=20, blank=True)  # e.g. "120/80"
    temperature = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True)  # Celsius
    pulse = models.PositiveIntegerField(null=True, blank=True)  # bpm
    weight = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)  # kg
    height = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)  # cm
    notes = models.TextField(blank=True)
    recorded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    recorded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Triage for Visit #{self.visit_id}"


# =============================================================================
# CONSULTATION
# =============================================================================
class Consultation(models.Model):
    visit = models.OneToOneField(Visit, on_delete=models.CASCADE, related_name="consultation")
    doctor = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="consultations")
    icd10_codes = models.ManyToManyField(ICD10Code, blank=True, related_name="consultations")
    clinical_notes = models.TextField(blank=True)
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Consultation for Visit #{self.visit_id}"

    def mark_completed(self):
        self.completed_at = timezone.now()
        self.save(update_fields=["completed_at"])


# =============================================================================
# CONSULTATION NOTE (through model: Consultation <-> DiagnosisNote, with amount)
# =============================================================================
class ConsultationNote(models.Model):
    consultation = models.ForeignKey(
        Consultation, on_delete=models.CASCADE, related_name="service_notes"
    )
    diagnosis_note = models.ForeignKey(
        DiagnosisNote, on_delete=models.SET_NULL, null=True, blank=True
    )
    custom_title = models.CharField(max_length=150, blank=True)  # only if not using catalogue
    amount = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        title = self.diagnosis_note.title if self.diagnosis_note else self.custom_title
        return f"{title} - KES {self.amount}"

    @property
    def title(self):
        return self.diagnosis_note.title if self.diagnosis_note else self.custom_title


# =============================================================================
# PRESCRIPTION
# =============================================================================
class Prescription(models.Model):
    consultation = models.ForeignKey(
        Consultation, on_delete=models.CASCADE, related_name="prescriptions"
    )
    medicine = models.ForeignKey(Medicine, on_delete=models.PROTECT, related_name="prescriptions")
    quantity = models.PositiveIntegerField()
    dosage_instructions = models.CharField(max_length=255, blank=True)
    dispensed = models.BooleanField(default=False)
    dispensed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.medicine.name} x{self.quantity}"

    @property
    def line_total(self):
        return self.medicine.unit_price * self.quantity


# =============================================================================
# PAYMENT
# =============================================================================
class Payment(models.Model):
    class Method(models.TextChoices):
        CASH = "CASH", "Cash"
        MPESA = "MPESA", "M-Pesa"
        INSURANCE = "INSURANCE", "Insurance"
        CARD = "CARD", "Card"

    visit = models.ForeignKey(Visit, on_delete=models.CASCADE, related_name="payments")
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    method = models.CharField(max_length=10, choices=Method.choices, default=Method.CASH)
    reference = models.CharField(max_length=100, blank=True)  # e.g. M-Pesa code
    received_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Payment KES {self.amount} for Visit #{self.visit_id}"


# =============================================================================
# WALK-IN SALE (no patient/visit needed)
# =============================================================================
class WalkInSale(models.Model):
    customer_name = models.CharField(max_length=150, blank=True)
    sold_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    payment_method = models.CharField(max_length=10, choices=Payment.Method.choices, default=Payment.Method.CASH)
    payment_reference = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Walk-in Sale #{self.id}"

    @property
    def total(self):
        return sum((item.line_total for item in self.items.all()), 0)


class WalkInSaleItem(models.Model):
    sale = models.ForeignKey(WalkInSale, on_delete=models.CASCADE, related_name="items")
    medicine = models.ForeignKey(Medicine, on_delete=models.PROTECT, related_name="walkin_items")
    quantity = models.PositiveIntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)  # snapshot at sale time

    def __str__(self):
        return f"{self.medicine.name} x{self.quantity}"

    @property
    def line_total(self):
        return self.unit_price * self.quantity