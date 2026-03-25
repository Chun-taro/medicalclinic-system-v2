# BukSU Medical Clinic System – Test Cases

**System:** BukSU Medical Clinic Management System (v2)  
**Tech Stack:** Node.js / Express (Backend), React / Vite (Frontend), MongoDB  
**Prepared by:** [Tester Name]  
**Date:** March 14, 2026

---

## Table of Contents

1. [Patient Test Cases](#patient-test-cases)
2. [Admin Test Cases](#admin-test-cases)
3. [Superadmin Test Cases](#superadmin-test-cases)

---

# 👤 PATIENT TEST CASES

## Authentication – Patient

| Test Case # | Test Case Description | Test Steps | Test Data | Expected Result | Actual Result | Pass/Fail | Remarks |
|---|---|---|---|---|---|---|---|
| TC-PAT-AUTH-001 | Patient registers with valid data | 1. Go to signup page. 2. Fill all required fields. 3. Click Sign Up. | firstName: "Juan", lastName: "Dela Cruz", email: "juan@example.com", password: "Pass@123", idNumber: "2021-00001", contactNumber: "09171234567", patientType: "student" | Account created. Success message shown. Welcome email sent. Redirected to login. | | | |
| TC-PAT-AUTH-002 | Signup fails with missing required fields | 1. Go to signup page. 2. Leave firstName blank. 3. Submit. | firstName: "" (all other fields valid) | HTTP 400. Error: "All fields are required." | | | |
| TC-PAT-AUTH-003 | Signup fails with duplicate email | 1. Go to signup page. 2. Use an already-registered email. 3. Submit. | email: "juan@example.com" (already registered) | HTTP 400. Error: "Email already registered." | | | |
| TC-PAT-AUTH-004 | Patient logs in with valid credentials | 1. Go to login page. 2. Enter valid email and password. 3. Click Login. | email: "juan@example.com", password: "Pass@123" | HTTP 200. JWT issued. Redirected to patient dashboard. | | | |
| TC-PAT-AUTH-005 | Login fails with wrong password | 1. Go to login page. 2. Enter valid email, wrong password. 3. Submit. | email: "juan@example.com", password: "wrongPass" | HTTP 400. Error: "Invalid credentials." | | | |
| TC-PAT-AUTH-006 | Login fails with non-existent email | 1. Go to login page. 2. Enter unregistered email. 3. Submit. | email: "ghost@example.com", password: "anyPass" | HTTP 400. Error: "Invalid credentials." | | | |
| TC-PAT-AUTH-007 | Login fails with missing fields | 1. Go to login page. 2. Leave password blank. 3. Submit. | email: "juan@example.com", password: "" | HTTP 400. Error: "Email and password are required." | | | |
| TC-PAT-AUTH-008 | Google OAuth signup completes successfully | 1. Click Sign up with Google. 2. Complete OAuth flow. 3. Fill extended profile. 4. Submit. | Valid Google ID, idNumber, patientType: "student" | Account created with isVerified: true. JWT issued. Redirected to dashboard. | | | |
| TC-PAT-AUTH-009 | Email verification with valid token | 1. Click the verification link from email. | token: (valid token from DB) | HTTP 200. isVerified set to true. Token cleared. Success message shown. | | | |
| TC-PAT-AUTH-010 | Email verification fails with invalid token | 1. Access verify-email link with a wrong/expired token. | token: "invalidtoken123" | HTTP 400. Error: "Invalid or expired verification token." | | | |
| TC-PAT-AUTH-011 | Signup fails with invalid ID Number format | 1. Enter ID number not matching "20YY-XXXXX". 2. Submit. | idNumber: "ABC-12345" | HTTP 400. Error: "ID Number must follow the format 20XX-XXXXX." | | | |
| TC-PAT-AUTH-012 | Signup fails with invalid Recaptcha | 1. Attempt signup without completing Recaptcha. 2. Submit. | recaptchaToken: "" | HTTP 400. Error: "Recaptcha verification failed." | | | |

---

## Profile – Patient

| Test Case # | Test Case Description | Test Steps | Test Data | Expected Result | Actual Result | Pass/Fail | Remarks |
|---|---|---|---|---|---|---|---|
| TC-PAT-PROF-001 | Patient retrieves own profile | 1. Log in as patient. 2. Go to profile page. | Valid patient JWT | HTTP 200. User data displayed (no password). | | | |
| TC-PAT-PROF-002 | Patient updates profile with valid data | 1. Log in as patient. 2. Edit profile fields. 3. Save. | contactNumber: "09181234567", homeAddress: "123 BukSU St.", department: "CIT" | HTTP 200. Updated data saved and displayed. Activity logged. | | | |
| TC-PAT-PROF-003 | Profile update fails on version conflict | 1. Log in as patient. 2. Submit profile update with stale version number. | version: 1 (DB version is 2) | HTTP 409. Error: "Profile was modified by another process. Please refresh and try again." | | | |
| TC-PAT-PROF-004 | Patient uploads a profile picture | 1. Log in as patient. 2. Upload an image file on the profile page. | file: valid .jpg or .png image | HTTP 200. Avatar saved. New photo displayed on profile. | | | |
| TC-PAT-PROF-005 | Patient changes password within profile | 1. Log in. 2. Go to Security/Profile. 3. Enter current and new password. 4. Save. | current: "Pass@123", new: "NewPass@789" | HTTP 200. "Password updated successfully." | | | |
| TC-PAT-PROF-006 | Restricted fields are readonly in profile | 1. Go to Profile. 2. Attempt to edit idNumber or email. | N/A | Fields are disabled in UI. POST/PATCH ignores these fields if tampered. | | | |

---

## Appointments – Patient

| Test Case # | Test Case Description | Test Steps | Test Data | Expected Result | Actual Result | Pass/Fail | Remarks |
|---|---|---|---|---|---|---|---|
| TC-PAT-APT-001 | Patient books an appointment with valid data | 1. Log in as patient. 2. Go to Book Appointment. 3. Fill fields. 4. Submit. | appointmentDate: (future date), purpose: "General Checkup", typeOfVisit: "scheduled" | HTTP 201. Appointment created with status "pending". Admin and patient notified. | | | |
| TC-PAT-APT-002 | Booking fails for a past date | 1. Log in as patient. 2. Select a past date. 3. Submit. | appointmentDate: "2020-01-01", purpose: "Checkup" | HTTP 400. Error: "Cannot book appointments in the past." | | | |
| TC-PAT-APT-003 | Booking fails with missing fields | 1. Log in as patient. 2. Leave purpose blank. 3. Submit. | appointmentDate: (future date), purpose: "" | HTTP 400. Error: "Missing required fields." | | | |
| TC-PAT-APT-004 | Patient views their own appointments | 1. Log in as patient. 2. Go to My Appointments. | Patient JWT | HTTP 200. List of patient's appointments shown with statuses. | | | |
| TC-PAT-APT-005 | Patient reschedules an appointment to a future date | 1. Log in as patient. 2. Select an existing appointment. 3. Choose a new future date. 4. Save. | appointmentDate: (new future date), rescheduleReason: "Changed schedule" | HTTP 200. Date updated. Reschedule activity logged. Notifications sent. | | | |
| TC-PAT-APT-006 | Rescheduling to a past date is rejected | 1. Log in as patient. 2. Try to reschedule to a past date. | appointmentDate: "2020-01-01" | HTTP 400. Error: "Cannot reschedule to a past date." | | | |
| TC-PAT-APT-007 | Patient cannot delete their own appointment | 1. Log in as patient. 2. Try to DELETE /api/appointments/:id. | Patient JWT | HTTP 403. Error: "Access denied." | | | |
| TC-PAT-APT-008 | Patient cannot view another patient's appointments | 1. Log in as patient A. 2. Try to access /api/appointments/patient/:patientBId. | Patient A JWT, Patient B ID | HTTP 403. Error: "Access denied." | | | |
| TC-PAT-APT-009 | Patient cancels their own pending appointment | 1. Log in. 2. Go to My Appointments. 3. Click Cancel on a pending record. | appointmentId: (pending) | HTTP 200. Status → "cancelled". Activity logged. | | | |

---

## Feedback – Patient

| Test Case # | Test Case Description | Test Steps | Test Data | Expected Result | Actual Result | Pass/Fail | Remarks |
|---|---|---|---|---|---|---|---|
| TC-PAT-FDBK-001 | Patient submits feedback for their appointment | 1. Log in as patient. 2. Go to completed appointment. 3. Submit feedback. | appointmentId: "...", rating: 5, comment: "Great service!" | HTTP 201. Feedback saved. Activity logged. | | | |
| TC-PAT-FDBK-002 | Duplicate feedback submission is blocked | 1. Log in as patient. 2. Try to submit feedback for an appointment that already has one. | appointmentId: (already has feedback) | HTTP 400. Error: "Feedback already submitted for this appointment." | | | |
| TC-PAT-FDBK-003 | Feedback fails with out-of-range rating | 1. Log in as patient. 2. Submit feedback with rating 6. | rating: 6 | HTTP 400. Error: "Rating must be between 1 and 5." | | | |
| TC-PAT-FDBK-004 | Patient cannot submit feedback for another patient's appointment | 1. Log in as patient A. 2. Submit feedback using patient B's appointmentId. | appointmentId: (belongs to patient B) | HTTP 403. Error: "You can only submit feedback for your own appointments." | | | |
| TC-PAT-FDBK-005 | Patient updates their own feedback | 1. Log in as patient. 2. Edit previously submitted feedback. 3. Save. | rating: 4, comment: "Good but could be better." | HTTP 200. Feedback updated successfully. | | | |

---

## Password Reset – Patient

| Test Case # | Test Case Description | Test Steps | Test Data | Expected Result | Actual Result | Pass/Fail | Remarks |
|---|---|---|---|---|---|---|---|
| TC-PAT-RESET-001 | Patient requests a password reset for a valid email | 1. Go to Forgot Password page. 2. Enter registered email. 3. Submit. | email: "juan@example.com" | HTTP 200. 6-digit token sent to email. Token expires in 10 minutes. | | | |
| TC-PAT-RESET-002 | Reset request fails for unregistered email | 1. Go to Forgot Password page. 2. Enter unknown email. 3. Submit. | email: "unknown@example.com" | HTTP 404. Error: "User not found." | | | |
| TC-PAT-RESET-003 | Valid reset token is verified successfully | 1. Enter the 6-digit code received by email. 2. Submit. | email: "juan@example.com", token: (valid code) | HTTP 200. Message: "Token verified." Proceed to reset password step. | | | |
| TC-PAT-RESET-004 | Expired or wrong reset token is rejected | 1. Enter incorrect or expired code. 2. Submit. | email: "juan@example.com", token: "000000" | HTTP 400. Error: "Invalid or expired token." | | | |
| TC-PAT-RESET-005 | Password is reset with a valid token | 1. Enter new password and confirm. 2. Submit with valid token. | email: "juan@example.com", token: (valid), newPassword: "NewPass@456" | HTTP 200. Password updated. Token cleared. Message: "Password reset successful." | | | |
| TC-PAT-RESET-006 | Password reset fails with expired token | 1. Use a token that has already expired. 2. Submit new password. | email: "juan@example.com", token: (expired), newPassword: "NewPass@456" | HTTP 400. Error: "Invalid or expired token." | | | |

---

## Notifications – Patient

| Test Case # | Test Case Description | Test Steps | Test Data | Expected Result | Actual Result | Pass/Fail | Remarks |
|---|---|---|---|---|---|---|---|
| TC-PAT-NOTIF-001 | Patient is notified when appointment is approved | 1. Admin approves patient's appointment. 2. Patient checks notification feed. | Pending appointment belonging to patient | In-app notification and email: "Your appointment on [date] has been approved." | | | |
| TC-PAT-NOTIF-002 | Patient is notified when consultation is completed | 1. Clinician completes consultation. 2. Patient checks notifications. | In-consultation appointment | In-app notification: "Your medical records have been updated." Email sent with diagnosis. | | | |
| TC-PAT-NOTIF-003 | Patient is notified when appointment is cancelled | 1. Admin deletes patient's appointment. 2. Patient checks notifications. | Existing appointment | In-app notification: "Your appointment on [date] has been cancelled by the administrator." | | | |

---

## Dashboard – Patient

| Test Case # | Test Case Description | Test Steps | Test Data | Expected Result | Actual Result | Pass/Fail | Remarks |
|---|---|---|---|---|---|---|---|
| TC-PAT-DASH-001 | Patient views upcoming appointment summary | 1. Log in as patient. 2. View dashboard. | Patient with 1 upcoming appt | "Upcoming Appointment" card shows date, time, and purpose clearly. | | | |

---

## Medical Certificates – Patient

| Test Case # | Test Case Description | Test Steps | Test Data | Expected Result | Actual Result | Pass/Fail | Remarks |
|---|---|---|---|---|---|---|---|
| TC-PAT-CERT-001 | Patient requests certificate for completed consultation | 1. Go to a completed appointment. 2. Click "Request Medical Certificate". | Completed appointment ID | Request sent. Status shows "requested" or "ready". | | | |
| TC-PAT-CERT-002 | Patient views list of generated certificates | 1. Go to "My Certificates" page. | Patient JWT | HTTP 200. List of all available certificates shown. | | | |
| TC-PAT-CERT-003 | Patient downloads certificate PDF | 1. Click "Download" icon/button on a certificate. | Valid certificate ID | Browser downloads a PDF file named "Medical_Certificate_[ID].pdf". | | | |

---
---

# 🛡️ ADMIN TEST CASES

## Authentication – Admin

| Test Case # | Test Case Description | Test Steps | Test Data | Expected Result | Actual Result | Pass/Fail | Remarks |
|---|---|---|---|---|---|---|---|
| TC-ADM-AUTH-001 | Admin logs in with valid credentials | 1. Go to login page. 2. Enter admin credentials. 3. Submit. | email: "admin@clinic.com", password: "AdminPass@1" | HTTP 200. JWT issued. Redirected to admin dashboard. | | | |
| TC-ADM-AUTH-002 | Admin login fails with wrong password | 1. Go to login page. 2. Enter admin email with wrong password. 3. Submit. | email: "admin@clinic.com", password: "wrongPass" | HTTP 400. Error: "Invalid credentials." | | | |

---

## User Management – Admin

| Test Case # | Test Case Description | Test Steps | Test Data | Expected Result | Actual Result | Pass/Fail | Remarks |
|---|---|---|---|---|---|---|---|
| TC-ADM-USER-001 | Admin retrieves the full user list | 1. Log in as admin. 2. Go to Manage Users page. | Admin JWT | HTTP 200. All users listed (passwords excluded). | | | |
| TC-ADM-USER-002 | Admin retrieves a specific patient's profile | 1. Log in as admin. 2. Click on a user in Manage Users. | Admin JWT, target user ID | HTTP 200. Target user profile displayed. | | | |
| TC-ADM-USER-003 | Admin cannot change user roles | 1. Log in as admin. 2. PATCH /api/users/:id/role. | Admin JWT, role: "doctor" | HTTP 403. Error: "Access denied. Superadmins only." | | | |

---

## Appointments – Admin

| Test Case # | Test Case Description | Test Steps | Test Data | Expected Result | Actual Result | Pass/Fail | Remarks |
|---|---|---|---|---|---|---|---|
| TC-ADM-APT-001 | Admin retrieves all appointments | 1. Log in as admin. 2. Go to All Appointments page. | Admin JWT | HTTP 200. Paginated list of all appointments shown. | | | |
| TC-ADM-APT-002 | Admin approves a pending appointment | 1. Log in as admin. 2. Select a pending appointment. 3. Click Approve. | Appointment with status "pending", current version number | HTTP 200. Status → "approved". Patient notified via app and email. | | | |
| TC-ADM-APT-003 | Approval fails on version conflict (concurrent edit) | 1. Log in as admin. 2. Approve with a stale version number. | version: 0 (DB version is 2) | HTTP 404. Approval rejected due to optimistic lock failure. | | | |
| TC-ADM-APT-004 | Admin rejects a pending appointment | 1. Log in as admin. 2. Select a pending appointment. 3. Click Reject. | Appointment with status "pending" | HTTP 200. Status → "rejected". Patient email sent. Google Calendar event deleted if applicable. | | | |
| TC-ADM-APT-005 | Admin reschedules an appointment | 1. Log in as admin. 2. Edit an appointment's date. 3. Save. | appointmentDate: (new future date), rescheduleReason: "Clinic unavailable" | HTTP 200. Date updated. Activity logged. Notifications sent. | | | |
| TC-ADM-APT-006 | Admin deletes an appointment | 1. Log in as admin. 2. Select an appointment. 3. Click Delete. | Admin JWT | HTTP 200. Appointment removed. Patient notified. Activity logged. | | | |
| TC-ADM-APT-007 | Admin creates a Walk-in appointment | 1. Log in. 2. Go to Appointments. 3. Click "Add Walk-in". 4. Fill patient details and purpose. 5. Submit. | patientName: "Jane Doe", purpose: "Emergency" | HTTP 201. Appointment created with status "completed" or "in-consultation". | | | |

---

## Consultation – Admin

| Test Case # | Test Case Description | Test Steps | Test Data | Expected Result | Actual Result | Pass/Fail | Remarks |
|---|---|---|---|---|---|---|---|
| TC-ADM-CONS-001 | Admin starts consultation for an approved appointment | 1. Log in as admin. 2. Open an approved appointment. 3. Click Start Consultation. | Appointment with status "approved" | HTTP 200. Status → "in-consultation". Admin set as clinician. Patient notified. | | | |
| TC-ADM-CONS-002 | Consultation cannot start for a non-approved appointment | 1. Log in as admin. 2. Try to start consultation on a pending appointment. | Appointment with status "pending" | HTTP 400. Error: "Only approved appointments can begin consultation." | | | |
| TC-ADM-CONS-003 | Admin saves full consultation details | 1. Log in as admin. 2. Fill in vitals, diagnosis, and prescriptions. 3. Save. | diagnosis: "Flu", bloodPressure: "120/80", temperature: "37.5", heartRate: "75", oxygenSaturation: "98%", bmi: "22.5", medicinesPrescribed: [{name: "Paracetamol", quantity: 10}] | HTTP 200. All fields saved. Status → "completed". Patient notified. | | | |
| TC-ADM-CONS-004 | Admin retrieves all consultation records | 1. Log in as admin. 2. Go to Consultations page. | Admin JWT | HTTP 200. All appointments with a diagnosis returned. | | | |
| TC-ADM-CONS-005 | Admin retrieves completed Medical Certificate requests | 1. Log in as admin. 2. Go to Medical Certificates page. | Admin JWT | HTTP 200. All completed Medical Certificate appointments shown. | | | |
| TC-ADM-CONS-006 | Consultation fails with invalid vitals | 1. Enter negative temperature or impossible BP. 2. Save. | temperature: -10, bloodPressure: "0/0" | HTTP 400. Error: "Please enter valid vital signs." | | | |
| TC-ADM-CONS-007 | Admin generates a Referral Letter | 1. In consultation, click "Create Referral". 2. Fill specialist and reason. 3. Save. | referralTo: "Cardiologist", reason: "Irregular heart rate" | Referral saved. PDF option available. Activity logged. | | | |
| TC-ADM-CONS-008 | Admin exports Consultation Summary PDF | 1. View a completed consultation. 2. Click "Export PDF". | Valid consultation ID | Browser downloads PDF with all vitals and diagnosis. | | | |

---

## Medicine / Inventory – Admin

| Test Case # | Test Case Description | Test Steps | Test Data | Expected Result | Actual Result | Pass/Fail | Remarks |
|---|---|---|---|---|---|---|---|
| TC-ADM-MED-001 | Admin adds a new medicine to inventory | 1. Log in as admin. 2. Go to Inventory. 3. Click Add Medicine. 4. Fill form. 5. Submit. | name: "Paracetamol 500mg", quantityInStock: 100, unit: "tablet", expiryDate: "2027-12-31" | HTTP 201. Medicine saved. Activity logged. | | | |
| TC-ADM-MED-002 | Adding an existing medicine increments stock | 1. Log in as admin. 2. Add medicine with same name and expiry as an existing entry. | name: "Paracetamol 500mg", quantityInStock: 30, expiryDate: "2027-12-31" (existing has qty 50) | HTTP 200. Quantity updated to 80 (merged). | | | |
| TC-ADM-MED-003 | Medicine creation fails with missing fields | 1. Log in as admin. 2. Submit form without expiryDate. | name: "Amoxicillin", quantityInStock: 50, unit: "capsule" | HTTP 400. Error: "Missing required fields." | | | |
| TC-ADM-MED-004 | Admin views full medicine list | 1. Log in as admin. 2. Go to Inventory. | Admin JWT | HTTP 200. All medicines shown, sorted by name and expiry. | | | |
| TC-ADM-MED-005 | Admin manually dispenses medicine (sufficient stock) | 1. Log in as admin. 2. Select a medicine. 3. Click Dispense. 4. Enter quantity. 5. Submit. | quantity: 5, recipientName: "Juan Dela Cruz" (medicine has 10 in stock) | HTTP 200. Stock reduced by 5. Dispense history entry recorded. | | | |
| TC-ADM-MED-006 | Dispensing fails with insufficient stock | 1. Log in as admin. 2. Try to dispense more than what's in stock. | quantity: 10 (medicine has only 3 in stock) | HTTP 400. Error: "Not enough stock." | | | |
| TC-ADM-MED-007 | Dispensing with zero quantity is rejected | 1. Log in as admin. 2. Submit dispense form with quantity 0. | quantity: 0 | HTTP 400. Error: "Invalid quantity." | | | |
| TC-ADM-MED-008 | Batch medicine deduction during consultation | 1. Complete a consultation with prescribed medicines. | prescribed: [{medicineId: "ID1", quantity: 5}, {medicineId: "ID2", quantity: 3}] | HTTP 200. Stock reduced for each item atomically. | | | |
| TC-ADM-MED-009 | Batch deduction rolls back if one item has no stock | 1. Prescribe medicines where one has insufficient stock. | prescribed: [{medicineId: "ID1", quantity: 5}, {medicineId: "ID2", quantity: 5}] (ID2 has only 1) | HTTP 400. Transaction rolled back. Error: "Not enough stock for [medicine name]." | | | |
| TC-ADM-MED-010 | Admin deletes a medicine record | 1. Log in as admin. 2. Select a medicine. 3. Click Delete. 4. Confirm. | Admin JWT, valid medicine ID | HTTP 200. Medicine deleted. | | | |
| TC-ADM-MED-011 | Delete fails for invalid ID | 1. Log in as admin. 2. DELETE /api/medicines/invalidid. | id: "invalidid" | HTTP 400. Error: "Invalid ID." | | | |
| TC-ADM-MED-012 | Admin views dispense history for a medicine | 1. Log in as admin. 2. Click on a medicine. 3. View dispense history. | Valid medicine ID with dispense records | HTTP 200. Full dispense history shown with dates and recipients. | | | |
| TC-ADM-MED-013 | Admin exports dispense history as PDF | 1. Log in as admin. 2. Go to dispense history. 3. Click Print/Export PDF. | (optionally) startDate: "2026-01-01", endDate: "2026-03-31" | HTTP 200. PDF downloaded with matching records. | | | |
| TC-ADM-MED-014 | Admin views low stock alerts | 1. Go to Inventory. 2. Observe medicines with quantity < 10. | Medicine with qty: 5 | Highlighted in red/yellow. "Low Stock" badge visible. | | | |
| TC-ADM-MED-015 | Admin filters medicines by expiry date | 1. Go to Inventory. 2. Use expiry filter (e.g., "Expiring in 3 months"). | Current date: March 2026 | Only medicines expiring before June 2026 are shown. | | | |
| TC-ADM-MED-016 | Admin updates medicine details | 1. Select medicine. 2. Edit name/unit/minStock. 3. Save. | minStock: 20 | HTTP 200. Details updated. Activity logged. | | | |

---

## Feedback – Admin

| Test Case # | Test Case Description | Test Steps | Test Data | Expected Result | Actual Result | Pass/Fail | Remarks |
|---|---|---|---|---|---|---|---|
| TC-ADM-FDBK-001 | Admin retrieves all feedback | 1. Log in as admin. 2. Go to Feedback page. | Admin JWT | HTTP 200. Paginated list of all patient feedback shown. | | | |
| TC-ADM-FDBK-002 | Admin views overall feedback analytics | 1. Log in as admin. 2. Go to Feedback Analytics. | Admin JWT | HTTP 200. Displays total count, average rating, rating distribution, 7-day trend, top recipients. | | | |

---

## Reports – Admin

| Test Case # | Test Case Description | Test Steps | Test Data | Expected Result | Actual Result | Pass/Fail | Remarks |
|---|---|---|---|---|---|---|---|
| TC-ADM-RPT-001 | Admin generates an appointment summary report | 1. Log in as admin. 2. Go to Reports page. 3. View summary. | Admin JWT | HTTP 200. Returns total, approved, rejected, completed, walk-in, scheduled counts, top diagnosis, top complaint, referral rate. | | | |
| TC-ADM-RPT-002 | Report figures match actual database counts | 1. Create 5 appointments (2 approved, 2 completed, 1 rejected). 2. View report. | Known appointment dataset in DB | totalAppointments: 5, approved: 2, completed: 2, rejected: 1. Values match actual DB. | | | |
| TC-ADM-RPT-003 | Admin filters report by customized date range | 1. Go to Reports. 2. Select Start and End date. 3. Refresh. | startDate: "2026-03-01", endDate: "2026-03-10" | Report updates to show data ONLY within that range. | | | |
| TC-ADM-RPT-004 | Admin exports Inventory Report to Excel | 1. Go to Reports/Inventory. 2. Click "Export Excel". | Admin JWT | Browser downloads .xlsx file with current stock levels. | | | |

---

## Notifications – Admin

| Test Case # | Test Case Description | Test Steps | Test Data | Expected Result | Actual Result | Pass/Fail | Remarks |
|---|---|---|---|---|---|---|---|
| TC-ADM-NOTIF-001 | Admin is notified when a patient books an appointment | 1. Patient books an appointment. 2. Admin checks notification feed. | Valid patient and admin accounts | Admin receives in-app notification: "New appointment booked by [patient name]." | | | |
| TC-ADM-NOTIF-002 | Admin is notified when a consultation is completed | 1. Clinician completes a consultation. 2. Admin checks notifications. | Completed appointment | Admin receives in-app notification: "Consultation completed for patient [name]." | | | |
| TC-ADM-NOTIF-003 | Admin is notified of low stock levels | 1. Dispense medicine until stock < threshold. 2. Check notifications. | Threshold: 10, Stock → 9 | Admin receive alert: "Low stock warning: [Medicine Name]." | | | |

---

## Dashboard – Admin

| Test Case # | Test Case Description | Test Steps | Test Data | Expected Result | Actual Result | Pass/Fail | Remarks |
|---|---|---|---|---|---|---|---|
| TC-ADM-DASH-001 | Admin dashboard counters update in real-time | 1. Log in. 2. Have another user book an appointment. 3. Watch dashboard. | New appointment created | "Pending Appointments" counter increments immediately without refresh. | | | |
| TC-ADM-DASH-002 | Admin views daily schedule on dashboard | 1. Log in. 2. View "Today's Appointments" section. | 3 appointments scheduled for today | List displays the 3 patients and their visit times correctly. | | | |

---

## Access Control – Admin

| Test Case # | Test Case Description | Test Steps | Test Data | Expected Result | Actual Result | Pass/Fail | Remarks |
|---|---|---|---|---|---|---|---|
| TC-ADM-RBAC-001 | Patient is blocked from admin routes | 1. Log in as patient. 2. Navigate to /admin/dashboard. | Patient JWT | HTTP 403. Error: "Access denied." Redirected to patient dashboard. | | | |
| TC-ADM-RBAC-002 | Unauthenticated user is redirected to login | 1. Access any admin route without a JWT. | No token | HTTP 401. Redirected to login page. | | | |
| TC-ADM-RBAC-003 | Doctor can access consultation-related views | 1. Log in as doctor. 2. View appointments. 3. Start consultation. | Doctor JWT | HTTP 200. Doctor permitted to view and start consultations. | | | |

---
---

# 👑 SUPERADMIN TEST CASES

## Authentication – Superadmin

| Test Case # | Test Case Description | Test Steps | Test Data | Expected Result | Actual Result | Pass/Fail | Remarks |
|---|---|---|---|---|---|---|---|
| TC-SA-AUTH-001 | Superadmin logs in via superadmin login portal | 1. Go to superadmin login. 2. Enter superadmin credentials. 3. Submit. | email: "superadmin@clinic.com", password: "Admin@1234" | HTTP 200. JWT issued. Redirected to superadmin dashboard. | | | |
| TC-SA-AUTH-002 | Non-superadmin user blocked from superadmin login | 1. POST to /api/auth/superadmin-login with a patient's credentials. | email: "juan@example.com", password: "Pass@123", role: "patient" | HTTP 403. Error: "Access denied. Superadmin only." | | | |
| TC-SA-AUTH-003 | Superadmin login fails with wrong password | 1. Go to superadmin login. 2. Enter wrong password. 3. Submit. | email: "superadmin@clinic.com", password: "wrongPass" | HTTP 400. Error: "Invalid credentials." | | | |

---

## User Management – Superadmin

| Test Case # | Test Case Description | Test Steps | Test Data | Expected Result | Actual Result | Pass/Fail | Remarks |
|---|---|---|---|---|---|---|---|
| TC-SA-USER-001 | Superadmin retrieves the full user list | 1. Log in as superadmin. 2. Go to Manage Users. | Superadmin JWT | HTTP 200. All users listed (passwords excluded). | | | |
| TC-SA-USER-002 | Superadmin promotes a patient to admin | 1. Log in as superadmin. 2. Select a user. 3. Change role to "admin". 4. Save. | role: "admin" | HTTP 200. Role updated. Activity logged. | | | |
| TC-SA-USER-003 | Superadmin promotes a user to doctor | 1. Log in as superadmin. 2. Select a user. 3. Change role to "doctor". 4. Save. | role: "doctor" | HTTP 200. Role updated to "doctor". Activity logged. | | | |
| TC-SA-USER-004 | Role update fails with an invalid role value | 1. Log in as superadmin. 2. PATCH /api/users/:id/role with role: "nurse". | role: "nurse" | HTTP 400. Error: "Invalid role specified." | | | |
| TC-SA-USER-005 | Superadmin cannot remove the last superadmin | 1. Log in as superadmin (only one exists). 2. Try to change own role to "admin". | role: "admin" | HTTP 400. Error: "Cannot change role. The system must have at least one superadmin." | | | |
| TC-SA-USER-006 | Superadmin demotes an admin to patient | 1. Log in as superadmin. 2. Select an admin user. 3. Change role to "patient". 4. Save. | role: "patient" | HTTP 200. Role updated to "patient". Activity logged. | | | |
| TC-SA-USER-007 | Superadmin deactivates a user account | 1. Log in. 2. Select a user. 3. Click "Deactivate". 4. Confirm. | User ID | HTTP 200. Account disabled. User cannot login. | | | |
| TC-SA-USER-008 | Superadmin reactivates a user account | 1. Log in. 2. Select deactivated user. 3. Click "Activate". | User ID | HTTP 200. Account enabled. User can login again. | | | |
| TC-SA-USER-009 | Superadmin views user login history | 1. Select a user. 2. Click "Login History". | Admin JWT | HTTP 200. List of recent login timestamps and IP addresses shown. | | | |

---

## Appointments – Superadmin

| Test Case # | Test Case Description | Test Steps | Test Data | Expected Result | Actual Result | Pass/Fail | Remarks |
|---|---|---|---|---|---|---|---|
| TC-SA-APT-001 | Superadmin retrieves all appointments | 1. Log in as superadmin. 2. Go to All Appointments. | Superadmin JWT | HTTP 200. Full paginated list of all appointments shown. | | | |
| TC-SA-APT-002 | Superadmin approves a pending appointment | 1. Log in as superadmin. 2. Select a pending appointment. 3. Click Approve. | Appointment with status "pending", current version | HTTP 200. Status → "approved". Patient notified via app and email. | | | |
| TC-SA-APT-003 | Superadmin deletes an appointment | 1. Log in as superadmin. 2. Select an appointment. 3. Click Delete. 4. Confirm. | Superadmin JWT | HTTP 200. Appointment deleted. Patient notified. Activity logged. | | | |

---

## Medicine / Inventory – Superadmin

| Test Case # | Test Case Description | Test Steps | Test Data | Expected Result | Actual Result | Pass/Fail | Remarks |
|---|---|---|---|---|---|---|---|
| TC-SA-MED-001 | Superadmin views the full medicine inventory | 1. Log in as superadmin. 2. Go to Inventory. | Superadmin JWT | HTTP 200. Full medicine list displayed. | | | |
| TC-SA-MED-002 | Superadmin views dispense history report | 1. Log in as superadmin. 2. Go to dispense history. 3. Click Export PDF. | Superadmin JWT | HTTP 200. PDF downloaded with all dispense records. | | | |
| TC-SA-MED-003 | Superadmin performs bulk stock adjustment | 1. Go to Inventory. 2. Select multiple items. 3. Click "Bulk Update". 4. Add +10 to all. | Medicine IDs | HTTP 200. All selected items' quantities incremented by 10. | | | |

---

## Access Control – Superadmin

| Test Case # | Test Case Description | Test Steps | Test Data | Expected Result | Actual Result | Pass/Fail | Remarks |
|---|---|---|---|---|---|---|---|
| TC-SA-RBAC-001 | Superadmin can access all admin routes | 1. Log in as superadmin. 2. Access all admin API endpoints. | Superadmin JWT | HTTP 200 for all admin-accessible routes. Full access granted. | | | |
| TC-SA-RBAC-002 | Unauthenticated user cannot access superadmin routes | 1. Access any superadmin route without a JWT. | No token | HTTP 401. Redirected to login page. | | | |
| TC-SA-RBAC-003 | Admin cannot access superadmin-exclusive routes | 1. Log in as admin. 2. Try PATCH /api/users/:id/role or superadmin-only endpoints. | Admin JWT | HTTP 403. Error: "Access denied. Superadmins only." | | | |
| TC-SA-RBAC-004 | Unauthorized direct URL access is blocked | 1. Copy a superadmin URL (e.g. /superadmin/logs). 2. Logout. 3. Paste URL in browser. | N/A | Redirected to login. No data leaked. | | | |

---

## Audit Logs – System

| Test Case # | Test Case Description | Test Steps | Test Data | Expected Result | Actual Result | Pass/Fail | Remarks |
|---|---|---|---|---|---|---|---|
| TC-SYS-LOG-001 | Superadmin views system-wide audit logs | 1. Log in as superadmin. 2. Go to Audit Logs. | Superadmin JWT | HTTP 200. List of all actions (CREATE, UPDATE, DELETE) shown with timestamps. | | | |
| TC-SYS-LOG-002 | Filter audit logs by specific User | 1. In Audit Logs, search for a User ID. 2. Apply filter. | targetUserId: "..." | Only actions performed by that user are displayed. | | | |
| TC-SYS-LOG-003 | Filter audit logs by Action Type | 1. In Audit Logs, filter by "DELETE". | Action: "DELETE" | Only deletion events are shown across the system. | | | |

---

## Global Access & Redirection – System

| Test Case # | Test Case Description | Test Steps | Test Data | Expected Result | Actual Result | Pass/Fail | Remarks |
|---|---|---|---|---|---|---|---|
| TC-SYS-RBAC-001 | User is redirected to correct dashboard on login | 1. Login as Patient. 2. Check URL. 3. Logout. 4. Login as Admin. 5. Check URL. | Valid credentials | Patient → /patient/dashboard, Admin → /admin/dashboard. | | | |
