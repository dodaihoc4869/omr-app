// Kiểm Chromium độc lập C3 qua entry /gv bản build thật; chỉ dữ liệu giả cục bộ, không dùng D1/R2 thật.
// Root build một lần rồi: node scripts/kiem-runtime-c3-1410.mjs --repo=/workspace/c3-root --dist=/workspace/c3-root/dist --hash=<sha> --out=/tmp/c3-runtime
import { createServer } from 'node:http'
import { existsSync, readFileSync, statSync, mkdirSync, writeFileSync } from 'node:fs'
import { resolve, join, extname } from 'node:path'
import { execFileSync } from 'node:child_process'
import { chromium } from 'playwright'
const args=Object.fromEntries(process.argv.slice(2).filter(x=>x.startsWith('--')).map(x=>{const i=x.indexOf('=');return [x.slice(2,i),x.slice(i+1)]}))
const repo=resolve(args.repo||import.meta.dirname+'/..'),dist=resolve(args.dist||join(repo,'dist')),out=resolve(args.out||'/tmp/c3-runtime-1410')
const hash=execFileSync('git',['rev-parse','HEAD'],{cwd:repo}).toString().trim()
if(!args.hash)throw Error('Phải ghi --hash của bản root đã build')
if(!hash.startsWith(args.hash)&&execFileSync('git',['diff','--name-only',args.hash,'HEAD','--','src','server','public','vite.config.ts','package.json'],{cwd:repo}).toString().trim())throw Error('Runtime đã đổi sau hash yêu cầu')
if(!existsSync(join(dist,'index.html')))throw Error('Root chưa build dist')
const html=readFileSync(join(dist,'index.html'),'utf8'),entry=html.match(/src="\/assets\/(index[^"]+\.js)"/)?.[1]
if(!entry||!readFileSync(join(dist,'assets',entry),'utf8').includes(args.hash.slice(0,7)+' · '))throw Error('Dấu phiên bản dist không khớp hash')
mkdirSync(out,{recursive:true})
const fixtures={now:Date.parse('2026-10-14T01:00:00Z'),ngay:'2026-10-14'}
const fixtureHost='https://c3-fixture.example.com'
const missing=[],mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.woff2':'font/woff2','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.ico':'image/x-icon'}
const server=createServer((req,res)=>{
 const path=new URL(req.url,'http://x').pathname
 if(path==='/__seed'){res.writeHead(200,{'content-type':'text/html'});res.end('<!doctype html><html><body>Fixture C3 cục bộ</body></html>');return}
 if(path==='/cau-hinh.json'){res.writeHead(200,{'content-type':'application/json'});res.end(JSON.stringify({mayChuMoi:fixtureHost}));return}
 const file=resolve(dist,'.'+decodeURIComponent(path)),valid=file.startsWith(dist+'/')&&existsSync(file)&&statSync(file).isFile()
 if(!valid&&extname(path)){missing.push(path);res.writeHead(404);res.end('Thiếu tệp');return}
 const chosen=valid?file:join(dist,'index.html');res.writeHead(200,{'content-type':mime[extname(chosen)]||'application/octet-stream','cache-control':'no-cache'});res.end(readFileSync(chosen))
})
await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`
const browser=await chromium.launch({headless:true,executablePath:existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined,args:['--no-sandbox']})
const matrix=[],cases=[],errors=[]
async function prepare(page,role){
 await page.goto(base+'/__seed')
 await page.evaluate(async({role,url,now})=>{
   const open=(name,v,up)=>new Promise((resolve,reject)=>{const req=indexedDB.open(name,v);req.onupgradeneeded=()=>up(req.result);req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)})
   const db=await open('omr-exam',2,d=>{for(const name of ['settings','sessionCache','sessionBankTeacher'])if(!d.objectStoreNames.contains(name))d.createObjectStore(name);if(!d.objectStoreNames.contains('examSources'))d.createObjectStore('examSources',{keyPath:'maDe'});if(!d.objectStoreNames.contains('attempts'))d.createObjectStore('attempts',{keyPath:'key'})})
   const key=await crypto.subtle.generateKey({name:'AES-GCM',length:256},false,['encrypt','decrypt'])
   const iv=crypto.getRandomValues(new Uint8Array(12)),text=new TextEncoder().encode('secret-local-fixture-only')
   const encrypted=await crypto.subtle.encrypt({name:'AES-GCM',iv},key,text)
   const b64=bytes=>btoa(String.fromCharCode(...new Uint8Array(bytes)))
   let salt,lockIv,lockEncrypted
   if(role==='gv'){
     salt=crypto.getRandomValues(new Uint8Array(16));lockIv=crypto.getRandomValues(new Uint8Array(12))
     const material=await crypto.subtle.importKey('raw',new TextEncoder().encode('password-local-fixture'),'PBKDF2',false,['deriveKey'])
     const lock=await crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:210000,hash:'SHA-256'},material,{name:'AES-GCM',length:256},false,['encrypt','decrypt'])
     lockEncrypted=await crypto.subtle.encrypt({name:'AES-GCM',iv:lockIv},lock,text)
   }
   const tx=db.transaction('settings','readwrite'),s=tx.objectStore('settings')
   s.put({BAT:true,URL:url,HAN_GIAY:10,HAN_NONG_GIAY:3,SO_LAN_THU:1,LUI_VE_APPS_SCRIPT:true,GIAN_VAO_THI_GIAY:0},'mayChuMoi')
   s.put(url,'scriptUrl');s.put('fixture-local','smokeMarker')
   if(role==='gv'){
     s.put({muoi:b64(salt),soVong:210000,iv:b64(lockIv),maHoa:b64(lockEncrypted),soLanSai:0,mocMoLai:0,hoiLai:'moi_lan_mo'},'khoaApp')
     s.put(key,'khoaPhien')
     sessionStorage.setItem('omr-phien',JSON.stringify({iv:b64(iv),maHoa:b64(encrypted)}))
   }
   await new Promise((r,j)=>{tx.oncomplete=r;tx.onerror=()=>j(tx.error)})
   db.close()
   localStorage.setItem('ddh.coHoa2',JSON.stringify({bat:true,lop:[],sbd:[]}))
   localStorage.setItem('ddh.thuMucKho.ngay','2026-10-14')
   localStorage.setItem('omr_student_portal_auth',JSON.stringify({sbd:'12121212',hoTen:'Nguyễn Minh Khôi',lop:'12A1',namSinh:'2008',token:'token-local-fixture-only'}))
   localStorage.setItem('omr_ph_pass','pass-local-fixture-only');localStorage.setItem('omr_ph_sbd','12121212')
   const cl=await open('omr-classlist',1,d=>{d.createObjectStore('students',{keyPath:'sbd'});d.createObjectStore('meta')})
   const ct=cl.transaction('students','readwrite')
   ct.objectStore('students').put({sbd:'12121212',hoTen:'Nguyễn Minh Khôi',lop:'12A1',namSinh:'2008'})
   await new Promise((r,j)=>{ct.oncomplete=r;ct.onerror=()=>j(ct.error)})
   cl.close()
 },{role,url:fixtureHost,now:fixtures.now})
}

async function open(width=360,height=800,scheme='light'){
 const context=await browser.newContext({viewport:{width,height},colorScheme:scheme,locale:'vi-VN',timezoneId:'Asia/Ho_Chi_Minh',reducedMotion:'reduce',serviceWorkers:'block'})
 const external=[],js=[]
 await context.route(/^https?:\/\/(?!127\.0\.0\.1)/,r=>{external.push(r.request().url());return r.abort()})
 await context.addInitScript(({fixtures,fixtureHost})=>{
   const native=window.fetch.bind(window),now=fixtures.now
   const em=[{sbd:'12121212',hoTen:'Nguyễn Minh Khôi',khoi:'12',tenLop:'12 - Tinh Hoa',duocThem:true},{sbd:'12000002',hoTen:'Trần Thanh Bình',khoi:'12',tenLop:'12 - Tinh Hoa',duocThem:true},{sbd:'12000003',hoTen:'Lê Hoàng Anh '+('Nguyễn '.repeat(28)).trim(),khoi:'12',tenLop:'12 - Tinh Hoa',duocThem:true},{sbd:'12000004',hoTen:'Phạm Đăng Dũng (đã khóa)',khoi:'12',tenLop:'12 - Tinh Hoa',duocThem:false}]
   window.__c3={mode:'normal',em,nhan:['12121212','12000002'],revision:'a'.repeat(64),requests:[],writes:[],unknown:[],authErrors:[],reads:0,held:[],receipts:{}}
   const json=(data,status=200)=>Promise.resolve(new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json'}}))
   Date.now=()=>now
   window.fetch=(input,init)=>{
     const url=new URL(typeof input==='string'?input:input instanceof URL?input.href:input.url,location.href)
     if(url.pathname.endsWith('/cau-hinh.json'))return json({mayChuMoi:fixtureHost})
     if(url.origin===location.origin)return native(input,init)
     const c=window.__c3
     if(url.origin!==fixtureHost){c.unknown.push({path:url.pathname,action:'Ngoài fixture'});return json({ok:false,error:'Địa chỉ ngoài fixture bị chặn'})}
     let body={};try{body=JSON.parse(init?.body||'{}')}catch{}
     const p=url.pathname,a=body.action||'';c.requests.push({path:p,action:a})
     if(p==='/gv/goi-bai-7'){
       if(!new Headers(init?.headers).get('x-ma-bi-mat'))c.authErrors.push(a)
       if(a==='tong_hop'){const data={ok:true,bat:true,serverNow:now,goi:[{id:'G-C3',tick_id:'T-C3',khoa_bai:'12/C3/B8',ten:'Bài 8. Amine · DỮ LIỆU GIẢ',lop:'12 - Tinh Hoa',bat_dau:'2026-10-13',han:'2026-10-19',so_cau:127}],thongKe:{'G-C3':{soEm:c.nhan.length,pGap:40,pTuLam:35}}};if(c.mode==='summary-hold')return new Promise(r=>c.held.push(()=>r(new Response(JSON.stringify(data),{status:200,headers:{'content-type':'application/json'}}))));return json(data)}
       if(a==='doc_em'){
         c.reads++
         if(c.mode==='read-offline')return Promise.reject(new TypeError('Fixture mất mạng'))
         const data={ok:true,serverNow:now,goiId:'G-C3',tickId:'T-C3',lop:'12 - Tinh Hoa',ten:'Bài 8. Amine · DỮ LIỆU GIẢ',revision:c.revision,em:c.em,nhan:[...c.nhan]}
         if(c.mode==='read-wrong-class')data.em=[...c.em,{sbd:'11000001',hoTen:'Em lớp khác',khoi:'11',tenLop:'11A1',duocThem:true}]
         if(c.mode==='read-hold')return new Promise(r=>c.held.push(()=>r(new Response(JSON.stringify(data),{status:200,headers:{'content-type':'application/json'}}))))
         return json(data)
       }
       if(a==='sua_em'){
         c.writes.push({...body})
         if(c.mode==='offline')return Promise.reject(new TypeError('Fixture mất mạng'))
         if(c.mode==='conflict')return json({ok:false,error:'Danh sách đã đổi ở máy khác. Thầy đọc danh sách mới.',code:'xung_dot'},409)
         if(c.mode==='exam')return json({ok:false,error:'Đang có ca kiểm tra mở. Chưa sửa danh sách.'},409)
         const fingerprint=JSON.stringify({goiId:body.goiId,revision:body.revision,them:body.them,bot:body.bot})
         const old=c.receipts[body.requestId]
         if(old&&old.fingerprint!==fingerprint)return json({ok:false,error:'Mã yêu cầu đã dùng cho dữ liệu khác'},409)
         const nhan=[...new Set([...c.nhan.filter(s=>!body.bot.includes(s)),...body.them])].sort()
         const ack=old?.ack||{ok:true,goiId:'G-C3',requestId:body.requestId,revision:(body.revision==='a'.repeat(64)?'b':'c').repeat(64),them:[...body.them],bot:[...body.bot],nhan,serverNow:now}
         if(c.mode==='invalid-ack')return json({ok:true})
         if(c.mode==='wrong-ack')return json({...ack,nhan:['12121212','12000002']})
         if(c.mode==='duplicate-ack')return json({...ack,them:[...body.them,...body.them]})
         if(!old){c.receipts[body.requestId]={fingerprint,ack};c.nhan=nhan;c.revision=ack.revision}
         if(c.mode==='lost-ack')return Promise.reject(new TypeError('Fixture mất ACK sau khi đã commit'))
         if(c.mode==='write-hold')return new Promise(r=>c.held.push(()=>r(new Response(JSON.stringify(ack),{status:200,headers:{'content-type':'application/json'}}))))
         return json(ack)
       }
     }
     if(p==='/gv/lop')return json({ok:true,soEm:4,lop:[{tenLop:'12 - Tinh Hoa',khoi:'12',soEm:4,sbd:em.map(e=>e.sbd)}]})
     if(p==='/gv/buoi-hoc'&&(a==='dang-mo'||a==='gan-day'))return json({ok:true,buoi:[]})
     if(p==='/gv/kiem-tra-ca-nhan')return json({ok:true,bat:false,em:[]})
     if(p==='/gv/dau-gio')return json({ok:true,bat:true,em:[],cau:[]})
     if(p==='/gv/omni'&&a==='co-doc')return json({ok:true,co:{bat:true,lop:['12 - Tinh Hoa'],sbd:[]}})
     if(p==='/gv/bai-da-day'&&a==='danh-sach')return json({ok:true,bai:[],choBaiMoi:null})
     if(p==='/gv/chien-dich'&&a==='co-doc')return json({ok:true,co:{bat:true,lop:[],sbd:[]}})
     if(p==='/gv/chien-dich'&&a==='danh-sach')return json({ok:true,homNay:fixtures.ngay,chienDich:[]})
     if(p==='/gv/chua-cau-sai/hang-chieu')return json({ok:true,bat:true,ds:[]})
     if(p==='/gv/nut-that/ds')return json({ok:true,nhom:[],kemRieng:[]})
     if(p==='/gv/nhip-hoc')return json({ok:true,em:[],lop:[]})
     if(p==='/ca/danh-sach')return json({ok:true,items:[],dauDongBo:null})
     if(p==='/goi'&&a==='danhSachCa')return json({ok:true,items:[]})
     if(p==='/goi'&&a==='danhSachCauHoi')return json({ok:true,items:[]})
     if(p==='/presence')return json({ok:true})
     if(p==='/notifications/list')return json({ok:true,items:[],unread:0})
     c.unknown.push({path:p,action:a});return json({ok:false,error:`Thiếu fixture ${p} ${a}`})
   }
 },{fixtures,fixtureHost})
 const page=await context.newPage();page.on('pageerror',e=>js.push(e.message))
 await prepare(page,'gv');await page.goto(base+'/gv',{waitUntil:'networkidle'})
 await page.getByRole('button',{name:'Hành trình',exact:true}).filter({visible:true}).first().click()
 await page.locator('[data-khoi="bai-dang-giao"] [data-khoi="dong-giao"]').waitFor({timeout:20000})
 await page.evaluate(()=>document.fonts.ready)
 return {context,page,js,external}
}
async function openPicker(page){
 await page.getByRole('button',{name:/Thêm \/ Bớt em/}).first().click()
 const dialog=page.getByRole('dialog').filter({has:page.getByRole('heading',{name:/Em nhận/})})
 await dialog.waitFor();await dialog.locator('.cd-nut-mo-chon').waitFor();return dialog
}
async function pick(page,dialog,sbd,value){
 if(!await dialog.locator('.cd-tam-chon').isVisible())await dialog.locator('.cd-nut-mo-chon').click()
 await dialog.getByRole('searchbox',{name:'Tìm em',exact:true}).fill(sbd)
 const check=dialog.locator('.cd-cay-nhan').filter({hasText:sbd}).locator('input[type="checkbox"]')
 await check.setChecked(value)
}
async function change(page,dialog){await pick(page,dialog,'12000002',false);await pick(page,dialog,'12000003',true);await dialog.getByRole('button',{name:'Xong',exact:true}).click()}
async function inspect(page,dialog){
 return page.evaluate(selector=>{
   const d=[...document.querySelectorAll('[role="dialog"]')].find(x=>x.querySelector('h1,h2,h3,h4')?.textContent.includes('Em nhận'))||document.querySelector(selector)
   const visible=e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&r.bottom>0&&r.top<innerHeight&&r.right>0&&r.left<innerWidth}
   const touch=[...d.querySelectorAll('button,input')].filter(visible).flatMap(e=>{
     const t=e.type==='checkbox'?(e.closest('label')||e):e,r=t.getBoundingClientRect()
     return r.width<47.9||r.height<47.9?[{name:e.getAttribute('aria-label')||e.textContent||e.type,width:+r.width.toFixed(1),height:+r.height.toFixed(1)}]:[]
   })
   const rgb=s=>{const x=s.match(/[\d.]+/g)?.map(Number);return x?.length>=3?x:null},lum=c=>c.slice(0,3).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0)
   const walker=document.createTreeWalker(d,NodeFilter.SHOW_TEXT),contrast=[]
   while(walker.nextNode()){
     const n=walker.currentNode,e=n.parentElement;if(!n.textContent.trim()||!visible(e))continue
     if(e.closest('button')?.disabled)continue
     const er=e.getBoundingClientRect(),sc=e.closest('.cd-cay')?.getBoundingClientRect();if(sc&&(er.bottom<=sc.top||er.top>=sc.bottom))continue
     const css=getComputedStyle(e),fg=rgb(css.color);let bg=null
     for(let p=e;p&&!bg;p=p.parentElement){const c=rgb(getComputedStyle(p).backgroundColor);if(c&&(c[3]??1)>=.99)bg=c}
     if(!fg||!bg)continue
     const a=lum(fg),b=lum(bg),ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05),big=parseFloat(css.fontSize)>=24||parseFloat(css.fontSize)>=18.66&&Number(css.fontWeight)>=700
     if(ratio+.01<(big?3:4.5))contrast.push({text:n.textContent.trim().slice(0,80),ratio:+ratio.toFixed(2)})
   }
   return {overflow:Math.max(0,document.documentElement.scrollWidth-innerWidth),touch,contrast,requests:window.__c3.requests,unknown:window.__c3.unknown,authErrors:window.__c3.authErrors,focusInDialog:d.contains(document.activeElement),text:d.innerText}
 },'[role="dialog"]')
}
function assert(value,text){if(!value)throw Error(text)}
async function caseRun(name,run){if(args.only&&!name.includes(args.only))return;try{const result=await run();cases.push({name,ok:true,...result});console.log(JSON.stringify({name,ok:true}))}catch(e){cases.push({name,ok:false,error:e.message});errors.push(e.message);console.log(JSON.stringify({name,ok:false,error:e.message}))}}
function record(){writeFileSync(join(out,'ket-qua.json'),JSON.stringify({duLieu:'Giả cục bộ; entry /gv thực; không D1/R2/API production',hash,runtimeHash:args.hash,dist,missing,matrix,cases,errors},null,2)+'\n')}
try{
 if(args.probe==='1'){
   const x=await open();console.log(JSON.stringify(await x.page.evaluate(()=>({text:document.body.innerText.slice(0,4500),state:window.__c3})),null,2));await x.context.close()
 }else{
   for(const [width,height]of [[360,800],[800,390],[1280,800]])for(const scheme of ['light','dark']){
     await caseRun(`matrix-${width}x${height}-${scheme}`,async()=>{
       const x=await open(width,height,scheme),d=await openPicker(x.page)
       await change(x.page,d)
       await d.locator('.cd-nut-mo-chon').click();await d.getByRole('searchbox',{name:'Tìm em',exact:true}).fill('12000003')
       const measured=await inspect(x.page,d)
       const file=join(out,`${width}x${height}-${scheme}.jpg`);let bytes=0
       for(const quality of [65,50,35,25]){const jpg=await x.page.screenshot({type:'jpeg',quality});if(jpg.length<=150000||quality===25){writeFileSync(file,jpg);bytes=jpg.length;break}}
       await d.getByRole('button',{name:'Xong',exact:true}).click();const url=x.page.url()
       await d.getByRole('button',{name:'Lưu danh sách',exact:true}).click()
       await d.getByText('Đã lưu danh sách',{exact:true}).waitFor()
       assert(url===x.page.url(),'Lưu làm đổi URL/màn');assert(await d.isVisible(),'Lưu tự đóng tấm')
       const writes=await x.page.evaluate(()=>window.__c3.writes)
       assert(writes.length===1&&JSON.stringify(writes[0].them)===JSON.stringify(['12000003'])&&JSON.stringify(writes[0].bot)===JSON.stringify(['12000002']),'Không ghi đúng tập thêm/bớt')
       const row={width,height,scheme,js:x.js,external:x.external,bytes,screenshot:file,...measured,writes};matrix.push(row)
       assert(!x.js.length&&!x.external.length&&!measured.overflow&&!measured.touch.length&&!measured.contrast.length&&!measured.unknown.length&&!measured.authErrors.length&&bytes<=150000,'Cổng runtime/hình học/chạm/tương phản lỗi')
       await x.context.close();record();return {writes:writes.length}
     })
   }
   for(const mode of ['invalid-ack','wrong-ack','duplicate-ack','offline','lost-ack','conflict','exam'])await caseRun(`deny-${mode}`,async()=>{
     const x=await open(),d=await openPicker(x.page);await change(x.page,d);await x.page.evaluate(m=>window.__c3.mode=m,mode)
     await d.getByRole('button',{name:'Lưu danh sách',exact:true}).click();await d.getByRole('alert').waitFor()
     assert(!await d.getByText('Đã lưu danh sách',{exact:true}).count(),'ACK sai/lỗi hiện Đã lưu')
     assert(await d.isVisible(),'Lỗi làm đóng mất nháp');const text=await d.innerText();assert(/Thêm\s*1 em/.test(text)&&/Bớt\s*1 em/.test(text),'Lỗi làm mất tập thêm/bớt')
     if(mode==='offline'||mode==='lost-ack'){
       const first=await x.page.evaluate(()=>window.__c3.writes[0]);await x.page.evaluate(()=>window.__c3.mode='normal')
       await d.getByRole('button',{name:/Thử lưu lại|Lưu danh sách/}).click();await d.getByText('Đã lưu danh sách',{exact:true}).waitFor()
       const writes=await x.page.evaluate(()=>window.__c3.writes);assert(writes.length===2&&writes[1].requestId===first.requestId,'Retry không giữ requestId')
     }
     if(mode==='conflict'){
       await x.page.evaluate(()=>{window.__c3.mode='normal';window.__c3.revision='c'.repeat(64);window.__c3.nhan=['12121212','12000002','12000003']})
       await d.getByRole('button',{name:'Đọc danh sách mới',exact:true}).click()
       await x.page.waitForFunction(()=>window.__c3.reads===2)
       assert((await x.page.evaluate(()=>window.__c3.writes)).length===1,'Reload conflict tự ghi nháp')
     }
     await x.context.close();return {js:x.js,external:x.external}
   })
   await caseRun('read-skeleton-and-offline-retry',async()=>{
     const x=await open();await x.page.evaluate(()=>window.__c3.mode='read-hold')
     const opener=x.page.getByRole('button',{name:/Thêm \/ Bớt em/}).first();await opener.click()
     const d=x.page.locator('[data-khoi="sua-em-nhan-bai"]');await d.waitFor()
     await d.getByRole('status',{name:'Đang đọc danh sách nhận bài',exact:true}).waitFor()
     assert(await d.getByRole('button',{name:'Lưu danh sách',exact:true}).isDisabled(),'Đang đọc vẫn cho ghi')
     await x.page.evaluate(()=>{window.__c3.mode='normal';window.__c3.held.splice(0).forEach(fn=>fn())})
     await d.locator('.cd-nut-mo-chon').waitFor();await d.getByRole('button',{name:'Hủy',exact:true}).click()
     await x.page.evaluate(()=>window.__c3.mode='read-offline');await opener.click();await d.getByRole('alert').waitFor()
     assert(!await d.locator('.cd-nut-mo-chon').count(),'Mất mạng đọc suy rỗng thành ứng viên')
     await x.page.evaluate(()=>window.__c3.mode='normal');await d.getByRole('button',{name:'Thử đọc lại',exact:true}).click();await d.locator('.cd-nut-mo-chon').waitFor()
     await x.context.close();return {reads:3}
   })
   await caseRun('reject-read-other-class',async()=>{
     const x=await open();await x.page.evaluate(()=>window.__c3.mode='read-wrong-class')
     await x.page.getByRole('button',{name:/Thêm \/ Bớt em/}).first().click();const d=x.page.locator('[data-khoi="sua-em-nhan-bai"]');await d.getByRole('alert').waitFor()
     assert(!await d.locator('.cd-nut-mo-chon').count(),'Doc em chứa lớp khác vẫn cho chọn')
     assert(await d.getByRole('button',{name:'Lưu danh sách',exact:true}).isDisabled(),'Doc em sai vẫn cho lưu');await x.context.close();return {}
   })
   await caseRun('cancel-escape-focus-and-enter',async()=>{
     const x=await open(),d=await openPicker(x.page)
     assert(await d.getByRole('button',{name:'Lưu danh sách',exact:true}).isDisabled(),'Chưa đổi vẫn cho lưu')
     await pick(x.page,d,'12000002',false);await d.getByRole('searchbox',{name:'Tìm em',exact:true}).press('Enter')
     assert((await x.page.evaluate(()=>window.__c3.writes)).length===0,'Enter ô tìm đã lưu')
     await x.page.keyboard.press('Escape');assert(await d.isVisible()&&!await d.getByRole('alertdialog').count(),'Esc bộ chọn đã đóng hoặc hỏi bỏ nháp tấm ngoài')
     assert(!await d.locator('.cd-tam-chon').isVisible(),'Esc bộ chọn chưa đóng')
     await x.page.keyboard.press('Escape');await d.getByRole('alertdialog').waitFor()
     await d.getByRole('button',{name:'Giữ nháp, tiếp tục sửa',exact:true}).click();assert(/Bớt\s*1 em/.test(await d.innerText()),'Giữ nháp làm mất nháp')
     await d.getByRole('button',{name:'Hủy',exact:true}).click();await d.getByRole('button',{name:'Bỏ nháp và đóng',exact:true}).click()
     await d.waitFor({state:'hidden'});assert(await x.page.evaluate(()=>document.activeElement?.getAttribute('aria-label')?.includes('Thêm / Bớt em')),'Đóng tấm không trả focus nút mở')
     assert((await x.page.evaluate(()=>window.__c3.writes)).length===0,'Hủy ghi dữ liệu');await x.context.close();return {writes:0}
   })
   await caseRun('remove-all-members-keep-tick-row',async()=>{
     const x=await open(),d=await openPicker(x.page);await d.locator('.cd-nut-mo-chon').click();await d.getByRole('button',{name:'Bỏ chọn hết',exact:true}).click();await d.getByRole('button',{name:'Xong',exact:true}).click()
     await d.getByRole('button',{name:'Lưu danh sách',exact:true}).click();await d.getByText('Đã lưu danh sách',{exact:true}).waitFor()
     const writes=await x.page.evaluate(()=>window.__c3.writes);assert(writes.length===1&&writes[0].bot.length===2&&!writes[0].them.length,'Bỏ hết có tập khác')
     assert(await x.page.locator('[data-khoi="dong-giao"]').count()===1,'Bỏ hết làm mất dòng tick');await x.context.close();return {writes:1}
   })
   await caseRun('old-summary-response-cannot-overwrite-ack',async()=>{
     const x=await open();await x.page.evaluate(()=>window.__c3.mode='summary-hold')
     await x.page.locator('[data-khoi="bai-dang-giao"]').getByRole('button',{name:'Cập nhật',exact:true}).click();await x.page.waitForFunction(()=>window.__c3.held.length===1)
     await x.page.evaluate(()=>window.__c3.mode='normal');const d=await openPicker(x.page);await pick(x.page,d,'12000003',true);await d.getByRole('button',{name:'Xong',exact:true}).click()
     await d.getByRole('button',{name:'Lưu danh sách',exact:true}).click();await d.getByText('Đã lưu danh sách',{exact:true}).waitFor()
     await x.page.evaluate(()=>window.__c3.held.splice(0).forEach(fn=>fn()))
     await x.page.waitForFunction(()=>document.querySelector('[data-khoi="dong-giao"]')?.getAttribute('data-so-em')==='3')
     assert(await d.getByText('Đã lưu danh sách',{exact:true}).count()===1,'Lượt đọc cũ xóa ACK');await x.context.close();return {members:3}
   })
   await caseRun('cold-shell-before-module-and-safe-late-error-after-cancel',async()=>{
     const x=await open();const held=[];const pattern='**/assets/SuaEmNhanBai-*.js'
     await x.page.route(pattern,r=>new Promise(resolve=>held.push(async()=>{await r.abort('failed');resolve()})))
     const url=x.page.url();let navigations=0;x.page.on('framenavigated',f=>{if(f===x.page.mainFrame())navigations++})
     const started=Date.now();await x.page.getByRole('button',{name:/Thêm \/ Bớt em/}).first().click()
     const shell=x.page.locator('[data-khoi="cho-tam-em"]');await shell.waitFor();const shellMs=Date.now()-started
     assert(await x.page.evaluate(()=>document.body.style.overflow==='hidden'&&document.querySelector('[data-khoi=cho-tam-em]').contains(document.activeElement)),'Vỏ chờ chưa khóa cuộn/focus')
     assert((await x.page.evaluate(()=>window.__c3.reads))===0,'Module chưa có nhưng API đã đọc')
     await shell.getByRole('button',{name:'Hủy mở danh sách',exact:true}).click();await shell.waitFor({state:'hidden'})
     await x.page.waitForTimeout(100);for(const release of held)await release();await x.page.waitForTimeout(1000)
     assert(x.page.url()===url&&navigations===0,'Lỗi mảnh đến sau Hủy tự tải/đổi toàn GV')
     assert(!await x.page.locator('[data-khoi="sua-em-nhan-bai"]').count(),'Hủy vỏ vẫn mở modal sau đó')
     assert(await x.page.evaluate(()=>document.body.style.overflow!== 'hidden'),'Hủy vỏ bỏ quên khóa cuộn')
     await x.context.close();return {shellMs,heldRequests:held.length,navigations,js:x.js,external:x.external}
   })
   for(const extension of ['js','css'])await caseRun(`cold-feature-${extension}-failure-stays-local`,async()=>{
     const x=await open();const pattern=`**/assets/SuaEmNhanBai-*.${extension}`
     let blocked=0;await x.page.route(pattern,r=>{blocked++;return r.abort('failed')});const url=x.page.url();let navigations=0
     x.page.on('framenavigated',f=>{if(f===x.page.mainFrame())navigations++})
     await x.page.getByRole('button',{name:/Thêm \/ Bớt em/}).first().click()
     const error=x.page.locator('[data-khoi="bai-dang-giao"]').getByRole('alert').filter({hasText:'Chưa mở được danh sách nhận bài'})
     await x.page.waitForFunction(()=>[...document.querySelectorAll('[role=alert]')].some(e=>e.textContent.includes('Chưa mở được danh sách nhận bài'))||document.querySelector('[data-khoi=sua-em-nhan-bai]'),null,{timeout:15000});assert(blocked>0,'Cold fixture chưa chặn đúng chunk mới');if(!await error.count()){const display=await x.page.locator('[data-khoi=sua-em-nhan-bai]').evaluate(e=>getComputedStyle(e).display);throw Error(`Thiếu ${extension} vẫn render tấm không báo lỗi tại bảng; display=${display}`)}assert(url===x.page.url()&&navigations===0,'Thiếu chunk tự đổi toàn màn GV')
     assert(await x.page.locator('[data-khoi="dong-giao"]').count()===1,'Thiếu chunk làm mất bảng')
     await x.page.unroute(pattern);await error.getByRole('button',{name:'Thử mở danh sách lại',exact:true}).click()
     let retrySucceeded=false
     try{await x.page.locator('[data-khoi="sua-em-nhan-bai"] .cd-nut-mo-chon').waitFor({timeout:5000});retrySucceeded=true}catch{}
     if(retrySucceeded){const d=x.page.locator('[data-khoi="sua-em-nhan-bai"]'),position=await d.evaluate(e=>getComputedStyle(e).display);assert(position==='flex','Retry CSS không phục hồi style của tấm')}
     assert(navigations===0,'Thử mở lại tự điều hướng/refresh toàn app')
     await x.context.close();return {extension,blocked,navigations,retrySucceeded,js:x.js,external:x.external}
   })
   if(args.legacy==='1')await caseRun('legacy-phone-without-at-or-randomUUID',async()=>{
     const x=await open();await x.page.evaluate(()=>{Array.prototype.at=undefined;Object.defineProperty(crypto,'randomUUID',{value:undefined,configurable:true})})
     const d=await openPicker(x.page);await change(x.page,d);await d.getByRole('button',{name:'Lưu danh sách',exact:true}).click();await d.getByText('Đã lưu danh sách',{exact:true}).waitFor()
     const writes=await x.page.evaluate(()=>window.__c3.writes);assert(writes.length===1&&typeof writes[0].requestId==='string'&&writes[0].requestId.length>=8,'Máy thiếu API mới không tạo được mã yêu cầu')
     assert(!x.js.length&&!x.external.length,'Máy thiếu API mới có lỗi JS hoặc mạng ngoài fixture');await x.context.close();return {writes:1,js:x.js,external:x.external}
   })
   await caseRun('double-click-and-keyboard-no-parent-submit',async()=>{
     const x=await open(),d=await openPicker(x.page);await change(x.page,d);await x.page.evaluate(()=>window.__c3.mode='write-hold')
     await d.getByRole('button',{name:'Lưu danh sách',exact:true}).evaluate(e=>{e.click();e.click()})
     await x.page.waitForFunction(()=>window.__c3.writes.length===1)
     await x.page.evaluate(()=>window.__c3.held.splice(0).forEach(fn=>fn()))
     await d.getByText('Đã lưu danh sách',{exact:true}).waitFor();assert((await x.page.evaluate(()=>window.__c3.writes)).length===1,'Bấm lặp nhân ghi')
     await x.context.close();return {writes:1}
   })
 }
}finally{record();await browser.close();await new Promise(r=>server.close(r))}
if(errors.length||missing.length)process.exitCode=1
