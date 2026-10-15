// @vitest-environment node
// A3 (quét 15/10): em có Gói 7 nhưng KHÔNG thuộc chiến dịch hành trình nào ⇒ `hs.chienDich` là null. Động cơ hành trình vẫn chạy (ghi=true)
// và trước đây nổ "Cannot read properties of null (reading 'id')" ở dòng ghi dự báo OMNI (`hs.chienDich!.id`) ⇒ sảnh của em báo lỗi.
// Luật: không có chiến dịch thì KHÔNG ghi `omni_du_bao` (khoá dự báo theo mã chiến dịch), mọi việc khác ghi như cũ.
import { describe,expect,it } from 'vitest'
import { dongCoHanhTrinh } from '../server/src/hanh-trinh-dong-co'
import { taoKhoOmni,lam,T_SANG,HOM_NAY,themChienDich } from './omni-3-ke-hoach-chung'
import { docHoSo2 } from '../server/src/srs2-d1'
import { dongBoBaHanhTrinh } from '../server/src/hanh-trinh-hop-nhat'

const DAY=86_400_000

describe('động cơ hành trình — em không thuộc chiến dịch',()=>{
  it('không nổ, vẫn ghi bộ đệm động cơ, không ghi dự báo OMNI',async()=>{
    const k=taoKhoOmni({'DH-B0':0,'DH-B1':40,'DH-B2':0,'DH-B3':0,'KHO-A':0})
    themChienDich(k.d,{id:'nguon',sbd:['S1'],maDe:['DH-B1'],qids:k.qids('DH-B1'),taoLuc:'2026-10-01T02:00:00Z',hanNop:'2026-10-09'})
    await dongBoBaHanhTrinh(k.env,T_SANG)
    await lam(k.env,'S1','DH-B1-0',T_SANG-DAY,false,{assistance:'none',purpose:'maintenance'})
    const hs=await docHoSo2(k.env,'S1',HOM_NAY)
    const engine=await dongCoHanhTrinh(k.env,'S1',T_SANG,{...hs,chienDich:null})
    expect(engine.soQuanSat).toBe(1)
    expect(k.d.sql.prepare('SELECT COUNT(*) n FROM hanh_trinh_v4_em').get()).toEqual({n:1})
    expect(k.d.sql.prepare('SELECT COUNT(*) n FROM omni_du_bao').get()).toEqual({n:0})
    k.d.sql.close()
  })
})
