// @vitest-environment node
// P05 (02 §5.1) — MẪU TỐC ĐỘ THẬT theo part × mức cho bộ ước lượng: đọc từ SỔ `su_kien_hoc`, chỉ nhận mẫu
// ĐỘC LẬP (`assistance = 'none'`) và ĐÃ CÔNG BỐ (không `embargoed`), lấy `part` từ chính kho câu đã phục vụ.
import { beforeEach, describe, expect, it } from 'vitest'
import { docMauTocDo, docNganSachConLai, TRAN_DONG_MAU } from '../server/src/ngan-sach-luot'
import { taoD1That, type D1That } from './_d1-that'

const NGAY = '2026-09-23'
const T0 = Date.parse('2026-09-23T12:00:00+07:00')

/** Kho 2 câu (Phần I mức Hiểu · Phần III mức Vận dụng) đã phục vụ + kế hoạch ngày 10 phút. */
function dung(): D1That {
  const d = taoD1That()
  d.sql.prepare("INSERT INTO de_kho(ma_de,ten_de,lop,so_cau,r2_khoa,da_xoa,cap_nhat_luc) VALUES('DE1','DE1','12',2,'k',0,'v1')").run()
  d.sql.prepare("INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('DE1','v1','x')").run()
  const ins = d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)')
  ins.run('DE1', 'Q1', 'v1', 'g1', 'A.1', JSON.stringify({ qid: 'Q1', phan: 'I', mucDo: 'hieu', kienThuc: ['K1'], reviewed: true }))
  ins.run('DE1', 'Q3', 'v1', 'g3', 'A.1', JSON.stringify({ qid: 'Q3', phan: 'III', mucDo: 'van_dung', kienThuc: ['K1'], reviewed: true }))
  d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES('S1','Em','12','mk','x')").run()
  d.sql.prepare("INSERT INTO ke_hoach_ngay(khoa,sbd,ngay,phien_ban,seed,ngan_sach_json,viec_json,canh_bao_json,cap_nhat_luc) VALUES(?,?,?,?,?,?,?,?,?)")
    .run(`S1|${NGAY}`, 'S1', NGAY, 2, 1, JSON.stringify({ phutNgay: 10 }), '[]', '[]', 'x')
  return d
}

/** Ghi một dòng sổ với đầy đủ dấu hỗ trợ/công bố. */
function ghi(d: D1That, o: { qid: string; giay: number; luc: string; assistance?: string; visibility?: string; mucDo?: string }) {
  d.sql.prepare(
    'INSERT INTO su_kien_hoc(khoa,sbd,qid,nguon,ma_nguon,lan,ket_qua,giay,luc,ngay_vn,ma_dang,chuyen_de,muc_do,assistance,visibility) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
  ).run(`k|${o.qid}|${o.luc}`, 'S1', o.qid, 'game', 'SS1', 1, 1, o.giay, o.luc, o.luc.slice(0, 10), 'A.1', '', o.mucDo ?? '', o.assistance ?? 'none', o.visibility ?? 'released')
}

describe('P05 — mẫu tốc độ theo part × mức (sổ thật)', () => {
  beforeEach(() => { /* giờ do tham số truyền, không phụ thuộc đồng hồ */ })

  it('đọc mẫu ĐỘC LẬP và gán ĐÚNG part × difficulty từ kho', async () => {
    const d = dung()
    ghi(d, { qid: 'Q1', giay: 140, luc: '2026-09-22T03:00:00.000Z' })
    ghi(d, { qid: 'Q1', giay: 160, luc: '2026-09-21T03:00:00.000Z' })
    ghi(d, { qid: 'Q3', giay: 300, luc: '2026-09-22T04:00:00.000Z', mucDo: 'van_dung' })
    const mau = await docMauTocDo(d.env, 'S1', NGAY)
    expect(mau).toHaveLength(3)
    const q1 = mau.filter((m) => m.part === 'I')
    expect(q1.every((m) => m.difficulty === 1)).toBe(true) // 'hieu' ⇒ 1
    expect(q1.map((m) => m.activeSeconds).sort()).toEqual([140, 160])
    expect(mau.find((m) => m.part === 'III')!.difficulty).toBe(2) // 'van_dung' ⇒ 2
    expect(mau.every((m) => m.docLap === true && m.daNop === true)).toBe(true)
    expect(mau.every((m) => m.lucMs! > 0)).toBe(true)
  })

  it('LOẠI mẫu CÓ HỖ TRỢ và mẫu đang EMBARGO (không dùng số đo không hợp lệ)', async () => {
    const d = dung()
    ghi(d, { qid: 'Q1', giay: 150, luc: '2026-09-22T03:00:00.000Z' })
    ghi(d, { qid: 'Q1', giay: 500, luc: '2026-09-22T05:00:00.000Z', assistance: 'assisted' })
    ghi(d, { qid: 'Q1', giay: 500, luc: '2026-09-22T06:00:00.000Z', visibility: 'embargoed' })
    ghi(d, { qid: 'Q1', giay: 500, luc: '2026-09-22T07:00:00.000Z', assistance: 'unknown' })
    const mau = await docMauTocDo(d.env, 'S1', NGAY)
    expect(mau).toHaveLength(1)
    expect(mau[0]!.activeSeconds).toBe(150)
  })

  it('cửa sổ 30 ngày: mẫu cũ hơn bị bỏ', async () => {
    const d = dung()
    ghi(d, { qid: 'Q1', giay: 150, luc: '2026-09-22T03:00:00.000Z' })
    ghi(d, { qid: 'Q1', giay: 150, luc: '2026-07-01T03:00:00.000Z' }) // > 30 ngày
    const mau = await docMauTocDo(d.env, 'S1', NGAY)
    expect(mau).toHaveLength(1)
    expect(mau[0]!.lucMs).toBe(Date.parse('2026-09-22T03:00:00.000Z'))
  })

  it('`docNganSachConLai` trả mẫu THẬT (không còn luôn rỗng) + nói rõ khi chưa có mẫu', async () => {
    const d = dung()
    const chua = await docNganSachConLai(d.env, 'S1', NGAY)
    expect(chua!.mau).toEqual([])
    expect(chua!.ghiChu).toContain('hệ số 1')
    ghi(d, { qid: 'Q1', giay: 150, luc: '2026-09-22T03:00:00.000Z' })
    const co = await docNganSachConLai(d.env, 'S1', NGAY)
    expect(co!.mau).toHaveLength(1)
    expect(co!.ghiChu).toBe('')
    expect(co!.nganSachGiay).toBe(600) // 10 phút
    void T0
    void TRAN_DONG_MAU
  })
})
