// Narrated demo of MQube use cases (new screens): node e2e/demo_usecases.mjs
import { chromium } from "@playwright/test";
import { homedir } from "node:os";
const stamp = Date.now().toString().slice(-6);
const SKU = "TL-GVT-6060-CRM";
const SHADE = "SH-A12";
const out = `${homedir()}/tileflow-data/demo/usecases`;
const base = "http://localhost:3000";
const browser = await chromium.launch({ channel: "chrome", headless: !!process.env.HEADLESS, slowMo: 150, args: ["--window-size=1400,900"] });
const context = await browser.newContext({ viewport: { width: 1366, height: 768 }, recordVideo: { dir: out, size: { width: 1366, height: 768 } } });
const page = await context.newPage();
const step = async (name, fn) => { try { await fn(); } catch (e) { console.log("STEP FAILED", name, String(e).split("\n")[0]); } };
let n = 0;
async function say(text, ms = 3200) {
  n += 1;
  console.log(text);
  await page.evaluate((t) => {
    let el = document.getElementById("demo-caption");
    if (!el) {
      el = document.createElement("div");
      el.id = "demo-caption";
      el.style.cssText = "position:fixed;left:50%;bottom:28px;transform:translateX(-50%);max-width:1100px;z-index:2147483647;padding:12px 22px;border-radius:14px;background:rgba(17,17,17,.92);color:#fff;font:500 20px/1.35 system-ui;text-align:center;pointer-events:none;box-shadow:0 8px 30px rgba(0,0,0,.25)";
      document.body.appendChild(el);
    }
    el.textContent = t;
  }, text);
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


async function title(big, small, ms = 3500) {
  await page.evaluate(([b, s]) => {
    let el = document.getElementById("demo-title");
    if (!el) { el = document.createElement("div"); el.id = "demo-title"; document.body.appendChild(el); }
    el.style.cssText = "position:fixed;inset:0;z-index:2147483647;background:#0a0a0a;color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:system-ui;text-align:center";
    el.innerHTML = `<div style="width:64px;height:64px;border-radius:50%;background:#fff;color:#0a0a0a;font:700 30px system-ui;display:flex;align-items:center;justify-content:center;margin-bottom:26px">M</div><div style="font:600 44px system-ui;letter-spacing:-.02em">${b}</div><div style="font:400 22px system-ui;color:#a3a3a3;margin-top:12px;max-width:900px">${s}</div>`;
  }, [big, small]);
  await page.waitForTimeout(ms);
  await page.evaluate(() => document.getElementById("demo-title")?.remove());
}
const hideCaption = () => page.evaluate(() => document.getElementById("demo-caption")?.remove());

await page.goto(base);
await title("MQube", "Stock, godowns, GST billing and accounts for a tiles and sanitaryware business", 5000);
await say("Each person signs in with their own username and password");
await page.fill("#login-username", "admin");
await page.fill("#login-password", "Admin@123");
await page.waitForTimeout(600);
await page.getByRole("button", { name: /Authorize/ }).click();
await page.waitForTimeout(2500);
const ew = page.getByRole("button", { name: /Enter Workspace/ }).first(); if (await ew.count()) await ew.click();
await page.waitForTimeout(2500);

await title("1 · The owner", "Set up once, then watch the business every day");
await say("Home shows sales, bills, stock value and low-stock items. All figures come from real bills", 5000);
await step("today", async () => { await page.getByRole("button", { name: "Today", exact: true }).click(); await say("Pick Today, 7 days, 30 days or your own dates", 3500); await page.getByRole("button", { name: "All", exact: true }).click(); });
await say("One click to the daily jobs: New bill, Counter bill, Receive stock, Stock transfer, Add item", 4500);
await open("business-profile");
await say("Business Profile: your name, GSTIN, address and bank details print on every bill", 5000);
await open("staff-management");
await say("Staff Management: each person gets their own login. A cashier only sees billing", 5000);
await open("item-master");
await say("Item Master: every tile stores Sq.Ft. per box, pieces per box, shade, HSN and GST rate", 5000);

await title("2 · Godown and stock", "Goods in from the vendor, moved between locations, tracked by shade");
await open("stock-transfers");
const supplierId = `SUP-${stamp}`;
await api("/suppliers/", { method: "POST", body: { id: supplierId, name: `Kajaria Vendor ${stamp}`, code: supplierId, gst_number: "27AABCK1234F1Z5" } });
await page.reload(); await page.waitForTimeout(1500);
await step("grn", async () => {
  await page.getByRole("button", { name: /Inward GRN/ }).click();
  await say(`A delivery arrives. Open Inward GRN. Stock now: ${await levels()}`, 4500);
  await field("Target Receiving Godown").selectOption("WH-GODOWN");
  await field("Vendor").selectOption(supplierId);
  await say("Choose the receiving godown and the vendor");
  await field("Product ID / Code").fill(SKU);
  await field("Lot / Batch Number").fill(SHADE);
  await field("Received Qty").fill("40");
  await field("Cost Price (₹)").fill("800");
  await say("Tile code, shade, 40 boxes at ₹800 a box. Each shade is kept separate", 4000);
  await page.locator('form button[type="submit"]').first().click();
  await page.waitForTimeout(1200);
  await say(`Saved. Stock now: ${await levels()}`, 4500);
});
await step("transfer", async () => {
  await open("stock-transfers");
  await page.getByRole("button", { name: /Stock Transfers \(STO\)/ }).click();
  await field("Source Godown").selectOption("WH-GODOWN");
  await field("Destination Godown").selectOption("WH-SHOWROOM");
  await field("Product ID / Code").fill(SKU);
  await field("Source Batch Number").fill(SHADE);
  await field("Transfer Qty").fill("10");
  await say("Showroom running low? Move 10 boxes from the godown to the showroom", 4000);
  await page.locator('form button[type="submit"]').first().click();
  await page.waitForTimeout(1000);
  await page.getByRole("button", { name: /Dispatch Order/ }).first().click();
  await page.waitForTimeout(1000);
  await say("Dispatch when the truck leaves...");
  await page.getByRole("button", { name: /Receive/ }).first().click();
  await page.waitForTimeout(1300);
  await say(`...Receive when it arrives. Stock now: ${await levels()}`, 5000);
});
await open("wms-dashboard");
await say("Batch Matrix: every tile, shade and location with boxes on hand and available", 5000);

await title("3 · Counter and sales", "Walk-in counter bills and full GST tax invoices");
await open("pos");
await step("speedpos", async () => {
  await page.getByRole("button", { name: /Speed POS Terminal/ }).click();
  await page.waitForTimeout(1200);
  await say("Counter bill for walk-in customers. Scan or type the tile code", 4000);
  await page.getByPlaceholder("Stock No / SKU...").fill(SKU);
  await page.waitForTimeout(1000);
  await page.getByPlaceholder("Sq.Ft").last().fill("100");
  await say("The customer needs 100 Sq.Ft. MQube rounds up to whole boxes", 4000);
  await page.getByPlaceholder("Sq.Ft").last().press("Enter");
  await page.waitForTimeout(1200);
  await say("100 Sq.Ft. became 7 boxes. GST and the net amount fill in, rounded to the rupee", 5000);
  await page.getByRole("button", { name: /Settlement/ }).last().click();
  await page.waitForTimeout(1000);
  await say("Take payment: Cash, Card, UPI, Cheque, Credit. One bill can mix several", 5000);
  await page.keyboard.press("Escape"); await page.waitForTimeout(700);
  const pos = page.waitForResponse((r) => r.url().endsWith("/sales/invoices") && r.request().method() === "POST", { timeout: 15000 });
  await page.getByRole("button", { name: /Exact Cash/ }).click();
  const r = await pos; const b = await r.json().catch(() => ({}));
  console.log("POS", r.status(), b.invoice_no, b.grand_total);
  await page.waitForTimeout(1500);
  await say(`Exact Cash (F7) saves the bill: ${b.invoice_no || "saved"}, ₹${b.grand_total ?? ""}. Receipt ready to print`, 5000);
});

await open("pos");
await step("taxinvoice", async () => {
  await say("Tax Invoice: for builders and contractors with a GSTIN", 3500);
  await page.getByRole("button", { name: "Add", exact: true }).first().click();
  await page.getByPlaceholder("e.g. Modern Enterprises Pvt Ltd").fill(`Sai Constructions ${stamp}`);
  await page.getByPlaceholder("e.g. 9876543210").fill(`9${String(Date.now()).slice(-9)}`);
  await page.getByPlaceholder("e.g. 27AAAAA0000A1Z5").fill("29AABCS5678G1Z2");
  await say("New customer with GSTIN. 29 is Karnataka, another state, so the bill uses IGST", 4500);
  await page.getByRole("button", { name: /Save & Select/ }).click();
  await page.waitForTimeout(1000);
  await page.getByLabel("Dispatch From").selectOption("WH-GODOWN");
  await say("Dispatch From the godown: goods go straight to site, showroom stock is untouched", 4500);
  await page.getByPlaceholder("Stock No").fill(SKU);
  await page.waitForTimeout(1000);
  await page.getByPlaceholder("Sq.Ft").first().fill("100");
  await page.getByPlaceholder("Sq.Ft").first().press("Enter");
  await page.waitForTimeout(1200);
  await say("Item added: 7 boxes, with IGST and the grand total", 4500);
  await page.getByRole("button", { name: /Settlement/ }).first().click();
  await page.waitForTimeout(1000);
  await say("Settlement: record the payment, for example cheque with its number and bank", 4500);
  const saved = page.waitForResponse((r) => r.url().endsWith("/sales/invoices") && r.request().method() === "POST", { timeout: 15000 });
  await page.getByRole("button", { name: /Complete Settlement/ }).click();
  const r = await saved; const b = await r.json().catch(() => ({}));
  console.log("BILL", r.status(), b.invoice_no, b.grand_total, b.is_interstate);
  await page.waitForTimeout(1800);
  await say(`Tax invoice ${b.invoice_no || ""} saved: ₹${b.grand_total ?? ""} with IGST. Print or save as PDF`, 6000);
});

await title("4 · Accounts and safety", "Every bill posts sales, GST and round-off to the ledger. Daily backups keep the data safe", 5000);
await page.goto(base); await page.waitForTimeout(3000);
await say("Back on Home, today's new bills already show in the figures", 5000);
await hideCaption();
await title("MQube", "Built for tiles and sanitaryware businesses", 4000);
await context.close();
console.log("VIDEO", await page.video().path());
await browser.close();
