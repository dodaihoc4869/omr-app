// @vitest-environment node
// P04 — CHỐNG LẶP (02 §4.2): T41 phần "due hợp lệ KHÔNG bị cooldown 3/14/30 chặn" + luật lượt/family.
// Gọi CODE SẢN PHẨM THẬT `server/src/chong-lap.ts` (hàm thuần) + adapter đọc D1 thật (node:sqlite).
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  CACH_REPAIR_GIAY, CACH_REPAIR_NHIEM_VU, chonTheoLuatChongLap, docDaLamHomNay, familyLanCuoiTuSuKien,
  tomTatLyDoChongLap, TRAN_CAU_CHUA_FAMILY, TRAN_CAU_MOT_LUOT, xetChongLap,
  type NguCanhChongLap, type UngVienLap,
} from '../server/src/chong-lap'
import { taoD1That } from './_d1-that'
import { ghiSuKien } from '../server/src/su-kien-hoc'

const HOM_NAY = '2026-09-23'
const u = (qid: string, o: Partial<UngVienLap> = {}): UngVienLap => ({
  qid, contentGroup: `cg-${qid}`, familyId: `f-${qid}`, difficulty: 1, skillIds: ['SK1'], denHan: false, purpose: 'maintenance', ...o,
})
const n = (o: Partial<NguCanhChongLap> = {}): NguCanhChongLap => ({ homNay: HOM_NAY, ...o })

describe('T41/P04 — card ĐẾN HẠN không bị cooldown 3/14/30 ngày chặn', () => {
  it('câu đến hạn được ôn ngay cả khi family VỪA làm hôm nay, kèm `repeat_reason: DUE_REVIEW`', () => {
    const kq = xetChongLap(u('Q1', { denHan: true }), n({ familyLanCuoi: new Map([['f-Q1', HOM_NAY]]) }))
    expect(kq.duoc).toBe(true)
    expect(kq.repeatReason).toBe('DUE_REVIEW')
  })

  it('module KHÔNG có luật cooldown 3/14/30 ngày: chỉ có "đến hạn" / "chưa đến hạn"', () => {
    const denHan = xetChongLap(u('Q1', { denHan: true, purpose: 'due_review' }), n())
    const chuaDenHan = xetChongLap(u('Q1', { denHan: false, purpose: 'due_review' }), n())
    expect(denHan.duoc).toBe(true)
    expect(chuaDenHan).toEqual({ duoc: false, lyDo: 'KHONG_DEN_HAN' })
    expect(readFileSync('server/src/chong-lap.ts', 'utf8')).not.toMatch(/3\s*\*\s*86_?400|14\s*\*\s*86_?400|30\s*\*\s*86_?400/i)
  })

  it('câu CHƯA đến hạn vẫn được dùng cho transfer/consolidation (biến thể khác content_group theo family)', () => {
    expect(xetChongLap(u('Q-VARIANT', { denHan: false, purpose: 'consolidation' }), n()).duoc).toBe(true)
  })
})

describe('P04 — cùng content_group hôm nay, task đang mở, và retry có mục đích', () => {
  it('cùng content_group đã làm HÔM NAY ⇒ loại DA_LAM_HOM_NAY (không tính là câu để lấp số)', () => {
    const kq = xetChongLap(u('Q2', { contentGroup: 'cg-A' }), n({ daLamHomNay: new Set(['cg-A']) }))
    expect(kq).toEqual({ duoc: false, lyDo: 'DA_LAM_HOM_NAY' })
  })

  it('`repair_retry` do máy chủ tạo rõ ⇒ ĐƯỢC phát lại nhưng KHÔNG nhận lại EXP câu và KHÔNG nâng FSRS', () => {
    const kq = xetChongLap(u('Q3', { contentGroup: 'cg-A', purpose: 'repair_retry' }), n({
      daLamHomNay: new Set(['cg-A']), retryChoPhep: new Set(['cg-A']),
    }))
    expect(kq).toMatchObject({ duoc: true, repeatReason: 'REPAIR', khongNhanExpCau: true, khongNangFsrs: true })
  })

  it('nhiệm vụ ĐANG MỞ của đúng content_group ⇒ trả lại CÙNG task, không phát bản khác ở màn khác', () => {
    const kq = xetChongLap(u('Q4', { contentGroup: 'cg-A' }), n({ taskDangMo: new Map([['cg-A', 'task-9']]) }))
    expect(kq).toMatchObject({ duoc: true, dungLaiTask: 'task-9', repeatReason: 'TASK_DANG_LAM' })
  })

  it('quy tắc 1 (phạm vi/quyền công bố) THẮNG mọi ngoại lệ — kể cả câu đến hạn hay task đang mở', () => {
    const kq = xetChongLap(u('Q5', { denHan: true }), n({ ngoaiPhamVi: true, taskDangMo: new Map([['cg-Q5', 'task-1']]) }))
    expect(kq).toEqual({ duoc: false, lyDo: 'NGOAI_PHAM_VI' })
  })
})

describe('P04 — family spacing và giãn cách repair', () => {
  it('family vừa làm hôm nay + consolidation mới ⇒ loại FAMILY_VUA_LAM', () => {
    const kq = xetChongLap(u('Q6', { purpose: 'consolidation' }), n({ familyLanCuoi: new Map([['f-Q6', HOM_NAY]]) }))
    expect(kq).toEqual({ duoc: false, lyDo: 'FAMILY_VUA_LAM' })
  })

  it('bốn ngoại lệ của luật giãn family đều có `repeat_reason`: đến hạn · repair · bài thầy giao · probe', () => {
    const cu = { familyLanCuoi: new Map([['f-Q6', HOM_NAY]]) }
    expect(xetChongLap(u('Q6', { denHan: true }), n(cu)).repeatReason).toBe('DUE_REVIEW')
    expect(xetChongLap(u('Q6', { purpose: 'repair' }), n(cu)).repeatReason).toBe('REPAIR')
    expect(xetChongLap(u('Q6', { contentGroup: 'cg-A' }), n({ ...cu, baiThayGiao: new Map([['cg-A', 'BT-1']]) })).repeatReason).toBe('TEACHER_ASSIGNMENT')
    expect(xetChongLap(u('Q6', { contentGroup: 'cg-A' }), n({ ...cu, probeChoPhep: new Set(['cg-A']) })).repeatReason).toBe('PROBE')
  })

  it('family đã có 1 câu thường trong lượt ⇒ câu thường thứ hai bị TRAN_FAMILY', () => {
    const daChon = [{ qid: 'Q7', familyId: 'f-X', purpose: 'maintenance', contentGroup: 'cg-7' }]
    expect(xetChongLap(u('Q8', { familyId: 'f-X' }), n({ daChon }))).toEqual({ duoc: false, lyDo: 'TRAN_FAMILY' })
  })

  it('repair câu thứ hai cùng family chỉ được khi cách ≥2 nhiệm vụ khác HOẶC ≥300 giây hoạt động', () => {
    const daChon = [{ qid: 'Q7', familyId: 'f-X', purpose: 'repair', contentGroup: 'cg-7' }]
    expect(xetChongLap(u('Q8', { familyId: 'f-X', purpose: 'repair' }), n({ daChon, cachRepair: { nhiemVu: 1, giay: 299 } })))
      .toEqual({ duoc: false, lyDo: 'TRAN_FAMILY' })
    expect(xetChongLap(u('Q8', { familyId: 'f-X', purpose: 'repair' }), n({ daChon, cachRepair: { nhiemVu: CACH_REPAIR_NHIEM_VU, giay: 0 } })).duoc).toBe(true)
    expect(xetChongLap(u('Q8', { familyId: 'f-X', purpose: 'repair' }), n({ daChon, cachRepair: { nhiemVu: 0, giay: CACH_REPAIR_GIAY } })).duoc).toBe(true)
  })

  it('câu CHƯA gán family: tối đa 1 câu một lượt (không bịa family để lách)', () => {
    const daChon = [{ qid: 'Q7', familyId: null, purpose: 'maintenance', contentGroup: 'cg-7' }]
    expect(xetChongLap(u('Q8', { familyId: null }), n({ daChon }))).toEqual({ duoc: false, lyDo: 'TRAN_CAU_CHUA_FAMILY' })
    expect(TRAN_CAU_CHUA_FAMILY).toBe(1)
  })
})

describe('P04 — trần lượt 6 câu và lọc cả dãy', () => {
  it('quá 6 câu trong một lượt ⇒ TRAN_LUOT', () => {
    const daChon = Array.from({ length: TRAN_CAU_MOT_LUOT }, (_, i) => ({ qid: `q${i}`, familyId: `f${i}`, purpose: 'maintenance', contentGroup: `cg${i}` }))
    expect(xetChongLap(u('Q9'), n({ daChon }))).toEqual({ duoc: false, lyDo: 'TRAN_LUOT' })
    expect(TRAN_CAU_MOT_LUOT).toBe(6)
  })

  it('lọc dãy: giữ tối đa 6 câu, mỗi family một câu thường, trả mã lý do cho phần loại', () => {
    const ds = [
      u('A1', { familyId: 'f1' }), u('A2', { familyId: 'f1' }),
      u('B1', { familyId: 'f2' }), u('C1', { familyId: null }), u('C2', { familyId: null }),
      u('D1', { familyId: 'f3' }), u('E1', { familyId: 'f4' }), u('F1', { familyId: 'f5' }), u('G1', { familyId: 'f6' }),
    ]
    const r = chonTheoLuatChongLap(ds, n())
    expect(r.chon).toHaveLength(TRAN_CAU_MOT_LUOT)
    expect(r.chon.filter((x) => x.familyId === 'f1')).toHaveLength(1)
    expect(r.chon.filter((x) => x.familyId === null)).toHaveLength(1)
    const ly = tomTatLyDoChongLap(r.loai)
    expect(ly.TRAN_FAMILY).toBe(1)
    expect(ly.TRAN_CAU_CHUA_FAMILY).toBe(1)
    expect(r.thieu).toBe(0)
  })

  it('không đủ ứng viên ⇒ RÚT NGẮN (báo `thieu`) chứ không nới bảo vệ', () => {
    const r = chonTheoLuatChongLap([u('A1')], n())
    expect(r.chon).toHaveLength(1)
    expect(r.thieu).toBe(5)
  })
})

describe('P04 — adapter D1 thật: content_group đã làm hôm nay + family từ sự kiện', () => {
  it('đọc đúng content_group đã có KẾT QUẢ hôm nay (bỏ dòng bỏ trống, bỏ ngày khác)', async () => {
    const d = taoD1That()
    d.sql.prepare("INSERT INTO de_kho(ma_de,ten_de,lop,so_cau,r2_khoa,da_xoa,cap_nhat_luc) VALUES('DE1','DE1','12',2,'k',0,'v1')").run()
    d.sql.prepare("INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('DE1','v1','x')").run()
    for (const qid of ['Q1', 'Q2', 'Q3']) {
      d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)')
        .run('DE1', qid, 'v1', `cg-${qid}`, 'D1', JSON.stringify({ qid, group: `cg-${qid}` }))
    }
    await ghiSuKien(d.env, [
      { nguon: 'btvn', maNguon: 'M', sbd: 'S1', qid: 'Q1', lan: 1, ketQua: 1, luc: `${HOM_NAY}T03:00:00.000Z` },
      { nguon: 'btvn', maNguon: 'M', sbd: 'S1', qid: 'Q2', lan: 1, ketQua: null, luc: `${HOM_NAY}T04:00:00.000Z` },
      { nguon: 'btvn', maNguon: 'M', sbd: 'S1', qid: 'Q3', lan: 1, ketQua: 1, luc: '2026-09-20T03:00:00.000Z' },
    ])
    const r = await docDaLamHomNay(d.env, ['S1', 'S2'], HOM_NAY)
    expect([...r.get('S1')!]).toEqual(['cg-Q1']) // Q2 bỏ trống không tính, Q3 ngày khác không tính
    expect([...r.get('S2')!]).toEqual([])
  })

  it('family lấy từ SỰ KIỆN (kho thật chưa gắn family ⇒ không có dòng nào, KHÔNG bịa)', () => {
    const m = familyLanCuoiTuSuKien([
      { sbd: 'S1', familyId: 'fA', ngayVn: '2026-09-20' },
      { sbd: 'S1', familyId: 'fA', ngayVn: '2026-09-23' },
      { sbd: 'S1', familyId: null, ngayVn: '2026-09-23' },
    ])
    expect(m.get('fA')).toBe('2026-09-23')
    expect(m.size).toBe(1)
  })
})

