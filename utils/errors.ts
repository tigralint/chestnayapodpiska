// utils/errors.ts

/**
 * Custom error class for API requests.
 * Allows safely passing HTTP status codes without relying on string parsing.
 */
export class ApiError extends Error {
    constructor(
        public status: number,
        message: string,
        public details?: unknown
    ) {
        super(message);
        this.name = 'ApiError';

        // Maintains proper stack trace for where our error was thrown (only available on V8)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, ApiError);
        }
    }
}
