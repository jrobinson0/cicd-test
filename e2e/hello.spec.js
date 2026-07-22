import { expect, test } from '@playwright/test';

test('shows the hello world heading and backend message', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Hello World' })).toBeVisible();
  await expect(page.getByTestId('backend-message')).toHaveText('Hello World from the backend!');
});
