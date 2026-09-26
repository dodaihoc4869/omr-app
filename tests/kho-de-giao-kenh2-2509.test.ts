// @vitest-environment node
// KẾ HOẠCH NGÀY (`chonCauBaiHangNgay`) — chỉ chọn câu trong đề đã giao (bước 3, 26/09/2026).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { chonCauBaiHangNgay } from '../server/src/parent-news-nguon-cau'
import { xoaDemKhoDeGiao } from '../server/src/kho-de-giao'
import { taoD1That, type D1That } from './_d1-that'
import { daHocDang } from './_pham-vi-ca-nhan'

const GIAO = '2026-10-01T00:00:00+07:00'
const HAN = '2026-10-10T00:00:00+07:00'
const TRONG = '2026-10-05T12:00:00+07:00'
const NOW = Date.parse(TRONG)
const MA_A = 'DH-12-CA-TN'
const MA_B = 'DH-12-CB-TN'
const DANG = 'ES.A'
const gio = (s: string) => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date(s)) }
const ghiGiao = (d: D1That) =>
  d.sql.prepare("INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('kho_de_giao',?,'x')").run(JSON.stringify({ ma: 'kho_de_giao', bat: true, khoi: 12, lop: '12', sbd: ['S1'], maDe: [MA_A], giaoLuc: GIAO, deadline: HAN }))
beforeEach(() => xoaDemKhoDeGiao())
afterEach(() => { vi.useRealTimers(); xoaDemKhoDeGiao() })

describe('Kế hoạch ngày — chonCauBaiHangNgay chỉ chọn câu trong đề đã giao', () => {
  function dung(): D1That {
    const d = taoD1That()
    d.sql.exec("INSERT INTO hoc_sinh(sbd,ho_ten,lop,cap_nhat_luc) VALUES('S1','Một','12','x')")
    for (const m of [MA_A, MA_B]) {
      d.sql.prepare('INSERT INTO de_kho(ma_de,ten_de,lop,so_cau,r2_khoa,da_xoa,cap_nhat_luc) VALUES(?,?,?,?,?,0,?)').run(m, m, '12', 2, `kho/${m}.json`, 'v1')
      d.sql.prepare("INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES(?,'v1','x')").run(m)
      for (let i = 1; i <= 2; i++) {
        const qid = `${m}-I-${i}`
        d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)').run(m, qid, 'v', `g-${qid}`, DANG, JSON.stringify({ qid, maDe: m, version: 'v', group: `g-${qid}`, phan: 'I', text: 'x', choices: ['A', 'B', 'C', 'D'], ideas: [], hinhAnh: [], dang: DANG, tenDang: 'A', mucDo: 'biet', sao: 0, kienThuc: ['A'], correct: 'B', solution: '', reviewed: true }))
      }
    }
    daHocDang(d, 'S1', DANG)
    d.sql.prepare("INSERT INTO nam_kt_dang(khoa,sbd,ma_dang,so_gap,so_sai,so_da_khac_phuc,so_moi_sai,so_chua_thay_sai,bac,cap_nhat_luc) VALUES('S1|ES.A','S1','ES.A',8,6,0,6,2,1,'x')").run()
    d.sql.prepare(`INSERT INTO nam_kt_cau(khoa,sbd,qid,ma_dang,lan_gap,lan_sai,lan_trong,dung_lien_tiep,ngay_dung_khac_nhau,ket_qua_cuoi,nguon_cuoi,luc_cuoi,moc_on_ke,trang_thai,can_day_lai,cap_nhat_luc) VALUES('S1|A','S1','${MA_A}-I-1','ES.A',1,1,0,0,0,0,'btvn','2026-09-01','2026-10-01','dang_on',0,'x')`).run()
    return d
  }
  it('trong danh sách + trong hạn ⇒ chọn được câu và CHỈ của tờ A', async () => {
    const d = dung(); ghiGiao(d); xoaDemKhoDeGiao(); gio(TRONG)
    const kq = await chonCauBaiHangNgay(d.env, 'S1', 6, NOW)
    expect(kq.chon.length).toBeGreaterThan(0)
    const ma = [...new Set(kq.chon.map((c) => c.qid.replace(/-I-\d+$/, '')))]
    expect(ma).toEqual([MA_A])
  })
  it('KHÔNG cấu hình ⇒ chọn được câu của CẢ HAI tờ (hành vi cũ)', async () => {
    const d = dung(); gio(TRONG)
    const kq = await chonCauBaiHangNgay(d.env, 'S1', 6, NOW)
    const ma = [...new Set(kq.chon.map((c) => c.qid.replace(/-I-\d+$/, '')))].sort()
    expect(ma).toEqual([MA_A, MA_B])
  })
})
