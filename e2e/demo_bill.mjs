// Watchable walkthrough of making a bill: node e2e/demo_bill.mjs
import { chromium } from "@playwright/test";
import { homedir } from "node:os";

const stamp = Date.now().toString().slice(-6);
const SKU = "TL-GVT-6060-CRM";
const out = `${homedir()}/tileflow-data/demo`;
const browser = await chromium.launch({ headless: false, slowMo: 250, args: ["--window-size=1500,980"] });
const context = await browser.newContext({ viewport: { width: 1480, height: 860 }, recordVideo: { dir: out, size: { width: 1480, height: 860 } } });
const page = await context.newPage();

let n = 0;
async function say(text, ms = 3500) {
  n += 1;
  console.log(`${n}. ${text}`);
  await page.evaluate(([t]) => {
    let el = document.getElementById("demo-caption");
    if (!el) {
      el = document.createElement("div");
      el.id = "demo-caption";
      el.style.cssText = "position:fixed;top:0;left:0;right:0;z-index:2147483647;padding:14px 20px;background:#111827;color:#fff;font:600 20px system-ui;text-align:center;pointer-events:none";
      document.body.appendChild(el);
    }
    el.textContent = t;
  }, [`Step ${n}: ${text}`]);
  await page.waitForTimeout(ms);
}

await page.goto("http://localhost:3000/");
await say("Log in. Cashier fills the username and password, then Authorize Operator");
await page.getByRole("button", { name: "Cashier", exact: true }).click();
await page.waitForTimeout(600);
await page.getByRole("button", { name: /Authorize/ }).click();
await page.getByText("MQube Tiles & Sanitaryware").first().waitFor();
await page.goto("http://localhost:3000/?standalone_tab=pos");
await page.getByPlaceholder("Stock No").waitFor();
await say("Open Sales Billing, then the Distributor Invoicing tab");

await say("Click Add beside Customer to create a new customer with their GSTIN");
await page.getByRole("button", { name: "Add", exact: true }).first().click();
await page.getByPlaceholder("e.g. Modern Enterprises Pvt Ltd").fill(`Demo Builders ${stamp}`);
await page.getByPlaceholder("e.g. 9876543210").fill(`9${String(Date.now()).slice(-9)}`);
await page.getByPlaceholder("e.g. 27AAAAA0000A1Z5").fill("27AABCS1234F1Z5");
await say("Name, mobile and GSTIN. GSTIN 27 is Maharashtra, so this bill uses CGST + SGST");
await page.getByRole("button", { name: /Save & Select/ }).click();
await page.waitForTimeout(1000);

await say("Choose where the tiles leave from, under Dispatch From");
await page.getByLabel("Dispatch From").selectOption("WH-GODOWN");
await say("Choose the Sales Staff");
await page.locator("select").filter({ hasText: "Ravi Kumar" }).first().selectOption("Ravi Kumar");

await say("In the F11 row at the bottom, type the Stock No. The name and rate fill in");
await page.getByPlaceholder("Stock No").fill(SKU);
await page.waitForTimeout(1000);
await say("Type the customer's Sq.Ft: 100. Qty changes to 7 boxes by itself");
await page.getByPlaceholder("Sq.Ft").fill("100");
await page.waitForTimeout(1500);
await say("Press ENTER. The item moves up into the bill. No. of Items becomes 1");
await page.getByPlaceholder("Sq.Ft").press("Enter");
await page.waitForTimeout(800);
await page.getByText(SKU).first().scrollIntoViewIfNeeded();
await say("Check the totals at the bottom. Leave the freight Amount box empty unless you charge freight", 5000);

await say("Click Settlement (F8) to take payment");
await page.getByRole("button", { name: /Settlement \(F8\)/ }).click();
await page.waitForTimeout(800);
const row = page.locator("table tbody tr").filter({ has: page.locator('input[placeholder="e.g. TXN99824"]') }).first();
await say("The full amount is already filled in. Pick the payment mode: UPI");
await row.locator("select").selectOption("UPI");
await say("Enter the Transaction ID (for Cheque this is the cheque number, plus the bank)");
await row.getByPlaceholder("e.g. TXN99824").fill(`UPI${stamp}`);
await row.getByPlaceholder("e.g. HDFC POS 01").fill("shop@okhdfcbank");
await page.waitForTimeout(1000);
await say("Click Complete Settlement. The bill is saved and stock falls");
const saved = page.waitForResponse((r) => r.url().endsWith("/sales/invoices") && r.request().method() === "POST");
await page.getByRole("button", { name: /Complete Settlement/ }).click();
const res = await saved;
const bill = await res.json().catch(() => ({}));
console.log("SAVE", res.status(), bill.invoice_no, bill.grand_total, bill.sqft_billed ?? "", JSON.stringify((bill.items || []).map((i) => [i.quantity, i.sqft_billed, i.cgst_amount, i.sgst_amount, i.igst_amount])));
await page.waitForTimeout(1500);
await page.screenshot({ path: `${out}/final-bill.png` });
await say("Done. This is the tax invoice. Use the Print button to print it. This window closes in 45 seconds", 45000);
await context.close();
console.log("VIDEO", await page.video().path());
await browser.close();
