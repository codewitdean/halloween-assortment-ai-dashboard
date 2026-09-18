import { expect, test } from '@playwright/test';
test('four-page dashboard, modeled KPIs, interactive allocation and full-screen presentation', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await expect(page.locator('.executive-kpis')).toContainText('$27,703,646.95');
  await expect(page.locator('.executive-kpis')).toContainText('$13,899,146.95');
  await expect(page.locator('.executive-kpis')).toContainText('100.7%');
  await expect(page.locator('.category-validation')).toContainText('3/3');
  await expect(page.locator('.comparison-panel')).toContainText(
    'Sales and base profit are also lower',
  );
  expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBeLessThanOrEqual(
    1080,
  );
  await page.screenshot({
    path: 'docs/screenshots/redesign-executive-overview.png',
    fullPage: false,
  });
  await page.locator('.executive-kpi').last().locator('.metric-tip').focus();
  await expect(
    page.getByRole('tooltip').filter({ hasText: 'Modeled profit divided' }),
  ).toBeVisible();
  await page.locator('.facing-bar button').first().click();
  await expect(page.getByRole('dialog')).toContainText('12 ft Giant Skeleton');
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Present full screen' }).click();
  await expect(page.getByRole('button', { name: 'Exit full screen' })).toBeVisible();
  expect(await page.evaluate(() => !!document.fullscreenElement)).toBe(true);
  await expect(page.getByRole('navigation', { name: 'Dashboard pages' })).toBeVisible();
  await page.getByRole('button', { name: 'Exit full screen' }).click();
  await page.getByRole('button', { name: 'Product Performance', exact: false }).click();
  await expect(page).toHaveURL(/#performance$/);
  await page.getByLabel('Team placement', { exact: true }).selectOption('Online-Only');
  await expect(page.locator('#products tbody tr')).toHaveCount(4);
  await page.getByRole('button', { name: 'Reset', exact: true }).click();
  await page.getByLabel('Model/team disagreement', { exact: true }).check();
  await expect(page.getByText('13 products matching filters')).toBeVisible();
  await page.getByRole('button', { name: 'Reset', exact: true }).click();
  await page.getByLabel('Status', { exact: true }).selectOption('new');
  await expect(page.getByText('Historical evidence unavailable for this selection.')).toBeVisible();
  await page.getByRole('button', { name: 'Reset', exact: true }).click();
  await page.locator('.recharts-bar-rectangle').first().click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: 'docs/screenshots/redesign-product-performance.png',
    fullPage: true,
  });
  await page.getByRole('button', { name: 'Final Assortment', exact: false }).click();
  await expect(page.locator('.facing-bar button')).toHaveCount(13);
  await expect(page.locator('.online-roster button')).toHaveCount(4);
  await expect(page.locator('.removal-groups button')).toHaveCount(9);
  await expect(page.locator('.online-roster')).toContainText('Animated Witch Cauldron');
  await page.screenshot({ path: 'docs/screenshots/redesign-final-assortment.png', fullPage: true });
  await page.getByRole('button', { name: 'AI and Team Judgment', exact: false }).click();
  await expect(page.locator('.judgment-panels section')).toHaveCount(4);
  await expect(page.locator('.judgment-cards article')).toHaveCount(6);
  await expect(page.getByLabel('Consensus rationale', { exact: true })).toBeVisible();
  await page.getByLabel('Rationale product', { exact: true }).selectOption({
    label: 'Animated Witch Cauldron · Draft',
  });
  await page.screenshot({ path: 'docs/screenshots/redesign-ai-team-judgment.png', fullPage: true });
  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'AI and Team Judgment', exact: true }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
test('every page stays within the mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  for (const label of [
    'Executive Overview',
    'Product Performance',
    'Final Assortment',
    'AI and Team Judgment',
  ]) {
    await page.getByRole('button', { name: label, exact: false }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(label);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      390,
    );
  }
});
