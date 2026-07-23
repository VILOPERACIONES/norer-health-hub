import { expect, test } from '@playwright/test';

const localBrowser = process.env.NORDER_PLAYWRIGHT_EXECUTABLE;
if (localBrowser) {
  test.use({ launchOptions: { executablePath: localBrowser } });
}

test('detecta errores en el campo real de alimentos a evitar sin modificarlo', async ({ context, page }) => {
  await context.addCookies([
    { name: 'norder_token', value: 'e2e-token', url: 'http://localhost:8080' },
    {
      name: 'norder_user',
      value: JSON.stringify({ id: 'e2e-user', rol: 'admin', permisos: {} }),
      url: 'http://localhost:8080',
    },
  ]);
  await page.route('**/api/pacientes/spellcheck-e2e', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ data: { id: 'spellcheck-e2e', nombre: 'Paciente', valoraciones: [] } }),
  }));
  await page.goto('/pacientes/spellcheck-e2e/valoracion/nueva');
  await page.getByRole('button', { name: /Agregar/i }).first().click();

  const field = page.getByPlaceholder('Ej. Lácteos, Azúcares...');
  const originalText = 'Lacteos, azucar y vegetales komo estos.';
  await field.fill(originalText);

  const corrector = page.getByRole('complementary', { name: 'Corrector ortográfico local' });
  await expect(corrector).toBeVisible();
  await expect(corrector).toContainText('Lacteos');
  await expect(corrector).toContainText('azucar');
  await expect(corrector).toContainText('komo');
  await expect(field).toHaveAttribute('data-local-spelling', 'error');
  await expect(field).toHaveValue(originalText);

  await field.fill('Lácteos, azúcar y vegetales como estos.');
  await expect(corrector).toBeHidden();
  await expect(field).toHaveAttribute('data-local-spelling', 'valid');
});
