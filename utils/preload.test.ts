import { describe, it, expect, vi, beforeEach } from 'vitest';
import { preloadRoute } from './preload';

// Mock the dynamic imports
vi.mock('../views/SubscriptionFlow', () => ({ default: {} }));
vi.mock('../views/CourseFlow', () => ({ default: {} }));
vi.mock('../views/GuidesView', () => ({ default: {} }));
vi.mock('../views/SimulatorView', () => ({ default: {} }));
vi.mock('../views/RadarView', () => ({ default: {} }));
vi.mock('../views/FaqView', () => ({ default: {} }));

describe('preloadRoute', () => {
    it('should not throw for known routes', () => {
        expect(() => preloadRoute('/claim')).not.toThrow();
        expect(() => preloadRoute('/course')).not.toThrow();
        expect(() => preloadRoute('/guides')).not.toThrow();
    });

    it('should not throw for unknown routes (gracefully ignores)', () => {
        expect(() => preloadRoute('/nonexistent')).not.toThrow();
    });

    it('should not preload the same route twice (idempotency)', () => {
        // Call twice — should not throw or cause issues
        preloadRoute('/claim');
        preloadRoute('/claim');
    });
});
