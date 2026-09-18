// @vitest-environment node
import {beforeAll,afterAll,it,expect} from 'vitest'
import {chromium,type Browser} from 'playwright'
import {readFileSync} from 'node:fs'
import {CSS_PHIEU,theCauHtml,thanhNopHtml} from '../src/lib/html-phieu'
let browser:Browser
beforeAll(async()=>{browser=await chromium.launch({headless:true})})
afterAll(async()=>{await browser?.close()})
const q={id:'Q1',phan:'I',text:'Khí nào phổ biến nhất trong khí quyển Trái Đất?',luaChon:['Oxygen','Nitrogen','Ozone','Argon'],dapAn:'B',mucDo:'nhan_biet',loiGiai:'Nitrogen chiếm phần lớn thể tích không khí.'} as any
const html=`<style>${CSS_PHIEU}</style><div class="khung"><div class="thanh">Thanh xem đề</div>${thanhNopHtml(1)}${theCauHtml(q,1,false,false,true,true)}<input class="lam-nhap" value="0,25"><div class="tf-item"><span class="tf-statement">Mệnh đề đúng sai</span><button class="tf-badge lam-o">Đ</button></div><div class="pdf-chon"><button class="pdf-nut">Tải đề</button></div></div>`
for(const width of [360,390,768]) for(const theme of ['light','dark','explicit'] as const) it(`${width}px ${theme}: đọc được đáp án, lựa chọn và thanh nộp`,async()=>{
 const page=await browser.newPage({viewport:{width,height:780},colorScheme:theme==='dark'?'dark':'light'})
 await page.setContent(`<html class="${theme==='explicit'?'dark':''}"><body class="co-lam chua-nop">${html}</body></html>`)
 await page.addStyleTag({content:'* { transition: none !important; }'})
 const contrast=async(selector:string)=>page.locator(selector).first().evaluate(el=>{
  const rgb=(s:string)=>s.match(/[\d.]+/g)!.slice(0,3).map(Number)
  const lum=(v:number[])=>v.map(x=>{x/=255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4}).reduce((a,x,i)=>a+x*[.2126,.7152,.0722][i],0)
  const cs=getComputedStyle(el);let node:Element|null=el,bg=cs.backgroundColor
  while(node && (bg==='rgba(0, 0, 0, 0)'||bg==='transparent')){node=node.parentElement;if(node)bg=getComputedStyle(node).backgroundColor}
  const a=lum(rgb(cs.color)),b=lum(rgb(bg));return (Math.max(a,b)+.05)/(Math.min(a,b)+.05)
 })
 for(const selector of ['.q-opt','.nop-chu','.lam-nhap','.tf-badge','.pdf-nut']) expect(await contrast(selector),selector).toBeGreaterThanOrEqual(4.5)
 await page.locator('.q-opt').first().evaluate(el=>el.setAttribute('aria-checked','true'))
 expect(await contrast('.q-opt')).toBeGreaterThanOrEqual(4.5)
 // Submitted correct/wrong options must retain readable paired colours in dark mode too.
 await page.locator('body').evaluate(el=>el.classList.remove('chua-nop'))
 for(const state of ['dung','sai']){
  await page.locator('.q-opt').first().evaluate((el,state)=>{el.removeAttribute('aria-checked');el.className='q-opt lam-o '+state},state)
  expect(await contrast('.q-opt'),state).toBeGreaterThanOrEqual(4.5)
 }
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
 expect(await page.locator('.thanh').first().evaluate(el=>getComputedStyle(el).position)).toBe('static')
 await page.close()
})
it('khung dùng chung ba app chừa nút đóng ngoài vùng iframe',async()=>{
 const css=readFileSync('src/index.css','utf8')
 const rules=['lop-xem-phieu','nut-dong-phieu'].map(c=>css.match(new RegExp('\\.'+c+' \\{[^}]+\\}'))![0]).join('\n')
 const page=await browser.newPage({viewport:{width:360,height:780}})
 await page.setContent(`<style>${rules}</style><div class="lop-xem-phieu"><iframe style="width:100%;height:100%;border:0"></iframe><button class="nut-dong-phieu">X</button></div>`)
 const frame=await page.locator('iframe').boundingBox(),close=await page.locator('button').boundingBox()
 expect(frame!.y).toBeGreaterThanOrEqual(close!.y+close!.height)
 expect(frame!.y+frame!.height).toBeLessThanOrEqual(780)
 await page.close()
})
