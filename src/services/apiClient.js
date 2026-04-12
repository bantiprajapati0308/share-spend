/**
 * Generic API Client
 * Handles all HTTP requests with configurable options
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

class ApiClient {
  /**
   * Generic request method
   * @param {string} endpoint - API endpoint (relative path)
   * @param {Object} options - Request options
   * @param {string} options.method - HTTP method (GET, POST, PUT, DELETE, etc.)
   * @param {Object} options.data - Request body data
   * @param {Object} options.headers - Additional headers
   * @param {boolean} options.parseResponse - Whether to parse response as JSON (default: true)
   * @param {string} options.baseUrl - Override base URL
   * @returns {Promise<Object>} Response object with success status and data
   */
  async request(endpoint, options = {}) {
    const {
      method = "GET",
      data = null,
      headers = {},
      parseResponse = true,
      baseUrl = API_BASE_URL,
    } = options;

    try {
      const url = `${baseUrl}${endpoint}`;
      const config = {
        method,
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
      };

      // Add body for non-GET requests
      if (data && method !== "GET") {
        config.body = JSON.stringify(data);
      }

      const response = await fetch(url, config);

      // Parse response if needed
      let result = null;
      if (parseResponse) {
        result = await response.json();
      } else {
        result = await response.text();
      }

      // Handle success
      if (response.ok) {
        return {
          success: true,
          status: response.status,
          data: result,
        };
      }

      // Handle error
      return {
        success: false,
        status: response.status,
        error: result?.error || result?.message || "API request failed",
        data: result,
      };
    } catch (error) {
      console.error(`API request failed:`, error);
      return {
        success: false,
        error: error.message || "Network error occurred",
        status: null,
      };
    }
  }

  /**
   * GET request helper
   */
  async get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: "GET" });
  }

  /**
   * POST request helper
   */
  async post(endpoint, data, options = {}) {
    return this.request(endpoint, { ...options, method: "POST", data });
  }

  /**
   * PUT request helper
   */
  async put(endpoint, data, options = {}) {
    return this.request(endpoint, { ...options, method: "PUT", data });
  }

  /**
   * PATCH request helper
   */
  async patch(endpoint, data, options = {}) {
    return this.request(endpoint, { ...options, method: "PATCH", data });
  }

  /**
   * DELETE request helper
   */
  async delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: "DELETE" });
  }
}

export default new ApiClient();
