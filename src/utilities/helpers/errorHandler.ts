// utils/errorHandler.js

export const getErrorMessage = (error: any) => {
  // Axios errors
  if (error?.isAxiosError) {
    // Network errors (no response from server)
    if (!error.response) {
      return error.message || 'Network error. Please check your connection.';
    }

    // Server responded with error
    const { data } = error.response;

    // Try different common response formats
    if (typeof data === 'string') return data;
    if (data?.message) return data.message;
    if (data?.error)
      return typeof data.error === 'string' ? data.error : data.error.message;

    // Handle validation errors
    if (data?.validation_errors) {
      const errors = data.validation_errors;
      // If it's an object with arrays of errors
      if (typeof errors === 'object' && !Array.isArray(errors)) {
        const messages = Object.values(errors).flat();
        return messages.join(', ');
      }
      return Array.isArray(errors) ? errors.join(', ') : String(errors);
    }

    // Handle general errors object
    if (data?.errors) {
      const errors = data.errors;
      // If it's an object with arrays of errors
      if (typeof errors === 'object' && !Array.isArray(errors)) {
        const messages = Object.values(errors).flat();
        return messages.join(', ');
      }
      return Array.isArray(errors) ? errors.join(', ') : String(errors);
    }

    // Fallback to status text
    return error.response.statusText || `Error ${error.response.status}`;
  }

  // Standard JavaScript errors
  if (error instanceof Error) {
    return error.message;
  }

  // String errors
  if (typeof error === 'string') {
    return error;
  }

  // Object with message property
  if (error?.message) {
    return error.message;
  }

  // Fallback
  return 'Something went wrong. Please try again.';
};
