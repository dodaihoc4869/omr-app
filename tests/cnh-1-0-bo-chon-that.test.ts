// @vitest-environment node
// P04/P05 — ADAPTER DỮ LIỆU THẬT cho điểm §7.2 (`bo-chon-that.ts`): đọc `nam_kt_cau` thật, quy đổi
// trạng thái đợt dạy lại, lấy mức đang luyện từ bản dựng P03, rồi SẮP theo điểm — không phải mọi câu cùng điểm.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  docHoSoCau, locTheoLuatLap, mucDangLuyen, mucTheoKyNangCuaEm, trangThaiDotTuHoSoCau, xepLuotTheoChinhSach, type CauUngVien,
} from '../server/src/bo-chon-that'
import { taoD1That } from './_d1-that'
import { dungLaiNangLuc, xoaBietCotChuanNL, xoaDemNangLuc } from '../server/src/nang-luc-d1'
import { ghiSuKien, xoaBietCotChuan } from '../server/src/su-kien-hoc'

const T0 = Date.parse('2026-09-22T12:00:00+07:00')
const NGAY = '2026-09-22'
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(T0)
  xoaBietCotChuan(); xoaBietCotChuanNL(); xoaDemNangLuc()
})
afterEach(() => vi.useRealTimers())

const cau = (qid: string, o: Partial<CauUngVien> = {}): CauUngVien => ({
  qid, version: 'v1', part: 'I', mucDo: 'hieu', group: `g-${qid}`, dangKey: 'A.1', skillIds: ['K1'], ...o,
})

/** Kho nhỏ + hồ sơ per-câu (can_day_lai) cho hai câu. */
function dung() {
  const d = taoD1That()
  d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES('S1','Em','12','mk','x')").run()
  d.sql.prepare("INSERT INTO de_kho(ma_de,ten_de,lop,so_cau,r2_khoa,da_xoa,cap_nhat_luc) VALUES('DE1','DE1','12',2,'k',0,'v1')").run()
  d.sql.prepare("INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('DE1','v1','x')").run()
  for (const qid of ['Q3', 'Q5']) {
    d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)')
      .run('DE1', qid, 'v1', `g-${qid}`, 'A.1', JSON.stringify({ qid, group: `g-${qid}`, kienThuc: ['K1'], mucDo: 'hieu' }))
  }
  const them = d.sql.prepare(
    'INSERT INTO nam_kt_cau(khoa,sbd,qid,chuyen_de,lan_gap,lan_sai,lan_trong,dung_lien_tiep,ngay_dung_khac_nhau,nguon_cuoi,luc_cuoi,trang_thai,can_day_lai,cap_nhat_luc) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
  )
  them.run('S1|Q3', 'S1', 'Q3', '', 3, 3, 0, 0, 0, 'btvn', '2026-09-20T03:00:00.000Z', 'moi_sai', 1, 'x')
  them.run('S1|Q5', 'S1', 'Q5', '', 2, 2, 0, 1, 1, 'btvn', '2026-09-21T03:00:00.000Z', 'da_khac_phuc', 0, 'x')
  return d
}

describe('P04/P05 — adapter đọc dữ liệu THẬT cho điểm §7.2', () => {
  it('`docHoSoCau` đọc đúng can_day_lai/trang_thai của đúng các câu hỏi', async () => {
    const d = dung()
    const m = await docHoSoCau(d.env, 'S1', ['Q3', 'Q5', 'Q-KHONG-CO'])
    expect(m.get('Q3')).toEqual({ trangThai: 'moi_sai', canDayLai: true })
    expect(m.get('Q5')).toEqual({ trangThai: 'da_khac_phuc', canDayLai: false })
    expect(m.has('Q-KHONG-CO')).toBe(false)
  })

  it('quy đổi trạng thái: can_day_lai ⇒ needs_teaching · moi_sai ⇒ practicing · da_khac_phuc ⇒ recovered · còn lại null', () => {
    expect(trangThaiDotTuHoSoCau({ trangThai: 'moi_sai', canDayLai: true })).toBe('needs_teaching')
    expect(trangThaiDotTuHoSoCau({ trangThai: 'moi_sai', canDayLai: false })).toBe('practicing')
    expect(trangThaiDotTuHoSoCau({ trangThai: 'da_khac_phuc', canDayLai: false })).toBe('recovered')
    expect(trangThaiDotTuHoSoCau({ trangThai: 'dang_on', canDayLai: false })).toBeNull()
    expect(trangThaiDotTuHoSoCau(undefined)).toBeNull()
  })

  it('mức đang luyện của câu = mức THẤP NHẤT trong các kỹ năng; thiếu hồ sơ ⇒ 0 (không bịa mức)', () => {
    const c = cau('Q', { skillIds: ['K1', 'K2'] })
    expect(mucDangLuyen(c, new Map([['K1', 2], ['K2', 1]]))).toBe(1)
    expect(mucDangLuyen(c, new Map())).toBe(0)
  })
})


describe('P04/P05 — điểm §7.2 chạy trên DỮ LIỆU THẬT (không còn mọi câu cùng điểm)', () => {
  it('câu `can_day_lai` (repairNeed 1) đứng TRƯỚC câu mới-sai (0,5) và điểm KHÁC NHAU', async () => {
    const d = dung()
    const hoSoCau = await docHoSoCau(d.env, 'S1', ['Q3', 'Q5'])
    const kq = await xepLuotTheoChinhSach([cau('Q3'), cau('Q5')], {
      sbd: 'S1', ngay: NGAY, mastery: [], mucTheoKyNang: new Map(), hoSoCau, nowMs: T0,
    })
    const q3 = kq.theoQid.get('Q3')!, q5 = kq.theoQid.get('Q5')!
    expect(kq.xep.map((x) => x.qid)).toEqual(['Q3', 'Q5']) // needs_teaching (1) trước recovered (0,5)
    expect(q3.diem.repairNeed).toBe(1)
    expect(q5.diem.repairNeed).toBe(0.5)
    expect(q3.diem.score).toBeGreaterThan(q5.diem.score)
    expect(q5.diem.repairNeed).toBe(0.5)
    expect(q3.diem.score).toBeGreaterThan(q5.diem.score)
    expect(q3.taskSeconds).toBe(135) // Phần I mức Hiểu: 105 + 30
    expect(q3.taskSeconds).toBe(q5.taskSeconds)
  })

  it('mốc ôn THẬT (mastery đến hạn) làm `reviewNeed` > 0 và nâng câu đó lên đầu', async () => {
    const d = dung()
    const hoSoCau = await docHoSoCau(d.env, 'S1', ['Q3', 'Q5'])
    const kq = await xepLuotTheoChinhSach([cau('Q5', { dangKey: 'A.1' }), cau('Q3', { dangKey: 'B.2' })], {
      sbd: 'S1', ngay: NGAY, mastery: [{ key: 'B.2', due: T0 - 86_400_000 }], mucTheoKyNang: new Map(), hoSoCau, nowMs: T0,
    })
    expect(kq.theoQid.get('Q3')!.diem.reviewNeed).toBeGreaterThan(0)
    expect(kq.theoQid.get('Q5')!.diem.reviewNeed).toBe(0)
    expect(kq.xep[0]!.qid).toBe('Q3')
  })

  it('mức đang luyện ĐỔI `fit`: câu mức 0 khi working 2 ⇒ fit 0,6 (không đoán bừa)', async () => {
    const d = dung()
    const hoSoCau = await docHoSoCau(d.env, 'S1', ['Q3', 'Q5'])
    const kq = await xepLuotTheoChinhSach([cau('Q3', { mucDo: 'biet' }), cau('Q5', { mucDo: 'biet' })], {
      sbd: 'S1', ngay: NGAY, mastery: [], mucTheoKyNang: new Map([['K1', 2]]), hoSoCau, nowMs: T0,
    })
    expect(kq.theoQid.get('Q3')!.diem.fit).toBe(0.6)
  })

  it('P04: chặn cả BẢN SAO cùng `content_group` đã làm hôm nay (khác qid, cùng nhóm)', async () => {
    const d = dung()
    const daLam = await locTheoLuatLap(d.env, 'S1', NGAY, [cau('Q3'), cau('Q9', { group: 'g-Q3' })], 6)
    expect(daLam.loai.get('Q9')).toBeUndefined()
    expect(daLam.giu.has('Q3')).toBe(true)
    expect(daLam.giu.has('Q9')).toBe(true)
    // Sau khi có kết quả hôm nay của nhóm 'g-Q3' (ghi qua sổ thật) ⇒ CẢ hai bị chặn.
    await ghiSuKien(d.env, [{ nguon: 'btvn', maNguon: 'M', sbd: 'S1', qid: 'Q3', lan: 1, ketQua: 1, luc: `${NGAY}T03:00:00.000Z` }])
    const sau = await locTheoLuatLap(d.env, 'S1', NGAY, [cau('Q4', { group: 'g-Q3' }), cau('Q5')], 6)
    expect(sau.giu.has('Q4')).toBe(false)
    expect(sau.loai.get('Q4')).toBe('DA_LAM_HOM_NAY')
    expect(sau.giu.has('Q5')).toBe(true)
  })

  it('P04: trần số câu của lượt được áp theo đúng thứ tự nơi gọi đưa vào', async () => {
    const d = dung()
    const ds = Array.from({ length: 8 }, (_, i) => cau(`X${i}`))
    const r = await locTheoLuatLap(d.env, 'S1', NGAY, ds, 6)
    expect([...r.giu]).toHaveLength(6)
    expect(r.loai.get('X6')).toBe('TRAN_LUOT')
    expect(r.loai.get('X7')).toBe('TRAN_LUOT')
  })

  it('P04: luật FAMILY (1 câu/family, chưa gán family ≤1) CHƯA ÁP vì kho chưa có nhãn — KHÔNG hạ lượt xuống 1 câu', async () => {
    const d = dung()
    const ds = Array.from({ length: 6 }, (_, i) => cau(`Y${i}`, { group: `g-Y${i}` }))
    const r = await locTheoLuatLap(d.env, 'S1', NGAY, ds, 6)
    expect([...r.giu]).toHaveLength(6) // 6 câu "chưa gán family" VẪN qua được (đây là phần chờ dữ liệu nhãn)
    expect(r.loai.size).toBe(0)
  })
})
