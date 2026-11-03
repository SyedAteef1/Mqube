import { test, expect, type Page } from "@playwright/test";

const PASSWORD = process.env.MQUBE_ADMIN_PASSWORD || "";
const SKU = "KJ-GVT-6060-BEIGE";
const BATCH = "SH-01";
const SHOT = (name: string) => `e2e/shots/golive-${name}.png`;

async function api(page: Page, path: string, init: { method?: string; body?: unknown } = {}) {
  return page.evaluate(async ({ path, init }) => {
    const res = await fetch(`/api/v1${path}`, {
      method: init.method || "GET",
      headers: {
        "content-type": "application/json",
        "x-company-id": localStorage.getItem("tileflow_company_id") || "",
        "x-branch-id": localStorage.getItem("tileflow_branch_id") || "",
      },
      body: init.body ? JSON.stringify(init.body) : undefined,
    });
    return { status: res.status, data: await res.json().catch(() => null) };
  }, { path, init });
}

const field = (page: Page, label: string) =>
  page.locator(`label:text-is("${label}")`).locator("xpath=following-sibling::*[1]");
const open = async (page: Page, tab: string) => {
  await page.goto(`/?standalone_tab=${tab}`);
  await page.waitForLoadState("networkidle").catch(() => {});
};
async function onHand(page: Page, warehouseId: string) {
  const { data } = await api(page, "/wms/batch-stocks");
  const row = (data as any[]).find((r) => r.warehouse_id === warehouseId && r.product_id === SKU && r.batch_no === BATCH);
  return row ? Number(row.quantity) : 0;
}

test("first day on a fresh MQube install", async ({ page }) => {
  expect(PASSWORD.length, "MQUBE_ADMIN_PASSWORD must be set").toBeGreaterThan(11);

  // 1. Sign-in: no demo shortcuts, demo passwords refused
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Admin", exact: true })).toHaveCount(0);
  await expect(page.getByText(/Demo Persona/i)).toHaveCount(0);
  await page.getByPlaceholder("e.g. manager").fill("admin");
  await page.locator('input[type="password"]').fill("Admin@123");
  await page.getByRole("button", { name: /Authorize/ }).click();
  await page.waitForTimeout(1200);
  await expect(page.getByRole("button", { name: /Enter Workspace/ })).toHaveCount(0);
  for (const [user, pwd] of [["manager", "Manager@123"], ["cashier", "Cashier@123"]]) {
    const r = await page.request.post("/api/v1/auth/login", { data: { username: user, password: pwd } });
    expect(r.status(), `${user} demo account must not exist`).toBeGreaterThanOrEqual(400);
  }
  await page.screenshot({ path: SHOT("1-login-refused") });

  await page.locator('input[type="password"]').fill(PASSWORD);
  await page.getByRole("button", { name: /Authorize/ }).click();
  await page.screenshot({ path: SHOT("2-workspace") });
  await expect(page.getByText(/Fashion|Electronics/)).toHaveCount(0);
  // With a single company the picker is skipped and the owner goes straight in.
  const enter = page.getByRole("button", { name: /Enter Workspace/ }).first();
  await enter.waitFor({ timeout: 4000 }).then(() => enter.click()).catch(() => {});
  await expect(page.getByText("MQube Tiles & Sanitaryware").first()).toBeVisible();

  // 2. Owner fills in the Business Profile (GSTIN state = Maharashtra)
  await open(page, "business-profile");
  await page.getByLabel("Your GSTIN").fill("27AAXFT2508H1ZR");
  await page.getByLabel("Business Address").fill("Shop 4, Rehearsal Road, Pune 411001");
  await page.getByLabel("Phone").fill("9820012345");
  await page.getByLabel("Bank Name").fill("Rehearsal Bank");
  await page.getByLabel("Account Number").fill("001122334455");
  await page.getByRole("button", { name: "Save Business Profile" }).click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: SHOT("3-business-profile") });
  expect((await api(page, "/company/profile")).data.gst_number).toBe("27AAXFT2508H1ZR");

  // 3. Supplier and the first tile product
  const sup = await api(page, "/suppliers/", { method: "POST", body: { id: "SUP-KAJ", code: "SUP-KAJ", name: "Kajaria Distributor", gst_number: "27AABCK1234F1Z5" } });
  expect(sup.status, JSON.stringify(sup.data)).toBeLessThan(300);
  const prod = await api(page, "/products/", {
    method: "POST",
    body: {
      id: SKU, code: SKU, sku: SKU, barcode: SKU, name: "Beige GVT 600x600", category: "Floor Tiles",
      price: 1100, mrp: 1100, gst_percentage: 18, hsn_code: "6907", stock: 0,
      sqft_per_box: 15.5, pieces_per_box: 4, batch_shade_no: BATCH, caliber_code: "C1",
    },
  });
  expect(prod.status, JSON.stringify(prod.data)).toBe(201);

  // 4. Goods come into the godown (GRN)
  await open(page, "stock-transfers");
  await page.getByRole("button", { name: /Inward GRN/ }).click();
  await field(page, "Target Receiving Godown").selectOption("WH-GODOWN");
  await field(page, "Vendor").selectOption("SUP-KAJ");
  await field(page, "Product ID / Code").fill(SKU);
  await field(page, "Lot / Batch Number").fill(BATCH);
  await field(page, "Received Qty").fill("100");
  await field(page, "Cost Price (₹)").fill("780");
  const grn = page.waitForResponse((r) => r.url().includes("/purchase/receipts") && r.request().method() === "POST");
  await page.locator('form button[type="submit"]').first().click();
  expect((await grn).status()).toBe(201);
  await page.waitForTimeout(600);
  await page.screenshot({ path: SHOT("4-grn") });
  expect(await onHand(page, "WH-GODOWN")).toBe(100);

  // 5. Godown to showroom transfer
  await open(page, "stock-transfers");
  await page.getByRole("button", { name: /Stock Transfers \(STO\)/ }).click();
  await field(page, "Source Godown").selectOption("WH-GODOWN");
  await field(page, "Destination Godown").selectOption("WH-SHOWROOM");
  await field(page, "Product ID / Code").fill(SKU);
  await field(page, "Source Batch Number").fill(BATCH);
  await field(page, "Transfer Qty").fill("20");
  await page.locator('form button[type="submit"]').first().click();
  await page.getByRole("button", { name: /Dispatch Order/ }).first().click();
  await page.waitForTimeout(800);
  await page.getByRole("button", { name: /Receive/ }).first().click();
  await page.waitForTimeout(1200);
  await page.screenshot({ path: SHOT("5-transfer") });
  expect(await onHand(page, "WH-GODOWN")).toBe(80);
  expect(await onHand(page, "WH-SHOWROOM")).toBe(20);

  // 6. A GST customer buys 50 Sq.Ft. (= 4 boxes) at the showroom
  await open(page, "pos");
  await page.getByRole("button", { name: "Add", exact: true }).first().click();
  await page.getByPlaceholder("e.g. Modern Enterprises Pvt Ltd").fill("Shree Builders");
  await page.getByPlaceholder("e.g. 9876543210").fill("9820000001");
  await page.getByPlaceholder("e.g. 27AAAAA0000A1Z5").fill("27AABCS1234F1Z5");
  await page.getByRole("button", { name: /Save & Select/ }).click();
  await page.waitForTimeout(1000);
  await page.getByPlaceholder("Stock No").fill(SKU);
  await page.waitForTimeout(900);
  await page.getByPlaceholder("Qty", { exact: true }).fill("4");
  await page.getByPlaceholder("Qty", { exact: true }).press("Enter");
  await page.waitForTimeout(400);
  await page.getByRole("button", { name: /Settlement \(F8\)/ }).click();
  const saved = page.waitForResponse((r) => r.url().endsWith("/sales/invoices") && r.request().method() === "POST");
  await page.getByRole("button", { name: /Complete Settlement/ }).click();
  const res = await saved;
  expect(res.status(), await res.text()).toBe(201);
  const bill = await res.json();
  expect(Number(bill.items[0].cgst_amount), "Same-state sale must be CGST+SGST").toBeGreaterThan(0);
  expect(Number(bill.grand_total)).toBeGreaterThan(0);
  await page.waitForTimeout(1500);

  // 7. The printed bill carries the owner's details, not sample data
  const printed = page.locator(".invoice-print-container");
  await expect(printed).toContainText("27AAXFT2508H1ZR");
  await expect(printed).toContainText("Shop 4, Rehearsal Road, Pune 411001");
  await expect(printed).toContainText("Shree Builders");
  await expect(printed).not.toContainText(/Sample Address|Reliance|Tattly/);
  await page.screenshot({ path: SHOT("6-bill"), fullPage: true });
  expect((await onHand(page, "WH-SHOWROOM")) + (await onHand(page, "WH-GODOWN"))).toBe(96);

  // 8. Owner adds a cashier the way the Staff Master form does (no branch ID, no email); the cashier can sign in and bill
  const staffPassword = `Counter-${Date.now()}`;
  const staff = await api(page, "/users/", { method: "POST", body: { username: "counter1", fullName: "Counter One", role: "CASHIER", passwordHash: staffPassword } });
  expect(staff.status, JSON.stringify(staff.data)).toBe(201);
  await page.evaluate(() => localStorage.clear());
  await page.goto("/");
  await page.getByPlaceholder("e.g. manager").fill("counter1");
  await page.locator('input[type="password"]').fill(staffPassword);
  await page.getByRole("button", { name: /Authorize/ }).click();
  const enter2 = page.getByRole("button", { name: /Enter Workspace/ }).first();
  await enter2.waitFor({ timeout: 4000 }).then(() => enter2.click()).catch(() => {});
  await expect(page.getByText("MQube Tiles & Sanitaryware").first()).toBeVisible();
  await expect(page.getByText("Unable to switch company workspace")).toHaveCount(0);
  await open(page, "pos");
  await expect(page.getByPlaceholder("Stock No").first()).toBeVisible();
  await page.screenshot({ path: SHOT("7-cashier-billing") });
});
