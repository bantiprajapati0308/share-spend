/**
 * Services Index
 * Central export for all API services
 */

export { default as apiClient } from "./apiClient";
export { default as emailService } from "./emailService";

// Export all services as named exports for convenience
export * from "./apiClient";
export * from "./emailService";
