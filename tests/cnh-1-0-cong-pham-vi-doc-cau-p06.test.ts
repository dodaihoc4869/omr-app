// @vitest-environment node
// P06/T42 — CỔNG PHẠM VI CÁ NHÂN áp cho ĐƯỜNG ĐỌC CÂU DÙNG CHUNG (`layCauChoEm` → `/hs/cau-theo-qid` và
// `/hs/on-lai/nop`): trước đây chỉ KẾ HOẠCH NGÀY lọc phạm vi; thử thách/ôn lấy câu theo qid là một "đường lùi"
// và KHÔNG được nới phạm vi. Cờ `pham_vi_hoc` BẬT mới lọc; TẮT ⇒ giữ nguyên hành vi cũ (test khoá cả hai chiều).
import { describe, expect, it } from 'vitest'
import { layCauChoEm } from '../server/src/cau-theo-qid'
import { capQuyen, ghiTaught as ghiTaughtThat, QUYEN_TOAN_CHUONG_TRINH } from '../server/src/pham-vi-hoc'
import { taoD1That, type D1That } from './_d1-that'

const MOC = '2026-09-23T05:00:00.000Z'

/** Kho 1 câu có nhãn kỹ năng K1 + em S1 ĐÃ GẶP câu đó (có dòng sổ) — nhưng CHƯA được dạy K1. */
function dung(): D1That {
  const d = taoD1That()
  d.sql.prepare("INSERT INTO de_kho(ma_de,ten_de,lop,so_cau,r2_khoa,da_xoa,cap_nhat_luc) VALUES('DE1','DE1','12',1,'k',0,'v1')").run()
  d.sql.prepare("INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('DE1','v1','x')").run()
  d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)')
    .run('DE1', 'Q1', 'v1', 'cg-Q1', 'A.1', JSON.stringify({ qid: 'Q1', group: 'cg-Q1', phan: 'I', mucDo: 'biet', kienThuc: ['K1'], reviewed: true, version: 'v1' }))
  d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES('S1','Em','12','mk','x')").run()
  d.sql.prepare("INSERT INTO su_kien_hoc(khoa,sbd,qid,nguon,ma_nguon,lan,ket_qua,giay,luc,ngay_vn) VALUES('k1','S1','Q1','game','SS',1,1,30,?, '2026-09-20')").run('2026-09-20T03:00:00.000Z')
  return d
}
const bat = (d: D1That, giaTri: string) =>
  d.sql.prepare("INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('pham_vi_hoc',?,'x') ON CONFLICT(khoa) DO UPDATE SET gia_tri=excluded.gia_tri").run(giaTri)

describe('P06/T42 — cổng phạm vi áp cho đường đọc câu dùng chung', () => {
  it('cờ TẮT (mặc định): hành vi cũ nguyên vẹn — em đã gặp thì vẫn lấy được câu', async () => {
    const d = dung()
    const r = await layCauChoEm(d.env, 'S1', ['Q1'])
    expect(r.cau.map((q) => q.qid)).toEqual(['Q1'])
    expect(r.khongCo).toEqual([])
  })

  it('cờ BẬT + kỹ năng CHƯA `taught` ⇒ KHÔNG phục vụ (không nới phạm vi qua đường lùi)', async () => {
    const d = dung()
    bat(d, 'bat')
    const r = await layCauChoEm(d.env, 'S1', ['Q1'])
    expect(r.cau).toEqual([])
    expect(r.khongCo).toEqual(['Q1'])
  })

  it('cờ BẬT + kỹ năng ĐÃ `taught` cho chính em ⇒ phục vụ bình thường; em khác chưa taught thì không', async () => {
    const d = dung()
    bat(d, 'bat')
    await ghiTaught(d.env, 'S1', 'K1', 'thay', 'GV01|BT01', MOC)
    const r = await layCauChoEm(d.env, 'S1', ['Q1'])
    expect(r.cau.map((q) => q.qid)).toEqual(['Q1'])
    // Em S2 chưa được dạy K1 ⇒ cùng câu đó KHÔNG phục vụ cho S2 (phạm vi TỪNG EM).
    d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES('S2','Em 2','12','mk','x')").run()
    d.sql.prepare("INSERT INTO su_kien_hoc(khoa,sbd,qid,nguon,ma_nguon,lan,ket_qua,luc,ngay_vn) VALUES('k2','S2','Q1','game','SS',1,0,'2026-09-20T03:00:00.000Z','2026-09-20')").run()
    const r2 = await layCauChoEm(d.env, 'S2', ['Q1'])
    expect(r2.cau).toEqual([])
  })

  it('cờ BẬT + quyền TOÀN CHƯƠNG TRÌNH do THẦY cấp ⇒ mở đúng theo quyền (máy khách không cấp được)', async () => {
    const d = dung()
    bat(d, 'bat')
    await capQuyen(d.env, 'S1', QUYEN_TOAN_CHUONG_TRINH, 'thay', 'GV01|Q01', MOC)
    const r = await layCauChoEm(d.env, 'S1', ['Q1'])
    expect(r.cau.map((q) => q.qid)).toEqual(['Q1'])
    // Nhưng nguồn lạ KHÔNG cấp được quyền (chặn ở tầng sản phẩm, không chỉ ở tầng UI).
    await expect(capQuyen(d.env, 'S2', QUYEN_TOAN_CHUONG_TRINH, 'may_khach', 'x', MOC)).rejects.toThrow()
  })
})

/** Dạy kỹ năng cho em bằng ĐƯỜNG SẢN PHẨM (`ghiTaught`) — cần nguồn hợp lệ + tham chiếu bằng chứng. */
async function ghiTaught(env: D1That['env'], sbd: string, skill: string, source: string, evidenceRef: string, moc: string): Promise<void> {
  await ghiTaughtThat(env, sbd, skill, source, evidenceRef, moc)
}
