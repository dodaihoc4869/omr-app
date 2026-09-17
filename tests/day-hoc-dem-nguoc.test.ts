import {it,expect} from 'vitest'
import {JSDOM} from 'jsdom'
import {taoHtmlMayChieu,thoiGianDayHoc,type OBang} from '../src/lib/html-may-chieu'
const o=(name:string,text='Câu ngắn',sao=0):OBang=>({sbd:name,hoTen:name,soCau:1,sao,cau:{phan:'I',id:name,text,luaChon:['A','B','C','D'],dapAn:'A',buoc:[]} as OBang['cau']})
it('giới hạn 60–180 giây và dành thêm giờ cho câu khó, dài',()=>{
 expect(thoiGianDayHoc(o('A'))).toBe(60)
 expect(thoiGianDayHoc(o('A','dài '.repeat(1000),2))).toBe(180)
 expect(thoiGianDayHoc(o('A','Câu ngắn',2))).toBeGreaterThan(60)
})
it('tự hiện cả hai tên khi hết giờ, sang trang rồi quay lại đếm mới',()=>{
 let now=0;let tick=()=>{}
 const dom=new JSDOM(taoHtmlMayChieu([o('A'),o('B'),o('C'),o('D')],{dayHoc:true}),{runScripts:'dangerously',beforeParse(w){w.Date.now=()=>now;w.setInterval=((f:()=>void)=>{tick=f;return 1}) as never;w.clearInterval=()=>{};w.HTMLElement.prototype.scrollTo=()=>{} }})
 const doc=dom.window.document
 const heads=()=>[...doc.querySelectorAll<HTMLElement>('.mc-dot:first-child .mc-em')].map(e=>e.hidden)
 expect(heads()).toEqual([true,true]);now=61000;tick();expect(heads()).toEqual([false,false])
 doc.getElementById('mc-sau')!.click();expect(doc.getElementById('mc-clock')!.textContent).toContain('1:00')
 doc.getElementById('mc-truoc')!.click();expect(heads()).toEqual([true,true]);expect(doc.getElementById('mc-clock')!.textContent).toContain('1:00');dom.window.close()
})
it('hiện thần thú toàn màn hình rồi dọn hiệu ứng khi chuyển lượt',()=>{
 let now=0;let tick=()=>{}
 const pet={anh:'https://example.com/pet.png',ten:'Rồng',danhHieu:'',he:'',capDo:1,hinhThai:'',tangThapCaoNhat:0,soCauDaThanhTay:0}
 const dom=new JSDOM(taoHtmlMayChieu([{...o('A'),thanThu:pet},{...o('B'),thanThu:pet},o('C')],{dayHoc:true}),{runScripts:'dangerously',beforeParse(w){w.Date.now=()=>now;w.setInterval=((f:()=>void)=>{tick=f;return 1}) as never;w.clearInterval=()=>{};w.HTMLElement.prototype.scrollTo=()=>{};Object.defineProperty(w.HTMLImageElement.prototype,'complete',{get:()=>true});Object.defineProperty(w.HTMLImageElement.prototype,'naturalWidth',{get:()=>512})}})
 const doc=dom.window.document;now=61000;tick()
 expect(doc.querySelectorAll('.mc-intro-card')).toHaveLength(2)
 expect(doc.querySelector('.mc-intro')?.textContent).toContain('A')
 doc.getElementById('mc-sau')!.click();expect(doc.querySelector('.mc-intro')).toBeNull();dom.window.close()
})
