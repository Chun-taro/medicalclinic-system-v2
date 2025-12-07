const mongoose = require('mongoose');

/**
 * Utility functions for optimistic concurrency control and MVCC
 */

/**
 * Performs an optimistic update with version checking
 * @param {mongoose.Model} Model 
 * @param {Object} query 
 * @param {Object} update 
 * @param {Object} options 
 * @param {number} maxRetries 
 * @param {number} retryDelay 
 * @returns {Promise<Object>} 
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
          $inc: { version: 1 } 
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
 * @param {Function} operations
 * @returns {Promise<any>} 
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
 * @param {mongoose.Document} doc 
 * @param {number} expectedVersion
 * @returns {boolean} 
 */
function isVersionCurrent(doc, expectedVersion) {
  return doc.version === expectedVersion;
}

/**
 *
 * @param {mongoose.Document} doc 
 * @returns {number} 
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
