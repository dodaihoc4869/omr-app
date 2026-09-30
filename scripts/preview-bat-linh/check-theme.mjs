import { chromium } from 'playwright'
import { mkdirSync, writeFileSync } from 'node:fs'
import assert from 'node:assert/strict'
// Kiểm màu theo hệ thống ngay trên trang đang mở, không gọi máy chủ thật.
const out=process.argv[3]??'/workspace/bat-linh-dark-preview'; mkdirSync(out,{recursive:true})
const origin=process.argv[2]??'http://127.0.0.1:5176', base=origin+'/scripts/preview-bat-linh/'
const cases=[['sanh','trang.html?man=sanh','.bl-dong-hanh'],['ph','trang.html?man=ph','.ph3-ah'],['tl','trang.html?man=tl','.tlu'],['hs-login','trang.html?man=hs-login','#hs-dn-sbd'],['ph-login','trang.html?man=ph-login','#ph3-sbd'],['dao','games.html?game=dao&thu=1&cap=50','.dao2'],['shop','games.html?game=shop&pet=1&cap=50','.ps'],['bia','games.html?game=bia','.bia'],...['sanh','tran','trum','ket-qua','thang','thua'].map(x=>['doan-'+x,'games.html?game=doan&man='+x,'.dh2']),['chuong','games.html?game=chuong','.dh-chuong']]
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});const results=[]
try {for(const width of [390,1440]) for(const [name,route,selector] of cases){
 const p=await browser.newPage({viewport:{width,height:900},colorScheme:'light',reducedMotion:'reduce'}), errors=[]
 p.on('pageerror',e=>errors.push(e.message));await p.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.abort())
 await p.goto(base+route);await p.locator(selector).first().waitFor();await p.evaluate(()=>document.fonts.ready)
 const skip=p.getByRole('button',{name:'Bỏ qua',exact:true});if(await skip.isVisible())await skip.click()
 if(name==='sanh')await p.locator('.bl-ban-do summary').click()
 if(name==='hs-login')await p.locator('#hs-dn-sbd').fill('12345678')
 await p.evaluate(()=>window.__themeProbe='same-document')
 for(const scheme of ['light','dark','light']){
  await p.emulateMedia({colorScheme:scheme});await p.waitForTimeout(180);if(name==='sanh')await p.locator('.bl-ban-do').evaluate(e=>e.open=true)
  if(name==='sanh')assert.ok(await p.locator('.bl-hanh-trinh').evaluate(e=>e.getBoundingClientRect().height)>400, 'Bản đồ mở ra đầy đủ')
  if(name==='hs-login')assert.equal(await p.locator('#hs-dn-sbd').inputValue(),'12345678','Không mất dữ liệu khi đổi màu')
  const data=await p.evaluate(()=>({probe:window.__themeProbe,bg:getComputedStyle(document.querySelector('.bl-app')).backgroundColor,scheme:getComputedStyle(document.querySelector('.bl-app')).colorScheme,overflow:document.documentElement.scrollWidth-innerWidth,broken:[...document.images].filter(i=>i.complete&&!i.naturalWidth).map(i=>i.src)}))
  assert.equal(data.probe,'same-document');assert.equal(data.scheme,scheme,`${name} color-scheme`);assert.ok(data.overflow<=1,`${name} overflow ${data.overflow}`);assert.equal(data.broken.length,0);assert.equal(errors.length,0)
  results.push({name,width,scheme,...data})
  if(scheme==='dark'||!results.some(r=>r.name===name&&r.width===width&&r.scheme==='light'&&r!==results.at(-1))) await p.screenshot({path:`${out}/${name}-${width}-${scheme}.jpg`,type:'jpeg',quality:65,fullPage:true})
 }
 await p.close()
}console.log('PASS',results.length,'live theme / viewport checks')}
finally{writeFileSync(out+'/results.json',JSON.stringify(results,null,2));await browser.close()}
