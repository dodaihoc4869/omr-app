// Kiểm giao diện Bi-a thật với máy chủ giả; không gửi yêu cầu tới app đang hoạt động.
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
const goc=resolve(import.meta.dirname,'../..');
const out=resolve(goc,'docs/bia-giao-dien-0110');mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.PW_CHROMIUM || '/usr/bin/chromium',args:['--no-sandbox']});
const results=[];
for(const [name,width,height,scheme] of [['doc-360',360,740,'light'],['doc-768',768,1024,'light'],['pc-1280',1280,800,'light'],['doc-sang',390,844,'light'],['doc-toi',390,844,'dark'],['ngang-sang',844,390,'light'],['ngang-toi',844,390,'dark'],['pc-sang',1440,900,'light'],['pc-toi',1440,900,'dark']]){
 const ctx=await browser.newContext({viewport:{width,height},colorScheme:scheme,deviceScaleFactor:1,hasTouch:width<1000});
 const page=await ctx.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{localStorage.setItem('bia_da_xem_huong_dan','1');localStorage.setItem('bia_da_biet_vach','1')});
 await page.goto('http://127.0.0.1:4176/src/game/bi-a/xem-thu.html');
 for(const f of ['bat-linh.css','hoc-sinh.css','che-do-toi.css'])await page.addStyleTag({path:resolve(goc,'src/components/bat-linh',f)});
 await page.evaluate(()=>document.body.dataset.batLinh='');
 await page.getByRole('button',{name:'Đấu đơn với A.I',exact:true}).click();
 await page.locator('.bia-ban canvas').waitFor();await page.waitForTimeout(2800);
 const size=await page.evaluate(()=>{const cv=document.querySelector('.bia-ban canvas'),b=cv.getBoundingClientRect(),root=document.querySelector('.bia');return {boCuc:root.dataset.boCuc,canvas:{x:b.x,y:b.y,width:b.width,height:b.height},bodyOverflow:document.documentElement.scrollWidth>innerWidth,buttons:[...document.querySelectorAll('.bia-man .bia-nut-tron')].filter(e=>e.getClientRects().length).map(e=>{const r=e.getBoundingClientRect();return {name:e.getAttribute('aria-label'),width:r.width,height:r.height,x:r.x,y:r.y}}),power:(()=>{const r=document.querySelector('.bia-luc').getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height}})()}});
 await page.screenshot({path:out+'/'+name+'.jpg',type:'jpeg',quality:73});
 results.push({name,...size,errors});await ctx.close();
}
// Cùng một ván qua các cỡ màn: đổi bố cục không đổi bi, góc hoặc số cú đánh.
const ctx=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,reducedMotion:'reduce'});
const page=await ctx.newPage();
await page.addInitScript(()=>{localStorage.setItem('bia_da_xem_huong_dan','1');localStorage.setItem('bia_da_biet_vach','1')});
await page.goto('http://127.0.0.1:4176/src/game/bi-a/xem-thu.html');
for(const f of ['bat-linh.css','hoc-sinh.css','che-do-toi.css'])await page.addStyleTag({path:resolve(goc,'src/components/bat-linh',f)});
await page.evaluate(()=>document.body.dataset.batLinh='');
await page.getByRole('button',{name:'Đấu đơn với A.I',exact:true}).click();
await page.locator('.bia-ban canvas').waitFor();await page.waitForTimeout(2600);
const trangThai=()=>page.evaluate(()=>{const v=window.__biaVan;return JSON.stringify({aim:v.aim,soCu:v.soCu,balls:v.st.balls.map(b=>({id:b.id,x:b.x,y:b.y,on:b.on}))})});
const dau=await trangThai();const thaoTac=[];
for(const [w,h] of [[844,390],[1440,900],[390,844]]){
 await page.setViewportSize({width:w,height:h});await page.waitForTimeout(400);
 if(await trangThai()!==dau)throw new Error('Đổi màn hình làm đổi trạng thái ván');
 await page.getByRole('button',{name:'Tuỳ chỉnh',exact:true}).click();
 const tuy=page.getByRole('dialog',{name:'Tuỳ chỉnh',exact:true});
 await tuy.getByRole('button',{name:'Trái',exact:true}).click();
 if(await page.locator('.bia').getAttribute('data-tay')!=='trai')throw new Error('Không đổi được tay cầm');
 await tuy.getByRole('button',{name:'Phải',exact:true}).click();
 await tuy.getByRole('button',{name:'Diễn biến ván',exact:true}).click();
 const dong=page.getByRole('button',{name:'Đóng diễn biến ván'});await dong.press('ArrowRight');
 if(await trangThai()!==dau)throw new Error('Đọc diễn biến làm đổi góc nhắm');
 await dong.press('Escape');
 if(await page.getByRole('dialog',{name:'Diễn biến ván',exact:true}).count())throw new Error('Esc chưa đóng diễn biến');
 // Kéo lực rồi kéo về Huỷ: kiểm bằng sự kiện chuột thật, không gọi lõi đánh.
 const r=await page.getByRole('slider',{name:/Lực đánh/}).boundingBox();
 await page.mouse.move(r.x+r.width/2,r.y+r.height*.12);await page.mouse.down();
 await page.mouse.move(r.x+r.width/2,r.y+r.height*.55,{steps:8});
 await page.mouse.move(r.x+r.width/2,r.y+r.height*.02,{steps:8});await page.mouse.up();
 if(await trangThai()!==dau)throw new Error('Huỷ lực làm đổi ván');
 thaoTac.push({width:w,height:h,doiCoGiuVan:true,tayTraiPhai:true,dienBienEsc:true,huyLuc:true});
}
// Toàn màn hình và đổi giao diện hệ thống khi đang chơi; ván không đổi.
await page.setViewportSize({width:1440,height:900});await page.waitForTimeout(350);
await page.getByRole('button',{name:'Tuỳ chỉnh',exact:true}).click();
await page.getByRole('dialog',{name:'Tuỳ chỉnh',exact:true}).getByRole('button',{name:'Toàn màn hình',exact:true}).click();
await page.waitForTimeout(350);
if(await page.locator('.bia').getAttribute('data-toan')===null)throw new Error('Chưa vào giao diện toàn màn hình');
await page.getByRole('button',{name:'Thoát toàn màn hình',exact:true}).click();await page.waitForTimeout(350);
if(await trangThai()!==dau)throw new Error('Toàn màn hình làm đổi ván');
await page.emulateMedia({colorScheme:'dark'});const toi=await page.locator('.bia').evaluate(e=>getComputedStyle(e).backgroundColor);
await page.emulateMedia({colorScheme:'light'});const sang=await page.locator('.bia').evaluate(e=>getComputedStyle(e).backgroundColor);
if(toi===sang)throw new Error('Không đổi giao diện tự động');
thaoTac.push({toanManHinh:true,doiMauHeThong:true,nenToi:toi,nenSang:sang});
// Tấm câu thật trên máy chủ giả, chụp cả dọc và ngang; không có dữ liệu học sinh thật.
await page.evaluate(()=>{const v=window.__biaVan;v.moCau('giai-truoc',v.biEm()[0],v.cur)});
await page.locator('.bia-tam').waitFor();
for(const [ten,w,h] of [['cau-doc',390,844],['cau-ngang',844,390]]){await page.setViewportSize({width:w,height:h});await page.waitForTimeout(250);await page.screenshot({path:out+'/'+ten+'.jpg',type:'jpeg',quality:73});const r=await page.locator('.bia-tam').boundingBox();if(r.x<0||r.y<0||r.x+r.width>w+1||r.y+r.height>h+1)throw new Error('Tấm câu nằm ngoài màn hình')}
// Xuất chính tiếng va chạm Web Audio của game; ba lực, không nhánh vang.
const am=await page.evaluate(async()=>{
 const {AmThanhBia}=await import('/src/game/bi-a/am-thanh.ts');
 const c=new OfflineAudioContext(2,48000*1.3,48000);Object.defineProperty(c,'state',{value:'running'});
 const a=new AmThanhBia(()=>c);a.datTat(false);a.mo();
 for(const [t,v] of [[.1,180],[.5,850],[.9,1800]])a.tao('bi',t,v,0,true);
 const b=await c.startRendering();const d=b.getChannelData(0),m=[];
 for(const t of [.1,.5,.9]){let peak=0,tong=0;for(let i=Math.round(t*48000);i<Math.round((t+.08)*48000);i++){peak=Math.max(peak,Math.abs(d[i]));tong+=d[i]*d[i]}m.push({peak,rms:Math.sqrt(tong/(48000*.08))})}
 return {sr:b.sampleRate,pcm:Array.from(d),do:m};
});
if(!(am.do[0].rms<am.do[1].rms&&am.do[1].rms<am.do[2].rms)||am.do.some(d=>d.peak>1))throw new Error('Âm va chạm sai mức lực hoặc bị vỡ');
const wav=Buffer.alloc(44+am.pcm.length*2);wav.write('RIFF',0);wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(am.sr,24);wav.writeUInt32LE(am.sr*2,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(wav.length-44,40);am.pcm.forEach((v,i)=>wav.writeInt16LE(Math.round(Math.max(-1,Math.min(1,v))*32767),44+i*2));writeFileSync(out+'/cham-bi-moi.wav',wav);
writeFileSync(out+'/thao-tac-am-thanh.json',JSON.stringify({thaoTac,amThanh:am.do,reducedMotion:true},null,2));
await ctx.close();
await browser.close();writeFileSync(out+'/kiem-tra.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results.map(({name,boCuc,canvas,bodyOverflow,errors})=>({name,boCuc,canvas,bodyOverflow,errors})),null,2));
