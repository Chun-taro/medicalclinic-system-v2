# System Documentation

## Overview
This system is a Medical Clinic Management System developed as a full-stack web application consisting of a RESTful API backend, a React-based frontend, and a MongoDB non-relational database. 

The system is designed to facilitate appointment scheduling, patient management, notifications, calendar integration, and other clinic administrative functions.

## Architecture
- **Backend:** Node.js with Express.js serving as the RESTful API. The backend handles business logic, data validation, authentication, and integration with the database and external services.
- **Frontend:** React.js framework providing an interactive user interface. It separates views for admin and patient users with dedicated pages for dashboard, appointment booking, profile management, notifications, and reports.
- **Database:** MongoDB non-relational database accessed via Mongoose ODM for flexible and scalable data management.
- **Authentication:** Secured via JWT (JSON Web Token) for API endpoints, with additional OAuth support via Google for user login.
- **Security:** Includes JWT authentication, CORS configuration, password hashing, role-based access control, and input validation to safeguard data and user privacy.

## Features

### Common Features (All Users)
- User registration and login (including Google OAuth)
- Role-based access control for feature permissions
- Profile management including personal, medical, and contact information
- Notifications system with email and push notifications
- Secure API authentication with JWT

### Patient (User) Features
- Book and manage appointments (view current and past)
- View personal medical history, allergies, medications, and consultation results
- Receive notifications about appointment status and other relevant updates
- View and download medical certificates and reports
- Profile management including personal information and emergency contacts
- View notifications and alerts in the patient dashboard

### Admin Features
- Manage all appointments including approval, rejection, and consultation management
- Access detailed reports and analytics on appointments, diagnoses, and referrals
- Manage medicine inventory (add, update, track stock levels)
- Manage users including patients, doctors, nurses, and other admin staff
- Send notifications and alerts to users and staff
- Oversee calendar synchronization and appointment scheduling
- Access detailed consultation records and medical certificates

### Superadmin Features
- Full access to system configuration and settings
- Manage all users and assign roles
- Oversee global system health and logs


### Doctor and Nurse Features
- Access assigned appointments and patient consultation history
- Record diagnosis, treatment plans, and prescribe medicines
- Start and complete consultations with detailed medical data entry
- View notifications relevant to consultations and appointments

---


## Design Decisions
- Chose RESTful API design for stateless and scalable backend interactions.
- Selected MongoDB for flexible data schema to manage complex patient medical histories.
- Used JWT tokens for stateless, secure authentication across API endpoints.
- Integrated Passport.js for Google OAuth to enhance user login options.
- Modularized backend with controllers and routes for maintainability.
- React frontend structured into patient and admin modules for clear separation of concerns.

## Challenges and Solutions
- Managing complex medical and demographic data required extensive mongoose schemas with nested subdocuments and validation.
- Securing sensitive user data led to implementation of strong JWT auth and encryption best practices.
- Synchronizing calendar data with external Google Calendar API required OAuth token management.
- Handling real-time notifications necessitated utility modules for email and push notification abstraction.

## External Integrations
- Google OAuth for user authentication
- Google Calendar API for calendar syncing
- Email service for notifications (likely using nodemailer or similar)
- Cloudinary for media upload and storage (e.g., patient profile pictures, appointment-related images)
- Puppeteer for server-side PDF generation (e.g., medical certificates)
- Additional external APIs to be integrated as needed (payment gateways, geolocation, third-party data sources)

## Future Enhancements
- Extend API integrations to cover payments and advanced analytics
- Improve frontend UX/UI based on user feedback
- Implement robust API documentation and automated testing
- Add real-time chat or consultation features for doctors and patients

---

This documentation provides a comprehensive overview of the system's structure, features, and design rationale to guide further development and maintenance.
