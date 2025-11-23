# API Documentation

## Authentication Routes

| Endpoint           | Method | Description                        | Request Body                                  | Response                             | Auth Required |
|--------------------|--------|----------------------------------|-----------------------------------------------|------------------------------------|--------------|
| /auth/signup       | POST   | Register new user                 | { email, password, firstName, lastName, ... }| { message }                        | No           |
| /auth/login        | POST   | User login                       | { email, password }                           | { token, user info }               | No           |
| /auth/superadmin-login | POST | Superadmin login                 | { email, password }                           | { token, user info }               | No           |
| /auth/google-signup| POST   | Signup via Google OAuth           | { googleId, email, firstName, lastName, ... }| { token, user info }               | No           |
| /auth/validate     | GET    | Validate JWT token                | -                                             | { valid: true, user info }         | Yes          |
| /auth/me           | GET    | Get current user info             | -                                             | { user info }                      | Yes          |

---

## Appointments Routes

### Booking and Patient Appointments

| Endpoint                  | Method | Description                         | Request Body                                                                     | Response                                          | Auth Required |
|---------------------------|--------|-----------------------------------|----------------------------------------------------------------------------------|-------------------------------------------------|--------------|
| /appointments/book        | POST   | Book a new appointment (Patients only) | { appointmentDate (required), purpose (required), reasonForVisit, typeOfVisit }  | { message: "Appointment booked successfully" }  | Yes (patient)|
| /appointments/my          | GET    | Get appointments of logged-in patient| Query params: page, limit (optional pagination)                                  | Array of appointment objects                      | Yes (patient)|
| /appointments/patient/:patientId | GET | Get appointments for specific patient| -                                                                                | Array of appointment objects                      | Yes (self/admin)|
| /appointments/:id         | PATCH  | Update an appointment (patient or admin) | Fields to update (appointmentDate, purpose, typeOfVisit, diagnosis)             | Updated appointment object                        | Yes (owner/admin)|

### Admin Appointment Management

| Endpoint                  | Method | Description                         | Request Body                      | Response                           | Auth Required |
|---------------------------|--------|-----------------------------------|---------------------------------|----------------------------------|--------------|
| /appointments/            | GET    | Get all appointments (admin/superadmin/doctor/nurse) | Query params: page, limit (optional) | Array of appointments | Yes (admin+) |
| /appointments/:id/approve | PATCH  | Approve appointment (admin/superadmin) | -                               | { message, appointment }          | Yes (admin+) |
| /appointments/:id         | DELETE | Delete appointment (admin/superadmin) | -                               | { message: "Appointment deleted successfully" } | Yes (admin+) |

### Consultation Management

| Endpoint                  | Method | Description                         | Request Body                                              | Response                               | Auth Required |
|---------------------------|--------|-----------------------------------|-----------------------------------------------------------|--------------------------------------|--------------|
| /appointments/:id/start   | PATCH  | Start consultation                 | -                                                         | { message, appointment }              | Yes          |
| /appointments/:id/complete| PATCH  | Complete consultation              | Consultation results fields                                | Updated appointment object            | Yes          |
| /appointments/:id/consultation | PATCH | Save consultation details       | { diagnosis, management, medicinesPrescribed, ... }       | { message, appointment }              | Yes          |
| /appointments/:id/prescribe| POST | Prescribe medicines               | { prescribed: [{ medicineId, quantity }] }                 | { message: "Prescription processed" }| Yes          |

### Reporting & Certificates

| Endpoint                  | Method | Description                         | Request Body | Response                           | Auth Required |
|---------------------------|--------|-----------------------------------|--------------|----------------------------------|--------------|
| /appointments/reports     | GET    | Generate analytics reports         | -            | Report summary JSON              | Yes          |
| /appointments/consultations | GET  | List consultations with diagnosis  | -            | Array of consultation objects    | Yes          |
| /appointments/medical-certificates | GET | Get completed medical certificates | -          | Array of certificate objects     | Yes          |
| /appointments/consultations/:id | GET | Get consultation by ID             | -            | Consultation object              | Yes          |
| /appointments/:id/certificate-pdf | GET | Generate Medical Certificate PDF   | -            | PDF file stream (.pdf)           | Yes          |

---

## Authentication

- All endpoints requiring authentication must include a valid JWT token in the Authorization header:  
  `Authorization: Bearer <token>`

- Role-based authorization is enforced for certain endpoints (e.g., admin-only routes).

## Error Handling

- Error responses include appropriate HTTP status codes such as 400, 403, 404, 409, and 500 with JSON error messages:  
  ```json  
  { "error": "Error message here" }
  ```

## Usage Examples

### Example: Book Appointment (Patient)

Request:

```
POST /appointments/book  
Authorization: Bearer <token>  
Content-Type: application/json  

{  
  "appointmentDate": "2024-07-01T10:00:00Z",  
  "purpose": "Regular check-up"  
}
```

Response:

```
201 Created  
{  
  "message": "Appointment booked successfully"  
}
```

---

This documentation will be extended with other resource endpoints (e.g., medicines, users, notifications, calendar) as needed.
