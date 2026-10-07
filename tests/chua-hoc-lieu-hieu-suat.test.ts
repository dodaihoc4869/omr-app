// @vitest-environment node
import {describe,it,expect,vi} from 'vitest'
import {taoD1That} from './_d1-that'
import {seedChua,Q} from './_chua-cau-sai-fixture'
import {moDot,phatItem,nopItem} from '../server/src/chua-cau-sai'
import {xoaDemCaBaoVe} from '../server/src/game-v2-bank'
import {soanHieuSuat,QID_HIEU_SUAT,VERSION_HIEU_SUAT} from '../scripts/loi-giai/soan-mau-hieu-suat'
import {giaiDeHieuSuat} from '../scripts/loi-giai/kiem-doc-lap-hieu-suat'
import {deChoKiemMu,probeDuyNhat} from '../server/src/chua-hoc-lieu-kiem-may'
import {kiemTinhDayDu} from '../server/src/chua-cau-sai-hoc-lieu'
import {chamProbe} from '../server/src/chua-cau-sai-phien'
import type {PrivateQuestion} from '../src/game/than-thu-v2/core'
const root={qid:QID_HIEU_SUAT,version:VERSION_HIEU_SUAT,phan:'III',reviewed:true} as PrivateQuestion
describe('Bộ chữa hiệu suất ester từ nguồn thật',()=>{
  it('chỉ sinh cho câu và phiên bản đã soát',()=>{
    expect(soanHieuSuat({...root,version:'khac'})).toBeNull()
    expect(soanHieuSuat({...root,qid:'cau-khac'})).toBeNull()
    expect(soanHieuSuat({...root,reviewed:false})).toBeNull()
  })
  it('đủ ba bước, câu xác nhận, lý do, chuyển giao và bốn bản toàn bài',()=>{
    const h=soanHieuSuat(root)!
    expect(kiemTinhDayDu(h)).toEqual([])
    expect(h.buoc).toHaveLength(3)
  })
  it('bộ giải riêng đọc đề và tính lại đúng mọi câu, kể cả sau hoán vị mã',()=>{
    const h=soanHieuSuat(root)!
    for(const p of probeDuyNhat(h)){
      const d=deChoKiemMu(p),r=giaiDeHieuSuat(d)
      expect(r,p.qid).not.toBeNull()
      expect(chamProbe(p,r!.dapAn),p.qid).toBe(true)
      if(d.noiDung.luaChon){
        const old=d.noiDung.luaChon.find(x=>x.ky===r!.dapAn)!.noi
        d.noiDung.luaChon=d.noiDung.luaChon.reverse().map((x,i)=>({...x,ky:'ABCD'[i]}))
        const again=giaiDeHieuSuat(d)!
        expect(d.noiDung.luaChon.find(x=>x.ky===again.dapAn)?.noi).toBe(old)
      }
    }
  })
  it('đổi dữ kiện phải tính đáp án mới; không sao lại đáp án cũ',()=>{
    const d=deChoKiemMu(soanHieuSuat(root)!.banKiemChung[0])
    const before=giaiDeHieuSuat(d)!.dapAn
    d.noiDung.hoi=d.noiDung.hoi.replace('Thu được 11 g','Thu được 8 g')
    expect(giaiDeHieuSuat(d)!.dapAn).not.toBe(before)
  })
  it('dữ kiện ngoài phạm vi hoặc hiệu suất >100% không được tự duyệt',()=>{
    const d=deChoKiemMu(soanHieuSuat(root)!.banKiemChung[0])
    d.noiDung.hoi=d.noiDung.hoi.replace('Thu được 11 g','Thu được 100 g')
    expect(giaiDeHieuSuat(d)).toBeNull()
    d.noiDung.hoi='Bài khác chưa có bộ giải độc lập.'
    expect(giaiDeHieuSuat(d)).toBeNull()
  })
  it('học sinh đi đủ ba bước sau xác nhận lỗi, ghép bài rồi tự kiểm sau 24 giờ',async()=>{
    vi.useFakeTimers({toFake:['Date']})
    const time=Date.parse('2026-10-07T03:00:00Z');vi.setSystemTime(time);xoaDemCaBaoVe()
    const d=taoD1That()
    try{
      const token=await seedChua(d.env),h=soanHieuSuat(root)!
      // Lớp/đề/đợt lỗi tổng hợp của fixture; gắn nội dung thật vào cùng hợp đồng phiên bản.
      h.qidGoc=Q;h.contentVersion='v1'
      await d.env.DB.prepare('UPDATE chua_loi_hoc_lieu SET hoc_lieu_json=? WHERE qid_chuan=?').bind(JSON.stringify(h),Q).run()
      const start=await moDot(d.env,{token,qid:Q}),dotId=(await start.json()).dotId
      expect(start.status).toBe(200)
      let wrong=0,passed=0
      for(let i=0;i<24;i++){
        const response=await phatItem(d.env,{token,dotId,tiep:true}),p=await response.json()
        expect(response.status).toBe(200)
        expect(JSON.stringify(p)).not.toMatch(/dapAn|bamDe|luotKiem|probeXacNhan/)
        if(p.trangThai==='cho_gap_lai_2')break
        const item=p.item
        expect(item).toBeTruthy()
        let answer
        if(wrong===0&&item.loai==='chan_doan'){answer='0,1';wrong++}
        else if(wrong===1&&item.loai==='phan_biet'){answer='A';wrong++}
        else {
          const solved=giaiDeHieuSuat({qid:'cong-khai',phienBan:'test',phan:item.kieu==='so'?'III':'I',noiDung:{hoi:item.hoi,kieu:item.kieu,...(item.luaChon ? {luaChon:item.luaChon}: {})}})
          expect(solved,item.hoi).not.toBeNull();answer=solved!.dapAn
        }
        const receipt=await nopItem(d.env,{token,dotId,itemId:item.id,attemptId:crypto.randomUUID(),traLoi:answer}),result=await receipt.json()
        expect(receipt.status).toBe(200)
        if(item.loai==='phan_biet'){expect(result.diemlech).toContain('mL');expect(result.hanhDongTiep).toContain('V×D')}
        if(result.dung)passed++
      }
      const waiting=await (await phatItem(d.env,{token,dotId,tiep:true})).json()
      expect(waiting.trangThai).toBe('cho_gap_lai_2')
      expect(waiting.item).toBeNull();expect(waiting.tienDo.soBuocDaQua).toBe(3)
      vi.setSystemTime(time+24*3600000+1)
      const second=await (await phatItem(d.env,{token,dotId,tiep:true})).json(),item=second.item
      expect(item.loai).toBe('kiem_chung')
      const solved=giaiDeHieuSuat({qid:'cong-khai',phienBan:'test',phan:'III',noiDung:{hoi:item.hoi,kieu:item.kieu}})!
      const done=await (await nopItem(d.env,{token,dotId,itemId:item.id,attemptId:crypto.randomUUID(),traLoi:solved.dapAn})).json()
      expect(done.trangThaiMoi).toBe('da_tu_sua');expect(passed).toBeGreaterThanOrEqual(11)
    }finally{d.sql.close();vi.useRealTimers();xoaDemCaBaoVe()}
  })

})
