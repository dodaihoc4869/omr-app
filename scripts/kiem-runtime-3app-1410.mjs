// Smoke ba app qua entry thật: dữ liệu giả, không mạng production, không gửi bài/chấm điểm.
// node scripts/kiem-runtime-3app-1410.mjs --repo=/worktree-final --dist=/dist-final --hash=<commit> --out=/tmp/ket-qua
import { createServer as httpServer } from 'node:http'
import { existsSync, readFileSync, statSync, mkdirSync, writeFileSync } from 'node:fs'
import { resolve, join, extname } from 'node:path'
import { execFileSync } from 'node:child_process'
import { chromium } from 'playwright'
import { createServer as viteServer } from 'vite'
const args = Object.fromEntries(process.argv.slice(2).filter(x=>x.startsWith('--')).map(x=>{const i=x.indexOf('=');return [x.slice(2,i),x.slice(i+1)]}))
const fixtureRepo=resolve(import.meta.dirname,'..')
const repo = resolve(args.repo || fixtureRepo)
const dist = resolve(args.dist || join(repo,'dist'))
const output = resolve(args.out || '/tmp/tai-teacher-1410/smoke')
const actualHash=execFileSync('git',['rev-parse','HEAD'],{cwd:repo}).toString().trim()
if(!args.hash)throw Error(`Cần --hash= của bản runtime final; HEAD hiện ${actualHash}`)
if(!actualHash.startsWith(args.hash)){
 const runtimeChanged=execFileSync('git',['diff','--name-only',args.hash,'HEAD','--','src','server','public','vite.config.ts','index.html','package.json','package-lock.json'],{cwd:repo}).toString().trim()
 if(runtimeChanged)throw Error(`HEAD ${actualHash} đã đổi runtime sau ${args.hash}: ${runtimeChanged}`)
}
if(!existsSync(join(dist,'index.html')))throw Error('Chưa có dist; root phải build final trước')
const distHtml=readFileSync(join(dist,'index.html'),'utf8')
const entry=distHtml.match(/src="\/assets\/(index[^"]+\.js)"/)?.[1]
if(!entry)throw Error('Không tìm thấy mảnh index của dist')
const entryText=readFileSync(join(dist,'assets',entry),'utf8')
const tagAt=entryText.indexOf(args.hash.slice(0,7)+' · ')
if(tagAt<0)throw Error(`Dấu phiên bản dist không khớp ${args.hash}`)
const distTag=entryText.slice(tagAt).match(/^[0-9a-f]{7} · \d{4}-\d{2}-\d{2} \d{2}:\d{2}/)?.[0] || args.hash.slice(0,7)
const swBuiltAt=JSON.parse(readFileSync(join(dist,'sw-version.json'),'utf8')).builtAt

mkdirSync(output,{recursive:true})
const loader = await viteServer({ root:fixtureRepo,configFile:false,optimizeDeps:{noDiscovery:true,include:[]},server:{middlewareMode:true,hmr:false},logLevel:'error'})
const ph=await loader.ssrLoadModule('/scripts/chup-ph-dot19/gia.ts')
const nhip=await loader.ssrLoadModule('/scripts/chup-v2/gia/nhip-hoc.ts')
const fixtures={
 phNhip:ph.nhipGia(),phTong:ph.tongQuanGia(),phTatCa:ph.tatCaGia(),phHoc:ph.hoc2Gia(),phLoi:ph.loiThayGia(),phThaiDo:ph.thaiDoGia(),phLichSu:ph.lichSuGia(),gvNhip:nhip.nhipHocGia().du,
 now:Date.parse('2026-10-14T14:05:00Z'),ngay:'2026-10-14',
}
await loader.close()
const fixtureHost='https://smoke-fixture.example.com'
let swVersion=1
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.woff2':'font/woff2','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.ico':'image/x-icon'}
const servedMissing=[]
const server=httpServer((req,res)=>{
 const path=new URL(req.url,'http://x').pathname
 if(path==='/__seed'){res.writeHead(200,{'content-type':'text/html'});res.end('<!doctype html><html><body>Seed local fixture</body></html>');return}
 if(path==='/cau-hinh.json'){res.writeHead(200,{'content-type':'application/json'});res.end(JSON.stringify({mayChuMoi:fixtureHost}));return}
 const file=resolve(dist,'.'+decodeURIComponent(path))
 const isFile=file.startsWith(dist+'/')&&existsSync(file)&&statSync(file).isFile()
 if(!isFile&&extname(path)){servedMissing.push(path);res.writeHead(404);res.end('Không có tệp');return}
 const chosen=isFile?file:join(dist,'index.html')
 let content=readFileSync(chosen)
 if(path==='/sw.js')content=Buffer.concat([content,Buffer.from(`\n// smoke-update-${swVersion}\n`)])
 res.writeHead(200,{'content-type':mime[extname(chosen)]||'application/octet-stream','cache-control':'no-cache'})
 res.end(content)
})
await new Promise(r=>server.listen(0,'127.0.0.1',r))
const base=`http://127.0.0.1:${server.address().port}`
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/chromium',args:['--no-sandbox']})
const results=[],additional=[]
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
async function contextFor(role,width,height,scheme){
 const context=await browser.newContext({viewport:{width,height},colorScheme:scheme,locale:'vi-VN',timezoneId:'Asia/Ho_Chi_Minh',reducedMotion:'reduce'})
 const external=[]
 await context.route(/^https?:\/\/(?!127\.0\.0\.1)/,r=>{external.push(r.request().url());return r.abort()})
 await context.addInitScript(({fixtures,fixtureHost})=>{
   const native=window.fetch.bind(window)
   window.__smokeRequests=[];window.__smokeUnknown=[];window.__smokeWrites=[];window.__smokePublicLeaks=[];window.__smokePublicChecks=[]
   const json=data=>Promise.resolve(new Response(JSON.stringify(data),{status:200,headers:{'content-type':'application/json'}}))
   const publicReply=(data)=>{
     const walk=(value,path='')=>{if(!value||typeof value!=='object')return;for(const [key,item]of Object.entries(value)){if(/^(dapAn|dapAnDung|correct|answer|answerKey|keyBank|key|loiGiai|solution)$/i.test(key))window.__smokePublicLeaks.push(path+'.'+key);walk(item,path+'.'+key)}}
     walk(data);window.__smokePublicChecks.push({questions:Array.isArray(data.questions)?data.questions.length:0});return json(data)
   }
   const day=fixtures.ngay,now=fixtures.now
   Date.now=()=>now
   window.fetch=(input,init)=>{
     const url=new URL(typeof input==='string'?input:input instanceof URL?input.href:input.url,location.href)
     if(url.pathname.endsWith('/cau-hinh.json'))return json({mayChuMoi:fixtureHost})
     if(url.origin===location.origin)return native(input,init)
     if(url.origin!==fixtureHost){window.__smokeUnknown.push({path:url.pathname,action:'Địa chỉ ngoài fixture'});return json({ok:false,error:'Smoke chặn địa chỉ ngoài fixture'})}
     let body={};try{body=JSON.parse(init?.body||'{}')}catch{}
     const path=url.pathname,a=body.action||''
     window.__smokeRequests.push({path,action:a})
     if(/\/(answer|[^/]*nop[^/]*|hoc-tap-gap|hoc-tap-ktcn-tra)$/.test(path)||/nop|traLoi|luuTra/i.test(a)){window.__smokeWrites.push({path,action:a});return json({ok:false,error:'Smoke không gửi bài hoặc chấm điểm'})}
     if(path==='/hs/chua-cau-sai/danh-sach')return json({ok:true,cau:[],ds:[]})
     if(path==='/hs/buoi-hoc')return json({ok:true,buoi:{id:'BUOI-SMOKE',ten:'Buổi học · dữ liệu giả',lop:'12A1',daDiemDanh:true}})
     if(path==='/hs/nhip-hoc')return json(fixtures.phNhip)
     if(path==='/hs/chua-cau-sai/co')return json({ok:true,bat:false})
     if(path==='/ph/ke-hoach')return json({ok:true,canhBaoThay:[]})
     if(path==='/notifications/list')return json({ok:true,items:[],unread:0})
     if(path==='/presence')return json({ok:true})
     if(path==='/ca/danh-sach')return json({ok:true,items:[],dauDongBo:null})
     if(path==='/gv/chua-cau-sai/hang-chieu')return json({ok:true,bat:true,ds:[]})
     if(path==='/gv/nut-that/ds')return json({ok:true,nhom:[],kemRieng:[]})
     if(path==='/gv/lop')return json({ok:true,soEm:1,lop:[{tenLop:'12A1',khoi:'12',soEm:1,sbd:['12121212']}]})
     if(path==='/hs/ca-dang-mo')return json({ok:true,coCaMo:false,soCa:0})
     if(path==='/mom/list'||path==='/student-news/list')return json({ok:true,items:[],caDangMo:null})
     if(path==='/ph/xac-dinh')return json({ok:true,sbd:'12121212',hoTen:'Nguyễn Minh Khôi',lop:'12A1'})
     if(path==='/ph/nhip-hoc')return json(fixtures.phNhip)
     if(path==='/ph/con-tong-quan')return json(fixtures.phTong)
     if(path==='/ph/tat-ca-ve-con')return json(fixtures.phTatCa)
     if(path==='/ph/hoc-2')return json(fixtures.phHoc)
     if(path==='/ph/loi-thay')return json(fixtures.phLoi)
     if(path==='/ph/ho-so-thai-do')return json(fixtures.phThaiDo)
     if(path==='/ph/lich-su-lam-cau')return json(fixtures.phLichSu)
     if(path==='/gv/nhip-hoc')return json(fixtures.gvNhip)
     if(path==='/gv/chien-dich'&&a==='co-doc')return json({ok:true,co:{bat:true,lop:[],sbd:[]}})
     if(path==='/gv/chien-dich'&&a==='danh-sach')return json({ok:true,homNay:day,chienDich:[]})
     if(path==='/gv/omni'&&a==='co-doc')return json({ok:true,co:{bat:true,lop:['12A1'],sbd:[]}})
     if(path==='/gv/bai-da-day'&&a==='danh-sach')return json({ok:true,bai:[],choBaiMoi:null})
     if(path==='/goi'&&a==='danhSachCa')return json({ok:true,items:[{maCa:'CA-SMOKE',tenCa:'Kiểm tra ôn tập · dữ liệu giả',lop:'12A1',thoiGianPhut:50,moLuc:'2026-10-14T12:00:00Z',batDau:'2026-10-14T12:00:00Z',hetHanVao:'2026-10-14T15:00:00Z',trangThai:'mo',phamVi:'tu_do',congBo:'ca_lop_xong',loai:'thi',hanNop:'',lenBang:true,daVao:10,daNop:8,canhBao:0}]})
     if(path==='/goi'&&a==='danhSachCauHoi')return json({ok:true,items:[]})
     if(path==='/game-v2/academic-sync')return json({ok:true,exp:100})
     if(path==='/game-v2/hoa2-sanh'||path==='/game-v2/hoc-tap-sanh')return json({ok:true,cheDo2:true,ngay:day,serverNow:now,theLuc:{con:12,tong:24},dao:{con:12},doan:{con:0},goi7:{bat:true,ngay:day,toiThieu:24,daLamHomNay:12,tuLamCon:12,tiepCanCon:0,thieuPhu:0,thieuNgay:0,canHoTro:false,goi:[{id:'G-SMOKE',ten:'Bài 8. Amine',batDau:'2026-10-13',han:'2026-10-19',tong:40,daGap:10,con:30,quota:6,gapHomNay:2,quaHan:false,canBoSung:0,to:['DH-12-C3-B8']}],diemDaDo:[]},kiemTraCaNhan:{id:'KT-SMOKE',ngay:'2026-10-17',moLuc:now+3*86400000,hanLuc:now+4*86400000,serverNow:now,trangThai:'sap_den',homNay:false,tong:28,daTra:0,con:28,soChang:3,phut:50,soBai:3,tongKienThuc:60,phuDe:60,nguonDayDu:true,lyDo:'Kiểm chứng những phần em đang luyện',thieuNguon:0,diem:null,nopLuc:null,phienBan:3,baiNgayToiThieu:12}})
     if(path==='/game-v2/hoc-tap-start')return publicReply({ok:true,id:'LEARNING-SMOKE',questions:Array.from({length:6},(_,i)=>({qid:'QUESTION-SMOKE-'+i,maDe:'DH-12-C3-B8',version:'fixture',group:'fixture-'+i,phan:'I',text:'Amine nào sau đây là amine bậc một? (Dữ liệu giả)',choices:['CH3NH2','(CH3)2NH','(CH3)3N','CH3NHC2H5'],ideas:[],hinhAnh:[],dang:null,tenDang:'Bậc amine',mucDo:'biet',sao:0,kienThuc:[]}))})
     if(path==='/game-v2/hoc-tap-dem')return json({ok:true,ngay:day,daLam:12,tong:24,toiThieu:24})
     if(path==='/hs/ke-hoach-ngay')return json({ok:true,ngay:day,serverNow:now,viec:[],nganSach:{mucTieuCau:24,thoiGianPhut:20},tienBo:{daLamCau:12,mucTieuCau:24,dat:false},tienDo:{tong:24,daLam:12},exp:{hocTap:100}})
     if(path==='/hs/lich-su'||path==='/hs/btvn'||path==='/hs/gia-dinh')return json({ok:true,items:[]})
     if(path==='/gv/chua-cau-sai'||path==='/gv/nut-that')return json({ok:true,nhom:[],kemRieng:[],cau:[]})
     window.__smokeUnknown.push({path,action:a})
     return json({ok:false,error:`Thiếu fixture ${path} ${a}`})
   }
 },{fixtures,fixtureHost})
 const page=await context.newPage(),js=[]
 page.on('pageerror',e=>js.push(e.message))
 return {context,page,js,external}
}
async function audit(page){
 return page.evaluate(()=>({overflow:Math.max(0,document.documentElement.scrollWidth-innerWidth),text:document.body.innerText.slice(0,300),unknown:window.__smokeUnknown||[],writes:window.__smokeWrites||[],requests:window.__smokeRequests||[],publicLeaks:window.__smokePublicLeaks||[],publicChecks:window.__smokePublicChecks||[],kiemTraCards:document.querySelectorAll('.ktcn-the').length,kiemTraText:[...document.querySelectorAll('.ktcn-the')].map(el=>el.textContent),fonts:[...new Set([...document.querySelectorAll('h1,h2,button')].slice(0,15).map(el=>getComputedStyle(el).fontFamily))]}))
}
try{
 const sizes=args.probe==='1'?[]:args.quick==='1'?[[360,800]]:[[360,800],[800,390],[1280,800]]
 const roles=args.quick==='1'?['gv','hs','ph']:['gv','hs','ph']
 for(const role of roles)for(const [width,height]of sizes)for(const scheme of (args.quick==='1'?['light']:['light','dark'])){
   const {context,page,js,external}=await contextFor(role,width,height,scheme)
   await prepare(page,role)
   await page.goto(base+'/'+role,{waitUntil:'networkidle'})
   await page.waitForFunction(role=>role==='gv'?document.body.innerText.includes('Nhịp học'):role==='hs'?document.body.innerText.includes('Hôm nay'):document.body.innerText.includes('Hôm nay'),role,{timeout:20000})
   await page.evaluate(()=>document.fonts.ready)
   await page.waitForTimeout(700)
   const row={role,width,height,scheme,hash:actualHash,js,external,...await audit(page)}
   const screenshot=join(output,`${role}-${width}x${height}-${scheme}.jpg`)
   for(const quality of [60,45,30]) {const shot=await page.screenshot({type:'jpeg',quality,fullPage:false});if(shot.length<=150000||quality===30){writeFileSync(screenshot,shot);break}}
   row.screenshot=screenshot;results.push(row)
   writeFileSync(join(output,'matrix.json'),JSON.stringify({hash:actualHash,runtimeHash:args.hash,distTag,swBuiltAt,results,servedMissing,additional},null,2))
   console.log(JSON.stringify({role,width,height,scheme,js:row.js.length,overflow:row.overflow,unknown:row.unknown,external:row.external.length}))
   await context.close()
 }
 if(args.quick!=='1'){
   const {context,page,js,external}=await contextFor('hs',360,800,'light')
   await prepare(page,'hs')
   for(const legacy of ['?tab=thanthu','?tab=bia','#thanthu','#bia']){
     await page.goto(base+'/hs'+legacy,{waitUntil:'networkidle'})
     await page.waitForFunction(()=>document.body.innerText.includes('Hôm nay'),null,{timeout:20000})
     await page.waitForTimeout(500)
     additional.push({name:'legacy-link-'+legacy,js:[...js],external:[...external],...await audit(page)})
   }
   const learning=page.getByRole('button',{name:/Học tiếp|Học ngay|Bắt đầu học/}).first()
   await learning.click()
   await page.getByText('Amine nào sau đây là amine bậc một? (Dữ liệu giả)',{exact:false}).first().waitFor({timeout:20000})
   const learned=await audit(page)
   const leaked=await page.evaluate(()=>document.body.innerText.includes('Đáp án đúng'))
   additional.push({name:'open-learning-public-question',leaked,js:[...js],external:[...external],...learned})
   await context.close()

   const offline=await contextFor('ph',360,800,'light')
   await offline.page.goto(base+'/ph',{waitUntil:'networkidle'})
   await offline.page.waitForFunction(()=>!!navigator.serviceWorker?.controller,null,{timeout:30000})
   await offline.page.evaluate(async()=>{const reg=await navigator.serviceWorker.ready;if(!reg.active)throw Error('SW chưa active')})
   const precacheProbe=await offline.page.evaluate(async()=>{
     const keys=await caches.keys(),entries=[]
     for(const key of keys){const cache=await caches.open(key);const urls=(await cache.keys()).map(r=>r.url);entries.push({key,size:urls.length,app:urls.filter(u=>/assets\/App-.*\.js/.test(u))})}
     return {controller:navigator.serviceWorker.controller?.scriptURL,entries}
   })
   additional.push({name:'sw-precache-probe',js:[],external:[],overflow:0,unknown:[],writes:[],publicLeaks:[],...precacheProbe})
   await offline.context.setOffline(true)
   const appProbe=await offline.page.evaluate(async()=>{
     const all=await caches.keys(),urls=[]
     for(const key of all)for(const r of await (await caches.open(key)).keys())if(/assets\/App-.*\.js/.test(r.url))urls.push(r.url)
     const out=[];for(const url of urls){try{const r=await fetch(url);out.push({url,status:r.status,length:(await r.text()).length})}catch(e){out.push({url,error:e.message})}};return out
   })
   additional.push({name:'sw-offline-fetch-app-probe',js:[],external:[],overflow:0,unknown:[],writes:[],publicLeaks:[],appProbe})
   for(const role of ['hs','ph','gv']){
     await offline.page.goto(base+'/'+role,{waitUntil:'domcontentloaded'})
     await offline.page.waitForFunction(()=>document.getElementById('root')?.childElementCount>0,null,{timeout:20000})
     await offline.page.waitForTimeout(500)
     await offline.page.waitForFunction(role=>role==='gv'?!!document.querySelector('[aria-label="Mã bí mật của thầy"]'):role==='ph'?document.body.innerText.includes('Số báo danh của con'):document.body.innerText.includes('Số báo danh'),role,{timeout:20000})
     additional.push({name:'offline-shell-'+role,js:[...offline.js],external:[...offline.external],...await audit(offline.page)})
   }
   await offline.context.setOffline(false)
   await offline.page.evaluate(async()=>{
     const db=await new Promise((r,j)=>{const q=indexedDB.open('omr-exam',2);q.onsuccess=()=>r(q.result);q.onerror=()=>j(q.error)})
     const tx=db.transaction('settings','readwrite');tx.objectStore('settings').put('preserve-after-update','smokeUpdateMarker')
     await new Promise((r,j)=>{tx.oncomplete=r;tx.onerror=()=>j(tx.error)});db.close()
   })
   swVersion++
   const changed=offline.page.waitForEvent('framenavigated',{predicate:f=>f===offline.page.mainFrame(),timeout:20000})
   await offline.page.evaluate(async()=>{const reg=await navigator.serviceWorker.ready;await reg.update()})
   await changed
   await offline.page.waitForLoadState('networkidle')
   const marker=await offline.page.evaluate(async()=>{
     const db=await new Promise((r,j)=>{const q=indexedDB.open('omr-exam',2);q.onsuccess=()=>r(q.result);q.onerror=()=>j(q.error)})
     const tx=db.transaction('settings');const q=tx.objectStore('settings').get('smokeUpdateMarker')
     const result=await new Promise((r,j)=>{q.onsuccess=()=>r(q.result);q.onerror=()=>j(q.error)});db.close();return result
   })
   additional.push({name:'local-sw-update-reload-preserves-idb',marker,js:[...offline.js],external:[...offline.external],...await audit(offline.page)})
   if(marker!=='preserve-after-update')throw Error('SW update làm mất marker IndexedDB')
   await offline.context.close()
 }
}finally{
 await browser.close();await new Promise(r=>server.close(r))
 writeFileSync(join(output,'matrix.json'),JSON.stringify({hash:actualHash,runtimeHash:args.hash,distTag,swBuiltAt,results,servedMissing,additional},null,2))
}
if([...results,...additional].some(r=>r.js.length||r.overflow||r.external.length||r.unknown.length||r.writes.length||r.publicLeaks.length||r.leaked)||servedMissing.length)process.exitCode=1
