// @vitest-environment node
// P05 — ĐIỂM CHỌN CÂU VÀ SẮP XẾP TẤT ĐỊNH (02 §7.2). Gọi CODE SẢN PHẨM THẬT `server/src/bo-chon-diem.ts`.
// Nguyên tắc: các hard filter chạy TRƯỚC (các test P02/P04/P05 khác); ở đây chỉ kiểm ĐIỂM và THỨ TỰ.
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  chamCoverage, chamDiem, chamFatigue, chamFit, chamRepairNeed, chamReviewNeed, chamTransferValue,
  khoaHashSap, sapTheoDiem, sha256Hex, soByte, type CauChonDiem, type NguCanhChonDiem,
} from '../server/src/bo-chon-diem'
import { CHIA_REVIEW, DIEM_CHON, GIAY_TOI_THIEU_ON, MOI_MET_TRAN, NEN_REVIEW } from '../server/src/ho-so-cau-hinh'

const NOW = Date.parse('2026-09-23T10:00:00.000Z')
const cau = (o: Partial<CauChonDiem> & { qid: string }): CauChonDiem => ({
  version: 'v1', part: 'I', difficulty: 1, familyId: null, ...o,
})
const ngu = (o: Partial<NguCanhChonDiem> = {}): NguCanhChonDiem => ({ nowMs: NOW, workingLevel: 1, solveSeconds: 100, ...o })

describe('P05/§7.2 — từng số hạng đúng công thức (trọng số lấy từ THAM-SO)', () => {
  it('trọng số khớp THAM-SO `planning.scoreWeights`', () => {
    expect(DIEM_CHON).toEqual({ repair: 0.3, review: 0.25, transfer: 0.2, fit: 0.15, coverage: 0.1 })
    expect([NEN_REVIEW, CHIA_REVIEW, GIAY_TOI_THIEU_ON, MOI_MET_TRAN]).toEqual([0.5, 1.5, 86_400, 0.4])
  })

  it('repairNeed: 1 khi needs_teaching/practicing · 0,5 khi recovered · 0 còn lại', () => {
    expect(chamRepairNeed('needs_teaching')).toBe(1)
    expect(chamRepairNeed('practicing')).toBe(1)
    expect(chamRepairNeed('recovered')).toBe(0.5)
    expect(chamRepairNeed('stable')).toBe(0)
    expect(chamRepairNeed(null)).toBe(0)
  })

  it('reviewNeed: chưa due = 0; due thì (min(trễ/khoảng,1)+0,5)/1,5; khoảng tối thiểu 86400', () => {
    expect(chamReviewNeed(NOW, null, null)).toBe(0)
    expect(chamReviewNeed(NOW, NOW + 1000, 86_400_000)).toBe(0)
    expect(chamReviewNeed(NOW, NOW - 86_400_000, 86_400_000)).toBeCloseTo((1 + 0.5) / 1.5, 10)
    expect(chamReviewNeed(NOW, NOW - 86_400_000 * 5, 86_400_000)).toBeCloseTo((1 + 0.5) / 1.5, 10)
    expect(chamReviewNeed(NOW, NOW - 43_200_000, 86_400_000)).toBeCloseTo((0.5 + 0.5) / 1.5, 10)
    expect(chamReviewNeed(NOW, NOW - 43_200_000, 0)).toBeCloseTo((0.5 + 0.5) / 1.5, 10)
  })

  it('transferValue: family lạ = 0 (KHÔNG coi là chuyển giao) · cơ hội + family đã biết = 1 · family mới với em = 0,5', () => {
    expect(chamTransferValue({ familyId: null, transferChoPhep: true })).toBe(0)
    expect(chamTransferValue({ familyId: 'f1', transferChoPhep: true })).toBe(1)
    expect(chamTransferValue({ familyId: 'f1', transferChoPhep: true, familyMoiVoiEm: true })).toBe(0.5)
    expect(chamTransferValue({ familyId: 'f1' })).toBe(0)
  })

  it('fit: 1 cùng mức · 0,8 thấp hơn 1 · 0,6 thấp hơn 2 · probe hợp lệ = 0,5', () => {
    expect(chamFit(1, 1, false)).toBe(1)
    expect(chamFit(0, 1, false)).toBe(0.8)
    expect(chamFit(0, 2, false)).toBe(0.6)
    expect(chamFit(2, 1, true)).toBe(0.5)
    expect(chamFit(1, 2, true)).toBe(0.8)
  })

  it('coverage = 1/(1+số task cùng skill); fatigue tối đa 0,4', () => {
    expect([chamCoverage(0), chamCoverage(1), chamCoverage(3)]).toEqual([1, 0.5, 0.25])
    expect(chamFatigue('I', 100, [{ part: 'I', solveSeconds: 100 }, { part: 'I', solveSeconds: 100 }])).toBe(0.2)
    expect(chamFatigue('I', 200, [{ part: 'I', solveSeconds: 200 }])).toBe(0.2)
    expect(chamFatigue('I', 200, [{ part: 'I', solveSeconds: 200 }, { part: 'I', solveSeconds: 200 }])).toBe(MOI_MET_TRAN)
    expect(chamFatigue('II', 100, [{ part: 'I', solveSeconds: 200 }, { part: 'I', solveSeconds: 200 }])).toBe(0)
  })

  it('score = 0,30·repair + 0,25·review + 0,20·transfer + 0,15·fit + 0,10·coverage − fatigue (số cụ thể)', () => {
    const c = cau({ qid: 'Q', difficulty: 0, part: 'I', familyId: 'f1', transferChoPhep: true })
    const n = ngu({
      trangThaiDot: 'needs_teaching', dueMs: NOW - 86_400_000, intervalMs: 86_400_000, workingLevel: 1,
      soTaskCungSkillTrongPlan: 1, solveSeconds: 200, haiTaskTruoc: [{ part: 'I', solveSeconds: 200 }],
    })
    const d = chamDiem(c, n)
    expect(d.repairNeed).toBe(1)
    expect(d.reviewNeed).toBeCloseTo(1, 10)
    expect(d.transferValue).toBe(1)
    expect(d.fit).toBe(0.8)
    expect(d.coverage).toBe(0.5)
    expect(d.fatigue).toBe(0.2)
    expect(d.score).toBeCloseTo(0.3 + 0.25 + 0.2 + 0.15 * 0.8 + 0.1 * 0.5 - 0.2, 12)
  })

  it('không GỌI Math.random trong module điểm', () => {
    expect(readFileSync('server/src/bo-chon-diem.ts', 'utf8')).not.toMatch(/Math\.random\s*\(/)
  })
})

describe('P05/§7.2 — sắp xếp tất định (điểm → hash byte → qid)', () => {
  const SBD = 'S1'
  const NGAY = '2026-09-23'
  const PHIEN_BAN = 2
  const khoa = (c: CauChonDiem) => khoaHashSap(SBD, NGAY, PHIEN_BAN, c.qid, c.version)

  it('hash BẰNG SHA-256 của chính khoá `student|day|plan_version|qid|version` (đối chiếu node:crypto)', async () => {
    const chuoi = khoaHashSap('S1', '2026-09-23', 2, 'Q-9', 'v3')
    expect(chuoi).toBe('S1|2026-09-23|2|Q-9|v3')
    expect(await sha256Hex(chuoi)).toBe(createHash('sha256').update(chuoi).digest('hex'))
    expect(soByte('00ff', '0100')).toBe(-1)
    expect(soByte('abcd', 'abcd')).toBe(0)
  })

  it('điểm GIẢM DẦN; bằng điểm thì hash TĂNG theo byte; bằng cả hai thì qid tăng', async () => {
    const ds = [cau({ qid: 'A' }), cau({ qid: 'B' }), cau({ qid: 'C' }), cau({ qid: 'D' })]
    const diem = new Map([['A', 0.5], ['B', 0.5], ['C', 0.9], ['D', 0.1]])
    const ra = await sapTheoDiem(ds, diem, khoa)
    expect(ra[0]!.qid).toBe('C')
    expect(ra[3]!.qid).toBe('D')
    const hashA = await sha256Hex(khoa(ds[0]!)), hashB = await sha256Hex(khoa(ds[1]!))
    const mongDoi = soByte(hashA, hashB) < 0 ? ['A', 'B'] : ['B', 'A']
    expect(ra.slice(1, 3).map((x) => x.qid)).toEqual(mongDoi)
  })

  it('ĐẢO thứ tự đầu vào ⇒ cùng kết quả (tất định, không phụ thuộc thứ tự gọi)', async () => {
    const ds = [cau({ qid: 'X' }), cau({ qid: 'Y' }), cau({ qid: 'Z', version: 'v2' }), cau({ qid: 'W', part: 'II' })]
    const diem = new Map(ds.map((c) => [c.qid, 0.5]))
    const a = (await sapTheoDiem(ds, diem, khoa)).map((c) => c.qid)
    const b = (await sapTheoDiem([...ds].reverse(), diem, khoa)).map((c) => c.qid)
    expect(b).toEqual(a)
  })

  it('đổi ngày hoặc plan_version ⇒ đổi khoá hash (mỗi ngày/phiên bản có thứ tự riêng)', async () => {
    expect(await sha256Hex(khoaHashSap(SBD, '2026-09-23', 2, 'M', 'v1')))
      .not.toBe(await sha256Hex(khoaHashSap(SBD, '2026-09-24', 2, 'M', 'v1')))
    expect(await sha256Hex(khoaHashSap(SBD, '2026-09-23', 2, 'M', 'v1')))
      .not.toBe(await sha256Hex(khoaHashSap(SBD, '2026-09-23', 3, 'M', 'v1')))
    expect(await sha256Hex(khoaHashSap(SBD, '2026-09-23', 2, 'M', 'v1')))
      .not.toBe(await sha256Hex(khoaHashSap(SBD, '2026-09-23', 2, 'M', 'v2')))
  })
})

