import {chromium} from 'playwright'
import assert from 'node:assert/strict'
const browser=await chromium.launch({headless:true}),page=await browser.newPage({viewport:{width:1400,height:1000}})
await page.goto('http://127.0.0.1:5173')
const result=await page.evaluate(async()=>{
 const {thanThuV2ChoToChieu}=await import('/src/lib/anh-than-thu-v2.ts'),{taoHtmlMayChieu}=await import('/src/lib/html-may-chieu.ts'),{PETS}=await import('/src/game/than-thu-v2/core.ts')
 let count=0;for(const p of PETS)for(const cap of [1,10,30,50,70,100]){const t=await thanThuV2ChoToChieu(async()=>({pet:p.id,cap,tower:1,earned:0}),'DEMO');if(t?.ten!==p.name||t.capDo!==cap||!t.anh.startsWith('data:image/png'))throw new Error('Sai ảnh hoặc cấp');count++}
 if(await thanThuV2ChoToChieu(async()=>null,'DEMO')!==null)throw new Error('Bịa hồ sơ')
 if(await thanThuV2ChoToChieu(()=>new Promise(()=>{}),'DEMO',20)!==null)throw new Error('Timeout')
 const thanThu=await thanThuV2ChoToChieu(async()=>({pet:'tinhyeu_ho',cap:1,tower:1,earned:0}),'DEMO')
 return {count,html:taoHtmlMayChieu([{sbd:'DEMO',hoTen:'Học sinh minh hoạ',soCau:1,cau:{phan:'I',text:'Nguyên tử helium có bao nhiêu proton?',luaChon:['1','2','3','4'],dapAn:'B',loiGiai:'Nguyên tử helium có 2 proton.'},thanThu}])}
})
assert.equal(result.count,48);assert.ok(result.html.includes('Cấp 1/120'));assert.ok(result.html.includes('Ái Hồ'));assert.ok(!result.html.includes('Hình thái 1/12'))
await page.setContent(result.html);await page.locator('.mc-thu-anh').waitFor();await page.waitForTimeout(300)
assert.equal(await page.locator('.mc-thu-anh').evaluate(img=>img.complete&&img.naturalWidth===360),true)
await page.screenshot({path:'/tmp/len-bang-v2.png',fullPage:true})
console.log('PASS: all 48 exact pet/level images; no legacy fallback; timeout does not block projection; embedded offline PNG; actual level 1/120 rendered.')
await browser.close()
