// @vitest-environment node
// `POST /gv/buoi-chua-de-xuat` (B6, docs/hop-dong-buoi-chua-de-xuat-2109.md): SỐ LIỆU THÔ cho "Buổi chữa tối nay". Khoá: cần mã bí mật · KHÔNG ghi một byte · ≤ 12 truy vấn · hình dạng đã chốt với Code 1 ·
// câu ≥ 3 em sai VÀ ≥ 30 % (biên đúng) trong 3 ngày · LỌC câu tự luận + câu đề thi đang bảo vệ · dạng cả lớp yếu ≥ 3 em, ≤ 8 dạng/lớp · dòng Bộ não chỉ hai hành động gọi lên bảng · chỗ thiếu dữ liệu vắng (không bịa).
import { afterEach, describe, expect, it, vi } from 'vitest'
import worker from '../server/src/index'
import { ghiSuKien } from '../server/src/su-kien-hoc'
import { SO_CAU_DU_TIN } from '../server/src/ho-so-cau-hinh'
import { HANH_DONG_BUOI_CHUA, TOI_DA_CAU, TOI_DA_DANG_MOI_LOP } from '../server/src/gv-buoi-chua-de-xuat'
import { goiWorker, taoD1That, type D1That } from './_d1-that'
import { BAY_GIO, cauThay, dung, giao, gio } from './_btvn-nang-do-mau'

afterEach(() => vi.useRealTimers())

const H = 3_600_000
const D = 86_400_000
const NAY = BAY_GIO.getTime() // 22/09/2026 10:00 giờ VN
const NGAY = '2026-09-22'
const goi = (d: D1That, b: Record<string, unknown> = {}, thay = true) => goiWorker(worker, d.env, '/gv/buoi-chua-de-xuat', b, thay)
const luc = (soNgayTruoc: number) => new Date(NAY - soNgayTruoc * D + 3 * H).toISOString()

function theoDoiGhi(d: D1That): string[] {
  const ghi: string[] = []
  const goc = d.env.DB.prepare.bind(d.env.DB)
  d.env.DB.prepare = ((q: string) => {
    if (/^\s*(INSERT|UPDATE|DELETE|REPLACE|CREATE|DROP|ALTER)\b/i.test(q)) ghi.push(q.trim().slice(0, 60))
    return goc(q)
  }) as typeof d.env.DB.prepare
  return ghi
}
const themHs = (d: D1That, sbd: string, hoTen: string, lop: string, tenLop: string | null = null) =>
  d.sql.prepare("INSERT OR REPLACE INTO hoc_sinh(sbd,ho_ten,lop,ten_lop,mat_khau,cap_nhat_luc) VALUES(?,?,?,?,'mk','x')").run(sbd, hoTen, lop, tenLop)
const themCau = (d: D1That, maDe: string, qid: string, dang: string, phan: 'I' | 'III' = 'I', tuLuan = false) => {
  const json = phan === 'I' && !tuLuan
    ? { qid, phan: 'I', de: `Nội dung ${qid}`, pa: { A: 'a', B: 'b', C: 'c', D: 'd' }, dap_an: 'B', dang: { ma: dang } }
    : { qid, phan: 'III', de: 'Theo em, có thể dùng phương pháp nào để tách saccharose ra khỏi hỗn hợp saccharose và cát?', dap_an: 'kết tinh lại', dang: { ma: dang } }
  d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)').run(maDe, qid, 'v1', `G-${qid}`, dang, JSON.stringify(json))
}
/** `sai` em trong `dsSbd` làm SAI, `dung` em làm ĐÚNG, cách đây `soNgayTruoc` ngày. */
const lam = async (d: D1That, qid: string, dsSaiSbd: string[], dsDungSbd: string[], soNgayTruoc = 0, dang = 'D1', nguon: 'on_lai' | 'len_bang' = 'on_lai', dsChuaCham: string[] = []) => {
  const ev = [...dsSaiSbd.map((s) => [s, 0] as const), ...dsDungSbd.map((s) => [s, 1] as const), ...dsChuaCham.map((s) => [s, null] as const)]
  await ghiSuKien(d.env, ev.map(([sbd, kq]) => ({ nguon, maNguon: 'M1', sbd, qid, lan: 1, ketQua: kq as 0 | 1 | null, luc: luc(soNgayTruoc), maDang: dang, giay: 20 })))
}
const dangHs = (d: D1That, sbd: string, ma: string, gap: number, sai: number, khacPhuc = 0) =>
  d.sql.prepare("INSERT INTO nam_kt_dang(khoa,sbd,ma_dang,so_gap,so_sai,so_da_khac_phuc,so_moi_sai,so_chua_thay_sai,bac,cap_nhat_luc) VALUES(?,?,?,?,?,?,?,0,0,'x')").run(`${sbd}|${ma}`, sbd, ma, gap, sai, khacPhuc, sai)

const THUONG = ['12001', '12002', '12003', '12004', '12005', '12006', '12007', '12008']
const TINH_HOA = ['12021', '12022', '12023', '12024']
const K11 = ['11001', '11002']
/** Trường: 8 em lớp thường (khối 12, chưa gán tên lớp), 4 em "12 - Tinh Hoa", 2 em khối 11. */
function truong(): D1That {
  gio(BAY_GIO)
  const d = taoD1That()
  THUONG.forEach((s, i) => themHs(d, s, `Em Thường ${i + 1}`, '12'))
  TINH_HOA.forEach((s, i) => themHs(d, s, `Em Tinh Hoa ${i + 1}`, '12', '12 - Tinh Hoa'))
  K11.forEach((s, i) => themHs(d, s, `Em Mười Một ${i + 1}`, '11'))
  return d
}
const soDoc = (r: { cauSaiNhieu: { qid: string }[] }) => r.cauSaiNhieu.map((c) => c.qid)

describe('khoá chung', () => {
  it('không mã bí mật ⇒ từ chối; có mã ⇒ ok, soTruyVan ≤ 12, KHÔNG câu lệnh ghi nào; ngày sai dạng ⇒ lỗi bằng lời', async () => {
    const d = truong()
    themCau(d, 'DEA', 'DEA-I-1', 'D1'); await lam(d, 'DEA-I-1', THUONG.slice(0, 4), THUONG.slice(4, 6))
    expect((await goi(d, {}, false)).ok).toBe(false)
    const ghi = theoDoiGhi(d)
    const r = await goi(d)
    expect(r).toMatchObject({ ok: true, ngay: NGAY })
    expect(r.soTruyVan).toBeLessThanOrEqual(12)
    expect(ghi).toEqual([])
    expect(await goi(d, { ngay: '22/09/2026' })).toMatchObject({ ok: false, error: 'Ngày phải có dạng YYYY-MM-DD.' })
    expect(await goi(d, { ngay: '2026-09-22' })).toMatchObject({ ok: true, ngay: NGAY })
  })
  it('trường trống ⇒ ok với mọi danh sách rỗng (không bịa), soEmCoSo3Ngay = 0', async () => {
    gio(BAY_GIO)
    const d = taoD1That()
    expect(await goi(d)).toMatchObject({ ok: true, soEmCoSo3Ngay: 0, dangCaLopYeu: [], dangBoNao: [], cauSaiNhieu: [], dongBoNao: [] })
  })
})

describe('cauSaiNhieu: ngưỡng, cửa sổ 3 ngày, lọc tự luận / đề bảo vệ', () => {
  async function kho() {
    const d = truong()
    themCau(d, 'DEA', 'DEA-I-1', 'D1'); await lam(d, 'DEA-I-1', THUONG.slice(0, 5), THUONG.slice(5, 8)) // 5 sai / 8 làm ⇒ có
    themCau(d, 'DEA', 'DEA-I-5', 'D2'); await lam(d, 'DEA-I-5', THUONG.slice(0, 3), [...THUONG.slice(3, 8), ...TINH_HOA.slice(0, 2)], 2, 'D2') // 3 sai / 10 làm = 30 % (BIÊN), cách 2 ngày = NGÀY CUỐI của cửa sổ ⇒ có
    themCau(d, 'DEA', 'DEA-III-2', 'D3', 'III', true); await lam(d, 'DEA-III-2', THUONG.slice(0, 5), [], 0, 'D3') // TỰ LUẬN ⇒ bỏ
    themCau(d, 'DE1', 'DE1-II-B', 'D4'); await lam(d, 'DE1-II-B', THUONG.slice(0, 5), [], 0, 'D4') // đề thi ĐANG BẢO VỆ ⇒ bỏ
    themCau(d, 'DEA', 'DEA-I-3', 'D1'); await lam(d, 'DEA-I-3', THUONG.slice(0, 2), THUONG.slice(2, 3)) // 2 em sai (< 3) ⇒ bỏ
    themCau(d, 'DEA', 'DEA-I-4', 'D1'); await lam(d, 'DEA-I-4', THUONG.slice(0, 3), [...THUONG.slice(3, 8), ...TINH_HOA, ...K11]) // 3 / 14 = 21 % (< 30 %) ⇒ bỏ
    themCau(d, 'DEA', 'DEA-I-6', 'D1'); await lam(d, 'DEA-I-6', THUONG.slice(0, 5), [], 3) // 3 ngày trước = NGOÀI cửa sổ (hôm nay, hôm qua, hôm kia) ⇒ bỏ
    await lam(d, 'DEA-I-7', THUONG.slice(0, 5), []) // không có trong kho câu ⇒ bỏ (không bịa)
    themCau(d, 'DEA', 'DEA-I-8', 'D1'); await lam(d, 'DEA-I-8', THUONG.slice(0, 4), []) // chỉ có sai, 4/4 ⇒ có (100 %)
    d.sql.prepare("INSERT INTO ca(ma_ca,ten_ca,trang_thai,bat_dau,het_han_vao,thoi_gian_phut,loai,cong_bo,bank_r2,cap_nhat_luc) VALUES('CAP','Ca','mo',?,?,45,'thi','khong','key/CAP.json','x')")
      .run(new Date(NAY + 24 * H).toISOString(), new Date(NAY + 30 * H).toISOString())
    await d.env.DE.put('key/CAP.json', JSON.stringify({ phanI: [{ id: 'DE1-II-B', text: 'x', choices: ['A. a', 'B. b', 'C. c', 'D. d'], correct: 'B', dang: { ma: 'D4' }, mucDo: 'hieu', kienThuc: ['k1'] }] }))
    return d
  }
  it('đúng các câu ≥ 3 em sai VÀ ≥ 30 % (biên 3/10 có; 2 em, 21 %, ngoài 3 ngày, không có trong kho, tự luận, đề bảo vệ đều bỏ); xếp soEmSai giảm rồi theo qid', async () => {
    const d = await kho()
    const r = await goi(d)
    expect(soDoc(r as never)).toEqual(['DEA-I-1', 'DEA-I-8', 'DEA-I-5']) // 5 sai · 4 sai · 3 sai
  })
  it('MỌI nguồn sổ đều tính (kể cả lên bảng); lượt CHƯA CHẤM (ket_qua rỗng) không tính là "em làm" — không làm loãng tỉ lệ', async () => {
    const d = truong()
    themCau(d, 'DEA', 'DEA-I-9', 'D1')
    await lam(d, 'DEA-I-9', THUONG.slice(0, 2), [], 0, 'D1', 'on_lai', THUONG.slice(2, 8)) // 2 sai + 6 chưa chấm
    await lam(d, 'DEA-I-9', [THUONG[5]!], [], 0, 'D1', 'len_bang') // 1 em sai ở buổi gọi lên bảng ⇒ đủ 3 em sai
    const c = ((await goi(d)).cauSaiNhieu as Record<string, unknown>[]).find((x) => x.qid === 'DEA-I-9')!
    expect(c).toMatchObject({ soEmLam: 3, soEmSai: 3, tiLeSai: 1 })
    expect((c.emSai as { sbd: string }[]).map((e) => e.sbd)).toEqual(['12001', '12002', '12006'])
  })
  it('hình dạng từng câu: maDe, phan, dang, soEmLam, soEmSai, tiLeSai (3 chữ số), loi, emSai có sbd + họ tên + TÊN LỚP; em sắp theo sbd', async () => {
    const d = await kho()
    const c = ((await goi(d)).cauSaiNhieu as Record<string, unknown>[]).find((x) => x.qid === 'DEA-I-1')!
    expect(c).toMatchObject({ qid: 'DEA-I-1', maDe: 'DEA', phan: 'I', dang: 'D1', soEmLam: 8, soEmSai: 5, tiLeSai: 0.625, loi: false })
    expect(c.emSai).toEqual(THUONG.slice(0, 5).map((s, i) => ({ sbd: s, hoTen: `Em Thường ${i + 1}`, lop: '12 - Lớp Thường' })))
    const bien = ((await goi(d)).cauSaiNhieu as Record<string, unknown>[]).find((x) => x.qid === 'DEA-I-5')!
    expect(bien).toMatchObject({ soEmLam: 10, soEmSai: 3, tiLeSai: 0.3, dang: 'D2' })
  })
  it('soEmCoSo3Ngay = số em có sổ học trong 3 ngày (em chỉ có sổ ngoài cửa sổ không tính)', async () => {
    const d = await kho()
    // em có sổ trong cửa sổ: THUONG (8) + TINH_HOA[0..1] + K11 (từ DEA-I-4) + TINH_HOA còn lại (DEA-I-4) = 14
    expect((await goi(d)).soEmCoSo3Ngay).toBe(14)
    const cu = truong()
    themCau(cu, 'DEA', 'DEA-I-6', 'D1'); await lam(cu, 'DEA-I-6', THUONG, [], 3)
    expect((await goi(cu)).soEmCoSo3Ngay).toBe(0)
  })
  it('CÂU CỐT LÕI: `loi` = true khi câu là câu lõi (btvn_cau.loi = 1) của một bài chưa xoá; bài đã xoá thì false', async () => {
    gio(BAY_GIO)
    const b = dung(3)
    expect((await giao(b, { cau: cauThay() })).ok).toBe(true)
    const [loi] = (b.sql.prepare('SELECT qid FROM btvn_cau WHERE loi = 1 ORDER BY qid LIMIT 1').all() as { qid: string }[])
    const [khac] = (b.sql.prepare('SELECT qid FROM btvn_cau WHERE loi = 0 ORDER BY qid LIMIT 1').all() as { qid: string }[])
    for (const q of [loi!.qid, khac!.qid]) { themCau(b, 'DE1', q, 'D1'); await lam(b, q, ['S1', 'S2', 'S3'], []) }
    const dsSbd = ['S1', 'S2', 'S3']
    dsSbd.forEach((s) => themHs(b, s, s, '12'))
    const r = await goi(b)
    const theo = new Map((r.cauSaiNhieu as { qid: string; loi: boolean }[]).map((c) => [c.qid, c.loi]))
    expect(theo.get(loi!.qid)).toBe(true)
    expect(theo.get(khac!.qid)).toBe(false)
    b.sql.exec('UPDATE btvn SET da_xoa = 1')
    expect(new Map(((await goi(b)).cauSaiNhieu as { qid: string; loi: boolean }[]).map((c) => [c.qid, c.loi])).get(loi!.qid)).toBe(false)
  })
  it(`tối đa ${TOI_DA_CAU} câu; không kiểm được đề bảo vệ (thiếu tệp đề) ⇒ KHÔNG đề xuất câu nào + lyDoThieu, các khối khác vẫn có`, async () => {
    const d = truong()
    for (let i = 0; i < TOI_DA_CAU + 5; i++) { const q = `DEA-I-${100 + i}`; themCau(d, 'DEA', q, 'D1'); await lam(d, q, THUONG.slice(0, 3), []) }
    expect((await goi(d)).cauSaiNhieu).toHaveLength(TOI_DA_CAU)
    const hong = truong()
    themCau(hong, 'DEA', 'DEA-I-1', 'D1'); await lam(hong, 'DEA-I-1', THUONG.slice(0, 4), [])
    hong.sql.prepare("INSERT INTO ca(ma_ca,ten_ca,trang_thai,bat_dau,het_han_vao,thoi_gian_phut,loai,cong_bo,bank_r2,cap_nhat_luc) VALUES('CAP','Ca','mo',?,?,45,'thi','khong','key/HONG.json','x')")
      .run(new Date(NAY + 24 * H).toISOString(), new Date(NAY + 30 * H).toISOString())
    const r = await goi(hong)
    expect(r).toMatchObject({ ok: true, cauSaiNhieu: [], lyDoThieu: { cauSaiNhieu: 'Không kiểm được đề thi đang bảo vệ' } })
    expect(r.soEmCoSo3Ngay).toBe(4)
  })
})

describe('lọc theo lớp (`lop` = TÊN LỚP hoặc KHỐI)', () => {
  it('"12 - Tinh Hoa" ⇒ chỉ em Tinh Hoa; "12" (khối) ⇒ cả hai lớp khối 12; tên lạ ⇒ rỗng; không lọc ⇒ mọi em', async () => {
    const d = truong()
    themCau(d, 'DEA', 'DEA-I-1', 'D1')
    await lam(d, 'DEA-I-1', [...THUONG.slice(0, 3), ...TINH_HOA.slice(0, 3)], [TINH_HOA[3]!, K11[0]!])
    const emSai = async (b: Record<string, unknown>) => ((await goi(d, b)).cauSaiNhieu as { emSai: { sbd: string }[] }[])[0]?.emSai.map((e) => e.sbd)
    expect(await emSai({ lop: '12 - Tinh Hoa' })).toEqual(TINH_HOA.slice(0, 3))
    expect(await emSai({ lop: '12 - Lớp Thường' })).toEqual(THUONG.slice(0, 3))
    expect(await emSai({ lop: '12' })).toEqual([...THUONG.slice(0, 3), ...TINH_HOA.slice(0, 3)].sort())
    expect(await emSai({ lop: '11' })).toBeUndefined() // em khối 11 chỉ làm đúng ⇒ không có câu nào
    expect(await emSai({})).toEqual([...THUONG.slice(0, 3), ...TINH_HOA.slice(0, 3)].sort())
    const la = await goi(d, { lop: 'Lớp không có' })
    expect(la).toMatchObject({ ok: true, lop: 'Lớp không có', soEmCoSo3Ngay: 0, cauSaiNhieu: [], dangCaLopYeu: [] })
    expect((await goi(d, { lop: '12 - Tinh Hoa' })).soEmCoSo3Ngay).toBe(4) // 4 em Tinh Hoa có sổ
  })
  it('chưa chạy migration tên lớp (thiếu cột): không lỗi, mọi em khối 12 vào "12 - Lớp Thường"', async () => {
    const d = truong()
    d.sql.exec('ALTER TABLE hoc_sinh DROP COLUMN ten_lop')
    themCau(d, 'DEA', 'DEA-I-1', 'D1'); await lam(d, 'DEA-I-1', [...THUONG.slice(0, 2), ...TINH_HOA.slice(0, 2)], [])
    const c = ((await goi(d)).cauSaiNhieu as { emSai: { lop: string }[] }[])[0]!
    expect(new Set(c.emSai.map((e) => e.lop))).toEqual(new Set(['12 - Lớp Thường']))
  })
})

describe('dangCaLopYeu: dạng cả lớp yếu THEO HỒ SƠ (≥ 3 em yếu, ≤ 8 dạng mỗi lớp, kèm siSo + khoi)', () => {
  const gap = SO_CAU_DU_TIN + 4
  it('lớp thường có 3 em yếu D1 ⇒ có (em đã khắc phục hết / chưa đủ căn cứ không tính); Tinh Hoa chỉ 2 em yếu ⇒ không; siSo = số em của lớp; mỗi lớp một mục', async () => {
    const d = truong()
    for (const s of THUONG.slice(0, 3)) dangHs(d, s, 'D1', gap, 6)
    for (const s of TINH_HOA.slice(0, 2)) dangHs(d, s, 'D1', gap, 6)
    dangHs(d, THUONG[3]!, 'D1', gap, 6, gap) // đã khắc phục HẾT ⇒ không phải dạng yếu
    dangHs(d, THUONG[4]!, 'D1', SO_CAU_DU_TIN - 1, 6) // chưa đủ căn cứ (gặp ít hơn ngưỡng) ⇒ không tính
    const r = await goi(d)
    const thuong = (r.dangCaLopYeu as { lop: string; khoi: string; siSo: number; dang: { ma: string; ten: string; soEmYeu: number }[] }[]).find((l) => l.lop === '12 - Lớp Thường')!
    expect(thuong).toMatchObject({ khoi: '12', siSo: 8 })
    expect(thuong.dang[0]).toMatchObject({ ma: 'D1', ten: 'D1' })
    for (const s of TINH_HOA.slice(0, 3)) dangHs(d, s, 'D9', gap, 6) // Tinh Hoa có 3 em yếu D9 ⇒ lớp thứ hai (sắp theo tên lớp)
    const hai = (await goi(d)).dangCaLopYeu as { lop: string; khoi: string; siSo: number; dang: { ma: string; soEmYeu: number }[] }[]
    expect(hai.map((l) => [l.lop, l.khoi, l.siSo, l.dang.map((x) => `${x.ma}:${x.soEmYeu}`)])).toEqual([['12 - Lớp Thường', '12', 8, ['D1:3']], ['12 - Tinh Hoa', '12', 4, ['D9:3']]])
    expect(thuong.dang[0]!.soEmYeu).toBe(3)
    expect((r.dangCaLopYeu as { lop: string; dang: { ma: string }[] }[]).filter((l) => l.lop === '12 - Tinh Hoa').flatMap((l) => l.dang.map((x) => x.ma))).not.toContain('D1') // Tinh Hoa chỉ 2 em yếu D1
  })
  it(`mỗi lớp tối đa ${TOI_DA_DANG_MOI_LOP} dạng, xếp soEmYeu giảm rồi theo mã; lọc lớp chỉ trả lớp ấy`, async () => {
    const d = truong()
    for (let k = 0; k < 10; k++) for (const s of THUONG.slice(0, 3 + (k % 3 === 0 ? 3 : 0))) dangHs(d, s, `D${String(k).padStart(2, '0')}`, gap, 6)
    const r = await goi(d)
    const l = (r.dangCaLopYeu as { lop: string; dang: { ma: string; soEmYeu: number }[] }[])[0]!
    expect(l.lop).toBe('12 - Lớp Thường')
    expect(l.dang).toHaveLength(TOI_DA_DANG_MOI_LOP)
    const so = l.dang.map((x) => x.soEmYeu)
    expect(so).toEqual([...so].sort((a, b) => b - a))
    expect(l.dang.map((x) => x.ma)).toEqual(['D00', 'D03', 'D06', 'D09', 'D01', 'D02', 'D04', 'D05']) // 6 em yếu trước (k % 3 == 0), rồi 3 em theo mã
    expect(((await goi(d, { lop: '12 - Tinh Hoa' })).dangCaLopYeu as unknown[])).toEqual([])
  })
})

describe('Bộ não: dangBoNao (dòng ca_lop) và dongBoNao (hai hành động gọi lên bảng)', () => {
  const banTin = (d: D1That, ngay: string, cacDong: unknown[]) => d.sql.prepare("INSERT INTO ai_ban_tin(ngay,json,nop_luc) VALUES(?,?,'x')").run(ngay, JSON.stringify({ cacDong }))
  it('lấy bản tin MỚI NHẤT tới `ngay` (bản ngày sau bị bỏ); dangBoNao = dòng ca_lop; dongBoNao = chỉ goi_len_bang | dua_vao_buoi_chua của em CÓ trong trường (và trong lớp lọc)', async () => {
    const d = truong()
    banTin(d, '2026-09-20', [{ loai: 'ca_lop', dang: 'CU', chu: 'bản tin cũ' }])
    banTin(d, '2026-09-22', [
      { loai: 'ca_lop', dang: 'D1', chu: 'Cả lớp yếu dạng D1' },
      { loai: 'em', sbd: '12001', hanhDong: 'goi_len_bang', dang: 'D1', chu: 'em một' },
      { loai: 'em', sbd: '12021', hanhDong: 'dua_vao_buoi_chua', dang: 'D2', chu: 'em Tinh Hoa' },
      { loai: 'em', sbd: '12002', hanhDong: 'khac_phuc', dang: 'D1', chu: 'hành động khác' },
      { loai: 'em', sbd: '99999', hanhDong: 'goi_len_bang', dang: 'D1', chu: 'em không có trong trường' },
      { loai: 'nhan_xet', dang: 'D7', chu: 'loại dòng khác không phải ca_lop' },
    ])
    banTin(d, '2026-09-23', [{ loai: 'ca_lop', dang: 'MAI', chu: 'bản tin ngày mai' }])
    const r = await goi(d)
    expect(HANH_DONG_BUOI_CHUA).toEqual(['goi_len_bang', 'dua_vao_buoi_chua'])
    expect(r.dangBoNao).toEqual([{ dang: 'D1', chu: 'Cả lớp yếu dạng D1' }])
    expect(r.dongBoNao).toEqual([
      { sbd: '12001', hoTen: 'Em Thường 1', lop: '12 - Lớp Thường', hanhDong: 'goi_len_bang', dang: 'D1', chu: 'em một' },
      { sbd: '12021', hoTen: 'Em Tinh Hoa 1', lop: '12 - Tinh Hoa', hanhDong: 'dua_vao_buoi_chua', dang: 'D2', chu: 'em Tinh Hoa' },
    ])
    expect((await goi(d, { lop: '12 - Tinh Hoa' })).dongBoNao).toEqual([expect.objectContaining({ sbd: '12021' })])
    expect((await goi(d, { ngay: '2026-09-23' })).dangBoNao).toEqual([{ dang: 'MAI', chu: 'bản tin ngày mai' }])
  })
  it('không có bản tin / bản tin hỏng ⇒ hai danh sách rỗng, không lỗi', async () => {
    const d = truong()
    expect(await goi(d)).toMatchObject({ ok: true, dangBoNao: [], dongBoNao: [] })
    d.sql.prepare("INSERT INTO ai_ban_tin(ngay,json,nop_luc) VALUES('2026-09-22','không phải json','x')").run()
    expect(await goi(d)).toMatchObject({ ok: true, dangBoNao: [], dongBoNao: [] })
  })
})
