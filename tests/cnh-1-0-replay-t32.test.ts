// @vitest-environment node
// P03 — REPLAY VÀ CORRECTION (T32). Ba tính chất được chứng minh trên CODE SẢN PHẨM THẬT:
//   1. ĐẢO THỨ TỰ NHẬN: cùng tập sự kiện ⇒ cùng hồ sơ (replay ổn định theo `(receivedAt, eventId)`).
//   2. GỘP TĂNG DẦN = PHÁT LẠI ĐẦY ĐỦ, kể cả khi correction chèn vào QUÁ KHỨ và cả khi đổi trạng thái embargo.
//   3. SNAPSHOT/CURSOR trên D1 thật: sổ không đổi ⇒ KHÔNG đọc lại dòng nào; correction trước con trỏ ⇒
//      dựng lại đúng kỹ năng bị ảnh hưởng và kết quả BẰNG phát lại đầy đủ (không bỏ correction trước cursor).
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  anhChupTuSuKien, apDungSuaDiem, gopTangDan, phatLaiNangLuc,
  type AnhChupNangLuc, type BangNangLuc, type SuKienNL,
} from '../server/src/nang-luc'
import { docAnhChup, docSuKienNL, dungLaiNangLuc, ghiAnhChup, bamSo, xoaBietCotChuanNL, xoaDemNangLuc } from '../server/src/nang-luc-d1'
import { ghiSuKien, xoaBietCotChuan } from '../server/src/su-kien-hoc'
import { taoD1That, type D1That } from './_d1-that'

beforeEach(() => { xoaBietCotChuan(); xoaBietCotChuanNL(); xoaDemNangLuc(); vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(Date.parse('2026-09-25T10:00:00+07:00')) })

/** Sinh lô sự kiện TẤT ĐỊNH: nhiều kỹ năng × nhiều ngày × nhiều family, kết quả theo quy luật. */
function sinhSuKien(n: number, sbd = 'S1'): SuKienNL[] {
  const ra: SuKienNL[] = []
  for (let i = 0; i < n; i++) {
    const ngay = `2026-08-${String(1 + (i % 24)).padStart(2, '0')}`
    ra.push({
      eventId: `e${String(i).padStart(5, '0')}`, attemptId: `a${i}`, sbd, qid: `q${i}`,
      contentGroup: `cg-${i % 40}`, familyId: `f-${i % 12}`, skillIds: [`SK${i % 3}`], prerequisiteIds: [],
      difficulty: (i % 3) as 0 | 1 | 2, learningDay: ngay,
      receivedAt: Date.parse(`${ngay}T03:00:00.000Z`) + (i % 8) * 60_000,
      correct: i % 4 !== 0, assistance: i % 17 === 0 ? 'assisted' : 'none', visibility: 'released',
      correctionOf: null, activeSeconds: 30 + (i % 5) * 100, purpose: null,
    })
  }
  return ra
}
/** Đảo thứ tự "nhận" một cách TẤT ĐỊNH (LCG) — mô phỏng các sự kiện tới không theo thứ tự thời gian. */
function daoThuTu(ds: SuKienNL[], hat = 23092026): SuKienNL[] {
  const a = [...ds]
  let s = hat >>> 0
  const rd = () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296 }
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rd() * (i + 1)); const t = a[i]!; a[i] = a[j]!; a[j] = t }
  return a
}
const tuy = { denNgay: '2026-08-30' } // cửa sổ 30 ngày phủ trọn dải ngày 08-01…08-24 của lô fixture
const rut = (m: Map<string, BangNangLuc>, sbd = 'S1'): BangNangLuc => m.get(sbd)!

describe('T32 — 3.000 sự kiện, đảo thứ tự nhận, correction ở quá khứ', () => {
  it('ĐẢO THỨ TỰ NHẬN ⇒ hồ sơ Y HỆT (3.000 sự kiện, 3 kỹ năng)', () => {
    const ds = sinhSuKien(3000)
    const a = rut(phatLaiNangLuc(ds, tuy))
    const b = rut(phatLaiNangLuc(daoThuTu(ds), tuy))
    expect(b).toEqual(a)
    expect(a.skills).toHaveLength(3)
    expect(a.skills.every((s) => s.evidenceRefs.length > 0)).toBe(true)
    expect(a.cursor).toEqual({ receivedAt: Math.max(...ds.map((e) => e.receivedAt)), eventId: 'e02999' })
  })

  it('CORRECTION chèn vào QUÁ KHỨ: sửa một lỗi thành đúng ⇒ đổi đúng bằng chứng ở ĐÚNG ngày cũ', () => {
    const goc = sinhSuKien(40).map((e, i) => (i === 5 ? { ...e, correct: false } : e))
    const sua: SuKienNL = {
      ...goc[5]!, eventId: 'e-sua-5', correctionOf: 'e00005', correct: true,
      receivedAt: goc[5]!.receivedAt + 1, // nằm ngay sau dòng gốc: học sinh sửa hôm đó, không phải "hôm nay"
    }
    const truoc = rut(phatLaiNangLuc(goc, tuy))
    const sau = rut(phatLaiNangLuc([...goc, sua], tuy))
    const ngay5 = goc[5]!.learningDay
    expect(ngay5).toBe('2026-08-06')
    expect(dauDonVi(truoc, 'e00005')).toBe(true)
    expect(dauDonVi(sau, 'e00005')).toBe(false) // dòng gốc bị THAY, không còn là bằng chứng hiệu lực
    expect(dauDonVi(sau, 'e-sua-5')).toBe(true) // bằng chứng hiệu lực là dòng sửa
    expect(sau.skills[2]!.evidenceRefs).toContain('e-sua-5') // SK2 (i=5 → 5 % 3 = 2)
    expect(sau.skills[2]!.evidenceRefs).not.toContain('e00005')
    // Bằng chứng KHÔNG nhảy sang ngày khác: vị trí thời gian giữ theo dòng gốc.
    expect(apDungSuaDiem([...goc, sua]).filter((e) => e.eventId === 'e00005')).toHaveLength(0)
  })

  it('GỘP TĂNG DẦN = PHÁT LẠI ĐẦY ĐỦ khi correction chèn vào quá khứ (không bỏ correction trước cursor)', () => {
    const toanBo = sinhSuKien(120)
    const nuaDau = toanBo.slice(0, 60)
    const anh = anhChupTuSuKien('S1', nuaDau, tuy)
    const cursorTruoc = anh.bang.cursor!
    const sua: SuKienNL = { ...toanBo[10]!, eventId: 'e-sua-10', correctionOf: toanBo[10]!.eventId, correct: true }
    expect(sua.receivedAt).toBeLessThanOrEqual(cursorTruoc.receivedAt) // correction NẰM TRƯỚC con trỏ
    const gop = gopTangDan(anh, [toanBo[60]!, toanBo[61]!, sua], tuy, () => toanBo) // ảnh chụp SỔ cố ý còn cũ
    const dayDu = rut(phatLaiNangLuc([...toanBo, sua], tuy))
    expect({ ...gop.bang, revision: 0 }).toEqual({ ...dayDu, revision: 0 })
    expect(dauDonVi(gop.bang, 'e-sua-10')).toBe(true) // correction trước con trỏ VẪN có hiệu lực
    expect(dauDonVi(gop.bang, 'e00010')).toBe(false)
    expect(dauDonVi(dayDu, 'e-sua-10')).toBe(true)
  })

  it('kỹ năng bị DƠ mà THIẾU sổ ⇒ NÉM LỖI, không im lặng trả số sai', () => {
    const toanBo = sinhSuKien(20)
    const anh = anhChupTuSuKien('S1', toanBo.slice(0, 10), tuy)
    const sua: SuKienNL = { ...toanBo[2]!, eventId: 'e-sua-2', correctionOf: toanBo[2]!.eventId, correct: true }
    expect(() => gopTangDan(anh, [sua], tuy)).toThrow(/thiếu sổ để dựng lại/)
  })

  it('ĐỔI TRẠNG THÁI EMBARGO (công bố ca) cũng làm dơ ⇒ gộp tăng dần vẫn bằng phát lại đầy đủ', () => {
    const toanBo = sinhSuKien(30).map((e, i) => (i % 5 === 0 ? { ...e, visibility: 'embargoed' as const } : e))
    const anh = anhChupTuSuKien('S1', toanBo.slice(0, 20), tuy)
    const daCongBo = toanBo.slice(0, 20).map((e) => ({ ...e, visibility: 'released' as const }))
    const gop = gopTangDan(anh, daCongBo, tuy, () => [...daCongBo, ...toanBo.slice(20)])
    const dayDu = rut(phatLaiNangLuc([...daCongBo, ...toanBo.slice(20)], tuy))
    expect({ ...gop.bang, revision: 0 }).toEqual({ ...dayDu, revision: 0 })
  })
})

/** Đơn vị bằng chứng có `eventId` này trong hồ sơ không? */
function dauDonVi(b: BangNangLuc, eventId: string): boolean {
  return b.skills.some((s) => s.evidenceRefs.includes(eventId))
}


// --- Trên D1 THẬT: snapshot/cursor + correction trước con trỏ -------------------

/** Kho nhỏ có nhãn kỹ năng; mức 'hieu' ⇒ difficulty 1. */
function dungKho() {
  const d = taoD1That()
  d.sql.prepare("INSERT INTO de_kho(ma_de,ten_de,lop,so_cau,r2_khoa,da_xoa,cap_nhat_luc) VALUES('DE1','DE1','12',4,'kho/DE1.json',0,'v1')").run()
  d.sql.prepare("INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('DE1','v1','x')").run()
  const them = d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)')
  for (let i = 0; i < 4; i++) {
    them.run('DE1', `Q${i}`, 'v1', `cg-Q${i}`, 'D1', JSON.stringify({
      qid: `Q${i}`, maDe: 'DE1', version: 'v1', group: `cg-Q${i}`, phan: 'I', text: `Đề ${i}`, choices: ['A. a', 'B. b', 'C. c', 'D. d'],
      ideas: [], hinhAnh: [], dang: 'D1', tenDang: 'Dạng 1', mucDo: 'hieu', sao: 1, kienThuc: ['SK1'], correct: 'B', solution: 'LG', reviewed: true,
    }))
  }
  return d
}
const NGAY1 = '2026-09-01'
const NGAY2 = '2026-09-02'
/** Sự kiện của em, ghi qua CHÍNH `ghiSuKien` (đường sản phẩm), không tự INSERT. */
const sk = (qid: string, ngay: string, ketQua: 0 | 1, o: Record<string, unknown> = {}) =>
  ({ nguon: 'btvn' as const, maNguon: 'BT1', sbd: 'S1', lan: 1, qid, ketQua, luc: `${ngay}T03:00:00.000Z`, ...o })

describe('T32 (D1 thật) — snapshot/cursor: sổ sạch thì không dựng lại, correction trước con trỏ thì dựng lại ĐÚNG', () => {
  it('sổ KHÔNG đổi ⇒ lần dựng thứ hai không ghi lại gì; correction quá khứ ⇒ dựng lại bằng ĐÚNG phát lại đầy đủ', async () => {
    const d = dungKho()
    await ghiSuKien(d.env, [sk('Q0', NGAY1, 0), sk('Q1', NGAY1, 1), sk('Q2', NGAY2, 1), sk('Q3', NGAY2, 1)])
    const moc = `${NGAY2}T10:00:00.000Z`
    const bang1 = await dungLaiNangLuc(d.env, 'S1', { denNgay: NGAY2, moc })
    expect(bang1.skills).toHaveLength(1)
    expect(bang1.skills[0]!.evidenceRefs).toHaveLength(4)
    const anh = await docAnhChup(d.env, 'S1')
    expect(anh).not.toBeNull()
    expect(anh!.bang.skills[0]!.validatedLevel).toBe(bang1.skills[0]!.validatedLevel)
    const so = await bamSo(d.env, 'S1')
    expect(so.soDong).toBe(4)

    // Sổ không đổi: KHÔNG đọc dòng sự kiện, KHÔNG ghi snapshot (0 batch mới) — "không full replay khi snapshot sạch".
    const batchTruoc = d.soLenh.batch
    const bang2 = await dungLaiNangLuc(d.env, 'S1', { denNgay: NGAY2, moc })
    expect(d.soLenh.batch).toBe(batchTruoc)
    expect(bang2.skills[0]!.evidenceRefs).toEqual(bang1.skills[0]!.evidenceRefs)

    // Giáo viên sửa điểm MỘT câu SAI ở quá khứ. DÒNG SỬA là một DÒNG RIÊNG trong sổ (giữ nguyên dòng gốc
    // bất biến) liên kết bằng `correction_of`; ở đây dùng `lan: 2` để có khoá riêng — CÁCH BIỂU DIỄN
    // chính thức của dòng sửa (và phần tiền/EXP đi kèm) thuộc lệnh correction của P07 (R04).
    const goc = d.sql.prepare("SELECT khoa, received_at FROM su_kien_hoc WHERE qid = 'Q0'").get() as { khoa: string; received_at: number }
    await ghiSuKien(d.env, [sk('Q0', NGAY1, 1, { lan: 2, correctionOf: goc.khoa, receivedAt: Number(goc.received_at), assistance: 'none' })])
    const khoaSua = `${goc.khoa.slice(0, goc.khoa.lastIndexOf('|') + 1)}2`
    const bang3 = await dungLaiNangLuc(d.env, 'S1', { denNgay: NGAY2, moc })
    expect(d.soLenh.batch).toBeGreaterThan(batchTruoc) // có dựng lại
    const doc = await docSuKienNL(d.env, 'S1')
    expect({ ...bang3, revision: 0 }).toEqual({ ...rut(phatLaiNangLuc(doc.ds, { denNgay: NGAY2 })), revision: 0 })
    const refs = bang3.skills[0]!.evidenceRefs
    expect(refs).toHaveLength(4)
    expect(refs).not.toContain(goc.khoa) // dòng gốc bị THAY
    expect(refs).toContain(khoaSua) // bằng chứng hiệu lực là dòng sửa
    expect(Number((d.sql.prepare("SELECT ket_qua FROM su_kien_hoc WHERE khoa = ?").get(goc.khoa) as { ket_qua: number }).ket_qua)).toBe(0) // dòng gốc BẤT BIẾN
    expect(bang3.revision).toBeGreaterThan(bang1.revision)
    // NGÀY GỐC giữ nguyên: mọi bằng chứng vẫn nằm trong hai ngày 01–02/09.
    const ngay = d.sql.prepare("SELECT DISTINCT ngay_vn FROM su_kien_hoc WHERE qid = 'Q0'").all() as { ngay_vn: string }[]
    expect(ngay.map((x) => x.ngay_vn)).toEqual([NGAY1])
  })
})

