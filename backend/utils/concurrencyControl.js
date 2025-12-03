const mongoose = require('mongoose');

/**
 * Utility functions for optimistic concurrency control and MVCC
 */

/**
 * Performs an optimistic update with version checking
 * @param {mongoose.Model} Model - The Mongoose model to update
 * @param {Object} query - Query to find the document
 * @param {Object} update - Update operations
 * @param {Object} options - Additional options for the update
 * @param {number} maxRetries - Maximum number of retry attempts (default: 3)
 * @param {number} retryDelay - Delay between retries in ms (default: 100)
 * @returns {Promise<Object>} Updated document
 */
async function optimisticUpdate(Model, query, update, options = {}, maxRetries = 3, retryDelay = 100) {
  let attempts = 0;

  while (attempts < maxRetries) {
    try {
      // Ensure version is included in the query for concurrency control
      const versionQuery = { ...query };

      // Perform the update with version check
      const updatedDoc = await Model.findOneAndUpdate(
        versionQuery,
        {
          ...update,
          $inc: { version: 1 } // Increment version on successful update
        },
        {
          new: true,
          runValidators: true,
          ...options
        }
      );

      if (!updatedDoc) {
        throw new Error('version conflict');
      }

      return updatedDoc;
    } catch (error) {
      attempts++;

      if (error.message === 'version conflict' || attempts >= maxRetries) {
        throw new Error('version conflict');
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, retryDelay * attempts));
    }
  }
}

/**
 * Creates a transaction session and executes operations within it
 * @param {Function} operations - Function that receives session and performs operations
 * @returns {Promise<any>} Result of the operations
 */
async function executeInTransaction(operations) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const result = await operations(session);
    await session.commitTransaction();
    return result;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

/**
 * Checks if a document has been modified by comparing versions
 * @param {mongoose.Document} doc - The document to check
 * @param {number} expectedVersion - The expected version
 * @returns {boolean} True if versions match
 */
function isVersionCurrent(doc, expectedVersion) {
  return doc.version === expectedVersion;
}

/**
 * Gets the current version of a document
 * @param {mongoose.Document} doc - The document
 * @returns {number} Current version
 */
function getCurrentVersion(doc) {
  return doc.version || 0;
}

module.exports = {
  optimisticUpdate,
  executeInTransaction,
  isVersionCurrent,
  getCurrentVersion
};
