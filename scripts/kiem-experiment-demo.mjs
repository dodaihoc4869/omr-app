import {chromium} from 'playwright'
import assert from 'node:assert/strict'
const browser=await chromium.launch(),page=await browser.newPage({viewport:{width:1000,height:850}})
await page.goto('http://localhost:5173')
const html=await page.evaluate(async()=>{const {experimentHtml}=await import('/src/lib/experiments/render.ts');return experimentHtml('Trong thí nghiệm bắn phá lá vàng của Rutherford, hầu hết các hạt alpha xuyên thẳng qua lá vàng mà không bị lệch hướng. Điều này chứng tỏ:')})
await page.setContent('<body style="background:#c9c6bb;color:#202727;font:24px system-ui;padding:25px"><h2>Minh hoạ ngay trong đề</h2>'+html+'</body>')
await page.locator('summary').click();assert.equal(await page.locator('svg').isVisible(),true)
await page.screenshot({path:'/tmp/experiment-rutherford.png'})
await page.locator('summary').click();await page.locator('summary').click();assert.equal(await page.locator('svg').isVisible(),true)
await page.setViewportSize({width:390,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth))
console.log('PASS: run, close/replay and mobile width');await browser.close()
