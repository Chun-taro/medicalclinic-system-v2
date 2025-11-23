# TODO: Implement Notification to Google Calendar Sync

## Steps to Complete

1. **Update Notification Model**: Add `appointmentId` field to `Notification.js` to link notifications to appointments.
2. **Update sendNotification Utility**: Modify `sendNotification.js` to accept and store `appointmentId` when creating notifications.
3. **Add createEventFromNotification Function**: In `calendarController.js`, add a new function to fetch notification, get associated appointment, and create a Google Calendar event.
4. **Add New Route**: In `routes/calendar.js`, add `POST /sync-notification/:notificationId` route to trigger the sync.
5. **Test the Implementation**: Run the backend and test the new endpoint with a sample notification.
6. **Frontend Integration**: Note to update frontend (e.g., add button in Notifications.jsx) to call the new endpoint (manual step for user).

## Progress Tracking
- [ ] Step 1: Update Notification Model
- [ ] Step 2: Update sendNotification Utility
- [ ] Step 3: Add createEventFromNotification Function
- [ ] Step 4: Add New Route
- [ ] Step 5: Test Implementation
- [ ] Step 6: Frontend Integration (user action)
