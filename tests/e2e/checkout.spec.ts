import { test,expect } from '@playwright/test';
test.skip(!process.env.E2E_CONFIGURED_STORE,'Requires seeded TEST database with test business settings and a running email sink');
test('customer can browse and add a product to the basket',async({page})=>{
 await page.goto('/menu');await page.getByRole('button',{name:/add/i}).first().click();
 await expect(page.getByRole('dialog')).toBeVisible();
 // Seed drink variants require selecting a size before adding.
 await page.getByLabel('Regular').first().check();
 await page.getByRole('button',{name:/add to basket/i}).click();
 await page.goto('/cart');await expect(page.getByText('Basket summary')).toBeVisible();
});
