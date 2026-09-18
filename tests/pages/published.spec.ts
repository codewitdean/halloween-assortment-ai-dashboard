import { expect, test } from '@playwright/test';
test('published dashboard works without server APIs under its repository path', async ({
  page,
}) => {
  const errors: string[] = [];
  const failures: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('response', (r) => {
    if (r.status() >= 400) failures.push(`${r.status()} ${r.url()}`);
  });
  page.on('request', (r) => {
    if (new URL(r.url()).pathname.startsWith('/api/')) failures.push(r.url());
  });
  await page.goto('./');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Executive Overview');
  await expect(page.locator('.executive-kpis')).toContainText('$27,703,646.95');
  await expect(page.locator('.executive-kpis')).toContainText('$13,899,146.95');
  await expect(page.getByRole('button', { name: 'Reload workbook' })).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBeLessThanOrEqual(
    1080,
  );
  await page.locator('.facing-bar button').first().click();
  await expect(page.getByRole('dialog')).toContainText('12 ft Giant Skeleton');
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Product Performance', exact: false }).click();
  await page.getByLabel('Team placement', { exact: true }).selectOption('Online-Only');
  await expect(page.locator('#products tbody tr')).toHaveCount(4);
  await page.getByRole('button', { name: 'Final Assortment', exact: false }).click();
  await expect(page.locator('.online-roster button')).toHaveCount(4);
  await page.getByRole('button', { name: 'AI and Team Judgment', exact: false }).click();
  await expect(page.getByLabel('Consensus rationale', { exact: true })).toHaveAttribute(
    'readonly',
    '',
  );
  await expect(page.getByRole('button', { name: 'Approve rationale' })).toHaveCount(0);
  await page.getByLabel('Question', { exact: true }).fill('Validate the 16-facing assortment.');
  await page.getByRole('button', { name: 'Ask about evidence' }).click();
  await expect(page.getByRole('article', { name: 'Evidence answer' })).toContainText('16/16');
  await expect(page.getByRole('article', { name: 'Evidence answer' })).toContainText(
    'Deterministic evidence mode',
  );
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('AI and Team Judgment');
  await page.screenshot({
    path: 'docs/screenshots/published-ai-team-judgment.png',
    fullPage: true,
  });
  expect(errors).toEqual([]);
  expect(failures).toEqual([]);
});
