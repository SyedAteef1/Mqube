import { chromium } from '@playwright/test';
const [S, base='http://localhost:3000'] = process.argv.slice(2);
const b=await chromium.launch(); const p=await b.newPage({viewport:{width:1366,height:768}});
await p.goto(base); await p.getByRole('button',{name:'Admin',exact:true}).click(); await p.waitForTimeout(300);
await p.getByRole('button',{name:/Authorize/}).click(); await p.waitForTimeout(1500);
const e=p.getByRole('button',{name:/Enter Workspace/}).first(); if(await e.count()) await e.click(); await p.waitForTimeout(2500);
await p.screenshot({path:S+'/home.png'});
for (const [tab,btn] of [['pos',null],['pos','Speed POS Terminal'],['stock-transfers',null],['item-master',null],['business-profile',null]]) {
  await p.goto(base+'/?standalone_tab='+tab); await p.waitForTimeout(2500);
  if (btn) { await p.getByRole('button',{name:new RegExp(btn)}).click(); await p.waitForTimeout(1200); }
  await p.screenshot({path:`${S}/${tab}${btn?'-speed':''}.png`});
}
await b.close();
