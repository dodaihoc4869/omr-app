// @vitest-environment node
// TU LUYỆN v3 (30/09, thầy duyệt "LÀM LUÔN"). Khoá:
//   1. KHO CÂU SAI CHUNG gom đủ 4 nguồn từ mốc 29/09: ca ĐÃ CÔNG BỐ · game/chiến dịch · Luyện đề cấu trúc ĐÃ NỘP · Tu luyện chế độ 2–4 ĐÃ NỘP;
//   2. chế độ 2 gọi ĐÚNG hàm cũ (phanTichTyLeDang → rutDsThemDangCauSai) với nguồn mới;
//   3. KHÔNG BAO GIỜ KHOÁ: kho trống ⇒ chế độ 2 dự phòng 3 tầng (dạng yếu → chương đang học → dạng phổ biến của lớp), chế độ 4 toàn kho;
//      chỉ khoá khi tài khoản không có lớp (có lý do);
//   4. CHẤM TỪNG CÂU: chỉ câu thuộc lượt đang làm, không lộ câu chưa chấm, khoá câu sau chấm (nộp cũng giữ đúng câu đã chấm);
//   5. ÔN CÁCH QUÃNG: đúng 1 ⇒ hẹn ≥ 1 ngày (không rút lại trước hạn trừ khi kho cạn), đúng 2 khác ngày ⇒ khắc phục (rời kho), sai ⇒ về đầu;
//   6. Tổng hợp có Luyện đề cấu trúc (điểm + theo phần) + lịch sử khắc phục; 7. bảng mới tự dựng = tệp migration.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { taoD1That, type D1That } from './_d1-that'
import { dongBoCacTo, xoaDemCaBaoVe } from '../server/src/game-v2-bank'

const goi = vi.hoisted(() => ({ themDang: 0, phanTich: 0, tuDo: 0, dauVao: [] as unknown[] }))
vi.mock('../src/lib/thuat-toan-rut-cau-sai-loi', async (orig) => {
  const m = await orig<typeof import('../src/lib/thuat-toan-rut-cau-sai-loi')>()
  return {
    ...m,
    phanTichTyLeDang: (...a: Parameters<typeof m.phanTichTyLeDang>) => { goi.phanTich++; return m.phanTichTyLeDang(...a) },
    rutDsThemDangCauSai: (...a: Parameters<typeof m.rutDsThemDangCauSai>) => { goi.themDang++; goi.dauVao = a[0]; return m.rutDsThemDangCauSai(...a) },
    rutDsTuDo: (...a: Parameters<typeof m.rutDsTuDo>) => { goi.tuDo++; return m.rutDsTuDo(...a) },
  }
})
const { tuLuyen, tuLuyenNguon, tuLuyenRut, tuLuyenNop, tuLuyenXemTruoc, tuLuyenChamCau, tuLuyenTongHop, damBaoBangTuLuyen } = await import('../server/src/tu-luyen')
const { SQL_BANG_KHAC_PHUC, capNhatKhacPhuc, khacPhucHieuLuc, docKhoCauSai, MOT_NGAY_MS } = await import('../server/src/tu-luyen-cau-sai')

const T0 = Date.parse('2026-09-30T19:00:00+07:00')
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(T0); xoaDemCaBaoVe()
  goi.themDang = goi.phanTich = goi.tuDo = 0; goi.dauVao = []
})
afterEach(() => { vi.useRealTimers(); xoaDemCaBaoVe() })

type Tho = Record<string, unknown>
const PA = { A: 'Phương án A', B: 'Phương án B', C: 'Phương án C', D: 'Phương án D' }
const DANG = { ma: 'ES.A.X', ten: 'Ester đơn chức' }
const cauI = (so: number, de: string, dapAn: string, o: Tho = {}): Tho => ({
  phan: 'I', so, de, pa: PA, dap_an: dapAn, dang: DANG, chuyen_de: 'CD1', muc_do: 'biet', loi_giai: { chot: `Chọn ${dapAn} vì lý do ${so}.`, trang_thai: 'khop' }, ...o,
})
const MA = 'DH-12-C1-B1'
const KHO: Tho[] = [
  cauI(1, 'Câu một về ester.', 'B'),
  cauI(2, 'Câu hai về ester.', 'C'),
  cauI(3, 'Câu ba về ester.', 'A'),
  cauI(4, 'Câu bốn về ester.', 'D'),
  cauI(5, 'Câu năm về ester.', 'A'),
  cauI(6, 'Câu sáu về ester.', 'B'),
  { phan: 'III', so: 1, de: 'Tính khối lượng ester (gam).', dap_an: '8,8', dang: DANG, chuyen_de: 'CD1', muc_do: 'van_dung', loi_giai: { chot: 'Tính mol.', ket_qua: '8,8', trang_thai: 'khop' } },
  { phan: 'III', so: 2, de: 'Giải thích vì sao ester nhẹ hơn nước.', dap_an: 'vì khối lượng riêng nhỏ hơn nước nên nổi lên trên', dang: DANG, chuyen_de: 'CD1' }, // tự luận
]
const q = (phan: string, so: number) => `${MA}-${phan}-${so}`

let n = 0
function suKien(d: D1That, o: { qid: string; nguon: string; maNguon: string; ketQua: 0 | 1 | null; luc: string; maDang?: string }) {
  const ngay = new Date(Date.parse(o.luc) + 7 * 3_600_000).toISOString().slice(0, 10)
  d.sql.prepare('INSERT INTO su_kien_hoc(khoa,sbd,qid,nguon,ma_nguon,lan,ket_qua,luc,ngay_vn,ma_dang) VALUES(?,?,?,?,?,1,?,?,?,?)')
    .run(`k${++n}`, 'HS1', o.qid, o.nguon, o.maNguon, o.ketQua, o.luc, ngay, o.maDang ?? null)
}

async function dung(lop = '12'): Promise<D1That> {
  const d = taoD1That()
  d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES('HS1','Em Một',?,'x','x')").run(lop)
  d.sql.prepare("INSERT INTO de_kho(ma_de,ten_de,lop,so_cau,r2_khoa,da_xoa,cap_nhat_luc) VALUES(?,?,'12',?,?,0,'v1')").run(MA, MA, KHO.length, `kho/${MA}.json`)
  d.objects.set(`kho/${MA}.json`, { ma_de: MA, cau: KHO.map((c) => ({ ...c })) })
  for (const t of KHO) d.sql.prepare("INSERT INTO cau_hoi(qid,ma_de,chuyen_de,muc_do,phan,lop,co_loi_giai,cap_nhat_luc) VALUES(?,?,'CD1','biet',?,'12',1,'x')").run(q(String(t.phan), Number(t.so)), MA, String(t.phan))
  await dongBoCacTo(d.env, [MA])
  const ca = d.sql.prepare(`INSERT INTO ca(ma_ca,ten_ca,trang_thai,bat_dau,het_han_vao,thoi_gian_phut,loai,cong_bo,bank_r2,cap_nhat_luc) VALUES(?,?,?,?,?,45,'thi',?,'',?)`)
  ca.run('CA-1', 'Ca kiểm tra Ester', 'dong', '2026-09-29T01:00:00.000Z', '2026-09-29T02:00:00.000Z', 'ngay', 'x')
  d.sql.prepare('INSERT INTO game_v2_session(id,sbd,json,created_at) VALUES(?,?,?,?)').run('G-DAO', 'HS1', JSON.stringify({ mode: 'adventure', questions: [] }), 'x')
  return d
}
const ldNop = (d: D1That, id: string, status = 'submitted', result: Tho | null = null) =>
  d.sql.prepare('INSERT INTO luyen_de_2026(id,sbd,created_at,deadline,status,bank_key,answers,result,updated_at) VALUES(?,?,?,?,?,?,?,?,?)')
    .run(id, 'HS1', T0 - 3_600_000, T0, status, `luyen-de-2026/HS1/${id}.json`, '{}', result ? JSON.stringify(result) : null, T0 - 600_000)
const coDapAn = (o: unknown) => /dap_?an|loiGiai|loi_giai|"chot"|ketQua|lyDo|chuaCho|"correct"/i.test(JSON.stringify(o))
const qids = (r: Tho) => (r.cau as { qid: string }[]).map((c) => c.qid)

describe('Kho câu sai chung — 4 nguồn từ mốc 29/09', () => {
  it('gom ca đã công bố + game + Luyện đề đã nộp + Tu luyện chế độ 2–4 đã nộp; bỏ trước mốc, đề chưa nộp, sai ở chế độ 1', async () => {
    const d = await dung()
    suKien(d, { qid: q('I', 1), nguon: 'thi', maNguon: 'CA-1', ketQua: 0, luc: '2026-09-29T02:00:00.000Z' })
    suKien(d, { qid: q('I', 2), nguon: 'game', maNguon: 'G-DAO', ketQua: 0, luc: '2026-09-30T02:00:00.000Z' })
    ldNop(d, 'LD1'); ldNop(d, 'LD2', 'active')
    suKien(d, { qid: q('I', 3), nguon: 'luyen', maNguon: 'LD1', ketQua: 0, luc: '2026-09-30T03:00:00.000Z' })
    suKien(d, { qid: q('I', 6), nguon: 'luyen', maNguon: 'LD2', ketQua: 0, luc: '2026-09-30T03:00:00.000Z' }) // đề CHƯA nộp ⇒ bỏ
    suKien(d, { qid: q('I', 5), nguon: 'thi', maNguon: 'CA-1', ketQua: 0, luc: '2026-09-28T03:00:00.000Z' }) // trước mốc ⇒ bỏ
    await damBaoBangTuLuyen(d.env)
    const tl = d.sql.prepare("INSERT INTO tu_luyen_cau(luot_id,sbd,che_do,qid,phan,dung,nop_luc) VALUES(?,?,?,?,'I',?,?)")
    tl.run('tl_a', 'HS1', 3, q('I', 4), 0, T0 - 3_600_000) // Tu luyện chế độ 3 sai ⇒ vào kho
    tl.run('tl_b', 'HS1', 1, q('III', 1), 0, T0 - 3_600_000) // chế độ 1 sai ⇒ KHÔNG vào kho (chỉ đặt lại ôn cách quãng)
    const kho = await docKhoCauSai(d.env, 'HS1')
    expect(kho.ds.map((c) => c.qid).sort()).toEqual([q('I', 1), q('I', 2), q('I', 3), q('I', 4)])
    expect(kho).toMatchObject({ tuCa: 1, tuChienDich: 1, tuLuyenDe: 1, tuTuLuyen: 1, tong: 4, daKhacPhuc: 0, loi: '' })
    const r = await tuLuyenRut(d.env, 'HS1', { cheDo: 1, soCau: 10 })
    const saiGoc = (r.cau as { qid: string; saiGoc: string }[]).find((c) => c.qid === q('I', 3))!.saiGoc
    expect(saiGoc).toBe('Sai gốc: Luyện đề cấu trúc · 30/09')
    expect((r.cau as { qid: string; saiGoc: string }[]).find((c) => c.qid === q('I', 4))!.saiGoc).toBe('Sai gốc: Tu luyện · 30/09')
  })

  it('chế độ 2 gọi đúng phanTichTyLeDang + rutDsThemDangCauSai với câu từ kho chung (kể cả câu chỉ sai ở Luyện đề)', async () => {
    const d = await dung()
    ldNop(d, 'LD1')
    suKien(d, { qid: q('I', 2), nguon: 'luyen', maNguon: 'LD1', ketQua: 0, luc: '2026-09-30T03:00:00.000Z' })
    const x = await tuLuyenXemTruoc(d.env, 'HS1', { cheDo: 2 })
    expect(Number(x.tongToiDa)).toBeGreaterThan(0)
    expect(x.nguonDang).toEqual({ kieu: 'cau_sai', nhan: 'Theo câu sai của em' })
    const r = await tuLuyenRut(d.env, 'HS1', { cheDo: 2, soCau: 10 })
    expect(r.ok).toBe(true)
    expect(goi.phanTich).toBeGreaterThan(0)
    expect(goi.themDang).toBe(1)
    expect((goi.dauVao as { qid: string }[]).map((c) => c.qid)).toEqual([q('I', 2)])
    expect(qids(r)).not.toContain(q('I', 2))
    expect(qids(r)).not.toContain(q('III', 2))
    expect(coDapAn(r)).toBe(false)
  })
})

describe('Không bao giờ khoá — kho trống vẫn luyện được', () => {
  it('chế độ 2 tầng 1: dạng em đúng ít nhất theo hồ sơ (≥ 3 lần làm)', async () => {
    const d = await dung()
    for (const so of [1, 2, 3]) suKien(d, { qid: q('I', so), nguon: 'game', maNguon: 'G-DAO', ketQua: 1, luc: '2026-09-30T02:00:00.000Z', maDang: 'ES.A.X' })
    const ng = await tuLuyenNguon(d.env, 'HS1')
    expect((ng.khoCauSai as Tho).tong).toBe(0)
    expect(ng.dangCauSai).toEqual({ kieu: 'yeu', nhan: 'Theo dạng em còn yếu' })
    const r = await tuLuyenRut(d.env, 'HS1', { cheDo: 2, soCau: 10 })
    expect(r.ok).toBe(true)
    expect(r.nguonDang).toEqual({ kieu: 'yeu', nhan: 'Theo dạng em còn yếu' })
    expect(goi.themDang).toBe(1)
    expect(qids(r).length).toBeGreaterThan(0)
    expect(qids(r)).not.toContain(q('III', 2))
  })

  it('chế độ 2 tầng 2: chưa có hồ sơ ⇒ dạng của chương đang học trong chiến dịch hiện tại', async () => {
    const d = await dung()
    d.sql.prepare("INSERT INTO chien_dich(id,ten,lop,sbd_json,ma_de_json,qid_json,han_nop,tao_luc) VALUES('CD1','Ôn ester','12',?,?,?,'2026-10-05','2026-09-28T00:00:00.000Z')")
      .run(JSON.stringify(['HS1']), JSON.stringify([MA]), JSON.stringify([q('I', 1), q('I', 2)]))
    const x = await tuLuyenXemTruoc(d.env, 'HS1', { cheDo: 2 })
    expect(x.nguonDang).toEqual({ kieu: 'chuong', nhan: 'Theo chương đang học' })
    expect(Number(x.tongToiDa)).toBeGreaterThan(0)
    expect((await tuLuyenRut(d.env, 'HS1', { cheDo: 2, soCau: 5 })).ok).toBe(true)
  })

  it('chế độ 2 tầng 3: không hồ sơ, không chiến dịch ⇒ dạng phổ biến của lớp em', async () => {
    const d = await dung()
    const x = await tuLuyenXemTruoc(d.env, 'HS1', { cheDo: 2 })
    expect(x.nguonDang).toEqual({ kieu: 'pho_bien', nhan: 'Theo dạng phổ biến của lớp em' })
    const r = await tuLuyenRut(d.env, 'HS1', { cheDo: 2, soCau: 5 })
    expect(r.ok).toBe(true)
    expect(coDapAn(r)).toBe(false)
  })

  it('chế độ 4 kho trống ⇒ rút từ TOÀN KHO lớp ≤ khối em (bỏ tự luận); chế độ 1 kho trống ⇒ lời chúc mừng, không rút', async () => {
    const d = await dung()
    const r = await tuLuyenRut(d.env, 'HS1', { cheDo: 4, mucDo: ['ngau_nhien'], soCau: 20 })
    expect(r.ok).toBe(true)
    expect(r.nguonDang).toMatchObject({ kieu: 'toan_kho' })
    expect(qids(r).length).toBe(7)
    expect(qids(r)).not.toContain(q('III', 2))
    const ng = await tuLuyenNguon(d.env, 'HS1')
    expect(ng.tuDo).toMatchObject({ kieu: 'toan_kho' })
    const r1 = await tuLuyenRut(d.env, 'HS1', { cheDo: 1, soCau: 5 })
    expect(r1.ok).toBe(false)
    expect(String(r1.error)).toBe('Em chưa sai câu nào từ 29/09.')
  })

  it('chỉ khoá khi thật sự không thể: tài khoản chưa có lớp ⇒ có lý do', async () => {
    const d = await dung('')
    const ng = await tuLuyenNguon(d.env, 'HS1')
    expect(ng.dangCauSai).toMatchObject({ kieu: '', loi: expect.stringContaining('chưa có lớp') })
    const r = await tuLuyenRut(d.env, 'HS1', { cheDo: 4, soCau: 5 })
    expect(r.ok).toBe(false)
    expect(String(r.error)).toContain('chưa có lớp')
  })
})

describe('Chấm từng câu', () => {
  it('chỉ trả đáp án + lời giải của câu vừa chấm; khoá câu (gửi lại đáp án khác không đổi); nộp giữ đúng câu đã chấm', async () => {
    const d = await dung()
    const r = await tuLuyenRut(d.env, 'HS1', { cheDo: 4, mucDo: ['ngau_nhien'], soCau: 3 })
    const [a, b] = r.cau as { qid: string; phan: string }[]
    const cauA = KHO.find((c) => q(String(c.phan), Number(c.so)) === a!.qid)!
    const sai = a!.phan === 'I' ? (['A', 'B', 'C', 'D'].find((x) => x !== cauA.dap_an)!) : '1'
    const k1 = await tuLuyenChamCau(d.env, 'HS1', { luotId: r.luotId, qid: a!.qid, traLoi: sai })
    expect(k1.ok).toBe(true)
    expect((k1.ketQua as Tho).dung).toBe(false)
    expect((k1.ketQua as Tho).dapAn).toBe(String(cauA.dap_an))
    expect((k1.ketQua as Tho).loiGiai).toBeTruthy()
    // không lộ câu chưa chấm: chỉ có đúng một câu trong trả lời
    const dapAnB = String(KHO.find((c) => q(String(c.phan), Number(c.so)) === b!.qid)!.dap_an)
    expect(JSON.stringify(k1)).not.toContain(b!.qid)
    expect(JSON.stringify(k1.ketQua)).not.toContain(`Chọn ${dapAnB} vì lý do ${b!.qid.split('-').pop()}`)
    // chấm lại với đáp án ĐÚNG ⇒ vẫn kết quả đã khoá
    const k2 = await tuLuyenChamCau(d.env, 'HS1', { luotId: r.luotId, qid: a!.qid, traLoi: String(cauA.dap_an) })
    expect((k2.ketQua as Tho).dung).toBe(false)
    expect((k2.ketQua as Tho).traLoi).toBe(sai)
    // câu không thuộc lượt, lượt của em khác ⇒ từ chối
    expect((await tuLuyenChamCau(d.env, 'HS1', { luotId: r.luotId, qid: q('III', 2), traLoi: 'A' })).ok).toBe(false)
    expect((await tuLuyenChamCau(d.env, 'HS2', { luotId: r.luotId, qid: a!.qid, traLoi: 'A' })).ok).toBe(false)
    // nộp: máy em gửi đáp án đúng cho câu đã khoá ⇒ không đổi
    const nop = await tuLuyenNop(d.env, 'HS1', { luotId: r.luotId, traLoi: { [a!.qid]: String(cauA.dap_an) }, giay: 30 })
    expect((nop.cau as { qid: string; dung: boolean }[]).find((c) => c.qid === a!.qid)!.dung).toBe(false)
    // sau nộp không chấm từng câu nữa
    expect((await tuLuyenChamCau(d.env, 'HS1', { luotId: r.luotId, qid: b!.qid, traLoi: 'A' })).ok).toBe(false)
    expect((await tuLuyen(d.env, 'cham-cau', { luotId: r.luotId, qid: a!.qid, traLoi: 'A' })).ok).toBe(false) // không token
  })
})

describe('Ôn cách quãng cho câu trong kho câu sai', () => {
  it('hàm thuần: đúng 1 ⇒ hẹn 1 ngày; đúng lại cùng ngày không tính; đúng 2 khác ngày ⇒ khắc phục; sai ⇒ về đầu; sai ở nguồn khác sau đó ⇒ về đầu', () => {
    const t1 = capNhatKhacPhuc(null, true, T0)
    expect(t1).toEqual({ soDungLien: 1, lanCuoi: T0, henLai: T0 + MOT_NGAY_MS, daKhacPhucLuc: null })
    expect(capNhatKhacPhuc(t1, true, T0 + 3_600_000)).toEqual(t1)
    const t2 = capNhatKhacPhuc(t1, true, T0 + MOT_NGAY_MS)
    expect(t2.daKhacPhucLuc).toBe(T0 + MOT_NGAY_MS)
    expect(capNhatKhacPhuc(t1, false, T0 + MOT_NGAY_MS)).toEqual({ soDungLien: 0, lanCuoi: T0 + MOT_NGAY_MS, henLai: null, daKhacPhucLuc: null })
    expect(khacPhucHieuLuc(t2, T0 + 2 * MOT_NGAY_MS)).toBeNull()
    expect(capNhatKhacPhuc(t1, true, T0 + MOT_NGAY_MS, T0 + 7_200_000).soDungLien).toBe(1) // sai ở ca sau lần đúng 1 ⇒ đúng này lại là lần 1
  })

  it('chế độ 1: đúng ⇒ hẹn lại (không rút trước hạn trừ khi kho cạn) ⇒ ngày sau đúng ⇒ khắc phục, rời kho, bộ đếm tăng; sai ⇒ về đầu', async () => {
    const d = await dung()
    suKien(d, { qid: q('I', 1), nguon: 'thi', maNguon: 'CA-1', ketQua: 0, luc: '2026-09-29T02:00:00.000Z' })
    suKien(d, { qid: q('I', 2), nguon: 'thi', maNguon: 'CA-1', ketQua: 0, luc: '2026-09-29T02:00:00.000Z' })
    // Lượt 1: một câu — trả lời đúng
    let r = await tuLuyenRut(d.env, 'HS1', { cheDo: 1, soCau: 1 })
    const dau = qids(r)[0]!
    const dapAn = (id: string) => String(KHO.find((c) => q(String(c.phan), Number(c.so)) === id)!.dap_an)
    let nop = await tuLuyenNop(d.env, 'HS1', { luotId: r.luotId, traLoi: { [dau]: dapAn(dau) }, giay: 10 })
    expect((nop.cau as { khacPhuc?: string }[])[0]!.khacPhuc).toBe('Đúng lần 1 — hẹn gặp lại câu này sau 1 ngày')
    // Cùng ngày, xin 1 câu ⇒ câu đang chờ hẹn KHÔNG ra (câu kia ra trước)
    r = await tuLuyenRut(d.env, 'HS1', { cheDo: 1, soCau: 1 })
    expect(qids(r)).toEqual([[q('I', 1), q('I', 2)].find((x) => x !== dau)])
    await tuLuyenNop(d.env, 'HS1', { luotId: r.luotId, traLoi: {}, giay: 5 })
    // Kho cạn (xin 2 câu) ⇒ câu chờ hẹn mới được rút, nhãn "Còn 1 lần đúng nữa là khắc phục"
    r = await tuLuyenRut(d.env, 'HS1', { cheDo: 1, soCau: 2 })
    expect(qids(r).sort()).toEqual([q('I', 1), q('I', 2)])
    expect((r.cau as { qid: string; conMotLan?: string }[]).find((c) => c.qid === dau)!.conMotLan).toBe('Còn 1 lần đúng nữa là khắc phục')
    // Hôm sau: câu tới hạn được ưu tiên, đúng lần 2 ⇒ khắc phục
    vi.setSystemTime(T0 + MOT_NGAY_MS + 60_000)
    r = await tuLuyenRut(d.env, 'HS1', { cheDo: 1, soCau: 1 })
    expect(qids(r)).toEqual([dau])
    nop = await tuLuyenNop(d.env, 'HS1', { luotId: r.luotId, traLoi: { [dau]: dapAn(dau) }, giay: 10 })
    expect((nop.cau as { khacPhuc?: string }[])[0]!.khacPhuc).toBe('Đã khắc phục câu này — rời kho câu sai')
    const ng = await tuLuyenNguon(d.env, 'HS1')
    expect(ng.khoCauSai).toMatchObject({ tong: 1, tongTuMoc: 2, daKhacPhuc: 1 })
    // Sai lại ở một ca sau đó ⇒ câu quay về kho, về đầu
    suKien(d, { qid: dau, nguon: 'game', maNguon: 'G-DAO', ketQua: 0, luc: new Date(T0 + MOT_NGAY_MS + 120_000).toISOString() })
    vi.setSystemTime(T0 + MOT_NGAY_MS + 180_000)
    const kho = await docKhoCauSai(d.env, 'HS1')
    expect(kho.ds.map((c) => c.qid).sort()).toEqual([q('I', 1), q('I', 2)])
    expect(kho.ds.find((c) => c.qid === dau)!.khacPhuc).toBeNull()
  })

  it('chấm từng câu ở chế độ 1 cập nhật ôn cách quãng ngay, một lần (bấm lại không cộng)', async () => {
    const d = await dung()
    suKien(d, { qid: q('I', 1), nguon: 'thi', maNguon: 'CA-1', ketQua: 0, luc: '2026-09-29T02:00:00.000Z' })
    const r = await tuLuyenRut(d.env, 'HS1', { cheDo: 1, soCau: 1 })
    const k = await tuLuyenChamCau(d.env, 'HS1', { luotId: r.luotId, qid: q('I', 1), traLoi: 'B' })
    expect((k.ketQua as Tho).khacPhuc).toBe('Đúng lần 1 — hẹn gặp lại câu này sau 1 ngày')
    await tuLuyenChamCau(d.env, 'HS1', { luotId: r.luotId, qid: q('I', 1), traLoi: 'B' })
    await tuLuyenNop(d.env, 'HS1', { luotId: r.luotId, traLoi: {}, giay: 5 })
    const dong = d.sql.prepare('SELECT so_dung_lien, hen_lai FROM tu_luyen_khac_phuc WHERE sbd = ?').all('HS1') as Tho[]
    expect(dong).toEqual([{ so_dung_lien: 1, hen_lai: T0 + MOT_NGAY_MS }])
  })
})

describe('Tổng hợp + bảng tự dựng', () => {
  it('Tổng hợp có Luyện đề cấu trúc (điểm, theo phần) và lịch sử khắc phục dù chưa có lượt Tu luyện nào', async () => {
    const d = await dung()
    ldNop(d, 'LD1', 'submitted', { score: 6.5, detail: { a: { correct: 'A', points: 0.25 }, b: { correct: 'B', points: 0 }, c: { correct: ['D', 'S', 'D', 'S'], points: 1 }, e: { correct: '8,8', points: 0.25 } } })
    ldNop(d, 'LD2', 'active')
    suKien(d, { qid: q('I', 1), nguon: 'thi', maNguon: 'CA-1', ketQua: 0, luc: '2026-09-29T02:00:00.000Z' })
    const t = await tuLuyenTongHop(d.env, 'HS1')
    expect(t.luot).toEqual([])
    expect(t.luyenDe).toEqual([{ id: 'LD1', luc: T0 - 600_000, diem: 6.5, theoPhan: { I: { soCau: 2, soDung: 1 }, II: { soCau: 1, soDung: 1 }, III: { soCau: 1, soDung: 1 } } }])
    expect(t.khacPhuc).toMatchObject({ tong: 1, daKhacPhuc: 0 })
  })

  it('SQL dựng tại chỗ = đúng câu trong migration-3009-tu-luyen-khac-phuc.sql; bảng mất ⇒ lệnh đầu tự dựng', async () => {
    const sql = readFileSync('server/migration-3009-tu-luyen-khac-phuc.sql', 'utf8').split('\n').filter((l) => !l.startsWith('--')).join('\n')
    expect([...SQL_BANG_KHAC_PHUC]).toEqual(sql.split(';').map((x) => x.replace(/\s+/g, ' ').trim()).filter(Boolean))
    const d = await dung()
    d.sql.exec('DROP TABLE tu_luyen_khac_phuc; DROP TABLE tu_luyen_cham_cau')
    await damBaoBangTuLuyen(d.env)
    expect(d.dem('tu_luyen_khac_phuc')).toBe(0)
    expect(d.dem('tu_luyen_cham_cau')).toBe(0)
  })
})
