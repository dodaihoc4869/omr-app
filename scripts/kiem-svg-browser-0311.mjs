// Chỉ kiểm tài sản SVG đã soát; không thay cho phép thử offline trong app.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),dir=path.join(root,'docs/hinh-vector-0311/kiem')
const manifest=JSON.parse(fs.readFileSync(path.join(dir,'danh-muc-da-kiem.json'),'utf8'))
const files=[...new Set(Object.values(manifest.theoHashNguon).map(x=>x.tep))]
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']})
const page=await browser.newPage({viewport:{width:1080,height:800}});const errors=[]
page.on('pageerror',e=>errors.push(e.message));await page.context().setOffline(true)
let decoded=0
for(let offset=0;offset<files.length;offset+=24){
 const part=files.slice(offset,offset+24)
 await page.setContent(`<html lang="vi"><meta charset="utf-8"><style>body{background:#efeff7;margin:0;padding:16px;font:13px Arial;color:#252440}main{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}figure{margin:0;background:white;border:1px solid #ddd;border-radius:12px;padding:8px;min-width:0}img{display:block;width:100%;height:140px;object-fit:contain}figcaption{font-size:11px;color:#087f8e}</style><main>${part.map((f,i)=>`<figure><figcaption>SVG đã soát ${offset+i+1}</figcaption><img alt="Hình đã soát" src="data:image/svg+xml;base64,${fs.readFileSync(path.join(dir,f)).toString('base64')}"></figure>`).join('')}</main></html>`)
 await page.locator('img').evaluateAll(imgs=>Promise.all(imgs.map(img=>img.decode())))
 const ok=await page.locator('img').evaluateAll(imgs=>imgs.every(img=>img.naturalWidth>0&&img.naturalHeight>0&&img.getBoundingClientRect().width<=img.parentElement.getBoundingClientRect().width))
 if(!ok)throw Error('Hình bị thiếu hoặc tràn khung')
 decoded+=part.length
 await page.screenshot({path:path.join(dir,`svg-da-kiem-${offset/24+1}.jpg`),fullPage:true,type:'jpeg',quality:45})
 await page.setViewportSize({width:360,height:800});await page.emulateMedia({colorScheme:'dark'})
 if(!(await page.locator('img').evaluateAll(imgs=>imgs.every(img=>img.getBoundingClientRect().width<=img.parentElement.getBoundingClientRect().width))))throw Error('Tràn khung360')
 await page.setViewportSize({width:1080,height:800});await page.emulateMedia({colorScheme:'light'})
}
await browser.close()
const report={svgRieng:files.length,daGiaiMa:decoded,loiJs:errors,offlineDocByteCucBo:true,khung360Va1080KhongTran:true,gioiHan:'Trang kiểm tài sản SVG, chưa phải kiểm service worker/tải sẵn/reload offline trong app học sinh.'}
fs.writeFileSync(path.join(dir,'kiem-svg-chromium.json'),JSON.stringify(report,null,2));console.log(report)
