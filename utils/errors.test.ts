import { describe, it, expect } from 'vitest';
import { ApiError } from './errors';

describe('ApiError', () => {
    it('should create an error with status and message', () => {
        const error = new ApiError(404, 'Not Found');

        expect(error).toBeInstanceOf(Error);
        expect(error).toBeInstanceOf(ApiError);
        expect(error.name).toBe('ApiError');
        expect(error.message).toBe('Not Found');
        expect(error.status).toBe(404);
        expect(error.details).toBeUndefined();
    });

    it('should store details if provided', () => {
        const details = { field: 'email', reason: 'invalid' };
        const error = new ApiError(400, 'Bad Request', details);

        expect(error.status).toBe(400);
        expect(error.message).toBe('Bad Request');
        expect(error.details).toBe(details);
    });

    it('should capture stack trace', () => {
        const error = new ApiError(500, 'Server Error');
        expect(error.stack).toBeDefined();
        expect(typeof error.stack).toBe('string');
        // The stack trace should start with the error name and message
        expect(error.stack).toContain('ApiError: Server Error');
    });
});
