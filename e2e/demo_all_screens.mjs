// Watchable tour of every MQube screen: node e2e/demo_all_screens.mjs
import { chromium } from "@playwright/test";
import { homedir } from "node:os";
import { readFileSync } from "node:fs";

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



const source = readFileSync(new URL("../src/layout_engine/layout_store.tsx", import.meta.url), "utf8");
const screens = [...source.matchAll(/id: "([^"]+)",\s*label: "([^"]+)",\s*icon: "[^"]+",\s*category: "([^"]+)"/g)];

await page.goto(base);
await page.getByRole("button", { name: "Admin", exact: true }).click();
await page.waitForTimeout(400);
await page.getByRole("button", { name: /Authorize/ }).click();
await page.getByRole("button", { name: /Enter Workspace/ }).first().click();
await page.getByText("MQube Tiles & Sanitaryware").first().waitFor();
await say(`MQube has ${screens.length} screens. Here is every one`, 3500);
for (const [index, [, id, label, category]] of screens.entries()) {
  await open(id);
  await say(`Screen ${index + 1} of ${screens.length}: ${label} (${category})`, 3000);
}
await say("That is every screen in MQube. Closing in 10 seconds", 10000);
await context.close();
console.log("VIDEO", await page.video().path());
await browser.close();
