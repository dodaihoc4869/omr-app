import {chromium} from 'playwright'
import assert from 'node:assert/strict'
const browser=await chromium.launch();const page=await browser.newPage({viewport:{width:1200,height:850}})
await page.goto('http://localhost:5173')
const scenes=await page.evaluate(async()=>{const {SCENES}=await import('/src/lib/experiments/catalog.ts');const {renderScene}=await import('/src/lib/experiments/scene.ts');return Object.entries(SCENES).map(([id,s])=>({id,html:renderScene(s)}))})
for(const width of [390,1200]){
 await page.setViewportSize({width,height:850})
 await page.setContent(`<body style="margin:0;padding:12px;background:#242c2d;color:#d8ddd6;font:20px system-ui;box-sizing:border-box">${scenes.map(s=>`<div data-scene="${s.id}">${s.html}</div>`).join('')}</body>`)
 await page.locator('details').evaluateAll(es=>es.forEach(e=>e.open=true))
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`overflow at ${width}`)
 const bad=await page.locator('svg').evaluateAll(es=>es.filter(e=>!e.getAttribute('aria-label')).length);assert.equal(bad,0)
 if(width===1200){await page.waitForFunction(()=>Number(getComputedStyle(document.querySelector('[data-scene="glucose-compare"] .ex-appear')).opacity)>.99);await page.locator('[data-scene="glucose-compare"]').screenshot({path:'/tmp/experiment-glucose-compare.png'});await page.locator('[data-scene="soap"]').screenshot({path:'/tmp/experiment-soap.png'})}
}
await page.emulateMedia({reducedMotion:'reduce'});assert.ok(await page.locator('.ex-appear').first().evaluate(e=>parseFloat(getComputedStyle(e).animationDuration)<.02))
console.log(`PASS ${scenes.length} scenes: mobile/desktop, dark, labels and reduced motion`);await browser.close()
