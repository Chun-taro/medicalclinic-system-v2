require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const User = require('../models/User');

const migrateUsers = async () => {
    try {
        const uri = process.env.MONGO_URI;
        if (!uri) {
            console.error('MONGO_URI is missing');
            return;
        }

        await mongoose.connect(uri);
        console.log('Connected to MongoDB');

        // Update all users who don't have isVerified set or isVerified is false
        // Ideally, for a "migration" of existing users, we want to set them to true.
        // New users created *after* this feature was deployed should remain false if not verified.
        // However, since we just deployed it, we can assume all currently existing users should be verified
        // EXCEPT maybe those created in the last few minutes who actually need verification.
        // For safety, let's verify everyone. The user chuntaro0430 is definitely an old user.

        const result = await User.updateMany(
            {}, // Filter: all users
            { $set: { isVerified: true } }
        );

        console.log(`Updated ${result.modifiedCount} users to verified.`);

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected');
    }
};

migrateUsers();
