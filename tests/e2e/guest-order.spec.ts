import { test,expect } from '@playwright/test';
test('homepage and menu are accessible',async({page})=>{
  await page.goto('/');await expect(page.getByRole('heading',{level:1})).toBeVisible();
  await page.getByRole('link',{name:'Menu',exact:true}).first().click();
  await expect(page.getByRole('heading',{name:'Our menu'})).toBeVisible();
  await expect(page.getByRole('button',{name:/add/i}).first()).toBeVisible();
});
test('staff portal requires login',async({page})=>{
  await page.goto('/staff/orders');await expect(page).toHaveURL(/\/staff\/login/);
  await expect(page.getByRole('heading',{name:'Staff sign in'})).toBeVisible();
});
