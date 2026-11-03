import { test, expect, type Page } from "@playwright/test";

const failures = (page: Page) => {
  const seen: string[] = [];
  page.on("response", (res) => {
    if (res.url().includes("/api/v1/") && res.status() >= 400) {
      seen.push(`${res.status()} ${res.request().method()} ${new URL(res.url()).pathname}`);
    }
  });
  return seen;
};

async function signIn(page: Page, username: string, password: string) {
  await page.goto("/");
  await page.getByRole("button", { name: "Admin", exact: true }).waitFor();
  await page.locator('input[type="text"], input:not([type])').first().fill(username);
  await page.locator('input[type="password"]').first().fill(password);
  await page.getByRole("button", { name: /Authorize/ }).click();
}

for (const [username, password] of [["cashier", "Cashier@123"], ["manager", "Manager@123"]]) {
  test(`${username} reaches the workspace and daily screens`, async ({ page }) => {
    const seen = failures(page);
    await signIn(page, username, password);
    const enter = page.getByRole("button", { name: /Enter Workspace/ }).first();
    await enter.click({ timeout: 5000 }).catch(() => {}); // a single company may auto-enter
    await expect(page.getByText("Unable to switch company workspace")).toHaveCount(0);
    await expect(page.getByText("MQube Tiles & Sanitaryware").first()).toBeVisible();
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.screenshot({ path: `e2e/results/role-${username}-home.png` });
    expect(await page.evaluate(() => localStorage.getItem("tileflow_company_id"))).toBeTruthy();
    for (const tab of ["pos", "billing", "wms"]) {
      await page.goto(`/?standalone_tab=${tab}`);
      await page.waitForLoadState("networkidle").catch(() => {});
      await expect(page.getByText("Unable to switch company workspace")).toHaveCount(0);
      await page.screenshot({ path: `e2e/results/role-${username}-${tab}.png` });
    }
    console.log(username, "API failures:", JSON.stringify([...new Set(seen)]));
    expect(seen.filter((line) => line.includes("/auth/switch-context"))).toEqual([]);
  });
}

test("cashier saves a Speed POS bill", async ({ page }) => {
  const seen = failures(page);
  await signIn(page, "cashier", "Cashier@123");
  await expect(page.getByText("MQube Tiles & Sanitaryware").first()).toBeVisible();
  await page.goto("/?standalone_tab=pos");
  await page.getByRole("button", { name: /Speed POS Terminal/ }).click();
  const sku = page.getByPlaceholder("Stock No / SKU...");
  await sku.fill("TL-GVT-6060-CRM");
  await page.waitForTimeout(1000);
  await sku.press("Enter");
  await page.waitForTimeout(500);
  await page.getByRole("button", { name: /Accept/ }).click();
  await page.waitForTimeout(500);
  const saved = page.waitForResponse((r) => r.url().endsWith("/sales/invoices") && r.request().method() === "POST");
  await page.getByRole("button", { name: /Exact Cash/ }).click();
  const response = await saved;
  expect(response.status(), await response.text()).toBe(201);
  const bill = await response.json();
  console.log("cashier bill", bill.invoice_number ?? bill.id, bill.grand_total, "API failures:", JSON.stringify([...new Set(seen)]));
  expect(Number(bill.grand_total)).toBeGreaterThan(0);
});
