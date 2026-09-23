// @vitest-environment node
// RV07 — DỮ LIỆU THẬT cho §7.2: khoảng ôn thật, family đã gặp + cơ hội server cấp, phiên bản plan thật,
// coverage theo PLAN, đợt dạy lại theo KỸ NĂNG. Test gọi ĐÚNG hàm sản phẩm + D1 thật (node:sqlite).
import { describe, expect, it } from 'vitest'
import {
  chonCauChoLuot, docCoverageTheoPlan, docFamilyDaGap, docKhoangOnTheoNhom, docRepairTheoKyNang, xepLuotTheoChinhSach,
  type CauUngVien, type XepLuotInput,
} from '../server/src/bo-chon-that'
import { khoaHashSap } from '../server/src/bo-chon-diem'
import { taoD1That } from './_d1-that'
import { POLICY_VERSION } from '../server/src/nang-luc'

const T0 = Date.parse('2026-09-23T12:00:00+07:00')
const NGAY = '2026-09-23'
const NGAY_MS = 86_400_000
const cau = (qid: string, o: Partial<CauUngVien> = {}): CauUngVien => ({
  qid, version: 'v1', part: 'I', mucDo: 'biet', group: `g-${qid}`, dangKey: 'D1', skillIds: ['K1'], familyId: `F-${qid}`, ...o,
})
const inp = (o: Partial<XepLuotInput> = {}): XepLuotInput => ({
  sbd: 'S1', ngay: NGAY, nowMs: T0, mastery: [], mucTheoKyNang: new Map([['K1', 0]]), hoSoCau: new Map(), ...o,
})

describe('RV07/§7.2 — KHOẢNG ÔN THẬT (`intervalSeconds`) đổi cách chấm quá hạn', () => {
  it('cùng quá hạn 2 ngày nhưng khoảng ôn 1 ngày vs 30 ngày ⇒ reviewNeed KHÁC và thứ tự khác', async () => {
    const due = T0 - 2 * NGAY_MS
    const ds = [cau('NGAN', { group: 'gN' }), cau('DAI', { group: 'gD' })]
    const kq = await xepLuotTheoChinhSach(ds, inp({
      mastery: [{ key: 'D1', due }],
      khoangOnTheoNhom: new Map([['gN', 1 * NGAY_MS], ['gD', 30 * NGAY_MS]]),
    }))
    const ngan = kq.theoQid.get('NGAN')!.diem, dai = kq.theoQid.get('DAI')!.diem
    expect(ngan.reviewNeed).toBe(1) // tỉ lệ 2 ≥ 1 ⇒ kẹp 1 ⇒ (1+0,5)/1,5
    expect(dai.reviewNeed).toBeCloseTo(0.3778, 3) // (2/30 + 0,5)/1,5
    expect(ngan.reviewNeed).toBeGreaterThan(dai.reviewNeed)
    expect(kq.xep.map((x) => x.qid)).toEqual(['NGAN', 'DAI'])
  })

  it('KHÔNG có khoảng ôn thật ⇒ nhánh fallback sàn 1 ngày (ghi nhận, không coi là cá nhân hóa đầy đủ)', async () => {
    const due = T0 - 2 * NGAY_MS
    const kq = await xepLuotTheoChinhSach([cau('X')], inp({ mastery: [{ key: 'D1', due }] }))
    expect(kq.theoQid.get('X')!.diem.reviewNeed).toBe(1) // (2 ngày / sàn 1 ngày) ⇒ kẹp 1
  })
})

describe('RV07/§7.2 — TRANSFER: family đã gặp + cơ hội MÁY CHỦ cấp', () => {
  it('có cơ hội: family CHƯA gặp = 1 · family ĐÃ gặp = 0,5 · KHÔNG có cơ hội = 0 (không bịa)', async () => {
    const ds = [cau('MOI', { group: 'gM', familyId: 'FM' }), cau('CU', { group: 'gC', familyId: 'FC' })]
    const co = await xepLuotTheoChinhSach(ds, inp({ transferChoPhep: new Set(['MOI', 'CU']), familyDaGap: new Set(['FC']) }))
    // §7.2: family ĐÃ BIẾT (em từng gặp) = 1 · family mới với em (đã duyệt nhưng chưa gặp) = 0,5
    expect(co.theoQid.get('CU')!.diem.transferValue).toBe(1)
    expect(co.theoQid.get('MOI')!.diem.transferValue).toBe(0.5)
    expect(co.xep[0]!.qid).toBe('CU')
    const khong = await xepLuotTheoChinhSach(ds, inp({ familyDaGap: new Set(['FC']) }))
    expect(khong.theoQid.get('MOI')!.diem.transferValue).toBe(0) // không có cơ hội ⇒ 0
    expect(khong.theoQid.get('CU')!.diem.transferValue).toBe(0)
  })

  it('câu CHƯA gắn family ⇒ transferValue = 0 (không gọi family mới là bằng chứng chuyển giao)', async () => {
    const kq = await xepLuotTheoChinhSach([cau('N', { familyId: null })], inp({ transferChoPhep: new Set(['N']) }))
    expect(kq.theoQid.get('N')!.diem.transferValue).toBe(0)
  })
})


describe('RV07/§7.2 — PLAN VERSION trong khoá hash + replay ổn định', () => {
  it('khoá hash mang PHIÊN BẢN PLAN THẬT (không còn 0 cố định)', () => {
    expect(khoaHashSap('S1', NGAY, 7, 'Q1', 'v1')).toBe(`S1|${NGAY}|7|Q1|v1`)
    expect(khoaHashSap('S1', NGAY, 7, 'Q1', 'v1')).not.toBe(khoaHashSap('S1', NGAY, 8, 'Q1', 'v1'))
  })

  it('cùng phiên bản + cùng tập ứng viên (đảo thứ tự) ⇒ cùng thứ tự; đổi phiên bản vẫn trả đủ ứng viên', async () => {
    const ds = [cau('A'), cau('B'), cau('C')]
    const l1 = await xepLuotTheoChinhSach(ds, inp({ phienBanKeHoach: 3 }))
    const l2 = await xepLuotTheoChinhSach([...ds].reverse(), inp({ phienBanKeHoach: 3 }))
    expect(l1.xep.map((x) => x.qid)).toEqual(l2.xep.map((x) => x.qid)) // tất định, không phụ thuộc thứ tự vào
    const l3 = await xepLuotTheoChinhSach(ds, inp({ phienBanKeHoach: 4 }))
    expect(l3.xep).toHaveLength(3)
  })
})

describe('RV07/§7.2 — COVERAGE theo PLAN và ĐỢT DẠY LẠI theo KỸ NĂNG', () => {
  it('coverage tính CẢ plan: cùng skill đã có 3 task trong plan ⇒ coverage 1/(1+3)', async () => {
    const khong = await xepLuotTheoChinhSach([cau('Q')], inp())
    expect(khong.theoQid.get('Q')!.diem.coverage).toBe(1)
    const co = await xepLuotTheoChinhSach([cau('Q')], inp({ coverageTheoPlan: new Map([['K1', 3]]) }))
    expect(co.theoQid.get('Q')!.diem.coverage).toBe(0.25)
  })

  it('đợt dạy lại theo KỸ NĂNG (P03) cho repairNeed=1 dù hồ sơ TỪNG CÂU trống', async () => {
    const kq = await xepLuotTheoChinhSach([cau('Q')], inp({ repairTheoKyNang: new Map([['K1', 'needs_teaching']]) }))
    expect(kq.theoQid.get('Q')!.diem.repairNeed).toBe(1)
    const khong = await xepLuotTheoChinhSach([cau('Q')], inp())
    expect(khong.theoQid.get('Q')!.diem.repairNeed).toBe(0)
  })
})

describe('RV07 — HAI EM cùng lớp khác hồ sơ ⇒ tập/thứ tự khác nhau (qua pipeline §7.1)', () => {
  it('em mức 2 nhận câu Vận dụng; em mức 0 KHÔNG nhận câu đó (DIFFICULTY_LIMIT) và nhận câu vừa mức', async () => {
    const d = taoD1That()
    d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,lop,cap_nhat_luc) VALUES('S1','Em','12','x')").run()
    const ds = [cau('DE', { mucDo: 'van_dung', group: 'gDE' }), cau('EASY', { mucDo: 'biet', group: 'gE' })]
    const dung = (level: number) => ({ sbd: 'S1', ngay: NGAY, nowMs: T0, mastery: [], mucTheoKyNang: new Map([['K1', level]]), conLaiGiay: 900 })
    const emA = await chonCauChoLuot(d.env, ds, dung(2))
    const emB = await chonCauChoLuot(d.env, ds, dung(0))
    expect(emA.chon.map((x) => x.qid)).toContain('DE') // đúng mức ⇒ được phát
    expect(emA.lyDo.DIFFICULTY_LIMIT).toBeUndefined()
    expect(emB.chon.map((x) => x.qid)).toEqual(['EASY']) // câu trên 2 mức bị CHẶN cứng
    expect(emB.lyDo.DIFFICULTY_LIMIT).toBe(1)
  })
})


describe('RV07 — NGUỒN ĐỌC THẬT (D1): khoảng ôn · family đã gặp · coverage plan · đợt theo kỹ năng', () => {
  function dung() {
    const d = taoD1That()
    d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,lop,cap_nhat_luc) VALUES('S1','Em','12','x')").run()
    d.sql.prepare("INSERT INTO de_kho(ma_de,ten_de,lop,so_cau,r2_khoa,da_xoa,cap_nhat_luc) VALUES('DE1','DE1','12',2,'k',0,'v1')").run()
    d.sql.prepare("INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('DE1','v1','x')").run()
    for (const [qid, g, fam] of [['Q1', 'g1', 'F1'], ['Q2', 'g2', 'F2']] as const) {
      d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)')
        .run('DE1', qid, 'v1', g, 'D1', JSON.stringify({ qid, group: g, kienThuc: ['K1'], mucDo: 'biet', family: fam, version: 'v1' }))
    }
    return d
  }

  it('`docKhoangOnTheoNhom`: khoảng = mốc đến hạn − lần trả lời CUỐI trong sổ (sàn 1 ngày); nhóm chưa có bằng chứng ⇒ KHÔNG bịa', async () => {
    const d = dung()
    d.sql.prepare('INSERT INTO su_kien_hoc(khoa,sbd,qid,nguon,ma_nguon,lan,ket_qua,giay,luc,ngay_vn) VALUES(?,?,?,?,?,1,1,60,?,?)')
      .run('k1', 'S1', 'Q1', 'game', 'S', '2026-09-01T03:00:00.000Z', '2026-09-01')
    const due = Date.parse('2026-09-23T00:00:00.000Z')
    const r = await docKhoangOnTheoNhom(d.env, 'S1', ['g1', 'g2'], new Map([['g1', due], ['g2', due]]))
    expect(r.get('g1')).toBe(due - Date.parse('2026-09-01T03:00:00.000Z'))
    expect(r.has('g2')).toBe(false)
  })

  it('`docFamilyDaGap` đọc family em đã gặp từ sổ (nhãn trong kho)', async () => {
    const d = dung()
    d.sql.prepare('INSERT INTO su_kien_hoc(khoa,sbd,qid,nguon,ma_nguon,lan,ket_qua,luc,ngay_vn) VALUES(?,?,?,?,?,1,1,?,?)')
      .run('k1', 'S1', 'Q2', 'game', 'S', '2026-09-20T03:00:00.000Z', '2026-09-20')
    expect([...(await docFamilyDaGap(d.env, 'S1'))]).toEqual(['F2'])
  })

  it('`docCoverageTheoPlan` đếm task đã hoàn tất / đang giữ chỗ trong PLAN hôm nay theo kỹ năng', async () => {
    const d = dung()
    d.sql.prepare('INSERT INTO ke_hoach_ngay(khoa,sbd,ngay,phien_ban,seed,ngan_sach_json,viec_json,canh_bao_json,cap_nhat_luc) VALUES(?,?,?,?,?,?,?,?,?)')
      .run(`S1|${NGAY}`, 'S1', NGAY, 5, 1, JSON.stringify({ phutNgay: 20 }), JSON.stringify({ viec: [{ id: 'on_lai:x', loai: 'on_lai', chiTiet: { qid: ['Q1', 'Q2'] } }] }), '[]', 'x')
    d.sql.prepare('INSERT INTO su_kien_hoc(khoa,sbd,qid,nguon,ma_nguon,lan,ket_qua,luc,ngay_vn) VALUES(?,?,?,?,?,1,1,?,?)')
      .run('k1', 'S1', 'Q1', 'game', 'S', `${NGAY}T03:00:00.000Z`, NGAY)
    const r = await docCoverageTheoPlan(d.env, 'S1', NGAY, T0)
    expect(r.get('K1')).toBe(1) // Q1 đã xong hôm nay; Q2 chưa xong và chưa giữ chỗ
  })

  it('`docRepairTheoKyNang` đọc bản dựng P03 (`skill_snapshot`): đợt mở ⇒ kỹ năng có mặt', async () => {
    const d = dung()
    d.sql.prepare(
      'INSERT OR REPLACE INTO skill_snapshot(sbd,skill_id,policy_version,working_level,validated_level,confidence,family_count,day_count,last_validated_at,can_kiem_lai,episode_state,episode_json,recent5_json,evidence_json,nhat_ky_json,cursor_received_at,cursor_event_id,revision,cap_nhat_luc)'
      + ' VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
    ).run('S1', 'K1', POLICY_VERSION, 0, null, 0.5, 0, 0, null, 0, 'needs_teaching', JSON.stringify({ state: 'needs_teaching' }), '[]', '[]', '[]', 0, '', 1, 'x')
    const r = await docRepairTheoKyNang(d.env, 'S1')
    expect(r.get('K1')).toBe('needs_teaching')
  })
})
