// @vitest-environment node
// TU LUYỆN — MÁY CHỦ (29/09). Khoá: (1) câu gửi xuống KHÔNG có đáp án/lời giải; (2) chấm ở máy chủ khi nộp, sau nộp mới có đáp án
// + lời giải; (3) KHÔNG ghi EXP / su_kien_hoc / qid_da_lam / kế hoạch ngày — chỉ hai bảng tu_luyen_*; (4) mỗi chế độ gọi ĐÚNG hàm
// rút cũ của thuat-toan-rut-cau-sai-loi.ts; (5) câu của ca kiểm tra đang bảo vệ không bị rút; (6) nộp lại không chấm lần hai.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { taoD1That, type D1That } from './_d1-that'
import { dongBoCacTo, xoaDemCaBaoVe } from '../server/src/game-v2-bank'
import { buildTeacherSourceFromKhoDe, parseKhoDeJson } from '../src/lib/exam-kho-de-import'
import { mergeAndStrip } from '../src/data/examContent'

const goi = vi.hoisted(() => ({ lamLai: 0, themDang: 0, dangBai: 0, tuDo: 0 }))
vi.mock('../src/lib/thuat-toan-rut-cau-sai-loi', async (orig) => {
  const m = await orig<typeof import('../src/lib/thuat-toan-rut-cau-sai-loi')>()
  return {
    ...m,
    dsCauLamLaiCauSai: (...a: Parameters<typeof m.dsCauLamLaiCauSai>) => { goi.lamLai++; return m.dsCauLamLaiCauSai(...a) },
    rutDsThemDangCauSai: (...a: Parameters<typeof m.rutDsThemDangCauSai>) => { goi.themDang++; return m.rutDsThemDangCauSai(...a) },
    rutDsDangBai: (...a: Parameters<typeof m.rutDsDangBai>) => { goi.dangBai++; return m.rutDsDangBai(...a) },
    rutDsTuDo: (...a: Parameters<typeof m.rutDsTuDo>) => { goi.tuDo++; return m.rutDsTuDo(...a) },
  }
})
const { tuLuyen, tuLuyenNguon, tuLuyenNop, tuLuyenRut, tuLuyenTongHop, tuLuyenXemTruoc, tuLuyenXemLuot, damBaoBangTuLuyen, SQL_BANG_TU_LUYEN } = await import('../server/src/tu-luyen')
import { readFileSync } from 'node:fs'

const T0 = Date.parse('2026-09-29T19:00:00+07:00')
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(T0); xoaDemCaBaoVe()
  goi.lamLai = goi.themDang = goi.dangBai = goi.tuDo = 0
})
afterEach(() => { vi.useRealTimers(); xoaDemCaBaoVe() })

type Tho = Record<string, unknown>
const PA = { A: 'Phương án A', B: 'Phương án B', C: 'Phương án C', D: 'Phương án D' }
const DANG = { ma: 'ES.A.X', ten: 'Ester đơn chức' }
const cauI = (so: number, de: string, dapAn: string, o: Tho = {}): Tho => ({
  phan: 'I', so, de, pa: PA, dap_an: dapAn, dang: DANG, chuyen_de: 'CD1', muc_do: 'biet',
  loi_giai: { chot: `Chọn ${dapAn} vì lý do số ${so}.`, trang_thai: 'khop' }, ...o,
})
const cauII = (so: number, de: string, dapAn = 'DSDS'): Tho => ({
  phan: 'II', so, de, y: { a: 'ý a', b: 'ý b', c: 'ý c', d: 'ý d' }, dap_an: dapAn, dang: DANG, chuyen_de: 'CD1', muc_do: 'hieu',
  loi_giai: { chot: 'Lời giải ý.', trang_thai: 'khop' },
})
const cauIII = (so: number, de: string, dapAn: string): Tho => ({
  phan: 'III', so, de, dap_an: dapAn, dang: DANG, chuyen_de: 'CD1', muc_do: 'van_dung',
  loi_giai: { chot: 'Tính số mol.', ket_qua: dapAn, trang_thai: 'khop' },
})
const MA = 'DH-12-C1-B1'
const DE_THI = 'Chất nào sau đây là ester no, đơn chức, mạch hở?'
const KHO: Tho[] = [
  cauI(1, DE_THI, 'B'),
  cauI(2, 'Câu luyện hai.', 'C'),
  cauI(3, 'Câu luyện ba.', 'A'),
  cauII(1, 'Cho các phát biểu về chất béo:'),
  cauIII(1, 'Tính khối lượng ester thu được (gam).', '8,8'),
  { phan: 'III', so: 2, de: 'Giải thích vì sao ester nhẹ hơn nước.', dap_an: 'vì khối lượng riêng nhỏ hơn nước nên nổi lên trên', dang: DANG, chuyen_de: 'CD1' }, // tự luận: không bao giờ rút
]
const MA_DB = 'DB-12-B1-D1'
const DB_KHO: Tho[] = [cauI(1, DE_THI, 'B', { qid: `${MA}-I-1` }), cauI(2, 'Dạng bài câu hai.', 'D'), cauIII(1, 'Dạng bài: số mol CO2?', '0,54')]

async function dung(): Promise<D1That> {
  const d = taoD1That()
  d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES('HS1','Em Một','12','x','x')").run()
  const themTo = (maDe: string, cau: Tho[], ten: string) => {
    d.sql.prepare("INSERT INTO de_kho(ma_de,ten_de,lop,so_cau,r2_khoa,da_xoa,cap_nhat_luc) VALUES(?,?,'12',?,?,0,'v1')").run(maDe, ten, cau.length, `kho/${maDe}.json`)
    d.objects.set(`kho/${maDe}.json`, { ma_de: maDe, cau: cau.map((c) => ({ ...c })) })
  }
  themTo(MA, KHO, MA)
  for (const t of KHO) d.sql.prepare("INSERT INTO cau_hoi(qid,ma_de,chuyen_de,muc_do,phan,lop,co_loi_giai,cap_nhat_luc) VALUES(?,?,'CD1','biet',?,'12',1,'x')").run(`${MA}-${t.phan}-${t.so}`, MA, String(t.phan))
  themTo(MA_DB, DB_KHO, 'Dạng bài · 12 · Bài 1. Ester · Ester đơn chức')
  themTo('DB-11-B2-D1', [cauI(1, 'Câu lớp 11.', 'A')], 'Dạng bài · 11 · Bài 2. Nitrogen · Dạng N')
  // KHO CÂU SAI CHUNG (v3): em sai câu I-2 của tờ kho ở một ca ĐÃ CÔNG BỐ sau mốc 29/09 (sổ su_kien_hoc) — chỉ mục game dựng thật.
  await dongBoCacTo(d.env, [MA])
  d.sql.prepare(`INSERT INTO ca(ma_ca,ten_ca,trang_thai,bat_dau,het_han_vao,thoi_gian_phut,loai,cong_bo,bank_r2,cap_nhat_luc) VALUES('CA-1','Ca kiểm tra Ester','dong','2026-09-29T01:00:00.000Z','2026-09-29T02:00:00.000Z',45,'thi','ngay','','x')`).run()
  d.sql.prepare("INSERT INTO su_kien_hoc(khoa,sbd,qid,nguon,ma_nguon,lan,ket_qua,luc,ngay_vn) VALUES('k1','HS1',?,'thi','CA-1',1,0,'2026-09-29T02:00:00.000Z','2026-09-29')").run(`${MA}-I-2`)
  return d
}
const coDapAnTrongChu = (o: unknown) => /dap_?an|loiGiai|loi_giai|"chot"|ketQua|lyDo|chuaCho|viSaoSai/i.test(JSON.stringify(o))
const bang = (d: D1That) => ({ tl: d.dem('tu_luyen_cau'), sk: d.dem('su_kien_hoc'), qdl: d.dem('qid_da_lam') })

describe('Tu luyện — câu công khai, chấm ở máy chủ', () => {
  it('chế độ 3 (Dạng bài): rút KHÔNG kèm đáp án/lời giải; nộp ⇒ chấm đúng, trả đáp án + lời giải chuẩn', async () => {
    const d = await dung()
    const r = await tuLuyenRut(d.env, 'HS1', { cheDo: 3, dsDang: [MA_DB], soCau: 20 })
    expect(r.ok).toBe(true)
    expect(goi.dangBai).toBe(1)
    const cau = r.cau as { qid: string; phan: string }[]
    expect(cau.length).toBe(3)
    expect(coDapAnTrongChu(r)).toBe(false)
    const traLoi: Record<string, string> = {}
    for (const c of cau) traLoi[c.qid] = c.phan === 'I' ? (c.qid.endsWith('-2') ? 'D' : 'A') : '0,540'
    const n = await tuLuyenNop(d.env, 'HS1', { luotId: r.luotId, traLoi, giay: 95 })
    expect(n.ok).toBe(true)
    const kq = n.cau as { qid: string; dung: boolean; dapAn: string; loiGiai?: { chot: string; ketQua?: string } }[]
    const theo = Object.fromEntries(kq.map((k) => [k.qid, k]))
    expect(theo[`${MA_DB}-I-2`].dung).toBe(true) // D đúng
    expect(theo[`${MA}-I-1`].dung).toBe(false) // A sai (đáp án B)
    expect(theo[`${MA}-I-1`].dapAn).toBe('B')
    expect(theo[`${MA_DB}-III-1`].dung).toBe(true) // "0,540" = "0,54" theo khopPhanIII
    expect(theo[`${MA_DB}-III-1`].loiGiai?.ketQua).toBe('0,54')
    expect(n.soDung).toBe(2)
    const dong = d.sql.prepare("SELECT dang_ma, dang_ten, bai, lop FROM tu_luyen_cau WHERE qid = ?").get(`${MA_DB}-I-2`) as Tho
    expect(dong).toEqual({ dang_ma: MA_DB, dang_ten: 'Ester đơn chức', bai: 'Bài 1. Ester', lop: '12' })
  })

  it('không ghi EXP / su_kien_hoc / qid_da_lam — chỉ bảng tu_luyen_*', async () => {
    const d = await dung()
    const truoc = bang(d)
    const r = await tuLuyenRut(d.env, 'HS1', { cheDo: 3, dsDang: [MA_DB], soCau: 5 })
    await tuLuyenNop(d.env, 'HS1', { luotId: r.luotId, traLoi: {}, giay: 10 })
    const sau = bang(d)
    expect(sau.sk).toBe(truoc.sk)
    expect(sau.qdl).toBe(truoc.qdl)
    expect(sau.tl).toBe(truoc.tl + 3)
    for (const t of ['exp_so', 'cnh_exp_day', 'ke_hoach_ngay']) {
      const co = d.sql.prepare("SELECT COUNT(*) n FROM sqlite_master WHERE type='table' AND name=?").get(t) as { n: number }
      if (co.n) expect(d.dem(t)).toBe(0)
    }
  })

  it('nộp lại không chấm lần hai; lượt của em khác không nộp được', async () => {
    const d = await dung()
    const r = await tuLuyenRut(d.env, 'HS1', { cheDo: 3, dsDang: [MA_DB], soCau: 5 })
    const tl = Object.fromEntries((r.cau as { qid: string }[]).map((c) => [c.qid, 'B']))
    const n1 = await tuLuyenNop(d.env, 'HS1', { luotId: r.luotId, traLoi: tl, giay: 30 })
    const n2 = await tuLuyenNop(d.env, 'HS1', { luotId: r.luotId, traLoi: {}, giay: 99 })
    expect(n2.soDung).toBe(n1.soDung)
    expect(n2.giay).toBe(30)
    expect(d.dem('tu_luyen_cau')).toBe(3)
    const khac = await tuLuyenNop(d.env, 'HS2', { luotId: r.luotId, traLoi: tl })
    expect(khac.ok).toBe(false)
  })

  it('chế độ 3 chỉ ĐÚNG khối em (luật 05/10): danh mục chỉ lớp của em; mã ngoài danh mục bị từ chối', async () => {
    const d = await dung()
    const ng = await tuLuyenNguon(d.env, 'HS1')
    // SỬA CÓ CHỦ Ý 05/10 (trước: em khối 12 thấy cả lớp 11 — "không vượt khối em"). LUẬT THẦY (nguyên văn): "rất nhiều cấu thuộc lớp 10 nhưng bị rút nhầm
    // sang lớp 11, bạn phải chặn chuẩn 100% không được rút nhầm kho khác khối cho tôi nhé" ⇒ chỉ dạng bài ĐÚNG khối em.
    expect((ng.danhMuc as { lop: string }[]).map((l) => l.lop)).toEqual(['12'])
    d.sql.prepare("UPDATE hoc_sinh SET lop='11' WHERE sbd='HS1'").run()
    const r = await tuLuyenRut(d.env, 'HS1', { cheDo: 3, dsDang: [MA_DB], soCau: 5 })
    expect(r.ok).toBe(false)
  })

  // SỬA CÓ CHỦ Ý 30/09 (lệnh thầy qua Boss): chế độ 1 đổi luật — kho câu sai từ 29/09 (ca kiểm tra + chiến dịch) trong sổ su_kien_hoc,
  // không còn đi đường hsCauSai/dsCauLamLaiCauSai. Luật mới khoá ở tests/tu-luyen-sua-cau-sai-3009.test.ts.
  it('chế độ 1 (Sửa câu sai): không còn gọi dsCauLamLaiCauSai; chưa có câu sai từ 29/09 ⇒ báo rõ, không rút', async () => {
    const d = await dung()
    d.sql.exec('DELETE FROM su_kien_hoc')
    const r = await tuLuyenRut(d.env, 'HS1', { cheDo: 1, soCau: 5 })
    expect(r.ok).toBe(false)
    expect(String(r.error)).toContain('29/09')
    expect(goi.lamLai).toBe(0)
  })

  it('chế độ 2 (Dạng câu sai): xem trước đếm tối đa; rút gọi rutDsThemDangCauSai; không có câu tự luận', async () => {
    const d = await dung()
    const x = await tuLuyenXemTruoc(d.env, 'HS1', { cheDo: 2 })
    expect(x.ok).toBe(true)
    expect(Number(x.tongToiDa)).toBeGreaterThan(0)
    const r = await tuLuyenRut(d.env, 'HS1', { cheDo: 2, soCau: 50 })
    expect(r.ok).toBe(true)
    expect(goi.themDang).toBe(1)
    const qids = (r.cau as { qid: string }[]).map((c) => c.qid)
    expect(qids).not.toContain(`${MA}-I-2`) // câu em đã sai bị loại trừ (luyện câu CÙNG dạng, không phải chính câu ấy)
    expect(qids).not.toContain(`${MA}-III-2`) // tự luận
    expect(coDapAnTrongChu(r)).toBe(false)
  })

  it('chế độ 4 (Tự do): gọi rutDsTuDo, lọc sao/thể loại theo luật cũ', async () => {
    const d = await dung()
    const r = await tuLuyenRut(d.env, 'HS1', { cheDo: 4, mucDo: ['ngau_nhien'], soCau: 3 })
    expect(r.ok).toBe(true)
    expect(goi.tuDo).toBe(1)
    expect((r.cau as unknown[]).length).toBeLessThanOrEqual(3)
    expect((r.cau as { qid: string }[]).some((c) => c.qid === `${MA}-III-2`)).toBe(false)
  })

  it('câu của ca kiểm tra ĐANG BẢO VỆ không bị rút (qid gốc lẫn câu chép sang tờ dạng bài)', async () => {
    const d = await dung()
    const parsed = parseKhoDeJson({ ma_de: MA, cau: KHO.slice(0, 1) })
    const { source } = buildTeacherSourceFromKhoDe(parsed.json!)
    d.objects.set('de/CA-MO.json', mergeAndStrip([source]))
    d.objects.set('key/CA-MO.json', source)
    d.sql.prepare(`INSERT INTO ca(ma_ca,ten_ca,trang_thai,bat_dau,het_han_vao,thoi_gian_phut,loai,cong_bo,bank_r2,cap_nhat_luc)
      VALUES('CA-MO','Ca mở','mo',?,?,45,'thi','khong','de/CA-MO.json',?)`).run(new Date(T0 - 600_000).toISOString(), new Date(T0 + 1_200_000).toISOString(), new Date(T0).toISOString())
    xoaDemCaBaoVe()
    const r = await tuLuyenRut(d.env, 'HS1', { cheDo: 3, dsDang: [MA_DB], soCau: 20 })
    expect(r.ok).toBe(true)
    expect(JSON.stringify(r)).not.toContain(DE_THI)
  })

  it('tổng hợp trả dữ liệu của chính em; không token ⇒ từ chối', async () => {
    const d = await dung()
    const r = await tuLuyenRut(d.env, 'HS1', { cheDo: 3, dsDang: [MA_DB], soCau: 5 })
    await tuLuyenNop(d.env, 'HS1', { luotId: r.luotId, traLoi: {}, giay: 12 })
    const t = await tuLuyenTongHop(d.env, 'HS1')
    expect((t.luot as unknown[]).length).toBe(1)
    expect((t.cau as unknown[]).length).toBe(3)
    expect(((await tuLuyenTongHop(d.env, 'HS2')).cau as unknown[]).length).toBe(0)
    expect((await tuLuyen(d.env, 'rut', { cheDo: 3 })).ok).toBe(false)
  })

  it('xem lại lượt cũ: chưa nộp ⇒ từ chối (không lộ đáp án); đã nộp ⇒ câu công khai + kết quả đã chốt, không ghi thêm', async () => {
    const d = await dung()
    const r = await tuLuyenRut(d.env, 'HS1', { cheDo: 3, dsDang: [MA_DB], soCau: 5 })
    expect((await tuLuyenXemLuot(d.env, 'HS1', { luotId: r.luotId })).ok).toBe(false)
    await tuLuyenNop(d.env, 'HS1', { luotId: r.luotId, traLoi: { [`${MA_DB}-I-2`]: 'D' }, giay: 20 })
    const truoc = d.dem('tu_luyen_cau')
    const x = await tuLuyenXemLuot(d.env, 'HS1', { luotId: r.luotId })
    expect(x.ok).toBe(true)
    expect((x.cauCongKhai as { qid: string }[]).map((c) => c.qid).sort()).toEqual((r.cau as { qid: string }[]).map((c) => c.qid).sort())
    expect(coDapAnTrongChu(x.cauCongKhai)).toBe(false)
    expect(x.soDung).toBe(1)
    expect(d.dem('tu_luyen_cau')).toBe(truoc)
    expect((await tuLuyenXemLuot(d.env, 'HS2', { luotId: r.luotId })).ok).toBe(false)
  })
})

describe('Tu luyện — tự dựng bảng khi CI deploy không chạy migration', () => {
  it('câu dựng tại chỗ = đúng câu trong migration-2909-tu-luyen.sql', () => {
    const sql = readFileSync('server/migration-2909-tu-luyen.sql', 'utf8').split('\n').filter((l) => !l.startsWith('--')).join('\n')
    const cau = sql.split(';').map((x) => x.replace(/\s+/g, ' ').trim()).filter(Boolean)
    expect([...SQL_BANG_TU_LUYEN]).toEqual(cau)
  })
  it('bảng chưa có ⇒ lệnh đầu tự dựng; chạy lại vô hại, không mất dữ liệu', async () => {
    const d = await dung()
    d.sql.exec('DROP TABLE tu_luyen_cau; DROP TABLE tu_luyen_luot')
    await damBaoBangTuLuyen(d.env)
    const r = await tuLuyenRut(d.env, 'HS1', { cheDo: 3, dsDang: [MA_DB], soCau: 5 })
    expect(r.ok).toBe(true)
    await tuLuyenNop(d.env, 'HS1', { luotId: r.luotId, traLoi: {}, giay: 5 })
    await Promise.all(SQL_BANG_TU_LUYEN.map((s) => d.env.DB.prepare(s).run())) // chạy lại y câu ấy
    expect(d.dem('tu_luyen_luot')).toBe(1)
    expect(d.dem('tu_luyen_cau')).toBe(3)
  })
})
