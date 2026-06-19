# Hospital Management System (HMS)

A simple Hospital Management System with **Role-Based Access Control (RBAC)** for
**Nurses** (acting as receptionists + triage + dispensing), **Doctors**
(consultation, diagnosis, prescription), and **Admins** (system configuration +
analytics).

Backend: **Django + Django REST Framework** (single app: `core`) + **SimpleJWT**
Frontend: **React (Vite)**

---

## How the system works (flow)

A patient walks into the hospital. The **nurse**, acting as receptionist, searches
for the patient by name/phone/ID number. If the patient does not exist, the nurse
registers them once (name, phone, DOB, gender, etc.) — this creates a permanent
**Patient** record. Every time that same patient comes back, instead of registering
them again, the nurse simply creates a new **Visit** for the existing patient. After
a visit is created, the nurse performs **Triage** (BP, temperature, pulse, weight,
height, notes) and the visit is automatically pushed into the **consultation queue**.

In the **consultation room**, the doctor sees a live queue of waiting patients. The
doctor picks the next patient and starts a **Consultation**. The system
automatically pulls in: the **consultation type** the patient is visiting for (each
type — General, Specialist, Antenatal, etc. — is charged differently), the
**triage data** recorded by the nurse, and a searchable list of **ICD-10 codes** to
attach as diagnosis. The doctor then writes a **prescription** by picking
**medicines already in the system** (with stock and unit type — tablet, strip, or
bottle — so the right quantity unit is used).

For extra clinical services that aren't simple medicine (e.g. wound cleaning,
dressing, minor procedure, delivery, operation), the doctor doesn't type free text
every time — the system stores a list of **common diagnosis/service notes** with a
**default amount**, the doctor selects from that list (or, only when truly
necessary, types a custom note + amount), so charges stay consistent across
doctors.

Once the doctor finishes, the patient is sent back to the **reception/nurse desk**.
The nurse sees the total bill (consultation fee + service notes + medicine cost),
collects payment, and **dispenses** the prescribed medicines from stock. The system
also supports **walk-in sales** (e.g. someone just buying medicine over the counter
without seeing a doctor) handled directly by the nurse.

---

## Roles (RBAC)

| Role   | Can do |
|--------|--------|
| Nurse  | Register patients, create visits, do triage, view queue, record payments, dispense medicine, walk-in sales |
| Doctor | View consultation queue, start/complete consultations, diagnose (ICD-10), add service notes, prescribe medicine |
| Admin  | Manage consultation types, medicines, ICD-10 codes, diagnosis notes, users, view analytics dashboard |

---

## Project Structure

```
hms/
├── README.md
├── backend/
│   ├── manage.py
│   ├── requirements.txt
│   ├── .env.example
│   ├── hms_backend/                # project config
│   │   ├── __init__.py
│   │   ├── settings.py
│   │   ├── urls.py                 # main urls
│   │   ├── wsgi.py
│   │   └── asgi.py
│   └── core/                       # single core app
│       ├── __init__.py
│       ├── apps.py
│       ├── models.py
│       ├── serializers.py
│       ├── views.py
│       ├── permissions.py
│       ├── urls.py                 # app urls
│       ├── admin.py
│       └── management/
│           └── commands/
│               └── seed_data.py    # seeds demo users/medicines/icd10/etc
│
└── frontend/                       # React (Vite) app
    ├── package.json
    ├── vite.config.js
    ├── index.html
    ├── .env.example
    └── src/
        ├── main.jsx
        ├── App.jsx                  # routes, role-based redirects
        ├── api/
        │   └── client.js            # axios instance + JWT interceptors
        ├── auth/
        │   ├── AuthContext.jsx      # auth state, login/logout, role helpers
        │   └── ProtectedRoute.jsx   # route guard by role
        ├── styles/
        │   └── main.css             # all styling, no CSS framework needed
        ├── components/
        │   ├── Navbar.jsx           # top bar: app name, user, logout
        │   ├── Sidebar.jsx          # role-aware nav links (Admin/Doctor/Nurse)
        │   ├── Layout.jsx           # wraps every page with Navbar + Sidebar
        │   ├── StatCard.jsx         # dashboard metric card
        │   └── charts/
        │       ├── RevenueChart.jsx     # line/bar chart (recharts)
        │       ├── VisitsChart.jsx      # visits over time
        │       └── StockChart.jsx       # medicine stock levels
        └── pages/
            ├── Login.jsx             # login + role-based redirect
            ├── nurse/
            │   ├── NurseDashboard.jsx   # nurse stats + charts
            │   ├── Reception.jsx        # patient search/register + create visit
            │   ├── Triage.jsx           # triage form
            │   ├── Billing.jsx          # bill breakdown, payment, dispensing
            │   └── WalkIn.jsx           # walk-in medicine sale
            ├── doctor/
            │   ├── DoctorDashboard.jsx  # doctor stats + charts
            │   ├── Queue.jsx            # consultation queue
            │   └── Consultation.jsx     # consultation room (/consultation/:id)
            └── admin/
                ├── AdminDashboard.jsx   # analytics: revenue, visits, stock graphs
                ├── Medicines.jsx        # manage medicines/stock
                ├── ConsultationTypes.jsx
                ├── ICD10Codes.jsx
                ├── DiagnosisNotes.jsx
                └── Users.jsx            # manage nurse/doctor accounts
```

### Role-based sidebar

`Sidebar.jsx` reads the logged-in user's role (`ADMIN`, `NURSE`, or `DOCTOR`,
stored at login) and shows a different set of links for each:

- **Admin:** Dashboard, Medicines, Consultation Types, ICD-10 Codes, Diagnosis Notes, Users
- **Nurse:** Dashboard, Reception, Triage, Billing & Dispensing, Walk-in Sale
- **Doctor:** Dashboard, Consultation Queue

The role only controls which links are *shown* — the backend (`IsNurse` /
`IsDoctor` / `IsAdmin` permission classes) is what actually enforces access on
every API call.

## Core data model (simplified)

```
Patient ──< Visit ──< Triage
                  ├──< Consultation ──< Prescription >── Medicine
                  │           ├──< ICD10Code (M2M)
                  │           └──< DiagnosisNote (M2M through ConsultationNote, with amount)
                  └──< Payment

WalkInSale ──< WalkInSaleItem >── Medicine   (no patient needed)
```

## Status flow of a Visit

```
registered → triaged → queued → in_consultation → completed
```

## Dashboards & Graphs

- **Admin dashboard:** total revenue (line chart by day/week/month), visits over
  time, top medicines dispensed, low-stock alerts, revenue breakdown by
  consultation type.
- **Doctor dashboard:** consultations completed (daily/weekly), top diagnoses
  (ICD-10), queue wait-time average.
- **Nurse dashboard:** visits registered today, walk-in sales total, payments
  collected today, triage count.

Charts are built with **Recharts** on the frontend, fed by dedicated analytics
endpoints (`/api/analytics/...`) on the backend that aggregate with Django's ORM
(`annotate`, `TruncDate`, `Sum`, `Count`).

## Auth flow

1. User logs in via `/api/auth/login/` with username + password.
2. Backend (SimpleJWT) returns `access` + `refresh` tokens, plus the user's
   `role` and `name`.
3. Frontend stores tokens, attaches `Authorization: Bearer <access>` to every
   request via an axios interceptor, and silently refreshes the access token
   when it expires.
4. On login, the user is redirected based on role:
   `ADMIN → /admin/dashboard`, `DOCTOR → /doctor/dashboard`,
   `NURSE → /nurse/dashboard`.