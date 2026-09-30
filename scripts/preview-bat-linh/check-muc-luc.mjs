import {chromium} from 'playwright'
import assert from 'node:assert/strict'
const origin='http://127.0.0.1:5174'
const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']})
let count=0
try{
const p=await b.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'})
const errors=[],bad=[];p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)bad.push(r.url())})
await p.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.abort())
await p.goto(origin);const buttons=p.locator('#menu button');await buttons.first().waitFor()
const n=await buttons.count()
for(let i=0;i<n;i++){
 console.log('Checking',i,await buttons.nth(i).innerText());await buttons.nth(i).click()
 const f=await (await p.locator('#view').elementHandle()).contentFrame()
 await f.waitForLoadState('networkidle')
 await f.waitForFunction(()=>document.body.innerText.length>40)
 assert.ok((await f.locator('body').innerText()).length>40,`Empty screen ${i}`)
 assert.equal(errors.length,0,errors.join('\n'));assert.equal(bad.length,0,bad.join('\n'));count++
}
await buttons.first().click();await p.waitForTimeout(800);await p.screenshot({path:'/workspace/bat-linh-preview/muc-luc-may-tinh.png',fullPage:true})
await p.setViewportSize({width:390,height:844});await p.screenshot({path:'/workspace/bat-linh-preview/muc-luc-dien-thoai.png',fullPage:true});assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth)<=1)
console.log(`PASS: ${count} bundled screens + mobile hub layout, no JS errors or missing assets`)
}finally{await b.close()}
