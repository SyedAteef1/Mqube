// Watchable owner-to-customer demo: node e2e/demo_owner_flow.mjs
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


const fitInvoice = async () => { await page.getByTitle("Fit Document to Viewport Width").click().catch(() => {}); await page.waitForTimeout(900); };

await page.goto(base);
await page.getByRole("button", { name: "Admin", exact: true }).click();
await page.waitForTimeout(400);
await page.getByRole("button", { name: /Authorize/ }).click();
await page.getByRole("button", { name: /Enter Workspace/ }).first().click();
await page.getByText("MQube Tiles & Sanitaryware").first().waitFor();
await say("PART 1: OWNER. The owner signs in as Admin");

await open("business-profile");
await say("BUSINESS PROFILE. The OWNER's own GST and details. This is set once", 6000);
await page.getByLabel("Your GSTIN").fill("27AAXFT2508H1ZR");
await say("The owner's GSTIN. It prints on every bill and decides CGST+SGST or IGST", 6000);
await page.getByLabel("Business Address").fill("Sample Address, Replace In Business Profile, Mumbai 400001");
await page.getByLabel("Phone").fill("9800000000");
await page.getByLabel("Email").fill("billing@example.com");
await say("Then the owner's address, phone and email");
await page.getByLabel("Bank Name").fill("Sample Bank");
await page.getByLabel("Account Name").fill("MQube Tiles & Sanitaryware");
await page.getByLabel("Account Number").fill("000000000000");
await page.getByLabel("IFSC Code").fill("SAMP0000001");
await page.getByLabel("Branch").fill("Mumbai");
await say("And the bank details customers pay into");
await page.getByRole("button", { name: "Save Business Profile" }).click();
await page.waitForTimeout(1000);
await say("Saved. Every new bill now uses these owner details", 4500);

const supplierId = `SUP-${stamp}`;
await api("/suppliers/", { method: "POST", body: { id: supplierId, name: `Kajaria Vendor ${stamp}`, code: supplierId, gst_number: "27AABCK1234F1Z5" } });
await open("stock-transfers");
await page.getByRole("button", { name: /Inward GRN/ }).click();
await field("Target Receiving Godown").selectOption("WH-GODOWN");
await say(`PART 2: ADDING STOCK. Inward GRN. Boxes now: ${await levels()}`, 6000);
await field("Vendor").selectOption(supplierId);
await field("Product ID / Code").fill(SKU);
await field("Lot / Batch Number").fill(SHADE);
await field("Received Qty").fill("100");
await field("Cost Price (₹)").fill("800");
await say("100 boxes arrive from the vendor into Central Godown, shade SH-A12", 5000);
const grn = page.waitForResponse((r) => r.url().includes("/purchase/receipts") && r.request().method() === "POST");
await page.locator('form button[type="submit"]').first().click();
console.log("GRN", (await grn).status());
await page.waitForTimeout(900);
await say(`STOCK ADDED. Boxes now: ${await levels()}`, 6000);

await open("stock-transfers");
await page.getByRole("button", { name: /Stock Transfers \(STO\)/ }).click();
await say("PART 3: GODOWN TRANSFER. No vendor needed, only From and To");
await field("Source Godown").selectOption("WH-GODOWN");
await field("Destination Godown").selectOption("WH-GODOWN-2");
await field("Product ID / Code").fill(SKU);
await field("Source Batch Number").fill(SHADE);
await field("Transfer Qty").fill("20");
await say("Move 20 boxes from Central Godown to East Godown", 5000);
await page.locator('form button[type="submit"]').first().click();
await page.waitForTimeout(900);
await page.getByRole("button", { name: /Dispatch Order/ }).first().click();
await page.waitForTimeout(1000);
await say("DISPATCHED. The truck has left Central Godown");
await page.getByRole("button", { name: /Receive/ }).first().click();
await page.waitForTimeout(1300);
await say(`RECEIVED at East Godown. Boxes now: ${await levels()}`, 6000);

await open("pos");
await say("PART 4: BUSINESS CUSTOMER BUYS. They give their GSTIN, so they can claim tax", 5000);
await page.getByRole("button", { name: "Add", exact: true }).first().click();
await page.getByPlaceholder("e.g. Modern Enterprises Pvt Ltd").fill(`Sai Constructions ${stamp}`);
await page.getByPlaceholder("e.g. 9876543210").fill(`9${String(Date.now()).slice(-9)}`);
await page.getByPlaceholder("e.g. 27AAAAA0000A1Z5").fill("29AABCS5678G1Z2");
await say("This GSTIN is the BUYER's, not the owner's. Only needed for business customers", 6000);
await page.getByRole("button", { name: /Save & Select/ }).click();
await page.waitForTimeout(1000);
await page.getByLabel("Dispatch From").selectOption("WH-GODOWN-2");
await page.locator("select").filter({ hasText: "Ravi Kumar" }).first().selectOption("Ravi Kumar");
await say("Dispatch straight from East Godown. Choose the salesperson");
await page.getByPlaceholder("Stock No").fill(SKU);
await page.waitForTimeout(1000);
await page.getByPlaceholder("Sq.Ft").fill("100");
await say("100 Sq.Ft becomes 7 whole boxes");
await page.getByPlaceholder("Sq.Ft").press("Enter");
await page.waitForTimeout(800);
await page.getByRole("button", { name: /Settlement \(F8\)/ }).click();
await page.waitForTimeout(800);
const row = page.locator("table tbody tr").filter({ has: page.locator('input[placeholder="e.g. TXN99824"]') }).first();
await row.locator("select").selectOption("Cheque");
await row.getByPlaceholder("e.g. TXN99824").fill(`CHQ${stamp}`);
await row.getByPlaceholder("e.g. HDFC POS 01").fill("HDFC Andheri");
await say("Payment by cheque, with cheque number and bank");
const saved = page.waitForResponse((r) => r.url().endsWith("/sales/invoices") && r.request().method() === "POST");
await page.getByRole("button", { name: /Complete Settlement/ }).click();
const res = await saved;
const bill = await res.json().catch(() => ({}));
console.log("B2B", res.status(), bill.invoice_no, bill.grand_total, "igst", bill.items?.[0]?.igst_amount, "cgst", bill.items?.[0]?.cgst_amount);
await page.waitForTimeout(1500);
await fitInvoice();
await page.screenshot({ path: `${out}/owner-invoice.png` });
await say("THE BILL. Top: OWNER's GST and address. Billed To: the customer's GST", 9000);
await page.locator(".invoice-print-container").evaluate((el) => el.scrollIntoView({ block: "end" })).catch(() => {});
await page.waitForTimeout(700);
await page.screenshot({ path: `${out}/owner-invoice-bottom.png` });
await say("Karnataka customer, Maharashtra owner, so IGST 18%. Owner's bank details below", 7000);
console.log("STOCK", await levels());

await open("pos");
await page.getByRole("button", { name: /Speed POS Terminal/ }).click();
await say("PART 5: WALK-IN CUSTOMER BUYS. No GST needed at all", 5000);
const sku = page.getByPlaceholder("Stock No / SKU...");
await sku.fill(SKU);
await page.waitForTimeout(1000);
await sku.press("Enter");
await page.waitForTimeout(500);
await page.getByRole("button", { name: /Accept/ }).click();
await page.waitForTimeout(500);
await say("Add the item. No customer GST is asked for");
const pos = page.waitForResponse((r) => r.url().endsWith("/sales/invoices") && r.request().method() === "POST");
await page.getByRole("button", { name: /Exact Cash/ }).click();
console.log("WALKIN", (await pos).status());
await page.waitForTimeout(1500);
await page.screenshot({ path: `${out}/owner-receipt.png` });
await say("Receipt done. It still shows the OWNER's name, address and GST. Closing in 20 seconds", 20000);
await context.close();
console.log("VIDEO", await page.video().path());
await browser.close();
