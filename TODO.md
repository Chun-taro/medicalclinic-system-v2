# TODO: Apply Recommendations

## 1. Permissions
- Implement role-based permissions system
- Define roles: superadmin, admin/doctor, patient
- Restrict access based on roles in frontend and backend

## 2. Colors for Super Admin and Doctor
- Customize color schemes for superadmin and doctor roles
- Update CSS files for different themes

## 3. Doctor must not see Activity Log
- Hide activity log section from doctor (admin) role
- Modify SuperadminLogs.jsx or AdminLogs.jsx to check role

## 4. Appointment: Purpose of Visit
- Hide or remove checkbox for purpose of visit in appointment forms
- Update BookAppointment.jsx and related forms

## 5. Names: Remove Alerts
- Remove alert messages related to names in forms or validations

## 6. Scheduling: Date of Request and Customize Availability
- Add date of request field in scheduling
- Allow customization of availability dates
- Update Calendar.jsx and appointment booking

## 7. Inventory: Fix Design, Add Medicine Button at Top
- Redesign inventory page
- Move "Add Medicine" button to the top
- Update Inventory.jsx and SuperadminInventory.jsx

## 8. Activity Logs: Record Every Action
- Ensure all user actions are logged
- Update logActivity.js and related logging functions
- Add logging to all CRUD operations and user interactions
