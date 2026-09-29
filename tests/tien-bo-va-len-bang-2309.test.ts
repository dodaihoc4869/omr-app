// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { JSDOM, VirtualConsole } from 'jsdom'
import { taoHtmlMayChieu, type OBang } from '../src/lib/html-may-chieu'
// SỬA CÓ CHỦ Ý 29/09 (luật v4, docs/DE-XUAT-EXP-2909.md): ba test đầu khoá các hàm LỊCH SỬ v3 (hấp thụ theo ngày, chuyển v2 → v3) trên đường cấp v3 — các hàm này vẫn
// dùng khi chuyển hồ sơ cũ; luật v4 (nạp tự do, khoá mốc, vàng) khoá ở tests/exp-v4-2909.test.ts. Test khiên đổi sang rèn bằng VÀNG.
import { hapThu, chuyenDoiSangV3 as chuyenDoiLuatCap, HAP_THU_DAT, LUAT_CAP_V3 as LUAT_CAP_MOI, type HoSoCapExp } from '../src/lib/hap-thu-ngay'
import { BANG_THANH_EXP_V2_DAU, thanhExpV3 as thanhExp, tongExpToiCapV3 as tongExpToiCap } from '../src/game/than-thu-hoa-hoc/kinh-nghiem'
import { congTongSoVaoHoSo, khienConLai, renKhienBangVang, type HoSoGameExp } from '../server/src/exp-ho-so-game'

describe('Nhịp học và ví EXP', () => {
  it('ví không giới hạn và spam nạp vẫn chỉ đạt cấp 10 từ ngày 12', () => {
    let p:HoSoCapExp={cap:1,exp:0,wallet:1_000_000}
    for(let d=1;d<=12;d++){
      for(let n=0;n<10;n++)p=hapThu(p,Infinity,`2026-10-${String(d).padStart(2,'0')}`,HAP_THU_DAT).hoSo
      expect(tongExpToiCap(p.cap)+p.exp).toBe(d*200)
      if(d<12)expect(p.cap).toBeLessThan(10)
    }
    expect(p.cap).toBe(10)
    expect(p.wallet).toBe(997_600)
  })
  it('ngày chưa đạt tích lũy chậm hơn; ngày không học không nạp',()=>{
    let p:HoSoCapExp={cap:1,exp:0,wallet:10000}
    for(let n=1;n<=19;n++)p=hapThu(p,Infinity,`d${n}`,120).hoSo
    expect(p.cap).toBeLessThan(10)
    const dung=hapThu(p,Infinity,'nghi',0)
    expect(dung.daNap).toBe(0)
    expect(hapThu(p,Infinity,'d20',120).hoSo.cap).toBe(10)
  })
  it('V2 chuyển một lần, bảo toàn EXP, giữ cấp và hạn mức đã dùng với mọi cấp',()=>{
    for(let cap=1;cap<=120;cap++){
      const oldBar=cap<10?BANG_THANH_EXP_V2_DAU[cap-1]!:thanhExp(cap)
      const p={cap,exp:Math.max(0,oldBar-1),wallet:999,luatCap:2,hapThu:{ngay:'2026-09-23',da:200}}
      const r=chuyenDoiLuatCap(p,100,'2026-09-23')
      expect(r.hoSo.cap).toBe(cap)
      expect(r.hoSo.hapThu).toEqual(p.hapThu)
      expect(r.hoSo.luatCap).toBe(LUAT_CAP_MOI)
      expect(tongExpToiCap(cap)+r.hoSo.exp+r.hoSo.wallet).toBe(r.tongCu)
      expect(chuyenDoiLuatCap(r.hoSo,100,'2026-09-23').daChuyen).toBe(false)
    }
  })
  it('khiên mở ngày 21; rèn dùng 1 400 vàng (luật v4), retry không rèn hai lần',()=>{
    const p:HoSoGameExp={cap:10,exp:0,wallet:0,earned:0,luatCap:4,mocVang:0,expMoi:{daCong:0,manhDaTinh:0,ngayDat:0}}
    for(let d=1;d<=20;d++){
      congTongSoVaoHoSo(p,0,d,d)
      expect(khienConLai(p)).toBe(0)
    }
    expect(()=>renKhienBangVang(p,0,9999)).toThrow()
    congTongSoVaoHoSo(p,0,21,21)
    expect(khienConLai(p)).toBe(1)
    expect(p.khienRen?.daRen).toBe(0)
    expect(renKhienBangVang(p,0,1400)).toBe(true)
    expect(p.khienRen).toEqual({manh:0,daRen:1})
    expect(renKhienBangVang(p,0,1400)).toBe(false)
    congTongSoVaoHoSo(p,0,42,42)
    expect(()=>renKhienBangVang(p,1,1399)).toThrow(/vàng/)
  })
})

describe('Lên bảng hoàn toàn bằng nút bấm',()=>{
  it.each([false,true])('dayHoc=%s: không có đồng hồ, chờ bấm ở từng đợt',async(dayHoc)=>{
    const o=(i:number):OBang=>({sbd:`S${i}`,hoTen:`Học sinh ${i}`,soCau:i,cau:{id:`D-I-${i}`,maDe:'D',phan:'I',text:'Chọn đáp án đúng.',luaChon:['A','B','C','D'],dapAn:'A',sao:0,mucDo:'biet',chuyenDe:'Ester',dang:'bai_tap',chot:'Giải',lyDo:null,buoc:[],ketQua:'A'}})
    const errors:Error[]=[]
    const vc=new VirtualConsole();vc.on('jsdomError',e=>{if(!String(e).includes('Not implemented'))errors.push(e)})
    const dom=new JSDOM(taoHtmlMayChieu([o(1),o(2),o(3),o(4)],{dayHoc}),{runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){w.HTMLElement.prototype.scrollTo=function(){};w.HTMLCanvasElement.prototype.getContext=(()=>null) as never}})
    try{
      const d=dom.window.document
      expect(d.querySelector('#mc-clock')).toBeNull()
      expect(d.querySelector('#mc-buoi')).toBeNull()
      expect(d.querySelector('#mc-tien')).toBeNull()
      const first=d.querySelector('.mc-dot .mc-em') as HTMLElement
      expect(first.hidden).toBe(true)
      const btn=d.querySelector('#mc-len-bang') as HTMLButtonElement
      expect(btn.disabled).toBe(false)
      btn.click()
      expect(first.hidden).toBe(false)
      expect(btn.disabled).toBe(true)
      ;(d.querySelector('#mc-sau') as HTMLButtonElement).click()
      expect(btn.disabled).toBe(false)
      expect((d.querySelectorAll('.mc-dot')[1]!.querySelector('.mc-em') as HTMLElement).hidden).toBe(true)
      expect(errors).toEqual([])
    } finally {dom.window.close()}
  })
})
