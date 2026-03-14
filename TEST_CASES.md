# BukSU Medical Clinic System – Test Cases

**System:** BukSU Medical Clinic Management System (v2)  
**Tech Stack:** Node.js / Express (Backend), React / Vite (Frontend), MongoDB  
**Prepared by:** [Tester Name]  
**Date:** March 14, 2026

---

## Module 1: Authentication

| Test Case # | Test Case Description | Test Steps | Test Data | Expected Result | Actual Result | Pass/Fail | Remarks |
|---|---|---|---|---|---|---|---|
| TC-AUTH-001 | Patient registers with valid data | 1. Go to signup page. 2. Fill all required fields. 3. Click Sign Up. | firstName: "Juan", lastName: "Dela Cruz", email: "juan@example.com", password: "Pass@123", idNumber: "2021-00001", contactNumber: "09171234567", patientType: "student" | Account created. Success message shown. Welcome email sent. Redirected to login. | | | |
| TC-AUTH-002 | Signup fails with missing required fields | 1. Go to signup page. 2. Leave firstName blank. 3. Submit. | firstName: "" (all other fields valid) | HTTP 400. Error: "All fields are required." | | | |
| TC-AUTH-003 | Signup fails with duplicate email | 1. Go to signup page. 2. Use an already-registered email. 3. Submit. | email: "juan@example.com" (already registered) | HTTP 400. Error: "Email already registered." | | | |
| TC-AUTH-004 | Patient logs in with valid credentials | 1. Go to login page. 2. Enter valid email and password. 3. Click Login. | email: "juan@example.com", password: "Pass@123" | HTTP 200. JWT issued. Redirected to patient dashboard. | | | |
| TC-AUTH-005 | Login fails with wrong password | 1. Go to login page. 2. Enter valid email, wrong password. 3. Submit. | email: "juan@example.com", password: "wrongPass" | HTTP 400. Error: "Invalid credentials." | | | |
| TC-AUTH-006 | Login fails with non-existent email | 1. Go to login page. 2. Enter unregistered email. 3. Submit. | email: "ghost@example.com", password: "anyPass" | HTTP 400. Error: "Invalid credentials." | | | |
| TC-AUTH-007 | Login fails with missing fields | 1. Go to login page. 2. Leave password blank. 3. Submit. | email: "juan@example.com", password: "" | HTTP 400. Error: "Email and password are required." | | | |
| TC-AUTH-008 | Superadmin logs in successfully | 1. Go to superadmin login. 2. Enter superadmin credentials. 3. Submit. | email: "superadmin@clinic.com", password: "Admin@1234" | HTTP 200. JWT issued. Redirected to superadmin dashboard. | | | |
| TC-AUTH-009 | Non-superadmin blocked from superadmin login | 1. POST to superadmin login endpoint with patient credentials. | email: "juan@example.com", password: "Pass@123", role: "patient" | HTTP 403. Error: "Access denied. Superadmin only." | | | |
| TC-AUTH-010 | Google OAuth signup completes successfully | 1. Click Sign up with Google. 2. Complete OAuth flow. 3. Fill extended profile. 4. Submit. | Valid Google ID, idNumber, patientType: "student" | Account created with isVerified: true. JWT issued. Redirected to dashboard. | | | |
| TC-AUTH-011 | Email verification with valid token | 1. Access verify-email link with a valid token. | token: (valid token from DB) | HTTP 200. isVerified set to true. Token cleared. Success message shown. | | | |
| TC-AUTH-012 | Email verification fails with invalid token | 1. Access verify-email link with an invalid token. | token: "invalidtoken123" | HTTP 400. Error: "Invalid or expired verification token." | | | |

---

## Module 2: User Management

| Test Case # | Test Case Description | Test Steps | Test Data | Expected Result | Actual Result | Pass/Fail | Remarks |
|---|---|---|---|---|---|---|---|
| TC-USER-001 | Admin retrieves the full user list | 1. Log in as admin. 2. GET /api/users. | Admin JWT | HTTP 200. Array of users returned (passwords excluded). | | | |
| TC-USER-002 | Patient cannot access user list | 1. Log in as patient. 2. GET /api/users. | Patient JWT | HTTP 403. Error: "Access denied. Admins only." | | | |
| TC-USER-003 | Superadmin promotes patient to admin | 1. Log in as superadmin. 2. PATCH /api/users/:id/role with role: "admin". | role: "admin" | HTTP 200. Role updated. Activity logged. | | | |
| TC-USER-004 | Role update rejects invalid role string | 1. Log in as superadmin. 2. PATCH /api/users/:id/role with role: "nurse". | role: "nurse" | HTTP 400. Error: "Invalid role specified." | | | |
| TC-USER-005 | System prevents removing the last superadmin | 1. Log in as superadmin (only one exists). 2. Try to change own role to "admin". | role: "admin" | HTTP 400. Error: "Cannot change role. The system must have at least one superadmin." | | | |
| TC-USER-006 | Admin cannot change user roles | 1. Log in as admin. 2. PATCH /api/users/:id/role. | Admin JWT | HTTP 403. Error: "Access denied. Superadmins only." | | | |
| TC-USER-007 | User uploads a profile picture | 1. Log in. 2. POST /api/users/avatar with an image file. | file: valid .jpg or .png image | HTTP 200. Avatar path stored in DB. Path returned in response. | | | |

---

## Module 3: Profile

| Test Case # | Test Case Description | Test Steps | Test Data | Expected Result | Actual Result | Pass/Fail | Remarks |
|---|---|---|---|---|---|---|---|
| TC-PROF-001 | Logged-in user retrieves own profile | 1. Log in. 2. GET /api/users/profile. | Valid JWT | HTTP 200. User data returned (no password). | | | |
| TC-PROF-002 | User updates profile with valid data | 1. Log in. 2. PUT /api/users/profile with updated fields. | contactNumber: "09181234567", department: "CIT" | HTTP 200. Updated user data returned. Activity logged. | | | |
| TC-PROF-003 | Profile update fails on version conflict | 1. Log in. 2. PUT /api/users/profile with a stale version number. | version: 1 (DB version is 2) | HTTP 409. Error: "Profile was modified by another process. Please refresh and try again." | | | |
| TC-PROF-004 | Admin retrieves a specific user's profile | 1. Log in as admin. 2. GET /api/users/:id. | Admin JWT, target user ID | HTTP 200. Target user data returned. | | | |

---

## Module 4: Appointments

| Test Case # | Test Case Description | Test Steps | Test Data | Expected Result | Actual Result | Pass/Fail | Remarks |
|---|---|---|---|---|---|---|---|
| TC-APT-001 | Patient books an appointment with valid data | 1. Log in as patient. 2. POST /api/appointments/book with required fields. | appointmentDate: (future date), purpose: "General Checkup", typeOfVisit: "scheduled" | HTTP 201. Appointment created with status "pending". Admin and patient notified. | | | |
| TC-APT-002 | Booking fails for a past date | 1. Log in as patient. 2. POST /api/appointments/book with a past date. | appointmentDate: "2020-01-01" | HTTP 400. Error: "Cannot book appointments in the past." | | | |
| TC-APT-003 | Booking fails with missing fields | 1. Log in as patient. 2. POST /api/appointments/book without purpose. | appointmentDate: (future date), purpose: "" | HTTP 400. Error: "Missing required fields." | | | |
| TC-APT-004 | Admin cannot book an appointment | 1. Log in as admin. 2. POST /api/appointments/book. | Admin JWT | HTTP 403. Error: "Only patients can book appointments." | | | |
| TC-APT-005 | Patient retrieves their own appointments | 1. Log in as patient. 2. GET /api/appointments/my. | Patient JWT | HTTP 200. List of patient's appointments returned. | | | |
| TC-APT-006 | Admin retrieves all appointments | 1. Log in as admin. 2. GET /api/appointments. | Admin JWT | HTTP 200. All appointments returned (paginated). | | | |
| TC-APT-007 | Admin approves a pending appointment | 1. Log in as admin. 2. POST /api/appointments/:id/approve with current version. | version: (current version from DB) | HTTP 200. Status → "approved". Patient notified via app and email. | | | |
| TC-APT-008 | Approval fails on version conflict | 1. Log in as admin. 2. POST /api/appointments/:id/approve with stale version. | version: 0 (DB version is 2) | HTTP 404. Approval rejected due to optimistic lock failure. | | | |
| TC-APT-009 | Admin rejects a pending appointment | 1. Log in as admin. 2. PATCH /api/appointments/:id/status with status: "rejected". | status: "rejected", version: N | HTTP 200. Status → "rejected". Patient email sent. Google Calendar event deleted if applicable. | | | |
| TC-APT-010 | Appointment is rescheduled to a future date | 1. Log in as patient or admin. 2. PUT /api/appointments/:id with new date. | appointmentDate: (new future date), rescheduleReason: "Changed schedule" | HTTP 200. Date updated. Reschedule activity logged. Notifications sent. | | | |
| TC-APT-011 | Rescheduling to a past date is rejected | 1. Log in. 2. PUT /api/appointments/:id with a past date. | appointmentDate: "2020-01-01" | HTTP 400. Error: "Cannot reschedule to a past date." | | | |
| TC-APT-012 | Admin deletes an appointment | 1. Log in as admin. 2. DELETE /api/appointments/:id. | Admin JWT | HTTP 200. Appointment deleted. Patient notified. Activity logged. | | | |
| TC-APT-013 | Patient cannot delete an appointment | 1. Log in as patient. 2. DELETE /api/appointments/:id. | Patient JWT | HTTP 403. Error: "Access denied." | | | |

---

## Module 5: Consultation

| Test Case # | Test Case Description | Test Steps | Test Data | Expected Result | Actual Result | Pass/Fail | Remarks |
|---|---|---|---|---|---|---|---|
| TC-CONS-001 | Clinician starts a consultation for an approved appointment | 1. Log in as admin/doctor. 2. POST /api/appointments/:id/start. | Appointment with status "approved" | HTTP 200. Status → "in-consultation". Doctor ID recorded. Patient notified. | | | |
| TC-CONS-002 | Consultation cannot start for a pending appointment | 1. Log in as admin. 2. POST /api/appointments/:id/start on a pending appointment. | Appointment with status "pending" | HTTP 400. Error: "Only approved appointments can begin consultation." | | | |
| TC-CONS-003 | Clinician saves full consultation with vitals | 1. Log in as admin/doctor. 2. POST /api/appointments/:id/save-consultation with all clinical fields. | diagnosis: "Flu", bloodPressure: "120/80", temperature: "37.5", heartRate: "75", oxygenSaturation: "98%", bmi: "22.5", medicinesPrescribed: [{name: "Paracetamol", quantity: 10}] | HTTP 200. Vitals and diagnosis saved. Status → "completed". Patient notified via app and email. | | | |
| TC-CONS-004 | Consultation is marked complete | 1. Log in as admin/doctor. 2. POST /api/appointments/:id/complete with diagnosis. | diagnosis: "Hypertension", management: "Rest" | HTTP 200. Status → "completed". consultationCompletedAt timestamp set. | | | |
| TC-CONS-005 | Admin retrieves all consultation records | 1. Log in as admin. 2. GET /api/appointments/consultations. | Admin JWT | HTTP 200. Array of appointments with a non-null diagnosis returned. | | | |
| TC-CONS-006 | Admin retrieves completed Medical Certificate requests | 1. Log in as admin. 2. GET /api/appointments/medical-certificates. | Admin JWT | HTTP 200. Array of Medical Certificate appointments with status "completed" returned. | | | |

---

## Module 6: Medicine / Inventory

| Test Case # | Test Case Description | Test Steps | Test Data | Expected Result | Actual Result | Pass/Fail | Remarks |
|---|---|---|---|---|---|---|---|
| TC-MED-001 | Admin adds a new medicine to inventory | 1. Log in as admin. 2. POST /api/medicines with required fields. | name: "Paracetamol 500mg", quantityInStock: 100, unit: "tablet", expiryDate: "2027-12-31" | HTTP 201. Medicine saved. Activity logged. | | | |
| TC-MED-002 | Adding an existing medicine increments stock | 1. Log in as admin. 2. POST /api/medicines with same name and expiry as an existing record. | name: "Paracetamol 500mg", quantityInStock: 30, expiryDate: "2027-12-31" (existing has qty 50) | HTTP 200. Quantity updated to 80. | | | |
| TC-MED-003 | Medicine creation fails with missing fields | 1. Log in as admin. 2. POST /api/medicines without expiryDate. | name: "Amoxicillin", quantityInStock: 50, unit: "capsule" | HTTP 400. Error: "Missing required fields." | | | |
| TC-MED-004 | Admin retrieves the full medicine list | 1. Log in as admin. 2. GET /api/medicines. | Admin JWT | HTTP 200. Array of medicines sorted by name and expiry. | | | |
| TC-MED-005 | Admin dispenses medicine (sufficient stock) | 1. Log in as admin. 2. POST /api/medicines/:id/dispense with quantity 5. | quantity: 5, recipientName: "Juan Dela Cruz" (medicine has 10 in stock) | HTTP 200. Stock reduced by 5. Dispense history entry added. | | | |
| TC-MED-006 | Dispensing fails with insufficient stock | 1. Log in as admin. 2. POST /api/medicines/:id/dispense with quantity 10. | quantity: 10 (medicine has only 3 in stock) | HTTP 400. Error: "Not enough stock." | | | |
| TC-MED-007 | Dispensing with zero quantity is rejected | 1. Log in as admin. 2. POST /api/medicines/:id/dispense with quantity 0. | quantity: 0 | HTTP 400. Error: "Invalid quantity." | | | |
| TC-MED-008 | Batch medicine deduction during consultation | 1. POST /api/medicines/deduct with a list of prescriptions. | prescribed: [{medicineId: "ID1", quantity: 5}, {medicineId: "ID2", quantity: 3}] | HTTP 200. Stock reduced for each item. Transaction committed atomically. | | | |
| TC-MED-009 | Batch deduction rolls back if one item has no stock | 1. POST /api/medicines/deduct where second medicine has insufficient stock. | prescribed: [{medicineId: "ID1", quantity: 5}, {medicineId: "ID2", quantity: 5}] (ID2 has only 1) | HTTP 400. Transaction rolled back. Error: "Not enough stock for [medicine name]." | | | |
| TC-MED-010 | Admin deletes a medicine record | 1. Log in as admin. 2. DELETE /api/medicines/:id. | Admin JWT, valid medicine ID | HTTP 200. Medicine deleted. Confirmation message returned. | | | |
| TC-MED-011 | Delete fails for invalid/malformed ID | 1. Log in as admin. 2. DELETE /api/medicines/invalid-id. | id: "invalidid" | HTTP 400. Error: "Invalid ID." | | | |
| TC-MED-012 | Retrieve dispense history for a medicine | 1. Log in as admin. 2. GET /api/medicines/:id/dispense-history. | Valid medicine ID with dispense records | HTTP 200. Array of dispense history records returned. | | | |
| TC-MED-013 | Export dispense history as PDF | 1. Log in as admin. 2. GET /api/medicines/dispense-history/report (with optional date filter). | startDate: "2026-01-01", endDate: "2026-03-31" | HTTP 200. PDF file downloaded with matching records. | | | |

---

## Module 7: Feedback

| Test Case # | Test Case Description | Test Steps | Test Data | Expected Result | Actual Result | Pass/Fail | Remarks |
|---|---|---|---|---|---|---|---|
| TC-FDBK-001 | Patient submits feedback for their appointment | 1. Log in as patient. 2. POST /api/feedback with appointmentId and rating. | appointmentId: "...", rating: 5, comment: "Great service!" | HTTP 201. Feedback saved. Activity logged. | | | |
| TC-FDBK-002 | Duplicate feedback submission is blocked | 1. Log in as patient. 2. POST /api/feedback for an appointment that already has feedback. | appointmentId: (already has feedback) | HTTP 400. Error: "Feedback already submitted for this appointment." | | | |
| TC-FDBK-003 | Feedback fails with out-of-range rating | 1. Log in as patient. 2. POST /api/feedback with rating: 6. | rating: 6 | HTTP 400. Error: "Rating must be between 1 and 5." | | | |
| TC-FDBK-004 | Patient cannot submit feedback for another patient's appointment | 1. Log in as patient A. 2. POST /api/feedback using patient B's appointmentId. | appointmentId: (belongs to patient B) | HTTP 403. Error: "You can only submit feedback for your own appointments." | | | |
| TC-FDBK-005 | Patient updates their own feedback | 1. Log in as patient. 2. PUT /api/feedback/:feedbackId with updated rating/comment. | rating: 4, comment: "Good but could be better." | HTTP 200. Feedback updated successfully. | | | |
| TC-FDBK-006 | Admin retrieves all feedback | 1. Log in as admin. 2. GET /api/feedback/all. | Admin JWT | HTTP 200. Paginated list of all feedback returned. | | | |
| TC-FDBK-007 | Admin views overall feedback analytics | 1. Log in as admin. 2. GET /api/feedback/analytics/overall. | Admin JWT | HTTP 200. Returns total count, average rating, rating distribution, 7-day trend, top recipients. | | | |

---

## Module 8: Password Reset

| Test Case # | Test Case Description | Test Steps | Test Data | Expected Result | Actual Result | Pass/Fail | Remarks |
|---|---|---|---|---|---|---|---|
| TC-RESET-001 | User requests a password reset for a valid email | 1. POST /api/reset/send with registered email. | email: "juan@example.com" | HTTP 200. 6-digit token stored in DB (expires in 10 min). Email with code sent. | | | |
| TC-RESET-002 | Reset request fails for unregistered email | 1. POST /api/reset/send with unknown email. | email: "unknown@example.com" | HTTP 404. Error: "User not found." | | | |
| TC-RESET-003 | Valid reset token is verified successfully | 1. POST /api/reset/verify with email and correct 6-digit code. | email: "juan@example.com", token: (valid code) | HTTP 200. Message: "Token verified." | | | |
| TC-RESET-004 | Expired or wrong reset token is rejected | 1. POST /api/reset/verify with wrong code. | email: "juan@example.com", token: "000000" | HTTP 400. Error: "Invalid or expired token." | | | |
| TC-RESET-005 | Password is reset with a valid token | 1. POST /api/reset/reset with email, token, and new password. | email: "juan@example.com", token: (valid), newPassword: "NewPass@456" | HTTP 200. Password updated (hashed). Token cleared. Message: "Password reset successful." | | | |
| TC-RESET-006 | Password reset fails with expired token | 1. POST /api/reset/reset using a token that has expired. | email: "juan@example.com", token: (expired), newPassword: "NewPass@456" | HTTP 400. Error: "Invalid or expired token." | | | |

---

## Module 9: Reports

| Test Case # | Test Case Description | Test Steps | Test Data | Expected Result | Actual Result | Pass/Fail | Remarks |
|---|---|---|---|---|---|---|---|
| TC-RPT-001 | Admin generates an appointment summary report | 1. Log in as admin. 2. GET /api/appointments/reports. | Admin JWT | HTTP 200. Returns total, approved, rejected, completed, walk-in, scheduled counts, top diagnosis, top complaint, referral rate. | | | |
| TC-RPT-002 | Report figures match actual database counts | 1. Create 5 appointments (2 approved, 2 completed, 1 rejected). 2. GET /api/appointments/reports. | Known appointment dataset | totalAppointments: 5, approved: 2, completed: 2, rejected: 1. Values match actual DB. | | | |

---

## Module 10: Role-Based Access Control (RBAC)

| Test Case # | Test Case Description | Test Steps | Test Data | Expected Result | Actual Result | Pass/Fail | Remarks |
|---|---|---|---|---|---|---|---|
| TC-RBAC-001 | Patient is blocked from accessing admin-only routes | 1. Log in as patient. 2. Navigate to /admin/dashboard or call admin-only API. | Patient JWT | HTTP 403. Error: "Access denied." Redirected to patient dashboard. | | | |
| TC-RBAC-002 | Unauthenticated request is rejected | 1. Access any protected API endpoint without a JWT. | No token | HTTP 401. Redirected to login page. | | | |
| TC-RBAC-003 | Doctor can access and start consultations | 1. Log in as doctor. 2. GET /api/appointments. 3. POST /api/appointments/:id/start. | Doctor JWT | HTTP 200 for both. Doctor assigned to consultation. | | | |
| TC-RBAC-004 | Patient cannot view another patient's appointments | 1. Log in as patient A. 2. GET /api/appointments/patient/:patientBId. | Patient A JWT, Patient B ID | HTTP 403. Error: "Access denied." | | | |

---

## Module 11: Notifications

| Test Case # | Test Case Description | Test Steps | Test Data | Expected Result | Actual Result | Pass/Fail | Remarks |
|---|---|---|---|---|---|---|---|
| TC-NOTIF-001 | Admin is notified when a patient books an appointment | 1. Patient books an appointment. 2. Admin checks notification feed. | Valid patient and admin accounts | Admin receives in-app notification: "New appointment booked by [patient name]." | | | |
| TC-NOTIF-002 | Patient is notified when appointment is approved | 1. Admin approves a pending appointment. 2. Patient checks notifications. | Pending appointment | Patient receives in-app notification and email: "Your appointment on [date] has been approved." | | | |
| TC-NOTIF-003 | Patient is notified when consultation is completed | 1. Clinician saves/completes consultation. 2. Patient checks notifications. | In-consultation appointment | Patient receives in-app notification: "Your medical records have been updated." Email sent with diagnosis. | | | |
| TC-NOTIF-004 | Patient is notified when appointment is cancelled by admin | 1. Admin deletes an appointment. 2. Patient checks notifications. | Existing appointment | Patient receives in-app notification: "Your appointment on [date] has been cancelled by the administrator." | | | |
