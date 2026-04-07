import { test, expect } from '@playwright/test';

test.use({
  viewport: {
    height: 1080,
    width: 1920
  }
});

test('test', async ({ page }) => {
  await page.goto('https://brightcare.qa.emr.coremedicalcenter.com/auth/login');
  await page.getByRole('textbox', { name: 'Enter your username' }).click();
  await page.getByRole('textbox', { name: 'Enter your username' }).click();
  await page.getByRole('textbox', { name: 'Enter your username' }).fill('aston@mailinator.com');
  await page.getByRole('textbox', { name: 'Enter Password' }).click();
  await page.getByRole('textbox', { name: 'Enter Password' }).fill('Pass@123');
  await page.getByRole('button', { name: 'Login' }).click();
  await page.getByRole('button', { name: 'close' }).click();
  await page.getByRole('button', { name: 'Patients' }).click();
  await page.getByRole('button', { name: 'Patients' }).press('ControlOrMeta+-');
  await page.getByText('SearchSelect StatusAdd Patient').click();
  await page.getByText('SearchSelect StatusAdd Patient').click();
  await page.getByText('Select Status').click();
  await page.getByRole('option', { name: 'Active', exact: true }).getByRole('paragraph').click();
});