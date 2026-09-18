import { test, expect } from '@playwright/test';
test('fixed consensus, rationale approval lifecycle and grounded Q&A', async ({
  page,
  request,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Final Assortment', exact: false }).click();
  const snapshot = await page.locator('.placement-groups').innerText();
  await expect(page.getByRole('heading', { name: 'Final Assortment', exact: true })).toBeVisible();
  await expect(page.locator('.allocation-total')).toContainText('16');
  await expect(page.locator('.placement-groups select')).toHaveCount(0);
  await page.getByRole('button', { name: 'AI and Team Judgment', exact: false }).click();
  await page.getByText('All comparison scenarios and model assumptions', { exact: true }).click();
  await expect(page.locator('#scenario-comparison tbody tr')).toHaveCount(4);
  await expect(page.locator('.judgment-cards article')).toHaveCount(6);
  const rationales = page.locator('#rationales');
  await expect(rationales.getByLabel('Consensus rationale')).toBeVisible();
  await expect(
    rationales.getByText('Draft — requires team approval', { exact: true }),
  ).toBeVisible();
  // All writes use the isolated Playwright server's test-results rationale directory, never real team approvals.
  const text = 'Browser test rationale: reviewed source evidence in an isolated test store.';
  await rationales.getByLabel('Consensus rationale').fill(text);
  await rationales.getByRole('button', { name: 'Save draft', exact: true }).click();
  await expect(rationales.getByText('Rationale saved.', { exact: true })).toBeVisible();
  await rationales.getByRole('button', { name: 'Approve rationale', exact: true }).click();
  await expect(rationales.getByText('Team-approved rationale', { exact: true })).toBeVisible();
  await page.reload();
  await expect(
    page.locator('#rationales').getByText('Team-approved rationale', { exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel('Consensus rationale')).toHaveValue(text);
  await page.getByLabel('Consensus rationale').fill(text + ' Edited.');
  await expect(
    page.locator('#rationales').getByText('Draft — requires team approval', { exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Save draft', exact: true }).click();
  await expect(
    page.locator('#rationales').getByText('Rationale saved.', { exact: true }),
  ).toBeVisible();
  const saved = await (await request.get('/api/rationales')).json();
  const productId = Object.keys(saved.records)[0];
  expect(saved.records[productId].status).toBe('draft');
  await page.getByRole('button', { name: 'Final Assortment', exact: false }).click();
  const before = await page.locator('.placement-groups').innerText();
  expect(before).toBe(snapshot);
  await page.getByRole('button', { name: 'AI and Team Judgment', exact: false }).click();
  const invalid = await request.post('/api/rationales', {
    data: {
      fingerprint: saved.fingerprint,
      productId,
      text: 'Tamper',
      action: 'save',
      expectedRevision: 3,
      placement: 'Removed',
    },
  });
  expect(invalid.status()).toBe(400);
  await page.getByLabel('Question', { exact: true }).fill('Validate the 16-facing assortment.');
  await page.getByRole('button', { name: 'Ask about evidence' }).click();
  const answer = page.getByRole('article', { name: 'Evidence answer' });
  await expect(answer).toContainText('16/16');
  await expect(answer).toContainText('Deterministic evidence mode');
  await page.getByLabel('Question', { exact: true }).fill('Who voted for this product?');
  await page.getByRole('button', { name: 'Ask about evidence' }).click();
  await expect(answer).toContainText('cannot be reconstructed');
  await page
    .getByLabel('Question', { exact: true })
    .fill('What happens if the Giant Skeleton moves online?');
  await page.getByRole('button', { name: 'Ask about evidence' }).click();
  await expect(answer).toContainText('cannot change');
  await page.getByRole('button', { name: 'Final Assortment', exact: false }).click();
  expect(await page.locator('.placement-groups').innerText()).toBe(snapshot);
  await page.getByRole('button', { name: 'AI and Team Judgment', exact: false }).click();
  await page
    .getByLabel('Question', { exact: true })
    .fill('Which new product has the largest investment risk?');
  await page.getByRole('button', { name: 'Ask about evidence' }).click();
  await expect(answer).toContainText('$10,800,000.00');
  await expect(answer).toContainText('Removed');
  await page.locator('#assistant').scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'docs/screenshots/redesign-assistant.png' });
});
