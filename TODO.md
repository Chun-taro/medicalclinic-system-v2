# TODO: Separate Medical Certificates from Consultations in Reports

## Backend Changes
- [x] Modify `getConsultations` in `appointmentController.js` to only fetch appointments with non-null `diagnosis`
- [x] Create new `getMedicalCertificates` function in `appointmentController.js` for fetching medical certificates
- [x] Add new route `/medical-certificates` in `appointments.js`

## Frontend Changes
- [x] Update `Reports.jsx` to use separate endpoints based on active tab
- [x] Remove client-side filtering for purpose in `Reports.jsx`

## Testing
- [x] Test consultations endpoint returns only consultations
- [x] Test medical-certificates endpoint returns only medical certificates
- [x] Verify frontend tabs display correct data
