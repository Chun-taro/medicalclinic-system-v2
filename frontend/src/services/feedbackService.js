/**
 * Feedback Service
 * Handles all API calls related to feedback and ratings
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Get auth token from localStorage
const getAuthToken = () => {
  return localStorage.getItem('token');
};

// Get auth header with token
const getAuthHeader = () => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

const feedbackService = {
  /**
   * Submit feedback for an appointment
   * @param {Object} feedbackData - { appointmentId, rating, comment }
   * @returns {Promise<Object>} - Feedback response with created feedback object
   */
  submitFeedback: async (feedbackData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/feedback`, {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify(feedbackData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit feedback');
      }

      return await response.json();
    } catch (error) {
      console.error('Error submitting feedback:', error);
      throw error;
    }
  },

  /**
   * Get feedback for a specific appointment
   * @param {String} appointmentId - ID of the appointment
   * @returns {Promise<Object>} - Feedback object for the appointment
   */
  getAppointmentFeedback: async (appointmentId) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/feedback/appointment/${appointmentId}`,
        {
          method: 'GET',
          headers: getAuthHeader()
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch feedback');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching appointment feedback:', error);
      throw error;
    }
  },

  /**
   * Get all feedback for a doctor
   * @param {String} doctorId - ID of the doctor
   * @param {Number} page - Page number for pagination (default: 1)
   * @param {Number} limit - Items per page (default: 10)
   * @returns {Promise<Object>} - Feedback array with pagination info
   */
  getDoctorFeedback: async (doctorId, page = 1, limit = 10) => {
    try {
      const url = new URL(`${API_BASE_URL}/feedback/doctor/${doctorId}/feedback`);
      url.searchParams.append('page', page);
      url.searchParams.append('limit', limit);

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch doctor feedback');
      }

      const data = await response.json();
      // Normalize server response so callers can use either an array or an object
      if (Array.isArray(data)) return data;
      if (Array.isArray(data.feedback)) return { feedbacks: data.feedback, pagination: data.pagination };
      return data;
    } catch (error) {
      console.error('Error fetching doctor feedback:', error);
      throw error;
    }
  },

  /**
   * Get average rating for a doctor
   * @param {String} doctorId - ID of the doctor
   * @returns {Promise<Object>} - Rating statistics with average and distribution
   */
  getDoctorRating: async (doctorId) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/feedback/doctor/${doctorId}/rating`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch doctor rating');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching doctor rating:', error);
      throw error;
    }
  },

  /**
   * Update feedback (by the patient who submitted it)
   * @param {String} feedbackId - ID of the feedback to update
   * @param {Object} updateData - { rating?, comment? }
   * @returns {Promise<Object>} - Updated feedback object
   */
  updateFeedback: async (feedbackId, updateData) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/feedback/${feedbackId}`,
        {
          method: 'PUT',
          headers: getAuthHeader(),
          body: JSON.stringify(updateData)
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update feedback');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating feedback:', error);
      throw error;
    }
  },

  /**
   * Get overall feedback analytics
   * @returns {Promise<Object>} - Analytics data including ratings, trends, top recipients
   */
  getFeedbackAnalytics: async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/feedback/analytics/overall`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch analytics');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching analytics:', error);
      throw error;
    }
  }
};

export default feedbackService;
