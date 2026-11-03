import { test, expect, type Page } from "@playwright/test";

const stamp = Date.now().toString().slice(-7);
const SKU = "TL-GVT-6060-CRM";
const SHADE = "SH-A12";

async function login(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Admin", exact: true }).click();
  await page.waitForTimeout(400);
  await page.getByRole("button", { name: /Authorize/ }).click();
  await page.getByRole("button", { name: /Enter Workspace/ }).first().click();
  await expect(page.getByText("MQube Tiles & Sanitaryware").first()).toBeVisible();
}

const open = async (page: Page, tab: string) => {
  await page.goto(`/?standalone_tab=${tab}`);
  await page.waitForLoadState("networkidle").catch(() => {});
};

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

async function onHand(page: Page, warehouseId: string, productId = SKU, batch = SHADE) {
  const { data } = await api(page, "/wms/batch-stocks");
  const row = (data as any[]).find(
    (r) => r.warehouse_id === warehouseId && r.product_id === productId && r.batch_no === batch,
  );
  return row ? Number(row.quantity) : 0;
}

const field = (page: Page, label: string) =>
  page.locator(`label:text-is("${label}")`).locator("xpath=following-sibling::*[1]");

async function transfer(page: Page, from: string, to: string, qty: number) {
  await open(page, "stock-transfers");
  await page.getByRole("button", { name: /Stock Transfers \(STO\)/ }).click();
  await field(page, "Source Godown").selectOption(from);
  await field(page, "Destination Godown").selectOption(to);
  await field(page, "Product ID / Code").fill(SKU);
  await field(page, "Source Batch Number").fill(SHADE);
  await field(page, "Transfer Qty").fill(String(qty));
  await page.locator('form button[type="submit"]').first().click();
  await page.getByRole("button", { name: /Dispatch Order/ }).first().click();
  await page.waitForTimeout(800);
  await page.getByRole("button", { name: /Receive/ }).first().click();
  await page.waitForTimeout(1200);
}

test.beforeEach(async ({ page }) => {
  await login(page);
});

test("00 session survives a page reload", async ({ page }) => {
  await page.reload();
  await page.waitForTimeout(2500);
  await expect(page.getByText("Authorize Operator")).toHaveCount(0);
});

test("01 tile groups: add a group and see boxes held per group", async ({ page }) => {
  await open(page, "stock-transfers");
  await page.getByRole("button", { name: "Tile Groups" }).click();
  const group = `Vitrified ${stamp}`;
  await page.getByPlaceholder(/New group/).fill(group);
  await page.getByRole("button", { name: "Add Group" }).click();
  await expect(page.getByRole("cell", { name: group, exact: true })).toBeVisible();

  const newItem = await api(page, "/products/", {
    method: "POST",
    body: { code: `TL-GRP-${stamp}`, name: "Group Test Tile", price: 100, category: group, barcode: `GRP${stamp}`, mrp: 100, gst_percentage: 18 },
  });
  expect(newItem.status, JSON.stringify(newItem.data)).toBeLessThan(300);
  expect(newItem.data.hsn_code).toBe("6907");

  const { data } = await api(page, "/wms/groups");
  const floor = (data as any[]).find((g) => g.name === "Floor Tiles");
  const row = page.getByRole("row").filter({ hasText: "Floor Tiles" });
  await expect(row).toContainText(Number(floor.boxes).toFixed(0));
  expect(floor.products).toBe(2);
  expect(Number(floor.boxes)).toBeGreaterThan(0);
});

test("02 vendor to godown: GRN records which vendor supplied which godown", async ({ page }) => {
  const supplierId = `SUP-${stamp}`;
  const created = await api(page, "/suppliers/", {
    method: "POST",
    body: { id: supplierId, name: `Kajaria Vendor ${stamp}`, code: supplierId, gst_number: "27AABCK1234F1Z5" },
  });
  expect(created.status, JSON.stringify(created.data)).toBeLessThan(300);

  const before = await onHand(page, "WH-GODOWN");
  await open(page, "stock-transfers");
  await page.getByRole("button", { name: /Inward GRN/ }).click();
  await field(page, "Target Receiving Godown").selectOption("WH-GODOWN");
  await page.reload();
  await page.getByRole("button", { name: /Inward GRN/ }).click();
  await field(page, "Target Receiving Godown").selectOption("WH-GODOWN");
  await expect(field(page, "Vendor").locator(`option[value="${supplierId}"]`)).toHaveCount(1);
  await field(page, "Vendor").selectOption(supplierId);
  await field(page, "Product ID / Code").fill(SKU);
  await field(page, "Lot / Batch Number").fill(SHADE);
  await field(page, "Received Qty").fill("40");
  await field(page, "Cost Price (₹)").fill("800");
  const grn = page.waitForResponse((r) => r.url().includes("/purchase/receipts") && r.request().method() === "POST");
  await page.locator('form button[type="submit"]').first().click();
  const grnResponse = await grn;
  expect(grnResponse.status(), await grnResponse.text()).toBe(201);
  await page.waitForTimeout(500);

  expect(await onHand(page, "WH-GODOWN")).toBe(before + 40);
  const receipts = await api(page, "/purchase/receipts/");
  expect(JSON.stringify(receipts.data)).toContain(supplierId);
});

test("02b GRN lets staff pick the vendor from a list", async ({ page }) => {
  await open(page, "stock-transfers");
  await page.getByRole("button", { name: /Inward GRN/ }).click();
  const tag = await field(page, "Vendor").evaluate((e) => e.tagName);
  expect(tag, "Vendor must be chosen from a list, not typed as a raw ID").toBe("SELECT");
});

test("03 godown to godown: moves stock and asks for no vendor", async ({ page }) => {
  const a = await onHand(page, "WH-GODOWN");
  const b = await onHand(page, "WH-GODOWN-2");
  await open(page, "stock-transfers");
  await page.getByRole("button", { name: /Stock Transfers \(STO\)/ }).click();
  await expect(page.getByText(/Supplier|Vendor/i)).toHaveCount(0);
  await transfer(page, "WH-GODOWN", "WH-GODOWN-2", 10);
  expect(await onHand(page, "WH-GODOWN")).toBe(a - 10);
  expect(await onHand(page, "WH-GODOWN-2")).toBe(b + 10);
});

test("04 godown to showroom: moves stock with a delivery challan", async ({ page }) => {
  const a = await onHand(page, "WH-GODOWN");
  const s = await onHand(page, "WH-SHOWROOM");
  await transfer(page, "WH-GODOWN", "WH-SHOWROOM", 5);
  expect(await onHand(page, "WH-GODOWN")).toBe(a - 5);
  expect(await onHand(page, "WH-SHOWROOM")).toBe(s + 5);
  const { data } = await api(page, "/wms/transfers");
  const challan = await api(page, `/wms/transfers/${(data as any[])[0].id}/delivery-challan`);
  expect(challan.status).toBe(200);
});

async function addItem(page: Page, qty = 2) {
  await page.getByPlaceholder("Stock No").fill(SKU);
  await page.waitForTimeout(900);
  await page.getByPlaceholder("Qty", { exact: true }).fill(String(qty));
  await page.getByPlaceholder("Qty", { exact: true }).press("Enter");
  await page.waitForTimeout(400);
}

async function newCustomer(page: Page, name: string, gstin: string) {
  await page.getByRole("button", { name: "Add", exact: true }).first().click();
  await page.getByPlaceholder("e.g. Modern Enterprises Pvt Ltd").fill(name);
  await page.getByPlaceholder("e.g. 9876543210").fill(`9${String(Date.now()).slice(-9)}`);
  await page.getByPlaceholder("e.g. 27AAAAA0000A1Z5").fill(gstin);
  await page.getByRole("button", { name: /Save & Select/ }).click();
  await page.waitForTimeout(1000);
}

test("05 billing screen: GST customer, salesperson, split payment, printable bill", async ({ page }) => {
  const name = `Sai Constructions ${stamp}`;
  await open(page, "pos");
  await newCustomer(page, name, "29AABCS5678G1Z2");
  await expect(page.getByPlaceholder("Customer Name Display")).toHaveValue(name);
  await page.locator("select").filter({ hasText: "Ravi Kumar" }).first().selectOption("Ravi Kumar");
  await addItem(page);
  await expect(page.locator("text=TL-GVT-6060-CRM").first()).toBeVisible();

  await page.getByRole("button", { name: /Settlement \(F8\)/ }).click();
  const firstRow = page.locator("table tbody tr").filter({ has: page.locator('input[placeholder="e.g. TXN99824"]') }).first();
  const net = Number(await firstRow.locator('input[type="number"]').inputValue());
  expect(net).toBeGreaterThan(0);
  const share = Math.floor(net / 4);
  const splits: [string, string, string, number][] = [
    ["Cash", "", "", net - share * 3],
    ["Cheque", `CHQ${stamp}`, "HDFC Andheri", share],
    ["UPI", `UPI${stamp}`, "shop@okhdfcbank", share],
    ["Credit Card", `CARD${stamp}`, "ICICI POS 02", share],
  ];
  for (let i = 1; i < splits.length; i++) await page.getByRole("button", { name: /Add Split/ }).click();
  const rows = page.locator("table tbody tr").filter({ has: page.locator('input[placeholder="e.g. TXN99824"]') });
  for (let i = 0; i < splits.length; i++) {
    const [mode, ref, bank, amount] = splits[i];
    const row = rows.nth(i);
    await row.locator("select").selectOption(mode);
    await row.getByPlaceholder("e.g. TXN99824").fill(ref);
    await row.locator('input[type="number"]').fill(String(amount));
    await row.getByPlaceholder("e.g. HDFC POS 01").fill(bank);
  }
  const saved = page.waitForResponse((r) => r.url().endsWith("/sales/invoices") && r.request().method() === "POST");
  await page.getByRole("button", { name: /Complete Settlement/ }).click();
  const response = await saved;
  expect(response.status(), await response.text()).toBe(201);
  const invoice = await response.json();

  expect(invoice.customer_gstin).toBe("29AABCS5678G1Z2");
  expect(invoice.is_interstate, "Karnataka buyer from Maharashtra must be IGST").toBe(true);
  expect(Number(invoice.items[0].igst_amount)).toBeGreaterThan(0);
  expect(invoice.salesperson_name).toBe("Ravi Kumar");

  await expect(page.getByText("Module Temporarily Unavailable")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Print/ }).first()).toBeVisible();
  await page.waitForTimeout(1200);
  await page.screenshot({ path: "e2e/shots/05-print-preview.png" });
  await expect(page.getByText("Module Temporarily Unavailable")).toHaveCount(0);
  const bill = page.locator("body");
  await expect(bill).toContainText("27AAXFT2508H1ZR");
  await expect(bill).toContainText("29AABCS5678G1Z2");
  await expect(bill).toContainText(invoice.invoice_no);
  await expect(bill).toContainText("Crema Marfil");
  await expect(bill).not.toContainText("NaN");
  await expect(bill).not.toContainText("29XXXXX");
  for (const wrong of ["TATTLY", "Reliance", "64041990", "5.00%"]) await expect(bill).not.toContainText(wrong);
  await expect(bill).toContainText("MQube Tiles & Sanitaryware");
  await expect(bill).toContainText("6907");
  await expect(bill).toContainText("18.00%");

  const payments = await api(page, `/payments/receipt/${invoice.id}`);
  expect(payments.status, "Split payments should be real payment records").toBe(200);
  const text = JSON.stringify(payments.data);
  expect(text).toContain(`CHQ${stamp}`);
  expect(text).toContain(`UPI${stamp}`);
});

test("05b settlement records a customer credit amount", async ({ page }) => {
  await open(page, "pos");
  await newCustomer(page, `Credit Buyer ${stamp}`, "27AABCB1234F1Z5");
  await addItem(page);
  await page.getByRole("button", { name: /Settlement \(F8\)/ }).click();
  const rows = page.locator("table tbody tr").filter({ has: page.locator('input[placeholder="e.g. TXN99824"]') });
  await expect(rows).toHaveCount(1);
  const net = Number(await rows.first().locator('input[type="number"]').inputValue());
  const cash = Math.floor(net / 2);
  await page.getByRole("button", { name: /Add Split/ }).click();
  await expect(rows).toHaveCount(2);
  await rows.nth(0).locator("select").selectOption("Cash");
  await rows.nth(0).locator('input[type="number"]').fill(String(cash));
  await rows.nth(1).locator("select").selectOption("Credit");
  await rows.nth(1).locator('input[type="number"]').fill(String(net - cash));

  const saved = page.waitForResponse((r) => r.url().endsWith("/sales/invoices") && r.request().method() === "POST");
  await page.getByRole("button", { name: /Complete Settlement/ }).click();
  const invoice = await (await saved).json();
  expect(Number(invoice.paid_amount)).toBe(cash);
  expect(Number(invoice.balance_amount)).toBeCloseTo(net - cash, 2);
});

async function settleCash(page: Page) {
  await page.getByRole("button", { name: /Settlement \(F8\)/ }).click();
  const saved = page.waitForResponse((r) => r.url().endsWith("/sales/invoices") && r.request().method() === "POST");
  await page.getByRole("button", { name: /Complete Settlement/ }).click();
  const response = await saved;
  expect(response.status(), await response.text()).toBe(201);
  return response.json();
}

test("06 delivery to customer: stock leaves the godown chosen on the bill", async ({ page }) => {
  await open(page, "pos");
  await newCustomer(page, `Direct Site ${stamp}`, "27AABCD1234F1Z5");
  await page.getByLabel("Dispatch From").selectOption("WH-GODOWN-2");
  const before = await onHand(page, "WH-GODOWN-2");
  const showroom = await onHand(page, "WH-SHOWROOM");
  await addItem(page, 3);
  const invoice = await settleCash(page);
  expect(invoice.warehouse_id).toBe("WH-GODOWN-2");
  expect(await onHand(page, "WH-GODOWN-2")).toBe(before - 3);
  expect(await onHand(page, "WH-SHOWROOM")).toBe(showroom);
});

test("07 billing screen accepts customer Sq.Ft. and converts to boxes", async ({ page }) => {
  await open(page, "pos");
  await page.getByLabel("Dispatch From").selectOption("WH-GODOWN");
  await page.getByPlaceholder("Stock No").fill(SKU);
  await page.waitForTimeout(900);
  await page.getByPlaceholder("Sq.Ft").fill("100");
  await expect(page.getByPlaceholder("Qty", { exact: true })).toHaveValue("7");
  await page.getByPlaceholder("Sq.Ft").press("Enter");
  await page.waitForTimeout(400);
  const invoice = await settleCash(page);
  expect(Number(invoice.items[0].quantity)).toBe(7);
  expect(Number(invoice.items[0].sqft_billed)).toBe(108.5);
});

test("08 Speed POS: a paid bill is saved, stock falls, receipt can be printed", async ({ page }) => {
  const list = () => api(page, "/sales/invoices?limit=5000");
  const before = ((await list()).data as any[]).length;
  await open(page, "pos");
  await page.getByRole("button", { name: /Speed POS Terminal/ }).click();
  await expect(page.getByText("regular straight Med Beige"), "Demo items must not appear").toHaveCount(0);
  await expect(page.locator("body")).not.toContainText("â‚¹");

  const sku = page.getByPlaceholder("Stock No / SKU...");
  await sku.fill(SKU);
  await page.waitForTimeout(1000);
  await sku.press("Enter");
  await page.waitForTimeout(500);
  await page.getByRole("button", { name: /Accept/ }).click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: "e2e/shots/08-speed-pos.png" });
  await expect(page.getByText(SKU).first()).toBeVisible();
  const before2 = await onHand(page, "WH-SHOWROOM") + await onHand(page, "WH-GODOWN") + await onHand(page, "WH-GODOWN-2");
  const shown = Number((await page.getByText("Net Amount", { exact: false }).last().locator("..").innerText()).replace(/[^0-9.]/g, ""));

  const saved = page.waitForResponse((r) => r.url().endsWith("/sales/invoices") && r.request().method() === "POST");
  await page.getByRole("button", { name: /Exact Cash/ }).click();
  const response = await saved;
  expect(response.status(), await response.text()).toBe(201);
  const bill = await response.json();
  expect(Number(bill.grand_total), "Saved total must equal the amount on screen").toBeCloseTo(shown, 2);
  await page.waitForTimeout(1200);
  await page.screenshot({ path: "e2e/shots/08-speed-pos-receipt.png" });
  const after = await onHand(page, "WH-SHOWROOM") + await onHand(page, "WH-GODOWN") + await onHand(page, "WH-GODOWN-2");
  expect(after).toBe(before2 - 1);

  await expect(page.getByText("Module Temporarily Unavailable")).toHaveCount(0);
  expect(((await list()).data as any[]).length).toBe(before + 1);
  const receipt = page.locator("body");
  await expect(receipt).toContainText("27AAXFT2508H1ZR");
  await expect(receipt).not.toContainText("27AABCU9603R1ZM");
  expect(Number(bill.items[0].disc_pct || 0), "No hidden default discount").toBe(0);
});

test("09 cannot sell more boxes than the location holds", async ({ page }) => {
  await open(page, "pos");
  await page.getByLabel("Dispatch From").selectOption("WH-GODOWN-2");
  const stock = await onHand(page, "WH-GODOWN-2");
  await addItem(page, stock + 100);
  await page.getByRole("button", { name: /Settlement \(F8\)/ }).click();
  const saved = page.waitForResponse((r) => r.url().endsWith("/sales/invoices") && r.request().method() === "POST");
  await page.getByRole("button", { name: /Complete Settlement/ }).click();
  expect((await saved).status()).toBe(400);
  expect(await onHand(page, "WH-GODOWN-2")).toBe(stock);
  const { data } = await api(page, "/wms/batch-stocks");
  expect((data as any[]).some((r) => r.warehouse_id === "WH-GODOWN-2" && r.batch_no === "BATCH-OPENING" && r.product_id === SKU)).toBe(false);
});

test("10 Item Master saves tile box, shade and caliber details", async ({ page }) => {
  const products = async () => {
    const { data } = await api(page, "/products?page_size=100");
    return (Array.isArray(data) ? data : data.items) as any[];
  };
  const before = await products();
  const caliber = `C${stamp.slice(-4)}`;
  await open(page, "item-master");
  await page.getByRole("button", { name: /Editing Item Master/ }).click();
  await page.getByRole("button", { name: /Load All Records/ }).click();
  await page.getByRole("button", { name: "Classic View" }).click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: "e2e/shots/10-item-classic.png" });
  await page.locator('[data-field-key="sqft_per_box"]').fill("12.5");
  await page.locator('[data-field-key="pieces_per_box"]').fill("6");
  await page.locator('[data-field-key="batch_shade_no"]').fill("SH-NEW");
  await page.locator('[data-field-key="caliber_code"]').fill(caliber);
  const put = page.waitForResponse((r) => /\/products\//.test(r.url()) && r.request().method() === "PUT");
  await page.getByRole("button", { name: /Ok \(Save to Database\)/ }).click();
  expect((await put).status()).toBe(200);
  await page.waitForTimeout(1500);

  const after = await products();
  const saved = after.find((p) => p.caliber_code === caliber);
  expect(saved, "Tile details were not saved").toBeTruthy();
  expect(Number(saved.sqft_per_box)).toBe(12.5);
  expect(saved.pieces_per_box).toBe(6);
  expect(saved.batch_shade_no).toBe("SH-NEW");

  const original = before.find((p) => p.id === saved.id);
  await api(page, `/products/${saved.id}`, {
    method: "PUT",
    body: {
      sqft_per_box: Number(original.sqft_per_box),
      pieces_per_box: original.pieces_per_box,
      batch_shade_no: original.batch_shade_no,
      caliber_code: original.caliber_code,
    },
  });

  for (const was of before) {
    const now = after.find((p) => p.id === was.id);
    expect(Number(now.stock), `${was.code} stock changed by saving`).toBe(Number(was.stock));
    if (was.id !== saved.id) expect(Number(now.sqft_per_box ?? 0)).toBe(Number(was.sqft_per_box ?? 0));
  }
});

async function speedPosItem(page: Page) {
  await page.getByPlaceholder("Stock No / SKU...").fill(SKU);
  await page.waitForTimeout(1000);
  await page.getByPlaceholder("Sq.Ft").fill("15");
  await page.getByPlaceholder("Sq.Ft").press("Enter");
  await page.waitForTimeout(500);
}

test("11 Speed POS: GST customer, Sq.Ft., godown, salesperson, cheque and credit", async ({ page }) => {
  await open(page, "pos");
  await page.getByRole("button", { name: /Speed POS Terminal/ }).click();
  await page.getByText("[F2] Browse").click();
  await page.getByPlaceholder(/Search by Customer Code/).fill("Namma");
  await page.getByText(/Namma Interiors/).first().click();
  await page.keyboard.press("Enter");
  await page.waitForTimeout(500);
  await expect(page.locator("body")).toContainText("IGST");

  await page.locator("select").filter({ hasText: "Ravi Kumar" }).first().selectOption("Ravi Kumar");
  await page.getByLabel("Dispatch From").selectOption("WH-GODOWN");
  const godown = await onHand(page, "WH-GODOWN");

  await page.getByPlaceholder("Stock No / SKU...").fill(SKU);
  await page.waitForTimeout(1000);
  await page.getByPlaceholder("Sq.Ft").fill("100");
  await page.getByPlaceholder("Sq.Ft").press("Enter");
  await page.waitForTimeout(500);
  await page.getByRole("button", { name: /Settlement/ }).last().click();

  const amount = page.getByPlaceholder("0.00").last();
  await expect(amount).toHaveValue(/^[1-9]/);
  const net = Number(await amount.inputValue());
  expect(net, "7 boxes at 1150 plus 18% GST").toBeCloseTo(9499, 2);
  const cheque = Math.floor(net / 2);
  await page.getByRole("button", { name: "Cheque", exact: true }).click();
  await amount.fill(String(cheque));
  await page.getByPlaceholder("Cheque Number").fill(`CHQ-S${stamp}`);
  await page.getByPlaceholder("Bank Name").fill("SBI Fort");
  await page.getByRole("button", { name: /Add Payment/ }).click();
  await page.getByRole("button", { name: "Credit", exact: true }).click();
  await expect(amount).toHaveValue(/^[1-9]/);
  await page.getByRole("button", { name: /Add Payment/ }).click();

  const saved = page.waitForResponse((r) => r.url().endsWith("/sales/invoices") && r.request().method() === "POST");
  await page.getByRole("button", { name: /Settle & Print/ }).click();
  const response = await saved;
  expect(response.status(), await response.text()).toBe(201);
  const invoice = await response.json();

  expect(invoice.customer_gstin).toBe("29AABCN5678G1Z2");
  expect(invoice.is_interstate).toBe(true);
  expect(Number(invoice.items[0].igst_amount)).toBeGreaterThan(0);
  expect(Number(invoice.items[0].quantity)).toBe(7);
  expect(Number(invoice.items[0].sqft_billed)).toBe(108.5);
  expect(invoice.salesperson_name).toBe("Ravi Kumar");
  expect(invoice.warehouse_id).toBe("WH-GODOWN");
  expect(Number(invoice.grand_total)).toBeCloseTo(net, 2);
  expect(Number(invoice.balance_amount)).toBeCloseTo(net - cheque, 2);
  expect(await onHand(page, "WH-GODOWN")).toBe(godown - 7);

  await page.waitForTimeout(800);
  await page.screenshot({ path: "e2e/shots/11-speed-pos-gst.png" });
  const payments = await api(page, `/payments/receipt/${invoice.id}`);
  expect(JSON.stringify(payments.data)).toContain(`CHQ-S${stamp}`);
});

test("11b Speed POS refuses credit for a walk-in customer", async ({ page }) => {
  await open(page, "pos");
  await page.getByRole("button", { name: /Speed POS Terminal/ }).click();
  await speedPosItem(page);
  await page.getByRole("button", { name: /Settlement/ }).last().click();
  await page.getByRole("button", { name: "Credit", exact: true }).click();
  await expect(page.getByPlaceholder("0.00").last()).toHaveValue(/^[1-9]/);
  await page.getByRole("button", { name: /Add Payment/ }).click();
  let posted = false;
  page.on("request", (r) => { if (r.url().endsWith("/sales/invoices") && r.method() === "POST") posted = true; });
  await page.getByRole("button", { name: /Settle & Print/ }).click();
  await page.waitForTimeout(1200);
  expect(posted, "Walk-in credit bill must not be saved").toBe(false);
});

test("11c Speed POS refuses an unknown item instead of inventing a price", async ({ page }) => {
  await open(page, "pos");
  await page.getByRole("button", { name: /Speed POS Terminal/ }).click();
  await page.getByPlaceholder("Stock No / SKU...").fill("NOT-A-REAL-CODE");
  await page.waitForTimeout(1000);
  await page.getByPlaceholder("Stock No / SKU...").press("Enter");
  await page.waitForTimeout(500);
  await expect(page.getByText("NOT-A-REAL-CODE", { exact: true })).toHaveCount(0);
});

test("12 owner's Business Profile prints on bills and sets the tax state", async ({ page }) => {
  const original = (await api(page, "/company/profile")).data as any;
  const put = (body: unknown) => api(page, "/company/profile", { method: "PUT", body });
  try {
    await open(page, "business-profile");
    await page.getByLabel("Business Address").fill(`Plot ${stamp}, Test Road, Mumbai`);
    await page.getByLabel("Phone").fill("9820011111");
    await page.getByLabel("Bank Name").fill("Test Bank");
    await page.getByLabel("Account Number").fill(`00${stamp}`);
    await page.getByRole("button", { name: "Save Business Profile" }).click();
    await page.waitForTimeout(800);

    await open(page, "pos");
    await newCustomer(page, `Profile Buyer ${stamp}`, "27AABCS1234F1Z5");
    await addItem(page, 1);
    const local = await settleCash(page);
    expect(Number(local.items[0].cgst_amount), "Same state as the owner uses CGST").toBeGreaterThan(0);
    await page.waitForTimeout(1200);
    const bill = page.locator(".invoice-print-container");
    await expect(bill).toContainText(`Plot ${stamp}, Test Road, Mumbai`);
    await expect(bill).toContainText("9820011111");
    await expect(bill).toContainText(`00${stamp}`);

    const now = (await api(page, "/company/profile")).data as any;
    expect((await put({ ...now, gst_number: "29AAXFT2508H1ZR" })).status).toBe(200);
    await open(page, "pos");
    await newCustomer(page, `Profile Buyer Two ${stamp}`, "27AABCS1234F1Z5");
    await addItem(page, 1);
    const other = await settleCash(page);
    expect(Number(other.items[0].igst_amount), "Owner moved to Karnataka, so a Maharashtra buyer is IGST").toBeGreaterThan(0);
  } finally {
    await put(original);
  }
});
