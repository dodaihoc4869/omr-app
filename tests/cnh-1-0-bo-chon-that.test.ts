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

  it('P04/RV03: TRẦN FAMILY áp THẬT trên đường phát câu — 3 câu CHƯA GẮN NHÃN ⇒ lượt chỉ 1 câu', async () => {
    const d = dung()
    const ds = Array.from({ length: 3 }, (_, i) => cau(`NO-FAMILY-${i}`, { familyId: null, group: `G${i}` }))
    const kq = await chonCauChoLuot(d.env, ds, { sbd: 'S1', ngay: NGAY, nowMs: T0, mastery: [], mucTheoKyNang: new Map(), conLaiGiay: 600 })
    expect(kq.chon).toHaveLength(1) // tối đa 1 câu chưa gán family mỗi lượt
    expect(ds.map((c) => c.qid)).toContain(kq.chon[0]!.qid) // chọn câu nào do ĐIỂM/hash quyết định, không do thứ tự pool
    expect(kq.lyDo.TRAN_CAU_CHUA_FAMILY).toBe(2)
  })

  it('P04/RV03: 3 câu KHÁC family ⇒ phát được cả 3; cùng MỘT family ⇒ chỉ 1 câu thường', async () => {
    const d = dung()
    const khac = Array.from({ length: 3 }, (_, i) => cau(`L${i}`, { familyId: `F${i}`, group: `G${i}` }))
    const kq1 = await chonCauChoLuot(d.env, khac, { sbd: 'S1', ngay: NGAY, nowMs: T0, mastery: [], mucTheoKyNang: new Map(), conLaiGiay: 600 })
    expect(kq1.chon).toHaveLength(3)
    const cung = Array.from({ length: 3 }, (_, i) => cau(`S${i}`, { familyId: 'F-CHUNG', group: `GS${i}` }))
    const kq2 = await chonCauChoLuot(d.env, cung, { sbd: 'S1', ngay: NGAY, nowMs: T0, mastery: [], mucTheoKyNang: new Map(), conLaiGiay: 600 })
    expect(kq2.chon).toHaveLength(1)
    expect(kq2.lyDo.TRAN_FAMILY).toBe(2)
  })

  it('RV03b: kho ghi nhãn bằng `familyId` (không phải `family`) ⇒ lịch sử family VẪN được đọc và chặn đúng', async () => {
    const d = dung()
    // Kho dùng khoá `familyId`; câu Q9 khác content_group nhưng CÙNG family FX với câu đã làm hôm nay (Q3).
    d.sql.prepare("INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES('DE1','Q9','v1','g-Q9','A.1',?)")
      .run(JSON.stringify({ qid: 'Q9', group: 'g-Q9', kienThuc: ['K1'], mucDo: 'biet', familyId: 'FX', version: 'v1' }))
    d.sql.prepare("UPDATE game_v2_question SET json = json_set(json, '$.familyId', 'FX') WHERE qid = 'Q3'").run()
    await ghiSuKien(d.env, [{ nguon: 'game', maNguon: 'S', sbd: 'S1', qid: 'Q3', lan: 1, ketQua: 1, luc: `${NGAY}T03:00:00.000Z` }])
    const r = await locTheoLuatLap(d.env, 'S1', NGAY, [cau('Q9', { familyId: 'FX', group: 'g-Q9' })], 6, { nowMs: T0 })
    expect(r.loai.get('Q9')).toBe('FAMILY_VUA_LAM') // đọc được lịch sử family từ khoá `familyId`
    expect(r.duocPhep).toEqual([])
  })

  it('RV03: LỊCH SỬ FAMILY THẬT từ sổ — family vừa làm HÔM NAY bị chặn (trừ khi đến hạn/repair)', async () => {
    const d = dung()
    // Q3 có nhãn family FX; em đã có kết quả HÔM NAY của chính Q3 ⇒ family vừa làm hôm nay.
    await ghiSuKien(d.env, [{ nguon: 'game', maNguon: 'S', sbd: 'S1', qid: 'Q3', lan: 1, ketQua: 1, luc: `${NGAY}T03:00:00.000Z` }])
    d.sql.prepare("UPDATE game_v2_question SET json = json_set(json, '$.family', 'FX') WHERE qid = 'Q3'").run()
    const khongDenHan = await locTheoLuatLap(d.env, 'S1', NGAY, [cau('Q3', { familyId: 'FX', dangKey: 'KHAC' })], 6, { nowMs: T0 })
    // Q3 đã làm hôm nay ⇒ bị chặn bởi luật lặp trước cả luật giãn family (vẫn là chặn, không phát lại).
    expect(khongDenHan.duocPhep).toEqual([])
    // Câu KHÁC cùng family FX (khác content_group, chưa làm hôm nay) ⇒ luật GIÃN FAMILY chặn vì family vừa làm hôm nay.
    d.sql.prepare("INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES('DE1','Q9','v1','g-Q9','A.1',?)")
      .run(JSON.stringify({ qid: 'Q9', group: 'g-Q9', kienThuc: ['K1'], mucDo: 'biet', family: 'FX', version: 'v1' }))
    const giangCach = await locTheoLuatLap(d.env, 'S1', NGAY, [cau('Q9', { familyId: 'FX', group: 'g-Q9' })], 6, { nowMs: T0 })
    expect(giangCach.loai.get('Q9')).toBe('FAMILY_VUA_LAM')
    expect(giangCach.duocPhep).toEqual([])
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

  it('RV05a — ĐẢO THỨ TỰ pool: cùng tập ứng viên ⇒ cùng tập được chọn (không phụ thuộc thứ tự vào)', async () => {
    const d = dung()
    const ds = [
      cau('A1', { mucDo: 'biet', group: 'gA1', familyId: 'FA1' }),
      cau('A2', { mucDo: 'biet', group: 'gA2', familyId: 'FA2' }),
      cau('A3', { mucDo: 'biet', group: 'gA3', familyId: 'FA3' }),
      cau('A4', { mucDo: 'biet', group: 'gA4', familyId: 'FA4' }),
    ]
    const inp = { sbd: 'S1', ngay: NGAY, nowMs: T0, mastery: [], mucTheoKyNang: new Map(), conLaiGiay: 600 } as const
    const kq1 = await chonCauChoLuot(d.env, ds, { ...inp })
    const kq2 = await chonCauChoLuot(d.env, [...ds].reverse(), { ...inp })
    expect([...kq1.chon.map((c) => c.qid)].sort()).toEqual([...kq2.chon.map((c) => c.qid)].sort())
    expect(kq1.chon.map((c) => c.qid)).toEqual(kq2.chon.map((c) => c.qid)) // cả THỨ TỰ (do điểm + hash quyết định)
  })

  it('RV05b — 6 câu đầu HỢP MỨC nhưng KHÔNG vừa ngân sách, câu thứ 7 vừa ⇒ PHẢI trả câu thứ 7 (không rỗng)', async () => {
    const d = dung()
    const ds = [
      ...Array.from({ length: 6 }, (_, i) => cau(`DAI${i}`, { part: 'III', mucDo: 'van_dung', group: `gD${i}`, familyId: `FD${i}` })),
      cau('NGAN', { part: 'I', mucDo: 'biet', group: 'gN', familyId: 'FN' }),
    ]
    // Mức đang luyện 2 ⇒ 6 câu Phần III mức Vận dụng HỢP MỨC; mỗi câu ~300 giây; ngân sách chỉ 120 giây.
    const kq = await chonCauChoLuot(d.env, ds, {
      sbd: 'S1', ngay: NGAY, nowMs: T0, mastery: [], mucTheoKyNang: new Map([['K1', 2]]), conLaiGiay: 120, tranCau: 6,
    })
    expect(kq.chon.map((c) => c.qid)).toEqual(['NGAN']) // KHÔNG rỗng: câu thứ 7 vừa ngân sách được chọn
    expect(kq.chon[0]!.taskSeconds).toBeLessThanOrEqual(120)
    expect(kq.lyDo.DIFFICULTY_LIMIT).toBeUndefined()
  })

  it('RV05c — trong CÙNG family, câu ĐIỂM CAO đứng SAU vẫn thắng câu đứng trước (không chọn theo thứ tự pool)', async () => {
    const d = dung()
    // Cùng family FS: câu ĐẦU không đến hạn (điểm thấp), câu SAU đến hạn (reviewNeed > 0 ⇒ điểm cao hơn) và ngắn hơn.
    const ds = [
      cau('TRUOC', { part: 'III', mucDo: 'hieu', group: 'gF1', familyId: 'FS' }),
      cau('SAU', { part: 'I', mucDo: 'biet', group: 'gF2', familyId: 'FS' }),
    ]
    const kq = await chonCauChoLuot(d.env, ds, {
      sbd: 'S1', ngay: NGAY, nowMs: T0, mastery: [{ key: 'A-SAU', due: T0 - 1000 }], mucTheoKyNang: new Map([['K1', 1]]), conLaiGiay: 600, tranCau: 6,
    })
    expect(kq.chon).toHaveLength(1) // một family chỉ 1 câu thường
    expect(kq.chon[0]!.qid).toBe('SAU') // đại diện family là câu ĐIỂM CAO, không phải câu đứng trước trong pool
    expect(kq.lyDo.TRAN_FAMILY).toBe(1)
  })

  it('RV05 (ca cũ giữ lại): 6 câu ĐẦU quá khó, 2 câu CUỐI phù hợp ⇒ vẫn lấy được 2 câu phù hợp', async () => {
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
    await nhaCho(d.env, 'S1', 'T-KHAC')
    const sau = await chonCauChoLuot(d.env, ds, { sbd: 'S1', ngay: NGAY, nowMs: T0, mastery: [], mucTheoKyNang: new Map(), conLaiGiay: 600 })
    expect(sau.chon.map((c) => c.qid).sort()).toEqual(['Q3', 'Q5'])
  })
})
