import { test, expect } from '@playwright/test';
test('desktop source summaries, filters, sorting, pagination and product details', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Executive Overview');
  await page.getByRole('button', { name: 'Product Performance', exact: false }).click();
  await expect(page.locator('.historical-strip')).toContainText('$29,481,671.50');
  await expect(page.locator('.historical-strip')).toContainText('$14,775,171.50');
  await expect(page.locator('.historical-strip')).toContainText('$14,706,500.00');
  await expect(page.locator('#products tbody tr')).toHaveCount(8);
  await page.screenshot({
    path: 'docs/screenshots/redesign-product-performance.png',
    fullPage: false,
  });
  await page.getByRole('button', { name: 'Next page' }).click();
  await expect(page.getByText('Page 2 of 4')).toBeVisible();
  await page.getByLabel('Status', { exact: true }).selectOption('new');
  await expect(page.getByText('10 products matching filters')).toBeVisible();
  await expect(page.locator('#products tbody tr').first()).toContainText('Mandatory minimum');
  await expect(page.locator('#products tbody tr').first().locator('td').nth(8)).toHaveText('—');
  await page.getByLabel('Search products', { exact: true }).fill('dragon');
  await expect(page.locator('#products tbody tr')).toHaveCount(1);
  const dragon = page
    .locator('#products')
    .getByRole('button', { name: '14 ft Giant Animated Dragon' });
  await dragon.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(
    dialog.locator('.investment-box').getByText('$10,800,000.00', { exact: true }),
  ).toBeVisible();
  await expect(dialog.getByText('These fields remain null', { exact: false })).toBeVisible();
  await page.screenshot({ path: 'docs/screenshots/redesign-product-detail.png' });
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(dragon).toBeFocused();
  await page.getByRole('button', { name: 'Reset', exact: true }).click();
  await page.getByLabel('Original channel', { exact: true }).selectOption('Online-Only');
  await expect(page.getByText('4 products matching filters')).toBeVisible();
  await page.getByRole('button', { name: 'Reset', exact: true }).click();
  await page.getByLabel('Category', { exact: true }).selectOption('Inflatables');
  await page.getByLabel('Licensed', { exact: true }).selectOption('yes');
  await expect(page.locator('#products tbody tr')).toHaveCount(3);
  await page.getByRole('button', { name: 'Reset', exact: true }).click();
  await page.getByRole('button', { name: 'Retail price', exact: true }).click();
  await expect(page.locator('#products tbody tr').first()).toContainText(
    'Halloween Doormat Assortment',
  );
  await page.getByRole('button', { name: 'Historical sales', exact: true }).click();
  await page.getByRole('button', { name: 'Historical sales', exact: true }).click();
  await expect(page.locator('#products tbody tr').first()).toContainText('12 ft Giant Skeleton');
  await page.getByLabel('Search products', { exact: true }).fill('nonexistent');
  await expect(page.getByRole('heading', { name: 'No matching products' })).toBeVisible();
  await page.getByRole('button', { name: 'Clear filters' }).click();
  await page.getByRole('button', { name: 'Reload workbook' }).click();
  await expect(page.getByRole('button', { name: 'Reload workbook' })).toBeEnabled();
  await expect(page.getByText('Validation passed', { exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});
test('mobile stays within viewport and source table scrolls', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.getByRole('button', { name: 'Product Performance', exact: false }).click();
  const table = page.getByRole('region', { name: 'Product source data, horizontally scrollable' });
  expect(await table.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(true);
  await page.screenshot({ path: 'docs/screenshots/redesign-mobile.png', fullPage: false });
  await page.getByLabel('Search products', { exact: true }).fill('skeleton');
  await page
    .locator('#products')
    .getByRole('button', { name: '12 ft Giant Skeleton', exact: false })
    .click();
  await expect(page.getByRole('dialog')).toBeVisible();
  expect(
    await page.getByRole('dialog').evaluate((el) => el.getBoundingClientRect().width),
  ).toBeLessThanOrEqual(390);
  await page.getByRole('button', { name: 'Close product details' }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
});
