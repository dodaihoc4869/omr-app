import {describe,it,expect} from 'vitest'
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
})
