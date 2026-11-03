// Watchable tour of the whole tile workflow: node e2e/demo_tour.mjs
import { chromium } from "@playwright/test";
import { homedir } from "node:os";

const stamp = Date.now().toString().slice(-6);
const SKU = "TL-GVT-6060-CRM";
const SHADE = "SH-A12";
const out = `${homedir()}/tileflow-data/demo`;
const base = "http://localhost:3000";
const browser = await chromium.launch({ headless: false, slowMo: 200, args: ["--window-size=1500,980"] });
const context = await browser.newContext({ viewport: { width: 1480, height: 860 }, recordVideo: { dir: out, size: { width: 1480, height: 860 } } });
const page = await context.newPage();

let n = 0;
async function say(text, ms = 3200) {
  n += 1;
  console.log(`${n}. ${text}`);
  await page.evaluate((t) => {
    let el = document.getElementById("demo-caption");
    if (!el) {
      el = document.createElement("div");
      el.id = "demo-caption";
      el.style.cssText = "position:fixed;top:0;left:0;right:0;z-index:2147483647;padding:12px 20px;background:#111827;color:#fff;font:600 19px system-ui;text-align:center;pointer-events:none";
      document.body.appendChild(el);
    }
    el.textContent = t;
  }, `${n}. ${text}`);
  await page.waitForTimeout(ms);
}
const open = async (tab) => { await page.goto(`${base}/?standalone_tab=${tab}`); await page.waitForLoadState("networkidle").catch(() => {}); await page.waitForTimeout(600); };
const field = (label) => page.locator(`label:text-is("${label}")`).locator("xpath=following-sibling::*[1]");
async function api(path, init = {}) {
  return page.evaluate(async ({ path, init }) => {
    const res = await fetch(`/api/v1${path}`, { method: init.method || "GET", headers: { "content-type": "application/json", "x-company-id": localStorage.getItem("tileflow_company_id") || "", "x-branch-id": localStorage.getItem("tileflow_branch_id") || "" }, body: init.body ? JSON.stringify(init.body) : undefined });
    return { status: res.status, data: await res.json().catch(() => null) };
  }, { path, init });
}
const stock = async (w) => { const { data } = await api("/wms/batch-stocks"); const r = data.find((x) => x.warehouse_id === w && x.product_id === SKU && x.batch_no === SHADE); return r ? Number(r.quantity) : 0; };
const levels = async () => `Central Godown ${await stock("WH-GODOWN")} | East Godown ${await stock("WH-GODOWN-2")} | Showroom ${await stock("WH-SHOWROOM")} boxes`;

await page.goto(base);
await say("LOGIN. Pick a user and click Authorize Operator");
await page.getByRole("button", { name: "Admin", exact: true }).click();
await page.waitForTimeout(500);
await page.getByRole("button", { name: /Authorize/ }).click();
await page.getByRole("button", { name: /Enter Workspace/ }).first().click();
await page.getByText("MQube Tiles & Sanitaryware").first().waitFor();
await say("HOME. Everything starts from the MQube Launchpad");

await open("item-master");
await say("ITEM MASTER. Every tile has box size, pieces per box, shade, caliber and HSN", 5000);

await open("stock-transfers");
await page.getByRole("button", { name: "Tile Groups" }).click();
await say("TILE GROUPS. Floor, Wall, Parking, Sanitaryware with products and boxes held in each", 5000);

const supplierId = `SUP-${stamp}`;
await api("/suppliers/", { method: "POST", body: { id: supplierId, name: `Kajaria Vendor ${stamp}`, code: supplierId, gst_number: "27AABCK1234F1Z5" } });
await page.reload();
await page.getByRole("button", { name: /Inward GRN/ }).click();
await say(`GOODS COMING IN. Open Inward GRN. Stock now: ${await levels()}`, 5000);
await field("Target Receiving Godown").selectOption("WH-GODOWN");
await say("Choose which godown is receiving the goods: Central Godown");
await field("Vendor").selectOption(supplierId);
await say("Choose which vendor sent them");
await field("Product ID / Code").fill(SKU);
await field("Lot / Batch Number").fill(SHADE);
await say("Enter the tile code and its shade/batch. Shades are kept separate");
await field("Received Qty").fill("40");
await field("Cost Price (₹)").fill("800");
await say("Enter the boxes received: 40, and the cost per box: Rs 800");
const grn = page.waitForResponse((r) => r.url().includes("/purchase/receipts") && r.request().method() === "POST");
await page.locator('form button[type="submit"]').first().click();
console.log("GRN", (await grn).status());
await page.waitForTimeout(800);
await say(`SAVED. 40 boxes stored in Central Godown. Stock now: ${await levels()}`, 5000);

async function transfer(from, to, qty, label) {
  await open("stock-transfers");
  await page.getByRole("button", { name: /Stock Transfers \(STO\)/ }).click();
  await say(`${label}. Stock Transfers needs no vendor, only From and To`);
  await field("Source Godown").selectOption(from);
  await field("Destination Godown").selectOption(to);
  await field("Product ID / Code").fill(SKU);
  await field("Source Batch Number").fill(SHADE);
  await field("Transfer Qty").fill(String(qty));
  await say(`Moving ${qty} boxes. Fill From, To, tile, shade and quantity`);
  await page.locator('form button[type="submit"]').first().click();
  await page.waitForTimeout(800);
  await say("Transfer created. Next: Dispatch when the truck leaves");
  await page.getByRole("button", { name: /Dispatch Order/ }).first().click();
  await page.waitForTimeout(1000);
  await say("Dispatched. Boxes are on the road. Next: Receive when they arrive");
  await page.getByRole("button", { name: /Receive/ }).first().click();
  await page.waitForTimeout(1300);
  await say(`Received. Stock now: ${await levels()}`, 4500);
}
await transfer("WH-GODOWN", "WH-GODOWN-2", 10, "GODOWN TO GODOWN");
await transfer("WH-GODOWN", "WH-SHOWROOM", 5, "GODOWN TO SHOWROOM");

await page.getByRole("button", { name: /Batch/ }).first().click().catch(() => {});
await page.waitForTimeout(800);
await say("STOCK LIST. Every tile, shade and location with its box count", 5000);

await open("pos");
await say("BILLING. Distributor Invoicing, for customers with GST");
await page.getByRole("button", { name: "Add", exact: true }).first().click();
await page.getByPlaceholder("e.g. Modern Enterprises Pvt Ltd").fill(`Sai Constructions ${stamp}`);
await page.getByPlaceholder("e.g. 9876543210").fill(`9${String(Date.now()).slice(-9)}`);
await page.getByPlaceholder("e.g. 27AAAAA0000A1Z5").fill("29AABCS5678G1Z2");
await say("New customer with company name and GSTIN. 29 is Karnataka, so this bill uses IGST");
await page.getByRole("button", { name: /Save & Select/ }).click();
await page.waitForTimeout(1000);
await page.getByLabel("Dispatch From").selectOption("WH-GODOWN");
await page.locator("select").filter({ hasText: "Ravi Kumar" }).first().selectOption("Ravi Kumar");
await say("Choose Dispatch From (which godown) and the Sales Staff");
await page.getByPlaceholder("Stock No").fill(SKU);
await page.waitForTimeout(1000);
await page.getByPlaceholder("Sq.Ft").fill("100");
await say("Tile code, then customer's 100 Sq.Ft. Qty becomes 7 whole boxes by itself", 4500);
await page.getByPlaceholder("Sq.Ft").press("Enter");
await page.waitForTimeout(800);
await say("Press Enter. The item goes into the bill and totals fill in", 4500);
await page.getByRole("button", { name: /Settlement \(F8\)/ }).click();
await page.waitForTimeout(800);
const rows = page.locator("table tbody tr").filter({ has: page.locator('input[placeholder="e.g. TXN99824"]') });
const net = Number(await rows.first().locator('input[type="number"]').inputValue());
const half = Math.floor(net / 2);
await page.getByRole("button", { name: /Add Split/ }).click();
await say("PAYMENT. One bill can be split: part Cheque, part UPI. Also Cash, Card, Credit");
await rows.nth(0).locator("select").selectOption("Cheque");
await rows.nth(0).getByPlaceholder("e.g. TXN99824").fill(`CHQ${stamp}`);
await rows.nth(0).locator('input[type="number"]').fill(String(half));
await rows.nth(0).getByPlaceholder("e.g. HDFC POS 01").fill("HDFC Andheri");
await rows.nth(1).locator("select").selectOption("UPI");
await rows.nth(1).getByPlaceholder("e.g. TXN99824").fill(`UPI${stamp}`);
await rows.nth(1).locator('input[type="number"]').fill(String(net - half));
await rows.nth(1).getByPlaceholder("e.g. HDFC POS 01").fill("shop@okhdfcbank");
await say(`Cheque number and bank, plus UPI transaction ID. Total Rs ${net}`, 4500);
const saved = page.waitForResponse((r) => r.url().endsWith("/sales/invoices") && r.request().method() === "POST");
await page.getByRole("button", { name: /Complete Settlement/ }).click();
const res = await saved;
const bill = await res.json().catch(() => ({}));
console.log("BILL", res.status(), bill.invoice_no, bill.grand_total, bill.is_interstate);
await page.waitForTimeout(1500);
await page.screenshot({ path: `${out}/tour-invoice.png` });
await say(`TAX INVOICE ${bill.invoice_no}. Saved and ready. Click Dispatch/Print or Export PDF`, 7000);
console.log("STOCK", await levels());

await open("pos");
await page.getByRole("button", { name: /Speed POS Terminal/ }).click();
await say("SPEED POS. The quick counter bill for walk-in customers");
const sku = page.getByPlaceholder("Stock No / SKU...");
await sku.fill(SKU);
await page.waitForTimeout(1000);
await sku.press("Enter");
await page.waitForTimeout(500);
await page.getByRole("button", { name: /Accept/ }).click();
await page.waitForTimeout(500);
await say("Scan or type the tile, Accept, then take payment");
const pos = page.waitForResponse((r) => r.url().endsWith("/sales/invoices") && r.request().method() === "POST");
await page.getByRole("button", { name: /Exact Cash/ }).click();
console.log("POS", (await pos).status());
await page.waitForTimeout(1300);
await say("Paid in cash. Receipt ready to print");

await open("pos");
await page.getByRole("button", { name: /EOD Z-Report/ }).click().catch(() => {});
await page.waitForTimeout(1000);
await say("END OF DAY. Z-Report for the shift", 4000);
await page.getByRole("button", { name: /Commissions/ }).click().catch(() => {});
await page.waitForTimeout(1000);
await say("COMMISSIONS. Sales staff earnings. Tour finished. Closing in 20 seconds", 20000);
await context.close();
const video = await page.video().path();
console.log("VIDEO", video);
await browser.close();
