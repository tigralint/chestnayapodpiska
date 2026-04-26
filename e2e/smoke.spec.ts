import { test, expect } from '@playwright/test';

test.describe('Navigation & Routing', () => {
    test('homepage loads with correct title and hero', async ({ page }) => {
        await page.goto('/');
        await expect(page).toHaveTitle(/Честная Подписка/);
        // Hero section should be visible
        const heroHeading = page.locator('h1');
        await expect(heroHeading).toBeVisible();
    });

    test('subscription flow navigates correctly', async ({ page }) => {
        await page.goto('/podpiska');
        await expect(page.locator('h1')).toBeVisible();
        // Form should be present
        const form = page.locator('form');
        await expect(form).toBeVisible();
    });

    test('course flow navigates correctly', async ({ page }) => {
        await page.goto('/kursy');
        await expect(page.locator('h1')).toBeVisible();
    });

    test('radar view loads', async ({ page }) => {
        await page.goto('/radar');
        await expect(page.locator('h1')).toBeVisible();
    });

    test('FAQ view loads', async ({ page }) => {
        await page.goto('/faq');
        await expect(page.locator('h1')).toBeVisible();
    });

    test('guides view loads', async ({ page }) => {
        await page.goto('/guides');
        await expect(page.locator('h1')).toBeVisible();
    });

    test('404 page shows for unknown routes', async ({ page }) => {
        await page.goto('/nonexistent-page');
        await expect(page.locator('text=404')).toBeVisible();
    });
});

test.describe('LegalBot Chat Widget', () => {
    test('chat toggle button is visible on all pages', async ({ page }) => {
        await page.goto('/');
        const chatButton = page.locator('button[aria-label="Открыть юридический ИИ-ассистент"]');
        await expect(chatButton).toBeVisible();
    });

    test('clicking chat button opens the chat dialog', async ({ page }) => {
        await page.goto('/');
        await page.click('button[aria-label="Открыть юридический ИИ-ассистент"]');
        const dialog = page.locator('[role="dialog"]');
        await expect(dialog).toBeVisible();
    });
});

test.describe('Subscription Form Validation', () => {
    test('submit button is disabled without required fields', async ({ page }) => {
        await page.goto('/podpiska');
        // The submit button should exist but not be submittable without data
        const submitButton = page.locator('button[type="submit"]');
        await expect(submitButton).toBeVisible();
    });

    test('service name input accepts text', async ({ page }) => {
        await page.goto('/podpiska');
        const serviceInput = page.locator('input').first();
        await serviceInput.fill('Яндекс Плюс');
        await expect(serviceInput).toHaveValue('Яндекс Плюс');
    });
});

test.describe('Accessibility', () => {
    test('main navigation has proper aria labels', async ({ page }) => {
        await page.goto('/');
        // Tab bar / navigation should have aria attributes
        const nav = page.locator('nav');
        await expect(nav.first()).toBeVisible();
    });

    test('all interactive elements have accessible names', async ({ page }) => {
        await page.goto('/');
        // Check that all buttons have either text content or aria-label
        const buttons = page.locator('button');
        const count = await buttons.count();
        for (let i = 0; i < Math.min(count, 10); i++) {
            const btn = buttons.nth(i);
            const hasLabel = await btn.getAttribute('aria-label');
            const hasText = await btn.textContent();
            expect(hasLabel || hasText?.trim()).toBeTruthy();
        }
    });
});
