// Watchable demo of goods going straight from a godown to a customer: node e2e/demo_direct.mjs
import { chromium } from "@playwright/test";
import { homedir } from "node:os";

const stamp = Date.now().toString().slice(-6);
const SKU = "TL-GVT-6060-CRM";
const SHADE = "SH-A12";
const out = `${homedir()}/tileflow-data/demo`;
const base = "http://localhost:3000";
const browser = await chromium.launch({ headless: false, slowMo: 250, args: ["--window-size=1500,980"] });
const context = await browser.newContext({ viewport: { width: 1480, height: 860 }, recordVideo: { dir: out, size: { width: 1480, height: 860 } } });
const page = await context.newPage();
page.on("dialog", async (d) => { console.log("POPUP:", d.message().slice(0, 160)); await page.waitForTimeout(3500); await d.dismiss(); });

let n = 0;
async function say(text, ms = 4000) {
  n += 1;
  console.log(`${n}. ${text}`);
  await page.evaluate((t) => {
    let el = document.getElementById("demo-caption");
    if (!el) {
      el = document.createElement("div");
      el.id = "demo-caption";
      el.style.cssText = "position:fixed;top:0;left:0;right:0;z-index:2147483647;padding:13px 20px;background:#111827;color:#fff;font:600 20px system-ui;text-align:center;pointer-events:none";
      document.body.appendChild(el);
    }
    el.textContent = t;
  }, `${n}. ${text}`);
  await page.waitForTimeout(ms);
}
async function api(path) {
  return page.evaluate(async (path) => {
    const res = await fetch(`/api/v1${path}`, { headers: { "x-company-id": localStorage.getItem("tileflow_company_id") || "", "x-branch-id": localStorage.getItem("tileflow_branch_id") || "" } });
    return res.json();
  }, path);
}
const stock = async (w) => { const data = await api("/wms/batch-stocks"); const r = data.find((x) => x.warehouse_id === w && x.product_id === SKU && x.batch_no === SHADE); return r ? Number(r.quantity) : 0; };
const levels = async () => `East Godown ${await stock("WH-GODOWN-2")} | Central Godown ${await stock("WH-GODOWN")} | Showroom ${await stock("WH-SHOWROOM")}`;
const openBilling = async () => { await page.goto(`${base}/?standalone_tab=pos`); await page.getByPlaceholder("Stock No").waitFor(); await page.waitForTimeout(800); };

await page.goto(base);
await page.getByRole("button", { name: "Admin", exact: true }).click();
await page.waitForTimeout(400);
await page.getByRole("button", { name: /Authorize/ }).click();
await page.getByRole("button", { name: /Enter Workspace/ }).first().click();
await page.getByText("MQube Tiles & Sanitaryware").first().waitFor();
await openBilling();
await say(`DIRECT FROM GODOWN. Boxes now: ${await levels()}`, 6000);

await page.getByRole("button", { name: "Add", exact: true }).first().click();
await page.getByPlaceholder("e.g. Modern Enterprises Pvt Ltd").fill(`Site Delivery Builders ${stamp}`);
await page.getByPlaceholder("e.g. 9876543210").fill(`9${String(Date.now()).slice(-9)}`);
await page.getByPlaceholder("e.g. 27AAAAA0000A1Z5").fill("27AABCS1234F1Z5");
await say("The customer buys for a site. The goods never come to the showroom");
await page.getByRole("button", { name: /Save & Select/ }).click();
await page.waitForTimeout(1000);

await say("THE KEY STEP: Dispatch From. This decides where the boxes leave from", 5000);
await page.getByLabel("Dispatch From").selectOption("WH-GODOWN-2");
await say("East Godown selected. Stock will leave from here only", 5000);
await page.locator("select").filter({ hasText: "Ravi Kumar" }).first().selectOption("Ravi Kumar");
await page.getByPlaceholder("Stock No").fill(SKU);
await page.waitForTimeout(1000);
await page.getByPlaceholder("Sq.Ft").fill("150");
await say("Customer needs 150 Sq.Ft. That becomes 10 whole boxes");
await page.getByPlaceholder("Sq.Ft").press("Enter");
await page.waitForTimeout(800);
await page.getByRole("button", { name: /Settlement \(F8\)/ }).click();
await page.waitForTimeout(800);
await say("Take payment and complete the bill");
const saved = page.waitForResponse((r) => r.url().endsWith("/sales/invoices") && r.request().method() === "POST");
await page.getByRole("button", { name: /Complete Settlement/ }).click();
const res = await saved;
const bill = await res.json().catch(() => ({}));
console.log("BILL", res.status(), bill.invoice_no, bill.grand_total, JSON.stringify((bill.items || []).map((i) => [i.quantity, i.batch_no])));
await page.waitForTimeout(1500);
await say(`Invoice ${bill.invoice_no} saved. This goes with the goods to the site`, 6000);
await openBilling();
await say(`RESULT. Boxes now: ${await levels()}. Only East Godown went down`, 8000);

const have = await stock("WH-GODOWN-2");
await page.getByLabel("Dispatch From").selectOption("WH-GODOWN-2");
await say(`WHAT IF THE GODOWN IS SHORT? East Godown has ${have} boxes. Trying to bill ${have + 100}`, 5000);
await page.getByPlaceholder("Stock No").fill(SKU);
await page.waitForTimeout(900);
await page.getByPlaceholder("Qty", { exact: true }).fill(String(have + 100));
await page.getByPlaceholder("Qty", { exact: true }).press("Enter");
await page.waitForTimeout(500);
await page.getByRole("button", { name: /Settlement \(F8\)/ }).click();
await page.waitForTimeout(800);
const refused = page.waitForResponse((r) => r.url().endsWith("/sales/invoices") && r.request().method() === "POST");
await page.getByRole("button", { name: /Complete Settlement/ }).click();
const no = await refused;
console.log("OVERSELL", no.status(), (await no.text()).slice(0, 160));
await page.waitForTimeout(4500);
await say(`REFUSED. No bill was made. Boxes still: ${await levels()}. Closing in 15 seconds`, 15000);
console.log("END", await levels());
await context.close();
console.log("VIDEO", await page.video().path());
await browser.close();
