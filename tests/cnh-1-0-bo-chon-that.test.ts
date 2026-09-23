// @vitest-environment node
// P04/P05 — ADAPTER DỮ LIỆU THẬT cho điểm §7.2 (`bo-chon-that.ts`): đọc `nam_kt_cau` thật, quy đổi
// trạng thái đợt dạy lại, lấy mức đang luyện từ bản dựng P03, rồi SẮP theo điểm — không phải mọi câu cùng điểm.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  chonCauChoLuot, docHoSoCau, locTheoLuatLap, mucDangLuyen, mucTheoKyNangCuaEm, trangThaiDotTuHoSoCau, xepLuotTheoChinhSach, type CauUngVien,
} from '../server/src/bo-chon-that'
import { giuCho, nhaCho } from '../server/src/giu-cho'
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
  qid, version: 'v1', part: 'I', mucDo: 'biet', group: `g-${qid}`, dangKey: 'A-'.concat(qid), skillIds: ['K1'],
  // NHÃN FAMILY: mặc định GẮN NHÃN RIÊNG cho từng câu (như kho sau khi có nhãn) để các phép đo khác không bị
  // trần "chưa gán family" (RV03) chi phối; nhánh thiếu nhãn có test RIÊNG bên dưới.
  familyId: `F-${qid}`, ...o,
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

  it('RV04 — MỌI kỹ năng đều được xét; thiếu hồ sơ = mức 0 (KHÔNG nâng trần); dữ liệu hỏng cũng về 0', () => {
    const known = new Map([['K1', 2], ['K2', 1], ['K3', 0]])
    expect(mucDangLuyen(cau('A', { skillIds: ['K1'] }), known)).toBe(2)
    expect(mucDangLuyen(cau('A', { skillIds: ['K1', 'K2'] }), known)).toBe(1) // lấy mức THẤP NHẤT
    // RV04 (rà soát độc lập 01): [2, kỹ năng CHƯA có hồ sơ] PHẢI là 0, không được 2.
    expect(mucDangLuyen(cau('A', { skillIds: ['K1', 'MISSING'] }), known)).toBe(0)
    expect(mucDangLuyen(cau('A', { skillIds: ['K1', 'K3'] }), known)).toBe(0) // [2, 0] ⇒ 0
    expect(mucDangLuyen(cau('A', { skillIds: ['MISSING-1', 'MISSING-2'] }), known)).toBe(0) // toàn thiếu hồ sơ
    expect(mucDangLuyen(cau('A', { skillIds: [] }), known)).toBe(0) // câu không có nhãn kỹ năng
    expect(mucDangLuyen(cau('A', { skillIds: ['NAN'] }), new Map([['NAN', Number.NaN]]))).toBe(0)
    expect(mucDangLuyen(cau('A', { skillIds: ['X'] }), new Map([['X', 2.5]]))).toBe(0) // không nguyên
    expect(mucDangLuyen(cau('A', { skillIds: ['X'] }), new Map([['X', 5]]))).toBe(0) // ngoài miền
    expect(mucDangLuyen(cau('A', { skillIds: ['X'] }), new Map([['X', -1]]))).toBe(0)
  })
})


describe('P04/P05 — điểm §7.2 chạy trên DỮ LIỆU THẬT (không còn mọi câu cùng điểm)', () => {
  it('câu `can_day_lai` (repairNeed 1) đứng TRƯỚC câu mới-sai (0,5) và điểm KHÁC NHAU', async () => {
    const d = dung()
    const hoSoCau = await docHoSoCau(d.env, 'S1', ['Q3', 'Q5'])
    const kq = await xepLuotTheoChinhSach([cau('Q3', { mucDo: 'hieu' }), cau('Q5', { mucDo: 'hieu' })], {
      sbd: 'S1', ngay: NGAY, mastery: [], mucTheoKyNang: new Map([['K1', 1]]), hoSoCau, nowMs: T0,
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

  it('P04/RV03: TRẦN FAMILY áp THẬT trên đường adapter — 3 câu CHƯA GẮN NHÃN ⇒ chỉ 1 câu được phát', async () => {
    const d = dung()
    const ds = Array.from({ length: 3 }, (_, i) => cau(`NO-FAMILY-${i}`, { familyId: null, group: `G${i}` }))
    const r = await locTheoLuatLap(d.env, 'S1', NGAY, ds, 6, { nowMs: T0 })
    expect(r.duocPhep.map((c) => c.qid)).toEqual(['NO-FAMILY-0']) // tối đa 1 câu chưa gán family mỗi lượt
    expect(r.loai.get('NO-FAMILY-1')).toBe('TRAN_CAU_CHUA_FAMILY')
    expect(r.loai.get('NO-FAMILY-2')).toBe('TRAN_CAU_CHUA_FAMILY')
  })

  it('P04/RV03: 3 câu KHÁC family (đã gắn nhãn) ⇒ phát được cả 3; cùng MỘT family ⇒ chỉ 1 câu thường', async () => {
    const d = dung()
    const khac = Array.from({ length: 3 }, (_, i) => cau(`L${i}`, { familyId: `F${i}`, group: `G${i}` }))
    const r1 = await locTheoLuatLap(d.env, 'S1', NGAY, khac, 6, { nowMs: T0 })
    expect(r1.duocPhep).toHaveLength(3)
    const cung = Array.from({ length: 3 }, (_, i) => cau(`S${i}`, { familyId: 'F-CHUNG', group: `GS${i}` }))
    const r2 = await locTheoLuatLap(d.env, 'S1', NGAY, cung, 6, { nowMs: T0 })
    expect(r2.duocPhep).toHaveLength(1)
    expect(r2.loai.get('S1')).toBe('TRAN_FAMILY')
    expect(r2.loai.get('S2')).toBe('TRAN_FAMILY')
  })

  it('P04: chặn cả BẢN SAO cùng `content_group` đã làm hôm nay (khác qid, cùng nhóm)', async () => {
    const d = dung()
    const dau = await locTheoLuatLap(d.env, 'S1', NGAY, [cau('Q3'), cau('Q9', { group: 'g-Q3' })], 6, { nowMs: T0 })
    expect(dau.loai.size).toBe(0)
    expect(dau.duocPhep.map((c) => c.qid)).toEqual(['Q3', 'Q9'])
    // Sau khi có kết quả hôm nay của nhóm 'g-Q3' (ghi qua sổ thật) ⇒ CẢ hai bị chặn.
    await ghiSuKien(d.env, [{ nguon: 'btvn', maNguon: 'M', sbd: 'S1', qid: 'Q3', lan: 1, ketQua: 1, luc: `${NGAY}T03:00:00.000Z` }])
    const sau = await locTheoLuatLap(d.env, 'S1', NGAY, [cau('Q4', { group: 'g-Q3' }), cau('Q5')], 6, { nowMs: T0 })
    expect(sau.duocPhep.map((c) => c.qid)).toEqual(['Q5'])
    expect(sau.loai.get('Q4')).toBe('DA_LAM_HOM_NAY')
  })

  it('P04/RV02: `content_group` đang có NHIỆM VỤ MỞ ⇒ TRẢ LẠI task cũ (không phát bản khác)', async () => {
    const d = dung()
    await giuCho(d.env, { sbd: 'S1', ngay: NGAY, taskId: 'TASK-DANG-MO', qids: ['Q3'], nowMs: T0, hanTaskGiay: 7200, nhomTheoQid: new Map([['Q3', 'g-Q3']]) })
    const r = await locTheoLuatLap(d.env, 'S1', NGAY, [cau('Q9', { group: 'g-Q3' })], 6, { nowMs: T0 })
    expect(r.duocPhep).toEqual([])
    expect(r.dungLai.get('Q9')).toBe('TASK-DANG-MO')
  })

  it('RV05: 6 câu ĐẦU quá khó, 2 câu CUỐI phù hợp ⇒ vẫn lấy được 2 câu phù hợp (không cắt pool trước khi lọc)', async () => {
    const d = dung()
    const ds = [
      ...Array.from({ length: 6 }, (_, i) => cau(`KHO${i}`, { mucDo: 'van_dung', group: `gK${i}`, familyId: `FK${i}` })),
      cau('VUA1', { mucDo: 'biet', group: 'gV1', familyId: 'FV1' }),
      cau('VUA2', { mucDo: 'biet', group: 'gV2', familyId: 'FV2' }),
    ]
    const kq = await chonCauChoLuot(d.env, ds, {
      sbd: 'S1', ngay: NGAY, nowMs: T0, mastery: [], mucTheoKyNang: new Map(), conLaiGiay: 600, tranCau: 6,
    })
    expect(kq.chon.map((c) => c.qid).sort()).toEqual(['VUA1', 'VUA2'])
    expect(kq.lyDo.DIFFICULTY_LIMIT).toBe(6)
  })
})

describe('P05 §7.1/§7.2 trên ĐƯỜNG THẬT (T08 · T10 · T12/T13)', () => {
  const muc2 = new Map([['K1', 2]])

  it('T08: ngân sách 600 giây, mỗi câu 300 giây (solve 240 + feedback 60) ⇒ ĐÚNG 2 câu, tổng ≤ 600, KHÔNG sàn 4/8', async () => {
    const d = dung()
    // Phần III mức Vận dụng: base 240 ⇒ solve 240 + feedback 60 = 300 giây/câu (đúng số liệu T08).
    const ds = Array.from({ length: 8 }, (_, i) => cau(`V${i}`, { part: 'III', mucDo: 'van_dung' }))
    const kq = await chonCauChoLuot(d.env, ds, {
      sbd: 'S1', ngay: NGAY, nowMs: T0, mastery: [], mucTheoKyNang: muc2, conLaiGiay: 600,
    })
    expect(kq.chon).toHaveLength(2)
    expect(kq.chon.every((c) => c.taskSeconds === 300)).toBe(true)
    expect(kq.chon.reduce((s, c) => s + c.taskSeconds, 0)).toBe(600)
    // Gói ≤6 câu (§7.2): trần lượt do VÒNG LẶP giữ (RV05) nên `TRAN_LUOT` KHÔNG xuất hiện trong bản đồ lý do.
    expect(kq.lyDo.TRAN_LUOT).toBeUndefined()
    // Còn 6 câu mà ngân sách chỉ chứa 2 ⇒ 4 câu bị hoãn, 1200 giây vượt tải được báo cho thầy.
    expect(kq.deferredCount).toBe(4)
    expect(kq.overBudgetSeconds).toBe(1200)
    expect(kq.lyDo.BUDGET_EXHAUSTED).toBe(1)
  })

  it('T08: ngân sách 599 giây ⇒ chỉ 1 câu; hoãn 1 câu với `over_budget_seconds` đúng (thầy thấy mức vượt tải)', async () => {
    const d = dung()
    const ds = [cau('V1', { part: 'III', mucDo: 'van_dung' }), cau('V2', { part: 'III', mucDo: 'van_dung' })]
    const kq = await chonCauChoLuot(d.env, ds, {
      sbd: 'S1', ngay: NGAY, nowMs: T0, mastery: [], mucTheoKyNang: muc2, conLaiGiay: 599,
    })
    expect(kq.chon.map((c) => c.qid)).toHaveLength(1)
    expect(kq.deferredCount).toBe(1)
    expect(kq.overBudgetSeconds).toBe(300)
  })

  it('T10: mức đang luyện 0 mà chỉ có câu difficulty 1, KHÔNG probe ⇒ 0 câu + lý do DIFFICULTY_LIMIT (không rút câu 1 để bù)', async () => {
    const d = dung()
    const ds = [cau('H1', { mucDo: 'hieu' })]
    const kq = await chonCauChoLuot(d.env, ds, {
      sbd: 'S1', ngay: NGAY, nowMs: T0, mastery: [], mucTheoKyNang: new Map(), conLaiGiay: 600,
    })
    expect(kq.chon).toEqual([])
    expect(kq.lyDo.DIFFICULTY_LIMIT).toBe(1)
  })

  it('T10: probe HỢP LỆ mở đúng +1 (không quá 2); câu khó hơn vẫn bị chặn', async () => {
    const d = dung()
    const ds = [cau('H1', { mucDo: 'hieu' }), cau('V1', { mucDo: 'van_dung' })]
    const co = await chonCauChoLuot(d.env, ds, {
      sbd: 'S1', ngay: NGAY, nowMs: T0, mastery: [], mucTheoKyNang: new Map(), conLaiGiay: 600, probeChoPhep: true,
    })
    expect(co.chon.map((c) => c.qid)).toEqual(['H1']) // +1 = difficulty 1; difficulty 2 vượt trần
    expect(co.lyDo.DIFFICULTY_LIMIT).toBe(1)
  })

  it('T12/T13: câu ĐANG BỊ GIỮ CHỖ (còn hạn) bị loại TRƯỚC khi chấm điểm; nhả chỗ thì trở lại', async () => {
    const d = dung()
    // Dùng câu CÓ THẬT trong kho fixture (Q3/Q5) để ánh xạ content_group hoạt động đúng như đường thật.
    const ds = [cau('Q3', { mucDo: 'biet', group: 'g-Q3' }), cau('Q5', { mucDo: 'biet', group: 'g-Q5' })]
    // Giữ chỗ theo ĐƠN VỊ NỘI DUNG (RV01): nhiệm vụ khác giữ nhóm của Q3, còn hiệu lực 2 giờ.
    await giuCho(d.env, { sbd: 'S1', ngay: NGAY, taskId: 'T-KHAC', qids: ['Q3'], nowMs: T0, hanTaskGiay: 7200, nhomTheoQid: new Map([['Q3', 'g-Q3']]) })
    const kq = await chonCauChoLuot(d.env, ds, { sbd: 'S1', ngay: NGAY, nowMs: T0, mastery: [], mucTheoKyNang: new Map(), conLaiGiay: 600 })
    expect(kq.chon.map((c) => c.qid)).toEqual(['Q5'])
    expect(kq.dungLaiTask.get('Q3')).toBe('T-KHAC') // nhiệm vụ còn hiệu lực ⇒ TRẢ LẠI task cũ (RV02)
    // Nhả chỗ ⇒ câu trở lại ứng viên.
    await nhaCho(d.env, 'S1', NGAY, 'T-KHAC')
    const sau = await chonCauChoLuot(d.env, ds, { sbd: 'S1', ngay: NGAY, nowMs: T0, mastery: [], mucTheoKyNang: new Map(), conLaiGiay: 600 })
    expect(sau.chon.map((c) => c.qid).sort()).toEqual(['Q3', 'Q5'])
  })
})
