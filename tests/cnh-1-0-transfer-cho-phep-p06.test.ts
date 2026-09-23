// @vitest-environment node
// CNH-1.0 P06/RV07 — NGUỒN CẤP `transferChoPhep` (02 §7.2 `transferValue`): máy chủ cấp cơ hội transfer khi câu
// CÓ NHÃN FAMILY, ĐÃ DUYỆT (`reviewed`) và `content_group` CHƯA có kết quả trong sổ em ("nhóm nội dung mới").
//   · family đã biết + nhóm mới ⇒ 1  · family chưa gặp + nhóm mới ⇒ 0,5  · nhóm đã gặp / thiếu nhãn ⇒ 0 (KHÔNG nới).
import { describe, expect, it } from 'vitest'
import { chonCauChoLuot, docCoHoiTransfer, type CauUngVien } from '../server/src/bo-chon-that'
import { ghiSuKien } from '../server/src/su-kien-hoc'
import { taoD1That, type D1That } from './_d1-that'

const NOW = Date.now()
const iso = (ms: number) => new Date(ms).toISOString()
const D = 24 * 3_600_000

/** Kho: `DE1-I-9` là câu ỨNG VIÊN (nhóm `g-moi`, family `fam-A`); `DE1-I-1` là câu em ĐÃ GẶP (nhóm `g-cu`, family `fam-A`). */
async function dung(o: { familyUngVien?: string | null; reviewed?: boolean; nhomDaGap?: string; familyDaGap?: string | null } = {}): Promise<D1That> {
  const d = taoD1That()
  d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,lop,cap_nhat_luc) VALUES('S1','Em S1','12','x')").run()
  d.sql.prepare("INSERT INTO de_kho(ma_de,ten_de,lop,so_cau,r2_khoa,da_xoa,cap_nhat_luc) VALUES('DE1','DE1','12',2,'k',0,'v1')").run()
  d.sql.prepare("INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('DE1','v1','x')").run()
  const cau = (qid: string, mucDo: string, nhom: string, family: string | null, reviewed: boolean) => JSON.stringify({
    qid, maDe: 'DE1', phan: 'I', text: 'Đề', choices: ['A', 'B', 'C', 'D'], correct: 'A', sao: 1, mucDo, kienThuc: ['K1'], reviewed,
    ...(family ? { family } : {}),
  })
  d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)')
    .run('DE1', 'DE1-I-9', 'v1', 'g-moi', 'ES.A.X', cau('DE1-I-9', 'biet', 'g-moi', o.familyUngVien === undefined ? 'fam-A' : o.familyUngVien, o.reviewed ?? true))
  d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)')
    .run('DE1', 'DE1-I-1', 'v1', o.nhomDaGap ?? 'g-cu', 'ES.A.X', cau('DE1-I-1', 'biet', o.nhomDaGap ?? 'g-cu', o.familyDaGap === undefined ? 'fam-A' : o.familyDaGap, true))
  // Sổ: em ĐÃ làm `DE1-I-1` (đúng) ⇒ nhóm `g-cu` đã gặp; family `fam-A` (nếu có nhãn) đã biết.
  await ghiSuKien(d.env, [{ nguon: 'game' as const, maNguon: 'G0', sbd: 'S1', qid: 'DE1-I-1', lan: 1, ketQua: 1 as const, luc: iso(NOW - 3 * D) }])
  return d
}
const ungVien = (familyId: string | null): CauUngVien[] => [
  { qid: 'DE1-I-9', version: 'v1', part: 'I', mucDo: 'biet', group: 'g-moi', dangKey: 'ES.A.X', skillIds: ['K1'], familyId },
]

describe('P06/RV07 — nguồn cấp transferChoPhep (§7.2 transferValue)', () => {
  it('NHÓM MỚI + family đã biết ⇒ máy chủ CẤP cơ hội ⇒ transferValue = 1', async () => {
    const d = await dung()
    const cap = await docCoHoiTransfer(d.env, 'S1', [{ qid: 'DE1-I-9', group: 'g-moi' }])
    expect(cap.has('DE1-I-9')).toBe(true)
    const kq = await chonCauChoLuot(d.env, ungVien('fam-A'), { sbd: 'S1', ngay: iso(NOW).slice(0, 10), nowMs: NOW, tranCau: 1, mastery: [] })
    expect(kq.chon.map((x) => x.qid)).toEqual(['DE1-I-9'])
    expect(kq.chon[0]!.diem.transferValue).toBe(1)
  })

  it('NHÓM ĐÃ GẶP ⇒ KHÔNG cấp (làm lại nhóm cũ không gọi là chuyển giao) ⇒ 0', async () => {
    const d = await dung({ nhomDaGap: 'g-moi' })
    const cap = await docCoHoiTransfer(d.env, 'S1', [{ qid: 'DE1-I-9', group: 'g-moi' }])
    expect(cap.has('DE1-I-9')).toBe(false)
    const kq = await chonCauChoLuot(d.env, ungVien('fam-A'), { sbd: 'S1', ngay: iso(NOW).slice(0, 10), nowMs: NOW, tranCau: 1, mastery: [] })
    expect(kq.chon[0]!.diem.transferValue).toBe(0)
  })

  it('family CHƯA gặp nhưng câu đã duyệt + nhóm mới ⇒ 0,5 (không gọi là bằng chứng chuyển giao trong family)', async () => {
    const d = await dung({ familyDaGap: 'fam-Z' })
    const kq = await chonCauChoLuot(d.env, ungVien('fam-A'), { sbd: 'S1', ngay: iso(NOW).slice(0, 10), nowMs: NOW, tranCau: 1, mastery: [] })
    expect(kq.chon[0]!.diem.transferValue).toBe(0.5)
  })

  it('câu CHƯA DUYỆT ⇒ KHÔNG cấp cơ hội ⇒ 0 (không dùng câu chưa duyệt để chứng nhận chuyển giao)', async () => {
    const d = await dung({ reviewed: false })
    const cap = await docCoHoiTransfer(d.env, 'S1', [{ qid: 'DE1-I-9', group: 'g-moi' }])
    expect(cap.has('DE1-I-9')).toBe(false)
    const kq = await chonCauChoLuot(d.env, ungVien('fam-A'), { sbd: 'S1', ngay: iso(NOW).slice(0, 10), nowMs: NOW, tranCau: 1, mastery: [] })
    expect(kq.chon[0]!.diem.transferValue).toBe(0)
  })

  it('kho THIẾU NHÃN family ⇒ không cấp, không bịa family (transferValue = 0)', async () => {
    const d = await dung({ familyUngVien: null })
    const cap = await docCoHoiTransfer(d.env, 'S1', [{ qid: 'DE1-I-9', group: 'g-moi' }])
    expect(cap.size).toBe(0)
    const kq = await chonCauChoLuot(d.env, ungVien(null), { sbd: 'S1', ngay: iso(NOW).slice(0, 10), nowMs: NOW, tranCau: 1, mastery: [] })
    expect(kq.chon[0]!.diem.transferValue).toBe(0)
  })
})
