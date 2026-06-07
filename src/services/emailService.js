/**
 * Email Service
 * Handles all email-related API calls
 */

import apiClient from "./apiClient";

const EMAIL_ENDPOINTS = {
  SEND: "/api/send-email/spend-share/welcome-user",
};

class EmailService {
  /**
   * Send a single email
   * @param {string} name - Recipient name
   * @param {string} email - Recipient email
   * @param {Array} attachments - Optional attachments
   * @returns {Promise<Object>} Response from API
   */
  async welcomeUserSendEmail({ email, name, attachments = [] }) {
    try {
      const requestData = {
        name,
        email,
      };
      if (attachments?.length > 0) {
        requestData.attachments = attachments;
      }

      // Make API call
      const response = await apiClient.post(EMAIL_ENDPOINTS.SEND, requestData);

      if (response.success) {
        return {
          success: true,
          message: response.data?.message || "Email sent successfully",
          data: response.data,
        };
      }

      return {
        success: false,
        error: response.error || "Failed to send email",
        data: response.data,
      };
    } catch (error) {
      console.error("EmailService.sendEmail error:", error);
      return {
        success: false,
        error: error.message || "Error sending email",
      };
    }
  }

  /**
   * Verify email address
   * @param {string} email - Email to verify
   * @returns {Promise<Object>} Verification result
   */
  async verifyEmail(email) {
    try {
      const response = await apiClient.post(EMAIL_ENDPOINTS.VERIFY, {
        email,
      });

      if (response.success) {
        return {
          success: true,
          message: response.data?.message || "Email verified",
          data: response.data,
        };
      }

      return {
        success: false,
        error: response.error || "Email verification failed",
        data: response.data,
      };
    } catch (error) {
      console.error("EmailService.verifyEmail error:", error);
      return {
        success: false,
        error: error.message || "Error verifying email",
      };
    }
  }
}

export default new EmailService();
