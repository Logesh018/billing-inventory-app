// utils/counterUtils.js
import Counter from "../models/counter.js";

/**
 * Get next sequence number for any counter type (INCREMENTS the counter)
 * @param {string} counterName - Name of the counter (e.g., "orderSeq_FOB", "purchaseEstimationSeq")
 * @returns {Promise<number>} - Next sequence number
 */
export const getNextSequence = async (counterName) => {
  const counter = await Counter.findOneAndUpdate(
    { _id: counterName },
    { $inc: { seq: 1 } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return counter.seq;
};

/**
 * Peek at the next sequence number WITHOUT incrementing
 * @param {string} counterName - Name of the counter
 * @returns {Promise<number>} - What the next sequence number will be
 */
export const peekNextSequence = async (counterName) => {
  const counter = await Counter.findById(counterName);
  
  // If counter doesn't exist, the next number will be 1
  if (!counter) {
    return 1;
  }
  
  // Return the next number that WOULD be assigned
  return counter.seq + 1;
};

/**
 * Reset a counter back to 0
 * @param {string} counterName - Name of the counter to reset
 * @returns {Promise<number>} - Returns 1 (the next number that will be assigned)
 */
export const resetSequence = async (counterName) => {
  await Counter.findOneAndUpdate(
    { _id: counterName },
    { seq: 0 },
    { upsert: true }
  );
  
  console.log(`✅ Counter "${counterName}" reset to 0`);
  return 1;
};

/**
 * Get current counter value without modifying it
 * @param {string} counterName - Name of the counter
 * @returns {Promise<number>} - Current counter value
 */
export const getCurrentSequence = async (counterName) => {
  const counter = await Counter.findById(counterName);
  return counter ? counter.seq : 0;
};