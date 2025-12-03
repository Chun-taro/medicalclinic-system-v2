# MVCC, Locking, and Timestamp Documentation

## Overview

This document explains the implementation of Multi-Version Concurrency Control (MVCC), locking mechanisms, and timestamp management in the Medical Clinic Management System using MongoDB Atlas.

## Table of Contents

1. [Timestamps](#timestamps)
2. [Multi-Version Concurrency Control (MVCC)](#multi-version-concurrency-control-mvcc)
3. [Locking Mechanisms](#locking-mechanisms)
4. [Implementation Details](#implementation-details)
5. [Error Handling](#error-handling)
6. [Best Practices](#best-practices)

## Timestamps

### Automatic Timestamps

MongoDB provides automatic timestamp functionality through Mongoose's `{ timestamps: true }` option:

```javascript
const userSchema = new mongoose.Schema({
  // ... fields
}, { timestamps: true });
```

This automatically adds:
- `createdAt`: Date when the document was first created
- `updatedAt`: Date when the document was last updated

### Models with Automatic Timestamps

- **User Model** (`backend/models/User.js`)
- **Appointment Model** (`backend/models/Appointment.js`)
- **Medicine Model** (`backend/models/Medicine.js`)

### Explicit Timestamp Fields

Some models use explicit timestamp fields for specific purposes:

- **Log Model** (`backend/models/Log.js`): `timestamp` field for activity logging
- **Notification Model** (`backend/models/Notification.js`): `timestamp` field for notification creation

## Multi-Version Concurrency Control (MVCC)

### What is MVCC?

MVCC is a concurrency control method that provides each user with a "snapshot" of the database at a particular point in time. Multiple versions of the same data can exist simultaneously, allowing:

- **Read operations** to access consistent data without blocking writes
- **Write operations** to proceed without blocking reads
- **Conflict resolution** through version checking

### MongoDB Atlas MVCC Implementation

While MongoDB doesn't implement traditional MVCC like PostgreSQL, it provides similar benefits through:

1. **Document-Level Concurrency**: Each document can be modified independently
2. **Optimistic Concurrency Control**: Version-based conflict detection
3. **WiredTiger Storage Engine**: Provides efficient multi-versioning at the storage level

### Version Fields

All critical models include a `version` field for optimistic concurrency control:

```javascript
version: { type: Number, default: 0 }
```

**Models with Version Control:**
- User Model
- Appointment Model
- Medicine Model
- Notification Model
- Log Model

## Locking Mechanisms

### Optimistic Locking

The system uses **optimistic locking** rather than pessimistic locking for better performance:

#### Advantages:
- **Higher concurrency**: Multiple users can read data simultaneously
- **Better performance**: No locks held during read operations
- **Scalability**: Works well with distributed systems like MongoDB Atlas

#### Disadvantages:
- **Conflict resolution required**: Applications must handle version conflicts
- **Retry logic needed**: Failed updates require client-side retry

### Transaction Support

MongoDB Atlas supports multi-document transactions for complex operations:

```javascript
const session = await mongoose.startSession();
session.startTransaction();

try {
  // Multiple operations within transaction
  await session.commitTransaction();
} catch (error) {
  await session.abortTransaction();
} finally {
  session.endSession();
}
```

### Lock Types Implemented

#### 1. Document-Level Locks
- Automatic MongoDB document-level locking
- Each document operation is atomic
- No explicit locking required for single-document operations

#### 2. Transaction-Based Locks
- Used for multi-document operations
- Ensures atomicity across related documents
- Automatic rollback on failure

## Implementation Details

### Optimistic Concurrency Control Utility

The `backend/utils/concurrencyControl.js` file provides core OCC functionality:

```javascript
/**
 * Performs an optimistic update with version checking
 */
async function optimisticUpdate(Model, query, update, options = {}, maxRetries = 3, retryDelay = 100) {
  // Implementation with version checking and retry logic
}
```

### Controller Implementations

#### User Controller Updates
```javascript
const updateProfile = async (req, res) => {
  try {
    const { version, ...updates } = req.body;

    const updatedUser = await optimisticUpdate(
      User,
      { _id: req.user.userId, version: version },
      { ...updates, $inc: { version: 1 } },
      { new: true }
    );

    res.json({ message: 'Profile updated successfully', user: updatedUser, version: updatedUser.version });
  } catch (err) {
    if (err.message.includes('version conflict')) {
      return res.status(409).json({ error: 'Profile was modified by another process. Please refresh and try again.' });
    }
    res.status(500).json({ error: err.message });
  }
};
```

#### Appointment Status Updates
```javascript
const updateAppointmentStatus = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { status, version } = req.body;

    const appointment = await Appointment.findOneAndUpdate(
      { _id: appointmentId, version: version },
      { status, $inc: { version: 1 } },
      { new: true }
    );

    if (!appointment) {
      return res.status(409).json({ error: 'Appointment version conflict or not found' });
    }

    res.json({ message: `Appointment ${status}`, version: appointment.version });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update appointment' });
  }
};
```

#### Medicine Dispensing
```javascript
const dispenseCapsules = async (req, res) => {
  try {
    const med = await Medicine.findOneAndUpdate(
      { _id: id, version: version },
      {
        $inc: { quantityInStock: -quantity, version: 1 },
        $set: { available: { $gt: ['$quantityInStock', quantity] } }
      },
      { new: true }
    );

    if (!med) {
      return res.status(409).json({ error: 'Medicine version conflict or not found' });
    }

    res.json({ message: 'Medicine dispensed', medicine: med, version: med.version });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
```

### Transaction Examples

#### Appointment Approval with Calendar Integration
```javascript
const approveAppointment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Update appointment status
    const updated = await optimisticUpdate(
      Appointment,
      { _id: req.params.id, version: version },
      { status: 'approved', $inc: { version: 1 } },
      { new: true, session }
    );

    // Log activity
    await logActivity(...);

    // Send notifications
    await sendNotification(...);

    // Create calendar event
    // ... calendar integration code ...

    await session.commitTransaction();
    res.json({ message: 'Appointment approved', appointment: updated });

  } catch (err) {
    await session.abortTransaction();
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    session.endSession();
  }
};
```

#### Medicine Deduction Transaction
```javascript
const deductMedicines = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    for (const item of prescribed) {
      const med = await Medicine.findById(item.medicineId).session(session);

      if (med.quantityInStock < qty) {
        await session.abortTransaction();
        return res.status(400).json({ error: `Not enough stock for ${med.name}` });
      }

      med.quantityInStock -= qty;
      med.available = med.quantityInStock > 0;
      await med.save({ session });
    }

    await session.commitTransaction();
    res.json({ success: true });

  } catch (err) {
    await session.abortTransaction();
    res.status(500).json({ error: err.message });
  }
};
```

## Error Handling

### Version Conflict Errors

When a version conflict occurs, the API returns:

```json
{
  "error": "Profile was modified by another process. Please refresh and try again.",
  "statusCode": 409
}
```

### HTTP Status Codes

- **200**: Successful operation
- **409**: Version conflict (optimistic locking failure)
- **500**: Server error

### Client-Side Handling

Clients should implement retry logic for 409 errors:

```javascript
const updateWithRetry = async (data, maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch('/api/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (response.status === 409) {
        // Refresh data and retry
        const freshData = await fetchCurrentData();
        data.version = freshData.version;
        continue;
      }

      return await response.json();

    } catch (error) {
      if (attempt === maxRetries) throw error;
    }
  }
};
```

## Best Practices

### 1. Version Field Management

- Always include version in update operations
- Increment version on every successful update
- Use version in query conditions for OCC

### 2. Transaction Usage

- Use transactions for multi-document operations
- Keep transactions short to minimize lock duration
- Handle transaction failures gracefully

### 3. Error Handling

- Implement client-side retry logic for version conflicts
- Provide clear error messages to users
- Log concurrency conflicts for monitoring

### 4. Performance Considerations

- Use optimistic locking for high-concurrency scenarios
- Monitor version conflict rates
- Consider pessimistic locking for extremely high-contention scenarios

### 5. Monitoring and Alerting

- Monitor version conflict frequency
- Set up alerts for high conflict rates
- Track transaction success/failure rates

## Performance Characteristics

### Optimistic Locking Benefits:
- **High read throughput**: Multiple readers don't block each other
- **Low latency**: No lock acquisition overhead
- **Scalability**: Works well in distributed environments

### Potential Drawbacks:
- **Conflict resolution overhead**: Failed updates require retry
- **Application complexity**: Client must handle conflicts
- **Network round-trips**: Retries increase network usage

### MongoDB Atlas Optimizations:
- **Document-level locking**: Minimizes lock contention
- **WiredTiger engine**: Efficient multi-version storage
- **Connection pooling**: Handles high concurrent connections
- **Read/write splitting**: Distributes load across replicas

## Conclusion

The implemented MVCC and locking system provides:

1. **Data Consistency**: Version-based conflict detection ensures data integrity
2. **High Performance**: Optimistic locking minimizes contention
3. **Scalability**: MongoDB Atlas handles concurrent workloads efficiently
4. **Reliability**: Transaction support ensures atomic complex operations
5. **User Experience**: Clear error handling and retry mechanisms

This implementation follows MongoDB best practices and provides enterprise-grade concurrency control suitable for production medical clinic systems.
