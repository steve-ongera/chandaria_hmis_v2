from django.core.management.base import BaseCommand

from core.models import (
    ConsultationType,
    DiagnosisNote,
    ICD10Code,
    Medicine,
    User,
)


class Command(BaseCommand):
    help = "Seeds the database with demo users, medicines, ICD-10 codes, consultation types, and diagnosis notes."

    def handle(self, *args, **options):
        self.seed_users()
        self.seed_consultation_types()
        self.seed_icd10_codes()
        self.seed_diagnosis_notes()
        self.seed_medicines()
        self.stdout.write(self.style.SUCCESS("Seed data created successfully."))

    def seed_users(self):
        users = [
            dict(username="admin", first_name="System", last_name="Admin",
                 role=User.Role.ADMIN, password="admin12345", is_staff=True, is_superuser=True),
            dict(username="drjane", first_name="Jane", last_name="Mwangi",
                 role=User.Role.DOCTOR, password="doctor12345"),
            dict(username="nursejoy", first_name="Joy", last_name="Achieng",
                 role=User.Role.NURSE, password="nurse12345"),
        ]
        for u in users:
            password = u.pop("password")
            user, created = User.objects.get_or_create(username=u["username"], defaults=u)
            if created:
                user.set_password(password)
                user.save()
                self.stdout.write(f"  Created user: {user.username} ({user.role})")

    def seed_consultation_types(self):
        types = [
            ("General", 500),
            ("Specialist", 1500),
            ("Antenatal", 800),
            ("Pediatric", 700),
            ("Dental", 1000),
        ]
        for name, fee in types:
            ConsultationType.objects.get_or_create(name=name, defaults={"fee": fee})

    def seed_icd10_codes(self):
        codes = [
            ("A09", "Diarrhoea and gastroenteritis of presumed infectious origin"),
            ("J00", "Acute nasopharyngitis (common cold)"),
            ("J02.9", "Acute pharyngitis, unspecified"),
            ("J18.9", "Pneumonia, unspecified organism"),
            ("B54", "Unspecified malaria"),
            ("E11", "Type 2 diabetes mellitus"),
            ("I10", "Essential (primary) hypertension"),
            ("K29.7", "Gastritis, unspecified"),
            ("L03.9", "Cellulitis, unspecified"),
            ("N39.0", "Urinary tract infection, site not specified"),
            ("O26.9", "Pregnancy-related condition, unspecified"),
            ("R50.9", "Fever, unspecified"),
            ("S01.0", "Open wound of scalp"),
            ("T14.1", "Open wound, unspecified body region"),
            ("M54.5", "Low back pain"),
        ]
        for code, desc in codes:
            ICD10Code.objects.get_or_create(code=code, defaults={"description": desc})

    def seed_diagnosis_notes(self):
        notes = [
            ("Wound Dressing", 300),
            ("Minor Procedure", 1500),
            ("Suturing", 1200),
            ("Normal Delivery", 8000),
            ("Minor Operation", 5000),
            ("Nebulization", 400),
            ("Injection Administration", 200),
            ("ANC Checkup", 500),
        ]
        for title, amount in notes:
            DiagnosisNote.objects.get_or_create(title=title, defaults={"default_amount": amount})

    def seed_medicines(self):
        medicines = [
            ("Paracetamol 500mg", Medicine.Unit.TABLET, 5, 500, 50),
            ("Amoxicillin 500mg", Medicine.Unit.TABLET, 15, 300, 50),
            ("ORS Sachet", Medicine.Unit.STRIP, 50, 100, 20),
            ("Cough Syrup", Medicine.Unit.BOTTLE, 250, 60, 15),
            ("Artemether/Lumefantrine (AL)", Medicine.Unit.STRIP, 150, 80, 20),
            ("Ibuprofen 400mg", Medicine.Unit.TABLET, 8, 400, 50),
            ("Metformin 500mg", Medicine.Unit.TABLET, 10, 250, 40),
            ("IV Normal Saline 500ml", Medicine.Unit.BOTTLE, 200, 40, 10),
            ("Diclofenac Gel", Medicine.Unit.TUBE, 350, 30, 10),
            ("Vitamin C 1000mg", Medicine.Unit.TABLET, 6, 350, 30),
        ]
        for name, unit, price, stock, reorder in medicines:
            Medicine.objects.get_or_create(
                name=name,
                defaults={
                    "unit": unit,
                    "unit_price": price,
                    "stock_quantity": stock,
                    "reorder_level": reorder,
                },
            )