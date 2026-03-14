# BukSU Medical Clinic System – Test Cases

**System:** BukSU Medical Clinic Management System (v2)  
**Tech Stack:** Node.js / Express (Backend), React / Vite (Frontend), MongoDB (Database)  
**Prepared by:** [Tester Name]  
**Date:** March 14, 2026

---

## Table of Contents

1. [Authentication Module](#1-authentication-module)
2. [User Management Module](#2-user-management-module)
3. [Profile Module](#3-profile-module)
4. [Appointment Module](#4-appointment-module)
5. [Consultation Module](#5-consultation-module)
6. [Medicine / Inventory Module](#6-medicine--inventory-module)
7. [Feedback Module](#7-feedback-module)
8. [Password Reset Module](#8-password-reset-module)
9. [Reports Module](#9-reports-module)
10. [Role-Based Access Control (RBAC)](#10-role-based-access-control-rbac)
11. [Notification Module](#11-notification-module)

---

## Test Case Legend

| Field        | Description                                                  |
|--------------|--------------------------------------------------------------|
| **TC-ID**    | Unique test case identifier                                  |
| **Module**   | Feature or module being tested                               |
| **Title**    | Short description of what is being tested                    |
| **Pre-cond** | Pre-conditions required before executing the test            |
| **Steps**    | Step-by-step actions to perform                              |
| **Input**    | Data/values used as input                                    |
| **Expected** | Expected result after the test steps are performed           |
| **Status**   | Pass / Fail / Not Yet Tested                                 |

---

## 1. Authentication Module

### TC-AUTH-001 – Successful Patient Signup

| Field      | Details |
|------------|---------|
| **Module** | Authentication |
| **Title**  | Patient registers a new account with valid data |
| **Pre-cond** | User is not already registered |
| **Steps**  | 1. Navigate to the signup page. <br>2. Fill in all required fields. <br>3. Click "Sign Up". |
| **Input**  | firstName: "Juan", lastName: "Dela Cruz", email: "juan@example.com", password: "securePass123", idNumber: "2021-00001", contactNumber: "09171234567", patientType: "student" |
| **Expected** | Account is created. Success message is shown. Welcome email is sent. User is redirected to login. |
| **Status** | Not Yet Tested |

---

### TC-AUTH-002 – Signup with Missing Required Fields

| Field      | Details |
|------------|---------|
| **Module** | Authentication |
| **Title**  | Registration fails when required fields are missing |
| **Pre-cond** | None |
| **Steps**  | 1. Navigate to the signup page. <br>2. Leave `firstName` blank. <br>3. Submit the form. |
| **Input**  | firstName: "", lastName: "Dela Cruz", email: "juan@example.com", password: "securePass123", idNumber: "2021-00001", contactNumber: "09171234567" |
| **Expected** | HTTP 400 returned. Error message: "All fields are required." |
| **Status** | Not Yet Tested |

---

### TC-AUTH-003 – Signup with Duplicate Email

| Field      | Details |
|------------|---------|
| **Module** | Authentication |
| **Title**  | Registration fails when email is already in use |
| **Pre-cond** | A user with email "juan@example.com" already exists |
| **Steps**  | 1. Navigate to the signup page. <br>2. Fill in all required fields using the existing email. <br>3. Submit the form. |
| **Input**  | email: "juan@example.com" (already registered) |
| **Expected** | HTTP 400 returned. Error message: "Email already registered." |
| **Status** | Not Yet Tested |

---

### TC-AUTH-004 – Successful Local Login

| Field      | Details |
|------------|---------|
| **Module** | Authentication |
| **Title**  | User logs in with valid credentials |
| **Pre-cond** | User account exists and is verified (`isVerified: true`) |
| **Steps**  | 1. Navigate to the login page. <br>2. Enter valid email and password. <br>3. Click "Login". |
| **Input**  | email: "juan@example.com", password: "securePass123" |
| **Expected** | HTTP 200 returned. JWT token is issued. User is redirected to their dashboard based on role. |
| **Status** | Not Yet Tested |

---

### TC-AUTH-005 – Login with Invalid Password

| Field      | Details |
|------------|---------|
| **Module** | Authentication |
| **Title**  | Login fails with wrong password |
| **Pre-cond** | User account exists |
| **Steps**  | 1. Navigate to the login page. <br>2. Enter valid email, incorrect password. <br>3. Submit. |
| **Input**  | email: "juan@example.com", password: "wrongPassword" |
| **Expected** | HTTP 400 returned. Error message: "Invalid credentials." |
| **Status** | Not Yet Tested |

---

### TC-AUTH-006 – Login with Non-Existent Email

| Field      | Details |
|------------|---------|
| **Module** | Authentication |
| **Title**  | Login fails when email does not exist |
| **Pre-cond** | None |
| **Steps**  | 1. Navigate to the login page. <br>2. Enter an unregistered email. <br>3. Submit. |
| **Input**  | email: "notregistered@example.com", password: "anyPassword" |
| **Expected** | HTTP 400 returned. Error message: "Invalid credentials." |
| **Status** | Not Yet Tested |

---

### TC-AUTH-007 – Login with Missing Fields

| Field      | Details |
|------------|---------|
| **Module** | Authentication |
| **Title**  | Login fails when email or password is missing |
| **Pre-cond** | None |
| **Steps**  | 1. Navigate to the login page. <br>2. Leave the password field empty. <br>3. Submit. |
| **Input**  | email: "juan@example.com", password: "" |
| **Expected** | HTTP 400 returned. Error message: "Email and password are required." |
| **Status** | Not Yet Tested |

---

### TC-AUTH-008 – Superadmin Login

| Field      | Details |
|------------|---------|
| **Module** | Authentication |
| **Title**  | Superadmin logs into the superadmin portal |
| **Pre-cond** | A user with role "superadmin" exists |
| **Steps**  | 1. Navigate to the superadmin login page. <br>2. Enter superadmin credentials. <br>3. Submit. |
| **Input**  | email: "superadmin@clinic.com", password: "Admin@1234" |
| **Expected** | HTTP 200 returned. JWT token issued. Redirected to superadmin dashboard. |
| **Status** | Not Yet Tested |

---

### TC-AUTH-009 – Non-Superadmin Accessing Superadmin Login

| Field      | Details |
|------------|---------|
| **Module** | Authentication |
| **Title**  | A regular user is blocked from superadmin login |
| **Pre-cond** | A user with role "patient" exists |
| **Steps**  | 1. POST to `/api/auth/superadmin-login` with a patient's credentials. |
| **Input**  | email: "juan@example.com", password: "securePass123", role: "patient" |
| **Expected** | HTTP 403 returned. Error message: "Access denied. Superadmin only." |
| **Status** | Not Yet Tested |

---

### TC-AUTH-010 – Google Signup

| Field      | Details |
|------------|---------|
| **Module** | Authentication |
| **Title**  | User completes registration via Google OAuth |
| **Pre-cond** | User has a valid Google account and reCAPTCHA token |
| **Steps**  | 1. Click "Sign up with Google". <br>2. Complete the OAuth flow. <br>3. Fill in the extended profile form. <br>4. Submit. |
| **Input**  | Valid Google ID token, firstName, lastName, idNumber, email, patientType: "student" |
| **Expected** | Account is created with `isVerified: true`. JWT token returned. Redirected to dashboard. |
| **Status** | Not Yet Tested |

---

### TC-AUTH-011 – Email Verification

| Field      | Details |
|------------|---------|
| **Module** | Authentication |
| **Title**  | Email verification link verified successfully |
| **Pre-cond** | User account has a `verificationToken` set |
| **Steps**  | 1. GET `/api/auth/verify-email/:token` with a valid token. |
| **Input**  | token: (valid verification token from DB) |
| **Expected** | HTTP 200. `isVerified` set to true. Token cleared. Success message returned. |
| **Status** | Not Yet Tested |

---

### TC-AUTH-012 – Email Verification with Invalid Token

| Field      | Details |
|------------|---------|
| **Module** | Authentication |
| **Title**  | Email verification fails with an invalid or used token |
| **Pre-cond** | None |
| **Steps**  | 1. GET `/api/auth/verify-email/:token` with an invalid token. |
| **Input**  | token: "invalidtoken123abc" |
| **Expected** | HTTP 400. Error message: "Invalid or expired verification token." |
| **Status** | Not Yet Tested |

---

## 2. User Management Module

### TC-USER-001 – Get All Users (Admin)

| Field      | Details |
|------------|---------|
| **Module** | User Management |
| **Title**  | Admin retrieves the full list of users |
| **Pre-cond** | Logged in as admin |
| **Steps**  | 1. GET `/api/users` with a valid admin JWT. |
| **Expected** | HTTP 200. Array of user objects returned (passwords excluded). |
| **Status** | Not Yet Tested |

---

### TC-USER-002 – Get All Users (Unauthorized)

| Field      | Details |
|------------|---------|
| **Module** | User Management |
| **Title**  | Patient cannot access the user list |
| **Pre-cond** | Logged in as patient |
| **Steps**  | 1. GET `/api/users` with a patient JWT. |
| **Expected** | HTTP 403. Error: "Access denied. Admins only." |
| **Status** | Not Yet Tested |

---

### TC-USER-003 – Update User Role (Superadmin)

| Field      | Details |
|------------|---------|
| **Module** | User Management |
| **Title**  | Superadmin promotes a patient to admin |
| **Pre-cond** | Logged in as superadmin. Target user exists with role "patient". |
| **Steps**  | 1. PATCH `/api/users/:id/role` with body `{ role: "admin" }`. |
| **Input**  | role: "admin" |
| **Expected** | HTTP 200. User role is updated. Activity is logged. |
| **Status** | Not Yet Tested |

---

### TC-USER-004 – Update Role with Invalid Role Value

| Field      | Details |
|------------|---------|
| **Module** | User Management |
| **Title**  | Role update rejects invalid role strings |
| **Pre-cond** | Logged in as superadmin |
| **Steps**  | 1. PATCH `/api/users/:id/role` with body `{ role: "nurse" }`. |
| **Input**  | role: "nurse" (not a valid enum value) |
| **Expected** | HTTP 400. Error: "Invalid role specified." |
| **Status** | Not Yet Tested |

---

### TC-USER-005 – Prevent Removing Last Superadmin

| Field      | Details |
|------------|---------|
| **Module** | User Management |
| **Title**  | System prevents the last superadmin from being demoted |
| **Pre-cond** | Only one superadmin exists in the system |
| **Steps**  | 1. PATCH `/api/users/:superadminId/role` with body `{ role: "admin" }`. |
| **Input**  | role: "admin" |
| **Expected** | HTTP 400. Error: "Cannot change role. The system must have at least one superadmin." |
| **Status** | Not Yet Tested |

---

### TC-USER-006 – Update Role as Non-Superadmin

| Field      | Details |
|------------|---------|
| **Module** | User Management |
| **Title**  | Admin cannot change user roles |
| **Pre-cond** | Logged in as admin |
| **Steps**  | 1. PATCH `/api/users/:id/role` with admin JWT. |
| **Expected** | HTTP 403. Error: "Access denied. Superadmins only." |
| **Status** | Not Yet Tested |

---

### TC-USER-007 – Upload Profile Avatar

| Field      | Details |
|------------|---------|
| **Module** | User Management |
| **Title**  | Logged-in user uploads a profile picture |
| **Pre-cond** | User is logged in |
| **Steps**  | 1. POST `/api/users/avatar` with multipart form data containing an image file. |
| **Input**  | file: valid .jpg or .png image |
| **Expected** | HTTP 200. Avatar path stored in DB. Path returned in response. |
| **Status** | Not Yet Tested |

---

## 3. Profile Module

### TC-PROF-001 – Get Own Profile

| Field      | Details |
|------------|---------|
| **Module** | Profile |
| **Title**  | Logged-in patient retrieves their own profile |
| **Pre-cond** | User is logged in |
| **Steps**  | 1. GET `/api/users/profile` with a valid JWT. |
| **Expected** | HTTP 200. User data returned excluding the password field. |
| **Status** | Not Yet Tested |

---

### TC-PROF-002 – Update Profile with Valid Data

| Field      | Details |
|------------|---------|
| **Module** | Profile |
| **Title**  | User updates their profile information |
| **Pre-cond** | User is logged in |
| **Steps**  | 1. PUT `/api/users/profile` with updated fields. |
| **Input**  | contactNumber: "09181234567", homeAddress: "123 BukSU St.", department: "CIT" |
| **Expected** | HTTP 200. Updated user data returned. Activity logged. |
| **Status** | Not Yet Tested |

---

### TC-PROF-003 – Profile Update Version Conflict

| Field      | Details |
|------------|---------|
| **Module** | Profile |
| **Title**  | Concurrent profile update is rejected due to version mismatch |
| **Pre-cond** | User is logged in. DB version is 2. |
| **Steps**  | 1. PUT `/api/users/profile` with `version: 1` (outdated). |
| **Input**  | version: 1 (stale), contactNumber: "09181111111" |
| **Expected** | HTTP 409. Error: "Profile was modified by another process. Please refresh and try again." |
| **Status** | Not Yet Tested |

---

### TC-PROF-004 – Get Profile by ID (Admin)

| Field      | Details |
|------------|---------|
| **Module** | Profile |
| **Title**  | Admin retrieves a specific patient profile |
| **Pre-cond** | Logged in as admin. Target user ID is known. |
| **Steps**  | 1. GET `/api/users/:id` with admin JWT. |
| **Expected** | HTTP 200. Target user data returned. |
| **Status** | Not Yet Tested |

---

## 4. Appointment Module

### TC-APT-001 – Book Appointment with Valid Data

| Field      | Details |
|------------|---------|
| **Module** | Appointments |
| **Title**  | Patient successfully books an appointment |
| **Pre-cond** | Logged in as patient |
| **Steps**  | 1. POST `/api/appointments/book` with required fields. |
| **Input**  | appointmentDate: (future date), purpose: "General Checkup", typeOfVisit: "scheduled" |
| **Expected** | HTTP 201. Appointment created with status "pending". Admin and patient notified. |
| **Status** | Not Yet Tested |

---

### TC-APT-002 – Book Appointment with Past Date

| Field      | Details |
|------------|---------|
| **Module** | Appointments |
| **Title**  | Appointment booking fails for a past date |
| **Pre-cond** | Logged in as patient |
| **Steps**  | 1. POST `/api/appointments/book` with a past date. |
| **Input**  | appointmentDate: "2020-01-01", purpose: "Checkup" |
| **Expected** | HTTP 400. Error: "Cannot book appointments in the past." |
| **Status** | Not Yet Tested |

---

### TC-APT-003 – Book Appointment with Missing Fields

| Field      | Details |
|------------|---------|
| **Module** | Appointments |
| **Title**  | Booking fails when required fields are missing |
| **Pre-cond** | Logged in as patient |
| **Steps**  | 1. POST `/api/appointments/book` omitting `purpose`. |
| **Input**  | appointmentDate: (future date), purpose: "" |
| **Expected** | HTTP 400. Error: "Missing required fields." |
| **Status** | Not Yet Tested |

---

### TC-APT-004 – Book as Non-Patient

| Field      | Details |
|------------|---------|
| **Module** | Appointments |
| **Title**  | Admin cannot book an appointment |
| **Pre-cond** | Logged in as admin |
| **Steps**  | 1. POST `/api/appointments/book` with admin JWT. |
| **Expected** | HTTP 403. Error: "Only patients can book appointments." |
| **Status** | Not Yet Tested |

---

### TC-APT-005 – Get My Appointments (Patient)

| Field      | Details |
|------------|---------|
| **Module** | Appointments |
| **Title**  | Patient retrieves their own appointments |
| **Pre-cond** | Logged in as patient with at least one appointment |
| **Steps**  | 1. GET `/api/appointments/my` with patient JWT. |
| **Expected** | HTTP 200. Array of the patient's appointments returned. |
| **Status** | Not Yet Tested |

---

### TC-APT-006 – Get All Appointments (Admin)

| Field      | Details |
|------------|---------|
| **Module** | Appointments |
| **Title**  | Admin retrieves all system appointments |
| **Pre-cond** | Logged in as admin |
| **Steps**  | 1. GET `/api/appointments` with admin JWT. |
| **Expected** | HTTP 200. All appointments returned (paginated). |
| **Status** | Not Yet Tested |

---

### TC-APT-007 – Approve Appointment (Admin)

| Field      | Details |
|------------|---------|
| **Module** | Appointments |
| **Title**  | Admin approves a pending appointment |
| **Pre-cond** | Appointment exists with `status: "pending"` |
| **Steps**  | 1. POST `/api/appointments/:id/approve` with admin JWT and correct version. |
| **Input**  | version: (current version from DB) |
| **Expected** | HTTP 200. Appointment status → "approved". Patient notified via in-app and email. |
| **Status** | Not Yet Tested |

---

### TC-APT-008 – Approve Appointment with Version Conflict

| Field      | Details |
|------------|---------|
| **Module** | Appointments |
| **Title**  | Concurrent approval fails due to version mismatch |
| **Pre-cond** | Appointment exists. DB version is 2. |
| **Steps**  | 1. POST `/api/appointments/:id/approve` with `version: 0` (stale). |
| **Input**  | version: 0 |
| **Expected** | HTTP 404. Error: "Appointment or patient not found" (optimistic lock fails). |
| **Status** | Not Yet Tested |

---

### TC-APT-009 – Reject Appointment (Admin)

| Field      | Details |
|------------|---------|
| **Module** | Appointments |
| **Title**  | Admin rejects a pending appointment |
| **Pre-cond** | Appointment exists with `status: "pending"` |
| **Steps**  | 1. PATCH `/api/appointments/:id/status` with body `{ status: "rejected", version: N }`. |
| **Expected** | HTTP 200. Status → "rejected". If a Google Calendar event exists, it is deleted. Patient email sent. |
| **Status** | Not Yet Tested |

---

### TC-APT-010 – Reschedule Appointment (Patient or Admin)

| Field      | Details |
|------------|---------|
| **Module** | Appointments |
| **Title**  | Appointment date is updated to a future date |
| **Pre-cond** | Appointment exists and belongs to or is managed by the requester |
| **Steps**  | 1. PUT `/api/appointments/:id` with a new `appointmentDate`. |
| **Input**  | appointmentDate: (new future date), rescheduleReason: "Changed schedule" |
| **Expected** | HTTP 200. Appointment date updated. Reschedule activity logged. Notifications sent. |
| **Status** | Not Yet Tested |

---

### TC-APT-011 – Reschedule to Past Date

| Field      | Details |
|------------|---------|
| **Module** | Appointments |
| **Title**  | Rescheduling to a past date is rejected |
| **Pre-cond** | Appointment exists |
| **Steps**  | 1. PUT `/api/appointments/:id` with a past `appointmentDate`. |
| **Input**  | appointmentDate: "2020-01-01" |
| **Expected** | HTTP 400. Error: "Cannot reschedule to a past date." |
| **Status** | Not Yet Tested |

---

### TC-APT-012 – Delete Appointment (Admin)

| Field      | Details |
|------------|---------|
| **Module** | Appointments |
| **Title**  | Admin deletes an appointment |
| **Pre-cond** | Appointment exists. Logged in as admin. |
| **Steps**  | 1. DELETE `/api/appointments/:id` with admin JWT. |
| **Expected** | HTTP 200. Appointment removed from DB. Patient notified. Activity logged. |
| **Status** | Not Yet Tested |

---

### TC-APT-013 – Delete Appointment as Non-Admin

| Field      | Details |
|------------|---------|
| **Module** | Appointments |
| **Title**  | Patient cannot delete an appointment |
| **Pre-cond** | Logged in as patient |
| **Steps**  | 1. DELETE `/api/appointments/:id` with patient JWT. |
| **Expected** | HTTP 403. Error: "Access denied." |
| **Status** | Not Yet Tested |

---

## 5. Consultation Module

### TC-CONS-001 – Start Consultation (Admin/Doctor)

| Field      | Details |
|------------|---------|
| **Module** | Consultation |
| **Title**  | Clinician starts a consultation for an approved appointment |
| **Pre-cond** | Appointment has `status: "approved"`. Logged in as admin or doctor. |
| **Steps**  | 1. POST `/api/appointments/:id/start` with clinician JWT. |
| **Expected** | HTTP 200. Status → "in-consultation". Doctor ID recorded. Patient notified. |
| **Status** | Not Yet Tested |

---

### TC-CONS-002 – Start Consultation on Non-Approved Appointment

| Field      | Details |
|------------|---------|
| **Module** | Consultation |
| **Title**  | Consultation cannot start for a pending appointment |
| **Pre-cond** | Appointment has `status: "pending"` |
| **Steps**  | 1. POST `/api/appointments/:id/start`. |
| **Expected** | HTTP 400. Error: "Only approved appointments can begin consultation." |
| **Status** | Not Yet Tested |

---

### TC-CONS-003 – Save Consultation with Vitals and Diagnosis

| Field      | Details |
|------------|---------|
| **Module** | Consultation |
| **Title**  | Clinician saves full consultation details |
| **Pre-cond** | Appointment has `status: "in-consultation"` |
| **Steps**  | 1. POST `/api/appointments/:id/save-consultation` with all clinical fields. |
| **Input**  | diagnosis: "Flu", management: "Rest and hydration", bloodPressure: "120/80", temperature: "37.5°C", heartRate: "75", oxygenSaturation: "98%", bmi: "22.5", medicinesPrescribed: [{ name: "Paracetamol 500mg", quantity: 10 }] |
| **Expected** | HTTP 200. All vitals and diagnosis saved. Status → "completed". Patient notified via app and email. |
| **Status** | Not Yet Tested |

---

### TC-CONS-004 – Complete Consultation

| Field      | Details |
|------------|---------|
| **Module** | Consultation |
| **Title**  | Consultation is marked as completed |
| **Pre-cond** | Appointment is in-consultation |
| **Steps**  | 1. POST `/api/appointments/:id/complete` with diagnosis and treatment info. |
| **Expected** | HTTP 200. Status → "completed". `consultationCompletedAt` is set. |
| **Status** | Not Yet Tested |

---

### TC-CONS-005 – Get Consultation Records

| Field      | Details |
|------------|---------|
| **Module** | Consultation |
| **Title**  | Admin retrieves all completed consultations with diagnoses |
| **Pre-cond** | At least one appointment with a diagnosis exists |
| **Steps**  | 1. GET `/api/appointments/consultations` with admin JWT. |
| **Expected** | HTTP 200. Array of consultations (only those with a non-null diagnosis) returned. |
| **Status** | Not Yet Tested |

---

### TC-CONS-006 – Get Medical Certificates

| Field      | Details |
|------------|---------|
| **Module** | Consultation |
| **Title**  | Admin retrieves completed Medical Certificate appointments |
| **Pre-cond** | At least one appointment with purpose "Medical Certificate" and status "completed" |
| **Steps**  | 1. GET `/api/appointments/medical-certificates` with admin JWT. |
| **Expected** | HTTP 200. Array of medical certificate records returned. |
| **Status** | Not Yet Tested |

---

## 6. Medicine / Inventory Module

### TC-MED-001 – Create New Medicine

| Field      | Details |
|------------|---------|
| **Module** | Medicine / Inventory |
| **Title**  | Admin adds a new medicine to inventory |
| **Pre-cond** | Logged in as admin |
| **Steps**  | 1. POST `/api/medicines` with required fields. |
| **Input**  | name: "Paracetamol 500mg", quantityInStock: 100, unit: "tablet", expiryDate: "2027-12-31" |
| **Expected** | HTTP 201. Medicine saved. Activity logged. |
| **Status** | Not Yet Tested |

---

### TC-MED-002 – Create Medicine with Duplicate Name and Expiry

| Field      | Details |
|------------|---------|
| **Module** | Medicine / Inventory |
| **Title**  | Adding a medicine that already exists increments stock |
| **Pre-cond** | "Paracetamol 500mg" with expiry "2027-12-31" already exists with quantity 50 |
| **Steps**  | 1. POST `/api/medicines` with same name and expiry. |
| **Input**  | name: "Paracetamol 500mg", quantityInStock: 30, unit: "tablet", expiryDate: "2027-12-31" |
| **Expected** | HTTP 200. Quantity updated to 80 (50 + 30). |
| **Status** | Not Yet Tested |

---

### TC-MED-003 – Create Medicine with Missing Fields

| Field      | Details |
|------------|---------|
| **Module** | Medicine / Inventory |
| **Title**  | Medicine creation fails when required fields are missing |
| **Pre-cond** | Logged in as admin |
| **Steps**  | 1. POST `/api/medicines` without `expiryDate`. |
| **Input**  | name: "Amoxicillin", quantityInStock: 50, unit: "capsule" |
| **Expected** | HTTP 400. Error: "Missing required fields." |
| **Status** | Not Yet Tested |

---

### TC-MED-004 – Get All Medicines (Admin)

| Field      | Details |
|------------|---------|
| **Module** | Medicine / Inventory |
| **Title**  | Admin retrieves the full medicine list |
| **Pre-cond** | Logged in as admin or doctor |
| **Steps**  | 1. GET `/api/medicines` with admin JWT. |
| **Expected** | HTTP 200. Array of medicines sorted by name and expiry date. |
| **Status** | Not Yet Tested |

---

### TC-MED-005 – Dispense Medicine (Sufficient Stock)

| Field      | Details |
|------------|---------|
| **Module** | Medicine / Inventory |
| **Title**  | Admin manually dispenses medicine from inventory |
| **Pre-cond** | Medicine has at least 10 units in stock |
| **Steps**  | 1. POST `/api/medicines/:id/dispense` with quantity 5. |
| **Input**  | quantity: 5, recipientName: "Juan Dela Cruz" |
| **Expected** | HTTP 200. Stock reduced by 5. Dispense history entry added. |
| **Status** | Not Yet Tested |

---

### TC-MED-006 – Dispense Medicine (Insufficient Stock)

| Field      | Details |
|------------|---------|
| **Module** | Medicine / Inventory |
| **Title**  | Dispensing fails when stock is insufficient |
| **Pre-cond** | Medicine has only 3 units in stock |
| **Steps**  | 1. POST `/api/medicines/:id/dispense` with quantity 10. |
| **Input**  | quantity: 10 |
| **Expected** | HTTP 400. Error: "Not enough stock." |
| **Status** | Not Yet Tested |

---

### TC-MED-007 – Dispense Medicine with Invalid Quantity

| Field      | Details |
|------------|---------|
| **Module** | Medicine / Inventory |
| **Title**  | Dispensing with zero or negative quantity is rejected |
| **Pre-cond** | Medicine exists |
| **Steps**  | 1. POST `/api/medicines/:id/dispense` with quantity 0. |
| **Input**  | quantity: 0 |
| **Expected** | HTTP 400. Error: "Invalid quantity." |
| **Status** | Not Yet Tested |

---

### TC-MED-008 – Deduct Multiple Medicines (Consultation)

| Field      | Details |
|------------|---------|
| **Module** | Medicine / Inventory |
| **Title**  | Batch medicine deduction during consultation |
| **Pre-cond** | Multiple medicines in stock |
| **Steps**  | 1. POST `/api/medicines/deduct` with an array of prescribed medicines. |
| **Input**  | prescribed: [{ medicineId: "...", quantity: 5 }, { medicineId: "...", quantity: 3 }] |
| **Expected** | HTTP 200. Stock reduced for each listed medicine. Transaction committed atomically. |
| **Status** | Not Yet Tested |

---

### TC-MED-009 – Deduct When One Medicine Has No Stock

| Field      | Details |
|------------|---------|
| **Module** | Medicine / Inventory |
| **Title**  | Batch deduction fails and rolls back if any medicine has insufficient stock |
| **Pre-cond** | First medicine has 10 units, second has only 1 unit |
| **Steps**  | 1. POST `/api/medicines/deduct` requesting 5 units of each. |
| **Input**  | prescribed: [{ medicineId: "ID1", quantity: 5 }, { medicineId: "ID2", quantity: 5 }] |
| **Expected** | HTTP 400. Transaction rolled back. Error: "Not enough stock for [medicine name]." |
| **Status** | Not Yet Tested |

---

### TC-MED-010 – Delete Medicine (Admin)

| Field      | Details |
|------------|---------|
| **Module** | Medicine / Inventory |
| **Title**  | Admin deletes a medicine record |
| **Pre-cond** | Medicine exists. Logged in as admin. |
| **Steps**  | 1. DELETE `/api/medicines/:id` with admin JWT. |
| **Expected** | HTTP 200. Medicine deleted. Confirmation message returned. |
| **Status** | Not Yet Tested |

---

### TC-MED-011 – Delete Medicine with Invalid ID

| Field      | Details |
|------------|---------|
| **Module** | Medicine / Inventory |
| **Title**  | Delete fails for a non-existent or malformed ID |
| **Pre-cond** | Logged in as admin |
| **Steps**  | 1. DELETE `/api/medicines/invalidid`. |
| **Expected** | HTTP 400. Error: "Invalid ID." |
| **Status** | Not Yet Tested |

---

### TC-MED-012 – Get Dispense History for a Medicine

| Field      | Details |
|------------|---------|
| **Module** | Medicine / Inventory |
| **Title**  | Retrieves the dispense history of a specific medicine |
| **Pre-cond** | Medicine has at least one dispense record |
| **Steps**  | 1. GET `/api/medicines/:id/dispense-history`. |
| **Expected** | HTTP 200. Array of dispense history records returned (with populated fields). |
| **Status** | Not Yet Tested |

---

### TC-MED-013 – Generate Dispense History PDF Report

| Field      | Details |
|------------|---------|
| **Module** | Medicine / Inventory |
| **Title**  | Admin exports dispense history as a PDF |
| **Pre-cond** | Dispense history records exist |
| **Steps**  | 1. GET `/api/medicines/dispense-history/report` (optionally with date range filters). |
| **Expected** | HTTP 200. PDF file downloaded with dispense records. |
| **Status** | Not Yet Tested |

---

## 7. Feedback Module

### TC-FDBK-001 – Submit Feedback (Patient)

| Field      | Details |
|------------|---------|
| **Module** | Feedback |
| **Title**  | Patient submits feedback for a completed appointment |
| **Pre-cond** | Logged in as patient. Appointment exists and belongs to patient. No feedback exists yet. |
| **Steps**  | 1. POST `/api/feedback` with appointmentId and rating. |
| **Input**  | appointmentId: "...", rating: 5, comment: "Great service!" |
| **Expected** | HTTP 201. Feedback saved. Activity logged. |
| **Status** | Not Yet Tested |

---

### TC-FDBK-002 – Submit Duplicate Feedback

| Field      | Details |
|------------|---------|
| **Module** | Feedback |
| **Title**  | Submitting feedback twice for the same appointment is blocked |
| **Pre-cond** | Feedback already exists for the appointment |
| **Steps**  | 1. POST `/api/feedback` with the same appointmentId. |
| **Expected** | HTTP 400. Error: "Feedback already submitted for this appointment." |
| **Status** | Not Yet Tested |

---

### TC-FDBK-003 – Submit Feedback with Invalid Rating

| Field      | Details |
|------------|---------|
| **Module** | Feedback |
| **Title**  | Feedback fails with a rating outside the 1–5 range |
| **Pre-cond** | Logged in as patient |
| **Steps**  | 1. POST `/api/feedback` with rating: 6. |
| **Input**  | rating: 6 |
| **Expected** | HTTP 400. Error: "Rating must be between 1 and 5." |
| **Status** | Not Yet Tested |

---

### TC-FDBK-004 – Submit Feedback for Another Patient's Appointment

| Field      | Details |
|------------|---------|
| **Module** | Feedback |
| **Title**  | Patient cannot submit feedback for another patient's appointment |
| **Pre-cond** | Appointment belongs to a different patient |
| **Steps**  | 1. POST `/api/feedback` with a foreign appointmentId. |
| **Expected** | HTTP 403. Error: "You can only submit feedback for your own appointments." |
| **Status** | Not Yet Tested |

---

### TC-FDBK-005 – Update Own Feedback (Patient)

| Field      | Details |
|------------|---------|
| **Module** | Feedback |
| **Title**  | Patient updates a previously submitted feedback |
| **Pre-cond** | Feedback was submitted by this patient |
| **Steps**  | 1. PUT `/api/feedback/:feedbackId` with updated rating or comment. |
| **Input**  | rating: 4, comment: "Good but could be better." |
| **Expected** | HTTP 200. Feedback updated. |
| **Status** | Not Yet Tested |

---

### TC-FDBK-006 – Get All Feedback (Admin)

| Field      | Details |
|------------|---------|
| **Module** | Feedback |
| **Title**  | Admin retrieves all feedback |
| **Pre-cond** | At least one feedback record exists |
| **Steps**  | 1. GET `/api/feedback/all` with admin JWT. |
| **Expected** | HTTP 200. Paginated list of all feedback returned. |
| **Status** | Not Yet Tested |

---

### TC-FDBK-007 – Get Feedback Analytics

| Field      | Details |
|------------|---------|
| **Module** | Feedback |
| **Title**  | Admin views overall feedback statistics |
| **Pre-cond** | Multiple feedback records exist |
| **Steps**  | 1. GET `/api/feedback/analytics/overall` with admin JWT. |
| **Expected** | HTTP 200. Returns total count, average rating, distribution, top recipients, 7-day trend. |
| **Status** | Not Yet Tested |

---

## 8. Password Reset Module

### TC-RESET-001 – Request Password Reset with Valid Email

| Field      | Details |
|------------|---------|
| **Module** | Password Reset |
| **Title**  | User requests a password reset code via email |
| **Pre-cond** | User account with the email exists |
| **Steps**  | 1. POST `/api/reset/send` with the registered email. |
| **Input**  | email: "juan@example.com" |
| **Expected** | HTTP 200. 6-digit reset token stored in DB (expires in 10 min). Email with token sent. |
| **Status** | Not Yet Tested |

---

### TC-RESET-002 – Request Reset for Non-Existent Email

| Field      | Details |
|------------|---------|
| **Module** | Password Reset |
| **Title**  | Reset request fails for an unregistered email |
| **Pre-cond** | None |
| **Steps**  | 1. POST `/api/reset/send` with an unregistered email. |
| **Input**  | email: "unknown@example.com" |
| **Expected** | HTTP 404. Error: "User not found." |
| **Status** | Not Yet Tested |

---

### TC-RESET-003 – Verify Reset Token (Valid)

| Field      | Details |
|------------|---------|
| **Module** | Password Reset |
| **Title**  | User verifies the 6-digit reset code successfully |
| **Pre-cond** | Reset token was sent to the email and has not expired |
| **Steps**  | 1. POST `/api/reset/verify` with email and correct token. |
| **Input**  | email: "juan@example.com", token: (valid 6-digit code) |
| **Expected** | HTTP 200. Message: "Token verified." |
| **Status** | Not Yet Tested |

---

### TC-RESET-004 – Verify Reset Token (Expired or Invalid)

| Field      | Details |
|------------|---------|
| **Module** | Password Reset |
| **Title**  | Token verification fails for expired or wrong code |
| **Pre-cond** | Reset token has expired or wrong token entered |
| **Steps**  | 1. POST `/api/reset/verify` with expired or incorrect token. |
| **Input**  | email: "juan@example.com", token: "000000" |
| **Expected** | HTTP 400. Error: "Invalid or expired token." |
| **Status** | Not Yet Tested |

---

### TC-RESET-005 – Reset Password with Valid Token

| Field      | Details |
|------------|---------|
| **Module** | Password Reset |
| **Title**  | User resets their password using a valid token |
| **Pre-cond** | Valid reset token exists for the user |
| **Steps**  | 1. POST `/api/reset/reset` with email, token, and new password. |
| **Input**  | email: "juan@example.com", token: (valid code), newPassword: "NewSecure@456" |
| **Expected** | HTTP 200. Password is updated (hashed). Token cleared. Message: "Password reset successful." |
| **Status** | Not Yet Tested |

---

### TC-RESET-006 – Reset Password with Expired Token

| Field      | Details |
|------------|---------|
| **Module** | Password Reset |
| **Title**  | Password reset fails with an expired token |
| **Pre-cond** | Reset token has expired |
| **Steps**  | 1. POST `/api/reset/reset` with expired token. |
| **Input**  | email: "juan@example.com", token: (expired code), newPassword: "NewSecure@456" |
| **Expected** | HTTP 400. Error: "Invalid or expired token." |
| **Status** | Not Yet Tested |

---

## 9. Reports Module

### TC-RPT-001 – Generate Appointment Summary Report

| Field      | Details |
|------------|---------|
| **Module** | Reports |
| **Title**  | Admin generates a summary report of all appointments |
| **Pre-cond** | At least several appointments exist with various statuses |
| **Steps**  | 1. GET `/api/appointments/reports` with admin JWT. |
| **Expected** | HTTP 200. JSON containing: total, approved, rejected, completed, walk-in, scheduled counts, topDiagnosis, topComplaint, and referralRate (%). |
| **Status** | Not Yet Tested |

---

### TC-RPT-002 – Report Reflects Correct Metrics

| Field      | Details |
|------------|---------|
| **Module** | Reports |
| **Title**  | Report values match the actual database counts |
| **Pre-cond** | Known appointment data set exists |
| **Steps**  | 1. Create 5 appointments (2 approved, 2 completed, 1 rejected). <br>2. GET `/api/appointments/reports`. |
| **Expected** | totalAppointments: 5, approved: 2, completed: 2, rejected: 1. |
| **Status** | Not Yet Tested |

---

## 10. Role-Based Access Control (RBAC)

### TC-RBAC-001 – Patient Cannot Access Admin Dashboard

| Field      | Details |
|------------|---------|
| **Module** | RBAC |
| **Title**  | Unauthorized access to admin-only routes is blocked |
| **Pre-cond** | Logged in as patient |
| **Steps**  | 1. Navigate to `/admin/dashboard` or call any admin-only API. |
| **Expected** | HTTP 403. Error: "Access denied." Page redirected to patient dashboard or unauthorized page. |
| **Status** | Not Yet Tested |

---

### TC-RBAC-002 – Unauthenticated User is Redirected

| Field      | Details |
|------------|---------|
| **Module** | RBAC |
| **Title**  | Accessing a protected route without a JWT redirects to login |
| **Pre-cond** | No JWT in cookies or headers |
| **Steps**  | 1. Try to access any protected API without authentication. |
| **Expected** | HTTP 401. Token is missing or invalid. Frontend redirects to login page. |
| **Status** | Not Yet Tested |

---

### TC-RBAC-003 – Doctor Can Access Consultation View

| Field      | Details |
|------------|---------|
| **Module** | RBAC |
| **Title**  | Doctor role can view and start consultations |
| **Pre-cond** | Logged in as doctor |
| **Steps**  | 1. GET `/api/appointments` with doctor JWT. <br>2. POST `/api/appointments/:id/start`. |
| **Expected** | HTTP 200 for both. Doctor assigned to consultation. |
| **Status** | Not Yet Tested |

---

### TC-RBAC-004 – Patient Cannot View Other Patients' Appointments

| Field      | Details |
|------------|---------|
| **Module** | RBAC |
| **Title**  | Patient access is limited to their own appointments |
| **Pre-cond** | Logged in as patient A. Appointment belongs to patient B. |
| **Steps**  | 1. GET `/api/appointments/patient/:patientBId`. |
| **Expected** | HTTP 403. Error: "Access denied." |
| **Status** | Not Yet Tested |

---

## 11. Notification Module

### TC-NOTIF-001 – New Appointment Triggers Admin Notification

| Field      | Details |
|------------|---------|
| **Module** | Notifications |
| **Title**  | Admin receives a notification when a patient books an appointment |
| **Pre-cond** | An admin account exists |
| **Steps**  | 1. Patient books an appointment. <br>2. Admin checks their notification feed. |
| **Expected** | Admin receives in-app notification: "New appointment booked by [patient name]." |
| **Status** | Not Yet Tested |

---

### TC-NOTIF-002 – Patient Notified on Appointment Approval

| Field      | Details |
|------------|---------|
| **Module** | Notifications |
| **Title**  | Patient receives a notification when their appointment is approved |
| **Pre-cond** | Pending appointment exists |
| **Steps**  | 1. Admin approves the appointment. <br>2. Patient checks notifications. |
| **Expected** | Patient receives in-app notification and email: "Your appointment on [date] has been approved." |
| **Status** | Not Yet Tested |

---

### TC-NOTIF-003 – Patient Notified on Consultation Completion

| Field      | Details |
|------------|---------|
| **Module** | Notifications |
| **Title**  | Patient receives a notification when consultation is marked complete |
| **Pre-cond** | Appointment is in-consultation |
| **Steps**  | 1. Clinician saves/completes consultation. <br>2. Patient checks notifications. |
| **Expected** | Patient receives in-app notification: "Your medical records have been updated." Email sent with diagnosis details. |
| **Status** | Not Yet Tested |

---

### TC-NOTIF-004 – Patient Notified on Appointment Cancellation

| Field      | Details |
|------------|---------|
| **Module** | Notifications |
| **Title**  | Patient is notified when admin deletes their appointment |
| **Pre-cond** | Appointment exists |
| **Steps**  | 1. Admin deletes the appointment. <br>2. Patient checks notifications. |
| **Expected** | Patient receives in-app notification: "Your appointment on [date] has been cancelled by the administrator." |
| **Status** | Not Yet Tested |

---

*End of Test Cases Document*
