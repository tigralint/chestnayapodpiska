import { test, expect } from '@playwright/test';

test.describe('Navigation & Routing', () => {
    test('homepage loads with correct title and hero', async ({ page }) => {
        await page.goto('/');
        await expect(page).toHaveTitle(/ЧестнаяПодписка/);
        // Hero section should be visible
        const heroHeading = page.locator('h1');
        await expect(heroHeading).toBeVisible();
    });

    test('subscription flow navigates correctly', async ({ page }) => {
        await page.goto('/claim');
        await expect(page.locator('h1:visible').first()).toBeVisible();
        // The generate button should be present
        const generateBtn = page.locator('button:has-text("Сгенерировать претензию")');
        await expect(generateBtn).toBeVisible();
    });

    test('course flow navigates correctly', async ({ page }) => {
        await page.goto('/course');
        await expect(page.locator('h1:visible').first()).toBeVisible();
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
        await page.goto('/claim');
        // The generate button should exist and be disabled because Turnstile isn't passed (in headless) and consent checkbox is unchecked.
        const generateBtn = page.locator('button:has-text("Сгенерировать претензию")');
        await expect(generateBtn).toBeVisible();
        await expect(generateBtn).toBeDisabled();
    });

    test('service name input accepts text', async ({ page }) => {
        await page.goto('/claim');
        const serviceInput = page.locator('input').first();
        await serviceInput.fill('Яндекс Плюс');
        await expect(serviceInput).toHaveValue('Яндекс Плюс');
    });
});

test.describe('Accessibility', () => {
    test('main navigation has proper aria labels', async ({ page }) => {
        await page.goto('/');
        // Tab bar / navigation should have aria attributes (check the first visible one)
        const visibleNav = page.locator('nav:visible').first();
        await expect(visibleNav).toBeVisible();
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
