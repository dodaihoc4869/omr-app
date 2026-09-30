import {chromium} from 'playwright'
import assert from 'node:assert/strict'
const origin=process.argv[2]||'http://127.0.0.1:5173'
const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']})
let checks=0
try{
for(const width of [390,844]){
 const p=await b.newPage({viewport:{width,height:width===390?844:700},reducedMotion:'reduce'})
 const errors=[];p.on('pageerror',e=>errors.push(e.message))
 await p.goto(origin+'/scripts/preview-bat-linh/games.html?game=bieu-cam')
 const buttons=p.locator('nav button')
 for(let i=0;i<6;i++){
  await buttons.nth(i).click();const emotion=await p.locator('section .bl-bieu-cam').first().getAttribute('data-cam-xuc')
  assert.equal(await p.locator(`section .bl-bieu-cam[data-cam-xuc="${emotion}"]`).count(),8)
  const views=await p.locator('section .bl-bieu-cam svg').evaluateAll(ns=>ns.map(n=>n.getAttribute('viewBox')))
  assert.equal(new Set(views).size,4);checks++
 }
 await p.locator('input[type=range]').fill('0');assert.equal(await p.locator('.bl-xe-linh-tam').getAttribute('data-mau'),'thap');checks++
 await p.locator('input[type=range]').fill('100');assert.equal(await p.locator('.bl-xe-linh-tam').getAttribute('data-mau'),'binh-thuong');checks++
 await p.waitForLoadState('networkidle');assert.equal(errors.length,0);assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth)<=1)
 await p.screenshot({path:`/workspace/bat-linh-preview/bieu-cam-${width}.png`,fullPage:true});await p.close()
}
const p=await b.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'})
await p.goto(origin+'/scripts/preview-bat-linh/trang.html?man=cau-da-lam');await p.getByText('Sai lần gần nhất',{exact:true}).waitFor();await p.waitForLoadState('networkidle');await p.screenshot({path:'/workspace/bat-linh-preview/cau-da-lam-390.png',fullPage:true});checks++
// Feedback is the student's actual answer; switching to the next question resets to thinking.
for(const [answer,emotion]of [['A','sai'],['B','dung']]){
 await p.goto(origin+'/scripts/preview-bat-linh/games.html?game=dao&thu=1&cap=50')
 await p.getByRole('button',{name:/LÊN ĐƯỜNG/}).click()
 await p.locator('.dao2-canh .bl-bieu-cam[data-cam-xuc="nghi"]').waitFor()
 await p.locator('.pa-hang').nth(answer==='A'?0:1).click()
 await p.getByRole('button',{name:'CHỐT ĐÁP ÁN · TUNG CHIÊU',exact:true}).click()
 await p.locator(`.bl-phan-hoi-thu .bl-bieu-cam[data-cam-xuc="${emotion}"]`).waitFor()
 await p.getByRole('button',{name:/ĐÃ ĐỌC LỜI GIẢI · SANG ẢI 2/}).click()
 await p.locator('.dao2-canh .bl-bieu-cam[data-cam-xuc="nghi"]').waitFor();checks++
}
await p.close()
console.log(`PASS: ${checks} expression/cart/feedback checks`)
}finally{await b.close()}
